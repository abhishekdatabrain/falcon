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

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      let token = null;

      if (cookieHeader) {
        const cookies = require('cookie').parse(cookieHeader);
        token = cookies.access_token;
      }

      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} for user ${socket.user.id} (${socket.user.role})`);

    // Join Delivery Tracking Room: delivery:{deliveryId}
    socket.on('join_delivery_room', ({ deliveryId }) => {
      if (!deliveryId) return;
      const roomName = `delivery:${deliveryId}`;
      socket.join(roomName);
      logger.info(`User ${socket.user.id} joined room ${roomName}`);
    });

    // Leave Delivery Tracking Room
    socket.on('leave_delivery_room', ({ deliveryId }) => {
      if (!deliveryId) return;
      const roomName = `delivery:${deliveryId}`;
      socket.leave(roomName);
      logger.info(`User ${socket.user.id} left room ${roomName}`);
    });

    // Driver GPS Location Update Broadcast Event
    socket.on('driver_location_update', (data) => {
      const { deliveryId, latitude, longitude, speed, heading } = data;
      if (!deliveryId || !latitude || !longitude) return;

      // Only Drivers assigned to this delivery can broadcast location
      if (socket.user.role !== ROLES.DRIVER && socket.user.role !== ROLES.ADMIN) {
        return;
      }

      const roomName = `delivery:${deliveryId}`;
      const payload = {
        deliveryId,
        driverId: socket.user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date().toISOString(),
      };

      // Broadcast real-time location to all users (Customer & Admin) watching this delivery room
      io.to(roomName).emit('location_updated', payload);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIO,
};
