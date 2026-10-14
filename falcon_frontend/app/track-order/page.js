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
  Heart
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
    speed: 42,
    heading: 120,
    temp: '3.5°C',
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
      }

      // Default demo order for instant preview if no query provided
      await loadOrder('ORD-20261009-9815');
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

        // Extract latest driver coordinates if present
        const latestLoc = orderData.delivery?.locations?.[0];
        if (latestLoc && parseFloat(latestLoc.latitude) && parseFloat(latestLoc.longitude)) {
          setDriverTelemetry((prev) => ({
            ...prev,
            lat: parseFloat(latestLoc.latitude),
            lng: parseFloat(latestLoc.longitude),
            speed: latestLoc.speed ? Math.round(latestLoc.speed) : 42,
            heading: latestLoc.heading || 120,
          }));
        } else if (orderData.address?.latitude && orderData.address?.longitude) {
          // Offset driver slightly north-west for route rendering
          const destLat = parseFloat(orderData.address.latitude);
          const destLng = parseFloat(orderData.address.longitude);
          setDriverTelemetry((prev) => ({
            ...prev,
            lat: destLat + 0.0185,
            lng: destLng - 0.0162,
          }));
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
      if (data && (data.latitude || data.lat) && (data.longitude || data.lng)) {
        setDriverTelemetry({
          lat: parseFloat(data.latitude || data.lat),
          lng: parseFloat(data.longitude || data.lng),
          speed: data.speed !== undefined && data.speed !== null ? Math.round(data.speed) : 42,
          heading: data.heading || 120,
          temp: data.temp || '3.5°C',
          updatedAt: new Date().toISOString(),
        });
        setGpsStatusState('LIVE');
      }
    };

    const handleStatusUpdate = (data) => {
      if (data && (data.orderId === order.id || data.deliveryId === order.delivery?.id)) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                order_status: data.status,
                delivery: {
                  ...prev.delivery,
                  status: data.status,
                  failure_reason: data.data?.failureReason || prev.delivery?.failure_reason,
                  otp_verified_at: data.data?.otpVerified ? new Date().toISOString() : prev.delivery?.otp_verified_at,
                },
              }
            : prev
        );
        showToast(
          locale === 'ar' ? `تحديث حالة الطلب: ${data.status}` : `Order Status Updated: ${data.status}`,
          'info'
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
    socket.on('driver_gps_status', handleGpsStatus);

    return () => {
      socket.off('driver_location_update', handleLocationUpdate);
      socket.off('location_updated', handleLocationUpdate);
      socket.off('order_status_update', handleStatusUpdate);
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

  const driverInfo = order?.delivery?.driver || {
    name: 'Tariq Al-Harbi',
    vehicle: 'Toyota HiAce Chill Van #782',
    phone: '+966 50 123 4567',
    rating: 4.95,
    deliveries_count: 1420,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    current_temp: '3.5°C (Chilled Optimal)',
    role: 'Master Cold-Chain Courier',
  };

  // Dynamic 5-Step Stepper Timeline Calculation
  const isDelivered = status === 'DELIVERED' || status === 'COMPLETED';
  const isOutForDelivery = status === 'OUT_FOR_DELIVERY' || isDelivered;
  const isProcessing = ['PROCESSING', 'PACKED', 'DRIVER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status);
  const isConfirmed = !['CANCELLED', 'RETURNED'].includes(status);

  const timelineSteps = [
    {
      step: 1,
      title: locale === 'ar' ? 'تم استلام وتأكيد الطلب' : 'Order Received & Confirmed',
      desc: locale === 'ar' ? `تم تأكيد الطلب #${order?.order_number || ''} في مركز فالكون المركزي.` : `Order #${order?.order_number || ''} verified & reserved at Falcon Express Hub.`,
      time: formatPlacedTime(order?.createdAt),
      completed: isConfirmed,
      active: status === 'CONFIRMED' || status === 'PENDING_PAYMENT',
    },
    {
      step: 2,
      title: locale === 'ar' ? 'تم الحصاد والتجهيز' : 'Harvested & Packing Completed',
      desc: locale === 'ar' ? 'تم قطف المنتجات الطازجة وتعبئتها في أكياس حرارية مبردة.' : 'Fresh groceries picked & packed into thermal insulated bags.',
      time: isProcessing ? 'Completed' : 'Pending',
      completed: isProcessing,
      active: status === 'PROCESSING' || status === 'PACKED',
    },
    {
      step: 3,
      title: locale === 'ar' ? 'فحص الجودة والتبريد' : 'Thermal Cold-Chain QC Verified',
      desc: locale === 'ar' ? 'تم فحص درجات الحرارة لضمان بقائها تحت 4 درجات مئوية.' : 'Chilled box sealed with active cold-chain temperature telemetry at 3.5°C.',
      time: isProcessing ? 'Verified' : 'Pending',
      completed: isProcessing,
      active: status === 'PACKED' || status === 'DRIVER_ASSIGNED',
    },
    {
      step: 4,
      title: locale === 'ar' ? 'السائق في الطريق إليك' : 'Courier In Transit – Live GPS',
      desc: locale === 'ar' ? `الكابتن ${driverInfo.name || 'طارق'} في الطريق لتسليم طلبك.` : `Courier ${driverInfo.name || 'Tariq'} is en route with your chilled grocery order.`,
      time: isOutForDelivery ? (isDelivered ? 'Delivered' : 'En Route Now') : 'Scheduled',
      completed: isDelivered,
      active: status === 'OUT_FOR_DELIVERY',
    },
    {
      step: 5,
      title: locale === 'ar' ? 'تم التوصيل بنجاح' : 'Arrived & Handed Over',
      desc: locale === 'ar' ? 'تم استلام الطلب وتأكيد التوصيل عند باب المنزل.' : 'Doorstep drop & verified delivery confirmation.',
      time: isDelivered ? 'Delivered' : `Est. ${order?.delivery_slot || 'Convenient Slot'}`,
      completed: isDelivered,
      active: isDelivered,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900 pb-28 select-none">
      
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
                  <h1 className="text-lg font-black text-slate-900 tracking-tight font-sans">
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

            {/* Quick Demo Chips */}
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="text-slate-400">{locale === 'ar' ? 'طلبات سريعة:' : 'Quick Test:'}</span>
              <button
                type="button"
                onClick={() => { setSearchInput('ORD-20261009-9815'); loadOrder('ORD-20261009-9815'); }}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer font-mono"
              >
                🚚 OUT_FOR_DELIVERY
              </button>
              <button
                type="button"
                onClick={() => { setSearchInput('ORD-20261013-3674'); loadOrder('ORD-20261013-3674'); }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer font-mono"
              >
                📦 ORD-3674
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {loading && !order ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900 font-sans">
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
            <h3 className="text-base font-extrabold text-slate-900 font-sans">
              {locale === 'ar' ? 'تعذر العثور على الطلب' : 'Unable to Locate Order'}
            </h3>
            <p className="text-xs text-slate-500">{error}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => loadOrder('ORD-20261009-9815')}
                className="px-4 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-colors"
              >
                {locale === 'ar' ? 'عرض طلب تجريبي نشط' : 'Load Active Demo Delivery'}
              </button>
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
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      status === 'DELIVERED'
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
                  <div className="text-xs font-extrabold text-slate-900">
                    📅 {order?.delivery_date || 'Today'}
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700">
                    ⏰ {order?.delivery_slot || '4:00 PM - 6:00 PM (Standard Slot)'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>{downloadingInvoice ? 'Loading...' : (locale === 'ar' ? 'الفاتورة' : 'Invoice')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="py-2.5 px-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
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
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
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
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      {locale === 'ar' ? 'المنتجات المطلوبة' : `Ordered Items (${order?.items?.length || 0})`}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {(order?.items || []).map((it, idx) => {
                    const pName = locale === 'ar'
                      ? (it.product_name_ar || it.product_name_en || it.product?.name_ar || it.product?.name_en || 'منتج طازج')
                      : (it.product_name_en || it.product_name_ar || it.product?.name_en || 'Fresh Grocery Item');
                    
                    const unitPrice = parseFloat(it.unit_price || it.price || 0);
                    const qty = it.quantity || 1;
                    const lineTotal = parseFloat(it.total_price || unitPrice * qty || 0);

                    return (
                      <div key={it.id || idx} className="flex items-center justify-between gap-2.5 text-xs py-1.5 border-b border-slate-50 last:border-none">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 truncate">{pName}</h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Qty: {qty} × SAR {unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-black text-slate-900 shrink-0 font-sans">
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
                    <span className="font-extrabold text-slate-900">SAR {parseFloat(order?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee:'}</span>
                    <span className="font-extrabold text-slate-900">
                      {parseFloat(order?.delivery_fee || 0) > 0 ? `SAR ${parseFloat(order.delivery_fee).toFixed(2)}` : 'FREE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{locale === 'ar' ? 'ضريبة القيمة المضافة 15%' : 'Estimated VAT (15%):'}</span>
                    <span className="font-extrabold text-slate-900">SAR {parseFloat(order?.tax_total || 0).toFixed(2)}</span>
                  </div>
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
                  <h4 className="font-extrabold text-slate-900">Need Delivery Assistance?</h4>
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
              
              {/* ================= 1. INTERACTIVE GOOGLE MAPS ENGINE ================= */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden space-y-0">
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
                  driverName={driverInfo.name || 'Tariq Al-Harbi'}
                  vehicle={driverInfo.vehicle || 'Toyota HiAce Chill Van #782'}
                  customerName={customerName}
                  destinationAddress={destinationAddress}
                  orderNumber={order?.order_number || ''}
                  status={status}
                  speed={driverTelemetry.speed}
                  temp={driverTelemetry.temp}
                  height="450px"
                />

                {/* Courier Profile Bar Beneath Google Map */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={driverInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                          alt={driverInfo.name || 'Courier'}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-white">
                          ✓ {driverInfo.rating || 4.9}★
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{driverInfo.name || 'Tariq Al-Harbi'}</h3>
                          <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                            {driverInfo.role || 'Cold-Chain Courier'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {driverInfo.vehicle || 'Toyota HiAce Chill Van #782'} • {driverInfo.deliveries_count || '1,420+'} drops
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 mt-0.5">
                          <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cargo Bay Temperature: {driverTelemetry.temp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${driverInfo.phone || '+966501234567'}`}
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

                  {/* Status Banner */}
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        ⚡
                      </div>
                      <p className="text-emerald-950 font-bold">
                        {status === 'DELIVERED'
                          ? 'Order delivered successfully to your doorstep. Thank you for choosing Falcon Fresh!'
                          : status === 'OUT_FOR_DELIVERY'
                          ? `Courier is en route to ${destinationAddress.split(',')[0] || 'your address'} with chilled storage active.`
                          : 'Your order is confirmed and undergoing cold-chain preparation.'}
                      </p>
                    </div>

                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-white/80 px-2.5 py-1 rounded-xl self-start sm:self-auto shrink-0 border border-emerald-200">
                      SAMA Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= 2. 5-STEP DISPATCH PROGRESS TIMELINE ================= */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#05A764] animate-ping" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      {locale === 'ar' ? 'مراحل تجهيز وتوصيل الطلب' : 'Cold-Chain Dispatch Progress'}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Step {isDelivered ? 5 : isOutForDelivery ? 4 : isProcessing ? 2 : 1} of 5
                  </span>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:pointer-events-none">
                  {timelineSteps.map((step) => (
                    <div key={step.step} className="flex items-start gap-4 relative">
                      {/* Step Circle Marker */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs z-10 ${
                          step.completed
                            ? 'bg-[#05A764] text-white ring-4 ring-emerald-50'
                            : step.active
                            ? 'bg-slate-900 text-white ring-4 ring-slate-100 animate-pulse'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.completed ? <Check className="w-4 h-4 stroke-[3]" /> : step.step}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className={`text-sm font-extrabold ${step.completed || step.active ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </h4>
                          <span className={`text-[11px] font-mono font-bold ${step.active ? 'text-[#05A764]' : 'text-slate-400'}`}>
                            {step.time}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${step.completed || step.active ? 'text-slate-600' : 'text-slate-400'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= COURIER CHAT SLIDE-OVER MODAL ================= */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans animate-in slide-in-from-bottom duration-200">
          
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
                <h4 className="font-extrabold text-xs">{driverInfo.name || 'Tariq Al-Harbi'}</h4>
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
                  className={`p-3 rounded-2xl max-w-[85%] font-medium ${
                    msg.sender === 'customer'
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
