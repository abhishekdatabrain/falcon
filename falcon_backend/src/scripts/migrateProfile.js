const sequelize = require('../config/database');

async function migrate() {
  console.log('Running customer profile migration...');
  await sequelize.query('ALTER TABLE "Abhishek"."customers" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;');
  await sequelize.query('ALTER TABLE "Abhishek"."customers" ADD COLUMN IF NOT EXISTS "dob" VARCHAR(50);');
  await sequelize.query('ALTER TABLE "Abhishek"."customers" ADD COLUMN IF NOT EXISTS "gender" VARCHAR(50);');
  await sequelize.query('ALTER TABLE "Abhishek"."customers" ADD COLUMN IF NOT EXISTS "national_id" VARCHAR(50);');
  await sequelize.query('ALTER TABLE "Abhishek"."customers" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT \'{}\'::jsonb;');
  console.log('Customer profile columns successfully added or already exist.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
