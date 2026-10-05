'use client';
import React, { useRef, useState } from 'react';
import {
  Star,
  Heart,
  ShoppingCart,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Truck,
  Sparkles
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

const RECOMMENDED_ITEMS = [
  {
    id: 'rec-1',
    title: 'Oasis Eco-Friendly Drinking Water 12 x 1.5L',
    badge: 'Best Seller',
    rating: 4.7,
    reviewCount: '903',
    price: 9,
    originalPrice: 13.79,
    discountPercent: '34%',
    unitPrice: '18L | AED 0.50/L',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?w=500&auto=format&fit=crop&q=80',
    hasCartIcon: true,
    bottomTag: {
      type: 'red',
      icon: 'down',
      text: 'Lowest price in 7 days'
    }
  },
  {
    id: 'rec-2',
    title: 'Masafi Pure Low Sodium Natural Water 1.5Liters Pack of 12',
    badge: 'Best Seller',
    rating: 4.7,
    reviewCount: '682',
    price: 9,
    originalPrice: 16.80,
    discountPercent: '46%',
    unitPrice: '18L | AED 0.50/L',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&auto=format&fit=crop&q=80',
    hasCartIcon: false,
    bottomTag: {
      type: 'purple',
      icon: 'star',
      text: '#1 in Packaged Water'
    }
  },
  {
    id: 'rec-3',
    title: 'Mai Dubai Bottled Drinking Water 1.5Liters Pack of 12',
    badge: 'Best Seller',
    rating: 4.7,
    reviewCount: '2.4K',
    price: 10,
    originalPrice: 20,
    discountPercent: '50%',
    unitPrice: '18L | AED 0.56/L',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80',
    hasDots: true,
    activeDotIndex: 0,
    hasCartIcon: false,
    bottomTag: {
      type: 'blue',
      icon: 'truck',
      text: 'Free Delivery'
    }
  },
  {
    id: 'rec-4',
    title: 'Masafi Pure Low Sodium Natural Water 500ml Pack of 24',
    badge: 'Best Seller',
    rating: 4.7,
    reviewCount: '432',
    price: 9,
    originalPrice: 22,
    discountPercent: '59%',
    unitPrice: '12L | AED 0.75/L',
    image: 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=500&auto=format&fit=crop&q=80',
    hasCartIcon: false,
    bottomTag: {
      type: 'purple',
      icon: 'star',
      text: '#4 in Packaged Water'
    }
  },
  {
    id: 'rec-5',
    title: 'Mai Dubai Drinking water 500ml Pack of 24',
    badge: 'Best Seller',
    rating: 4.7,
    reviewCount: '2.4K',
    price: 10,
    originalPrice: 18,
    discountPercent: '44%',
    unitPrice: '12L | AED 0.83/L',
    image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=500&auto=format&fit=crop&q=80',
    hasCartIcon: false,
    bottomTag: {
      type: 'blue',
      icon: 'truck',
      text: 'Free Delivery'
    }
  }
];

export default function RecommendedProducts() {
  const { addToCart } = useCart();
  const { locale } = useLanguage();
  const scrollContainerRef = useRef(null);

  const [wishlist, setWishlist] = useState({});
  const [addedItems, setAddedItems] = useState({ 'rec-1': true }); // default rec-1 added as shown in screenshot

  const toggleWishlist = (id) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = async (item) => {
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    try {
      if (addToCart) {
        await addToCart(item.id, 1, {
          name_en: item.title,
          name_ar: item.title,
          price: item.price,
          image: item.image,
        });
      }
    } catch (e) {
      // Handled in context
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mt-10 mb-8 select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
          {locale === 'ar' ? 'موصى به لك' : 'Recommended for you'}
        </h2>

        {/* Scroll Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="relative group">
        {/* Left Arrow Overlay on Container */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer hidden sm:flex"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        {/* Right Arrow Overlay on Container */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer hidden sm:flex"
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {RECOMMENDED_ITEMS.map((item) => {
            const isWishlisted = !!wishlist[item.id];
            const isAdded = !!addedItems[item.id];

            return (
              <div
                key={item.id}
                className="w-[215px] sm:w-[230px] shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between relative group/card"
              >
                {/* Top Section: Badge & Heart */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {/* Badge */}
                    <span className="bg-[#043927] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wide font-sans shadow-2xs">
                      {item.badge}
                    </span>

                    {/* Wishlist Heart */}
                    <button
                      onClick={() => toggleWishlist(item.id)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                      title="Add to Wishlist"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          isWishlisted
                            ? 'text-rose-500 fill-rose-500'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Product Image Box & Floating Action Button */}
                  <div className="relative w-full h-44 bg-[#FAFAFA] rounded-xl flex items-center justify-center p-2 mb-3 border border-slate-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover/card:scale-105"
                    />

                    {/* Pagination Dots (if multi-image card like item 3) */}
                    {item.hasDots && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                    )}

                    {/* Action Button: Blue Cart button when added, or White '+' button */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`absolute bottom-2 right-2 transition-all duration-200 cursor-pointer ${
                        isAdded
                          ? 'w-10 h-10 rounded-xl bg-[#0070F3] hover:bg-[#005ECB] text-white shadow-md flex items-center justify-center scale-100'
                          : 'w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs flex items-center justify-center active:scale-95'
                      }`}
                      title={isAdded ? 'In Cart' : 'Add to Cart'}
                    >
                      {isAdded ? (
                        <ShoppingCart className="w-5 h-5 fill-current" />
                      ) : (
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 h-10 mb-2 font-sans hover:text-[#043927] transition-colors cursor-pointer">
                    {item.title}
                  </h3>

                  {/* Rating Row */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center text-emerald-700">
                      <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 mr-0.5" />
                      <span className="font-extrabold text-xs text-slate-900">
                        {item.rating}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      ({item.reviewCount})
                    </span>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-sans tracking-tight">
                      AED {item.price}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-semibold">
                      {item.originalPrice}
                    </span>
                    <span className="text-xs font-black text-emerald-600 font-sans">
                      {item.discountPercent}
                    </span>
                  </div>

                  {/* Volume / Unit Price Pill */}
                  <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-md px-2 py-0.5 border border-slate-150 inline-block mb-3">
                    {item.unitPrice}
                  </div>
                </div>

                {/* Bottom Tag highlight */}
                {item.bottomTag && (
                  <div className="pt-2 border-t border-slate-100 mt-auto">
                    {item.bottomTag.type === 'red' && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                        <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <TrendingDown className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="truncate">{item.bottomTag.text}</span>
                      </div>
                    )}

                    {item.bottomTag.type === 'purple' && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold">
                        <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600 shrink-0" />
                        <span className="truncate">{item.bottomTag.text}</span>
                      </div>
                    )}

                    {item.bottomTag.type === 'blue' && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.bottomTag.text}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
