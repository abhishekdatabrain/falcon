const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InquiryCategory = sequelize.define('InquiryCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(80),
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
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'inquiry_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['is_active'] },
    { fields: ['display_order'] },
  ],
});

module.exports = InquiryCategory;
