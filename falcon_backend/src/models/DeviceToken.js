const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceToken = sequelize.define('DeviceToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  platform: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'android', // 'android', 'ios', 'web'
  },
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'device_tokens',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['token'], unique: true },
    { fields: ['is_active'] },
  ],
});

module.exports = DeviceToken;
