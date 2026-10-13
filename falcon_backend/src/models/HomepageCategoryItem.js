const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomepageCategoryItem = sequelize.define('HomepageCategoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  section_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'homepage_category_sections',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
  },
  title_en: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title_ar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  link_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'homepage_category_items',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['section_id'] },
    { fields: ['is_active'] },
    { fields: ['display_order'] },
  ],
});

module.exports = HomepageCategoryItem;
