'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '../../src/contexts/WishlistContext';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { Heart, ShoppingBag, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);

  const handleAddToCart = async (product) => {
    try {
      setAddingId(product.id);
      await addToCart(product.id, 1);
    } catch (err) {
      alert(err.message || 'Please log in to add items to cart');
    } finally {
      setAddingId(null);
    }
  };

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm my-10 font-sans">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
          <Heart className="w-10 h-10 fill-rose-500/20 text-rose-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {locale === 'ar' ? 'قائمة الرغبات فارغة' : 'Your Wishlist is Empty'}
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {locale === 'ar' ? 'قم بحفظ المنتجات المفضلة لديك هنا للوصول إليها بسهولة لاحقاً.' : 'Save products you like to your wishlist and find them all in one place.'}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
        >
          <span>{locale === 'ar' ? 'استكشف المنتجات' : 'Explore Products'}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-[#fbfcfb] min-h-[75vh]">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{locale === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
              {wishlist.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {locale === 'ar' ? 'المنتجات التي قمت بحفظها' : 'Your saved favorite items'}
          </p>
        </div>

        <button
          onClick={clearWishlist}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'حذف الكل' : 'Clear Wishlist'}</span>
        </button>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
        {wishlist.map((item) => {
          const primaryImg = item.img || (item.images && item.images.length > 0 ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].image_url) : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400');
          const priceVal = parseFloat(item.price || 0).toFixed(2);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              {/* Remove Button */}
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 flex items-center justify-center transition-all z-10 cursor-pointer shadow-xs"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Product Image & Link */}
              <div
                onClick={() => router.push(`/products/${item.id}`)}
                className="cursor-pointer space-y-3"
              >
                <div className="w-full h-44 sm:h-48 rounded-2xl bg-[#fff9f9] border border-slate-100 p-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={primaryImg}
                    alt={locale === 'ar' ? item.name_ar : item.name_en}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {locale === 'ar' ? item.name_ar : item.name_en}
                  </h3>
                  <span className="text-base font-black text-[#05442e] block">
                    {priceVal} SAR
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-4 mt-2 border-t border-slate-100">
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={addingId === item.id}
                  className="w-full py-2.5 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{addingId === item.id ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart')}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
