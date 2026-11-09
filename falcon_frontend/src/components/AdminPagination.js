'use client';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminPagination({
  pagination = {},
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const currentPage = pagination.currentPage || pagination.page || 1;
  const pageSize = pagination.pageSize || pagination.limit || 10;
  const totalRecords = pagination.totalRecords !== undefined ? pagination.totalRecords : (pagination.total || 0);
  const totalPages = pagination.totalPages || Math.ceil(totalRecords / pageSize) || 1;

  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage || loading) return;
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (onPageSizeChange && !isNaN(newSize)) {
      onPageSizeChange(newSize);
    }
  };

  return (
    <div
      className={`px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${className}`}
    >
      {/* Range and total summary */}
      <div className="flex flex-wrap items-center gap-4 text-slate-500 font-semibold">
        <div>
          {isAr ? (
            <>
              عرض <strong className="text-slate-900">{startRecord}</strong> إلى{' '}
              <strong className="text-slate-900">{endRecord}</strong> من إجمالي{' '}
              <strong className="text-slate-900">{totalRecords}</strong> سجل
            </>
          ) : (
            <>
              Showing <strong className="text-slate-900">{startRecord}</strong>–
              <strong className="text-slate-900">{endRecord}</strong> of{' '}
              <strong className="text-slate-900">{totalRecords}</strong> records
            </>
          )}
        </div>

        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-[11px] text-slate-400 font-normal">
              {isAr ? 'لكل صفحة:' : 'Per page:'}
            </span>
            <select
              value={pageSize}
              onChange={handleSizeChange}
              disabled={loading}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            title={isAr ? 'الصفحة السابقة' : 'Previous Page'}
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isActive = page === currentPage;
            return (
              <button
                type="button"
                key={page}
                onClick={() => handlePageClick(page)}
                disabled={loading}
                className={`min-w-8 h-8 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
 isActive
 ? 'bg-emerald-600 text-white shadow-xs'
 : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
 }`}
              >
                {page}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            title={isAr ? 'الصفحة التالية' : 'Next Page'}
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
