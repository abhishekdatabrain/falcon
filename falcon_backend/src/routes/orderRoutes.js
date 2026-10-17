const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public Order Confirmation Route (by UUID)
router.get('/confirmation/:id', (req, res, next) => orderController.getOrderConfirmation(req, res, next));

// Public Order Tracking Route (by UUID or Order Number like ORD-20261014-XXXX)
router.get('/track/:identifier', (req, res, next) => orderController.trackOrder(req, res, next));

router.use(authenticate);

// Customer Routes
router.post('/', authorize(ROLES.CUSTOMER), (req, res, next) => orderController.createOrder(req, res, next));
router.get('/my-orders', authorize(ROLES.CUSTOMER), (req, res, next) => orderController.getMyOrders(req, res, next));

// Common Protected Route (Customer: own order, Driver: assigned order, Admin: any order)
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res, next));
router.post('/:id/cancel', (req, res, next) => orderController.cancelOrder(req, res, next));

// Admin Routes
router.get('/', authorize(ROLES.ADMIN), checkPermission('orders.view'), (req, res, next) => orderController.getAllOrdersAdmin(req, res, next));

module.exports = router;
