const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
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
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'product_images',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['product_id'] },
  ],
});

module.exports = ProductImage;
