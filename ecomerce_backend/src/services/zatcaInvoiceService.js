const { Invoice, InvoiceItem, Order, OrderItem, Customer, User, sequelize } = require('../models');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ZatcaInvoiceService {
  /**
   * Constructs ZATCA TLV Base64 Encoded QR Code Buffer
   * Tag 1: Seller Name
   * Tag 2: VAT Registration Number
   * Tag 3: Timestamp (ISO 8601 UTC)
   * Tag 4: Invoice Total (with VAT)
   * Tag 5: VAT Total
   */
  generateZatcaTlvQrCode(sellerName, vatNumber, timestamp, totalWithVat, vatTotal) {
    const getTlvTag = (tagNum, valueStr) => {
      const valueBuf = Buffer.from(valueStr, 'utf8');
      const tagBuf = Buffer.from([tagNum]);
      const lengthBuf = Buffer.from([valueBuf.length]);
      return Buffer.concat([tagBuf, lengthBuf, valueBuf]);
    };

    const tag1 = getTlvTag(1, sellerName);
    const tag2 = getTlvTag(2, vatNumber);
    const tag3 = getTlvTag(3, timestamp);
    const tag4 = getTlvTag(4, parseFloat(totalWithVat).toFixed(2));
    const tag5 = getTlvTag(5, parseFloat(vatTotal).toFixed(2));

    const tlvBuffer = Buffer.concat([tag1, tag2, tag3, tag4, tag5]);
    return tlvBuffer.toString('base64');
  }

  async generateInvoiceForOrder(orderId, parentTransaction = null) {
    const existingInvoice = await Invoice.findOne({ where: { order_id: orderId }, transaction: parentTransaction });
    if (existingInvoice) {
      return existingInvoice;
    }

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: OrderItem, as: 'items' },
      ],
      transaction: parentTransaction,
    });

    if (!order) {
      throw new Error('Order not found for invoice generation');
    }

    const sellerName = process.env.ZATCA_SELLER_NAME || 'Single Vendor E-Commerce Trading Co.';
    const sellerVatNumber = process.env.ZATCA_VAT_NUMBER || '300000000000003';
    const buyerName = `${order.customer.first_name} ${order.customer.last_name}`;
    const issueDateTime = new Date().toISOString();

    // Generate ZATCA QR Code Payload
    const qrPayload = this.generateZatcaTlvQrCode(
      sellerName,
      sellerVatNumber,
      issueDateTime,
      order.grand_total,
      order.tax_total
    );

    const invoiceNumber = `INV-${order.order_number.replace('ORD-', '')}`;
    const invoiceUuid = uuidv4();

    const createLogic = async (t) => {
      const invoice = await Invoice.create({
        invoice_number: invoiceNumber,
        uuid: invoiceUuid,
        order_id: order.id,
        issue_date_time: issueDateTime,
        seller_name: sellerName,
        seller_vat_number: sellerVatNumber,
        buyer_name: buyerName,
        total_excluding_vat: order.subtotal,
        vat_total: order.tax_total,
        total_including_vat: order.grand_total,
        qr_code_payload: qrPayload,
      }, { transaction: t });

      const invoiceItems = order.items.map(item => ({
        invoice_id: invoice.id,
        item_name_en: item.product_name_en,
        item_name_ar: item.product_name_ar,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: 15.00,
        vat_amount: item.tax_amount,
        total_with_vat: item.total_price,
      }));

      await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });

      // Generate PDF File
      const pdfUrl = await this.generatePdfInvoiceFile(invoice, invoiceItems, qrPayload);
      await invoice.update({ pdf_file_url: pdfUrl }, { transaction: t });

      return invoice;
    };

    if (parentTransaction) {
      return await createLogic(parentTransaction);
    } else {
      return await sequelize.transaction(createLogic);
    }
  }

  async generatePdfInvoiceFile(invoice, items, qrPayload) {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const absoluteUploadDir = path.join(__dirname, '..', '..', uploadDir);
    if (!fs.existsSync(absoluteUploadDir)) {
      fs.mkdirSync(absoluteUploadDir, { recursive: true });
    }

    const filename = `invoice-${invoice.invoice_number}.pdf`;
    const filePath = path.join(absoluteUploadDir, filename);

    // Generate Data URL for QR Code image
    const qrImageDataUrl = await QRCode.toDataURL(qrPayload);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('TAX INVOICE / فاتورة ضريبية', { align: 'center' }).moveDown();
      doc.fontSize(10).text(`Seller / البائع: ${invoice.seller_name}`);
      doc.text(`VAT Number / الرقم الضريبي: ${invoice.seller_vat_number}`);
      doc.text(`Invoice Number / رقم الفاتورة: ${invoice.invoice_number}`);
      doc.text(`Date & Time / التاريخ والوقت: ${new Date(invoice.issue_date_time).toLocaleString()}`);
      doc.text(`Buyer / المشتري: ${invoice.buyer_name}`);
      doc.moveDown();

      // Render QR Code Image
      doc.image(qrImageDataUrl, 420, 50, { width: 120, height: 120 });

      // Table Header
      doc.fontSize(10).text('---------------------------------------------------------------------------------------------------');
      doc.text('Item (الوصف)                              Qty    Price      VAT(15%)   Total');
      doc.text('---------------------------------------------------------------------------------------------------');

      items.forEach(item => {
        const line = `${item.item_name_en.substring(0, 30).padEnd(35)} ${item.quantity.toString().padEnd(6)} ${parseFloat(item.unit_price).toFixed(2).padEnd(10)} ${parseFloat(item.vat_amount).toFixed(2).padEnd(10)} ${parseFloat(item.total_with_vat).toFixed(2)}`;
        doc.text(line);
      });

      doc.text('---------------------------------------------------------------------------------------------------');
      doc.moveDown();
      doc.fontSize(12).text(`Subtotal / المجموع غير شامل الضريبة: ${parseFloat(invoice.total_excluding_vat).toFixed(2)} SAR`, { align: 'right' });
      doc.text(`Total VAT (15%) / ضريبة القيمة المضافة: ${parseFloat(invoice.vat_total).toFixed(2)} SAR`, { align: 'right' });
      doc.fontSize(14).text(`Grand Total / المجموع الكلي: ${parseFloat(invoice.total_including_vat).toFixed(2)} SAR`, { align: 'right' });

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/${filename}`);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  async getInvoiceByOrderId(orderId) {
    return await Invoice.findOne({
      where: { order_id: orderId },
      include: ['items'],
    });
  }
}

module.exports = new ZatcaInvoiceService();
