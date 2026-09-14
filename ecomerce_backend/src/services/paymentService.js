const { Payment, PaymentConfirmation, Order, OrderStatusHistory, sequelize } = require('../models');
const PAYMENT_STATUS = require('../constants/paymentStatus');
const { ORDER_STATUS } = require('../constants/orderStatus');

class PaymentService {
  async submitPaymentConfirmation(orderId, customerId, bankName, paymentReference, proofFileUrl) {
    const order = await Order.findOne({ where: { id: orderId, customer_id: customerId } });
    if (!order) {
      throw new Error('Order not found or does not belong to customer');
    }

    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_REJECTED].includes(order.order_status)) {
      throw new Error('Payment confirmation cannot be submitted for this order status');
    }

    return await sequelize.transaction(async (t) => {
      let payment = await Payment.findOne({ where: { order_id: orderId }, transaction: t });
      if (!payment) {
        payment = await Payment.create({
          order_id: orderId,
          amount: order.grand_total,
          status: PAYMENT_STATUS.SUBMITTED,
        }, { transaction: t });
      } else {
        await payment.update({
          status: PAYMENT_STATUS.SUBMITTED,
          rejection_reason: null,
        }, { transaction: t });
      }

      await PaymentConfirmation.create({
        payment_id: payment.id,
        bank_name: bankName,
        payment_reference: paymentReference,
        proof_file_url: proofFileUrl,
        submitted_at: new Date(),
      }, { transaction: t });

      await order.update({ order_status: ORDER_STATUS.PAYMENT_SUBMITTED }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: order.order_status,
        to_status: ORDER_STATUS.PAYMENT_SUBMITTED,
        notes: `Bank payment confirmation submitted by customer. Bank: ${bankName}, Reference: ${paymentReference}`,
      }, { transaction: t });

      return payment;
    });
  }

  async getPendingPaymentsAdmin() {
    return await Payment.findAll({
      where: {
        status: [PAYMENT_STATUS.SUBMITTED, PAYMENT_STATUS.UNDER_REVIEW],
      },
      include: [
        { model: Order, as: 'order', include: ['customer', 'address'] },
        { model: PaymentConfirmation, as: 'confirmation' },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async verifyPayment(paymentId, adminId) {
    const payment = await Payment.findByPk(paymentId, { include: ['order'] });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    return await sequelize.transaction(async (t) => {
      await payment.update({
        status: PAYMENT_STATUS.VERIFIED,
        verified_at: new Date(),
        verified_by_admin_id: adminId,
      }, { transaction: t });

      await payment.order.update({
        order_status: ORDER_STATUS.PAYMENT_VERIFIED,
      }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: payment.order.id,
        from_status: ORDER_STATUS.PAYMENT_SUBMITTED,
        to_status: ORDER_STATUS.PAYMENT_VERIFIED,
        changed_by_user_id: adminId,
        notes: 'Bank transfer payment verified by Admin. Eligible for driver assignment.',
      }, { transaction: t });

      return payment;
    });
  }

  async rejectPayment(paymentId, adminId, rejectionReason) {
    if (!rejectionReason) {
      throw new Error('Rejection reason is required');
    }

    const payment = await Payment.findByPk(paymentId, { include: ['order'] });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    return await sequelize.transaction(async (t) => {
      await payment.update({
        status: PAYMENT_STATUS.REJECTED,
        rejection_reason: rejectionReason,
        verified_by_admin_id: adminId,
      }, { transaction: t });

      await payment.order.update({
        order_status: ORDER_STATUS.PAYMENT_REJECTED,
      }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: payment.order.id,
        from_status: ORDER_STATUS.PAYMENT_SUBMITTED,
        to_status: ORDER_STATUS.PAYMENT_REJECTED,
        changed_by_user_id: adminId,
        notes: `Payment rejected by Admin. Reason: ${rejectionReason}`,
      }, { transaction: t });

      return payment;
    });
  }
}

module.exports = new PaymentService();
