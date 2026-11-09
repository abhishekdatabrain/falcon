const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'invoices',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  item_name_en: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  item_name_ar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  vat_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 15.00,
  },
  vat_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_with_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'invoice_items',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['invoice_id'] },
  ],
});

module.exports = InvoiceItem;
