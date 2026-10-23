'use client';
import React, { useEffect, useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Ban,
  Activity,
} from 'lucide-react';

// const DEMO_EGG_PRODUCT = {
//   id: 'egg-1',
//   category: 'Dairy & Eggs',
//   category_ar: 'الألبان والبيض',
//   name_en: 'Fresh Farm Eggs',
//   name_ar: 'بيض مزارع طازج',
//   tag_en: 'Farm Fresh',
//   tag_ar: 'طازج من المزرعة',
//   rating: '4.8',
//   reviews: '124',
//   price: '350',
//   mrp: '420',
//   description_en: 'Nutritious, fresh and naturally sourced — perfect for your daily meals.',
//   description_ar: 'مغذي وطازج ومصادر طبيعية — مثالي لوجباتك اليومية.',
//   long_description_en: 'Our farm fresh eggs are sourced from trusted local farms, ensuring the highest quality and freshness. Packed with essential nutrients, they are a great source of protein and perfect for a healthy lifestyle.',
//   long_description_ar: 'يتم توريد بيض مزارعنا الطازج من مزارع محلية موثوقة لضمان أعلى مستويات الجودة والانتعاش. غني بالبروتين والمغذيات الأساسية لنمط حياة صحي.',
//   variants: [
//     { id: 'v1', label_en: 'Per Piece', label_ar: 'بالقطعة', price: '35' },
//     { id: 'v2', label_en: 'Per Dozen', label_ar: 'بالطبق (درزن)', price: '350', isPopular: true },
//     { id: 'v3', label_en: 'Per 6 Pieces', label_ar: '٦ قطع', price: '210' },
//   ],
//   images: [
//     'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800',
//     'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800',
//     'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800',
//     'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800',
//   ],
// };



