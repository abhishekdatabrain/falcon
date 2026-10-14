const { Coupon } = require('../models');
const { Op } = require('sequelize');

class CouponService {
  async validateCoupon(code, subtotal = 0) {
    if (!code || typeof code !== 'string') {
      return {
        valid: false,
        message: 'Promo code is required',
      };
    }

    const normalizedCode = code.trim().toUpperCase();
    const parsedSubtotal = parseFloat(subtotal) || 0;

    const coupon = await Coupon.findOne({
      where: {
        code: normalizedCode,
        is_active: true,
      },
    });

    if (!coupon) {
      return {
        valid: false,
        message: 'Invalid or inactive promo code',
      };
    }

    const now = new Date();

    // Check Start Date
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return {
        valid: false,
        message: 'This promo code is not active yet',
      };
    }

    // Check End Date
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return {
        valid: false,
        message: 'This promo code has expired',
      };
    }

    // Check Usage Limit
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.used_count >= coupon.usage_limit) {
      return {
        valid: false,
        message: 'This promo code has reached its maximum usage limit',
      };
    }

    // Check Minimum Order Amount
    const minOrder = parseFloat(coupon.min_order_amount) || 0;
    if (parsedSubtotal < minOrder) {
      return {
        valid: false,
        message: `Minimum order amount of SAR ${minOrder.toFixed(2)} is required for this coupon`,
      };
    }

    // Calculate Discount Amount
    let discountAmount = 0;
    const discountVal = parseFloat(coupon.discount_value) || 0;

    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (parsedSubtotal * discountVal) / 100;
      if (coupon.max_discount_amount !== null && coupon.max_discount_amount !== undefined) {
        const maxCap = parseFloat(coupon.max_discount_amount);
        if (discountAmount > maxCap) {
          discountAmount = maxCap;
        }
      }
    } else {
      // FIXED discount
      discountAmount = Math.min(parsedSubtotal, discountVal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalSubtotal = Math.max(0, Math.round((parsedSubtotal - discountAmount) * 100) / 100);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: discountVal,
        description_en: coupon.description_en,
        description_ar: coupon.description_ar,
        min_order_amount: minOrder,
        max_discount_amount: coupon.max_discount_amount ? parseFloat(coupon.max_discount_amount) : null,
      },
      discountAmount,
      subtotal: parsedSubtotal,
      finalSubtotal,
      message: 'Promo code applied successfully!',
    };
  }

  async getActiveCoupons() {
    const now = new Date();
    return await Coupon.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { start_date: null },
          { start_date: { [Op.lte]: now } },
        ],
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: now } },
        ],
      },
      attributes: [
        'id',
        'code',
        'description_en',
        'description_ar',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
      ],
      order: [['discount_value', 'DESC']],
    });
  }

  async getAllCouponsAdmin() {
    return await Coupon.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  async createCoupon(data) {
    const code = String(data.code || '').trim().toUpperCase();
    if (!code) throw new Error('Coupon code is required');
    return await Coupon.create({
      ...data,
      code,
    });
  }

  async updateCoupon(id, data) {
    const coupon = await Coupon.findByPk(id);
    if (!coupon) throw new Error('Coupon not found');
    if (data.code) {
      data.code = String(data.code).trim().toUpperCase();
    }
    return await coupon.update(data);
  }

  async deleteCoupon(id) {
    const coupon = await Coupon.findByPk(id);
    if (!coupon) throw new Error('Coupon not found');
    await coupon.destroy();
    return true;
  }
}

module.exports = new CouponService();
