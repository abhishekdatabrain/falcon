const tipSettingService = require('../services/tipSettingService');
const { sendSuccess, sendError } = require('../utils/response');

class TipSettingController {
  /**
   * Public endpoint for checkout and mobile clients
   */
  async getPublicTipSettings(req, res) {
    try {
      const data = await tipSettingService.getPublicSettings();
      return sendSuccess(res, 'Active tip settings retrieved successfully', data);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve tip settings', [], 500);
    }
  }

  /**
   * Admin endpoint to get full tip configuration
   */
  async getAdminTipSettings(req, res) {
    try {
      const data = await tipSettingService.getSettings();
      return sendSuccess(res, 'Tip configuration retrieved successfully', data);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve tip configuration', [], 500);
    }
  }

  /**
   * Admin endpoint to update tip configuration
   */
  async updateTipSettings(req, res) {
    try {
      const updated = await tipSettingService.updateSettings({
        payload: req.body,
        adminUser: req.user,
        req,
      });
      return sendSuccess(res, 'Tip configuration updated successfully', updated);
    } catch (error) {
      return sendError(res, error.message || 'Failed to update tip configuration', [], 400);
    }
  }
}

module.exports = new TipSettingController();
