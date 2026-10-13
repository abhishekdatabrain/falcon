const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomepageSection = sequelize.define('HomepageSection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  section_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  section_type: {
    type: DataTypes.ENUM('HERO_BANNER', 'CATEGORY_SHOWCASE', 'PRODUCT_GRID', 'PROMO_BANNER', 'CUSTOM_CONTENT'),
    allowNull: false,
    defaultValue: 'CUSTOM_CONTENT',
  },
  title_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title_ar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtitle_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtitle_ar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  draft_config: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  draft_display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  draft_is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  has_unpublished_changes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'homepage_sections',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['section_key'] },
    { fields: ['display_order'] },
    { fields: ['is_active'] },
    { fields: ['draft_display_order'] },
  ],
});

module.exports = HomepageSection;
