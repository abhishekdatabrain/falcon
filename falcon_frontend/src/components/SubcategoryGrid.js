'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../services/api';

const DEFAULT_SUB_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop';

/**
 * SubcategoryGrid Component
 * Displays only immediate child categories.
 * Clicking a card navigates to that category's nested URL.
 * Automatically hidden if there are no child categories (e.g. Level 4).
 */
export default function SubcategoryGrid({
  subcategories = [],
  parentPath = '',
  level = 1,
}) {
  const { locale } = useLanguage();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Level-specific section headers
  const sectionTitles = {
    1: { en: 'Explore Subcategories', ar: 'استكشف التصنيفات الفرعية' },
    2: { en: 'Browse by Variety', ar: 'تصفح حسب الأصناف والأنواع' },
    3: { en: 'Select Specific Grain / Type', ar: 'اختر الصنف المتخصص' },
  };

  const sectionTitle = locale === 'ar'
    ? (sectionTitles[level]?.ar || 'التصنيفات الفرعية')
    : (sectionTitles[level]?.en || 'Subcategories');

  // Check scroll bounds for desktop carousel buttons
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const current = Math.abs(scrollLeft);
      setCanScrollLeft(current > 8);
      setCanScrollRight(current < maxScroll - 8);
    }
  };

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = Math.max(container.clientWidth * 0.7, 260);
      const isRtl = locale === 'ar';
      let offset = direction === 'next' ? scrollAmount : -scrollAmount;
      if (isRtl) offset = -offset;
      container.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 300);
    return () => clearTimeout(timer);
  }, [subcategories, locale]);

  // Hide the section completely if there are no child categories
  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-2 select-none font-sans">
      
      {/* Section Header with Navigation Arrows */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
            <Layers className="w-4 h-4 text-[#006E2D]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-heading">
              {sectionTitle}
            </h2>
            
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('prev')}
            disabled={!canScrollLeft}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={locale === 'ar' ? 'السابق' : 'Previous'}
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('next')}
            disabled={!canScrollRight}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={locale === 'ar' ? 'التالي' : 'Next'}
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Carousel */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {subcategories.map((sub) => {
          const subTitle = locale === 'ar' ? (sub.name_ar || sub.name_en) : (sub.name_en || sub.name_ar);
          const rawImg = sub.image_url || sub.img || '';
          const subImage = rawImg
            ? (rawImg.startsWith('http') ? rawImg : getImageUrl(rawImg))
            : DEFAULT_SUB_IMAGE;

          // If level === 3, child is Level 4 -> open filtered Product Listing Page
          const childHref = level === 3
            ? `/products?categoryId=${encodeURIComponent(sub.id || sub.slug)}`
            : `${parentPath}/${sub.slug}`;

          return (
            <Link
              key={sub.id || sub.slug}
              href={childHref}
              className="group/card bg-[#FFFDF8] hover:bg-[#FFF9EC] rounded-[22px] p-3.5 sm:p-4 flex flex-col items-center justify-between border border-[#F6EEDF] hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[190px] sm:min-h-[210px] w-[145px] sm:w-[165px] md:w-[180px] shrink-0 snap-start text-center"
            >
              {/* Thumbnail Container */}
              <div className="w-full aspect-square max-w-[110px] sm:max-w-[130px] flex items-center justify-center overflow-hidden my-auto p-1.5 rounded-xl bg-white/70">
                <img
                  src={subImage}
                  alt={subTitle}
                  className="w-full h-full object-contain drop-shadow-sm group-hover/card:scale-108 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_SUB_IMAGE;
                  }}
                />
              </div>

              {/* Subcategory Name */}
              <div className="w-full pt-2">
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover/card:text-[#043927] transition-colors leading-snug line-clamp-2">
                  {subTitle}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
}
