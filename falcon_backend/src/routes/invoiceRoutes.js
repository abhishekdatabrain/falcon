const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { optionalAuthenticate } = require('../middleware/auth');

router.use(optionalAuthenticate);

router.get('/order/:orderId', (req, res, next) => invoiceController.getInvoiceByOrderId(req, res, next));
router.get('/order/:orderId/pdf', (req, res, next) => invoiceController.downloadInvoicePdf(req, res, next));

module.exports = router;
