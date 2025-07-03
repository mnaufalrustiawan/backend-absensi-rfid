'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      Student.belongsTo(models.Class, { foreignKey: 'classId' });
      Student.hasMany(models.Attendance, { foreignKey: 'studentId' });
    }
  }

  Student.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      nis: {
        type: DataTypes.STRING,
        allowNull: false
      },
      classId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      card_uid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      modelName: 'Student',
    }
  );

  return Student;
};
