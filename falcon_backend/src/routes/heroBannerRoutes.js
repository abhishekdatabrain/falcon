const express = require('express');
const router = express.Router();
const heroBannerController = require('../controllers/heroBannerController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');
const upload = require('../middleware/upload');

// Public route to get active banners
router.get('/', optionalAuthenticate, (req, res) => heroBannerController.getActiveBanners(req, res));

// Admin routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), (req, res) => heroBannerController.getAllBanners(req, res));
router.post('/', authenticate, authorize(ROLES.ADMIN), upload.single('image'), (req, res) => heroBannerController.createBanner(req, res));
router.put('/:id', authenticate, authorize(ROLES.ADMIN), upload.single('image'), (req, res) => heroBannerController.updateBanner(req, res));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => heroBannerController.deleteBanner(req, res));

module.exports = router;
