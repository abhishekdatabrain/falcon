'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  Star,
  Heart,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWishlist } from '../contexts/WishlistContext';
import { fetchApi, getImageUrl } from '../services/api';

export default function RecommendedProducts() {
  const { cart, addToCart } = useCart();
  const { locale } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist ? useWishlist() : { toggleWishlist: () => {}, isInWishlist: () => false };
  const scrollContainerRef = useRef(null);

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingIds, setAddingIds] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchCartRecommendations = async () => {
      try {
        setLoading(true);
        const cartItems = cart?.items || [];
        const cartProductIds = new Set(cartItems.map((i) => String(i.product_id || i.id || i.productId)));
        const seenIds = new Set(cartProductIds);
        const collected = [];

        const isProductValid = (p) => {
          if (!p || !p.id) return false;
          const pId = String(p.id);
          if (seenIds.has(pId)) return false;
          if (p.is_active === false || p.status === 'inactive' || p.status === 'DISABLED') return false;
          if (p.is_out_of_stock === true || p.stock === 0 || p.stock_quantity === 0) return false;
          return true;
        };

        const appendProducts = (items) => {
          if (!Array.isArray(items)) return;
          for (const item of items) {
            if (isProductValid(item)) {
              seenIds.add(String(item.id));
              collected.push(item);
              if (collected.length >= 15) break;
            }
          }
        };

        // Extract categories and subcategories from cart items
        const subSubCatIds = new Set();
        const subCatIds = new Set();
        const catIds = new Set();

        for (const cItem of cartItems) {
          const p = cItem.product || cItem;
          if (p.sub_sub_category_id || p.sub_subcategory_id || p.subSubcategoryId) {
            subSubCatIds.add(p.sub_sub_category_id || p.sub_subcategory_id || p.subSubcategoryId);
          }
          if (p.sub_category_id || p.subcategory_id || p.subcategoryId) {
            subCatIds.add(p.sub_category_id || p.subcategory_id || p.subcategoryId);
          }
          if (p.category_id || p.categoryId || (typeof p.category === 'object' ? p.category?.id : null)) {
            catIds.add(p.category_id || p.categoryId || p.category?.id);
          }
        }

        // Priority 1: Sub-Subcategories of cart items
        for (const sscId of subSubCatIds) {
          if (collected.length >= 15) break;
          const res = await fetchApi(`/products?subSubcategoryId=${sscId}&limit=15`);
          const items = res?.data?.products || res?.products || res?.data || [];
          appendProducts(items);
        }

        // Priority 2: Subcategories of cart items
        if (collected.length < 15) {
          for (const scId of subCatIds) {
            if (collected.length >= 15) break;
            const res = await fetchApi(`/products?subcategoryId=${scId}&limit=15`);
            const items = res?.data?.products || res?.products || res?.data || [];
            appendProducts(items);
          }
        }

        // Priority 3: Categories of cart items
        if (collected.length < 15) {
          for (const cId of catIds) {
            if (collected.length >= 15) break;
            const res = await fetchApi(`/products?categoryId=${cId}&limit=15`);
            const items = res?.data?.products || res?.products || res?.data || [];
            appendProducts(items);
          }
        }

        // Priority 4: General active products fallback if under 15
        if (collected.length < 15) {
          const res = await fetchApi(`/products?limit=20`);
          const items = res?.data?.products || res?.products || res?.data || [];
          appendProducts(items);
        }

        if (isMounted) {
          setRecommendedProducts(collected.slice(0, 15));
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
        if (isMounted) setRecommendedProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCartRecommendations();

    return () => {
      isMounted = false;
    };
  }, [cart?.items?.length, JSON.stringify(cart?.items?.map((i) => i.id || i.product_id || i.productId))]);

  const handleAddToCart = async (item) => {
    setAddingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      if (addToCart) {
        const itemPrice = parseFloat(item.discount_price || item.price || 0);
        await addToCart(item.id, 1, {
          ...item,
          name_en: item.name_en || item.name || item.title,
          name_ar: item.name_ar || item.name || item.title,
          price: itemPrice,
          image: item.image || item.image_url || item.img,
        });
      }
    } catch (e) {
      // Handled in context
    } finally {
      setAddingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 mb-8 select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
          {locale === 'ar' ? 'موصى به لك' : 'Recommended for you'}
        </h2>

        {/* Scroll Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="relative group">
        {/* Left Arrow Overlay on Container */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer hidden sm:flex"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        {/* Right Arrow Overlay on Container */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer hidden sm:flex"
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recommendedProducts.map((item) => {
            const isWishlisted = isInWishlist ? isInWishlist(item.id) : false;
            const isAdding = !!addingIds[item.id];

            const itemImage = item.image || item.image_url || (Array.isArray(item.images) && item.images[0]);
            const itemName = locale === 'ar' ? (item.name_ar || item.name_en || item.title || item.name) : (item.name_en || item.name_ar || item.title || item.name);
            const itemPrice = parseFloat(item.discount_price || item.price || 0);
            const itemMrp = parseFloat(item.price || item.mrp || item.original_price || 0);

            let discountTag = '';
            if (item.vat_percentage && parseFloat(item.vat_percentage) > 0) {
              discountTag = `${Math.round(item.vat_percentage)}% OFF`;
            } else if (itemMrp > itemPrice && itemMrp > 0) {
              discountTag = `${Math.round(((itemMrp - itemPrice) / itemMrp) * 100)}% OFF`;
            }

            const unitText = [item.unit_value, item.unit_type, item.pack_size].filter(Boolean).join(' ') || item.unit || item.tag_en || '';
            const ratingVal = item.rating || item.avg_rating;
            const reviewsCount = item.reviews || item.review_count;
            const badgeText = item.is_best_seller ? (locale === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller') : (item.tag_en || item.tag_ar || '');

            return (
              <div
                key={item.id}
                className="w-[215px] sm:w-[230px] shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between relative group/card"
              >
                {/* Top Section: Badge & Heart */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {/* Badge */}
                    {badgeText ? (
                      <span className="bg-[#043927] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wide font-sans shadow-2xs">
                        {badgeText}
                      </span>
                    ) : <span />}

                    {/* Wishlist Heart */}
                    <button
                      onClick={() => toggleWishlist && toggleWishlist(item)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                      title="Add to Wishlist"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          isWishlisted
                            ? 'text-rose-500 fill-rose-500'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Product Image Box & Floating Action Button */}
                  <div className="relative w-full h-44 bg-[#FAFAFA] rounded-xl flex items-center justify-center p-2 mb-3 border border-slate-100 overflow-hidden">
                    <img
                      src={getImageUrl(itemImage)}
                      alt={itemName}
                      className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover/card:scale-105"
                    />

                    {/* Action Button */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={isAdding}
                      className="absolute bottom-2 right-2 transition-all duration-200 cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs flex items-center justify-center active:scale-95"
                      title="Add to Cart"
                    >
                      {isAdding ? (
                        <div className="w-4 h-4 border-2 border-[#043927] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 h-10 mb-2 font-sans hover:text-[#043927] transition-colors cursor-pointer">
                    {itemName}
                  </h3>

                  {/* Rating Row */}
                  {ratingVal && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                        <span className="font-extrabold text-xs text-slate-900">
                          {ratingVal}
                        </span>
                      </div>
                      {reviewsCount && (
                        <span className="text-xs text-slate-400 font-medium">
                          ({reviewsCount})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price Row */}
                  <div className="flex items-baseline gap-1.5 mb-1 flex-wrap font-sans">
                    <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      SAR {itemPrice.toFixed(2)}
                    </span>
                    {itemMrp > itemPrice && (
                      <span className="text-xs text-slate-400 line-through font-semibold">
                        {itemMrp.toFixed(2)}
                      </span>
                    )}
                    {discountTag && (
                      <span className="text-xs font-black text-emerald-600 font-sans">
                        {discountTag}
                      </span>
                    )}
                  </div>

                  {/* Volume / Unit Price Pill */}
                  {unitText && (
                    <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-md px-2 py-0.5 border border-slate-150 inline-block mb-3">
                      {unitText}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
