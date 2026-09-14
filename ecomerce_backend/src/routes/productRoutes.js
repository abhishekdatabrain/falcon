const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));

// Admin Product Management Routes
router.post('/', authenticate, authorize(ROLES.ADMIN), (req, res, next) => productController.createProduct(req, res, next));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res, next) => productController.deleteProduct(req, res, next));

module.exports = router;
