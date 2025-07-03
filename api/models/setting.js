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
    status_otomatis: DataTypes.BOOLEAN,
    absenmasuk_start: DataTypes.TIME,
    absenmasuk_end: DataTypes.TIME,
    absenkeluar_start: DataTypes.TIME,
    absenkeluar_end: DataTypes.TIME
  }, {
    sequelize,
    modelName: 'Setting',
  });
  return Setting;
};