const { Feedback, Order, OrderItem, Product, Customer, User, sequelize } = require('../models');

class FeedbackService {
  /**
   * Submit or update a rating & review for an order item
   */
  async submitFeedback(orderId, customerId, rating, comment = '', productId = null, orderItemId = null) {
    // 1. Verify order belongs to customer (verified purchaser check)
    const order = await Order.findOne({
      where: { id: orderId, customer_id: customerId },
      include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
      throw new Error('Order not found or does not belong to customer');
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    // 2. Identify the specific order item and parent product
    let targetOrderItem = null;
    if (orderItemId) {
      targetOrderItem = order.items.find(i => i.id === orderItemId);
    } else if (productId) {
      targetOrderItem = order.items.find(i => i.product_id === productId);
    } else if (order.items && order.items.length === 1) {
      targetOrderItem = order.items[0];
    }

    const targetProductId = targetOrderItem ? targetOrderItem.product_id : (productId || (order.items && order.items[0] && order.items[0].product_id));
    const targetOrderItemId = targetOrderItem ? targetOrderItem.id : (orderItemId || null);

    if (!targetProductId) {
      throw new Error('Product not found in this order');
    }

    // 3. Prevent duplicate reviews for the same order item
    let existingFeedback = null;
    if (targetOrderItemId) {
      existingFeedback = await Feedback.findOne({
        where: { customer_id: customerId, order_item_id: targetOrderItemId },
      });
    }

    if (!existingFeedback) {
      existingFeedback = await Feedback.findOne({
        where: { order_id: orderId, product_id: targetProductId },
      });
    }

    const previousRating = existingFeedback ? existingFeedback.rating : null;
    let savedFeedback;

    if (existingFeedback) {
      existingFeedback.rating = ratingNum;
      existingFeedback.comment = comment;
      if (targetOrderItemId) existingFeedback.order_item_id = targetOrderItemId;
      if (targetProductId) existingFeedback.product_id = targetProductId;
      savedFeedback = await existingFeedback.save();
    } else {
      savedFeedback = await Feedback.create({
        order_id: orderId,
        customer_id: customerId,
        order_item_id: targetOrderItemId,
        product_id: targetProductId,
        rating: ratingNum,
        comment,
      });
    }

    // 4. Dynamic Rating Calculation for Product
    // Formula: averageRating = SUM(all eligible ratings) / COUNT(all eligible ratings)
    // Round to 1 decimal place.
    const product = await Product.findByPk(targetProductId);
    let updatedProductData = null;

    if (product) {
      const stats = await Feedback.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalRatings'],
          [sequelize.fn('SUM', sequelize.col('rating')), 'sumRatings'],
        ],
        where: { product_id: targetProductId },
        raw: true,
      });

      const dbFeedbackCount = parseInt(stats[0]?.totalRatings || 0, 10);
      const dbSumRatings = parseFloat(stats[0]?.sumRatings || 0);

      const baselineCount = Math.max(0, parseInt(product.reviews_count || 0, 10) - (previousRating !== null ? 0 : 1));
      const baselineRating = parseFloat(product.rating || 5.0);

      let finalCount;
      let finalRating;

      if (baselineCount > dbFeedbackCount) {
        // Increment or adjust count and weighted average
        finalCount = baselineCount + (previousRating !== null ? 0 : 1);
        const currentTotalScore = (baselineRating * baselineCount) + (previousRating !== null ? (ratingNum - previousRating) : ratingNum);
        finalRating = Math.round((currentTotalScore / Math.max(1, finalCount)) * 10) / 10;
      } else {
        // Pure feedback table calculation: SUM / COUNT
        finalCount = dbFeedbackCount;
        finalRating = dbFeedbackCount > 0 ? Math.round((dbSumRatings / dbFeedbackCount) * 10) / 10 : null;
      }

      if (finalRating !== null) {
        finalRating = Math.min(5.0, Math.max(1.0, finalRating));
      }

      await product.update({
        rating: finalRating,
        reviews_count: finalCount,
      });

      updatedProductData = {
        id: product.id,
        rating: finalRating,
        reviews_count: finalCount,
      };
    }

    return {
      feedback: savedFeedback,
      product: updatedProductData,
    };
  }

  async getFeedbackByOrderId(orderId, customerId) {
    const where = { order_id: orderId };
    if (customerId) where.customer_id = customerId;
    const feedbacks = await Feedback.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name_en', 'name_ar', 'rating', 'reviews_count'] },
      ],
    });
    return {
      feedbacks,
      feedback: feedbacks[0] || null,
    };
  }

  async getAllFeedbackAdmin() {
    return await Feedback.findAll({
      include: [
        { model: Order, as: 'order', attributes: ['id', 'order_number'] },
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Product, as: 'product', attributes: ['id', 'name_en', 'name_ar'] },
        { model: OrderItem, as: 'order_item', attributes: ['id', 'product_name_en', 'quantity'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new FeedbackService();
