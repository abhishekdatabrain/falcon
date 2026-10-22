const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HeroBanner = sequelize.define('HeroBanner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title_en: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Everything You need',
  },
  title_ar: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'كل ما تحتاجه',
  },
  subtitle_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Delivered Simply',
  },
  subtitle_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'يصلك بكل بساطة',
  },
  desc_en: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Shop groceries, snacks, personal care and more at great prices. Freshness you can trust.',
  },
  desc_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'تسوق البقالة والوجبات الخفيفة والعناية الشخصية والمزيد بأفضل الأسعار. طازجة يمكنك الوثوق بها.',
  },
  tag_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Daily Grocery',
  },
  tag_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'البقالة اليومية',
  },
  btn_text_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Shop Now',
  },
  btn_text_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'تسوق الآن',
  },
  btn_link: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '/products',
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '/hero_grocery_bag_fresh.png',
  },
  bg_color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#FAF7F0',
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
  show_badges: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },
  badge_1_title_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Fast & Reliable',
  },
  badge_1_title_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'سريع وموثوق',
  },
  badge_1_subtitle_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Delivery',
  },
  badge_1_subtitle_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'التوصيل',
  },
  badge_2_title_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Great Prices',
  },
  badge_2_title_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'أسعار رائعة',
  },
  badge_2_subtitle_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Everyday',
  },
  badge_2_subtitle_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'كل يوم',
  },
  badge_3_title_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Secure',
  },
  badge_3_title_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'آمن ومحمي',
  },
  badge_3_subtitle_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Payments',
  },
  badge_3_subtitle_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'المدفوعات',
  },
}, {
  tableName: 'hero_banners',
  timestamps: true,
});

module.exports = HeroBanner;
