const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DriverAssignment = sequelize.define('DriverAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
    onDelete: 'RESTRICT',
  },
  assigned_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id',
    },
  },
  previous_driver_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id',
    },
  },
  reassignment_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'driver_assignments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['driver_id'] },
  ],
});

module.exports = DriverAssignment;
