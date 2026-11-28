const productService = require('../services/productService');
const { sendSuccess, sendError } = require('../utils/response');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const hasExplicitStatus = req.query.status !== undefined || req.query.is_active !== undefined;
      const onlyActive = hasExplicitStatus
        ? false
        : (req.query.onlyActive === 'false' ? false : (req.user ? req.user.role !== 'ADMIN' : true));
      const result = await productService.getProducts({ ...req.query, onlyActive });
      return sendSuccess(res, 'Products retrieved', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async searchProducts(req, res, next) {
    try {
      const { q = '', limit = 8 } = req.query;
      const result = await productService.searchProducts({ q, limit });
      return sendSuccess(res, 'Search results retrieved', result);
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
      const { category_id, sku, name_en, name_ar, price, has_variants, variants } = req.body;
      const hasValidPrice = (price !== undefined && price !== '') || (Boolean(has_variants) && Array.isArray(variants) && variants.length > 0 && variants[0]?.price !== undefined);
      if (!category_id || !sku || !name_en || !name_ar || !hasValidPrice) {
        return sendError(res, 'Category, SKU, English & Arabic names, and price (or variant prices) are required', [], 400);
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

  async adjustStock(req, res, next) {
    try {
      const result = await productService.adjustStock(req.params.id, {
        ...req.body,
        user_id: req.user ? req.user.email || req.user.id : 'Admin',
      });
      return sendSuccess(res, 'Stock adjusted successfully', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getStockLogs(req, res, next) {
    try {
      const logs = await productService.getStockLogs(req.params.id);
      return sendSuccess(res, 'Stock logs retrieved', { logs });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async exportProducts(req, res, next) {
    try {
      const hasExplicitStatus = req.query.status !== undefined || req.query.is_active !== undefined;
      const onlyActive = hasExplicitStatus
        ? false
        : (req.query.onlyActive === 'false' ? false : false);

      const { buffer, total } = await productService.exportProductsToExcel({
        ...req.query,
        onlyActive,
      });

      if (!buffer || total === 0) {
        return sendError(res, 'No products found matching the selected filters to export', [], 404);
      }

      const today = new Date().toISOString().split('T')[0];
      const filename = `SaqrCart_Products_${today}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (error) {
      return sendError(res, error.message || 'Failed to export products to Excel', [], 500);
    }
  }
}

module.exports = new ProductController();
