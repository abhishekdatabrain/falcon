const driverService = require('../services/driverService');
const { sendSuccess, sendError } = require('../utils/response');

class DriverController {
  async getDashboard(req, res, next) {
    try {
      const driver = await driverService.getDriverProfileByUserId(req.user.id);
      const deliveries = await driverService.getAssignedDeliveries(driver.id);
      return sendSuccess(res, 'Driver dashboard retrieved', {
        driver,
        deliveries,
      });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async acceptDelivery(req, res, next) {
    try {
      const driver = await driverService.getDriverProfileByUserId(req.user.id);
      const { deliveryId } = req.params;
      const delivery = await driverService.acceptDelivery(deliveryId, driver.id);
      return sendSuccess(res, 'Delivery accepted successfully', { delivery });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateDeliveryStatus(req, res, next) {
    try {
      const driver = await driverService.getDriverProfileByUserId(req.user.id);
      const { deliveryId } = req.params;
      const { status } = req.body;

      if (!status) {
        return sendError(res, 'Status is required', [], 400);
      }

      const delivery = await driverService.updateDeliveryStatus(deliveryId, driver.id, status, req.body);
      return sendSuccess(res, `Delivery status updated to ${status}`, { delivery });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateAvailability(req, res, next) {
    try {
      const driver = await driverService.getDriverProfileByUserId(req.user.id);
      const { availabilityStatus } = req.body;
      if (!availabilityStatus) {
        return sendError(res, 'availabilityStatus is required', [], 400);
      }

      const updatedDriver = await driverService.updateAvailability(driver.id, availabilityStatus);
      return sendSuccess(res, `Availability updated to ${availabilityStatus}`, { driver: updatedDriver });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async logGpsLocation(req, res, next) {
    try {
      const driver = await driverService.getDriverProfileByUserId(req.user.id);
      const {
        driver_id,
        driverId,
        order_id,
        orderId,
        delivery_id,
        deliveryId,
        latitude,
        lat,
        longitude,
        lng,
        accuracy,
        heading,
        speed,
        timestamp,
      } = req.body;

      // Security check: driver can only report location for their own driver profile
      const requestedDriverId = driver_id || driverId;
      if (requestedDriverId && requestedDriverId !== driver.id && req.user.role !== 'ADMIN') {
        return sendError(res, 'Access denied. You can only update your own driver location.', [], 403);
      }

      const effectiveLat = latitude !== undefined ? latitude : lat;
      const effectiveLng = longitude !== undefined ? longitude : lng;

      if (effectiveLat === undefined || effectiveLat === null || effectiveLng === undefined || effectiveLng === null) {
        return sendError(res, 'Latitude and longitude coordinates are required', [], 400);
      }

      const effectiveDeliveryId = delivery_id || deliveryId || null;
      const effectiveOrderId = order_id || orderId || null;

      const locationLog = await driverService.logDriverLocation(
        effectiveDeliveryId,
        driver.id,
        effectiveLat,
        effectiveLng,
        speed,
        heading,
        accuracy,
        timestamp,
        effectiveOrderId
      );

      return sendSuccess(res, 'Driver live location updated successfully', { locationLog });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { mobile, email, vehicle_details } = req.body;
      const updated = await driverService.updateDriverProfile(req.user.id, {
        mobile,
        email,
        vehicle_details,
      });
      return sendSuccess(res, 'Driver profile updated successfully', { driver: updated });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return sendError(res, 'Current password and new password are required', [], 400);
      }
      await driverService.changeDriverPassword(req.user.id, { currentPassword, newPassword });
      return sendSuccess(res, 'Password changed successfully');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new DriverController();
