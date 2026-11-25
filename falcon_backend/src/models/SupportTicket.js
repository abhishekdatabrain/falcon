const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticket_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  order_number: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'inquiry_categories',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  category_code: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  category_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  attachment_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  attachment_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  attachment_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  attachment_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
    allowNull: false,
    defaultValue: 'NEW',
  },
  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'support_tickets',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['ticket_number'] },
    { fields: ['status'] },
    { fields: ['category_code'] },
    { fields: ['customer_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = SupportTicket;
