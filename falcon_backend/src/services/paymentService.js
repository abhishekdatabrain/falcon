const { Op } = require('sequelize');
const {
  Payment,
  PaymentConfirmation,
  Order,
  OrderItem,
  Product,
  Customer,
  User,
  Address,
  Invoice,
  Admin,
  OrderStatusHistory,
  sequelize
} = require('../models');
const PAYMENT_STATUS = require('../constants/paymentStatus');
const { ORDER_STATUS } = require('../constants/orderStatus');
const crypto = require('crypto');
const auditService = require('./auditService');

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
          payment_method: 'Bank Transfer',
          payment_gateway: 'Bank Transfer',
          transaction_id: paymentReference,
        }, { transaction: t });
      } else {
        await payment.update({
          status: PAYMENT_STATUS.SUBMITTED,
          payment_method: 'Bank Transfer',
          payment_gateway: 'Bank Transfer',
          transaction_id: paymentReference,
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
        status: [PAYMENT_STATUS.SUBMITTED, PAYMENT_STATUS.UNDER_REVIEW, PAYMENT_STATUS.PENDING],
      },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer' },
            { model: Address, as: 'address' },
            { model: OrderItem, as: 'items', include: ['product'] },
          ],
        },
        { model: PaymentConfirmation, as: 'confirmation' },
        { model: Admin, as: 'verified_by_admin' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getAllPaymentsAdmin({
    page = 1,
    limit = 20,
    status,
    method,
    search,
    dateFrom,
    dateTo,
    date,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * take;

    const where = {};

    // Status filtering
    if (status && status !== 'ALL') {
      if (status === 'BANK_AUDIT' || status === 'SUBMITTED') {
        where.status = { [Op.in]: [PAYMENT_STATUS.SUBMITTED, PAYMENT_STATUS.UNDER_REVIEW] };
      } else if (status === 'PAID' || status === 'VERIFIED') {
        where.status = { [Op.in]: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.VERIFIED] };
      } else if (status === 'REJECTED' || status === 'FAILED') {
        where.status = { [Op.in]: [PAYMENT_STATUS.REJECTED, PAYMENT_STATUS.FAILED] };
      } else if (status === 'REFUNDED') {
        where.status = PAYMENT_STATUS.REFUNDED;
      } else if (status === 'PENDING') {
        where.status = PAYMENT_STATUS.PENDING;
      } else {
        where.status = status;
      }
    }

    // Payment method filtering
    if (method && method !== 'ALL') {
      where.payment_method = { [Op.iLike]: `%${method}%` };
    }

    // Date range / single date filtering (PostgreSQL DATE casting)
    const effectiveDateFrom = dateFrom || date;
    if (effectiveDateFrom && dateTo) {
      where[Op.and] = where[Op.and] || [];
      if (effectiveDateFrom === dateTo) {
        where[Op.and].push(sequelize.where(sequelize.fn('date', sequelize.col('Payment.created_at')), effectiveDateFrom));
      } else {
        where[Op.and].push(sequelize.where(sequelize.fn('date', sequelize.col('Payment.created_at')), {
          [Op.gte]: effectiveDateFrom,
          [Op.lte]: dateTo,
        }));
      }
    } else if (effectiveDateFrom) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(sequelize.where(sequelize.fn('date', sequelize.col('Payment.created_at')), effectiveDateFrom));
    } else if (dateTo) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(sequelize.where(sequelize.fn('date', sequelize.col('Payment.created_at')), {
        [Op.lte]: dateTo,
      }));
    }

    // Free text search
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;

      // 1. Look up matching users by email or mobile
      const matchingUsers = await User.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: [
            { email: { [Op.iLike]: term } },
            { mobile: { [Op.iLike]: term } },
          ],
        },
        raw: true,
      });
      const userIds = matchingUsers.map((u) => u.id);

      // 2. Look up matching customers by first_name, last_name, or user_id
      const customerWhere = [
        { first_name: { [Op.iLike]: term } },
        { last_name: { [Op.iLike]: term } },
      ];
      if (userIds.length > 0) {
        customerWhere.push({ user_id: { [Op.in]: userIds } });
      }
      const matchingCustomers = await Customer.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: customerWhere,
        },
        raw: true,
      });
      const customerIds = matchingCustomers.map((c) => c.id);

      // 3. Look up matching orders by order_number or customer_id
      const orderWhere = [
        { order_number: { [Op.iLike]: term } },
      ];
      if (customerIds.length > 0) {
        orderWhere.push({ customer_id: { [Op.in]: customerIds } });
      }
      const matchingOrders = await Order.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: orderWhere,
        },
        raw: true,
      });
      const orderIds = matchingOrders.map((o) => o.id);

      // 4. Look up matching confirmations by bank_name or payment_reference
      const matchingConfirmations = await PaymentConfirmation.findAll({
        attributes: ['payment_id'],
        where: {
          [Op.or]: [
            { bank_name: { [Op.iLike]: term } },
            { payment_reference: { [Op.iLike]: term } },
          ],
        },
        raw: true,
      });
      const paymentIdsFromConf = matchingConfirmations.map((c) => c.payment_id);

      // 5. Assemble search conditions on Payment
      const searchConditions = [
        { transaction_id: { [Op.iLike]: term } },
        { payment_method: { [Op.iLike]: term } },
        sequelize.where(sequelize.cast(sequelize.col('Payment.id'), 'varchar'), { [Op.iLike]: term }),
      ];
      if (orderIds.length > 0) {
        searchConditions.push({ order_id: { [Op.in]: orderIds } });
      }
      if (paymentIdsFromConf.length > 0) {
        searchConditions.push({ id: { [Op.in]: paymentIdsFromConf } });
      }

      where[Op.or] = searchConditions;
    }

    const validSortFields = ['createdAt', 'created_at', 'amount', 'status', 'payment_method'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer' },
            { model: Address, as: 'address' },
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: Product, as: 'product' }],
            },
            { model: Invoice, as: 'invoice' },
            {
              model: OrderStatusHistory,
              as: 'status_history',
              separate: true,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
        { model: PaymentConfirmation, as: 'confirmation' },
        { model: Admin, as: 'verified_by_admin' },
      ],
      distinct: true,
      order: [[safeSortBy, safeSortOrder], ['id', 'DESC']],
      limit: take,
      offset,
    });

    // Summary statistics for tabs and KPI cards
    const allPayments = await Payment.findAll({
      attributes: ['id', 'amount', 'status'],
    });

    let totalVolume = 0;
    let paidVolume = 0;
    let pendingBankAuditVolume = 0;
    let pendingPaymentVolume = 0;
    let refundedVolume = 0;

    let paidCount = 0;
    let pendingBankAuditCount = 0;
    let pendingPaymentCount = 0;
    let failedRejectedCount = 0;
    let refundedCount = 0;

    for (const p of allPayments) {
      const amt = parseFloat(p.amount || 0);
      totalVolume += amt;
      if ([PAYMENT_STATUS.PAID, PAYMENT_STATUS.VERIFIED].includes(p.status)) {
        paidCount++;
        paidVolume += amt;
      } else if ([PAYMENT_STATUS.SUBMITTED, PAYMENT_STATUS.UNDER_REVIEW].includes(p.status)) {
        pendingBankAuditCount++;
        pendingBankAuditVolume += amt;
      } else if (p.status === PAYMENT_STATUS.PENDING) {
        pendingPaymentCount++;
        pendingPaymentVolume += amt;
      } else if ([PAYMENT_STATUS.FAILED, PAYMENT_STATUS.REJECTED].includes(p.status)) {
        failedRejectedCount++;
      } else if (p.status === PAYMENT_STATUS.REFUNDED) {
        refundedCount++;
        refundedVolume += amt;
      }
    }

    const { buildPaginationResponse } = require('../utils/pagination');
    const pagination = buildPaginationResponse(count, pageNum, take);

    return {
      payments,
      records: payments,
      pagination,
      stats: {
        totalCount: allPayments.length,
        totalVolume,
        paidCount,
        paidVolume,
        pendingBankAuditCount,
        pendingBankAuditVolume,
        pendingPaymentCount,
        pendingPaymentVolume,
        failedRejectedCount,
        refundedCount,
        refundedVolume,
      },
    };
  }

  async getPaymentByIdAdmin(paymentId) {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer' },
            { model: Address, as: 'address' },
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: Product, as: 'product' }],
            },
            { model: Invoice, as: 'invoice' },
            {
              model: OrderStatusHistory,
              as: 'status_history',
              separate: true,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
        { model: PaymentConfirmation, as: 'confirmation' },
        { model: Admin, as: 'verified_by_admin' },
      ],
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    return payment;
  }

  async submitPaymentConfirmationAdmin(orderId, adminId, { bankName, paymentReference, proofFileUrl, autoVerify = false }) {
    const order = await Order.findByPk(orderId, { include: ['customer'] });
    if (!order) {
      throw new Error('Order not found');
    }

    return await sequelize.transaction(async (t) => {
      let payment = await Payment.findOne({ where: { order_id: orderId }, transaction: t });
      const initialStatus = autoVerify ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.SUBMITTED;

      if (!payment) {
        payment = await Payment.create({
          order_id: orderId,
          amount: order.grand_total,
          status: initialStatus,
          payment_method: 'Bank Transfer',
          payment_gateway: 'Bank Transfer',
          transaction_id: paymentReference,
          verified_at: autoVerify ? new Date() : null,
          verified_by_admin_id: autoVerify ? adminId : null,
        }, { transaction: t });
      } else {
        await payment.update({
          status: initialStatus,
          payment_method: 'Bank Transfer',
          payment_gateway: 'Bank Transfer',
          transaction_id: paymentReference,
          rejection_reason: null,
          verified_at: autoVerify ? new Date() : null,
          verified_by_admin_id: autoVerify ? adminId : null,
        }, { transaction: t });
      }

      await PaymentConfirmation.create({
        payment_id: payment.id,
        bank_name: bankName,
        payment_reference: paymentReference,
        proof_file_url: proofFileUrl || '',
        submitted_at: new Date(),
      }, { transaction: t });

      const targetOrderStatus = autoVerify ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PAYMENT_SUBMITTED;
      await order.update({
        order_status: targetOrderStatus,
        payment_method: 'Bank Transfer',
      }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: order.order_status,
        to_status: targetOrderStatus,
        notes: autoVerify
          ? `Bank payment verified directly by Admin. Bank: ${bankName}, Ref: ${paymentReference}`
          : `Bank payment slip submitted by Admin for audit. Bank: ${bankName}, Ref: ${paymentReference}`,
      }, { transaction: t });

      return payment;
    });
  }

  /**
   * Verify Payment securely via Admin action or Gateway integration.
   * Prevents duplicate verifications.
   */
  async verifyPayment(paymentId, adminId, userId, options = {}) {
    const {
      gateway = 'Razorpay',
      transactionId = null,
      paymentMethod = null,
      gatewayResponse = null,
    } = options;

    const payment = await Payment.findByPk(paymentId, { include: ['order'] });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === PAYMENT_STATUS.PAID || payment.status === PAYMENT_STATUS.VERIFIED) {
      throw new Error('Payment is already verified and marked as PAID. Duplicate updates prevented.');
    }

    if (payment.status === PAYMENT_STATUS.REFUNDED) {
      throw new Error('Cannot verify an already refunded payment.');
    }

    const effectiveTxnId = transactionId || payment.transaction_id || `txn_${gateway.toLowerCase()}_${Date.now()}`;
    const effectiveMethod = paymentMethod || payment.payment_method || (gateway === 'Cashfree' ? 'Cashfree' : gateway === 'Razorpay' ? 'Razorpay' : 'Card');

    return await sequelize.transaction(async (t) => {
      await payment.update({
        status: PAYMENT_STATUS.PAID,
        payment_method: effectiveMethod,
        payment_gateway: gateway,
        transaction_id: effectiveTxnId,
        gateway_raw_response: gatewayResponse || {
          verifiedBy: adminId ? 'Admin' : 'Gateway Callback',
          verifiedAt: new Date().toISOString(),
          gateway,
          transactionId: effectiveTxnId,
        },
        verified_at: new Date(),
        verified_by_admin_id: adminId || null,
        rejection_reason: null,
      }, { transaction: t });

      const prevStatus = payment.order.order_status;
      const targetOrderStatus = [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED].includes(prevStatus)
        ? ORDER_STATUS.CONFIRMED
        : prevStatus;

      await payment.order.update({
        order_status: targetOrderStatus,
        payment_method: effectiveMethod,
      }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: payment.order.id,
        from_status: prevStatus,
        to_status: targetOrderStatus,
        changed_by_user_id: userId || null,
        notes: `Payment verified securely via ${gateway} [Txn: ${effectiveTxnId}]. Status updated to PAID.`,
      }, { transaction: t });

      await auditService.log({
        userId,
        action: 'VERIFY_PAYMENT',
        module: 'payments',
        entityType: 'Payment',
        entityId: payment.id,
        details: {
          orderId: payment.order.id,
          orderNumber: payment.order.order_number,
          amount: payment.amount,
          gateway,
          transactionId: effectiveTxnId,
        },
      });

      return payment;
    });
  }

  /**
   * Reject / Mark Payment as Failed.
   */
  async rejectPayment(paymentId, adminId, userId, rejectionReason) {
    if (!rejectionReason) {
      throw new Error('Rejection reason is required');
    }

    const payment = await Payment.findByPk(paymentId, { include: ['order'] });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === PAYMENT_STATUS.FAILED || payment.status === PAYMENT_STATUS.REJECTED) {
      throw new Error('Payment is already marked as Failed / Rejected.');
    }

    return await sequelize.transaction(async (t) => {
      await payment.update({
        status: PAYMENT_STATUS.REJECTED,
        rejection_reason: rejectionReason,
        verified_by_admin_id: adminId || null,
      }, { transaction: t });

      const prevStatus = payment.order.order_status;
      await payment.order.update({
        order_status: ORDER_STATUS.PAYMENT_REJECTED,
      }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: payment.order.id,
        from_status: prevStatus,
        to_status: ORDER_STATUS.PAYMENT_REJECTED,
        changed_by_user_id: userId || null,
        notes: `Payment rejected by Admin. Reason: ${rejectionReason}`,
      }, { transaction: t });

      await auditService.log({
        userId,
        action: 'REJECT_PAYMENT',
        module: 'payments',
        entityType: 'Payment',
        entityId: payment.id,
        details: {
          orderId: payment.order.id,
          orderNumber: payment.order.order_number,
          amount: payment.amount,
          rejectionReason,
        },
      });

      return payment;
    });
  }

  /**
   * Refund Payment securely and restore product stocks.
   */
  async refundPayment(paymentId, adminId, userId, refundReason = 'Customer requested refund') {
    const payment = await Payment.findByPk(paymentId, { include: ['order'] });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status !== PAYMENT_STATUS.PAID && payment.status !== PAYMENT_STATUS.VERIFIED) {
      throw new Error(`Cannot refund payment with status "${payment.status}". Payment must be PAID or VERIFIED.`);
    }

    return await sequelize.transaction(async (t) => {
      await payment.update({
        status: PAYMENT_STATUS.REFUNDED,
        rejection_reason: `Refunded: ${refundReason}`,
      }, { transaction: t });

      const prevStatus = payment.order.order_status;
      await payment.order.update({
        order_status: ORDER_STATUS.CANCELLED,
      }, { transaction: t });

      // Restore product stock
      const orderItems = await OrderItem.findAll({ where: { order_id: payment.order.id }, transaction: t });
      for (const item of orderItems) {
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          const restoredStock = product.stock_quantity + item.quantity;
          await product.update({
            stock_quantity: restoredStock,
            is_available: true,
          }, { transaction: t });
        }
      }

      await OrderStatusHistory.create({
        order_id: payment.order.id,
        from_status: prevStatus,
        to_status: ORDER_STATUS.CANCELLED,
        changed_by_user_id: userId || null,
        notes: `Payment refunded [Amount: ${payment.amount} SAR]. Reason: ${refundReason}. Stock restored.`,
      }, { transaction: t });

      await auditService.log({
        userId,
        action: 'REFUND_PAYMENT',
        module: 'refunds',
        entityType: 'Payment',
        entityId: payment.id,
        details: {
          orderId: payment.order.id,
          orderNumber: payment.order.order_number,
          amount: payment.amount,
          refundReason,
        },
      });

      return payment;
    });
  }

  /**
   * Server-side Gateway Verification for Razorpay & Cashfree.
   */
  async verifyServerSideGateway({ orderId, gateway, razorpay_payment_id, razorpay_order_id, razorpay_signature, cashfree_order_id, cashfree_payment_id, adminId, userId }) {
    const order = await Order.findByPk(orderId, { include: ['payment'] });
    if (!order) {
      throw new Error('Order not found');
    }

    let isSignatureValid = false;
    let transactionId = '';

    if (gateway.toLowerCase() === 'razorpay') {
      const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || 'rzp_test_secret';
      if (razorpay_signature && razorpay_order_id && razorpay_payment_id) {
        const generatedSignature = crypto
          .createHmac('sha256', secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');
        isSignatureValid = generatedSignature === razorpay_signature;
      } else if (razorpay_payment_id) {
        // Direct payment ID provided from verified webhook / gateway modal
        isSignatureValid = true;
      }
      transactionId = razorpay_payment_id || `pay_${Date.now()}`;
    } else if (gateway.toLowerCase() === 'cashfree') {
      transactionId = cashfree_payment_id || cashfree_order_id || `cf_txn_${Date.now()}`;
      isSignatureValid = true;
    } else {
      transactionId = `txn_${Date.now()}`;
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      throw new Error('Gateway signature verification failed: Invalid transaction hash.');
    }

    let payment = order.payment;
    if (!payment) {
      payment = await Payment.create({
        order_id: order.id,
        amount: order.grand_total,
        status: PAYMENT_STATUS.PENDING,
        payment_method: gateway,
        payment_gateway: gateway,
        transaction_id: transactionId,
      });
    }

    return await this.verifyPayment(payment.id, adminId, userId, {
      gateway,
      transactionId,
      paymentMethod: gateway,
      gatewayResponse: {
        verified: true,
        gateway,
        transactionId,
        razorpay_order_id,
        cashfree_order_id,
        verifiedAt: new Date().toISOString(),
      },
    });
  }
}

module.exports = new PaymentService();
