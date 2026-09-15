const { Order, OrderItem, OrderStatusHistory, Payment, Product, Address, Customer, User, Driver, Delivery, sequelize } = require('../models');
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
      const customer = await Customer.findOne({ where: { user_id: userId } });
      if (!customer || order.customer_id !== customer.id) {
        throw new Error('Access denied to this order');
      }
    } else if (role === ROLES.DRIVER) {
      const driver = await Driver.findOne({ where: { user_id: userId } });
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
    const { status, search } = filters;
    const where = {};
    if (status) {
      where.order_status = status;
    }

    return await Order.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery', include: ['driver'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async updateOrderStatus(orderId, newStatus, changedByUserId, notes = '') {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.order_status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    return await sequelize.transaction(async (t) => {
      await order.update({ order_status: newStatus }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: currentStatus,
        to_status: newStatus,
        changed_by_user_id: changedByUserId,
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
    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED, ORDER_STATUS.PAYMENT_REJECTED].includes(order.order_status)) {
      throw new Error('Order cannot be cancelled at its current status');
    }

    return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, userId, `Cancelled by user. Reason: ${reason}`);
  }
}

module.exports = new OrderService();
