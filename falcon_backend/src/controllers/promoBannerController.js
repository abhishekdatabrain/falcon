const { PromoBanner } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

class PromoBannerController {
  // Public endpoint: GET /api/v1/promo-banners
  async getActiveBanners(req, res) {
    try {
      const banners = await PromoBanner.findAll({
        where: { is_active: true },
        order: [['order_index', 'ASC'], ['id', 'ASC']],
      });
      return sendSuccess(res, 'Active promo banners retrieved', { banners });
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch promo banners', [], 500);
    }
  }

  // Admin endpoint: GET /api/v1/promo-banners/admin/all
  async getAllBanners(req, res) {
    try {
      const banners = await PromoBanner.findAll({
        order: [['order_index', 'ASC'], ['id', 'ASC']],
      });
      return sendSuccess(res, 'All promo banners retrieved', { banners });
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch promo banners', [], 500);
    }
  }

  // Admin endpoint: POST /api/v1/promo-banners
  async createBanner(req, res) {
    try {
      const {
        title_en,
        title_ar,
        desc_en,
        desc_ar,
        btn_text_en,
        btn_text_ar,
        btn_link,
        image_url,
        bg_color,
        order_index,
        is_active,
      } = req.body;

      let finalImageUrl = image_url;
      if (req.file) {
        finalImageUrl = `/uploads/${req.file.filename}`;
      }

      if (!finalImageUrl) {
        return sendError(res, 'Image URL or uploaded file is required', [], 400);
      }

      const banner = await PromoBanner.create({
        title_en: title_en || 'Everyday groceries, made easy!',
        title_ar: title_ar || 'البقالة اليومية، بأسهل طريقة!',
        desc_en: desc_en || '',
        desc_ar: desc_ar || '',
        btn_text_en: btn_text_en || 'Order Now',
        btn_text_ar: btn_text_ar || 'اطلب الآن',
        btn_link: btn_link || '/products',
        image_url: finalImageUrl,
        bg_color: bg_color || '#F5BF38',
        order_index: order_index !== undefined ? parseInt(order_index) : 0,
        is_active: is_active !== undefined ? (is_active === true || is_active === 'true') : true,
      });

      return sendSuccess(res, 'Promo banner created successfully', { banner }, 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to create promo banner', [], 500);
    }
  }

  // Admin endpoint: PUT /api/v1/promo-banners/:id
  async updateBanner(req, res) {
    try {
      const { id } = req.params;
      const banner = await PromoBanner.findByPk(id);
      if (!banner) {
        return sendError(res, 'Promo banner not found', [], 404);
      }

      const {
        title_en,
        title_ar,
        desc_en,
        desc_ar,
        btn_text_en,
        btn_text_ar,
        btn_link,
        image_url,
        bg_color,
        order_index,
        is_active,
      } = req.body;

      if (req.file) {
        banner.image_url = `/uploads/${req.file.filename}`;
      } else if (image_url) {
        banner.image_url = image_url;
      }

      if (title_en !== undefined) banner.title_en = title_en;
      if (title_ar !== undefined) banner.title_ar = title_ar;
      if (desc_en !== undefined) banner.desc_en = desc_en;
      if (desc_ar !== undefined) banner.desc_ar = desc_ar;
      if (btn_text_en !== undefined) banner.btn_text_en = btn_text_en;
      if (btn_text_ar !== undefined) banner.btn_text_ar = btn_text_ar;
      if (btn_link !== undefined) banner.btn_link = btn_link;
      if (bg_color !== undefined) banner.bg_color = bg_color;
      if (order_index !== undefined) banner.order_index = parseInt(order_index);
      if (is_active !== undefined) banner.is_active = is_active === true || is_active === 'true';

      await banner.save();
      return sendSuccess(res, 'Promo banner updated successfully', { banner });
    } catch (error) {
      return sendError(res, error.message || 'Failed to update promo banner', [], 500);
    }
  }

  // Admin endpoint: DELETE /api/v1/promo-banners/:id
  async deleteBanner(req, res) {
    try {
      const { id } = req.params;
      const banner = await PromoBanner.findByPk(id);
      if (!banner) {
        return sendError(res, 'Promo banner not found', [], 404);
      }
      await banner.destroy();
      return sendSuccess(res, 'Promo banner deleted successfully', { id });
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete promo banner', [], 500);
    }
  }
}

module.exports = new PromoBannerController();
