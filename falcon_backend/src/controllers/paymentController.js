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
      const adminId = req.user.admin ? req.user.admin.id : null;
      const userId = req.user.id;
      const { paymentId } = req.params;
      const options = req.body || {};
      const payment = await paymentService.verifyPayment(paymentId, adminId, userId, options);
      return sendSuccess(res, 'Payment verified successfully and marked as PAID.', { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async rejectPaymentAdmin(req, res, next) {
    try {
      const adminId = req.user.admin ? req.user.admin.id : null;
      const userId = req.user.id;
      const { paymentId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return sendError(res, 'Rejection reason is required', [], 400);
      }

      const payment = await paymentService.rejectPayment(paymentId, adminId, userId, rejectionReason);
      return sendSuccess(res, 'Payment marked as rejected/failed', { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async refundPaymentAdmin(req, res, next) {
    try {
      const adminId = req.user.admin ? req.user.admin.id : null;
      const userId = req.user.id;
      const { paymentId } = req.params;
      const { refundReason } = req.body;

      const payment = await paymentService.refundPayment(paymentId, adminId, userId, refundReason);
      return sendSuccess(res, 'Payment refunded successfully and stock restored', { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async verifyGatewayPayment(req, res, next) {
    try {
      const adminId = req.user?.admin ? req.user.admin.id : null;
      const userId = req.user?.id;
      const { orderId, gateway, razorpay_payment_id, razorpay_order_id, razorpay_signature, cashfree_order_id, cashfree_payment_id } = req.body;

      if (!orderId || !gateway) {
        return sendError(res, 'orderId and gateway are required for gateway verification', [], 400);
      }

      const payment = await paymentService.verifyServerSideGateway({
        orderId,
        gateway,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        cashfree_order_id,
        cashfree_payment_id,
        adminId,
        userId,
      });

      return sendSuccess(res, `${gateway} payment verified successfully by server`, { payment });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new PaymentController();
