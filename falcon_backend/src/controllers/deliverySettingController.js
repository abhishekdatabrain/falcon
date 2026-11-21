const deliverySettingService = require('../services/deliverySettingService');
const { sendSuccess, sendError } = require('../utils/response');

class DeliverySettingController {
  /**
   * Public endpoint for checkout and storefront
   */
  async getPublicDeliverySettings(req, res) {
    try {
      const data = await deliverySettingService.getActiveDeliverySettings();
      return sendSuccess(res, 'Active delivery charges retrieved successfully', data);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve delivery settings', [], 500);
    }
  }

  /**
   * Admin endpoint to get full delivery methods configuration
   */
  async getAdminDeliverySettings(req, res) {
    try {
      const data = await deliverySettingService.getDeliverySettings();
      return sendSuccess(res, 'Delivery charges configuration retrieved', data);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve delivery charges configuration', [], 500);
    }
  }

  /**
   * Admin endpoint to update delivery methods configuration
   */
  async updateDeliverySettings(req, res) {
    try {
      const { express, standard } = req.body;
      const updated = await deliverySettingService.updateDeliverySettings({
        express,
        standard,
        adminUser: req.user,
        req,
      });
      return sendSuccess(res, 'Delivery charges updated successfully', updated);
    } catch (error) {
      return sendError(res, error.message || 'Failed to update delivery charges', [], 400);
    }
  }
}

module.exports = new DeliverySettingController();
