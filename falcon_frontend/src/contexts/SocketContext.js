'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

    // Disconnect old socket if re-authenticating
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Auto-join specific roles if user is present
      if (user?.role === 'ADMIN') {
        newSocket.emit('join_admin_room');
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?.id, user?.role]);

  const joinDeliveryRoom = (deliveryId) => {
    if (socket && deliveryId) {
      socket.emit('join_delivery_room', { deliveryId });
    }
  };

  const leaveDeliveryRoom = (deliveryId) => {
    if (socket && deliveryId) {
      socket.emit('leave_delivery_room', { deliveryId });
    }
  };

  const joinOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('join_order_room', { orderId });
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('leave_order_room', { orderId });
    }
  };

  const joinDriverRoom = (driverId) => {
    if (socket && driverId) {
      socket.emit('join_driver_room', { driverId });
    }
  };

  const joinAdminRoom = () => {
    if (socket) {
      socket.emit('join_admin_room');
    }
  };

  const emitDriverLocation = (data) => {
    if (socket) {
      socket.emit('driver_location_update', data);
    }
  };

  const emitDriverGpsStatus = (data) => {
    if (socket) {
      socket.emit('driver_gps_status', data);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinDeliveryRoom,
        leaveDeliveryRoom,
        joinOrderRoom,
        leaveOrderRoom,
        joinDriverRoom,
        joinAdminRoom,
        emitDriverLocation,
        emitDriverGpsStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
