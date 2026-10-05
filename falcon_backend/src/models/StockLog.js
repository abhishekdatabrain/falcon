const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockLog = sequelize.define('StockLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.STRING, // 'RESTOCK', 'DAMAGE', 'CORRECTION', 'INITIAL', 'SALE'
    allowNull: false,
    defaultValue: 'RESTOCK',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  previous_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  new_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'stock_logs',
  timestamps: true,
});

module.exports = StockLog;
