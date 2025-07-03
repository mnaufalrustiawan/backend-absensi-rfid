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
      status_otomatis: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      absenmasuk_start: {
        type: Sequelize.TIME
      },
      absenmasuk_end: {
        type: Sequelize.TIME
      },
      absenkeluar_start: {
        type: Sequelize.TIME
      },
      absenkeluar_end: {
        type: Sequelize.TIME
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