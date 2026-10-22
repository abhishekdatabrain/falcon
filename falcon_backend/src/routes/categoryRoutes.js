const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.get('/', optionalAuthenticate, (req, res, next) => categoryController.getCategories(req, res, next));
router.get('/:slug', (req, res, next) => categoryController.getCategoryBySlug(req, res, next));

// Admin Category Routes
router.post('/', authenticate, authorize(ROLES.ADMIN), checkPermission('categories.create'), (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), (req, res, next) => {
  const perms = req.user.permissions || [];
  if (req.user.isSuperAdmin || perms.includes('*') || perms.includes('categories.edit') || perms.includes('banners.edit') || perms.includes('banners.view')) {
    return categoryController.updateCategory(req, res, next);
  }
  return checkPermission('categories.edit')(req, res, next);
});
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), checkPermission('categories.delete'), (req, res, next) => categoryController.deleteCategory(req, res, next));

module.exports = router;
