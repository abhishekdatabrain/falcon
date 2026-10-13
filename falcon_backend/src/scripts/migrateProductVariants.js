require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function migrateProductVariants() {
  const schema = process.env.SCHEMA || 'Abhishek';
  console.log(`Migrating product variants in schema: ${schema}`);

  const queries = [
    // 1. Add has_variants to products table
    `ALTER TABLE "${schema}"."products" ADD COLUMN IF NOT EXISTS "has_variants" BOOLEAN DEFAULT FALSE;`,

    // 2. Create product_variants table
    `CREATE TABLE IF NOT EXISTS "${schema}"."product_variants" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "product_id" UUID NOT NULL REFERENCES "${schema}"."products"("id") ON DELETE CASCADE,
      "sku" VARCHAR(255) NOT NULL UNIQUE,
      "unit_value" VARCHAR(100),
      "unit_type" VARCHAR(50),
      "pack_size" VARCHAR(100),
      "price" DECIMAL(10, 2) NOT NULL,
      "discount_price" DECIMAL(10, 2),
      "stock_quantity" INTEGER NOT NULL DEFAULT 0,
      "image_url" TEXT,
      "is_active" BOOLEAN DEFAULT TRUE,
      "created_at" TIMESTAMPTZ DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 3. Create indexes on product_variants
    `CREATE INDEX IF NOT EXISTS "idx_product_variants_product_id" ON "${schema}"."product_variants" ("product_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_product_variants_sku" ON "${schema}"."product_variants" ("sku");`,

    // 4. Add variant_id to cart_items table
    `ALTER TABLE "${schema}"."cart_items" ADD COLUMN IF NOT EXISTS "variant_id" UUID REFERENCES "${schema}"."product_variants"("id") ON DELETE CASCADE;`,
    `CREATE INDEX IF NOT EXISTS "idx_cart_items_variant_id" ON "${schema}"."cart_items" ("variant_id");`,

    // 5. Add variant_id to order_items table
    `ALTER TABLE "${schema}"."order_items" ADD COLUMN IF NOT EXISTS "variant_id" UUID REFERENCES "${schema}"."product_variants"("id") ON DELETE SET NULL;`,
    `CREATE INDEX IF NOT EXISTS "idx_order_items_variant_id" ON "${schema}"."order_items" ("variant_id");`
  ];

  for (const q of queries) {
    try {
      await sequelize.query(q);
      console.log('Executed query successfully.');
    } catch (e) {
      console.error('Query error:', e.message);
      throw e;
    }
  }

  console.log('Product variants migration finished successfully.');
  process.exit(0);
}

migrateProductVariants().catch((err) => {
  console.error('Product variants migration failed:', err);
  process.exit(1);
});
