'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchApi } from '../services/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from localStorage or API
  useEffect(() => {
    const loadWishlist = async () => {
      // First try localStorage
      try {
        const saved = localStorage.getItem('user_wishlist');
        if (saved) {
          setWishlist(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading wishlist from localStorage:', e);
      }

      // If user is authenticated, fetch from backend DB
      if (user) {
        try {
          const res = await fetchApi('/wishlist');
          if (res.success && Array.isArray(res.data?.productIds)) {
            // Merge with local products if needed
            // For now, save API product IDs in state
          }
        } catch (err) {
          console.log('DB Wishlist fetch notice:', err.message);
        }
      }
    };

    loadWishlist();
  }, [user]);

  // Helper to persist to localStorage and state
  const saveWishlist = (items) => {
    setWishlist(items);
    try {
      localStorage.setItem('user_wishlist', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving wishlist to localStorage:', e);
    }
  };

  const toggleWishlist = async (product) => {
    if (!product || !product.id) return;
    const exists = wishlist.some((item) => item.id === product.id);

    // Instant local state update
    let updated;
    if (exists) {
      updated = wishlist.filter((item) => item.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    saveWishlist(updated);

    // Sync to PostgreSQL DB if logged in
    if (user) {
      try {
        await fetchApi('/wishlist/toggle', {
          method: 'POST',
          body: JSON.stringify({ productId: product.id }),
        });
      } catch (err) {
        console.warn('Backend wishlist sync notice:', err.message);
      }
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const removeFromWishlist = async (productId) => {
    const updated = wishlist.filter((item) => item.id !== productId);
    saveWishlist(updated);

    if (user) {
      try {
        await fetchApi(`/wishlist/${productId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Backend wishlist delete notice:', err.message);
      }
    }
  };

  const clearWishlist = () => {
    saveWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
