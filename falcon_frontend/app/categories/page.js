'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi, getImageUrl } from '../../src/services/api';
import { getCategoryUrl } from '../../src/services/categoryHierarchy';
import { ChevronRight, Home, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const { locale } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetchApi('/categories?type=parent');
        if (isSubscribed && res.success) {
          const rawCats = res.data?.categories || res.data || [];
          const parentsOnly = rawCats.filter((c) => !c.parent_id);
          setCategories(parentsOnly);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFCFB] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-emerald-800 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
          <span className="text-slate-900 font-bold">
            {locale === 'ar' ? 'الأقسام' : 'Categories'}
          </span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {locale === 'ar' ? 'جميع الأقسام' : 'All Categories'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {locale === 'ar'
                ? 'استكشف مجموعتنا الواسعة من المنتجات الطازجة، المشروبات، والاحتياجات اليومية'
                : 'Explore our wide range of fresh groceries, beverages, and daily essentials'}
            </p>
          </div>
          {categories.length > 0 && (
            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#E6F4EA] text-[#043927] text-xs font-bold border border-emerald-200/60 shadow-2xs">
              {categories.length} {locale === 'ar' ? 'أقسام متوفرة' : 'Categories available'}
            </span>
          )}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-[#FFFDF8] rounded-[22px] p-4 flex flex-col items-center justify-between border border-[#F6EEDF] shadow-2xs min-h-[210px] sm:min-h-[230px] animate-pulse"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-200/70 shrink-0 my-auto" />
                <div className="w-3/4 h-4 bg-slate-200/70 rounded-md mt-3" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <Sparkles className="w-10 h-10 text-emerald-600/40 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {locale === 'ar' ? 'لا توجد أقسام متاحة حالياً' : 'No categories available currently'}
            </h3>
            <p className="text-xs text-slate-500">
              {locale === 'ar'
                ? 'يرجى مراجعة الموقع لاحقاً أو العودة إلى الصفحة الرئيسية'
                : 'Please check back later or return to the homepage'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>{locale === 'ar' ? 'العودة للرئيسية' : 'Return Home'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((cat) => {
              const titleEn = cat.name_en || cat.title_en || cat.name || 'Category';
              const titleAr = cat.name_ar || cat.title_ar || titleEn;
              const catSlug = cat.slug || titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const imageSrc = cat.image_url
                ? getImageUrl(cat.image_url)
                : (cat.img || '/categories/cat_groceries.jpg');

              return (
                <Link
                  key={cat.id || cat._id || catSlug}
                  href={getCategoryUrl(cat)}
                  className="group/card bg-[#FFFDF8] hover:bg-[#FFF9EC] rounded-[22px] p-3.5 sm:p-4 flex flex-col items-center justify-between border border-[#F6EEDF] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[210px] sm:min-h-[230px] min-w-0"
                >
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 bg-white shadow-2xs border border-slate-100/80 my-auto flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt={locale === 'ar' ? titleAr : titleEn}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300 pointer-events-none"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <div className="w-full pt-2.5 h-[42px] sm:h-[46px] flex items-start justify-center px-0.5">
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base text-center group-hover/card:text-[#043927] transition-colors leading-snug line-clamp-2">
                      {locale === 'ar' ? titleAr : titleEn}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
