const express = require('express');
const router = express.Router();
const deliverySlotController = require('../controllers/deliverySlotController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public storefront checkout endpoint
router.get('/', optionalAuthenticate, (req, res) => deliverySlotController.getPublicDeliverySchedule(req, res));

// Admin management endpoints
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), (req, res) => deliverySlotController.getAllSlotsAdmin(req, res));
router.post('/admin/settings', authenticate, authorize(ROLES.ADMIN), (req, res) => deliverySlotController.updateSettings(req, res));
router.post('/', authenticate, authorize(ROLES.ADMIN), (req, res) => deliverySlotController.createSlot(req, res));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => deliverySlotController.updateSlot(req, res));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => deliverySlotController.deleteSlot(req, res));

module.exports = router;
