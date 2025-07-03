'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Attendance.belongsTo(models.Student, { foreignKey: 'studentId', onDelete: 'CASCADE' });
    }
  }
  Attendance.init({
    studentId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    status: DataTypes.ENUM('hadir', 'izin', 'alpha'),
    status_absen: DataTypes.ENUM('absenmasuk', 'absenkeluar'),
    absenmasuk: DataTypes.TIME,
    absenkeluar: DataTypes.TIME,
    keterangan: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Attendance',
  });
  return Attendance;
};