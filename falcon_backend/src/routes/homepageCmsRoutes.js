const express = require('express');
const router = express.Router();
const homepageCmsController = require('../controllers/homepageCmsController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public route to fetch published homepage configuration
router.get('/public', optionalAuthenticate, (req, res) =>
  homepageCmsController.getPublicHomepageConfig(req, res)
);

// Preview route for Admin previewing draft changes
router.get('/preview', optionalAuthenticate, (req, res) =>
  homepageCmsController.getPreviewHomepageConfig(req, res)
);

// Admin CMS Routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.view'), (req, res) =>
  homepageCmsController.getAllSectionsAdmin(req, res)
);
router.post('/admin/section', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.create'), (req, res) =>
  homepageCmsController.createSection(req, res)
);
router.put('/admin/section/:id', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.edit'), (req, res) =>
  homepageCmsController.updateSection(req, res)
);
router.delete('/admin/section/:id', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.delete'), (req, res) =>
  homepageCmsController.deleteSection(req, res)
);
router.post('/admin/reorder', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.edit'), (req, res) =>
  homepageCmsController.reorderSections(req, res)
);
router.patch('/admin/section/:id/toggle', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.edit'), (req, res) =>
  homepageCmsController.toggleSectionDraft(req, res)
);
router.post('/admin/publish', authenticate, authorize(ROLES.ADMIN), checkPermission('cms.edit'), (req, res) =>
  homepageCmsController.publishAllChanges(req, res)
);
router.post('/admin/discard-draft', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  homepageCmsController.discardDraftChanges(req, res)
);
router.get('/admin/settings', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  homepageCmsController.getSettings(req, res)
);
router.put('/admin/settings', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  homepageCmsController.updateSettings(req, res)
);

module.exports = router;
