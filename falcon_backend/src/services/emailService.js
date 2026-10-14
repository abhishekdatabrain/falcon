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
}

module.exports = new EmailService();
