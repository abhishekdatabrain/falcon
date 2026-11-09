'use client';
import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { fetchApi } from '../../../src/services/api';
import {
  resolveCategoryFromHierarchy,
  mergeCategoryData,
  extractBreadcrumbTrailFromApiCategory
} from '../../../src/services/categoryHierarchy';
import CategoryBreadcrumb from '../../../src/components/CategoryBreadcrumb';
import CategoryBanner from '../../../src/components/CategoryBanner';
import SubcategoryGrid from '../../../src/components/SubcategoryGrid';
import ProductCard from '../../../src/components/ProductCard';
import {
  SlidersHorizontal,
  Package,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

/**
 * Loading Skeleton for Category Page
 */
function CategoryPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-64 bg-slate-200 rounded-md"></div>

      {/* Hero Banner Skeleton */}
      <div className="rounded-3xl bg-slate-200 h-36 sm:h-44 w-full"></div>

      {/* Subcategory Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 bg-slate-200 rounded-md"></div>
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-[155px] sm:w-[175px] h-[200px] bg-slate-200 rounded-[22px] shrink-0"></div>
          ))}
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryHierarchyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLanguage();

  // Normalize slug segments from Next.js catch-all route [...slug]
  const rawSlug = params?.slug;
  const slugSegments = useMemo(() => {
    if (Array.isArray(rawSlug)) return rawSlug;
    if (typeof rawSlug === 'string' && rawSlug) return [rawSlug];
    return ['frozen-items'];
  }, [rawSlug]);

  const targetSlug = slugSegments[slugSegments.length - 1] || 'frozen-items';

  // Search parameters for filters, sorting, and pagination
  const sortOption = searchParams.get('sort') || searchParams.get('sortBy') || 'popularity';
  const filterType = searchParams.get('filter') || 'ALL'; // ALL, IN_STOCK, ON_SALE, BEST_SELLER
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const itemsPerPage = 12;

  // Filter sidebar states
  const [allCategories, setAllCategories] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [deliverySpeed, setDeliverySpeed] = useState('express');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Resolved hierarchy state
  const [resolvedHierarchy, setResolvedHierarchy] = useState(() => {
    return resolveCategoryFromHierarchy(slugSegments);
  });

  const [categoryData, setCategoryData] = useState(() => {
    return resolvedHierarchy?.category || null;
  });

  const categoryIdsQuery = searchParams.get('categoryIds');
  const initialCategoryIds = useMemo(() => {
    if (categoryIdsQuery) {
      return categoryIdsQuery.split(',').map((s) => s.trim()).filter(Boolean);
    }
    const currentId = categoryData?.id || categoryData?.slug;
    return currentId ? [currentId] : [];
  }, [categoryIdsQuery, categoryData]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState(initialCategoryIds);

  useEffect(() => {
    setSelectedCategoryIds(initialCategoryIds);
  }, [initialCategoryIds]);

  const handleToggleCategory = (catId, node) => {
    setSelectedCategoryIds((prev) => {
      const isSelected = prev.includes(catId) || (node?.slug && prev.includes(node.slug));
      const next = isSelected ? [] : [catId];
      const newParams = new URLSearchParams(searchParams.toString());
      if (next.length > 0) {
        newParams.set('categoryId', next[0]);
      } else {
        newParams.delete('categoryId');
      }
      newParams.delete('categoryIds');
      newParams.set('page', '1');
      const path = resolvedHierarchy?.cumulativePath || `/category/${slugSegments.join('/')}`;
      router.push(`${path}?${newParams.toString()}`, { scroll: false });
      return next;
    });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load all categories for full hierarchy tree in sidebar
  useEffect(() => {
    async function loadAllCategories() {
      try {
        const res = await fetchApi('/categories?all=true');
        if (res.success && res.data?.categories) {
          setAllCategories(res.data.categories);
        }
      } catch (e) {
        console.log('Using internal categories hierarchy for tree');
      }
    }
    loadAllCategories();
  }, []);

  // 1. Resolve Category Hierarchy & Fetch details from API
  const loadCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve from internal 4-level hierarchy structure first
      const matched = resolveCategoryFromHierarchy(slugSegments);
      setResolvedHierarchy(matched);

      let finalCategory = matched?.category || null;

      // Query Backend API for this category slug
      try {
        const res = await fetchApi(`/categories/${encodeURIComponent(targetSlug)}`);
        if (res.success && res.data?.category) {
          finalCategory = mergeCategoryData(res.data.category, finalCategory);
          const apiTrailInfo = extractBreadcrumbTrailFromApiCategory(res.data.category);
          if (apiTrailInfo) {
            setResolvedHierarchy({
              category: finalCategory,
              breadcrumbTrail: apiTrailInfo.trail,
              level: apiTrailInfo.level,
              cumulativePath: apiTrailInfo.cumulativePath,
              childCategories: finalCategory.subcategories || finalCategory.children || [],
            });
          }
        }
      } catch (apiErr) {
        // Backend didn't find this specific category in DB; fallback to hierarchy
        console.log('Category not in DB or backend offline, using hierarchy definition');
      }

      if (!finalCategory) {
        setError('Category not found');
      } else {
        setCategoryData(finalCategory);
      }
    } catch (err) {
      console.error('Error loading category:', err);
      setError(err.message || 'Could not load category');
    } finally {
      setLoading(false);
    }
  }, [slugSegments, targetSlug]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  // 2. Fetch Products for Active Category Level & Active Filters
  useEffect(() => {
    if (!categoryData) return;
    let isCancelled = false;

    async function fetchProducts() {
      try {
        setProductsLoading(true);

        // Build API query using category identification
        let query = `/products?page=${currentPage}&limit=${itemsPerPage}&sort=${encodeURIComponent(sortOption)}`;
        if (selectedCategoryIds && selectedCategoryIds.length > 0) {
          query += `&categoryIds=${encodeURIComponent(selectedCategoryIds.join(','))}`;
        } else if (categoryData.id) {
          query += `&categoryId=${encodeURIComponent(categoryData.id)}`;
        } else if (categoryData.slug) {
          query += `&categoryId=${encodeURIComponent(categoryData.slug)}`;
        }

        // Apply Price & Brand filters
        if (minPrice > 0) query += `&minPrice=${minPrice}`;
        if (maxPrice < 500) query += `&maxPrice=${maxPrice}`;
        if (selectedBrands.length > 0) {
          query += `&brands=${encodeURIComponent(selectedBrands.join(','))}`;
        }

        let apiProducts = [];
        let totalCount = 0;

        try {
          const res = await fetchApi(query);
          if (res.success && res.data) {
            const list = res.data.products?.products || res.data.products || (Array.isArray(res.data) ? res.data : []);
            if (list.length > 0) {
              apiProducts = list;
              totalCount = res.data.pagination?.total ?? list.length;
            }
            if (Array.isArray(res.data.brands) && res.data.brands.length > 0) {
              setAvailableBrands(res.data.brands);
            }
          }
        } catch (apiErr) {
          // If API fails, fall back to mock data
        }

        if (!isCancelled) {
          let combinedProducts = apiProducts;
          if (combinedProducts.length === 0 && Array.isArray(categoryData.mock_products) && categoryData.mock_products.length > 0) {
            combinedProducts = [...categoryData.mock_products];
            totalCount = combinedProducts.length;
          }

          // Populate available brands if not provided by backend
          if (availableBrands.length === 0 && combinedProducts.length > 0) {
            const brandMap = {};
            combinedProducts.forEach((p) => {
              if (p.brand) {
                brandMap[p.brand] = (brandMap[p.brand] || 0) + 1;
              }
            });
            const extracted = Object.entries(brandMap).map(([name, count]) => ({ name, count }));
            if (extracted.length > 0) setAvailableBrands(extracted);
          }

          // Client-side filtering fallback for mock products
          let filtered = combinedProducts;
          if (apiProducts.length === 0) {
            if (minPrice > 0) filtered = filtered.filter((p) => parseFloat(p.discount_price || p.price) >= minPrice);
            if (maxPrice < 500) filtered = filtered.filter((p) => parseFloat(p.discount_price || p.price) <= maxPrice);
            if (selectedBrands.length > 0) {
              filtered = filtered.filter((p) => p.brand && selectedBrands.includes(p.brand));
            }
          }

          if (filterType === 'IN_STOCK') {
            filtered = filtered.filter((p) => (p.stock_quantity === undefined || p.stock_quantity > 0));
          } else if (filterType === 'ON_SALE') {
            filtered = filtered.filter((p) => p.discount_price && parseFloat(p.discount_price) < parseFloat(p.price));
          } else if (filterType === 'BEST_SELLER') {
            filtered = filtered.filter((p) => Boolean(p.is_best_seller));
          }

          // Client-side sorting for mock products
          if (apiProducts.length === 0) {
            if (sortOption === 'price_asc') {
              filtered.sort((a, b) => parseFloat(a.discount_price || a.price) - parseFloat(b.discount_price || b.price));
            } else if (sortOption === 'price_desc') {
              filtered.sort((a, b) => parseFloat(b.discount_price || b.price) - parseFloat(a.discount_price || a.price));
            } else if (sortOption === 'rating') {
              filtered.sort((a, b) => (parseFloat(b.rating || 0) - parseFloat(a.rating || 0)));
            }
          }

          setProducts(filtered);
          setTotalItems(totalCount || filtered.length);
          setTotalPages(Math.max(1, Math.ceil((totalCount || filtered.length) / itemsPerPage)));
        }
      } catch (err) {
        if (!isCancelled) {
          setProducts(categoryData.mock_products || []);
          setTotalItems((categoryData.mock_products || []).length);
          setTotalPages(1);
        }
      } finally {
        if (!isCancelled) {
          setProductsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [categoryData, currentPage, sortOption, filterType, itemsPerPage, minPrice, maxPrice, selectedBrands, selectedCategoryIds]);

  // URL Query Handlers
  const handleSortChange = (newSort) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('sort', newSort);
    newParams.set('page', '1');
    const path = resolvedHierarchy?.cumulativePath || `/category/${slugSegments.join('/')}`;
    router.push(`${path}?${newParams.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', String(newPage));
    const path = resolvedHierarchy?.cumulativePath || `/category/${slugSegments.join('/')}`;
    router.push(`${path}?${newParams.toString()}`, { scroll: false });

    const elem = document.getElementById('products-section-header');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Brand toggle handler
  const handleToggleBrand = (brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
    handlePageChange(1);
  };

  // Reset filters (preserves category context!)
  const handleResetFilters = () => {
    setMinPrice(0);
    setMaxPrice(500);
    setSelectedBrands([]);
    setDeliverySpeed('express');
    handlePageChange(1);
  };

  // Sidebar tree navigation handler
  const handleSidebarCategorySelect = (node, level, path) => {
    if (path) {
      router.push(path);
    } else if (node.slug) {
      router.push(`/category/${node.slug}`);
    }
  };

  // Count active non-category filters
  const activeFiltersCount = (minPrice > 0 ? 1 : 0) + (maxPrice < 500 ? 1 : 0) + selectedBrands.length;

  // 1. Loading State
  if (loading) {
    return <CategoryPageSkeleton />;
  }

  // 2. Error State with Retry
  if (error || !categoryData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 shadow-sm border border-rose-100">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          {locale === 'ar' ? 'التصنيف غير موجود' : 'Category Not Found'}
        </h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
          {locale === 'ar'
            ? 'عذراً، لم نتمكن من العثور على هذا التصنيف في التسلسل الهرمي. قد يكون الرابط خاطئاً أو تم تعديله.'
            : 'Sorry, we could not find this category in the hierarchy. It may have been moved or removed.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#006E2D] text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <button
            type="button"
            onClick={loadCategoryData}
            className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    );
  }

  const currentLevel = resolvedHierarchy?.level || categoryData.level || 1;
  const breadcrumbTrail = resolvedHierarchy?.breadcrumbTrail || [
    { name_en: categoryData.name_en, name_ar: categoryData.name_ar, slug: categoryData.slug, path: `/category/${categoryData.slug}`, level: currentLevel }
  ];
  const childCategories = resolvedHierarchy?.childCategories || categoryData.children || [];
  const parentPath = resolvedHierarchy?.cumulativePath || `/category/${slugSegments.join('/')}`;

  const categoryTitle = locale === 'ar'
    ? (categoryData.name_ar || categoryData.name_en)
    : (categoryData.name_en || categoryData.name_ar);

  // Pagination Controls Sub-render
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between gap-4 pt-6 pb-4 border-t border-slate-200 text-xs font-semibold">
        <span className="text-slate-500">
          {locale === 'ar'
            ? `صفحة ${currentPage} من ${totalPages}`
            : `Page ${currentPage} of ${totalPages}`}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{locale === 'ar' ? 'السابق' : 'Prev'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => handlePageChange(pg)}
                className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
 currentPage === pg
 ? 'bg-[#043927] text-white shadow-2xs'
 : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
 }`}
              >
                {pg}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>{locale === 'ar' ? 'التالي' : 'Next'}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* 1. Dynamic Breadcrumbs (Home > Level 1 > Level 2 > Level 3 > Level 4) */}
      <CategoryBreadcrumb breadcrumbs={breadcrumbTrail} />

      {/* 2. Responsive Unique Category Banner with Content per Level */}
      <CategoryBanner category={categoryData} level={currentLevel} />

      {/* 3. Subcategories Section (Immediate children; hidden on Level 4) */}
      {currentLevel < 4 && childCategories && childCategories.length > 0 && (
        <SubcategoryGrid
          subcategories={childCategories}
          parentPath={parentPath}
          level={currentLevel}
        />
      )}

      {/* 4. Products & Filter Section */}
      <section id="products-section-header" className="space-y-4 pt-2">
        
        {/* Full Width Product Grid for Category Pages (NO filter sidebar) */}
          <div className="space-y-4">
            
            {/* Toolbar: Category Title, Products Count, Sort dropdown ONLY */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white px-3.5 py-3 sm:px-4.5 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <span className="text-slate-900 font-black text-sm sm:text-base truncate">
                  {categoryTitle}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
                  {totalItems} {locale === 'ar' ? 'منتج متوفر' : 'Products Available'}
                </span>
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 transition-colors px-2.5 py-1 rounded-xl border border-slate-200 shrink-0 self-end sm:self-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#043927]" />
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1 text-xs"
                >
                  <option value="popularity">{locale === 'ar' ? 'الأكثر شعبية' : 'Popularity'}</option>
                  <option value="newest">{locale === 'ar' ? 'الأحدث أولاً' : 'Newest'}</option>
                  <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="rating">{locale === 'ar' ? 'الأعلى تقييماً' : 'Customer Rating'}</option>
                </select>
              </div>
            </div>

            {/* Full-width Product Grid (Up to 5 columns on desktop) */}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="h-80 bg-slate-100/90 rounded-2xl animate-pulse border border-slate-200"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {locale === 'ar' ? 'لا توجد منتجات متاحة' : 'No Products Available'}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  {locale === 'ar'
                    ? 'لا توجد منتجات متاحة حالياً في هذا التصنيف. يمكنك استكشاف التصنيفات الفرعية أعلاه.'
                    : 'No products currently available in this category. Please explore the subcategories above.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {products.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    categoryTitle={categoryTitle}
                  />
                ))}
              </div>
            )}

            {/* Dynamic Pagination */}
            {renderPagination()}
          </div>

      </section>

    </div>
  );
}

export default function CategoryHierarchyPage() {
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryHierarchyContent />
    </Suspense>
  );
}
