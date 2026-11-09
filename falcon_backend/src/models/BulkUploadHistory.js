const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BulkUploadHistory = sequelize.define('BulkUploadHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  import_type: {
    type: DataTypes.ENUM('CATEGORY', 'PRODUCT'),
    allowNull: false,
  },
  import_mode: {
    type: DataTypes.ENUM('CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'),
    allowNull: false,
    defaultValue: 'UPSERT',
  },
  error_handling: {
    type: DataTypes.ENUM('ALL_OR_NOTHING', 'SKIP_INVALID'),
    allowNull: false,
    defaultValue: 'SKIP_INVALID',
  },
  total_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  valid_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'VALIDATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL_SUCCESS'),
    defaultValue: 'PENDING',
  },
  error_summary: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  stats: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
}, {
  tableName: 'bulk_upload_history',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['uploaded_by'] },
    { fields: ['import_type'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
});

module.exports = BulkUploadHistory;
