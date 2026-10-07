'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import {
  User,
  ShieldCheck,
  Award,
  Zap,
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  Headphones,
  LogOut,
  MessageSquare,
  Camera,
  Check,
  Lock,
  Smartphone,
  CheckCircle2,
  Calendar,
  Globe,
  Shield,
  Key,
  Leaf,
  AlertTriangle,
  Users,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Upload
} from 'lucide-react';

export default function ProfilePage() {
  const { locale } = useLanguage();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // Form State
  const [firstName, setFirstName] = useState('Noura');
  const [lastName, setLastName] = useState('Al-Mansoor');
  const [email, setEmail] = useState('noura.almansoor@riyadh.sa');
  const [mobile, setMobile] = useState('+966 55 987 6543');
  const [dob, setDob] = useState('1992-09-14');
  const [gender, setGender] = useState('Female');
  const [interfaceLang, setInterfaceLang] = useState('English (US) - Primary');
  const [nationalId, setNationalId] = useState('•••• •••• 4912');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');

  // Security Toggles
  const [tfaEnabled, setTfaEnabled] = useState(true);

  // Dietary Preferences
  const [dietaryFilters, setDietaryFilters] = useState([
    'halal',
    'organic',
    'saudi_produce',
    'nut_alert'
  ]);
  const [householdSize, setHouseholdSize] = useState('Family (3-4)');

  // Communication Toggles
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const toggleDietaryFilter = (key) => {
    setDietaryFilters((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    showToast(
      locale === 'ar' ? 'تم حفظ ملف التعريف والتفضيلات بنجاح! 🎉' : 'Profile & preferences saved successfully! 🎉',
      'success'
    );
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      showToast(locale === 'ar' ? 'تم تحديث الصورة الشخصية!' : 'Profile avatar updated!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900 pb-28 select-none">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top Breadcrumb & Status Tag Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              🏠 Home
            </Link>
            <span className="text-slate-300">›</span>
            <span>My Account</span>
            <span className="text-slate-300">›</span>
            <span className="text-slate-900 font-extrabold">My Profile</span>
          </div>

          <div className="flex items-center gap-2 text-[#05A764] font-extrabold bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto font-sans">
            <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse" />
            <span>Account Verified via Nafath • Riyadh Center</span>
          </div>
        </div>

        {/* MAIN 2-COLUMN DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar Navigation & Profile Summary (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#05A764] shadow-xs shrink-0 bg-slate-100">
                  <img src={avatar} alt="Noura Al-Mansoor" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#05A764] border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white">
                    ✓
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-base sm:text-lg text-slate-900 truncate font-sans">
                      Noura Al-Mansoor
                    </h2>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                      👑 GOLD VIP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold truncate">
                    +966 55 987 6543
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#05A764] pt-0.5 font-sans">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Free Priority Delivery Active</span>
                  </div>
                </div>
              </div>

              {/* Stats Split Box */}
              <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-around border border-slate-200/60 text-center font-sans">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    MartPoints
                  </span>
                  <span className="text-lg font-black text-slate-900 block">
                    1,420
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-600 block">
                    SAR 71.00 Value
                  </span>
                </div>

                <div className="w-px h-8 bg-slate-200" />

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    Tier Savings
                  </span>
                  <span className="text-lg font-black text-slate-900 block">
                    SAR 384
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Year to date
                  </span>
                </div>
              </div>
            </div>

            {/* Gold Privilege FAST-TRACK Banner */}
            <div className="bg-[#043927] text-white rounded-2xl p-4 space-y-1.5 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span className="font-extrabold text-xs tracking-wide font-sans">
                    Gold Privilege
                  </span>
                </div>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
                  FAST-TRACK
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                North Riyadh Express 20-Min Guarantee active on all your weekday morning grocery slots.
              </p>
            </div>

            {/* Sidebar Navigation Menu */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-2.5 shadow-2xs space-y-1 font-sans text-xs font-bold text-slate-700">
              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  <span>Dashboard Overview</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-slate-500" />
                  <span>My Orders</span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  3 Active
                </span>
              </Link>

              <Link
                href="/orders/SA-849204"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-slate-500" />
                  <span>Track Live Order</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-slate-500" />
                  <span>Wishlist</span>
                </div>
                <span className="text-slate-400 font-semibold">12</span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Saved Addresses</span>
                </div>
                <span className="text-slate-400 font-semibold">3</span>
              </Link>

              <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>Payment Methods</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Mada / Visa</span>
              </div>

              {/* ACTIVE ITEM: My Profile */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#043927] text-white font-black shadow-xs">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>My Profile</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span>Notifications</span>
                </div>
                <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  2
                </span>
              </div>
            </div>

            {/* 24/7 Concierge Support */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-[#05A764]" />
                <span className="font-extrabold text-xs text-slate-900 font-sans">
                  24/7 Concierge Support
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-sans uppercase">
                ONLINE
              </span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => logout && logout()}
              className="w-full text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer font-sans"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            {/* Need Grocery Help? WhatsApp Box */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 font-sans">
                    Need Grocery Help?
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    WhatsApp VIP Representative
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="bg-[#05A764] hover:bg-[#048b53] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs cursor-pointer font-sans"
              >
                Chat Now
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Profile & Preferences Settings (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">

            {/* HEADER TITLE & SAVE BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  My Profile & Preferences
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Manage personal details, Riyadh delivery coordinates, allergen safeguards, and security settings.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="bg-[#043927] hover:bg-[#02281b] text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer font-sans shrink-0 self-start sm:self-auto"
              >
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Save Changes</span>
              </button>
            </div>

            {/* PROFILE STRENGTH 90% COMPLETE CARD */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#05A764]" />
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    Profile Strength: 90% Complete
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  9 / 10 Badges
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#05A764] rounded-full w-[90%] transition-all duration-500" />
              </div>
            </div>

            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#05A764]" />
                  <div>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                      Personal Details
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Update your identity and verified contact channels.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-sans uppercase">
                  ZATCA Compliant
                </span>
              </div>

              {/* Account Avatar Edit Box */}
              <div className="flex items-center gap-4 bg-[#F5F6F8] rounded-2xl p-4 border border-slate-200/60">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-slate-200">
                  <img src={avatar} alt="Account Avatar" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                    Account Avatar
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                    Accepts JPG, WEBP or PNG. Maximum file size is 5MB. Visible to delivery personnel during doorstep delivery.
                  </p>

                  <div className="flex items-center gap-3 pt-1 font-sans">
                    <label className="bg-[#043927] hover:bg-[#02281b] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs inline-block">
                      Upload New Photo
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={() => setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80')}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                
                {/* First Name */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-extrabold">First Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-extrabold">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-extrabold">Email Address</label>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      ✓ Verified
                    </span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans"
                  />
                </div>

                {/* Mobile Phone (KSA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-extrabold">Mobile Phone (KSA)</label>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      📱 SMS Connected
                    </span>
                  </div>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-extrabold">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans"
                  />
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    🎂 Double MartPoints on your birthday harvest week.
                  </p>
                </div>

                {/* Gender Toggle */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-extrabold">Gender</label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-sans ${
                        gender === 'Female'
                          ? 'bg-[#043927] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      ♀ Female
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-sans ${
                        gender === 'Male'
                          ? 'bg-[#043927] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      ♂ Male
                    </button>
                  </div>
                </div>

                {/* Preferred Interface & Invoices */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-extrabold">Preferred Interface & Invoices</label>
                  <select
                    value={interfaceLang}
                    onChange={(e) => setInterfaceLang(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans cursor-pointer"
                  >
                    <option value="English (US) - Primary">English (US) - Primary</option>
                    <option value="العربية (KSA) - Secondary">العربية (KSA) - Secondary</option>
                  </select>
                </div>

                {/* National ID / Iqama (ZATCA e-Invoice) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-extrabold">National ID / Iqama (ZATCA e-Invoice)</label>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      🛡️ Nafath Validated
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => showToast(locale === 'ar' ? 'جاري توجيهك لنظام نفاذ الوطني...' : 'Redirecting to Nafath Portal...', 'info')}
                      className="text-xs text-[#05A764] font-extrabold hover:underline shrink-0"
                    >
                      Update
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* SECTION 2: PASSWORD & SECURITY */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#05A764]" />
                  <div>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                      Password & Security
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Multi-factor authorization and social account connections.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-sans uppercase">
                  🟢 2FA Active
                </span>
              </div>

              <div className="space-y-3 font-sans">
                {/* Account Password Row */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          Account Password
                        </span>
                        <span className="bg-emerald-100 text-[#043927] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                          STRONG
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Last modified 3 months ago (May 2026)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(locale === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور على بريدك' : 'Password reset link sent to your email', 'info')}
                    className="bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>

                {/* Two-Factor Authentication (2FA) Row */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-[#05A764] shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Two-Factor Authentication (2FA)
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        Instant 6-digit OTP verification prompted during orders over SAR 500 or new delivery addresses. Active on: +966 55 *** 6543
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                    <input
                      type="checkbox"
                      checked={tfaEnabled}
                      onChange={(e) => setTfaEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05A764]" />
                  </label>
                </div>

                {/* Linked Identity Providers Row */}
                <div className="pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-sans">
                    LINKED IDENTITY PROVIDERS
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Apple ID */}
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block"> Apple ID</span>
                        <span className="text-[9px] text-slate-400 font-medium">FaceID 1-Tap</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    {/* Nafath App */}
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">🛡️ Nafath App</span>
                        <span className="text-[9px] text-slate-400 font-medium">National Verified</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    {/* Google Account */}
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">🌐 Google Account</span>
                        <span className="text-[9px] text-slate-400 font-medium">Not connected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast(locale === 'ar' ? 'جاري ربط حساب Google...' : 'Connecting Google account...', 'info')}
                        className="text-xs text-[#05A764] font-extrabold hover:underline"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* SECTION 3: DIETARY PREFERENCES & ALLERGEN SAFEGUARDS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-[#05A764]" />
                  <div>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                      Dietary Preferences & Allergen Safeguards
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      We'll automatically filter recommendations and highlight allergen warnings in your cart.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-sans uppercase">
                  SMART CART FILTER
                </span>
              </div>

              {/* Active Nutritional Filters Pills Grid */}
              <div className="space-y-2 font-sans">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  ACTIVE NUTRITIONAL FILTERS:
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Active Halal */}
                  <button
                    type="button"
                    onClick={() => toggleDietaryFilter('halal')}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dietaryFilters.includes('halal')
                        ? 'bg-[#043927] text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>✓ 100% Halal Certified</span>
                  </button>

                  {/* Active Organic */}
                  <button
                    type="button"
                    onClick={() => toggleDietaryFilter('organic')}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dietaryFilters.includes('organic')
                        ? 'bg-[#043927] text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>✓ Organic & Pesticide-Free</span>
                  </button>

                  {/* Active Saudi Produce */}
                  <button
                    type="button"
                    onClick={() => toggleDietaryFilter('saudi_produce')}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dietaryFilters.includes('saudi_produce')
                        ? 'bg-[#043927] text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>✓ Locally Sourced Saudi Produce</span>
                  </button>

                  {/* Nut Allergy Alert */}
                  <button
                    type="button"
                    onClick={() => toggleDietaryFilter('nut_alert')}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dietaryFilters.includes('nut_alert')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>⚠️ Nut Allergy Alert</span>
                  </button>

                  {/* Other Available Pills */}
                  {['+ Gluten-Free Friendly', '+ Dairy-Free / Lactose-Free', '+ Keto & Low Carb', '+ Sugar-Free / Diabetic Friendly'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => showToast(`Toggled ${opt}`, 'info')}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Household Size for Recipe Bundling */}
              <div className="bg-[#F5F6F8] rounded-2xl p-4 border border-slate-200/60 space-y-2 pt-3 font-sans">
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Household Size for Recipe Bundling
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Calibrates family-size portion recommendations for fruits, proteins, and pantry essentials.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {['1-2 Solo', 'Family (3-4)', 'Large (5+)'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setHouseholdSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        householdSize === sz
                          ? 'bg-[#043927] text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* SECTION 4: COMMUNICATION CHANNELS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#05A764]" />
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                    Communication Channels
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Choose how you wish to receive live order updates, farm specials, and courier dispatch notifications.
                </p>
              </div>

              <div className="space-y-3 font-sans">
                {/* WhatsApp Order Tracking */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">
                        WhatsApp Order Tracking & Fresh Harvest Alerts
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        Receive automated live dispatch links, runner live map, and out-of-stock substitution queries via WhatsApp.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={(e) => setWhatsappAlerts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05A764]" />
                  </label>
                </div>

                {/* SMS Delivery PINs */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-[#05A764] shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">
                        SMS Delivery PINs & Driver Arrival
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        Receive high-priority SMS containing the 4-digit doorstep delivery confirmation code.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#05A764]" />
                  </label>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
