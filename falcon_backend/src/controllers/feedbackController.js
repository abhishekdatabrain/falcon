const feedbackService = require('../services/feedbackService');
const { sendSuccess, sendError } = require('../utils/response');

class FeedbackController {
  async submitFeedback(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { orderId, orderItemId, productId, rating, comment } = req.body;

      if (!orderId || rating === undefined) {
        return sendError(res, 'orderId and rating are required', [], 400);
      }

      const result = await feedbackService.submitFeedback(orderId, customerId, rating, comment, productId, orderItemId);
      return sendSuccess(res, 'Feedback submitted successfully', result, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getFeedbackByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;
      const customerId = req.user?.customer?.id;
      const data = await feedbackService.getFeedbackByOrderId(orderId, customerId);
      return sendSuccess(res, 'Feedback retrieved', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAllFeedbackAdmin(req, res, next) {
    try {
      const feedbacks = await feedbackService.getAllFeedbackAdmin();
      return sendSuccess(res, 'Customer feedback retrieved', { feedbacks });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new FeedbackController();
