const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description_ar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  discount_type: {
    type: DataTypes.ENUM('PERCENTAGE', 'FIXED'),
    allowNull: false,
    defaultValue: 'PERCENTAGE',
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 15.00,
  },
  min_order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Coupon;
