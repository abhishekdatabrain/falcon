const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  permission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['role_id', 'permission_id'] },
    { fields: ['role_id'] },
    { fields: ['permission_id'] },
  ],
});

module.exports = RolePermission;
