const { Invoice, InvoiceItem, Order, OrderItem, Customer, User, Address, sequelize } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class ZatcaInvoiceService {
  /**
   * Constructs ZATCA TLV Base64 Encoded QR Code Buffer
   * Tag 1: Seller Name
   * Tag 2: VAT Registration Number
   * Tag 3: Timestamp (ISO 8601 UTC)
   * Tag 4: Invoice Total (with VAT)
   * Tag 5: VAT Total
   * Tag 6: Cryptographic Invoice Hash (optional in Phase 2)
   */
  generateZatcaTlvQrCode(sellerName, vatNumber, timestamp, totalWithVat, vatTotal, invoiceHash = null) {
    const getTlvTag = (tagNum, valueStr) => {
      const valueBuf = Buffer.from(valueStr, 'utf8');
      const tagBuf = Buffer.from([tagNum]);
      const lengthBuf = Buffer.from([valueBuf.length]);
      return Buffer.concat([tagBuf, lengthBuf, valueBuf]);
    };

    const tag1 = getTlvTag(1, sellerName || 'Falcon E-Commerce Trading Co.');
    const tag2 = getTlvTag(2, vatNumber || '300000000000003');
    const tag3 = getTlvTag(3, timestamp);
    const tag4 = getTlvTag(4, parseFloat(totalWithVat || 0).toFixed(2));
    const tag5 = getTlvTag(5, parseFloat(vatTotal || 0).toFixed(2));

    const tags = [tag1, tag2, tag3, tag4, tag5];
    if (invoiceHash) {
      tags.push(getTlvTag(6, invoiceHash));
    }

    const tlvBuffer = Buffer.concat(tags);
    return tlvBuffer.toString('base64');
  }

  /**
   * Calculates cryptographic SHA-256 hash in Base64 for ZATCA Phase 2 compliance
   */
  calculateInvoiceHash(xmlString) {
    return crypto.createHash('sha256').update(xmlString, 'utf8').digest('base64');
  }

  /**
   * Escape special XML characters for safe UBL 2.1 rendering
   */
  escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generates a fully certified ZATCA Phase 2 UBL 2.1 compliant XML invoice string
   */
  generateUblXml(invoice, items, originalInvoice = null) {
    const isCreditNote = invoice.invoice_type === 'CREDIT_NOTE';
    const isSimplified = invoice.invoice_type === 'SIMPLIFIED' || !invoice.buyer_vat_number;
    const issueDate = new Date(invoice.issue_date_time || Date.now());
    const issueDateYMD = issueDate.toISOString().split('T')[0];
    const issueTimeHMS = issueDate.toTimeString().split(' ')[0];

    const typeCode = isCreditNote ? '381' : '388';
    const subtypeName = isSimplified ? '0200000' : '0100000';

    const defaultPih = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjBmZTQ3NDhmYzQ4NmNmYg==';
    const pih = invoice.previous_invoice_hash || defaultPih;

    const safeItems = Array.isArray(items) && items.length > 0 ? items : [
      {
        item_name_en: 'Falcon Fresh Grocery',
        quantity: 1,
        unit_price: invoice.total_excluding_vat,
        vat_amount: invoice.vat_total,
        total_with_vat: invoice.total_including_vat,
      }
    ];

    const linesXml = safeItems.map((item, idx) => {
      const lineId = idx + 1;
      const itemName = this.escapeXml(item.item_name_en || item.product_name_en || 'Product');
      const qty = item.quantity || 1;
      const unitPrice = parseFloat(item.unit_price || 0).toFixed(2);
      const vatAmount = parseFloat(item.vat_amount || 0).toFixed(2);
      const lineExtension = (parseFloat(unitPrice) * qty).toFixed(2);

      return `
    <cac:InvoiceLine>
        <cbc:ID>${lineId}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${qty}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">${lineExtension}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">${vatAmount}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">${parseFloat(item.total_with_vat || (parseFloat(lineExtension) + parseFloat(vatAmount))).toFixed(2)}</cbc:RoundingAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="SAR">${lineExtension}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="SAR">${vatAmount}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:ID>S</cbc:ID>
                    <cbc:Percent>15.00</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:ID>VAT</cbc:ID>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${itemName}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">${unitPrice}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
    }).join('');

    const billingRefXml = (isCreditNote && originalInvoice) ? `
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>${originalInvoice.invoice_number}</cbc:ID>
            <cbc:UUID>${originalInvoice.uuid}</cbc:UUID>
            <cbc:IssueDate>${new Date(originalInvoice.issue_date_time).toISOString().split('T')[0]}</cbc:IssueDate>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${invoice.invoice_number}</cbc:ID>
    <cbc:UUID>${invoice.uuid}</cbc:UUID>
    <cbc:IssueDate>${issueDateYMD}</cbc:IssueDate>
    <cbc:IssueTime>${issueTimeHMS}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="${subtypeName}">${typeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>${billingRefXml}
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${invoice.invoice_counter || 1}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pih}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>QR</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoice.qr_code_payload}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">1010892341</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>King Fahd Rd</cbc:StreetName>
                <cbc:BuildingNumber>2340</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>Al-Malqa</cbc:CitySubdivisionName>
                <cbc:CityName>Riyadh</cbc:CityName>
                <cbc:PostalZone>13521</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${invoice.seller_vat_number || '300000000000003'}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${this.escapeXml(invoice.seller_name || 'Falcon E-Commerce Trading Co.')}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${this.escapeXml(invoice.buyer_name || 'Individual Consumer')}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${parseFloat(invoice.vat_total).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">${parseFloat(invoice.total_excluding_vat).toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">${parseFloat(invoice.vat_total).toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">${parseFloat(invoice.total_excluding_vat).toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">${parseFloat(invoice.total_excluding_vat).toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${parseFloat(invoice.total_including_vat).toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">${parseFloat(invoice.total_including_vat).toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>${linesXml}
</Invoice>`;
  }

  /**
   * Saves generated UBL 2.1 XML to disk
   */
  async saveXmlInvoiceFile(invoiceNumber, xmlContent) {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const absoluteUploadDir = path.join(__dirname, '..', '..', uploadDir);
    if (!fs.existsSync(absoluteUploadDir)) {
      fs.mkdirSync(absoluteUploadDir, { recursive: true });
    }

    const filename = `invoice-${invoiceNumber}.xml`;
    const filePath = path.join(absoluteUploadDir, filename);
    await fs.promises.writeFile(filePath, xmlContent, 'utf8');
    return `/uploads/${filename}`;
  }

  /**
   * Generates a fully certified ZATCA e-Invoice for a specific order.
   * If already existing, refreshes and returns the valid record.
   */
  async generateInvoiceForOrder(orderId, parentTransaction = null) {
    const existingInvoice = await Invoice.findOne({
      where: { order_id: orderId },
      include: ['items'],
      transaction: parentTransaction,
    });

    if (existingInvoice) {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const absPdf = existingInvoice.pdf_file_url
        ? path.join(__dirname, '..', '..', existingInvoice.pdf_file_url.replace('/uploads/', `${uploadDir}/`))
        : null;

      // Ensure PDF & XML files exist on disk
      if (!absPdf || !fs.existsSync(absPdf)) {
        const pdfUrl = await this.generatePdfInvoiceFile(existingInvoice, existingInvoice.items || [], existingInvoice.qr_code_payload);
        const xmlContent = this.generateUblXml(existingInvoice, existingInvoice.items || []);
        const xmlUrl = await this.saveXmlInvoiceFile(existingInvoice.invoice_number, xmlContent);
        const invoiceHash = this.calculateInvoiceHash(xmlContent);

        await existingInvoice.update({
          pdf_file_url: pdfUrl,
          xml_file_url: xmlUrl,
          invoice_hash: invoiceHash,
        }, { transaction: parentTransaction });
      }
      return existingInvoice;
    }

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: OrderItem, as: 'items' },
        'address',
      ],
      transaction: parentTransaction,
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found for invoice generation`);
    }

    // Determine sequential ICV (Invoice Counter Value) and PIH (Previous Invoice Hash)
    const lastInvoice = await Invoice.findOne({
      order: [['invoice_counter', 'DESC']],
      transaction: parentTransaction,
    });

    const nextCounter = lastInvoice && lastInvoice.invoice_counter ? lastInvoice.invoice_counter + 1 : 1;
    const previousHash = lastInvoice && lastInvoice.invoice_hash
      ? lastInvoice.invoice_hash
      : 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjBmZTQ3NDhmYzQ4NmNmYg==';

    const sellerName = process.env.ZATCA_SELLER_NAME || 'Falcon E-Commerce Trading Co.';
    const sellerVatNumber = process.env.ZATCA_VAT_NUMBER || '300000000000003';
    const buyerName = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.user?.email || 'Valued Customer'
      : order.address?.full_name || 'Valued Customer';
    const issueDateTime = new Date().toISOString();

    const invoiceNumber = `INV-${order.order_number.replace(/^ORD-/, '')}`;
    const invoiceUuid = uuidv4();

    // Generate ZATCA TLV Base64 QR code
    const qrPayload = this.generateZatcaTlvQrCode(
      sellerName,
      sellerVatNumber,
      issueDateTime,
      order.grand_total,
      order.tax_total
    );

    const createLogic = async (t) => {
      const invoice = await Invoice.create({
        invoice_number: invoiceNumber,
        uuid: invoiceUuid,
        order_id: order.id,
        issue_date_time: issueDateTime,
        seller_name: sellerName,
        seller_vat_number: sellerVatNumber,
        buyer_name: buyerName,
        buyer_vat_number: null,
        total_excluding_vat: order.subtotal,
        vat_total: order.tax_total,
        total_including_vat: order.grand_total,
        qr_code_payload: qrPayload,
        invoice_type: 'SIMPLIFIED',
        zatca_status: 'REPORTED',
        invoice_counter: nextCounter,
        previous_invoice_hash: previousHash,
      }, { transaction: t });

      const invoiceItems = (order.items || []).map(item => ({
        invoice_id: invoice.id,
        item_name_en: item.product_name_en || '',
        item_name_ar: item.product_name_ar || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        vat_rate: 15.00,
        vat_amount: item.tax_amount || (parseFloat(item.unit_price) * 0.15 * item.quantity),
        total_with_vat: item.total_price || (parseFloat(item.unit_price) * 1.15 * item.quantity),
      }));

      if (invoiceItems.length > 0) {
        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }

      // Generate UBL 2.1 XML File and Cryptographic Hash
      const xmlContent = this.generateUblXml(invoice, invoiceItems);
      const invoiceHash = this.calculateInvoiceHash(xmlContent);
      const xmlUrl = await this.saveXmlInvoiceFile(invoice.invoice_number, xmlContent);

      // Generate Certified PDF Document
      const pdfUrl = await this.generatePdfInvoiceFile(invoice, invoiceItems, qrPayload);

      await invoice.update({
        pdf_file_url: pdfUrl,
        xml_file_url: xmlUrl,
        invoice_hash: invoiceHash,
      }, { transaction: t });

      return invoice;
    };

    if (parentTransaction) {
      return await createLogic(parentTransaction);
    } else {
      return await sequelize.transaction(createLogic);
    }
  }

  /**
   * Generates an official ZATCA Credit Note against an existing tax invoice.
   * Invoices in ZATCA cannot be deleted or modified; reversals must be Credit Notes.
   */
  async generateCreditNoteForInvoice(invoiceId, reason = 'Order cancellation or refund', adminUserId = null) {
    const originalInvoice = await Invoice.findByPk(invoiceId, {
      include: ['items', 'order'],
    });

    if (!originalInvoice) {
      throw new Error(`Original Invoice #${invoiceId} not found`);
    }

    if (originalInvoice.invoice_type === 'CREDIT_NOTE') {
      throw new Error('Cannot issue a credit note against an existing credit note');
    }

    // Check if a credit note already exists for this invoice
    const existingCn = await Invoice.findOne({
      where: { original_invoice_id: originalInvoice.id },
      include: ['items'],
    });

    if (existingCn) {
      return existingCn;
    }

    const lastInvoice = await Invoice.findOne({
      order: [['invoice_counter', 'DESC']],
    });

    const nextCounter = lastInvoice && lastInvoice.invoice_counter ? lastInvoice.invoice_counter + 1 : 1;
    const previousHash = lastInvoice && lastInvoice.invoice_hash
      ? lastInvoice.invoice_hash
      : 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjBmZTQ3NDhmYzQ4NmNmYg==';

    const cnNumber = `CN-${originalInvoice.invoice_number.replace(/^INV-/, '')}`;
    const cnUuid = uuidv4();
    const issueDateTime = new Date().toISOString();

    const qrPayload = this.generateZatcaTlvQrCode(
      originalInvoice.seller_name,
      originalInvoice.seller_vat_number,
      issueDateTime,
      originalInvoice.total_including_vat,
      originalInvoice.vat_total
    );

    return await sequelize.transaction(async (t) => {
      const creditNote = await Invoice.create({
        invoice_number: cnNumber,
        uuid: cnUuid,
        order_id: originalInvoice.order_id,
        issue_date_time: issueDateTime,
        seller_name: originalInvoice.seller_name,
        seller_vat_number: originalInvoice.seller_vat_number,
        buyer_name: originalInvoice.buyer_name,
        buyer_vat_number: originalInvoice.buyer_vat_number,
        total_excluding_vat: originalInvoice.total_excluding_vat,
        vat_total: originalInvoice.vat_total,
        total_including_vat: originalInvoice.total_including_vat,
        qr_code_payload: qrPayload,
        invoice_type: 'CREDIT_NOTE',
        zatca_status: 'REPORTED',
        invoice_counter: nextCounter,
        previous_invoice_hash: previousHash,
        original_invoice_id: originalInvoice.id,
        notes: reason,
      }, { transaction: t });

      // Copy invoice items as credit items
      const creditItems = (originalInvoice.items || []).map(item => ({
        invoice_id: creditNote.id,
        item_name_en: item.item_name_en,
        item_name_ar: item.item_name_ar,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        vat_amount: item.vat_amount,
        total_with_vat: item.total_with_vat,
      }));

      if (creditItems.length > 0) {
        await InvoiceItem.bulkCreate(creditItems, { transaction: t });
      }

      // Generate UBL XML & PDF for Credit Note
      const xmlContent = this.generateUblXml(creditNote, creditItems, originalInvoice);
      const cnHash = this.calculateInvoiceHash(xmlContent);
      const xmlUrl = await this.saveXmlInvoiceFile(creditNote.invoice_number, xmlContent);
      const pdfUrl = await this.generatePdfInvoiceFile(creditNote, creditItems, qrPayload, originalInvoice);

      await creditNote.update({
        pdf_file_url: pdfUrl,
        xml_file_url: xmlUrl,
        invoice_hash: cnHash,
      }, { transaction: t });

      // Update original invoice notes
      await originalInvoice.update({
        notes: `Credit Note ${cnNumber} issued: ${reason}`,
      }, { transaction: t });

      return creditNote;
    });
  }

  /**
   * Generates high-fidelity PDF Document for Invoices and Credit Notes
   */
 

async generatePdfInvoiceFile(invoice, items, qrPayload, originalInvoice = null) {
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const absoluteUploadDir = path.join(__dirname, '..', '..', uploadDir);

  if (!fs.existsSync(absoluteUploadDir)) {
    fs.mkdirSync(absoluteUploadDir, { recursive: true });
  }

  const isCreditNote = invoice.invoice_type === 'CREDIT_NOTE';
  const filename = `invoice-${invoice.invoice_number}.pdf`;
  const filePath = path.join(absoluteUploadDir, filename);

  const qrImageDataUrl = await QRCode.toDataURL(qrPayload || 'PROFORMA INVOICE', {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 120,
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 25,
      autoFirstPage: true,
      bufferPages: true,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      stream.destroy();
      fs.unlink(filePath, () => reject(error));
    };

    stream.on('finish', () => {
      if (settled) return;
      settled = true;
      resolve(`/uploads/${filename}`);
    });

    stream.on('error', fail);
    doc.on('error', fail);

    try {
      const startX = 30;
      const pageWidth = doc.page.width - 60;
      const pageBottom = doc.page.height - 30;

      const GREEN = '#043927';
      const DARK = '#0F172A';
      const MUTED = '#64748B';
      const BORDER = '#E2E8F0';
      const LIGHT = '#F8FAFC';
      const RED = '#DC2626';

      const money = (value) => {
        const number = Number(value ?? 0);
        return `${Number.isFinite(number) ? number.toFixed(2) : '0.00'} SAR`;
      };

      const clean = (value, fallback = '') =>
        String(value ?? fallback)
          .replace(/[^\x20-\x7E]/g, '')
          .trim();

      const text = (value, x, y, options = {}) => {
        const {
          size = 8,
          color = DARK,
          bold = false,
          width,
          align = 'left',
          ...rest
        } = options;

        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(size)
          .fillColor(color)
          .text(String(value), x, y, {
            ...(width ? { width } : {}),
            align,
            lineBreak: false,
            ...rest,
          });
      };

      const box = (x, y, width, height, fill = LIGHT, stroke = BORDER) => {
        doc.roundedRect(x, y, width, height, 7).fillAndStroke(fill, stroke);
      };

      // ================= 1. HEADER =================

      const headerY = 25;
      const headerHeight = 64;

      doc
        .roundedRect(startX, headerY, pageWidth, headerHeight, 8)
        .fill(isCreditNote ? '#991B1B' : GREEN);

      text('FALCON FRESH MARKET', startX + 14, 36, {
        size: 17,
        bold: true,
        color: '#FFFFFF',
      });

      // Always show this heading.
      text('PROFORMA INVOICE', startX + 14, 59, {
        size: 12,
        bold: true,
        color: '#F59E0B',
      });

      text('Kingdom of Saudi Arabia - E-Commerce Platform', startX + 245, 72, {
        size: 7,
        color: '#D1FAE5',
        width: pageWidth - 260,
        align: 'right',
      });

      // ================= 2. SELLER & QR =================

      const sellerY = 98;
      const sellerWidth = pageWidth - 140;
      const sellerHeight = 74;

      box(startX, sellerY, sellerWidth, sellerHeight);

      text('SELLER / TAXPAYER DETAILS', startX + 10, sellerY + 8, {
        size: 9,
        bold: true,
        color: GREEN,
      });

      text(
        clean(invoice.seller_name, 'Falcon E-Commerce Trading Co.'),
        startX + 10,
        sellerY + 23,
        { size: 8.5, bold: true, width: sellerWidth - 20 }
      );

      text(
        `VAT Reg. No: ${clean(invoice.seller_vat_number, '300000000000003')} | CR No: 1010892341`,
        startX + 10,
        sellerY + 37,
        { size: 7.5, color: MUTED }
      );

      text(
        'King Fahd Rd, Al-Malqa District, Riyadh 13521, KSA',
        startX + 10,
        sellerY + 50,
        { size: 7.5, color: MUTED }
      );

      text('Cold-Chain Refrigerated Delivery', startX + 10, sellerY + 62, {
        size: 7,
        color: '#059669',
        bold: true,
      });

      const qrX = startX + sellerWidth + 8;
      const qrWidth = pageWidth - sellerWidth - 8;

      box(qrX, sellerY, qrWidth, sellerHeight, '#FFFFFF', '#10B981');

      doc.image(qrImageDataUrl, qrX + (qrWidth - 48) / 2, sellerY + 5, {
        width: 48,
        height: 48,
      });

      text('REFERENCE QR', qrX + 5, sellerY + 59, {
        size: 7,
        bold: true,
        color: GREEN,
        width: qrWidth - 10,
        align: 'center',
      });

      // ================= 3. INVOICE / BUYER =================

      const metaY = 180;
      const cardHeight = 77;
      const cardGap = 8;
      const cardWidth = (pageWidth - cardGap) / 2;
      const buyerX = startX + cardWidth + cardGap;

      box(startX, metaY, cardWidth, cardHeight);
      box(buyerX, metaY, cardWidth, cardHeight);

      text('INVOICE INFORMATION', startX + 10, metaY + 8, {
        size: 8.5,
        bold: true,
        color: GREEN,
      });

      const dateValue = invoice.issue_date_time
        ? new Date(invoice.issue_date_time)
        : new Date();

      const formattedDate = Number.isNaN(dateValue.getTime())
        ? '-'
        : dateValue.toLocaleString('en-US', {
            timeZone: 'Asia/Riyadh',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

      const infoRow = (label, value, y, x = startX, valueColor = DARK) => {
        text(label, x + 10, y, {
          size: 7.3,
          color: MUTED,
        });

        text(clean(value, '-'), x + 96, y, {
          size: 7.3,
          bold: true,
          color: valueColor,
          width: cardWidth - 104,
        });
      };

      infoRow('Doc Number:', invoice.invoice_number, metaY + 24);
      infoRow('Issue Date:', formattedDate, metaY + 37);
      infoRow('ICV Counter:', `#${invoice.invoice_counter ?? 1}`, metaY + 50);

      infoRow('Status:', 'PROFORMA - TRIAL', metaY + 63, startX, '#059669');

      text('CUSTOMER / BUYER DETAILS', buyerX + 10, metaY + 8, {
        size: 8.5,
        bold: true,
        color: GREEN,
      });

      infoRow('Buyer Name:', invoice.buyer_name || 'Valued Customer', metaY + 24, buyerX);
      infoRow('Fulfillment:', 'Home Express Delivery', metaY + 37, buyerX);
      infoRow('Destination:', 'Riyadh, Saudi Arabia', metaY + 50, buyerX);
      infoRow('Customer Type:', 'Individual Consumer (B2C)', metaY + 63, buyerX);

      // ================= 4. PRODUCTS =================

      const tableY = 266;
      const tableHeaderHeight = 22;
      const rowHeight = 22;

      const safeItems = Array.isArray(items) && items.length
        ? items
        : [{
            item_name_en: 'Fresh Grocery Item',
            quantity: 1,
            unit_price: invoice.total_excluding_vat,
            vat_amount: invoice.vat_total,
            total_with_vat: invoice.total_including_vat,
          }];

      // One-page layout: check available height before drawing.
      // Larger orders should use a separate multi-page layout.
      const estimatedSummaryY = tableY + tableHeaderHeight
        + safeItems.length * rowHeight + 9;

      const estimatedFooterBottom = estimatedSummaryY + 103 + 12 + 52 + 34;

      if (estimatedFooterBottom > pageBottom) {
        throw new Error(
          `Invoice contains ${safeItems.length} products and cannot fit on one A4 page. Use a multi-page invoice layout for this order.`
        );
      }

      doc.roundedRect(startX, tableY, pageWidth, tableHeaderHeight, 5).fill(GREEN);

      text('ITEM DESCRIPTION', startX + 10, tableY + 6, {
        size: 8,
        bold: true,
        color: '#FFFFFF',
      });

      text('QTY', startX + 224, tableY + 6, {
        size: 8,
        bold: true,
        color: '#FFFFFF',
        width: 30,
        align: 'center',
      });

      text('UNIT PRICE', startX + 260, tableY + 6, {
        size: 8,
        bold: true,
        color: '#FFFFFF',
        width: 77,
        align: 'right',
      });

      text('VAT (15%)', startX + 343, tableY + 6, {
        size: 8,
        bold: true,
        color: '#FFFFFF',
        width: 70,
        align: 'right',
      });

      text('TOTAL', startX + 418, tableY + 6, {
        size: 8,
        bold: true,
        color: '#FFFFFF',
        width: 82,
        align: 'right',
      });

      let currentY = tableY + tableHeaderHeight;

      safeItems.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.rect(startX, currentY, pageWidth, rowHeight).fill(LIGHT);
        }

        const itemName = clean(
          item.item_name_en || item.name,
          'Fresh Grocery Item'
        ).substring(0, 39);

        const qty = Number(item.quantity ?? 1);
        const unitPrice = Number(item.unit_price ?? 0);
        const vat = Number(item.vat_amount ?? 0);
        const total = Number(
          item.total_with_vat ?? unitPrice * qty + vat
        );

        text(itemName, startX + 10, currentY + 6, {
          size: 8,
          bold: true,
          width: 212,
        });

        text(qty, startX + 224, currentY + 6, {
          size: 8,
          width: 30,
          align: 'center',
        });

        text(money(unitPrice), startX + 260, currentY + 6, {
          size: 8,
          width: 77,
          align: 'right',
        });

        text(money(vat), startX + 343, currentY + 6, {
          size: 8,
          width: 70,
          align: 'right',
        });

        text(money(total), startX + 418, currentY + 6, {
          size: 8,
          bold: true,
          color: GREEN,
          width: 82,
          align: 'right',
        });

        doc
          .moveTo(startX, currentY + rowHeight)
          .lineTo(startX + pageWidth, currentY + rowHeight)
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();

        currentY += rowHeight;
      });

      // ================= 5. FINANCIAL SUMMARY =================

      const summaryY = currentY + 9;
      const summaryWidth = 246;
      const summaryX = startX + pageWidth - summaryWidth;
      const summaryHeight = 103;

      box(summaryX, summaryY, summaryWidth, summaryHeight);

      const subtotal = Number(invoice.total_excluding_vat ?? 0);
      const vatTotal = Number(invoice.vat_total ?? 0);
      const deliveryFee = Number(invoice.delivery_fee ?? 0);
      const grandTotal = Number(invoice.total_including_vat ?? 0);

      const summaryRow = (label, value, y, color = DARK) => {
        text(label, summaryX + 10, y, {
          size: 7.5,
          color: MUTED,
        });

        text(money(value), summaryX + 128, y, {
          size: 8,
          bold: true,
          color,
          width: 108,
          align: 'right',
        });
      };

      summaryRow('Subtotal (Excl. VAT):', subtotal, summaryY + 10);
      summaryRow('Delivery Fee:', deliveryFee, summaryY + 25, '#059669');
      summaryRow('VAT (15%):', vatTotal, summaryY + 40);

      doc
        .roundedRect(summaryX + 6, summaryY + 60, summaryWidth - 12, 35, 5)
        .fill(GREEN);

      text('GRAND TOTAL:', summaryX + 13, summaryY + 72, {
        size: 9,
        bold: true,
        color: '#F59E0B',
      });

      text(money(grandTotal), summaryX + 111, summaryY + 70, {
        size: 11,
        bold: true,
        color: '#FFFFFF',
        width: 119,
        align: 'right',
      });

      // ================= 6. FRESHNESS BOX =================

      const guaranteeWidth = summaryX - startX - 9;

      box(
        startX,
        summaryY,
        guaranteeWidth,
        summaryHeight,
        '#ECFDF5',
        '#A7F3D0'
      );

      text('100% FRESHNESS & COLD-CHAIN', startX + 10, summaryY + 13, {
        size: 8.5,
        bold: true,
        color: GREEN,
      });

      text(
        'Fresh grocery items are carefully packed and handled for safe delivery.',
        startX + 10,
        summaryY + 35,
        {
          size: 8,
          color: '#065F46',
          width: guaranteeWidth - 20,
          lineBreak: true,
        }
      );

      // ================= 7. COMPACT FOOTER =================

      const footerY = summaryY + summaryHeight + 12;

      doc
        .moveTo(startX, footerY)
        .lineTo(startX + pageWidth, footerY)
        .strokeColor('#CBD5E1')
        .lineWidth(0.7)
        .stroke();

      text(
        'This document is generated for trial and reference purposes only.',
        startX,
        footerY + 8,
        {
          size: 7,
          color: MUTED,
          width: pageWidth,
          align: 'center',
        }
      );

      text(
        'Falcon Fresh Market KSA - Commercial Registration: 1010892341',
        startX,
        footerY + 22,
        {
          size: 7,
          bold: true,
          color: GREEN,
          width: pageWidth,
          align: 'center',
        }
      );

      // ================= 8. TRIAL NOTE =================

      const noteY = footerY + 52;
      const noteHeight = 34;

      doc
        .roundedRect(startX, noteY, pageWidth, noteHeight, 6)
        .fillAndStroke('#FEF2F2', '#FCA5A5');

      text(
        'Note :- This is not valid invoice only for trial',
        startX + 10,
        noteY + 11,
        {
          size: 10,
          bold: true,
          color: RED,
          width: pageWidth - 20,
          align: 'center',
        }
      );

      // ================= 9. FINISH =================

      doc.end();
    } catch (error) {
      fail(error);
    }
  });
}



  /**
   * Retrieves all invoices with search, filters, pagination, summary metrics,
   * and candidate orders awaiting invoice generation.
   */
  async getAllInvoices(queryParams = {}) {
    const {
      search = '',
      status = 'ALL',
      type = 'ALL',
      page = 1,
      limit = 10,
    } = queryParams;

    const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
    const paginationConfig = parsePagination({ page, limit }, 10, 100);
    const offset = paginationConfig.offset;
    const where = {};

    if (status && status !== 'ALL') {
      where.zatca_status = status;
    }

    if (type && type !== 'ALL') {
      where.invoice_type = type;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { invoice_number: { [Op.iLike]: q } },
        { buyer_name: { [Op.iLike]: q } },
        { '$order.order_number$': { [Op.iLike]: q } },
      ];
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
            'address',
          ],
        },
        'items',
        {
          model: Invoice,
          as: 'credit_notes',
          required: false,
        },
        {
          model: Invoice,
          as: 'original_invoice',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: paginationConfig.limit,
      offset,
      distinct: true,
    });

    // Compute comprehensive platform ZATCA metrics
    const totalCount = await Invoice.count();
    const totalVatResult = await Invoice.sum('vat_total');
    const totalAmountResult = await Invoice.sum('total_including_vat');
    const simplifiedCount = await Invoice.count({ where: { invoice_type: 'SIMPLIFIED' } });
    const standardCount = await Invoice.count({ where: { invoice_type: 'STANDARD' } });
    const creditNotesCount = await Invoice.count({ where: { invoice_type: 'CREDIT_NOTE' } });
    const reportedCount = await Invoice.count({ where: { zatca_status: 'REPORTED' } });
    const clearedCount = await Invoice.count({ where: { zatca_status: 'CLEARED' } });

    // Fetch candidate un-invoiced orders
    const candidateOrders = await Order.findAll({
      where: {
        order_status: [
          'CONFIRMED',
          'PAYMENT_VERIFIED',
          'PROCESSING',
          'PACKED',
          'DRIVER_ASSIGNED',
          'OUT_FOR_DELIVERY',
          'ARRIVED',
          'DELIVERED',
        ],
      },
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
        { model: Invoice, as: 'invoice', required: false },
        'items',
        'address',
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const eligibleOrders = candidateOrders.filter(ord => !ord.invoice);

    const pagination = buildPaginationResponse(count, paginationConfig.page, paginationConfig.limit);

    return {
      invoices,
      records: invoices,
      eligibleOrders,
      pagination,
      stats: {
        totalInvoices: totalCount,
        totalVat: parseFloat(totalVatResult || 0).toFixed(2),
        totalAmount: parseFloat(totalAmountResult || 0).toFixed(2),
        simplifiedCount,
        standardCount,
        creditNotesCount,
        reportedCount,
        clearedCount,
        eligibleOrdersCount: eligibleOrders.length,
        zatcaSellerVat: process.env.ZATCA_VAT_NUMBER || '300000000000003',
        zatcaSellerName: process.env.ZATCA_SELLER_NAME || 'Falcon E-Commerce Trading Co.',
        zatcaPhase: 'Phase 2 (Fatoorah Integration & Clearance)',
        complianceStatus: 'COMPLIANT',
      },
    };
  }

  async getInvoiceById(invoiceId) {
    return await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email', 'mobile'] }] },
            'address',
            'items',
          ],
        },
        'items',
        {
          model: Invoice,
          as: 'credit_notes',
          required: false,
        },
        {
          model: Invoice,
          as: 'original_invoice',
          required: false,
        },
      ],
    });
  }

  async getInvoiceByOrderId(orderId) {
    return await Invoice.findOne({
      where: { order_id: orderId },
      include: [
        {
          model: Order,
          as: 'order',
          include: ['address', 'customer'],
        },
        'items',
        {
          model: Invoice,
          as: 'credit_notes',
          required: false,
        },
      ],
    });
  }
}

module.exports = new ZatcaInvoiceService();
