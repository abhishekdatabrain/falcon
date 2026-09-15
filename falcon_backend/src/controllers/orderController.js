const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const { addressId, notes } = req.body;
      if (!addressId) {
        return sendError(res, 'Delivery addressId is required', [], 400);
      }

      const order = await orderService.createOrderFromCart(customerId, addressId, notes);
      return sendSuccess(res, 'Order placed successfully. Please submit bank payment confirmation.', { order }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const orders = await orderService.getCustomerOrders(customerId);
      return sendSuccess(res, 'Orders retrieved', { orders });
    } catch (error) {
      return sendError(res, error.message, [], 400);
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
