const { sequelize, User, Customer, Driver, Admin, Category, Product, ProductImage } = require('../models');
const { hashPassword } = require('../utils/password');
const ROLES = require('../constants/roles');
const { DRIVER_STATUS, DRIVER_AVAILABILITY } = require('../constants/driverStatus');
const logger = require('../utils/logger');

const seedInitialData = async () => {
  try {
    logger.info('Starting initial database seeding...');

    // 1. Seed Super Admin
    const adminEmail = 'admin@platform.com';
    let adminUser = await User.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await hashPassword('Admin@123456');
      await sequelize.transaction(async (t) => {
        adminUser = await User.create({
          email: adminEmail,
          mobile: '+966500000001',
          password_hash: hashedPassword,
          role: ROLES.ADMIN,
          status: 'ACTIVE',
        }, { transaction: t });

        await Admin.create({
          user_id: adminUser.id,
          name: 'Platform Super Admin',
          department: 'Executive Operations',
        }, { transaction: t });
      });
      logger.info('Default Admin created: admin@platform.com / Admin@123456');
    }

    // 2. Seed Default Driver Account (Created by Admin)
    const driverEmail = 'driver1@platform.com';
    let driverUser = await User.findOne({ where: { email: driverEmail } });
    if (!driverUser) {
      const hashedPassword = await hashPassword('Driver@123456');
      await sequelize.transaction(async (t) => {
        driverUser = await User.create({
          email: driverEmail,
          mobile: '+966550000002',
          password_hash: hashedPassword,
          role: ROLES.DRIVER,
          status: 'ACTIVE',
        }, { transaction: t });

        await Driver.create({
          user_id: driverUser.id,
          license_number: 'SA-DL-987654321',
          vehicle_details: 'Toyota Hilux 2024 (White) - License Plate 4321-KSA',
          driver_status: DRIVER_STATUS.ACTIVE,
          availability_status: DRIVER_AVAILABILITY.AVAILABLE,
        }, { transaction: t });
      });
      logger.info('Default Driver created: driver1@platform.com / Driver@123456');
    }

    // 3. Seed Categories
    const categoriesData = [
      {
        name_en: 'Electronics & Gadgets',
        name_ar: 'الإلكترونيات والأجهزة',
        slug: 'electronics-gadgets',
        image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop',
      },
      {
        name_en: 'Fashion & Apparel',
        name_ar: 'الأزياء والملابس',
        slug: 'fashion-apparel',
        image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop',
      },
      {
        name_en: 'Home & Kitchen',
        name_ar: 'المنزل والمطبخ',
        slug: 'home-kitchen',
        image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop',
      },
      {
        name_en: 'Beauty & Wellness',
        name_ar: 'الجمال والعناية',
        slug: 'beauty-wellness',
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop',
      },
    ];

    const categoryMap = {};
    for (const catData of categoriesData) {
      let [cat] = await Category.findOrCreate({
        where: { slug: catData.slug },
        defaults: catData,
      });
      categoryMap[catData.slug] = cat.id;
    }

    // 4. Seed Sample Products
    const productsData = [
      {
        category_id: categoryMap['electronics-gadgets'],
        sku: 'ELE-PHN-001',
        name_en: 'Pro Smartphone 256GB - Titanium Silver',
        name_ar: 'هاتف ذكي بروفيشنال 256 جيجابايت - فضي تيتانيوم',
        description_en: 'High-performance flagship smartphone featuring OLED display, 5G connectivity, and triple 50MP camera setup.',
        description_ar: 'هاتف ذكي ممتاز بشاشة أوليد فائقة الوضوح، يدعم شبكات الجيل الخامس وكاميرا ثلاثية بدقة 50 ميجابكسل.',
        price: 3499.00,
        stock_quantity: 45,
        is_available: true,
        is_active: true,
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop',
        ],
      },
      {
        category_id: categoryMap['electronics-gadgets'],
        sku: 'ELE-AUD-002',
        name_en: 'Wireless Noise-Canceling Headphones',
        name_ar: 'سماعات رأس لاسلكية مانعة للضوضاء',
        description_en: 'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and spatial audio.',
        description_ar: 'سماعات لاسلكية عالية الجودة مع ميزة عزل الضوضاء النشط وبطارية تدوم حتى 30 ساعة.',
        price: 899.00,
        stock_quantity: 80,
        is_available: true,
        is_active: true,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop',
        ],
      },
      {
        category_id: categoryMap['home-kitchen'],
        sku: 'HOM-COF-003',
        name_en: 'Automatic Espresso Coffee Machine',
        name_ar: 'ماكينة صنع القهوة وإسبريسو أوتوماتيكية',
        description_en: 'Italian 15-bar pump espresso maker with built-in milk frother and stainless steel finish.',
        description_ar: 'صانعة إسبريسو إيطالية بقوة 15 بار مع صانع رغوة الحليب وهيكل من الفولاذ المقاوم للصدأ.',
        price: 1299.00,
        stock_quantity: 30,
        is_available: true,
        is_active: true,
        images: [
          'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&auto=format&fit=crop',
        ],
      },
      {
        category_id: categoryMap['fashion-apparel'],
        sku: 'FAS-WCH-004',
        name_en: 'Classic Chronograph Leather Watch',
        name_ar: 'ساعة يد كلاسيكية بسوار جلدي',
        description_en: 'Water-resistant luxury chronograph wrist watch with genuine leather strap and sapphire glass.',
        description_ar: 'ساعة يد أنيقة مقاومة للماء بسوار من الجلد الطبيعي وزجاج ياقوتي مقاوم للخدش.',
        price: 749.00,
        stock_quantity: 60,
        is_available: true,
        is_active: true,
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop',
        ],
      },
    ];

    for (const prodData of productsData) {
      const { images, ...prodFields } = prodData;
      let [product] = await Product.findOrCreate({
        where: { sku: prodFields.sku },
        defaults: prodFields,
      });

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await ProductImage.findOrCreate({
            where: { product_id: product.id, image_url: images[i] },
            defaults: {
              product_id: product.id,
              image_url: images[i],
              display_order: i,
              is_primary: i === 0,
            },
          });
        }
      }
    }

    logger.info('Database initial seeding completed successfully.');
  } catch (error) {
    logger.error('Error during initial database seeding: %o', error);
  }
};

module.exports = seedInitialData;
