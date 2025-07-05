const express = require("express");
const router = express.Router();
const { Class, Student } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");  
const { where } = require("sequelize");

router.use(authMiddleware);
router.use(authorize('admin', 'operator'));

router.get("/semua-kelas", async (req, res) => {
  /*
    #swagger.tags = ['Kelas']
    #swagger.description = 'Ambil semua data kelas'
    #swagger.responses[200] = { description: 'Data kelas berhasil diambil' }
  */
  const classes = await Class.findAll();
  res.status(200).json(classes);
});

router.post("/tambah-kelas", async (req, res) => {
  /*
    #swagger.tags = ['Kelas']
    #swagger.description = 'Tambah kelas baru'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            },
            required: ['name']
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Kelas berhasil ditambahkan' }
  */
  const { name } = req.body;
  const kelasBaru = await Class.create({ name });
  res.status(201).json(kelasBaru);
});

router.get("/kelas/siswa", async (req, res) => {
  /*
    #swagger.tags = ['Kelas']
    #swagger.description = 'Ambil daftar siswa berdasarkan ID kelas'
    #swagger.parameters['id'] = {
      in: 'query',
      description: 'ID kelas',
      required: true,
      type: 'integer'
    }
    #swagger.responses[200] = { description: 'Data kelas dan siswa berhasil diambil' }
    #swagger.responses[404] = { description: 'Kelas tidak ditemukan' }
    #swagger.responses[500] = { description: 'Gagal mendapatkan kelas' }
  */
  try {
    const { id } = req.query;

    const kelas = await Class.findOne({
      where: { id },
      include: {
        model: Student,
        attributes: ['name'],
      },
    });

    if (!kelas) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }
    res.status(200).json(kelas);
  } catch (err) {
    res.status(500).json({ message: "Gagal mendapatkan kelas", error: err.message });
  }
});

module.exports = router;
