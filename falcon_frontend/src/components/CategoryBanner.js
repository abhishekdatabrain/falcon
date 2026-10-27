'use client';
import React from 'react';
import { Sparkles, ShieldCheck, Zap, Award } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../services/api';

const DEFAULT_BANNER_DESKTOP = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80';
const DEFAULT_BANNER_MOBILE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';

export default function CategoryBanner({ category, level = 1 }) {
  const { locale } = useLanguage();

  if (!category) return null;

  const bannerConfig = category.banner || {};
  const contentConfig = category.content || {};

  // Localized texts
  const heading = locale === 'ar'
    ? (bannerConfig.heading_ar || category.name_ar || category.name_en)
    : (bannerConfig.heading_en || category.name_en || category.name_ar);

  const description = locale === 'ar'
    ? (bannerConfig.description_ar || contentConfig.short_desc_ar || category.description_ar || category.description || 'استكشف تشكيلتنا المختارة بعناية من أفضل المنتجات الطازجة وبأفضل الأسعار.')
    : (bannerConfig.description_en || contentConfig.short_desc_en || category.description_en || category.description || 'Explore our hand-picked selection of premium quality items delivered fast to your door.');

  const tagText = locale === 'ar'
    ? (bannerConfig.tag_ar !== undefined ? bannerConfig.tag_ar : 'طازج 100%')
    : (bannerConfig.tag_en !== undefined ? bannerConfig.tag_en : '100% FARM FRESH');

  const badgeText = locale === 'ar'
    ? (bannerConfig.badge_ar !== undefined ? bannerConfig.badge_ar : 'أفضل سعر مضمون')
    : (bannerConfig.badge_en !== undefined ? bannerConfig.badge_en : 'BEST PRICE GUARANTEED');

  // Desktop and mobile banner images
  const desktopImg = bannerConfig.desktop_image
    ? getImageUrl(bannerConfig.desktop_image)
    : (category.image_url ? getImageUrl(category.image_url) : DEFAULT_BANNER_DESKTOP);

  const mobileImg = bannerConfig.mobile_image
    ? getImageUrl(bannerConfig.mobile_image)
    : desktopImg || DEFAULT_BANNER_MOBILE;

  // Features list
  const features = Array.isArray(contentConfig.features) && contentConfig.features.length > 0
    ? contentConfig.features
    : [
      { label_en: 'Direct Farm Sourcing', label_ar: 'توريد مباشر من المزرعة' },
      { label_en: 'Express Delivery in 30 Mins', label_ar: 'توصيل فوري خلال 30 دقيقة' },
      { label_en: '100% Quality Guaranteed', label_ar: 'ضمان الجودة 100%' },
    ];

  // Level visual accent badge
  const levelLabels = {
    1: { en: 'Main Category', ar: 'التصنيف الرئيسي' },
    2: { en: 'Subcategory', ar: 'تصنيف فرعي' },
    3: { en: 'Specialty Selection', ar: 'تشكيلة متخصصة' },
    4: { en: 'Premium Grade', ar: 'درجة ممتازة فاخرة' },
  };

  const levelText = locale === 'ar' ? levelLabels[level]?.ar : levelLabels[level]?.en;

  return (
    <section className="relative rounded-3xl overflow-hidden bg-[#043927] text-white shadow-lg border border-emerald-900/50 transition-all duration-300">
      
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-400 blur-3xl"></div>
        <div className="absolute left-10 -bottom-20 w-80 h-80 rounded-full bg-[#00B074] blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-5 lg:px-7 lg:py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
        
        {/* Left Column: Category Content & Highlights */}
        <div className="lg:col-span-7 space-y-2 sm:space-y-2.5 text-left rtl:text-right">
          
          {/* Top Tags & Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {levelText && (
              <span className="bg-emerald-950/80 border border-emerald-700/60 text-[#a7f3d0] text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                {levelText}
              </span>
            )}
            {tagText && (
              <span className="bg-[#05A764] text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                {tagText}
              </span>
            )}
            {badgeText && (
              <span className="bg-[#ea580c] text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                {badgeText}
              </span>
            )}
          </div>

          {/* Dynamic Category Heading */}
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-tight text-white">
            {heading}
          </h1>

          {/* Dynamic Category Description */}
          <p className="text-emerald-100/90 font-medium text-xs sm:text-[13px] leading-relaxed max-w-2xl line-clamp-2">
            {description}
          </p>

          {/* Category Content Highlights / Guarantees */}
          <div className="pt-1.5 flex items-center gap-1.5 sm:gap-2.5 flex-wrap text-emerald-200 text-[11px] sm:text-xs font-semibold border-t border-emerald-800/80">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/40">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{locale === 'ar' ? (feat.label_ar || feat.label_en) : (feat.label_en || feat.label_ar)}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Responsive Banner Visual */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none h-32 sm:h-38 lg:h-44 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500/30 group">
            
            {/* Desktop Responsive Image */}
            <picture className="w-full h-full block">
              <source media="(max-width: 640px)" srcSet={mobileImg} />
              <img
                src={desktopImg}
                alt={heading}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_BANNER_DESKTOP;
                }}
              />
            </picture>

            {/* Subtle Gradient Shade on Visual */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#043927]/60 via-transparent to-transparent pointer-events-none"></div>

            {/* Quality Verified Floating Stamp */}
            <div className="absolute bottom-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-[#043927]/90 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              <span>{locale === 'ar' ? 'جودة مضمونة' : 'Quality Verified'}</span>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
}
