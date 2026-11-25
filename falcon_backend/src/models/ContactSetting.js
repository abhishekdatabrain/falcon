const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactSetting = sequelize.define('ContactSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  support_email: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'care@saqrcart.com',
  },
  support_phone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '800 124 5555',
  },
  whatsapp_number: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '+966 59 597 4591',
  },
  business_address_en: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'King Fahd Road, Al Malqa District, P.O. Box 8421, Riyadh 13524, Saudi Arabia',
  },
  business_address_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'طريق الملك فهد، حي الملقا، ص.ب 8421، الرياض 13524، المملكة العربية السعودية',
  },
  support_hours_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '6:00 AM – 1:00 AM',
  },
  support_hours_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '6:00 ص – 1:00 ص',
  },
  dispatch_hours_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Operating 24/7',
  },
  dispatch_hours_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'يعمل 24/7',
  },
  live_chat_wait_en: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '< 3 mins',
  },
  live_chat_wait_ar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'أقل من 3 دقائق',
  },
  social_links: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  },
  updated_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'contact_settings',
  timestamps: true,
  underscored: true,
});

module.exports = ContactSetting;
