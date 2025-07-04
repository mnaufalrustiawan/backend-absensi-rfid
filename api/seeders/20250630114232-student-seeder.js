'use strict';

/** @type {import('sequelize-cli').Migration} */
"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Students", [
      {
        name: "Budi Santoso",
        nis: "123456",
        classId: 1, // sesuai ID Class "X IPA 1"
        card_uid: "0E400A191DB536",
        no_wa_ortu: "6285889251312",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Siti Aminah",
        nis: "654321",
        classId: 2, // sesuai ID Class "X IPA 2"
        card_uid: "14BC4E05",
        no_wa_ortu: "6285326831850",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Students", null, {});
  },
};

