const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomepageSetting = sequelize.define('HomepageSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  setting_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  draft_value: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  has_unpublished_changes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'homepage_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['setting_key'] },
  ],
});

module.exports = HomepageSetting;
