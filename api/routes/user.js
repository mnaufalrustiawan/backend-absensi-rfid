const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

router.use(authMiddleware);
router.use(authorize("admin"));



router.route("/user")
.get (async (req, res) => {

  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Gagal mendapatkan user", error: err.message });
  }
})

.get( async (req, res) => {
  try{
    const {id} = req.query;
    const user = await User.findByPk(id);
    if(!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    
    res.status(200).json(user);

  }catch (err) {
    res.status(500).json({ message: "Gagal mendapatkan user", error: err.message });
  }
})

.post( async (req, res) => {

  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email sudah digunakan" });
  }
  const user = await User.create({ name, email, password, role });
  res.status(201).json(user);
})



.put( async (req, res) => {

  try {
    const { id } = req.query;
    const { name, email, passwordbaru, passwordsebelumnya } = req.body;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    if (passwordbaru) {
      const isMatch = await bcrypt.compare(passwordsebelumnya, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Password salah" });
      }
      user.password = bcrypt.hashSync(passwordbaru, 10);
    }

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Gagal edit user", eror: err.message });
  }
})

.delete( async (req, res) => {
  try {
    const {id} = req.query;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    await user.destroy();
    res.status(200).json({ message: "User berhasil dihapus" });

  }catch(err) {
    res.status(500).json({ message: "Gagal hapus user", error: err.message });
  }
});



module.exports = router;
