const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  subcategory_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name_ar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['category_id'] },
    { fields: ['subcategory_id'] },
    { fields: ['sku'] },
    { fields: ['is_available'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Product;
