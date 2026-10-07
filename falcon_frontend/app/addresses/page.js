'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Home,
  Building2,
  Plus,
  Edit3,
  Trash2,
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
  ArrowRight
} from 'lucide-react';

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      title: 'Home',
      type: 'DEFAULT',
      recipient_name: 'Noura Al-Mansoor',
      phone: '+966 55 987 6543',
      address_text: 'Villa 14, Prince Turki Ibn Abdulaziz Al Awwal Rd, Al Malqa District, Riyadh 13524, Kingdom of Saudi Arabia',
      short_code: 'RKNA-4912',
      coordinates: '24.7932° N, 46.6135° E',
      cold_box_ok: true,
      courier_notes: 'Leave at front doorstep villa gate, ring smart intercom twice. Gate access code is registered in Falcon driver dispatch. Chilled insulated box delivery approved.',
      delivery_time_avg: '35 Min Avg. Delivery Time',
      last_drop: 'Yesterday, 6:40 PM (Order #FM-04821)',
      is_default: true,
      map_image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600',
    },
    {
      id: 'addr-2',
      title: 'Office / Olaya HQ',
      type: 'WORKPLACE',
      recipient_name: 'Noura Al-Mansoor',
      phone: '+966 55 987 6543',
      address_text: 'Level 18, Olaya Towers (Tower B), King Fahd Road, Al Olaya District, Riyadh 12213, Kingdom of Saudi Arabia',
      short_code: 'OLYA-8831',
      elevator_pass: true,
      courier_notes: 'Reception desk drop-off during working hours (8:00 AM - 6:00 PM). Please hand to Receptionist or floor courier locker. Do not ring bell after 6 PM.',
      delivery_time_avg: '40 Min Dispatch',
      last_drop: '4 days ago (Beverages & Fruits)',
      is_default: false,
      map_image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600',
    }
  ]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [form, setForm] = useState({
    title: 'Home',
    recipient_name: 'Noura Al-Mansoor',
    phone: '+966 55 987 6543',
    district: 'Al Malqa',
    city: 'Riyadh',
    address_text: '',
    short_code: '',
    courier_notes: '',
    is_default: false,
  });

  // Toggles for Global Preferences
  const [prefContactless, setPrefContactless] = useState(true);
  const [prefWhatsappAlerts, setPrefWhatsappAlerts] = useState(true);

  const openAddModal = () => {
    setEditingAddr(null);
    setForm({
      title: 'Home',
      recipient_name: 'Noura Al-Mansoor',
      phone: '+966 55 987 6543',
      district: 'Al Malqa',
      city: 'Riyadh',
      address_text: '',
      short_code: '',
      courier_notes: '',
      is_default: addresses.length === 0,
    });
    setShowModal(true);
  };

  const openEditModal = (addr) => {
    setEditingAddr(addr);
    setForm({
      title: addr.title || 'Home',
      recipient_name: addr.recipient_name || '',
      phone: addr.phone || '',
      district: 'Al Malqa',
      city: 'Riyadh',
      address_text: addr.address_text || '',
      short_code: addr.short_code || '',
      courier_notes: addr.courier_notes || '',
      is_default: addr.is_default || false,
    });
    setShowModal(true);
  };

  const handleSetDefault = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        is_default: a.id === id,
        type: a.id === id ? 'DEFAULT' : a.type === 'DEFAULT' ? 'SECONDARY' : a.type,
      }))
    );
  };

  const handleRemove = (id) => {
    if (confirm('Are you sure you want to remove this delivery address?')) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (editingAddr) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddr.id
            ? {
                ...a,
                title: form.title,
                recipient_name: form.recipient_name,
                phone: form.phone,
                address_text: form.address_text || a.address_text,
                short_code: form.short_code || a.short_code,
                courier_notes: form.courier_notes || a.courier_notes,
                is_default: form.is_default,
              }
            : form.is_default
            ? { ...a, is_default: false, type: a.type === 'DEFAULT' ? 'SECONDARY' : a.type }
            : a
        )
      );
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        title: form.title,
        type: form.is_default ? 'DEFAULT' : 'SECONDARY',
        recipient_name: form.recipient_name,
        phone: form.phone,
        address_text: form.address_text || `${form.title}, ${form.district} District, ${form.city}, Saudi Arabia`,
        short_code: form.short_code || 'RKNA-5510',
        coordinates: '24.7891° N, 46.6210° E',
        cold_box_ok: true,
        courier_notes: form.courier_notes || 'Standard doorstep delivery requested.',
        delivery_time_avg: '35-45 Min Express',
        last_drop: 'Just added',
        is_default: form.is_default,
        map_image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600',
      };

      if (form.is_default) {
        setAddresses((prev) => prev.map((a) => ({ ...a, is_default: false, type: a.type === 'DEFAULT' ? 'SECONDARY' : a.type })));
      }
      setAddresses((prev) => [...prev, newAddr]);
    }
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-8">
      
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#043927] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-[#043927] transition-colors">
              My Account
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">Saved Addresses</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">Active Dispatch Center:</span>
            <span className="text-[#043927] font-black">Riyadh North Express Hub</span>
            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-mono text-[10px] font-black">
              35 - 45 MIN
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= PAGE HEADER & TOP METRICS ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
              Saved Addresses & Delivery Locations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage your delivery destinations, pin precision GPS drop-offs, and custom courier instructions for 45-minute Riyadh grocery deliveries.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start lg:self-center"
          >
            <Plus className="w-4 h-4 text-[#05A764]" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* Stats Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold mb-6">
          <span className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-700 shadow-2xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{addresses.length} Saved Locations</span>
          </span>

          {addresses.find(a => a.is_default) && (
            <span className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-700 shadow-2xs flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Primary: {addresses.find(a => a.is_default).title} ({addresses.find(a => a.is_default).address_text.split(',')[0]})</span>
            </span>
          )}

          <span className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-emerald-900 shadow-2xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>SPL National Address Sync: Verified</span>
          </span>
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ================= LEFT ACCOUNT SIDEBAR (3 Cols) ================= */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Customer Profile Card */}
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
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  3 active
                </span>
              </Link>

              <Link
                href="/orders?tab=active"
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
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Wishlist</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-400">12</span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl text-white font-black bg-[#043927] shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-[#05A764]" />
                  <span>Saved Addresses</span>
                </div>
                <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  {addresses.length} <Check className="w-3 h-3" />
                </span>
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
                href="/support"
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

            {/* Fast-Track Delivery Card */}
            <div className="bg-[#043927] text-white rounded-3xl p-5 shadow-md border border-emerald-900 space-y-3 font-sans relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 fill-emerald-300 text-emerald-300" />
                <span>FAST-TRACK DELIVERY</span>
              </div>
              <h4 className="text-base font-black text-white">Falcon Instant™</h4>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Order fresh organic milk, sourdough bread, and morning greens with guaranteed 30-minute priority drops across North Riyadh.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#05A764] hover:text-emerald-300 pt-1"
              >
                <span>Browse Express Pantry</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

          </div>

          {/* ================= RIGHT ADDRESS CARDS LIST (9 Cols) ================= */}
          <div className="lg:col-span-9 space-y-6">

            {/* Loop through Saved Address Cards */}
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 font-sans p-6 hover:shadow-md transition-all"
              >
                
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold">
                      {addr.title.toLowerCase().includes('office') ? (
                        <Building2 className="w-4 h-4 text-[#05A764]" />
                      ) : (
                        <Home className="w-4 h-4 text-[#05A764]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-base">{addr.title}</h3>
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                            addr.is_default
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {addr.is_default ? '✓ DEFAULT ADDRESS' : addr.type || 'WORKPLACE'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {addr.is_default ? 'Primary weekly grocery fulfillment spot' : 'Corporate pantry and midday snack deliveries'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-400 hidden sm:inline-block">
                    {addr.phone}
                  </span>
                </div>

                {/* Card Main Body Grid: Details Left + Map Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Address Details (7 Cols) */}
                  <div className="md:col-span-7 space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{addr.recipient_name}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                        {addr.address_text}
                      </p>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      {addr.short_code && (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                          # Short Code: {addr.short_code}
                        </span>
                      )}

                      {addr.coordinates && (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{addr.coordinates}</span>
                        </span>
                      )}

                      {addr.cold_box_ok && (
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-extrabold">
                          🧊 Chilled Cold-Chain Box OK
                        </span>
                      )}

                      {addr.elevator_pass && (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-extrabold">
                          🏢 Tower B Elevator Pass
                        </span>
                      )}
                    </div>

                    {/* Courier Instructions Box */}
                    {addr.courier_notes && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 font-medium space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Gate Access & Drop-off Courier Notes:</span>
                        </div>
                        <p className="italic text-[11px] leading-relaxed text-slate-600">
                          "{addr.courier_notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Map Visual & History (5 Cols) */}
                  <div className="md:col-span-5 space-y-3">
                    
                    {/* Map Box Graphic */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/9] flex items-center justify-center">
                      <img
                        src={addr.map_image}
                        alt="Location Pin Map"
                        className="w-full h-full object-cover opacity-85"
                      />
                      
                      {/* Pin Graphic Overlay */}
                      <div className="absolute inset-0 bg-slate-900/30 p-3 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between text-[10px] font-extrabold">
                          <span className="bg-[#043927] px-2 py-0.5 rounded-md shadow-xs">
                            Villa 14
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-extrabold">
                          <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{addr.delivery_time_avg}</span>
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(addr.address_text)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/90 hover:bg-white text-slate-900 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <span>View in Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Delivery History Bar */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <span>Last drop: {addr.last_drop}</span>
                      <button type="button" className="font-extrabold text-[#043927] hover:underline cursor-pointer">
                        View Receipt
                      </button>
                    </div>

                  </div>

                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        ✓ Set as Default
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Courier Instructions</span>
                    </button>
                  </div>

                  {addr.is_default ? (
                    <span className="text-emerald-700 text-xs font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Default Selection</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemove(addr.id)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

              </div>
            ))}

            {/* Add New Delivery Address Banner Box */}
            <div className="bg-slate-100/80 rounded-3xl p-6 border border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#043927] border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">+ Add a New Delivery Address</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Add an apartment, compound villa, holiday chalet, or send gift groceries anywhere in Riyadh & Eastern Province with fast GPS pinning.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="px-5 py-3 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
              >
                <span>Pin New Location</span>
                <ArrowRight className="w-4 h-4 text-[#05A764] rtl:rotate-180" />
              </button>
            </div>

            {/* Bottom 2-Column Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Card: Riyadh Coverage Network */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4 font-sans">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-slate-900 text-sm">Riyadh Coverage Network</h4>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                    42 DISTRICTS
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                    100% Express Fulfillment Zone
                  </span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Falcon operates 6 cold-chain micro-warehouses across Riyadh: Al Malqa, Al Nakheel, Al Olaya, Diplomatic Quarter, Al Rawdah, and Hittin. Every address enjoys temperature-controlled frozen and refrigerated trucks.
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span className="text-slate-700">North Riyadh (Al Malqa, Yasmin, Hittin)</span>
                      <span className="text-emerald-700 font-black">20-40 min avg</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#043927] w-[90%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span className="text-slate-700">Central & Olaya Commercial Hub</span>
                      <span className="text-emerald-700 font-black">35-45 min avg</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#043927] w-[80%]" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span>⚡ Need delivery in Jeddah or Dammam? Check regional hubs soon.</span>
                </div>
              </div>

              {/* Right Card: Global Delivery Preferences */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4 font-sans">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-slate-900 text-sm">Global Delivery Preferences</h4>
                  </div>
                  <span className="text-slate-400 text-xs">🛡️</span>
                </div>

                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Applied automatically to all orders
                </span>

                {/* Toggle Items */}
                <div className="space-y-3 text-xs">
                  
                  {/* Preference 1 */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="space-y-0.5 pr-2">
                      <span className="font-extrabold text-slate-900 block">Contactless Doorstep Drop-off</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Leave groceries in thermal cool-bag when paid online via Apple Pay or mada.
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefContactless}
                        onChange={(e) => setPrefContactless(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                    </label>
                  </div>

                  {/* Preference 2 */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="space-y-0.5 pr-2">
                      <span className="font-extrabold text-slate-900 block">WhatsApp Dispatch Alerts</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Receive driver live tracking link and estimated 5-min arrival warning.
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefWhatsappAlerts}
                        onChange={(e) => setPrefWhatsappAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                    </label>
                  </div>

                  {/* Preference 3 */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="space-y-0.5 pr-2">
                      <span className="font-extrabold text-slate-900 block">Saudi Post (SPL) Auto-Sync</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Auto-populate official building numbers via linked National ID / Absher.
                      </span>
                    </div>

                    <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                      CONNECTED
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* Bottom Footer Logistics Info Banner */}
            <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium font-sans">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Moving houses or need to update compound security passes for Falcon couriers? Our 24/7 Riyadh logistics desk is ready.</span>
              </div>
              <button type="button" className="font-extrabold text-[#043927] hover:underline shrink-0 cursor-pointer flex items-center gap-1">
                <span>Contact Courier Desk</span>
                <Headphones className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ================= ADD / EDIT ADDRESS MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#043927] flex items-center justify-center font-bold">
                  {editingAddr ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingAddr ? 'Edit Delivery Location' : 'Pin New Delivery Address'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure GPS drop-off point & courier gate instructions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs font-sans">
              
              {/* Address Tag Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address Tag / Label *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Home', 'Office / Work', 'Compound Villa', 'Chalet'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setForm({ ...form, title: tag })}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        form.title === tag
                          ? 'bg-[#043927] text-white border-[#043927] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Noura Al-Mansoor"
                    value={form.recipient_name}
                    onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+966 55 987 6543"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>
              </div>

              {/* City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer"
                  >
                    <option value="Riyadh">Riyadh (Express Zone)</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Dammam">Dammam</option>
                    <option value="Al Khobar">Al Khobar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al Malqa / Al Olaya"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>
              </div>

              {/* Full Address Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Street & Villa / Apartment Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Villa 14, Prince Turki Ibn Abdulaziz Al Awwal Rd"
                  value={form.address_text}
                  onChange={(e) => setForm({ ...form, address_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                />
              </div>

              {/* SPL Short Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  SPL National Address Short Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RKNA-4912"
                  value={form.short_code}
                  onChange={(e) => setForm({ ...form, short_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                />
              </div>

              {/* Courier Drop-off Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gate Access & Courier Drop-off Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Leave at front doorstep villa gate, ring smart intercom twice..."
                  value={form.courier_notes}
                  onChange={(e) => setForm({ ...form, courier_notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] resize-none"
                />
              </div>

              {/* Set as Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="rounded border-slate-300 text-[#043927] focus:ring-[#043927] cursor-pointer"
                />
                <label htmlFor="modalIsDefault" className="text-xs font-extrabold text-slate-700 cursor-pointer">
                  Set as my primary default delivery address
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Save Delivery Address
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
