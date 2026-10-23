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
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  delivery_date: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  delivery_slot: {
    type: DataTypes.STRING(100),
    allowNull: true,
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
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.DRIVER_ASSIGNED,
      ORDER_STATUS.DRIVER_ACCEPTED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.ARRIVED,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.DELIVERY_FAILED,
      ORDER_STATUS.RETURNED
    ),
    allowNull: false,
    defaultValue: ORDER_STATUS.PENDING_PAYMENT,
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'COD',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancellation_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  refund_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_number'] },
    { fields: ['customer_id'] },
    { fields: ['order_status'] },
    { fields: ['payment_method'] },
  ],
});

module.exports = Order;
