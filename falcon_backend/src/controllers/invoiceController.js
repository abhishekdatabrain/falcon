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
      await orderService.getOrderById(orderId, req.user.id, req.user.role);

      const invoice = await zatcaInvoiceService.getInvoiceByOrderId(orderId);
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
      await orderService.getOrderById(orderId, req.user.id, req.user.role);

      const invoice = await zatcaInvoiceService.getInvoiceByOrderId(orderId);
      if (!invoice || !invoice.pdf_file_url) {
        return sendError(res, 'Invoice PDF not available', [], 404);
      }

      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const absolutePath = path.join(__dirname, '..', '..', invoice.pdf_file_url.replace('/uploads/', `${uploadDir}/`));

      if (!fs.existsSync(absolutePath)) {
        return sendError(res, 'Invoice PDF file missing on server', [], 404);
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
