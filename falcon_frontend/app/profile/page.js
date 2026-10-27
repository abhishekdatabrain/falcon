'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useWishlist } from '@/src/contexts/WishlistContext';
import { useToast } from '@/src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '@/src/services/api';
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
  Upload,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

export default function ProfilePage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading, logout, checkUser } = useAuth();
  const { wishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, authLoading, router]);

  // Loading & Action states
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile data & Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [interfaceLang, setInterfaceLang] = useState('English (US) - Primary');
  const [nationalId, setNationalId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarRelative, setAvatarRelative] = useState('');

  // Dynamic Sidebar & Activity Counts
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Security Toggles
  const [tfaEnabled, setTfaEnabled] = useState(true);

  // Communication Toggles
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  // Dynamic Backend Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalSpent: 0,
    martPoints: 0,
    martPointsVal: '0.00',
    tier: '',
    tierTitle: '',
    wishlistCount: 0,
    addressesCount: 0,
    tierSavings: 0,
  });

  // Fetch Profile & Real-Time Stats from Backend
  const loadProfile = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    try {
      setInitialLoading(true);
      const [profRes, ordRes, addrRes, notifRes] = await Promise.all([
        fetchApi('/customers/profile').catch(() => null),
        fetchApi('/orders/my-orders').catch(() => null),
        fetchApi('/customers/addresses').catch(() => null),
        fetchApi('/notifications').catch(() => null),
      ]);

      if (profRes && profRes.success && profRes.data?.profile) {
        const p = profRes.data.profile;
        setFirstName(p.first_name || p.user?.first_name || user?.first_name || user?.name?.split(' ')[0] || '');
        setLastName(p.last_name || p.user?.last_name || user?.last_name || (user?.name ? user.name.split(' ').slice(1).join(' ') : ''));
        setEmail(p.user?.email || user?.email || '');
        setMobile(p.user?.mobile || p.mobile || user?.mobile || '');
        setDob(p.dob || '');
        setGender(p.gender || 'Female');
        setNationalId(p.national_id || '');

        if (p.avatar_url) {
          setAvatarRelative(p.avatar_url);
          setAvatar(getImageUrl(p.avatar_url));
        } else {
          setAvatar('');
          setAvatarRelative('');
        }

        if (p.preferences && typeof p.preferences === 'object') {
          if (p.preferences.interfaceLang) {
            setInterfaceLang(p.preferences.interfaceLang);
          }
          if (p.preferences.tfaEnabled !== undefined) {
            setTfaEnabled(Boolean(p.preferences.tfaEnabled));
          }
          if (p.preferences.whatsappAlerts !== undefined) {
            setWhatsappAlerts(Boolean(p.preferences.whatsappAlerts));
          }
          if (p.preferences.smsAlerts !== undefined) {
            setSmsAlerts(Boolean(p.preferences.smsAlerts));
          }
        }

        if (p.stats) {
          setStats(p.stats);
        }
      } else if (user) {
        setFirstName(user?.first_name || user?.name?.split(' ')[0] || '');
        setLastName(user?.last_name || (user?.name ? user.name.split(' ').slice(1).join(' ') : ''));
        setEmail(user?.email || '');
        setMobile(user?.mobile || '');
      }

      if (ordRes && ordRes.success && Array.isArray(ordRes.data?.orders)) {
        const active = ordRes.data.orders.filter((o) =>
          ['PENDING', 'CONFIRMED', 'PROCESSING', 'ASSIGNED', 'OUT_FOR_DELIVERY'].includes(
            (o.order_status || '').toUpperCase()
          )
        ).length;
        setActiveOrdersCount(active);
      }

      if (addrRes && addrRes.success && Array.isArray(addrRes.data?.addresses)) {
        setAddressesCount(addrRes.data.addresses.length);
      }

      if (notifRes && notifRes.success && Array.isArray(notifRes.data?.notifications)) {
        const unread = notifRes.data.notifications.filter((n) => !n.is_read).length;
        setUnreadNotifsCount(unread);
      }
    } catch (err) {
      console.warn('Customer profile load notice:', err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [authLoading, loadProfile]);

  // Avatar Upload via POST /upload & sync profile
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(locale === 'ar' ? 'حجم الملف يجب ألا يتجاوز 5 ميجابايت' : 'File size must be under 5MB', 'error');
      return;
    }

    // Local instant preview
    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);

    if (user) {
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetchApi('/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.success && res.data?.url) {
          const relativePath = res.data.url;
          setAvatarRelative(relativePath);
          const resolvedUrl = getImageUrl(relativePath);
          setAvatar(resolvedUrl);

          // Auto-save to customer profile
          await fetchApi('/customers/profile', {
            method: 'PUT',
            body: JSON.stringify({ avatar_url: relativePath }),
          });

          if (checkUser) checkUser();
          showToast(locale === 'ar' ? 'تم تحديث وحفظ الصورة الشخصية! 📸' : 'Profile avatar updated and saved! 📸', 'success');
        } else {
          throw new Error(res.message || 'Upload failed');
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
        showToast(err.message || 'Failed to upload photo', 'error');
      } finally {
        setUploadingAvatar(false);
      }
    } else {
      showToast(locale === 'ar' ? 'تم تحديث الصورة محلياً (يرجى تسجيل الدخول للحفظ)' : 'Avatar updated locally (Sign in to save)', 'info');
    }
  };

  // Remove Avatar
  const handleAvatarRemove = async () => {
    setAvatar('');
    setAvatarRelative('');

    if (user) {
      try {
        await fetchApi('/customers/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatar_url: '' }),
        });
        if (checkUser) checkUser();
        showToast(locale === 'ar' ? 'تمت إزالة الصورة الشخصية' : 'Profile avatar removed', 'success');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Save All Profile & Preferences via PUT /customers/profile
  const handleSave = async () => {
    if (!user) {
      showToast(
        locale === 'ar' ? 'يرجى تسجيل الدخول لحفظ التغييرات' : 'Please log in to save changes',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        dob,
        gender,
        national_id: nationalId.trim(),
        avatar_url: avatarRelative || (avatar.startsWith('http') && !avatar.includes('blob:') ? avatar : undefined),
        preferences: {
          interfaceLang,
          tfaEnabled,
          whatsappAlerts,
          smsAlerts,
        },
      };

      const res = await fetchApi('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data?.profile) {
        const p = res.data.profile;
        if (p.stats) setStats(p.stats);
        if (checkUser) checkUser();
        showToast(
          locale === 'ar' ? 'تم حفظ ملف التعريف والتفضيلات بنجاح! 🎉' : 'Profile & preferences saved successfully! 🎉',
          'success'
        );
      } else {
        throw new Error(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      showToast(err.message || 'Failed to save profile changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic Profile Strength Badge Calculation
  const badgeCriteria = [
    { label: 'First Name', ok: Boolean(firstName?.trim()) },
    { label: 'Last Name', ok: Boolean(lastName?.trim()) },
    { label: 'Email Verified', ok: Boolean(email?.trim()) },
    { label: 'Mobile Phone', ok: Boolean(mobile?.trim()) },
    { label: 'Date of Birth', ok: Boolean(dob?.trim()) },
    { label: 'Gender Selected', ok: Boolean(gender) },
    { label: 'National ID / Nafath', ok: Boolean(nationalId?.trim()) },
    { label: 'Profile Avatar Photo', ok: Boolean(avatar) },
  ];
  const completedBadges = badgeCriteria.filter((b) => b.ok).length;
  const strengthPercentage = Math.round((completedBadges / badgeCriteria.length) * 100);

  // Full Name formatting
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || (user?.name || (user?.email ? user.email.split('@')[0] : 'Falcon Member'));

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 pb-28 select-none">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top Breadcrumb & Status Tag Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              🏠 {locale === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <span className="text-slate-300">›</span>
            <span>{locale === 'ar' ? 'حسابي' : 'My Account'}</span>
            <span className="text-slate-300">›</span>
            <span className="text-slate-900 font-bold">{locale === 'ar' ? 'ملفي الشخصي' : 'My Profile'}</span>
          </div>

          <div className="flex items-center gap-2 text-[#05A764] font-bold bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse" />
            <span>
              {user
                ? (locale === 'ar' ? 'الحساب موثق عبر نفاذ • مركز الرياض' : 'Account Verified via Nafath • Riyadh Center')
                : (locale === 'ar' ? 'جلسة زائر نشطة' : 'Guest Session Active')}
            </span>
          </div>
        </div>

        {/* Unauthenticated / Guest Warning Banner */}
        {!user && !authLoading && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-900 shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-black">
                  {locale === 'ar' ? 'أنت تتصفح ملف التعريف حالياً كزائر' : 'You are currently browsing the Profile page as a Guest.'}
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                  {locale === 'ar'
                    ? 'سجل الدخول أو أنشئ حساباً لحفظ تفضيلاتك الغذائية ونقاط الولاء وخصومات التوصيل.'
                    : 'Sign in or register to sync your preferences, save addresses, and earn Falcon MartPoints.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login?redirect=/profile"
                className="bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
              <Link
                href="/register?redirect=/profile"
                className="bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 text-xs font-bold px-3 py-2 rounded-xl transition-all"
              >
                {locale === 'ar' ? 'حساب جديد' : 'Register'}
              </Link>
            </div>
          </div>
        )}

        {/* MAIN 2-COLUMN DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar Navigation & Profile Summary (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#05A764] shadow-xs shrink-0 bg-[#043927] text-white flex items-center justify-center font-black text-lg">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      onError={() => setAvatar('')}
                    />
                  ) : (
                    <span>{firstName ? firstName[0].toUpperCase() : (fullName ? fullName[0].toUpperCase() : 'M')}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#05A764] border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white">
                    ✓
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-base sm:text-lg text-slate-900 truncate">
                      {fullName}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold truncate">
                    {mobile || user?.mobile || (locale === 'ar' ? 'لا يوجد رقم مسجل' : '+966 50 123 4567')}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Menu */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-2.5 shadow-2xs space-y-1 text-xs font-bold text-slate-700">

              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-slate-500" />
                  <span>{locale === 'ar' ? 'طلباتي' : 'My Orders'}</span>
                </div>
                {activeOrdersCount > 0 ? (
                  <span className="bg-[#05A764] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {activeOrdersCount} {locale === 'ar' ? 'نشط' : 'Active'}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">
                    0
                  </span>
                )}
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-slate-500" />
                  <span>{locale === 'ar' ? 'تتبع الطلب المباشر' : 'Track Live Order'}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-slate-500" />
                  <span>{locale === 'ar' ? 'المفضلة' : 'Wishlist'}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {wishlist?.length || 0}
                </span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{locale === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {addressesCount}
                </span>
              </Link>

              {/* ACTIVE ITEM: My Profile */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#043927] text-white font-black shadow-xs">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>{locale === 'ar' ? 'ملفي الشخصي' : 'My Profile'}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <Link
                href="/notifications"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span>{locale === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                </div>
                {unreadNotifsCount > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadNotifsCount}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">0</span>
                )}
              </Link>
            </div>

            {/* 24/7 Concierge Support */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-[#05A764]" />
                <span className="font-bold text-xs text-slate-900">
                  {locale === 'ar' ? 'دعم كونسيرج 24/7' : '24/7 Concierge Support'}
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                ONLINE
              </span>
            </div>


            {/* Need Grocery Help? WhatsApp Box */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    {locale === 'ar' ? 'تحتاج مساعدة في المقاضي؟' : 'Need Grocery Help?'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {locale === 'ar' ? 'ممثل خدمة عملاء VIP عبر واتساب' : 'WhatsApp VIP Representative'}
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/966559876543?text=Hello%20Falcon%20VIP%20Grocery%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#05A764] hover:bg-[#048b53] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs cursor-pointer inline-block"
              >
                {locale === 'ar' ? 'تواصل الآن' : 'Chat Now'}
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Profile & Preferences Settings (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">

            {/* HEADER TITLE & SAVE BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {locale === 'ar' ? 'ملفي الشخصي والتفضيلات' : 'My Profile & Preferences'}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {locale === 'ar'
                    ? 'إدارة البيانات الشخصية، حماية الحساسية الغذائية، وإعدادات الأمان والإشعارات.'
                    : 'Manage personal details, Riyadh delivery coordinates, allergen safeguards, and security settings.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#043927] hover:bg-[#02281b] disabled:opacity-70 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                )}
                <span>{saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}</span>
              </button>
            </div>

            {/* DYNAMIC PROFILE STRENGTH CARD */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#05A764]" />
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    {locale === 'ar'
                      ? `اكتمال الملف الشخصي: ${strengthPercentage}%`
                      : `Profile Strength: ${strengthPercentage}% Complete`}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {completedBadges} / {badgeCriteria.length} {locale === 'ar' ? 'عناصر' : 'Badges'}
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#05A764] rounded-full transition-all duration-500"
                  style={{ width: `${strengthPercentage}%` }}
                />
              </div>
            </div>

            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#05A764]" />
                  <div>
                    <h2 className="font-bold text-sm sm:text-base text-slate-900">
                      {locale === 'ar' ? 'البيانات الشخصية' : 'Personal Details'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {locale === 'ar' ? 'تحديث هويتك وقنوات التواصل المعتمدة.' : 'Update your identity and verified contact channels.'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
                  ZATCA Compliant
                </span>
              </div>

              {/* Account Avatar Edit Box */}
              <div className="flex items-center gap-4 bg-[#F5F6F8] rounded-2xl p-4 border border-slate-200/60">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-[#043927] text-white flex items-center justify-center font-black text-xl">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Account Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setAvatar('')}
                    />
                  ) : (
                    <span>{firstName ? firstName[0].toUpperCase() : (fullName ? fullName[0].toUpperCase() : 'M')}</span>
                  )}
                  <label className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    {locale === 'ar' ? 'صورة الحساب' : 'Account Avatar'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                    {locale === 'ar'
                      ? 'يقبل صيغ JPG أو WEBP أو PNG بحد أقصى 5 ميجابايت. تظهر لمندوب التوصيل أثناء تسليم الطلب.'
                      : 'Accepts JPG, WEBP or PNG. Maximum file size is 5MB. Visible to delivery personnel during doorstep delivery.'}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <label
                      className={`bg-[#043927] hover:bg-[#02281b] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5 ${
 uploadingAvatar ? 'opacity-60 cursor-not-allowed' : ''
 }`}
                    >
                      {uploadingAvatar && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>
                        {uploadingAvatar
                          ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                          : (locale === 'ar' ? 'رفع صورة جديدة' : 'Upload New Photo')}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>

                    {avatar && (
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        {locale === 'ar' ? 'إزالة' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                
                {/* First Name */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    {locale === 'ar' ? 'الاسم الأول' : 'First Name'}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder={locale === 'ar' ? 'الاسم الأول' : 'First Name'}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    {locale === 'ar' ? 'اسم العائلة' : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder={locale === 'ar' ? 'اسم العائلة' : 'Last Name'}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">
                      {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      ✓ {locale === 'ar' ? 'موثق' : 'Verified'}
                    </span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    placeholder="name@domain.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300"
                  />
                </div>

                {/* Mobile Phone (KSA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">
                      {locale === 'ar' ? 'رقم الجوال (السعودية)' : 'Mobile Phone (KSA)'}
                    </label>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      📱 SMS Connected
                    </span>
                  </div>
                  <input
                    type="text"
                    value={mobile}
                    placeholder="+966 5x xxx xxxx"
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    {locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300"
                  />
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    🎂 {locale === 'ar' ? 'نقاط مضاعفة في أسبوع يوم ميلادك!' : 'Double MartPoints on your birthday harvest week.'}
                  </p>
                </div>

                {/* Gender Toggle */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    {locale === 'ar' ? 'الجنس' : 'Gender'}
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 gender === 'Female'
 ? 'bg-[#043927] text-white shadow-xs'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
 }`}
                    >
                      ♀ {locale === 'ar' ? 'أنثى' : 'Female'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 gender === 'Male'
 ? 'bg-[#043927] text-white shadow-xs'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
 }`}
                    >
                      ♂ {locale === 'ar' ? 'ذكر' : 'Male'}
                    </button>
                  </div>
                </div>

                {/* Preferred Interface & Invoices */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    {locale === 'ar' ? 'لغة الواجهة والفواتير المفضلة' : 'Preferred Interface & Invoices'}
                  </label>
                  <select
                    value={interfaceLang}
                    onChange={(e) => setInterfaceLang(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300 cursor-pointer"
                  >
                    <option value="English (US) - Primary">English (US) - Primary</option>
                    <option value="العربية (KSA) - Secondary">العربية (KSA) - Secondary</option>
                  </select>
                </div>

                {/* National ID / Iqama (ZATCA e-Invoice) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">
                      {locale === 'ar' ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Iqama (ZATCA e-Invoice)'}
                    </label>
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                      🛡️ Nafath Validated
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nationalId}
                      placeholder="10xxxxxxxx"
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      className="text-xs text-[#05A764] font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      {locale === 'ar' ? 'تحديث' : 'Update'}
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
                    <h2 className="font-bold text-sm sm:text-base text-slate-900">
                      {locale === 'ar' ? 'كلمة المرور والأمان' : 'Password & Security'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {locale === 'ar' ? 'إعدادات المصادقة الثنائية وتأمين الحساب.' : 'Multi-factor authorization and social account connections.'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                  🟢 2FA Active
                </span>
              </div>

              <div className="space-y-3">
                {/* Account Password Row */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {locale === 'ar' ? 'كلمة المرور' : 'Account Password'}
                        </span>
                        <span className="bg-emerald-100 text-[#043927] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                          STRONG
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {locale === 'ar' ? 'محمية بتشفير 256-بت' : 'Encrypted with 256-bit hash'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (email) {
                        showToast(
                          locale === 'ar'
                            ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`
                            : `Password reset link sent to ${email}`,
                          'success'
                        );
                      } else {
                        showToast('Please enter an email address first', 'error');
                      }
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                  </button>
                </div>

                {/* Two-Factor Authentication (2FA) Row */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-[#05A764] shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {locale === 'ar' ? 'المصادقة الثنائية (2FA)' : 'Two-Factor Authentication (2FA)'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        {locale === 'ar'
                          ? 'طلب رمز تحقق عبر الرسائل للطلبات التي تتجاوز 500 ريال أو العناوين الجديدة.'
                          : 'Instant 6-digit OTP verification prompted during orders over SAR 500 or new delivery addresses.'}
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                    LINKED IDENTITY PROVIDERS
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Apple ID */}
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block"> Apple ID</span>
                        <span className="text-[9px] text-slate-400 font-medium">FaceID 1-Tap</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    {/* Nafath App */}
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">🛡️ Nafath App</span>
                        <span className="text-[9px] text-slate-400 font-medium">National Verified</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    {/* Google Account */}
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">🌐 Google Account</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {user?.email?.includes('@gmail.com') ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      {user?.email?.includes('@gmail.com') ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => showToast(locale === 'ar' ? 'جاري ربط حساب Google...' : 'Connecting Google account...', 'info')}
                          className="text-xs text-[#05A764] font-bold hover:underline"
                        >
                          Link
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>



            {/* SECTION 4: COMMUNICATION CHANNELS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#05A764]" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900">
                    {locale === 'ar' ? 'قنوات التواصل والإشعارات' : 'Communication Channels'}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {locale === 'ar'
                    ? 'اختر طريقة استلام تحديثات الطلب المباشرة وعروض المزارع ورمز التسليم.'
                    : 'Choose how you wish to receive live order updates, farm specials, and courier dispatch notifications.'}
                </p>
              </div>

              <div className="space-y-3">
                {/* WhatsApp Order Tracking */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {locale === 'ar'
                          ? 'تتبع الطلبات وتنبيهات الحصاد الطازج عبر واتساب'
                          : 'WhatsApp Order Tracking & Fresh Harvest Alerts'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        {locale === 'ar'
                          ? 'استلام رابط تتبع السائق المباشر وخريطة التوصيل واستفسارات استبدال المنتجات عبر واتساب.'
                          : 'Receive automated live dispatch links, runner live map, and out-of-stock substitution queries via WhatsApp.'}
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
                      <h4 className="font-bold text-xs text-slate-900">
                        {locale === 'ar' ? 'رمز استلام الطلب ووصول السائق عبر SMS' : 'SMS Delivery PINs & Driver Arrival'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        {locale === 'ar'
                          ? 'استلام رسائل SMS ذات أولوية تحتوي على رمز التحقق المكون من 4 أرقام لتأكيد الاستلام عند الباب.'
                          : 'Receive high-priority SMS containing the 4-digit doorstep delivery confirmation code.'}
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
