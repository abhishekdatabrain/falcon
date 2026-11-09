const { DeliverySlot, HomepageSetting } = require('../models');

const DEFAULT_SETTINGS = {
  days_ahead: 4,
  same_day_delivery_enabled: true,
  same_day_cutoff_time: '18:00',
};

class DeliverySlotService {
  async getSettings() {
    const setting = await HomepageSetting.findOne({
      where: { setting_key: 'delivery_schedule_config' },
    });
    if (!setting || !setting.value) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...setting.value };
  }

  async updateSettings(newSettings) {
    let setting = await HomepageSetting.findOne({
      where: { setting_key: 'delivery_schedule_config' },
    });
    const merged = { ...DEFAULT_SETTINGS, ...(setting?.value || {}), ...newSettings };
    if (!setting) {
      setting = await HomepageSetting.create({
        setting_key: 'delivery_schedule_config',
        value: merged,
        draft_value: merged,
        has_unpublished_changes: false,
      });
    } else {
      await setting.update({
        value: merged,
        draft_value: merged,
        has_unpublished_changes: false,
      });
    }
    return merged;
  }

  generateCalendarDates(daysAhead = 4, sameDayEnabled = true, cutoffTime = '18:00') {
    const dates = [];
    const now = new Date();
    
    // Check if same-day delivery has passed cutoff
    let startIndex = 0;
    if (!sameDayEnabled) {
      startIndex = 1;
    } else if (cutoffTime) {
      const [cutoffH, cutoffM] = cutoffTime.split(':').map(Number);
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      if (currentH > cutoffH || (currentH === cutoffH && currentM >= cutoffM)) {
        startIndex = 1; // Past cutoff, today is disabled
      }
    }

    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const totalDays = startIndex === 0 ? daysAhead : daysAhead + 1;

    for (let i = startIndex; i < totalDays; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      const dayNum = targetDate.getDate();
      const monthIdx = targetDate.getMonth();
      const dayOfWeekIdx = targetDate.getDay();

      const monthEn = monthNamesEn[monthIdx];
      const monthAr = monthNamesAr[monthIdx];
      const dayNameEn = dayNamesEn[dayOfWeekIdx];
      const dayNameAr = dayNamesAr[dayOfWeekIdx];

      let labelEn = `${dayNameEn}, ${dayNum} ${monthEn}`;
      let labelAr = `${dayNameAr}، ${dayNum} ${monthAr}`;

      if (i === 0) {
        labelEn = `Today, ${dayNum} ${monthEn}`;
        labelAr = `اليوم، ${dayNum} ${monthAr}`;
      } else if (i === 1) {
        labelEn = `Tomorrow, ${dayNum} ${monthEn}`;
        labelAr = `غداً، ${dayNum} ${monthAr}`;
      }

      const isoDate = targetDate.toISOString().slice(0, 10);

      dates.push({
        key: isoDate,
        date: isoDate,
        dayNumber: dayNum,
        label_en: labelEn,
        label_ar: labelAr,
        is_today: i === 0,
        is_tomorrow: i === 1,
      });
    }

    return dates;
  }

  async getPublicDeliverySchedule() {
    const settings = await this.getSettings();
    const dates = this.generateCalendarDates(
      settings.days_ahead,
      settings.same_day_delivery_enabled,
      settings.same_day_cutoff_time
    );

    const slots = await DeliverySlot.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['created_at', 'ASC']],
    });

    return {
      settings,
      dates,
      slots,
    };
  }

  async getAllSlotsAdmin() {
    const slots = await DeliverySlot.findAll({
      order: [['display_order', 'ASC'], ['created_at', 'ASC']],
    });
    const settings = await this.getSettings();
    return {
      slots,
      settings,
    };
  }

  async createSlot(data) {
    if (!data.slot_label_en) throw new Error('Slot label in English is required');
    return await DeliverySlot.create({
      slot_label_en: data.slot_label_en,
      slot_label_ar: data.slot_label_ar || data.slot_label_en,
      tag_en: data.tag_en || 'Standard Slot',
      tag_ar: data.tag_ar || 'فترة قياسية',
      is_express: Boolean(data.is_express),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      display_order: data.display_order ? parseInt(data.display_order, 10) : 0,
      max_orders: data.max_orders ? parseInt(data.max_orders, 10) : 20,
    });
  }

  async updateSlot(id, data) {
    const slot = await DeliverySlot.findByPk(id);
    if (!slot) throw new Error('Delivery slot not found');
    return await slot.update(data);
  }

  async deleteSlot(id) {
    const slot = await DeliverySlot.findByPk(id);
    if (!slot) throw new Error('Delivery slot not found');
    await slot.destroy();
    return true;
  }
}

module.exports = new DeliverySlotService();
