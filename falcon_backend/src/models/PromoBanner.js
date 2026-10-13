const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromoBanner = sequelize.define('PromoBanner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title_en: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Everyday groceries, made easy!',
  },
  title_ar: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'البقالة اليومية، بأسهل طريقة!',
  },
  desc_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Fresh staples, pantry essentials & more',
  },
  desc_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'مواد أساسية طازجة، مستلزمات المؤونة والمزيد',
  },
  btn_text_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Order Now',
  },
  btn_text_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'اطلب الآن',
  },
  btn_link: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '/products?category=groceries',
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '/promo/promo_groceries.png',
  },
  bg_color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#F5BF38',
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'promo_banners',
  timestamps: true,
});

module.exports = PromoBanner;
