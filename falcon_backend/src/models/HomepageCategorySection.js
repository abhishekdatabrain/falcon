const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomepageCategorySection = sequelize.define('HomepageCategorySection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title_en: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Household Essentials',
  },
  title_ar: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'المستلزمات المنزلية',
  },
  view_more_link: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '/products',
  },
  view_more_text_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'View more',
  },
  view_more_text_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'عرض المزيد',
  },
  bg_color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#F6FFF8',
  },
  max_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 6,
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
  tableName: 'homepage_category_sections',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['is_active'] },
    { fields: ['display_order'] },
  ],
});

module.exports = HomepageCategorySection;
