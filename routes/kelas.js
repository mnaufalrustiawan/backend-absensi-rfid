const exoress = require("express");
const router = exoress.Router();
const { Class, Student } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");  
const { where } = require("sequelize");

router.use(authMiddleware);
router.use(authorize('admin', 'operator'));
router.get("/semua-kelas", async (req, res) => {
    const classes = await Class.findAll();
    res.status(200).json(classes);
});

router.post("/tambah-kelas", async (req, res) => {
    const { name } = req.body;
    const Class = await Class.create({ name });
    res.status(201).json(Class);
});

router.get("/kelas/siswa", async (req, res) =>{

    try{

        const { id } = req.query;
    
        const kelas = await Class.findOne({
        where: { id },
        include: {
            model: Student,
            attributes: ['name'],
        },
        });
        if(!kelas) {
            return res.status(404).json({ message: "Kelas tidak ditemukan" });
        }
        res.status(200).json(kelas);
    }catch (err) {
        res.status(500).json({ message: "Gagal mendapatkan kelas", error: err.message });
    }
});

module.exports = router;