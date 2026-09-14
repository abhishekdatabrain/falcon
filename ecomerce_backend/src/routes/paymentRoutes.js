const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const ROLES = require('../constants/roles');

router.use(authenticate);

// Customer route to submit payment slip
router.post(
  '/submit',
  authorize(ROLES.CUSTOMER),
  upload.single('proofFile'),
  (req, res, next) => paymentController.submitPayment(req, res, next)
);

// Admin routes to review and verify/reject
router.get(
  '/pending',
  authorize(ROLES.ADMIN),
  (req, res, next) => paymentController.getPendingPaymentsAdmin(req, res, next)
);

router.post(
  '/:paymentId/verify',
  authorize(ROLES.ADMIN),
  (req, res, next) => paymentController.verifyPaymentAdmin(req, res, next)
);

router.post(
  '/:paymentId/reject',
  authorize(ROLES.ADMIN),
  (req, res, next) => paymentController.rejectPaymentAdmin(req, res, next)
);

module.exports = router;
