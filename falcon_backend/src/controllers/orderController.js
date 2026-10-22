const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');

class OrderController {
  async createOrder(req, res, next) {
    try {
      let customer = req.user.customer;
      if (!customer) {
        const { Customer } = require('../models');
        customer = await Customer.findOne({ where: { user_id: req.user.id } });
        if (!customer) {
          customer = await Customer.create({
            user_id: req.user.id,
            first_name: req.user.email ? req.user.email.split('@')[0] : 'Customer',
          });
        }
      }
      const customerId = customer.id;
      const { addressId, notes, paymentMethod, couponCode, deliveryDate, deliverySlot, deliverySpeed } = req.body;

      const order = await orderService.createOrderFromCart(
        customerId,
        addressId,
        notes,
        paymentMethod,
        couponCode,
        deliveryDate,
        deliverySlot,
        deliverySpeed
      );
      return sendSuccess(res, 'Order placed successfully. Please submit bank payment confirmation.', { order }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      let customer = req.user.customer;
      if (!customer) {
        const { Customer } = require('../models');
        customer = await Customer.findOne({ where: { user_id: req.user.id } });
      }
      if (!customer) {
        return sendSuccess(res, 'Orders retrieved', { orders: [] });
      }
      const customerId = customer.id;
      const orders = await orderService.getCustomerOrders(customerId);
      return sendSuccess(res, 'Orders retrieved', { orders });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getOrderConfirmation(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderConfirmation(id);
      return sendSuccess(res, 'Order confirmation retrieved', { order });
    } catch (error) {
      return sendError(res, error.message, [], 404);
    }
  }

  async trackOrder(req, res, next) {
    try {
      const { identifier } = req.params;
      const order = await orderService.trackOrder(identifier);
      return sendSuccess(res, 'Order tracking retrieved', { order });
    } catch (error) {
      return sendError(res, error.message, [], 404);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user.id, req.user.role);
      return sendSuccess(res, 'Order details retrieved', { order });
    } catch (error) {
      return sendError(res, error.message, [], 403);
    }
  }

  async getAllOrdersAdmin(req, res, next) {
    try {
      const orders = await orderService.getAllOrders(req.query);
      return sendSuccess(res, 'All platform orders retrieved', { orders });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const order = await orderService.cancelOrder(id, req.user.id, req.user.role, reason);
      return sendSuccess(res, 'Order cancelled successfully', { order });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new OrderController();
