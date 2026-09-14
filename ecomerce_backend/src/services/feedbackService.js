const { Feedback, Order, Customer, User } = require('../models');
const { ORDER_STATUS } = require('../constants/orderStatus');

class FeedbackService {
  async submitFeedback(orderId, customerId, rating, comment = '') {
    const order = await Order.findOne({
      where: { id: orderId, customer_id: customerId },
    });

    if (!order) {
      throw new Error('Order not found or does not belong to customer');
    }

    if (order.order_status !== ORDER_STATUS.DELIVERED) {
      throw new Error('Feedback can only be submitted after successful delivery');
    }

    const existingFeedback = await Feedback.findOne({ where: { order_id: orderId } });
    if (existingFeedback) {
      throw new Error('Feedback has already been submitted for this order');
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    return await Feedback.create({
      order_id: orderId,
      customer_id: customerId,
      rating: ratingNum,
      comment,
    });
  }

  async getAllFeedbackAdmin() {
    return await Feedback.findAll({
      include: [
        { model: Order, as: 'order', attributes: ['id', 'order_number'] },
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new FeedbackService();
