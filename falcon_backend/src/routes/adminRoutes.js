const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));

// Driver Management Routes
router.post('/drivers', (req, res, next) => adminController.createDriver(req, res, next));
router.get('/drivers', (req, res, next) => adminController.getDrivers(req, res, next));
router.get('/drivers/:driverId', (req, res, next) => adminController.getDriverById(req, res, next));
router.put('/drivers/:driverId', (req, res, next) => adminController.updateDriver(req, res, next));
router.put('/drivers/:driverId/status', (req, res, next) => adminController.updateDriverStatus(req, res, next));
router.put('/drivers/:driverId/account-status', (req, res, next) => adminController.toggleDriverAccountStatus(req, res, next));
router.get('/drivers/:driverId/location', (req, res, next) => adminController.getDriverLocation(req, res, next));
// Order Management Routes
router.get('/orders', (req, res, next) => adminController.getAllOrders(req, res, next));
router.put('/orders/:orderId/status', (req, res, next) => adminController.updateOrderStatus(req, res, next));
router.post('/orders/:orderId/assign-driver', (req, res, next) => adminController.assignDriverToOrder(req, res, next));

// Customer Management Routes
router.post('/customers', (req, res, next) => adminController.createCustomer(req, res, next));
router.get('/customers', (req, res, next) => adminController.getCustomers(req, res, next));
router.get('/customers/:customerId', (req, res, next) => adminController.getCustomerById(req, res, next));
router.put('/customers/:customerId', (req, res, next) => adminController.updateCustomer(req, res, next));
router.put('/customers/:customerId/status', (req, res, next) => adminController.toggleCustomerStatus(req, res, next));
router.post('/customers/:customerId/addresses', (req, res, next) => adminController.addCustomerAddress(req, res, next));
router.delete('/customers/addresses/:addressId', (req, res, next) => adminController.deleteCustomerAddress(req, res, next));

// Notification Management Routes
router.get('/notifications', (req, res, next) => adminController.getNotifications(req, res, next));
router.post('/notifications', (req, res, next) => adminController.sendNotification(req, res, next));
router.put('/notifications/:notificationId/read', (req, res, next) => adminController.markNotificationRead(req, res, next));
router.delete('/notifications/:notificationId', (req, res, next) => adminController.deleteNotification(req, res, next));

module.exports = router;
