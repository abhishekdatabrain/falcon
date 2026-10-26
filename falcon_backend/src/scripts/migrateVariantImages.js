const { sequelize, ProductVariant, ProductVariantImage } = require('../models');
const { Op } = require('sequelize');

async function migrateVariantImages() {
  try {
    // 1. Sync ProductVariantImage model to ensure table exists
    await ProductVariantImage.sync({ alter: true });
    console.log('[Migration] product_variant_images table synchronized successfully.');

    // 2. Find variants with image_url
    const variantsWithImage = await ProductVariant.findAll({
      where: {
        image_url: {
          [Op.ne]: null,
          [Op.ne]: '',
        },
      },
    });

    console.log(`[Migration] Found ${variantsWithImage.length} variants with legacy image_url.`);

    let migratedCount = 0;
    for (const variant of variantsWithImage) {
      const existingImages = await ProductVariantImage.count({
        where: { variant_id: variant.id },
      });

      if (existingImages === 0 && variant.image_url) {
        await ProductVariantImage.create({
          variant_id: variant.id,
          image_url: variant.image_url,
          is_primary: true,
          sort_order: 0,
        });
        migratedCount++;
      }
    }

    console.log(`[Migration] Successfully migrated ${migratedCount} legacy variant images into product_variant_images table.`);
    return true;
  } catch (error) {
    console.error('[Migration] Failed to migrate variant images:', error);
    return false;
  }
}

if (require.main === module) {
  migrateVariantImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrateVariantImages };
