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
    // try {
    //   if (process.env.SCHEMA) {
    //     await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${process.env.SCHEMA}";`);
    //   }
    //   await sequelize.query('ALTER TABLE Abhishek.products ADD COLUMN IF NOT EXISTS unit VARCHAR(255) DEFAULT \'PCS\';');
    //   await sequelize.sync({ alter: true });
    //   logger.info('Database models synchronized successfully.');
    // } catch (syncErr) {
    //   logger.warn('Sequelize sync warning: %s', syncErr.message);
    // }

    server.listen(PORT, () => {
      logger.info(`Single Vendor E-Commerce REST API & Socket server active on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server: %o', error);
    process.exit(1);
  }
};

startServer();
