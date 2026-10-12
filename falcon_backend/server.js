const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initSocketServer } = require('./src/sockets/socketManager');
const logger = require('./src/utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5001; // Port 5001

const server = http.createServer(app);

// Initialize Socket.IO Real-time Gateway
initSocketServer(server);

const startServer = async () => {
  try {
    // Authenticate PostgreSQL connection
    await sequelize.authenticate();
    logger.info('PostgreSQL database connected successfully via Sequelize.');

    // Ensure database tables and columns are synced
    try {
      if (process.env.SCHEMA) {
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${process.env.SCHEMA}";`);
      }
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized successfully.');

      // Auto-create default Admin if database is fresh
      const { User, Admin, Driver, HeroBanner } = require('./src/models');
      const { hashPassword } = require('./src/utils/password');
      const ROLES = require('./src/constants/roles');
      const { DRIVER_STATUS, DRIVER_AVAILABILITY } = require('./src/constants/driverStatus');

      const adminCount = await User.count({ where: { role: ROLES.ADMIN } });
      if (adminCount === 0) {
        logger.info('No Admin account found in DB. Auto-seeding default credentials...');
        const adminPassHash = await hashPassword('Admin@123456');
        const adminUser = await User.create({
          email: 'admin@platform.com',
          mobile: '+966500000001',
          password_hash: adminPassHash,
          role: ROLES.ADMIN,
          status: 'ACTIVE',
        });
        await Admin.create({
          user_id: adminUser.id,
          name: 'Platform System Admin',
          department: 'Operations',
        });
        logger.info('✓ Default Admin created: admin@platform.com / Admin@123456');
      }

      const driverCount = await Driver.count();
      if (driverCount === 0) {
        logger.info('No Driver accounts found in DB. Auto-seeding default drivers...');
        const driverPassHash = await hashPassword('Driver@123456');
        const driver1User = await User.create({
          email: 'driver1@platform.com',
          mobile: '+966550000002',
          password_hash: driverPassHash,
          role: ROLES.DRIVER,
          status: 'ACTIVE',
        });
        await Driver.create({
          user_id: driver1User.id,
          license_number: 'SA-DL-987654321',
          vehicle_details: 'Toyota Hilux 2024 (White) - License Plate 4321-KSA',
          driver_status: DRIVER_STATUS.ACTIVE,
          availability_status: DRIVER_AVAILABILITY.AVAILABLE,
        });
        logger.info('✓ Default Driver created: driver1@platform.com / Driver@123456');
      }

      const heroBannerCount = await HeroBanner.count();
      if (heroBannerCount === 0) {
        logger.info('No Hero Banners found in DB. Auto-seeding initial hero slides...');
        await HeroBanner.bulkCreate([
          {
            title_en: 'Everything You Need',
            title_ar: 'كل ما تحتاجه',
            subtitle_en: 'Delivered Simply',
            subtitle_ar: 'يصلك بكل بساطة',
            desc_en: 'Shop groceries, snacks, personal care and more at great prices. Freshness you can trust.',
            desc_ar: 'تسوق البقالة والوجبات الخفيفة والعناية الشخصية والمزيد بأفضل الأسعار. طازجة يمكنك الوثوق بها.',
            tag_en: 'Daily Grocery',
            tag_ar: 'البقالة اليومية',
            btn_text_en: 'Shop Now',
            btn_text_ar: 'تسوق الآن',
            btn_link: '/products',
            image_url: '/hero_grocery_bag_fresh.png',
            bg_color: '#FAF7F0',
            order_index: 0,
            is_active: true,
          },
          {
            title_en: 'Fresh Organic Fruits & Veggies',
            title_ar: 'فواكه وخضروات عضوية طازجة',
            subtitle_en: 'Directly From Local Farms',
            subtitle_ar: 'مباشرة من المزارع المحلية',
            desc_en: 'Enjoy hand-picked watermelons, kiwis, berries and fresh produce delivered in express cold chain.',
            desc_ar: 'استمتع بالبطيخ والكيوي والفواكه الاستوائية المنتقاة بعناية والتوصيل السريع.',
            tag_en: 'Farm Fresh',
            tag_ar: 'طازج من المزرعة',
            btn_text_en: 'Explore Produce',
            btn_text_ar: 'استكشف المنتجات',
            btn_link: '/products',
            image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
            bg_color: '#FAF7F0',
            order_index: 1,
            is_active: true,
          },
        ]);
        logger.info('✓ Default Hero Banners seeded successfully.');
      }
    } catch (syncErr) {
      logger.warn('Sequelize sync/seed warning: %s', syncErr.message);
    }

    server.listen(PORT, () => {
      logger.info(`Single Vendor E-Commerce REST API & Socket server active on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server: %o', error);
    process.exit(1);
  }
};

startServer();
