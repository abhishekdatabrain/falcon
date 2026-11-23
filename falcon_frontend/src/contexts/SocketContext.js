'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { fetchApi } from '../services/api';

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
      if (user?.id) {
        newSocket.emit('join_user_room', { userId: user.id });
      }
    });

    // Real-time listener: Customer Order Placed Push Notification
    newSocket.on('order_placed', (orderData) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const grandTotal = parseFloat(orderData.grandTotal || 0).toFixed(2);
          new Notification(`Order Confirmed! #${orderData.orderNumber}`, {
            body: `Thank you! Your order of SAR ${grandTotal} has been placed successfully.`,
            icon: '/saqrcart-logo.png',
            badge: '/saqrcart-logo.png',
          });
        } catch (_) {}
      }
    });

    // Real-time listener: Admin New Order Alert Push Notification
    newSocket.on('new_order_placed', (orderData) => {
      if (user?.role === 'ADMIN') {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const grandTotal = parseFloat(orderData.grandTotal || 0).toFixed(2);
            new Notification(`New Order Received! #${orderData.orderNumber}`, {
              body: `New order placed by ${orderData.customerName || 'Customer'} for SAR ${grandTotal}.`,
              icon: '/saqrcart-logo.png',
              badge: '/saqrcart-logo.png',
            });
          } catch (_) {}
        }
      }
    });

    // Real-time listener: Order Lifecycle Status Updates (Driver Assigned, Out for Delivery, Delivered, Failed, Cancelled)
    newSocket.on('order_status_update', (data) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const status = data.status || data.orderStatus;
          const orderNum = data.data?.orderNumber || data.orderNumber || '';
          const numDisplay = orderNum ? ` #${orderNum}` : '';

          if (status === 'DRIVER_ASSIGNED') {
            const driverName = data.data?.driverName || 'Delivery Partner';
            const otp = data.data?.otp;
            new Notification(`Driver Assigned!${numDisplay}`, {
              body: `Driver ${driverName} is assigned to your order.${otp ? ` Delivery PIN: ${otp}` : ''}`,
              icon: '/saqrcart-logo.png',
              badge: '/saqrcart-logo.png',
            });
          } else if (status === 'OUT_FOR_DELIVERY') {
            new Notification(`Out for Delivery! 🚚${numDisplay}`, {
              body: `Your order is on the way with your driver!`,
              icon: '/saqrcart-logo.png',
              badge: '/saqrcart-logo.png',
            });
          } else if (status === 'DELIVERED') {
            new Notification(`Order Delivered! 🎉${numDisplay}`, {
              body: `Your order has been delivered successfully. Enjoy!`,
              icon: '/saqrcart-logo.png',
              badge: '/saqrcart-logo.png',
            });
          } else if (status === 'DELIVERY_FAILED') {
            const reason = data.data?.failureReason || data.notes || '';
            new Notification(`Delivery Attempt Failed${numDisplay}`, {
              body: `Delivery could not be completed${reason ? ': ' + reason : '.'}`,
              icon: '/saqrcart-logo.png',
              badge: '/saqrcart-logo.png',
            });
          } else if (status === 'CANCELLED') {
            new Notification(`Order Cancelled${numDisplay}`, {
              body: `Your order has been cancelled.`,
              icon: '/saqrcart-logo.png',
              badge: '/saqrcart-logo.png',
            });
          }
        } catch (_) {}
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

  // Auto-register web device token in backend for logged-in user
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    try {
      let webToken = localStorage.getItem('saqrcart_web_device_token');
      if (!webToken) {
        webToken = `web_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('saqrcart_web_device_token', webToken);
      }
      fetchApi('/notifications/device-token', {
        method: 'POST',
        body: JSON.stringify({
          token: webToken,
          platform: 'web',
          deviceName: navigator.userAgent.includes('Chrome') ? 'Google Chrome (PC)' : 'Web Browser',
        }),
      }).catch(() => {});
    } catch (_) {}
  }, [user?.id]);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
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
        requestNotificationPermission,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
