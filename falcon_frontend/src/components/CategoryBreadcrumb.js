'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Dynamic Breadcrumb Component for 4-Level Category Hierarchy
 * Displays: Home > Level 1 > Level 2 > Level 3 > Level 4
 * Parent items are clickable links, the final item is active.
 */
export default function CategoryBreadcrumb({ breadcrumbs = [] }) {
  const { locale } = useLanguage();

  return (
    <nav aria-label="Breadcrumb" className="font-sans">
      <ol className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 flex-wrap">
        
        {/* Home Link */}
        <li className="flex items-center gap-1">
          <Link
            href="/"
            className="hover:text-emerald-700 transition-colors flex items-center gap-1 text-slate-600 hover:underline"
          >
            <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </Link>
        </li>

        {/* Dynamic Category Hierarchy Trail */}
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const title = locale === 'ar' ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar);

          return (
            <React.Fragment key={item.slug || index}>
              <li className="text-slate-300 rtl:rotate-180 select-none flex items-center">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>

              <li className="flex items-center">
                {isLast ? (
                  <span
                    className="text-[#043927] font-extrabold truncate max-w-[200px] sm:max-w-[320px]"
                    aria-current="page"
                  >
                    {title}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="hover:text-emerald-700 text-slate-600 transition-colors truncate max-w-[140px] sm:max-w-[200px] hover:underline"
                  >
                    {title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}

      </ol>
    </nav>
  );
}
