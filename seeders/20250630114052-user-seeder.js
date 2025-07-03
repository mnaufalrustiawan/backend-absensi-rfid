'use strict';

/** @type {import('sequelize-cli').Migration} */
const bcrypt = require("bcryptjs");
"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const hashedPasswordoperator = await bcrypt.hash("operator123", 10);
    await queryInterface.bulkInsert("Users", [
      {
        name: "Super Admin",
        email: "admin@example.com",
        password: hashedPassword, // bisa di-hash nanti
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Operator",
        email: "operator@example.com",
        password: hashedPasswordoperator, // bisa di-hash nanti
        role: "operator",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};

