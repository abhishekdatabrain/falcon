const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DRIVER_STATUS, DRIVER_AVAILABILITY } = require('../constants/driverStatus');

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  license_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driver_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehicle_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehicle_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehicle_details: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  completed_deliveries: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  average_rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
  },
  total_ratings: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  driver_status: {
    type: DataTypes.ENUM(DRIVER_STATUS.ACTIVE, DRIVER_STATUS.INACTIVE),
    allowNull: false,
    defaultValue: DRIVER_STATUS.ACTIVE,
  },
  availability_status: {
    type: DataTypes.ENUM(DRIVER_AVAILABILITY.AVAILABLE, DRIVER_AVAILABILITY.BUSY, DRIVER_AVAILABILITY.OFFLINE),
    allowNull: false,
    defaultValue: DRIVER_AVAILABILITY.OFFLINE,
  },
}, {
  tableName: 'drivers',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['driver_status'] },
    { fields: ['availability_status'] },
  ],
});

module.exports = Driver;
