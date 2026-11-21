const { sequelize, Order } = require('../models');

async function migrate() {
  try {
    const currentSchema = process.env.SCHEMA;
    const tablePrefix = currentSchema ? `"${currentSchema}".` : '';

    console.log(`Checking 'orders' table in schema '${currentSchema || 'public'}'...`);
    
    // Add tip_amount column if not exists
    await sequelize.query(`
      ALTER TABLE ${tablePrefix}"orders" 
      ADD COLUMN IF NOT EXISTS "tip_amount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
    `);

    console.log('✅ Column "tip_amount" added/verified in "orders" table successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
