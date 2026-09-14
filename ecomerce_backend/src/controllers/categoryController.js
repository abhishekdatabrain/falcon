const categoryService = require('../services/categoryService');
const { sendSuccess, sendError } = require('../utils/response');

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const onlyActive = req.user ? req.user.role !== 'ADMIN' : true;
      const categories = await categoryService.getAllCategories(onlyActive);
      return sendSuccess(res, 'Categories retrieved', { categories });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getCategoryBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      return sendSuccess(res, 'Category details retrieved', { category });
    } catch (error) {
      return sendError(res, error.message, [], 404);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name_en, name_ar, slug, image_url, is_active, parent_id } = req.body;
      if (!name_en || !name_ar || !slug) {
        return sendError(res, 'English name, Arabic name, and slug are required', [], 400);
      }
      const category = await categoryService.createCategory({ name_en, name_ar, slug, image_url, is_active, parent_id });
      return sendSuccess(res, 'Category created successfully', { category }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return sendSuccess(res, 'Category updated successfully', { category });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return sendSuccess(res, 'Category deleted successfully');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new CategoryController();
