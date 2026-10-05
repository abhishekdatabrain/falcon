'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useCart } from '../../../src/contexts/CartContext';
import { useWishlist } from '../../../src/contexts/WishlistContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  ShoppingBag,
  Heart,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Share2,
  RotateCcw,
  Zap,
  Check,
  Star,
  Leaf,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const DEMO_EGG_PRODUCT = {
  id: 'egg-1',
  category: 'Dairy & Eggs',
  category_ar: 'الألبان والبيض',
  name_en: 'Fresh Farm Eggs',
  name_ar: 'بيض مزارع طازج',
  tag_en: 'Farm Fresh',
  tag_ar: 'طازج من المزرعة',
  rating: '4.8',
  reviews: '124',
  price: '350',
  mrp: '420',
  description_en: 'Nutritious, fresh and naturally sourced — perfect for your daily meals.',
  description_ar: 'مغذي وطازج ومصادر طبيعية — مثالي لوجباتك اليومية.',
  long_description_en: 'Our farm fresh eggs are sourced from trusted local farms, ensuring the highest quality and freshness. Packed with essential nutrients, they are a great source of protein and perfect for a healthy lifestyle.',
  long_description_ar: 'يتم توريد بيض مزارعنا الطازج من مزارع محلية موثوقة لضمان أعلى مستويات الجودة والانتعاش. غني بالبروتين والمغذيات الأساسية لنمط حياة صحي.',
  variants: [
    { id: 'v1', label_en: 'Per Piece', label_ar: 'بالقطعة', price: '35' },
    { id: 'v2', label_en: 'Per Dozen', label_ar: 'بالطبق (درزن)', price: '350', isPopular: true },
    { id: 'v3', label_en: 'Per 6 Pieces', label_ar: '٦ قطع', price: '210' },
  ],
  images: [
    'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800',
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800',
    'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800',
  ],
};

