'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  Heart,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Ban,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWishlist } from '../contexts/WishlistContext';
import { fetchApi, getImageUrl } from '../services/api';

const FALLBACK_RECOMMENDED_PRODUCTS = [];

export default function RecommendedProducts() {
  const { cart, addToCart, updateQuantity, removeItem } = useCart();
  const { locale } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist ? useWishlist() : { toggleWishlist: () => { }, isInWishlist: () => false };
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
          if (collected.length > 0) {
            setRecommendedProducts(collected.slice(0, 15));
          } else {
            setRecommendedProducts(FALLBACK_RECOMMENDED_PRODUCTS);
          }
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
        if (isMounted) {
          setRecommendedProducts(FALLBACK_RECOMMENDED_PRODUCTS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCartRecommendations();

    return () => {
      isMounted = false;
    };
  }, [cart?.items?.length, JSON.stringify(cart?.items?.map((i) => i.id || i.product_id || i.productId))]);

  const handleAddToCart = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      if (addToCart) {
        const itemPrice = parseFloat(item.discount_price || item.price || 0);
        await addToCart(item.id, 1, {
          ...item,
          name_en: item.name_en || item.name || item.title,
          name_ar: item.name_ar || item.name || item.title,
          price: itemPrice,
          image: item.image || item.image_url || (Array.isArray(item.images) && item.images[0]?.image_url),
        });
      }
    } catch (e) {
      // Handled in context
    } finally {
      setAddingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleToggleWishlist = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist) {
      toggleWishlist(item);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayList = recommendedProducts.length > 0 ? recommendedProducts : FALLBACK_RECOMMENDED_PRODUCTS;

  return (
    <section className="mt-12 mb-5 select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
          {locale === 'ar' ? 'موصى به لك' : 'Recommended for you'}
        </h2>

        {/* Scroll Controls (Desktop Header) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer hover:shadow-xs active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer hover:shadow-xs active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="relative group/carousel">
        {/* Left Arrow Overlay on Container Edge */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-3.5 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-800 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer active:scale-95 hidden sm:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        {/* Right Arrow Overlay on Container Edge */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-3.5 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-800 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer active:scale-95 hidden sm:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayList.map((item) => {
            const isWishlisted = isInWishlist ? isInWishlist(item.id) : false;
            const isAdding = !!addingIds[item.id];

            const itemImage = item.image || item.image_url || (Array.isArray(item.images) && item.images[0]?.image_url);
            const itemName = locale === 'ar' ? (item.name_ar || item.name_en || item.title || item.name) : (item.name_en || item.name_ar || item.title || item.name);
            const brandName = item.brand || (locale === 'ar' ? 'فالكون فريش' : 'Falcon Fresh');
            const itemPrice = parseFloat(item.discount_price || item.price || 0);
            const itemMrp = parseFloat(item.price || item.mrp || item.original_price || (itemPrice * 1.25));

            const hasRatings = (item.reviews_count !== undefined && item.reviews_count !== null && Number(item.reviews_count) > 0) || (item.rating !== undefined && item.rating !== null && Number(item.rating) > 0);
            const ratingVal = hasRatings && item.rating ? Number(item.rating).toFixed(1) : null;
            const reviewsVal = hasRatings ? Number(item.reviews_count || item.reviews || 0).toLocaleString() : 0;
            const isOutOfStock = item.stock_quantity !== undefined && item.stock_quantity !== null && parseInt(item.stock_quantity, 10) <= 0;

            // Check if product is multi-variant
            const hasVariants = Boolean(
              item.has_variants ||
              (Array.isArray(item.variants) && item.variants.length > 0)
            );
            const variantCount = Array.isArray(item.variants) ? item.variants.length : 2;

            // Check if already in cart
            const cartItem = cart?.items?.find((i) => String(i.product_id || i.id || i.productId) === String(item.id));
            const inCart = Boolean(cartItem && cartItem.quantity > 0);

            /* ==============================================================
             * DESIGN CASE 2: MULTI-VARIANT PRODUCT CARD
             * Shows 'Multi-Variant' tag, variant count, and 'Select Options'
             * ============================================================== */
            if (hasVariants) {
              return (
                <div
                  key={item.id}
                  className="w-[215px] sm:w-[230px] shrink-0 bg-white rounded-[26px] border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between relative group/card"
                >
                  {/* Top Header: Optional Badge & Heart */}
                  <div className="flex items-center justify-between mb-2">
                    {item.is_best_seller ? (
                      <span className="bg-[#FFA800] text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs font-sans uppercase tracking-wider">
                        <span>★</span>
                        <span>{locale === 'ar' ? 'الأكثر مبيعاً' : 'BEST SELLER'}</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, item)}
                      className="p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Wishlist"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${isWishlisted
                            ? 'text-[#FF1E56] fill-[#FF1E56]'
                            : 'text-slate-300 hover:text-[#FF1E56] stroke-[1.8]'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Top Section: Image Box + Info */}
                  <div>
                    {/* Rounded Image Box */}
                    <div className="relative w-full h-44 sm:h-48 bg-[#F5F6F8] rounded-[20px] flex items-center justify-center p-3 mb-2.5 overflow-hidden">
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-[20px]">
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
                          </span>
                        </div>
                      )}
                      <Link href={`/products/${item.id}`} className="w-full h-full flex items-center justify-center">
                        <img
                          src={getImageUrl(itemImage)}
                          alt={itemName}
                          className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover/card:scale-105'
                            }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400';
                          }}
                        />
                      </Link>
                    </div>

                    {/* Multi-Variant Text Label (Top Right) */}
                    <div className="flex items-center justify-end mb-1">
                      <span className="text-[#00B074] font-bold text-xs sm:text-[13px] font-sans">
                        {locale === 'ar' ? 'متوفر بخيارات' : 'Multi-Variant'}
                      </span>
                    </div>

                    {/* Product Title */}
                    <Link href={`/products/${item.id}`}>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 mb-0.5 font-sans hover:text-[#043927] transition-colors">
                        {itemName}
                      </h3>
                    </Link>

                    {/* Variants Available Subtext */}
                    <p className="text-xs sm:text-[13px] text-slate-400 font-medium mb-1.5">
                      {variantCount > 0
                        ? `${variantCount} ${locale === 'ar' ? 'خيارات متوفرة' : 'Variants Available'}`
                        : (locale === 'ar' ? 'خيارات متعددة متوفرة' : '2 Variants Available')}
                    </p>

                    {/* Rating Row */}
                    <div className="flex items-center gap-1 mb-2">
                      {hasRatings ? (
                        <>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{ratingVal}</span>
                          <span className="text-xs sm:text-sm text-slate-400">({reviewsVal})</span>
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm text-slate-400 font-medium">
                          {locale === 'ar' ? '' : ''}
                        </span>
                      )}
                    </div>

                    {/* Subtle Divider Line */}
                    <div className="border-t border-slate-100 my-2" />

                    {/* Price */}
                    <div className="text-lg sm:text-xl font-black text-slate-900 mb-2.5 font-sans tracking-tight">
                      <span className="text-xs font-bold text-slate-500 mr-1">SAR</span>
                      {itemPrice.toFixed(2)}
                    </div>
                  </div>

                  {/* Green Select Options Button (Full Width) */}
                  <div className="mt-auto pt-1">
                    <Link
                      href={`/products/${item.id}`}
                      className="w-full py-2.5 rounded-2xl bg-[#006E2D] hover:bg-[#008938] text-white font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 font-sans"
                    >
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                      <span>{locale === 'ar' ? 'اختر الخيارات' : 'Select Options'}</span>
                    </Link>
                  </div>
                </div>
              );
            }

            /* ==============================================================
             * DESIGN CASE 1: STANDARD / NON-VARIANT PRODUCT CARD
             * Matching user's second image:
             * Best Seller badge, Heart, Image, Brand & 'In Stock',
             * Title, Rating with divider, SAR Price + Strikethrough,
             * and Full-Width Green 'Add to Cart' Button!
             * ============================================================== */
            return (
              <div
                key={item.id}
                className="w-[215px] sm:w-[230px] shrink-0 bg-white rounded-[26px] border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between relative group/card"
              >
                {/* Top Section: Badge (Left) & Heart (Right) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {/* Best Seller Badge */}
                    {item.is_best_seller ? (
                      <span className="bg-[#FFA800] text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs font-sans uppercase tracking-wider">
                        <span>★</span>
                        <span>{locale === 'ar' ? 'الأكثر مبيعاً' : 'BEST SELLER'}</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    {/* Wishlist Heart */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, item)}
                      className="p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Wishlist"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${isWishlisted
                            ? 'text-[#FF1E56] fill-[#FF1E56]'
                            : 'text-slate-300 hover:text-[#FF1E56] stroke-[1.8]'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Rounded Image Box (Clean without floating button) */}
                  <div className="relative w-full h-25 sm:h-48 bg-[#F5F6F8] rounded-[20px] flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-[20px]">
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
                        </span>
                      </div>
                    )}
                    <Link href={`/products/${item.id}`} className="w-full h-full flex items-center justify-center">
                      <img
                        src={getImageUrl(itemImage)}
                        alt={itemName}
                        className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover/card:scale-105'
                          }`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';
                        }}
                      />
                    </Link>
                  </div>

                  {/* Brand & Stock Status Row */}
                  <div className="flex items-center justify-between text-xs mb-1 font-sans">
                    <span className="text-slate-400 font-medium truncate max-w-[125px]">
                      {brandName}
                    </span>
                    <span
                      className={`font-bold shrink-0 text-xs ${isOutOfStock ? 'text-rose-600' : 'text-[#00B074]'
                        }`}
                    >
                      {isOutOfStock
                        ? (locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                        : (locale === 'ar' ? 'متوفر' : 'In Stock')}
                    </span>
                  </div>

                  {/* Product Title */}
                  <Link href={`/products/${item.id}`}>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 mb-1 font-sans hover:text-[#043927] transition-colors">
                      {itemName}
                    </h3>
                    <span className="text-xs font-medium text-slate-500">{item.unit_value} {item.unit_type}</span>
                  </Link>

                  {/* Rating Row */}
                  <div className="flex items-center gap-1 mb-2">
                    {hasRatings ? (
                      <>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-bold text-xs sm:text-sm text-slate-700">{ratingVal}</span>
                        <span className="text-xs sm:text-sm text-slate-400">({reviewsVal})</span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-400 font-medium">
                        {locale === 'ar' ? '' : ''}
                      </span>
                    )}
                  </div>

                  {/* Subtle Divider Line */}
                  <div className="border-t border-slate-100 my-2" />

                  {/* Price Row: SAR 40.00 + SAR 50.00 (strikethrough) */}
                  <div className="flex items-baseline gap-2 font-inter flex-wrap">
                    <span className="text-sm sm:text-xl font-black text-slate-800 font-sans tracking-tight">
                      <span className="text-xs font-bold text-slate-500 mr-0.5">SAR</span>
                      {itemPrice.toFixed(2)}
                    </span>
                    {itemMrp > itemPrice && (
                      <span className="text-xs sm:text-sm text-slate-600 line-through font-normal whitespace-nowrap">
                        SAR {itemMrp.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Full-Width Action Button: Add to Cart (or Quantity Stepper if in Cart) */}
                <div className="mt-auto pt-1">
                  {inCart ? (
                    <div className="w-full py-1.5 px-3 rounded-2xl bg-[#006E2D] text-white font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-between font-sans">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (cartItem.quantity <= 1) {
                            removeItem(cartItem.id);
                          } else {
                            updateQuantity(cartItem.id, cartItem.quantity - 1);
                          }
                        }}
                        className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <span className="font-black text-sm">{cartItem.quantity}</span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateQuantity(cartItem.id, cartItem.quantity + 1);
                        }}
                        className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => !isOutOfStock && handleAddToCart(e, item)}
                      disabled={isAdding || isOutOfStock}
                      className={`w-full py-2 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all font-sans ${isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-[#006E2D] hover:bg-[#008938] text-white cursor-pointer active:scale-98 shadow-sm hover:shadow'
                        }`}
                    >
                      {isAdding ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isOutOfStock ? (
                        <>
                          <Ban className="w-4 h-4" />
                          <span>{locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                          <span>{locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>
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
