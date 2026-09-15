'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const { showToast } = useToast();
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

  const addToCart = async (productId, quantity = 1, productData = null) => {
    if (!user) {
      showToast(
        locale === 'ar'
          ? 'يرجى تسجيل الدخول لإضافة المنتجات إلى السلة'
          : 'Please log in to add items to your cart',
        'auth',
        '/login'
      );
      throw new Error(locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
    }

    try {
      const res = await fetchApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.success && res.data) {
        setCart(res.data);
        const name = productData
          ? (locale === 'ar' ? (productData.name_ar || productData.name_en) : (productData.name_en || productData.name_ar))
          : null;
        const img = productData ? (productData.img || productData.image || (productData.images && productData.images[0])) : null;

        showToast(
          locale === 'ar' ? 'تمت إضافة المنتج إلى السلة 🛒' : 'Added to cart successfully 🛒',
          'success',
          null,
          name || img ? { name, image: typeof img === 'string' ? img : img?.image_url } : null
        );
      } else {
        showToast(res.message || (locale === 'ar' ? 'فشل إضافة المنتج' : 'Failed to add to cart'), 'error');
      }
      return res;
    } catch (err) {
      showToast(err.message || (locale === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding to cart'), 'error');
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user) return;
    try {
      const res = await fetchApi(`/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      if (res.success && res.data) {
        setCart(res.data);
      }
      return res;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const removeItem = async (itemId) => {
    if (!user) return;
    try {
      const res = await fetchApi(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.success && res.data) {
        setCart(res.data);
        showToast(
          locale === 'ar' ? 'تمت إزالة المنتج من السلة' : 'Item removed from cart',
          'info'
        );
      }
      return res;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      const res = await fetchApi('/cart', {
        method: 'DELETE',
      });
      if (res.success && res.data) {
        setCart(res.data);
        showToast(
          locale === 'ar' ? 'تم تفريغ السلة' : 'Cart cleared',
          'info'
        );
      }
      return res;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const cartCount = cart.items ? cart.items.length : 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

