const adminService = require('../services/adminService');
const { sendSuccess, sendError } = require('../utils/response');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const data = await adminService.getDashboardMetrics();
      return sendSuccess(res, 'Admin dashboard metrics retrieved', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async createDriver(req, res, next) {
    try {
      const adminId = req.user.admin.id;
      const { email, mobile, password, license_number, vehicle_details } = req.body;

      if (!email || !mobile || !password || !license_number) {
        return sendError(res, 'Email, mobile, password, and license number are required', [], 400);
      }

      const driver = await adminService.createDriver(adminId, req.body);
      return sendSuccess(res, 'Driver account created successfully by Admin', { driver }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getDrivers(req, res, next) {
    try {
      const { search, availability, status, accountStatus } = req.query;
      const { drivers, stats } = await adminService.getAllDrivers({ search, availability, status, accountStatus });
      return sendSuccess(res, 'Drivers list retrieved', { drivers, stats });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateDriverStatus(req, res, next) {
    try {
      const { driverId } = req.params;
      const { driverStatus, availabilityStatus } = req.body;
      const driver = await adminService.updateDriverStatus(driverId, driverStatus, availabilityStatus);
      return sendSuccess(res, 'Driver status updated', { driver });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateDriver(req, res, next) {
    try {
      const { driverId } = req.params;
      const driver = await adminService.updateDriver(driverId, req.body);
      return sendSuccess(res, 'Driver profile updated successfully', { driver });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async toggleDriverAccountStatus(req, res, next) {
    try {
      const { driverId } = req.params;
      const { status } = req.body; // ACTIVE or INACTIVE
      const driver = await adminService.toggleDriverAccountStatus(driverId, status);
      return sendSuccess(res, `Driver account status updated to ${status}`, { driver });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getDriverLocation(req, res, next) {
    try {
      const { driverId } = req.params;
      const locationData = await adminService.getDriverLocation(driverId);
      return sendSuccess(res, 'Driver location retrieved', locationData);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async assignDriverToOrder(req, res, next) {
    try {
      const adminId = req.user.admin ? req.user.admin.id : null;
      const userId = req.user.id;
      const { orderId } = req.params;
      const { driverId, reassignmentReason } = req.body;

      if (!driverId) {
        return sendError(res, 'driverId is required', [], 400);
      }

      const delivery = await adminService.assignDriverToOrder(orderId, driverId, adminId, userId, reassignmentReason);
      return sendSuccess(res, 'Driver assigned to order successfully', { delivery });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const orderService = require('../services/orderService');
      const data = await orderService.getAllOrders(req.query);
      return sendSuccess(res, 'All platform orders retrieved', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const orderService = require('../services/orderService');
      const { orderId } = req.params;
      const { status, notes, reason } = req.body;
      const userId = req.user.id;

      if (!status) {
        return sendError(res, 'Target order status is required', [], 400);
      }

      const noteText = notes || reason || '';
      const order = await orderService.updateOrderStatus(orderId, status, userId, noteText);
      return sendSuccess(res, `Order status updated to ${status}`, { order });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getCustomers(req, res, next) {
    try {
      const { search, status } = req.query;
      const customers = await adminService.getAllCustomers({ search, status });
      return sendSuccess(res, 'Customers list retrieved', { customers });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async toggleCustomerStatus(req, res, next) {
    try {
      const { customerId } = req.params;
      const { status } = req.body; // ACTIVE or INACTIVE
      const customer = await adminService.toggleCustomerStatus(customerId, status);
      return sendSuccess(res, `Customer status set to ${status}`, { customer });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const { customerId } = req.params;
      const customer = await adminService.getCustomerById(customerId);
      return sendSuccess(res, 'Customer details retrieved', { customer });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getDriverById(req, res, next) {
    try {
      const { driverId } = req.params;
      const driver = await adminService.getDriverById(driverId);
      return sendSuccess(res, 'Driver details retrieved', { driver });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getDeliveries(req, res, next) {
    try {
      const deliveries = await adminService.getActiveDeliveries();
      return sendSuccess(res, 'Deliveries list retrieved', { deliveries });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const invoices = await adminService.getAllInvoices();
      return sendSuccess(res, 'Invoices list retrieved', { invoices });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getFeedback(req, res, next) {
    try {
      const feedbacks = await adminService.getAllFeedback();
      return sendSuccess(res, 'Feedback list retrieved', { feedbacks });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await adminService.createCustomer(req.body);
      return sendSuccess(res, 'Customer created successfully', { customer }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const { customerId } = req.params;
      const customer = await adminService.updateCustomer(customerId, req.body);
      return sendSuccess(res, 'Customer information updated successfully', { customer });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async addCustomerAddress(req, res, next) {
    try {
      const { customerId } = req.params;
      const address = await adminService.addCustomerAddress(customerId, req.body);
      return sendSuccess(res, 'Customer address added', { address }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteCustomerAddress(req, res, next) {
    try {
      const { addressId } = req.params;
      await adminService.deleteCustomerAddress(addressId);
      return sendSuccess(res, 'Customer address deleted successfully');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const { type } = req.query;
      const notifications = await adminService.getAllNotifications(type);
      return sendSuccess(res, 'Notifications list retrieved', { notifications });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async sendNotification(req, res, next) {
    try {
      const notifications = await adminService.sendSystemNotification(req.body);
      return sendSuccess(res, 'System notification broadcasted successfully', { notifications }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const notification = await adminService.markNotificationRead(notificationId);
      return sendSuccess(res, 'Notification marked as read', { notification });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;
      await adminService.deleteNotification(notificationId);
      return sendSuccess(res, 'Notification deleted successfully');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new AdminController();
