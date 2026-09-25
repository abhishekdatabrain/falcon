'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { ShoppingBag, Globe, User, LogOut, Package, Truck, ShieldCheck, Search, PhoneCall, Menu, X, Leaf, Sparkles, Heart, Trash2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { t, locale, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { cart, cartCount, removeItem } = useCart();
  const { wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);

  // Hide customer Navbar on Admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#05442e] border-b border-emerald-900/60 shadow-md font-sans text-white">
      {/* Top Announcement Bar (Black Header) */}
      <div className="bg-black text-white text-xs py-2 px-4 sm:px-8 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-lime-400" />
          <span>{locale === 'ar' ? 'توصيل مجاني للطلبات أكثر من ١٥٠ ريال سعودي' : 'FREE EXPRESS DELIVERY ON ORDERS OVER 150 SAR!'}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-1.5 font-medium text-emerald-200">
            <PhoneCall className="w-3.5 h-3.5 text-lime-400" />
            <span>{locale === 'ar' ? 'الدعم الفني: ٩٦٦٥٠٠٠٠٠٠٠٠+' : 'Support 24/7: +966 500 000 000'}</span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 hover:text-lime-300 font-bold text-xs bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-lime-400" />
            <span>{t('nav.switchLang')}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#05442e] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 fill-current text-emerald-700" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-white tracking-tight font-serif">
                Grocery
              </span>
              <span className="text-[10px] text-lime-300 font-bold uppercase tracking-wider -mt-1">
                {locale === 'ar' ? 'سوبرماركت البقالة الطازجة' : 'Fresh Grocery Supermart'}
              </span>
            </div>
          </Link>

          {/* Search Bar (Compact Center Input) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center w-full max-w-[220px] lg:max-w-[260px] relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
              className="w-full pl-4 pr-10 py-1.5 rounded-full bg-white text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-lime-400 transition-all shadow-sm border border-emerald-900/30"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#05442e] hover:bg-emerald-800 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-lime-300" />
            </button>
          </form>

          {/* Desktop Links & Actions */}
          <div className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse font-semibold text-xs text-white">
            <Link href="/" className="hover:text-lime-300 transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/products" className="hover:text-lime-300 transition-colors">
              {t('nav.products')}
            </Link>
            <Link href="/about" className="hover:text-lime-300 transition-colors">
              {t('nav.about')}
            </Link>
            <Link href="/contact" className="hover:text-lime-300 transition-colors">
              {t('nav.contact')}
            </Link>
            <Link href="/orders" className="hover:text-lime-300 transition-colors font-bold">
              {t('nav.myOrders')}
            </Link>

            {user && user.role === 'DRIVER' && (
              <Link href="/driver/dashboard" className="text-white font-bold bg-emerald-800/80 px-3 py-1.5 rounded-xl border border-emerald-600">
                <Truck className="w-4 h-4 inline mr-1 text-lime-300" /> Driver
              </Link>
            )}
          </div>

          {/* Wishlist, Cart & Auth Controls */}
          <div className="flex items-center gap-3">
            {/* Wishlist / Favorites Icon Button */}
            <Link
              href="/wishlist"
              className="relative w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-105 transition-all group border border-slate-100 cursor-pointer"
              title="Wishlist & Favorites"
            >
              <Heart className={`w-5 h-5 transition-colors ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-800 group-hover:text-rose-500 fill-transparent group-hover:fill-rose-500/10'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag / Cart Icon Button with Items Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCartDropdownOpen(true)}
              onMouseLeave={() => setCartDropdownOpen(false)}
            >
              <Link
                href="/cart"
                onClick={() => setCartDropdownOpen(false)}
                className="relative w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-105 transition-all group border border-slate-100 cursor-pointer"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 text-slate-900 group-hover:text-emerald-700 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#05442e] text-white text-[11px] font-black flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Cart Items Quick Popover */}
              {cartDropdownOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 text-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#05442e] text-xs font-black">
                        {cartCount}
                      </span>
                    </div>

                    <Link
                      href="/cart"
                      onClick={() => setCartDropdownOpen(false)}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      {locale === 'ar' ? 'عرض السلة' : 'View Full Cart'}
                    </Link>
                  </div>

                  {/* List of Added Cart Items */}
                  {!cart?.items || cart.items.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        {locale === 'ar' ? 'سلة التسوق فارغة حالياً' : 'Your shopping cart is empty'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {cart.items.map((item) => {
                          const imgUrl = item.image || (item.product?.img || (item.product?.images && item.product.images[0])) || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300';
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                                  <img
                                    src={imgUrl}
                                    alt={locale === 'ar' ? item.name_ar : item.name_en}
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <h5 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                                    {locale === 'ar' ? item.name_ar : item.name_en}
                                  </h5>
                                  <p className="text-[11px] font-bold text-emerald-700">
                                    {item.quantity} × {parseFloat(item.price || 0).toFixed(2)} SAR
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Subtotal & Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between font-extrabold text-sm">
                          <span className="text-slate-600">{locale === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                          <span className="text-[#05442e]">{parseFloat(cart.subtotal || cart.grandTotal || 0).toFixed(2)} SAR</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/cart"
                            onClick={() => setCartDropdownOpen(false)}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs text-center transition-colors"
                          >
                            {locale === 'ar' ? 'عرض السلة' : 'View Cart'}
                          </Link>
                          <Link
                            href="/checkout"
                            onClick={() => setCartDropdownOpen(false)}
                            className="py-2.5 px-3 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs text-center transition-colors shadow-sm"
                          >
                            {locale === 'ar' ? 'إتمام الطلب' : 'Checkout'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {user && user.role === 'CUSTOMER' ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs font-bold text-lime-300 truncate max-w-[120px]">
                  {user.name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/40 hover:bg-rose-500/40 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs font-bold px-3 py-2 text-white hover:text-lime-300">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="text-xs font-bold px-4 py-2 rounded-xl bg-white text-[#05442e] hover:bg-lime-300 shadow-md transition-all">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-emerald-800 text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#05442e] border-t border-emerald-800 px-6 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white text-slate-900 text-xs"
            />
            <button type="submit" className="absolute right-2 top-2 text-emerald-800">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <Link href="/" className="block text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.home')}</Link>
          <Link href="/products" className="block text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.products')}</Link>
          <Link href="/about" className="block text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</Link>
          <Link href="/contact" className="block text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>{t('nav.contact')}</Link>
          <Link href="/cart" className="block text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>Cart ({cartCount})</Link>
        </div>
      )}
    </header>
  );
}
