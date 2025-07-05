const express = require("express");
const router = express.Router();
const { Attendance, Student, Setting } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");
const axios = require("axios");
const FormData = require("form-data");

const WHAPIFY_URL = "https://whapify.id/api/send/whatsapp";
const WHAPIFY_SECRET = process.env.WHAPIFY_SECRET || "YOUR_API_SECRET";
const WHAPIFY_ACCOUNT = process.env.WHAPIFY_ACCOUNT || "WHATSAPP_ACCOUNT_UNIQUE_ID";

async function kirimWhatsapp(nomor, pesan) {
  const form = new FormData();
  form.append("secret", WHAPIFY_SECRET);
  form.append("account", WHAPIFY_ACCOUNT);
  form.append("recipient", nomor);
  form.append("type", "text");
  form.append("message", pesan);

  try {
    const response = await axios.post(WHAPIFY_URL, form, { headers: form.getHeaders() });
    console.log("WA Terkirim:", response.data);
  } catch (error) {
    console.error("Gagal kirim WA:", error.response ? error.response.data : error.message);
  }
}

router.post("/absen-siswa", async (req, res) => {
  /*
    #swagger.tags = ['Absensi']
    #swagger.description = 'Absen masuk/pulang siswa berdasarkan kartu RFID'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              card_uid: { type: 'string' }
            },
            required: ['card_uid']
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Berhasil absen' }
    #swagger.responses[400] = { description: 'Validasi gagal atau sudah absen' }
    #swagger.responses[500] = { description: 'Gagal proses absen' }
  */
  const { card_uid } = req.body;
  const today = req.today;
  const timeNow = req.timeNow;

  try {
    const student = await Student.findOne({ where: { card_uid } });
    if (!student) return res.status(404).json({ message: "Siswa tidak ditemukan" });

    const setting = await Setting.findOne({ where: { id: 1 } });
    if (!setting) return res.status(500).json({ message: "Pengaturan absen tidak ditemukan" });

    const toTimeString = (value) => typeof value === 'string' ? value : value.toTimeString().slice(0, 8);
    const jamkeluar = toTimeString(setting.jam_keluar);
    const batasabsenmasuk = toTimeString(setting.batas_absen_masuk);
    const batasabsenkeluar = toTimeString(setting.batas_absen_keluar);

    const existingAttendance = await Attendance.findOne({ where: { studentId: student.id, date: today } });

    if (!existingAttendance) {
      if (timeNow < jamkeluar && !setting.status_manual) return res.status(400).json({ message: "Belum waktunya absen masuk." });
      if (timeNow > batasabsenmasuk && !setting.status_manual) return res.status(400).json({ message: "Waktu absen masuk telah berakhir." });

      const newAttendance = await Attendance.create({ studentId: student.id, date: today, status: "hadir", status_absen: "absenmasuk", absenmasuk: timeNow });
      await kirimWhatsapp(student.no_wa_ortu, `Halo, anak Anda *${student.name}* telah absen *masuk* pada pukul ${timeNow}.`);
      return res.status(200).json({ message: `${student.name} berhasil absen masuk.`, attendance: newAttendance });
    }

    if (existingAttendance) {
      if (existingAttendance.status_absen === "absenmasuk") {
        if (timeNow < jamkeluar && !setting.status_manual) return res.status(400).json({ message: "Belum waktunya absen pulang." });
        if (timeNow > batasabsenkeluar && !setting.status_manual) return res.status(400).json({ message: "Waktu absen pulang telah berakhir." });

        existingAttendance.status_absen = "absenkeluar";
        existingAttendance.absenkeluar = timeNow;
        await existingAttendance.save();

        await kirimWhatsapp(student.no_wa_ortu, `Halo, anak Anda *${student.name}* telah absen *pulang* pada pukul ${timeNow}.`);
        return res.status(200).json({ message: `${student.name} berhasil absen keluar.`, attendance: existingAttendance });
      }

      if (!existingAttendance.status_absen || existingAttendance.status_absen === "alpha") {
        if (timeNow > batasabsenmasuk && !setting.status_manual) return res.status(400).json({ message: "Sudah melewati batas waktu absen masuk." });

        existingAttendance.status = "hadir";
        existingAttendance.keterangan = "hadir";
        existingAttendance.status_absen = "absenmasuk";
        existingAttendance.absenmasuk = timeNow;
        await existingAttendance.save();

        const terlambat = timeNow > setting.jam_masuk;
        const pesan = terlambat ?
          `Halo, anak Anda *${student.name}* terlambat absen *masuk* pada pukul ${timeNow}.` :
          `Halo, anak Anda *${student.name}* telah absen *masuk* pada pukul ${timeNow}.`;

        await kirimWhatsapp(student.no_wa_ortu, pesan);
        return res.status(200).json({ message: `${student.name} ${terlambat ? 'terlambat' : 'berhasil'} absen masuk.`, attendance: existingAttendance });
      }

      return res.status(400).json({ message: "Siswa sudah absen lengkap hari ini." });
    }
  } catch (err) {
    console.error("Error absen:", err);
    return res.status(500).json({ message: "Gagal melakukan absen", error: err.message });
  }
});