export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { locale } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState();
  const [selectedImg, setSelectedImg] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addingRelId, setAddingRelId] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const relatedScrollRef = useRef(null);
  const [canScrollRelLeft, setCanScrollRelLeft] = useState(false);
  const [canScrollRelRight, setCanScrollRelRight] = useState(true);

  const checkRelatedScroll = () => {
    if (relatedScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = relatedScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const current = Math.abs(scrollLeft);
      setCanScrollRelLeft(current > 8);
      setCanScrollRelRight(current < maxScroll - 8);
    }
  };

  const scrollRelated = (direction) => {
    if (relatedScrollRef.current) {
      const container = relatedScrollRef.current;
      const scrollAmount = Math.max(container.clientWidth * 0.75, 260);
      const isRtl = locale === 'ar';
      let offset = direction === 'right' ? scrollAmount : -scrollAmount;
      if (isRtl) offset = -offset;
      container.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkRelatedScroll, 350);
    }
  };

  useEffect(() => {
    checkRelatedScroll();
    const timer = setTimeout(checkRelatedScroll, 400);
    window.addEventListener('resize', checkRelatedScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkRelatedScroll);
    };
  }, [relatedProducts, locale]);

  const fetchRelatedProducts = async (currentProd) => {
    if (!currentProd) return;
    try {
      const subSubCatId = currentProd.sub_sub_category_id || currentProd.sub_subcategory_id || currentProd.subSubcategoryId || currentProd.subSubCategory?.id;
      const subCatId = currentProd.sub_category_id || currentProd.subcategory_id || currentProd.subcategoryId || currentProd.subCategory?.id;
      const catId = currentProd.category_id || currentProd.categoryId || (typeof currentProd.category === 'object' ? currentProd.category?.id : null);

      const collected = [];
      const seenIds = new Set([String(currentProd.id)]);

      const isProductValid = (p) => {
        if (!p || !p.id) return false;
        const pId = String(p.id);
        if (seenIds.has(pId)) return false;
        if (p.is_active === false || p.status === 'inactive' || p.status === 'DISABLED') return false;
        if (p.is_out_of_stock === true || p.stock === 0 || p.stock_quantity === 0) return false;
        return true;
      };

      const appendProducts = (items) => {
        if (!Array.isArray(items)) return;
        for (const item of items) {
          if (isProductValid(item)) {
            seenIds.add(String(item.id));
            collected.push(item);
            if (collected.length >= 20) break;
          }
        }
      };

      // 1. Fetch by Sub-Subcategory first
      if (subSubCatId && collected.length < 20) {
        const res = await fetchApi(`/products?subSubcategoryId=${subSubCatId}&limit=20`);
        const items = res?.data?.products || res?.products || res?.data || [];
        appendProducts(items);
      }

      // 2. Fetch by Subcategory next if not enough
      if (subCatId && collected.length < 20) {
        const res = await fetchApi(`/products?subcategoryId=${subCatId}&limit=20`);
        const items = res?.data?.products || res?.products || res?.data || [];
        appendProducts(items);
      }

      // 3. Fetch by Category next if not enough
      if (catId && collected.length < 20) {
        const res = await fetchApi(`/products?categoryId=${catId}&limit=20`);
        const items = res?.data?.products || res?.products || res?.data || [];
        appendProducts(items);
      }

      // 4. Fetch general active products fallback if still under 20
      if (collected.length < 20) {
        const res = await fetchApi(`/products?limit=20`);
        const items = res?.data?.products || res?.products || res?.data || [];
        appendProducts(items);
      }

      if (collected.length > 0) {
        setRelatedProducts(collected.slice(0, 20));
      } else {
        setRelatedProducts([]);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
      setRelatedProducts([]);
    }
  };

  const getSeeAllLink = () => {
    const subSubCatId = product?.sub_sub_category_id || product?.sub_subcategory_id || product?.subSubcategoryId || product?.subSubCategory?.id;
    const subCatId = product?.sub_category_id || product?.subcategory_id || product?.subcategoryId || product?.subCategory?.id;
    const catId = product?.category_id || product?.categoryId || (typeof product?.category === 'object' ? product?.category?.id : null);

    if (subSubCatId) {
      let url = `/products?subSubcategoryId=${subSubCatId}`;
      if (subCatId) url += `&subcategoryId=${subCatId}`;
      if (catId) url += `&categoryId=${catId}`;
      return url;
    }
    if (subCatId) {
      let url = `/products?subcategoryId=${subCatId}`;
      if (catId) url += `&categoryId=${catId}`;
      return url;
    }
    if (catId) {
      return `/products?categoryId=${catId}`;
    }
    return '/products';
  };

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
          } else if (item.image || item.image_url) {
            imgs = [item.image || item.image_url];
          }
          item.images = imgs;
          setProduct(item);
          if (item.has_variants && Array.isArray(item.variants) && item.variants.length > 0) {
            setSelectedVariantId(item.variants[0].id);
            if (item.variants[0].image_url) {
              setSelectedImg(item.variants[0].image_url);
            } else if (imgs.length > 0) {
              setSelectedImg(imgs[0]);
            }
          } else if (imgs.length > 0) {
            setSelectedImg(imgs[0]);
          }
          fetchRelatedProducts(item);
        }
      } catch (err) {
        console.error('Error loading product detail:', err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) loadProduct();
  }, [productId]);

  // Active Variant and Price Calculations
  const activeVariant = product?.has_variants && Array.isArray(product?.variants) && product.variants.length > 0
    ? (product.variants.find((v) => v.id === selectedVariantId) || product.variants[0])
    : null;

  const currentUnitPrice = activeVariant
    ? parseFloat(activeVariant.price || 0)
    : parseFloat(product?.price || product?.original_price || product?.compare_at_price || 0);

  const discountPrice = activeVariant
    ? (activeVariant.discount_price ? parseFloat(activeVariant.discount_price) : 0)
    : parseFloat(product?.discount_price || 0);

  const activeStock = activeVariant
    ? (activeVariant.stock_quantity ?? 0)
    : (product?.stock_quantity ?? 0);

  const isOutOfStock = activeStock <= 0;

  const vatPercent = Math.round(Number(product?.vat_percentage) || 0);
  const effectivePrice = discountPrice > 0 && discountPrice < currentUnitPrice ? discountPrice : currentUnitPrice;
  const totalPrice = (effectivePrice * quantity).toFixed(2);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.id, quantity, {
        ...product,
        ...(activeVariant ? {
          variant_id: activeVariant.id,
          variantId: activeVariant.id,
          sku: activeVariant.sku,
          price: currentUnitPrice,
          discount_price: discountPrice > 0 ? discountPrice : null,
          unit_value: activeVariant.unit_value,
          unit_type: activeVariant.unit_type,
          pack_size: activeVariant.pack_size,
          image: activeVariant.image_url || selectedImg,
        } : {
          price: currentUnitPrice,
          discount_price: discountPrice > 0 ? discountPrice : null,
        }),
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

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center font-sans">
        <h2 className="text-2xl font-bold text-slate-800">
          {locale === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
        </h2>
        <Link href="/products" className="mt-4 inline-block px-6 py-2.5 bg-[#043927] text-white font-bold rounded-xl shadow-xs">
          {locale === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
        </Link>
      </div>
    );
  }

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (product?.image || product?.image_url ? [product.image || product.image_url] : []);
  const isWish = isInWishlist(product.id);

  const categoryObj = typeof product?.category === 'object' && product?.category !== null ? product.category : null;
  const categoryNameEn = categoryObj?.name_en || (typeof product?.category === 'string' ? product.category : 'Dairy & Eggs');
  const categoryNameAr = categoryObj?.name_ar || product?.category_ar || 'الألبان والبيض';
  const categoryLink = categoryObj?.id ? `/products?categoryId=${categoryObj.id}` : '/products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 font-sans bg-white pb-24">

      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 font-sans">
        <Link href="/" className="hover:text-[#043927] transition-colors">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
        <span>›</span>
        <Link href="/products" className="hover:text-[#043927] transition-colors">{locale === 'ar' ? 'البقالة' : 'Groceries'}</Link>
        <span>›</span>
        <Link href={categoryLink} className="hover:text-[#043927] transition-colors">{locale === 'ar' ? categoryNameAr : categoryNameEn}</Link>
        <span>›</span>
        <span className="text-slate-900 font-bold">{locale === 'ar' ? product.name_ar : product.name_en}</span>
      </div>

      {/* 2. Main Product Showcase (Left Gallery + Right Purchase Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* LEFT COLUMN: Main Hero Image + Thumbnails + Feature Bar (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">

          {/* Hero Image Frame */}
          <div className="w-full max-w-md aspect-[4/3] max-h-[320px] sm:max-h-[330px] rounded-2xl bg-[#F8F9FA] border border-slate-200/80 relative flex items-center justify-center overflow-hidden shadow-2xs group">
            {/* Top Left Badge */}

            {isOutOfStock ? (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md z-10 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-white" />
                <span>{locale === 'ar' ? 'نفذت الكمية' : 'OUT OF STOCK'}</span>
              </span>
            ) : product.is_best_seller === true && (
              <span className="absolute top-4 left-4 bg-[#FFA500] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs z-10 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-white" />
                <span>BEST SELLER</span>
              </span>
            )}


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
              src={getImageUrl(selectedImg || galleryImages[0]) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
              alt={locale === 'ar' ? product.name_ar : product.name_en}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800';
              }}
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
                  className={`aspect-square rounded-2xl p-1 bg-[#F8F9FA] border-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center ${isSelected ? 'border-[#043927] ring-2 ring-emerald-100 shadow-xs scale-95' : 'border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}
                >
                  <img
                    src={getImageUrl(imgUrl) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                    }}
                  />
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
                <span className="text-slate-900 font-bold ml-1">
                  {product.rating !== undefined && product.rating !== null && product.rating !== ''
                    ? Number(product.rating).toFixed(1)
                    : (product.avg_rating ? Number(product.avg_rating).toFixed(1) : '4.8')}
                </span>
              </div>
              <span className="text-slate-400 text-xs font-normal">
                ({(product.reviews_count !== undefined && product.reviews_count !== null
                  ? Number(product.reviews_count)
                  : (product.reviews ? Number(product.reviews) : 120)).toLocaleString()} {locale === 'ar' ? 'تقييم' : 'reviews'})
              </span>
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

          {/* Price Box - Single Line Layout */}
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-100 font-sans">
            {/* Selling Price (Dark Green Bold) */}
            <span className="text-[#043927] font-black text-2xl sm:text-3xl tracking-tight">
              {locale === 'ar' ? `${discountPrice || currentUnitPrice} ريال` : `SAR ${discountPrice || currentUnitPrice}`}
            </span>

            {/* Actual Price (Strikethrough) */}
            {discountPrice > 0 && discountPrice < currentUnitPrice && (
              <span className="text-[#94A3B8] line-through font-medium text-lg sm:text-xl">
                {locale === 'ar' ? `${currentUnitPrice.toFixed(2)} ريال` : `SAR ${currentUnitPrice.toFixed(2)}`}
              </span>
            )}

          
          </div>

          {/* Dynamic Variant Selector (Has Variants) */}
          {product?.has_variants && Array.isArray(product.variants) && product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-900 text-sm block font-sans">
                  {locale === 'ar' ? 'اختر الحجم / العبوة' : 'Choose Size / Pack Size'}
                </label>
                {activeVariant?.sku && (
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    SKU: {activeVariant.sku}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  const vPrice = parseFloat(v.price || 0);
                  const vDisc = v.discount_price ? parseFloat(v.discount_price) : null;
                  const varOutOfStock = v.stock_quantity <= 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={varOutOfStock}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        if (v.image_url) {
                          setSelectedImg(v.image_url);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer relative flex flex-col justify-between min-h-[75px] ${
                        varOutOfStock
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                          : isSelected
                          ? 'border-2 border-[#043927] bg-emerald-50/50 shadow-xs ring-2 ring-[#043927]/10'
                          : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{v.unit_value ? `${v.unit_value} ${v.unit_type || ''}` : v.sku}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#043927] bg-[#043927] text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {v.pack_size && (
                        <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5 block">
                          {v.pack_size}
                        </span>
                      )}

                      <div className="flex items-baseline gap-1.5 mt-1 font-sans">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          SAR {vDisc || vPrice}
                        </span>
                        {vDisc && vDisc < vPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            SAR {vPrice}
                          </span>
                        )}
                        {varOutOfStock && (
                          <span className="text-[9px] font-bold text-rose-600 block">Out of stock</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock status indicator (for all products) */}
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 pt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-emerald-500 ring-2 ring-emerald-200'}`} />
            <span className={isOutOfStock ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-bold'}>
              {isOutOfStock
                ? (locale === 'ar' ? 'غير متوفر في المخزون حالياً (نفذت الكمية)' : 'Currently Out of Stock')
                : (locale === 'ar' ? `متوفر في المخزون (${activeStock} متوفرة)` : `In Stock (${activeStock} available)`)}
            </span>
          </div>

          {/* Quantity Stepper & Dynamic Total Row */}
          <div className="flex items-center justify-between gap-4 pt-2">
            {/* Stepper */}
            <div className={`flex items-center gap-3 border rounded-xl px-3.5 py-2 font-bold shadow-2xs ${isOutOfStock ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-900'}`}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isOutOfStock || quantity <= 1}
                className="text-slate-400 hover:text-slate-900 text-base font-extrabold px-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="w-6 text-center font-black text-sm">{isOutOfStock ? 0 : quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                disabled={isOutOfStock || (activeStock > 0 && quantity >= activeStock)}
                className="text-slate-400 hover:text-slate-900 text-base font-extrabold px-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
              disabled={adding || isOutOfStock}
              className={`flex-1 py-4 px-8 rounded-full text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 group ${
                isOutOfStock
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#043927] hover:bg-[#02281b] hover:shadow-xl cursor-pointer'
              }`}
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>
                {adding
                  ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                  : isOutOfStock
                  ? (locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                  : (locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart')}
              </span>
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
          {/* <div className="bg-[#F8F9FA] rounded-2xl p-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-700 border border-slate-200/60 shadow-2xs">
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
          </div> */}

        </div>

      </div>

      {/* 3. Tabbed Information Section */}
      <div className="pt-10 border-t border-slate-200/80 space-y-6 font-sans">

        {/* Tab Buttons Header */}
        <div className="flex items-center gap-8 border-b border-slate-200 text-sm sm:text-base font-bold text-slate-500 font-sans">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 transition-colors cursor-pointer ${activeTab === 'description'
              ? 'border-b-2 border-[#043927] text-[#043927] font-extrabold'
              : 'hover:text-slate-900'
              }`}
          >
            {locale === 'ar' ? 'وصف المنتج' : 'Product Description'}
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`pb-3 transition-colors cursor-pointer ${activeTab === 'nutrition'
              ? 'border-b-2 border-[#043927] text-[#043927] font-extrabold'
              : 'hover:text-slate-900'
              }`}
          >
            {locale === 'ar' ? 'القيمة الغذائية' : 'Nutrition Facts'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition-colors cursor-pointer ${activeTab === 'reviews'
              ? 'border-b-2 border-[#043927] text-[#043927] font-extrabold'
              : 'hover:text-slate-900'
              }`}
          >
            {locale === 'ar'
              ? `التقييمات (${product?.reviews || product?.review_count || product?.num_reviews || 0})`
              : `Reviews (${product?.reviews || product?.review_count || product?.num_reviews || 0})`}
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'description' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
                {locale === 'ar'
                  ? (product?.description_title_ar || product?.tag_ar || product?.name_ar || 'طازج طبيعياً')
                  : (product?.description_title_en || product?.tag_en || product?.name_en || 'Naturally Fresh')}
              </h3>

              {/* Product Detailed Description */}
              {((locale === 'ar' ? (product?.long_description_ar || product?.description_ar) : (product?.long_description_en || product?.description_en)) || product?.description) ? (
                <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {locale === 'ar'
                    ? (product?.long_description_ar || product?.description_ar || product?.description)
                    : (product?.long_description_en || product?.description_en || product?.description)}
                </p>
              ) : (
                <p className="text-slate-400 font-medium text-xs sm:text-sm italic">
                  {locale === 'ar' ? 'لا يوجد وصف متاح لهذا المنتج حالياً.' : 'No description available for this product yet.'}
                </p>
              )}

              {/* Dynamic Feature Bullets / Highlights */}
              {(() => {
                let list = product?.highlights || product?.features || product?.bullets || product?.key_features;
                if (typeof list === 'string') {
                  try { list = JSON.parse(list); } catch (e) { list = list.split('\n').filter(Boolean); }
                }
                if (Array.isArray(list) && list.length > 0) {
                  const validItems = list.map((item) => {
                    if (typeof item === 'object' && item !== null) {
                      return locale === 'ar'
                        ? (item.text_ar || item.ar || item.text_en || item.en || '')
                        : (item.text_en || item.en || item.text_ar || item.ar || '');
                    }
                    return String(item);
                  }).filter(Boolean);

                  if (validItems.length === 0) return null;

                  return (
                    <div className="space-y-2.5 pt-2 text-xs sm:text-sm font-semibold text-slate-800">
                      {validItems.map((featureText, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-[#05A764] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{featureText}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Right Banner Image (Dynamic Product Image) */}
            <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-md group">
              <img
                src={getImageUrl(galleryImages[1] || galleryImages[0] || product?.image || product?.image_url)}
                alt={locale === 'ar' ? (product?.name_ar || 'طازج طبيعياً') : (product?.name_en || 'Fresh Product')}
                className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                <span className="text-white font-extrabold text-lg sm:text-xl font-sans drop-shadow-md">
                  {locale === 'ar'
                    ? (product?.name_ar ? `${product.name_ar} - طازج ولذيذ!` : 'جودة طازجة يمكنك تذوقها!')
                    : (product?.name_en ? `${product.name_en} - Fresh & Pure!` : 'Freshness you can taste!')} →
                </span>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="pt-2 max-w-xl space-y-3 text-xs sm:text-sm font-sans">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>
                {locale === 'ar'
                  ? `القيم الغذائية (${product?.name_ar || product?.name_en || ''}):`
                  : `Nutrition Facts (${product?.name_en || product?.name_ar || ''}):`}
              </span>
            </h4>

            {(() => {
              let nut = product?.nutrition_facts || product?.nutrition || product?.nutritional_info;
              if (typeof nut === 'string') {
                try { nut = JSON.parse(nut); } catch (e) { nut = {}; }
              }

              const labels = {
                serving_size: locale === 'ar' ? 'حجم الحصة' : 'Serving Size',
                calories: locale === 'ar' ? 'السعرات الحرارية' : 'Calories',
                protein: locale === 'ar' ? 'البروتين' : 'Protein',
                carbohydrates: locale === 'ar' ? 'الكربوهيدرات' : 'Carbohydrates',
                fat: locale === 'ar' ? 'الدهون الكلية' : 'Total Fat',
                fiber: locale === 'ar' ? 'الألياف الغذائية' : 'Dietary Fiber',
                sugar: locale === 'ar' ? 'السكريات' : 'Sugars',
                vitamins: locale === 'ar' ? 'الفيتامينات' : 'Vitamins',
                minerals: locale === 'ar' ? 'المعادن' : 'Minerals',
              };

              let entries = [];
              if (Array.isArray(nut) && nut.length > 0) {
                entries = nut.map((item) => {
                  if (typeof item === 'object' && item !== null) {
                    return [item.label || item.name || 'Nutrient', item.value || ''];
                  }
                  const parts = String(item).split(':');
                  return [parts[0], parts.slice(1).join(':').trim()];
                }).filter(([_, v]) => Boolean(v));
              } else if (typeof nut === 'object' && nut !== null) {
                const knownKeys = ['serving_size', 'calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'vitamins', 'minerals'];
                for (const k of knownKeys) {
                  if (nut[k] && String(nut[k]).trim() !== '') {
                    entries.push([labels[k] || k, String(nut[k]).trim()]);
                  }
                }
                for (const [k, v] of Object.entries(nut)) {
                  if (!knownKeys.includes(k) && v && String(v).trim() !== '') {
                    entries.push([k.replace(/_/g, ' '), String(v).trim()]);
                  }
                }
              }

              if (entries.length === 0) {
                return (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs sm:text-sm">
                    {locale === 'ar' ? 'معلومات القيمة الغذائية غير متوفرة لهذا المنتج حالياً.' : 'Nutrition information is not available for this product yet.'}
                  </div>
                );
              }

              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  {nut?.serving_size && (
                    <div className="pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50/60 px-3 py-1.5 rounded-xl">
                      <span>{locale === 'ar' ? 'حجم الحصة' : 'Serving Size'}</span>
                      <span className="font-extrabold">{nut.serving_size}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2.5 text-slate-700">
                    {entries
                      .filter(([label]) => label !== labels.serving_size && label !== 'serving_size')
                      .map(([label, val], idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between shadow-2xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">{val}</span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="pt-2 space-y-4 max-w-xl text-xs sm:text-sm">
            {Number(product?.reviews_count || product?.reviews || product?.review_count || 0) > 0 ? (
              <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <span className="text-3xl font-black text-amber-600">
                  {product?.rating !== undefined && product?.rating !== null && product?.rating !== ''
                    ? Number(product.rating).toFixed(1)
                    : (product?.avg_rating ? Number(product.avg_rating).toFixed(1) : '4.8')}
                </span>
                <div>
                  <div className="text-amber-500 font-extrabold text-sm">★ ★ ★ ★ ★</div>
                  <span className="text-slate-600 font-medium">
                    {locale === 'ar'
                      ? `بناءً على ${Number(product?.reviews_count || product?.reviews || product?.review_count).toLocaleString()} تقييم موثق`
                      : `Based on ${Number(product?.reviews_count || product?.reviews || product?.review_count).toLocaleString()} verified reviews`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 space-y-1">
                <div className="text-amber-400 text-lg">★ ★ ★ ★ ★</div>
                <p className="font-semibold text-slate-700">
                  {locale === 'ar' ? 'لا توجد تقييمات لهذا المنتج بعد' : 'No customer reviews yet'}
                </p>
                <p className="text-xs text-slate-500">
                  {locale === 'ar' ? 'كن أول من يقيم هذا المنتج بعد تجربته!' : 'Be the first to review this product after purchase!'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. "You May Also Like" Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-10 border-t border-slate-200/80 space-y-6 font-sans">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              {locale === 'ar' ? 'قد يعجبك أيضاً' : 'You May Also Like'}
            </h2>

            {/* Slider Navigation Controls replacing See All */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRelated('left')}
                disabled={!canScrollRelLeft}
                aria-label="Previous products"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                  canScrollRelLeft
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-[#006E2D] hover:text-white hover:border-[#006E2D] shadow-2xs hover:scale-105 active:scale-95'
                    : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => scrollRelated('right')}
                disabled={!canScrollRelRight}
                aria-label="Next products"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                  canScrollRelRight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-[#006E2D] hover:text-white hover:border-[#006E2D] shadow-2xs hover:scale-105 active:scale-95'
                    : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>

          {/* Cards Carousel Container */}
          <div className="relative group/relatedCarousel">
            {/* Left Edge Floating Arrow */}
            {canScrollRelLeft && (
              <button
                type="button"
                onClick={() => scrollRelated('left')}
                className="absolute -left-3.5 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-800 transition-all opacity-0 group-hover/relatedCarousel:opacity-100 cursor-pointer active:scale-95 hidden sm:flex"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
            )}

            {/* Slider Track */}
            <div
              ref={relatedScrollRef}
              onScroll={checkRelatedScroll}
              className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedProducts.map((item) => {
                const itemImage =
                  (Array.isArray(item.images) && item.images.length > 0
                    ? (typeof item.images[0] === 'string' ? item.images[0] : (item.images[0]?.image_url || item.images[0]?.url))
                    : null) ||
                  item.image_url ||
                  item.image ||
                  item.img ||
                  '';
                const itemName = locale === 'ar' ? (item.name_ar || item.name_en || item.name || item.title) : (item.name_en || item.name_ar || item.name || item.title);
                const itemUnit = item.unit || item.tag_en || item.unit_type || (locale === 'ar' ? 'عبوة 1' : '1 Pack');
                const itemRating = item.rating !== undefined && item.rating !== null && item.rating !== '' ? Number(item.rating).toFixed(1) : (item.avg_rating ? Number(item.avg_rating).toFixed(1) : '4.8');
                const itemReviews = (item.reviews_count !== undefined && item.reviews_count !== null ? Number(item.reviews_count) : (item.reviews ? Number(item.reviews) : (item.review_count ? Number(item.review_count) : 120))).toLocaleString();

                const hasVariants = Boolean(item.has_variants && Array.isArray(item.variants) && item.variants.length > 0);
                let finalPrice = parseFloat(item.price || 0);
                let originalPrice = null;

                if (hasVariants) {
                  const activeVars = item.variants.filter((v) => v.is_active !== false);
                  const varsToUse = activeVars.length > 0 ? activeVars : item.variants;
                  const prices = varsToUse
                    .map((v) => parseFloat(v.discount_price || v.price))
                    .filter((p) => !isNaN(p) && p > 0);
                  if (prices.length > 0) {
                    finalPrice = Math.min(...prices);
                  }
                } else {
                  const currentPrice = parseFloat(item.price || 0);
                  const isDiscounted = item.discount_price && parseFloat(item.discount_price) < currentPrice;
                  finalPrice = isDiscounted ? parseFloat(item.discount_price) : currentPrice;
                  originalPrice = isDiscounted ? currentPrice : null;
                }

                const displayPrice = isNaN(finalPrice) || finalPrice <= 0 ? (item.price || item.discount_price || '') : finalPrice.toFixed(2);

                return (
                  <div
                    key={item.id}
                    className="w-[190px] sm:w-[215px] md:w-[230px] shrink-0 snap-start group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-lg transition-all duration-300 p-3.5 flex flex-col justify-between font-sans cursor-pointer min-h-[290px]"
                  >
                    <Link href={`/products/${item.id}`} className="space-y-2 block">
                      {/* Image */}
                      <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(itemImage) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                          alt={itemName}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#043927] transition-colors">
                          {itemName}
                        </h3>

                        {hasVariants ? (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                            <span>{item.variants.length} {locale === 'ar' ? 'خيارات' : 'Options'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            {item.unit || (item.unit_value && item.unit_type ? `${item.unit_value} ${item.unit_type}` : itemUnit)}
                          </span>
                        )}

                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-extrabold">
                          <span>★ {itemRating || '4.8'}</span>
                          <span className="text-slate-400 font-normal">({itemReviews})</span>
                        </div>

                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="font-extrabold text-slate-900 text-sm font-sans whitespace-nowrap">
                            <span className="text-[10px] text-slate-500 font-bold mr-0.5">SAR</span>
                            {displayPrice}
                          </span>
                          {!hasVariants && originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-normal whitespace-nowrap">
                              SAR {originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Add Button or Select Options */}
                    {hasVariants ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/products/${item.id}`);
                        }}
                        className="w-full mt-2 py-2 rounded-xl bg-[#006E2D] hover:bg-[#009663] text-white font-extrabold text-xs shadow-2xs transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>{locale === 'ar' ? 'اختر الخيارات' : 'Select Options'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddRelated(item);
                        }}
                        disabled={addingRelId === item.id}
                        className="w-full mt-2 py-2 rounded-xl bg-[#006E2D] hover:bg-[#009663] text-white font-extrabold text-xs shadow-2xs transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{addingRelId === item.id ? '...' : (locale === 'ar' ? 'أضف' : 'Add to Cart')}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Edge Floating Arrow */}
            {canScrollRelRight && (
              <button
                type="button"
                onClick={() => scrollRelated('right')}
                className="absolute -right-3.5 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-800 transition-all opacity-0 group-hover/relatedCarousel:opacity-100 cursor-pointer active:scale-95 hidden sm:flex"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
