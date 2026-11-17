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
