const express = require('express');
const router = express.Router();
const categorySectionController = require('../controllers/categorySectionController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');
const upload = require('../middleware/upload');

// Public routes
router.get('/active', optionalAuthenticate, (req, res) =>
  categorySectionController.getActiveSections(req, res)
);

// Admin routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.getAllSectionsAdmin(req, res)
);
router.get('/admin/:id', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.getSectionById(req, res)
);
router.post('/', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.createSection(req, res)
);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.updateSection(req, res)
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.deleteSection(req, res)
);
router.patch('/:id/toggle', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.toggleSectionStatus(req, res)
);
router.post('/reorder', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.reorderSections(req, res)
);

// Admin Category Item Routes
router.post('/:sectionId/items', authenticate, authorize(ROLES.ADMIN), upload.single('image'), (req, res) =>
  categorySectionController.addItemToSection(req, res)
);
router.put('/items/:itemId', authenticate, authorize(ROLES.ADMIN), upload.single('image'), (req, res) =>
  categorySectionController.updateItem(req, res)
);
router.delete('/items/:itemId', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.deleteItem(req, res)
);
router.patch('/items/:itemId/toggle', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categorySectionController.toggleItemStatus(req, res)
);

module.exports = router;
