const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DriverLocation = sequelize.define('DriverLocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  delivery_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'deliveries',
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
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  heading: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'driver_locations',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['delivery_id'] },
    { fields: ['driver_id'] },
    { fields: ['recorded_at'] },
  ],
});

module.exports = DriverLocation;
