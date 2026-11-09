const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. dashboard, products, categories, inventory, orders, payments, refunds, delivery, drivers, customers, invoices, zatca, cms, banners, reports, admin_management',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. view, create, edit, delete, approve, assign, refund, export',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique code e.g. products.view, orders.assign, payments.approve',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'permissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['module'] },
    { fields: ['action'] },
  ],
});

module.exports = Permission;
