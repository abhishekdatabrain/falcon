const {
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  PaymentConfirmation,
  Product,
  ProductVariant,
  ProductImage,
  Address,
  Customer,
  User,
  Driver,
  Delivery,
  DriverLocation,
  DriverAssignment,
  Admin,
  Feedback,
  Invoice,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const cartService = require('./cartService');
const couponService = require('./couponService');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { ORDER_STATUS, VALID_STATUS_TRANSITIONS } = require('../constants/orderStatus');
const PAYMENT_STATUS = require('../constants/paymentStatus');
const ROLES = require('../constants/roles');

class OrderService {
  async createOrderFromCart(customerId, addressId, notes = '', paymentMethod = 'COD', couponCode = null, deliveryDate = null, deliverySlot = null, deliverySpeed = 'express') {
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

    let discountTotal = 0.00;
    let appliedCoupon = null;
    if (couponCode) {
      const couponRes = await couponService.validateCoupon(couponCode, cartTotals.subtotal);
      if (couponRes.valid) {
        discountTotal = couponRes.discountAmount;
        appliedCoupon = couponRes.coupon;
      }
    }

    const deliveryFee = deliverySpeed === 'standard' ? 0.00 : 12.00;
    const taxTotal = Math.round(cartTotals.subtotal * 0.15 * 100) / 100;
    const calculatedGrandTotal = Math.max(0, Math.round((cartTotals.subtotal + taxTotal + deliveryFee - discountTotal) * 100) / 100);

    // Atomic Database Transaction
    const createdOrder = await sequelize.transaction(async (t) => {
      // 1. Validate Stock & Lock Products
      for (const item of cartTotals.items) {
        if (item.variantId) {
          const variant = await ProductVariant.findByPk(item.variantId, { transaction: t, lock: t.LOCK.UPDATE });
          if (!variant || !variant.is_active) {
            throw new Error(`Variant "${item.sku || item.name_en}" is no longer available`);
          }
          if (variant.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for "${item.name_en}". Available: ${variant.stock_quantity}`);
          }
        } else {
          const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
          if (!product || !product.is_active || !product.is_available) {
            throw new Error(`Product "${item.name_en}" is no longer available`);
          }
          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for "${item.name_en}". Available: ${product.stock_quantity}`);
          }
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
        tax_total: taxTotal,
        delivery_fee: deliveryFee,
        discount_total: discountTotal,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_date: deliveryDate || null,
        delivery_slot: deliverySlot || null,
        grand_total: calculatedGrandTotal,
        order_status: ORDER_STATUS.PENDING_PAYMENT,
        payment_method: paymentMethod || 'COD',
        notes,
      }, { transaction: t });

      if (appliedCoupon && appliedCoupon.id) {
        const { Coupon } = require('../models');
        await Coupon.increment('used_count', { by: 1, where: { id: appliedCoupon.id }, transaction: t });
      }

      // 4. Create OrderItems & Reserve Stock
      for (const item of cartTotals.items) {
        const lineTax = Math.round(item.lineTotal * 0.15 * 100) / 100;
        const variantSuffix = item.unit_value ? ` (${item.unit_value} ${item.unit_type || ''})`.trim() : '';

        await OrderItem.create({
          order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name_en: `${item.name_en}${variantSuffix}`,
          product_name_ar: `${item.name_ar}${variantSuffix}`,
          unit_price: item.price,
          quantity: item.quantity,
          tax_amount: lineTax,
          total_price: item.lineTotal,
        }, { transaction: t });

        // Decrement stock
        if (item.variantId) {
          const variant = await ProductVariant.findByPk(item.variantId, { transaction: t });
          if (variant) {
            const newVarStock = Math.max(0, variant.stock_quantity - item.quantity);
            await variant.update({
              stock_quantity: newVarStock,
            }, { transaction: t });
          }
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            const newStock = Math.max(0, product.stock_quantity - item.quantity);
            await product.update({
              stock_quantity: newStock,
            }, { transaction: t });
          }
        } else {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            const newStock = Math.max(0, product.stock_quantity - item.quantity);
            await product.update({
              stock_quantity: newStock,
            }, { transaction: t });
          }
        }
      }

      // 5. Create Payment Record
      await Payment.create({
        order_id: order.id,
        amount: calculatedGrandTotal,
        status: PAYMENT_STATUS.PENDING,
        payment_method: paymentMethod || 'COD',
        payment_gateway: paymentMethod || 'COD',
      }, { transaction: t });

      // 6. Record Status History
      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: null,
        to_status: ORDER_STATUS.PENDING_PAYMENT,
        notes: `Order placed by customer via ${paymentMethod || 'COD'}.`,
      }, { transaction: t });

      // 7. Clear Customer Cart
      await cartService.clearCart(customerId);

      return await this.getOrderById(order.id, customerId, ROLES.CUSTOMER, t);
    });

    // Send order confirmation email with estimated delivery slot & date
    emailService.sendOrderConfirmationEmail(createdOrder).catch((err) => {
      logger.error('Background order confirmation email failed:', err);
    });

    // Also trigger in-app notification if customer has user_id
    if (createdOrder?.customer?.user_id) {
      const slotText = createdOrder.delivery_slot ? ` (${createdOrder.delivery_slot})` : '';
      notificationService.createNotification(
        createdOrder.customer.user_id,
        'ORDER_CONFIRMED',
        `Order Confirmed #${createdOrder.order_number}`,
        `تم تأكيد طلبك #${createdOrder.order_number}`,
        `Your order is confirmed! Estimated delivery: ${createdOrder.delivery_date || 'Today'}${slotText}.`,
        `تم تأكيد طلبك بنجاح! موعد التوصيل المتوقع: ${createdOrder.delivery_date || 'اليوم'}${slotText}.`
      ).catch(() => { });
    }

    return createdOrder;
  }

  async getOrderConfirmation(orderId) {
    const options = {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Address, as: 'address' },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] }] },
        { model: OrderStatusHistory, as: 'status_history', include: [{ model: User, as: 'changed_by', attributes: ['id', 'email', 'role'] }] },
        { model: Payment, as: 'payment', include: ['confirmation'] },
        { model: Delivery, as: 'delivery', include: [{ model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] }] },
        { model: Feedback, as: 'feedback' },
      ],
      order: [
        [{ model: OrderStatusHistory, as: 'status_history' }, 'createdAt', 'ASC'],
      ],
    };

    const order = await Order.findByPk(orderId, options);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async trackOrder(identifier) {
    if (!identifier) {
      throw new Error('Order identifier is required');
    }

    const cleanIdentifier = String(identifier).trim().replace(/^#/, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanIdentifier);

    const where = isUuid
      ? { id: cleanIdentifier }
      : { order_number: cleanIdentifier };

    const options = {
      where,
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Address, as: 'address' },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] }] },
        { model: OrderStatusHistory, as: 'status_history', include: [{ model: User, as: 'changed_by', attributes: ['id', 'email', 'role'] }] },
        { model: Payment, as: 'payment', include: ['confirmation'] },
        {
          model: Delivery,
          as: 'delivery',
          include: [
            { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
            { model: DriverLocation, as: 'locations' },
          ],
        },
        { model: Feedback, as: 'feedback' },
        { model: Invoice, as: 'invoice' },
      ],
      order: [
        [{ model: OrderStatusHistory, as: 'status_history' }, 'createdAt', 'ASC'],
      ],
    };

    const order = await Order.findOne(options);
    if (!order) {
      throw new Error(`Order "${cleanIdentifier}" not found`);
    }

    return order;
  }

  async getOrderById(orderId, userId = null, role = null, transaction = null) {
    const options = {
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
        },
        { model: Address, as: 'address' },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] }],
        },
        {
          model: OrderStatusHistory,
          as: 'status_history',
          include: [{ model: User, as: 'changed_by', attributes: ['id', 'email', 'role'] }],
        },
        {
          model: Payment,
          as: 'payment',
          include: ['confirmation'],
        },
        {
          model: Delivery,
          as: 'delivery',
          include: [
            {
              model: Driver,
              as: 'driver',
              include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
            },
            {
              model: DriverLocation,
              as: 'locations',
            },
          ],
        },
        {
          model: DriverAssignment,
          as: 'assignments',
          include: [
            { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }] },
            { model: Driver, as: 'previous_driver', include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }] },
            { model: Admin, as: 'assigned_by_admin', include: [{ model: User, as: 'user', attributes: ['id', 'email'] }] },
          ],
        },
        { model: Feedback, as: 'feedback' },
      ],
      order: [
        [{ model: OrderStatusHistory, as: 'status_history' }, 'createdAt', 'ASC'],
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
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name_en', 'name_ar', 'price', 'discount_price', 'pack_size', 'unit_type', 'unit_value'],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  attributes: ['id', 'image_url', 'is_primary']
                }
              ]
            }
          ]
        },
        { model: Payment, as: 'payment' },
        { model: Address, as: 'address' },
        {
          model: Delivery,
          as: 'delivery',
          include: [
            {
              model: Driver,
              as: 'driver',
              include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }]
            }
          ]
        },
        { model: OrderStatusHistory, as: 'status_history' },
        { model: Feedback, as: 'feedback' },
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
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = filters;

    const where = {};
    const paymentWhere = {};
    const deliveryWhere = {};

    // 1. Tab Status Groupings (Requirement 8)
    if (tab === 'PENDING') {
      where.order_status = [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED];
    } else if (tab === 'PROCESSING') {
      where.order_status = [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PAYMENT_VERIFIED, ORDER_STATUS.PROCESSING, ORDER_STATUS.PACKED];
    } else if (tab === 'OUT_FOR_DELIVERY') {
      where.order_status = [ORDER_STATUS.DRIVER_ASSIGNED, ORDER_STATUS.DRIVER_ACCEPTED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED];
    } else if (tab === 'COMPLETED') {
      where.order_status = [ORDER_STATUS.DELIVERED];
    } else if (tab === 'CANCELLED') {
      where.order_status = [ORDER_STATUS.CANCELLED, ORDER_STATUS.PAYMENT_REJECTED];
    } else if (tab === 'RETURNED') {
      where.order_status = [ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERY_FAILED];
    } else if (tab === 'ACTIVE') {
      where.order_status = [
        ORDER_STATUS.PENDING_PAYMENT,
        ORDER_STATUS.PAYMENT_SUBMITTED,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PAYMENT_VERIFIED,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.PACKED,
        ORDER_STATUS.DRIVER_ASSIGNED,
        ORDER_STATUS.DRIVER_ACCEPTED,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        ORDER_STATUS.ARRIVED,
      ];
    }

    // 2. Specific Order Status Filter (Overrides or Refines Tab)
    if (status && status !== 'ALL') {
      where.order_status = status;
    }

    // 3. Payment Status Filter
    if (paymentStatus && paymentStatus !== 'ALL') {
      if (paymentStatus === 'PAID') {
        paymentWhere.status = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.VERIFIED];
      } else if (paymentStatus === 'PENDING') {
        paymentWhere.status = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUBMITTED, PAYMENT_STATUS.UNDER_REVIEW];
      } else if (paymentStatus === 'FAILED') {
        paymentWhere.status = [PAYMENT_STATUS.FAILED, PAYMENT_STATUS.REJECTED];
      } else {
        paymentWhere.status = paymentStatus;
      }
    }

    // 4. Payment Method Filter
    if (paymentMethod && paymentMethod !== 'ALL') {
      paymentWhere.payment_method = { [Op.iLike]: `%${paymentMethod}%` };
    }

    // 5. Driver Filter
    if (driverId && driverId !== 'ALL') {
      deliveryWhere.driver_id = driverId;
    }

    // 6. Date Range Filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = endDate;
      }
    }

    // 7. Order Amount Range Filter
    if (minAmount || maxAmount) {
      where.grand_total = {};
      if (minAmount) where.grand_total[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.grand_total[Op.lte] = parseFloat(maxAmount);
    }

    // 8. Text Search Query Across Order #, Customer Name, Mobile, Email, Driver
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

    // Sorting config
    const allowedSortFields = ['createdAt', 'grand_total', 'order_number'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

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
          required: Object.keys(paymentWhere).length > 0,
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
          required: Object.keys(deliveryWhere).length > 0,
          include: [
            {
              model: Driver,
              as: 'driver',
              include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
            },
          ],
        },
      ],
      order: [[safeSortBy, safeSortOrder]],
      limit: pageSize,
      offset,
      distinct: true,
    });

    // Compute Overall Dynamic Dashboard Summary Metrics (Requirement 10)
    const allOrders = await Order.findAll({
      attributes: ['id', 'order_status'],
      include: [
        { model: Payment, as: 'payment', attributes: ['id', 'status', 'payment_method'] },
      ],
    });

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED].includes(o.order_status)).length,
      processing: allOrders.filter(o => [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PAYMENT_VERIFIED, ORDER_STATUS.PROCESSING, ORDER_STATUS.PACKED].includes(o.order_status)).length,
      outForDelivery: allOrders.filter(o => [ORDER_STATUS.DRIVER_ASSIGNED, ORDER_STATUS.DRIVER_ACCEPTED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED].includes(o.order_status)).length,
      delivered: allOrders.filter(o => o.order_status === ORDER_STATUS.DELIVERED).length,
      cancelled: allOrders.filter(o => [ORDER_STATUS.CANCELLED, ORDER_STATUS.PAYMENT_REJECTED].includes(o.order_status)).length,
      returned: allOrders.filter(o => [ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERY_FAILED].includes(o.order_status)).length,
      pendingPayments: allOrders.filter(o => o.payment && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(o.payment.status)).length,
      completedPayments: allOrders.filter(o => o.payment && ['PAID', 'VERIFIED'].includes(o.payment.status)).length,
    };

    return {
      orders,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
      stats,
    };
  }

  async updateOrderStatus(orderId, newStatus, changedByUserId, notes = '') {
    const order = await Order.findByPk(orderId, { include: ['payment', 'delivery'] });
    if (!order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.order_status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    // Allow Admin flexibility for standard flow while checking valid paths
    const isSpecialAdminTransition = [ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERY_FAILED].includes(newStatus);
    if (!allowedTransitions.includes(newStatus) && !isSpecialAdminTransition && currentStatus !== newStatus) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}"`);
    }

    const updatedOrder = await sequelize.transaction(async (t) => {
      await order.update({ order_status: newStatus }, { transaction: t });

      // Update delivery lifecycle and driver status if linked
      if (order.delivery) {
        const deliveryUpdate = { status: newStatus };
        if (newStatus === ORDER_STATUS.OUT_FOR_DELIVERY && !order.delivery.start_time) {
          deliveryUpdate.start_time = new Date();
        } else if (newStatus === ORDER_STATUS.DELIVERED) {
          if (!order.delivery.end_time) {
            deliveryUpdate.end_time = new Date();
          }
          if (order.delivery.driver_id) {
            const { Driver } = require('../models');
            const { DRIVER_AVAILABILITY } = require('../constants/driverStatus');
            await Driver.update(
              { availability_status: DRIVER_AVAILABILITY.AVAILABLE },
              { where: { id: order.delivery.driver_id }, transaction: t }
            );
          }
        }
        await order.delivery.update(deliveryUpdate, { transaction: t });
      }

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: currentStatus,
        to_status: newStatus,
        changed_by_user_id: changedByUserId || null,
        notes: notes || `Status changed from ${currentStatus} to ${newStatus}`,
      }, { transaction: t });

      // If order is cancelled or returned, restore inventory stock
      if (newStatus === ORDER_STATUS.CANCELLED || newStatus === ORDER_STATUS.RETURNED) {
        const orderItems = await OrderItem.findAll({ where: { order_id: order.id }, transaction: t });
        for (const item of orderItems) {
          if (item.variant_id) {
            const variant = await ProductVariant.findByPk(item.variant_id, { transaction: t });
            if (variant) {
              const restoredVarStock = variant.stock_quantity + item.quantity;
              await variant.update({
                stock_quantity: restoredVarStock,
              }, { transaction: t });
            }
          }
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

    const { emitOrderStatusUpdate } = require('../sockets/socketManager');
    emitOrderStatusUpdate({
      orderId: order.id,
      deliveryId: order.delivery?.id,
      driverId: order.delivery?.driver_id,
      status: newStatus,
      orderStatus: newStatus,
      notes: notes || `Order status updated to ${newStatus}`,
    });

    return updatedOrder;
  }

  async cancelOrder(orderId, userId, role, reason = '') {
    const order = await this.getOrderById(orderId, userId, role);
    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PAYMENT_REJECTED].includes(order.order_status) && role !== ROLES.ADMIN) {
      throw new Error('Order cannot be cancelled at its current status');
    }

    return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, userId, `Cancelled. Reason: ${reason}`);
  }
}

module.exports = new OrderService();
