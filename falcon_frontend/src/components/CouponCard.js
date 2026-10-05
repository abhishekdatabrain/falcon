'use client';
import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, Percent, Tag, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AVAILABLE_OFFERS = [
  {
    code: 'FALCON15',
    title: 'Extra 15% Off',
    description: 'Get 15% instant discount on orders over AED 50',
    discountText: '15% OFF'
  },
  {
    code: 'FREESHIP',
    title: 'Free Express Shipping',
    description: 'Waive express delivery fee on beverage & water products',
    discountText: 'FREE SHIPPING'
  },
  {
    code: 'WELCOME10',
    title: 'Welcome Discount',
    description: 'Flat 10% off for first time Falcon shoppers',
    discountText: '10% OFF'
  }
];

export default function CouponCard({ onApplyCoupon, onRemoveCoupon, appliedCoupon }) {
  const { locale } = useLanguage();
  const [couponCode, setCouponCode] = useState('');
  const [showOffers, setShowOffers] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleApply = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg(locale === 'ar' ? 'يرجى إدخال رمز الكوبون' : 'Please enter a coupon code');
      return;
    }

    // Check against available or custom
    setErrorMsg('');
    if (onApplyCoupon) {
      onApplyCoupon(code);
    }
    setCouponCode('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Title */}
      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-sans tracking-tight">
        {locale === 'ar' ? 'هل لديك كوبون خصم؟' : 'Got a coupon?'}
      </h3>

      {/* Applied Coupon View or Input Box */}
      {appliedCoupon ? (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-wide uppercase font-sans">
                  {appliedCoupon.code}
                </span>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  APPLIED
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                {locale === 'ar' ? 'تم تطبيق الخصم بنجاح!' : 'Coupon applied successfully!'}
              </p>
            </div>
          </div>

          <button
            onClick={onRemoveCoupon}
            className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إزالة' : 'REMOVE'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-[#F5F6F8] rounded-2xl px-4 py-3.5 flex items-center justify-between border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all shadow-2xs">
            <input
              type="text"
              placeholder={locale === 'ar' ? 'رمز الكوبون' : 'Coupon Code'}
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApply();
              }}
              className="bg-transparent border-none outline-none font-semibold text-slate-900 placeholder:text-slate-400 text-sm sm:text-base uppercase tracking-wider w-full pr-2 font-sans"
            />
            <button
              onClick={() => handleApply()}
              disabled={!couponCode.trim()}
              className={`font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors shrink-0 font-sans cursor-pointer ${
                couponCode.trim()
                  ? 'text-[#0070F3] hover:text-[#005ECB]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {locale === 'ar' ? 'تطبيق' : 'APPLY'}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold px-1">
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* Dotted Divider */}
      <div className="border-t border-dashed border-slate-200/90 my-2" />

      {/* Bottom Row: View Available Offers */}
      <div>
        <button
          onClick={() => setShowOffers(!showOffers)}
          className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            {/* Blue Circular Icon Badge */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EBF3FF] text-[#0066FF] flex items-center justify-center font-black text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              %
            </div>
            <span className="font-extrabold text-slate-800 text-sm sm:text-base font-sans group-hover:text-[#0066FF] transition-colors">
              {locale === 'ar' ? 'عرض العروض المتاحة' : 'View Available Offers'}
            </span>
          </div>

          <ChevronRight
            className={`w-5 h-5 text-slate-900 rtl:rotate-180 transition-transform duration-200 ${
              showOffers ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* Expandable Offers List */}
        {showOffers && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-fadeIn">
            {AVAILABLE_OFFERS.map((offer) => (
              <div
                key={offer.code}
                className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 rounded-2xl transition-all flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs tracking-wider uppercase bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {offer.code}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {offer.discountText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {offer.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleApply(offer.code);
                    setShowOffers(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  {locale === 'ar' ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
