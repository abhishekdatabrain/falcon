const paymentService = require('../services/paymentService');
const { sendSuccess, sendError } = require('../utils/response');

class PaymentController {
  async submitPayment(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { orderId, bankName, paymentReference } = req.body;

      if (!orderId || !bankName || !paymentReference) {
        return sendError(res, 'Order ID, Bank Name, and Payment Reference are required', [], 400);
      }

      if (!req.file) {
        return sendError(res, 'Payment proof document / image upload is required', [], 400);
      }

      const proofFileUrl = `/uploads/${req.file.filename}`;
      const payment = await paymentService.submitPaymentConfirmation(
        orderId,
        customerId,
        bankName,
        paymentReference,
        proofFileUrl
      );

      return sendSuccess(res, 'Payment confirmation submitted for Admin verification', { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getPendingPaymentsAdmin(req, res, next) {
    try {
      const payments = await paymentService.getPendingPaymentsAdmin();
      return sendSuccess(res, 'Pending payments retrieved', { payments });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async verifyPaymentAdmin(req, res, next) {
    try {
      const adminId = req.user.admin.id;
      const { paymentId } = req.params;
      const payment = await paymentService.verifyPayment(paymentId, adminId);
      return sendSuccess(res, 'Payment verified successfully. Order ready for driver assignment.', { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async rejectPaymentAdmin(req, res, next) {
    try {
      const adminId = req.user.admin.id;
      const { paymentId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return sendError(res, 'Rejection reason is required', [], 400);
      }

      const payment = await paymentService.rejectPayment(paymentId, adminId, rejectionReason);
      return sendSuccess(res, 'Payment rejected', { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new PaymentController();
