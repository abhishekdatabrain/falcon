const feedbackService = require('../services/feedbackService');
const { sendSuccess, sendError } = require('../utils/response');

class FeedbackController {
  async submitFeedback(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { orderId, rating, comment } = req.body;

      if (!orderId || rating === undefined) {
        return sendError(res, 'orderId and rating are required', [], 400);
      }

      const feedback = await feedbackService.submitFeedback(orderId, customerId, rating, comment);
      return sendSuccess(res, 'Feedback submitted successfully', { feedback }, 201);
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
