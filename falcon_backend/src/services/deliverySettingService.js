const { DeliverySetting, AuditLog, sequelize } = require('../models');

const DEFAULT_SETTINGS = {
  EXPRESS: {
    method_type: 'EXPRESS',
    name_en: 'Express Delivery',
    name_ar: 'توصيل سريع',
    is_enabled: true,
    base_fee: 12.00,
    estimated_delivery_minutes: 90,
    min_order_amount: 0.00,
    free_delivery_threshold: null,
    zone_rules: null,
  },
  STANDARD: {
    method_type: 'STANDARD',
    name_en: 'Standard Schedule',
    name_ar: 'توصيل قياسي مجدول',
    is_enabled: true,
    base_fee: 0.00,
    estimated_delivery_minutes: null,
    min_order_amount: 0.00,
    free_delivery_threshold: 100.00,
    zone_rules: null,
  },
};

class DeliverySettingService {
  /**
   * Ensure default settings exist in DB if table is empty.
   */
  async ensureDefaults() {
    const count = await DeliverySetting.count();
    if (count === 0) {
      await DeliverySetting.bulkCreate([
        DEFAULT_SETTINGS.EXPRESS,
        DEFAULT_SETTINGS.STANDARD,
      ]);
    }
  }

  /**
   * Retrieve all delivery settings (for Admin Panel).
   */
  async getDeliverySettings() {
    await this.ensureDefaults();

    const settings = await DeliverySetting.findAll({
      order: [['method_type', 'ASC']],
    });

    const express = settings.find((s) => s.method_type === 'EXPRESS') || null;
    const standard = settings.find((s) => s.method_type === 'STANDARD') || null;

    return {
      express: express ? express.toJSON() : DEFAULT_SETTINGS.EXPRESS,
      standard: standard ? standard.toJSON() : DEFAULT_SETTINGS.STANDARD,
      list: settings.map((s) => s.toJSON()),
    };
  }

  /**
   * Retrieve public active delivery settings for checkout.
   */
  async getActiveDeliverySettings() {
    const { express, standard } = await this.getDeliverySettings();

    return {
      express: {
        method_type: 'EXPRESS',
        name_en: express.name_en || 'Express Delivery',
        name_ar: express.name_ar || 'توصيل سريع',
        is_enabled: Boolean(express.is_enabled),
        base_fee: parseFloat(express.base_fee ?? 12.00),
        estimated_delivery_minutes: parseInt(express.estimated_delivery_minutes ?? 90, 10),
        min_order_amount: parseFloat(express.min_order_amount ?? 0.00),
      },
      standard: {
        method_type: 'STANDARD',
        name_en: standard.name_en || 'Standard Schedule',
        name_ar: standard.name_ar || 'توصيل قياسي مجدول',
        is_enabled: Boolean(standard.is_enabled),
        base_fee: parseFloat(standard.base_fee ?? 0.00),
        free_delivery_threshold: standard.free_delivery_threshold !== null
          ? parseFloat(standard.free_delivery_threshold)
          : 100.00,
        min_order_amount: parseFloat(standard.min_order_amount ?? 0.00),
      },
    };
  }

  /**
   * Authoritative backend delivery fee calculation.
   * Never trusts the frontend-submitted delivery fee.
   *
   * @param {string} deliverySpeed - 'express' | 'standard'
   * @param {number} subtotal - items subtotal (SAR)
   * @returns {Promise<{ fee: number, methodType: string, setting: object }>}
   */
  async calculateDeliveryFee(deliverySpeed = 'express', subtotal = 0) {
    const normalizedSpeed = String(deliverySpeed || 'express').toLowerCase();
    const methodType = normalizedSpeed === 'standard' ? 'STANDARD' : 'EXPRESS';

    let setting = await DeliverySetting.findOne({
      where: { method_type: methodType },
    });

    if (!setting) {
      await this.ensureDefaults();
      setting = await DeliverySetting.findOne({
        where: { method_type: methodType },
      });
    }

    // Check if the chosen delivery method is currently active
    if (setting && !setting.is_enabled) {
      const methodName = setting.name_en || (methodType === 'EXPRESS' ? 'Express Delivery' : 'Standard Delivery');
      throw new Error(`${methodName} is currently unavailable. Please select another delivery method.`);
    }

    let calculatedFee = 0.00;

    if (methodType === 'EXPRESS') {
      calculatedFee = parseFloat(setting?.base_fee ?? 12.00);
    } else {
      const baseFee = parseFloat(setting?.base_fee ?? 0.00);
      const freeThreshold = setting?.free_delivery_threshold !== null && setting?.free_delivery_threshold !== undefined
        ? parseFloat(setting.free_delivery_threshold)
        : 100.00;

      if (!isNaN(freeThreshold) && freeThreshold > 0 && subtotal >= freeThreshold) {
        calculatedFee = 0.00; // Free delivery threshold met
      } else {
        calculatedFee = baseFee;
      }
    }

    return {
      fee: Math.max(0, Math.round(calculatedFee * 100) / 100),
      methodType,
      deliverySpeed: normalizedSpeed,
      setting: setting ? setting.toJSON() : null,
    };
  }

