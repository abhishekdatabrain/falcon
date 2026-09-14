const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'singlevendor_ecommerce';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'admin123';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const schema = process.env.SCHEMA;

const dialectOptions = process.env.NODE_ENV === 'production'
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

if (schema) {
  dialectOptions.searchPath = schema;
}

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions,
  schema: schema || '',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
