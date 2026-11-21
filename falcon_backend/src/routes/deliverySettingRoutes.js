const express = require('express');
const router = express.Router();
const deliverySettingController = require('../controllers/deliverySettingController');

// Public storefront checkout endpoint
router.get('/', (req, res) => deliverySettingController.getPublicDeliverySettings(req, res));

module.exports = router;
