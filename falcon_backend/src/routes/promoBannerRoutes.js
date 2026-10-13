const express = require('express');
const router = express.Router();
const promoBannerController = require('../controllers/promoBannerController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');
const upload = require('../middleware/upload');

// Public route to get active promo banners
router.get('/', optionalAuthenticate, (req, res) => promoBannerController.getActiveBanners(req, res));

// Admin routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), (req, res) => promoBannerController.getAllBanners(req, res));
router.post('/', authenticate, authorize(ROLES.ADMIN), upload.single('image'), (req, res) => promoBannerController.createBanner(req, res));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), upload.single('image'), (req, res) => promoBannerController.updateBanner(req, res));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => promoBannerController.deleteBanner(req, res));

module.exports = router;
