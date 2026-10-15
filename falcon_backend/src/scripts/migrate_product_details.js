const { sequelize } = require('../models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected.');

    const schema = process.env.SCHEMA ? `"${process.env.SCHEMA}"` : 'public';
    const tableName = `${schema}."products"`;

    const queries = [
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS description_title_en VARCHAR(255);`,
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS description_title_ar VARCHAR(255);`,
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS long_description_en TEXT;`,
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS long_description_ar TEXT;`,
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS nutrition_facts JSONB DEFAULT '{}'::jsonb;`
    ];

    for (const q of queries) {
      console.log('Running query:', q);
      await sequelize.query(q);
    }

    console.log('Migration completed successfully on schema:', schema);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
