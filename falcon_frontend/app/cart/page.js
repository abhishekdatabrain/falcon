'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getImageUrl } from '../../src/services/api';
import RecommendedProducts from '../../src/components/RecommendedProducts';
import CouponCard from '../../src/components/CouponCard';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Truck,
  Store,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const DEMO_CART_ITEMS = [
  {
    id: 'demo-1',
    name_en: 'Al Baker - All Purpose Flour 2kg',
    name_ar: 'الباكر - طحين لجميع الاستخدامات ٢ كجم',
    size: '2 kg',
    price: '10.45',
    mrp: '17.71',
    discountPercent: '41%',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    deliveryTime: '1 HR 10 MINS',
    salesCount: '160+ sold recently',
    seller: 'Falcon Grocery',
    offers: [
      { text_en: 'Extra 15% off', text_ar: 'خصم إضافي ١٥٪' },
      { text_en: '15% cashback up to SAR 15', text_ar: 'كاشباك ١٥٪ حتى ١٥ ريال' },
      { text_en: 'Extra 10% off', text_ar: 'خصم إضافي ١٠٪' },
      { text_en: '10% cashback up to SAR 10', text_ar: 'كاشباك ١٠٪ حتى ١٠ ريال' },
    ]
  },
  {
    id: 'demo-2',
    name_en: 'Almarai Fresh Whole Milk 2 Liters',
    name_ar: 'حليب المراعي طازج كامل الدسم ٢ لتر',
    size: '2 L',
    price: '9.00',
    mrp: '13.79',
    discountPercent: '35%',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    deliveryTime: '45 MINS',
    salesCount: '450+ sold recently',
    seller: 'Falcon Express',
    offers: [
      { text_en: 'Extra 10% off', text_ar: 'خصم إضافي ١٠٪' },
      { text_en: 'Free Express Delivery', text_ar: 'توصيل سريع مجاني' },
    ]
  }
];

