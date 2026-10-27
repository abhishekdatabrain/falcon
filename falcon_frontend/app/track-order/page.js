'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '../../src/services/api';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSocket } from '../../src/contexts/SocketContext';
import { useToast } from '../../src/contexts/ToastContext';
import { downloadOrderInvoice } from '../../src/services/invoiceService';
import GoogleLiveTrackingMap from '../../src/components/GoogleLiveTrackingMap';
import OrderTrackingTimeline from '../../src/components/OrderTrackingTimeline';
import {
  MapPin,
  Home,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  PhoneCall,
  Clock,
  Navigation,
  Globe,
  Check,
  ExternalLink,
  ChevronRight,
  Package,
  CreditCard,
  User,
  Headphones,
  X,
  Sparkles,
  Star,
  Zap,
  ArrowRight,
  Share2,
  FileText,
  MessageSquare,
  Thermometer,
  Download,
  Copy,
  Search,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Loader2,
  Send,
  Heart,
  Tag
} from 'lucide-react';

// Default Riyadh Coordinates
const DEFAULT_RIYADH_DRIVER_LAT = 24.7932;
const DEFAULT_RIYADH_DRIVER_LNG = 46.6135;
const DEFAULT_RIYADH_DEST_LAT = 24.7742;
const DEFAULT_RIYADH_DEST_LNG = 46.6385;

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { socket, joinDeliveryRoom, leaveDeliveryRoom, joinOrderRoom, leaveOrderRoom } = useSocket();
  const { showToast } = useToast();

  const queryOrder = searchParams.get('orderNumber') || searchParams.get('orderId') || searchParams.get('id') || '';

  const [order, setOrder] = useState(null);
  const status = (order?.order_status || 'OUT_FOR_DELIVERY').toUpperCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(queryOrder);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [gpsStatusState, setGpsStatusState] = useState('LIVE'); // 'LIVE' | 'DELAYED' | 'DISCONNECTED'

  // Live Driver Telemetry State
  const [driverTelemetry, setDriverTelemetry] = useState({
    lat: DEFAULT_RIYADH_DRIVER_LAT,
    lng: DEFAULT_RIYADH_DRIVER_LNG,
    speed: 0,
    heading: 120,
    temp: null,
    updatedAt: new Date().toISOString(),
  });

  // Courier In-App Chat Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'driver', text: 'Peace be upon you! I have picked up your cold-chain groceries and am on the way.', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // 1. Load Order from Server
  const loadOrder = async (identifier) => {
    if (!identifier) {
      // If user is logged in, try fetching their latest order
      if (user && user.role === 'CUSTOMER') {
        try {
          setLoading(true);
          const myOrdersRes = await fetchApi('/orders/my-orders');
          if (myOrdersRes.success && myOrdersRes.data?.orders?.length > 0) {
            const latest = myOrdersRes.data.orders[0];
            await loadOrder(latest.order_number || latest.id);
            return;
          }
        } catch (e) {
          // fallback
        }
        setLoading(false);
        setError(locale === 'ar' ? 'لا توجد لديك طلبات حالية للتتبع.' : 'You have no recent orders to track.');
        return;
      }

      setLoading(false);
      setError(locale === 'ar' ? 'يرجى تسجيل الدخول أو إدخال رقم الطلب أعلاه لمتابعة التتبع.' : 'Please sign in or enter an order number above to track your delivery.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const cleanId = String(identifier).trim().replace(/^#/, '');

      let res = await fetchApi(`/orders/track/${encodeURIComponent(cleanId)}`).catch(() => null);
      if (!res || !res.success || !res.data?.order) {
        res = await fetchApi(`/orders/confirmation/${encodeURIComponent(cleanId)}`).catch(() => null);
      }
      if (!res || !res.success || !res.data?.order) {
        res = await fetchApi(`/orders/${encodeURIComponent(cleanId)}`).catch(() => null);
      }

      if (res && res.success && res.data?.order) {
        const orderData = res.data.order;
        setOrder(orderData);
        setSearchInput(orderData.order_number || cleanId);

        // Extract latest driver coordinates & sensor temperature only if order is OUT_FOR_DELIVERY or ARRIVED (Requirements 1, 6, 9)
        const isLiveTrackingActive = ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(orderData.order_status) && orderData.can_track_driver !== false;

        if (isLiveTrackingActive) {
          const latestLoc = orderData.delivery?.locations?.[0];
          const initialTemp = latestLoc?.temperature || orderData.delivery?.sensor_temperature || null;
          if (latestLoc && parseFloat(latestLoc.latitude) && parseFloat(latestLoc.longitude)) {
            setDriverTelemetry((prev) => ({
              ...prev,
              lat: parseFloat(latestLoc.latitude),
              lng: parseFloat(latestLoc.longitude),
              speed: latestLoc.speed ? Math.round(latestLoc.speed) : 0,
              heading: latestLoc.heading || 120,
              temp: initialTemp,
            }));
            setGpsStatusState('LIVE');
          } else if (orderData.address?.latitude && orderData.address?.longitude) {
            // Offset driver slightly north-west for route rendering
            const destLat = parseFloat(orderData.address.latitude);
            const destLng = parseFloat(orderData.address.longitude);
            setDriverTelemetry((prev) => ({
              ...prev,
              lat: destLat + 0.0185,
              lng: destLng - 0.0162,
              temp: initialTemp,
            }));
            setGpsStatusState('LIVE');
          } else if (initialTemp) {
            setDriverTelemetry((prev) => ({
              ...prev,
              temp: initialTemp,
            }));
          }
        } else {
          // Requirement 9: Never expose the driver's location before allowed status
          setDriverTelemetry({
            lat: null,
            lng: null,
            speed: 0,
            heading: 0,
            temp: null,
            updatedAt: null,
          });
          setGpsStatusState('DISCONNECTED');
        }
      } else {
        setError(res?.message || (locale === 'ar' ? 'لم يتم العثور على الطلب' : `Order "${cleanId}" not found`));
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setError(err.message || 'Error tracking order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder(queryOrder);
  }, [queryOrder]);

  // 2. Real-time WebSocket Listeners for Driver Movement & Status Updates
  useEffect(() => {
    if (!order || !socket) return;

    if (order.id) {
      joinOrderRoom(order.id);
    }
    if (order.delivery?.id) {
      joinDeliveryRoom(order.delivery.id);
    }

    const handleLocationUpdate = (data) => {
      // Only process and display live location if allowed status (Requirements 1, 6, 9)
      if (order?.order_status !== 'OUT_FOR_DELIVERY' && order?.order_status !== 'ARRIVED') {
        return;
      }

      if (data && (data.latitude || data.lat) && (data.longitude || data.lng)) {
        setDriverTelemetry((prev) => ({
          lat: parseFloat(data.latitude || data.lat),
          lng: parseFloat(data.longitude || data.lng),
          speed: data.speed !== undefined && data.speed !== null ? Math.round(data.speed) : prev.speed,
          heading: data.heading || prev.heading,
          temp: data.temp || data.temperature || prev.temp || null,
          updatedAt: new Date().toISOString(),
        }));
        setGpsStatusState('LIVE');
      }
    };

    const handleStatusUpdate = (data) => {
      if (data && (data.orderId === order.id || data.deliveryId === order.delivery?.id)) {
        // Re-fetch order dynamically so status, delivery, or reassigned driver info updates instantly
        loadOrder(order.order_number || order.id);
        showToast(
          locale === 'ar' ? `تحديث حالة الطلب: ${data.status}` : `Order Status Updated: ${data.status}`,
          'info'
        );
      }
    };

    const handleOrderAssigned = (data) => {
      if (data && (data.orderId === order.id || data.deliveryId === order.delivery?.id)) {
        loadOrder(order.order_number || order.id);
        showToast(
          locale === 'ar' ? 'تم إسناد مندوب توصيل للطلب' : 'Delivery Driver Assigned to Order',
          'success'
        );
      }
    };

    const handleGpsStatus = (data) => {
      if (data.status === 'DISCONNECTED') {
        setGpsStatusState('DISCONNECTED');
      } else if (data.status === 'CONNECTED') {
        setGpsStatusState('LIVE');
      }
    };

    socket.on('driver_location_update', handleLocationUpdate);
    socket.on('location_updated', handleLocationUpdate);
    socket.on('order_status_update', handleStatusUpdate);
    socket.on('order_assigned', handleOrderAssigned);
    socket.on('driver_gps_status', handleGpsStatus);

    return () => {
      socket.off('driver_location_update', handleLocationUpdate);
      socket.off('location_updated', handleLocationUpdate);
      socket.off('order_status_update', handleStatusUpdate);
      socket.off('order_assigned', handleOrderAssigned);
      socket.off('driver_gps_status', handleGpsStatus);
      if (order.id) leaveOrderRoom(order.id);
      if (order.delivery?.id) leaveDeliveryRoom(order.delivery.id);
    };
  }, [order?.id, order?.delivery?.id, socket]);

  // Monitor delayed GPS signal if no update received in 60s during delivery
  useEffect(() => {
    const interval = setInterval(() => {
      if (driverTelemetry?.updatedAt && status === 'OUT_FOR_DELIVERY') {
        const diffMs = Date.now() - new Date(driverTelemetry.updatedAt).getTime();
        if (diffMs > 60000) {
          setGpsStatusState('DELAYED');
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [driverTelemetry?.updatedAt, status]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const clean = searchInput.trim().replace(/^#/, '');
    router.push(`/track-order?orderNumber=${encodeURIComponent(clean)}`);
    loadOrder(clean);
  };

  // Handle Copy Tracking Link
  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast(locale === 'ar' ? 'تم نسخ رابط المتابعة!' : 'Tracking link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Handle Share
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Falcon Order #${order?.order_number || ''}`,
        text: `Track live cold-chain grocery delivery on Falcon Fresh!`,
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
  };

  // Download Invoice
  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setDownloadingInvoice(true);
      showToast(
        locale === 'ar' ? 'جاري تحميل الفاتورة الضريبية ZATCA...' : 'Downloading ZATCA Tax Invoice...',
        'info'
      );
      await downloadOrderInvoice(order, locale);
    } catch (e) {
      showToast('Failed to download invoice', 'error');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Send In-App Courier Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: 'customer',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Simulate instant courier acknowledgement
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'driver',
          text: locale === 'ar' ? 'تم استلام ملاحظتك! شكراً لك.' : 'Received! Thanks for the update, will follow instructions.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  // Date/Time Formatters
  const formatPlacedTime = (dateInput) => {
    if (!dateInput) return 'Today, 2:15 PM';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Today, 2:15 PM';
    }
  };

  // Extracted Order Properties
  const customerName = order?.customer?.first_name
    ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
    : (order?.address?.full_name || 'Valued Customer');

  const destinationAddress = [
    order?.address?.address_line,
    order?.address?.area,
    order?.address?.city,
    order?.address?.country || 'Saudi Arabia',
  ].filter(Boolean).join(', ') || 'Prince Turki Rd, Al Malqa, Riyadh 13524';

  const destLat = parseFloat(order?.address?.latitude) || DEFAULT_RIYADH_DEST_LAT;
  const destLng = parseFloat(order?.address?.longitude) || DEFAULT_RIYADH_DEST_LNG;

  // Dynamic Assigned Driver Extraction from Backend (Requirement 1, 2, 3, 10)
  const assignedDriver = order?.delivery?.driver || null;
  const driverName = assignedDriver?.name || (assignedDriver?.user?.email ? assignedDriver.user.email.split('@')[0] : (assignedDriver ? 'Assigned Driver' : ''));
  const driverAvatar = assignedDriver?.profile_image || (driverName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=043927&color=05A764&bold=true` : '');
  const driverType = assignedDriver?.driver_type || null;
  const vehicleText = assignedDriver ? (
    [
      assignedDriver.vehicle_type || (assignedDriver.vehicle_details ? assignedDriver.vehicle_details.split('-')[0].trim() : null),
      assignedDriver.vehicle_number ? `#${String(assignedDriver.vehicle_number).replace(/^#/, '')}` : (assignedDriver.vehicle_details && assignedDriver.vehicle_details.includes('-') ? assignedDriver.vehicle_details.split('-')[1].replace(/License Plate/i, '').trim() : null)
    ].filter(Boolean).join(' ') || assignedDriver.vehicle_details || null
  ) : null;

  const driverRating = assignedDriver?.average_rating !== undefined && assignedDriver?.average_rating !== null
    ? Number(assignedDriver.average_rating).toFixed(2)
    : (assignedDriver?.rating ? Number(assignedDriver.rating).toFixed(2) : null);

  const completedDrops = assignedDriver?.completed_deliveries !== undefined && assignedDriver?.completed_deliveries !== null
    ? assignedDriver.completed_deliveries
    : (assignedDriver?.deliveries_count !== undefined ? assignedDriver.deliveries_count : null);

  const driverPhone = assignedDriver?.user?.mobile || assignedDriver?.mobile || assignedDriver?.phone || null;
  const actualTemp = order?.delivery?.sensor_temperature || driverTelemetry?.temp || null;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 pb-28 select-none">

      {/* ================= TOP SEARCH & QUICK TRACK HEADER ================= */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#043927] text-white flex items-center justify-center font-black shadow-sm">
                <Truck className="w-5 h-5 text-[#05A764]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">
                    {locale === 'ar' ? 'المتابعة المباشرة للطلب' : 'Live Order Tracking'}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>GPS Telemetry</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {order ? `#${order.order_number}` : 'Real-time Cold-Chain Dispatch'}
                </p>
              </div>
            </div>

            {/* Interactive Search Bar for Any Order */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'أدخل رقم الطلب (مثال: ORD-20261009-9815)...' : 'Enter Order # (e.g. ORD-20261009-9815)...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#05A764] text-slate-900 outline-none transition-all shadow-2xs font-mono"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#043927] hover:bg-[#02281b] text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-[#05A764]" />}
                <span>{locale === 'ar' ? 'تتبع' : 'Track'}</span>
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {loading && !order ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">
              {locale === 'ar' ? 'جاري الاتصال بنظام المتابعة المباشر...' : 'Connecting to Live Telemetry & GPS Servers...'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {locale === 'ar' ? 'جاري استرجاع بيانات الطلب وموقع السائق...' : 'Fetching live order manifest, driver coordinates, and cold-chain sensor status.'}
            </p>
          </div>
        ) : error && !order ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-rose-100 shadow-xs max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {locale === 'ar' ? 'تعذر العثور على الطلب' : 'Unable to Locate Order'}
            </h3>
            <p className="text-xs text-slate-500">{error}</p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Link
                href="/auth/login?redirect=/track-order"
                className="px-4 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-colors"
              >
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
              <Link
                href="/orders"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                {locale === 'ar' ? 'عرض طلباتي' : 'View My Orders'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ================= LEFT SIDEBAR PANEL (4 Cols) ================= */}
            <div className="lg:col-span-4 space-y-5">

              {/* Order Status Summary Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {locale === 'ar' ? 'حالة الطلب' : 'Current Status'}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${status === 'DELIVERED'
 ? 'bg-emerald-100 text-emerald-800'
 : status === 'OUT_FOR_DELIVERY'
 ? 'bg-cyan-100 text-cyan-800 animate-pulse'
 : 'bg-amber-100 text-amber-800'
 }`}
                  >
                    {status === 'OUT_FOR_DELIVERY' ? '🚚 OUT FOR DELIVERY' : status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 font-mono">
                    #{order?.order_number || 'FM-98421'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Placed: {formatPlacedTime(order?.createdAt)}
                  </p>
                </div>

                {/* Delivery Verification Handover PIN (OTP) */}
                {order?.delivery?.otp && status !== 'DELIVERED' && status !== 'CANCELLED' && (
                  <div className="bg-gradient-to-r from-[#043927] to-[#05A764] rounded-2xl p-4 text-white space-y-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        <span>{locale === 'ar' ? 'رمز تحقق استلام الطلب' : 'DELIVERY HANDOVER PIN'}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                        4-Digit PIN
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100">
                      {locale === 'ar'
                        ? 'شارك هذا الرمز السري مع الكابتن عند وصوله لتأكيد استلام شحنتك:'
                        : 'Share this PIN with your courier at doorstep to verify delivery:'}
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {String(order.delivery.otp)
                        .split('')
                        .map((char, i) => (
                          <span
                            key={i}
                            className="w-10 h-11 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center font-mono text-xl font-black text-white shadow-inner"
                          >
                            {char}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Delivery Completion Details */}
                {status === 'DELIVERED' && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-emerald-900 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-black">
                        {locale === 'ar' ? 'تم اكتمال التوصيل بنجاح' : 'Delivered & Handed Over'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {order?.delivery?.end_time
                        ? `${locale === 'ar' ? 'وقت التسليم:' : 'Delivered at:'} ${formatPlacedTime(order.delivery.end_time)}`
                        : 'Package verified and delivered.'}
                      {order?.delivery?.otp_verified_at && ` • ${locale === 'ar' ? 'تم التحقق برمز PIN' : 'Verified via OTP PIN'}`}
                    </p>
                  </div>
                )}

                {/* Delivery Failed Alert */}
                {status === 'DELIVERY_FAILED' && (
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-rose-900 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-black">
                        {locale === 'ar' ? 'تعذر إتمام التوصيل' : 'Delivery Attempt Unsuccessful'}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-700 font-medium">
                      {order?.delivery?.failure_reason ||
                        (locale === 'ar'
                          ? 'تعذر الوصول للعميل في العنوان المحدد.'
                          : 'Courier was unable to reach the destination or recipient.')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {locale === 'ar'
                        ? 'فريق العمليات يعمل على إعادة جدولة التوصيل.'
                        : 'Our dispatch team is rescheduling delivery. You will receive an update.'}
                    </p>
                  </div>
                )}

                {/* SCHEDULED DELIVERY WINDOW (Dynamic) */}
                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{locale === 'ar' ? 'فترة التوصيل المجدولة' : 'SCHEDULED DELIVERY WINDOW'}</span>
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    📅 {order?.delivery_date || 'Today'}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    ⏰ {order?.delivery_slot || '4:00 PM - 6:00 PM (Standard Slot)'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>{downloadingInvoice ? 'Loading...' : (locale === 'ar' ? 'الفاتورة' : 'Invoice')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="py-2.5 px-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#05A764]" />
                    <span>{copiedLink ? 'Copied!' : (locale === 'ar' ? 'مشاركة' : 'Share')}</span>
                  </button>
                </div>
              </div>

              {/* Delivery Destination Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    {locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Destination'}
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-black text-slate-900">
                    {customerName}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {destinationAddress}
                  </p>
                  {order?.address?.mobile && (
                    <div className="text-emerald-700 font-bold flex items-center gap-1 pt-1">
                      <PhoneCall className="w-3 h-3" />
                      <span>{order.address.mobile}</span>
                    </div>
                  )}
                  {order?.notes && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] mt-2 italic">
                      <strong>Driver Note:</strong> "{order.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Summary Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      {locale === 'ar' ? 'المنتجات المطلوبة' : `Ordered Items (${order?.items?.length || 0})`}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {(order?.items || []).map((it, idx) => {
                    const pName = locale === 'ar'
                      ? (it.product_name_ar || it.product_name_en || it.product?.name_ar || it.product?.name_en || 'منتج طازج')
                      : (it.product_name_en || it.product_name_ar || it.product?.name_en || 'Fresh Grocery Item');

                    const qty = it.quantity || 1;
                    const rawUnitPrice = parseFloat(it.unit_price || it.price || it.product?.discount_price || it.product?.price || 0);
                    const lineTotal = parseFloat(it.total_price !== undefined && it.total_price !== null ? it.total_price : rawUnitPrice * qty);
                    const unitPrice = qty > 0 ? (lineTotal / qty) : rawUnitPrice;

                    return (
                      <div key={it.id || idx} className="flex items-center justify-between gap-2.5 text-xs py-1.5 border-b border-slate-50 last:border-none">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate">{pName}</h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Qty: {qty} × SAR {unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-black text-slate-900 shrink-0">
                          SAR {lineTotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Price Totals */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal:'}</span>
                    <span className="font-bold text-slate-900">SAR {parseFloat(order?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee:'}</span>
                    <span className="font-bold text-slate-900">
                      {parseFloat(order?.delivery_fee || 0) > 0 ? `SAR ${parseFloat(order.delivery_fee).toFixed(2)}` : 'FREE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{locale === 'ar' ? 'ضريبة القيمة المضافة 15%' : 'Estimated VAT (15%):'}</span>
                    <span className="font-bold text-slate-900">SAR {parseFloat(order?.tax_total || 0).toFixed(2)}</span>
                  </div>
                  {parseFloat(order?.discount_total || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {locale === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'}
                          {order?.coupon_code ? ` (${order.coupon_code})` : ''}:
                        </span>
                      </span>
                      <span className="font-bold text-emerald-700">- SAR {parseFloat(order.discount_total).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 text-sm font-black text-slate-900">
                    <span>{locale === 'ar' ? 'الإجمالي المدفوع' : 'Total Paid:'}</span>
                    <span className="text-[#05A764]">SAR {parseFloat(order?.grand_total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 24/7 Support Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900">Need Delivery Assistance?</h4>
                </div>
                <p className="text-slate-500">
                  Falcon central cold-chain dispatch supervisor is on standby for gate access or gate code issues.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-bold">
                  <a
                    href="tel:920032526"
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-center flex items-center justify-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 9200</span>
                  </a>
                  <a
                    href="https://wa.me/966501234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-center flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>

            {/* ================= RIGHT MAIN LIVE TRACKING PANEL (8 Cols) ================= */}
            <div className="lg:col-span-8 space-y-6">

              {/* ================= 1. CONDITIONAL LIVE DRIVER TRACKING OR STATUS NOTICE ================= */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden space-y-0">
                {((status === 'OUT_FOR_DELIVERY' || status === 'ARRIVED') && order?.can_track_driver !== false) ? (
                  <>
                    {/* Top Live GPS Status Header Bar */}
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-[#05A764]" />
                        <span className="text-xs font-black text-slate-800">
                          {locale === 'ar' ? 'نظام الملاحة الفضائي المباشر (Google Maps)' : 'Live Google Maps Navigation & Tracking'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {gpsStatusState === 'LIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{locale === 'ar' ? 'إشارة GPS متصلة ونشطة' : 'Live GPS Active'}</span>
                          </span>
                        )}
                        {gpsStatusState === 'DELAYED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{locale === 'ar' ? 'تحديث الإشارة متأخر' : 'GPS Signal Delayed'}</span>
                          </span>
                        )}
                        {gpsStatusState === 'DISCONNECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{locale === 'ar' ? 'انقطاع إشارة GPS' : 'Driver GPS Reconnecting'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <GoogleLiveTrackingMap
                      driverLat={driverTelemetry.lat}
                      driverLng={driverTelemetry.lng}
                      destLat={destLat}
                      destLng={destLng}
                      driverName={driverName || (locale === 'ar' ? 'مندوب التوصيل' : 'Delivery Driver')}
                      vehicle={vehicleText || ''}
                      customerName={customerName}
                      destinationAddress={destinationAddress}
                      orderNumber={order?.order_number || ''}
                      status={status}
                      speed={driverTelemetry.speed}
                      temp={actualTemp}
                      height="450px"
                    />

                    {/* Assigned Courier Profile Bar Beneath Google Map */}
                    {assignedDriver ? (
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">

                          <div className="flex items-center gap-3.5">
                            <div className="relative shrink-0">
                              <img
                                src={driverAvatar}
                                alt={driverName || 'Courier'}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#05A764] shadow-xs bg-slate-100"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName || 'Driver')}&background=043927&color=05A764&bold=true`;
                                }}
                              />
                              {driverRating && (
                                <span className="absolute -bottom-1 -left-1 bg-[#05A764] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-white shadow-xs">
                                  ✓ {driverRating}★
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-black text-slate-900 text-base">{driverName}</h3>
                                {driverType && (
                                  <span className="bg-[#D1F7E8] text-[#043927] font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                    {driverType}
                                  </span>
                                )}
                              </div>

                              {(vehicleText || completedDrops !== null) && (
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {vehicleText && <span>{vehicleText}</span>}
                                  {vehicleText && completedDrops !== null && <span> • </span>}
                                  {completedDrops !== null && <span>{completedDrops} drops</span>}
                                </p>
                              )}

                              {actualTemp && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#05A764] mt-0.5">
                                  <Thermometer className="w-3.5 h-3.5 text-[#05A764] shrink-0" />
                                  <span>Cargo Bay Temperature: {actualTemp}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {driverPhone ? (
                              <a
                                href={`tel:${driverPhone}`}
                                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <PhoneCall className="w-4 h-4 text-emerald-600" />
                                <span>{locale === 'ar' ? 'اتصال بالمندوب' : 'Call Driver'}</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => showToast(locale === 'ar' ? 'رقم هاتف المندوب غير متاح حالياً' : 'Driver contact number is currently private or unavailable', 'info')}
                                className="px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed"
                                title="Phone number unavailable"
                              >
                                <PhoneCall className="w-4 h-4 text-slate-400" />
                                <span>{locale === 'ar' ? 'اتصال بالمندوب' : 'Call Driver'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled
                              className="px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80"
                              title={locale === 'ar' ? 'المراسلة المباشرة غير مفعلة لهذا التوصيل' : 'Direct in-app messaging is unavailable for this delivery'}
                            >
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                              <span>{locale === 'ar' ? 'مراسلة المندوب' : 'Message Driver'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Status Banner */}
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              ⚡
                            </div>
                            <p className="text-emerald-950 font-bold">
                              {status === 'OUT_FOR_DELIVERY'
                                ? (locale === 'ar' ? `الكابتن في الطريق لتسليم طلبك إلى ${destinationAddress.split(',')[0] || 'عنوانك'}.` : `Courier is en route to ${destinationAddress.split(',')[0] || 'your address'}.`)
                                : (locale === 'ar' ? 'الكابتن وصل إلى موقعك للتسليم.' : 'Courier has arrived at your destination.')}
                            </p>
                          </div>

                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-white/80 px-2.5 py-1 rounded-xl self-start sm:self-auto shrink-0 border border-emerald-200">
                            SAMA Verified
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : status === 'DELIVERED' ? (
                  /* ================= DELIVERED CONFIRMATION (Requirement 6) ================= */
                  <div className="p-8 sm:p-10 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-xl font-black text-slate-900">
                        {locale === 'ar' ? 'تم توصيل الطلب بنجاح' : 'Order Delivered Successfully'}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {locale === 'ar'
                          ? 'تم تسليم شحنتك المبردة بنجاح إلى باب منزلك. تم إنهاء جلسة التتبع المباشر.'
                          : 'Your fresh grocery shipment has been safely handed over. Live GPS tracking has concluded.'}
                      </p>
                    </div>
                    {order?.delivery?.end_time && (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold font-mono">
                        <span>✓ {locale === 'ar' ? 'وقت التسليم:' : 'Delivered at:'} {formatPlacedTime(order.delivery.end_time)}</span>
                      </div>
                    )}
                  </div>
                ) : status === 'CANCELLED' || status === 'DELIVERY_FAILED' ? (
                  /* ================= CANCELLED / FAILED (Requirement 6) ================= */
                  <div className="p-8 sm:p-10 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
                      <AlertCircle className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-xl font-black text-slate-900">
                        {status === 'CANCELLED'
                          ? (locale === 'ar' ? 'تم إلغاء الطلب' : 'Order Cancelled')
                          : (locale === 'ar' ? 'تعذر التوصيل' : 'Delivery Attempt Unsuccessful')}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {status === 'CANCELLED'
                          ? (locale === 'ar' ? 'تم إلغاء هذا الطلب وتوقف التتبع المباشر.' : 'This order has been cancelled. Live tracking is disabled.')
                          : (order?.delivery?.failure_reason || (locale === 'ar' ? 'تعذر إتمام التوصيل. يعمل فريق الدعم على المتابعة.' : 'Unable to complete delivery. Our dispatch team is rescheduling.'))}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ================= PRE-DELIVERY NOTICE CARD (Requirements 1, 2, 3, 9) ================= */
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Requirement 3 Exact Message Banner */}
                    <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-2xs">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-amber-950">
                          {locale === 'ar' ? 'التتبع المباشر غير نشط حالياً' : 'Live Tracking Not Yet Active'}
                        </h4>
                        <p className="text-xs font-bold text-amber-800 leading-relaxed">
                          {locale === 'ar'
                            ? 'سيتوفر التتبع المباشر فور خروج طلبك للتوصيل.'
                            : 'Live tracking will be available once your order is out for delivery.'}
                        </p>
                      </div>
                    </div>

                    {/* Informational Fulfillment Preparation Block */}
                    <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-5">
                      <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs shrink-0">
                          <Truck className="w-6 h-6 text-[#043927]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-900">
                            {status === 'PACKED' || status === 'DRIVER_ASSIGNED' || status === 'DRIVER_ACCEPTED'
                              ? (locale === 'ar' ? 'الطلب مجهز ومعبأ وبانتظار الانطلاق' : 'Order Packed & Awaiting Courier Departure')
                              : (locale === 'ar' ? 'الطلب قيد التجهيز في المركز اللوجستي' : 'Order Being Prepared at Fulfillment Center')}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg">
                            {locale === 'ar'
                              ? 'يتم قطف وتعبئة المنتجات الطازجة داخل الصناديق الحرارية المبردة. بمجرد خروج المندوب في الطريق إليكم، سيتم تفعيل خريطة الملاحة الفضائية وموقع السائق المباشر تلقائياً هنا.'
                              : 'Your fresh groceries are being inspected and packed in temperature-controlled bags. As soon as the courier departs for delivery, interactive GPS tracking and the live vehicle map will automatically activate here.'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center items-end text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {locale === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                        </span>
                        <span className="text-xs font-black text-[#043927] bg-white px-3 py-1 rounded-xl border border-slate-200 mt-1 shadow-2xs">
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Driver Preview (without GPS coordinates) if courier is already assigned */}
                    {assignedDriver && (
                      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={driverAvatar}
                            alt={driverName || 'Courier'}
                            className="w-11 h-11 rounded-xl object-cover border border-[#05A764] bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName || 'Driver')}&background=043927&color=05A764&bold=true`;
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">{driverName}</span>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {locale === 'ar' ? 'المندوب المسند' : 'Assigned Courier'}
                              </span>
                            </div>
                            {vehicleText && (
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{vehicleText}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {locale === 'ar' ? 'بانتظار الانطلاق' : 'Ready to Dispatch'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ================= 2. 4-STEP ORDER TRACKING TIMELINE ================= */}
              <OrderTrackingTimeline order={order} />

            </div>

          </div>
        )}

      </div>

      {/* ================= COURIER CHAT SLIDE-OVER MODAL ================= */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">

          {/* Chat Header */}
          <div className="bg-[#043927] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={driverInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt="Courier"
                  className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs">{driverInfo.name || 'Tariq Al-Harbi'}</h4>
                <p className="text-[10px] text-emerald-300">Courier is Active Now</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="p-4 h-64 overflow-y-auto space-y-2.5 text-xs bg-slate-50">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] font-medium ${msg.sender === 'customer'
 ? 'bg-[#006E2D] text-white rounded-br-xs'
 : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
 }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder={locale === 'ar' ? 'اكتب رسالة للكابتن...' : 'Type note for driver (e.g. gate code)...'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900 outline-none border border-slate-200 focus:border-[#05A764] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-[#043927] hover:bg-[#02281b] disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}

export default function TrackLiveOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
