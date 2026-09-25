const productService = require('../services/productService');
const { sendSuccess, sendError } = require('../utils/response');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const onlyActive = req.query.onlyActive === 'false' ? false : (req.user ? req.user.role !== 'ADMIN' : true);
      const result = await productService.getProducts({ ...req.query, onlyActive });
      return sendSuccess(res, 'Products retrieved', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return sendSuccess(res, 'Product details retrieved', { product });
    } catch (error) {
      return sendError(res, error.message, [], 404);
    }
  }

  async createProduct(req, res, next) {
    try {
      const { category_id, sku, name_en, name_ar, price } = req.body;
      if (!category_id || !sku || !name_en || !name_ar || price === undefined) {
        return sendError(res, 'Category, SKU, English & Arabic names, and price are required', [], 400);
      }
      const product = await productService.createProduct(req.body);
      return sendSuccess(res, 'Product created successfully', { product }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, 'Product updated successfully', { product });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return sendSuccess(res, 'Product deleted successfully');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new ProductController();
