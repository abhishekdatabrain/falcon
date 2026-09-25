'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useCart } from '../../src/contexts/CartContext';
import { useWishlist } from '../../src/contexts/WishlistContext';
import { fetchApi } from '../../src/services/api';
import { Search, ShoppingBag, Leaf, Sparkles, Heart, Check, Plus, ChevronRight } from 'lucide-react';

const getCategoryImageUrl = (cat) => {
  if (cat && cat.image_url && typeof cat.image_url === 'string' && cat.image_url.trim() !== '') {
    return cat.image_url;
  }
  const name = (cat?.name_en || '').toLowerCase();
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop';
};

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const categoryIdParam = searchParams.get('categoryId') || '';
  const subcategoryIdParam = searchParams.get('subcategoryId') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryIdParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryIdParam);
  const [addingId, setAddingId] = useState(null);

  // Sync state with URL search params when clicked from landing page
  useEffect(() => {
    if (categoryIdParam !== selectedCategory) setSelectedCategory(categoryIdParam);
    if (subcategoryIdParam !== selectedSubcategory) setSelectedSubcategory(subcategoryIdParam);
  }, [categoryIdParam, subcategoryIdParam]);

  const loadCategories = async () => {
    try {
      const res = await fetchApi('/categories');
      if (res.success) {
        setCategories(res.data.categories || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = `/products?limit=50&search=${encodeURIComponent(search)}`;
      if (selectedCategory) {
        query += `&categoryId=${selectedCategory}`;
      }
      if (selectedSubcategory) {
        query += `&subcategoryId=${selectedSubcategory}`;
      }
      const res = await fetchApi(query);
      if (res.success) {
        setProducts(res.data.products?.products || res.data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedSubcategory]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('');
    const newParams = new URLSearchParams(searchParams.toString());
    if (catId) {
      newParams.set('categoryId', catId);
    } else {
      newParams.delete('categoryId');
    }
    newParams.delete('subcategoryId');
    router.push(`/products?${newParams.toString()}`);
  };

  const handleSubcategorySelect = (subId) => {
    setSelectedSubcategory(subId);
    const newParams = new URLSearchParams(searchParams.toString());
    if (subId) {
      newParams.set('subcategoryId', subId);
    } else {
      newParams.delete('subcategoryId');
    }
    router.push(`/products?${newParams.toString()}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleAddToCart = async (productId, productObj) => {
    try {
      setAddingId(productId);
      await addToCart(productId, 1, productObj);
    } catch (err) {
      // Toast notification is managed by CartContext
    } finally {
      setAddingId(null);
    }
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const currentSubcategories = categories.filter((c) => c.parent_id && c.parent_id === selectedCategory);
  const activeCategoryObj = parentCategories.find((c) => c.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 font-sans bg-[#fbfcfb]">

      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeCategoryObj
                ? (locale === 'ar' ? activeCategoryObj.name_ar : activeCategoryObj.name_en)
                : (locale === 'ar' ? 'جميع المواد الغذائية' : 'All Supermarket Catalog')}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {locale === 'ar' ? 'تصفح أقسام المنتجات الطازجة واطلب للتوصيل السريع' : 'Browse grocery departments & order for 30-minute delivery'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث عن الفواكه، الحليب، الخضروات...' : 'Search fruits, milk, vegetables...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>
      </div>

      {/* Main 2-Column Catalog Layout (Left Sidebar + Right Product Grid) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* LEFT SIDEBAR: Vertical Categories & Sub-Categories Navigation */}
        <aside className="w-full md:w-64 shrink-0 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs sticky top-24 self-start space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 pt-2 block">
            {locale === 'ar' ? 'الأقسام الرئيسية' : 'Categories'}
          </span>

          {/* "All" Category Button */}
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${selectedCategory === ''
              ? 'bg-purple-50 text-purple-900 border-l-4 border-purple-600 font-extrabold shadow-2xs'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop"
                alt="All"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <span className="truncate">{locale === 'ar' ? 'الكل' : 'All'}</span>
          </button>

          {/* List of Parent Categories */}
          {parentCategories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            const catImage = getCategoryImageUrl(cat);

            return (
              <div key={cat.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${isCatActive
                    ? 'bg-purple-50 text-purple-900 border-l-4 border-purple-600 font-extrabold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-slate-200">
                    <img
                      src={catImage}
                      alt={cat.name_en}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'; }}
                    />
                  </div>
                  <span className="truncate flex-1">{locale === 'ar' ? cat.name_ar : cat.name_en}</span>
                </button>

                {/* Sub-categories nested under active parent category */}
                {isCatActive && currentSubcategories.length > 0 && (
                  <div className="pl-6 space-y-1 py-1 border-l-2 border-purple-100 ml-5">
                    {currentSubcategories.map((sub) => {
                      const isSubActive = selectedSubcategory === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubcategorySelect(sub.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer block truncate ${isSubActive
                            ? 'bg-purple-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                            }`}
                        >
                          ↪ {locale === 'ar' ? sub.name_ar : sub.name_en}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* RIGHT MAIN CONTENT AREA: Product Cards Grid */}
        <main className="flex-1 w-full space-y-4">



          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white h-72 rounded-2xl animate-pulse border border-slate-200/80" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200/80 space-y-3">
              <Leaf className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No grocery products found in this category.</p>
              <button
                onClick={() => handleCategorySelect('')}
                className="text-xs font-bold text-purple-700 hover:underline"
              >
                Clear Category Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((prod) => {
                const primaryImg = (prod.images && prod.images.length > 0 ? (prod.images[0].image_url || prod.images[0]) : prod.image_url) || prod.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';
                const priceVal = parseFloat(prod.price || 0).toFixed(2);

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group relative"
                  >
                    <Link href={`/products/${prod.id}`} className="space-y-2 block group/link">

                      {/* Product Image Container with Overlaid Pink "ADD" Button */}
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 relative border border-slate-100 p-2 flex items-center justify-center">
                        <img
                          src={primaryImg}
                          alt={locale === 'ar' ? prod.name_ar : prod.name_en}
                          className="w-full h-full object-contain group-hover/link:scale-105 transition-transform duration-300"
                        />

                        {/* Wishlist Floating Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(prod);
                          }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 shadow-2xs border border-slate-100 flex items-center justify-center text-slate-700 hover:scale-110 transition-all z-10 cursor-pointer"
                          title="Wishlist"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isInWishlist(prod.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500 hover:text-rose-500'}`} />
                        </button>

                        {/* Overlaid Pink/Emerald "ADD" Pill Button matching user screenshot */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(prod.id, prod);
                          }}
                          disabled={addingId === prod.id}
                          className="absolute bottom-2 right-2 border-2 border-rose-500 bg-white hover:bg-rose-50 text-rose-600 font-extrabold text-[11px] px-3 py-1 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1 z-10 hover:scale-105"
                        >
                          <span>{addingId === prod.id ? '...' : 'ADD'}</span>
                        </button>
                      </div>

                      {/* Pricing Box (Clean Price Pill) */}
                      <div className="pt-1">
                        <span className="bg-emerald-700 text-white font-black text-xs px-2.5 py-1 rounded-lg inline-block shadow-2xs">
                          SAR {priceVal}
                        </span>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug group-hover/link:text-purple-700 transition-colors">
                        {locale === 'ar' ? prod.name_ar : prod.name_en}
                      </h3>

                      {/* Net Qty / Unit */}
                      <span className="text-xs text-slate-500 font-semibold block">
                        {locale === 'ar' ? `الوحدة: ${prod.unit || '200 جم'}` : `${prod.unit || '200 g'}`}
                      </span>

                    </Link>
                  </div>
                );
              })}
            </div>
          )}

        </main>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <ProductsCatalogContent />
    </Suspense>
  );
}
