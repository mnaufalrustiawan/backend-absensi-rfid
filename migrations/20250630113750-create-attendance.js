'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      studentId: {
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      status:{
        type: Sequelize.ENUM('hadir', 'izin', 'alpha'),
        defaultValue: 'alpha',
      },
      status_absen: {
        type: Sequelize.ENUM('absenmasuk', 'absenkeluar'),
        allowNull: true
      },
      absenmasuk: {
        type: Sequelize.TIME,
        allowNull: true
      },
      absenkeluar: {
        type: Sequelize.TIME,
        allowNull: true
      },
      keterangan:{
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable('Attendances');
  }
};