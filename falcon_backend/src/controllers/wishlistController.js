const wishlistService = require('../services/wishlistService');
const { sendSuccess, sendError } = require('../utils/response');

class WishlistController {
  async getWishlist(req, res) {
    try {
      const result = await wishlistService.getUserWishlist(req.user.id, req.query);
      return sendSuccess(res, 'Wishlist retrieved', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async toggleWishlist(req, res) {
    try {
      const { productId } = req.body;
      const result = await wishlistService.toggleWishlist(req.user.id, productId);
      return sendSuccess(res, result.added ? 'Added to wishlist' : 'Removed from wishlist', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async removeFromWishlist(req, res) {
    try {
      const { productId } = req.params;
      const result = await wishlistService.removeFromWishlist(req.user.id, productId);
      return sendSuccess(res, 'Item removed from wishlist', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new WishlistController();
