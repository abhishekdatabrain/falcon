const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate, authorize(ROLES.DRIVER));

router.get('/dashboard', (req, res, next) => driverController.getDashboard(req, res, next));
router.post('/deliveries/:deliveryId/accept', (req, res, next) => driverController.acceptDelivery(req, res, next));
router.post('/deliveries/:deliveryId/status', (req, res, next) => driverController.updateDeliveryStatus(req, res, next));
router.put('/availability', (req, res, next) => driverController.updateAvailability(req, res, next));
router.post('/gps-location', (req, res, next) => driverController.logGpsLocation(req, res, next));

module.exports = router;
