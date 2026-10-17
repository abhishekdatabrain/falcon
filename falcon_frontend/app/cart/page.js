'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { fetchApi, getImageUrl } from '@/src/services/api';
import RecommendedProducts from '@/src/components/RecommendedProducts';
import CouponCard from '@/src/components/CouponCard';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  ArrowLeft,
  Lock,
  Tag,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export default function CartPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const itemsToDisplay = cart?.items || [];

  // Helper to calculate effective price per item
  const getItemPrice = (item) => {
    const p = parseFloat(item.price || 0);
    const dp = item.discount_price ? parseFloat(item.discount_price) : null;
    if (dp && dp > 0 && dp < p) return dp;
    if (dp && dp > 0 && !p) return dp;
    return p > 0 ? p : (dp || 0);
  };

  // Helper to calculate MRP / original price per item
  const getItemMrp = (item, effectivePrice) => {
    const p = parseFloat(item.price || 0);
    const m = parseFloat(item.mrp || 0);
    if (m && m > effectivePrice) return m;
    if (p && p > effectivePrice) return p;
    return null;
  };

  // Dynamic calculations
  const calculateSubtotal = () => {
    if (cart?.subtotal) return parseFloat(cart.subtotal);
    return itemsToDisplay.reduce((acc, item) => {
      const price = getItemPrice(item);
      return acc + (price * (item.quantity || 1));
    }, 0);
  };

  const calculateTotalSavings = () => {
    return itemsToDisplay.reduce((acc, item) => {
      const price = getItemPrice(item);
      const mrp = getItemMrp(item, price);
      if (mrp && mrp > price) {
        return acc + ((mrp - price) * (item.quantity || 1));
      }
      return acc;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const totalSavings = calculateTotalSavings();
  const shippingFee = 0.0; // Free delivery

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountAmount) return appliedCoupon.discountAmount;
    if (appliedCoupon.discount_type === 'FIXED') {
      return Math.min(subtotal, parseFloat(appliedCoupon.discount_value || 0));
    }
    const pct = parseFloat(appliedCoupon.discount_value) || (appliedCoupon.code === 'WELCOME10' ? 10 : 15);
    return Math.round((subtotal * pct) / 100 * 100) / 100;
  };

  const handleCartApplyCoupon = async (code) => {
    try {
      const res = await fetchApi('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      });
      if (res.success && res.data?.valid) {
        setAppliedCoupon({
          code: res.data.coupon.code,
          discountAmount: res.data.discountAmount,
          discount_type: res.data.coupon.discount_type,
          discount_value: res.data.coupon.discount_value,
        });
      } else {
        setAppliedCoupon({ code });
      }
    } catch (_) {
      setAppliedCoupon({ code });
    }
  };

  const couponDiscount = calculateCouponDiscount();
  const grandTotal = Math.max(0, subtotal + shippingFee - couponDiscount);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">
          {locale === 'ar' ? 'جاري تحميل السلة...' : 'Loading your cart...'}
        </span>
      </div>
    );
  }

  if (itemsToDisplay.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
              </h1>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-5 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {locale === 'ar' ? 'سلتك فارغة' : 'Your cart is empty'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {locale === 'ar' ? 'أضف منتجات لتبدأ التسوق' : 'Add items to get started'}
            </p>
          </div>
          <Link
            href="/products"
            className="mt-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2"
          >
            {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      {/* Top Header Section */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title={locale === 'ar' ? 'الرجوع للمنتجات' : 'Back to products'}
              >
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                  </h1>
                  <span className="bg-emerald-100/70 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    {itemsToDisplay.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {locale === 'ar'
                    ? `لديك ${itemsToDisplay.length} منتج في سلة التسوق`
                    : `${itemsToDisplay.length} ${itemsToDisplay.length === 1 ? 'item' : 'items'} ready for checkout`}
                </p>
              </div>
            </div>

            <button
              onClick={() => clearCart()}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
              title={locale === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: Cart Item Cards List (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">

           

            {/* Items List */}
            <div className="space-y-3">
              {itemsToDisplay.map((item) => {
                const itemPrice = getItemPrice(item);
                const itemMrp = getItemMrp(item, itemPrice);
                const hasDiscount = itemMrp && itemMrp > itemPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100)
                  : null;
                const lineTotal = itemPrice * (item.quantity || 1);

                // Size label formatting
                const sizeLabel = [item.unit_value, item.unit_type, item.pack_size]
                  .filter((v) => v !== null && v !== undefined && v !== '')
                  .join(' ') || item.size || null;

                const itemName = locale === 'ar'
                  ? (item.name_ar || item.name_en)
                  : (item.name_en || item.name_ar);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all relative group"
                  >
                    <div className="flex items-start gap-4 sm:gap-5">

                      {/* Product Thumbnail */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {hasDiscount && (
                          <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-xs z-10">
                            {discountPercent}% OFF
                          </span>
                        )}
                        <img
                          src={getImageUrl(item.image)}
                          alt={itemName}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      {/* Main Info Column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        <div className="space-y-1.5">
                          {/* Title & Top Delete Button */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                              {itemName}
                            </h3>

                            {/* Delete / Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
                              title={locale === 'ar' ? 'حذف من السلة' : 'Remove item'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Unit / Weight Tag & Fast Delivery Tag */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {sizeLabel && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {sizeLabel}
                              </span>
                            )}

                           
                          </div>
                        </div>

                        {/* Bottom Row: Quantity Stepper & Price Breakdown */}
                        <div className="flex flex-wrap items-end justify-between gap-3 pt-3 mt-1 border-t border-slate-100">

                          {/* Modern Quantity Stepper */}
                          <div className="inline-flex items-center bg-slate-50 rounded-xl border border-slate-200/90 p-1 shadow-2xs">
                            <button
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeItem(item.id);
                                } else {
                                  updateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                item.quantity <= 1
                                  ? 'hover:bg-rose-100 text-rose-600'
                                  : 'hover:bg-slate-200 text-slate-700'
                              }`}
                              title={item.quantity <= 1 ? 'Remove' : 'Decrease'}
                            >
                              {item.quantity <= 1 ? (
                                <Trash2 className="w-3.5 h-3.5" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                              )}
                            </button>

                            <span className="w-9 text-center font-extrabold text-sm text-slate-900 select-none">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-900 border border-slate-200/60 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Price Display */}
                          <div className="text-right flex flex-col items-end">
                            <div className="flex items-baseline gap-1 text-slate-900">
                              <span className="text-xs font-bold text-slate-500">SAR</span>
                              <span className="text-lg sm:text-xl font-black tracking-tight">
                                {lineTotal.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                              {hasDiscount && (
                                <span className="line-through">
                                  SAR {(itemMrp * (item.quantity || 1)).toFixed(2)}
                                </span>
                              )}
                              {item.quantity > 1 && (
                                <span className="text-slate-500">
                                  (SAR {itemPrice.toFixed(2)} {locale === 'ar' ? 'لكل قطعة' : 'each'})
                                </span>
                              )}
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* RIGHT COLUMN: Coupon Box & Order Summary Box (4 Columns) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">

            {/* Coupon Card */}
            <CouponCard
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleCartApplyCoupon}
              onRemoveCoupon={() => setAppliedCoupon(null)}
            />

            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-800">
                  {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>
                <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-full">
                  {itemsToDisplay.length} {itemsToDisplay.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Breakdown */}
              <div className="space-y-3.5 text-sm">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>{t('cart.subtotal') || (locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal')}</span>
                  <div className="flex items-center gap-2">
                    {totalSavings > 0 && (
                      <span className="text-slate-400 line-through text-xs">
                        SAR {(subtotal + totalSavings).toFixed(2)}
                      </span>
                    )}
                    <span className="font-extrabold text-slate-900">
                      SAR {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery Fee */}
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>{locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                  <span className="text-emerald-700 font-black text-xs uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {locale === 'ar' ? 'مجاني' : 'FREE'}
                  </span>
                </div>

                {/* Coupon Discount (if applied) */}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? `خصم الكوبون (${appliedCoupon.code})` : `Coupon (${appliedCoupon.code})`}</span>
                    </span>
                    <span>-SAR {couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Total Savings Highlight Pill */}
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 text-amber-900 px-3 py-2 rounded-xl border border-amber-200 text-xs font-bold">
                    <span>{locale === 'ar' ? 'إجمالي توفيرك' : 'Total Savings'}</span>
                    <span>SAR {totalSavings.toFixed(2)}</span>
                  </div>
                )}

                {/* Dotted Divider */}
                <div className="border-t border-dashed border-slate-200 pt-2" />

                {/* Grand Total */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-base font-bold text-slate-900 block">
                      {locale === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                    </span>
                   
                  </div>
                  <div className="flex items-baseline gap-1 text-lg font-bold text-slate-900">
                    <span className="text-sm font-bold text-slate-500">SAR</span>
                    <span>{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href={user && user.role === 'CUSTOMER' ? '/checkout' : '/login?redirect=/checkout'}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer text-center group"
              >
                <span>{locale === 'ar' ? 'المتابعة للشراء' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{locale === 'ar' ? 'دفع إلكتروني آمن ومشفر بالكامل' : '100% Secure & Encrypted Checkout'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{locale === 'ar' ? 'ضمان جودة ونضارة المنتجات' : 'Quality Freshness Guaranteed'}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Recommended Products Carousel / Section */}
        <div className="mt-12">
          <RecommendedProducts />
        </div>

      </div>

    </div>
  );
}
