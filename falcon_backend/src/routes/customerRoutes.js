const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/profile', (req, res, next) => customerController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => customerController.updateProfile(req, res, next));

router.get('/addresses', (req, res, next) => customerController.getAddresses(req, res, next));
router.post('/addresses', (req, res, next) => customerController.addAddress(req, res, next));
router.put('/addresses/:addressId', (req, res, next) => customerController.updateAddress(req, res, next));
router.delete('/addresses/:addressId', (req, res, next) => customerController.deleteAddress(req, res, next));

module.exports = router;
