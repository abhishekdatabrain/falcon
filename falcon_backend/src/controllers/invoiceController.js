const zatcaInvoiceService = require('../services/zatcaInvoiceService');
const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');
const path = require('path');
const fs = require('fs');

class InvoiceController {
  async getInvoiceByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;
      // Authorize order access
      if (req.user) {
        await orderService.getOrderById(orderId, req.user.id, req.user.role);
      } else {
        await orderService.getOrderConfirmation(orderId);
      }

      let invoice = await zatcaInvoiceService.getInvoiceByOrderId(orderId);
      if (!invoice) {
        invoice = await zatcaInvoiceService.generateInvoiceForOrder(orderId).catch(() => null);
      }
      if (!invoice) {
        return sendError(res, 'Invoice not found for this order', [], 404);
      }
      return sendSuccess(res, 'Invoice retrieved', { invoice });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async downloadInvoicePdf(req, res, next) {
    try {
      const { orderId } = req.params;
      if (req.user) {
        await orderService.getOrderById(orderId, req.user.id, req.user.role);
      } else {
        await orderService.getOrderConfirmation(orderId);
      }

      let invoice = await zatcaInvoiceService.getInvoiceByOrderId(orderId);
      if (!invoice) {
        invoice = await zatcaInvoiceService.generateInvoiceForOrder(orderId);
      } else {
        // Always generate/refresh with latest luxury vector template
        const pdfUrl = await zatcaInvoiceService.generatePdfInvoiceFile(
          invoice,
          invoice.items || [],
          invoice.qr_code_payload
        );
        if (invoice.pdf_file_url !== pdfUrl) {
          await invoice.update({ pdf_file_url: pdfUrl });
        }
      }

      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const absolutePath = invoice?.pdf_file_url
        ? path.join(__dirname, '..', '..', invoice.pdf_file_url.replace('/uploads/', `${uploadDir}/`))
        : null;

      if (!absolutePath || !fs.existsSync(absolutePath)) {
        return sendError(res, 'Invoice PDF file could not be generated', [], 500);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
      return res.sendFile(absolutePath);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new InvoiceController();
