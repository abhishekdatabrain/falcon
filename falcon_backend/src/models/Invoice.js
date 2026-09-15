const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  issue_date_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  seller_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  seller_vat_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  buyer_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  buyer_vat_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total_excluding_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  vat_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_including_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  qr_code_payload: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pdf_file_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['invoice_number'] },
    { fields: ['uuid'] },
    { fields: ['order_id'] },
  ],
});

module.exports = Invoice;
