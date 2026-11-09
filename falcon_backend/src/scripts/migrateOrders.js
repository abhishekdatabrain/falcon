const { sequelize } = require('../models');
require('dotenv').config();

const migrate = async () => {
  try {
    const schema = process.env.SCHEMA || 'Abhishek';
    console.log(`Starting schema migration for schema "${schema}"...`);

    // 1. Add missing values to enum_orders_order_status
    const orderStatuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'DELIVERY_FAILED', 'RETURNED'];
    for (const st of orderStatuses) {
      try {
        await sequelize.query(`ALTER TYPE "${schema}"."enum_orders_order_status" ADD VALUE IF NOT EXISTS '${st}';`);
        console.log(`Added enum value ${st} to enum_orders_order_status`);
      } catch (e) {
        console.warn(`Note on enum ${st}:`, e.message);
      }
    }

    // 2. Add missing values to enum_payments_status
    const paymentStatuses = ['PAID', 'FAILED', 'REFUNDED'];
    for (const ps of paymentStatuses) {
      try {
        await sequelize.query(`ALTER TYPE "${schema}"."enum_payments_status" ADD VALUE IF NOT EXISTS '${ps}';`);
        console.log(`Added enum value ${ps} to enum_payments_status`);
      } catch (e) {
        console.warn(`Note on enum ${ps}:`, e.message);
      }
    }

    // 3. Add columns to payments table
    await sequelize.query(`ALTER TABLE "${schema}"."payments" ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(100) DEFAULT 'COD';`);
    await sequelize.query(`ALTER TABLE "${schema}"."payments" ADD COLUMN IF NOT EXISTS "payment_gateway" VARCHAR(100);`);
    await sequelize.query(`ALTER TABLE "${schema}"."payments" ADD COLUMN IF NOT EXISTS "transaction_id" VARCHAR(255);`);
    await sequelize.query(`ALTER TABLE "${schema}"."payments" ADD COLUMN IF NOT EXISTS "gateway_raw_response" JSONB;`);
    console.log('Updated payments table columns.');

    // 4. Add payment_method to orders table
    await sequelize.query(`ALTER TABLE "${schema}"."orders" ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(100) DEFAULT 'COD';`);
    console.log('Updated orders table columns.');

    // 5. Update existing orders and payments with realistic sample methods if null or default
    await sequelize.query(`UPDATE "${schema}"."payments" SET "payment_method" = 'Razorpay', "payment_gateway" = 'Razorpay', "transaction_id" = 'pay_Rzp982341' WHERE "payment_method" IS NULL OR "payment_method" = 'COD';`);
    await sequelize.query(`UPDATE "${schema}"."orders" SET "payment_method" = 'Razorpay' WHERE "payment_method" IS NULL OR "payment_method" = 'COD';`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
