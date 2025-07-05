const express = require("express");
const router = express.Router();
const { Attendance, Student, Setting } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");
const axios = require("axios");
const FormData = require("form-data");
const attendance = require("../models/attendance");


const WHAPIFY_URL = "https://whapify.id/api/send/whatsapp";
const WHAPIFY_SECRET = process.env.WHAPIFY_SECRET || "YOUR_API_SECRET";
const WHAPIFY_ACCOUNT = process.env.WHAPIFY_ACCOUNT || "WHATSAPP_ACCOUNT_UNIQUE_ID";


// 📲 Fungsi kirim WhatsApp ke orang tua
// Fungsi kirim WhatsApp via Whapify (form-data)
async function kirimWhatsapp(nomor, pesan) {
  const form = new FormData();
  form.append("secret", WHAPIFY_SECRET);
  form.append("account", WHAPIFY_ACCOUNT);
  form.append("recipient", nomor); // format: 628xxxxxxx
  form.append("type", "text");
  form.append("message", pesan);

  try {
    const response = await axios.post(WHAPIFY_URL, form, {
      headers: form.getHeaders(),
    });
    console.log("✅ WA Terkirim:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("❌ Gagal kirim WA:", error.response.status, error.response.data);
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

router.post("/absen-siswa", async (req, res) => {
  const { card_uid } = req.body;
  const today = req.today; 
  const timeNow = req.timeNow;


  try {
    // 🔍 Cek siswa berdasarkan UID kartu
    const student = await Student.findOne({ where: { card_uid } });
    if (!student) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // 🔍 Ambil pengaturan absen
    const setting = await Setting.findOne({ where: { id: 1 } });
    if (!setting) {
      return res.status(500).json({ message: "Pengaturan absen tidak ditemukan" });
    }



    const toTimeString = (value) => {
      if (typeof value === 'string') return value;
      return value.toTimeString().slice(0, 8); // kalau dia Date object
    };
    const jamkeluar = setting ? toTimeString(setting.jam_keluar) : null;
    const batasabsenmasuk = setting ? toTimeString(setting.batas_absen_masuk) : null;
    const batasabsenkeluar = setting ? toTimeString(setting.batas_absen_keluar) : null;
    // 🔄 Cek apakah sudah absen hari ini
    const existingAttendance = await Attendance.findOne({
      where: {
        studentId: student.id,
        date: today,
      },
    });
    
    if (existingAttendance) {
      if (existingAttendance.status_absen === "absenmasuk") {
        // 🕒 Validasi waktu absen pulang
        if (timeNow < jamkeluar && !setting.status_manual) {
          return res.status(400).json({ message: "Belum waktunya absen pulang." });
        }
        if (timeNow > batasabsenkeluar && !setting.status_manual) {
          return res.status(400).json({ message: "Waktu absen pulang telah berakhir." });
        }

        // 📝 Update status menjadi absen keluar
        existingAttendance.status_absen = "absenkeluar";
        existingAttendance.absenkeluar = timeNow;
        await existingAttendance.save();

        const pesan = `📢 Halo, anak Anda *${student.name}* telah absen *pulang* pada pukul ${timeNow}.`;
        await kirimWhatsapp(student.no_wa_ortu, pesan);

        return res.status(200).json({
          message: `${student.name} berhasil absen keluar.`,
          attendance: existingAttendance,
        });
      }

      // 👇 Kalau status_absen masih null → proses sebagai absen masuk
      if (!existingAttendance.status_absen || existingAttendance.status_absen === "alpha") {
        if (timeNow > batasabsenmasuk && !setting.status_manual) {
          return res.status(400).json({ message: "Sudah melewati batas waktu absen masuk." });
        }

        existingAttendance.status = "hadir";
        existingAttendance.keterangan = "hadir";
        existingAttendance.status_absen = "absenmasuk";
        existingAttendance.absenmasuk = timeNow;
        await existingAttendance.save();

        if (timeNow > setting.jam_masuk) {
          const pesan = `📢 Halo, anak Anda *${student.name}* terlambat absen *masuk* pada pukul ${timeNow}.`;
          await kirimWhatsapp(student.no_wa_ortu, pesan);
          return res.status(200).json({
            message: `${student.name} terlambat absen masuk.`,
            attendance: existingAttendance,
          });
        }

        const pesan = `📢 Halo, anak Anda *${student.name}* telah absen *masuk* pada pukul ${timeNow}.`;
        await kirimWhatsapp(student.no_wa_ortu, pesan);
        return res.status(200).json({
          message: `${student.name} berhasil absen masuk.`,
          attendance: existingAttendance,
        });
      }

      // ✅ Sudah lengkap
      return res.status(400).json({ message: "Siswa sudah absen lengkap hari ini." });
    }


  } catch (err) {
    console.error("Error absen:", err);
    return res.status(500).json({
      message: "Gagal melakukan absen",
      error: err.message,
    });
  }
});


router.post("/generate-absen-harian", async (req, res) => {
  try {
    const today = req.today; 
    const timeNow = req.timeNow;


    // Ambil semua siswa
    const allStudents = await Student.findAll();

    // Cek siswa yang belum punya absen hari ini
    const alreadyAbsen = await Attendance.findAll({
      where: { date: today },
      attributes: ['studentId'],
    });
    const alreadyAbsenIds = alreadyAbsen.map((a) => a.studentId);

    // Filter siswa yang belum absen
    const studentsToCreate = allStudents.filter(
      (student) => !alreadyAbsenIds.includes(student.id)
    );

    // Generate absen alpha
    const newAttendances = studentsToCreate.map((student) => ({
      studentId: student.id,
      date: today,
      status: "alpha",
      keterangan: "alpha",
    }));

    // Simpan ke database
    await Attendance.bulkCreate(newAttendances);

    return res.status(201).json({
      message: `${newAttendances.length} data absen default (alpha) berhasil dibuat.`,
      data: newAttendances,
    });
  } catch (err) {
    console.error("Error generate absen:", err);
    res.status(500).json({ message: "Gagal generate absen default", error: err.message });
  }
});


router.use(authMiddleware);
router.use(authorize('admin', 'operator'));

router.get("/setting", async (req, res) => {
  const setting = await Setting.findOne({ where: { id: 1 } });
  res.status(200).json(setting);
});

router.put("/edit-setting", async(req,res) => {
  try {
    
    const { status_manual, status_otomatis, jam_masuk, jam_keluar, batas_absen_masuk, batas_absen_keluar } = req.body;
    const setting = await Setting.findByPk(1  );
    if (!setting) {
      return res.status(404).json({ message: "Pengaturan tidak ditemukan" });
    }
    if (status_manual) {
      setting.status_manual = status_manual;
    }
    if (status_otomatis) {
      setting.status_otomatis = status_otomatis;
    }
    if (jam_masuk) {
      setting.jam_masuk = jam_masuk;
    }
    if (jam_keluar) {
      setting.jam_keluar = jam_keluar;
    }
    if (batas_absen_masuk) {
      setting.batas_absen_masuk = batas_absen_masuk;
    }
    if (batas_absen_keluar) {
      setting.batas_absen_keluar = batas_absen_keluar;
    }
    await setting.save();
    res.status(200).json({ message: "Pengaturan berhasil diperbarui", setting  });

  }catch (err) {
    res.status(500).json({ message: "Gagal edit pengaturan", error: err.message });
    
  }
});




module.exports = router;
