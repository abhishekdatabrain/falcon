const { Notification } = require('../models');

class NotificationService {
  async createNotification(userId, type, titleEn, titleAr, bodyEn, bodyAr) {
    return await Notification.create({
      user_id: userId,
      type,
      title_en: titleEn,
      title_ar: titleAr,
      body_en: bodyEn,
      body_ar: bodyAr,
      is_read: false,
    });
  }

  async getUserNotifications(userId) {
    return await Notification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId },
    });
    if (notification) {
      await notification.update({ is_read: true });
    }
    return notification;
  }
}

module.exports = new NotificationService();
