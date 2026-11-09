require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function migrateInvoices() {
  const schema = process.env.SCHEMA || 'Abhishek';
  console.log(`Migrating invoices table in schema: ${schema}`);

  const queries = [
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "invoice_type" VARCHAR(50) DEFAULT 'SIMPLIFIED';`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "zatca_status" VARCHAR(50) DEFAULT 'REPORTED';`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "invoice_counter" INTEGER DEFAULT 1;`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "invoice_hash" VARCHAR(128);`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "previous_invoice_hash" VARCHAR(128);`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "xml_file_url" VARCHAR(255);`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "original_invoice_id" UUID;`,
    `ALTER TABLE "${schema}"."invoices" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
  ];

  for (const q of queries) {
    try {
      await sequelize.query(q);
      console.log('Executed:', q.substring(0, 70));
    } catch (e) {
      console.error('Query error:', e.message);
    }
  }

  // Update existing invoices with reasonable defaults
  await sequelize.query(`
    UPDATE "${schema}"."invoices"
    SET
      "invoice_type" = COALESCE("invoice_type", 'SIMPLIFIED'),
      "zatca_status" = COALESCE("zatca_status", 'REPORTED'),
      "invoice_counter" = COALESCE("invoice_counter", 1)
    WHERE "invoice_type" IS NULL OR "zatca_status" IS NULL;
  `);

  console.log('Invoices table migration successfully finished.');
  process.exit(0);
}

migrateInvoices().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
