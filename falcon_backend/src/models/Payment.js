const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PAYMENT_STATUS = require('../constants/paymentStatus');

const Payment = sequelize.define('Payment', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      PAYMENT_STATUS.PENDING,
      PAYMENT_STATUS.SUBMITTED,
      PAYMENT_STATUS.UNDER_REVIEW,
      PAYMENT_STATUS.VERIFIED,
      PAYMENT_STATUS.REJECTED
    ),
    allowNull: false,
    defaultValue: PAYMENT_STATUS.PENDING,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verified_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id',
    },
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Payment;
