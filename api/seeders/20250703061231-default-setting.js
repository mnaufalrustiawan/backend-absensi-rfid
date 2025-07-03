'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Settings', [
      {
        status_manual: true,
        status_otomatis: true,
        absenmasuk_start: '07:00',
        absenmasuk_end: '08:00',
        absenkeluar_start: '13:00',
        absenkeluar_end: '14:00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Settings', null, {});
  }
};