router.post("/generate-absen-harian", async (req, res) => {
  /*
    #swagger.tags = ['Absensi']
    #swagger.description = 'Generate absen harian default dengan status alpha'
    #swagger.responses[201] = { description: 'Data absen berhasil dibuat' }
    #swagger.responses[500] = { description: 'Gagal generate absen' }
  */
  try {
    const today = req.today;
    const allStudents = await Student.findAll();

    const alreadyAbsen = await Attendance.findAll({ where: { date: today }, attributes: ['studentId'] });
    const alreadyAbsenIds = alreadyAbsen.map((a) => a.studentId);
    const studentsToCreate = allStudents.filter((student) => !alreadyAbsenIds.includes(student.id));

    const newAttendances = studentsToCreate.map((student) => ({
      studentId: student.id,
      date: today,
      status: "alpha",
      keterangan: "alpha",
    }));

    await Attendance.bulkCreate(newAttendances);
    return res.status(201).json({ message: `${newAttendances.length} data absen default (alpha) berhasil dibuat.`, data: newAttendances });
  } catch (err) {
    console.error("Error generate absen:", err);
    res.status(500).json({ message: "Gagal generate absen default", error: err.message });
  }
});

router.use(authMiddleware);
router.use(authorize('admin', 'operator'));

router.get("/setting", async (req, res) => {
  /*
    #swagger.tags = ['Setting']
    #swagger.description = 'Ambil data pengaturan absen'
    #swagger.responses[200] = { description: 'Berhasil ambil pengaturan' }
  */
  const setting = await Setting.findOne({ where: { id: 1 } });
  res.status(200).json(setting);
});

router.put("/edit-setting", async (req, res) => {
  /*
    #swagger.tags = ['Setting']
    #swagger.description = 'Edit pengaturan waktu absen'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status_manual: { type: 'boolean' },
              status_otomatis: { type: 'boolean' },
              jam_masuk: { type: 'string' },
              jam_keluar: { type: 'string' },
              batas_absen_masuk: { type: 'string' },
              batas_absen_keluar: { type: 'string' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Pengaturan berhasil diperbarui' }
    #swagger.responses[404] = { description: 'Pengaturan tidak ditemukan' }
    #swagger.responses[500] = { description: 'Gagal edit pengaturan' }
  */
  try {
    const { status_manual, status_otomatis, jam_masuk, jam_keluar, batas_absen_masuk, batas_absen_keluar } = req.body;
    const setting = await Setting.findByPk(1);
    if (!setting) return res.status(404).json({ message: "Pengaturan tidak ditemukan" });

    if (status_manual !== undefined) setting.status_manual = status_manual;
    if (status_otomatis !== undefined) setting.status_otomatis = status_otomatis;
    if (jam_masuk) setting.jam_masuk = jam_masuk;
    if (jam_keluar) setting.jam_keluar = jam_keluar;
    if (batas_absen_masuk) setting.batas_absen_masuk = batas_absen_masuk;
    if (batas_absen_keluar) setting.batas_absen_keluar = batas_absen_keluar;

    await setting.save();
    res.status(200).json({ message: "Pengaturan berhasil diperbarui", setting });
  } catch (err) {
    res.status(500).json({ message: "Gagal edit pengaturan", error: err.message });
  }
});

module.exports = router;
