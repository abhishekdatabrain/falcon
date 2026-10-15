const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const rbacController = require('../controllers/rbacController');
const { authenticate } = require('../middleware/auth');
const { authorize, checkPermission } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate, authorize(ROLES.ADMIN));

// Dashboard Analytics
router.get('/dashboard', checkPermission('dashboard.view'), (req, res, next) => adminController.getDashboard(req, res, next));

// Driver Management Routes
router.post('/drivers', checkPermission('drivers.create'), (req, res, next) => adminController.createDriver(req, res, next));
router.get('/drivers', checkPermission('drivers.view'), (req, res, next) => adminController.getDrivers(req, res, next));
router.get('/drivers/:driverId', checkPermission('drivers.view'), (req, res, next) => adminController.getDriverById(req, res, next));
router.put('/drivers/:driverId', checkPermission('drivers.edit'), (req, res, next) => adminController.updateDriver(req, res, next));
router.put('/drivers/:driverId/status', checkPermission('drivers.edit'), (req, res, next) => adminController.updateDriverStatus(req, res, next));
router.put('/drivers/:driverId/account-status', checkPermission('drivers.delete'), (req, res, next) => adminController.toggleDriverAccountStatus(req, res, next));
router.get('/drivers/:driverId/location', checkPermission('drivers.view'), (req, res, next) => adminController.getDriverLocation(req, res, next));

// Order & Delivery Management Routes
router.get('/orders', checkPermission('orders.view'), (req, res, next) => adminController.getAllOrders(req, res, next));
router.get('/orders/:orderId', checkPermission('orders.view'), (req, res, next) => adminController.getOrderById(req, res, next));
router.put('/orders/:orderId/status', checkPermission('orders.edit'), (req, res, next) => adminController.updateOrderStatus(req, res, next));
router.post('/orders/:orderId/assign-driver', checkPermission('orders.assign'), (req, res, next) => adminController.assignDriverToOrder(req, res, next));
router.post('/orders/:orderId/verify-payment', checkPermission('payments.approve'), (req, res, next) => adminController.verifyOrderPayment(req, res, next));
router.post('/orders/:orderId/refund-payment', checkPermission('refunds.refund'), (req, res, next) => adminController.refundOrderPayment(req, res, next));
router.get('/deliveries', checkPermission('delivery.view'), (req, res, next) => adminController.getDeliveries(req, res, next));

// Invoice & ZATCA Management Routes
router.get('/invoices', checkPermission('invoices.view'), (req, res, next) => adminController.getInvoices(req, res, next));
router.get('/invoices/:invoiceId', checkPermission('invoices.view'), (req, res, next) => adminController.getInvoiceById(req, res, next));
router.post('/invoices/generate/:orderId', checkPermission('invoices.create'), (req, res, next) => adminController.generateInvoiceForOrder(req, res, next));
router.post('/invoices/:invoiceId/credit-note', checkPermission('invoices.create'), (req, res, next) => adminController.createCreditNote(req, res, next));
router.get('/invoices/:invoiceId/download-pdf', checkPermission('invoices.export'), (req, res, next) => adminController.downloadInvoicePdf(req, res, next));
router.get('/invoices/:invoiceId/download-xml', checkPermission('invoices.export'), (req, res, next) => adminController.downloadInvoiceXml(req, res, next));
router.post('/invoices/:invoiceId/report-zatca', checkPermission('zatca.create'), (req, res, next) => adminController.reportInvoiceToZatca(req, res, next));

// Customer Management Routes
router.post('/customers', checkPermission('customers.create'), (req, res, next) => adminController.createCustomer(req, res, next));
router.get('/customers', checkPermission('customers.view'), (req, res, next) => adminController.getCustomers(req, res, next));
router.get('/customers/:customerId', checkPermission('customers.view'), (req, res, next) => adminController.getCustomerById(req, res, next));
router.put('/customers/:customerId', checkPermission('customers.edit'), (req, res, next) => adminController.updateCustomer(req, res, next));
router.put('/customers/:customerId/status', checkPermission('customers.edit'), (req, res, next) => adminController.toggleCustomerStatus(req, res, next));
router.post('/customers/:customerId/addresses', checkPermission('customers.edit'), (req, res, next) => adminController.addCustomerAddress(req, res, next));
router.delete('/customers/addresses/:addressId', checkPermission('customers.delete'), (req, res, next) => adminController.deleteCustomerAddress(req, res, next));

// Notification Management Routes
router.get('/notifications', (req, res, next) => adminController.getNotifications(req, res, next));
router.post('/notifications', (req, res, next) => adminController.sendNotification(req, res, next));
router.put('/notifications/:notificationId/read', (req, res, next) => adminController.markNotificationRead(req, res, next));
router.delete('/notifications/:notificationId', (req, res, next) => adminController.deleteNotification(req, res, next));

// Current Admin Identity & Permissions
router.get('/rbac/me', (req, res, next) => rbacController.getMePermissions(req, res, next));

// Permissions Catalog
router.get('/rbac/permissions', checkPermission('admin_management.view'), (req, res, next) => rbacController.getPermissions(req, res, next));

// Custom Roles Management
router.get('/rbac/roles', checkPermission('admin_management.view'), (req, res, next) => rbacController.getRoles(req, res, next));
router.get('/rbac/roles/:roleId', checkPermission('admin_management.view'), (req, res, next) => rbacController.getRoleById(req, res, next));
router.post('/rbac/roles', checkPermission('admin_management.create'), (req, res, next) => rbacController.createRole(req, res, next));
router.put('/rbac/roles/:roleId', checkPermission('admin_management.edit'), (req, res, next) => rbacController.updateRole(req, res, next));
router.delete('/rbac/roles/:roleId', checkPermission('admin_management.delete'), (req, res, next) => rbacController.deleteRole(req, res, next));

// Sub-Admin Accounts Management
router.get('/rbac/sub-admins', checkPermission('admin_management.view'), (req, res, next) => rbacController.getSubAdmins(req, res, next));
router.get('/rbac/sub-admins/:subAdminId', checkPermission('admin_management.view'), (req, res, next) => rbacController.getSubAdminById(req, res, next));
router.post('/rbac/sub-admins', checkPermission('admin_management.create'), (req, res, next) => rbacController.createSubAdmin(req, res, next));
router.put('/rbac/sub-admins/:subAdminId', checkPermission('admin_management.edit'), (req, res, next) => rbacController.updateSubAdmin(req, res, next));
router.put('/rbac/sub-admins/:subAdminId/status', checkPermission('admin_management.edit'), (req, res, next) => rbacController.toggleSubAdminStatus(req, res, next));
router.delete('/rbac/sub-admins/:subAdminId', checkPermission('admin_management.delete'), (req, res, next) => rbacController.deleteSubAdmin(req, res, next));

// System Audit Logs
router.get('/rbac/audit-logs', checkPermission('admin_management.view'), (req, res, next) => rbacController.getAuditLogs(req, res, next));

// Legacy RBAC Users Routes (Preserved for compatibility)
router.get('/rbac/users', (req, res, next) => adminController.getRbacUsers(req, res, next));
router.post('/rbac/users', (req, res, next) => adminController.createRbacUser(req, res, next));
router.put('/rbac/users/:userId/role', (req, res, next) => adminController.updateUserRole(req, res, next));
router.put('/rbac/users/:userId/status', (req, res, next) => adminController.toggleUserStatus(req, res, next));

module.exports = router;
