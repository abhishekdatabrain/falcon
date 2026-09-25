const { Order, OrderItem, OrderStatusHistory, Payment, Product, Address, Customer, User, Driver, Delivery, sequelize } = require('../models');
const { Op } = require('sequelize');
const cartService = require('./cartService');
const { ORDER_STATUS, VALID_STATUS_TRANSITIONS } = require('../constants/orderStatus');
const PAYMENT_STATUS = require('../constants/paymentStatus');
const ROLES = require('../constants/roles');

class OrderService {
  async createOrderFromCart(customerId, addressId, notes = '') {
    const address = await Address.findOne({
      where: { id: addressId, customer_id: customerId },
    });

    if (!address) {
      throw new Error('Selected delivery address is invalid');
    }

    const cartTotals = await cartService.calculateCartTotals(customerId);
    if (!cartTotals.items || cartTotals.items.length === 0) {
      throw new Error('Your shopping cart is empty');
    }

    // Atomic Database Transaction
    return await sequelize.transaction(async (t) => {
      // 1. Validate Stock & Lock Products
      for (const item of cartTotals.items) {
        const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!product || !product.is_active || !product.is_available) {
          throw new Error(`Product "${item.name_en}" is no longer available`);
        }
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name_en}". Available: ${product.stock_quantity}`);
        }
      }

      // 2. Generate Unique Order Number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${dateStr}-${randomStr}`;

      // 3. Create Order Record
      const order = await Order.create({
        order_number: orderNumber,
        customer_id: customerId,
        address_id: addressId,
        subtotal: cartTotals.subtotal,
        tax_total: cartTotals.taxTotal,
        delivery_fee: cartTotals.deliveryFee,
        discount_total: cartTotals.discountTotal,
        grand_total: cartTotals.grandTotal,
        order_status: ORDER_STATUS.PENDING_PAYMENT,
        notes,
      }, { transaction: t });

      // 4. Create OrderItems & Reserve Stock
      for (const item of cartTotals.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        const lineTax = Math.round(item.lineTotal * 0.15 * 100) / 100;

        await OrderItem.create({
          order_id: order.id,
          product_id: item.productId,
          product_name_en: item.name_en,
          product_name_ar: item.name_ar,
          unit_price: item.price,
          quantity: item.quantity,
          tax_amount: lineTax,
          total_price: item.lineTotal,
        }, { transaction: t });

        // Decrement stock
        const newStock = product.stock_quantity - item.quantity;
        await product.update({
          stock_quantity: newStock,
          is_available: newStock > 0,
        }, { transaction: t });
      }

      // 5. Create Payment Record (Bank Transfer Pending)
      await Payment.create({
        order_id: order.id,
        amount: cartTotals.grandTotal,
        status: PAYMENT_STATUS.PENDING,
      }, { transaction: t });

