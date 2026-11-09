'use client';
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  Loader2,
  Package,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getImageUrl } from '../services/api';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';

export default function VariantSelectionModal({ product, isOpen, onClose }) {
  const { locale } = useLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [quantities, setQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or initialize state whenever modal opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      const initial = {};
      const activeVars = (product.variants || []).filter((v) => v.is_active !== false);
      activeVars.forEach((v) => {
        initial[v.id] = 0;
      });
      setQuantities(initial);
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const activeVariants = (product.variants || []).filter((v) => v.is_active !== false);
  const prodTitle = locale === 'ar' ? (product.name_ar || product.name_en) : (product.name_en || product.name_ar);

  // Product main image fallback
  let mainProdImg = product.img || product.image_url;
  if (!mainProdImg && Array.isArray(product.images) && product.images.length > 0) {
    mainProdImg = typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.image_url;
  }

  // Handle increment
  const handleIncrement = (variantId, maxStock) => {
    setQuantities((prev) => {
      const current = prev[variantId] || 0;
      const limit = maxStock !== undefined && maxStock !== null ? parseInt(maxStock, 10) : 999;
      if (current >= limit) {
        showToast(
          locale === 'ar'
            ? `الكمية المتوفرة في المخزون هي ${limit} فقط`
            : `Only ${limit} items available in stock`,
          'info'
        );
        return prev;
      }
      return { ...prev, [variantId]: current + 1 };
    });
  };

  // Handle decrement
  const handleDecrement = (variantId) => {
    setQuantities((prev) => {
      const current = prev[variantId] || 0;
      if (current <= 0) return prev;
      return { ...prev, [variantId]: current - 1 };
    });
  };

  // Calculate totals
  let totalSelectedQty = 0;
  let totalSelectedPrice = 0;

  activeVariants.forEach((v) => {
    const qty = quantities[v.id] || 0;
    if (qty > 0) {
      totalSelectedQty += qty;
      const basePrice = parseFloat(v.price || product.price || 0);
      const discountPrice = v.discount_price ? parseFloat(v.discount_price) : null;
      const effectivePrice = discountPrice && discountPrice < basePrice ? discountPrice : basePrice;
      totalSelectedPrice += effectivePrice * qty;
    }
  });

  // Handle Confirm Submission
  const handleConfirm = async () => {
    if (totalSelectedQty === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const itemsToAdd = activeVariants.filter((v) => (quantities[v.id] || 0) > 0);

      // Add each selected variant to cart
      for (const v of itemsToAdd) {
        const qty = quantities[v.id];

        // Resolve variant primary image
        let varImg = null;
        if (Array.isArray(v.images) && v.images.length > 0) {
          const primary = v.images.find((i) => i.is_primary) || v.images[0];
          varImg = typeof primary === 'string' ? primary : primary?.image_url;
        } else if (v.image_url) {
          varImg = v.image_url;
        }
        if (!varImg) {
          varImg = mainProdImg;
        }

        const variantData = {
          ...product,
          variantId: v.id,
          variant_id: v.id,
          sku: v.sku,
          price: v.price,
          discount_price: v.discount_price,
          stock_quantity: v.stock_quantity,
          unit_value: v.unit_value,
          unit_type: v.unit_type,
          pack_size: v.pack_size,
          image: varImg,
        };

        await addToCart(product.id, qty, variantData, { silent: true });
      }

      showToast(
        locale === 'ar'
          ? `تمت إضافة ${totalSelectedQty} خيار إلى السلة بنجاح! 🛒`
          : `Added ${totalSelectedQty} item(s) to cart successfully! 🛒`,
        'success'
      );

      onClose();
    } catch (err) {
      console.error('Failed to add variants to cart:', err);
      showToast(err.message || (locale === 'ar' ? 'فشل إضافة الخيارات للسلة' : 'Failed to add variants to cart'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006E2D] flex items-center justify-center shrink-0 border border-emerald-100">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {prodTitle}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {locale === 'ar' ? 'اختر الكميات والأحجام المطلوبة' : 'Select options and quantities'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Variants List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100/80">
          {activeVariants.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              {locale === 'ar' ? 'لا توجد خيارات متاحة حالياً' : 'No active variants available'}
            </div>
          ) : (
            activeVariants.map((v, index) => {
              // Resolve variant image
              let variantImgRaw = null;
              if (Array.isArray(v.images) && v.images.length > 0) {
                const primary = v.images.find((i) => i.is_primary) || v.images[0];
                variantImgRaw = typeof primary === 'string' ? primary : primary?.image_url;
              } else if (v.image_url) {
                variantImgRaw = v.image_url;
              }
              if (!variantImgRaw) {
                variantImgRaw = mainProdImg;
              }

              const resolvedImg = variantImgRaw
                ? (variantImgRaw.startsWith('http') ? variantImgRaw : getImageUrl(variantImgRaw))
                : DEFAULT_FALLBACK_IMAGE;

              // Price
              const basePrice = parseFloat(v.price || product.price || 0);
              const discountPrice = v.discount_price ? parseFloat(v.discount_price) : null;
              const hasDiscount = discountPrice !== null && !isNaN(discountPrice) && discountPrice < basePrice;
              const finalPrice = hasDiscount ? discountPrice : basePrice;

              // Stock
              const stock = v.stock_quantity !== undefined && v.stock_quantity !== null ? parseInt(v.stock_quantity, 10) : 0;
              const isOut = stock <= 0;
              const isLow = stock > 0 && stock <= 5;

              // Variant label / pack size
              const labelParts = [];
              if (v.unit_value && v.unit_type) {
                labelParts.push(`${v.unit_value} ${v.unit_type}`);
              } else if (v.unit_value) {
                labelParts.push(v.unit_value);
              }
              if (v.pack_size) {
                labelParts.push(`(${v.pack_size})`);
              }
              const displayLabel = labelParts.length > 0 ? labelParts.join(' ') : (v.sku || `Option ${index + 1}`);

              const selectedQty = quantities[v.id] || 0;

              return (
                <div
                  key={v.id || index}
                  className={`pt-3 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-2xl transition-all ${
 selectedQty > 0 ? 'bg-emerald-50/50 border border-emerald-200/80 shadow-2xs' : 'hover:bg-slate-50/70 border border-transparent'
 }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-slate-200 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={resolvedImg}
                        alt={displayLabel}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {displayLabel}
                        </span>
                        {hasDiscount && (
                          <span className="text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded-md">
                            {Math.round(((basePrice - discountPrice) / basePrice) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      {/* Stock Badge */}
                      <div className="mt-0.5">
                        {isOut ? (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                            {locale === 'ar' ? 'نفذت الكمية' : 'Out of stock'}
                          </span>
                        ) : isLow ? (
                          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                            {locale === 'ar' ? `متبقي ${stock} فقط!` : `Only ${stock} left in stock!`}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            {locale === 'ar' ? 'متوفر بالمخزون' : 'In stock'}
                          </span>
                        )}
                      </div>

                      {/* Price in SAR */}
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm sm:text-base font-black text-[#043927]">
                          SAR {finalPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through font-normal">
                            SAR {basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Controls */}
                  <div className="shrink-0 flex items-center">
                    {isOut ? (
                      <button
                        type="button"
                        disabled
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed"
                      >
                        {locale === 'ar' ? 'غير متوفر' : 'Unavailable'}
                      </button>
                    ) : selectedQty === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleIncrement(v.id, stock)}
                        disabled={isSubmitting}
                        className="w-9 h-9 rounded-xl bg-[#006E2D] hover:bg-[#008938] text-white flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title={locale === 'ar' ? 'إضافة' : 'Add'}
                      >
                        <Plus className="w-5 h-5 stroke-[2.8]" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-300 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleDecrement(v.id)}
                          disabled={isSubmitting}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                          title={locale === 'ar' ? 'إنقاص' : 'Decrease'}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        <span className="min-w-[24px] text-center font-black text-sm text-[#006E2D] select-none">
                          {selectedQty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleIncrement(v.id, stock)}
                          disabled={isSubmitting || selectedQty >= stock}
                          className="w-7 h-7 rounded-lg bg-[#006E2D] hover:bg-[#008938] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={locale === 'ar' ? 'زيادة' : 'Increase'}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Green Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-bold">
              {totalSelectedQty === 0
                ? (locale === 'ar' ? 'لم يتم تحديد خيارات' : 'No options selected')
                : (locale === 'ar' ? `${totalSelectedQty} خيارات مختارة` : `${totalSelectedQty} item(s) selected`)}
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              SAR {totalSelectedPrice.toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={totalSelectedQty === 0 || isSubmitting}
            className="flex-1 max-w-[200px] sm:max-w-[240px] h-12 rounded-2xl bg-[#006E2D] hover:bg-[#005824] active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>{locale === 'ar' ? 'جاري الإضافة...' : 'Adding...'}</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{locale === 'ar' ? 'تأكيد الإضافة' : 'Confirm'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
