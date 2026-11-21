const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipSetting = sequelize.define('TipSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  show_on_checkout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  presets: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [
      { id: '1', amount: 5, is_enabled: true },
      { id: '2', amount: 10, is_enabled: true },
      { id: '3', amount: 15, is_enabled: true },
    ],
  },
  allow_custom: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  min_custom_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1.00,
  },
  max_custom_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 500.00,
  },
  updated_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'tip_settings',
  timestamps: true,
  underscored: true,
});

module.exports = TipSetting;