      // 6. Record Status History
      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: null,
        to_status: ORDER_STATUS.PENDING_PAYMENT,
        notes: 'Order placed by customer. Awaiting bank payment submission.',
      }, { transaction: t });

      // 7. Clear Customer Cart
      await cartService.clearCart(customerId);

      return await this.getOrderById(order.id, customerId, ROLES.CUSTOMER, t);
    });
  }

  async getOrderById(orderId, userId = null, role = null, transaction = null) {
    const options = {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Address, as: 'address' },
        { model: OrderItem, as: 'items' },
        { model: OrderStatusHistory, as: 'status_history' },
        { model: Payment, as: 'payment', include: ['confirmation'] },
        { model: Delivery, as: 'delivery', include: [{ model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] }] },
      ],
    };

    if (transaction) {
      options.transaction = transaction;
    }

    const order = await Order.findByPk(orderId, options);
    if (!order) {
      throw new Error('Order not found');
    }

    // Role-based Security Enforcement
    if (role === ROLES.CUSTOMER) {
      const customer = await Customer.findOne({
        where: {
          [Op.or]: [
            { id: userId },
            { user_id: userId },
          ],
        },
      });
      if (!customer || order.customer_id !== customer.id) {
        throw new Error('Access denied to this order');
      }
    } else if (role === ROLES.DRIVER) {
      const driver = await Driver.findOne({
        where: {
          [Op.or]: [
            { id: userId },
            { user_id: userId },
          ],
        },
      });
      if (!driver || !order.delivery || order.delivery.driver_id !== driver.id) {
        throw new Error('Access denied. You are not the assigned driver for this order');
      }
    }

    return order;
  }

  async getCustomerOrders(customerId) {
    return await Order.findAll({
      where: { customer_id: customerId },
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getAllOrders(filters = {}) {
    const {
      search,
      status,
      tab,
      paymentStatus,
      paymentMethod,
      driverId,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
    } = filters;

    const where = {};
    const paymentWhere = {};
    const deliveryWhere = {};

    // 1. Tab Quick Filters
    if (tab === 'ACTIVE') {
      where.order_status = [
        ORDER_STATUS.PENDING_PAYMENT,
        ORDER_STATUS.PAYMENT_SUBMITTED,
        ORDER_STATUS.PAYMENT_VERIFIED,
        ORDER_STATUS.DRIVER_ASSIGNED,
        ORDER_STATUS.DRIVER_ACCEPTED,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        ORDER_STATUS.ARRIVED,
      ];
    } else if (tab === 'COMPLETED') {
      where.order_status = ORDER_STATUS.DELIVERED;
    } else if (tab === 'CANCELLED') {
      where.order_status = [ORDER_STATUS.CANCELLED, ORDER_STATUS.PAYMENT_REJECTED];
    }

    // 2. Specific Order Status Filter
    if (status && status !== 'ALL') {
      where.order_status = status;
    }

    // 3. Payment Status Filter
    if (paymentStatus && paymentStatus !== 'ALL') {
      paymentWhere.status = paymentStatus;
    }

    // 4. Driver Filter
    if (driverId && driverId !== 'ALL') {
      deliveryWhere.driver_id = driverId;
    }

    // 5. Date Range Filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = endDate;
      }
    }

    // 6. Order Amount Range Filter
    if (minAmount || maxAmount) {
      where.grand_total = {};
      if (minAmount) where.grand_total[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.grand_total[Op.lte] = parseFloat(maxAmount);
    }

    // 7. Text Search Query Across Order #, Customer Name, Mobile, Email, Driver
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { order_number: { [Op.iLike]: q } },
        { '$customer.first_name$': { [Op.iLike]: q } },
        { '$customer.last_name$': { [Op.iLike]: q } },
        { '$customer.user.email$': { [Op.iLike]: q } },
        { '$customer.user.mobile$': { [Op.iLike]: q } },
        { '$delivery.driver.user.email$': { [Op.iLike]: q } },
        { '$delivery.driver.user.mobile$': { [Op.iLike]: q } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * pageSize;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
        },
        {
          model: Payment,
          as: 'payment',
          where: Object.keys(paymentWhere).length > 0 ? paymentWhere : undefined,
          include: ['confirmation'],
        },
        {
          model: Address,
          as: 'address',
        },
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: OrderStatusHistory,
          as: 'status_history',
          include: [{ model: User, as: 'changed_by', attributes: ['id', 'email', 'role'] }],
        },
        {
          model: Delivery,
          as: 'delivery',
          where: Object.keys(deliveryWhere).length > 0 ? deliveryWhere : undefined,
          required: false,
          include: [
            {
              model: Driver,
              as: 'driver',
              include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    });

    // Compute Overall Dynamic Dashboard Summary Metrics
    const allOrders = await Order.findAll({
      include: [
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery' },
      ],
    });

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.order_status === ORDER_STATUS.PENDING_PAYMENT).length,
      processing: allOrders.filter(o => [ORDER_STATUS.PAYMENT_VERIFIED, ORDER_STATUS.DRIVER_ASSIGNED, ORDER_STATUS.DRIVER_ACCEPTED].includes(o.order_status)).length,
      outForDelivery: allOrders.filter(o => [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED].includes(o.order_status)).length,
      delivered: allOrders.filter(o => o.order_status === ORDER_STATUS.DELIVERED).length,
      cancelled: allOrders.filter(o => [ORDER_STATUS.CANCELLED, ORDER_STATUS.PAYMENT_REJECTED].includes(o.order_status)).length,
      pendingPayments: allOrders.filter(o => o.payment && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(o.payment.status)).length,
      completedPayments: allOrders.filter(o => o.payment && o.payment.status === 'VERIFIED').length,
    };

    return {
      orders,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
      stats,
    };
  }

  async updateOrderStatus(orderId, newStatus, changedByUserId, notes = '') {
    const order = await Order.findByPk(orderId, { include: ['payment'] });
    if (!order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.order_status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus) && newStatus !== ORDER_STATUS.CANCELLED) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Business Rule Check: Cannot mark order as DELIVERED unless payment is VERIFIED
    if (newStatus === ORDER_STATUS.DELIVERED && (!order.payment || order.payment.status !== PAYMENT_STATUS.VERIFIED)) {
      throw new Error('Cannot complete delivery: Payment for this order is not verified');
    }

    return await sequelize.transaction(async (t) => {
      await order.update({ order_status: newStatus }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: currentStatus,
        to_status: newStatus,
        changed_by_user_id: changedByUserId || null,
        notes,
      }, { transaction: t });

      // If order is cancelled, restore stock
      if (newStatus === ORDER_STATUS.CANCELLED) {
        const orderItems = await OrderItem.findAll({ where: { order_id: order.id }, transaction: t });
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
      }

      return order;
    });
  }

  async cancelOrder(orderId, userId, role, reason = '') {
    const order = await this.getOrderById(orderId, userId, role);
    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED, ORDER_STATUS.PAYMENT_REJECTED].includes(order.order_status) && role !== ROLES.ADMIN) {
      throw new Error('Order cannot be cancelled at its current status');
    }

    return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, userId, `Cancelled. Reason: ${reason}`);
  }
}

module.exports = new OrderService();
