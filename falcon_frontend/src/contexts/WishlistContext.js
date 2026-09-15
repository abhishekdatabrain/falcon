'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';
import { fetchApi } from '../services/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from localStorage or API only for authenticated user
  useEffect(() => {
    const loadWishlist = async () => {
      // If user is not authenticated, reset wishlist
      if (!user) {
        setWishlist([]);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_wishlist');
        }
        return;
      }

      // Try loading user-specific wishlist from localStorage
      try {
        const saved = localStorage.getItem(`user_wishlist_${user.id}`);
        if (saved) {
          setWishlist(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading wishlist from localStorage:', e);
      }

      // If user is authenticated, fetch from backend DB
      try {
        const res = await fetchApi('/wishlist');
        if (res.success && Array.isArray(res.data?.productIds)) {
          // DB sync notice
        }
      } catch (err) {
        console.log('DB Wishlist fetch notice:', err.message);
      }
    };

    loadWishlist();
  }, [user]);

  // Helper to persist user-specific wishlist to localStorage and state
  const saveWishlist = (items) => {
    setWishlist(items);
    if (user && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`user_wishlist_${user.id}`, JSON.stringify(items));
      } catch (e) {
        console.error('Error saving wishlist to localStorage:', e);
      }
    }
  };

  const toggleWishlist = async (product) => {
    // Require authentication: show toast message instead of redirecting
    if (!user) {
      showToast(
        locale === 'ar'
          ? 'يرجى تسجيل الدخول لإضافة المنتجات إلى قائمة المفضلة'
          : 'Please log in to add items to your wishlist',
        'auth',
        '/login'
      );
      return false;
    }

    if (!product || !product.id) return false;
    const exists = wishlist.some((item) => item.id === product.id);

    // Instant local state update
    let updated;
    if (exists) {
      updated = wishlist.filter((item) => item.id !== product.id);
      showToast(
        locale === 'ar' ? 'تمت إزالة المنتج من قائمة المفضلة' : 'Removed from wishlist',
        'info'
      );
    } else {
      updated = [...wishlist, product];
      showToast(
        locale === 'ar' ? 'تمت إضافة المنتج إلى قائمة المفضلة ❤️' : 'Added to wishlist ❤️',
        'success'
      );
    }
    saveWishlist(updated);

    // Sync to PostgreSQL DB if logged in
    try {
      await fetchApi('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id }),
      });
    } catch (err) {
      console.warn('Backend wishlist sync notice:', err.message);
    }
    return true;
  };

  const isInWishlist = (productId) => {
    if (!user) return false;
    return wishlist.some((item) => item.id === productId);
  };

  const removeFromWishlist = async (productId) => {
    if (!user) {
      showToast(
        locale === 'ar'
          ? 'يرجى تسجيل الدخول لإدارة قائمة المفضلة'
          : 'Please log in to manage your wishlist',
        'auth',
        '/login'
      );
      return false;
    }

    const updated = wishlist.filter((item) => item.id !== productId);
    saveWishlist(updated);
    showToast(
      locale === 'ar' ? 'تمت إزالة المنتج من قائمة المفضلة' : 'Item removed from wishlist',
      'info'
    );

    try {
      await fetchApi(`/wishlist/${productId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend wishlist delete notice:', err.message);
    }
    return true;
  };

  const clearWishlist = () => {
    if (!user) return;
    saveWishlist([]);
    showToast(
      locale === 'ar' ? 'تم مسح قائمة المفضلة بالكامل' : 'Wishlist cleared',
      'info'
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: user ? wishlist.length : 0,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
        showToast,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}



