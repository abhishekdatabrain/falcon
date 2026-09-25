'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useCart } from '../src/contexts/CartContext';
import { useWishlist } from '../src/contexts/WishlistContext';
import { useToast } from '../src/contexts/ToastContext';
import { fetchApi } from '../src/services/api';
import { ShoppingBag, Truck, ShieldCheck, FileCheck, ArrowRight, Star, Sparkles, CheckCircle2, Leaf, Tag, ChevronRight, ChevronLeft, Gift, Headphones, Shield, Smartphone, Heart, Flame, TrendingUp } from 'lucide-react';

const SAFE_DEFAULT_CATEGORIES = [
  { id: 'cat-1', name_en: 'Fruits & Vegetables', name_ar: 'فواكه وخضروات', image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop' },
  { id: 'cat-2', name_en: 'Fresh Grocery & Dairy', name_ar: 'بقالة وألبان طازجة', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop' },
  { id: 'cat-3', name_en: 'Beverages & Juices', name_ar: 'مشروبات وعصائر', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop' },
  { id: 'cat-4', name_en: 'Bakery & Bread', name_ar: 'مخبوزات وخبز', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop' },
  { id: 'cat-5', name_en: 'Electronics & Gadgets', name_ar: 'الإلكترونيات والأجهزة', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop' },
  { id: 'cat-6', name_en: 'Home & Kitchen', name_ar: 'المنزل والمطبخ', image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop' },
];

const HERO_SLIDES = [
  {
    id: 1,
    tag_en: 'Daily Grocery',
    tag_ar: 'البقالة اليومية',
    title_en: 'Fresh and Healthy Grocery Store',
    title_ar: 'متجر البقالة الطازجة والصحية',
    desc_en: 'Enjoy organically grown fruits, vegetables, and seasonal produce delivered directly from local farm in 30 minutes.',
    desc_ar: 'تمتع بالفواكه والخضروات العضوية الطازجة التي تصلك مباشرة من المزرعة خلال ٣٠ دقيقة.',
    btn_en: 'Shop Now',
    btn_ar: 'تسوق الآن',
    bg: 'bg-[#05442e]',
    accentColor: 'text-amber-300',
    btnStyle: 'bg-[#16a34a] text-white hover:bg-emerald-700',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
  },
  {
    id: 2,
    tag_en: 'Exotic Picks',
    tag_ar: 'تشكيلة استوائية',
    title_en: 'Premium Fresh Watermelons & Tropical Fruits',
    title_ar: 'بطيخ أحمر حلو وفواكه استوائية طازجة',
    desc_en: 'Hand-picked premium organic watermelons, kiwis, berries, and dragon fruits with guaranteed freshness.',
    desc_ar: 'بطيخ أحمر عضوي منتقى بعناية مع ضمان الجودة والانتعاش التام.',
    btn_en: 'Explore Fruits',
    btn_ar: 'استكشف الفواكه',
    bg: 'bg-[#064e3b]',
    accentColor: 'text-emerald-300',
    btnStyle: 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300',
    img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',
  },
  {
    id: 3,
    tag_en: 'Seafood Special',
    tag_ar: 'عروض أسماك',
    title_en: 'Fresh Farm Produce & Ocean Catches',
    title_ar: 'أسماك ومأكولات بحرية طازجة يومياً',
    desc_en: '100% Organically harvested grocery produce and fresh lobsters delivered in cold chain logistics.',
    desc_ar: 'منتجات طازجة ومأكولات بحرية مبردة تصلك بسيارات مجهزة بدرجة حرارة خاضعة للرقابة.',
    btn_en: 'Order Grocery',
    btn_ar: 'اطلب الآن',
    bg: 'bg-[#064e3b]',
    accentColor: 'text-emerald-300',
    btnStyle: 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300',
    img: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800',
  },
];

const getCategoryImageUrl = (cat) => {
  if (cat && cat.image_url && typeof cat.image_url === 'string' && cat.image_url.trim() !== '') {
    return cat.image_url;
  }
  const name = (cat?.name_en || '').toLowerCase();
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop';
};



const FEATURED_BANNERS = [
  {
    title_en: 'From ocean to your kitchen',
    title_ar: 'من المحيط مباشرة إلى مطبخك',
    subtitle_en: 'Fresh seafood, lobsters & ocean catches',
    subtitle_ar: 'أسماك ومأكولات بحرية طازجة يومياً',
    btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    cardBg: 'bg-[#e8f5e9]',
    img: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600',
  },
  {
    title_en: 'Fresh & Organic Drinks',
    title_ar: 'مشروبات وعصائر عضوية',
    subtitle_en: 'Cold pressed juices & organic dairy',
    subtitle_ar: 'عصائر طازجة وألبان نقية',
    btnBg: 'bg-amber-700 hover:bg-amber-800 text-white',
    cardBg: 'bg-[#fef9c3]',
    img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600',
  },
  {
    title_en: 'Perfect Picks for Meat Lovers',
    title_ar: 'لحوم طازجة وقطعيات فاخرة',
    subtitle_en: 'Farm-fresh beef, steaks & tender poultry',
    subtitle_ar: 'لحوم طازجة مبردة من المزارع',
    btnBg: 'bg-sky-700 hover:bg-sky-800 text-white',
    cardBg: 'bg-[#e0f2fe]',
    img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600',
  },
];

const PROMO_DEALS = [
  { discount: '-15%', title_en: 'Organic Veggies - 100% Farm Fresh', title_ar: 'خضار عضوية طازجة من المزرعة', img: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600', bg: 'bg-[#f0fdf4]' },
  { discount: '-20%', title_en: 'Seafood Deals - Fresh & Tasty', title_ar: 'عروض المأكولات البحرية الطازجة', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', bg: 'bg-[#ecfeff]' },
  { discount: '-10%', title_en: 'Bakery Specials - Soft & Fresh', title_ar: 'مخبوزات طازجة يومياً', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', bg: 'bg-[#fffbeb]' },
  { discount: '-25%', title_en: 'Burger Bites - Loaded & Delicious', title_ar: 'برجر ولحوم جاهزة للطهي', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', bg: 'bg-[#fdf2f8]' },
];

const STATIC_GREEN_FRESH = [
  { id: 'st-1', name_en: 'Lady Finger (500 g)', name_ar: 'بامية طازجة (500 جرام)', price: '20.00', img: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=400' },
  { id: 'st-2', name_en: 'Fresh Potatoes (1 kg)', name_ar: 'بطاطس طازجة (1 كجم)', price: '4.00', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400' },
  { id: 'st-3', name_en: 'Watermelon Fresh', name_ar: 'بطيخ أحمر طازج', price: '4.00', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400' },
  { id: 'st-4', name_en: 'Fresh Bananas (1 kg)', name_ar: 'موز طازج (1 كجم)', price: '2.50', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { id: 'st-5', name_en: 'Organic Kiwi (500 g)', name_ar: 'كيوي عضوي (500 جرام)', price: '3.50', img: 'https://images.unsplash.com/photo-1585059819970-311904b48f61?w=400' },
  { id: 'st-6', name_en: 'Pure Olive & Cooking Oil', name_ar: 'زيت طهي نقي (1 لتر)', price: '7.00', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
  { id: 'st-7', name_en: 'Farm Fresh Meat Cuts', name_ar: 'لحم طازج مبرد (1 كجم)', price: '35.00', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400' },
  { id: 'st-8', name_en: 'Fresh Red Tomatoes (1 kg)', name_ar: 'طماطم حمراء طازجة (1 كجم)', price: '3.00', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400' },
  { id: 'st-9', name_en: 'Green Broccoli (500 g)', name_ar: 'بروكلي أخضر (500 جرام)', price: '5.00', img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400' },
  { id: 'st-10', name_en: 'Organic Strawberries', name_ar: 'فراولة عضوية (250 جرام)', price: '4.50', img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400' },
];

const STATIC_MOST_BUY = [
  { id: 'mb-1', name_en: 'Watermelon Fresh', name_ar: 'بطيخ أحمر طازج', price: '4.00', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400' },
  { id: 'mb-2', name_en: 'Fresh Bananas (1 kg)', name_ar: 'موز طازج (1 كجم)', price: '2.50', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { id: 'mb-3', name_en: 'Organic Kiwi (500 g)', name_ar: 'كيوي عضوي (500 جرام)', price: '3.50', img: 'https://images.unsplash.com/photo-1585059819970-311904b48f61?w=400' },
  { id: 'mb-4', name_en: 'Pure Olive & Cooking Oil', name_ar: 'زيت طهي نقي (1 لتر)', price: '7.00', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
  { id: 'mb-5', name_en: 'Farm Fresh Meat Cuts', name_ar: 'لحم طازج مبرد (1 كجم)', price: '35.00', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400' },
];

const STATIC_TRENDING = [
  {
    id: 'tr-1',
    name_en: 'Organic Red Strawberries (250 g)',
    name_ar: 'فراولة حمراء عضوية (250 جرام)',
    price: '14.50',
    mrp: '18.00',
    badge: 'Trending 🔥',
    badge_ar: 'شائع 🔥',
    img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
  },
  {
    id: 'tr-2',
    name_en: 'Organic Hass Avocados (2 pcs)',
    name_ar: 'أفوكادو هاس عضوي (حبتان)',
    price: '16.00',
    mrp: '20.00',
    badge: 'Hot Pick',
    badge_ar: 'الأكثر طلباً',
    img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
  },
  {
    id: 'tr-3',
    name_en: 'Extra Virgin Olive Oil (1 L)',
    name_ar: 'زيت زيتون بكر ممتاز (1 لتر)',
    price: '28.00',
    mrp: '35.00',
    badge: 'Best Seller',
    badge_ar: 'الأكثر مبيعاً',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
  },
  {
    id: 'tr-4',
    name_en: 'Pure Mountain Honey (500 g)',
    name_ar: 'عسل جبل طبيعي (500 جرام)',
    price: '45.00',
    mrp: '55.00',
    badge: 'Trending 🔥',
    badge_ar: 'شائع 🔥',
    img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
  },
  {
    id: 'tr-5',
    name_en: 'Farm Organic Eggs (12 pcs)',
    name_ar: 'بيض مزارع عضوي (12 حبة)',
    price: '11.00',
    mrp: '14.00',
    badge: 'Hot Pick',
    badge_ar: 'ممتاز',
    img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400',
  },
  {
    id: 'tr-6',
    name_en: 'Fresh Red Tomatoes (1 kg)',
    name_ar: 'طماطم حمراء طازجة (1 كجم)',
    price: '3.00',
    mrp: '4.50',
    badge: 'Trending 🔥',
    badge_ar: 'شائع 🔥',
    img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
  },
  {
    id: 'tr-7',
    name_en: 'Green Broccoli (500 g)',
    name_ar: 'بروكلي أخضر (500 جرام)',
    price: '5.00',
    mrp: '7.00',
    badge: 'Best Seller',
    badge_ar: 'الأكثر مبيعاً',
    img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400',
  },
  {
    id: 'tr-8',
    name_en: 'Organic Fresh Kiwi (500 g)',
    name_ar: 'كيوي عضوي طازج (500 جرام)',
    price: '3.50',
    mrp: '5.00',
    badge: 'Hot Pick',
    badge_ar: 'الأكثر طلباً',
    img: 'https://images.unsplash.com/photo-1585059819970-311904b48f61?w=400',
  },
  {
    id: 'tr-9',
    name_en: 'Sweet Yellow Bananas (1 kg)',
    name_ar: 'موز أصفر طازج (1 كجم)',
    price: '2.50',
    mrp: '4.00',
    badge: 'Trending 🔥',
    badge_ar: 'شائع 🔥',
    img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
  },
  {
    id: 'tr-10',
    name_en: 'Fresh Farm Whole Milk (1 L)',
    name_ar: 'حليب مزرعة طازج (1 لتر)',
    price: '5.50',
    mrp: '7.50',
    badge: 'Hot Pick',
    badge_ar: 'طازج',
    img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
  },
];

export default function HomePage() {
  const { t, locale } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [productSlideIndex, setProductSlideIndex] = useState(0);
  const [categorySlideIndex, setCategorySlideIndex] = useState(0);
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetchApi('/categories'),
          fetchApi('/products?limit=50'),
        ]);

        if (catRes.success) setCategories(catRes.data?.categories || catRes.data || []);
        if (prodRes.success) setProducts(prodRes.data?.products?.products || prodRes.data?.products || []);
      } catch (err) {
        console.error('Error loading home data:', err);
        showToast(err.message || 'Error loading page content', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      setAddingId(productId);
      await addToCart(productId, 1);
    } catch (err) {
      // Toast message managed by CartContext
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-16 pb-16 font-sans bg-[#fbfcfb]">

      {/* 1. Hero Section (Interactive Banner Slider) */}
      <section className={`${HERO_SLIDES[currentSlide].bg} text-white overflow-hidden relative transition-colors duration-700 min-h-[460px] flex flex-col justify-between`}>

        {/* Navigation Arrow Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-lg hover:scale-110"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-lg hover:scale-110"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </button>

        {/* Slide Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-20 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 w-full">

          {/* Left Text */}
          <div className="space-y-6 max-w-xl text-center md:text-left rtl:md:text-right">
            <span className={`${HERO_SLIDES[currentSlide].accentColor} font-serif italic text-lg sm:text-xl font-medium tracking-wide block transition-all`}>
              {locale === 'ar' ? HERO_SLIDES[currentSlide].tag_ar : HERO_SLIDES[currentSlide].tag_en}
            </span>

            <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight font-sans drop-shadow-sm">
              {locale === 'ar' ? HERO_SLIDES[currentSlide].title_ar : HERO_SLIDES[currentSlide].title_en}
            </h1>

            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
              {locale === 'ar' ? HERO_SLIDES[currentSlide].desc_ar : HERO_SLIDES[currentSlide].desc_en}
            </p>

            <div className="pt-2">
              <Link
                href="/products"
                className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-sm shadow-xl transition-all hover:scale-105 cursor-pointer ${HERO_SLIDES[currentSlide].btnStyle}`}
              >
                <span>{locale === 'ar' ? HERO_SLIDES[currentSlide].btn_ar : HERO_SLIDES[currentSlide].btn_en}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full max-w-md relative flex justify-center">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 w-full max-h-[380px]">
              <img
                src={HERO_SLIDES[currentSlide].img}
                alt="Banner slide image"
                className="w-full h-full object-cover max-h-[380px] transition-all duration-500"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          </div>

        </div>

        {/* Pagination Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-xs">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/50 hover:bg-white'
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* 2. Shop By Category (Row of Circular Category Cards with Carousel) */}
        {(() => {
          const mainCategories = (categories || []).filter((c) => !c.parent_id);
          const displayCategories = mainCategories.length > 0 ? mainCategories : ((categories || []).length > 0 ? categories : SAFE_DEFAULT_CATEGORIES);
          const maxSlides = Math.max(1, Math.ceil(displayCategories.length / 6));
          return (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#05442e] font-serif tracking-tight">
                  {locale === 'ar' ? 'التسوق حسب القسم' : 'Shop By Category'}
                </h2>

                {/* Carousel Circular Arrow Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCategorySlideIndex((prev) => (prev - 1 + maxSlides) % maxSlides)}
                    className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200/90 flex items-center justify-center hover:bg-[#05442e] hover:text-white hover:border-[#05442e] shadow-sm transition-all cursor-pointer group"
                    title="Previous Categories"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCategorySlideIndex((prev) => (prev + 1) % maxSlides)}
                    className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200/90 flex items-center justify-center hover:bg-[#05442e] hover:text-white hover:border-[#05442e] shadow-sm transition-all cursor-pointer group"
                    title="Next Categories"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-500">
                {displayCategories.slice(categorySlideIndex * 6, (categorySlideIndex + 1) * 6).map((cat, idx) => (
                  <Link
                    key={cat.id || idx}
                    href={cat.id ? `/products?categoryId=${cat.id}` : '/products'}
                    className="bg-white rounded-2xl p-5 text-center border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-300 group transition-all cursor-pointer flex flex-col items-center justify-between space-y-3"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-50 p-1 border border-emerald-100 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <img
                        src={getCategoryImageUrl(cat)}
                        alt={locale === 'ar' ? cat.name_ar : cat.name_en}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.src = getCategoryImageUrl({ name_en: cat.name_en });
                        }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {locale === 'ar' ? cat.name_ar : cat.name_en}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* 3. 3-Column Feature Banners */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_BANNERS.map((banner, idx) => (
            <div
              key={idx}
              className={`${banner.cardBg} rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center justify-between gap-4 group hover:shadow-md transition-all`}
            >
              <div className="space-y-3 max-w-[60%]">
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {locale === 'ar' ? banner.title_ar : banner.title_en}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {locale === 'ar' ? banner.subtitle_ar : banner.subtitle_en}
                </p>
                <Link
                  href="/products"
                  className={`inline-block text-xs font-bold px-4 py-2 rounded-full transition-all ${banner.btnBg}`}
                >
                  Shop Now
                </Link>
              </div>

              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm shrink-0">
                <img src={banner.img} alt="Promo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            </div>
          ))}
        </section>
        {(() => {
          const displayProducts = products.length > 0 ? products : STATIC_GREEN_FRESH;
          const itemsPerPage = 5;
          const maxProductSlides = Math.ceil(displayProducts.length / itemsPerPage) || 1;
          const currentSlideItems = displayProducts.slice(
            productSlideIndex * itemsPerPage,
            (productSlideIndex + 1) * itemsPerPage
          );

          return (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#05442e] font-serif tracking-tight">
                  {locale === 'ar' ? 'المنتجات' : 'Products'}
                </h2>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProductSlideIndex((prev) => (prev - 1 + maxProductSlides) % maxProductSlides)}
                      className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200/90 flex items-center justify-center hover:bg-[#05442e] hover:text-white hover:border-[#05442e] shadow-sm transition-all cursor-pointer group"
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5 rtl:rotate-180 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => setProductSlideIndex((prev) => (prev + 1) % maxProductSlides)}
                      className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200/90 flex items-center justify-center hover:bg-[#05442e] hover:text-white hover:border-[#05442e] shadow-sm transition-all cursor-pointer group"
                      title="Next"
                    >
                      <ChevronRight className="w-5 h-5 rtl:rotate-180 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="bg-[#fff5f5] h-64 rounded-2xl animate-pulse border border-[#fce8e8]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 transition-all duration-500">
                  {currentSlideItems.map((prod) => {
                    const primaryImg = (prod.images && prod.images.length > 0 ? (prod.images[0].image_url || prod.images[0]) : prod.image_url) || prod.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';
                    return (
                      <div
                        key={prod.id}
                        className="bg-[#fff5f5] rounded-2xl p-4 border border-[#fce8e8] shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group space-y-3 relative"
                      >
                        <Link href={`/products/${prod.id}`} className="space-y-2 text-center block group/link">
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-white relative border border-slate-100/60 p-2 flex items-center justify-center">
                            <img
                              src={primaryImg}
                              alt={locale === 'ar' ? prod.name_ar : prod.name_en}
                              className="w-full h-full object-contain group-hover/link:scale-105 transition-transform"
                            />

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(prod);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 hover:scale-110 transition-all z-10 cursor-pointer"
                              title="Add to Wishlist"
                            >
                              <Heart className={`w-4 h-4 transition-colors ${isInWishlist(prod.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'}`} />
                            </button>
                          </div>

                          <h3 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover/link:text-emerald-700 transition-colors">
                            {locale === 'ar' ? prod.name_ar : prod.name_en}
                          </h3>

                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                            {locale === 'ar' ? `الوحدة: ${prod.unit || '200 جم'}` : `Unit: ${prod.unit || '200 g'}`}
                          </span>

                          <span className="text-sm font-black text-emerald-700 block">
                            {parseFloat(prod.price).toFixed(2)} SAR
                          </span>
                        </Link>

                        <button
                          onClick={() => handleAddToCart(prod.id)}
                          disabled={addingId === prod.id}
                          className="w-full py-2 rounded-xl bg-white hover:bg-[#05442e] text-emerald-800 hover:text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border border-emerald-200 shadow-xs cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{addingId === prod.id ? 'Adding...' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}

        {/* 5. 4-Column Promo Deals */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROMO_DEALS.map((deal, idx) => (
            <div key={idx} className={`${deal.bg} rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden group`}>
              <span className="absolute top-4 left-4 text-xs font-extrabold text-white bg-emerald-700 px-2.5 py-1 rounded-full shadow-sm">
                {deal.discount}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 pt-6">
                {locale === 'ar' ? deal.title_ar : deal.title_en}
              </h3>
              <div className="w-full h-32 rounded-2xl overflow-hidden shadow-xs">
                <img src={deal.img} alt={deal.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            </div>
          ))}
        </section>

        {/* Trending Products Section */}
        {(() => {
          const displayTrending = products.length > 0 ? products : STATIC_TRENDING;
          const itemsPerPage = 5;
          const maxTrendingSlides = Math.ceil(displayTrending.length / itemsPerPage) || 1;
          const currentTrendingItems = displayTrending.slice(
            trendingSlideIndex * itemsPerPage,
            (trendingSlideIndex + 1) * itemsPerPage
          );

          return (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                    <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#05442e] font-serif tracking-tight">
                      {locale === 'ar' ? 'المنتجات الأكثر تداولاً' : 'Trending Products'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {locale === 'ar' ? 'أكثر المنتجات إقبالاً هذا الأسبوع' : 'Popular grocery picks customers are loving this week'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTrendingSlideIndex((prev) => (prev - 1 + maxTrendingSlides) % maxTrendingSlides)}
                    className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200/90 flex items-center justify-center hover:bg-[#05442e] hover:text-white hover:border-[#05442e] shadow-sm transition-all cursor-pointer group"
                    title={locale === 'ar' ? 'السابق' : 'Previous'}
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setTrendingSlideIndex((prev) => (prev + 1) % maxTrendingSlides)}
                    className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200/90 flex items-center justify-center hover:bg-[#05442e] hover:text-white hover:border-[#05442e] shadow-sm transition-all cursor-pointer group"
                    title={locale === 'ar' ? 'التالي' : 'Next'}
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 transition-all duration-500">
                {currentTrendingItems.map((prod) => {
                  const priceVal = parseFloat(prod.price).toFixed(2);
                  const mrpVal = prod.mrp ? parseFloat(prod.mrp).toFixed(2) : null;
                  const primaryImg = (prod.images && prod.images.length > 0 ? (prod.images[0].image_url || prod.images[0]) : prod.image_url) || prod.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group space-y-3 relative"
                    >
                      {/* Badge */}
                      {(prod.badge || prod.discount_percentage) && (
                        <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs z-10">
                          {prod.badge ? (locale === 'ar' ? (prod.badge_ar || prod.badge) : prod.badge) : 'Trending 🔥'}
                        </span>
                      )}

                      <Link href={`/products/${prod.id}`} className="space-y-2 text-center block group/link">
                        <div className="w-full h-36 rounded-2xl overflow-hidden bg-[#fff9f9] relative border border-slate-100 p-2 flex items-center justify-center">
                          <img
                            src={primaryImg}
                            alt={locale === 'ar' ? prod.name_ar : prod.name_en}
                            className="w-full h-full object-contain group-hover/link:scale-105 transition-transform duration-300"
                          />

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(prod);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 hover:scale-110 transition-all z-10 cursor-pointer"
                            title="Add to Wishlist"
                          >
                            <Heart className={`w-4 h-4 transition-colors ${isInWishlist(prod.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'}`} />
                          </button>
                        </div>

                        <h3 className="font-extrabold text-xs text-slate-900 line-clamp-1 group-hover/link:text-emerald-700 transition-colors">
                          {locale === 'ar' ? prod.name_ar : prod.name_en}
                        </h3>

                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-sm font-black text-[#05442e]">
                            {priceVal} SAR
                          </span>
                          {mrpVal && (
                            <span className="text-[11px] text-slate-400 line-through font-medium">
                              {mrpVal} SAR
                            </span>
                          )}
                        </div>
                      </Link>

                      <button
                        onClick={() => handleAddToCart(prod.id)}
                        disabled={addingId === prod.id}
                        className="w-full py-2.5 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{addingId === prod.id ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 6. Order via Our App & Free Delivery Banner */}
        <section className="bg-[#05442e] rounded-3xl text-white p-8 sm:p-12 border border-emerald-800 shadow-xl overflow-hidden relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 text-center md:text-left rtl:md:text-right max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Order via Our App & Enjoy Free Delivery
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100">
                FREE EXPRESS DELIVERY ON ORDERS OVER 150 SAR
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="px-5 py-2.5 rounded-xl bg-slate-950/80 text-white font-bold text-xs border border-white/20 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-lime-400" /> App Store & Play Store Available
                </div>
              </div>
            </div>

            <div className="w-full max-w-xs shrink-0 rounded-2xl overflow-hidden border-2 border-emerald-400/30 shadow-2xl">
              <img
                src="/images/delivery_driver.jpg"
                alt="Delivery Driver"
                className="w-full h-auto object-cover max-h-60"
              />
            </div>
          </div>
        </section>

        {/* 7. Most Buy Items */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#05442e] font-serif tracking-tight">
            Most Buy Items
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {(() => {
              const displayMostBuy = products.length > 0 ? products.slice(0, 5) : STATIC_MOST_BUY;
              return displayMostBuy.map((prod) => {
                const primaryImg = (prod.images && prod.images.length > 0 ? (prod.images[0].image_url || prod.images[0]) : prod.image_url) || prod.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';
                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group space-y-3 relative"
                  >
                    <Link href={`/products/${prod.id}`} className="space-y-2 text-center block group/link">
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-50 relative border border-slate-100 p-2 flex items-center justify-center">
                        <img
                          src={primaryImg}
                          alt={locale === 'ar' ? prod.name_ar : prod.name_en}
                          className="w-full h-full object-contain group-hover/link:scale-105 transition-transform"
                        />

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(prod);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 hover:scale-110 transition-all z-10 cursor-pointer"
                          title="Add to Wishlist"
                        >
                          <Heart className={`w-4 h-4 transition-colors ${isInWishlist(prod.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'}`} />
                        </button>
                      </div>

                      <h3 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover/link:text-emerald-700 transition-colors">
                        {locale === 'ar' ? prod.name_ar : prod.name_en}
                      </h3>

                      <span className="text-sm font-black text-emerald-700 block">
                        {parseFloat(prod.price).toFixed(2)} SAR
                      </span>
                    </Link>

                    <button
                      onClick={() => handleAddToCart(prod.id)}
                      disabled={addingId === prod.id}
                      className="w-full py-2 rounded-xl bg-white hover:bg-[#05442e] text-emerald-800 hover:text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border border-emerald-200 shadow-xs cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{addingId === prod.id ? 'Adding...' : 'Add to Cart'}</span>
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        {/* 8. 4 Feature Value Props */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Free Shipping</h4>
              <p className="text-xs text-slate-500">Orders over 150 SAR</p>
            </div>
          </div>

          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Join Club Free</h4>
              <p className="text-xs text-slate-500">Earn points on 1st order</p>
            </div>
          </div>

          <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Support 24/7</h4>
              <p className="text-xs text-slate-500">Online 24 hours</p>
            </div>
          </div>

          <div className="bg-teal-50/60 p-5 rounded-2xl border border-teal-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">100% Safe</h4>
              <p className="text-xs text-slate-500">Secure ZATCA Payment</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
