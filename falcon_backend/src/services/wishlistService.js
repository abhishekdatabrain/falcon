const { Wishlist, Product, ProductImage, ProductVariant, Category } = require('../models');
const { Op } = require('sequelize');

class WishlistService {
  async getUserWishlist(userId, query = {}) {
    const { filter = 'ALL', sortBy = 'RECENT' } = query;

    // 1. Get all wishlist items for this user
    const items = await Wishlist.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    const productIds = items.map(i => i.product_id);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validProductIds = productIds.filter(id => typeof id === 'string' && UUID_REGEX.test(id));

    if (validProductIds.length === 0) {
      return {
        productIds,
        products: [],
        counts: {
          total: productIds.length,
          inStock: 0,
          deals: 0,
          organic: 0,
        },
      };
    }

    // 2. Fetch all wishlist products to calculate real counts accurately on server
    let inStockCount = 0;
    let dealsCount = 0;
    let organicCount = 0;

    try {
      const allWishlistProducts = await Product.findAll({
        where: { id: { [Op.in]: validProductIds } },
        attributes: ['id', 'stock_quantity', 'is_available', 'price', 'discount_price', 'is_best_deal', 'name_en', 'description_en']
      });

      inStockCount = allWishlistProducts.filter(p => (Number(p.stock_quantity) > 0) && p.is_available !== false).length;
      dealsCount = allWishlistProducts.filter(p => p.is_best_deal || (p.discount_price !== null && Number(p.discount_price) < Number(p.price))).length;
      organicCount = allWishlistProducts.filter(p => 
        (p.name_en && p.name_en.toLowerCase().includes('organic')) ||
        (p.description_en && p.description_en.toLowerCase().includes('organic'))
      ).length;
    } catch (countErr) {
      console.warn('Error counting wishlist facets:', countErr.message);
    }

    // 3. Build product where clause for the requested filter
    const productWhere = {
      id: { [Op.in]: validProductIds },
    };

    if (filter === 'IN_STOCK') {
      productWhere.stock_quantity = { [Op.gt]: 0 };
      productWhere.is_available = true;
    } else if (filter === 'DEALS') {
      productWhere[Op.or] = [
        { is_best_deal: true },
        {
          discount_price: {
            [Op.ne]: null,
          }
        }
      ];
    } else if (filter === 'ORGANIC') {
      productWhere[Op.or] = [
        { name_en: { [Op.iLike]: '%organic%' } },
        { description_en: { [Op.iLike]: '%organic%' } }
      ];
    }

    // 4. Build order clause
    let orderClause = [];
    if (sortBy === 'PRICE_LOW') {
      orderClause = [['price', 'ASC']];
    } else if (sortBy === 'PRICE_HIGH') {
      orderClause = [['price', 'DESC']];
    } else if (sortBy === 'RATING') {
      orderClause = [['rating', 'DESC']];
    } else if (sortBy === 'NAME_ASC') {
      orderClause = [['name_en', 'ASC']];
    } else if (sortBy === 'NAME_DESC') {
      orderClause = [['name_en', 'DESC']];
    }

    // 5. Query the filtered and sorted products
    let products = [];
    try {
      const foundProducts = await Product.findAll({
        where: productWhere,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
          { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary', 'display_order'] },
          { model: ProductVariant, as: 'variants' }
        ],
        ...(orderClause.length > 0 ? { order: orderClause } : {})
      });

      products = foundProducts;

      // Extra in-memory validation for deals (discount_price < price)
      if (filter === 'DEALS') {
        products = products.filter(p => p.is_best_deal || (p.discount_price !== null && Number(p.discount_price) < Number(p.price)));
      }

      // If RECENT, preserve wishlist created_at DESC order
      if (sortBy === 'RECENT' || !sortBy) {
        const productMap = new Map(products.map(p => [String(p.id), p]));
        products = productIds.map(id => productMap.get(String(id))).filter(Boolean);
      }
    } catch (err) {
      console.error('Error fetching server-filtered wishlist products:', err.message);
    }

    return {
      productIds,
      products,
      counts: {
        total: productIds.length,
        inStock: inStockCount,
        deals: dealsCount,
        organic: organicCount
      }
    };
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
