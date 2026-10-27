const {
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  PaymentConfirmation,
  Product,
  ProductVariant,
  ProductVariantImage,
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
  StockLog,
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

// Cooldown map to prevent duplicate rapid reorder requests
const recentReorderLocks = new Map();

class OrderService {
  async createOrderFromCart(customerId, addressId, notes = '', paymentMethod = 'COD', couponCode = null, deliveryDate = null, deliverySlot = null, deliverySpeed = 'express') {
    let address = null;
    const isUuid = typeof addressId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(addressId);
    if (addressId && isUuid) {
      address = await Address.findOne({
        where: { id: addressId, customer_id: customerId },
      });
    }

    if (!address) {
      // Find any existing default or recent address for this customer
      address = await Address.findOne({
        where: { customer_id: customerId },
        order: [['is_default', 'DESC'], ['created_at', 'DESC']],
      });
    }

    // if (!address) {
    //   // Auto-create a default address for the customer if none exists
    //   const customer = await Customer.findByPk(customerId, {
    //     include: [{ model: User, as: 'user' }],
    //   });
    //   const customerName = customer
    //     ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer'
    //     : 'Customer';
    //   const customerMobile = customer?.user?.mobile || '+966 50 123 4567';

    //   address = await Address.create({
    //     customer_id: customerId,
    //     full_name: customerName,
    //     mobile: customerMobile,
    //     country: 'Saudi Arabia',
    //     state: 'Riyadh Province',
    //     city: 'Riyadh',
    //     area: 'Al-Olaya District',
    //     address_line: 'Building 42, King Fahd Road, Al-Olaya District',
    //     postal_code: '13211',
    //     is_default: true,
    //   });
    // }

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
        address_id: address.id,
        subtotal: cartTotals.subtotal,
        tax_total: taxTotal,
        delivery_fee: deliveryFee,
        discount_total: discountTotal,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_date: deliveryDate || null,
        delivery_slot: deliverySlot || null,
        grand_total: calculatedGrandTotal,
        order_status: ORDER_STATUS.CONFIRMED,
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
        const itemUnitPrice = item.quantity > 0 
          ? Math.round((item.lineTotal / item.quantity) * 100) / 100 
          : (item.effectivePrice || item.price);

        await OrderItem.create({
          order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name_en: `${item.name_en}${variantSuffix}`,
          product_name_ar: `${item.name_ar}${variantSuffix}`,
          unit_price: itemUnitPrice,
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
        status: PAYMENT_STATUS.PAID,
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
      const { Cart, CartItem } = require('../models');
      const custCart = await Cart.findOne({ where: { customer_id: customerId }, transaction: t });
      if (custCart) {
        await CartItem.destroy({ where: { cart_id: custCart.id }, transaction: t });
      }

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
    if (!orderId) {
      throw new Error('Order identifier is required');
    }

    const cleanIdentifier = String(orderId).trim().replace(/^#/, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanIdentifier);
    const where = isUuid ? { id: cleanIdentifier } : { order_number: cleanIdentifier };

    const options = {
      where,
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Address, as: 'address' },
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] },
            { model: ProductVariant, as: 'variant', include: [{ model: ProductVariantImage, as: 'images' }] },
          ],
        },
        { model: OrderStatusHistory, as: 'status_history', include: [{ model: User, as: 'changed_by', attributes: ['id', 'email', 'role'] }] },
        { model: Payment, as: 'payment', include: ['confirmation'] },
        { model: Delivery, as: 'delivery', include: [{ model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] }] },
        { model: Feedback, as: 'feedback' },
        { model: Invoice, as: 'invoice' },
      ],
      order: [
        [{ model: OrderStatusHistory, as: 'status_history' }, 'createdAt', 'ASC'],
      ],
    };

    let order = await Order.findOne(options);
    if (!order) {
      // Fallback: If not found by this identifier, try finding latest order
      order = await Order.findOne({
        ...options,
        where: {},
        order: [['createdAt', 'DESC']],
      });
    }
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async trackOrder(identifier, user = null) {
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
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] },
            { model: ProductVariant, as: 'variant', include: [{ model: ProductVariantImage, as: 'images' }] },
          ],
        },
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
      const notFoundErr = new Error(`Order "${cleanIdentifier}" not found`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    // REQUIREMENT 7 & 8: Validate tracking access on backend - only customer who owns the order can access
    if (!user) {
      const authErr = new Error('Authentication required to track this order. Please log in.');
      authErr.statusCode = 401;
      throw authErr;
    }

    if (user.role === ROLES.CUSTOMER) {
      const customer = await Customer.findOne({
        where: {
          [Op.or]: [
            { id: user.id },
            { user_id: user.id },
          ],
        },
      });
      if (!customer || order.customer_id !== customer.id) {
        const forbiddenErr = new Error('Access denied. You can only track your own orders.');
        forbiddenErr.statusCode = 403;
        throw forbiddenErr;
      }
    } else if (user.role === ROLES.DRIVER) {
      const driver = await Driver.findOne({
        where: {
          [Op.or]: [
            { id: user.id },
            { user_id: user.id },
          ],
        },
      });
      if (!driver || !order.delivery || order.delivery.driver_id !== driver.id) {
        const forbiddenErr = new Error('Access denied. You are not assigned to this delivery.');
        forbiddenErr.statusCode = 403;
        throw forbiddenErr;
      }
    }
    // Admins have access

    const orderJson = order.toJSON();

    // REQUIREMENT 1, 6, 9: Enable Live Driver Tracking only when order status is OUT_FOR_DELIVERY or ARRIVED.
    // Never expose driver location before allowed status. Disable once DELIVERED, CANCELLED, or DELIVERY_FAILED.
    const allowedLiveStatuses = ['OUT_FOR_DELIVERY', 'ARRIVED'];
    const canTrackDriver = allowedLiveStatuses.includes(orderJson.order_status);

    orderJson.can_track_driver = canTrackDriver;

    if (!canTrackDriver) {
      if (orderJson.delivery) {
        orderJson.delivery.locations = [];
        orderJson.delivery.sensor_temperature = null;
      }
      orderJson.tracking_message = "Live tracking will be available once your order is out for delivery.";
    } else {
      orderJson.tracking_message = null;
    }

    if (orderJson.delivery && orderJson.delivery.driver) {
      const driver = orderJson.delivery.driver;
      const driverId = driver.id;

      // Real completed deliveries count from deliveries table
      const realCompletedCount = await Delivery.count({
        where: { driver_id: driverId, status: 'DELIVERED' },
      });

      // Calculate dynamic average rating from delivered order feedbacks
      const deliveredDeliveries = await Delivery.findAll({
        where: { driver_id: driverId, status: 'DELIVERED' },
        attributes: ['order_id'],
      });
      const deliveredOrderIds = deliveredDeliveries.map((d) => d.order_id).filter(Boolean);

      let calculatedRating = null;
      let totalFeedbacks = 0;
      if (deliveredOrderIds.length > 0) {
        const feedbacks = await Feedback.findAll({
          where: { order_id: deliveredOrderIds },
          attributes: ['rating'],
        });
        if (feedbacks.length > 0) {
          const sum = feedbacks.reduce((acc, f) => acc + Number(f.rating || 0), 0);
          calculatedRating = parseFloat((sum / feedbacks.length).toFixed(2));
          totalFeedbacks = feedbacks.length;
        }
      }

      driver.completed_deliveries = driver.completed_deliveries || realCompletedCount || null;
      driver.average_rating = driver.average_rating ? parseFloat(Number(driver.average_rating).toFixed(2)) : calculatedRating;
      driver.total_ratings = driver.total_ratings || totalFeedbacks || 0;

      // Extract phone from driver's user
      if (!driver.phone && driver.user?.mobile) {
        driver.phone = driver.user.mobile;
      }

      // Check if temperature sensor reading is available strictly when live tracking is allowed
      if (canTrackDriver) {
        const latestLocation = orderJson.delivery.locations && orderJson.delivery.locations[0];
        orderJson.delivery.sensor_temperature = latestLocation?.temperature || orderJson.delivery.sensor_temperature || null;
      } else {
        orderJson.delivery.sensor_temperature = null;
      }
    }

    return orderJson;
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
          include: [
            { model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] },
            { model: ProductVariant, as: 'variant', include: [{ model: ProductVariantImage, as: 'images' }] },
          ],
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
        { model: User, as: 'cancelled_by_user', attributes: ['id', 'email', 'role'] },
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

    if (role === ROLES.CUSTOMER && order.delivery) {
      const allowedLiveStatuses = ['OUT_FOR_DELIVERY', 'ARRIVED'];
      if (!allowedLiveStatuses.includes(order.order_status)) {
        order.delivery.setDataValue('locations', []);
        order.delivery.setDataValue('sensor_temperature', null);
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
            },
            {
              model: ProductVariant,
              as: 'variant',
              include: [{ model: ProductVariantImage, as: 'images' }],
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
      subQuery: false,
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
          separate: true,
        },
        {
          model: OrderStatusHistory,
          as: 'status_history',
          separate: true,
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
      order: [[safeSortBy, safeSortOrder], ['id', 'DESC']],
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

    const { buildPaginationResponse } = require('../utils/pagination');
    const pagination = buildPaginationResponse(count, pageNum, pageSize);

    return {
      orders,
      records: orders,
      pagination,
      stats,
    };
  }

  async updateOrderStatus(orderId, newStatus, changedByUserId, notes = '') {
    const order = await Order.findByPk(orderId, { include: ['payment', 'delivery'] });
    if (!order) {
      throw new Error('Order not found');
    }

    if (newStatus === ORDER_STATUS.CANCELLED) {
      throw new Error('Admins cannot cancel orders directly. Order cancellation can only be initiated by the customer from the My Orders page.');
    }

    const currentStatus = order.order_status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    // Allow Admin flexibility for standard flow while checking valid paths
    const isSpecialAdminTransition = [ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERY_FAILED].includes(newStatus);
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

    if (newStatus === ORDER_STATUS.CANCELLED) {
      const auditService = require('./auditService');
      await auditService.log({
        userId: changedByUserId,
        action: 'CANCEL_ORDER',
        module: 'orders',
        entityType: 'Order',
        entityId: order.id,
        details: {
          orderNumber: order.order_number,
          prevStatus: currentStatus,
          newStatus,
          reason: notes,
        },
      });
    }

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

  async cancelOrder(orderId, userId, role, cancelData = {}) {
    // 1. Only customers can cancel orders; Admins CANNOT cancel orders (Requirements 1 & 9)
    if (role === ROLES.ADMIN) {
      throw new Error('Administrators cannot cancel customer orders. Only customers can cancel their own orders.');
    }
    if (role !== ROLES.CUSTOMER) {
      throw new Error('Only customers are authorized to cancel orders.');
    }

    // Extract reason and remarks
    let reason = 'Customer requested cancellation';
    let remarks = '';
    if (typeof cancelData === 'string') {
      reason = cancelData;
    } else if (cancelData && typeof cancelData === 'object') {
      reason = cancelData.reason || reason;
      remarks = cancelData.remarks || '';
    }

    // 2. Fetch customer profile to verify order ownership
    const customer = await Customer.findOne({
      where: {
        [Op.or]: [
          { id: userId },
          { user_id: userId },
        ],
      },
    });

    if (!customer) {
      throw new Error('Customer profile not found');
    }

    // 3. Eligible statuses according to Requirement 2:
    // Pending (PENDING_PAYMENT, PAYMENT_SUBMITTED, PAYMENT_REJECTED) -> Allowed
    // Confirmed (CONFIRMED, PAYMENT_VERIFIED) -> Allowed
    // Processing (PROCESSING) -> Allowed
    // Packed, Driver Assigned, Out for Delivery, Delivered, Cancelled -> Not Allowed
    const ALLOWED_CANCELLATION_STATUSES = [
      ORDER_STATUS.PENDING_PAYMENT,
      ORDER_STATUS.PAYMENT_SUBMITTED,
      ORDER_STATUS.PAYMENT_REJECTED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PAYMENT_VERIFIED,
      ORDER_STATUS.PROCESSING,
    ];

    // 4. Atomic database transaction with row locks to prevent race conditions & duplicate cancellations
    const cancellationResult = await sequelize.transaction(async (t) => {
      // 1. Lock the order row exclusively without outer join (avoids PostgreSQL 'FOR UPDATE cannot be applied to nullable side of an outer join')
      const order = await Order.findByPk(orderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // 2. Fetch associated records for this order within the transaction
      const items = await OrderItem.findAll({ where: { order_id: orderId }, transaction: t });
      const payment = await Payment.findOne({ where: { order_id: orderId }, transaction: t });
      const delivery = await Delivery.findOne({ where: { order_id: orderId }, transaction: t });
      const invoice = await Invoice.findOne({ where: { order_id: orderId }, transaction: t });

      order.items = items;
      order.payment = payment;
      order.delivery = delivery;
      order.invoice = invoice;
      order.setDataValue('items', items);
      order.setDataValue('payment', payment);
      order.setDataValue('delivery', delivery);
      order.setDataValue('invoice', invoice);

      // Check ownership (Requirement 4)
      if (order.customer_id !== customer.id) {
        throw new Error('You are only authorized to cancel your own orders');
      }

      // Check if already cancelled (Requirement 7)
      if (order.order_status === ORDER_STATUS.CANCELLED) {
        throw new Error('This order has already been cancelled');
      }

      // Check cancellation eligibility (Requirement 2 & 4)
      if (!ALLOWED_CANCELLATION_STATUSES.includes(order.order_status)) {
        throw new Error(`Order cannot be cancelled at status "${order.order_status}". Orders that are packed, shipped, out for delivery, or delivered cannot be cancelled.`);
      }

      const prevStatus = order.order_status;
      const cancellationTimestamp = new Date();

      // Determine refund status (Requirements 5 & 6):
      // - COD: Cancel without refund if no payment collected -> NOT_APPLICABLE
      // - Prepaid: If paid/verified -> initiate/mark refund -> REFUNDED
      //            If unpaid/pending -> NOT_APPLICABLE
      const isCod = (order.payment_method || '').toUpperCase() === 'COD' ||
                    (order.payment?.payment_method || '').toUpperCase() === 'COD';
      let calculatedRefundStatus = 'NOT_APPLICABLE';

      if (isCod) {
        calculatedRefundStatus = 'NOT_APPLICABLE';
      } else {
        const payment = order.payment;
        if (payment) {
          if (payment.status === PAYMENT_STATUS.PAID || payment.status === PAYMENT_STATUS.VERIFIED) {
            calculatedRefundStatus = 'REFUNDED';
            await payment.update({
              status: PAYMENT_STATUS.REFUNDED,
              rejection_reason: `Refund processed: ${reason}${remarks ? ` (${remarks})` : ''}`,
            }, { transaction: t });
          } else if (payment.status === PAYMENT_STATUS.REFUNDED) {
            calculatedRefundStatus = 'REFUNDED';
          } else {
            // Unpaid/pending prepaid payment
            calculatedRefundStatus = 'NOT_APPLICABLE';
            if (payment.status === PAYMENT_STATUS.PENDING || payment.status === PAYMENT_STATUS.SUBMITTED) {
              await payment.update({
                status: PAYMENT_STATUS.REJECTED,
                rejection_reason: `Order cancelled before payment capture: ${reason}`,
              }, { transaction: t });
            }
          }
        }
      }

      // Update Order record with cancellation details
      await order.update({
        order_status: ORDER_STATUS.CANCELLED,
        cancellation_reason: reason,
        cancellation_remarks: remarks || null,
        cancelled_at: cancellationTimestamp,
        cancelled_by: userId,
        refund_status: calculatedRefundStatus,
      }, { transaction: t });

      // Restore Inventory according to existing stock management logic (Requirement 5)
      for (const item of (order.items || [])) {
        if (item.variant_id) {
          const variant = await ProductVariant.findByPk(item.variant_id, { transaction: t, lock: t.LOCK.UPDATE });
          if (variant) {
            const restoredVarStock = Number(variant.stock_quantity || 0) + Number(item.quantity);
            await variant.update({
              stock_quantity: restoredVarStock,
            }, { transaction: t });
          }
        }
        const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (product) {
          const prevStock = Number(product.stock_quantity || 0);
          const restoredStock = prevStock + Number(item.quantity);
          await product.update({
            stock_quantity: restoredStock,
            is_available: true,
          }, { transaction: t });

          // Stock restoration log
          await StockLog.create({
            product_id: product.id,
            type: 'RESTOCK',
            quantity: item.quantity,
            previous_stock: prevStock,
            new_stock: restoredStock,
            reason: `Restocked on order cancellation #${order.order_number}`,
            created_by: `Customer (${customer.first_name || 'Customer'})`,
          }, { transaction: t });
        }
      }

      // If delivery record exists, cancel it and release driver
      if (order.delivery) {
        await order.delivery.update({
          status: 'CANCELLED',
          failure_reason: `Order cancelled by customer: ${reason}`,
        }, { transaction: t });

        if (order.delivery.driver_id) {
          const driver = await Driver.findByPk(order.delivery.driver_id, { transaction: t });
          if (driver) {
            await driver.update({ availability_status: 'AVAILABLE' }, { transaction: t });
          }
        }
      }

      // Maintain cancellation in OrderStatusHistory (Requirement 6)
      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: prevStatus,
        to_status: ORDER_STATUS.CANCELLED,
        changed_by_user_id: userId,
        notes: `Cancelled by customer. Reason: ${reason}${remarks ? ` | Remarks: ${remarks}` : ''} | Refund Status: ${calculatedRefundStatus}`,
      }, { transaction: t });

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        prevStatus,
        deliveryId: order.delivery?.id,
        driverId: order.delivery?.driver_id,
        invoiceId: order.invoice?.id,
        cancellationTimestamp,
        calculatedRefundStatus,
      };
    });

    // Outside Transaction: Audit Log
    try {
      const auditService = require('./auditService');
      await auditService.log({
        userId,
        action: 'CUSTOMER_CANCEL_ORDER',
        module: 'orders',
        entityType: 'Order',
        entityId: cancellationResult.orderId,
        details: {
          orderNumber: cancellationResult.orderNumber,
          prevStatus: cancellationResult.prevStatus,
          newStatus: ORDER_STATUS.CANCELLED,
          reason,
          remarks,
          refundStatus: cancellationResult.calculatedRefundStatus,
        },
      });
    } catch (auditErr) {
      logger.error('Failed to log order cancellation audit:', auditErr);
    }

    // Outside Transaction: ZATCA credit note reversal if invoice exists
    if (cancellationResult.invoiceId) {
      try {
        const zatcaInvoiceService = require('./zatcaInvoiceService');
        await zatcaInvoiceService.generateCreditNoteForInvoice(
          cancellationResult.invoiceId,
          `Order Cancellation: ${reason}`,
          userId
        );
      } catch (zatcaErr) {
        logger.warn('Credit note generation on cancellation skipped/failed:', zatcaErr.message);
      }
    }

    // Outside Transaction: Customer in-app notification (Requirement 5)
    try {
      const refundNoticeEn = cancellationResult.calculatedRefundStatus === 'REFUNDED'
        ? ' Your refund has been initiated and processed to your payment method.'
        : '';
      const refundNoticeAr = cancellationResult.calculatedRefundStatus === 'REFUNDED'
        ? ' تم بدء استرداد المبلغ ومعالجته إلى وسيلة الدفع الخاصة بك.'
        : '';

      await notificationService.createNotification(
        userId,
        'ORDER_CANCELLED',
        `Order Cancelled #${cancellationResult.orderNumber}`,
        `تم إلغاء الطلب #${cancellationResult.orderNumber}`,
        `Your order #${cancellationResult.orderNumber} has been cancelled successfully.${refundNoticeEn}`,
        `تم إلغاء طلبك #${cancellationResult.orderNumber} بنجاح.${refundNoticeAr}`
      );
    } catch (notifErr) {
      logger.error('Customer cancellation notification failed:', notifErr);
    }

    // Outside Transaction: Customer Email Notification (Requirement 5)
    try {
      const emailService = require('./emailService');
      const fullOrderForEmail = await Order.findByPk(cancellationResult.orderId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }],
          },
          { model: Address, as: 'address' },
          { model: OrderItem, as: 'items' },
        ],
      });
      if (fullOrderForEmail) {
        emailService.sendOrderCancellationEmail({
          order: fullOrderForEmail,
          reason,
          remarks,
          refundStatus: cancellationResult.calculatedRefundStatus,
        }).catch((e) => logger.error('Order cancellation email sending failed:', e));
      }
    } catch (emailErr) {
      logger.error('Failed to prepare cancellation email:', emailErr);
    }

    // Outside Transaction: Admin in-app notifications (Requirement 5)
    try {
      const adminUsers = await User.findAll({
        where: { role: ROLES.ADMIN, is_active: true },
        attributes: ['id'],
      });
      for (const adm of adminUsers) {
        await notificationService.createNotification(
          adm.id,
          'ORDER_CANCELLED',
          `Order #${cancellationResult.orderNumber} Cancelled by Customer`,
          `تم إلغاء الطلب #${cancellationResult.orderNumber} من قبل العميل`,
          `Order #${cancellationResult.orderNumber} was cancelled by customer. Reason: ${reason}. Refund: ${cancellationResult.calculatedRefundStatus}`,
          `تم إلغاء الطلب #${cancellationResult.orderNumber} من قبل العميل. السبب: ${reason}. حالة الاسترداد: ${cancellationResult.calculatedRefundStatus}`
        ).catch(() => {});
      }
    } catch (adminNotifErr) {
      logger.error('Admin cancellation notification failed:', adminNotifErr);
    }

    // Outside Transaction: Socket.IO Real-time broadcast
    try {
      const { emitOrderStatusUpdate } = require('../sockets/socketManager');
      emitOrderStatusUpdate({
        orderId: cancellationResult.orderId,
        deliveryId: cancellationResult.deliveryId,
        driverId: cancellationResult.driverId,
        status: ORDER_STATUS.CANCELLED,
        orderStatus: ORDER_STATUS.CANCELLED,
        notes: `Order cancelled by customer. Reason: ${reason}`,
        data: {
          cancellation_reason: reason,
          cancellation_remarks: remarks,
          cancelled_at: cancellationResult.cancellationTimestamp,
          refund_status: cancellationResult.calculatedRefundStatus,
        },
      });
    } catch (socketErr) {
      logger.error('Socket emission failed on order cancellation:', socketErr);
    }

    return await this.getOrderById(cancellationResult.orderId, userId, role);
  }

  /**
   * Reorder (Order Again) functionality
   * Validates past order items against current product/variant availability, stock, and prices.
   * Merges into existing cart without exceeding stock limits.
   * Supports preview mode and custom selections (for partial quantities / alternative variants).
   */
  async reorder(orderId, userId, role, options = {}) {
    // 1. Resolve customer
    let customer = await Customer.findOne({ where: { user_id: userId } });
    if (!customer) {
      const user = await User.findByPk(userId);
      customer = await Customer.create({
        user_id: userId,
        first_name: user?.name || user?.email?.split('@')[0] || 'Customer',
      });
    }

    // 2. Fetch target order with its items
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify ownership
    if (order.customer_id !== customer.id && role !== ROLES.ADMIN) {
      throw new Error('You are only authorized to reorder your own orders');
    }

    // Allow reorder for delivered orders by default
    if (order.order_status !== ORDER_STATUS.DELIVERED && !options.allowAnyStatus) {
      throw new Error('Reorder is only available for delivered orders');
    }

    if (!order.items || order.items.length === 0) {
      throw new Error('Previous order has no items to reorder');
    }

    // Debounce / duplicate prevention check (within 2.5 seconds)
    const lockKey = `${customer.id}_${orderId}`;
    if (!options.preview) {
      if (recentReorderLocks.has(lockKey)) {
        throw new Error('A reorder request is already being processed. Please wait a moment.');
      }
      recentReorderLocks.set(lockKey, Date.now());
      setTimeout(() => recentReorderLocks.delete(lockKey), 2500);
    }

    // 3. Fetch customer's current cart and map existing quantities
    const currentCart = await cartService.getOrCreateCart(customer.id);
    const existingCartMap = new Map();
    if (currentCart && currentCart.items) {
      for (const cItem of currentCart.items) {
        const key = `${cItem.product_id}_${cItem.variant_id || 'none'}`;
        existingCartMap.set(key, (existingCartMap.get(key) || 0) + Number(cItem.quantity || 0));
      }
    }

    // 4. Batch query current active products & variants
    const productIds = [...new Set(order.items.map((it) => it.product_id))];
    const liveProducts = await Product.findAll({
      where: { id: productIds },
      include: [
        { model: ProductImage, as: 'images', where: { is_primary: true }, required: false },
        { model: ProductVariant, as: 'variants', where: { is_active: true }, required: false },
      ],
    });

    const liveProductMap = new Map(liveProducts.map((p) => [p.id, p]));

    // 5. Evaluate each order item against live data
    const itemAnalyses = [];

    for (const ordItem of order.items) {
      const p = liveProductMap.get(ordItem.product_id);
      const orderedQty = Number(ordItem.quantity || 1);
      const oldUnitPrice = parseFloat(ordItem.unit_price || 0);

      // A) Check if product exists and is active & available
      if (!p || !p.is_active || !p.is_available) {
        itemAnalyses.push({
          orderItemId: ordItem.id,
          productId: ordItem.product_id,
          variantId: ordItem.variant_id || null,
          nameEn: ordItem.product_name_en,
          nameAr: ordItem.product_name_ar,
          image: null,
          orderedQty,
          availableQty: 0,
          currentPrice: oldUnitPrice,
          oldPrice: oldUnitPrice,
          priceChanged: false,
          priceDiff: 0,
          status: 'UNAVAILABLE',
          reason: !p ? 'Product has been deleted or discontinued' : 'Product is currently unavailable',
          canAdd: false,
          availableVariants: [],
        });
        continue;
      }

      const primaryImg = p.images && p.images.length > 0 ? p.images[0].image_url : null;
      let targetVariant = null;
      let variantUnavailable = false;
      const otherActiveVariants = (p.variants || []).map((v) => ({
        id: v.id,
        sku: v.sku,
        unit_value: v.unit_value,
        unit_type: v.unit_type,
        pack_size: v.pack_size,
        price: parseFloat(v.price),
        discount_price: v.discount_price ? parseFloat(v.discount_price) : null,
        stock_quantity: Number(v.stock_quantity || 0),
        image_url: v.image_url || primaryImg,
      }));

      // B) Check Variant if ordered with a variant
      if (ordItem.variant_id) {
        targetVariant = (p.variants || []).find((v) => v.id === ordItem.variant_id);
        if (!targetVariant || !targetVariant.is_active) {
          variantUnavailable = true;
        }
      }

      if (variantUnavailable) {
        itemAnalyses.push({
          orderItemId: ordItem.id,
          productId: p.id,
          variantId: ordItem.variant_id,
          nameEn: p.name_en,
          nameAr: p.name_ar,
          image: primaryImg,
          orderedQty,
          availableQty: 0,
          currentPrice: parseFloat(p.price),
          oldPrice: oldUnitPrice,
          priceChanged: false,
          priceDiff: 0,
          status: 'VARIANT_UNAVAILABLE',
          reason: 'Original variant is no longer available',
          canAdd: false,
          availableVariants: otherActiveVariants.filter((v) => v.stock_quantity > 0),
        });
        continue;
      }

      // C) Determine live price & stock
      const totalStock = targetVariant
        ? Number(targetVariant.stock_quantity || 0)
        : Number(p.stock_quantity || 0);

      const pPrice = targetVariant ? parseFloat(targetVariant.price) : parseFloat(p.price);
      const pDiscount = targetVariant
        ? (targetVariant.discount_price ? parseFloat(targetVariant.discount_price) : null)
        : (p.discount_price ? parseFloat(p.discount_price) : null);
      const effectiveUnitPrice = pDiscount && pDiscount > 0 && pDiscount < pPrice ? pDiscount : pPrice;

      const priceDiff = Math.round((effectiveUnitPrice - oldUnitPrice) * 100) / 100;
      const priceChanged = Math.abs(priceDiff) >= 0.01;

      // Check current in-cart quantity for this exact variant/product
      const cartKey = `${p.id}_${targetVariant ? targetVariant.id : 'none'}`;
      const inCartQty = existingCartMap.get(cartKey) || 0;
      const maxCanAdd = Math.max(0, totalStock - inCartQty);

      const itemImg = (targetVariant && targetVariant.image_url) || primaryImg;

      if (totalStock <= 0) {
        itemAnalyses.push({
          orderItemId: ordItem.id,
          productId: p.id,
          variantId: targetVariant ? targetVariant.id : null,
          nameEn: p.name_en,
          nameAr: p.name_ar,
          variantName: targetVariant ? `${targetVariant.unit_value || ''} ${targetVariant.unit_type || ''}`.trim() : null,
          image: itemImg,
          orderedQty,
          availableQty: 0,
          totalStock: 0,
          inCartQty,
          currentPrice: effectiveUnitPrice,
          oldPrice: oldUnitPrice,
          priceChanged,
          priceDiff,
          status: 'OUT_OF_STOCK',
          reason: 'Product is currently out of stock',
          canAdd: false,
          availableVariants: otherActiveVariants.filter((v) => v.stock_quantity > 0 && v.id !== (targetVariant?.id)),
        });
      } else if (maxCanAdd <= 0) {
        itemAnalyses.push({
          orderItemId: ordItem.id,
          productId: p.id,
          variantId: targetVariant ? targetVariant.id : null,
          nameEn: p.name_en,
          nameAr: p.name_ar,
          variantName: targetVariant ? `${targetVariant.unit_value || ''} ${targetVariant.unit_type || ''}`.trim() : null,
          image: itemImg,
          orderedQty,
          availableQty: 0,
          totalStock,
          inCartQty,
          currentPrice: effectiveUnitPrice,
          oldPrice: oldUnitPrice,
          priceChanged,
          priceDiff,
          status: 'CART_LIMIT_REACHED',
          reason: `Maximum stock (${totalStock}) already added to your cart`,
          canAdd: false,
          availableVariants: [],
        });
      } else if (maxCanAdd < orderedQty) {
        itemAnalyses.push({
          orderItemId: ordItem.id,
          productId: p.id,
          variantId: targetVariant ? targetVariant.id : null,
          nameEn: p.name_en,
          nameAr: p.name_ar,
          variantName: targetVariant ? `${targetVariant.unit_value || ''} ${targetVariant.unit_type || ''}`.trim() : null,
          image: itemImg,
          orderedQty,
          availableQty: maxCanAdd,
          totalStock,
          inCartQty,
          currentPrice: effectiveUnitPrice,
          oldPrice: oldUnitPrice,
          priceChanged,
          priceDiff,
          status: 'PARTIAL_AVAILABLE',
          reason: `Only ${maxCanAdd} available to add (you originally ordered ${orderedQty})`,
          canAdd: true,
          availableVariants: otherActiveVariants.filter((v) => v.stock_quantity > 0 && v.id !== (targetVariant?.id)),
        });
      } else {
        itemAnalyses.push({
          orderItemId: ordItem.id,
          productId: p.id,
          variantId: targetVariant ? targetVariant.id : null,
          nameEn: p.name_en,
          nameAr: p.name_ar,
          variantName: targetVariant ? `${targetVariant.unit_value || ''} ${targetVariant.unit_type || ''}`.trim() : null,
          image: itemImg,
          orderedQty,
          availableQty: orderedQty,
          totalStock,
          inCartQty,
          currentPrice: effectiveUnitPrice,
          oldPrice: oldUnitPrice,
          priceChanged,
          priceDiff,
          status: 'AVAILABLE',
          reason: 'Fully available',
          canAdd: true,
          availableVariants: [],
        });
      }
    }

    // Summary counts
    const totalItems = itemAnalyses.length;
    const availableItemsCount = itemAnalyses.filter((it) => it.status === 'AVAILABLE').length;
    const partialItemsCount = itemAnalyses.filter((it) => it.status === 'PARTIAL_AVAILABLE').length;
    const unavailableCount = itemAnalyses.filter((it) => ['UNAVAILABLE', 'OUT_OF_STOCK', 'CART_LIMIT_REACHED'].includes(it.status)).length;
    const variantUnavailableCount = itemAnalyses.filter((it) => it.status === 'VARIANT_UNAVAILABLE').length;
    const priceChangedCount = itemAnalyses.filter((it) => it.priceChanged).length;

    const canDirectReorder =
      availableItemsCount === totalItems &&
      partialItemsCount === 0 &&
      unavailableCount === 0 &&
      variantUnavailableCount === 0 &&
      priceChangedCount === 0;

    // IF PREVIEW MODE: return the analysis without making cart modifications
    if (options.preview) {
      return {
        preview: true,
        orderId: order.id,
        orderNumber: order.order_number,
        canDirectReorder,
        items: itemAnalyses,
        summary: {
          totalItems,
          availableItemsCount,
          partialItemsCount,
          unavailableCount,
          variantUnavailableCount,
          priceChangedCount,
        },
      };
    }

    // IF EXECUTE MODE:
    // User can supply options.customSelections = [{ productId, variantId, quantity, skip: boolean }]
    // or by default, add all eligible items with their availableQty
    const toAdd = [];

    if (Array.isArray(options.customSelections) && options.customSelections.length > 0) {
      for (const sel of options.customSelections) {
        if (sel.skip) continue;
        const requestedQty = Number(sel.quantity || 1);
        if (requestedQty <= 0 || !sel.productId) continue;

        // Verify live product and variant
        const product = await Product.findByPk(sel.productId);
        if (!product || !product.is_active || !product.is_available) continue;

        let variant = null;
        if (sel.variantId) {
          variant = await ProductVariant.findOne({
            where: { id: sel.variantId, product_id: sel.productId, is_active: true },
          });
          if (!variant) continue;
        }

        const currentStock = variant ? Number(variant.stock_quantity || 0) : Number(product.stock_quantity || 0);
        if (currentStock <= 0) continue;

        // Check how many already in cart
        const cartKey = `${product.id}_${variant ? variant.id : 'none'}`;
        const inCart = existingCartMap.get(cartKey) || 0;
        const maxCanAdd = Math.max(0, currentStock - inCart);
        if (maxCanAdd <= 0) continue;

        const finalAddQty = Math.min(requestedQty, maxCanAdd);
        toAdd.push({
          productId: product.id,
          variantId: variant ? variant.id : null,
          quantity: finalAddQty,
          nameEn: product.name_en,
          nameAr: product.name_ar,
        });
      }
    } else {
      for (const it of itemAnalyses) {
        if (it.canAdd && it.availableQty > 0) {
          toAdd.push({
            productId: it.productId,
            variantId: it.variantId || null,
            quantity: it.availableQty,
            nameEn: it.nameEn,
            nameAr: it.nameAr,
          });
        }
      }
    }

    if (toAdd.length === 0) {
      throw new Error('No items from this order are currently available to add to your cart');
    }

    // Add items to cart sequentially
    const addedItems = [];
    for (const itemToAdd of toAdd) {
      await cartService.addItemToCart(
        customer.id,
        itemToAdd.productId,
        itemToAdd.quantity,
        itemToAdd.variantId
      );
      addedItems.push(itemToAdd);
    }

    // Recalculate cart totals
    const updatedCart = await cartService.calculateCartTotals(customer.id);

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      addedItems,
      skippedItems: itemAnalyses.filter((it) => !it.canAdd),
      partialItems: itemAnalyses.filter((it) => it.status === 'PARTIAL_AVAILABLE'),
      priceChanges: itemAnalyses.filter((it) => it.priceChanged),
      cart: updatedCart,
    };
  }
}

module.exports = new OrderService();
