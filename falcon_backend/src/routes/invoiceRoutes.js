const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/order/:orderId', (req, res, next) => invoiceController.getInvoiceByOrderId(req, res, next));
router.get('/order/:orderId/pdf', (req, res, next) => invoiceController.downloadInvoicePdf(req, res, next));

module.exports = router;
