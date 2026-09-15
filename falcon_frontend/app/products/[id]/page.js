'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useCart } from '../../../src/contexts/CartContext';
import { useWishlist } from '../../../src/contexts/WishlistContext';
import { fetchApi } from '../../../src/services/api';
import { ShoppingBag, Heart, ArrowLeft, ShieldCheck, Truck, Share2, RotateCcw, Zap, Check } from 'lucide-react';

const STATIC_PRODUCT_DETAILS = {
  'st-1': {
    id: 'st-1',
    category: 'Fresh Vegetables',
    category_ar: 'خضروات طازجة',
    name_en: 'Lady Finger (500 g)',
    name_ar: 'بامية طازجة (500 جرام)',
    net_qty: 'Net Qty: 500 g',
    net_qty_ar: 'الوزن الصافي: 500 جرام',
    price: '20.00',
    mrp: '25.00',
    discount: 'SAR 5.00 OFF',
    discount_ar: 'خصم 5.00 ر.س',
    sku: 'VEG-LAD-001',
    description_en: 'Farm fresh tender lady fingers harvested daily. High in fiber, vitamins, and antioxidants. Perfect for curries and sautéed dishes.',
    description_ar: 'بامية طازجة مقطوفة يومياً من المزرعة، غنية بالألياف والفيتامينات والمواد المغذية. مثالية للطهي والوجبات الصحيات.',
    images: [
      'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=800',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
      'https://images.unsplash.com/photo-1590165482129-1b8b27097a69?w=800',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
    ]
  },
  'st-2': {
    id: 'st-2',
    category: 'Fresh Vegetables',
    category_ar: 'خضروات طازجة',
    name_en: 'Fresh Potatoes (1 kg)',
    name_ar: 'بطاطس طازجة (1 كجم)',
    net_qty: 'Net Qty: 1 kg',
    net_qty_ar: 'الوزن الصافي: 1 كجم',
    price: '4.00',
    mrp: '6.00',
    discount: 'SAR 2.00 OFF',
    discount_ar: 'خصم 2.00 ر.س',
    sku: 'VEG-POT-002',
    description_en: 'Crisp golden potatoes ideal for cooking, roasting, baking, and fries. Harvested from local premium farms.',
    description_ar: 'بطاطس ذهبية طازجة مثالية للطبخ والقلي والمشاوي. مقطوفة من أفضل المزارع المحلية.',
    images: [
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
      'https://images.unsplash.com/photo-1590165482129-1b8b27097a69?w=800',
      'https://images.unsplash.com/photo-1508313880080-c4bef0730395?w=800',
      'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800'
    ]
  },
  'st-3': {
    id: 'st-3',
    category: 'Fresh Fruits',
    category_ar: 'فواكه طازجة',
    name_en: 'Watermelon Fresh (1 pc)',
    name_ar: 'بطيخ أحمر طازج (حبة)',
    net_qty: 'Net Qty: 1 pc',
    net_qty_ar: 'الوزن الصافي: 1 حبة',
    price: '4.00',
    mrp: '7.00',
    discount: 'SAR 3.00 OFF',
    discount_ar: 'خصم 3.00 ر.س',
    sku: 'FRU-WAT-003',
    description_en: 'Sweet juicy red watermelon packed with natural hydration and vitamins.',
    description_ar: 'بطيخ أحمر حلو ولذيذ غني بالانتعاش والماء والفيتامينات.',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800',
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800'
    ]
  },
  'st-4': {
    id: 'st-4',
    category: 'Fresh Fruits',
    category_ar: 'فواكه طازجة',
    name_en: 'Fresh Bananas (1 kg)',
    name_ar: 'موز طازج (1 كجم)',
    net_qty: 'Net Qty: 1 kg',
    net_qty_ar: 'الوزن الصافي: 1 كجم',
    price: '2.50',
    mrp: '4.00',
    discount: 'SAR 1.50 OFF',
    discount_ar: 'خصم 1.50 ر.س',
    sku: 'FRU-BAN-004',
    description_en: 'Ripe organic yellow bananas high in potassium, fiber, and natural energy.',
    description_ar: 'موز طازج عضوي غني بالبوتاسيوم والألياف والطاقة الطبيعية.',
    images: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800',
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800',
      'https://images.unsplash.com/photo-1585059819970-311904b48f61?w=800'
    ]
  },
  'st-5': {
    id: 'st-5',
    category: 'Exotic Picks',
    category_ar: 'اختيارات فاخرة',
    name_en: 'Organic Kiwi (500 g)',
    name_ar: 'كيوي عضوي (500 جرام)',
    net_qty: 'Net Qty: 500 g',
    net_qty_ar: 'الوزن الصافي: 500 جرام',
    price: '3.50',
    mrp: '5.00',
    discount: 'SAR 1.50 OFF',
    discount_ar: 'خصم 1.50 ر.س',
    sku: 'FRU-KIW-005',
    description_en: 'Organic tangy fresh kiwis loaded with Vitamin C and rich flavor.',
    description_ar: 'كيوي عضوي طازج غني بفيتامين سي والفوائد الصحية الممتازة.',
    images: [
      'https://images.unsplash.com/photo-1585059819970-311904b48f61?w=800',
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800',
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800'
    ]
  },
};

