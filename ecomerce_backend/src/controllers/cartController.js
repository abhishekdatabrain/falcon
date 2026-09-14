const cartService = require('../services/cartService');
const { sendSuccess, sendError } = require('../utils/response');

class CartController {
  async getCart(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const totals = await cartService.calculateCartTotals(customerId);
      return sendSuccess(res, 'Cart retrieved', totals);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async addItem(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { productId, quantity } = req.body;
      if (!productId) {
        return sendError(res, 'productId is required', [], 400);
      }

      await cartService.addItemToCart(customerId, productId, quantity ? parseInt(quantity, 10) : 1);
      const totals = await cartService.calculateCartTotals(customerId);
      return sendSuccess(res, 'Item added to cart', totals);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateItem(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined) {
        return sendError(res, 'quantity is required', [], 400);
      }

      await cartService.updateCartItemQuantity(customerId, itemId, parseInt(quantity, 10));
      const totals = await cartService.calculateCartTotals(customerId);
      return sendSuccess(res, 'Cart item updated', totals);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async removeItem(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { itemId } = req.params;
      await cartService.removeItemFromCart(customerId, itemId);
      const totals = await cartService.calculateCartTotals(customerId);
      return sendSuccess(res, 'Item removed from cart', totals);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async clearCart(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      await cartService.clearCart(customerId);
      const totals = await cartService.calculateCartTotals(customerId);
      return sendSuccess(res, 'Cart cleared', totals);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new CartController();
