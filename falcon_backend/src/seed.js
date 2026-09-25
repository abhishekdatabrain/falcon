const { sequelize, User, Admin, Driver, Customer } = require('./models');
const { hashPassword } = require('./utils/password');
const ROLES = require('./constants/roles');
const { DRIVER_STATUS, DRIVER_AVAILABILITY } = require('./constants/driverStatus');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    // 1. Seed Admin
    let adminUser = await User.findOne({ where: { role: ROLES.ADMIN } });
    if (!adminUser) {
      console.log('Creating default Admin account...');
      const adminPassHash = await hashPassword('Admin@123');
      adminUser = await User.create({
        email: 'admin@gmail.com',
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
      console.log('✓ Default Admin created: admin@platform.com / Admin@123456');
    } else {
      console.log('✓ Admin account already exists in DB.');
    }

    // 2. Seed Drivers
    let driverCount = await Driver.count();
    if (driverCount === 0) {
      console.log('Creating default Driver accounts...');
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

      const driver2User = await User.create({
        email: 'driver2@platform.com',
        mobile: '+966550000003',
        password_hash: driverPassHash,
        role: ROLES.DRIVER,
        status: 'ACTIVE',
      });

      await Driver.create({
        user_id: driver2User.id,
        license_number: 'SA-DL-123456789',
        vehicle_details: 'Isuzu D-Max 2023 (Silver) - License Plate 8765-KSA',
        driver_status: DRIVER_STATUS.ACTIVE,
        availability_status: DRIVER_AVAILABILITY.AVAILABLE,
      });
      console.log('✓ Default Drivers created: driver1@platform.com / Driver@123456');
    } else {
      console.log('✓ Driver accounts already exist in DB.');
    }

    // 3. Seed Customer
    let customerCount = await Customer.count();
    if (customerCount === 0) {
      console.log('Creating default Customer account...');
      const customerPassHash = await hashPassword('Customer@123456');

      const customerUser = await User.create({
        email: 'customer@platform.com',
        mobile: '+966500000004',
        password_hash: customerPassHash,
        role: ROLES.CUSTOMER,
        status: 'ACTIVE',
      });

      await Customer.create({
        user_id: customerUser.id,
        first_name: 'Demo',
        last_name: 'Customer',
      });
      console.log('✓ Default Customer created: customer@platform.com / Customer@123456');
    } else {
      console.log('✓ Customer account already exists in DB.');
    }

    console.log('\n==================================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('==================================================');
    console.log('ADMIN LOGIN CREDENTIALS:');
    console.log('Email:    admin@platform.com');
    console.log('Password: Admin@123456');
    console.log('--------------------------------------------------');
    console.log('DRIVER LOGIN CREDENTIALS:');
    console.log('Email:    driver1@platform.com (or driver2@platform.com)');
    console.log('Password: Driver@123456');
    console.log('--------------------------------------------------');
    console.log('CUSTOMER LOGIN CREDENTIALS:');
    console.log('Email:    customer@platform.com');
    console.log('Password: Customer@123456');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