  /**
   * Update delivery settings with validation, atomic transaction and audit log.
   */
  async updateDeliverySettings({ express, standard, adminUser, req }) {
    if (!express && !standard) {
      throw new Error('At least one delivery method settings payload must be provided');
    }

    await this.ensureDefaults();

    // Validation
    if (express) {
      if (express.base_fee !== undefined && (isNaN(Number(express.base_fee)) || Number(express.base_fee) < 0)) {
        throw new Error('Express delivery charge must be a non-negative number');
      }
      if (
        express.estimated_delivery_minutes !== undefined &&
        (isNaN(Number(express.estimated_delivery_minutes)) || Number(express.estimated_delivery_minutes) <= 0)
      ) {
        throw new Error('Estimated delivery time must be greater than 0 minutes');
      }
    }

    if (standard) {
      if (standard.base_fee !== undefined && (isNaN(Number(standard.base_fee)) || Number(standard.base_fee) < 0)) {
        throw new Error('Standard delivery charge must be a non-negative number');
      }
      if (
        standard.free_delivery_threshold !== undefined &&
        standard.free_delivery_threshold !== null &&
        standard.free_delivery_threshold !== '' &&
        (isNaN(Number(standard.free_delivery_threshold)) || Number(standard.free_delivery_threshold) < 0)
      ) {
        throw new Error('Free delivery minimum order amount must be a non-negative number');
      }
    }

    return await sequelize.transaction(async (t) => {
      const expressRecord = await DeliverySetting.findOne({
        where: { method_type: 'EXPRESS' },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const standardRecord = await DeliverySetting.findOne({
        where: { method_type: 'STANDARD' },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const nextExpressEnabled = express?.is_enabled !== undefined
        ? Boolean(express.is_enabled)
        : expressRecord?.is_enabled ?? true;

      const nextStandardEnabled = standard?.is_enabled !== undefined
        ? Boolean(standard.is_enabled)
        : standardRecord?.is_enabled ?? true;

      // Prevent disabling both delivery methods
      if (!nextExpressEnabled && !nextStandardEnabled) {
        throw new Error('Cannot disable both delivery methods. At least one delivery method must remain active for checkout.');
      }

      const beforeSnapshot = {
        express: expressRecord ? expressRecord.toJSON() : null,
        standard: standardRecord ? standardRecord.toJSON() : null,
      };

      if (express && expressRecord) {
        const updateFields = {
          updated_by_admin_id: adminUser?.id || null,
        };
        if (express.is_enabled !== undefined) updateFields.is_enabled = Boolean(express.is_enabled);
        if (express.base_fee !== undefined) updateFields.base_fee = parseFloat(express.base_fee);
        if (express.estimated_delivery_minutes !== undefined) {
          updateFields.estimated_delivery_minutes = parseInt(express.estimated_delivery_minutes, 10);
        }
        if (express.name_en !== undefined) updateFields.name_en = express.name_en.trim();
        if (express.name_ar !== undefined) updateFields.name_ar = express.name_ar.trim();
        if (express.min_order_amount !== undefined) updateFields.min_order_amount = parseFloat(express.min_order_amount || 0);
        if (express.zone_rules !== undefined) updateFields.zone_rules = express.zone_rules;

        await expressRecord.update(updateFields, { transaction: t });
      }

      if (standard && standardRecord) {
        const updateFields = {
          updated_by_admin_id: adminUser?.id || null,
        };
        if (standard.is_enabled !== undefined) updateFields.is_enabled = Boolean(standard.is_enabled);
        if (standard.base_fee !== undefined) updateFields.base_fee = parseFloat(standard.base_fee);
        if (standard.free_delivery_threshold !== undefined) {
          updateFields.free_delivery_threshold = standard.free_delivery_threshold !== null && standard.free_delivery_threshold !== ''
            ? parseFloat(standard.free_delivery_threshold)
            : null;
        }
        if (standard.name_en !== undefined) updateFields.name_en = standard.name_en.trim();
        if (standard.name_ar !== undefined) updateFields.name_ar = standard.name_ar.trim();
        if (standard.min_order_amount !== undefined) updateFields.min_order_amount = parseFloat(standard.min_order_amount || 0);
        if (standard.zone_rules !== undefined) updateFields.zone_rules = standard.zone_rules;

        await standardRecord.update(updateFields, { transaction: t });
      }

      const afterSnapshot = {
        express: expressRecord ? expressRecord.toJSON() : null,
        standard: standardRecord ? standardRecord.toJSON() : null,
      };

      // Record Audit Log
      try {
        await AuditLog.create({
          user_id: adminUser?.id || null,
          admin_name: adminUser?.name || adminUser?.email || 'Admin',
          admin_email: adminUser?.email || null,
          action: 'UPDATE_DELIVERY_CHARGES',
          module: 'DELIVERY',
          entity_type: 'DeliverySetting',
          entity_id: 'EXPRESS_STANDARD',
          details: {
            before: beforeSnapshot,
            after: afterSnapshot,
          },
          ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null,
        }, { transaction: t });
      } catch (auditErr) {
        // Non-fatal if audit log fails
        console.error('AuditLog creation error for delivery settings update:', auditErr);
      }

      return {
        express: expressRecord ? expressRecord.toJSON() : null,
        standard: standardRecord ? standardRecord.toJSON() : null,
      };
    });
  }
}

module.exports = new DeliverySettingService();
