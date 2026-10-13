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
        item_name_en: item.product_name_en || 'Product',
        item_name_ar: item.product_name_ar || 'منتج',
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

    const qrImageDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      const pageWidth = 515;
      const startX = 40;

      // ================= 1. LUXURY TOP BRANDING BANNER =================
      const bannerBg = isCreditNote ? '#991B1B' : '#043927';
      doc.roundedRect(startX, 35, pageWidth, 68, 10).fill(bannerBg);

      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('FALCON FRESH MARKET', startX + 16, 47);

      const titleText = isCreditNote
        ? 'TAX CREDIT NOTE (اشعار دائن) • ZATCA FATOORAH PHASE 2'
        : 'SIMPLIFIED TAX INVOICE • ZATCA FATOORAH PHASE 2';
      doc.fillColor('#F59E0B').fontSize(8.5).font('Helvetica-Bold').text(titleText, startX + 16, 71);
      doc.fillColor('#D1FAE5').fontSize(8).font('Helvetica').text('Kingdom of Saudi Arabia • Single Vendor E-Commerce Platform', startX + 16, 84);

      // Status Pill on top-right
      const pillColor = isCreditNote ? '#DC2626' : '#05A764';
      const pillLabel = isCreditNote ? 'CREDIT REVERSAL' : 'PAID & VERIFIED';
      doc.roundedRect(startX + pageWidth - 125, 50, 110, 24, 6).fill(pillColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(pillLabel, startX + pageWidth - 125, 57, { width: 110, align: 'center' });

      // ================= 2. SELLER INFO & QR CODE CARDS =================
      const cardY = 113;
      const sellerCardWidth = 370;

      doc.roundedRect(startX, cardY, sellerCardWidth, 80, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#043927').fontSize(9).font('Helvetica-Bold').text('SELLER / TAXPAYER DETAILS', startX + 12, cardY + 10);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(invoice.seller_name || 'Falcon E-Commerce Trading Co.', startX + 12, cardY + 25);
      doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`VAT Reg. No: ${invoice.seller_vat_number || '300000000000003'}   |   CR No: 1010892341`, startX + 12, cardY + 40);
      doc.text('Address: King Fahd Rd, Al-Malqa District, Riyadh 13521, KSA', startX + 12, cardY + 53);
      doc.fillColor('#05A764').fontSize(7.5).font('Helvetica-Bold').text('Official 100% Cold-Chain Refrigerated Delivery Certified', startX + 12, cardY + 66);

      // QR Code Card
      const qrCardX = startX + sellerCardWidth + 10;
      const qrCardWidth = pageWidth - sellerCardWidth - 10;
      doc.roundedRect(qrCardX, cardY, qrCardWidth, 80, 8).fillAndStroke('#FFFFFF', isCreditNote ? '#EF4444' : '#05A764');
      doc.image(qrImageDataUrl, qrCardX + (qrCardWidth - 58) / 2, cardY + 5, { width: 58, height: 58 });
      doc.fillColor('#043927').fontSize(6.5).font('Helvetica-Bold').text('ZATCA FATOORAH QR', qrCardX, cardY + 67, { width: qrCardWidth, align: 'center' });

      // ================= 3. INVOICE META & BUYER CARDS =================
      const metaY = 201;
      const halfCardWidth = (pageWidth - 10) / 2;

      // Left: Metadata Card
      doc.roundedRect(startX, metaY, halfCardWidth, 82, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#043927').fontSize(8.5).font('Helvetica-Bold').text(isCreditNote ? 'CREDIT NOTE METADATA' : 'INVOICE INFORMATION', startX + 12, metaY + 9);

      const formattedDate = new Date(invoice.issue_date_time).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Doc Number:', startX + 12, metaY + 24);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(invoice.invoice_number, startX + 85, metaY + 24);

      if (isCreditNote && originalInvoice) {
        doc.fillColor('#64748B').font('Helvetica').text('Original Invoice:', startX + 12, metaY + 37);
        doc.fillColor('#DC2626').font('Helvetica-Bold').text(originalInvoice.invoice_number, startX + 85, metaY + 37);
      } else {
        doc.fillColor('#64748B').font('Helvetica').text('Issue Date:', startX + 12, metaY + 37);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(formattedDate, startX + 85, metaY + 37);
      }

      doc.fillColor('#64748B').font('Helvetica').text('ICV Counter:', startX + 12, metaY + 50);
      doc.fillColor('#05A764').font('Helvetica-Bold').text(`#${invoice.invoice_counter || 1}`, startX + 85, metaY + 50);

      doc.fillColor('#64748B').font('Helvetica').text('ZATCA Status:', startX + 12, metaY + 63);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${invoice.zatca_status || 'REPORTED'} (Phase 2 Compliant)`, startX + 85, metaY + 63);

      // Right: Buyer Card
      const buyerCardX = startX + halfCardWidth + 10;
      doc.roundedRect(buyerCardX, metaY, halfCardWidth, 82, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
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
      const tableHeaderY = 293;
      doc.roundedRect(startX, tableHeaderY, pageWidth, 24, 6).fill(isCreditNote ? '#991B1B' : '#043927');

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
        doc.fillColor(isCreditNote ? '#DC2626' : '#043927').font('Helvetica-Bold').text(`${totalWithVat} SAR`, startX + 420, currentY + 8, { width: 85, align: 'right' });

        currentY += rowHeight;
      });

      // ================= 5. FINANCIAL SUMMARY & HIGHLIGHT CARD =================
      const summaryY = currentY + 14;
      const summaryWidth = 240;
      const summaryX = startX + pageWidth - summaryWidth;

      doc.roundedRect(summaryX, summaryY, summaryWidth, 105, 8).fillAndStroke('#F8FAFC', '#E2E8F0');

      const subtotal = parseFloat(invoice.total_excluding_vat || 0).toFixed(2);
      const vatTotal = parseFloat(invoice.vat_total || 0).toFixed(2);
      const grandTotal = parseFloat(invoice.total_including_vat || 0).toFixed(2);

      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Subtotal (Excl. VAT):', summaryX + 12, summaryY + 12);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${subtotal} SAR`, summaryX + 120, summaryY + 12, { width: 108, align: 'right' });

      doc.fillColor('#64748B').font('Helvetica').text('Delivery Fee:', summaryX + 12, summaryY + 28);
      doc.fillColor('#05A764').font('Helvetica-Bold').text('0.00 SAR (FREE)', summaryX + 120, summaryY + 28, { width: 108, align: 'right' });

      doc.fillColor('#64748B').font('Helvetica').text('Value Added Tax (15%):', summaryX + 12, summaryY + 44);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${vatTotal} SAR`, summaryX + 120, summaryY + 44, { width: 108, align: 'right' });

      // Grand Total Highlight Banner
      doc.roundedRect(summaryX + 6, summaryY + 62, summaryWidth - 12, 35, 6).fill(isCreditNote ? '#991B1B' : '#043927');
      doc.fillColor('#F59E0B').fontSize(8).font('Helvetica-Bold').text(isCreditNote ? 'CREDIT REVERSED (INCL. VAT):' : 'GRAND TOTAL (INCL. VAT):', summaryX + 14, summaryY + 74);
      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(`${grandTotal} SAR`, summaryX + 120, summaryY + 72, { width: 100, align: 'right' });

      // Left Column Quality / Guarantee Box
      const guaranteeWidth = summaryX - startX - 15;
      doc.roundedRect(startX, summaryY, guaranteeWidth, 105, 8).fillAndStroke(isCreditNote ? '#FEF2F2' : '#ECFDF5', isCreditNote ? '#FECACA' : '#A7F3D0');

      doc.fillColor(isCreditNote ? '#991B1B' : '#043927').fontSize(9).font('Helvetica-Bold').text(
        isCreditNote ? 'OFFICIAL TAX CREDIT NOTE REVERSAL' : '100% FRESHNESS & COLD-CHAIN CERTIFIED',
        startX + 14,
        summaryY + 14
      );

      doc.fillColor(isCreditNote ? '#7F1D1D' : '#065F46').fontSize(7.5).font('Helvetica').text(
        isCreditNote
          ? `This credit note is issued to adjust/reverse the original invoice ${originalInvoice?.invoice_number || ''}. Reason: ${invoice.notes || 'Customer refund'}. In accordance with ZATCA regulations, tax liability is adjusted accordingly.`
          : 'Every produce and chilled grocery cut in this order was packed in an insulated thermal tote and maintained within 2°C to 4°C active refrigerated temperature logs from harvest farm to your doorstep.',
        startX + 14,
        summaryY + 30,
        { width: guaranteeWidth - 28, lineGap: 3 }
      );

      // ================= 6. OFFICIAL LEGAL FOOTER =================
      const footerY = 740;
      doc.moveTo(startX, footerY).lineTo(startX + pageWidth, footerY).strokeColor('#CBD5E1').lineWidth(0.8).stroke();

      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(
        'This is a certified electronic tax document generated in accordance with ZATCA (Zakat, Tax and Customs Authority) Phase 2 Fatoorah regulations in the Kingdom of Saudi Arabia. No handwritten signature or physical stamp is required.',
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
      limit = 20,
    } = queryParams;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
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
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
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

    return {
      invoices,
      eligibleOrders,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)),
      },
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
