const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const pushNotificationService = require('../services/pushNotificationService');
const { authenticate } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

router.use(authenticate);

// Mobile Device Push Token Registration & Management
router.post('/device-token', async (req, res, next) => {
  try {
    const { token, platform, deviceName } = req.body;
    if (!token) {
      return sendError(res, 'Device push token is required', [], 400);
    }
    const deviceRecord = await pushNotificationService.registerDeviceToken(req.user.id, {
      token,
      platform,
      deviceName,
    });
    return sendSuccess(res, 'Device push token registered successfully', { deviceToken: deviceRecord }, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
});

router.delete('/device-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return sendError(res, 'Device push token is required', [], 400);
    }
    const removed = await pushNotificationService.removeDeviceToken(req.user.id, token);
    return sendSuccess(res, 'Device push token unregistered successfully', { unregistered: removed }, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    return sendSuccess(res, 'Notifications retrieved', { notifications });
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
});

const handleReadAll = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id, req.user.role);
    return sendSuccess(res, 'All notifications marked as read', result);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

router.put('/read-all', handleReadAll);
router.patch('/read-all', handleReadAll);

const handleMarkOne = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id, req.user.role);
    return sendSuccess(res, 'Notification marked as read', { notification });
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

router.put('/:id/read', handleMarkOne);
router.patch('/:id/read', handleMarkOne);
router.put('/:id', handleMarkOne);
router.patch('/:id', handleMarkOne);

module.exports = router;
