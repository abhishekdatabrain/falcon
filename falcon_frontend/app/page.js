'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useCart } from '../src/contexts/CartContext';
import { useWishlist } from '../src/contexts/WishlistContext';
import { useToast } from '../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../src/services/api';
import { ShoppingBag, Truck, ShieldCheck, FileCheck, ArrowRight, Star, Sparkles, CheckCircle2, Leaf, Tag, ChevronRight, ChevronLeft, Gift, Headphones, Shield, Smartphone, Heart, Flame, TrendingUp, Plus, Minus, Trash2, Loader2, Zap } from 'lucide-react';
import WaveDivider from '../src/components/WaveDivider';

const SAFE_DEFAULT_CATEGORIES = [

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

const DEALS_PRODUCTS = [];

const PROMO_CARDS_BANNER = [{}];

const HOUSEHOLD_SUBCATEGORIES = [
  {
    id: 'laundry-care',
    title_en: 'Laundry Care',
    title_ar: 'العناية بالغسيل',
    img: '/subcategories/laundry_care.png',
    href: '/products?category=household&sub=laundry',
  },
  {
    id: 'toilet-cleaner',
    title_en: 'Toilet Cleaner',
    title_ar: 'منظف الحمام',
    img: '/subcategories/toilet_cleaner.png',
    href: '/products?category=household&sub=toilet-cleaner',
  },
  {
    id: 'vacuum-cleaner',
    title_en: 'Vacuum Cleaner',
    title_ar: 'مكنسة كهربائية',
    img: '/subcategories/vacuum_cleaner.png',
    href: '/products?category=household&sub=vacuum',
  },
  {
    id: 'storage',
    title_en: 'Storage',
    title_ar: 'التخزين',
    img: '/subcategories/storage.png',
    href: '/products?category=household&sub=storage',
  },
  {
    id: 'lights-lamps',
    title_en: 'Lights & Lamps',
    title_ar: 'إضاءة ومصابيح',
    img: '/subcategories/lights_lamps.png',
    href: '/products?category=household&sub=lighting',
  },
  {
    id: 'chairs',
    title_en: 'Chairs',
    title_ar: 'كراسي',
    img: '/subcategories/chairs.png',
    href: '/products?category=household&sub=chairs',
  },
];

const GROCERIES_SUBCATEGORIES = [
  {
    id: 'rice-grains',
    title_en: 'Rice & Grains',
    title_ar: 'الأرز والحبوب',
    img: '/subcategories/rice_grains.png',
    href: '/products?category=groceries&sub=rice-grains',
  },
  {
    id: 'flour-baking',
    title_en: 'Flour & Baking',
    title_ar: 'الدقيق والخبز',
    img: '/subcategories/flour_baking.png',
    href: '/products?category=groceries&sub=flour',
  },
  {
    id: 'pulses-lentils',
    title_en: 'Pulses & Lentils',
    title_ar: 'البقوليات والعدس',
    img: '/subcategories/pulses_lentils.png',
    href: '/products?category=groceries&sub=lentils',
  },
  {
    id: 'pasta-noodles',
    title_en: 'Pasta & Noodles',
    title_ar: 'معكرونة ونودلز',
    img: '/subcategories/pasta_noodles.png',
    href: '/products?category=groceries&sub=pasta',
  },
  {
    id: 'tea-coffee',
    title_en: 'Tea & Coffee',
    title_ar: 'شاي وقهوة',
    img: '/subcategories/tea_coffee.png',
    href: '/products?category=groceries&sub=tea-coffee',
  },
  {
    id: 'sugar-sweeteners',
    title_en: 'Sugar & Sweeteners',
    title_ar: 'السكر والمحليات',
    img: '/subcategories/sugar_sweeteners.png',
    href: '/products?category=groceries&sub=sugar',
  },
];

export default function HomePage() {
  const { t, locale } = useLanguage();
  const { cart, addToCart, updateQuantity, removeItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [bestDealsProducts, setBestDealsProducts] = useState([]);
  const [heroBanners, setHeroBanners] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [categorySections, setCategorySections] = useState([]);
  const [cmsSections, setCmsSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [productSlideIndex, setProductSlideIndex] = useState(0);
  const [categorySlideIndex, setCategorySlideIndex] = useState(0);
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, prodRes, dealsRes, heroRes, promoRes, sectionsRes, cmsRes] = await Promise.all([
          fetchApi('/categories?type=parent'),
          fetchApi('/products?limit=50'),
          fetchApi('/products?is_best_deal=true'),
          fetchApi('/hero-banners').catch(() => ({ success: false })),
          fetchApi('/promo-banners').catch(() => ({ success: false })),
          fetchApi('/category-sections/active').catch(() => ({ success: false })),
          fetchApi('/homepage-cms/public').catch(() => ({ success: false })),
        ]);

        if (catRes.success) {
          const rawCats = catRes.data?.categories || catRes.data || [];
          // Filter to guarantee ONLY top-level parent categories (no sub or sub-subcategory)
          const parentsOnly = rawCats.filter(c => !c.parent_id);
          setCategories(parentsOnly);
        }
        if (prodRes.success) setProducts(prodRes.data?.products?.products || prodRes.data?.products || []);
        if (dealsRes.success) {
          const dealsArr = dealsRes.data?.products?.products || dealsRes.data?.products || (Array.isArray(dealsRes.data) ? dealsRes.data : []);
          setBestDealsProducts(dealsArr);
        }
        if (heroRes && heroRes.success && heroRes.data?.banners?.length > 0) {
          setHeroBanners(heroRes.data.banners);
        }
        if (promoRes && promoRes.success && promoRes.data?.banners?.length > 0) {
          setPromoBanners(promoRes.data.banners);
        }
        if (sectionsRes && sectionsRes.success && sectionsRes.data?.sections?.length > 0) {
          setCategorySections(sectionsRes.data.sections);
        }
        if (cmsRes && cmsRes.success && cmsRes.data?.sections?.length > 0) {
          setCmsSections(cmsRes.data.sections);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
        showToast(err.message || 'Error loading page content', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCartItem = (productId) => {
    if (!cart?.items || !productId) return null;
    return cart.items.find(
      (item) => item.product_id === productId || item.product?.id === productId || item.productId === productId
    );
  };

  const handleAddToCart = async (productId, prodData = null) => {
    try {
      setAddingId(productId);
      setActionId(productId);
      await addToCart(productId, 1, prodData);
    } catch (err) {
      // Toast message managed by CartContext
    } finally {
      setAddingId(null);
      setActionId(null);
    }
  };

  const handleIncrement = async (productId, prodData = null) => {
    const item = getCartItem(productId);
    if (!item) {
      await handleAddToCart(productId, prodData);
      return;
    }
    try {
      setActionId(productId);
      await updateQuantity(item.id, item.quantity + 1);
    } catch (err) {
      // Handled by context
    } finally {
      setActionId(null);
    }
  };

  const handleDecrement = async (productId) => {
    const item = getCartItem(productId);
    if (!item) return;
    try {
      setActionId(productId);
      if (item.quantity <= 1) {
        await removeItem(item.id);
      } else {
        await updateQuantity(item.id, item.quantity - 1);
      }
    } catch (err) {
      // Handled by context
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-16 pb-16 font-sans bg-[#fbfcfb]">

      {/* 1. Hero Section (Delivered Simply Landing Banner with Dynamic Admin Management) */}
      {(() => {
        const activeHero = (heroBanners && heroBanners.length > 0) ? heroBanners[0] : {};

        const titleText = locale === 'ar'
          ? (activeHero.title_ar || 'كل ما تحتاجه')
          : (activeHero.title_en || 'Everything You need');

        const subtitleText = locale === 'ar'
          ? (activeHero.subtitle_ar || 'يصلك بكل بساطة')
          : (activeHero.subtitle_en || 'Delivered Simply');

        const descText = locale === 'ar'
          ? (activeHero.desc_ar || 'تسوق البقالة والوجبات الخفيفة والعناية الشخصية والمزيد بأفضل الأسعار. طازجة يمكنك الوثوق بها.')
          : (activeHero.desc_en || 'Shop groceries, snacks, personal care and more at great prices. Freshness you can trust.');

        const btnText = locale === 'ar'
          ? (activeHero.btn_text_ar || 'تسوق الآن')
          : (activeHero.btn_text_en || 'Shop Now');

        const btnLink = activeHero.btn_link || '/products';

        const heroImage = activeHero.image_url
          ? getImageUrl(activeHero.image_url)
          : '/hero_grocery_bag_fresh.png';

        const heroBg = activeHero.bg_color || '#FAF7F0';

        return (
          <section
            style={{ backgroundColor: heroBg }}
            className="relative overflow-hidden font-sans border-amber-100/60 lg:h-[calc(115vh-125px)] lg:min-h-[460px] lg:max-h-[620px] flex flex-col justify-between pt-2 sm:pt-4 pb-0"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center my-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-1 sm:py-2">

                {/* Left Column Content */}
                <div className="lg:col-span-7 space-y-3 sm:space-y-3.5 text-left rtl:text-right">

                  {/* Main Headline */}
                  <h1 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[46px] font-black text-black tracking-tight leading-[1.06]">
                    {titleText}
                    {subtitleText && (
                      <>
                        <br />
                        <span className="text-[#01813E] inline-block mt-0.5">
                          {subtitleText}
                        </span>
                      </>
                    )}
                  </h1>

                  {/* Subheadline */}
                  <p className="text-[#475569] font-medium text-xs sm:text-sm lg:text-[15px] max-w-lg leading-snug">
                    {descText}
                  </p>

                  {/* Shop Now CTA Button */}
                  <div className="pt-0.5">
                    <Link
                      href={btnLink}
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 sm:px-7 sm:py-2.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
                    >
                      <span className="tracking-wide">{btnText}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {/* Trust Badges Row */}
                  <div className="pt-2.5 sm:pt-3 border-t border-amber-200/50 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-700 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E6F4EA] text-[#043927] flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                        <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-extrabold text-slate-900 text-[11px] sm:text-xs">{locale === 'ar' ? 'سريع وموثوق' : 'Fast & Reliable'}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{locale === 'ar' ? 'التوصيل' : 'Delivery'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E6F4EA] text-[#043927] flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-extrabold text-slate-900 text-[11px] sm:text-xs">{locale === 'ar' ? 'أسعار رائعة' : 'Great Prices'}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{locale === 'ar' ? 'كل يوم' : 'Everyday'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E6F4EA] text-[#043927] flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-extrabold text-slate-900 text-[11px] sm:text-xs">{locale === 'ar' ? 'آمن ومحمي' : 'Secure'}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{locale === 'ar' ? 'المدفوعات' : 'Payments'}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column Visual Image */}
                <div className="lg:col-span-5 relative flex items-center justify-center py-1 sm:py-2 h-full">
                  <div className="relative w-full flex items-center justify-center h-full max-h-[260px] sm:max-h-[300px] lg:max-h-[330px]">
                    <img
                      src={heroImage}
                      alt={titleText}
                      className="max-h-[220px] sm:max-h-[270px] lg:max-h-[300px] w-auto h-full object-contain drop-shadow-xl transition-transform duration-500 hover:scale-[1.02]"
                      onError={(e) => {
                        e.target.src = '/hero_grocery_bag_fresh.png';
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Wavy Wave Curve Bottom Decorative Banner */}
            <WaveDivider className="-mb-1 shrink-0" />
          </section>
        );
      })()}




      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* 2. Explore Our Categories Section */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              {locale === 'ar' ? 'استكشف تصنيفاتنا' : 'Explore Our Categories'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {(categories && categories.length > 0 ? categories : SAFE_DEFAULT_CATEGORIES).map((cat) => {
              const titleEn = cat.name_en || cat.title_en || cat.name || 'Category';
              const titleAr = cat.name_ar || cat.title_ar || titleEn;
              const catSlug = cat.slug || titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const imageSrc = cat.image_url
                ? getImageUrl(cat.image_url)
                : (cat.img || '/categories/cat_groceries.jpg');

              return (
                <Link
                  key={cat.id || cat._id || catSlug}
                  href={`/products?category=${encodeURIComponent(catSlug)}`}
                  className="group bg-[#FFFDF8] hover:bg-[#FFF9EC] rounded-[22px] p-4 flex flex-col items-center justify-between border border-[#F6EEDF] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[210px] sm:min-h-[230px]"
                >
                  <div className="w-full aspect-square max-w-[135px] sm:max-w-[150px] flex items-center justify-center overflow-hidden my-auto p-1.5">
                    <img
                      src={imageSrc}
                      alt={locale === 'ar' ? titleAr : titleEn}
                      className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm md:text-base text-center group-hover:text-[#043927] transition-colors leading-snug pt-2 font-sans">
                    {locale === 'ar' ? titleAr : titleEn}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>
        {/* 3. Today's Best Deals Section */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-[32px] font-extrabold text-slate-900 tracking-tight font-sans flex items-center gap-2">
              <span>{locale === 'ar' ? 'أفضل عروض اليوم' : "Best Deals"}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5">
            {(() => {
              const apiDeals = bestDealsProducts.length > 0
                ? bestDealsProducts
                : products.filter((p) => p.is_best_deal);
              const displayList = apiDeals.length > 0 ? apiDeals : DEALS_PRODUCTS;

              return displayList.map((prod, idx) => {
                const titleEn = prod.name_en || prod.title_en;
                const titleAr = prod.name_ar || prod.title_ar || titleEn;
                const title = locale === 'ar' ? titleAr : titleEn;

                const brandEn = prod.brand;
                const brandAr = prod.brand_ar || brandEn;
                const brandName = locale === 'ar' ? brandAr : brandEn;

                let imgRaw = '';
                if (Array.isArray(prod.images) && prod.images.length > 0) {
                  imgRaw = typeof prod.images[0] === 'string' ? prod.images[0] : (prod.images[0]?.image_url || prod.images[0]?.url);
                } else if (prod.image_url) {
                  imgRaw = prod.image_url;
                } else if (prod.img) {
                  imgRaw = prod.img;
                }
                const finalImg = imgRaw ? getImageUrl(imgRaw) : '';

                const hasVariants = Boolean(prod.has_variants && prod.variants && prod.variants.length > 0);
                const currentPrice = parseFloat(prod.price || 0);
                let finalPrice = currentPrice;
                let originalPrice = null;

                if (hasVariants) {
                  const activeVars = prod.variants.filter((v) => v.is_active !== false);
                  const varsToUse = activeVars.length > 0 ? activeVars : prod.variants;
                  const prices = varsToUse
                    .map((v) => parseFloat(v.discount_price || v.price))
                    .filter((p) => !isNaN(p) && p > 0);
                  if (prices.length > 0) {
                    finalPrice = Math.min(...prices);
                  }
                } else {
                  const isDiscounted = prod.discount_price && parseFloat(prod.discount_price) < currentPrice;
                  finalPrice = isDiscounted ? parseFloat(prod.discount_price) : currentPrice;
                  originalPrice = isDiscounted ? currentPrice : (prod.purchase_price ? parseFloat(prod.purchase_price) : null);
                }

                const specs = hasVariants
                  ? `${prod.variants.length} ${locale === 'ar' ? 'خيارات متاحة' : 'Variants Available'}`
                  : (prod.unit_value && prod.unit_type && prod.pack_size
                    ? `${prod.unit_value} ${prod.unit_type} (${prod.pack_size})`
                    : locale === 'ar'
                      ? prod.specs_ar
                      : prod.specs_en);
                const ratingVal = prod.rating || '4.9';
                const reviewsVal = prod.reviews || '1,420';

                return (
                  <Link
                    key={prod.id ? `${prod.id}-${idx}` : `deal-${idx}`}
                    href={prod.id ? `/products/${prod.id}` : '/products'}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-lg transition-all duration-300 p-3.5 flex flex-col justify-between relative font-sans cursor-pointer h-full"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between z-10 mb-1">
                      {prod.is_best_seller === true && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFA500] text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                          <Star className="w-2.5 h-2.5 fill-current text-white" />
                          <span>{locale === 'ar' ? 'منتج الأكثر مبيعاً' : 'BEST SELLER'}</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(prod);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                        title="Add to Wishlist"
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(prod.id) ? 'text-rose-500 fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Product Image Container */}
                    <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center my-1.5 relative">
                      <img
                        src={finalImg}
                        alt={title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                        }}
                      />
                    </div>

                    {/* Info Content */}
                    <div className="space-y-1 pt-0.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Brand & In Stock Tag */}
                        <div className="flex items-center justify-between text-[11px] font-medium leading-none mb-1">
                          <span className="text-slate-400 truncate">{brandName}</span>
                          <span className="text-[#00B074] font-bold shrink-0">
                            {hasVariants
                              ? (locale === 'ar' ? 'متوفر بخيارات' : 'Multi-Variant')
                              : (prod.stock_quantity !== undefined && prod.stock_quantity <= 0
                                ? (locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                                : (locale === 'ar' ? 'متوفر' : 'In Stock'))}
                          </span>
                        </div>

                        {/* Product Title */}
                        <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug font-sans group-hover:text-[#043927] transition-colors mb-1">
                          {title}
                        </h3>

                        {/* Specs / Tags */}
                        <p className="text-[10px] text-slate-400 font-normal truncate mb-1">
                          {specs}
                        </p>

                        {/* Rating & Delivery */}
                        <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-slate-400 font-normal text-[10px]">
                            <span className="text-amber-400 font-bold">★</span>
                            <span className="font-bold text-slate-700">{ratingVal}</span>
                            <span className="text-slate-400">({reviewsVal})</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Add to Cart / Quantity Action Row */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 mt-auto">
                        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                        
                          <span className="text-sm sm:text-[15px] font-black text-slate-900 font-sans whitespace-nowrap leading-tight">
                            <span className="text-[10px] font-bold text-slate-500 mr-0.5">SAR</span>
                            {finalPrice.toFixed(2)}
                          </span>
                          {!hasVariants && originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-normal whitespace-nowrap">
                              SAR {originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter, Select Options, or Add to Cart Button */}
                        {(() => {
                          if (hasVariants) {
                            return (
                              <div className="h-8 w-full rounded-xl bg-[#006E2D] hover:bg-[#00B074] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                                <span>{locale === 'ar' ? 'اختر الخيارات' : 'Select Options'}</span>
                              </div>
                            );
                          }

                          const cartItem = getCartItem(prod.id);
                          const inCart = cartItem && cartItem.quantity > 0;
                          const isBusy = addingId === prod.id || actionId === prod.id;

                          if (inCart) {
                            return (
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="h-8 w-full bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between p-0.5 px-1 shadow-2xs"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDecrement(prod.id);
                                  }}
                                  disabled={isBusy}
                                  className="w-6.5 h-6.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                  title={cartItem.quantity === 1 ? (locale === 'ar' ? 'حذف' : 'Remove') : (locale === 'ar' ? 'إنقاص' : 'Decrease')}
                                >
                                  {cartItem.quantity === 1 ? (
                                    <Minus className="w-3 h-3 stroke-[2.5]" />
                                  ) : (
                                    <Minus className="w-3 h-3 stroke-[2.5]" />
                                  )}
                                </button>

                                <span className="flex-1 text-center text-xs font-black text-slate-900 font-sans select-none">
                                  {isBusy ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto text-emerald-600" />
                                  ) : (
                                    cartItem.quantity
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleIncrement(prod.id, prod);
                                  }}
                                  disabled={isBusy}
                                  className="w-6.5 h-6.5 rounded-lg bg-[#00B074] hover:bg-[#009663] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                  title={locale === 'ar' ? 'زيادة' : 'Increase'}
                                >
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(prod.id, prod);
                              }}
                              disabled={isBusy}
                              className="h-8 w-full rounded-xl bg-[#006E2D] hover:bg-[#009663] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>{locale === 'ar' ? 'أضف' : 'Add to Cart'}</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        </section>

        {/* 4. Promotional Cards Banner Section (Everyday Groceries, Home Needs, Snack Time) */}
        <section className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {(promoBanners.length > 0 ? promoBanners : PROMO_CARDS_BANNER).map((card) => {
              const bgStyle = card.bg_color ? { backgroundColor: card.bg_color } : {};
              const bgClass = card.bg || '';
              const imgSrc = getImageUrl(card.image_url || card.img);
              const cardTitle = locale === 'ar' ? (card.title_ar || card.title_en) : (card.title_en || card.title_ar);
              const cardDesc = locale === 'ar' ? (card.desc_ar || card.desc_en) : (card.desc_en || card.desc_ar);
              const cardBtnText = locale === 'ar'
                ? (card.btn_text_ar || card.btn_ar || 'اطلب الآن')
                : (card.btn_text_en || card.btn_en || 'Order Now');
              const cardHref = card.btn_link || card.href || '/products';

              return (
                <div
                  key={card.id}
                  style={bgStyle}
                  className={`${bgClass} rounded-[28px] relative overflow-hidden flex justify-between min-h-[200px] sm:min-h-[220px] shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group font-sans`}
                >
                  {/* Left Text Content */}
                  <div className="p-6 sm:p-7 max-w-[62%] flex flex-col justify-between z-10">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl leading-snug tracking-tight font-sans">
                        {cardTitle}
                      </h3>
                      <p className="text-slate-800/80 font-medium text-xs sm:text-sm leading-relaxed">
                        {cardDesc}
                      </p>
                    </div>

                    <div className="pt-4">
                      <Link
                        href={cardHref}
                        className="bg-white text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all hover:scale-105 inline-block cursor-pointer"
                      >
                        {cardBtnText}
                      </Link>
                    </div>
                  </div>

                  {/* Right Image Container with Rounded Cutout */}
                  <div className="w-[38%] bg-white rounded-tl-[48px] rounded-bl-none absolute right-0 top-0 bottom-0 flex items-center justify-center p-3 shadow-inner">
                    <img
                      src={imgSrc}
                      alt={cardTitle}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                      onError={(e) => {
                        e.target.src = '/promo/promo_groceries.png';
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Dynamic Household Essentials & Groceries Sub-Category Showcase Grids */}
        {categorySections && categorySections.length > 0 ? (
          <div className="space-y-8 sm:space-y-10">
            {categorySections.map((sec, secIdx) => {
              const itemsToRender = (sec.items || []).slice(0, sec.max_items || 6);
              if (itemsToRender.length === 0) return null;

              return (
                <section
                  key={sec.id || 'sec-' + secIdx}
                  style={{ backgroundColor: sec.bg_color || '#F6FFF8' }}
                  className="rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 space-y-6 sm:space-y-8 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                      {locale === 'ar' ? (sec.title_ar || sec.title_en) : (sec.title_en || sec.title_ar)}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                    {itemsToRender.map((item) => {
                      const resolvedImg = item.image_url?.startsWith('http') || item.image_url?.startsWith('/subcategories/') || item.image_url?.startsWith('/promo/')
                        ? item.image_url
                        : getImageUrl(item.image_url);

                      return (
                        <Link
                          key={item.id}
                          href={item.link_url || `/products?category=${encodeURIComponent(item.title_en.toLowerCase())}`}
                          className="group flex flex-col items-center cursor-pointer text-center"
                        >
                          <div className="w-full aspect-square bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-3 sm:p-4 flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                            <img
                              src={resolvedImg}
                              alt={locale === 'ar' ? (item.title_ar || item.title_en) : item.title_en}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <span className="font-bold text-slate-800 text-xs sm:text-[14px] text-center mt-3 leading-snug group-hover:text-emerald-800 transition-colors">
                            {locale === 'ar' ? (item.title_ar || item.title_en) : item.title_en}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  {sec.view_more_link && (
                    <div className="flex justify-end pt-1">
                      <Link
                        href={sec.view_more_link}
                        className="text-[12px] sm:text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group transition-colors"
                      >
                        <span>{locale === 'ar' ? (sec.view_more_text_ar || 'عرض المزيد') : (sec.view_more_text_en || 'View more')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <section className="bg-[#F6FFF8] rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 space-y-10 sm:space-y-12">
            {/* Sub-Section 1: Household Essentials */}
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {locale === 'ar' ? 'المستلزمات المنزلية' : 'Household Essentials'}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {HOUSEHOLD_SUBCATEGORIES.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex flex-col items-center cursor-pointer text-center"
                  >
                    <div className="w-full aspect-square bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-3 sm:p-4 flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                      <img
                        src={item.img}
                        alt={locale === 'ar' ? item.title_ar : item.title_en}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <span className="font-bold text-slate-800 text-xs sm:text-[14px] text-center mt-3 leading-snug group-hover:text-emerald-800 transition-colors">
                      {locale === 'ar' ? item.title_ar : item.title_en}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  href="/products?category=household"
                  className="text-[12px] sm:text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group transition-colors"
                >
                  <span>{locale === 'ar' ? 'عرض المزيد' : 'View more'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Sub-Section 2: Groceries */}
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {locale === 'ar' ? 'البقالة' : 'Groceries'}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {GROCERIES_SUBCATEGORIES.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex flex-col items-center cursor-pointer text-center"
                  >
                    <div className="w-full aspect-square bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-3 sm:p-4 flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                      <img
                        src={item.img}
                        alt={locale === 'ar' ? item.title_ar : item.title_en}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <span className="font-bold text-slate-800 text-xs sm:text-[14px] text-center mt-3 leading-snug group-hover:text-emerald-800 transition-colors">
                      {locale === 'ar' ? item.title_ar : item.title_en}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  href="/products?category=groceries"
                  className="text-[12px] sm:text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group transition-colors"
                >
                  <span>{locale === 'ar' ? 'عرض المزيد' : 'View more'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 6. Household Essentials Featured Banner Section (Fully Dynamic via Admin CMS) */}
        {(() => {
          const householdSection = cmsSections?.find((s) => s.section_key === 'household_featured');
          if (householdSection && householdSection.is_active === false) return null;

          const cfg = householdSection?.config || {};
          const isFullBanner = cfg.banner_mode === 'full_banner';
          const btnLink = cfg.btn_link || '/products?category=household';

          if (isFullBanner) {
            const bannerSrc = cfg.full_banner_url || cfg.image_url || '/banners/household_banner_exact.png';
            return (
              <section className="rounded-[24px] sm:rounded-[32px] overflow-hidden border border-amber-100/70 shadow-xs hover:shadow-md transition-all duration-300 relative group bg-[#FAF7F0]">
                <Link href={btnLink} className="block relative w-full aspect-[1024/315] overflow-hidden">
                  <img
                    src={getImageUrl(bannerSrc)}
                    alt={locale === 'ar' ? (cfg.headline_ar_1 || 'مستلزمات منزلية') : (cfg.headline_en_1 || 'Household Essentials')}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
                </Link>
              </section>
            );
          }

          // Dynamic Split Layout matching Image 2 reference design exactly
          const tagText = locale === 'ar' ? (cfg.category_tag_ar || 'مستلزمات منزلية') : (cfg.category_tag_en || 'HOUSEHOLD ESSENTIALS');
          const h1Text = locale === 'ar' ? (cfg.headline_ar_1 || 'منزل أكثر نظافة،') : (cfg.headline_en_1 || 'A Cleaner Home,');
          const h2Text = locale === 'ar' ? (cfg.headline_ar_2 || 'وحياة أكثر سعادة.') : (cfg.headline_en_2 || 'A Happier You.');
          const descText = locale === 'ar'
            ? (cfg.desc_ar || 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.')
            : (cfg.desc_en || 'Quality household essentials for a fresher, cleaner and more comfortable home.');
          const btnText = locale === 'ar' ? (cfg.btn_text_ar || 'تسوق الآن') : (cfg.btn_text_en || 'Shop Now');
          const badge1 = locale === 'ar' ? (cfg.badge_1_ar || 'علامات موثوقة') : (cfg.badge_1_en || 'Trusted Brands');
          const badge2 = locale === 'ar' ? (cfg.badge_2_ar || 'توصيل سريع وموثوق') : (cfg.badge_2_en || 'Fast & Reliable Delivery');
          const badge3 = locale === 'ar' ? (cfg.badge_3_ar || 'قيمة يومية') : (cfg.badge_3_en || 'Everyday Value');
          const productImg = cfg.image_url || '/banners/household_products_exact.png';

          return (
            <section
              style={{ backgroundColor: cfg.bg_color || '#FAF7F0' }}
              className="rounded-[24px] sm:rounded-[32px] overflow-hidden border border-amber-200/50 shadow-xs hover:shadow-md transition-all duration-300 relative group font-sans bg-gradient-to-r from-[#FAF7F0] via-[#F9F5EC] to-[#F5EFE3]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                {/* Left Dynamic Text Column */}
                <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 space-y-5 text-left rtl:text-right z-10">
                  {/* Category Tag */}
                  <span className="text-[#043927] font-black text-xs sm:text-[13px] uppercase tracking-[0.22em] block font-sans">
                    {tagText}
                  </span>

                  {/* Headline with serif styling & leaf graphic */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.12] font-serif">
                      <span className="text-[#043927] block">{h1Text}</span>
                      <span className="text-[#C68A27] inline-block mt-0.5">{h2Text}</span>
                    </h2>
                    <div className="inline-block self-end mb-2">
                      <svg className="w-8 h-8 text-[#043927] fill-[#043927]" viewBox="0 0 24 24">
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                      </svg>
                    </div>
                  </div>

                  {/* Subheadline */}
                  <p className="text-[#475569] font-medium text-sm sm:text-base max-w-md leading-relaxed">
                    {descText}
                  </p>

                  {/* CTA Button */}
                  <div className="pt-1">
                    <Link
                      href={btnLink}
                      className="inline-flex items-center gap-3 px-7 py-3 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer group"
                    >
                      <span>{btnText}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {/* Trust Badges */}
                  <div className="pt-5 border-t border-amber-200/60 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-800 font-extrabold">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md text-[#043927] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-[#043927]" />
                      </div>
                      <span className="text-[12px] sm:text-[13px]">{badge1}</span>
                    </div>

                    <div className="hidden sm:block w-px h-4 bg-slate-300" />

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md text-[#043927] flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-[#043927]" />
                      </div>
                      <span className="text-[12px] sm:text-[13px]">{badge2}</span>
                    </div>

                    <div className="hidden sm:block w-px h-4 bg-slate-300" />

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md text-[#043927] flex items-center justify-center shrink-0">
                        <Leaf className="w-5 h-5 text-[#043927]" />
                      </div>
                      <span className="text-[12px] sm:text-[13px]">{badge3}</span>
                    </div>
                  </div>
                </div>

                {/* Right Image Column */}
                <div className="lg:col-span-6 relative flex justify-end items-center h-full overflow-hidden">
                  <div className="relative w-full h-full min-h-[260px] sm:min-h-[300px] flex items-center justify-center lg:justify-end">
                    <img
                      src={getImageUrl(productImg)}
                      alt={tagText}
                      className="w-full h-full max-h-[340px] object-contain object-right rtl:object-left group-hover:scale-[1.02] transition-transform duration-500 drop-shadow-md"
                    />
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* 7. Popular Picks Product Grid Section */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-[32px] font-extrabold text-slate-900 tracking-tight font-sans">
              {locale === 'ar' ? 'الأكثر شعبية' : 'Popular Picks'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5">
            {(() => {
              const apiPopular = products.filter((p) => p.is_popular_pick);
              const displayList = apiPopular.length > 0 ? apiPopular : DEALS_PRODUCTS;

              return displayList.map((prod, idx) => {
                const titleEn = prod.name_en || prod.title_en;
                const titleAr = prod.name_ar || prod.title_ar || titleEn;
                const title = locale === 'ar' ? titleAr : titleEn;

                const brandEn = prod.brand;
                const brandAr = prod.brand_ar || brandEn;
                const brandName = locale === 'ar' ? brandAr : brandEn;

                let imgRaw = '';
                if (Array.isArray(prod.images) && prod.images.length > 0) {
                  imgRaw = typeof prod.images[0] === 'string' ? prod.images[0] : (prod.images[0]?.image_url || prod.images[0]?.url);
                } else if (prod.image_url) {
                  imgRaw = prod.image_url;
                } else if (prod.img) {
                  imgRaw = prod.img;
                }
                const finalImg = imgRaw ? getImageUrl(imgRaw) : '';

                const hasVariants = Boolean(prod.has_variants && prod.variants && prod.variants.length > 0);
                const currentPrice = parseFloat(prod.price || 0);
                let finalPrice = currentPrice;
                let originalPrice = null;

                if (hasVariants) {
                  const activeVars = prod.variants.filter((v) => v.is_active !== false);
                  const varsToUse = activeVars.length > 0 ? activeVars : prod.variants;
                  const prices = varsToUse
                    .map((v) => parseFloat(v.discount_price || v.price))
                    .filter((p) => !isNaN(p) && p > 0);
                  if (prices.length > 0) {
                    finalPrice = Math.min(...prices);
                  }
                } else {
                  const isDiscounted = prod.discount_price && parseFloat(prod.discount_price) < currentPrice;
                  finalPrice = isDiscounted ? parseFloat(prod.discount_price) : currentPrice;
                  originalPrice = isDiscounted ? currentPrice : (prod.purchase_price ? parseFloat(prod.purchase_price) : null);
                }

                const ratingVal = prod.rating || '4.9';
                const reviewsVal = prod.reviews || '1,420';

                return (
                  <Link
                    key={prod.id ? `pop-${prod.id}-${idx}` : `pop-${idx}`}
                    href={prod.id ? `/products/${prod.id}` : '/products'}
                    className="group bg-white rounded-[26px] border border-slate-200/90 hover:border-[#00B074] shadow-2xs hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between relative font-sans cursor-pointer h-full"
                  >
                    {/* Top Row: Best Seller Badge & Heart */}
                    <div className="flex items-center justify-between z-10 mb-1 min-h-[28px]">
                      {prod.is_best_seller ? (
                        <span className="px-3 py-1 rounded-full bg-[#FFA500] text-white font-black text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-white text-white" />
                          <span>{locale === 'ar' ? 'الأكثر مبيعاً' : 'BEST SELLER'}</span>
                        </span>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(prod);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Add to Wishlist"
                      >
                        <Heart className={`w-5 h-5 ${isInWishlist(prod.id) ? 'text-rose-500 fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Product Image Container */}
                    <div className="w-full aspect-square rounded-2xl bg-[#F8F9FA] p-3 sm:p-4 overflow-hidden flex items-center justify-center my-2 relative group-hover:bg-[#F2F4F7] transition-colors">
                      <img
                        src={finalImg}
                        alt={title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Info Content */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* In Stock Badge */}
                        <div className="flex justify-end mb-1">
                          <span className="text-[#00B074] font-bold text-xs">
                            {hasVariants
                              ? (locale === 'ar' ? 'متوفر بخيارات' : 'Multi-Variant')
                              : (locale === 'ar' ? 'متوفر' : 'In Stock')}
                          </span>
                        </div>

                        {/* Product Title */}
                        <h3 className="font-extrabold text-[#0B1527] text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#00B074] transition-colors mb-1.5">
                          {title}
                        </h3>

                        {/* Rating & Divider */}
                        <div className="flex items-center gap-1.5 text-xs pb-2.5 border-b border-slate-100 mb-2.5">
                          <span className="text-[#FFA500] text-sm font-bold">★</span>
                          <span className="font-bold text-slate-800">{ratingVal}</span>
                          <span className="text-slate-400">({reviewsVal})</span>
                        </div>
                      </div>

                      {/* Price Row & Full Width Add to Cart */}
                      <div className="mt-auto space-y-3">
                        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                          {hasVariants && (
                            <span className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'من' : 'From'}</span>
                          )}
                          <span className="text-xs font-bold text-slate-500">SAR</span>
                          <span className="text-sm sm:text-[15px] font-black text-slate-900 font-sans whitespace-nowrap leading-tight">
                            {isNaN(finalPrice) ? prod.price : finalPrice.toFixed(2)}
                          </span>
                          {!hasVariants && originalPrice && originalPrice > finalPrice && (
                            <span className="text-xs text-slate-400 line-through font-normal">
                              SAR {originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter, Select Options, or Full Width Button */}
                        {(() => {
                          if (hasVariants) {
                            return (
                              <div className="w-full h-8 rounded-xl bg-slate-900 hover:bg-[#00B074] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                <Zap className="w-4 h-4 text-amber-300" />
                                <span>{locale === 'ar' ? 'اختر الخيارات' : 'Select Options'}</span>
                              </div>
                            );
                          }

                          const cartItem = getCartItem(prod.id);
                          const inCart = cartItem && cartItem.quantity > 0;
                          const isBusy = addingId === prod.id || actionId === prod.id;

                          if (inCart) {
                            return (
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="w-full h-8 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between px-3 shadow-2xs"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDecrement(prod.id);
                                  }}
                                  disabled={isBusy}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                  title={cartItem.quantity === 1 ? (locale === 'ar' ? 'حذف' : 'Remove') : (locale === 'ar' ? 'إنقاص' : 'Decrease')}
                                >
                                  {cartItem.quantity === 1 ? (
                                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />

                                  ) : (
                                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  )}
                                </button>
                                <span className="text-sm font-black text-slate-900 select-none">
                                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : cartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleIncrement(prod.id, prod);
                                  }}
                                  disabled={isBusy}
                                  className="w-7 h-7 rounded-lg bg-[#00B074] hover:bg-[#009663] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                  title={locale === 'ar' ? 'زيادة' : 'Increase'}
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(prod.id, prod);
                              }}
                              disabled={isBusy}
                              className="w-full h-8 rounded-xl bg-[#00B074] hover:bg-[#009663] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <ShoppingBag className="w-4 h-4" />
                                  <span>{locale === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        </section>

        {/* 8. Freshness at your Doorstep Banner Section */}
        <section className="py-10 sm:py-14 text-center space-y-3 max-w-3xl mx-auto font-sans">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#333333] tracking-tight leading-snug font-sans">
            {locale === 'ar' ? 'الطازج حتى عتبة دارك' : 'Freshness at your Doorstep'}
          </h2>
          <p className="text-[#666666] font-normal text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'تسوق البقالة عالية الجودة والفواكه الطازجة والمستلزمات اليومية والوجبات الخفيفة السريعة التي تصل مباشرة إلى منزلك.'
              : 'Shop Quality groceries, quality fruits, daily essentials and quick snacks delivered straight to your Home.'}
          </p>
        </section>





      </div>
    </div>
  );
}
