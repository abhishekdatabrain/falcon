const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public / shopper endpoints
router.get('/active', optionalAuthenticate, (req, res) => couponController.getActiveCoupons(req, res));
router.post('/validate', optionalAuthenticate, (req, res) => couponController.validateCoupon(req, res));

// Admin endpoints
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), (req, res) => couponController.getAllCouponsAdmin(req, res));
router.post('/', authenticate, authorize(ROLES.ADMIN), (req, res) => couponController.createCoupon(req, res));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => couponController.updateCoupon(req, res));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => couponController.deleteCoupon(req, res));

module.exports = router;
