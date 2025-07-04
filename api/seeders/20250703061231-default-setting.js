'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Settings', [
      {
        status_manual: true,
        jam_masuk: '08:00:00',
        jam_keluar: '16:00:00',
        batas_absen_masuk: '08:30:00',
        batas_absen_keluar: '17:30:00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Settings', null, {});
  }
};
