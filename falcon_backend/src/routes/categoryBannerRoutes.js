const express = require('express');
const router = express.Router();
const categoryBannerController = require('../controllers/categoryBannerController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Public route: GET /api/v1/category-banner
router.get('/', optionalAuthenticate, (req, res) =>
  categoryBannerController.getBanner(req, res)
);

// Admin route: PUT /api/v1/category-banner
router.put('/', authenticate, authorize(ROLES.ADMIN), (req, res) =>
  categoryBannerController.updateBanner(req, res)
);

module.exports = router;
