const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentConfirmation = sequelize.define('PaymentConfirmation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'payments',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_reference: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  proof_file_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'payment_confirmations',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['payment_id'] },
    { fields: ['payment_reference'] },
  ],
});

module.exports = PaymentConfirmation;
