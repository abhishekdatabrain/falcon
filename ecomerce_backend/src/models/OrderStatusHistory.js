const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
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
  from_status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  to_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  changed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'order_status_history',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_id'] },
  ],
});

module.exports = OrderStatusHistory;
