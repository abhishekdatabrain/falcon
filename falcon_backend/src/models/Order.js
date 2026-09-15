const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ORDER_STATUS } = require('../constants/orderStatus');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  address_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'addresses',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tax_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  discount_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  grand_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  order_status: {
    type: DataTypes.ENUM(
      ORDER_STATUS.PENDING_PAYMENT,
      ORDER_STATUS.PAYMENT_SUBMITTED,
      ORDER_STATUS.PAYMENT_VERIFIED,
      ORDER_STATUS.PAYMENT_REJECTED,
      ORDER_STATUS.DRIVER_ASSIGNED,
      ORDER_STATUS.DRIVER_ACCEPTED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.ARRIVED,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED
    ),
    allowNull: false,
    defaultValue: ORDER_STATUS.PENDING_PAYMENT,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_number'] },
    { fields: ['customer_id'] },
    { fields: ['order_status'] },
  ],
});

module.exports = Order;
