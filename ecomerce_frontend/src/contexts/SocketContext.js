'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

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

  const emitDriverLocation = (data) => {
    if (socket) {
      socket.emit('driver_location_update', data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinDeliveryRoom, leaveDeliveryRoom, emitDriverLocation }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
