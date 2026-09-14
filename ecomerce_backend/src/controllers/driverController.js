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

      const delivery = await driverService.updateDeliveryStatus(deliveryId, driver.id, status);
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
      const { deliveryId, latitude, longitude, speed, heading } = req.body;

      if (!deliveryId || latitude === undefined || longitude === undefined) {
        return sendError(res, 'deliveryId, latitude, and longitude are required', [], 400);
      }

      const locationLog = await driverService.logDriverLocation(
        deliveryId,
        driver.id,
        latitude,
        longitude,
        speed,
        heading
      );

      return sendSuccess(res, 'GPS snapshot logged', { locationLog });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new DriverController();
