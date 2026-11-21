const express = require('express');
const router = express.Router();
const tipSettingController = require('../controllers/tipSettingController');

router.get('/', (req, res) => tipSettingController.getPublicTipSettings(req, res));

module.exports = router;
