import React from 'react';
import { Clock, ShoppingBag, Sparkles, Wrench } from 'lucide-react';

export const metadata = {
  title: 'SaaRCart – Coming Soon',
  description:
    "We're working hard to bring you a better shopping experience. Our website will be available soon.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function UnderConstructionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6FFF8] via-white to-[#ECFDF5] text-slate-800 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle decorative background accents */}
      <div
        className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-[#043927]/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-[28px] border border-emerald-100 shadow-[0_20px_60px_rgba(4,57,39,0.08)] p-6 sm:p-10 md:p-12 text-center space-y-7">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-2.5 border border-slate-100 shadow-2xs">
            <img
              src="/saqrcart-logo.png"
              alt="SaaRCart"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Coming Soon Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#043927] text-xs sm:text-sm font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#00B074]" />
            <span>Coming Soon</span>
          </span>
        </div>

        {/* Shopping & Maintenance Illustration */}
        <div className="flex justify-center py-2">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-emerald-50 to-[#F6FFF8] border border-emerald-100 flex items-center justify-center shadow-inner">
            <svg
              viewBox="0 0 180 180"
              className="w-32 h-32 sm:w-36 sm:h-36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Soft ground shadow */}
              <ellipse cx="90" cy="150" rx="54" ry="8" fill="#D1FAE5" />
              {/* Shopping Bag Body */}
              <rect
                x="46"
                y="60"
                width="88"
                height="82"
                rx="16"
                fill="#043927"
              />
              {/* Bag Highlight Strip */}
              <rect
                x="56"
                y="72"
                width="68"
                height="58"
                rx="10"
                fill="#065F46"
              />
              {/* Bag Handles */}
              <path
                d="M68 62V48C68 35.85 77.85 26 90 26C102.15 26 112 35.85 112 48V62"
                stroke="#00B074"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Fresh Leaf Accent on Bag */}
              <path
                d="M90 85C79 85 72 93 72 103C72 113 80 119 90 119C100 119 108 111 108 101C108 91 100 85 90 85Z"
                fill="#10B981"
                fillOpacity="0.25"
              />
              <path
                d="M98 92C88 94 84 101 82 111C92 109 98 102 98 92Z"
                fill="#34D399"
              />
            </svg>

            {/* Floating Maintenance Icon */}
            <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-2xl bg-white border border-emerald-200 shadow-md flex items-center justify-center">
              <Wrench className="w-6 h-6 text-[#043927]" />
            </div>

            {/* Floating Bag Accent */}
            <div className="absolute -top-1 -left-1 w-10 h-10 rounded-xl bg-[#043927] shadow-md flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* Heading & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black text-[#043927] tracking-tight leading-tight">
            We&apos;re Under Construction
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            We&apos;re working hard to bring you a better shopping experience. Our website will be available soon.
          </p>
        </div>

        {/* Status Footer Pill */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-[#00B074]" />
            <span>Scheduled Upgrades in Progress</span>
          </span>
        </div>
      </div>

      {/* Subtle Copyright */}
      <p className="relative z-10 mt-6 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} SaaRCart. All rights reserved.
      </p>
    </div>
  );
}
