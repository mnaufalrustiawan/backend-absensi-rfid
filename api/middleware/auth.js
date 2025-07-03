const jwt = require("jsonwebtoken");
const { User } = require("../models");

exports.authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan atau format salah" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // Pastikan ID user tersedia
    if (!decoded.id) {
      return res.status(401).json({ message: "Token tidak valid (ID tidak ditemukan)" });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau kadaluarsa" });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Tidak ada informasi peran pengguna",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User dengan peran '${req.user.role}' tidak diizinkan mengakses rute ini`,
      });
    }

    next();
  };
};
