const { Wishlist } = require('../models');

class WishlistService {
  async getUserWishlist(userId) {
    const items = await Wishlist.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    return items.map(i => i.product_id);
  }

  async toggleWishlist(userId, productId) {
    if (!productId) throw new Error('Product ID is required');

    const existing = await Wishlist.findOne({
      where: { user_id: userId, product_id: String(productId) },
    });

    if (existing) {
      await existing.destroy();
      return { added: false, productId: String(productId) };
    } else {
      await Wishlist.create({
        user_id: userId,
        product_id: String(productId),
      });
      return { added: true, productId: String(productId) };
    }
  }

  async removeFromWishlist(userId, productId) {
    const deleted = await Wishlist.destroy({
      where: { user_id: userId, product_id: String(productId) },
    });
    return { success: !!deleted, productId: String(productId) };
  }
}

module.exports = new WishlistService();
