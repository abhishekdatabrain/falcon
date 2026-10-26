'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'falcon_guest_cart';

const calculateGuestCart = (items = []) => {
  let subtotal = 0;
  const mappedItems = items.map((item) => {
    const price = parseFloat(item.price || 0);
    const discountPrice = item.discount_price ? parseFloat(item.discount_price) : null;
    const effectivePrice = discountPrice && discountPrice < price ? discountPrice : price;
    const lineTotal = effectivePrice * (item.quantity || 1);
    subtotal += lineTotal;
    return {
      ...item,
      price,
      discount_price: discountPrice,
      lineTotal,
    };
  });

  const taxRate = 0.15; // 15% Saudi Arabia VAT
  const taxTotal = Math.round(subtotal * taxRate * 100) / 100;
  const deliveryFee = subtotal > 0 ? (subtotal >= 500 ? 0.0 : 25.0) : 0.0;
  const discountTotal = 0.0;
  const grandTotal = Math.round((subtotal + taxTotal + deliveryFee - discountTotal) * 100) / 100;

  return {
    items: mappedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal,
    deliveryFee,
    discountTotal,
    grandTotal,
  };
};

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
  const isMergingRef = useRef(false);

  // Helper to get local guest items
  const getGuestItems = () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(GUEST_CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveGuestItems = (items) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  };

  const fetchCart = async () => {
    if (!user || user.role !== 'CUSTOMER') {
      const guestItems = getGuestItems();
      setCart(calculateGuestCart(guestItems));
      return;
    }

    try {
      setLoading(true);

      // Check if there are guest cart items to merge on login
      const guestItems = getGuestItems();
      if (guestItems.length > 0 && !isMergingRef.current) {
        isMergingRef.current = true;
        try {
          for (const item of guestItems) {
            await fetchApi('/cart/items', {
              method: 'POST',
              body: JSON.stringify({
                productId: item.productId || item.product_id,
                variantId: item.variantId || item.variant_id || null,
                quantity: item.quantity || 1,
              }),
            });
          }
          if (typeof window !== 'undefined') {
            localStorage.removeItem(GUEST_CART_KEY);
          }
        } catch (e) {
          console.error('Error merging guest cart:', e);
        } finally {
          isMergingRef.current = false;
        }
      }

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

  const addToCart = async (productId, quantity = 1, productData = null, options = {}) => {
    let pData = productData;
    if (!pData && (!user || user.role !== 'CUSTOMER')) {
      try {
        const pRes = await fetchApi(`/products/${productId}`);
        if (pRes.success && pRes.data?.product) {
          pData = pRes.data.product;
        }
      } catch (e) {
        // Fallback
      }
    }

    const name = pData
      ? locale === 'ar'
        ? pData.name_ar || pData.name_en || pData.title_ar || pData.title_en
        : pData.name_en || pData.name_ar || pData.title_en || pData.title_ar
      : null;
    const img = pData
      ? pData.img || pData.image || (pData.images && (typeof pData.images[0] === 'string' ? pData.images[0] : pData.images[0]?.image_url)) || pData.image_url
      : null;
    const finalImg = typeof img === 'string' ? img : img?.image_url;
    const variantId = pData?.variant_id || pData?.variantId || null;

    // Check if product or selected variant is out of stock
    const maxStock = variantId && Array.isArray(pData?.variants)
      ? (pData.variants.find(v => String(v.id) === String(variantId))?.stock_quantity ?? 0)
      : (pData?.stock_quantity !== undefined && pData?.stock_quantity !== null ? parseInt(pData.stock_quantity, 10) : null);

    if (maxStock !== null && maxStock <= 0) {
      showToast(
        locale === 'ar' ? 'عذراً، هذا المنتج غير متوفر في المخزون حالياً' : 'Sorry, this product is currently out of stock',
        'error'
      );
      return { success: false, message: 'Product is out of stock' };
    }

    // GUEST USER (Not logged in)
    if (!user || user.role !== 'CUSTOMER') {
      const guestItems = getGuestItems();
      const existingIdx = guestItems.findIndex(
        (it) => (it.productId === productId || it.product_id === productId) && String(it.variantId || '') === String(variantId || '')
      );

      const parsedPrice = parseFloat(pData?.price || 0);
      const parsedDiscountPrice = pData?.discount_price ? parseFloat(pData.discount_price) : null;

      if (existingIdx > -1) {
        if (maxStock !== null && guestItems[existingIdx].quantity + quantity > maxStock) {
          showToast(
            locale === 'ar' ? `الكمية المتوفرة في المخزون هي ${maxStock} فقط` : `Only ${maxStock} items available in stock`,
            'error'
          );
          return { success: false, message: 'Exceeds stock limit' };
        }
        guestItems[existingIdx].quantity += quantity;
      } else {
        const itemKey = variantId ? `${productId}-${variantId}` : productId;
        guestItems.push({
          id: `guest-${itemKey}`,
          productId: productId,
          product_id: productId,
          variantId: variantId,
          variant_id: variantId,
          name_en: pData?.name_en || pData?.title_en || 'Product',
          name_ar: pData?.name_ar || pData?.title_ar || pData?.name_en || 'منتج',
          sku: pData?.sku || '',
          price: parsedPrice,
          discount_price: parsedDiscountPrice,
          image: finalImg,
          quantity: quantity,
          max_stock: maxStock,
          stock_quantity: maxStock,
          unit_value: pData?.unit_value || '',
          unit_type: pData?.unit_type || '',
          pack_size: pData?.pack_size || '',
        });
      }

      saveGuestItems(guestItems);
      const updatedCart = calculateGuestCart(guestItems);
      setCart(updatedCart);

      if (!options?.silent) {
        showToast(
          locale === 'ar' ? 'تمت إضافة المنتج إلى السلة 🛒' : 'Added to cart successfully 🛒',
          'success',
          null,
          name || finalImg ? { name, image: finalImg } : null
        );
      }
      return { success: true, data: updatedCart };
    }

    // LOGGED IN USER
    try {
      const res = await fetchApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, variantId }),
      });
      if (res.success && res.data) {
        setCart(res.data);
        if (!options?.silent) {
          showToast(
            locale === 'ar' ? 'تمت إضافة المنتج إلى السلة 🛒' : 'Added to cart successfully 🛒',
            'success',
            null,
            name || finalImg ? { name, image: finalImg } : null
          );
        }
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
    // GUEST USER
    if (!user || user.role !== 'CUSTOMER') {
      let guestItems = getGuestItems();
      if (quantity <= 0) {
        guestItems = guestItems.filter((it) => it.id !== itemId && it.productId !== itemId && it.product_id !== itemId);
      } else {
        const itemIdx = guestItems.findIndex(
          (it) => it.id === itemId || it.productId === itemId || it.product_id === itemId
        );
        if (itemIdx > -1) {
          const item = guestItems[itemIdx];
          const stockLimit = item.max_stock ?? item.stock_quantity;
          if (stockLimit !== null && stockLimit !== undefined && quantity > stockLimit) {
            showToast(
              locale === 'ar' ? `الكمية المتوفرة في المخزون هي ${stockLimit} فقط` : `Only ${stockLimit} items available in stock`,
              'error'
            );
            return { success: false, message: 'Exceeds stock limit' };
          }
          guestItems[itemIdx].quantity = quantity;
        }
      }
      saveGuestItems(guestItems);
      const updatedCart = calculateGuestCart(guestItems);
      setCart(updatedCart);
      return { success: true, data: updatedCart };
    }

    // LOGGED IN USER
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
    // GUEST USER
    if (!user || user.role !== 'CUSTOMER') {
      let guestItems = getGuestItems();
      guestItems = guestItems.filter((it) => it.id !== itemId && it.productId !== itemId && it.product_id !== itemId);
      saveGuestItems(guestItems);
      const updatedCart = calculateGuestCart(guestItems);
      setCart(updatedCart);
      showToast(locale === 'ar' ? 'تمت إزالة المنتج من السلة' : 'Item removed from cart', 'info');
      return { success: true, data: updatedCart };
    }

    // LOGGED IN USER
    try {
      const res = await fetchApi(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.success && res.data) {
        setCart(res.data);
        showToast(locale === 'ar' ? 'تمت إزالة المنتج من السلة' : 'Item removed from cart', 'info');
      }
      return res;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const clearCart = async (showNotification = false) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    const emptyCart = {
      items: [],
      subtotal: 0,
      taxTotal: 0,
      deliveryFee: 0,
      discountTotal: 0,
      grandTotal: 0,
    };
    setCart(emptyCart);

    if (user && user.role === 'CUSTOMER') {
      try {
        const res = await fetchApi('/cart', {
          method: 'DELETE',
        });
        if (res.success && res.data) {
          setCart(res.data);
        }
      } catch (err) {
        // State is already empty
      }
    }

    if (showNotification) {
      showToast(locale === 'ar' ? 'تم تفريغ السلة' : 'Cart cleared', 'info');
    }
    return { success: true, data: emptyCart };
  };

  const cartCount = cart.items ? cart.items.length : 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
