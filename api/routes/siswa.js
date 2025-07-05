const express = require("express");
const router = express.Router();
const { User, Attendance, Student, Class } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");

router.use(authMiddleware);
router.use(authorize('admin', 'operator'));

router.get("/semua-siswa", async (req, res) => {
  /*
    #swagger.tags = ['Siswa']
    #swagger.description = 'Ambil semua data siswa'
    #swagger.responses[200] = { description: 'Berhasil mengambil semua siswa' }
    #swagger.responses[404] = { description: 'Tidak ada siswa' }
  */
  const students = await Student.findAll();
  if (!students) {
    return res.status(404).json({ message: "Siswa Belum ada" });
  }
  res.status(200).json(students);
});

router.get("/siswa/:id", async (req, res) => {
  /*
    #swagger.tags = ['Siswa']
    #swagger.description = 'Ambil detail siswa berdasarkan ID'
    #swagger.parameters['id'] = { in: 'path', description: 'ID siswa', required: true, type: 'integer' }
    #swagger.responses[200] = { description: 'Data siswa ditemukan' }
    #swagger.responses[404] = { description: 'Siswa tidak ditemukan' }
  */
  const { id } = req.params;
  const student = await Student.findByPk(id);
  if (!student) {
    return res.status(404).json({ message: "Siswa tidak ditemukan" });
  }
  res.status(200).json(student);
});

router.get("/riwayat-absen-siswa/:id", async (req, res) => {
  /*
    #swagger.tags = ['Siswa']
    #swagger.description = 'Ambil riwayat absensi siswa berdasarkan ID'
    #swagger.parameters['id'] = { in: 'path', description: 'ID siswa', required: true, type: 'integer' }
    #swagger.responses[200] = { description: 'Riwayat absensi ditemukan' }
    #swagger.responses[404] = { description: 'Siswa tidak ditemukan' }
  */
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
  /*
    #swagger.tags = ['Siswa']
    #swagger.description = 'Tambah siswa baru'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'card_uid', 'classId', 'nis'],
            properties: {
              name: { type: 'string' },
              card_uid: { type: 'string' },
              classId: { type: 'integer' },
              nis: { type: 'string' }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Siswa berhasil ditambahkan' }
  */
  const { name, card_uid, classId, nis } = req.body;
  const student = await Student.create({ name, card_uid, classId, nis });
  res.status(201).json(student);
});

router.put("/edit-siswa", async (req, res) => {
  /*
    #swagger.tags = ['Siswa']
    #swagger.description = 'Edit data siswa'
    #swagger.parameters['id'] = { in: 'query', description: 'ID siswa', required: true, type: 'integer' }
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              card_uid: { type: 'string' },
              classId: { type: 'integer' },
              nis: { type: 'string' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Siswa berhasil diubah' }
    #swagger.responses[404] = { description: 'Siswa tidak ditemukan' }
    #swagger.responses[500] = { description: 'Gagal edit siswa' }
  */
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
