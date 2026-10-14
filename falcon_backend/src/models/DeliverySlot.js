const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliverySlot = sequelize.define('DeliverySlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slot_label_en: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slot_label_ar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tag_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tag_ar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_express: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  max_orders: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
}, {
  tableName: 'delivery_slots',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['is_active'] },
    { fields: ['display_order'] },
  ],
});

module.exports = DeliverySlot;
