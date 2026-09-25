const { User, Driver, Customer, Order, Payment, Product, Delivery, DriverAssignment, OrderStatusHistory, sequelize } = require('../models');
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
    const { email, mobile, password, license_number, vehicle_details } = driverData;

    const existingUser = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      throw new Error('Email or mobile number is already registered');
    }

    const hashedPassword = await hashPassword(password);

    return await sequelize.transaction(async (t) => {
      const user = await User.create({
        email,
        mobile,
        password_hash: hashedPassword,
        role: ROLES.DRIVER,
        status: 'ACTIVE',
      }, { transaction: t });

      const driver = await Driver.create({
        user_id: user.id,
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
    const { search, availability, status, accountStatus } = options;
    const { Op } = require('sequelize');

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
        { license_number: { [Op.iLike]: q } },
        { vehicle_details: { [Op.iLike]: q } },
        { '$user.email$': { [Op.iLike]: q } },
        { '$user.mobile$': { [Op.iLike]: q } },
      ];
    }

    const drivers = await Driver.findAll({
      where: driverWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'email', 'mobile', 'status', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
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

    return { drivers, stats };
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
    const { email, mobile, license_number, vehicle_details } = data;
    const driver = await Driver.findByPk(driverId, { include: ['user'] });
    if (!driver) {
      throw new Error('Driver not found');
    }

    await sequelize.transaction(async (t) => {
      if (email || mobile) {
        const userUpdate = {};
        if (email) userUpdate.email = email;
        if (mobile) userUpdate.mobile = mobile;
        await driver.user.update(userUpdate, { transaction: t });
      }

      const driverUpdate = {};
      if (license_number) driverUpdate.license_number = license_number;
      if (vehicle_details !== undefined) driverUpdate.vehicle_details = vehicle_details;

      await driver.update(driverUpdate, { transaction: t });
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
      order: [['createdAt', 'DESC']],
    });

    return {
      driver,
      location: lastLocation || {
        latitude: 24.7136,
        longitude: 46.6753,
        speed: 35,
        heading: 90,
        updatedAt: new Date(),
        isSimulated: true,
      },
    };
  }

  async assignDriverToOrder(orderId, driverId, adminId, userId, reassignmentReason = '') {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver || driver.driver_status !== DRIVER_STATUS.ACTIVE) {
      throw new Error('Selected driver is not active or valid');
    }

    if (driver.availability_status === DRIVER_AVAILABILITY.OFFLINE) {
      throw new Error('Selected driver is currently OFFLINE');
    }

    let effectiveAdminId = adminId;
    if (!effectiveAdminId && userId) {
      const { Admin } = require('../models');
      const adminRecord = await Admin.findOne({ where: { user_id: userId } });
      if (adminRecord) effectiveAdminId = adminRecord.id;
    }

    return await sequelize.transaction(async (t) => {
      let delivery = await Delivery.findOne({ where: { order_id: orderId }, transaction: t });
      let previousDriverId = null;

      if (delivery) {
        previousDriverId = delivery.driver_id;
        await delivery.update({ driver_id: driverId, status: ORDER_STATUS.DRIVER_ASSIGNED }, { transaction: t });
      } else {
        delivery = await Delivery.create({
          order_id: orderId,
          driver_id: driverId,
          status: ORDER_STATUS.DRIVER_ASSIGNED,
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
          reassignment_reason: reassignmentReason,
        }, { transaction: t });
      }

      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: prevStatus,
        to_status: ORDER_STATUS.DRIVER_ASSIGNED,
        changed_by_user_id: userId || null,
        notes: `Driver assigned by Admin. Assigned Driver ID: ${driverId}`,
      }, { transaction: t });

      // Update driver availability to BUSY
      await driver.update({ availability_status: DRIVER_AVAILABILITY.BUSY }, { transaction: t });

      return delivery;
    });
  }

  async getAllCustomers(options = {}) {
    const { search, status } = options;
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

    return await Customer.findAll({
      where: customerWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'email', 'mobile', 'status'],
        },
        'addresses',
      ],
      order: [['createdAt', 'DESC']],
    });
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

  async getActiveDeliveries() {
    return await Delivery.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
            'address',
          ],
        },
        {
          model: Driver,
          as: 'driver',
          include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });
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
}

module.exports = new AdminService();
