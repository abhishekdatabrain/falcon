const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.get('/:slug', (req, res, next) => categoryController.getCategoryBySlug(req, res, next));

// Admin Category Routes
router.post('/', authenticate, authorize(ROLES.ADMIN), (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res, next) => categoryController.deleteCategory(req, res, next));

module.exports = router;
