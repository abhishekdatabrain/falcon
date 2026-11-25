const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const { contactLimiter } = require('../middleware/rateLimiter');
const ROLES = require('../constants/roles');

// ==================== PUBLIC ROUTES ====================
router.get('/settings', (req, res, next) => contactController.getPublicContactData(req, res, next));
router.get('/categories', (req, res, next) => contactController.getActiveCategories(req, res, next));
router.get('/locations', (req, res, next) => contactController.getActiveLocations(req, res, next));
router.post('/tickets', optionalAuthenticate, contactLimiter, (req, res, next) => contactController.submitTicket(req, res, next));

// ==================== ADMIN ROUTES ====================
router.use('/admin', authenticate, authorize(ROLES.ADMIN));

// Settings
router.get('/admin/settings', checkPermission('feedback.view'), (req, res, next) => contactController.getAdminSettings(req, res, next));
router.put('/admin/settings', checkPermission('feedback.view'), (req, res, next) => contactController.updateAdminSettings(req, res, next));

// Inquiry Categories
router.get('/admin/categories', checkPermission('feedback.view'), (req, res, next) => contactController.getAllCategories(req, res, next));
router.post('/admin/categories', checkPermission('feedback.view'), (req, res, next) => contactController.createCategory(req, res, next));
router.put('/admin/categories/:id', checkPermission('feedback.view'), (req, res, next) => contactController.updateCategory(req, res, next));
router.delete('/admin/categories/:id', checkPermission('feedback.view'), (req, res, next) => contactController.deleteCategory(req, res, next));

// Office & Dispatch Locations
router.get('/admin/locations', checkPermission('feedback.view'), (req, res, next) => contactController.getAllLocations(req, res, next));
router.post('/admin/locations', checkPermission('feedback.view'), (req, res, next) => contactController.createLocation(req, res, next));
router.put('/admin/locations/:id', checkPermission('feedback.view'), (req, res, next) => contactController.updateLocation(req, res, next));
router.delete('/admin/locations/:id', checkPermission('feedback.view'), (req, res, next) => contactController.deleteLocation(req, res, next));

// Support Tickets
router.get('/admin/tickets', checkPermission('feedback.view'), (req, res, next) => contactController.getAdminTickets(req, res, next));
router.get('/admin/tickets/:id', checkPermission('feedback.view'), (req, res, next) => contactController.getAdminTicketById(req, res, next));
router.put('/admin/tickets/:id', checkPermission('feedback.view'), (req, res, next) => contactController.updateAdminTicket(req, res, next));

module.exports = router;
