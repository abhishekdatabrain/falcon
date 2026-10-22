'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import { useWishlist } from '../../src/contexts/WishlistContext';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi, getImageUrl } from '../../src/services/api';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  LogIn,
  Sliders,
  Package,
  MapPin,
  CreditCard,
  User,
  Bell,
  Headphones,
  LogOut,
  Home,
  Star,
  Grid,
  List,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();
  const { wishlist, removeFromWishlist, clearWishlist, loading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();

  const [addingId, setAddingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'DEALS' | 'ORGANIC'
  const [sortBy, setSortBy] = useState('RECENT');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [quantities, setQuantities] = useState({});
  const sortRef = useRef(null);

  // Server-side wishlist state
  const [serverProducts, setServerProducts] = useState(null);
  const [serverCounts, setServerCounts] = useState({ total: 0, inStock: 0, deals: 0, organic: 0 });
  const [fetchingServer, setFetchingServer] = useState(false);

  const sortOptions = [
    { value: 'RECENT', label_en: 'Recently Added', label_ar: 'المضاف حديثاً' },
    { value: 'PRICE_LOW', label_en: 'Price: Low to High', label_ar: 'السعر: من الأقل للأعلى' },
    { value: 'PRICE_HIGH', label_en: 'Price: High to Low', label_ar: 'السعر: من الأعلى للأقل' },
    { value: 'RATING', label_en: 'Highest Rated', label_ar: 'الأعلى تقييماً' },
    { value: 'NAME_ASC', label_en: 'Name: A to Z', label_ar: 'الاسم: أ - ي' },
    { value: 'NAME_DESC', label_en: 'Name: Z to A', label_ar: 'الاسم: ي - أ' },
  ];

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch server-side filtered & sorted wishlist
  useEffect(() => {
    let isMounted = true;
    const loadServerWishlist = async () => {
      if (authLoading) return;

      if (!user || user?.role?.toUpperCase() !== 'CUSTOMER') {
        if (isMounted) {
          setServerProducts([]);
          setServerCounts({ total: 0, inStock: 0, deals: 0, organic: 0 });
        }
        return;
      }

      try {
        setFetchingServer(true);
        const params = new URLSearchParams();
        if (activeFilter && activeFilter !== 'ALL') params.set('filter', activeFilter);
        if (sortBy) params.set('sortBy', sortBy);

        const res = await fetchApi(`/wishlist?${params.toString()}`);
        if (isMounted && res && res.success && res.data) {
          setServerProducts(res.data.products || []);
          if (res.data.counts) {
            setServerCounts(res.data.counts);
          }
        }
      } catch (err) {
        console.warn('Error fetching server-side wishlist:', err.message);
      } finally {
        if (isMounted) setFetchingServer(false);
      }
    };

    loadServerWishlist();
    return () => {
      isMounted = false;
    };
  }, [authLoading, user, activeFilter, sortBy, wishlist.length]);

  // Map items directly from server response (or fallback to local context wishlist)
  const rawItems = useMemo(() => {
    if (serverProducts !== null) {
      if (activeFilter !== 'ALL') {
        return serverProducts;
      }
      if (serverProducts.length > 0) {
        return serverProducts;
      }
      if (wishlist && wishlist.length > 0) {
        return wishlist;
      }
      return [];
    }
    return wishlist || [];
  }, [serverProducts, activeFilter, wishlist]);
  const displayItems = rawItems.map((item, idx) => {
    const p = item.product || item;
    const img = p.image_url ||
      (Array.isArray(p.images) && p.images.length > 0
        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.image_url)
        : null) ||
      '';

    const basePrice = parseFloat(p.price || 0);
    const discountPrice = p.discount_price ? parseFloat(p.discount_price) : null;
    const hasDiscount = discountPrice !== null && !isNaN(discountPrice) && discountPrice < basePrice;
    const finalPrice = hasDiscount ? discountPrice : basePrice;

    const inStock = p.stock_quantity !== undefined && p.stock_quantity !== null
      ? Number(p.stock_quantity) > 0
      : (p.is_available !== false);

    const title = (locale === 'ar' && p.name_ar) ? p.name_ar : (p.name_en || p.name || 'Product');
    const desc = (locale === 'ar' && p.description_ar) ? p.description_ar : (p.description_en || p.description || '');

    return {
      id: p.id || `item-${idx}`,
      name: title,
      brand: p.brand || p.brand_name || (p.category ? (locale === 'ar' && p.category.name_ar ? p.category.name_ar : p.category.name_en) : ''),
      description: desc,
      rating: p.rating ? parseFloat(p.rating) : null,
      reviews_count: p.reviews_count || p.review_count || 0,
      price: finalPrice,
      original_price: hasDiscount ? basePrice : null,
      hasDiscount,
      badge_bottom: inStock && Number(p.stock_quantity) <= 5 && Number(p.stock_quantity) > 0
        ? `${locale === 'ar' ? 'بقي فقط' : 'Only'} ${p.stock_quantity} ${locale === 'ar' ? 'قطع' : 'left'}`
        : null,
      tags: p.unit ? [p.unit] : [],
      image_url: img,
      in_stock: inStock,
      stock_qty: p.stock_quantity || 0,
      rawProduct: p
    };
  });

  const totalCount = (serverCounts && serverCounts.total > 0)
    ? serverCounts.total
    : (wishlist && wishlist.length > 0 ? wishlist.length : displayItems.length);
  const inStockCount = (serverCounts && serverCounts.inStock !== undefined)
    ? serverCounts.inStock
    : displayItems.filter((i) => i.in_stock).length;
  const dealsCount = (serverCounts && serverCounts.deals !== undefined)
    ? serverCounts.deals
    : displayItems.filter((i) => i.hasDiscount).length;
  const organicCount = serverCounts?.organic || 0;

  const handleQtyChange = (id, delta) => {
    setQuantities((prev) => {
      const curr = prev[id] || 1;
      const next = Math.max(1, curr + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = async (item) => {
    try {
      setAddingId(item.id);
      const qty = quantities[item.id] || 1;
      await addToCart(item.id, qty, item.rawProduct);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    await removeFromWishlist(itemId);
    setServerProducts((prev) => (prev ? prev.filter((p) => p.id !== itemId) : []));
    setServerCounts((prev) => ({
      ...prev,
      total: Math.max(0, (prev.total || 1) - 1),
    }));
  };

  const isLoading = authLoading || (wishlistLoading && (!wishlist || wishlist.length === 0) && serverProducts === null);

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-8">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ================= PAGE TITLE & SUBTITLE ================= */}
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-[#043927] tracking-tight">
            {locale === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {locale === 'ar'
              ? 'تتبع منتجات المزرعة الطازجة، ومنتجات المؤونة المفضلة لديك مع التوصيل السريع إلى الرياض.'
              : 'Keep track of your favorite farm-fresh produce, regional pantry staples, and recurring weekly essentials with express delivery to Riyadh.'}
          </p>
        </div>

        {/* ================= TOP FILTER & CONTROL BAR ================= */}
        <div className="bg-white rounded-xl py-2 px-3 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          
          {/* Tabs Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {locale === 'ar' ? 'الكل' : 'All Items'} ({totalCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('IN_STOCK')}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                activeFilter === 'IN_STOCK'
                  ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {locale === 'ar' ? 'المتوفر فقط' : 'In Stock Only'} ({inStockCount})
            </button>

            {dealsCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('DEALS')}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  activeFilter === 'DEALS'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {locale === 'ar' ? 'العروض' : 'On Deals'} ({dealsCount})
              </button>
            )}

            {organicCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('ORGANIC')}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  activeFilter === 'ORGANIC'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🌱 {locale === 'ar' ? 'عضوي موثق' : 'Organic'} ({organicCount})
              </button>
            )}
          </div>

          {/* Right Sort & View Controls */}
          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 self-end sm:self-auto">
            {/* Custom Dynamic Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 uppercase text-[9px] font-black tracking-wider">
                  {locale === 'ar' ? 'ترتيب:' : 'SORT:'}
                </span>

                <button
                  type="button"
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="bg-white hover:bg-slate-50 border border-[#043927] rounded-full px-3 py-1 text-[#043927] text-[11px] font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#043927]/20"
                >
                  <span>
                    {locale === 'ar'
                      ? (sortOptions.find((o) => o.value === sortBy)?.label_ar || 'المضاف حديثاً')
                      : (sortOptions.find((o) => o.value === sortBy)?.label_en || 'Recently Added')}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#043927] transition-transform duration-200 ${
                      isSortOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Dropdown Menu Popup */}
              {isSortOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                  {sortOptions.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left rtl:text-right px-3 py-1.5 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-[#043927] font-black'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{locale === 'ar' ? opt.label_ar : opt.label_en}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#05A764]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-[#043927]' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white shadow-2xs text-[#043927]' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ================= LEFT ACCOUNT SIDEBAR ================= */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1 text-xs font-sans">
              
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'لوحة المتابعة' : 'Dashboard Overview'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'طلباتي' : 'My Orders'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'تتبع الطلب المباشر' : 'Track Live Order'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl text-white font-black bg-[#043927] shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                  <span>{locale === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}</span>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-200">
                  {wishlist.length}
                </span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'العناوين المسجلة' : 'Saved Addresses'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/profile#payment"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'طرق الدفع' : 'Payment Methods'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'الملف الشخصي' : 'My Profile'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/notifications"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>{locale === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/support"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>{locale === 'ar' ? 'خدمة العملاء' : 'Customer Support'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              {user && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 p-3 rounded-2xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* ================= RIGHT WISHLIST PRODUCTS GRID / LIST (9 Cols) ================= */}
          <div className="lg:col-span-9">

            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200/90 shadow-xs">
                <div className="w-8 h-8 border-4 border-[#043927] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-slate-500">
                  {locale === 'ar' ? 'جاري تحميل قائمة المفضلة...' : 'Loading your wishlist...'}
                </p>
              </div>
            ) : !user ? (
              /* Non-authenticated prompt */
              <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#043927] flex items-center justify-center mx-auto border border-emerald-200">
                  <LogIn className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">
                    {locale === 'ar' ? 'سجل الدخول لعرض المفضلة' : 'Sign In to View Your Wishlist'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    {locale === 'ar'
                      ? 'يرجى تسجيل الدخول لحفظ المنتجات في قائمة المفضلة ومزامنتها عبر جميع أجهزتك.'
                      : 'Please sign in to keep track of your favorite items, sync across all devices, and receive price drop alerts.'}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Sign In Now'}</span>
                  </Link>
                </div>
              </div>
            ) : displayItems.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#043927] flex items-center justify-center mx-auto border border-emerald-200">
                  <Heart className="w-8 h-8 text-[#043927]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">
                    {displayItems.length === 0
                      ? (locale === 'ar' ? 'قائمة المفضلة فارغة حالياً' : 'Your Wishlist is Empty')
                      : (locale === 'ar' ? 'لا توجد منتجات تطابق هذا التصنيف' : 'No Items Match This Filter')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    {displayItems.length === 0
                      ? (locale === 'ar'
                          ? 'استكشف منتجاتنا الطازجة من الخضار والفواكه والألبان والمؤونة وأضف ما يعجبك للمفضلة!'
                          : 'Explore our farm-fresh produce, regional dairy, and pantry items and save your favorites to order anytime!')
                      : (locale === 'ar'
                          ? 'اختر "الكل" لعرض كافة المنتجات المحفوظة في قائمتك.'
                          : 'Switch to "All Items" to view all products saved in your wishlist.')}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>{locale === 'ar' ? 'تصفح المنتجات' : 'Explore Products'}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayItems.map((item) => {
                  const qty = quantities[item.id] || 1;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-emerald-500/40 transition-all font-sans relative ${
                        !item.in_stock ? 'opacity-80 bg-slate-50/70' : ''
                      }`}
                    >
                      {/* Compact Top Media Container */}
                      <div className="relative w-full h-36 sm:h-40 bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center border-b border-slate-100 group">

                        {/* Bottom Left Badge */}
                        {item.badge_bottom && (
                          <span className="absolute bottom-2 left-2 bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs z-10">
                            {item.badge_bottom}
                          </span>
                        )}

                        {/* Out of stock overlay */}
                        {!item.in_stock && (
                          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px] flex items-center justify-center z-15">
                            <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md">
                              {locale === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock'}
                            </span>
                          </div>
                        )}

                        {/* Top Right Remove Trash Button */}
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs z-20 cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Product Image */}
                        <Link href={`/products/${item.id}`} className="w-full h-full flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
                                !item.in_stock ? 'grayscale' : ''
                              }`}
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </Link>
                      </div>

                      {/* Card Body Details */}
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          {item.brand && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block truncate">
                              {item.brand}
                            </span>
                          )}

                          <Link href={`/products/${item.id}`}>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-1 hover:text-[#043927] transition-colors" title={item.name}>
                              {item.name}
                            </h3>
                          </Link>

                          {/* Rating & Tag in single compact line */}
                          <div className="flex items-center justify-between text-[10px] pt-0.5">
                            {item.rating ? (
                              <div className="flex items-center gap-1 font-extrabold text-amber-500">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{item.rating}</span>
                                {item.reviews_count > 0 && (
                                  <span className="text-slate-400 font-medium">({item.reviews_count})</span>
                                )}
                              </div>
                            ) : (
                              <div />
                            )}

                            {item.tags && item.tags.length > 0 && (
                              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold px-1.5 py-0.5 rounded text-[9px]">
                                {item.tags[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Quantity & Move to Cart Button */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm sm:text-base font-black text-slate-900">
                                SAR {item.price.toFixed(2)}
                              </span>
                              {item.original_price && (
                                <span className="text-[11px] text-slate-400 line-through font-semibold">
                                  SAR {item.original_price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <span className={`text-[9px] font-extrabold ${item.in_stock ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {item.in_stock ? (locale === 'ar' ? 'متوفر' : 'In Stock') : (locale === 'ar' ? 'غير متوفر' : 'Unavailable')}
                            </span>
                          </div>

                          {/* Action Buttons Row */}
                          {item.in_stock ? (
                            <div className="flex items-center gap-1.5">
                              {/* Quantity Stepper */}
                              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, -1)}
                                  className="text-slate-500 hover:text-slate-900 px-0.5 cursor-pointer"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="px-1.5 font-black text-xs">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, 1)}
                                  className="text-slate-500 hover:text-slate-900 px-0.5 cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              {/* Move to Cart Button */}
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item)}
                                disabled={addingId === item.id}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-[11px] shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {addingId === item.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ShoppingBag className="w-3 h-3 text-[#05A764]" />
                                )}
                                <span className="truncate">
                                  {addingId === item.id
                                    ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                                    : (locale === 'ar' ? 'أضف للسلة' : 'Move to Cart')}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 rounded-lg bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"
                            >
                              {locale === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock'}
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {displayItems.map((item) => {
                  const qty = quantities[item.id] || 1;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Link
                          href={`/products/${item.id}`}
                          className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center"
                        >
                          {item.image_url ? (
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-slate-300" />
                          )}
                        </Link>

                        <div className="space-y-1 flex-1">
                          {item.brand && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              {item.brand}
                            </span>
                          )}
                          <Link href={`/products/${item.id}`}>
                            <h3 className="font-extrabold text-slate-900 text-sm leading-snug hover:text-[#043927]">
                              {item.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-slate-900">
                              SAR {item.price.toFixed(2)}
                            </span>
                            {item.original_price && (
                              <span className="text-xs text-slate-400 line-through font-semibold">
                                SAR {item.original_price.toFixed(2)}
                              </span>
                            )}
                            <span className={`text-[10px] font-extrabold ${item.in_stock ? 'text-emerald-700' : 'text-rose-600'}`}>
                              • {item.in_stock ? (locale === 'ar' ? 'متوفر' : 'In Stock') : (locale === 'ar' ? 'غير متوفر' : 'Unavailable')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {item.in_stock && (
                          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-800">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.id, -1)}
                              className="text-slate-500 hover:text-slate-900 px-1 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-black">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.id, 1)}
                              className="text-slate-500 hover:text-slate-900 px-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {item.in_stock ? (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            disabled={addingId === item.id}
                            className="py-2.5 px-4 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {addingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5 text-[#05A764]" />
                            )}
                            <span>{locale === 'ar' ? 'أضف للسلة' : 'Move to Cart'}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                            {locale === 'ar' ? 'غير متوفر' : 'Unavailable'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
