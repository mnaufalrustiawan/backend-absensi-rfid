const express = require("express");
const router = express.Router();
const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post("/login", async function (req, res) {
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Login untuk admin'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        $email: "admin@email.com",
        $password: "password123"
      }
    }
    #swagger.responses[200] = {
      description: "Login berhasil",
      schema: {
        token: "jwt.token.here",
        admin: {
          name: "Admin Name",
          email: "admin@email.com"
        }
      }
    }
    #swagger.responses[404] = {
      description: "Admin tidak ditemukan"
    }
    #swagger.responses[401] = {
      description: "Password salah"
    }
    #swagger.responses[500] = {
      description: "Gagal login"
    }
  */
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ where: { email } });

    if (!admin) return res.status(404).json({ message: "Admin tidak ditemukan" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({ token, admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: "Gagal login", error: err.message });
  }
});

module.exports = router;
