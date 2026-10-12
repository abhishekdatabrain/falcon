'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useCart } from '../src/contexts/CartContext';
import { useWishlist } from '../src/contexts/WishlistContext';
import { useToast } from '../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../src/services/api';
import { ShoppingBag, Truck, ShieldCheck, FileCheck, ArrowRight, Star, Sparkles, CheckCircle2, Leaf, Tag, ChevronRight, ChevronLeft, Gift, Headphones, Shield, Smartphone, Heart, Flame, TrendingUp, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
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

const DEALS_PRODUCTS = [
  {
    id: 'deal-1',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_headphones.jpg',
  },
  {
    id: 'deal-2',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_lays.jpg',
  },
  {
    id: 'deal-3',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_ariel.jpg',
  },
  {
    id: 'deal-4',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_almarai_milk.jpg',
  },
  {
    id: 'deal-5',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_headphones.jpg',
  },
  {
    id: 'deal-6',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_lays.jpg',
  },
  {
    id: 'deal-7',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_headphones.jpg',
  },
  {
    id: 'deal-8',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_lays.jpg',
  },
  {
    id: 'deal-9',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_ariel.jpg',
  },
  {
    id: 'deal-10',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_almarai_milk.jpg',
  },
  {
    id: 'deal-11',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_headphones.jpg',
  },
  {
    id: 'deal-12',
    brand: 'Auria Audio',
    brand_ar: 'أوريا أوديو',
    title_en: 'Auria Apex Noise-Canceling Wireless',
    title_ar: 'سماعات أوريا أبيركس اللاسلكية العازلة للصوت',
    specs_en: '40h Battery  Lossless Audio  Multipoint',
    specs_ar: 'بطارية ٤٠ ساعة  صوت عالي الدقة  اتصال متعدد',
    rating: '4.9',
    reviews: '1,420',
    price: '12.50',
    mrp: 'SAR 24.9',
    savings_en: 'Save SAR 50 (14% off)',
    savings_ar: 'وفر ٥٠ درهم (١٤٪ خصم)',
    img: '/products/prod_lays.jpg',
  },
];

const PROMO_CARDS_BANNER = [
  {
    id: 'promo-card-1',
    bg: 'bg-[#F5BF38]',
    title_en: 'Everyday groceries, made easy!',
    title_ar: 'البقالة اليومية، بأسهل طريقة!',
    desc_en: 'Fresh staples, pantry essentials & more',
    desc_ar: 'مواد أساسية طازجة، مستلزمات المؤونة والمزيد',
    btn_en: 'Order Now',
    btn_ar: 'اطلب الآن',
    img: '/promo/promo_groceries.png',
    href: '/products?category=groceries',
  },
  {
    id: 'promo-card-2',
    bg: 'bg-[#38BDF8]',
    title_en: 'Everything your home needs!',
    title_ar: 'كل ما يحتاجه منزلك!',
    desc_en: 'Cleaning, home care & daily essentials',
    desc_ar: 'التنظيف، العناية بالمنزل والمستلزمات اليومية',
    btn_en: 'Order Now',
    btn_ar: 'اطلب الآن',
    img: '/promo/promo_cleaning.png',
    href: '/products?category=household',
  },
  {
    id: 'promo-card-3',
    bg: 'bg-[#A3E062]',
    title_en: 'Snack time starts here!',
    title_ar: 'وقت الوجبات الخفيفة يبدأ هنا!',
    desc_en: 'Tasty bites, chips, chocolates & more',
    desc_ar: 'وجبات خفيفة، شيبس، شوكولاتة والمزيد',
    btn_en: 'Order Now',
    btn_ar: 'اطلب الآن',
    img: '/promo/promo_snacks.jpg',
    href: '/products?category=snacks',
  },
];

const HOUSEHOLD_SUBCATEGORIES = [

];

const GROCERIES_SUBCATEGORIES = [

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
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [productSlideIndex, setProductSlideIndex] = useState(0);
  const [categorySlideIndex, setCategorySlideIndex] = useState(0);
  const [trendingSlideIndex, setTrendingSlideIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, prodRes, dealsRes, heroRes] = await Promise.all([
          fetchApi('/categories?type=parent'),
          fetchApi('/products?limit=50'),
          fetchApi('/products?is_best_deal=true'),
          fetchApi('/hero-banners').catch(() => ({ success: false })),
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

                const currentPrice = parseFloat(prod.price);
                const isDiscounted = prod.discount_price && parseFloat(prod.discount_price) < currentPrice;
                const finalPrice = isDiscounted ? parseFloat(prod.discount_price) : currentPrice;
                const originalPrice = isDiscounted ? currentPrice : (prod.purchase_price ? parseFloat(prod.purchase_price) : null);

                const specs =
                  prod.unit_value && prod.unit_type && prod.pack_size
                    ? `${prod.unit_value} ${prod.unit_type} (${prod.pack_size})`
                    : locale === 'ar'
                      ? prod.specs_ar
                      : prod.specs_en;
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
                            {prod.stock_quantity !== undefined && prod.stock_quantity <= 0
                              ? (locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                              : (locale === 'ar' ? 'متوفر' : 'In Stock')}
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
                          {originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-normal whitespace-nowrap">
                              SAR {originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter or Add to Cart Button */}
                        {(() => {
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
                              className="h-8 w-full rounded-xl bg-[#00B074] hover:bg-[#009663] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
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
            {PROMO_CARDS_BANNER.map((card) => (
              <div
                key={card.id}
                className={`${card.bg} rounded-[28px] relative overflow-hidden flex justify-between min-h-[200px] sm:min-h-[220px] shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group font-sans`}
              >
                {/* Left Text Content */}
                <div className="p-6 sm:p-7 max-w-[62%] flex flex-col justify-between z-10">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl leading-snug tracking-tight font-sans">
                      {locale === 'ar' ? card.title_ar : card.title_en}
                    </h3>
                    <p className="text-slate-800/80 font-medium text-xs sm:text-sm leading-relaxed">
                      {locale === 'ar' ? card.desc_ar : card.desc_en}
                    </p>
                  </div>

                  <div className="pt-4">
                    <Link
                      href={card.href}
                      className="bg-white text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all hover:scale-105 inline-block cursor-pointer"
                    >
                      {locale === 'ar' ? card.btn_ar : card.btn_en}
                    </Link>
                  </div>
                </div>

                {/* Right Image Container with Rounded Cutout */}
                <div className="w-[38%] bg-white rounded-tl-[48px] rounded-bl-none absolute right-0 top-0 bottom-0 flex items-center justify-center p-3 shadow-inner">
                  <img
                    src={card.img}
                    alt={locale === 'ar' ? card.title_ar : card.title_en}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Household Essentials & Groceries Sub-Category Grids */}
        <section className="bg-[#F4FBF7] rounded-[32px] p-6 sm:p-8 space-y-10 border border-emerald-100/60 shadow-2xs">

          {/* Sub-Section 1: Household Essentials */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {locale === 'ar' ? 'المستلزمات المنزلية' : 'Household Essentials'}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
              {HOUSEHOLD_SUBCATEGORIES.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/60 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-between cursor-pointer min-h-[190px]"
                >
                  <div className="w-full aspect-square max-w-[130px] flex items-center justify-center overflow-hidden my-auto p-1">
                    <img
                      src={item.img}
                      alt={locale === 'ar' ? item.title_ar : item.title_en}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                    />
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm text-center group-hover:text-[#043927] transition-colors leading-tight pt-2 font-sans">
                    {locale === 'ar' ? item.title_ar : item.title_en}
                  </h3>
                </Link>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href="/products?category=household"
                className="text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 group transition-colors"
              >
                <span>{locale === 'ar' ? 'عرض المزيد' : 'View more'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Sub-Section 2: Groceries */}
          <div className="space-y-5 pt-4 border-t border-emerald-100/70">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {locale === 'ar' ? 'البقالة' : 'Groceries'}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
              {GROCERIES_SUBCATEGORIES.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/60 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-between cursor-pointer min-h-[190px]"
                >
                  <div className="w-full aspect-square max-w-[130px] flex items-center justify-center overflow-hidden my-auto p-1">
                    <img
                      src={item.img}
                      alt={locale === 'ar' ? item.title_ar : item.title_en}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                    />
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm text-center group-hover:text-[#043927] transition-colors leading-tight pt-2 font-sans">
                    {locale === 'ar' ? item.title_ar : item.title_en}
                  </h3>
                </Link>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href="/products?category=groceries"
                className="text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 group transition-colors"
              >
                <span>{locale === 'ar' ? 'عرض المزيد' : 'View more'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </section>

        {/* 6. Household Essentials Featured Banner Section */}
        <section className="bg-[#FAF7F0] rounded-[32px] p-6 sm:p-10 lg:p-12 border border-amber-100/70 relative overflow-hidden font-sans">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column Content */}
            <div className="lg:col-span-6 space-y-6 text-left rtl:text-right z-10">

              {/* Category Tag */}
              <span className="text-[#043927] font-extrabold text-xs sm:text-sm uppercase tracking-[0.2em] block font-sans">
                {locale === 'ar' ? 'مستلزمات منزلية' : 'HOUSEHOLD ESSENTIALS'}
              </span>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-black tracking-tight leading-[1.15] font-serif">
                <span className="text-[#043927] block">{locale === 'ar' ? 'منزل أكثر نظافة،' : 'A Cleaner Home,'}</span>
                <span className="text-[#C68A27] block mt-1">{locale === 'ar' ? 'وحياة أكثر سعادة.' : 'A Happier You.'}</span>
              </h2>

              {/* Subheadline */}
              <p className="text-[#475569] font-medium text-sm sm:text-base lg:text-lg max-w-md leading-relaxed">
                {locale === 'ar'
                  ? 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.'
                  : 'Quality household essentials for a fresher, cleaner and more comfortable home.'}
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <Link
                  href="/products?category=household"
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer group"
                >
                  <span>{locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-amber-200/50 flex flex-wrap items-center gap-6 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#043927] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-extrabold text-slate-900 text-xs">{locale === 'ar' ? 'علامات موثوقة' : 'Trusted Brands'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l rtl:border-r border-slate-300/60 pl-4 rtl:pr-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#043927] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-extrabold text-slate-900 text-xs">{locale === 'ar' ? 'توصيل سريع وموثوق' : 'Fast & Reliable Delivery'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l rtl:border-r border-slate-300/60 pl-4 rtl:pr-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#043927] flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-extrabold text-slate-900 text-xs">{locale === 'ar' ? 'قيمة يومية' : 'Everyday Value'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column Product Image */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div className="relative w-full max-w-lg">
                <img
                  src="/banners/household_banner.jpg"
                  alt="Household Essentials cleaning products Comfort Dettol Pril Fine"
                  className="w-full h-auto object-contain rounded-2xl drop-shadow-xl transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>

          </div>
        </section>

        {/* 7. Popular Picks Product Grid Section */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-[32px] font-extrabold text-slate-900 tracking-tight font-sans">
              {locale === 'ar' ? 'الأكثر شعبية' : 'Popular Picks'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5">
            {DEALS_PRODUCTS.map((prod, idx) => (
              <div
                key={'pop-' + prod.id + idx}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-lg transition-all duration-300 p-3.5 flex flex-col justify-between relative font-sans cursor-pointer h-full"
              >
                {/* Top Badges */}
                <div className="flex items-center justify-between z-10 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#FFA500] text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                    <Star className="w-2.5 h-2.5 fill-current text-white" />
                    <span>BEST SELLER</span>
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
                    <Heart className={`w-4 h-4 ${isInWishlist(prod.id) ? 'text-rose-500 fill-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Product Image Container */}
                <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center my-1.5 relative">
                  <img
                    src={prod.img}
                    alt={locale === 'ar' ? prod.title_ar : prod.title_en}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info Content */}
                <div className="space-y-1 pt-0.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Brand & In Stock Tag */}
                    <div className="flex items-center justify-between text-[11px] font-medium leading-none mb-1">
                      <span className="text-slate-400 truncate">{locale === 'ar' ? prod.brand_ar : prod.brand}</span>
                      <span className="text-[#00B074] font-bold shrink-0">{locale === 'ar' ? 'متوفر' : 'In Stock'}</span>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug font-sans group-hover:text-[#043927] transition-colors mb-1">
                      {locale === 'ar' ? prod.title_ar : prod.title_en}
                    </h3>

                    {/* Specs / Tags */}
                    <p className="text-[10px] text-slate-400 font-normal truncate mb-1">
                      {locale === 'ar' ? prod.specs_ar : prod.specs_en}
                    </p>

                    {/* Rating & Delivery */}
                    <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-slate-400 font-normal text-[10px]">
                        <span className="text-slate-400">☆</span>
                        <span className="font-bold text-slate-700">{prod.rating}</span>
                        <span className="text-slate-400">({prod.reviews})</span>
                      </div>

                    </div>
                  </div>

                  {/* Price & Add to Cart / Quantity Action Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                    <div className="flex flex-col min-w-0 pr-1 rtl:pr-0 rtl:pl-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-[15px] font-black text-slate-900 font-sans whitespace-nowrap leading-tight">
                          <span className="text-[10px] font-bold text-slate-500 mr-0.5">SAR</span>
                          {prod.price}
                        </span>
                        {prod.mrp && (
                          <span className="text-[10px] text-slate-400 line-through font-normal whitespace-nowrap">
                            {prod.mrp}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#00B074] block leading-tight truncate mt-0.5">
                        {locale === 'ar' ? prod.savings_ar : prod.savings_en}
                      </span>
                    </div>

                    {/* Quantity Counter or Add to Cart Button */}
                    {(() => {
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
                            className="h-8 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center p-0.5 gap-1 shrink-0 shadow-2xs"
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
                                <Trash2 className="w-3 h-3 text-rose-500" />
                              ) : (
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              )}
                            </button>

                            <span className="w-5 text-center text-xs font-black text-slate-900 font-sans select-none">
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
                          className="h-8 px-2.5 sm:px-3 rounded-xl bg-[#00B074] hover:bg-[#009663] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-60"
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
              </div>
            ))}
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
