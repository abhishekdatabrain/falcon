const { User, Driver, Customer, Admin, Order, Payment, Product, Delivery, DriverAssignment, OrderStatusHistory, DriverLocation, Feedback, Address, OrderItem, sequelize } = require('../models');
const { hashPassword } = require('../utils/password');
const ROLES = require('../constants/roles');
const { ORDER_STATUS } = require('../constants/orderStatus');
const { DRIVER_STATUS, DRIVER_AVAILABILITY } = require('../constants/driverStatus');

class AdminService {
  async getDashboardMetrics() {
    const totalCustomers = await Customer.count();
    const totalDrivers = await Driver.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();

    const pendingOrders = await Order.count({ where: { order_status: ORDER_STATUS.PENDING_PAYMENT } });
    const completedOrders = await Order.count({ where: { order_status: ORDER_STATUS.DELIVERED } });
    const cancelledOrders = await Order.count({ where: { order_status: ORDER_STATUS.CANCELLED } });
    const paymentVerifiedOrders = await Order.count({ where: { order_status: ORDER_STATUS.PAYMENT_VERIFIED } });
    const driverAssignedOrders = await Order.count({ where: { order_status: ORDER_STATUS.DRIVER_ASSIGNED } });
    const outForDeliveryOrders = await Order.count({ where: { order_status: ORDER_STATUS.OUT_FOR_DELIVERY } });

    // Payment statuses
    const submittedPayments = await Payment.count({ where: { status: 'SUBMITTED' } });
    const verifiedPayments = await Payment.count({ where: { status: 'VERIFIED' } });
    const rejectedPayments = await Payment.count({ where: { status: 'REJECTED' } });
    const pendingPayments = await Payment.count({ where: { status: 'PENDING' } });

    // Active deliveries
    const activeDeliveries = await Order.count({
      where: { order_status: [ORDER_STATUS.DRIVER_ASSIGNED, ORDER_STATUS.DRIVER_ACCEPTED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED] },
    });

    const totalRevenueResult = await Order.sum('grand_total', {
      where: { order_status: ORDER_STATUS.DELIVERED },
    });

    const recentOrders = await Order.findAll({
      limit: 8,
      order: [['createdAt', 'DESC']],
      include: ['customer', 'payment', 'delivery'],
    });

    const activeDriversCount = await Driver.count({
      where: { driver_status: DRIVER_STATUS.ACTIVE },
    });

    return {
      metrics: {
        totalCustomers,
        totalDrivers,
        activeDriversCount,
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        paymentVerifiedOrders,
        driverAssignedOrders,
        outForDeliveryOrders,
        activeDeliveries,
        pendingPayments: submittedPayments,
        verifiedPayments,
        paymentsBreakdown: {
          submitted: submittedPayments,
          verified: verifiedPayments,
          rejected: rejectedPayments,
          pending: pendingPayments,
        },
        deliveryBreakdown: {
          pendingDispatch: paymentVerifiedOrders,
          assigned: driverAssignedOrders,
          outForDelivery: outForDeliveryOrders,
          delivered: completedOrders,
        },
        totalRevenue: totalRevenueResult || 0.00,
        avgOrderValue: totalOrders > 0 ? (totalRevenueResult || 0) / totalOrders : 0,
      },
      recentOrders,
    };
  }

  async createDriver(adminId, driverData) {
    const { name, email, mobile, password, license_number, vehicle_details } = driverData;
    const cleanName = (name || '').trim();
    const cleanMobile = (mobile || '').trim();
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

    const existingMobile = await User.findOne({
      where: { mobile: cleanMobile },
    });
    if (existingMobile) {
      throw new Error('Mobile number is already registered');
    }

    if (cleanEmail) {
      const existingEmail = await User.findOne({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        throw new Error('Email address is already registered');
      }
    }

    const hashedPassword = await hashPassword(password);

    return await sequelize.transaction(async (t) => {
      const user = await User.create({
        email: cleanEmail,
        mobile: cleanMobile,
        password_hash: hashedPassword,
        role: ROLES.DRIVER,
        status: 'ACTIVE',
      }, { transaction: t });

      const driver = await Driver.create({
        user_id: user.id,
        name: cleanName,
        license_number,
        vehicle_details,
        driver_status: DRIVER_STATUS.ACTIVE,
        availability_status: DRIVER_AVAILABILITY.AVAILABLE,
      }, { transaction: t });

      return await Driver.findByPk(driver.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
        transaction: t,
      });
    });
  }

