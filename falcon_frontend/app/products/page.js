'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useCart } from '../../src/contexts/CartContext';
import { useWishlist } from '../../src/contexts/WishlistContext';
import { fetchApi } from '../../src/services/api';
import {
  Search,
  ShoppingBag,
  Leaf,
  Sparkles,
  Heart,
  Check,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Filter,
  Star,
  Truck,
  ShieldCheck,
  Zap,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';

const SAMPLE_CATALOG_PRODUCTS = [
  {
    id: 'sp-1',
    name_en: 'Premium Organic Hass Avocados Ready-to-Eat',
    name_ar: 'أفوكادو هاس عضوي فاخر جاهز للأكل',
    brand_en: 'ORGANIC SANCTUARY',
    brand_ar: 'أورجانيك سانكتشواري',
    unit: '400g Tray',
    rating: '4.9',
    reviews: '1,420',
    price: '14.50',
    mrp: '19.00',
    badge: 'BEST SELLER',
    badgeType: 'amber',
    express: true,
    img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
  },
  {
    id: 'sp-2',
    name_en: 'Crisp Sweet Royal Gala Apples Freshly Handled',
    name_ar: 'تفاح رويال جالا أحمر طازج ومقرمش',
    brand_en: 'SAUDI HARVEST',
    brand_ar: 'حصاد السعودية',
    unit: '1 kg Bag',
    rating: '4.8',
    reviews: '980',
    price: '8.25',
    mrp: '11.50',
    badge: '-15% OFF',
    badgeType: 'red',
    express: true,
    img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
  },
  {
    id: 'sp-3',
    name_en: 'Saudi Sweet Greenhouse Strawberries Hand-Picked',
    name_ar: 'فراولة محمية طازجة منتقاة بعناية',
    brand_en: 'SAUDI LOCAL FARM',
    brand_ar: 'مزرعة سعودية محلية',
    unit: '250g Pack',
    rating: '4.9',
    reviews: '1,120',
    price: '7.50',
    mrp: '9.50',
    badge: 'LOCAL SAUDI',
    badgeType: 'green',
    express: true,
    img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
  },
  {
    id: 'sp-4',
    name_en: 'Saudi Sweet Greenhouse Strawberries Hand-Picked',
    name_ar: 'فراولة محمية طازجة منتقاة بعناية',
    brand_en: 'SAUDI LOCAL FARM',
    brand_ar: 'مزرعة سعودية محلية',
    unit: '250g Pack',
    rating: '4.9',
    reviews: '1,120',
    price: '7.50',
    mrp: '9.50',
    badge: 'LOCAL SAUDI',
    badgeType: 'green',
    express: true,
    img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
  },
  {
    id: 'sp-5',
    name_en: 'Premium Sweet Red Bananas High Potassium',
    name_ar: 'موز أصفر طازج غني بالبوتاسيوم',
    brand_en: 'FARM CHOICE',
    brand_ar: 'خيار المزرعة',
    unit: '1 kg Bag',
    rating: '4.7',
    reviews: '640',
    price: '5.95',
    mrp: '8.00',
    badge: 'BEST SELLER',
    badgeType: 'amber',
    express: true,
    img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
  },
  {
    id: 'sp-6',
    name_en: 'Almarai 100% Pure Fresh Full Cream Milk 2L',
    name_ar: 'حليب المراعي طازج كامل الدسم ٢ لتر',
    brand_en: 'ALMARAI DAIRY',
    brand_ar: 'ألبان المراعي',
    unit: '2 Litre Bottle',
    rating: '4.9',
    reviews: '3,240',
    price: '11.00',
    mrp: '14.00',
    badge: 'BEST SELLER',
    badgeType: 'amber',
    express: true,
    img: '/products/prod_almarai_milk.jpg',
  },
  {
    id: 'sp-7',
    name_en: 'Hydroponic Sweet Vine Cherry Tomatoes Extra Juicy',
    name_ar: 'طماطم كرزية مائية طازجة وشديدة العصير',
    brand_en: 'HYDRO GREEN',
    brand_ar: 'هايدرو جرين',
    unit: '250g Pack',
    rating: '4.9',
    reviews: '820',
    price: '6.80',
    mrp: '8.50',
    badge: 'LOCAL SAUDI',
    badgeType: 'green',
    express: true,
    img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
  },
  {
    id: 'sp-8',
    name_en: 'Hydroponic Sweet Vine Cherry Tomatoes Extra Juicy',
    name_ar: 'طماطم كرزية مائية طازجة وشديدة العصير',
    brand_en: 'HYDRO GREEN',
    brand_ar: 'هايدرو جرين',
    unit: '250g Pack',
    rating: '4.9',
    reviews: '820',
    price: '6.80',
    mrp: '8.50',
    badge: 'LOCAL SAUDI',
    badgeType: 'green',
    express: true,
    img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
  },
  {
    id: 'sp-9',
    name_en: 'Saudi Sweet Seedless Red Watermelon Pre-Cut',
    name_ar: 'بطيخ أحمر خالي من البذر مقطع طازج',
    brand_en: 'SAUDI HARVEST',
    brand_ar: 'حصاد السعودية',
    unit: 'Half Fruit (1.5 kg)',
    rating: '4.8',
    reviews: '560',
    price: '12.50',
    mrp: '16.00',
    badge: '-15% OFF',
    badgeType: 'red',
    express: true,
    img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
  },
  {
    id: 'sp-10',
    name_en: 'NADEC Premium Farm Fresh Large Brown Eggs 30s',
    name_ar: 'بيض نادك مزارع بني طازج ٣٠ حبة',
    brand_en: 'NADEC POULTRY',
    brand_ar: 'نادك الدواجن',
    unit: 'Carton of 30 Eggs',
    rating: '4.9',
    reviews: '2,150',
    price: '21.50',
    mrp: '26.00',
    badge: 'BEST SELLER',
    badgeType: 'amber',
    express: true,
    img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400',
  },
  {
    id: 'sp-11',
    name_en: 'Fresh Harvest Mint & Crisp Coriander Bunch',
    name_ar: 'نعناع وحزمة كزبرة طازجة من المزرعة',
    brand_en: 'LOCAL SAUDI FARM',
    brand_ar: 'مزرعة سعودية محلية',
    unit: '1 Fresh Bunch',
    rating: '4.7',
    reviews: '410',
    price: '3.50',
    mrp: '5.00',
    badge: 'LOCAL SAUDI',
    badgeType: 'green',
    express: true,
    img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400',
  },
  {
    id: 'sp-12',
    name_en: 'Hydroponic Sweet Vine Cherry Tomatoes Extra Juicy',
    name_ar: 'طماطم كرزية مائية طازجة وشديدة العصير',
    brand_en: 'HYDRO GREEN',
    brand_ar: 'هايدرو جرين',
    unit: '250g Pack',
    rating: '4.9',
    reviews: '820',
    price: '6.80',
    mrp: '8.50',
    badge: 'LOCAL SAUDI',
    badgeType: 'green',
    express: true,
    img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
  },
];

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const { addToCart, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const categoryIdParam = searchParams.get('categoryId') || searchParams.get('category') || '';
  const subcategoryIdParam = searchParams.get('subcategoryId') || searchParams.get('sub') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryIdParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryIdParam);
  const [addingId, setAddingId] = useState(null);
  const [activeFilterChip, setActiveFilterChip] = useState('ALL');
  const [priceRange, setPriceRange] = useState(150);
  const [selectedBrands, setSelectedBrands] = useState(['FreshKart Organic Farms']);

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
      if (selectedCategory) query += `&categoryId=${selectedCategory}`;
      if (selectedSubcategory) query += `&subcategoryId=${selectedSubcategory}`;
      const res = await fetchApi(query);
      if (res.success && res.data) {
        const fetched = res.data.products?.products || res.data.products || [];
        setProducts(fetched.length > 0 ? fetched : SAMPLE_CATALOG_PRODUCTS);
      } else {
        setProducts(SAMPLE_CATALOG_PRODUCTS);
      }
    } catch (err) {
      console.error('API product load fallback:', err);
      setProducts(SAMPLE_CATALOG_PRODUCTS);
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
    if (catId) newParams.set('category', catId);
    else newParams.delete('category');
    newParams.delete('sub');
    router.push(`/products?${newParams.toString()}`);
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

  const getCartQty = (prodId) => {
    const found = items?.find((i) => i.product_id === prodId || i.id === prodId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 font-sans bg-[#fbfcfb]">

      {/* 1. Category Hero Banner */}
      <div className="bg-[#043927] rounded-3xl p-6 sm:p-10 relative overflow-hidden text-white shadow-md font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-8 space-y-3 text-left rtl:text-right z-10">
            <div className="flex items-center gap-2">
              <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                100% FARM FRESH
              </span>
              <span className="bg-amber-500/90 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                BEST PRICE GUARANTEED
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-tight font-sans">
              {locale === 'ar' ? 'فواكه وخضروات طازجة من المزرعة' : 'Fresh Farm Fruits & Groceries'}
            </h1>

            <p className="text-[#A3E062] font-medium text-xs sm:text-sm lg:text-base max-w-2xl leading-relaxed">
              {locale === 'ar'
                ? 'منتجات مزارع طازجة منتقاة بعناية وموثقة 100٪ للتغذية اليومية لعائلتك، مباشرة من المزرعة إلى مائدتك.'
                : 'Hand-picked 100% certified fresh farm produce, fruits, herbs and whole foods for your daily nutrition. Direct farm-to-table for your family\'s health.'}
            </p>
          </div>

          {/* Right Crate Visual Illustration */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end z-10">
            <div className="relative w-48 sm:w-56 h-36 sm:h-44 bg-emerald-900/50 rounded-2xl border border-emerald-600/40 p-3 flex flex-col items-center justify-center text-center shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
                alt="Farm Fresh Crate"
                className="w-full h-full object-cover rounded-xl opacity-90 hover:opacity-100 transition-opacity"
              />
              <span className="absolute bottom-2 bg-emerald-950/90 text-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-400/40">
                🌿 Farm Fresh Produce
              </span>
            </div>
          </div>

        </div>

        {/* Decorative Wave Accent Overlay */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none bg-gradient-to-l from-emerald-400 to-transparent"></div>
      </div>

      {/* 2. Breadcrumb Navigation & Active Filter Chips Bar */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <span>›</span>
          <span className="hover:text-emerald-700 transition-colors">{locale === 'ar' ? 'البقالة' : 'Groceries'}</span>
          <span>›</span>
          <span className="text-slate-900 font-bold">{locale === 'ar' ? 'المنتجات الطازجة والفواكه' : 'Fresh Produce & Fruits'}</span>
        </div>

        {/* Filter Chips Row & Sort Control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          
          {/* Left Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label_en: 'ALL (148)', label_ar: 'الكل (١٤٨)' },
              { id: 'ORGANIC', label_en: 'Organic Section 1', label_ar: 'قسم العضوي ١' },
              { id: 'FRESH_SMALL', label_en: 'Fresh Small Produce 1', label_ar: 'منتجات طازجة 1' },
              { id: 'SMALL_MED', label_en: 'Small Medium 1', label_ar: 'حجم متوسط ١' },
              { id: 'DISCOUNT', label_en: 'Discounts > 45%', label_ar: 'خصومات ٤٥٪+', isGold: true },
              { id: 'SHOW_ALL', label_en: 'Show All', label_ar: 'عرض الكل' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilterChip(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilterChip === chip.id
                    ? 'bg-[#043927] text-white shadow-xs'
                    : chip.isGold
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {locale === 'ar' ? chip.label_ar : chip.label_en}
              </button>
            ))}
          </div>

          {/* Right Items Count & Sort Selector */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 shrink-0 self-end sm:self-auto">
            <span>{locale === 'ar' ? 'عرض ١٤٨ منتج' : 'Showing 148 items'}</span>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-slate-400">{locale === 'ar' ? 'ترتيب حسب:' : 'Sort By:'}</span>
              <select className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer">
                <option>{locale === 'ar' ? 'المميزة' : 'Featured'}</option>
                <option>{locale === 'ar' ? 'السعر: من الأقل' : 'Price: Low to High'}</option>
                <option>{locale === 'ar' ? 'السعر: من الأعلى' : 'Price: High to Low'}</option>
                <option>{locale === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main 2-Column Catalog Layout (Left Sidebar Filters + Right 4-Column Product Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT SIDEBAR FILTERS PANEL (3 Columns) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-6 sticky top-24 self-start font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#043927]" />
              <span>{locale === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}</span>
            </h3>
            <button
              onClick={() => {
                setActiveFilterChip('ALL');
                setSelectedCategory('');
                setPriceRange(150);
              }}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {locale === 'ar' ? 'إعادة ضبط' : 'Reset All'}
            </button>
          </div>

          {/* 1. Produce Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'تصنيفات المنتجات' : 'Produce Categories'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              {[
                { name: 'Fresh Fruits', count: 32, checked: true },
                { name: 'Crisp Vegetables', count: 41, checked: false },
                { name: 'Aromatic Herbs & Greens', count: 19, checked: false },
                { name: 'Farm Dairy & Chilled Eggs', count: 15, checked: false },
              ].map((cat, idx) => (
                <label key={idx} className="flex items-center justify-between hover:text-[#043927] cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      defaultChecked={cat.checked}
                      className="w-4 h-4 rounded border-slate-300 text-[#043927] focus:ring-[#043927]"
                    />
                    <span className={cat.checked ? 'font-bold text-[#043927]' : ''}>{cat.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">({cat.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Delivery Speed */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'سرعة التوصيل' : 'Delivery Speed'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer text-[#043927] font-bold">
                <input type="radio" name="speed" defaultChecked className="w-4 h-4 text-[#043927]" />
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Express 2-Hours</span>
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                <input type="radio" name="speed" className="w-4 h-4 text-[#043927]" />
                <span>Scheduled Delivery Slot</span>
              </label>
            </div>
          </div>

          {/* 3. Price Range (SAR) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{locale === 'ar' ? 'نطاق السعر (ريال)' : 'Price Range (SAR)'}</span>
              <span className="text-[#043927] font-black">SAR 5 - SAR {priceRange}</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full accent-[#043927] cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="SAR 5"
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-bold text-slate-700"
              />
              <span className="text-slate-400">-</span>
              <input
                type="text"
                readOnly
                value={`SAR ${priceRange}`}
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-bold text-slate-700"
              />
            </div>
          </div>

          {/* 4. Dietary & Harvest Type */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'نوع الحصاد' : 'Dietary & Harvest Type'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              {[
                { name: '100% Organic Certified', count: 45 },
                { name: 'Saudi Local Farm Produce', count: 74 },
                { name: 'Pesticide Free & Hydroponic', count: 61 },
                { name: 'Halal Certified', count: 98 },
                { name: 'Winter Fresh Harvest', count: 19 },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between hover:text-[#043927] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#043927]" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">({item.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Trusted Farm Brands */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'العلامات التجارية الموثوقة' : 'Trusted Farm Brands'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              {[
                { name: 'FreshKart Organic Farms', count: 41 },
                { name: 'Almarai / Al Kabeer', count: 35 },
                { name: 'NADEC Foods', count: 28 },
                { name: 'Sunbulah / Hayat', count: 19 },
                { name: 'Emirates Selection', count: 11 },
              ].map((brand, idx) => (
                <label key={idx} className="flex items-center justify-between hover:text-[#043927] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      defaultChecked={selectedBrands.includes(brand.name)}
                      className="w-4 h-4 rounded border-slate-300 text-[#043927]"
                    />
                    <span>{brand.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">({brand.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 6. Customer Ratings */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'تقييم العملاء' : 'Customer Ratings'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer text-amber-500 font-bold">
                <input type="radio" name="rating" defaultChecked className="w-4 h-4 text-[#043927]" />
                <span className="flex items-center gap-1">
                  <span>★★★★☆</span>
                  <span className="text-slate-700 font-semibold">4.0 & Up (112)</span>
                </span>
              </label>
            </div>
          </div>

        </aside>

        {/* RIGHT MAIN CONTENT AREA: 4-Column Product Cards Grid (9 Columns) */}
        <main className="lg:col-span-9 w-full space-y-6">

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4.5">
            {products.map((prod) => {
              const qtyInCart = getCartQty(prod.id);
              const isWish = isInWishlist(prod.id);

              return (
                <div
                  key={prod.id}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#05A764] shadow-2xs hover:shadow-lg transition-all duration-300 p-3.5 flex flex-col justify-between relative font-sans cursor-pointer min-h-[410px]"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs ${
                        prod.badgeType === 'red'
                          ? 'bg-rose-600'
                          : prod.badgeType === 'green'
                          ? 'bg-[#05A764]'
                          : 'bg-[#FFA500]'
                      }`}
                    >
                      <Star className="w-2.5 h-2.5 fill-current text-white" />
                      <span>{prod.badge || 'BEST SELLER'}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(prod);
                      }}
                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                      title="Add to Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isWish ? 'text-rose-500 fill-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Product Image Container */}
                  <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center my-1.5 relative">
                    <img
                      src={prod.img || (prod.images && prod.images[0]?.image_url) || prod.image_url}
                      alt={locale === 'ar' ? prod.name_ar || prod.title_ar : prod.name_en || prod.title_en}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Weight / Packaging Tag */}
                  <div className="mb-1">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                      {prod.unit || '400g Tray'}
                    </span>
                  </div>

                  {/* Info Content */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Brand & Rating Bar */}
                      <div className="flex items-center justify-between text-[11px] font-medium leading-none mb-1">
                        <span className="text-slate-400 truncate max-w-[110px] uppercase font-bold text-[10px]">
                          {prod.brand_en || 'ORGANIC FARM'}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                          <span>★ {prod.rating || '4.9'}</span>
                          <span className="text-slate-400 font-normal">({prod.reviews || '1,420'})</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug font-sans group-hover:text-[#043927] transition-colors mb-1">
                        {locale === 'ar' ? prod.name_ar || prod.title_ar : prod.name_en || prod.title_en}
                      </h3>

                      {/* Delivery Speed Badge */}
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mb-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Express Delivery in 2h</span>
                      </div>
                    </div>

                    {/* Price & Add to Cart Action Row */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-end justify-between gap-1">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm sm:text-base font-black text-slate-900 font-sans">
                            SAR {prod.price}
                          </span>
                          {prod.mrp && (
                            <span className="text-[10px] text-slate-400 line-through font-normal">
                              SAR {prod.mrp}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add Button or Quantity Selector */}
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1.5 bg-[#043927] text-white rounded-lg px-2 py-1 text-xs font-bold shadow-2xs">
                          <button onClick={() => handleAddToCart(prod.id, prod)} className="p-0.5 hover:text-amber-300">
                            -
                          </button>
                          <span>{qtyInCart} in cart</span>
                          <button onClick={() => handleAddToCart(prod.id, prod)} className="p-0.5 hover:text-amber-300">
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(prod.id, prod);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#043927] hover:bg-[#02281b] text-white font-bold text-[11px] shadow-2xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'أضف' : 'Add to Cart'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Pagination & Item Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
            <span className="text-slate-500 font-medium">
              {locale === 'ar' ? 'عرض ١ - ١٢ من أصل ١٤٨ منتج' : 'Showing 1 - 12 of 148 items'}
            </span>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                ‹
              </button>
              <button className="w-8 h-8 rounded-lg bg-[#043927] text-white font-bold flex items-center justify-center shadow-2xs">
                1
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                2
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                3
              </button>
              <span className="px-1 text-slate-400">...</span>
              <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                13
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                ›
              </button>
            </div>
          </div>

          {/* Bottom Trust Feature Cards (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 font-sans">
            <div className="bg-[#F0FDF4] p-4.5 rounded-2xl border border-emerald-100 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#05A764] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900">{locale === 'ar' ? '١٠٠٪ طازج أو مجاناً' : '100% Fresh or Free'}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {locale === 'ar' ? 'ضمان الانتعاش التام أو الاسترجاع الفوري' : '100% freshness guaranteed or return instantly with full refund.'}
                </p>
              </div>
            </div>

            <div className="bg-[#ECFEFF] p-4.5 rounded-2xl border border-cyan-100 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900">{locale === 'ar' ? 'سلسلة تبريد مستمرة' : 'Continuous Cold Chain'}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {locale === 'ar' ? 'توصيل مبرد بشاحنات محكومة الحرارة' : 'Harvested & delivered under temperature controlled environment.'}
                </p>
              </div>
            </div>

            <div className="bg-[#FFFBEB] p-4.5 rounded-2xl border border-amber-100 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900">{locale === 'ar' ? 'فواكه سعودية فاخرة' : 'Saudi Famous Fruit'}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {locale === 'ar' ? 'محاصيل محلياً من أفضل مزارع المملكة' : 'Selection of premier vegetables and fruits harvested locally.'}
                </p>
              </div>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#043927] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}
