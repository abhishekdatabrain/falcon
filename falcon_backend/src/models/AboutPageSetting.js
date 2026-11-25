const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AboutPageSetting = sequelize.define('AboutPageSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  hero_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  stats_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  principles_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  farmer_spotlight_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  leadership_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  sustainability_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  timeline_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  cta_section: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  section_visibility: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      hero: true,
      stats: true,
      principles: true,
      farmers: true,
      leadership: true,
      sustainability: true,
      timeline: true,
      cta: true,
    },
  },
  updated_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'about_page_settings',
  timestamps: true,
  underscored: true,
});

module.exports = AboutPageSetting;
