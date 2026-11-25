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
  cod_amount_collected: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  cod_collected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cod_driver_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  cash_handover_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'PENDING_HANDOVER',
  },
  cod_collection_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'NOT_COLLECTED',
  },
  handover_confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  handover_confirmed_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  handover_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  handover_received_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  latest_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  latest_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  latest_heading: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  latest_speed: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  latest_accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  latest_location_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estimated_distance_meters: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  estimated_duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  route_polyline: {
    type: DataTypes.TEXT,
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
