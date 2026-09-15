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

    // Sync database models in development mode
    if (process.env.NODE_ENV === 'development') {
      if (process.env.SCHEMA) {
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${process.env.SCHEMA}";`);
      }
      try {
        await sequelize.sync();
        logger.info('Database models synchronized successfully.');
      } catch (syncErr) {
        logger.warn('Sequelize sync warning: %s', syncErr.message);
      }
      
      const seedInitialData = require('./src/seeders/seedInitialData');
      await seedInitialData();
    }

    server.listen(PORT, () => {
      logger.info(`Single Vendor E-Commerce REST API & Socket server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server: %o', error);
    process.exit(1);
  }
};

startServer();
