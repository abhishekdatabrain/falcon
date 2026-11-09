require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function fixUniqueOrderConstraint() {
  const schema = process.env.SCHEMA || 'Abhishek';
  const [constraints] = await sequelize.query(`
    SELECT conname, contype 
    FROM pg_constraint 
    WHERE conrelid = '"${schema}"."invoices"'::regclass;
  `);
  console.log('Current constraints on invoices:', constraints);

  for (const c of constraints) {
    if (c.conname.includes('order_id') && c.contype === 'u') {
      console.log('Dropping unique constraint on order_id:', c.conname);
      await sequelize.query(`ALTER TABLE "${schema}"."invoices" DROP CONSTRAINT IF EXISTS "${c.conname}";`);
    }
  }

  const [indexes] = await sequelize.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = '${schema}' AND tablename = 'invoices';
  `);

  for (const idx of indexes) {
    if (idx.indexname.includes('order_id') && idx.indexdef.includes('UNIQUE')) {
      console.log('Dropping unique index on order_id:', idx.indexname);
      await sequelize.query(`DROP INDEX IF EXISTS "${schema}"."${idx.indexname}";`);
    }
  }

  console.log('Order ID uniqueness constraint adjusted successfully.');
  process.exit(0);
}

fixUniqueOrderConstraint().catch(err => {
  console.error(err);
  process.exit(1);
});