const RELATED_PRODUCTS = [
  {
    id: 'st-6',
    name_en: 'Fresh Red Apples (1 kg)',
    name_ar: 'تفاح أحمر طازج (1 كجم)',
    price: '12.00',
    mrp: '15.00',
    saleBadge: 'Sale!',
    img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
  },
  {
    id: 'st-4',
    name_en: 'Fresh Bananas (1 kg)',
    name_ar: 'موز طازج (1 كجم)',
    price: '2.50',
    mrp: '4.00',
    saleBadge: null,
    img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600',
  },
  {
    id: 'st-7',
    name_en: 'Sweet Corn (1 pc)',
    name_ar: 'ذرة حلوة طازجة (1 قطعة)',
    price: '3.00',
    mrp: '4.50',
    saleBadge: null,
    img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  },
  {
    id: 'st-8',
    name_en: 'Fresh Red Cherries (250 g)',
    name_ar: 'كرز أحمر طازج (250 جرام)',
    price: '18.00',
    mrp: '22.00',
    saleBadge: null,
    img: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { locale } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addingRelatedId, setAddingRelatedId] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        if (STATIC_PRODUCT_DETAILS[productId]) {
          const item = STATIC_PRODUCT_DETAILS[productId];
          setProduct(item);
          setSelectedImg(item.images?.[0] || item.img);
          setLoading(false);
          return;
        }

        const res = await fetchApi(`/products/${productId}`);
        if (res.success && res.data?.product) {
          const item = res.data.product;

          // Format images array safely
          let imgs = [];
          if (Array.isArray(item.images) && item.images.length > 0) {
            imgs = item.images.map(i => typeof i === 'string' ? i : (i?.image_url || i?.url)).filter(Boolean);
          }
          if (imgs.length === 0) {
            imgs = [item.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800'];
          }
          item.images = imgs;

          // Ensure price and mrp numbers are safe
          if (!item.price) item.price = '15.00';
          if (!item.mrp) item.mrp = (parseFloat(item.price) * 1.25).toFixed(2);
          if (!item.discount) item.discount = `SAR ${(parseFloat(item.mrp) - parseFloat(item.price)).toFixed(2)} OFF`;

          setProduct(item);
          setSelectedImg(imgs[0]);
        } else {
          // Fallback demo product
          const fallback = {
            id: productId,
            category: 'Fresh Produce',
            category_ar: 'منتجات طازجة',
            name_en: 'Organic Farm Fresh Item',
            name_ar: 'منتج مزرعة عضوي طازج',
            net_qty: 'Net Qty: 1 pc',
            net_qty_ar: 'الوزن الصافي: 1 قطعة',
            price: '15.00',
            mrp: '20.00',
            discount: 'SAR 5.00 OFF',
            discount_ar: 'خصم 5.00 ر.س',
            sku: `GRO-${productId}`,
            description_en: '100% Organically grown grocery produce delivered fresh within 30 minutes with temperature controlled cold chain logistics.',
            description_ar: 'منتجات بقالة طازجة عضوية 100% يتم توصيلها طازجة خلال 30 دقيقة.',
            images: [
              'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
              'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
              'https://images.unsplash.com/photo-1590165482129-1b8b27097a69?w=800',
              'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800'
            ],
          };
          setProduct(fallback);
          setSelectedImg(fallback.images[0]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        // Fallback demo product if backend item fetch fails
        const fallback = {
          id: productId,
          category: 'Fresh Vegetables',
          category_ar: 'خضروات طازجة',
          name_en: 'Lady Finger (500 g)',
          name_ar: 'بامية طازجة (500 جرام)',
          net_qty: 'Net Qty: 500 g',
          net_qty_ar: 'الوزن الصافي: 500 جرام',
          price: '20.00',
          mrp: '25.00',
          discount: 'SAR 5.00 OFF',
          discount_ar: 'خصم 5.00 ر.س',
          sku: `GRO-${productId}`,
          description_en: 'Farm fresh tender lady fingers harvested daily. High in fiber, vitamins, and antioxidants.',
          description_ar: 'بامية طازجة مقطوفة يومياً من المزرعة، غنية بالألياف والفيتامينات والمواد المغذية.',
          images: [
            'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=800',
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
            'https://images.unsplash.com/photo-1590165482129-1b8b27097a69?w=800'
          ],
        };
        setProduct(fallback);
        setSelectedImg(fallback.images[0]);
      } finally {
        setLoading(false);
      }
    };
    if (productId) loadProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.id, quantity, product);
    } catch (err) {
      // Toast notification is handled by CartContext
    } finally {
      setAdding(false);
    }
  };

  const handleAddRelatedToCart = async (e, relItem) => {
    e.stopPropagation();
    try {
      setAddingRelatedId(relItem.id);
      await addToCart(relItem.id, 1, relItem);
    } catch (err) {
      // Toast notification is handled by CartContext
    } finally {
      setAddingRelatedId(null);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name_en,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <Link href="/products" className="text-emerald-700 font-bold hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : [product.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14 font-sans bg-[#fbfcfb] pb-24">
      
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#05442e] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{locale === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products'}</span>
      </button>

      {/* Main Product Showcase (Left Thumbnails + Center Main Image + Right Details Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Gallery Section: Thumbnails Column (2 cols) + Main Image Container (5 cols) */}
        <div className="lg:col-span-7 grid grid-cols-12 gap-4">
          
          {/* Vertical Thumbnails List */}
          <div className="col-span-3 sm:col-span-2 flex flex-col gap-3 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {galleryImages.map((imgUrl, idx) => {
              const isSelected = selectedImg === imgUrl;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(imgUrl)}
                  className={`w-full aspect-square rounded-2xl p-1.5 border-2 transition-all cursor-pointer bg-white flex items-center justify-center overflow-hidden ${
                    isSelected ? 'border-[#05442e] ring-2 ring-emerald-100 shadow-sm scale-95' : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </button>
              );
            })}
          </div>

          {/* Large Main Image Display */}
          <div className="col-span-9 sm:col-span-10 w-full h-[360px] sm:h-[440px] rounded-3xl overflow-hidden bg-white border border-slate-200/80 p-6 relative flex items-center justify-center shadow-sm">
            <img
              src={selectedImg || galleryImages[0]}
              alt={locale === 'ar' ? product.name_ar : product.name_en}
              className="w-full h-full object-contain transition-all duration-300"
            />
            
            {/* Wishlist Heart Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white text-slate-800 shadow-md border border-slate-100 flex items-center justify-center hover:scale-110 transition-all cursor-pointer z-10"
              title={isInWishlist(product?.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`w-5 h-5 transition-colors ${isInWishlist(product?.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500 hover:text-rose-500'}`} />
            </button>
          </div>

        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          
          {/* Top Breadcrumb & Share */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span>
                {typeof product.category === 'object' && product.category !== null
                  ? (locale === 'ar' ? (product.category.name_ar || 'خضروات طازجة') : (product.category.name_en || 'Fresh Produce'))
                  : (locale === 'ar' ? (product.category_ar || 'اختيارات فاخرة') : (typeof product.category === 'string' ? product.category : 'Exotic Picks'))}
              </span>
              <span>&gt;</span>
            </div>

            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer relative"
              title="Share Product"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              {copied && (
                <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded shadow">
                  Copied!
                </span>
              )}
            </button>
          </div>

          {/* Product Title & Net Qty */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {locale === 'ar' ? product.name_ar : product.name_en}
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              {locale === 'ar' ? (product.net_qty_ar || 'الوزن الصافي: 1 حبة') : (product.net_qty || 'Net Qty: 1 pc')}
            </p>
          </div>

          {/* Price Box with Green Discount Badge */}
          <div className="flex items-center justify-between bg-[#f0fdf4] border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#16a34a]">
                SAR {parseFloat(product.price || 0).toFixed(2)}
              </span>
              {product.mrp && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  MRP SAR {parseFloat(product.mrp || 0).toFixed(2)}
                </span>
              )}
            </div>
            {product.discount && (
              <span className="px-3 py-1 bg-[#16a34a] text-white text-xs font-extrabold rounded-lg shadow-sm">
                {locale === 'ar' ? (product.discount_ar || product.discount) : product.discount}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
            {locale === 'ar' ? (product.description_ar || product.description_en) : product.description_en}
          </p>

          {/* Divider */}
          <div className="border-t border-slate-100 pt-2" />

          {/* Feature Badges (No return / Fast Delivery) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <RotateCcw className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight">
                {locale === 'ar' ? 'لا يوجد إرجاع أو استبدال' : 'No return or replacement'}
              </span>
            </div>

            <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600/20" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight">
                {locale === 'ar' ? 'توصيل سريع 30 دقيقة' : '30-Min Fast Express'}
              </span>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart Button */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-white text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
                >
                  -
                </button>
                <span className="w-10 text-center font-extrabold text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-white text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 py-4 px-6 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{adding ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart')}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Related Products Section */}
      <div className="pt-8 border-t border-slate-200/80 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {locale === 'ar' ? 'منتجات ذات صلة' : 'Related products'}
          </h2>
        </div>

        {/* Related Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {RELATED_PRODUCTS.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/products/${item.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
            >
              {/* Sale Pill Badge */}
              {item.saleBadge && (
                <div className="absolute top-4 left-4 bg-black text-white text-[11px] font-bold px-3 py-1 rounded-full z-10 shadow">
                  {item.saleBadge}
                </div>
              )}

              {/* Product Image Container */}
              <div className="w-full h-44 sm:h-52 rounded-xl bg-white flex items-center justify-center p-2 mb-3 overflow-hidden">
                <img
                  src={item.img}
                  alt={locale === 'ar' ? item.name_ar : item.name_en}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Related Product Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 line-clamp-1 transition-colors">
                  {locale === 'ar' ? item.name_ar : item.name_en}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      SAR {parseFloat(item.price).toFixed(2)}
                    </span>
                    {item.mrp && (
                      <span className="text-xs text-slate-400 line-through">
                        SAR {parseFloat(item.mrp).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddRelatedToCart(e, item)}
                    disabled={addingRelatedId === item.id}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-colors cursor-pointer"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

