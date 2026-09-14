const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate);

// Customer Routes
router.post('/', authorize(ROLES.CUSTOMER), (req, res, next) => orderController.createOrder(req, res, next));
router.get('/my-orders', authorize(ROLES.CUSTOMER), (req, res, next) => orderController.getMyOrders(req, res, next));

// Common Protected Route (Customer: own order, Driver: assigned order, Admin: any order)
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res, next));
router.post('/:id/cancel', (req, res, next) => orderController.cancelOrder(req, res, next));

// Admin Routes
router.get('/', authorize(ROLES.ADMIN), (req, res, next) => orderController.getAllOrdersAdmin(req, res, next));

module.exports = router;
