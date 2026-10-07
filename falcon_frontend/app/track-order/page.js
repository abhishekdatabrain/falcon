'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Home,
  Building2,
  Plus,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Truck,
  PhoneCall,
  Lock,
  Clock,
  Navigation,
  Globe,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  Package,
  CreditCard,
  User,
  Bell,
  Headphones,
  LogOut,
  X,
  Sparkles,
  Star,
  Zap,
  ArrowRight,
  Share2,
  FileText,
  MessageSquare,
  Thermometer,
  QrCode,
  Download,
  Copy,
  ChevronDown,
  Heart,
  AlertCircle
} from 'lucide-react';

export default function TrackLiveOrderPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'driver', text: 'Peace be upon you! I am 5 minutes away on Prince Turki Rd.', time: '2:50 PM' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const orderDetails = {
    id: 'FM-98421',
    order_number: 'FM-98421',
    status: 'OUT_FOR_DELIVERY',
    placed_at: 'Today, 2:15 PM (Feb 24, 2026)',
    est_delivery: 'Today, 3:15 PM (~18 mins remaining)',
    payment_method: 'Apple Pay (MasterCard ****8812)',
    hub_name: 'Al Malqa Central Express Hub',
    distance_remaining: '2.8 km away',
    driver: {
      name: 'Tariq K.',
      role: 'Master Cold-Chain Courier',
      rating: 4.9,
      deliveries_count: 1420,
      vehicle: 'Toyota HiAce Chill Van #782',
      phone: '+966 50 123 4567',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      current_temp: '3.5°C (Chilled Optimal)',
      speed: '42 km/h',
    },
    location: {
      title: 'Villa 14',
      street: 'Prince Turki Ibn Abdulaziz Al Awwal Rd',
      district: 'Al Malqa District',
      city: 'Riyadh 13524',
      short_code: 'RKNA-4912',
      coordinates: '24.7932° N, 46.6135° E',
      gate_notes: 'Leave at front doorstep villa gate, ring smart intercom twice. Gate access code is registered in Falcon driver dispatch. Chilled insulated box delivery approved.',
    },
    timeline: [
      {
        step: 1,
        title: 'Order Received & Confirmed',
        time: 'Today, 2:15 PM',
        desc: 'Order #FM-98421 received and reserved at Al Malqa Hub.',
        completed: true,
      },
      {
        step: 2,
        title: 'Harvested & Packing Completed',
        time: 'Today, 2:32 PM',
        desc: 'Fresh produce harvested from Al-Kharj partner farm & packed into thermal bags.',
        completed: true,
      },
      {
        step: 3,
        title: 'Thermal-Insulated Quality Checked',
        time: 'Today, 2:45 PM',
        desc: 'Insulated box sealed with wireless temp sensor active at 3.5°C.',
        completed: true,
      },
      {
        step: 4,
        title: 'Courier Delivery – In Transit',
        time: 'Active Now (2:55 PM)',
        desc: 'Driver Tariq K. is en route via Prince Turki Rd. 2.8 km remaining.',
        completed: false,
        active: true,
      },
      {
        step: 5,
        title: 'Arrived & Handed Over',
        time: 'Est. 3:15 PM',
        desc: 'Doorstep drop & smart intercom signature confirmation.',
        completed: false,
      },
    ],
    items: [
      {
        id: 1,
        name: 'Al Safi Organic Pure Swiss Milk 1L',
        qty: 2,
        unit_price: 13.00,
        total: 26.00,
        badge: 'FRESH HARVEST',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200',
        farm: 'Al-Safi Dairy Farm, Al Kharj',
      },
      {
        id: 2,
        name: 'Hydroponic Heirloom Tiger Tomatoes 750g',
        qty: 1,
        unit_price: 18.50,
        total: 18.50,
        badge: 'ORGANIC FARM',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
        farm: 'Green Oasis Hydroponics',
      },
      {
        id: 3,
        name: 'Free-Range Omega-3 Eggs (12 Pack)',
        qty: 1,
        unit_price: 19.50,
        total: 19.50,
        badge: 'PARTNER FARM',
        image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=200',
        farm: 'Al-Watania Organic Poultry',
      },
      {
        id: 4,
        name: 'Honey Crisp Organic Apples 1kg',
        qty: 1,
        unit_price: 17.00,
        total: 17.00,
        badge: 'FARM FRESH',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200',
        farm: 'Asir Highland Orchards',
      },
      {
        id: 5,
        name: 'Rosemary Ground Sourdough Bread 650g',
        qty: 1,
        unit_price: 14.50,
        total: 14.50,
        badge: 'BAKED TODAY',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
        farm: 'Falcon Artisanal Bakery',
      },
      {
        id: 6,
        name: 'Fresh Scottish Salmon Fillet 500g',
        qty: 1,
        unit_price: 58.00,
        total: 58.00,
        badge: 'CHILLED',
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200',
        farm: 'Air-freight Daily Cold-Chain',
      },
      {
        id: 7,
        name: 'Fresh Medjool Organic Dates 1kg',
        qty: 1,
        unit_price: 41.50,
        total: 41.50,
        badge: 'PREMIUM',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200',
        farm: 'Al-Qassim Oasis Palms',
      }
    ],
    pricing: {
      subtotal: 194.50,
      delivery_fee: 0.00,
      vat_amount: 25.37,
      grand_total: 194.50,
      zatca_tax_id: '302484910200003',
      invoice_number: 'INV-2026-04821',
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setNewMessage('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'driver', text: 'Received! Thank you, will follow instructions.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-6">
      
      {/* Top Floating Dispatch Banner */}
      <div className="bg-[#043927] text-white py-2.5 px-4 text-xs font-bold shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-mono text-emerald-300 text-[11px] font-black uppercase">
              LIVE DISPATCH MONITORING:
            </span>
            <span className="text-emerald-100 font-semibold">
              Order #{orderDetails.order_number} is currently {orderDetails.distance_remaining} from Al Malqa, Riyadh
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-extrabold text-emerald-200">
            <span>Van Speed: {orderDetails.driver.speed}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temp: {orderDetails.driver.current_temp}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#043927] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-[#043927] transition-colors">
              My Account
            </Link>
            <span>/</span>
            <Link href="/orders" className="hover:text-[#043927] transition-colors">
              My Orders
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">Track Live Order #{orderDetails.order_number}</span>
          </div>

          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Express Cold-Chain Priority
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ================= HEADER SECTION WITH QUICK ACTIONS ================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
                Order #{orderDetails.order_number}
              </h1>
              <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <Truck className="w-3.5 h-3.5" />
                <span>Out for Delivery</span>
              </span>
              <span className="bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Freshest Guarantee ✓</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Date Placed: <strong className="text-slate-700">{orderDetails.placed_at}</strong></span>
              <span>•</span>
              <span>Est. Arrival: <strong className="text-emerald-700 font-bold">{orderDetails.est_delivery}</strong></span>
              <span>•</span>
              <span>Payment: <strong className="text-slate-700">{orderDetails.payment_method}</strong></span>
            </p>
          </div>

          {/* Action Buttons Top Right */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
            </button>

            <a
              href={`#zatca-invoice`}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>ZATCA Invoice</span>
            </a>

            <a
              href={`tel:${orderDetails.driver.phone}`}
              className="px-5 py-2.5 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-[#05A764]" />
              <span>Call Driver</span>
            </a>
          </div>
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ================= LEFT SIDEBAR (3 Cols) ================= */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 font-sans">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  alt="Noura Al-Mansoor"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-100 shadow-2xs"
                />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                    Noura Al-Mansoor
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    +966 55 987 6543
                  </p>
                  <span className="inline-block bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded-md mt-1">
                    FRESHMART GOLD 1,420 pts
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
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
                <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  3 active
                </span>
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-2xl text-white font-black bg-[#043927] shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#05A764]" />
                  <span>Track Live Order</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-slate-400" />
                  <span>Wishlist</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-400">12</span>
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
                <span className="text-[9px] font-black text-slate-500">MADA + VISA</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
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
                href="/contact"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>Customer Support</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600">24/7 Live</span>
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

            {/* Express Hub Cold-Chain Guarantee Banner */}
            <div className="bg-[#043927] text-white rounded-3xl p-5 shadow-md border border-emerald-900 space-y-3 font-sans relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 fill-emerald-300 text-emerald-300" />
                <span>EXPRESS FULFILLMENT</span>
              </div>
              <h4 className="text-base font-black text-white">North Riyadh 35-Min Guarantee</h4>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Priority cold-chain delivery direct from Al Malqa Central Fulfillment Hub to Villa 14 doorstep.
              </p>
              <div className="pt-1 flex items-center gap-1 text-[11px] font-extrabold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Temp-Controlled Van Active</span>
              </div>
            </div>

            {/* Need Delivery Support Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-slate-900 text-xs">Need Delivery Support?</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Our Al Malqa dispatch supervisor is active on WhatsApp to assist with gate access.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-extrabold">
                <a
                  href={`tel:${orderDetails.driver.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-center transition-colors flex items-center justify-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call Hub</span>
                </a>
                <a
                  href="https://wa.me/966501234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-center transition-colors flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* ================= RIGHT MAIN LIVE TRACKING PANEL (9 Cols) ================= */}
          <div className="lg:col-span-9 space-y-6">

            {/* ================= 1. INTERACTIVE LIVE MAP CONTAINER ================= */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden space-y-4 font-sans">
              
              {/* Map Canvas Visual Box */}
              <div className="relative w-full h-80 sm:h-96 bg-slate-900 overflow-hidden">
                {/* Map Graphics Overlay */}
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200"
                  alt="Riyadh Live Dispatch Map"
                  className="w-full h-full object-cover opacity-75 filter contrast-125"
                />

                {/* Animated Route Line Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-400" strokeWidth="4" strokeDasharray="8,6">
                  <path d="M 120 80 Q 280 180 540 260" fill="none" className="animate-pulse" />
                </svg>

                {/* Dispatch Hub Pin Top-Left */}
                <div className="absolute top-6 left-6 bg-[#043927] text-white px-3.5 py-2 rounded-2xl shadow-lg border border-emerald-500/30 flex items-center gap-2 text-xs font-bold">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-emerald-300 uppercase font-black">ORIGIN HUB</div>
                    <div>Al Malqa Express Center</div>
                  </div>
                </div>

                {/* Destination Pin Bottom-Right */}
                <div className="absolute bottom-6 right-6 bg-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-lg border border-white/20 flex items-center gap-2 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-black">DELIVERY LOCATION</div>
                    <div>Villa 14, Al Malqa</div>
                  </div>
                </div>

                {/* Moving Driver Marker (Center) */}
                <div className="absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="relative group cursor-pointer">
                    {/* Ripple animation */}
                    <div className="absolute -inset-3 bg-emerald-500/40 rounded-full animate-ping" />
                    
                    {/* Main Van Badge */}
                    <div className="bg-emerald-600 text-white p-3 rounded-full shadow-2xl border-2 border-white flex items-center justify-center transform hover:scale-110 transition-transform">
                      <Truck className="w-6 h-6" />
                    </div>

                    {/* Floating ETA Badge above driver icon */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-white text-slate-900 px-3 py-1.5 rounded-xl shadow-xl border border-slate-200 text-xs font-black flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ESTIMATED TIME: 18 Mins ({orderDetails.distance_remaining})</span>
                    </div>
                  </div>
                </div>

                {/* Map Control Buttons Top Right */}
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                  <span className="bg-white/90 backdrop-blur-xs text-slate-900 font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>GPS Telemetry Active</span>
                  </span>
                </div>
              </div>

              {/* Courier Profile Bar Below Map */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={orderDetails.driver.avatar}
                        alt={orderDetails.driver.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-white">
                        ✓ 4.9★
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-base">{orderDetails.driver.name}</h3>
                        <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                          {orderDetails.driver.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {orderDetails.driver.vehicle} • 1,420+ On-time Deliveries
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 mt-0.5">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cargo Bay Temperature: {orderDetails.driver.current_temp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Courier Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${orderDetails.driver.phone}`}
                      className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                      <span>Call Courier</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setChatOpen(!chatOpen)}
                      className="px-4 py-2.5 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-[#05A764]" />
                      <span>Message Courier</span>
                    </button>
                  </div>
                </div>

                {/* Driver Message Banner */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      💬
                    </div>
                    <div>
                      <span className="font-black text-[#043927] block">Tariq is on his way to your delivery address!</span>
                      <span className="text-emerald-800 font-medium block text-[11px]">
                        "Ring intercom twice upon arrival. Chilled thermal box delivery approved for Villa 14."
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-black text-[11px] shrink-0 cursor-pointer self-start sm:self-center"
                  >
                    Live Operations Chat
                  </button>
                </div>

                {/* Interactive Driver Chat Box Drawer */}
                {chatOpen && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-inner animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Direct Communication with Courier ({orderDetails.driver.name})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setChatOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl text-xs">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`px-3 py-2 rounded-2xl max-w-[80%] font-medium text-xs ${
                              msg.sender === 'user'
                                ? 'bg-[#043927] text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-400 px-1 mt-0.5">{msg.time}</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type message to driver (e.g. Leave near gate)..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#043927]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#043927] text-white font-extrabold text-xs hover:bg-[#02281b] cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>

            {/* ================= 2. DELIVERY PROGRESS TIMELINE (5 STEPS) ================= */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Delivery Progress</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Real-time status updates synced with cold-chain sensor & driver GPS
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>5-Step Live Tracking</span>
                </span>
              </div>

              {/* Progress Steps List */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {orderDetails.timeline.map((step) => (
                  <div key={step.step} className="relative flex items-start gap-4 group">
                    
                    {/* Icon Indicator Circle */}
                    <div
                      className={`absolute -left-[30px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs border-2 transition-all ${
                        step.completed
                          ? 'bg-[#043927] text-emerald-400 border-emerald-500'
                          : step.active
                          ? 'bg-emerald-500 text-white border-white animate-bounce'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {step.completed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : step.active ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <span className="text-[11px] font-bold">{step.step}</span>
                      )}
                    </div>

                    {/* Step Body Content */}
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4
                          className={`font-black text-sm ${
                            step.completed || step.active ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {step.title}
                          {step.active && (
                            <span className="ml-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              ACTIVE NOW
                            </span>
                          )}
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-500">{step.time}</span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {step.desc}
                      </p>

                      {step.active && (
                        <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-emerald-800">
                          <span className="bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            📍 Location: Al Malqa, Riyadh
                          </span>
                          <span className="bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            ⚡ Driver Speed: 42 km/h
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* ================= 3. DELIVERY ADDRESS & NOTES GRID ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch font-sans">
              
              {/* Left Card: Delivery Address */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Home className="w-4 h-4 text-emerald-600" />
                      <span>DELIVERY LOCATION (HOME)</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                      VERIFIED GPS
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm">{orderDetails.location.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {orderDetails.location.street}, {orderDetails.location.district}, {orderDetails.location.city}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold pt-1">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                      Short Code: {orderDetails.location.short_code}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                      GPS: {orderDetails.location.coordinates}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Standard 45-Min Express Zone</span>
                  <Link href="/addresses" className="font-bold text-[#043927] hover:underline">
                    Edit Address
                  </Link>
                </div>
              </div>

              {/* Right Card: Courier Drop-off Instructions */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>COURIER DROP-OFF INSTRUCTIONS</span>
                    </div>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                      GATE INSTRUCTIONS
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium italic leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    "{orderDetails.location.gate_notes}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Synced with Falcon Driver Tablet</span>
                  <button type="button" onClick={() => setChatOpen(true)} className="font-bold text-[#043927] hover:underline cursor-pointer">
                    Update Driver
                  </button>
                </div>
              </div>

            </div>

            {/* ================= 4. ITEMS IN THIS DELIVERY (7 ITEMS LIST) ================= */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Items in this Delivery ({orderDetails.items.length})</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Fresh cold-chain packed items with Saudi partner farm origin tags
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  TOTAL WEIGHT: ~5.8 KG
                </span>
              </div>

              {/* Items List Table */}
              <div className="space-y-3">
                {orderDetails.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{item.name}</h4>
                          <span className="bg-emerald-100 text-emerald-900 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">
                            {item.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          Origin: {item.farm} • Qty: <strong className="text-slate-900 font-bold">{item.qty}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 block">
                        SAR {item.total.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        SAR {item.unit_price.toFixed(2)} each
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown & ZATCA Invoice Box */}
              <div id="zatca-invoice" className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal (7 Items)</span>
                    <span className="font-bold text-slate-900">SAR {orderDetails.pricing.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Express Cold-Chain Priority Delivery</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      FREE (VIP Member)
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>VAT (15% included in total)</span>
                    <span>SAR {orderDetails.pricing.vat_amount.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-black text-slate-900 block text-base">Total Paid</span>
                      <span className="text-[11px] text-slate-500 font-medium">Payment via {orderDetails.payment_method}</span>
                    </div>
                    <span className="text-xl font-black text-[#043927]">
                      SAR {orderDetails.pricing.grand_total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* ZATCA QR Code Bar */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#043927] shrink-0">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block flex items-center gap-1">
                        <span>ZATCA E-Invoice Verified</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-medium block">
                        Tax ID: {orderDetails.pricing.zatca_tax_id} • Invoice #{orderDetails.pricing.invoice_number}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Downloading PDF Invoice #${orderDetails.pricing.invoice_number}...`)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download PDF Invoice</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
