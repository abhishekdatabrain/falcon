const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliverySetting = sequelize.define('DeliverySetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  method_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true, // 'EXPRESS' or 'STANDARD'
  },
  name_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  name_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  base_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  estimated_delivery_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  min_order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  free_delivery_threshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
  },
  zone_rules: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null, // For future city/zone rates and availability
  },
  updated_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'delivery_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['method_type'], unique: true },
    { fields: ['is_enabled'] },
  ],
});

module.exports = DeliverySetting;
