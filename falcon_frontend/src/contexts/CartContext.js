'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    taxTotal: 0,
    deliveryFee: 0,
    discountTotal: 0,
    grandTotal: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'CUSTOMER') {
      setCart({ items: [], subtotal: 0, taxTotal: 0, deliveryFee: 0, discountTotal: 0, grandTotal: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi('/cart');
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      // Cart fetch error handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await fetchApi('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.success && res.data) {
      setCart(res.data);
    }
    return res;
  };

  const updateQuantity = async (itemId, quantity) => {
    const res = await fetchApi(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    if (res.success && res.data) {
      setCart(res.data);
    }
    return res;
  };

  const removeItem = async (itemId) => {
    const res = await fetchApi(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    if (res.success && res.data) {
      setCart(res.data);
    }
    return res;
  };

  const clearCart = async () => {
    const res = await fetchApi('/cart', {
      method: 'DELETE',
    });
    if (res.success && res.data) {
      setCart(res.data);
    }
    return res;
  };

  const cartCount = cart.items ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
