const { Driver, Delivery, Order, Customer, Address, OrderItem, Product, DriverAssignment, DriverLocation, OrderStatusHistory, User, sequelize } = require('../models');
const { ORDER_STATUS, VALID_STATUS_TRANSITIONS } = require('../constants/orderStatus');
const { DRIVER_AVAILABILITY } = require('../constants/driverStatus');
const ROLES = require('../constants/roles');
const zatcaInvoiceService = require('./zatcaInvoiceService');

class DriverService {
  async getDriverProfileByUserId(userId) {
    const driver = await Driver.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'status'] }],
    });
    if (!driver) {
      throw new Error('Driver profile not found');
    }
    return driver;
  }

  async getAssignedDeliveries(driverId) {
    return await Delivery.findAll({
      where: { driver_id: driverId },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
            { model: Address, as: 'address' },
            { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async acceptDelivery(deliveryId, driverId) {
    const { emitOrderStatusUpdate } = require('../sockets/socketManager');
    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driver_id: driverId },
      include: ['order'],
    });

    if (!delivery) {
      throw new Error('Delivery not assigned to this driver');
    }

    if (delivery.order.order_status !== ORDER_STATUS.DRIVER_ASSIGNED) {
      throw new Error('Order is not in DRIVER_ASSIGNED state');
    }

    const result = await sequelize.transaction(async (t) => {
      await delivery.update({ status: ORDER_STATUS.DRIVER_ACCEPTED }, { transaction: t });
      await delivery.order.update({ order_status: ORDER_STATUS.DRIVER_ACCEPTED }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: delivery.order.id,
        from_status: ORDER_STATUS.DRIVER_ASSIGNED,
        to_status: ORDER_STATUS.DRIVER_ACCEPTED,
        notes: 'Driver accepted the delivery assignment.',
      }, { transaction: t });

      // Update driver availability to BUSY
      await Driver.update(
        { availability_status: DRIVER_AVAILABILITY.BUSY },
        { where: { id: driverId }, transaction: t }
      );

      return delivery;
    });

    emitOrderStatusUpdate({
      orderId: delivery.order.id,
      deliveryId: delivery.id,
      driverId,
      status: ORDER_STATUS.DRIVER_ACCEPTED,
      orderStatus: ORDER_STATUS.DRIVER_ACCEPTED,
      notes: 'Driver accepted the delivery assignment',
    });

    return result;
  }

  async updateDeliveryStatus(deliveryId, driverId, targetStatus, meta = {}) {
    const { emitOrderStatusUpdate } = require('../sockets/socketManager');
    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driver_id: driverId },
      include: ['order'],
    });

    if (!delivery) {
      throw new Error('Delivery assignment not found for this driver');
    }

    const currentStatus = delivery.order.order_status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(targetStatus)) {
      throw new Error(`Invalid delivery status transition from ${currentStatus} to ${targetStatus}`);
    }

    // OTP Verification for DELIVERED
    if (targetStatus === ORDER_STATUS.DELIVERED) {
      if (delivery.otp) {
        const inputOtp = String(meta.otp || '').trim();
        const expectedOtp = String(delivery.otp).trim();
        if (!inputOtp || inputOtp !== expectedOtp) {
          throw new Error('Invalid delivery PIN / OTP. Please enter the correct 4-digit code provided by the customer.');
        }
      }
    }

    const result = await sequelize.transaction(async (t) => {
      const updatePayload = { status: targetStatus };
      if (targetStatus === ORDER_STATUS.OUT_FOR_DELIVERY && !delivery.start_time) {
        updatePayload.start_time = new Date();
      } else if (targetStatus === ORDER_STATUS.DELIVERED) {
        updatePayload.end_time = new Date();
        updatePayload.otp_verified_at = new Date();
        if (meta.notes) updatePayload.proof_notes = meta.notes;
        if (meta.proof_image) updatePayload.proof_image = meta.proof_image;
      } else if (targetStatus === ORDER_STATUS.DELIVERY_FAILED) {
        updatePayload.failure_reason = meta.failure_reason || meta.notes || 'Customer unavailable / delivery could not be completed';
      }

      await delivery.update(updatePayload, { transaction: t });
      await delivery.order.update({ order_status: targetStatus }, { transaction: t });

      const historyNotes = meta.notes || meta.failure_reason || `Delivery status updated by driver to ${targetStatus}`;

      await OrderStatusHistory.create({
        order_id: delivery.order.id,
        from_status: currentStatus,
        to_status: targetStatus,
        notes: historyNotes,
      }, { transaction: t });

      // When DELIVERED or DELIVERY_FAILED: set driver availability back to AVAILABLE
      if (targetStatus === ORDER_STATUS.DELIVERED || targetStatus === ORDER_STATUS.DELIVERY_FAILED) {
        await Driver.update(
          { availability_status: DRIVER_AVAILABILITY.AVAILABLE },
          { where: { id: driverId }, transaction: t }
        );

        // Generate ZATCA Invoice on DELIVERED
        if (targetStatus === ORDER_STATUS.DELIVERED) {
          await zatcaInvoiceService.generateInvoiceForOrder(delivery.order.id, t);
        }
      }

      return delivery;
    });

    emitOrderStatusUpdate({
      orderId: delivery.order.id,
      deliveryId: delivery.id,
      driverId,
      status: targetStatus,
      orderStatus: targetStatus,
      notes: meta.notes || meta.failure_reason || '',
      data: {
        otpVerified: targetStatus === ORDER_STATUS.DELIVERED,
        failureReason: meta.failure_reason || null,
      },
    });

    return result;
  }

  async updateAvailability(driverId, availabilityStatus) {
    if (![DRIVER_AVAILABILITY.AVAILABLE, DRIVER_AVAILABILITY.BUSY, DRIVER_AVAILABILITY.OFFLINE].includes(availabilityStatus)) {
      throw new Error('Invalid availability status');
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    await driver.update({ availability_status: availabilityStatus });
    return driver;
  }

  async logDriverLocation(deliveryId, driverId, latitude, longitude, speed = null, heading = null) {
    const { emitDriverLocationUpdate } = require('../sockets/socketManager');
    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driver_id: driverId },
      include: ['order'],
    });

    if (!delivery || ![ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED].includes(delivery.order.order_status)) {
      return null; // GPS tracking operates strictly during active delivery
    }

    const loc = await DriverLocation.create({
      delivery_id: deliveryId,
      driver_id: driverId,
      latitude,
      longitude,
      speed,
      heading,
      recorded_at: new Date(),
    });

    // Also broadcast location via socket for instant client sync
    emitDriverLocationUpdate({
      deliveryId,
      orderId: delivery.order.id,
      driverId,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      temp: '3.5°C',
    });

    return loc;
  }

  async updateDriverProfile(userId, { mobile, email, vehicle_details }) {
    const driver = await Driver.findOne({
      where: { user_id: userId },
      include: ['user'],
    });
    if (!driver) {
      throw new Error('Driver profile not found');
    }

    await sequelize.transaction(async (t) => {
      const userUpdate = {};
      if (email) userUpdate.email = email;
      if (mobile) userUpdate.mobile = mobile;
      if (Object.keys(userUpdate).length > 0) {
        await driver.user.update(userUpdate, { transaction: t });
      }

      if (vehicle_details !== undefined) {
        await driver.update({ vehicle_details }, { transaction: t });
      }
    });

    return await this.getDriverProfileByUserId(userId);
  }

  async changeDriverPassword(userId, { currentPassword, newPassword }) {
    const { comparePassword, hashPassword } = require('../utils/password');
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const newHash = await hashPassword(newPassword);
    await user.update({ password_hash: newHash });
    return true;
  }
}

module.exports = new DriverService();
