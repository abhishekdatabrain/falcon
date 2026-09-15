const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    return sendSuccess(res, 'Notifications retrieved', { notifications });
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return sendSuccess(res, 'Notification marked as read', { notification });
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
});

module.exports = router;
