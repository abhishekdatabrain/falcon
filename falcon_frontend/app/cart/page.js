'use client';
import React from 'react';
import Link from 'next/link';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CartPage() {
  const { t, locale } = useLanguage();
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm my-10">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#05442e] flex items-center justify-center mx-auto border border-emerald-100">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">{t('cart.empty')}</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {locale === 'ar' ? 'يبدو أنك لم تضف أي منتجات إلى سلتك بعد.' : "Looks like you haven't added any products to your cart yet."}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
        >
          <span>{t('home.shopNow')}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-[#fbfcfb] min-h-[75vh]">
      
      {/* Header Title & Clear Cart Button */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('cart.title')}
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'مسح السلة' : 'Clear Cart'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Cart Line Items Column */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#fff9f9] border border-slate-100 p-2 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'}
                    alt={locale === 'ar' ? item.name_ar : item.name_en}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    {locale === 'ar' ? item.name_ar : item.name_en}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Unit Price:</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {parseFloat(item.price).toFixed(2)} SAR
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls, Total & Delete */}
              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-xs">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-xl bg-white text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-extrabold text-sm text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[85px]">
                  <span className="text-base font-extrabold text-[#05442e] block">
                    {parseFloat(item.lineTotal).toFixed(2)} SAR
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer border border-rose-100"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Column */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>{t('cart.subtotal')}</span>
              <span className="font-bold text-slate-900">{parseFloat(cart.subtotal).toFixed(2)} SAR</span>
            </div>

            <div className="flex justify-between text-slate-600 font-medium">
              <span>{t('cart.vat')}</span>
              <span className="font-bold text-slate-900">{parseFloat(cart.taxTotal).toFixed(2)} SAR</span>
            </div>

            <div className="flex justify-between text-slate-600 font-medium">
              <span>{t('cart.deliveryFee')}</span>
              <span>
                {cart.deliveryFee === 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                    FREE
                  </span>
                ) : (
                  <span className="font-bold text-slate-900">{parseFloat(cart.deliveryFee).toFixed(2)} SAR</span>
                )}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline text-lg font-black">
              <span className="text-slate-900">{t('cart.total')}</span>
              <span className="text-2xl text-[#05442e]">{parseFloat(cart.grandTotal).toFixed(2)} SAR</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-2.5 font-medium">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>Final price calculated strictly on server-side.</span>
          </div>

          <Link
            href="/checkout"
            className="w-full py-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>{t('cart.checkout')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

      </div>
    </div>
  );
}

