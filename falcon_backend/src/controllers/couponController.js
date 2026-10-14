const couponService = require('../services/couponService');
const { sendSuccess, sendError } = require('../utils/response');

class CouponController {
  // Public / Authenticated: Validate a coupon against subtotal
  async validateCoupon(req, res) {
    try {
      const { code, subtotal } = req.body;
      const result = await couponService.validateCoupon(code, subtotal);
      if (!result.valid) {
        return sendError(res, result.message, [], 400);
      }
      return sendSuccess(res, result.message, result);
    } catch (error) {
      return sendError(res, error.message || 'Failed to validate coupon', [], 500);
    }
  }

  // Public: Get all active coupons for shoppers
  async getActiveCoupons(req, res) {
    try {
      const coupons = await couponService.getActiveCoupons();
      return sendSuccess(res, 'Active coupons retrieved', { coupons });
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve coupons', [], 500);
    }
  }

  // Admin: Get all coupons
  async getAllCouponsAdmin(req, res) {
    try {
      const coupons = await couponService.getAllCouponsAdmin();
      return sendSuccess(res, 'All coupons retrieved', { coupons });
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve coupons', [], 500);
    }
  }

  // Admin: Create coupon
  async createCoupon(req, res) {
    try {
      const coupon = await couponService.createCoupon(req.body);
      return sendSuccess(res, 'Coupon created successfully', { coupon }, 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to create coupon', [], 400);
    }
  }

  // Admin: Update coupon
  async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const coupon = await couponService.updateCoupon(id, req.body);
      return sendSuccess(res, 'Coupon updated successfully', { coupon });
    } catch (error) {
      return sendError(res, error.message || 'Failed to update coupon', [], 400);
    }
  }

  // Admin: Delete coupon
  async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      await couponService.deleteCoupon(id);
      return sendSuccess(res, 'Coupon deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete coupon', [], 400);
    }
  }
}

module.exports = new CouponController();
