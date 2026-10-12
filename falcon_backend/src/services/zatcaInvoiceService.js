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
    const existingInvoice = await Invoice.findOne({ where: { order_id: orderId }, include: ['items'], transaction: parentTransaction });
    if (existingInvoice) {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const absPath = existingInvoice.pdf_file_url
        ? path.join(__dirname, '..', '..', existingInvoice.pdf_file_url.replace('/uploads/', `${uploadDir}/`))
        : null;
      if (!absPath || !fs.existsSync(absPath)) {
        const pdfUrl = await this.generatePdfInvoiceFile(existingInvoice, existingInvoice.items || [], existingInvoice.qr_code_payload);
        await existingInvoice.update({ pdf_file_url: pdfUrl }, { transaction: parentTransaction });
      }
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
    const buyerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Valued Customer' : 'Valued Customer';
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

    // Generate Base64 Data URL for ZATCA QR Code image
    const qrImageDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      const pageWidth = 515; // 595.28 - 2*40
      const startX = 40;

      // ================= 1. LUXURY TOP BRANDING BANNER =================
      doc.roundedRect(startX, 35, pageWidth, 68, 10).fill('#043927');
      
      // Brand Title
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('FALCON FRESH MARKET', startX + 16, 47);
      
      // Subtitle
      doc.fillColor('#F59E0B').fontSize(8.5).font('Helvetica-Bold').text('SIMPLIFIED TAX INVOICE • ZATCA FATOORAH PHASE 2', startX + 16, 71);
      doc.fillColor('#D1FAE5').fontSize(8).font('Helvetica').text('Kingdom of Saudi Arabia • Single Vendor E-Commerce Platform', startX + 16, 84);

      // Status Pill on top-right of banner
      doc.roundedRect(startX + pageWidth - 120, 50, 105, 24, 6).fill('#05A764');
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text('PAID & VERIFIED', startX + pageWidth - 120, 57, { width: 105, align: 'center' });

      // ================= 2. SELLER INFO & QR CODE CARDS =================
      const cardY = 113;
      const sellerCardWidth = 370;

      // Seller Information Card
      doc.roundedRect(startX, cardY, sellerCardWidth, 80, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#043927').fontSize(9).font('Helvetica-Bold').text('SELLER / TAXPAYER DETAILS', startX + 12, cardY + 10);
      
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(invoice.seller_name || 'Falcon E-Commerce Trading Co.', startX + 12, cardY + 25);
      doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`VAT Reg. No: ${invoice.seller_vat_number || '300000000000003'}   |   CR No: 1010892341`, startX + 12, cardY + 40);
      doc.text('Address: King Fahd Rd, Al-Malqa District, Riyadh 13521, KSA', startX + 12, cardY + 53);
      doc.fillColor('#05A764').fontSize(7.5).font('Helvetica-Bold').text('Official 100% Cold-Chain Refrigerated Delivery Certified', startX + 12, cardY + 66);

      // ZATCA QR Code Card
      const qrCardX = startX + sellerCardWidth + 10;
      const qrCardWidth = pageWidth - sellerCardWidth - 10; // 135
      doc.roundedRect(qrCardX, cardY, qrCardWidth, 80, 8).fillAndStroke('#FFFFFF', '#05A764');
      
      // QR Code Image
      doc.image(qrImageDataUrl, qrCardX + (qrCardWidth - 58) / 2, cardY + 5, { width: 58, height: 58 });
      doc.fillColor('#043927').fontSize(6.5).font('Helvetica-Bold').text('ZATCA FATOORAH QR', qrCardX, cardY + 67, { width: qrCardWidth, align: 'center' });

      // ================= 3. INVOICE META & BUYER CARDS =================
      const metaY = 201;
      const halfCardWidth = (pageWidth - 10) / 2; // 252.5

      // Left: Invoice Metadata Card
      doc.roundedRect(startX, metaY, halfCardWidth, 75, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#043927').fontSize(8.5).font('Helvetica-Bold').text('INVOICE INFORMATION', startX + 12, metaY + 9);
      
      const formattedDate = new Date(invoice.issue_date_time).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Invoice No:', startX + 12, metaY + 24);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(invoice.invoice_number, startX + 85, metaY + 24);

      doc.fillColor('#64748B').font('Helvetica').text('Issue Date:', startX + 12, metaY + 37);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(formattedDate, startX + 85, metaY + 37);

      doc.fillColor('#64748B').font('Helvetica').text('Payment:', startX + 12, metaY + 50);
      doc.fillColor('#05A764').font('Helvetica-Bold').text('Mada / Electronic Card', startX + 85, metaY + 50);

      doc.fillColor('#64748B').font('Helvetica').text('ZATCA Status:', startX + 12, metaY + 63);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text('Phase 2 Compliant (Reported)', startX + 85, metaY + 63);

      // Right: Buyer Details Card
      const buyerCardX = startX + halfCardWidth + 10;
      doc.roundedRect(buyerCardX, metaY, halfCardWidth, 75, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#043927').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER / BUYER DETAILS', buyerCardX + 12, metaY + 9);

      const buyerNameClean = (invoice.buyer_name || 'Valued Customer').replace(/[^\x20-\x7E]/g, '').trim() || 'Valued Customer';
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Buyer Name:', buyerCardX + 12, metaY + 24);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(buyerNameClean, buyerCardX + 85, metaY + 24);

      doc.fillColor('#64748B').font('Helvetica').text('Fulfillment:', buyerCardX + 12, metaY + 37);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text('Home Express Delivery', buyerCardX + 85, metaY + 37);

      doc.fillColor('#64748B').font('Helvetica').text('Destination:', buyerCardX + 12, metaY + 50);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text('Riyadh Province, Saudi Arabia', buyerCardX + 85, metaY + 50);

      doc.fillColor('#64748B').font('Helvetica').text('Customer Type:', buyerCardX + 12, metaY + 63);
      doc.fillColor('#05A764').font('Helvetica-Bold').text('Individual Consumer (B2C)', buyerCardX + 85, metaY + 63);

      // ================= 4. ITEMIZED PRODUCTS TABLE =================
      const tableHeaderY = 286;
      doc.roundedRect(startX, tableHeaderY, pageWidth, 24, 6).fill('#043927');

      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('ITEM DESCRIPTION', startX + 12, tableHeaderY + 8);
      doc.text('QTY', startX + 225, tableHeaderY + 8, { width: 35, align: 'center' });
      doc.text('UNIT PRICE', startX + 265, tableHeaderY + 8, { width: 75, align: 'right' });
      doc.text('VAT (15%)', startX + 345, tableHeaderY + 8, { width: 70, align: 'right' });
      doc.text('TOTAL (SAR)', startX + 420, tableHeaderY + 8, { width: 85, align: 'right' });

      let currentY = tableHeaderY + 26;
      const rowHeight = 26;

      const safeItems = Array.isArray(items) && items.length > 0 ? items : [
        {
          item_name_en: 'Fresh Grocery Item',
          quantity: 1,
          unit_price: invoice.total_excluding_vat,
          vat_amount: invoice.vat_total,
          total_with_vat: invoice.total_including_vat,
        }
      ];

      safeItems.forEach((item, index) => {
        const isAlt = index % 2 === 1;
        if (isAlt) {
          doc.rect(startX, currentY, pageWidth, rowHeight).fill('#F8FAFC');
        }

        // Bottom separator
        doc.moveTo(startX, currentY + rowHeight).lineTo(startX + pageWidth, currentY + rowHeight).strokeColor('#E2E8F0').lineWidth(0.6).stroke();

        const rawName = item.item_name_en || item.name || 'Fresh Grocery Item';
        const sanitizedName = rawName.replace(/[^\x20-\x7E]/g, '').trim();
        const itemName = (sanitizedName || 'Fresh Grocery Item').substring(0, 38);
        const qty = item.quantity || 1;
        const unitPrice = parseFloat(item.unit_price || 0).toFixed(2);
        const vatAmount = parseFloat(item.vat_amount || 0).toFixed(2);
        const totalWithVat = parseFloat(item.total_with_vat || (parseFloat(unitPrice) * qty)).toFixed(2);

        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(itemName, startX + 12, currentY + 8);
        doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(qty.toString(), startX + 225, currentY + 8, { width: 35, align: 'center' });
        doc.text(`${unitPrice} SAR`, startX + 265, currentY + 8, { width: 75, align: 'right' });
        doc.text(`${vatAmount} SAR`, startX + 345, currentY + 8, { width: 70, align: 'right' });
        doc.fillColor('#043927').font('Helvetica-Bold').text(`${totalWithVat} SAR`, startX + 420, currentY + 8, { width: 85, align: 'right' });

        currentY += rowHeight;
      });

      // ================= 5. FINANCIAL SUMMARY & HIGHLIGHT CARD =================
      const summaryY = currentY + 14;
      const summaryWidth = 240;
      const summaryX = startX + pageWidth - summaryWidth;

      // Summary Card
      doc.roundedRect(summaryX, summaryY, summaryWidth, 105, 8).fillAndStroke('#F8FAFC', '#E2E8F0');

      const subtotal = parseFloat(invoice.total_excluding_vat || 0).toFixed(2);
      const vatTotal = parseFloat(invoice.vat_total || 0).toFixed(2);
      const grandTotal = parseFloat(invoice.total_including_vat || 0).toFixed(2);

      // Line 1: Subtotal
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Subtotal (Excl. VAT):', summaryX + 12, summaryY + 12);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${subtotal} SAR`, summaryX + 120, summaryY + 12, { width: 108, align: 'right' });

      // Line 2: Delivery
      doc.fillColor('#64748B').font('Helvetica').text('Cold-Chain Delivery Fee:', summaryX + 12, summaryY + 28);
      doc.fillColor('#05A764').font('Helvetica-Bold').text('0.00 SAR (FREE)', summaryX + 120, summaryY + 28, { width: 108, align: 'right' });

      // Line 3: Total VAT
      doc.fillColor('#64748B').font('Helvetica').text('Value Added Tax (15%):', summaryX + 12, summaryY + 44);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${vatTotal} SAR`, summaryX + 120, summaryY + 44, { width: 108, align: 'right' });

      // Grand Total Highlight Banner
      doc.roundedRect(summaryX + 6, summaryY + 62, summaryWidth - 12, 35, 6).fill('#043927');
      doc.fillColor('#F59E0B').fontSize(8).font('Helvetica-Bold').text('GRAND TOTAL (INCL. VAT):', summaryX + 14, summaryY + 74);
      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(`${grandTotal} SAR`, summaryX + 120, summaryY + 72, { width: 100, align: 'right' });

      // Left Column Quality Guarantee Ribbon next to Summary
      const guaranteeWidth = summaryX - startX - 15; // 260 pt
      doc.roundedRect(startX, summaryY, guaranteeWidth, 105, 8).fillAndStroke('#ECFDF5', '#A7F3D0');
      
      doc.fillColor('#043927').fontSize(9).font('Helvetica-Bold').text('100% FRESHNESS & COLD-CHAIN CERTIFIED', startX + 14, summaryY + 14);
      doc.fillColor('#065F46').fontSize(7.5).font('Helvetica').text(
        'Every produce and chilled grocery cut in this order was packed in an insulated thermal tote and maintained within 2°C to 4°C active refrigerated temperature logs from harvest farm to your doorstep.',
        startX + 14,
        summaryY + 30,
        { width: guaranteeWidth - 28, lineGap: 3 }
      );
      doc.fillColor('#043927').fontSize(7.5).font('Helvetica-Bold').text(
        'Quality Guarantee: Instant MartPoints credit for any damaged item.',
        startX + 14,
        summaryY + 82,
        { width: guaranteeWidth - 28 }
      );

      // ================= 6. OFFICIAL LEGAL FOOTER =================
      const footerY = 740;
      doc.moveTo(startX, footerY).lineTo(startX + pageWidth, footerY).strokeColor('#CBD5E1').lineWidth(0.8).stroke();

      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(
        'This is a certified electronic tax invoice generated in accordance with ZATCA (Zakat, Tax and Customs Authority) Phase 2 Fatoorah regulations in the Kingdom of Saudi Arabia. No handwritten signature or physical stamp is required.',
        startX,
        footerY + 10,
        { width: pageWidth, align: 'center', lineGap: 2 }
      );
      
      doc.fillColor('#043927').fontSize(7.5).font('Helvetica-Bold').text(
        'Falcon Fresh Market KSA • Commercial Registration: 1010892341 • VAT Number: 300000000000003 • 24/7 Hotline: 9200-FALCON',
        startX,
        footerY + 30,
        { width: pageWidth, align: 'center' }
      );

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
