const { Op } = require('sequelize');
const {
  ContactSetting,
  InquiryCategory,
  OfficeLocation,
  SupportTicket,
  Order,
  Customer,
  User,
  Notification,
  sequelize,
} = require('../models');
const emailService = require('./emailService');
const logger = require('../utils/logger');

let seeded = false;
let seedPromise = null;

/**
 * Strip HTML tags and trim user-provided text to prevent XSS
 */
function sanitizeText(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/<[^>]*>/g, '').trim();
}

function generateTicketNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SC-${y}${m}${d}-${rand}`;
}

class ContactService {
  async ensureSeeded() {
    if (seeded) return;
    if (seedPromise) return await seedPromise;

    seedPromise = (async () => {
      await ContactSetting.sync();
      await InquiryCategory.sync();
      await OfficeLocation.sync();
      await SupportTicket.sync();

      const settingsCount = await ContactSetting.count();
      if (settingsCount === 0) {
        await ContactSetting.create({
          support_email: 'care@saqrcart.com',
          support_phone: '800 124 5555',
          whatsapp_number: '+966 59 597 4591',
          business_address_en: 'King Fahd Road, Al Malqa District, P.O. Box 8421, Riyadh 13524, Saudi Arabia',
          business_address_ar: 'طريق الملك فهد، حي الملقا، ص.ب 8421، الرياض 13524، المملكة العربية السعودية',
          support_hours_en: '6:00 AM – 1:00 AM',
          support_hours_ar: '6:00 ص – 1:00 ص',
          dispatch_hours_en: 'Operating 24/7',
          dispatch_hours_ar: 'يعمل 24/7',
          live_chat_wait_en: '< 3 mins',
          live_chat_wait_ar: 'أقل من 3 دقائق',
          social_links: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
          },
        });
      }

      const catCount = await InquiryCategory.count();
      if (catCount === 0) {
        await InquiryCategory.bulkCreate([
          {
            code: 'ORDER_STATUS',
            name_en: 'Active Order Status & Live GPS Tracking',
            name_ar: 'حالة الطلب والتتبع المباشر للتوصيل',
            is_active: true,
            display_order: 1,
          },
          {
            code: 'QUALITY',
            name_en: 'Farm Freshness & 100% Quality Assurance',
            name_ar: 'طزاجة المزرعة وضمان الجودة 100%',
            is_active: true,
            display_order: 2,
          },
          {
            code: 'COLD_CHAIN',
            name_en: 'Cold-Chain Temperature Report Inquiry',
            name_ar: 'استفسار عن سلسلة التبريد ودرجات الحرارة',
            is_active: true,
            display_order: 3,
          },
          {
            code: 'FARMER',
            name_en: 'Farmer & Producer Partnership Onboarding',
            name_ar: 'شراكات المزارعين والمنتجين المحليين',
            is_active: true,
            display_order: 4,
          },
          {
            code: 'CORPORATE',
            name_en: 'Corporate & Institutional Bulk Catering',
            name_ar: 'الطلبات المؤسسية والتموين للشركات',
            is_active: true,
            display_order: 5,
          },
          {
            code: 'PAYMENT',
            name_en: 'Payment, Invoicing & VAT Receipts',
            name_ar: 'المدفوعات والفواتير الضريبية',
            is_active: true,
            display_order: 6,
          },
        ]);
      }

      const locCount = await OfficeLocation.count();
      if (locCount === 0) {
        await OfficeLocation.bulkCreate([
          {
            name_en: 'Riyadh Central Dispatch & HQ',
            name_ar: 'المركز الرئيسي للتحكم والعمليات بالرياض',
            location_type: 'HQ',
            badge_en: 'MAIN CENTRAL HQ',
            badge_ar: 'المقر الرئيسي المركزي',
            region_en: 'Riyadh Central',
            region_ar: 'الرياض المركزية',
            address_en: 'King Fahd Road, Al Malqa District, P.O. Box 8421, Riyadh 13524, Saudi Arabia',
            address_ar: 'طريق الملك فهد، حي الملقا، ص.ب 8421، الرياض 13524، المملكة العربية السعودية',
            latitude: 24.71360000,
            longitude: 46.67530000,
            map_image_url: '/images/contact/riyadh_map.jpg',
            service_areas_en: 'Riyadh Metropolitan Area & Surrounding Districts',
            service_areas_ar: 'مدينة الرياض والمناطق المحيطة بها',
            support_hours_en: 'Sun – Thu: 8:00 AM – 6:00 PM',
            support_hours_ar: 'الأحد – الخميس: 8:00 ص – 6:00 م',
            dispatch_hours_en: 'Operating 24/7',
            dispatch_hours_ar: 'يعمل 24/7',
            is_active: true,
            display_order: 1,
          },
          {
            name_en: 'Jeddah Cold-Chain Logistics Hub',
            name_ar: 'مركز لوجستيات التبريد بجدة',
            location_type: 'DISPATCH_HUB',
            badge_en: 'Western Province',
            badge_ar: 'المنطقة الغربية',
            region_en: 'Jeddah West',
            region_ar: 'جدة الغربية',
            address_en: 'Al Andalus District, Near Madinah Road, Jeddah 23326',
            address_ar: 'حي الأندلس، بالقرب من طريق المدينة، جدة 23326',
            latitude: 21.54330000,
            longitude: 39.17280000,
            map_image_url: '/images/contact/riyadh_map.jpg',
            service_areas_en: 'Jeddah, Makkah, and Red Sea Coastal Areas',
            service_areas_ar: 'جدة، مكة المكرمة، والمناطق الساحلية للبحر الأحمر',
            support_hours_en: 'Sun – Thu: 8:00 AM – 6:00 PM',
            support_hours_ar: 'الأحد – الخميس: 8:00 ص – 6:00 م',
            dispatch_hours_en: 'Operating 24/7',
            dispatch_hours_ar: 'يعمل 24/7',
            is_active: true,
            display_order: 2,
          },
          {
            name_en: 'Dammam & Khobar Micro-Hub',
            name_ar: 'مركز الدمام والخبر اللوجستي المصغر',
            location_type: 'WAREHOUSE',
            badge_en: 'Eastern Province',
            badge_ar: 'المنطقة الشرقية',
            region_en: 'Dammam East',
            region_ar: 'الدمام الشرقية',
            address_en: 'King Saud Street, Al Faisaliyah District, Dammam 32272',
            address_ar: 'شارع الملك سعود، حي الفيصلية، الدمام 32272',
            latitude: 26.42070000,
            longitude: 50.08880000,
            map_image_url: '/images/contact/riyadh_map.jpg',
            service_areas_en: 'Dammam, Al Khobar, Dhahran & Jubail industrial corridor',
            service_areas_ar: 'الدمام، الخبر، الظهران ومحور الجبيل الصناعي',
            support_hours_en: 'Sun – Thu: 8:00 AM – 6:00 PM',
            support_hours_ar: 'الأحد – الخميس: 8:00 ص – 6:00 م',
            dispatch_hours_en: '6:00 AM – 11:00 PM',
            dispatch_hours_ar: '6:00 ص – 11:00 م',
            is_active: true,
            display_order: 3,
          },
        ]);
      }

      seeded = true;
    })();

    try {
      await seedPromise;
    } finally {
      seedPromise = null;
    }
  }

  // ==================== PUBLIC METHODS ====================

  async getPublicContactPageData() {
    await this.ensureSeeded();
    const [settings, categories, locations] = await Promise.all([
      ContactSetting.findOne(),
      InquiryCategory.findAll({
        where: { is_active: true },
        order: [['display_order', 'ASC'], ['createdAt', 'ASC']],
      }),
      OfficeLocation.findAll({
        where: { is_active: true },
        order: [['display_order', 'ASC'], ['createdAt', 'ASC']],
      }),
    ]);

    return { settings, categories, locations };
  }

  async getActiveCategories() {
    await this.ensureSeeded();
    return await InquiryCategory.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  async getActiveLocations() {
    await this.ensureSeeded();
    return await OfficeLocation.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  async submitTicket(data, user = null) {
    const full_name = sanitizeText(data.full_name || data.fullName);
    const email = sanitizeText(data.email).toLowerCase();
    const mobile = sanitizeText(data.mobile || data.phone);
    const rawOrderId = sanitizeText(data.order_id || data.orderId);
    const category_code = sanitizeText(data.category_code || data.category);
    const message = sanitizeText(data.message);
    const agreed = Boolean(data.agreed);

    const fieldErrors = {};
    if (!full_name || full_name.length < 2) {
      fieldErrors.fullName = 'Full name is required (at least 2 characters)';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = 'Please enter a valid email address';
    }
    const cleanDigits = mobile.replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length < 9) {
      fieldErrors.phone = 'Please enter a valid Saudi mobile number';
    }
    if (!category_code) {
      fieldErrors.category = 'Please select an inquiry category';
    }
    if (!message || message.length < 10) {
      fieldErrors.message = 'Please provide message details (at least 10 characters)';
    }
    if (!agreed) {
      fieldErrors.agreed = 'You must agree to the Privacy Policy and Terms of Service';
    }

    // Validate attachment metadata if provided (never allow base64 data URIs)
    const attachment_url = sanitizeText(data.attachment_url);
    const attachment_name = sanitizeText(data.attachment_name);
    const attachment_type = sanitizeText(data.attachment_type);
    const attachment_size = data.attachment_size ? parseInt(data.attachment_size, 10) : null;

    if (attachment_url) {
      if (attachment_url.startsWith('data:')) {
        fieldErrors.attachment = 'Base64 file data is not allowed. Please upload via file storage.';
      }
      if (attachment_size && attachment_size > 5 * 1024 * 1024) {
        fieldErrors.attachment = 'Attachment exceeds maximum 5MB limit.';
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      const err = new Error(Object.values(fieldErrors)[0]);
      err.fieldErrors = fieldErrors;
      err.statusCode = 400;
      throw err;
    }

    await this.ensureSeeded();

    // Validate Inquiry Category exists and is active
    let categoryRecord = null;
    if (category_code) {
      categoryRecord = await InquiryCategory.findOne({
        where: { code: category_code, is_active: true },
      });
      if (!categoryRecord) {
        fieldErrors.category = 'Selected inquiry category is invalid or inactive';
      }
    }

    // Validate Order ID if provided
    let resolvedOrderId = null;
    let resolvedOrderNumber = rawOrderId || null;
    if (rawOrderId) {
      const cleanRef = rawOrderId.replace(/^#/, '').trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanRef);
      const orderRecord = await Order.findOne({
        where: isUuid ? { id: cleanRef } : { order_number: cleanRef },
      });
      if (!orderRecord) {
        fieldErrors.orderId = `Order "${rawOrderId}" was not found. Leave blank if not applicable.`;
      } else {
        resolvedOrderId = orderRecord.id;
        resolvedOrderNumber = orderRecord.order_number;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      const err = new Error(Object.values(fieldErrors)[0]);
      err.fieldErrors = fieldErrors;
      err.statusCode = 400;
      throw err;
    }

    // Resolve customer if logged in
    let customerId = null;
    let userId = user?.id || null;
    if (userId) {
      const cust = await Customer.findOne({ where: { user_id: userId } });
      if (cust) customerId = cust.id;
    }

    // Generate unique ticket number
    let ticket_number = generateTicketNumber();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await SupportTicket.findOne({ where: { ticket_number } });
      if (!exists) break;
      ticket_number = generateTicketNumber();
      attempts += 1;
    }

    const ticket = await SupportTicket.create({
      ticket_number,
      customer_id: customerId,
      user_id: userId,
      full_name,
      email,
      mobile,
      order_id: resolvedOrderId,
      order_number: resolvedOrderNumber,
      category_id: categoryRecord ? categoryRecord.id : null,
      category_code: categoryRecord ? categoryRecord.code : category_code,
      category_name: categoryRecord ? categoryRecord.name_en : category_code,
      message,
      attachment_url: attachment_url || null,
      attachment_name: attachment_name || null,
      attachment_type: attachment_type || null,
      attachment_size: attachment_size || null,
      status: 'NEW',
    });

    // Notify Admins via Socket.IO & DB Notification (non-blocking)
    this.notifyAdminsNewTicket(ticket).catch((e) =>
      logger.warn(`Admin ticket notification notice: ${e.message}`)
    );

    // Send confirmation email to customer if EmailService is configured (non-blocking)
    this.sendTicketConfirmationEmail(ticket).catch((e) =>
      logger.warn(`Ticket confirmation email notice: ${e.message}`)
    );

    return {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      status: ticket.status,
      category_code: ticket.category_code,
      category_name: ticket.category_name,
      created_at: ticket.createdAt,
    };
  }

  async notifyAdminsNewTicket(ticket) {
    try {
      const { getIO } = require('../sockets/socketManager');
      const io = getIO();
      if (io) {
        io.to('admin_room').emit('new_support_ticket', {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          full_name: ticket.full_name,
          category_code: ticket.category_code,
          category_name: ticket.category_name,
          status: ticket.status,
          created_at: ticket.createdAt,
        });
      }

      const admins = await User.findAll({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        attributes: ['id'],
      });

      if (admins.length > 0 && Notification) {
        const notifications = admins.map((adm) => ({
          user_id: adm.id,
          title: `New Support Ticket ${ticket.ticket_number}`,
          message: `${ticket.full_name} submitted an inquiry under "${ticket.category_name}".`,
          type: 'SYSTEM',
          reference_id: ticket.id,
          reference_type: 'SUPPORT_TICKET',
          is_read: false,
        }));
        await Notification.bulkCreate(notifications).catch(() => { });
      }
    } catch (err) {
      logger.warn(`notifyAdminsNewTicket error: ${err.message}`);
    }
  }

  async sendTicketConfirmationEmail(ticket) {
    try {
      if (!emailService.transporter) {
        emailService.initTransporter();
      }
      if (!emailService.transporter) return;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: #043927; color: #ffffff; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">SaqrCart Customer Care</h2>
            <p style="margin: 6px 0 0 0; color: #a7f3d0; font-size: 13px;">Support Ticket Confirmation</p>
          </div>
          <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p>Hello <strong>${ticket.full_name}</strong>,</p>
            <p>Thank you for contacting SaqrCart. Your support inquiry has been received and logged with reference number:</p>
            <div style="background: #f0fdf4; border: 1px dashed #05a764; border-radius: 10px; padding: 14px; text-align: center; margin: 16px 0;">
              <span style="font-size: 18px; font-weight: bold; color: #043927; letter-spacing: 1px;">${ticket.ticket_number}</span>
            </div>
            <p><strong>Category:</strong> ${ticket.category_name}</p>
            ${ticket.order_number ? `<p><strong>Order Reference:</strong> ${ticket.order_number}</p>` : ''}
            <p>Our customer care team will review your request and respond shortly.</p>
          </div>
        </div>
      `;

      await emailService.transporter.sendMail({
        from: `"SaqrCart Care" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'care@saqrcart.com'}>`,
        to: ticket.email,
        subject: `[${ticket.ticket_number}] We received your SaqrCart Support Request`,
        html,
      });
    } catch (err) {
      logger.warn(`Support ticket confirmation email skipped: ${err.message}`);
    }
  }

  // ==================== ADMIN METHODS ====================

  async getAdminSettings() {
    await this.ensureSeeded();
    return await ContactSetting.findOne();
  }

  async updateAdminSettings(data, adminId) {
    await this.ensureSeeded();
    let settings = await ContactSetting.findOne();
    if (!settings) {
      settings = await ContactSetting.create({});
    }

    const payload = {
      support_email: data.support_email !== undefined ? sanitizeText(data.support_email) : settings.support_email,
      support_phone: data.support_phone !== undefined ? sanitizeText(data.support_phone) : settings.support_phone,
      whatsapp_number: data.whatsapp_number !== undefined ? sanitizeText(data.whatsapp_number) : settings.whatsapp_number,
      business_address_en: data.business_address_en !== undefined ? sanitizeText(data.business_address_en) : settings.business_address_en,
      business_address_ar: data.business_address_ar !== undefined ? sanitizeText(data.business_address_ar) : settings.business_address_ar,
      support_hours_en: data.support_hours_en !== undefined ? sanitizeText(data.support_hours_en) : settings.support_hours_en,
      support_hours_ar: data.support_hours_ar !== undefined ? sanitizeText(data.support_hours_ar) : settings.support_hours_ar,
      dispatch_hours_en: data.dispatch_hours_en !== undefined ? sanitizeText(data.dispatch_hours_en) : settings.dispatch_hours_en,
      dispatch_hours_ar: data.dispatch_hours_ar !== undefined ? sanitizeText(data.dispatch_hours_ar) : settings.dispatch_hours_ar,
      live_chat_wait_en: data.live_chat_wait_en !== undefined ? sanitizeText(data.live_chat_wait_en) : settings.live_chat_wait_en,
      live_chat_wait_ar: data.live_chat_wait_ar !== undefined ? sanitizeText(data.live_chat_wait_ar) : settings.live_chat_wait_ar,
      social_links: data.social_links !== undefined ? data.social_links : settings.social_links,
      updated_by_admin_id: adminId,
    };

    await settings.update(payload);
    return settings;
  }

  // Inquiry Categories CRUD
  async getAllCategories() {
    await this.ensureSeeded();
    return await InquiryCategory.findAll({
      order: [['display_order', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  async createCategory(data) {
    const code = sanitizeText(data.code || data.name_en)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const name_en = sanitizeText(data.name_en);
    const name_ar = sanitizeText(data.name_ar) || name_en;

    if (!code || !name_en) {
      throw new Error('Category code and English name are required');
    }

    const existing = await InquiryCategory.findOne({ where: { code } });
    if (existing) {
      throw new Error(`Category with code "${code}" already exists`);
    }

    return await InquiryCategory.create({
      code,
      name_en,
      name_ar,
      description_en: sanitizeText(data.description_en) || null,
      description_ar: sanitizeText(data.description_ar) || null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      display_order: data.display_order !== undefined ? parseInt(data.display_order, 10) || 0 : 0,
    });
  }

  async updateCategory(id, data) {
    const category = await InquiryCategory.findByPk(id);
    if (!category) throw new Error('Inquiry category not found');

    const payload = {};
    if (data.name_en !== undefined) payload.name_en = sanitizeText(data.name_en);
    if (data.name_ar !== undefined) payload.name_ar = sanitizeText(data.name_ar);
    if (data.description_en !== undefined) payload.description_en = sanitizeText(data.description_en);
    if (data.description_ar !== undefined) payload.description_ar = sanitizeText(data.description_ar);
    if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);
    if (data.display_order !== undefined) payload.display_order = parseInt(data.display_order, 10) || 0;

    await category.update(payload);
    return category;
  }

  async deleteCategory(id) {
    const category = await InquiryCategory.findByPk(id);
    if (!category) throw new Error('Inquiry category not found');
    await category.destroy();
    return { deleted: true };
  }

  // Office Locations CRUD
  async getAllLocations() {
    await this.ensureSeeded();
    return await OfficeLocation.findAll({
      order: [['display_order', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  async createLocation(data) {
    const name_en = sanitizeText(data.name_en);
    const address_en = sanitizeText(data.address_en);
    if (!name_en || !address_en) {
      throw new Error('Location name and address are required');
    }

    return await OfficeLocation.create({
      name_en,
      name_ar: sanitizeText(data.name_ar) || name_en,
      location_type: sanitizeText(data.location_type) || 'DISPATCH_HUB',
      badge_en: sanitizeText(data.badge_en) || null,
      badge_ar: sanitizeText(data.badge_ar) || null,
      region_en: sanitizeText(data.region_en) || null,
      region_ar: sanitizeText(data.region_ar) || null,
      address_en,
      address_ar: sanitizeText(data.address_ar) || address_en,
      latitude: data.latitude !== undefined && data.latitude !== '' ? parseFloat(data.latitude) : null,
      longitude: data.longitude !== undefined && data.longitude !== '' ? parseFloat(data.longitude) : null,
      map_image_url: sanitizeText(data.map_image_url) || null,
      service_areas_en: sanitizeText(data.service_areas_en) || null,
      service_areas_ar: sanitizeText(data.service_areas_ar) || null,
      support_hours_en: sanitizeText(data.support_hours_en) || null,
      support_hours_ar: sanitizeText(data.support_hours_ar) || null,
      dispatch_hours_en: sanitizeText(data.dispatch_hours_en) || null,
      dispatch_hours_ar: sanitizeText(data.dispatch_hours_ar) || null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      display_order: data.display_order !== undefined ? parseInt(data.display_order, 10) || 0 : 0,
    });
  }

  async updateLocation(id, data) {
    const location = await OfficeLocation.findByPk(id);
    if (!location) throw new Error('Office location not found');

    const payload = {};
    const stringFields = [
      'name_en', 'name_ar', 'location_type', 'badge_en', 'badge_ar',
      'region_en', 'region_ar', 'address_en', 'address_ar', 'map_image_url',
      'service_areas_en', 'service_areas_ar', 'support_hours_en', 'support_hours_ar',
      'dispatch_hours_en', 'dispatch_hours_ar',
    ];
    stringFields.forEach((f) => {
      if (data[f] !== undefined) payload[f] = sanitizeText(data[f]) || null;
    });

    if (data.latitude !== undefined) {
      payload.latitude = data.latitude !== '' && data.latitude !== null ? parseFloat(data.latitude) : null;
    }
    if (data.longitude !== undefined) {
      payload.longitude = data.longitude !== '' && data.longitude !== null ? parseFloat(data.longitude) : null;
    }
    if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);
    if (data.display_order !== undefined) payload.display_order = parseInt(data.display_order, 10) || 0;

    await location.update(payload);
    return location;
  }

  async deleteLocation(id) {
    const location = await OfficeLocation.findByPk(id);
    if (!location) throw new Error('Office location not found');
    await location.destroy();
    return { deleted: true };
  }

  // Support Tickets Admin Management
  async getAdminTickets(filters = {}) {
    await this.ensureSeeded();
    const {
      status,
      category_code,
      search,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = filters;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category_code && category_code !== 'ALL') {
      where.category_code = category_code;
    }
    if (search) {
      const q = `%${sanitizeText(search)}%`;
      where[Op.or] = [
        { ticket_number: { [Op.iLike]: q } },
        { full_name: { [Op.iLike]: q } },
        { email: { [Op.iLike]: q } },
        { mobile: { [Op.iLike]: q } },
        { order_number: { [Op.iLike]: q } },
      ];
    }
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at[Op.gte] = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows, count } = await SupportTicket.findAndCountAll({
      where,
      include: [
        { model: InquiryCategory, as: 'category', attributes: ['id', 'code', 'name_en', 'name_ar'] },
        { model: Order, as: 'order', attributes: ['id', 'order_number', 'order_status', 'grand_total'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parsedLimit,
      offset,
    });

    return {
      tickets: rows,
      total: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
    };
  }

  async getAdminTicketById(id) {
    const ticket = await SupportTicket.findByPk(id, {
      include: [
        { model: InquiryCategory, as: 'category' },
        { model: Order, as: 'order', attributes: ['id', 'order_number', 'order_status', 'grand_total', 'createdAt'] },
        { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    if (!ticket) throw new Error('Support ticket not found');
    return ticket;
  }

  async updateAdminTicket(id, data, adminId) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new Error('Support ticket not found');

    const allowedStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const payload = { updated_by_admin_id: adminId };

    if (data.status !== undefined) {
      if (!allowedStatuses.includes(data.status)) {
        throw new Error('Invalid ticket status');
      }
      payload.status = data.status;
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        if (!ticket.resolved_at) payload.resolved_at = new Date();
      }
    }

    if (data.internal_notes !== undefined) {
      payload.internal_notes = sanitizeText(data.internal_notes);
    }

    await ticket.update(payload);
    return await this.getAdminTicketById(id);
  }
}

module.exports = new ContactService();
