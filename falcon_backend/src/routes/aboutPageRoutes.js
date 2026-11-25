const express = require('express');
const router = express.Router();
const aboutPageController = require('../controllers/aboutPageController');
const { authenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public route
router.get('/', (req, res, next) => aboutPageController.getPublicAboutPage(req, res, next));

// Admin CMS routes
router.get('/admin', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.view'), (req, res, next) => aboutPageController.getAdminAboutPage(req, res, next));
router.put('/admin', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.view'), (req, res, next) => aboutPageController.updateAdminAboutPage(req, res, next));

module.exports = router;
