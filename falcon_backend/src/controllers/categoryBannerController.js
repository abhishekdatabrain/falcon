const { HomepageSetting } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const DEFAULT_BANNER = {
  enabled: true,
  title_en: 'Fresh Farm Fruits & Groceries',
  title_ar: 'فواكه وخضروات طازجة من المزرعة',
  badge1_en: '100% FARM FRESH',
  badge1_ar: 'طازج 100% من المزرعة',
  badge2_en: 'BEST PRICE GUARANTEED',
  badge2_ar: 'أفضل سعر مضمون',
  desc_en: 'Hand-picked 100% certified fresh farm produce, fruits, herbs and whole foods for your daily nutrition. Direct farm-to-table for your family\'s health.',
  desc_ar: 'منتجات مزارع طازجة منتقاة بعناية وموثقة 100٪ للتغذية اليومية لعائلتك، مباشرة من المزرعة إلى مائدتك.',
  image_url: '/banners/farm_fresh_produce.jpg',
  image_badge_en: '🌿 Farm Fresh Produce',
  image_badge_ar: '🌿 منتجات مزارع طازجة',
  bg_color: '#043927',
  category_overrides: {},
};

class CategoryBannerController {
  // Public Endpoint: GET /api/v1/category-banner
  async getBanner(req, res) {
    try {
      const record = await HomepageSetting.findOne({
        where: { setting_key: 'category_hero_banner' },
      });

      if (!record || !record.value || Object.keys(record.value).length === 0) {
        return sendSuccess(res, 'Default category hero banner configuration', {
          banner: DEFAULT_BANNER,
        });
      }

      const bannerData = {
        ...DEFAULT_BANNER,
        ...record.value,
      };

      return sendSuccess(res, 'Category hero banner configuration retrieved', {
        banner: bannerData,
      });
    } catch (error) {
      console.error('Error fetching category banner:', error);
      return sendError(res, error.message || 'Failed to fetch category banner', [], 500);
    }
  }

  // Admin Endpoint: PUT /api/v1/category-banner
  async updateBanner(req, res) {
    try {
      const bannerPayload = req.body.banner || req.body;
      if (!bannerPayload || typeof bannerPayload !== 'object') {
        return sendError(res, 'Invalid banner payload', [], 400);
      }

      let record = await HomepageSetting.findOne({
        where: { setting_key: 'category_hero_banner' },
      });

      const updatedValue = {
        ...DEFAULT_BANNER,
        ...(record ? record.value : {}),
        ...bannerPayload,
      };

      if (!record) {
        record = await HomepageSetting.create({
          setting_key: 'category_hero_banner',
          value: updatedValue,
          draft_value: updatedValue,
          has_unpublished_changes: false,
        });
      } else {
        record.value = updatedValue;
        record.draft_value = updatedValue;
        record.has_unpublished_changes = false;
        await record.save();
      }

      return sendSuccess(res, 'Category hero banner updated successfully', {
        banner: record.value,
      });
    } catch (error) {
      console.error('Error updating category banner:', error);
      return sendError(res, error.message || 'Failed to update category banner', [], 500);
    }
  }
}

module.exports = new CategoryBannerController();
