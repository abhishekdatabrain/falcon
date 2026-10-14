'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
  AlertCircle,
  RefreshCw,
  LogOut,
  Globe,
  Phone,
  User,
  ShieldCheck,
  Leaf,
  Package,
  Store,
  Radio,
  ExternalLink,
  ChevronRight,
  Eye,
  KeyRound,
  FileText,
  X,
  Lock,
  Mail,
  Compass,
  Check,
  Calendar,
  CreditCard,
  Receipt
} from 'lucide-react';

export default function DriverDashboardPage() {
  const { user, logout } = useAuth();
  const { t, locale, toggleLanguage } = useLanguage();
  const { socket, emitDriverLocation, emitDriverGpsStatus, joinDeliveryRoom, leaveDeliveryRoom, joinDriverRoom } = useSocket();
  const { showToast } = useToast();
  const router = useRouter();

  const [driver, setDriver] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDeliveryId, setActiveDeliveryId] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Idle');

  // Tabs: 'active' or 'history'
  const [deliveryTab, setDeliveryTab] = useState('active');

  // Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [completionConfirmDelivery, setCompletionConfirmDelivery] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [failureModalDelivery, setFailureModalDelivery] = useState(null);
  const [failureReason, setFailureReason] = useState('Customer unreachable at delivery address');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Profile & Password Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile'); // 'profile' or 'password'
  const [profileForm, setProfileForm] = useState({
    email: '',
    mobile: '',
    vehicle_details: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!loading && (!user || user.role !== 'DRIVER')) {
      router.push('/driver/login');
    }
  }, [user, loading, router]);

  const loadDashboard = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetchApi('/drivers/dashboard');
      if (res.success) {
        setDriver(res.data.driver);
        setDeliveries(res.data.deliveries || []);

        // Pre-fill profile form
        setProfileForm({
          email: res.data.driver?.user?.email || '',
          mobile: res.data.driver?.user?.mobile || '',
          vehicle_details: res.data.driver?.vehicle_details || '',
        });

        // Find active delivery run
        const active = (res.data.deliveries || []).find((d) =>
          ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(d.delivery_status || d.status)
        );
        if (active) {
          setActiveDeliveryId(active.id);
        } else {
          setActiveDeliveryId(null);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load driver data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Real-time assignment listener: auto-refresh when Admin assigns an order
  useEffect(() => {
    if (!socket || !driver?.id) return;

    joinDriverRoom(driver.id);

    const handleOrderAssigned = (data) => {
      showToast(
        locale === 'ar'
          ? `تم إسناد طلب جديد لك #${data.orderNumber || ''}`
          : `New order assigned to you: #${data.orderNumber || ''}`,
        'success'
      );
      loadDashboard(true);
    };

    const handleStatusUpdate = (data) => {
      if (
        data.driverId === driver.id ||
        deliveries.some((d) => d.order_id === data.orderId || d.id === data.deliveryId)
      ) {
        loadDashboard(true);
      }
    };

    socket.on('order_assigned', handleOrderAssigned);
    socket.on('order_status_update', handleStatusUpdate);

    return () => {
      socket.off('order_assigned', handleOrderAssigned);
      socket.off('order_status_update', handleStatusUpdate);
    };
  }, [socket, driver?.id]);

  // HTML5 Browser Geolocation API Watcher during active delivery
  useEffect(() => {
    if (!activeDeliveryId) {
      setGpsStatus('Stopped');
      return;
    }

    joinDeliveryRoom(activeDeliveryId);
    setGpsStatus('Active & Sharing Location');
    emitDriverGpsStatus({
      deliveryId: activeDeliveryId,
      status: 'CONNECTED',
    });

    if (!navigator.geolocation) {
      setGpsStatus('Browser Geolocation Not Supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;

        // Broadcast to Socket.IO Delivery Room
        emitDriverLocation({
          deliveryId: activeDeliveryId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
        });

        // Periodically log location to backend persistence
        fetchApi('/drivers/gps-location', {
          method: 'POST',
          body: JSON.stringify({
            deliveryId: activeDeliveryId,
            latitude,
            longitude,
            speed,
            heading,
          }),
        }).catch(() => {});
      },
      (err) => {
        setGpsStatus(`GPS Disconnected: ${err.message}`);
        emitDriverGpsStatus({
          deliveryId: activeDeliveryId,
          status: 'DISCONNECTED',
          message: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      leaveDeliveryRoom(activeDeliveryId);
      emitDriverGpsStatus({
        deliveryId: activeDeliveryId,
        status: 'DISCONNECTED',
      });
    };
  }, [activeDeliveryId]);

  const handleUpdateAvailability = async (newStatus) => {
    try {
      const res = await fetchApi('/drivers/availability', {
        method: 'PUT',
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث حالة التوفر بنجاح' : 'Availability status updated',
          'success'
        );
        await loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAcceptDelivery = async (deliveryId) => {
    try {
      const res = await fetchApi(`/drivers/deliveries/${deliveryId}/accept`, {
        method: 'POST',
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم قبول طلب التوصيل!' : 'Delivery run accepted!',
          'success'
        );
        await loadDashboard();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusUpdate = async (deliveryId, nextStatus, extraPayload = {}) => {
    try {
      setSubmittingStatus(true);
      setOtpError('');
      const payload = {
        status: nextStatus,
        notes: completionNotes,
        ...extraPayload,
      };

      const res = await fetchApi(`/drivers/deliveries/${deliveryId}/status`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث حالة التوصيل بنجاح!' : 'Delivery status updated successfully!',
          'success'
        );
        setCompletionConfirmDelivery(null);
        setFailureModalDelivery(null);
        setCompletionNotes('');
        setDeliveryOtp('');
        setOtpError('');
        await loadDashboard();
      }
    } catch (err) {
      if (nextStatus === 'DELIVERED') {
        setOtpError(err.message || 'Invalid delivery OTP');
      }
      showToast(err.message, 'error');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSubmitting(true);
      const res = await fetchApi('/drivers/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Driver profile updated successfully',
          'success'
        );
        await loadDashboard();
        setProfileModalOpen(false);
      }
    } catch (err) {
      showToast(err.message || 'Profile update failed', 'error');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(
        locale === 'ar' ? 'كلمات المرور الجديدة غير متطابقة' : 'New passwords do not match',
        'error'
      );
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast(
        locale === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters',
        'error'
      );
      return;
    }

    try {
      setProfileSubmitting(true);
      const res = await fetchApi('/drivers/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
          'success'
        );
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setProfileModalOpen(false);
      }
    } catch (err) {
      showToast(err.message || 'Password change failed', 'error');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const openNavigation = (order) => {
    const address = order?.address;
    let target = '';
    if (address?.latitude && address?.longitude) {
      target = `${address.latitude},${address.longitude}`;
    } else if (address) {
      target = encodeURIComponent(
        `${address.address_line || ''}, ${address.area || ''}, ${address.city || ''}`
      );
    }
    if (target) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${target}`, '_blank');
    } else {
      showToast('Address details not available for direct navigation', 'warning');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#05442e] text-white flex items-center justify-center shadow-lg animate-pulse">
          <Truck className="w-6 h-6 text-[#05A764]" />
        </div>
        <p className="text-sm font-bold text-slate-600">
          {locale === 'ar' ? 'جارٍ تحميل لوحة السائق...' : 'Loading Driver Portal...'}
        </p>
      </div>
    );
  }

  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED');
  const activeDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED');

  const displayedDeliveries = deliveryTab === 'active' ? activeDeliveries : completedDeliveries;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans relative overflow-x-hidden">
      {/* Ambient Decorative Background Glows */}
      <div className="absolute top-10 left-1/3 w-[36rem] h-[36rem] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      {/* Driver Portal Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 group">
              <span className="text-2xl font-black text-[#05442e] tracking-tight font-heading">
                Logo
              </span>
              <Leaf className="w-5 h-5 text-[#05A764] fill-[#05A764] -mt-1 group-hover:rotate-12 transition-transform" />
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-[#05442e] border border-emerald-200/80">
              <Truck className="w-3.5 h-3.5 text-[#05A764]" />
              {locale === 'ar' ? 'لوحة تحكم السائق' : 'Driver Portal'}
            </span>
          </div>

          {/* User Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              title="Refresh Data"
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#05442e] hover:bg-emerald-50/50 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#05442e]' : ''}`} />
            </button>

            {/* Profile & Password Button */}
            <button
              onClick={() => {
                setProfileTab('profile');
                setProfileModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all shadow-2xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#05A764]" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'الملف الشخصي' : 'My Profile'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#05A764]" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-2xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 flex-1 relative z-10">
        {/* Top Profile & Availability Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl relative overflow-hidden">
          {/* Top Brand Accent Stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#05442e] via-[#05A764] to-[#DA9628] absolute top-0 left-0 right-0" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
            {/* Driver Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#05442e] text-white flex items-center justify-center shadow-lg shadow-emerald-950/20 border border-emerald-700/40 shrink-0 relative">
                <Truck className="w-8 h-8 text-[#05A764]" />
                <span
                  className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    driver?.availability_status === 'AVAILABLE'
                      ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                      : driver?.availability_status === 'BUSY'
                      ? 'bg-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-400 ring-2 ring-slate-400/20'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                    {driver?.user?.email || user?.email || (locale === 'ar' ? 'سائق التوصيل' : 'Delivery Driver')}
                  </h1>
                  {driver?.license_number && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                      License: {driver.license_number}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <p className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{locale === 'ar' ? 'المركبة:' : 'Vehicle:'}</span>{' '}
                    {driver?.vehicle_details || (locale === 'ar' ? 'شاحنة توصيل خفيفة' : 'Express Delivery Fleet')}
                  </p>
                  {driver?.user?.mobile && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{driver.user.mobile}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Availability Status Segmented Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {locale === 'ar' ? 'حالة التوفر:' : 'Dispatch Status:'}
              </span>

              <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                {[
                  { id: 'AVAILABLE', label_en: 'Available', label_ar: 'متاح للطلب' },
                  { id: 'BUSY', label_en: 'Busy', label_ar: 'في مهمة' },
                  { id: 'OFFLINE', label_en: 'Offline', label_ar: 'غير متصل' },
                ].map((status) => {
                  const isActive = driver?.availability_status === status.id;
                  let activeClass = '';
                  if (isActive) {
                    if (status.id === 'AVAILABLE') {
                      activeClass = 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-extrabold';
                    } else if (status.id === 'BUSY') {
                      activeClass = 'bg-amber-500 text-white shadow-md shadow-amber-500/30 font-extrabold';
                    } else {
                      activeClass = 'bg-slate-700 text-white shadow-md font-extrabold';
                    }
                  } else {
                    activeClass = 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold';
                  }

                  return (
                    <button
                      key={status.id}
                      onClick={() => handleUpdateAvailability(status.id)}
                      className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${activeClass}`}
                    >
                      {locale === 'ar' ? status.label_ar : status.label_en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time GPS Tracker Banner */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                activeDeliveryId
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <Navigation className={`w-5 h-5 ${activeDeliveryId ? 'animate-spin text-emerald-600' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {locale === 'ar' ? 'بث الإحداثيات المباشر (GPS)' : 'Live Geolocation Broadcast'}
                </span>
                {activeDeliveryId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    LIVE STREAMING
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{gpsStatus}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              {activeDeliveryId
                ? (locale === 'ar'
                    ? 'يتم مشاركة الموقع مع العميل والإدارة في الوقت الفعلي'
                    : 'Location sharing active with Customer & Admin')
                : (locale === 'ar'
                    ? 'سيبدأ البث تلقائياً عند بدء التوصيل'
                    : 'Streams automatically when Out for Delivery')}
            </span>
          </div>
        </div>

        {/* Metric Summary Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {locale === 'ar' ? 'إجمالي الطلبات المسندة' : 'Total Assigned'}
              </span>
              <p className="text-2xl font-black text-slate-900">{deliveries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {locale === 'ar' ? 'الطلبات النشطة' : 'Active Runs'}
              </span>
              <p className="text-2xl font-black text-amber-600">{activeDeliveries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {locale === 'ar' ? 'الطلبات المكتملة' : 'Completed Deliveries'}
              </span>
              <p className="text-2xl font-black text-[#05442e]">{completedDeliveries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-[#05442e] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#05A764]" />
            </div>
          </div>
        </div>

        {/* Assigned Orders Section with Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                {locale === 'ar' ? 'مهام التوصيل' : 'Delivery Runs'}
              </h2>
            </div>

            {/* Tabs for Active Deliveries vs Delivery History */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setDeliveryTab('active')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  deliveryTab === 'active'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-[#05A764]" />
                <span>{locale === 'ar' ? 'الطلبات النشطة' : 'Active Orders'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {activeDeliveries.length}
                </span>
              </button>

              <button
                onClick={() => setDeliveryTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  deliveryTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === 'ar' ? 'سجل التوصيل' : 'Delivery History'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                  {completedDeliveries.length}
                </span>
              </button>
            </div>
          </div>

          {displayedDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#05A764] flex items-center justify-center mx-auto border border-emerald-200">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {deliveryTab === 'active'
                  ? locale === 'ar'
                    ? 'لا توجد طلبات نشطة مسندة حالياً'
                    : 'No Active Delivery Runs Assigned'
                  : locale === 'ar'
                  ? 'لا يوجد سجل توصيل سابق'
                  : 'No Completed Delivery History Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {deliveryTab === 'active'
                  ? locale === 'ar'
                    ? 'ابقَ في حالة "متاح للطلب" لاستقبال مهام التوصيل الجديدة من لوحة التحكم.'
                    : 'Keep your status set to "Available" to receive incoming dispatch orders automatically.'
                  : locale === 'ar'
                  ? 'ستظهر هنا جميع الطلبات التي قمت بتوصيلها بنجاح.'
                  : 'Completed orders and customer deliveries will be archived here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedDeliveries.map((del) => {
                const order = del.order;
                const status = del.status;

                let statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {status.replace(/_/g, ' ')}
                  </span>
                );

                if (status === 'DRIVER_ASSIGNED') {
                  statusBadge = (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {locale === 'ar' ? 'طلب جديد مسند' : 'New Assignment'}
                    </span>
                  );
                } else if (status === 'DRIVER_ACCEPTED') {
                  statusBadge = (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                      {locale === 'ar' ? 'تم القبول' : 'Accepted'}
                    </span>
                  );
                } else if (status === 'OUT_FOR_DELIVERY') {
                  statusBadge = (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                      {locale === 'ar' ? 'جاري التوصيل' : 'Out For Delivery'}
                    </span>
                  );
                } else if (status === 'ARRIVED') {
                  statusBadge = (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {locale === 'ar' ? 'وصل إلى الموقع' : 'Arrived at Location'}
                    </span>
                  );
                } else if (status === 'DELIVERED') {
                  statusBadge = (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {locale === 'ar' ? 'تم التوصيل' : 'Delivered'}
                    </span>
                  );
                }

                const customerPhone = order?.address?.phone || order?.customer?.user?.mobile;

                return (
                  <div
                    key={del.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header: Order Number, Status, Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-lg text-slate-900">
                            {locale === 'ar' ? `طلب #${order?.order_number}` : `Order #${order?.order_number}`}
                          </span>
                          {statusBadge}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {order?.customer?.first_name} {order?.customer?.last_name}{' '}
                            {order?.customer?.user?.email && `• ${order.customer.user.email}`}
                          </span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-semibold text-slate-400 block">
                          {locale === 'ar' ? 'إجمالي الطلب' : 'Grand Total'}
                        </span>
                        <span className="text-xl font-black text-[#05442e]">
                          {parseFloat(order?.grand_total || 0).toFixed(2)} SAR
                        </span>
                      </div>
                    </div>

                    {/* Destination Address Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">{order?.address?.full_name}</p>
                          <p className="text-slate-600">
                            {order?.address?.address_line}, {order?.address?.area}, {order?.address?.city}
                          </p>
                          {customerPhone && (
                            <p className="text-slate-500 font-medium flex items-center gap-1 pt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{customerPhone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Communication & Navigation Actions */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                        {customerPhone && (
                          <a
                            href={`tel:${customerPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#05A764]" />
                            <span>{locale === 'ar' ? 'اتصال' : 'Call'}</span>
                          </a>
                        )}

                        <button
                          onClick={() => openNavigation(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5 text-blue-600" />
                          <span>{locale === 'ar' ? 'الملاحة' : 'Navigate'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Delivery Workflow Action Controls & Order Details Modal Trigger */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {status === 'DRIVER_ASSIGNED' && (
                          <button
                            onClick={() => handleAcceptDelivery(del.id)}
                            className="px-5 py-2.5 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{locale === 'ar' ? 'قبول مسار التوصيل' : 'Accept Delivery Run'}</span>
                          </button>
                        )}

                        {status === 'DRIVER_ACCEPTED' && (
                          <button
                            onClick={() => handleStatusUpdate(del.id, 'OUT_FOR_DELIVERY')}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>
                              {locale === 'ar'
                                ? 'بدء التوصيل (خرج للتوصيل)'
                                : 'Start Delivery (Out For Delivery)'}
                            </span>
                          </button>
                        )}

                        {status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleStatusUpdate(del.id, 'ARRIVED')}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>
                              {locale === 'ar'
                                ? 'وصلت إلى موقع العميل'
                                : 'Mark as Arrived at Customer Location'}
                            </span>
                          </button>
                        )}

                        {status === 'ARRIVED' && (
                          <button
                            onClick={() => {
                              setCompletionConfirmDelivery(del);
                              setCompletionNotes('');
                            }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {locale === 'ar'
                                ? 'إتمام التوصيل وإصدار الفاتورة'
                                : 'Complete Delivery & Issue ZATCA Invoice'}
                            </span>
                          </button>
                        )}

                        {['OUT_FOR_DELIVERY', 'ARRIVED'].includes(status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFailureModalDelivery(del);
                              setCompletionNotes('');
                            }}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'تعذر التوصيل' : 'Delivery Issue'}</span>
                          </button>
                        )}

                        {status === 'DELIVERY_FAILED' && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>{locale === 'ar' ? 'تعذر التوصيل' : 'Delivery Failed / Issue Reported'}</span>
                          </div>
                        )}

                        {status === 'DELIVERED' && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-[#05A764]" />
                            <span>
                              {locale === 'ar' ? 'تم اكتمال التوصيل بنجاح' : 'Delivery Completed Successfully'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Full Order Details Button */}
                      <button
                        onClick={() => setSelectedOrderDetails(del)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                        <span>{locale === 'ar' ? 'تفاصيل الطلب والمنتجات' : 'View Order Details'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        © {new Date().getFullYear()} Falcon Express Logistics • Driver Dispatch & Delivery Operations
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Full Order Details & Items Modal                     */}
      {/* ------------------------------------------------------------- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl relative overflow-hidden my-8 space-y-6">
            <div className="h-1.5 bg-gradient-to-r from-[#05442e] via-[#05A764] to-[#DA9628]" />

            {/* Modal Header */}
            <div className="px-6 sm:px-8 pt-2 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-slate-900">
                    Order #{selectedOrderDetails.order?.order_number}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedOrderDetails.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(selectedOrderDetails.order?.createdAt).toLocaleDateString()} •{' '}
                  {new Date(selectedOrderDetails.order?.createdAt).toLocaleTimeString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 sm:px-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="w-4 h-4 text-[#05A764]" />
                    <span>Customer Details</span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {selectedOrderDetails.order?.customer?.first_name}{' '}
                    {selectedOrderDetails.order?.customer?.last_name}
                  </p>
                  <p className="text-slate-500">{selectedOrderDetails.order?.customer?.user?.email}</p>
                  <p className="text-slate-500 font-mono">
                    {selectedOrderDetails.order?.address?.phone ||
                      selectedOrderDetails.order?.customer?.user?.mobile}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {selectedOrderDetails.order?.address?.full_name}
                  </p>
                  <p className="text-slate-600">
                    {selectedOrderDetails.order?.address?.address_line},{' '}
                    {selectedOrderDetails.order?.address?.area}
                  </p>
                  <p className="text-slate-500 font-bold">{selectedOrderDetails.order?.address?.city}</p>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#05A764]" />
                    <span>Order Items ({(selectedOrderDetails.order?.items || []).length})</span>
                  </h4>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  {(selectedOrderDetails.order?.items || []).map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.product?.image_url ? (
                          <img
                            src={getImageUrl(item.product.image_url)}
                            alt={item.product?.name_en || 'Product'}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {item.product?.name_en || item.product_name || 'Grocery Item'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Qty: <span className="font-bold text-slate-700">{item.quantity}</span> ×{' '}
                            {parseFloat(item.unit_price || 0).toFixed(2)} SAR
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-extrabold text-slate-900">
                        {(parseFloat(item.unit_price || 0) * (item.quantity || 1)).toFixed(2)} SAR
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{parseFloat(selectedOrderDetails.order?.subtotal || 0).toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>{parseFloat(selectedOrderDetails.order?.delivery_fee || 0).toFixed(2)} SAR</span>
                </div>
                {selectedOrderDetails.order?.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ZATCA VAT (15%)</span>
                    <span>{parseFloat(selectedOrderDetails.order?.tax_amount || 0).toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-[#05442e] pt-2 border-t border-emerald-200">
                  <span>Grand Total</span>
                  <span>{parseFloat(selectedOrderDetails.order?.grand_total || 0).toFixed(2)} SAR</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-8 pb-6 pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => openNavigation(selectedOrderDetails.order)}
                className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Navigate in Google Maps</span>
              </button>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Delivery Completion Confirmation Modal               */}
      {/* ------------------------------------------------------------- */}
      {completionConfirmDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl relative overflow-hidden space-y-6">
            <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-[#05A764]" />

            <div className="px-6 pt-2 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#05A764] border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {locale === 'ar' ? 'تأكيد إتمام التوصيل' : 'Confirm Delivery Completion'}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? `أنت على وشك تحديد الطلب #${completionConfirmDelivery.order?.order_number} كمكتمل وإصدار فاتورة ZATCA الرسمية.`
                  : `You are about to mark Order #${completionConfirmDelivery.order?.order_number} as DELIVERED and generate the ZATCA e-invoice.`}
              </p>
            </div>

            <div className="px-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">
                    {completionConfirmDelivery.order?.customer?.first_name}{' '}
                    {completionConfirmDelivery.order?.customer?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Collected:</span>
                  <span className="font-extrabold text-[#05442e]">
                    {parseFloat(completionConfirmDelivery.order?.grand_total || 0).toFixed(2)} SAR
                  </span>
                </div>
              </div>

              {/* Customer Handover PIN / OTP Verification */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{locale === 'ar' ? 'رمز تحقق التسليم (PIN من العميل)' : 'Customer Handover PIN / OTP'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    4-Digit PIN Required
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryOtp}
                    onChange={(e) => {
                      setDeliveryOtp(e.target.value);
                      setOtpError('');
                    }}
                    placeholder="Enter 4-digit PIN (e.g. 4821)"
                    className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                {otpError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 animate-shake">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  {locale === 'ar'
                    ? 'اطلب رمز PIN المكون من 4 أرقام المعروض على شاشة تتبع العميل لتأكيد التسليم.'
                    : 'Ask the recipient for the 4-digit PIN shown on their order tracking screen.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'ملاحظات إثبات التسليم (اختياري)' : 'Proof of Delivery Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Handed over to recipient in person at doorstep"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCompletionConfirmDelivery(null);
                  setOtpError('');
                  setDeliveryOtp('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={submittingStatus}
                onClick={() => {
                  if (!deliveryOtp.trim()) {
                    setOtpError(locale === 'ar' ? 'يرجى إدخال رمز PIN' : 'Please enter the 4-digit customer PIN');
                    return;
                  }
                  handleStatusUpdate(completionConfirmDelivery.id, 'DELIVERED', { otp: deliveryOtp });
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {submittingStatus ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'تأكيد التسليم' : 'Verify PIN & Complete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: Failed Delivery Reporting Modal                      */}
      {/* ------------------------------------------------------------- */}
      {failureModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl relative overflow-hidden space-y-6">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-amber-500" />

            <div className="px-6 pt-2 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {locale === 'ar' ? 'الإبلاغ عن تعذر التوصيل' : 'Report Delivery Issue'}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? `أنت على وشك تسجيل عدم القدرة على إكمال توصيل الطلب #${failureModalDelivery.order?.order_number}.`
                  : `Record operational reason for why Order #${failureModalDelivery.order?.order_number} could not be delivered.`}
              </p>
            </div>

            <div className="px-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'سبب تعذر التوصيل' : 'Reason for Non-Delivery'}
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                >
                  <option value="Customer unreachable / Phone not answered">Customer unreachable / Phone not answered</option>
                  <option value="Incorrect or incomplete delivery address">Incorrect or incomplete delivery address</option>
                  <option value="Customer refused package acceptance">Customer refused package acceptance</option>
                  <option value="Customer requested reschedule">Customer requested reschedule</option>
                  <option value="Location inaccessible / gate restricted">Location inaccessible / gate restricted</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Operational Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Details of attempts to reach customer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFailureModalDelivery(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={submittingStatus}
                onClick={() =>
                  handleStatusUpdate(failureModalDelivery.id, 'DELIVERY_FAILED', {
                    failure_reason: failureReason,
                  })
                }
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {submittingStatus ? 'Submitting...' : (locale === 'ar' ? 'تأكيد تعذر التوصيل' : 'Submit Delivery Issue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Driver Profile & Password Management Modal           */}
      {/* ------------------------------------------------------------- */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl relative overflow-hidden space-y-6">
            <div className="h-1.5 bg-gradient-to-r from-[#05442e] via-[#05A764] to-[#DA9628]" />

            {/* Modal Header */}
            <div className="px-6 pt-2 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#05442e] text-white flex items-center justify-center">
                  <User className="w-5 h-5 text-[#05A764]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {locale === 'ar' ? 'الملف الشخصي والأمان' : 'Driver Profile & Security'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Manage your credentials & contact info</p>
                </div>
              </div>

              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab */}
            <div className="px-6">
              <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProfileTab('profile')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    profileTab === 'profile'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {locale === 'ar' ? 'بيانات السائق' : 'Contact Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('password')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    profileTab === 'password'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                </button>
              </div>
            </div>

            {/* Tab 1: Profile Form */}
            {profileTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="px-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Driver License (Locked)</label>
                  <input
                    type="text"
                    disabled
                    value={driver?.license_number || 'N/A'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">License number is managed by Admin.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Driver Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Vehicle Details</label>
                  <input
                    type="text"
                    value={profileForm.vehicle_details}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, vehicle_details: e.target.value })
                    }
                    placeholder="e.g. Toyota Hilux (Plate: 8821-ABC)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>

                <div className="pb-6 pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {profileSubmitting ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Change Password Form */}
            {profileTab === 'password' && (
              <form onSubmit={handleChangePassword} className="px-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Current Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="pb-6 pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {profileSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