  async getAllDrivers(options = {}) {
    const { search, availability, status, accountStatus, page, limit, sortBy, sortOrder } = options;
    const { Op } = require('sequelize');
    const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
    const paginationConfig = parsePagination({ page, limit, sortBy, sortOrder }, 10, 100);

    const driverWhere = {};
    const userWhere = {};

    const availVal = availability || options.availability_status;
    if (availVal && availVal !== 'ALL') {
      driverWhere.availability_status = availVal;
    }

    const statusVal = accountStatus || status;
    if (statusVal && statusVal !== 'ALL') {
      userWhere.status = statusVal;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      driverWhere[Op.or] = [
        { name: { [Op.iLike]: q } },
        { license_number: { [Op.iLike]: q } },
        { vehicle_details: { [Op.iLike]: q } },
        { '$user.email$': { [Op.iLike]: q } },
        { '$user.mobile$': { [Op.iLike]: q } },
      ];
    }

    const { count, rows: drivers } = await Driver.findAndCountAll({
      where: driverWhere,
      subQuery: false,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'email', 'mobile', 'status', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: paginationConfig.limit,
      offset: paginationConfig.offset,
      distinct: true,
    });

    const allDrivers = await Driver.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
    });

    const stats = {
      total: allDrivers.length,
      available: allDrivers.filter((d) => d.availability_status === 'AVAILABLE').length,
      busy: allDrivers.filter((d) => d.availability_status === 'BUSY').length,
      offline: allDrivers.filter((d) => d.availability_status === 'OFFLINE').length,
      activeAccount: allDrivers.filter((d) => d.user?.status === 'ACTIVE').length,
    };

    const pagination = buildPaginationResponse(count, paginationConfig.page, paginationConfig.limit);

    return {
      drivers,
      records: drivers,
      stats,
      pagination,
    };
  }

  async updateDriverStatus(driverId, driverStatus, availabilityStatus) {
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const updateData = {};
    if (driverStatus) updateData.driver_status = driverStatus;
    if (availabilityStatus) updateData.availability_status = availabilityStatus;

    await driver.update(updateData);
    return driver;
  }

  async updateDriver(driverId, data) {
    const { name, email, mobile, license_number, vehicle_details, password } = data;
    const driver = await Driver.findByPk(driverId, { include: ['user'] });
    if (!driver) {
      throw new Error('Driver not found');
    }

    const cleanEmail = email !== undefined ? (email && email.trim() ? email.trim().toLowerCase() : null) : undefined;
    const cleanMobile = mobile !== undefined ? (mobile ? mobile.trim() : null) : undefined;

    if (cleanMobile && cleanMobile !== driver.user.mobile) {
      const existingMobile = await User.findOne({ where: { mobile: cleanMobile } });
      if (existingMobile && existingMobile.id !== driver.user.id) {
        throw new Error('Mobile number is already registered to another user');
      }
    }

    if (cleanEmail && cleanEmail !== driver.user.email) {
      const existingEmail = await User.findOne({ where: { email: cleanEmail } });
      if (existingEmail && existingEmail.id !== driver.user.id) {
        throw new Error('Email address is already registered to another user');
      }
    }

    await sequelize.transaction(async (t) => {
      const userUpdate = {};
      if (cleanEmail !== undefined) userUpdate.email = cleanEmail;
      if (cleanMobile !== undefined) userUpdate.mobile = cleanMobile;
      if (password && password.trim()) {
        userUpdate.password_hash = await hashPassword(password.trim());
      }
      if (Object.keys(userUpdate).length > 0) {
        await driver.user.update(userUpdate, { transaction: t });
      }

      const driverUpdate = {};
      if (name !== undefined) driverUpdate.name = (name || '').trim();
      if (license_number) driverUpdate.license_number = license_number;
      if (vehicle_details !== undefined) driverUpdate.vehicle_details = vehicle_details;

      if (Object.keys(driverUpdate).length > 0) {
        await driver.update(driverUpdate, { transaction: t });
      }
    });

    return await Driver.findByPk(driverId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
    });
  }

  async toggleDriverAccountStatus(driverId, status) {
    const driver = await Driver.findByPk(driverId, { include: ['user'] });
    if (!driver) {
      throw new Error('Driver not found');
    }
    await driver.user.update({ status });
    return driver;
  }

  async getDriverLocation(driverId) {
    const { DriverLocation } = require('../models');
    const driver = await Driver.findByPk(driverId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
    });
    if (!driver) throw new Error('Driver not found');

    const lastLocation = await DriverLocation.findOne({
      where: { driver_id: driverId },
      order: [['recorded_at', 'DESC']],
    });

    return {
      driver,
      location: lastLocation || null,
    };
  }

  async assignDriverToOrder(orderId, driverId, adminId, userId, reassignmentReason = '') {
    const order = await Order.findByPk(orderId, {
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
    if (!order) {
      throw new Error('Order not found');
    }

    const driver = await Driver.findByPk(driverId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }],
    });
    if (!driver || driver.driver_status !== DRIVER_STATUS.ACTIVE) {
      throw new Error('Selected driver is not active or valid');
    }

    let effectiveAdminId = adminId;
    if (!effectiveAdminId && userId) {
      const { Admin } = require('../models');
      const adminRecord = await Admin.findOne({ where: { user_id: userId } });
      if (adminRecord) effectiveAdminId = adminRecord.id;
    }

    const notificationService = require('./notificationService');
    const { emitOrderAssigned, emitOrderStatusUpdate } = require('../sockets/socketManager');

    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const result = await sequelize.transaction(async (t) => {
      let delivery = await Delivery.findOne({ where: { order_id: orderId }, transaction: t });
      let previousDriverId = null;

      if (delivery) {
        previousDriverId = delivery.driver_id;
        await delivery.update({
          driver_id: driverId,
          status: ORDER_STATUS.DRIVER_ASSIGNED,
          otp: delivery.otp || generatedOtp,
        }, { transaction: t });
      } else {
        delivery = await Delivery.create({
          order_id: orderId,
          driver_id: driverId,
          status: ORDER_STATUS.DRIVER_ASSIGNED,
          otp: generatedOtp,
        }, { transaction: t });
      }

      const prevStatus = order.order_status;
      await order.update({ order_status: ORDER_STATUS.DRIVER_ASSIGNED }, { transaction: t });

      if (effectiveAdminId) {
        await DriverAssignment.create({
          order_id: orderId,
          driver_id: driverId,
          assigned_by_admin_id: effectiveAdminId,
          previous_driver_id: previousDriverId,
          reassignment_reason: reassignmentReason || null,
        }, { transaction: t });
      }

      const notes = reassignmentReason
        ? `Driver assigned by Admin. Driver ID: ${driverId}. Notes: ${reassignmentReason}`
        : `Driver assigned by Admin. Assigned Driver ID: ${driverId}`;

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: prevStatus,
        to_status: ORDER_STATUS.DRIVER_ASSIGNED,
        changed_by_user_id: userId || null,
        notes,
      }, { transaction: t });

      // Update driver availability to BUSY
      await driver.update({ availability_status: DRIVER_AVAILABILITY.BUSY }, { transaction: t });

      // Send real-time notifications to assigned driver
      if (driver.user_id) {
        notificationService.createNotification(
          driver.user_id,
          'ORDER_ASSIGNED',
          `New Order Assigned #${order.order_number}`,
          `تم إسناد طلب جديد لك #${order.order_number}`,
          `You have been assigned order #${order.order_number}. ${reassignmentReason ? `Notes: ${reassignmentReason}` : 'Please prepare for pickup.'}`,
          `تم إسناد الطلب #${order.order_number} إليك.`
        ).catch(() => { });
      }

      if (previousDriverId && previousDriverId !== driverId) {
        const prevDriver = await Driver.findByPk(previousDriverId);
        if (prevDriver && prevDriver.user_id) {
          notificationService.createNotification(
            prevDriver.user_id,
            'ORDER_REASSIGNED',
            `Order #${order.order_number} Reassigned`,
            `تم إعادة إسناد الطلب #${order.order_number}`,
            `Order #${order.order_number} has been reassigned by admin.`,
            `تم إعادة إسناد الطلب #${order.order_number}.`
          ).catch(() => { });
        }
      }

      return delivery;
    });

    // Emit real-time WebSocket events across Driver, Admin, and Customer rooms
    emitOrderAssigned(driverId, {
      orderId: order.id,
      orderNumber: order.order_number,
      deliveryId: result.id,
      status: ORDER_STATUS.DRIVER_ASSIGNED,
    });

    emitOrderStatusUpdate({
      orderId: order.id,
      deliveryId: result.id,
      driverId,
      status: ORDER_STATUS.DRIVER_ASSIGNED,
      orderStatus: ORDER_STATUS.DRIVER_ASSIGNED,
      notes: reassignmentReason || 'Driver assigned by admin',
      data: {
        orderNumber: order.order_number,
        driverId,
      },
    });

    // Send email to customer with driver assignment details and delivery verification OTP (PIN)
    const emailService = require('./emailService');
    const logger = require('../utils/logger');
    const finalOtp = result.otp || generatedOtp;

    emailService.sendDriverAssignedEmail({
      order,
      driver,
      otp: finalOtp,
    }).catch((err) => {
      logger.error('Failed to send driver assigned email to customer:', err);
    });

    // In-app notification for the customer
    const customerUserId = order.customer?.user_id || order.customer?.user?.id;
    if (customerUserId) {
      notificationService.createNotification(
        customerUserId,
        'DRIVER_ASSIGNED',
        `Driver Assigned • Handover PIN: ${finalOtp}`,
        `تم تعيين سائق للطلب • رمز التسليم: ${finalOtp}`,
        `Your order #${order.order_number} has been assigned to a driver. Your delivery verification PIN is ${finalOtp}. Please share this code with the driver upon delivery.`,
        `تم تعيين سائق لطلبك #${order.order_number}. رمز التحقق الخاص بك هو ${finalOtp}. يرجى مشاركة هذا الرمز مع السائق عند الاستلام.`
      ).catch(() => {});
    }

    return result;
  }

  async getAllCustomers(options = {}) {
    const { search, status, page = 1, limit = 10 } = options;
    const { Op } = require('sequelize');

    const customerWhere = {};
    const userWhere = {};

    if (status && status !== 'ALL') {
      userWhere.status = status;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      customerWhere[Op.or] = [
        { first_name: { [Op.iLike]: q } },
        { last_name: { [Op.iLike]: q } },
        { '$user.email$': { [Op.iLike]: q } },
        { '$user.mobile$': { [Op.iLike]: q } },
      ];
    }

    const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
    const paginationConfig = parsePagination({ page, limit }, 10, 100);

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: customerWhere,
      subQuery: false,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'email', 'mobile', 'status'],
        },
        {
          model: Address,
          as: 'addresses',
          separate: true,
        },
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: paginationConfig.limit,
      offset: paginationConfig.offset,
      distinct: true,
    });

    const [totalRegistered, activeCount, inactiveCount] = await Promise.all([
      Customer.count(),
      Customer.count({
        include: [{ model: User, as: 'user', where: { status: 'ACTIVE' }, required: true }],
      }),
      Customer.count({
        include: [{ model: User, as: 'user', where: { status: 'INACTIVE' }, required: true }],
      }),
    ]);

    const pagination = buildPaginationResponse(count, paginationConfig.page, paginationConfig.limit);

    return {
      customers,
      records: customers,
      pagination,
      stats: {
        total: totalRegistered,
        active: activeCount,
        inactive: inactiveCount,
      },
    };
  }

  async toggleCustomerStatus(customerId, status) {
    const customer = await Customer.findByPk(customerId, { include: ['user'] });
    if (!customer) {
      throw new Error('Customer not found');
    }

    await customer.user.update({ status });
    return customer;
  }
  async getCustomerById(customerId) {
    const { Op } = require('sequelize');
    const customer = await Customer.findOne({
      where: {
        [Op.or]: [{ id: customerId }, { user_id: customerId }],
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status', 'createdAt'] },
        'addresses',
        {
          model: Order,
          as: 'orders',
          include: ['payment', 'delivery'],
          separate: true,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async getDriverById(driverId) {
    const driver = await Driver.findByPk(driverId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status', 'createdAt'] },
        {
          model: Delivery,
          as: 'deliveries',
          include: [
            {
              model: Order,
              as: 'order',
              include: [
                { model: Customer, as: 'customer', include: ['user'] },
                'address',
                'payment',
                'items',
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!driver) throw new Error('Driver not found');
    return driver;
  }

  async getDeliveries(options = {}) {
    const { status, search } = options;
    const { Op } = require('sequelize');
    const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
    const paginationConfig = parsePagination({
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    }, 10, 100);

    const deliveryWhere = {};
    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        deliveryWhere.status = [
          ORDER_STATUS.DRIVER_ASSIGNED,
          ORDER_STATUS.DRIVER_ACCEPTED,
          ORDER_STATUS.OUT_FOR_DELIVERY,
          ORDER_STATUS.ARRIVED,
        ];
      } else if (status === 'COMPLETED') {
        deliveryWhere.status = ORDER_STATUS.DELIVERED;
      } else {
        deliveryWhere.status = status;
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      deliveryWhere[Op.or] = [
        { status: { [Op.iLike]: q } },
        { '$order.order_number$': { [Op.iLike]: q } },
        { '$driver.user.email$': { [Op.iLike]: q } },
        { '$order.customer.user.email$': { [Op.iLike]: q } },
      ];
    }

    const { count, rows: deliveries } = await Delivery.findAndCountAll({
      where: deliveryWhere,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }] },
            'address',
            'items',
            'feedback',
            'status_history',
          ],
        },
        {
          model: Driver,
          as: 'driver',
          include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }],
        },
        {
          model: DriverLocation,
          as: 'locations',
          limit: 10,
          order: [['recorded_at', 'DESC']],
        },
      ],
      distinct: true,
      limit: paginationConfig.limit,
      offset: paginationConfig.offset,
      order: [['updatedAt', 'DESC'], ['id', 'DESC']],
    });

    // Unassigned orders awaiting driver assignment
    const unassignedCandidateOrders = await Order.findAll({
      where: {
        order_status: [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PAYMENT_VERIFIED,
          ORDER_STATUS.PROCESSING,
          ORDER_STATUS.PACKED,
          ORDER_STATUS.PENDING_PAYMENT,
        ],
      },
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }] },
        'address',
        'items',
        { model: Delivery, as: 'delivery', required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    const unassignedOrders = unassignedCandidateOrders.filter((ord) => {
      if (!ord.delivery || !ord.delivery.driver_id) return true;
      return false;
    });

    const activeCount = await Delivery.count({
      where: {
        status: [
          ORDER_STATUS.DRIVER_ASSIGNED,
          ORDER_STATUS.DRIVER_ACCEPTED,
          ORDER_STATUS.OUT_FOR_DELIVERY,
          ORDER_STATUS.ARRIVED,
        ],
      },
    });

    const completedCount = await Delivery.count({
      where: { status: ORDER_STATUS.DELIVERED },
    });

    const pagination = buildPaginationResponse(count, paginationConfig.page, paginationConfig.limit);

    return {
      deliveries,
      records: deliveries,
      pagination,
      unassignedOrders,
      stats: {
        activeCount,
        completedCount,
        unassignedCount: unassignedOrders.length,
        totalCount: count,
      },
    };
  }

  async getActiveDeliveries() {
    const res = await this.getDeliveries({ status: 'ACTIVE' });
    return res.deliveries;
  }

  async getAllInvoices() {
    const { Invoice } = require('../models');
    return await Invoice.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          include: [{ model: Customer, as: 'customer', include: ['user'] }],
        },
        'items',
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getAllFeedback() {
    const { Feedback } = require('../models');
    return await Feedback.findAll({
      include: [
        { model: Order, as: 'order' },
        { model: Customer, as: 'customer', include: ['user'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
  async createCustomer(customerData) {
    const { email, mobile, password, first_name, last_name } = customerData;
    const existingUser = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      throw new Error('Email or mobile number is already registered');
    }

    const hashedPassword = await hashPassword(password || 'Customer@123456');

    return await sequelize.transaction(async (t) => {
      const user = await User.create({
        email,
        mobile,
        password_hash: hashedPassword,
        role: ROLES.CUSTOMER,
        status: 'ACTIVE',
      }, { transaction: t });

      const customer = await Customer.create({
        user_id: user.id,
        first_name,
        last_name,
      }, { transaction: t });

      return await Customer.findByPk(customer.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
        transaction: t,
      });
    });
  }

  async updateCustomer(customerId, customerData) {
    const customer = await Customer.findByPk(customerId, { include: ['user'] });
    if (!customer) throw new Error('Customer not found');

    const { first_name, last_name, email, mobile } = customerData;
    await customer.update({ first_name, last_name });
    if (email || mobile) {
      await customer.user.update({ email, mobile });
    }
    return customer;
  }

  async addCustomerAddress(customerId, addressData) {
    const { Address } = require('../models');
    const { address_name, building_number, street, area, city, postal_code, is_default } = addressData;
    return await Address.create({
      customer_id: customerId,
      address_name: address_name || 'Home',
      building_number,
      street,
      area,
      city,
      postal_code,
      is_default: is_default || false,
    });
  }

  async deleteCustomerAddress(addressId) {
    const { Address } = require('../models');
    const address = await Address.findByPk(addressId);
    if (!address) throw new Error('Address not found');
    await address.destroy();
    return { success: true };
  }
  async getAllNotifications(typeFilter = null) {
    const { Notification } = require('../models');
    const where = {};
    if (typeFilter && typeFilter !== 'ALL') {
      where.type = typeFilter;
    }
    return await Notification.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async sendSystemNotification(data) {
    const { Notification } = require('../models');
    const { target_audience, user_id, type, title_en, title_ar, body_en, body_ar } = data;

    let targetUsers = [];
    if (target_audience === 'ALL_CUSTOMERS') {
      targetUsers = await User.findAll({ where: { role: ROLES.CUSTOMER } });
    } else if (target_audience === 'ALL_DRIVERS') {
      targetUsers = await User.findAll({ where: { role: ROLES.DRIVER } });
    } else if (target_audience === 'ALL_USERS') {
      targetUsers = await User.findAll();
    } else if (user_id) {
      const u = await User.findByPk(user_id);
      if (u) targetUsers = [u];
    }

    if (targetUsers.length === 0) {
      throw new Error('No target users found for this notification broadcast');
    }

    const createdNotifications = [];
    for (const u of targetUsers) {
      const notif = await Notification.create({
        user_id: u.id,
        type: type || 'SYSTEM_UPDATE',
        title_en,
        title_ar: title_ar || title_en,
        body_en,
        body_ar: body_ar || body_en,
        is_read: false,
      });
      createdNotifications.push(notif);
    }
    return createdNotifications;
  }

  async markNotificationRead(notificationId) {
    const { Notification } = require('../models');
    const notif = await Notification.findByPk(notificationId);
    if (!notif) throw new Error('Notification not found');
    await notif.update({ is_read: true });
    return notif;
  }

  async deleteNotification(notificationId) {
    const { Notification } = require('../models');
    const notif = await Notification.findByPk(notificationId);
    if (!notif) throw new Error('Notification not found');
    await notif.destroy();
    return { success: true };
  }

  // --- Role-Based Access Control (RBAC) & Identity Management ---
  async getRbacOverview(options = {}) {
    const { search, role, status } = options;
    const { Op } = require('sequelize');

    const where = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { email: { [Op.iLike]: q } },
        { mobile: { [Op.iLike]: q } },
      ];
    }

    const users = await User.findAll({
      where,
      include: [
        { model: Admin, as: 'admin', attributes: ['id', 'name', 'department'] },
        { model: Driver, as: 'driver', attributes: ['id', 'license_number', 'vehicle_details', 'driver_status', 'availability_status'] },
        { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const adminCount = await User.count({ where: { role: ROLES.ADMIN } });
    const driverCount = await User.count({ where: { role: ROLES.DRIVER } });
    const customerCount = await User.count({ where: { role: ROLES.CUSTOMER } });
    const activeCount = await User.count({ where: { status: 'ACTIVE' } });
    const inactiveCount = await User.count({ where: { status: 'INACTIVE' } });

    return {
      users,
      stats: {
        adminCount,
        driverCount,
        customerCount,
        activeCount,
        inactiveCount,
        totalCount: adminCount + driverCount + customerCount,
      },
    };
  }

  async updateUserRole(userId, newRole) {
    if (![ROLES.ADMIN, ROLES.DRIVER, ROLES.CUSTOMER].includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const user = await User.findByPk(userId, {
      include: ['admin', 'driver', 'customer'],
    });
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ role: newRole });

    // If upgraded/assigned to ADMIN and no Admin profile exists, create one
    if (newRole === ROLES.ADMIN && !user.admin) {
      const name = user.customer
        ? `${user.customer.first_name || ''} ${user.customer.last_name || ''}`.trim()
        : user.email.split('@')[0];
      await Admin.create({
        user_id: user.id,
        name: name || 'Admin Officer',
        department: 'Operations',
      });
    }

    return await User.findByPk(userId, {
      include: [
        { model: Admin, as: 'admin' },
        { model: Driver, as: 'driver' },
        { model: Customer, as: 'customer' },
      ],
    });
  }

  async toggleUserStatus(userId, status) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status must be ACTIVE or INACTIVE');
    }
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    await user.update({ status });
    return await User.findByPk(userId, {
      include: [
        { model: Admin, as: 'admin' },
        { model: Driver, as: 'driver' },
        { model: Customer, as: 'customer' },
      ],
    });
  }

  async createRbacUser(data) {
    const { email, mobile, password, role, name, department } = data;
    const { Op } = require('sequelize');

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      throw new Error('Email or mobile number is already registered');
    }

    const assignedRole = role || ROLES.ADMIN;
    const hashedPassword = await hashPassword(password || 'Admin@123456');

    return await sequelize.transaction(async (t) => {
      const user = await User.create({
        email,
        mobile,
        password_hash: hashedPassword,
        role: assignedRole,
        status: 'ACTIVE',
      }, { transaction: t });

      if (assignedRole === ROLES.ADMIN) {
        await Admin.create({
          user_id: user.id,
          name: name || email.split('@')[0],
          department: department || 'General Administration',
        }, { transaction: t });
      } else if (assignedRole === ROLES.CUSTOMER) {
        const parts = (name || 'Customer User').trim().split(' ');
        await Customer.create({
          user_id: user.id,
          first_name: parts[0] || 'Customer',
          last_name: parts.slice(1).join(' ') || 'User',
        }, { transaction: t });
      } else if (assignedRole === ROLES.DRIVER) {
        await Driver.create({
          user_id: user.id,
          license_number: 'LIC-' + Date.now().toString().slice(-6),
          vehicle_details: 'Falcon Fleet Vehicle',
          driver_status: 'ACTIVE',
          availability_status: 'OFFLINE',
        }, { transaction: t });
      }

      return await User.findByPk(user.id, {
        include: [
          { model: Admin, as: 'admin' },
          { model: Driver, as: 'driver' },
          { model: Customer, as: 'customer' },
        ],
        transaction: t,
      });
    });
  }
}

module.exports = new AdminService();
