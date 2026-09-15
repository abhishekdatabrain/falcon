const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

router.use(authenticate);

router.post('/', authorize(ROLES.CUSTOMER), (req, res, next) => feedbackController.submitFeedback(req, res, next));
router.get('/', authorize(ROLES.ADMIN), (req, res, next) => feedbackController.getAllFeedbackAdmin(req, res, next));

module.exports = router;
