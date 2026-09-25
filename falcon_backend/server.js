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
      const { User, Admin, Driver } = require('./src/models');
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
