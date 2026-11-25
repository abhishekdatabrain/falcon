const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfficeLocation = sequelize.define('OfficeLocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name_ar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'DISPATCH_HUB',
  },
  badge_en: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  badge_ar: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  region_en: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  region_ar: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  address_en: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  address_ar: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  map_image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  service_areas_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  service_areas_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  support_hours_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  support_hours_ar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dispatch_hours_en: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dispatch_hours_ar: {
    type: DataTypes.STRING,
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
  tableName: 'office_locations',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['is_active'] },
    { fields: ['display_order'] },
  ],
});

module.exports = OfficeLocation;
