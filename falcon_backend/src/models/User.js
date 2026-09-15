const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ROLES = require('../constants/roles');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(ROLES.CUSTOMER, ROLES.DRIVER, ROLES.ADMIN),
    allowNull: false,
    defaultValue: ROLES.CUSTOMER,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['mobile'] },
    { fields: ['role'] },
  ],
});

module.exports = User;
