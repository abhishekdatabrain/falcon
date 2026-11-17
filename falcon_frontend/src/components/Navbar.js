'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import {
  MapPin,
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  Tag,
  Sparkles,
  HelpCircle,
  Package,
  Loader2,
} from 'lucide-react';

import { fetchApi, getImageUrl } from '../services/api';
import { getCategoryUrl } from '../services/categoryHierarchy';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const isCustomer = Boolean(user && user.role === 'CUSTOMER');
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = React.useRef(null);
  const mobileSearchContainerRef = React.useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  // Live search debounced fetch (300ms, >= 2 characters)
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setSearchResults({ products: [], categories: [] });
        setIsSearching(false);
        setIsSearchOpen(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetchApi(`/products/search?q=${encodeURIComponent(trimmed)}&limit=8`);
        if (res.success && res.data) {
          setSearchResults({
            products: Array.isArray(res.data.products) ? res.data.products : [],
            categories: Array.isArray(res.data.categories) ? res.data.categories : [],
          });
          setIsSearchOpen(true);
        } else {
          setSearchResults({ products: [], categories: [] });
          setIsSearchOpen(true);
        }
      } catch (err) {
        setSearchResults({ products: [], categories: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside and Escape key handler to close search dropdown
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target) &&
        (!mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(e.target))
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    fetchApi('/categories?type=parent')
      .then((res) => {
        if (res.success) {
          const rawCats = res.data?.categories || res.data || [];
          // Strictly show ONLY parent categories (Level 1)
          const parentsOnly = rawCats.filter((c) => !c.parent_id);

          // Deduplicate by slug or ID to prevent duplicate category links
          const seen = new Set();
          const uniqueCats = [];
          for (const c of parentsOnly) {
            const key = (c.slug || c.name_en || c.id || '').toLowerCase();
            if (key && !seen.has(key)) {
              seen.add(key);
              uniqueCats.push(c);
            }
          }
          setDbCategories(uniqueCats);
        }
      })
      .catch(() => { });
  }, []);

  // Hide Navbar on Admin and Driver pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/driver')) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setIsSearchOpen(false);
      setMobileMenuOpen(false);
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectProduct = (productId) => {
    setIsSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/products/${productId}`);
  };

  const handleSelectCategory = (cat) => {
    setIsSearchOpen(false);
    setMobileMenuOpen(false);
    const url = cat.slug
      ? `/products?category=${encodeURIComponent(cat.slug)}`
      : `/products?categoryId=${encodeURIComponent(cat.id)}`;
    router.push(url);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({ products: [], categories: [] });
    setIsSearchOpen(false);
  };

  const renderSearchDropdown = () => {
    if (!isSearchOpen || searchQuery.trim().length < 2) return null;

    const hasCategories = searchResults.categories && searchResults.categories.length > 0;
    const hasProducts = searchResults.products && searchResults.products.length > 0;
    const hasResults = hasCategories || hasProducts;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 text-slate-800 text-left rtl:text-right">
        {/* Loading indicator bar */}
        {isSearching && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>{locale === 'ar' ? 'جارٍ البحث...' : 'Searching...'}</span>
          </div>
        )}

        {/* Categories Section */}
        {hasCategories && (
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 px-1">
              {locale === 'ar' ? 'الأقسام' : 'CATEGORIES'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {searchResults.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-xs font-semibold cursor-pointer transition text-left rtl:text-right"
                >
                  <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{locale === 'ar' ? cat.name_ar || cat.name : cat.name_en || cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {hasProducts && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 pt-3 pb-1">
              {locale === 'ar' ? 'المنتجات' : 'PRODUCTS'}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {searchResults.products.map((p) => {
                const imgUrl = p.thumbnail || p.image;
                const displayName = locale === 'ar' ? p.name_ar || p.name : p.name_en || p.name;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.id)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0">
                        {imgUrl ? (
                          <img
                            src={getImageUrl(imgUrl)}
                            alt={displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                          {p.brand && (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                              {p.brand}
                            </span>
                          )}
                          {p.unit && <span className="text-slate-400">{p.unit}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left shrink-0">
                      {p.salePrice ? (
                        <div>
                          <div className="text-xs font-bold text-emerald-700">
                            SAR {Number(p.salePrice).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400 line-through">
                            SAR {Number(p.price).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-[#0B4F32]">
                          SAR {Number(p.price || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && !hasResults && (
          <div className="px-6 py-6 text-center text-slate-500">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">
              {locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No products or categories found'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {locale === 'ar'
                ? `لم نتمكن من العثور على أي نتائج تطابق "${searchQuery}"`
                : `We couldn't find any matches for "${searchQuery}"`}
            </div>
          </div>
        )}

        {/* View All Results Footer */}
        <div
          onClick={handleSearchSubmit}
          className="px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 cursor-pointer transition group"
        >
          <span>
            {locale === 'ar'
              ? `عرض جميع النتائج لـ "${searchQuery}"`
              : `View all results for "${searchQuery}"`}
          </span>
          <ChevronRight className="w-4 h-4 rtl:rotate-180 text-emerald-700 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  };

  const navCategories = [
    { name_en: 'Deals & Offers', name_ar: 'العروض والخصومات', href: '/products?deals=true' },
    ...(dbCategories || []).map((c) => ({
      name_en: c.name_en,
      name_ar: c.name_ar,
      href: getCategoryUrl(c),
    })),
    { name_en: 'Help', name_ar: 'المساعدة', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Primary Main Navbar (Dark Green Bar) */}
      <div className="bg-[#043927] text-white py-3.5 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Left Side: Logo & Deliver To Location Selector */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs group-hover:shadow-md transition-all">
                <img
                  src="/logo.png"
                  alt="saqrcart"
                  className="h-7 sm:h-8 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Location Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-100/90 hover:text-white transition-colors cursor-pointer border-l border-emerald-800/80 pl-6 rtl:border-r rtl:border-l-0 rtl:pr-6 rtl:pl-0">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="text-emerald-300/80 font-normal">
                  {locale === 'ar' ? 'التوصيل إلى' : 'Deliver to'}
                </span>
                <span className="font-bold text-white">
                  {locale === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Saudi Arabia'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div ref={searchContainerRef} className="hidden sm:flex items-center flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setIsSearchOpen(true);
                  }
                }}
                placeholder={locale === 'ar' ? 'ابحث عن المنتجات والعلامات التجارية والمزيد...' : 'Search for products, brands and more...'}
                className="w-full pl-10 pr-12 rtl:pr-10 rtl:pl-12 py-2.5 rounded-full bg-[#032e1f] text-white placeholder-emerald-200/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all border border-emerald-700/50 shadow-inner"
              />
              <div className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isSearching && (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 rounded-full text-emerald-300/80 hover:text-white hover:bg-emerald-900/60 transition"
                    title={locale === 'ar' ? 'مسح' : 'Clear'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {renderSearchDropdown()}
          </div>

          {/* Right Side Actions: Language, Account, Wishlist, Cart */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-bold text-white shrink-0">

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="hover:text-emerald-300 font-bold transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-900/60"
            >
              {locale === 'ar' ? 'English' : 'العربية'}
            </button>

            {/* User Account / Auth Dropdown */}
            <div className="relative">
              {isCustomer ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="hidden md:inline-block max-w-[90px] truncate">{user.name || user.email}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors">
                  <User className="w-4.5 h-4.5" />
                  <span className="hidden md:inline-block">{t('Account') || 'Account'}</span>
                </Link>
              )}

              {userDropdownOpen && isCustomer && (
                <div className="absolute right-0 rtl:left-0 rtl:right-auto top-8 w-48 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 py-2 z-50 space-y-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    {t('nav.myOrders') || 'My Orders'}
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left rtl:text-right px-4 py-2 hover:bg-rose-50 text-xs font-bold text-rose-600 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors relative">
              <Heart className="w-4.5 h-4.5" />
              <span className="hidden md:inline-block">{t('Wishlist')}</span>
              {wishlistCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center -mt-2 -ml-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden md:inline-block">{t('nav.cart') || 'Cart'}</span>
              {cartCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-black flex items-center justify-center -mt-2 -ml-1 shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 text-white hover:text-emerald-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>
      </div>

      {/* Sub-header Category Navigation Bar */}
      <div className="bg-white text-slate-800 py-2.5 px-4 sm:px-6 lg:px-8 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto scrollbar-none font-medium text-xs whitespace-nowrap">
          {/* All Categories Button */}
          <Link
            href="/products"
            className="flex items-center gap-1.5 hover:text-emerald-700 text-slate-900 font-bold pr-3 border-r border-slate-200 rtl:border-l rtl:border-r-0 rtl:pl-3 rtl:pr-0"
          >
            <Menu className="w-4 h-4 text-slate-700" />
            <span>{locale === 'ar' ? 'جميع الاقسام' : 'All'}</span>
          </Link>

          {/* Nav Categories List */}
          {navCategories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="text-slate-700 hover:text-emerald-800 hover:font-semibold transition-colors py-0.5"
            >
              {locale === 'ar' ? cat.name_ar : cat.name_en}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#043927] text-white p-4 space-y-3 border-b border-emerald-800">
          <div ref={mobileSearchContainerRef} className="relative mb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setIsSearchOpen(true);
                  }
                }}
                placeholder={locale === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                className="w-full pl-9 pr-12 py-2 rounded-full bg-[#032e1f] text-white text-xs placeholder-emerald-200/60 border border-emerald-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 rounded-full text-emerald-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
            {renderSearchDropdown()}
          </div>

          {navCategories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-emerald-100 hover:text-white"
            >
              {locale === 'ar' ? cat.name_ar : cat.name_en}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
