const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'customers',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'carts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['customer_id'] },
  ],
});

module.exports = Cart;
