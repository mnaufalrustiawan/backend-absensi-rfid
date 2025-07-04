const express = require("express");
const router = express.Router();
const { Attendance, Student, Setting } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");
const axios = require("axios");
const FormData = require("form-data");


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

  try {
    // 🔍 Cek siswa berdasarkan UID kartu
    const student = await Student.findOne({ where: { card_uid } });
    if (!student) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // 🔍 Cek setting absen (hanya satu baris, misalnya ID = 1)
    const setting = await Setting.findOne({ where: { id: 1 } });
    if (!setting) {
      return res.status(500).json({ message: "Pengaturan absen tidak ditemukan" });
    }

    // ❌ Kalau dua-duanya off → tolak absen
    if (!setting.status_manual && !setting.status_otomatis) {
      return res.status(400).json({ message: "Absen belum diaktifkan" });
    }

    const now = new Date();
    const timeNow = now.toTimeString().slice(0, 8);     // HH:MM
    const today = now.toISOString().slice(0, 10);       // YYYY-MM-DD

    // ⏰ Validasi waktu hanya kalau otomatis aktif dan manual tidak aktif
    if (setting.status_otomatis && !setting.status_manual) {
      const isCheckinTime =
        timeNow >= setting.absenmasuk_start && timeNow <= setting.absenmasuk_end;
      const isCheckoutTime =
        timeNow >= setting.absenkeluar_start && timeNow <= setting.absenkeluar_end;

      if (!isCheckinTime && !isCheckoutTime) {
        return res.status(400).json({ message: "Bukan waktu absensi otomatis" });
      }
    }

    // 🔄 Cek apakah sudah pernah absen hari ini
    const existingAttendance = await Attendance.findOne({
      where: {
        studentId: student.id,
        date: today,
      },
    });

    // 🔁 Jika sudah ada, proses absen keluar
    if (existingAttendance) {
      if (existingAttendance.status_absen === "absenmasuk") {
        existingAttendance.absenkeluar = timeNow;
        existingAttendance.status_absen = "absenkeluar";
        await existingAttendance.save();

        return res.status(200).json({
          message: `${student.name} berhasil absen keluar.`,
          attendance: existingAttendance,
        });
      }

      // ✅ Sudah absen masuk dan keluar
      return res.status(400).json({ message: "Siswa sudah absen lengkap hari ini." });
    }

    // ➕ Belum absen → catat absen masuk
    const newAttendance = await Attendance.create({
      studentId: student.id,
      date: today,
      status: "hadir",
      keterangan: "hadir",
      status_absen: "absenmasuk",
      absenmasuk: timeNow,
    });

    const pesan = `📢 Halo, anak Anda *${student.name}* telah absen *masuk* pada pukul ${timeNow}.`;
    await kirimWhatsapp(student.no_wa_ortu, pesan);

    return res.status(201).json({
      message: `${student.name} berhasil absen masuk.`,
      attendance: newAttendance,
    });

  } catch (err) {
    console.error("Error absen:", err);
    return res.status(500).json({
      message: "Gagal melakukan absen",
      error: err.message,
    });
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
    const { status_manual, status_otomatis, absenmasuk_start, absenmasuk_end, absenkeluar_start, absenkeluar_end } = req.body;
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
    if (absenmasuk_start) {
      setting.absenmasuk_start = absenmasuk_start;
    }
    if (absenmasuk_end) {
      setting.absenmasuk_end = absenmasuk_end;
    }
    if (absenkeluar_start) {
      setting.absenkeluar_start = absenkeluar_start;
    }
    if (absenkeluar_end) {
      setting.absenkeluar_end = absenkeluar_end;
    }
    await setting.save();
    res.status(200).json({ message: "Pengaturan berhasil diperbarui", setting  });

  }catch (err) {
    res.status(500).json({ message: "Gagal edit pengaturan", error: err.message });
    
  }
});

module.exports = router;
