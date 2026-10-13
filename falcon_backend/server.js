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
      const { User, Admin, Driver, HeroBanner, PromoBanner, HomepageCategorySection, HomepageCategoryItem, HomepageSection, HomepageSetting } = require('./src/models');
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

      const promoBannerCount = await PromoBanner.count();
      if (promoBannerCount === 0) {
        logger.info('No Promo Banners found in DB. Auto-seeding initial 3 promotional cards...');
        await PromoBanner.bulkCreate([
          {
            title_en: 'Everyday groceries, made easy!',
            title_ar: 'البقالة اليومية، بأسهل طريقة!',
            desc_en: 'Fresh staples, pantry essentials & more',
            desc_ar: 'مواد أساسية طازجة، مستلزمات المؤونة والمزيد',
            btn_text_en: 'Order Now',
            btn_text_ar: 'اطلب الآن',
            btn_link: '/products?category=groceries',
            image_url: '/promo/promo_groceries.png',
            bg_color: '#F5BF38',
            order_index: 0,
            is_active: true,
          },
          {
            title_en: 'Everything your home needs!',
            title_ar: 'كل ما يحتاجه منزلك!',
            desc_en: 'Cleaning, home care & daily essentials',
            desc_ar: 'التنظيف، العناية بالمنزل والمستلزمات اليومية',
            btn_text_en: 'Order Now',
            btn_text_ar: 'اطلب الآن',
            btn_link: '/products?category=household',
            image_url: '/promo/promo_cleaning.png',
            bg_color: '#38BDF8',
            order_index: 1,
            is_active: true,
          },
          {
            title_en: 'Snack time starts here!',
            title_ar: 'وقت الوجبات الخفيفة يبدأ هنا!',
            desc_en: 'Tasty bites, chips, chocolates & more',
            desc_ar: 'وجبات خفيفة، شيبس، شوكولاتة والمزيد',
            btn_text_en: 'Order Now',
            btn_text_ar: 'اطلب الآن',
            btn_link: '/products?category=snacks',
            image_url: '/promo/promo_snacks.jpg',
            bg_color: '#A3E062',
            order_index: 2,
            is_active: true,
          },
        ]);
        logger.info('✓ Default Promo Banners seeded successfully.');
      }

      // Auto-seed Category Showcase Sections if table is empty
      const sectionCount = await HomepageCategorySection.count();
      if (sectionCount === 0) {
        logger.info('No Homepage Category Sections found in DB. Auto-seeding initial showcase sections...');
        const sec1 = await HomepageCategorySection.create({
          title_en: 'Household Essentials',
          title_ar: 'المستلزمات المنزلية',
          view_more_link: '/products?category=household',
          view_more_text_en: 'View more',
          view_more_text_ar: 'عرض المزيد',
          bg_color: '#F6FFF8',
          max_items: 6,
          display_order: 1,
          is_active: true,
        });

        await HomepageCategoryItem.bulkCreate([
          {
            section_id: sec1.id,
            title_en: 'Laundry Care',
            title_ar: 'العناية بالغسيل',
            image_url: '/subcategories/laundry_care.png',
            link_url: '/products?category=household&sub=laundry',
            display_order: 1,
            is_active: true,
          },
          {
            section_id: sec1.id,
            title_en: 'Toilet Cleaner',
            title_ar: 'منظف الحمام',
            image_url: '/subcategories/toilet_cleaner.png',
            link_url: '/products?category=household&sub=toilet-cleaner',
            display_order: 2,
            is_active: true,
          },
          {
            section_id: sec1.id,
            title_en: 'Vacuum Cleaner',
            title_ar: 'مكنسة كهربائية',
            image_url: '/subcategories/vacuum_cleaner.png',
            link_url: '/products?category=household&sub=vacuum',
            display_order: 3,
            is_active: true,
          },
          {
            section_id: sec1.id,
            title_en: 'Storage',
            title_ar: 'التخزين',
            image_url: '/subcategories/storage.png',
            link_url: '/products?category=household&sub=storage',
            display_order: 4,
            is_active: true,
          },
          {
            section_id: sec1.id,
            title_en: 'Lights & Lamps',
            title_ar: 'إضاءة ومصابيح',
            image_url: '/subcategories/lights_lamps.png',
            link_url: '/products?category=household&sub=lighting',
            display_order: 5,
            is_active: true,
          },
          {
            section_id: sec1.id,
            title_en: 'Chairs',
            title_ar: 'كراسي',
            image_url: '/subcategories/chairs.png',
            link_url: '/products?category=household&sub=chairs',
            display_order: 6,
            is_active: true,
          },
        ]);

        const sec2 = await HomepageCategorySection.create({
          title_en: 'Groceries',
          title_ar: 'البقالة',
          view_more_link: '/products?category=groceries',
          view_more_text_en: 'View more',
          view_more_text_ar: 'عرض المزيد',
          bg_color: '#F6FFF8',
          max_items: 6,
          display_order: 2,
          is_active: true,
        });

        await HomepageCategoryItem.bulkCreate([
          {
            section_id: sec2.id,
            title_en: 'Rice & Grains',
            title_ar: 'الأرز والحبوب',
            image_url: '/subcategories/rice_grains.png',
            link_url: '/products?category=groceries&sub=rice-grains',
            display_order: 1,
            is_active: true,
          },
          {
            section_id: sec2.id,
            title_en: 'Flour & Baking',
            title_ar: 'الدقيق والخبز',
            image_url: '/subcategories/flour_baking.png',
            link_url: '/products?category=groceries&sub=flour',
            display_order: 2,
            is_active: true,
          },
          {
            section_id: sec2.id,
            title_en: 'Pulses & Lentils',
            title_ar: 'البقوليات والعدس',
            image_url: '/subcategories/pulses_lentils.png',
            link_url: '/products?category=groceries&sub=lentils',
            display_order: 3,
            is_active: true,
          },
          {
            section_id: sec2.id,
            title_en: 'Pasta & Noodles',
            title_ar: 'معكرونة ونودلز',
            image_url: '/subcategories/pasta_noodles.png',
            link_url: '/products?category=groceries&sub=pasta',
            display_order: 4,
            is_active: true,
          },
          {
            section_id: sec2.id,
            title_en: 'Tea & Coffee',
            title_ar: 'شاي وقهوة',
            image_url: '/subcategories/tea_coffee.png',
            link_url: '/products?category=groceries&sub=tea-coffee',
            display_order: 5,
            is_active: true,
          },
          {
            section_id: sec2.id,
            title_en: 'Sugar & Sweeteners',
            title_ar: 'السكر والمحليات',
            image_url: '/subcategories/sugar_sweeteners.png',
            link_url: '/products?category=groceries&sub=sugar',
            display_order: 6,
            is_active: true,
          },
        ]);
        logger.info('✓ Default Homepage Category Sections seeded successfully.');
      }

      // Auto-seed Homepage CMS Sections & Settings if empty
      const cmsSectionCount = await HomepageSection.count();
      if (cmsSectionCount === 0) {
        logger.info('No Homepage CMS Sections found in DB. Auto-seeding initial layout sections...');
        const initialSections = [
          {
            section_key: 'hero_slider',
            section_type: 'HERO_BANNER',
            title_en: 'Hero Banner Slider',
            title_ar: 'شريط البانر الرئيسي',
            subtitle_en: 'Top promotional slides with call-to-actions',
            subtitle_ar: 'الشرائح الترويجية العلوية',
            config: { autoSlide: true, intervalSec: 5, showTrustBadges: true },
            draft_config: { autoSlide: true, intervalSec: 5, showTrustBadges: true },
            display_order: 1,
            draft_display_order: 1,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
          {
            section_key: 'explore_categories',
            section_type: 'CATEGORY_SHOWCASE',
            title_en: 'Explore Our Categories',
            title_ar: 'استكشف فئاتنا',
            subtitle_en: 'Shop by department',
            subtitle_ar: 'تسوق حسب القسم',
            config: { layout: 'circular_carousel', max_items: 12, showArrows: true },
            draft_config: { layout: 'circular_carousel', max_items: 12, showArrows: true },
            display_order: 2,
            draft_display_order: 2,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
          {
            section_key: 'best_deals',
            section_type: 'PRODUCT_GRID',
            title_en: 'Best Deals',
            title_ar: 'أفضل العروض',
            subtitle_en: 'Grab them before they are gone',
            subtitle_ar: 'احصل عليها قبل نفادها',
            config: { filter: 'best_deals', layout: 'carousel', limit: 10, view_more_link: '/products?filter=deals' },
            draft_config: { filter: 'best_deals', layout: 'carousel', limit: 10, view_more_link: '/products?filter=deals' },
            display_order: 3,
            draft_display_order: 3,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
          {
            section_key: 'promo_cards',
            section_type: 'PROMO_BANNER',
            title_en: 'Promotional Highlights',
            title_ar: 'عروض ترويجية مميزة',
            subtitle_en: 'Everyday groceries & cleaning essentials',
            subtitle_ar: 'البقالة اليومية ومستلزمات التنظيف',
            config: { layout: '3_column_cards' },
            draft_config: { layout: '3_column_cards' },
            display_order: 4,
            draft_display_order: 4,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
          {
            section_key: 'category_showcase',
            section_type: 'CATEGORY_SHOWCASE',
            title_en: 'Category Showcase',
            title_ar: 'معرض الفئات',
            subtitle_en: 'Household Essentials & Groceries showcase grids',
            subtitle_ar: 'المستلزمات المنزلية وشبكات البقالة',
            config: { layout: 'grid_6_column', subcategories_source: 'dynamic_sections' },
            draft_config: { layout: 'grid_6_column', subcategories_source: 'dynamic_sections' },
            display_order: 5,
            draft_display_order: 5,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
          {
            section_key: 'household_featured',
            section_type: 'CUSTOM_CONTENT',
            title_en: 'Household Essentials Featured Banner',
            title_ar: 'بانر المستلزمات المنزلية المميز',
            subtitle_en: 'A Cleaner Home, A Happier You',
            subtitle_ar: 'منزل أكثر نظافة، وحياة أكثر سعادة',
            config: {
              category_tag_en: 'HOUSEHOLD ESSENTIALS',
              category_tag_ar: 'مستلزمات منزلية',
              headline_en_1: 'A Cleaner Home,',
              headline_ar_1: 'منزل أكثر نظافة،',
              headline_en_2: 'A Happier You.',
              headline_ar_2: 'وحياة أكثر سعادة.',
              desc_en: 'Quality household essentials for a fresher, cleaner and more comfortable home.',
              desc_ar: 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.',
              btn_text_en: 'Shop Now',
              btn_text_ar: 'تسوق الآن',
              btn_link: '/products?category=household',
              bg_color: '#FAF7F0',
              image_url: '/banners/household_banner.jpg',
            },
            draft_config: {
              category_tag_en: 'HOUSEHOLD ESSENTIALS',
              category_tag_ar: 'مستلزمات منزلية',
              headline_en_1: 'A Cleaner Home,',
              headline_ar_1: 'منزل أكثر نظافة،',
              headline_en_2: 'A Happier You.',
              headline_ar_2: 'وحياة أكثر سعادة.',
              desc_en: 'Quality household essentials for a fresher, cleaner and more comfortable home.',
              desc_ar: 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.',
              btn_text_en: 'Shop Now',
              btn_text_ar: 'تسوق الآن',
              btn_link: '/products?category=household',
              bg_color: '#FAF7F0',
              image_url: '/banners/household_banner.jpg',
            },
            display_order: 6,
            draft_display_order: 6,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
          {
            section_key: 'popular_picks',
            section_type: 'PRODUCT_GRID',
            title_en: 'Popular Picks',
            title_ar: 'الأكثر شعبية',
            subtitle_en: 'Customer top favorites and trending essentials',
            subtitle_ar: 'المفضلة لدى العملاء والمستلزمات الرائجة',
            config: { filter: 'popular', layout: 'grid_5_column', limit: 10 },
            draft_config: { filter: 'popular', layout: 'grid_5_column', limit: 10 },
            display_order: 7,
            draft_display_order: 7,
            is_active: true,
            draft_is_active: true,
            is_published: true,
            has_unpublished_changes: false,
          },
        ];

        await HomepageSection.bulkCreate(initialSections);
        logger.info('✓ Default Homepage CMS Sections seeded successfully.');
      }

      const settingsCount = await HomepageSetting.count();
      if (settingsCount === 0) {
        logger.info('Auto-seeding default Header & Footer CMS settings...');
        await HomepageSetting.bulkCreate([
          {
            setting_key: 'announcement_bar',
            value: {
              enabled: true,
              text_en: 'Free delivery on orders over 150 SAR! Code: FREESHIP',
              text_ar: 'توصيل مجاني للطلبات فوق 150 ريال! استخدم الكود: FREESHIP',
              bg_color: '#043927',
              text_color: '#FFFFFF',
            },
            draft_value: {
              enabled: true,
              text_en: 'Free delivery on orders over 150 SAR! Code: FREESHIP',
              text_ar: 'توصيل مجاني للطلبات فوق 150 ريال! استخدم الكود: FREESHIP',
              bg_color: '#043927',
              text_color: '#FFFFFF',
            },
            has_unpublished_changes: false,
          },
          {
            setting_key: 'header_nav',
            value: {
              links: [
                { label_en: 'Home', label_ar: 'الرئيسية', href: '/' },
                { label_en: 'Categories', label_ar: 'الفئات', href: '/categories' },
                { label_en: 'Best Deals', label_ar: 'أفضل العروض', href: '/products?filter=deals' },
                { label_en: 'Groceries', label_ar: 'البقالة', href: '/products?category=groceries' },
                { label_en: 'Household', label_ar: 'المستلزمات', href: '/products?category=household' },
              ],
            },
            draft_value: {
              links: [
                { label_en: 'Home', label_ar: 'الرئيسية', href: '/' },
                { label_en: 'Categories', label_ar: 'الفئات', href: '/categories' },
                { label_en: 'Best Deals', label_ar: 'أفضل العروض', href: '/products?filter=deals' },
                { label_en: 'Groceries', label_ar: 'البقالة', href: '/products?category=groceries' },
                { label_en: 'Household', label_ar: 'المستلزمات', href: '/products?category=household' },
              ],
            },
            has_unpublished_changes: false,
          },
          {
            setting_key: 'footer_config',
            value: {
              company_name: 'Falcon Supermarket',
              phone: '+966 50 000 0001',
              email: 'support@falcon.sa',
              address_en: 'Riyadh, Saudi Arabia',
              address_ar: 'الرياض، المملكة العربية السعودية',
              social_links: {
                twitter: 'https://twitter.com',
                instagram: 'https://instagram.com',
                facebook: 'https://facebook.com',
              },
            },
            draft_value: {
              company_name: 'Falcon Supermarket',
              phone: '+966 50 000 0001',
              email: 'support@falcon.sa',
              address_en: 'Riyadh, Saudi Arabia',
              address_ar: 'الرياض، المملكة العربية السعودية',
              social_links: {
                twitter: 'https://twitter.com',
                instagram: 'https://instagram.com',
                facebook: 'https://facebook.com',
              },
            },
            has_unpublished_changes: false,
          },
        ]);
        logger.info('✓ Default Header & Footer CMS settings seeded successfully.');
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
