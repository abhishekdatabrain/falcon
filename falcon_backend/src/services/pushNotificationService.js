const { DeviceToken, User, sequelize } = require('../models');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class PushNotificationService {
  constructor() {
    this.firebaseApp = null;
    this.initFirebase();
  }

  /**
   * Initialize Firebase Admin SDK if service account is provided in environment.
   * If not provided, operates in graceful Mock/Logging mode.
   */
  initFirebase() {
    try {
      const path = require('path');
      const fs = require('fs');
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      let serviceAccount = null;
      if (serviceAccountStr) {
        serviceAccount = typeof serviceAccountStr === 'string'
          ? JSON.parse(serviceAccountStr)
          : serviceAccountStr;
      } else if (serviceAccountPath) {
        const resolvedPath = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.join(__dirname, '..', '..', serviceAccountPath);
        if (fs.existsSync(resolvedPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        }
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
      }

      if (serviceAccount) {
        const admin = require('firebase-admin');
        const apps = typeof admin.getApps === 'function' ? admin.getApps() : (admin.apps || []);
        if (!apps.length) {
          const credential = typeof admin.cert === 'function'
            ? admin.cert(serviceAccount)
            : admin.credential.cert(serviceAccount);
          this.firebaseApp = admin.initializeApp({ credential });
          logger.info('✓ Firebase Admin SDK initialized for Push Notifications');
        } else {
          this.firebaseApp = typeof admin.getApp === 'function' ? admin.getApp() : admin.app();
        }
      } else {
        logger.info('ℹ PushNotificationService initialized in Mock/Development logging mode (No Firebase credentials provided)');
      }
    } catch (err) {
      logger.warn('Firebase initialization warning (Push notifications will log to console): %s', err.message);
      this.firebaseApp = null;
    }
  }

  /**
   * Register or update mobile device push token for a user.
   */
  async registerDeviceToken(userId, { token, platform = 'android', deviceName = null }) {
    if (!userId || !token) {
      throw new Error('User ID and Device Push Token are required');
    }

    const cleanToken = String(token).trim();
    const cleanPlatform = ['android', 'ios', 'web'].includes(String(platform).toLowerCase())
      ? String(platform).toLowerCase()
      : 'android';

    const [deviceToken, created] = await DeviceToken.findOrCreate({
      where: { token: cleanToken },
      defaults: {
        user_id: userId,
        token: cleanToken,
        platform: cleanPlatform,
        device_name: deviceName,
        is_active: true,
        last_used_at: new Date(),
      },
    });

    if (!created) {
      await deviceToken.update({
        user_id: userId,
        platform: cleanPlatform,
        device_name: deviceName || deviceToken.device_name,
        is_active: true,
        last_used_at: new Date(),
      });
    }

    logger.info(`Device token ${created ? 'registered' : 'refreshed'} for user ${userId} (${cleanPlatform})`);
    return deviceToken;
  }

  /**
   * Deactivate or unregister device token on logout.
   */
  async removeDeviceToken(userId, token) {
    if (!token) return false;
    const cleanToken = String(token).trim();
    const count = await DeviceToken.update(
      { is_active: false },
      { where: { token: cleanToken, user_id: userId } }
    );
    return count[0] > 0;
  }

  /**
   * Send push notification to a list of device tokens.
   */
  async sendToTokens(tokens, { title, body, data = {} }) {
    if (!tokens || !tokens.length) return { successCount: 0, failureCount: 0 };

    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    if (!uniqueTokens.length) return { successCount: 0, failureCount: 0 };

    // Format all data payload properties as strings for FCM compliance
    const stringifiedData = {};
    for (const [key, val] of Object.entries(data || {})) {
      stringifiedData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
    }

    // 1. Live Firebase Mode (when credentials configured)
    if (this.firebaseApp) {
      try {
        const { getMessaging } = require('firebase-admin/messaging');
        const messaging = getMessaging(this.firebaseApp);
        const message = {
          tokens: uniqueTokens,
          notification: {
            title: title || 'SaaRCart Super Mart',
            body: body || '',
          },
          data: stringifiedData,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        const response = await messaging.sendEachForMulticast(message);
        logger.info(`FCM Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`);

        // Cleanup tokens that failed because they are unregistered or expired
        if (response.failureCount > 0) {
          const badTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const code = resp.error?.code;
              if (
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/registration-token-not-registered'
              ) {
                badTokens.push(uniqueTokens[idx]);
              }
            }
          });
          if (badTokens.length > 0) {
            await DeviceToken.update({ is_active: false }, { where: { token: badTokens } });
            logger.info(`Deactivated ${badTokens.length} expired FCM tokens.`);
          }
        }

        return {
          successCount: response.successCount,
          failureCount: response.failureCount,
        };
      } catch (err) {
        logger.error('Firebase sendMulticast failed: %s', err.message);
      }
    }

    // 2. Mock / Dev Logging Mode (Always active if Firebase is not enabled)
    logger.info('================================================================');
    logger.info('[PUSH NOTIFICATION SENT] (FCM Delivery Simulation)');
    logger.info(`Recipients: ${uniqueTokens.length} Device Token(s)`);
    logger.info(`Title: "${title}"`);
    logger.info(`Body:  "${body}"`);
    logger.info(`Data:  %o`, stringifiedData);
    logger.info('================================================================');

    return {
      successCount: uniqueTokens.length,
      failureCount: 0,
      simulated: true,
    };
  }

  /**
   * Send push notification to a specific user ID across all their active devices.
   */
  async sendToUser(userId, { title, body, data = {} }) {
    if (!userId) return null;
    const deviceRecords = await DeviceToken.findAll({
      where: { user_id: userId, is_active: true },
      attributes: ['token'],
    });

    const tokens = deviceRecords.map((d) => d.token);
    return await this.sendToTokens(tokens, { title, body, data });
  }

  /**
   * Send push notification to all users holding a specific platform role (e.g. ADMIN).
   */
  async sendToRole(role, { title, body, data = {} }) {
    if (!role) return null;
    const users = await User.findAll({
      where: { role },
      attributes: ['id'],
      include: [
        {
          model: DeviceToken,
          as: 'device_tokens',
          where: { is_active: true },
          attributes: ['token'],
          required: true,
        },
      ],
    });

    const tokens = [];
    users.forEach((u) => {
      (u.device_tokens || []).forEach((dt) => tokens.push(dt.token));
    });

    return await this.sendToTokens(tokens, { title, body, data });
  }

  /**
   * Dispatch Order Placed push notifications to Customer and Store Admins.
   *
   * @param {object} order - The created order instance/object with items and customer info
   */
  async sendOrderPlacedPush(order) {
    if (!order) return;

    try {
      const orderNumber = order.order_number || `#${order.id}`;
      const grandTotal = parseFloat(order.grand_total || 0).toFixed(2);
      const deliveryMethod = order.delivery_method === 'STANDARD' ? 'Standard Schedule' : 'Express Delivery';
      const slotText = order.delivery_slot ? ` (${order.delivery_slot})` : '';
      const customerUserId = order.customer?.user_id;

      // 1. Customer Push Notification
      if (customerUserId) {
        const customerTitle = `Order Confirmed! #${orderNumber}`;
        const customerBody = `Thank you! Your order of SAR ${grandTotal} has been confirmed. Estimated delivery: ${order.delivery_date || 'Today'}${slotText}.`;
        const customerData = {
          type: 'ORDER_PLACED',
          orderId: order.id,
          orderNumber,
          grandTotal,
          deliveryMethod,
          screen: 'OrderConfirmation',
        };

        this.sendToUser(customerUserId, {
          title: customerTitle,
          body: customerBody,
          data: customerData,
        }).catch((err) => {
          logger.error('Failed to send customer order push notification:', err);
        });
      }

      // 2. Admin Push Notification (New Incoming Order)
      const customerName = order.customer
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'A Customer'
        : 'A Customer';

      const adminTitle = `New Order Received! #${orderNumber}`;
      const adminBody = `New order placed by ${customerName} for SAR ${grandTotal} via ${deliveryMethod}.`;
      const adminData = {
        type: 'NEW_ORDER_ALERT',
        orderId: order.id,
        orderNumber,
        grandTotal,
        customerName,
        deliveryMethod,
        screen: 'AdminOrderDetails',
      };

      this.sendToRole(ROLES.ADMIN, {
        title: adminTitle,
        body: adminBody,
        data: adminData,
      }).catch((err) => {
        logger.error('Failed to send admin order push notification:', err);
      });
    } catch (err) {
      logger.error('Error dispatching order placed push notifications: %s', err.message);
    }
  }

  /**
   * Dispatch Driver Assigned & Handover PIN push notification to customer.
   */
  async sendDriverAssignedPush({ orderId, orderNumber, customerUserId, driverName, otp }) {
    if (!customerUserId) return;

    try {
      const cleanOrderNumber = orderNumber || `#${orderId}`;
      const driverLabel = driverName ? `driver ${driverName}` : 'a delivery partner';
      const title = `Driver Assigned • PIN: ${otp}`;
      const body = `Your order #${cleanOrderNumber} has been assigned to ${driverLabel}. Share PIN ${otp} with driver upon delivery.`;
      const data = {
        type: 'DRIVER_ASSIGNED',
        orderId,
        orderNumber: cleanOrderNumber,
        otp: String(otp || ''),
        screen: 'OrderTracking',
      };

      this.sendToUser(customerUserId, { title, body, data }).catch((err) => {
        logger.error('Failed to send driver assigned push notification:', err);
      });
    } catch (err) {
      logger.error('Error in sendDriverAssignedPush: %s', err.message);
    }
  }

  /**
   * Dispatch Delivery Status Transition push notifications (OUT_FOR_DELIVERY, DELIVERED, DELIVERY_FAILED).
   */
  async sendDeliveryStatusPush({ orderId, orderNumber, status, customerUserId, driverName, failureReason }) {
    try {
      const cleanOrderNumber = orderNumber || `#${orderId}`;
      let title = '';
      let body = '';
      let screen = 'OrderTracking';

      if (status === 'OUT_FOR_DELIVERY') {
        const driverLabel = driverName ? `Driver ${driverName}` : 'Our delivery partner';
        title = `Out for Delivery! 🚚 #${cleanOrderNumber}`;
        body = `Your order #${cleanOrderNumber} is on the way! ${driverLabel} is heading to your location.`;
        screen = 'OrderTracking';
      } else if (status === 'DELIVERED') {
        title = `Order Delivered! 🎉 #${cleanOrderNumber}`;
        body = `Your order #${cleanOrderNumber} has been delivered successfully. Thank you for shopping with SaaRCart!`;
        screen = 'OrderConfirmation';
      } else if (status === 'DELIVERY_FAILED') {
        const reasonText = failureReason ? ` (${failureReason})` : '';
        title = `Delivery Attempt Failed #${cleanOrderNumber}`;
        body = `Our driver could not reach you for order #${cleanOrderNumber}${reasonText}. Please check your phone or contact support.`;
        screen = 'OrderTracking';
      } else {
        return; // Other internal statuses don't require intrusive push notifications
      }

      const data = {
        type: status,
        orderId,
        orderNumber: cleanOrderNumber,
        screen,
      };

      if (customerUserId) {
        this.sendToUser(customerUserId, { title, body, data }).catch((err) => {
          logger.error(`Failed to send customer ${status} push notification:`, err);
        });
      }

      // If DELIVERY_FAILED, also alert Store Admins
      if (status === 'DELIVERY_FAILED') {
        this.sendToRole(ROLES.ADMIN, {
          title: `Delivery Failed #${cleanOrderNumber}`,
          body: `Order #${cleanOrderNumber} delivery failed: ${failureReason || 'Customer unreachable'}.`,
          data: {
            type: 'ADMIN_DELIVERY_FAILED',
            orderId,
            orderNumber: cleanOrderNumber,
            screen: 'AdminOrderDetails',
          },
        }).catch((err) => {
          logger.error('Failed to send admin delivery failed push notification:', err);
        });
      }
    } catch (err) {
      logger.error('Error in sendDeliveryStatusPush: %s', err.message);
    }
  }

  /**
   * Dispatch Order Cancelled push notification to Customer and Store Admins.
   */
  async sendOrderCancelledPush({ orderId, orderNumber, customerUserId, reason, refundStatus }) {
    try {
      const cleanOrderNumber = orderNumber || `#${orderId}`;
      const refundText = refundStatus === 'REFUNDED'
        ? ' Your refund has been initiated and processed.'
        : '';

      // 1. Customer Confirmation
      if (customerUserId) {
        const title = `Order Cancelled #${cleanOrderNumber}`;
        const body = `Your order #${cleanOrderNumber} has been cancelled successfully.${refundText}`;
        const data = {
          type: 'ORDER_CANCELLED',
          orderId,
          orderNumber: cleanOrderNumber,
          refundStatus: refundStatus || 'N/A',
          screen: 'MyOrders',
        };

        this.sendToUser(customerUserId, { title, body, data }).catch((err) => {
          logger.error('Failed to send customer cancellation push notification:', err);
        });
      }

      // 2. Admin Alert Push
      const adminTitle = `Order Cancelled by Customer #${cleanOrderNumber}`;
      const adminBody = `Order #${cleanOrderNumber} was cancelled by customer. Reason: ${reason || 'N/A'}.${refundText}`;
      const adminData = {
        type: 'ADMIN_ORDER_CANCELLED',
        orderId,
        orderNumber: cleanOrderNumber,
        reason: reason || 'N/A',
        screen: 'AdminOrderDetails',
      };

      this.sendToRole(ROLES.ADMIN, {
        title: adminTitle,
        body: adminBody,
        data: adminData,
      }).catch((err) => {
        logger.error('Failed to send admin cancellation push notification:', err);
      });
    } catch (err) {
      logger.error('Error in sendOrderCancelledPush: %s', err.message);
    }
  }
}

module.exports = new PushNotificationService();
