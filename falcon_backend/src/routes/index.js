const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const driverRoutes = require('./driverRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const adminRoutes = require('./adminRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const notificationRoutes = require('./notificationRoutes');
const wishlistRoutes = require('./wishlistRoutes');

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/drivers', driverRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/admin', adminRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationRoutes);
router.use('/wishlist', wishlistRoutes);

module.exports = router;
