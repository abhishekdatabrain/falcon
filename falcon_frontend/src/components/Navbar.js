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
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Tag,
  Sparkles,
  HelpCircle,
  Package
} from 'lucide-react';

import { fetchApi } from '../services/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  React.useEffect(() => {
    fetchApi('/categories?type=parent')
      .then((res) => {
        if (res.success) {
          const rawCats = res.data?.categories || res.data || [];
          const parentsOnly = rawCats.filter(c => !c.parent_id);
          setDbCategories(parentsOnly);
        }
      })
      .catch(() => {});
  }, []);

  // Hide Navbar on Admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const defaultNavCategories = [
    { name_en: 'Deals & Offers', name_ar: 'العروض والخصومات', href: '/products?deals=true' },
    { name_en: 'Groceries', name_ar: 'البقالة والمنتجات الطازجة', href: '/products?category=groceries' },
    { name_en: 'Snacks', name_ar: 'المسليات والوجبات الخفيفة', href: '/products?category=snacks' },
    { name_en: 'Personal Care', name_ar: 'العناية الشخصية', href: '/products?category=personal-care' },
    { name_en: 'Household', name_ar: 'المستلزمات المنزلية', href: '/products?category=household' },
    { name_en: 'Frozen', name_ar: 'المجمدات', href: '/products?category=frozen' },
    { name_en: 'New Arrivals', name_ar: 'وصل حديثاً', href: '/products?sort=newest' },
    { name_en: 'Help', name_ar: 'المساعدة', href: '/contact' },
  ];

  const navCategories = dbCategories && dbCategories.length > 0
    ? [
        { name_en: 'Deals & Offers', name_ar: 'العروض والخصومات', href: '/products?deals=true' },
        ...dbCategories.map(c => ({
          name_en: c.name_en,
          name_ar: c.name_ar,
          href: `/products?category=${encodeURIComponent(c.slug || c.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`
        })),
        { name_en: 'New Arrivals', name_ar: 'وصل حديثاً', href: '/products?sort=newest' },
        { name_en: 'Help', name_ar: 'المساعدة', href: '/contact' },
      ]
    : defaultNavCategories;

  return (
    <header className="sticky top-0 z-50 font-sans shadow-md">
      {/* Primary Main Navbar (Dark Green Bar) */}
      <div className="bg-[#043927] text-white py-3.5 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Side: Logo & Deliver To Location Selector */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black text-white tracking-tight font-serif group-hover:text-emerald-300 transition-colors">
                Logo
              </span>
            </Link>

            {/* Location Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-100/90 hover:text-white transition-colors cursor-pointer border-l border-emerald-800/80 pl-6 rtl:border-r rtl:border-l-0 rtl:pr-6 rtl:pl-0">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="text-emerald-300/80 font-normal">
                  {locale === 'ar' ? 'التوصيل إلى' : 'Deliver to'}
                </span>
                <span className="font-bold text-white">
                  {locale === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-xl relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 rtl:right-4 rtl:left-auto pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ar' ? 'ابحث عن المنتجات والعلامات التجارية والمزيد...' : 'Search for products, brands and more...'}
              className="w-full pl-10 pr-4 py-2.5 rtl:pr-10 rtl:pl-4 rounded-full bg-[#032e1f] text-white placeholder-emerald-200/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all border border-emerald-700/50 shadow-inner"
            />
          </form>

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
              {user ? (
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
                  <span className="hidden md:inline-block">{t('nav.account') || 'Account'}</span>
                </Link>
              )}

              {userDropdownOpen && user && (
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
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-xs font-bold text-emerald-700"
                    >
                      Admin Dashboard
                    </Link>
                  )}
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
              <span className="hidden md:inline-block">{t('nav.wishlist') || 'Wishlist'}</span>
              {wishlistCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center -mt-2 -ml-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors relative">
              <ShoppingBag className="w-4.5 h-4.5" />
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
      <div className="bg-[#032d1f] text-white py-2 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/80 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto scrollbar-none font-semibold text-xs whitespace-nowrap">
          {/* All Categories Button */}
          <Link
            href="/products"
            className="flex items-center gap-1.5 hover:text-emerald-300 text-white font-extrabold pr-3 border-r border-emerald-800 rtl:border-l rtl:border-r-0 rtl:pl-3 rtl:pr-0"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
            <span>{locale === 'ar' ? 'جميع الاقسام' : 'All'}</span>
          </Link>

          {/* Nav Categories List */}
          {navCategories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="text-emerald-100/90 hover:text-white hover:underline transition-colors py-0.5"
            >
              {locale === 'ar' ? cat.name_ar : cat.name_en}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#043927] text-white p-4 space-y-3 border-b border-emerald-800">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[#032e1f] text-white text-xs"
            />
          </form>

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