export default function CartPage() {
  const { t, locale } = useLanguage();
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  console.log(cart, "cart");
  // If real cart has items, use real items; otherwise fallback to DEMO items for instant visual preview
  const itemsToDisplay = (cart && cart.items && cart.items.length > 0) ? cart.items : DEMO_CART_ITEMS;
  const isDemo = (!cart || !cart.items || cart.items.length === 0);

  // Dynamic calculations
  const calculateSubtotal = () => {
    if (!isDemo) return parseFloat(cart.subtotal || 0);
    return itemsToDisplay.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  };

  const calculateMrpSubtotal = () => {
    if (!isDemo) return (calculateSubtotal() * 1.35);
    return itemsToDisplay.reduce((acc, item) => acc + (parseFloat(item.mrp || item.price * 1.3) * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const mrpSubtotal = calculateMrpSubtotal();
  const serviceFee = 3.49;

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.code === 'FALCON15') return subtotal * 0.15;
    if (appliedCoupon.code === 'WELCOME10') return subtotal * 0.10;
    return 5.00;
  };

  const couponDiscount = calculateCouponDiscount();
  const grandTotal = Math.max(0, subtotal + serviceFee - couponDiscount);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#043927] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900 pb-24">

      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200/80 py-5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              href="/products"
              className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {itemsToDisplay.length} {itemsToDisplay.length === 1 ? 'item' : 'items'} in your cart
                {isDemo && <span className="ml-2 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">Demo Preview</span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => clearCart()}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-100"
          >
            <Trash2 className="w-4 h-4" />
            <span>{locale === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Cart Item Cards List (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            {itemsToDisplay.map((item) => {
              const itemPrice = parseFloat(item.discount_price);
              const itemMrp = parseFloat(item.price || (itemPrice * 1.4).toFixed(2));
              const discountTag = item.vat_percentage || `${Math.round(((itemMrp - itemPrice) / itemMrp) * 100)}% OFF`;
              const offers = item.offers || [
                { text_en: 'Extra 15% off', text_ar: 'خصم إضافي ١٥٪' },
                { text_en: '15% cashback up to SAR 15', text_ar: 'كاشباك ١٥٪ حتى ١٥ ريال' },
                { text_en: 'Extra 10% off', text_ar: 'خصم إضافي ١٠٪' },
                { text_en: '10% cashback up to SAR 10', text_ar: 'كاشباك ١٠٪ حتى ١٠ ريال' },
              ];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-4 relative"
                >
                  {/* Top Row: Thumbnail + Info + Top Right Delete & Price */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">

                    {/* Thumbnail & Checkbox Column */}
                    <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 p-3 flex items-center justify-center overflow-hidden">
                        {/* Selected Checkbox Badge */}
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#043927] text-white flex items-center justify-center shadow-xs z-10">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <img
                          src={getImageUrl(item.image)}
                          alt={locale === 'ar' ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Quantity Stepper Pill underneath Thumbnail */}
                      <div className="w-32 sm:w-36 bg-white rounded-xl border border-slate-200 px-2 py-1.5 flex items-center justify-between shadow-2xs">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item.id);
                            } else {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                          title="Decrease / Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <span className="font-extrabold text-sm text-slate-900 font-sans">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-800 font-bold transition-colors cursor-pointer"
                          title="Increase"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Info Column */}
                    <div className="flex-1 space-y-2.5 w-full">
                      {/* Product Title & Delete Button Row */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug font-sans">
                          {locale === 'ar' ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)}
                        </h3>

                        {/* Top-Right Trash Delete Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-500 border border-rose-100 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Size Chip */}
                      <div>
                        <button className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1 rounded-full cursor-pointer transition-colors">
                          <span>
                            {[item.unit_value, item.unit_type, item.pack_size]
                              .filter(value => value !== null && value !== undefined && value !== "")
                              .join(" ")}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                        </button>
                      </div>

                      {/* Delivery Speed Tag */}
                      <div className="inline-flex items-center gap-1.5 text-[#043927] font-bold text-xs bg-emerald-50/80 px-3 py-1 rounded-lg border border-emerald-100">
                        <Zap className="w-3.5 h-3.5 text-[#05A764] fill-current" />
                        <span>{locale === 'ar' ? `احصل عليه خلال ${item.deliveryTime || '١ ساعة ١٠ دقائق'}` : `Get in ${item.deliveryTime || '1 HR 10 MINS'}`}</span>
                      </div>

                      {/* Offer / Cashback Pills Grid */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {offers.map((off, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-xl bg-emerald-50/40 border border-dashed border-emerald-400/80 text-[#043927] text-xs font-bold font-sans"
                          >
                            {locale === 'ar' ? off.text_ar : off.text_en}
                          </span>
                        ))}
                      </div>

                      {/* Recent Sales Count */}
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100/70 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#05A764]" />
                          <span>{item.salesCount || '160+ sold recently'}</span>
                        </div>
                      </div>

                      {/* Value Badges Row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{locale === 'ar' ? 'توصيل مجاني' : 'Free Shipping'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{locale === 'ar' ? 'غير قابل للإرجاع' : 'Non-returnable. Non-exchangeable.'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{locale === 'ar' ? `البائع: ${item.seller || 'Falcon Grocery'}` : `Sold by ${item.seller || 'Falcon Grocery'}`}</span>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Price & Discount display */}
                    <div className="text-right sm:text-right w-full sm:w-auto shrink-0 space-y-1">
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {discountTag && (
                            <span className="text-[#05A764] font-black text-xs sm:text-sm">
                              {discountTag} % OFF
                            </span>
                          )}
                          {itemMrp > itemPrice && (
                            <span className="text-slate-400 line-through text-xs font-medium">
                              {itemMrp.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight flex items-baseline justify-end gap-1">
                          <span className="text-lg font-bold text-slate-700">SAR</span>
                          <span>{itemPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Coupon Box & Order Summary Box (4 Columns) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">

            {/* Got a Coupon Component */}
            <CouponCard
              appliedCoupon={appliedCoupon}
              onApplyCoupon={(code) => setAppliedCoupon({ code })}
              onRemoveCoupon={() => setAppliedCoupon(null)}
            />

            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">

              {/* Header Title & Item Count Pill */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 font-sans">
                  {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>
                <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full font-sans">
                  {itemsToDisplay.length} {itemsToDisplay.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Order Cost Breakdown Rows */}
              <div className="space-y-4 text-sm font-sans">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>{t('cart.subtotal') || 'Subtotal'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through text-xs font-semibold">
                      {mrpSubtotal.toFixed(2)}
                    </span>
                    <span className="font-extrabold text-slate-900 text-base">
                      SAR {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping Fee */}
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>{locale === 'ar' ? 'رسوم الشحن' : 'Shipping Fee'}</span>
                  <span className="text-[#05A764] font-extrabold text-sm tracking-wide">
                    FREE
                  </span>
                </div>

                {/* Supermall Express Shipping Fee */}
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>{locale === 'ar' ? 'رسوم الشحن السريع' : 'Express Shipping Fee'}</span>
                  <span className="text-[#05A764] font-extrabold text-sm tracking-wide">
                    FREE
                  </span>
                </div>

                {/* Service Fee */}
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span className="border-b border-dotted border-slate-400 cursor-help" title="Standard platform service fee">
                    {locale === 'ar' ? 'رسوم الخدمة' : 'Service Fee'}
                  </span>
                  <span className="font-extrabold text-slate-900">
                    SAR {serviceFee.toFixed(2)}
                  </span>
                </div>

                {/* Coupon Discount Row (if applied) */}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <span>{locale === 'ar' ? `خصم الكوبون (${appliedCoupon.code})` : `Coupon Discount (${appliedCoupon.code})`}</span>
                    <span>-SAR {couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Dotted Divider */}
                <div className="border-t border-dashed border-slate-200 pt-4" />

                {/* Total */}
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-slate-900">
                    {locale === 'ar' ? 'الإجمالي' : 'Total'}
                  </span>
                  <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-slate-900 font-sans">
                    <span className="text-base font-bold text-slate-700">SAR</span>
                    <span>{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>



              {/* Primary CTA Checkout Button */}
              <Link
                href="/checkout"
                className="w-full py-4 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-base sm:text-lg transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2.5 cursor-pointer text-center font-sans group"
              >
                <span>{locale === 'ar' ? 'المتابعة للشراء' : 'Checkout'}</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>

            </div>
          </div>

        </div>

        {/* Recommended For You Section */}
        <RecommendedProducts />
      </div>

    </div>
  );
}
