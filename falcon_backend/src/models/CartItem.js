const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cart_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['cart_id'] },
    { fields: ['product_id'] },
  ],
});

module.exports = CartItem;
