const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

router.use(authMiddleware);
router.use(authorize("admin"));

router.get("/semua-user", async (req, res) => {
  // #swagger.tags = ['User']
  // #swagger.description = 'Ambil semua user (admin only)'
  const users = await User.findAll();
  res.status(200).json(users);
});

router.post("/tambah-user", async function (req, res) {
  /*
    #swagger.tags = ['User']
    #swagger.description = 'Tambah user baru oleh admin'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        $name: 'Naufal',
        $email: 'naufal@email.com',
        $password: 'password123',
        $role: 'admin'
      }
    }
  */
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });
  res.status(201).json(user);
});

router.put("/edit-user", async function (req, res) {
  /*
    #swagger.tags = ['User']
    #swagger.description = 'Edit user termasuk ganti password'
    #swagger.parameters['id'] = {
      in: 'query',
      required: true,
      type: 'integer',
      description: 'ID user yang ingin diedit'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        name: 'Nama Baru',
        email: 'email@baru.com',
        passwordsebelumnya: 'passwordlama',
        passwordbaru: 'passwordbaru'
      }
    }
  */
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
});

module.exports = router;
