'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status_manual: {
        type: Sequelize.BOOLEAN,
        defaultValue: false

      },
      jam_masuk: {
        type: Sequelize.TIME,
        allowNull: true
      },
      jam_keluar: {
        type: Sequelize.TIME,
        allowNull: true
      },
      batas_absen_masuk: {
        type: Sequelize.TIME,
        allowNull: true
      },
      batas_absen_keluar: {
        type: Sequelize.TIME,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Settings');
  }
};