'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../services/api';

const DEFAULT_BANNER_DESKTOP = '/banners/promotional_grocery_banner.jpg';

export default function CategoryBanner({ category, level = 1 }) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  if (!category) return null;

  const bannerConfig = category.banner || {};
  const contentConfig = category.content || {};

  // Banner Display Mode:
  // - 'hybrid' (Dynamic Hero Banner): Full background image with live HTML/CSS editable text & CTA overlay
  // - 'classic': Legacy layout with highlight badges and guarantee pills
  const bannerStyle = bannerConfig.banner_style || 'promotional';
  const displayMode = (bannerStyle === 'classic' || bannerConfig.banner_style === 'classic')
    ? 'classic'
    : 'hybrid';

  // Desktop and mobile banner images (supports both camelCase and snake_case)
  const desktopImg = bannerConfig.backgroundImageDesktop || bannerConfig.desktop_image
    ? getImageUrl(bannerConfig.backgroundImageDesktop || bannerConfig.desktop_image)
    : (category.image_url ? getImageUrl(category.image_url) : DEFAULT_BANNER_DESKTOP);

  const mobileImg = bannerConfig.backgroundImageMobile || bannerConfig.mobile_image
    ? getImageUrl(bannerConfig.backgroundImageMobile || bannerConfig.mobile_image)
    : desktopImg;

  // Title / Heading (supports title.en, title.ar, heading_en, heading_ar)
  const titleObj = bannerConfig.title || {};
  const heading = isAr
    ? (titleObj.ar || bannerConfig.heading_ar || category.name_ar || category.name_en || 'تزود بالاحتياجات اليومية')
    : (titleObj.en || bannerConfig.heading_en || category.name_en || category.name_ar || 'Stock up on daily essentials');

  // Description / Subheading (supports description.en, description.ar, description_en, description_ar)
  const descObj = bannerConfig.description && typeof bannerConfig.description === 'object' ? bannerConfig.description : {};
  const description = isAr
    ? (descObj.ar || (typeof bannerConfig.description === 'string' ? bannerConfig.description : null) || bannerConfig.description_ar || contentConfig.short_desc_ar || category.description_ar || 'احصل على خيرات المزرعة الطازجة وتشكيلة واسعة من الفواكه والخضار والبيض وأكثر')
    : (descObj.en || (typeof bannerConfig.description === 'string' ? bannerConfig.description : null) || bannerConfig.description_en || contentConfig.short_desc_en || category.description_en || 'Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more');

  // CTA Settings (supports cta.enabled, cta.text.en, cta.text.ar, cta.link, cta_url, etc.)
  const ctaObj = bannerConfig.cta || {};
  const ctaTextObj = ctaObj.text || {};
  const showCta = ctaObj.enabled !== undefined ? Boolean(ctaObj.enabled) : (bannerConfig.show_cta !== false);
  const ctaUrl = ctaObj.link || bannerConfig.cta_url || '#products';
  const ctaText = isAr
    ? (ctaTextObj.ar || bannerConfig.cta_text_ar || 'تسوق الآن')
    : (ctaTextObj.en || bannerConfig.cta_text_en || 'Shop Now');
  const ctaBgColor = ctaObj.bgColor || bannerConfig.cta_bg_color || '#ffffff';
  const ctaTextColor = ctaObj.textColor || bannerConfig.cta_text_color || '#111827';

  // Overlay Styling, Alignment & Dimmer
  const textAlignment = bannerConfig.text_alignment || (isAr ? 'right' : 'left');
  const textColor = bannerConfig.text_color || '#ffffff';
  const overlayOpacity = bannerConfig.overlayOpacity !== undefined
    ? parseFloat(bannerConfig.overlayOpacity)
    : (bannerConfig.overlay_opacity !== undefined ? parseFloat(bannerConfig.overlay_opacity) : 0.25);

  // Dynamic Split Mode Appearance
  const bgColor = bannerConfig.bg_color || '#0d5628';
  const gradientStart = bannerConfig.gradient_start || '#0d5628';
  const gradientEnd = bannerConfig.gradient_end || '#248a4c';
  const imagePosition = bannerConfig.image_position || 'center';

  const handleCtaClick = (e) => {
    if (!ctaUrl || ctaUrl === '#' || ctaUrl === '#products' || ctaUrl === '#products-section') {
      e.preventDefault();
      const el =
        document.getElementById('products-section-header') ||
        document.getElementById('products-section') ||
        document.querySelector('[data-products-grid]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // =========================================================================
  // 1. CLASSIC MODE (Legacy backward compatibility)
  // =========================================================================
  if (bannerStyle === 'classic') {
    const tagText = isAr
      ? (bannerConfig.tag_ar !== undefined ? bannerConfig.tag_ar : 'طازج 100%')
      : (bannerConfig.tag_en !== undefined ? bannerConfig.tag_en : '100% FARM FRESH');

    const badgeText = isAr
      ? (bannerConfig.badge_ar !== undefined ? bannerConfig.badge_ar : 'أفضل سعر مضمون')
      : (bannerConfig.badge_en !== undefined ? bannerConfig.badge_en : 'BEST PRICE GUARANTEED');

    const features = Array.isArray(contentConfig.features) && contentConfig.features.length > 0
      ? contentConfig.features
      : [
        { label_en: 'Direct Farm Sourcing', label_ar: 'توريد مباشر من المزرعة' },
        { label_en: 'Express Delivery in 30 Mins', label_ar: 'توصيل فوري خلال 30 دقيقة' },
        { label_en: '100% Quality Guaranteed', label_ar: 'ضمان الجودة 100%' },
      ];

    const levelLabels = {
      1: { en: 'Main Category', ar: 'التصنيف الرئيسي' },
      2: { en: 'Subcategory', ar: 'تصنيف فرعي' },
      3: { en: 'Specialty Selection', ar: 'تشكيلة متخصصة' },
      4: { en: 'Premium Grade', ar: 'درجة ممتازة فاخرة' },
    };
    const levelText = isAr ? levelLabels[level]?.ar : levelLabels[level]?.en;

    return (
      <section className="relative rounded-2xl sm:rounded-[18px] overflow-hidden bg-[#043927] text-white shadow-lg border border-emerald-900/50 transition-all duration-300">
        <div className="relative z-10 p-5 sm:p-6 lg:px-8 lg:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 space-y-2.5 text-left rtl:text-right">
            <div className="flex items-center gap-2 flex-wrap">
              {levelText && (
                <span className="bg-emerald-950/80 border border-emerald-700/60 text-[#a7f3d0] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {levelText}
                </span>
              )}
              {tagText && (
                <span className="bg-[#05A764] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  {tagText}
                </span>
              )}
              {badgeText && (
                <span className="bg-[#ea580c] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  {badgeText}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              {heading}
            </h1>

            <p className="text-emerald-100/90 font-medium text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-2">
              {description}
            </p>

            <div className="pt-2 flex items-center gap-2 flex-wrap text-emerald-200 text-xs font-semibold border-t border-emerald-800/80">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{isAr ? (feat.label_ar || feat.label_en) : (feat.label_en || feat.label_ar)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none h-36 sm:h-44 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500/30 group">
              <picture className="w-full h-full block">
                {bannerConfig.mobile_image && <source media="(max-width: 640px)" srcSet={mobileImg} />}
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#043927]/60 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-[#043927]/90 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                <span>{isAr ? 'جودة مضمونة' : 'Quality Verified'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // 2. FULL BANNER IMAGE MODE (Displays pure graphic image across full width)
  // - No duplicate text/CTA overlay; complete graphic is clickable
  // =========================================================================
  if (displayMode === 'full_image') {
    return (
      <section className="relative w-full rounded-2xl sm:rounded-[18px] overflow-hidden shadow-md group transition-all duration-300">
        <Link
          href={ctaUrl}
          onClick={handleCtaClick}
          className="block w-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500 rounded-2xl sm:rounded-[18px]"
          aria-label={heading || 'Category Promotional Banner'}
        >
          <picture className="w-full block">
            {bannerConfig.mobile_image && (
              <source media="(max-width: 640px)" srcSet={mobileImg} />
            )}
            <img
              src={desktopImg}
              alt={heading || 'Category Banner'}
              className="w-full h-auto block rounded-2xl sm:rounded-[18px] transition-transform duration-500 group-hover:scale-[1.005]"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_BANNER_DESKTOP;
              }}
            />
          </picture>
        </Link>
      </section>
    );
  }

  // =========================================================================
  // 3. SPLIT DYNAMIC MODE (Gradient background with right-side grocery image)
  // =========================================================================
  if (displayMode === 'dynamic') {
    const gradientStyle = {
      background: isAr
        ? `linear-gradient(to left, ${gradientStart} 0%, ${gradientEnd} 100%)`
        : `linear-gradient(to right, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      backgroundColor: bgColor,
    };

    return (
      <section
        className="relative rounded-2xl sm:rounded-[18px] overflow-hidden shadow-lg w-full min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] flex items-center transition-all duration-300"
        style={gradientStyle}
      >
        <div className="absolute right-4 sm:right-10 lg:right-24 top-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] rounded-full bg-[#bef264]/25 blur-[70px] pointer-events-none rtl:right-auto rtl:left-4 sm:rtl:left-10 lg:rtl:left-24 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 pointer-events-none z-0" />

        <div className="relative z-10 w-full h-full p-6 sm:p-8 lg:px-12 lg:py-8 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          <div
            className={`w-full lg:w-7/12 space-y-3 sm:space-y-4 ${
              textAlignment === 'center'
                ? 'text-center'
                : textAlignment === 'right'
                ? 'text-right'
                : isAr ? 'text-right' : 'text-left'
            }`}
          >
            <h1
              className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold sm:font-black tracking-tight leading-[1.18]"
              style={{ color: textColor }}
            >
              {heading}
            </h1>

            <p
              className="text-xs sm:text-sm lg:text-[16px] font-medium leading-relaxed max-w-xl opacity-95"
              style={{ color: textColor }}
            >
              {description}
            </p>

            {showCta && (
              <div className="pt-2 sm:pt-3">
                <a
                  href={ctaUrl}
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
                  style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </a>
              </div>
            )}
          </div>

          <div className="w-full lg:w-5/12 flex items-center justify-center lg:justify-end shrink-0 relative">
            <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-none h-44 sm:h-56 lg:h-[280px] flex items-center justify-center lg:justify-end">
              <picture className="w-full h-full flex items-center justify-center lg:justify-end">
                {bannerConfig.mobile_image && <source media="(max-width: 640px)" srcSet={mobileImg} />}
                <img
                  src={desktopImg}
                  alt={heading}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition-transform duration-500 hover:scale-[1.03]"
                  style={{
                    objectPosition: imagePosition === 'right' ? 'right center' : imagePosition === 'left' ? 'left center' : imagePosition === 'top' ? 'center top' : imagePosition === 'bottom' ? 'center bottom' : 'center center'
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_BANNER_DESKTOP;
                  }}
                />
              </picture>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // 4. HYBRID DYNAMIC HERO BANNER (Default / Primary Recommended Mode)
  // - Background Image: Full width (Desktop & Mobile)
  // - Dimmer / Gradient: Subtle dark overlay on text side for accessibility
  // - Content Layer (Overlay): Live HTML/CSS Heading, Description, and CTA Button
  // =========================================================================
  const isCenter = textAlignment === 'center';
  const isRight = textAlignment === 'right' || (!isCenter && isAr);

  // Directional gradient on text side to guarantee contrast across any bright background
  const textGradient = isAr
    ? `linear-gradient(to left, rgba(0,0,0,${Math.min(overlayOpacity + 0.35, 0.85)}) 0%, rgba(0,0,0,${Math.max(overlayOpacity, 0.15)}) 45%, rgba(0,0,0,0) 85%)`
    : `linear-gradient(to right, rgba(0,0,0,${Math.min(overlayOpacity + 0.35, 0.85)}) 0%, rgba(0,0,0,${Math.max(overlayOpacity, 0.15)}) 45%, rgba(0,0,0,0) 85%)`;

  return (
    <section className="relative w-full rounded-2xl overflow-hidden shadow-md group transition-all duration-300">
      <div className="relative w-full h-[150px] sm:h-[180px] lg:h-[210px] min-h-[140px] flex items-center">
        {/* Background Image Layer */}
        <picture className="absolute inset-0 w-full h-full block">
          {bannerConfig.mobile_image && (
            <source media="(max-width: 640px)" srcSet={mobileImg} />
          )}
          <img
            src={desktopImg}
            alt={heading || 'Category Banner'}
            className="w-full h-full object-cover object-center block transition-transform duration-700 group-hover:scale-[1.01]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_BANNER_DESKTOP;
            }}
          />
        </picture>

        {/* Directional Gradient Overlay on Text Side */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ background: textGradient }}
        />

        {/* Optional Global Dark Dimmer Overlay */}
        {overlayOpacity > 0 && (
          <div
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
            style={{ opacity: overlayOpacity }}
          />
        )}

        {/* Content Layer (Absolute HTML/CSS Overlay) */}
        <div className="relative z-10 w-full p-4 sm:p-6 lg:px-10 lg:py-4">
          <div
            className={`max-w-xl space-y-1 sm:space-y-1.5 ${
              isCenter
                ? 'mx-auto text-center'
                : isRight
                ? 'ml-auto text-right'
                : 'mr-auto text-left'
            }`}
          >
            {/* Heading / Title */}
            <h1
              className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight tracking-tight drop-shadow-sm"
              style={{ color: textColor }}
            >
              {heading}
            </h1>

            {/* Description / Subheading */}
            {description && (
              <p
                className="text-xs sm:text-sm text-white/90 mt-0.5 max-w-lg font-medium leading-relaxed drop-shadow-xs line-clamp-2"
                style={{ color: textColor }}
              >
                {description}
              </p>
            )}

            {/* CTA Button */}
            {showCta && (
              <div className="pt-1.5 sm:pt-2">
                <a
                  href={ctaUrl}
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-1.5 font-semibold px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition shadow-sm text-xs sm:text-sm cursor-pointer"
                  style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
