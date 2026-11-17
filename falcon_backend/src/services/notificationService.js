const { Notification, Order } = require('../models');
const { Op } = require('sequelize');

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
    const notifs = await Notification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const orderNumMap = new Map();
    notifs.forEach((n) => {
      const text = `${n.title_en || ''} ${n.body_en || ''} ${n.title_ar || ''} ${n.body_ar || ''}`;
      const match = text.match(/(?:#)?(ORD-[A-Za-z0-9-]+)/i);
      if (match) {
        orderNumMap.set(match[1], null);
      }
    });

    if (orderNumMap.size > 0) {
      try {
        const orders = await Order.findAll({
          where: { order_number: { [Op.in]: Array.from(orderNumMap.keys()) } },
          attributes: ['id', 'order_number'],
        });
        orders.forEach((o) => {
          orderNumMap.set(o.order_number, o.id);
        });
      } catch (err) {
        console.error('Error resolving orders for notifications:', err);
      }
    }

    return notifs.map((n) => {
      const plain = n.toJSON ? n.toJSON() : { ...n };
      const text = `${plain.title_en || ''} ${plain.body_en || ''} ${plain.title_ar || ''} ${plain.body_ar || ''}`;
      const match = text.match(/(?:#)?(ORD-[A-Za-z0-9-]+)/i);
      if (match) {
        const orderNum = match[1];
        const orderId = orderNumMap.get(orderNum);
        plain.order_number = orderNum;
        plain.order_id = orderId || null;
        plain.redirect_url = orderId ? `/orders/${orderId}` : `/orders`;
      } else {
        plain.redirect_url = '/notifications';
      }
      return plain;
    });
  }

  async markAsRead(notificationId, userId, role = null) {
    const where = { id: notificationId };
    if (role !== 'ADMIN' && userId) {
      where.user_id = userId;
    }
    const notification = await Notification.findOne({ where });
    if (notification) {
      await notification.update({ is_read: true, read_at: new Date() });
    }
    return notification;
  }

  async markAllAsRead(userId, role = null) {
    const where = { is_read: false };
    if (role !== 'ADMIN' && userId) {
      where.user_id = userId;
    }
    const [count] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where }
    );
    return { count };
  }
}

module.exports = new NotificationService();
