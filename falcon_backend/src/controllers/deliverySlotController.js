const deliverySlotService = require('../services/deliverySlotService');
const { sendSuccess, sendError } = require('../utils/response');

class DeliverySlotController {
  // Public endpoint for storefront checkout
  async getPublicDeliverySchedule(req, res) {
    try {
      const schedule = await deliverySlotService.getPublicDeliverySchedule();
      return sendSuccess(res, 'Delivery schedule retrieved', schedule);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve delivery schedule', [], 500);
    }
  }

  // Admin: Get all slots and settings
  async getAllSlotsAdmin(req, res) {
    try {
      const data = await deliverySlotService.getAllSlotsAdmin();
      return sendSuccess(res, 'All delivery slots retrieved', data);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve delivery slots', [], 500);
    }
  }

  // Admin: Create new slot
  async createSlot(req, res) {
    try {
      const slot = await deliverySlotService.createSlot(req.body);
      return sendSuccess(res, 'Delivery slot created successfully', { slot }, 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to create delivery slot', [], 400);
    }
  }

  // Admin: Update slot
  async updateSlot(req, res) {
    try {
      const { id } = req.params;
      const slot = await deliverySlotService.updateSlot(id, req.body);
      return sendSuccess(res, 'Delivery slot updated successfully', { slot });
    } catch (error) {
      return sendError(res, error.message || 'Failed to update delivery slot', [], 400);
    }
  }

  // Admin: Delete slot
  async deleteSlot(req, res) {
    try {
      const { id } = req.params;
      await deliverySlotService.deleteSlot(id);
      return sendSuccess(res, 'Delivery slot deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete delivery slot', [], 400);
    }
  }

  // Admin: Update schedule settings (days_ahead, cutoff_time, etc.)
  async updateSettings(req, res) {
    try {
      const settings = await deliverySlotService.updateSettings(req.body);
      return sendSuccess(res, 'Delivery schedule settings updated successfully', { settings });
    } catch (error) {
      return sendError(res, error.message || 'Failed to update schedule settings', [], 400);
    }
  }
}

module.exports = new DeliverySlotController();
