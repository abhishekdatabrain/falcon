const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      const host = process.env.SMTP_HOST || '';
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD;

      if (!user || !pass) {
        logger.warn('SMTP credentials not fully configured in environment variables');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      logger.info(`EmailService initialized with host: ${host}:${port}`);
    } catch (err) {
      logger.error('Failed to initialize EmailService transporter:', err);
    }
  }

  /**
   * Send order confirmation email with estimated delivery slot & date
   * @param {Object} order - Full order object with customer, address, items
   */
  async sendOrderConfirmationEmail(order) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      const customerEmail =
        order.customer?.user?.email ||
        order.user?.email ||
        order.address?.email;

      if (!customerEmail) {
        logger.warn(`No email found for order ${order.order_number || order.id}, skipping email delivery`);
        return { success: false, reason: 'No recipient email found' };
      }

      const customerName = order.customer?.first_name
        ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
        : (order.address?.full_name || 'Valued Customer');

      const orderNumber = order.order_number || `#${order.id.slice(0, 8)}`;
      const deliveryDate = order.delivery_date || 'Today';
      const deliverySlot = order.delivery_slot || 'Standard Schedule';
      const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/order-confirmation?orderId=${order.id}`;

      // Currency formatters
      const subtotal = parseFloat(order.subtotal || 0).toFixed(2);
      const vat = parseFloat(order.tax_total || (parseFloat(subtotal) * 0.15)).toFixed(2);
      const deliveryFee = parseFloat(order.delivery_fee || 0) > 0 ? `SAR ${parseFloat(order.delivery_fee).toFixed(2)}` : 'FREE';
      const discount = parseFloat(order.discount_total || 0) > 0 ? `-SAR ${parseFloat(order.discount_total).toFixed(2)}` : null;
      const grandTotal = parseFloat(order.grand_total || 0).toFixed(2);

      // Render items table
      const itemsHtml = (order.items || []).map((item, idx) => {
        const pName = item.product_name_en || item.product?.name_en || 'Fresh Grocery Item';
        const qty = item.quantity || 1;
        const lineTotal = parseFloat(item.total_price || (parseFloat(item.unit_price || 0) * qty)).toFixed(2);
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 8px; color: #1e293b; font-weight: 600; font-size: 13px;">
              ${idx + 1}. ${pName}
            </td>
            <td style="padding: 12px 8px; text-align: center; color: #64748b; font-size: 13px;">
              ${qty}
            </td>
            <td style="padding: 12px 8px; text-align: right; color: #043927; font-weight: 700; font-size: 13px;">
              SAR ${lineTotal}
            </td>
          </tr>
        `;
      }).join('');

      const destinationAddress = [
        order.address?.address_line,
        order.address?.area,
        order.address?.city,
        order.address?.country || 'Saudi Arabia',
      ].filter(Boolean).join(', ') || 'Riyadh, Saudi Arabia';

      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Falcon Fresh Order is Confirmed!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
    .header-banner { background: linear-gradient(135deg, #043927 0%, #065F46 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .brand-pill { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; padding: 6px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
    .header-title { font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
    .header-subtitle { font-size: 14px; color: #a7f3d0; margin-top: 8px; }
    .content-body { padding: 32px 28px; }
    
    /* SCHEDULE CARD (HIGHLIGHT) */
    .schedule-card { background: #ecfdf5; border: 2px solid #05A764; border-radius: 18px; padding: 20px 22px; margin-bottom: 26px; box-shadow: 0 4px 12px rgba(5,167,100,0.08); }
    .schedule-card-header { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .schedule-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .schedule-col-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
    .schedule-col-val { font-size: 16px; font-weight: 800; color: #064e3b; }

    /* SUMMARY TABLE */
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th { background: #f8fafc; padding: 10px 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: left; border-bottom: 1px solid #cbd5e1; }
    .totals-box { margin-top: 20px; padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #475569; font-weight: 600; }
    .grand-total-row { border-top: 2px solid #043927; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 900; color: #043927; display: flex; justify-content: space-between; }
    
    .cta-button { display: block; text-align: center; background: #006E2D; color: #ffffff !important; padding: 16px 28px; border-radius: 9999px; font-size: 15px; font-weight: 800; text-decoration: none; margin: 28px 0 16px 0; box-shadow: 0 4px 14px rgba(0,110,45,0.25); }
    .cta-button:hover { background: #048b53; }
    .address-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; font-size: 13px; color: #334155; margin-top: 20px; }
    .footer-note { padding: 24px 28px; background: #f1f5f9; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header Banner -->
    <div class="header-banner">
      <div class="brand-pill">🦅 Falcon Fresh Market (KSA)</div>
      <h1 class="header-title">Order Confirmed! 🎉</h1>
      <p class="header-subtitle">Thank you for your order, ${customerName}!</p>
    </div>

    <!-- Body -->
    <div class="content-body">
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0;">
        We have received your order <strong>${orderNumber}</strong>. Our fulfillment team is already carefully handpicking your fresh groceries in our cold-chain facility.
      </p>

      <!-- ESTIMATED DELIVERY WINDOW HIGHLIGHT CARD -->
      <div class="schedule-card">
        <div class="schedule-card-header">
          <span>🕒 ESTIMATED DELIVERY SCHEDULE & SLOT</span>
        </div>
        <div class="schedule-grid">
          <div>
            <div class="schedule-col-label">📅 Delivery Date</div>
            <div class="schedule-col-val">${deliveryDate}</div>
          </div>
          <div>
            <div class="schedule-col-label">⏰ Delivery Time Window</div>
            <div class="schedule-col-val">${deliverySlot}</div>
          </div>
        </div>
      </div>

      <!-- Live Tracking CTA -->
      <a href="${trackingUrl}" class="cta-button" target="_blank">
        🚚 Track Your Delivery Live & View Invoice
      </a>

      <!-- Ordered Items -->
      <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 26px 0 10px 0;">
        Order Summary (${order.items?.length || 0} items)
      </h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #94a3b8;">Fresh Grocery Pack</td></tr>'}
        </tbody>
      </table>

      <!-- Price Breakdown -->
      <div class="totals-box">
        <div class="totals-row">
          <span>Items Subtotal:</span>
          <span>SAR ${subtotal}</span>
        </div>
        <div class="totals-row">
          <span>Refrigerated Delivery Fee:</span>
          <span>${deliveryFee}</span>
        </div>
        <div class="totals-row">
          <span>Value Added Tax (15% VAT):</span>
          <span>SAR ${vat}</span>
        </div>
        ${discount ? `
          <div class="totals-row" style="color: #059669; font-weight: 700;">
            <span>Coupon Discount:</span>
            <span>${discount}</span>
          </div>
        ` : ''}
        <div class="grand-total-row">
          <span>Total Paid (Incl. VAT):</span>
          <span>SAR ${grandTotal}</span>
        </div>
      </div>

      <!-- Delivery Address Card -->
      <div class="address-card">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          📍 Delivery Destination:
        </div>
        <div style="font-weight: 700; color: #0f172a; font-size: 14px;">
          ${order.address?.full_name || customerName}
        </div>
        <div style="margin-top: 4px; color: #475569;">
          ${destinationAddress}
        </div>
        ${order.address?.mobile ? `
          <div style="margin-top: 4px; color: #047857; font-weight: 700;">
            📞 Mobile: ${order.address.mobile}
          </div>
        ` : ''}
        ${order.notes ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #d97706; font-style: italic;">
            <strong>Driver Instructions:</strong> "${order.notes}"
          </div>
        ` : ''}
      </div>

    </div>

    <!-- Footer -->
    <div class="footer-note">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">
        Need help? We're available 24/7 in Riyadh!
      </p>
      <p style="margin: 0;">
        Email: support@falcon-grocery.com | Hotline: 9200-FALCON (325266)<br>
        © 2026 Falcon Fresh Market. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"Falcon Fresh Market" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@falcon-grocery.com'}>`,
        to: customerEmail,
        subject: `Your Order is Confirmed! #${orderNumber} • Estimated Delivery: ${deliveryDate} (${deliverySlot})`,
        text: `Hello ${customerName},\n\nYour order ${orderNumber} is confirmed!\n\nEstimated Delivery Schedule:\nDate: ${deliveryDate}\nSlot: ${deliverySlot}\n\nTotal Paid: SAR ${grandTotal} (including 15% VAT)\nDelivery Address: ${destinationAddress}\n\nTrack your order: ${trackingUrl}\n\nThank you for choosing Falcon Fresh!`,
        html: emailHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Order confirmation email sent successfully to ${customerEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Error sending order confirmation email for order ${order?.order_number}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send Driver Assigned notification email to customer with delivery OTP PIN
   * @param {Object} params - { order, driver, otp }
   */
  async sendDriverAssignedEmail({ order, driver, otp }) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        logger.warn('EmailService transporter not available for sendDriverAssignedEmail');
        return { success: false, reason: 'Transporter not available' };
      }

      const customerEmail =
        order.customer?.user?.email ||
        order.user?.email ||
        order.address?.email;

      if (!customerEmail) {
        logger.warn(`No customer email found for order ${order.order_number || order.id}, skipping driver assigned email`);
        return { success: false, reason: 'No recipient email found' };
      }

      const customerName = order.customer?.first_name
        ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
        : (order.address?.full_name || 'Valued Customer');

      const orderNumber = order.order_number || `#${order.id.slice(0, 8)}`;
      const deliveryDate = order.delivery_date || 'Today';
      const deliverySlot = order.delivery_slot || 'Standard Schedule';
      const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/track-order?orderNumber=${encodeURIComponent(orderNumber)}`;

      const destinationAddress = [
        order.address?.address_line,
        order.address?.area,
        order.address?.city,
        order.address?.country || 'Saudi Arabia',
      ].filter(Boolean).join(', ') || 'Riyadh, Saudi Arabia';

      const driverPhone = driver?.user?.mobile || 'Available in app';
      const driverVehicle = driver?.vehicle_details || 'Falcon Chilled Delivery Van';
      const driverLicense = driver?.license_number ? `License: ${driver.license_number}` : '';

      // Render items list
      const itemsHtml = (order.items || []).map((item, idx) => {
        const pName = item.product_name_en || item.product?.name_en || 'Fresh Grocery Item';
        const qty = item.quantity || 1;
        const lineTotal = parseFloat(item.total_price || (parseFloat(item.unit_price || 0) * qty)).toFixed(2);
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 8px; color: #1e293b; font-weight: 600; font-size: 13px;">
              ${idx + 1}. ${pName}
            </td>
            <td style="padding: 10px 8px; text-align: center; color: #64748b; font-size: 13px;">
              ${qty}
            </td>
            <td style="padding: 10px 8px; text-align: right; color: #043927; font-weight: 700; font-size: 13px;">
              SAR ${lineTotal}
            </td>
          </tr>
        `;
      }).join('');

      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Driver Assigned to Your Falcon Fresh Order</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
    .header-banner { background: linear-gradient(135deg, #043927 0%, #065F46 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .brand-pill { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; padding: 6px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
    .header-title { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
    .header-subtitle { font-size: 14px; color: #a7f3d0; margin-top: 8px; }
    .content-body { padding: 32px 28px; }
    .otp-box { background: #ecfdf5; border: 2px dashed #05a764; border-radius: 18px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-label { text-transform: uppercase; letter-spacing: 1.5px; color: #043927; font-weight: 800; font-size: 12px; margin: 0 0 8px 0; }
    .otp-digits { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #043927; font-family: 'Courier New', Courier, monospace; margin: 10px 0; }
    .otp-instruction { color: #065f46; font-size: 13px; font-weight: 600; margin: 8px 0 0 0; line-height: 1.5; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; margin-bottom: 20px; }
    .info-card-title { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; }
    .btn-track { display: block; background: #043927; color: #ffffff !important; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 14px; font-weight: 800; font-size: 15px; letter-spacing: 0.3px; margin: 24px 0 16px 0; box-shadow: 0 4px 12px rgba(4,57,39,0.25); }
    .footer-note { text-align: center; padding: 20px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #fcfcfc; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="header-banner">
      <div class="brand-pill">Cold-Chain Dispatch</div>
      <h1 class="header-title">Driver Assigned to Your Order</h1>
      <div class="header-subtitle">Your groceries are being prepared for chilled transit in Riyadh</div>
    </div>

    <!-- Body -->
    <div class="content-body">
      <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
        Dear <strong>${customerName}</strong>,
      </p>
      <p style="font-size: 14px; margin: 0 0 20px 0; color: #64748b; line-height: 1.6;">
        Great news! A dedicated delivery courier has been assigned to your Falcon Fresh order <strong>#${orderNumber}</strong>. Our driver will pick up your cold-chain insulated package and head towards your delivery address.
      </p>

      <!-- OTP PIN CARD -->
      <div class="otp-box">
        <div class="otp-label">🔐 Delivery Verification Handover PIN (OTP)</div>
        <div class="otp-digits">${otp}</div>
        <div class="otp-instruction">
          Please provide this <strong>4-digit PIN code</strong> to the delivery driver upon arrival to verify and complete your order handover.
        </div>
      </div>

      <!-- Driver Details Card -->
      <div class="info-card">
        <div class="info-card-title">Assigned Courier Details</div>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Vehicle / Fleet:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #043927;">${driverVehicle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Driver Mobile:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #043927;">${driverPhone}</td>
          </tr>
          ${driverLicense ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Driver ID:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #475569;">${driverLicense}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Status:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #05a764;">DRIVER ASSIGNED</td>
          </tr>
        </table>
      </div>

      <!-- Schedule & Destination Card -->
      <div class="info-card">
        <div class="info-card-title">Delivery Destination</div>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Expected Window:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b;">${deliveryDate} (${deliverySlot})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Delivery Address:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${destinationAddress}</td>
          </tr>
        </table>
      </div>

      <!-- Items Summary -->
      ${order.items && order.items.length > 0 ? `
      <div style="margin-top: 24px;">
        <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 10px;">
          Ordered Items (${order.items.length})
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Track Order CTA Button -->
      <a href="${trackingUrl}" target="_blank" class="btn-track">
        Track Live Delivery & Map →
      </a>
      <p style="font-size: 12px; text-align: center; color: #94a3b8; margin: 0;">
        Follow driver location, speed, and cold-chain temperature telemetry in real time.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer-note">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">
        Falcon Fresh Grocery Support
      </p>
      <p style="margin: 0;">
        Email: support@falcon-grocery.com | Hotline: 9200-FALCON (325266)<br>
        © 2026 Falcon Fresh Market. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"Falcon Fresh Market" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@falcon-grocery.com'}>`,
        to: customerEmail,
        subject: `🚗 Driver Assigned to Order #${orderNumber} • Your Delivery PIN is ${otp}`,
        text: `Hello ${customerName},\n\nYour order #${orderNumber} has been assigned to a driver!\n\nYOUR DELIVERY VERIFICATION PIN (OTP): ${otp}\nPlease share this 4-digit PIN with your delivery driver upon arrival to verify handover.\n\nDriver Details:\nVehicle: ${driverVehicle}\nContact: ${driverPhone}\n\nTrack your live delivery: ${trackingUrl}\n\nThank you for choosing Falcon Fresh!`,
        html: emailHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Driver assigned email sent successfully to ${customerEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Error sending driver assigned email for order ${order?.order_number}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send order cancellation email to customer
   * @param {Object} params - order, reason, remarks, refundStatus
   */
  async sendOrderCancellationEmail({ order, reason, remarks, refundStatus }) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      const customerEmail =
        order.customer?.user?.email ||
        order.user?.email ||
        order.address?.email;

      if (!customerEmail) {
        logger.warn(`No email found for cancelled order ${order.order_number || order.id}, skipping email delivery`);
        return { success: false, reason: 'No recipient email found' };
      }

      const customerName = order.customer?.first_name
        ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
        : (order.address?.full_name || 'Valued Customer');

      const orderNumber = order.order_number || `#${order.id?.slice(0, 8)}`;
      const grandTotal = parseFloat(order.grand_total || 0).toFixed(2);
      const ordersUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${order.id}`;

      let refundDescription = 'No refund was required for this transaction.';
      if (refundStatus === 'REFUNDED') {
        refundDescription = `A refund of SAR ${grandTotal} has been initiated and processed back to your original payment method. Depending on your bank, it may take 3-7 business days to reflect.`;
      } else if (refundStatus === 'PENDING_REFUND') {
        refundDescription = `A refund of SAR ${grandTotal} is being processed by our accounts team.`;
      } else if (order.payment_method === 'COD') {
        refundDescription = 'As this was a Cash on Delivery order, no payment was collected.';
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order #${orderNumber} Cancelled</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #991b1b; padding: 28px 32px; color: #ffffff; text-align: center; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-bottom: 12px; }
    .info-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .refund-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; color: #166534; font-size: 13px; line-height: 1.5; }
    .btn { display: inline-block; background: #043927; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-align: center; margin-top: 16px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Order Cancelled</h1>
      <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Order #${orderNumber}</p>
    </div>
    <div class="content">
      <span class="badge">CANCELLED</span>
      <p style="margin: 0 0 16px 0; font-size: 15px;">Hello <strong>${customerName}</strong>,</p>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        We have processed the cancellation request for your order <strong>#${orderNumber}</strong>.
      </p>

      <div class="info-box">
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Cancellation Reason:</strong> ${reason}</p>
        ${remarks ? `<p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Remarks:</strong> ${remarks}</p>` : ''}
        <p style="margin: 0; font-size: 13px;"><strong>Order Total:</strong> SAR ${grandTotal}</p>
      </div>

      <div class="refund-box">
        <strong>Refund Status (${refundStatus}):</strong><br>
        ${refundDescription}
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${ordersUrl}" class="btn">View Order Details</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">Falcon Fresh Market • 100% Quality & Cold-Chain Logistics</p>
      <p style="margin: 0;">If you did not request this cancellation or have any questions, please contact our 24/7 support.</p>
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"Falcon Fresh Market" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@falcon-grocery.com'}>`,
        to: customerEmail,
        subject: `Order #${orderNumber} Has Been Cancelled`,
        text: `Hello ${customerName},\n\nYour order #${orderNumber} has been cancelled.\nReason: ${reason}\n${remarks ? `Remarks: ${remarks}\n` : ''}Refund Status: ${refundStatus}\n${refundDescription}\n\nView details: ${ordersUrl}`,
        html: emailHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Order cancellation email sent successfully to ${customerEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Error sending order cancellation email for order ${order?.order_number}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send one-time verification code (OTP) for account registration / verification
   * @param {string} recipientEmail - Recipient email address
   * @param {string} code - 6-digit OTP code
   */
  async sendVerificationEmail(recipientEmail, code) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        logger.error('Email transporter not available for verification email');
        return { success: false, error: 'Email service transporter not available' };
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
  <div style="max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00c269 0%, #043927 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Falcon E-Commerce</h1>
      <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 14px;">Email Verification Code</p>
    </div>

    <!-- Content -->
    <div style="padding: 36px 32px; text-align: center;">
      <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a; font-weight: 700;">Verify Your Email Address</h2>
      <p style="margin: 0 0 28px 0; font-size: 14px; color: #64748b; line-height: 1.6;">
        Use the following one-time verification code to complete your registration.
      </p>

      <!-- Code Box -->
      <div style="background: #f0fdf4; border: 2px dashed #00c269; border-radius: 12px; padding: 20px; margin: 0 auto 28px auto; max-width: 280px;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #043927; display: block; font-family: monospace;">${code}</span>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
        ⏱️ This code is valid for <strong>10 minutes</strong>.
      </p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        If you did not request this verification code, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
      © ${new Date().getFullYear()} Falcon Grocery & E-Commerce. All rights reserved.
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"Falcon Verification" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@falcon-grocery.com'}>`,
        to: recipientEmail,
        subject: `${code} is your Falcon verification code`,
        text: `Your Falcon verification code is: ${code}\n\nThis code will expire in 10 minutes.\nIf you didn't request this, please ignore this email.`,
        html: emailHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent successfully to ${recipientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Error sending verification email to ${recipientEmail}:`, err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();
