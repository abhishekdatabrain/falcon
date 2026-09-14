const { Driver, Delivery, Order, Customer, Address, OrderItem, DriverAssignment, DriverLocation, OrderStatusHistory, User, sequelize } = require('../models');
const { ORDER_STATUS, VALID_STATUS_TRANSITIONS } = require('../constants/orderStatus');
const { DRIVER_AVAILABILITY } = require('../constants/driverStatus');
const ROLES = require('../constants/roles');
const zatcaInvoiceService = require('./zatcaInvoiceService');

class DriverService {
  async getDriverProfileByUserId(userId) {
    const driver = await Driver.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }],
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
            { model: OrderItem, as: 'items' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async acceptDelivery(deliveryId, driverId) {
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

    return await sequelize.transaction(async (t) => {
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
  }

  async updateDeliveryStatus(deliveryId, driverId, targetStatus) {
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

    return await sequelize.transaction(async (t) => {
      const updatePayload = { status: targetStatus };
      if (targetStatus === ORDER_STATUS.OUT_FOR_DELIVERY && !delivery.start_time) {
        updatePayload.start_time = new Date();
      } else if (targetStatus === ORDER_STATUS.DELIVERED) {
        updatePayload.end_time = new Date();
      }

      await delivery.update(updatePayload, { transaction: t });
      await delivery.order.update({ order_status: targetStatus }, { transaction: t });

      await OrderStatusHistory.create({
        order_id: delivery.order.id,
        from_status: currentStatus,
        to_status: targetStatus,
        notes: `Delivery status updated by driver to ${targetStatus}`,
      }, { transaction: t });

      // When DELIVERED: set driver availability back to AVAILABLE & generate ZATCA Invoice
      if (targetStatus === ORDER_STATUS.DELIVERED) {
        await Driver.update(
          { availability_status: DRIVER_AVAILABILITY.AVAILABLE },
          { where: { id: driverId }, transaction: t }
        );

        // Generate ZATCA Invoice
        await zatcaInvoiceService.generateInvoiceForOrder(delivery.order.id, t);
      }

      return delivery;
    });
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
    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driver_id: driverId },
      include: ['order'],
    });

    if (!delivery || ![ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED].includes(delivery.order.order_status)) {
      return null; // GPS tracking operates strictly during active delivery
    }

    return await DriverLocation.create({
      delivery_id: deliveryId,
      driver_id: driverId,
      latitude,
      longitude,
      speed,
      heading,
      recorded_at: new Date(),
    });
  }
}

module.exports = new DriverService();
