const { Driver, Delivery, Order, Customer, Address, OrderItem, Product, DriverAssignment, DriverLocation, OrderStatusHistory, User, Payment, sequelize } = require('../models');
const { ORDER_STATUS, VALID_STATUS_TRANSITIONS } = require('../constants/orderStatus');
const { DRIVER_AVAILABILITY } = require('../constants/driverStatus');
const PAYMENT_STATUS = require('../constants/paymentStatus');
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
            { model: Address, as: 'address', paranoid: false },
            { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
            { model: Payment, as: 'payment' },
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

    const isCod = String(delivery.order.payment_method || '').toUpperCase() === 'COD';
    let exactGrandTotal = 0;

    // OTP & COD Verification for DELIVERED
    if (targetStatus === ORDER_STATUS.DELIVERED) {
      if (delivery.otp) {
        const inputOtp = String(meta.otp || '').trim();
        const expectedOtp = String(delivery.otp).trim();
        if (!inputOtp || inputOtp !== expectedOtp) {
          throw new Error('Invalid delivery PIN / OTP. Please enter the correct 4-digit code provided by the customer.');
        }
      }

      // COD Collection Security & Verification
      if (isCod) {
        if (!meta.codCollected) {
          throw new Error('Cash collection confirmation is required to complete Cash on Delivery (COD) orders.');
        }

        exactGrandTotal = Math.round(parseFloat(delivery.order.grand_total || 0) * 100) / 100;
        if (meta.cashAmount !== undefined && meta.cashAmount !== null && meta.cashAmount !== '') {
          const submittedCash = Math.round(parseFloat(meta.cashAmount) * 100) / 100;
          if (isNaN(submittedCash) || Math.abs(submittedCash - exactGrandTotal) > 0.01) {
            throw new Error(`Collected cash amount must match order total exactly: SAR ${exactGrandTotal.toFixed(2)}`);
          }
        }

        // Prevent duplicate collection if already delivered
        if (delivery.status === ORDER_STATUS.DELIVERED && delivery.cod_collected_at) {
          throw new Error('COD cash payment for this order has already been collected and confirmed.');
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

        // Record COD collection on delivery
        if (isCod) {
          updatePayload.cod_amount_collected = exactGrandTotal;
          updatePayload.cod_collected_at = new Date();
          updatePayload.cod_driver_id = driverId;
          updatePayload.cod_collection_status = 'COLLECTED_BY_DRIVER';
          updatePayload.cash_handover_status = 'AWAITING_ADMIN_CONFIRMATION';

          // COD Payment status MUST remain PENDING until physical cash handover is confirmed by Admin
          const existingPayment = await Payment.findOne({
            where: { order_id: delivery.order.id },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (existingPayment) {
            await existingPayment.update({
              status: PAYMENT_STATUS.PENDING,
              amount: exactGrandTotal,
              payment_method: 'COD',
              payment_gateway: 'COD',
            }, { transaction: t });
          } else {
            await Payment.create({
              order_id: delivery.order.id,
              amount: exactGrandTotal,
              status: PAYMENT_STATUS.PENDING,
              payment_method: 'COD',
              payment_gateway: 'COD',
            }, { transaction: t });
          }
        }
      } else if (targetStatus === ORDER_STATUS.DELIVERY_FAILED) {
        updatePayload.failure_reason = meta.failure_reason || meta.notes || 'Customer unavailable / delivery could not be completed';
      }

      await delivery.update(updatePayload, { transaction: t });
      await delivery.order.update({ order_status: targetStatus }, { transaction: t });

      const historyNotes = meta.notes || meta.failure_reason || (isCod && targetStatus === ORDER_STATUS.DELIVERED
        ? `Delivery completed. Cash SAR ${exactGrandTotal.toFixed(2)} collected by driver. Payment remains PENDING awaiting admin cash reconciliation.`
        : `Delivery status updated by driver to ${targetStatus}`);

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
        codCollected: isCod && targetStatus === ORDER_STATUS.DELIVERED,
        codAmount: isCod && targetStatus === ORDER_STATUS.DELIVERED ? exactGrandTotal : null,
        paymentStatus: isCod && targetStatus === ORDER_STATUS.DELIVERED ? PAYMENT_STATUS.PENDING : undefined,
        codCollectionStatus: isCod && targetStatus === ORDER_STATUS.DELIVERED ? 'COLLECTED_BY_DRIVER' : undefined,
        cashHandoverStatus: isCod && targetStatus === ORDER_STATUS.DELIVERED ? 'AWAITING_ADMIN_CONFIRMATION' : undefined,
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
