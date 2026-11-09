const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariantImage = sequelize.define('ProductVariantImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  variant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'product_variants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'product_variant_images',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['variant_id'] },
    { fields: ['variant_id', 'is_primary'] },
    { fields: ['variant_id', 'sort_order'] },
  ],
});

module.exports = ProductVariantImage;
