'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import { useWishlist } from '@/src/contexts/WishlistContext';
import { useToast } from '@/src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '@/src/services/api';
import {
  Bell,
  CheckCircle2,
  Truck,
  Leaf,
  Tag,
  ShieldCheck,
  Star,
  Settings,
  Sliders,
  CheckCheck,
  MapPin,
  Phone,
  MoreVertical,
  ShoppingCart,
  Heart,
  Copy,
  ArrowRight,
  FileText,
  MessageCircle,
  Smartphone,
  Mail,
  Volume2,
  Package,
  Navigation,
  Bookmark,
  CreditCard,
  User,
  Headphones,
  LogOut,
  ChevronRight,
  Home,
  Check,
  X,
  ExternalLink,
  Flame,
  Award,
  Sparkles,
  Clock,
  Radio,
  Eye,
  Trash2,
} from 'lucide-react';


// Initial rich dynamic notifications matching exact design in screenshot
const INITIAL_NOTIFICATIONS = [
 
];

export default function NotificationsPage() {
  const { locale } = useLanguage();
  const isRtl = locale === 'ar';
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlist } = useWishlist();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState('all');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);

  // Delivery Channels State
  const [channels, setChannels] = useState([
    {
      id: 'whatsapp',
      name: 'WhatsApp Dispatch',
      sub: '+966 55 987 6543',
      desc: 'Live driver locations & OTP gates',
      active: true,
      icon: 'whatsapp',
    },
    {
      id: 'sms',
      name: 'SMS Critical Alerts',
      sub: 'Driver delivery codes & 2FA',
      desc: 'Direct to primary mobile',
      active: true,
      icon: 'sms',
    },
    {
      id: 'email',
      name: 'Email Digested',
      sub: user?.email || 'noura.almansoor@riyadh.sa',
      desc: 'Weekly farm catalogs & tax invoices',
      active: true,
      icon: 'email',
    },
    {
      id: 'push',
      name: 'Flash Push Pushes',
      sub: 'Marketing & Flash Sales',
      desc: 'Paused by user until weekend',
      active: false,
      icon: 'push',
    },
  ]);

  // Load backend profile, orders, addresses, and notifications
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profRes, ordRes, addrRes, notifRes] = await Promise.all([
          fetchApi('/customers/profile').catch(() => null),
          fetchApi('/orders/my-orders').catch(() => null),
          fetchApi('/customers/addresses').catch(() => null),
          fetchApi('/notifications').catch(() => null),
        ]);

        if (profRes && profRes.success && profRes.data?.profile) {
          setProfile(profRes.data.profile);
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

        if (notifRes && notifRes.success && Array.isArray(notifRes.data?.notifications) && notifRes.data.notifications.length > 0) {
          const apiNotifs = notifRes.data.notifications.map((n) => ({
            id: n.id,
            category: n.type?.toLowerCase() || 'orders',
            badgeText: (n.type || 'SYSTEM').toUpperCase(),
            badgeStyle: 'bg-emerald-700 text-white',
            iconType: n.type === 'orders' ? 'truck' : n.type === 'deals' ? 'tag' : 'shieldCheck',
            title: isRtl ? n.title_ar || n.title_en : n.title_en,
            timeText: new Date(n.created_at || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: n.created_at || n.createdAt,
            section: 'today',
            isNew: !n.is_read,
            isRead: n.is_read,
            body: isRtl ? n.body_ar || n.body_en : n.body_en,
            actions: [],
          }));

          setNotifications((prev) => {
            const combined = [...apiNotifs, ...prev];
            return Array.from(new Map(combined.map((item) => [item.id, item])).values());
          });
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };
    fetchUserData();
  }, [isRtl]);

  // Toggle delivery channel
  const toggleChannel = (id) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const next = !ch.active;
          showToast(
            `${ch.name} ${next ? 'activated' : 'paused'}`,
            next ? 'success' : 'info'
          );
          return { ...ch, active: next };
        }
        return ch;
      })
    );
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, isNew: false }))
    );
    try {
      await fetchApi('/notifications/read-all', { method: 'PUT' });
    } catch (e) {
      // Handled locally
    }
    showToast(isRtl ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read', 'success');
  };

  // Mark single as read
  const handleToggleRead = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead, isNew: false } : n))
    );
    setActiveMenuId(null);
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) {}
  };

  // Remove notification
  const handleDeleteNotification = (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setActiveMenuId(null);
    showToast(isRtl ? 'تم حذف الإشعار' : 'Notification removed', 'info');
  };

  // Copy promo voucher
  const handleCopyCode = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(isRtl ? `تم نسخ الكود: ${code}` : `Promo code ${code} copied to clipboard!`, 'success');
    }
  };

  // Quick Add To Cart from notification
  const handleAddNotificationProduct = async (product) => {
    try {
      await addToCart(
        {
          id: product.id,
          name_en: product.name,
          name_ar: product.name,
          price: product.price,
          image_url: product.image,
        },
        1
      );
      showToast(
        isRtl
          ? `تمت إضافة ${product.name} إلى السلة بنجاح!`
          : `Added ${product.name} to your cart!`,
        'success'
      );
    } catch (err) {
      showToast('Added to cart', 'success');
    }
  };

  // Dynamic counts for tabs
  const tabCounts = useMemo(() => {
    const orders = notifications.filter((n) => n.category === 'orders');
    const farm = notifications.filter((n) => n.category === 'farm_harvest');
    const deals = notifications.filter((n) => n.category === 'deals');
    const security = notifications.filter((n) => n.category === 'security');

    const ordersNew = orders.filter((n) => !n.isRead).length;
    const farmNew = farm.filter((n) => !n.isRead).length;

    return {
      all: notifications.length,
      orders: `${orders.length}${ordersNew > 0 ? ` • ${ordersNew} New` : ''}`,
      farm: `${farm.length}${farmNew > 0 ? ` • ${farmNew} New` : ''}`,
      deals: deals.length,
      security: security.length,
      totalUnread: notifications.filter((n) => !n.isRead).length,
    };
  }, [notifications]);

  // Filtered notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'orders') return notifications.filter((n) => n.category === 'orders');
    if (activeTab === 'farm') return notifications.filter((n) => n.category === 'farm_harvest');
    if (activeTab === 'deals') return notifications.filter((n) => n.category === 'deals');
    if (activeTab === 'security') return notifications.filter((n) => n.category === 'security');
    return notifications;
  }, [notifications, activeTab]);

  // Group notifications by section
  const groupedSections = useMemo(() => {
    const today = filteredNotifications.filter((n) => n.section === 'today');
    const yesterday = filteredNotifications.filter((n) => n.section === 'yesterday');
    const earlier = filteredNotifications.filter((n) => n.section === 'earlier');
    return { today, yesterday, earlier };
  }, [filteredNotifications]);

  // Icon renderer helper
  const renderIcon = (type) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-5 h-5 text-emerald-800" />;
      case 'leaf':
        return <Leaf className="w-5 h-5 text-emerald-800" />;
      case 'tag':
        return <Tag className="w-5 h-5 text-amber-800" />;
      case 'checkCircle':
        return <CheckCircle2 className="w-5 h-5 text-emerald-800" />;
      case 'star':
        return <Star className="w-5 h-5 text-amber-800 fill-amber-700/20" />;
      case 'shieldCheck':
        return <ShieldCheck className="w-5 h-5 text-blue-800" />;
      default:
        return <Bell className="w-5 h-5 text-slate-700" />;
    }
  };

  const userName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user?.name || 'Mohammed Al-Salem'
    : (user?.name || (user?.customer ? `${user.customer.first_name || ''} ${user.customer.last_name || ''}`.trim() : null) || 'Mohammed Al-Salem');
  const userPhone = profile?.user?.mobile || profile?.mobile || user?.mobile || '+966 50 123 4567';

  return (
    <div className="min-h-screen bg-[#F4F6F4] font-sans pb-24 text-slate-800">

      {/* ================= TOP BREADCRUMB & UTILITY HEADER ================= */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#043927] transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
            <Link href="/profile" className="hover:text-[#043927] transition-colors">
              My Account
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
            <span className="text-slate-900 font-extrabold">Notifications</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <a
              href="#channels-section"
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#043927] transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Preferences & Channels</span>
            </a>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#043927] transition-colors cursor-pointer font-bold"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark all as read</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ================= LEFT SIDEBAR (EXACT MATCH TO DESIGN) ================= */}
          <div className="lg:col-span-3 space-y-4">

            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={getImageUrl(profile.avatar_url)}
                      alt={userName}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-100 shadow-2xs"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-[#043927] text-white font-black text-lg flex items-center justify-center border-2 border-emerald-100 shadow-2xs">
                      {userName ? userName[0].toUpperCase() : 'M'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                      {userName}
                    </h3>
                  </div>
                 
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {userPhone}
                  </p>
                </div>
              </div>


            </div>

            {/* Account Sidebar Navigation Links */}
            <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1">


              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>My Orders</span>
                </div>
                {activeOrdersCount > 0 ? (
                  <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {activeOrdersCount} Active
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold text-slate-400">
                    0
                  </span>
                )}
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-slate-400" />
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
                <span className="text-[11px] font-extrabold text-slate-400">
                  {wishlist?.length || 0}
                </span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Saved Addresses</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-400">
                  {addressesCount}
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

              {/* Active Tab: Notifications */}
              <div className="flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-[#043927] text-white shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Notifications</span>
                </div>
                {tabCounts.totalUnread > 0 ? (
                  <span className="bg-[#854D0E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {tabCounts.totalUnread} Unread
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold text-slate-300">0</span>
                )}
              </div>

              <Link
                href="/contact"
                className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>24/7 Concierge</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600">● Online</span>
              </Link>


            </div>

            {/* Need Grocery Help Card (Bottom WhatsApp Promo) */}
            <div className="bg-gradient-to-br from-[#043927] via-[#05442e] to-[#02281b] rounded-3xl p-5 text-white relative overflow-hidden shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">Need Grocery Help?</h4>
                <p className="text-[11px] text-emerald-100/80 font-medium leading-relaxed mt-1">
                  WhatsApp your dedicated VIP FreshMart concierge specialist.
                </p>
              </div>
              <a
                href="https://wa.me/966559876543"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Chat Now</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </a>
            </div>

          </div>

          {/* ================= RIGHT MAIN CONTENT (EXACT NOTIFICATIONS STREAM) ================= */}
          <div className="lg:col-span-9 space-y-6">

            {/* Page Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Notifications & Activity
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Stay updated on real-time order tracking, farm harvest arrivals, price drops, and member rewards.
                </p>
              </div>

              {/* Notification Settings Button */}
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Notification Settings</span>
              </button>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-[#043927] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Notifications</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tabCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'bg-[#043927] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Orders & Delivery</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {tabCounts.orders}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('farm')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'farm'
                    ? 'bg-[#043927] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Farm Harvest & Restock</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'farm' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {tabCounts.farm}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deals')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'deals'
                    ? 'bg-[#043927] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Exclusive Deals</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'deals' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tabCounts.deals}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'security'
                    ? 'bg-[#043927] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Account & Security</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'security' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tabCounts.security}
                </span>
              </button>
            </div>

            {/* ================= NOTIFICATIONS STREAM ================= */}
            <div className="space-y-6">

              {/* ---------------- 1. TODAY • FRESH ALERTS ---------------- */}
              {groupedSections.today.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="uppercase">TODAY • FRESH ALERTS</span>
                    </div>
                    <span className="text-slate-400 font-semibold normal-case">
                      {groupedSections.today.filter((n) => !n.isRead).length} New notifications
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groupedSections.today.map((item) => (
                      <NotificationCard
                        key={item.id}
                        item={item}
                        renderIcon={renderIcon}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        handleToggleRead={handleToggleRead}
                        handleDeleteNotification={handleDeleteNotification}
                        handleAddNotificationProduct={handleAddNotificationProduct}
                        handleCopyCode={handleCopyCode}
                        setRatingModalOpen={setRatingModalOpen}
                        setCourierModalOpen={setCourierModalOpen}
                        setRedeemModalOpen={setRedeemModalOpen}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------- 2. YESTERDAY ---------------- */}
              {groupedSections.yesterday.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    YESTERDAY
                  </div>

                  <div className="space-y-3">
                    {groupedSections.yesterday.map((item) => (
                      <NotificationCard
                        key={item.id}
                        item={item}
                        renderIcon={renderIcon}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        handleToggleRead={handleToggleRead}
                        handleDeleteNotification={handleDeleteNotification}
                        handleAddNotificationProduct={handleAddNotificationProduct}
                        handleCopyCode={handleCopyCode}
                        setRatingModalOpen={setRatingModalOpen}
                        setCourierModalOpen={setCourierModalOpen}
                        setRedeemModalOpen={setRedeemModalOpen}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------- 3. EARLIER THIS WEEK ---------------- */}
              {groupedSections.earlier.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    EARLIER THIS WEEK
                  </div>

                  <div className="space-y-3">
                    {groupedSections.earlier.map((item) => (
                      <NotificationCard
                        key={item.id}
                        item={item}
                        renderIcon={renderIcon}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        handleToggleRead={handleToggleRead}
                        handleDeleteNotification={handleDeleteNotification}
                        handleAddNotificationProduct={handleAddNotificationProduct}
                        handleCopyCode={handleCopyCode}
                        setRatingModalOpen={setRatingModalOpen}
                        setCourierModalOpen={setCourierModalOpen}
                        setRedeemModalOpen={setRedeemModalOpen}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredNotifications.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#043927] flex items-center justify-center mx-auto">
                    <Bell className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">No notifications found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have caught up with all updates in this category. We will notify you when new farm harvests or order updates occur.
                  </p>
                </div>
              )}

            </div>

            {/* ================= BOTTOM SECTION: NOTIFICATION CHANNELS & DELIVERY METHODS ================= */}
            <div id="channels-section" className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Notification Channels & Delivery Methods
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Control where and how you receive urgent delivery dispatches, restock alerts, and exclusive vouchers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="text-xs font-bold text-[#01813E] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>Manage Preferences</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3 relative hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-[#043927]">
                          {ch.icon === 'whatsapp' && <MessageCircle className="w-4 h-4 text-emerald-600" />}
                          {ch.icon === 'sms' && <Smartphone className="w-4 h-4 text-slate-700" />}
                          {ch.icon === 'email' && <Mail className="w-4 h-4 text-amber-600" />}
                          {ch.icon === 'push' && <Bell className="w-4 h-4 text-slate-600" />}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleChannel(ch.id)}
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider cursor-pointer transition-all ${
                            ch.active
                              ? 'bg-[#043927] text-white hover:bg-[#02281b]'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {ch.active ? 'ACTIVE' : 'PAUSED'}
                        </button>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                          {ch.name}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-600 truncate mt-0.5">
                          {ch.sub}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed pt-2 border-t border-slate-200/60">
                      {ch.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ================= MODAL: RATING & FEEDBACK ================= */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Rate Your Delivery Experience</h3>
              <button
                type="button"
                onClick={() => setRatingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              How was Order #FM-9482? Your feedback helps local Riyadh farmers and our express cold-chain couriers maintain 5-star quality.
            </p>

            <div className="flex justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="p-2 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= selectedRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Leave a short comment (e.g. Tomatoes were super fresh, delivery arrived in 15 mins!)..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRatingModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRatingModalOpen(false);
                  showToast(isRtl ? 'شكراً لتقييمك!' : 'Thank you for your rating!', 'success');
                }}
                className="px-5 py-2 rounded-full bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: NOTIFICATION SETTINGS ================= */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#043927]" />
                <h3 className="font-black text-slate-900 text-base">Notification Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Choose your alert channels and frequency for fresh produce restocks and order updates.
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { title: 'Live GPS Delivery Tracking', desc: 'Real-time telemetry when driver is within 2 km of your address', checked: true },
                { title: 'Farm Harvest & Wishlist Restocks', desc: 'Alerts when organic produce from Al-Kharj or Qassim arrives', checked: true },
                { title: 'VIP Exclusive Vouchers & Flash Deals', desc: 'Special promo codes on weekend meats and bakery', checked: true },
                { title: 'ZATCA Tax Invoice & Payment Confirmations', desc: 'PDF tax invoices generated automatically upon delivery', checked: true },
                { title: 'MartPoints & Loyalty Milestones', desc: 'Balance alerts when you earn grocery wallet store credits', checked: true },
              ].map((pref, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">{pref.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={pref.checked}
                    className="w-4 h-4 text-emerald-600 rounded-md mt-1 cursor-pointer accent-[#043927]"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: COURIER CALL ================= */}
      {courierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center mx-auto border border-emerald-200">
              <Phone className="w-6 h-6 text-emerald-700 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Contact Courier Tariq K.</h3>
              <p className="text-xs text-slate-500 mt-1">
                Order #FM-98421 • Approaching Prince Turki Ibn Abdulaziz Al Awwal Rd (~18 mins away).
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold block uppercase">Direct Driver Mobile</span>
              <span className="text-base font-black text-slate-900 block mt-0.5">+966 54 321 9876</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCourierModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <a
                href="tel:+966543219876"
                className="px-5 py-2 rounded-full bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REDEEM POINTS ================= */}
      {redeemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <Sparkles className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Redeem MartPoints</h3>
              <p className="text-xs text-slate-500 mt-1">
                You have <strong>1,420 MartPoints</strong> available (Equivalent to <strong>SAR 71.00</strong> store credit).
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 font-bold">
              Instant SAR 71.00 will be added to your FreshMart grocery wallet for immediate checkout discount!
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRedeemModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRedeemModalOpen(false);
                  showToast(isRtl ? 'تم إضافة رصيد SAR 71.00 إلى محفظتك بنجاح!' : 'SAR 71.00 credited to your wallet!', 'success');
                }}
                className="px-5 py-2 rounded-full bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Redemption
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponent: Individual Notification Card
function NotificationCard({
  item,
  renderIcon,
  activeMenuId,
  setActiveMenuId,
  handleToggleRead,
  handleDeleteNotification,
  handleAddNotificationProduct,
  handleCopyCode,
  setRatingModalOpen,
  setCourierModalOpen,
  setRedeemModalOpen,
}) {
  const isMenuOpen = activeMenuId === item.id;

  return (
    <div
      className={`bg-white rounded-3xl p-5 border shadow-2xs transition-all relative ${
        !item.isRead ? 'border-s-4 border-s-emerald-600 border-slate-200/90' : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start gap-4">

        {/* Circular Left Icon */}
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
          {renderIcon(item.iconType)}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-2">

          {/* Header Row: Badge, Title, Time, Menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {item.badgeText && (
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    item.badgeStyle || 'bg-[#043927] text-white'
                  }`}
                >
                  {item.badgeText}
                </span>
              )}
              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">
                {item.timeText}
              </span>

              {/* Three dots menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : item.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-7 z-20 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(item.id, e)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.isRead ? 'Mark as unread' : 'Mark as read'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(item.id, e)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Remove alert</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Body */}
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {item.body}
          </p>

          {/* Optional Meta Pills (Cold chain temp, ETA, Villa address) */}
          {item.metaPills && item.metaPills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
              {item.metaPills.map((p, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700"
                >
                  {p.icon === 'snowflake' && <span>❄️</span>}
                  {p.icon === 'clock' && <span>⏱</span>}
                  {p.icon === 'mapPin' && <span>📍</span>}
                  {p.icon === 'phone' && <span>📱</span>}
                  <span className="font-semibold">{p.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Optional Embedded Mini Product Card (Heirloom Tomatoes) */}
          {item.productCard && (
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-3">
                <img
                  src={item.productCard.image}
                  alt={item.productCard.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shrink-0"
                />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                    {item.productCard.name}
                  </h4>
                  <span className="inline-block text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200/60">
                    {item.productCard.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-sm font-black text-slate-900">
                  SAR {item.productCard.price.toFixed(2)}
                </span>
                {item.productCard.originalPrice && (
                  <span className="text-xs text-slate-400 line-through font-semibold">
                    SAR {item.productCard.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          {item.actions && item.actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {item.actions.map((act) => {
                // Primary button style
                if (act.primary) {
                  if (act.id === 'add_to_cart' && item.productCard) {
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleAddNotificationProduct(item.productCard)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{act.label}</span>
                      </button>
                    );
                  }

                  if (act.id === 'redeem_points') {
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setRedeemModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-300" />
                        <span>{act.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={act.id}
                      href={act.href || '#'}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      {act.id === 'track_live' && <MapPin className="w-3.5 h-3.5" />}
                      <span>{act.label}</span>
                    </Link>
                  );
                }

                // Secondary / Outline button styles
                if (act.id === 'call_courier') {
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setCourierModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{act.label}</span>
                    </button>
                  );
                }

                if (act.id === 'copy_code') {
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleCopyCode(act.code)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{act.label}</span>
                    </button>
                  );
                }

                if (act.id === 'rate_experience') {
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setRatingModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50/70 border border-amber-200/80 text-amber-900 hover:bg-amber-100 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Rate Experience ★★★★★</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={act.id}
                    href={act.href || '#'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    {act.id === 'view_wishlist' && <Heart className="w-3.5 h-3.5 text-slate-500" />}
                    {act.id === 'view_invoice' && <FileText className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{act.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
