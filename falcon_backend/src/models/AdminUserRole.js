const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminUserRole = sequelize.define('AdminUserRole', {
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
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  assigned_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'admin_user_roles',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'role_id'] },
    { fields: ['user_id'] },
    { fields: ['role_id'] },
  ],
});

module.exports = AdminUserRole;
