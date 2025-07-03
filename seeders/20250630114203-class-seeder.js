'use strict';

/** @type {import('sequelize-cli').Migration} */
"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Classes", [
      {
        name: "X IPA 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "X IPA 2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Classes", null, {});
  },
};

