'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Star,
  Zap,
  Ban,
  Plus,
  Minus,
  Loader2,
  Check
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../services/api';
import VariantSelectionModal from './VariantSelectionModal';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';

export default function ProductCard({ product, categoryTitle = '' }) {
  const { locale } = useLanguage();
  const { cart, addToCart, updateQuantity, removeItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist ? useWishlist() : { toggleWishlist: () => {}, isInWishlist: () => false };

  const [isBusy, setIsBusy] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    if (product.has_variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const activeVars = product.variants.filter((v) => v.is_active !== false);
      return (activeVars[0] || product.variants[0])?.id || null;
    }
    return null;
  });

  if (!product) return null;

  const isWish = isInWishlist ? isInWishlist(product.id) : false;
  const hasVariants = Boolean(product.has_variants && Array.isArray(product.variants) && product.variants.length > 0);

  // Variant resolution
  let chosenVariant = null;
  if (hasVariants && selectedVariantId) {
    chosenVariant = product.variants.find((v) => String(v.id) === String(selectedVariantId)) || product.variants[0];
  }

  // Price calculations
  const basePrice = chosenVariant ? parseFloat(chosenVariant.price || product.price || 0) : parseFloat(product.price || 0);
  const discountPrice = chosenVariant
    ? (chosenVariant.discount_price ? parseFloat(chosenVariant.discount_price) : null)
    : (product.discount_price ? parseFloat(product.discount_price) : null);

  const isDiscounted = discountPrice !== null && !isNaN(discountPrice) && discountPrice < basePrice;
  const finalPrice = isDiscounted ? discountPrice : basePrice;
  const originalPrice = isDiscounted ? basePrice : (product.purchase_price ? parseFloat(product.purchase_price) : null);

  let discountPercent = 0;
  if (isDiscounted && basePrice > 0) {
    discountPercent = Math.round(((basePrice - discountPrice) / basePrice) * 100);
  }

  // Stock calculations
  const totalVariantStock = hasVariants
    ? product.variants.reduce((acc, v) => acc + parseInt(v.stock_quantity || '0', 10), 0)
    : 0;

  const isOutOfStock = hasVariants
    ? (product.variants.length > 0 && totalVariantStock <= 0)
    : (product.stock_quantity !== undefined && product.stock_quantity !== null && parseInt(product.stock_quantity, 10) <= 0);

  // Specifications label
  const specs = hasVariants
    ? `${product.variants.length} ${locale === 'ar' ? 'خيارات متاحة' : 'Variants Available'}`
    : (product.unit_value && product.unit_type && product.pack_size
      ? `${product.unit_value} ${product.unit_type} (${product.pack_size})`
      : product.unit || (product.unit_value && product.unit_type ? `${product.unit_value} ${product.unit_type}` : (locale === 'ar' ? product.specs_ar : product.specs_en) || (locale === 'ar' ? 'عبوة واحدة' : '1 Pack')));

  // Localized Titles
  const prodTitle = locale === 'ar' ? (product.name_ar || product.name_en) : (product.name_en || product.name_ar);
  const brandName = product.brand || categoryTitle;

  // Image resolution
  let rawImage = product.img || (product.images && (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.image_url)) || product.image_url;
  if (!rawImage && hasVariants) {
    const vTarget = chosenVariant || product.variants[0];
    rawImage = (Array.isArray(vTarget?.images) && vTarget.images.length > 0)
      ? (vTarget.images.find((i) => i.is_primary)?.image_url || vTarget.images[0]?.image_url || (typeof vTarget.images[0] === 'string' ? vTarget.images[0] : null))
      : vTarget?.image_url;
  }
  const resolvedImage = rawImage ? (rawImage.startsWith('http') ? rawImage : getImageUrl(rawImage)) : DEFAULT_FALLBACK_IMAGE;

  // Cart matching
  const getCartItem = () => {
    if (!cart?.items || !product.id) return null;
    return cart.items.find((item) => {
      const matchProduct = item.product_id === product.id || item.productId === product.id || item.product?.id === product.id;
      if (!matchProduct) return false;
      if (selectedVariantId) {
        return String(item.variantId || item.variant_id || '') === String(selectedVariantId);
      }
      return true;
    });
  };

  const cartItem = getCartItem();
  const inCart = Boolean(cartItem && cartItem.quantity > 0);

  // Cart actions
  const handleAddToCart = async () => {
    try {
      setIsBusy(true);
      const prodPayload = {
        ...product,
        variantId: chosenVariant ? chosenVariant.id : null,
        variant_id: chosenVariant ? chosenVariant.id : null,
        price: finalPrice,
        discount_price: discountPrice,
        stock_quantity: chosenVariant ? chosenVariant.stock_quantity : product.stock_quantity,
      };
      await addToCart(product.id, 1, prodPayload);
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleIncrement = async () => {
    if (!cartItem) {
      await handleAddToCart();
      return;
    }
    try {
      setIsBusy(true);
      await updateQuantity(cartItem.id, cartItem.quantity + 1);
    } catch (err) {
      console.error('Increment failed:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDecrement = async () => {
    if (!cartItem) return;
    try {
      setIsBusy(true);
      if (cartItem.quantity <= 1) {
        await removeItem(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, cartItem.quantity - 1);
      }
    } catch (err) {
      console.error('Decrement failed:', err);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-lg transition-all duration-300 p-3 sm:p-3.5 flex flex-col justify-between relative h-full">
      
      {/* Top Badges & Wishlist Header */}
      <div className="flex items-center justify-between z-10 mb-1 gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs">
              <Ban className="w-2.5 h-2.5 text-white" />
              <span>{locale === 'ar' ? 'نفذت الكمية' : 'OUT OF STOCK'}</span>
            </span>
          ) : (
            <>
              {Boolean(product.is_best_seller) && (
                <span className="px-2 py-0.5 rounded-full bg-[#FFA500] text-white font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                  <Star className="w-2.5 h-2.5 fill-current text-white" />
                  <span>{locale === 'ar' ? 'الأكثر مبيعاً' : 'BEST SELLER'}</span>
                </span>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (toggleWishlist) toggleWishlist(product);
          }}
          className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-1 ml-auto rounded-full hover:bg-rose-50"
          title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${isWish ? 'text-rose-500 fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image Link */}
      <Link
        href={`/products/${product.id}`}
        className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center my-1.5 relative cursor-pointer group-hover:bg-[#F3F4F6] transition-colors"
      >
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
            </span>
          </div>
        )}
        <img
          src={resolvedImage}
          alt={prodTitle}
          className={`w-full h-full object-contain transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
          }}
        />
      </Link>

      {/* Product Information */}
      <div className="space-y-1 pt-0.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock Status */}
          <div className="flex items-center justify-between text-[11px] font-medium leading-none mb-1">
            <span className="text-slate-400 truncate max-w-[120px] sm:max-w-[140px]">{brandName}</span>
            {isOutOfStock ? (
              <span className="text-rose-600 font-bold shrink-0 text-[10px]">
                {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
              </span>
            ) : hasVariants ? (
              <span className="text-[#00B074] font-bold shrink-0 text-[10px]">
                {locale === 'ar' ? 'متوفر بخيارات' : 'Multi-Variant'}
              </span>
            ) : (
              <span className="text-[#00B074] font-bold shrink-0 text-[10px]">
                {locale === 'ar' ? 'متوفر' : 'In Stock'}
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            href={`/products/${product.id}`}
            className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug group-hover:text-[#043927] transition-colors mb-1 block"
            title={prodTitle}
          >
            {prodTitle}
          </Link>

          {/* Specs / Pack Details */}
          <p className="text-[10px] text-slate-400 font-normal truncate mb-1">
            {specs}
          </p>

          {/* Rating */}
          <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 font-normal text-[10px]">
              {(() => {
                const feedbacks = Array.isArray(product.feedbacks)
                  ? product.feedbacks
                  : (product.feedback ? [product.feedback] : []);

                const hasFeedbacks = feedbacks.length > 0;
                const feedbackRating = hasFeedbacks
                  ? (feedbacks.reduce((sum, f) => sum + Number(f.rating || 0), 0) / feedbacks.length).toFixed(1)
                  : (product.rating !== undefined && product.rating !== null ? Number(product.rating).toFixed(1) : null);

                const feedbackCount = hasFeedbacks
                  ? feedbacks.length
                  : (product.reviews_count !== undefined && product.reviews_count !== null ? Number(product.reviews_count) : (product.reviews ? Number(product.reviews) : 0));

                if (feedbackRating && feedbackCount > 0) {
                  return (
                    <>
                      <span className="text-amber-400 font-bold">★</span>
                      <span className="font-bold text-slate-700">{feedbackRating}</span>
                      <span className="text-slate-400">({feedbackCount.toLocaleString()})</span>
                    </>
                  );
                }

                return (
                  <span className="text-slate-400 font-medium text-[10px]">
                    {locale === 'ar' ? '' : ''}
                  </span>
                );
              })()}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {locale === 'ar' ? 'شامل الضريبة' : 'VAT incl.'}
            </span>
          </div>
        </div>

        {/* Pricing & CTA Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 mt-auto">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-sm sm:text-[15px] font-black text-slate-900 whitespace-nowrap leading-tight">
              <span className="text-[10px] font-bold text-slate-500 mr-0.5">SAR</span>
              {finalPrice.toFixed(2)}
            </span>
            {!hasVariants && originalPrice && (
              <span className="text-[10px] text-slate-400 line-through font-normal whitespace-nowrap">
                SAR {originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Actions: Out of stock, Multi-variant select, Quantity controls, Add to Cart */}
          {(() => {
            if (isOutOfStock) {
              return (
                <button
                  type="button"
                  disabled
                  className="h-8 w-full rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                >
                  <Ban className="w-3.5 h-3.5 text-slate-400" />
                  <span>{locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}</span>
                </button>
              );
            }

            if (hasVariants) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsVariantModalOpen(true);
                  }}
                  className="h-8 w-full rounded-xl bg-[#043927] hover:bg-[#006E2D] active:scale-95 text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{locale === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
                </button>
              );
            }

            if (inCart) {
              return (
                <div className="h-8 w-full bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between p-0.5 px-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDecrement();
                    }}
                    disabled={isBusy}
                    className="w-6.5 h-6.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    title={cartItem.quantity === 1 ? 'Remove' : 'Decrease'}
                  >
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  </button>

                  <span className="flex-1 text-center text-xs font-black text-slate-900 select-none">
                    {isBusy ? (
                      <Loader2 className="w-3 h-3 animate-spin mx-auto text-emerald-600" />
                    ) : (
                      cartItem.quantity
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleIncrement();
                    }}
                    disabled={isBusy || (product.stock_quantity !== undefined && product.stock_quantity !== null && cartItem.quantity >= product.stock_quantity)}
                    className="w-6.5 h-6.5 rounded-lg bg-[#00B074] hover:bg-[#009663] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    title="Increase"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={isBusy}
                className="h-8 w-full rounded-xl bg-[#043927] hover:bg-[#006E2D] active:scale-95 text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{locale === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Multi-Variant Add to Cart Selection Modal */}
      {hasVariants && (
        <VariantSelectionModal
          product={product}
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
        />
      )}
    </div>
  );
}
