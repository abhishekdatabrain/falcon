const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  driver_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'drivers',
      key: 'id',
    },
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ASSIGNED',
  },
  otp: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  otp_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  proof_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  proof_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sensor_temperature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'deliveries',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['driver_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Delivery;
