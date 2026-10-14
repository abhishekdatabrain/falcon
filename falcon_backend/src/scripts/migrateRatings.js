require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function migrateRatings() {
  const schema = process.env.SCHEMA || 'Abhishek';
  console.log(`Migrating product ratings in schema: ${schema}`);

  const queries = [
    // 1. Add rating to products table (DECIMAL 3, 1) default 4.8
    `ALTER TABLE "${schema}"."products" ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3, 1) DEFAULT 4.8;`,

    // 2. Add reviews_count to products table (INTEGER) default 120
    `ALTER TABLE "${schema}"."products" ADD COLUMN IF NOT EXISTS "reviews_count" INTEGER DEFAULT 120;`,

    // 3. Create index on rating
    `CREATE INDEX IF NOT EXISTS "idx_products_rating" ON "${schema}"."products" ("rating");`
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

  // 4. Update existing products with diverse ratings and reviews if needed
  try {
    const [products] = await sequelize.query(`SELECT id, name_en, rating, reviews_count FROM "${schema}"."products" ORDER BY created_at ASC;`);
    console.log(`Found ${products.length} existing products.`);

    const sampleRatings = [
      { rating: 4.9, reviews: 1420 },
      { rating: 4.8, reviews: 856 },
      { rating: 4.7, reviews: 342 },
      { rating: 5.0, reviews: 420 },
      { rating: 4.9, reviews: 1120 },
      { rating: 4.8, reviews: 630 },
      { rating: 4.6, reviews: 215 },
    ];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const sample = sampleRatings[i % sampleRatings.length];
      const targetRating = sample.rating;
      const targetReviews = sample.reviews;

      await sequelize.query(
        `UPDATE "${schema}"."products" SET "rating" = :rating, "reviews_count" = :reviews WHERE "id" = :id;`,
        {
          replacements: {
            rating: targetRating,
            reviews: targetReviews,
            id: p.id,
          }
        }
      );
      console.log(`Product "${p.name_en}" updated with Rating: ${targetRating}, Reviews: ${targetReviews}`);
    }
  } catch (updateErr) {
    console.error('Error updating existing products:', updateErr.message);
  }

  console.log('Product ratings migration finished successfully.');
  process.exit(0);
}

migrateRatings().catch((err) => {
  console.error('Product ratings migration failed:', err);
  process.exit(1);
});
