const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/', (req, res, next) => cartController.getCart(req, res, next));
router.post('/items', (req, res, next) => cartController.addItem(req, res, next));
router.put('/items/:itemId', (req, res, next) => cartController.updateItem(req, res, next));
router.delete('/items/:itemId', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/', (req, res, next) => cartController.clearCart(req, res, next));

module.exports = router;
