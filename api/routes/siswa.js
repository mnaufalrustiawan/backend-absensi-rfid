const express = require("express");
const router = express.Router();
const { User, Attendance, Student, Class } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");

router.use(authMiddleware);
router.use(authorize('admin', 'operator'));

router.get("/semua-siswa", async (req, res) => {

  const students = await Student.findAll();
  if (!students) {
    return res.status(404).json({ message: "Siswa Belum ada" });
  }
  res.status(200).json(students);
});

router.get("/siswa/:id", async (req, res) => {

  const { id } = req.params;
  const student = await Student.findByPk(id);
  if (!student) {
    return res.status(404).json({ message: "Siswa tidak ditemukan" });
  }
  res.status(200).json(student);
});

router.get("/riwayat-absen-siswa/:id", async (req, res) => {

  const { id } = req.params;
  const student = await Student.findByPk(id);
  if (!student) {
    return res.status(404).json({ message: "Siswa tidak ditemukan" });
  }
  const attendances = await Attendance.findAll({
    where: { studentId: student.id },
  });
  res.status(200).json(attendances);
});

router.post("/tambah-siswa", async (req, res) => {

  const { name, card_uid, classId, nis } = req.body;
  const student = await Student.create({ name, card_uid, classId, nis });
  res.status(201).json(student);
});

router.put("/edit-siswa", async (req, res) => {

  try {
    const { id } = req.query;
    const { name, card_uid, classId, nis } = req.body;
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }
    if (name) student.name = name;
    if (card_uid) student.card_uid = card_uid;
    if (classId) student.classId = classId;
    if (nis) student.nis = nis;

    await student.save();
    res.status(200).json(student);
  } catch {
    res.status(500).json({ message: "Gagal edit siswa" });
  }
});

module.exports = router;
