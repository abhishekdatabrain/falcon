'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import { useWishlist } from '../../src/contexts/WishlistContext';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getImageUrl } from '../../src/services/api';
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
  Check,
  Star,
  Zap,
  Filter,
  Grid,
  List,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'DEALS' | 'ORGANIC'
  const [sortBy, setSortBy] = useState('RECENT');
  const [quantities, setQuantities] = useState({});
  const [selectAllInStock, setSelectAllInStock] = useState(false);

  // Showcase Items matching exact user screenshot design
  const defaultWishlistItems = [
    {
      id: 'w-1',
      name_en: 'Heirloom Tiger Striped Heirloom Tomatoes',
      brand: 'AL-KHARJ OASIS FARMS',
      description_en: 'Naturally vine-ripened, intensely sweet and juicy flavor profile.',
      rating: 4.9,
      reviews_count: 1200,
      price: 18.50,
      badge_top: '⏱️ Harvested 4h Ago',
      badge_bottom: '⚡ Express 35m',
      tags: ['500g Pack', '1kg Box'],
      image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
      in_stock: true,
      stock_qty: 24,
    },
    {
      id: 'w-2',
      name_en: 'Pure Whole Unpasteurized Camel Milk (1L)',
      brand: 'TABUK PASTURE HERDS',
      description_en: 'Rich in immunoglobulins and vitamins, directly chilled from Tabuk.',
      rating: 4.9,
      reviews_count: 1200,
      price: 26.00,
      badge_top: '🥛 Pasture Fed',
      badge_warning: 'Only 4 left in Riyadh hub',
      tags: ['Glass Bottle • 1 Liter'],
      image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600',
      in_stock: true,
      stock_qty: 4,
    },
    {
      id: 'w-3',
      name_en: 'Premium Rutab Sukkari Soft Dates (1kg Box)',
      brand: 'AL-QASSIM HERITAGE FARM',
      description_en: 'Melt-in-the-mouth caramel texture, unpasteurized and chilled.',
      rating: 5.0,
      reviews_count: 2410,
      price: 34.00,
      badge_top: '🌴 100% Qassim Harvest',
      tags: ['Grade A Royal', 'Cold Box Shipped'],
      image_url: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600',
      in_stock: true,
      stock_qty: 50,
    },
    {
      id: 'w-4',
      name_en: 'Living Hydroponic Butterhead Lettuce (250g)',
      brand: 'AL-KHARJ HYDRO FARMS',
      description_en: 'Zero pesticides, stays crisp for up to 10 days in water cup.',
      rating: 4.9,
      reviews_count: 640,
      price: 9.50,
      badge_top: '🌱 Living Roots Intact',
      tags: ['Pesticide Free'],
      image_url: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600',
      in_stock: true,
      stock_qty: 15,
    },
    {
      id: 'w-5',
      name_en: 'Extra Virgin Single Estate Olive Oil (500ml)',
      brand: 'AL-JOUF OLIVE GROVES',
      description_en: 'Acidity < 0.2%, intense grassy and peppery finish.',
      rating: 4.9,
      reviews_count: 1850,
      price: 42.00,
      badge_top: '🫒 First Cold Press',
      tags: ['UV Protected Bottle'],
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
      in_stock: true,
      stock_qty: 30,
    },
    {
      id: 'w-6',
      name_en: 'Artisanal Sheep & Goat Halloumi with Nigella (250g)',
      brand: 'AL-SHAM CREAMERY',
      description_en: 'Perfect high grilling point with fragrant black caraway seeds.',
      rating: 4.8,
      reviews_count: 340,
      price: 21.00,
      badge_top: '',
      tags: ['Handcrafted • Vacuum Sealed'],
      image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
      in_stock: true,
      stock_qty: 12,
    },
    {
      id: 'w-7',
      name_en: 'Wild Forest Mountain Berries (Out of Season)',
      brand: 'TAIF ORCHARDS',
      description_en: 'Seasonal crop currently out of harvest period.',
      rating: 4.7,
      reviews_count: 190,
      price: 7.50,
      badge_top: '',
      out_of_season: true,
      image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600',
      in_stock: false,
      stock_qty: 0,
    },
    {
      id: 'w-8',
      name_en: 'Raw Mountain Honeycomb (400g Block)',
      brand: 'AL-BAHA MOUNTAIN APIARIES',
      description_en: '100% pure raw honeycomb harvested from Sidr trees.',
      rating: 4.9,
      reviews_count: 880,
      price: 48.00,
      original_price: 60.00,
      badge_top: '🏷️ Price Drop: Save SAR 12.00',
      tags: ['Raw Sidr', 'Unfiltered'],
      image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600',
      in_stock: true,
      stock_qty: 18,
    }
  ];

  // Effective items (real wishlist items or showcase defaults)
  const displayItems = (wishlist && wishlist.length > 0)
    ? wishlist.map((item, idx) => ({
        id: item.id || `real-${idx}`,
        name_en: item.name_en || item.name || 'Farm Product',
        brand: item.brand || 'SAUDI LOCAL FARM',
        description_en: item.description_en || 'Fresh local produce harvested daily.',
        rating: 4.9,
        reviews_count: 500,
        price: parseFloat(item.price || 15.00),
        image_url: item.image_url || (Array.isArray(item.images) ? item.images[0] : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'),
        in_stock: item.stock_quantity > 0 || true,
        stock_qty: item.stock_quantity || 10,
        tags: [item.unit || 'Standard Pack']
      }))
    : defaultWishlistItems;

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
      await addToCart(item.id, qty);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  // Filter items based on active tab
  const filteredItems = displayItems.filter((item) => {
    if (activeFilter === 'IN_STOCK' && !item.in_stock) return false;
    if (activeFilter === 'DEALS' && !item.original_price && !item.badge_top?.includes('Price Drop')) return false;
    if (activeFilter === 'ORGANIC' && !item.tags?.some(t => t.toLowerCase().includes('organic') || t.toLowerCase().includes('pesticide'))) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-8">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ================= PAGE TITLE & SUBTITLE ================= */}
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-[#043927] tracking-tight">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Keep track of your favorite farm-fresh produce, regional pantry staples, and recurring weekly essentials with express delivery to Riyadh.
          </p>
        </div>

        {/* ================= TOP FILTER & CONTROL BAR ================= */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          
          {/* Left Checkbox & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer pr-3 border-r border-slate-200">
              <input
                type="checkbox"
                checked={selectAllInStock}
                onChange={(e) => setSelectAllInStock(e.target.checked)}
                className="rounded border-slate-300 text-[#043927] focus:ring-[#043927] cursor-pointer"
              />
              <span>Select All In-Stock ({filteredItems.filter(i => i.in_stock).length})</span>
            </label>

            {/* Tabs Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Items ({displayItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('IN_STOCK')}
                className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'IN_STOCK'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                In Stock Only ({displayItems.filter(i => i.in_stock).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('DEALS')}
                className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'DEALS'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                On Deals (4)
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('ORGANIC')}
                className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'ORGANIC'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🌱 Organic Certified (7)
              </button>
            </div>
          </div>

          {/* Right Sort & View Controls */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 self-end md:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[10px] tracking-wider">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#043927] cursor-pointer"
              >
                <option value="RECENT">Recently Added</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
                <option value="RATING">Highest Rated</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button type="button" className="p-1 rounded-lg bg-white shadow-2xs text-[#043927]" title="Grid View">
                <Grid className="w-4 h-4" />
              </button>
              <button type="button" className="p-1 rounded-lg text-slate-400 hover:text-slate-700" title="List View">
                <List className="w-4 h-4" />
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
                  <span>Dashboard Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>My Orders</span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  3 active
                </span>
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Track Live Order</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl text-white font-black bg-[#043927] shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                  <span>Wishlist</span>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-200">12</span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>Saved Addresses</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-400">3</span>
              </Link>

              <Link
                href="/profile#payment"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Payment Methods</span>
                </div>
                <div className="flex gap-1 text-[9px] font-extrabold">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">mada</span>
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">Visa</span>
                </div>
              </Link>

              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </div>
              </Link>

              <Link
                href="/notifications"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications</span>
                </div>
                <span className="bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  2
                </span>
              </Link>

              <Link
                href="/support"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>Customer Support (24/7)</span>
                </div>
              </Link>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>

            {/* Fast 30-Min Delivery Promo Card */}
            <div className="bg-[#043927] text-white rounded-3xl p-5 shadow-md border border-emerald-900 space-y-3 font-sans relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
                <Zap className="w-4 h-4 fill-amber-300" />
                <span>Fast 30-Min Delivery</span>
              </div>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Order your weekly dairy & produce basket again with a single tap.
              </p>
              <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-800 text-[11px] flex items-center justify-between">
                <div>
                  <span className="text-emerald-300 font-bold block text-[9px] uppercase">Routine Basket #3</span>
                  <span className="font-black text-white">SAR 142.50 • 5 Items</span>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#05A764] hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Quick Reorder
              </button>
            </div>

          </div>

          {/* ================= RIGHT WISHLIST PRODUCTS GRID (9 Cols) ================= */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {filteredItems.map((item) => {
                const qty = quantities[item.id] || 1;
                const isOutOfSeason = item.out_of_season;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all font-sans relative ${
                      isOutOfSeason ? 'opacity-70 bg-slate-50/80' : ''
                    }`}
                  >
                    
                    {/* Top Media Container */}
                    <div className="relative w-full aspect-square bg-[#F8F9FA] p-3 overflow-hidden flex items-center justify-center border-b border-slate-100">
                      
                      {/* Top Left Badge */}
                      {item.badge_top && (
                        <span className="absolute top-3 left-3 bg-[#043927] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs z-10">
                          {item.badge_top}
                        </span>
                      )}

                      {/* Bottom Left Badge / Stock Warning */}
                      {item.badge_bottom && (
                        <span className="absolute bottom-3 left-3 bg-[#043927] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs z-10">
                          {item.badge_bottom}
                        </span>
                      )}

                      {item.badge_warning && (
                        <span className="absolute bottom-3 left-3 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs z-10">
                          {item.badge_warning}
                        </span>
                      )}

                      {/* Out of Season Overlay */}
                      {isOutOfSeason && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-20">
                          <span className="bg-slate-900 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-md">
                            Out of Season
                          </span>
                        </div>
                      )}

                      {/* Top Right Remove Trash Button */}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs z-10 cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Image */}
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name_en}
                        className={`w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
                          isOutOfSeason ? 'grayscale' : ''
                        }`}
                      />
                    </div>

                    {/* Card Body Details */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {/* Vendor Brand */}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {item.brand}
                        </span>

                        {/* Product Title */}
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                          {item.name_en}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 font-medium leading-normal line-clamp-2">
                          {item.description_en}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500 pt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating}</span>
                          <span className="text-slate-400 font-medium">({item.reviews_count})</span>
                        </div>

                        {/* Tags / Options Pills */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price & Quantity & Move to Cart Button */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-slate-900">
                              SAR {item.price.toFixed(2)}
                            </span>
                            {item.original_price && (
                              <span className="text-xs text-slate-400 line-through font-semibold">
                                SAR {item.original_price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <span className={`text-[10px] font-extrabold ${item.in_stock ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {item.in_stock ? 'In Stock' : 'Unavailable'}
                          </span>
                        </div>

                        {/* Action Buttons Row */}
                        {!isOutOfSeason ? (
                          <div className="flex items-center gap-2">
                            {/* Quantity Stepper */}
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

                            {/* Move to Cart Button */}
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              disabled={addingId === item.id}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-[#05A764]" />
                              <span>{addingId === item.id ? 'Adding...' : 'Move to Cart'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"
                          >
                            Out of Season
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
