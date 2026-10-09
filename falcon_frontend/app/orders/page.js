'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi, getImageUrl } from '../../src/services/api';
import {
  Package,
  Clock,
  ArrowRight,
  Truck,
  ShoppingBag,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  PhoneCall,
  FileText,
  MapPin,
  Plus,
  Calendar,
  RotateCcw,
  Star,
  ShieldCheck,
  Headphones,
  Bell,
  CreditCard,
  Heart,
  Home,
  User,
  LogOut,
  Sliders,
  Check,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function OrdersPage() {
  const { t, locale } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DELIVERED' | 'SCHEDULED' | 'CANCELLED'
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'HARVEST' | 'ORGANIC'
  const [timeframe, setTimeframe] = useState('3_months');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profRes, ordRes] = await Promise.all([
          fetchApi('/customers/profile').catch(() => null),
          fetchApi('/orders/my-orders').catch(() => null),
        ]);

        if (profRes && profRes.success && profRes.data?.profile) {
          setProfile(profRes.data.profile);
        }
        if (ordRes && ordRes.success && Array.isArray(ordRes.data?.orders)) {
          setOrders(ordRes.data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to load customer data:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const isOrderActive = (status) =>
    ['OUT_FOR_DELIVERY', 'ARRIVED', 'PAYMENT_VERIFIED', 'PACKING', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED'].includes(status);

  // Filtering Logic
  const filteredOrders = orders.filter((ord) => {
    // Tab Filter
    if (activeTab === 'ACTIVE' && !isOrderActive(ord.order_status)) {
      return false;
    }
    if (activeTab === 'DELIVERED' && ord.order_status !== 'DELIVERED') {
      return false;
    }
    if (activeTab === 'SCHEDULED' && ord.order_status !== 'SCHEDULED' && ord.type !== 'SUBSCRIPTION') {
      return false;
    }
    if (activeTab === 'CANCELLED' && !['CANCELLED', 'PAYMENT_REJECTED'].includes(ord.order_status)) {
      return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = ord.order_number?.toLowerCase().includes(q) || ord.id?.toLowerCase().includes(q);
      const matchItems = ord.items?.some(i =>
        ((i.product?.name_en || i.product_name_en || i.name || '')).toLowerCase().includes(q)
      );
      if (!matchId && !matchItems) return false;
    }

    return true;
  });

  const activeCount = orders.filter(o => isOrderActive(o.order_status)).length;
  const deliveredCount = orders.filter(o => o.order_status === 'DELIVERED').length;
  const scheduledCount = orders.filter(o => o.order_status === 'SCHEDULED' || o.type === 'SUBSCRIPTION').length;
  const cancelledCount = orders.filter(o => ['CANCELLED', 'PAYMENT_REJECTED'].includes(o.order_status)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F4] flex items-center justify-center py-24 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#043927] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Loading your purchase history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F4] font-sans pb-24 text-slate-800">
      
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-[#043927] transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
          <Link href="/profile" className="hover:text-[#043927] transition-colors">
            My Account
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
          <span className="text-slate-900 font-extrabold">My Orders</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT SIDEBAR (CUSTOMER PROFILE & NAVIGATION) ================= */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 font-sans">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-[#043927] text-white font-black text-lg flex items-center justify-center border-2 border-emerald-100 shadow-2xs shrink-0">
                  {profile?.first_name ? profile.first_name[0].toUpperCase() : 'M'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                    {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Mohammed Al-Salem' : 'Mohammed Al-Salem'}
                  </h3>
                  <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5 uppercase tracking-wider">
                    ⭐ GOLD VIP MEMBER
                  </span>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {profile?.user?.mobile || profile?.mobile || '+966 50 123 4567'}
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">MartPoints</span>
                  <span className="font-black text-slate-900 text-sm block">1,420 pts</span>
                  <span className="text-[9px] font-extrabold text-emerald-700 block mt-0.5">(SAR 71.00 Value)</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Tier Savings</span>
                  <span className="font-black text-slate-900 text-sm block">SAR 384</span>
                  <span className="text-[9px] font-extrabold text-emerald-700 block mt-0.5">Active</span>
                </div>
              </div>

              {/* Delivery Zone Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200/70 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-[#043927] block text-[11px]">North Riyadh Express</span>
                  <span className="text-[10px] text-emerald-800 font-bold block">20-Min Delivery Guarantee</span>
                </div>
                <Truck className="w-5 h-5 text-[#05A764] shrink-0" />
              </div>
            </div>

            {/* Account Sidebar Navigation Links */}
            <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1">
              
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Dashboard Overview</span>
                </div>
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-[#043927] text-white shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#05A764]" />
                  <span>My Orders</span>
                </div>
                <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeCount} Active
                </span>
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Track Live Order</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-slate-400" />
                  <span>Wishlist</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-400">12</span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>Saved Addresses</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-400">3</span>
              </Link>

              <Link
                href="/profile#payment"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Payment Methods</span>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-slate-200">
                  MADA
                </span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </div>
              </Link>

              <Link
                href="/notifications"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
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
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>24/7 Concierge Support</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600">● Online</span>
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

          </div>

          {/* ================= RIGHT MAIN CONTENT (ORDERS & PURCHASE HISTORY) ================= */}
          <div className="lg:col-span-9 space-y-6">

            {/* Page Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  My Orders & Purchase History
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Review active deliveries, track cold-chain transit, reorder weekly baskets, or download ZATCA tax invoices.
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Download Statement / ZATCA</span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order #, item name, farm or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#043927] shadow-2xs"
                />
              </div>
              <button
                type="button"
                className="px-5 py-3 bg-[#043927] text-white rounded-2xl font-extrabold text-xs shadow-xs hover:bg-[#02281b] transition-colors cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>

            {/* Status Pills Tabs Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>All Orders</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs">{orders.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-4 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ACTIVE'
                    ? 'bg-[#043927] text-white border-[#043927] shadow-xs'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active & In-Transit</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs">{activeCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DELIVERED')}
                className={`px-4 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'DELIVERED'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Delivered</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-xs">{deliveredCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SCHEDULED')}
                className={`px-4 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'SCHEDULED'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Scheduled / Subscriptions</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-xs">{scheduledCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CANCELLED')}
                className={`px-4 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'CANCELLED'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Cancelled</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-xs">{cancelledCount}</span>
              </button>
            </div>

            {/* Quick Category Filter & Timeframe Selector Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold pt-1">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-400 uppercase text-[10px] tracking-wider shrink-0">Quick Filter:</span>
                <button
                  type="button"
                  onClick={() => setQuickFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    quickFilter === 'ALL'
                      ? 'bg-[#043927] text-white border-[#043927]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Groceries
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter('HARVEST')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    quickFilter === 'HARVEST'
                      ? 'bg-[#043927] text-white border-[#043927]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Farm Harvest Only
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter('ORGANIC')}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    quickFilter === 'ORGANIC'
                      ? 'bg-[#043927] text-white border-[#043927]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Organic Box
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500 shrink-0 self-end sm:self-auto">
                <span className="text-slate-400 uppercase text-[10px] tracking-wider">Timeframe:</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#043927] cursor-pointer shadow-2xs"
                >
                  <option value="3_months">Past 3 months</option>
                  <option value="6_months">Past 6 months</option>
                  <option value="2026">Year 2026</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* ================= ORDER CARDS LIST ================= */}
            <div className="space-y-6">

              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 shadow-xs space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center mx-auto border border-emerald-100">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">No Orders Found</h3>
                    <p className="text-xs text-slate-500 font-medium">Try changing your search query or status tab filter.</p>
                  </div>
                </div>
              ) : (
                filteredOrders.map((ord) => {

                  // ---------------- CARD TYPE 1: OUT FOR DELIVERY / IN-TRANSIT ----------------
                  if (ord.order_status === 'OUT_FOR_DELIVERY' || ord.order_status === 'ARRIVED') {
                    return (
                      <div key={ord.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 font-sans">
                        {/* Top Bar Header */}
                        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-black text-slate-900 text-sm">Order #{ord.order_number}</span>
                            <span className="bg-emerald-100 text-emerald-900 font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase border border-emerald-200">
                              {ord.type || 'Express'}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 font-semibold">Placed: {ord.placed_time || 'Today, 2:15 PM'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-semibold">{ord.payment_method || 'Paid via Apple Pay (Mada)'}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900 block">SAR {parseFloat(ord.grand_total || 0).toFixed(2)}</span>
                            <span className="text-[11px] font-bold text-slate-500 block">{ord.total_items || ord.items?.length || 7} fresh items</span>
                          </div>
                        </div>

                        {/* Live Transit Alert Banner */}
                        <div className="px-6 space-y-4">
                          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#043927] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                <Truck className="w-5 h-5 animate-pulse text-[#05A764]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-[#043927] text-sm">Out for Delivery</h4>
                                  <span className="text-xs font-extrabold text-emerald-800">
                                    • {ord.delivery_eta || 'Arriving in ~18 mins (2:35 PM)'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                  Driver {ord.driver_name || 'Tariq K.'} {ord.driver_status || 'approaching Villa 14, Al Malqa'}
                                </p>
                              </div>
                            </div>

                            <span className="bg-white border border-emerald-300 text-emerald-900 font-black text-[10px] px-3 py-1 rounded-full shadow-2xs whitespace-nowrap self-start sm:self-center">
                              🌡️ COLD-CHAIN {ord.temp_status || '3.8°C (Optimal)'}
                            </span>
                          </div>

                          {/* 5-Step Progress Bar */}
                          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                              <span className="uppercase tracking-wider">LIVE TRANSIT PROGRESS</span>
                              <span className="text-emerald-800 font-black">Step 4 of 5 Complete</span>
                            </div>

                            {/* Progress Line */}
                            <div className="relative flex items-center justify-between pt-3 pb-2 px-2">
                              {/* Background Bar */}
                              <div className="absolute left-6 right-6 top-5 h-1.5 bg-slate-200 rounded-full z-0" />
                              <div className="absolute left-6 right-1/4 top-5 h-1.5 bg-[#05A764] rounded-full z-0" />

                              {/* Step 1 */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-[#05A764] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">Confirmed</span>
                              </div>

                              {/* Step 2 */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-[#05A764] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">Packed</span>
                              </div>

                              {/* Step 3 */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-[#05A764] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">Chilled & Loaded</span>
                              </div>

                              {/* Step 4 */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-[#043927] text-white flex items-center justify-center text-xs font-black ring-4 ring-emerald-100 shadow-md">
                                  🚚
                                </div>
                                <span className="text-[10px] font-black text-[#043927] mt-1">On Route</span>
                              </div>

                              {/* Step 5 */}
                              <div className="relative z-10 flex flex-col items-center opacity-40">
                                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-black">
                                  5
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 mt-1">Delivered</span>
                              </div>
                            </div>
                          </div>

                          {/* Included Items List */}
                          {ord.items && ord.items.length > 0 && (
                            <div className="space-y-2 font-sans pt-1">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                Included in this delivery ({ord.items.length} items):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {ord.items.map((item, idx) => {
                                  const img = item.product?.images?.[0]?.image_url || item.product?.main_image || item.image || item.main_image;
                                  const name = item.product_name_en || item.product?.name_en || item.product_name_ar || item.name || 'Grocery Item';
                                  const qty = item.quantity || 1;
                                  const itemPrice = parseFloat(item.total_price || (item.unit_price ? item.unit_price * qty : 0));
                                  return (
                                    <div
                                      key={item.id || idx}
                                      className="bg-[#F8F9FA] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/70"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                                          {img ? (
                                            <img
                                              src={getImageUrl(img)}
                                              alt={name}
                                              className="w-full h-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextSibling) {
                                                  e.currentTarget.nextSibling.style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <div
                                            className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#05A764] rounded-lg"
                                            style={{ display: img ? 'none' : 'flex' }}
                                          >
                                            <ShoppingBag className="w-4 h-4 stroke-[2]" />
                                          </div>
                                        </div>

                                        <div className="min-w-0">
                                          <h5 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                                            {name}
                                          </h5>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="bg-[#05A764]/10 text-[#05A764] text-[10px] font-black px-2 py-0.5 rounded-full font-sans">
                                              Qty: {qty}
                                            </span>
                                            {itemPrice > 0 && (
                                              <span className="text-[11px] font-extrabold text-slate-700 font-sans">
                                                SAR {itemPrice.toFixed(2)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer">
                              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                              <span>Call / Chat Driver</span>
                            </button>
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer">
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>ZATCA Invoice</span>
                            </button>
                          </div>

                          <Link
                            href={`/orders/${ord.id}`}
                            className="px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <MapPin className="w-4 h-4 text-[#05A764]" />
                            <span>Track Live on Map</span>
                          </Link>
                        </div>
                      </div>
                    );
                  }

                  // ---------------- CARD TYPE 2: HARVEST PICKING & PACKING ----------------
                  if (ord.order_status === 'PACKING') {
                    return (
                      <div key={ord.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 font-sans">
                        {/* Top Bar Header */}
                        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-black text-slate-900 text-sm">Order #{ord.order_number}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 font-semibold">Placed: {ord.placed_time || 'Today, 11:30 AM'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-800 font-extrabold flex items-center gap-1">
                              ⏱️ Slot: {ord.delivery_slot || '6:00 PM - 7:30 PM Today'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900 block">SAR {parseFloat(ord.grand_total || 0).toFixed(2)}</span>
                            <span className="text-[11px] font-bold text-slate-500 block">{ord.total_items || 4} farm items</span>
                          </div>
                        </div>

                        {/* Amber Picking Alert */}
                        <div className="px-6 space-y-4">
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg">
                                🚜
                              </div>
                              <div>
                                <h4 className="font-black text-amber-950 text-sm">Harvest Picking & Packing</h4>
                                <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                                  Items being hand-picked from {ord.picking_farm || 'Al-Kharj partner farms'}. Cold-pack prep starting shortly.
                                </p>
                              </div>
                            </div>

                            <span className="bg-amber-950 text-amber-300 font-extrabold text-[10px] px-3 py-1 rounded-full border border-amber-800 shadow-2xs whitespace-nowrap self-start sm:self-center">
                              ⏱️ Add Items Open ({ord.time_left_to_add || '15 mins left'})
                            </span>
                          </div>

                          {/* Items List */}
                          {ord.items && ord.items.length > 0 && (
                            <div className="space-y-2 font-sans pt-1">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                Items Being Picked ({ord.items.length}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {ord.items.map((item, idx) => {
                                  const img = item.product?.images?.[0]?.image_url || item.product?.main_image || item.image || item.main_image;
                                  const name = item.product_name_en || item.product?.name_en || item.product_name_ar || item.name || 'Grocery Item';
                                  const qty = item.quantity || 1;
                                  const itemPrice = parseFloat(item.total_price || (item.unit_price ? item.unit_price * qty : 0));
                                  return (
                                    <div
                                      key={item.id || idx}
                                      className="bg-[#F8F9FA] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/70"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                                          {img ? (
                                            <img
                                              src={getImageUrl(img)}
                                              alt={name}
                                              className="w-full h-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextSibling) {
                                                  e.currentTarget.nextSibling.style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <div
                                            className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#05A764] rounded-lg"
                                            style={{ display: img ? 'none' : 'flex' }}
                                          >
                                            <ShoppingBag className="w-4 h-4 stroke-[2]" />
                                          </div>
                                        </div>

                                        <div className="min-w-0">
                                          <h5 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                                            {name}
                                          </h5>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="bg-[#05A764]/10 text-[#05A764] text-[10px] font-black px-2 py-0.5 rounded-full font-sans">
                                              Qty: {qty}
                                            </span>
                                            {itemPrice > 0 && (
                                              <span className="text-[11px] font-extrabold text-slate-700 font-sans">
                                                SAR {itemPrice.toFixed(2)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <button type="button" className="px-4 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                            <Plus className="w-4 h-4 text-[#05A764]" />
                            <span>Add Items to Basket (+SAR 0 Delivery Fee)</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                              Edit Delivery Slot
                            </button>
                            <Link href={`/orders/${ord.id}`} className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                              Order Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ---------------- CARD TYPE 3: RECURRING SUBSCRIPTION ORDER ----------------
                  if (ord.order_status === 'SCHEDULED' || ord.type === 'SUBSCRIPTION') {
                    return (
                      <div key={ord.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 font-sans">
                        {/* Top Bar */}
                        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-black text-slate-900 text-sm">Order #{ord.order_number}</span>
                            <span className="bg-blue-100 text-blue-900 font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase border border-blue-200">
                              Subscription
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-700 font-bold flex items-center gap-1">
                              🔄 Auto-Scheduled for {ord.scheduled_for || 'Tomorrow, 8:00 AM'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-semibold">Drop to: {ord.drop_address || 'Villa 14, Al Malqa'}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900 block">SAR {parseFloat(ord.grand_total || 0).toFixed(2)}</span>
                            <span className="text-[11px] font-bold text-slate-500 block">{ord.total_items || 5} recurring staples</span>
                          </div>
                        </div>

                        {/* Subscription Info Box */}
                        <div className="px-6 space-y-3">
                          <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg">
                                🥦
                              </div>
                              <div>
                                <h4 className="font-black text-blue-950 text-sm">{ord.subscription_name || 'Weekly Organic Produce & Dairy Box'}</h4>
                                <p className="text-xs text-blue-900/80 font-medium mt-0.5">
                                  {ord.discount_info || 'Next billing: Midnight tonight • Automatic 10% subscriber discount applied'}
                                </p>
                              </div>
                            </div>

                            <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-3 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap self-start sm:self-center">
                              ACTIVE SUBSCRIPTION
                            </span>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                              Modify Weekly Basket
                            </button>
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                              Skip This Week
                            </button>
                          </div>

                          <button type="button" className="px-4 py-2 rounded-xl bg-blue-50 text-blue-900 font-black hover:bg-blue-100 transition-colors cursor-pointer">
                            View Recurring Plan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // ---------------- CARD TYPE 4 & 5: DELIVERED SUCCESSFUL ORDER ----------------
                  return (
                    <div key={ord.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 font-sans">
                      {/* Top Bar */}
                      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-black text-slate-900 text-sm">Order #{ord.order_number}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-semibold">Delivered: {ord.delivered_time || 'Yesterday, 6:40 PM'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered Successfully
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 block">SAR {parseFloat(ord.grand_total || 0).toFixed(2)}</span>
                          <span className="text-[11px] font-bold text-slate-500 block">{ord.total_items || ord.items?.length || 11} items</span>
                        </div>
                      </div>

                      <div className="px-6 space-y-3">
                        {/* Delivery Handover Proof Banner */}
                        {ord.delivery_proof && (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-600 font-medium flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{ord.delivery_proof}</span>
                          </div>
                        )}

                        {/* Bundle Summary Banner if no individual items list */}
                        {ord.bundle_name && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="font-black text-slate-900 text-sm">{ord.bundle_name}</h4>
                              <p className="text-xs text-slate-500 font-semibold">{ord.bundle_summary}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer">
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" /> Buy Again
                              </button>
                              <Link href={`/orders/${ord.id}`} className="px-3.5 py-2 rounded-xl bg-slate-200/80 text-slate-800 font-extrabold text-xs hover:bg-slate-300 cursor-pointer">
                                View Details
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Product Items List */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="space-y-2 font-sans pt-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Items Delivered ({ord.items.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {ord.items.map((item, idx) => {
                                const img = item.product?.images?.[0]?.image_url || item.product?.main_image || item.image || item.main_image;
                                const name = item.product_name_en || item.product?.name_en || item.product_name_ar || item.name || 'Grocery Item';
                                const qty = item.quantity || 1;
                                const itemPrice = parseFloat(item.total_price || (item.unit_price ? item.unit_price * qty : 0));
                                return (
                                  <div
                                    key={item.id || idx}
                                    className="bg-[#F8F9FA] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/70"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                                        {img ? (
                                          <img
                                            src={getImageUrl(img)}
                                            alt={name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.style.display = 'none';
                                              if (e.currentTarget.nextSibling) {
                                                e.currentTarget.nextSibling.style.display = 'flex';
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#05A764] rounded-lg"
                                          style={{ display: img ? 'none' : 'flex' }}
                                        >
                                          <ShoppingBag className="w-4 h-4 stroke-[2]" />
                                        </div>
                                      </div>

                                      <div className="min-w-0">
                                        <h5 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                                          {name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="bg-[#05A764]/10 text-[#05A764] text-[10px] font-black px-2 py-0.5 rounded-full font-sans">
                                            Qty: {qty}
                                          </span>
                                          {itemPrice > 0 && (
                                            <span className="text-[11px] font-extrabold text-slate-700 font-sans">
                                              SAR {itemPrice.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      {!ord.bundle_name && (
                        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <button type="button" className="px-4 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                              <RotateCcw className="w-4 h-4 text-[#05A764]" />
                              <span>Buy Again / Reorder Basket</span>
                            </button>
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-amber-700 font-bold hover:bg-amber-50 transition-colors flex items-center gap-1 cursor-pointer">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              <span>Rate Delivery ⭐⭐⭐⭐⭐</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500 font-semibold">
                            <button type="button" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer">
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>ZATCA Tax Invoice (PDF)</span>
                            </button>
                            <Link href={`/orders/${ord.id}`} className="hover:text-slate-900 transition-colors flex items-center gap-1">
                              <span>Need Help?</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

            </div>

            {/* ================= 100% FRESHNESS & COLD-CHAIN GUARANTEE FOOTER BANNER ================= */}
            <div className="bg-[#043927] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden font-sans">
              <div className="space-y-2 relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase tracking-wider">
                  <ShieldCheck className="w-5 h-5 text-[#05A764]" />
                  <span>100% Freshness & Cold-Chain Guarantee</span>
                </div>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  If any farm produce, dairy, or chilled cut arrives below your exacting standard, claim an instant replacement or full MartPoints credit in under 2 minutes. No paperwork required.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-white text-[#043927] hover:bg-emerald-50 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Report Quality Issue
                </button>
                <Link
                  href="/support"
                  className="px-5 py-3 rounded-2xl bg-[#05A764] hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Contact 24/7 Support</span>
                </Link>
              </div>

              {/* Decorative Subtle Background Glow */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
