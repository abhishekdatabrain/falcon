const express = require('express');
const router = express.Router();
const deliverySlotController = require('../controllers/deliverySlotController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public storefront checkout endpoint
router.get('/', optionalAuthenticate, (req, res) => deliverySlotController.getPublicDeliverySchedule(req, res));

// Admin management endpoints
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), checkPermission('delivery.view'), (req, res) => deliverySlotController.getAllSlotsAdmin(req, res));
router.post('/admin/settings', authenticate, authorize(ROLES.ADMIN), checkPermission('delivery.edit'), (req, res) => deliverySlotController.updateSettings(req, res));
router.post('/', authenticate, authorize(ROLES.ADMIN), checkPermission('delivery.create'), (req, res) => deliverySlotController.createSlot(req, res));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), checkPermission('delivery.edit'), (req, res) => deliverySlotController.updateSlot(req, res));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), checkPermission('delivery.delete'), (req, res) => deliverySlotController.deleteSlot(req, res));

module.exports = router;