const YOU_MAY_ALSO_LIKE = [
  {
    id: 'rel-1',
    name_en: 'Fresh Farm Milk 1L',
    name_ar: 'حليب مزارع طازج ١ لتر',
    unit: '1 Litre',
    rating: '4.6',
    reviews: '98',
    price: '120',
    img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
  },
  {
    id: 'rel-2',
    name_en: 'Artisan Sourdough Bread',
    name_ar: 'خبز صامولي طازج',
    unit: '1 Loaf',
    rating: '4.6',
    reviews: '98',
    price: '120',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
  },
  {
    id: 'rel-3',
    name_en: 'Sweet Yellow Bananas',
    name_ar: 'موز أصفر طازج',
    unit: '1 kg Bag',
    rating: '4.6',
    reviews: '98',
    price: '120',
    img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
  },
  {
    id: 'rel-4',
    name_en: 'Fresh Vine Tomatoes',
    name_ar: 'طماطم حمراء طازجة',
    unit: '1 kg Pack',
    rating: '4.6',
    reviews: '98',
    price: '120',
    img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
  },
  {
    id: 'rel-5',
    name_en: 'Organic Hass Avocados',
    name_ar: 'أفوكادو هاس عضوي',
    unit: '2 Pieces',
    rating: '4.6',
    reviews: '98',
    price: '120',
    img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { locale } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(DEMO_EGG_PRODUCT);
  const [selectedImg, setSelectedImg] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('v2'); // Default: Per Dozen
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addingRelId, setAddingRelId] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(`/products/${productId}`);
        if (res.success && res.data?.product) {
          const item = res.data.product;
          let imgs = [];
          if (Array.isArray(item.images) && item.images.length > 0) {
            imgs = item.images.map((i) => (typeof i === 'string' ? i : i?.image_url || i?.url)).filter(Boolean);
          }
          if (imgs.length === 0) imgs = DEMO_EGG_PRODUCT.images;
          item.images = imgs;
          if (!item.price) item.price = '350';
          if (!item.variants) item.variants = DEMO_EGG_PRODUCT.variants;
          setProduct({ ...DEMO_EGG_PRODUCT, ...item });
          setSelectedImg(imgs[0]);
        } else {
          setProduct(DEMO_EGG_PRODUCT);
          setSelectedImg(DEMO_EGG_PRODUCT.images[0]);
        }
      } catch (err) {
        console.error('Error loading product detail:', err);
        setProduct(DEMO_EGG_PRODUCT);
        setSelectedImg(DEMO_EGG_PRODUCT.images[0]);
      } finally {
        setLoading(false);
      }
    };
    if (productId) loadProduct();
  }, [productId]);

  const activeVariantObj = product?.variants?.find((v) => v.id === selectedVariant) || product?.variants?.[1] || { price: product?.price || '350' };
  const currentUnitPrice = parseFloat(activeVariantObj.price || product?.price || 350);
  const totalPrice = (currentUnitPrice * quantity).toFixed(0);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.id, quantity, {
        ...product,
        selectedVariant: activeVariantObj,
        price: currentUnitPrice,
      });
    } catch (err) {
      // Toast handles error
    } finally {
      setAdding(false);
    }
  };

  const handleAddRelated = async (relItem) => {
    try {
      setAddingRelId(relItem.id);
      await addToCart(relItem.id, 1, relItem);
    } catch (err) {
      // Toast handles error
    } finally {
      setAddingRelId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#043927] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0 ? product.images : DEMO_EGG_PRODUCT.images;
  const isWish = isInWishlist(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 font-sans bg-white pb-24">

      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 font-sans">
        <Link href="/" className="hover:text-[#043927] transition-colors">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
        <span>›</span>
        <Link href="/products?category=groceries" className="hover:text-[#043927] transition-colors">{locale === 'ar' ? 'البقالة' : 'Groceries'}</Link>
        <span>›</span>
        <Link href="/products?category=dairy" className="hover:text-[#043927] transition-colors">{locale === 'ar' ? (product.category_ar || 'الألبان والبيض') : (product.category || 'Dairy & Eggs')}</Link>
        <span>›</span>
        <span className="text-slate-900 font-bold">{locale === 'ar' ? product.name_ar : product.name_en}</span>
      </div>

      {/* 2. Main Product Showcase (Left Gallery + Right Purchase Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* LEFT COLUMN: Main Hero Image + Thumbnails + Feature Bar (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Hero Image Frame */}
          <div className="w-full aspect-[4/3] sm:aspect-square rounded-3xl bg-[#F8F9FA] border border-slate-200/80 p-6 relative flex items-center justify-center overflow-hidden shadow-2xs group">
            {/* Top Left Best Seller Badge */}
            <span className="absolute top-4 left-4 bg-[#FFA500] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs z-10 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-white" />
              <span>BEST SELLER</span>
            </span>

            {/* Top Right Wishlist Heart Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all z-10 cursor-pointer hover:scale-110"
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWish ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            </button>

            {/* Main Product Image */}
            <img
              src={getImageUrl(selectedImg || galleryImages[0])}
              alt={locale === 'ar' ? product.name_ar : product.name_en}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* 4 Thumbnails Grid */}
          <div className="grid grid-cols-4 gap-3">
            {galleryImages.slice(0, 4).map((imgUrl, idx) => {
              const isSelected = (selectedImg || galleryImages[0]) === imgUrl;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(imgUrl)}
                  className={`aspect-square rounded-2xl p-1 bg-[#F8F9FA] border-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center ${
                    isSelected ? 'border-[#043927] ring-2 ring-emerald-100 shadow-xs scale-95' : 'border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={getImageUrl(imgUrl)} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                </button>
              );
            })}
          </div>

          {/* Feature Badges Bar */}
          <div className="bg-[#F9F6F0] rounded-2xl p-3.5 border border-amber-200/50 flex items-center justify-around text-xs font-bold text-slate-800 font-sans shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#043927]" />
              <span>{locale === 'ar' ? 'طازج من المزرعة' : 'Farm Fresh'}</span>
            </div>
            <span className="text-amber-300">|</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#043927]" />
              <span>{locale === 'ar' ? 'غني بالعناصر الغذائية' : 'Rich in Nutrients'}</span>
            </div>
            <span className="text-amber-300">|</span>
            <div className="flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-[#043927]" />
              <span>{locale === 'ar' ? 'إنتاج محلي' : 'Locally Sourced'}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Product Info & Purchase Controls (6 Columns) */}
        <div className="lg:col-span-6 space-y-6">

          {/* Category Tag */}
          <div>
            <span className="bg-emerald-100/80 text-[#043927] font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              {locale === 'ar' ? (product.tag_ar || 'طازج من المزرعة') : (product.tag_en || 'Farm Fresh')}
            </span>

            {/* Product Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 tracking-tight leading-tight font-sans mt-2">
              {locale === 'ar' ? product.name_ar : product.name_en}
            </h1>

            {/* Rating Stars & Reviews Count */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 text-amber-500 font-extrabold text-sm">
                <span>★ ★ ★ ★ ★</span>
                <span className="text-slate-900 font-bold ml-1">{product.rating || '4.8'}</span>
              </div>
              <span className="text-slate-400 text-xs font-normal">({product.reviews || '124'} reviews)</span>
            </div>

            {/* Short Description */}
            <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed mt-2">
              {locale === 'ar' ? product.description_ar : product.description_en}
            </p>
          </div>

          {/* Key Feature Chips Row */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { en: '100% Natural', ar: '١٠٠٪ طبيعي' },
              { en: 'High in Protein', ar: 'غني بالبروتين' },
              { en: 'No Artificial Additives', ar: 'بدون إضافات صناعية' },
            ].map((chip, idx) => (
              <span
                key={idx}
                className="bg-emerald-50 text-[#043927] font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#05A764]" />
                <span>{locale === 'ar' ? chip.ar : chip.en}</span>
              </span>
            ))}
          </div>

          {/* Price Box */}
          <div className="space-y-0.5 pt-2 border-t border-slate-100">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#043927] font-sans">
                SAR {currentUnitPrice}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium block">
              {locale === 'ar' ? 'شامل ضريبة القيمة المضافة' : 'Inclusive of VAT'}
            </span>
          </div>

          {/* Choose Quantity Option Variant Cards */}
          <div className="space-y-2.5 pt-2">
            <label className="font-extrabold text-slate-900 text-sm block font-sans">
              {locale === 'ar' ? 'اختر الكمية' : 'Choose Quantity'}
            </label>

            <div className="grid grid-cols-3 gap-3">
              {product.variants.map((v) => {
                const isSelected = selectedVariant === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    className={`p-3.5 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer relative flex flex-col justify-between min-h-[75px] ${
                      isSelected
                        ? 'border-2 border-[#043927] bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{locale === 'ar' ? v.label_ar : v.label_en}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#043927] bg-[#043927] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base font-sans mt-1">
                      SAR {v.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper & Dynamic Total Row */}
          <div className="flex items-center justify-between gap-4 pt-2">
            {/* Stepper */}
            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2 bg-white text-slate-900 font-bold shadow-2xs">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-slate-400 hover:text-slate-900 text-base font-extrabold px-1 cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-black text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-slate-400 hover:text-slate-900 text-base font-extrabold px-1 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Dynamic Total */}
            <div className="text-right rtl:text-left">
              <span className="text-slate-900 font-extrabold text-sm sm:text-base font-sans">
                {locale === 'ar' ? `الإجمالي: ${totalPrice} ريال` : `Total: SAR ${totalPrice}`}
              </span>
            </div>
          </div>

          {/* CTA Action Buttons Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 py-4 px-8 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-base shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{adding ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart')}</span>
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className="py-4 px-6 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
              <span className="hidden sm:inline">{locale === 'ar' ? 'المفضلة' : 'Add to Wishlist'}</span>
            </button>
          </div>

          {/* Bottom Trust Guarantee Bar */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-700 border border-slate-200/60 shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-[#043927]" />
                <span>{locale === 'ar' ? 'توصيل نفس اليوم' : 'Same Day Delivery'}</span>
              </div>
              <span className="text-slate-400 text-[10px] block">{locale === 'ar' ? 'قبل الساعة ٢ ظهراً' : 'Order before 2 PM'}</span>
            </div>

            <div className="space-y-0.5 border-x border-slate-200/80 px-1">
              <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-[#043927]" />
                <span>{locale === 'ar' ? 'ضمان الانتعاش' : 'Freshness Guarantee'}</span>
              </div>
              <span className="text-slate-400 text-[10px] block">{locale === 'ar' ? 'أفضل جودة دائماً' : 'Best quality always'}</span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                <RotateCcw className="w-3.5 h-3.5 text-[#043927]" />
                <span>{locale === 'ar' ? 'إرجاع سهل' : 'Easy Returns'}</span>
              </div>
              <span className="text-slate-400 text-[10px] block">{locale === 'ar' ? 'بدون تعقيد' : 'Hassle free'}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Tabbed Information Section */}
      <div className="pt-10 border-t border-slate-200/80 space-y-6 font-sans">
        
        {/* Tab Buttons Header */}
        <div className="flex items-center gap-8 border-b border-slate-200 text-sm sm:text-base font-bold text-slate-500 font-sans">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === 'description'
                ? 'border-b-2 border-[#043927] text-[#043927] font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            {locale === 'ar' ? 'وصف المنتج' : 'Product Description'}
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === 'nutrition'
                ? 'border-b-2 border-[#043927] text-[#043927] font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            {locale === 'ar' ? 'القيمة الغذائية' : 'Nutrition Facts'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-b-2 border-[#043927] text-[#043927] font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            {locale === 'ar' ? 'التقييمات (١٢٤)' : 'Reviews (124)'}
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'description' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
                {locale === 'ar' ? 'طازج طبيعياً. رائع دائماً.' : 'Naturally Fresh. Always Good.'}
              </h3>
              <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
                {locale === 'ar' ? product.long_description_ar : product.long_description_en}
              </p>

              <div className="space-y-2.5 pt-2 text-xs sm:text-sm font-semibold text-slate-800">
                {[
                  { en: '100% natural and farm fresh', ar: '١٠٠٪ طبيعي وطازج من المزرعة' },
                  { en: 'Rich in protein, vitamins and minerals', ar: 'غني بالبروتين والفيتامينات والمعادن' },
                  { en: 'No artificial colors or preservatives', ar: 'بدون ألوان صناعية أو مواد حافظة' },
                  { en: 'Perfect for breakfast, baking and cooking', ar: 'مثالي للإفطار والمخبوزات والطهي' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#05A764] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{locale === 'ar' ? item.ar : item.en}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Banner Image */}
            <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800"
                alt="Freshness you can taste"
                className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <span className="text-white font-extrabold text-lg sm:text-xl font-sans drop-shadow-md">
                  Freshness you can taste! →
                </span>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="pt-2 max-w-xl space-y-3 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-900">{locale === 'ar' ? 'القيم الغذائية لكل حبة:' : 'Nutrition Facts per 1 Egg (50g):'}</h4>
            <div className="grid grid-cols-2 gap-3 text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>• Calories: 72 kcal</div>
              <div>• Protein: 6.3 g</div>
              <div>• Total Fat: 4.8 g</div>
              <div>• Cholesterol: 186 mg</div>
              <div>• Vitamin D: 1 mcg</div>
              <div>• Calcium: 28 mg</div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="pt-2 space-y-4 max-w-xl text-xs sm:text-sm">
            <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-3xl font-black text-amber-600">4.8</span>
              <div>
                <div className="text-amber-500 font-extrabold text-sm">★ ★ ★ ★ ★</div>
                <span className="text-slate-600 font-medium">{locale === 'ar' ? 'بناءً على ١٢٤ تقييم موثق' : 'Based on 124 verified reviews'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. "You May Also Like" Related Products Section */}
      <div className="pt-10 border-t border-slate-200/80 space-y-6 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {locale === 'ar' ? 'قد يعجبك أيضاً' : 'You May Also Like'}
          </h2>

          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#043927] flex items-center gap-1 group transition-colors"
          >
            <span>{locale === 'ar' ? 'عرض الكل' : 'See All'}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 5 Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {YOU_MAY_ALSO_LIKE.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-lg transition-all duration-300 p-3.5 flex flex-col justify-between font-sans cursor-pointer min-h-[290px]"
            >
              <Link href={`/products/${item.id}`} className="space-y-2 block">
                {/* Image */}
                <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.img}
                    alt={locale === 'ar' ? item.name_ar : item.name_en}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#043927] transition-colors">
                    {locale === 'ar' ? item.name_ar : item.name_en}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {item.unit}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-extrabold">
                    <span>★ {item.rating}</span>
                    <span className="text-slate-400 font-normal">({item.reviews})</span>
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm block pt-1 font-sans">
                    SAR {item.price}
                  </span>
                </div>
              </Link>

              {/* Add Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddRelated(item);
                }}
                className="w-full mt-2 py-2 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-2xs transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{addingRelId === item.id ? '...' : (locale === 'ar' ? 'أضف' : 'Add to Cart')}</span>
              </button>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
