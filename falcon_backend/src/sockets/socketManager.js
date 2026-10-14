const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

let io = null;

const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Socket Authentication Middleware: Allows both authenticated users & guest order trackers
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      let token = null;

      if (cookieHeader) {
        const cookies = require('cookie').parse(cookieHeader);
        token = cookies.admin_access_token || cookies.driver_access_token || cookies.customer_access_token || cookies.access_token;
      }

      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          socket.user = decoded;
          return next();
        }
      }

      // Allow guest connections for public order tracking (/track-order)
      socket.user = {
        id: `guest_${socket.id}`,
        role: 'GUEST',
        isGuest: true,
      };
      next();
    } catch (err) {
      // In case of parser/unexpected error, still permit guest mode
      socket.user = {
        id: `guest_${socket.id}`,
        role: 'GUEST',
        isGuest: true,
      };
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (${socket.user.role}) - User: ${socket.user.id}`);

    // Join Delivery Tracking Room: delivery:{deliveryId}
    socket.on('join_delivery_room', ({ deliveryId }) => {
      if (!deliveryId) return;
      const roomName = `delivery:${deliveryId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Leave Delivery Tracking Room
    socket.on('leave_delivery_room', ({ deliveryId }) => {
      if (!deliveryId) return;
      const roomName = `delivery:${deliveryId}`;
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left room ${roomName}`);
    });

    // Join Order Room: order:{orderId}
    socket.on('join_order_room', ({ orderId }) => {
      if (!orderId) return;
      const roomName = `order:${orderId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Leave Order Room
    socket.on('leave_order_room', ({ orderId }) => {
      if (!orderId) return;
      const roomName = `order:${orderId}`;
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left room ${roomName}`);
    });

    // Join Driver Personal Room (for real-time assignment push): driver:{driverId}
    socket.on('join_driver_room', ({ driverId }) => {
      if (!driverId) return;
      // Allow only DRIVER or ADMIN
      if (socket.user.role !== ROLES.DRIVER && socket.user.role !== ROLES.ADMIN) {
        return;
      }
      const roomName = `driver:${driverId}`;
      socket.join(roomName);
      logger.info(`Driver ${socket.user.id} joined personal room ${roomName}`);
    });

    // Join Admin Management Room
    socket.on('join_admin_room', () => {
      if (socket.user.role === ROLES.ADMIN) {
        socket.join('admin_room');
        logger.info(`Admin ${socket.user.id} joined admin_room`);
      }
    });

    // Driver GPS Location Update Broadcast Event
    socket.on('driver_location_update', (data) => {
      const { deliveryId, orderId, latitude, longitude, speed, heading, temp } = data || {};
      if (!latitude || !longitude) return;

      // Only Drivers assigned or Admins can broadcast location
      if (socket.user.role !== ROLES.DRIVER && socket.user.role !== ROLES.ADMIN) {
        return;
      }

      const payload = {
        deliveryId,
        orderId,
        driverId: socket.user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        speed: speed !== undefined && speed !== null ? parseFloat(speed) : 0,
        heading: heading !== undefined && heading !== null ? parseFloat(heading) : 0,
        temp: temp || '3.5°C',
        status: 'CONNECTED',
        timestamp: new Date().toISOString(),
      };

      // Broadcast to delivery room
      if (deliveryId) {
        io.to(`delivery:${deliveryId}`).emit('location_updated', payload);
        io.to(`delivery:${deliveryId}`).emit('driver_location_update', payload);
      }

      // Broadcast to order room
      if (orderId) {
        io.to(`order:${orderId}`).emit('location_updated', payload);
        io.to(`order:${orderId}`).emit('driver_location_update', payload);
      }

      // Broadcast to admin room
      io.to('admin_room').emit('location_updated', payload);
      io.to('admin_room').emit('driver_location_update', payload);
    });

    // Driver GPS Signal Status (e.g. DISCONNECTED, RECONNECTED, ERROR)
    socket.on('driver_gps_status', (data) => {
      const { deliveryId, orderId, status, message } = data || {};
      const payload = {
        deliveryId,
        orderId,
        status: status || 'DISCONNECTED',
        message: message || '',
        timestamp: new Date().toISOString(),
      };

      if (deliveryId) io.to(`delivery:${deliveryId}`).emit('driver_gps_status', payload);
      if (orderId) io.to(`order:${orderId}`).emit('driver_gps_status', payload);
      io.to('admin_room').emit('driver_gps_status', payload);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Emit Order Assignment event to driver and admin panels
 */
const emitOrderAssigned = (driverId, assignmentData) => {
  if (!io) return;
  const payload = {
    driverId,
    timestamp: new Date().toISOString(),
    ...assignmentData,
  };
  io.to(`driver:${driverId}`).emit('order_assigned', payload);
  io.to('admin_room').emit('order_assigned', payload);
  logger.info(`Emitted order_assigned to driver:${driverId} and admin_room`);
};

/**
 * Emit Order Status Update across Order room, Delivery room, Driver room, and Admin room
 */
const emitOrderStatusUpdate = ({ orderId, deliveryId, driverId, status, orderStatus, notes, data }) => {
  if (!io) return;
  const payload = {
    orderId,
    deliveryId,
    driverId,
    status: status || orderStatus,
    orderStatus: orderStatus || status,
    notes: notes || '',
    data: data || {},
    timestamp: new Date().toISOString(),
  };

  if (orderId) io.to(`order:${orderId}`).emit('order_status_update', payload);
  if (deliveryId) io.to(`delivery:${deliveryId}`).emit('order_status_update', payload);
  if (driverId) io.to(`driver:${driverId}`).emit('order_status_update', payload);
  io.to('admin_room').emit('order_status_update', payload);

  logger.info(`Emitted order_status_update for order ${orderId} (${payload.status})`);
};

/**
 * Helper to emit driver location from backend service or HTTP fallback
 */
const emitDriverLocationUpdate = (payload) => {
  if (!io || !payload) return;
  const data = {
    ...payload,
    lat: payload.latitude,
    lng: payload.longitude,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
  if (payload.deliveryId) {
    io.to(`delivery:${payload.deliveryId}`).emit('location_updated', data);
    io.to(`delivery:${payload.deliveryId}`).emit('driver_location_update', data);
  }
  if (payload.orderId) {
    io.to(`order:${payload.orderId}`).emit('location_updated', data);
    io.to(`order:${payload.orderId}`).emit('driver_location_update', data);
  }
  io.to('admin_room').emit('location_updated', data);
  io.to('admin_room').emit('driver_location_update', data);
};

module.exports = {
  initSocketServer,
  getIO,
  emitOrderAssigned,
  emitOrderStatusUpdate,
  emitDriverLocationUpdate,
};
