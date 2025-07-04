'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Setting.init({
    status_manual: DataTypes.BOOLEAN,
    jam_masuk: DataTypes.TIME,
    jam_keluar: DataTypes.TIME,
    batas_absen_masuk: DataTypes.TIME,
    batas_absen_keluar: DataTypes.TIME
  }, {
    sequelize,
    modelName: 'Setting',
  });
  return Setting;
};