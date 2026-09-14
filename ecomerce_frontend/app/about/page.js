'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { Leaf, Award, Truck, ShieldCheck, Heart, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const { locale } = useLanguage();

  return (
    <div className="space-y-16 pb-16 font-sans bg-[#fbfcfb]">
      {/* Header Banner */}
      <section className="bg-[#05442e] text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="text-lime-300 font-serif italic text-lg sm:text-xl font-medium tracking-wide">
            {locale === 'ar' ? 'من نحن' : 'About Groceru'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            {locale === 'ar' ? 'سوبرماركت البقالة الطازجة الأول' : 'Fresh Grocery & Farm Organic Produce'}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'نحن نوفر لك أفضل المنتجات العضوية والخضروات والفواكه الطازجة مباشرة من المزارع المحلية إلى باب منزلك في غضون 30 دقيقة.'
              : 'Delivering 100% farm-fresh organic fruits, crisp vegetables, dairy essentials, and meats with express 30-minute delivery and ZATCA compliance across Saudi Arabia.'}
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-lime-400/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Mission & Vision Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#05442e] flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {locale === 'ar' ? 'مهمتنا' : 'Our Mission'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {locale === 'ar'
                ? 'تقديم مقاضي البقالة الطازجة بأعلى جودة وأفضل سعر، مع ضمان التوصيل السريع وتجربة تسوق رقمية سهلة وموثوقة.'
                : 'To deliver daily groceries and farm-fresh organic produce with unmatched speed, transparent pricing, and 100% verified quality guarantee.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {locale === 'ar' ? 'رؤيتنا' : 'Our Vision'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {locale === 'ar'
                ? 'أن نكون الخيار الأول والمنصة الرائدة للتسوق الإلكتروني للمقاضي والمواد الغذائية في المملكة العربية السعودية.'
                : 'To become Saudi Arabia’s premier trusted online fresh grocery brand powered by smart cold-chain delivery and real-time tracking.'}
            </p>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="space-y-8 bg-[#fff5f5] p-8 sm:p-12 rounded-3xl border border-[#fce8e8]">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#05442e]">
              {locale === 'ar' ? 'لماذا تختار سوبرماركت Groceru؟' : 'Why Choose Groceru?'}
            </h2>
            <p className="text-xs text-slate-600">
              {locale === 'ar' ? 'نحن نهتم بصحة عائلتك وبجودة كل منتج يصل إلى مطبخك.' : 'We care about your family’s health and the freshness of every item delivered to your kitchen.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl space-y-3 text-center border border-slate-100 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">30-Min Fast Express</h3>
              <p className="text-xs text-slate-500">Superfast delivery straight from local farms to your home.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl space-y-3 text-center border border-slate-100 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">100% Organic Quality</h3>
              <p className="text-xs text-slate-500">Naturally grown fruits, vegetables, and daily essential dairy.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl space-y-3 text-center border border-slate-100 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">ZATCA Compliant</h3>
              <p className="text-xs text-slate-500">Instant verified e-invoicing and secure bank payment option.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl space-y-3 text-center border border-slate-100 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Customer Satisfaction</h3>
              <p className="text-xs text-slate-500">24/7 dedicated customer service and 100% satisfaction guarantee.</p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-[#05442e] text-white p-8 sm:p-12 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left rtl:sm:text-right">
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              {locale === 'ar' ? 'جاهز لتسوق مقاضيك الطازجة؟' : 'Ready to Shop Fresh Grocery?'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100">
              {locale === 'ar' ? 'تصفح كتالوج المنتجات واستمتع بتوصيل سريع اليوم.' : 'Explore our catalog and get your daily produce delivered in 30 minutes.'}
            </p>
          </div>
          <Link
            href="/products"
            className="px-8 py-3.5 rounded-full bg-white text-[#05442e] font-extrabold text-sm hover:bg-lime-300 transition-all shrink-0 cursor-pointer"
          >
            {locale === 'ar' ? 'تصفح المنتجات' : 'Browse Catalog'}
          </Link>
        </section>
      </div>
    </div>
  );
}
