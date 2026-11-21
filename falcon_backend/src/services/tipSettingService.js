const { TipSetting, AuditLog, User, Admin, sequelize } = require('../models');

const DEFAULT_SETTINGS = {
  is_enabled: true,
  show_on_checkout: true,
  presets: [
    { id: '1', amount: 5.00, is_enabled: true },
    { id: '2', amount: 10.00, is_enabled: true },
    { id: '3', amount: 15.00, is_enabled: true },
  ],
  allow_custom: true,
  min_custom_amount: 1.00,
  max_custom_amount: 500.00,
};

class TipSettingService {
  /**
   * Ensure default settings exist in DB if table is empty.
   */
  async ensureDefaults() {
    const existing = await TipSetting.findOne();
    if (!existing) {
      return await TipSetting.create(DEFAULT_SETTINGS);
    }
    return existing;
  }

  /**
   * Retrieve full tip settings (for Admin Panel).
   */
  async getSettings() {
    let setting = await TipSetting.findOne({
      include: [
        {
          model: User,
          as: 'updated_by',
          attributes: ['id', 'email', 'username', 'role'],
          include: [
            {
              model: Admin,
              as: 'admin',
              attributes: ['name', 'department'],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    if (!setting) {
      setting = await this.ensureDefaults();
    }

    const data = setting.toJSON();
    return {
      id: data.id,
      is_enabled: Boolean(data.is_enabled),
      show_on_checkout: Boolean(data.show_on_checkout),
      presets: Array.isArray(data.presets)
        ? data.presets.map((p, idx) => ({
            id: String(p.id || `preset-${idx + 1}`),
            amount: parseFloat(p.amount || 0),
            is_enabled: p.is_enabled !== false,
          }))
        : DEFAULT_SETTINGS.presets,
      allow_custom: Boolean(data.allow_custom),
      min_custom_amount: parseFloat(data.min_custom_amount ?? 1.00),
      max_custom_amount: parseFloat(data.max_custom_amount ?? 500.00),
      updated_by: data.updated_by
        ? {
            id: data.updated_by.id,
            email: data.updated_by.email,
            username: data.updated_by.username,
            name: data.updated_by.admin?.name || data.updated_by.username || data.updated_by.email || 'Admin',
          }
        : null,
      updated_at: data.updated_at,
      created_at: data.created_at,
    };
  }

  /**
   * Retrieve public active tip settings for Customer Checkout.
   * Only returns enabled presets and filters out inactive states.
   */
  async getPublicSettings() {
    const settings = await this.getSettings();

    if (!settings.is_enabled || !settings.show_on_checkout) {
      return {
        is_enabled: false,
        show_on_checkout: false,
        presets: [],
        allow_custom: false,
        min_custom_amount: 1.00,
        max_custom_amount: 500.00,
      };
    }

    const activePresets = settings.presets
      .filter((p) => p.is_enabled && parseFloat(p.amount) > 0)
      .map((p) => ({
        id: p.id,
        amount: parseFloat(p.amount),
        is_enabled: true,
      }));

    return {
      is_enabled: true,
      show_on_checkout: true,
      presets: activePresets,
      allow_custom: Boolean(settings.allow_custom),
      min_custom_amount: settings.min_custom_amount,
      max_custom_amount: settings.max_custom_amount,
    };
  }

  /**
   * Authoritative backend tip validation.
   * Never trusts the frontend-submitted tip amount.
   */
  async validateTipAmount(tipAmount = 0) {
    const parsedTip = parseFloat(tipAmount);
    const validTip = (!isNaN(parsedTip) && parsedTip > 0) ? Math.round(parsedTip * 100) / 100 : 0.00;

    // 0 tip is always allowed (customers can skip tipping)
    if (validTip === 0) {
      return 0.00;
    }

    const settings = await this.getSettings();

    if (!settings.is_enabled) {
      throw new Error('Delivery partner tipping is currently disabled.');
    }

    // Check if it matches an enabled preset
    const matchingPreset = settings.presets.find(
      (p) => p.is_enabled && Math.abs(parseFloat(p.amount) - validTip) < 0.001
    );

    if (matchingPreset) {
      return validTip;
    }

    // If it does not match a preset, check custom tip rules
    if (!settings.allow_custom) {
      throw new Error('Custom tips are not allowed. Please select one of the available preset options.');
    }

    const minAmount = parseFloat(settings.min_custom_amount);
    const maxAmount = parseFloat(settings.max_custom_amount);

    if (validTip < minAmount || validTip > maxAmount) {
      throw new Error(`Tip amount must be between SAR ${minAmount.toFixed(2)} and SAR ${maxAmount.toFixed(2)}`);
    }

    return validTip;
  }

  /**
   * Update tip settings with validation, atomic transaction, and audit logging.
   */
  async updateSettings({ payload, adminUser, req }) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid tip settings payload');
    }

    const {
      is_enabled,
      show_on_checkout,
      presets,
      allow_custom,
      min_custom_amount,
      max_custom_amount,
    } = payload;

    // Validation
    if (min_custom_amount !== undefined && (isNaN(Number(min_custom_amount)) || Number(min_custom_amount) < 0)) {
      throw new Error('Minimum custom tip amount must be a non-negative number');
    }

    if (max_custom_amount !== undefined && (isNaN(Number(max_custom_amount)) || Number(max_custom_amount) < 0)) {
      throw new Error('Maximum custom tip amount must be a non-negative number');
    }

    const minVal = min_custom_amount !== undefined ? parseFloat(min_custom_amount) : 1.00;
    const maxVal = max_custom_amount !== undefined ? parseFloat(max_custom_amount) : 500.00;

    if (minVal > maxVal) {
      throw new Error('Minimum custom tip amount cannot be greater than maximum custom tip amount');
    }

    // Validate presets if provided
    let sanitizedPresets = [];
    if (presets !== undefined) {
      if (!Array.isArray(presets)) {
        throw new Error('Presets must be an array of preset options');
      }

      sanitizedPresets = presets.map((p, index) => {
        const amt = parseFloat(p.amount);
        if (isNaN(amt) || amt <= 0) {
          throw new Error(`Preset amount must be greater than 0 (item ${index + 1})`);
        }
        return {
          id: String(p.id || `preset-${Date.now()}-${index}`),
          amount: Math.round(amt * 100) / 100,
          is_enabled: Boolean(p.is_enabled),
        };
      });
    }

    let current = await TipSetting.findOne();
    if (!current) {
      current = await this.ensureDefaults();
    }

    const previousSnapshot = current.toJSON();

    const updateFields = {
      updated_by_admin_id: adminUser?.id || null,
    };

    if (is_enabled !== undefined) updateFields.is_enabled = Boolean(is_enabled);
    if (show_on_checkout !== undefined) updateFields.show_on_checkout = Boolean(show_on_checkout);
    if (allow_custom !== undefined) updateFields.allow_custom = Boolean(allow_custom);
    if (min_custom_amount !== undefined) updateFields.min_custom_amount = minVal;
    if (max_custom_amount !== undefined) updateFields.max_custom_amount = maxVal;
    if (presets !== undefined) updateFields.presets = sanitizedPresets;

    const transaction = await sequelize.transaction();
    try {
      await current.update(updateFields, { transaction });

      // Audit Log
      try {
        await AuditLog.create({
          user_id: adminUser?.id || null,
          action: 'UPDATE_TIP_SETTINGS',
          entity: 'TIP_SETTING',
          entity_id: current.id,
          details: {
            previous: previousSnapshot,
            new: current.toJSON(),
            ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null,
            user_agent: req?.headers?.['user-agent'] || null,
          },
        }, { transaction });
      } catch (auditErr) {
        // Continue even if audit table has soft constraint
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return await this.getSettings();
  }
}

module.exports = new TipSettingService();
