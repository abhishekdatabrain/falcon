'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '../../src/services/api';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useSocket } from '../../src/contexts/SocketContext';
import { useToast } from '../../src/contexts/ToastContext';
import { downloadOrderInvoice } from '../../src/services/invoiceService';
import LiveTrackingMap from '../../src/components/LiveTrackingMap';
import {
    Package,
    Truck,
    Download,
    Star,
    CheckCircle2,
    MapPin,
    Clock,
    ArrowLeft,
    ChevronRight,
    ShieldCheck,
    Phone,
    FileText,
    X,
    Share2,
    Check,
    Box,
    Home,
    Navigation,
    Thermometer,
    MessageSquare,
    Key,
    ShoppingBag,
    Sparkles,
    Award,
    FileCheck
} from 'lucide-react';

const DEMO_ORDER_ITEMS = [
    {
        id: 'item-1',
        name_en: 'Local Hydroponic Vine Tomatoes',
        subtitle: '500g Pack • Qty: 1',
        price: '6.95',
        tag: 'Farm Fresh',
        tagColor: 'green',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
    },
    {
        id: 'item-2',
        name_en: 'Almarai Fresh Full Fat Milk',
        subtitle: '2.0 Liters • Qty: 2',
        price: '23.00',
        originalPrice: '25.00',
        tag: 'Chilled Storage',
        tagColor: 'blue',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
    },
    {
        id: 'item-3',
        name_en: 'Artisanal Stoneground Sourdough',
        subtitle: '650g Loaf • Qty: 1',
        price: '18.50',
        tag: 'Baked Today',
        tagColor: 'amber',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    },
    {
        id: 'item-4',
        name_en: 'Qassim Premium Rutab Dates',
        subtitle: '500g Box • Qty: 1',
        price: '19.65',
        tag: 'Organic Verified',
        tagColor: 'green',
        image: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=300&auto=format&fit=crop&q=80',
    }
];

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('orderId') || searchParams.get('id') || '';
    const router = useRouter()
    const { t, locale } = useLanguage();
    const { socket, joinDeliveryRoom, leaveDeliveryRoom } = useSocket();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const formatPlacedTime = (dateInput) => {
        if (!dateInput) return 'Today, 2:15 PM';
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return String(dateInput);
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return isToday ? `Today, ${timeStr}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
        } catch {
            return 'Today, 2:15 PM';
        }
    };

    const loadOrderDetails = async () => {
        try {
            // 1. Try public confirmation endpoint first, then /orders/:id
            let res = await fetchApi(`/orders/confirmation/${id}`).catch(() => null);
            if (!res || !res.success || !res.data?.order) {
                res = await fetchApi(`/orders/${id}`).catch(() => null);
            }

            if (res && res.success && res.data?.order) {
                setOrder(res.data.order);
            } else {

            }
        } catch (err) {

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrderDetails();
    }, [id]);

    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    const handleDownloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            showToast(
                locale === 'ar'
                    ? 'جاري تجهيز وتحميل الفاتورة الضريبية ZATCA...'
                    : 'Preparing & downloading ZATCA Tax Invoice PDF...',
                'info'
            );
            await downloadOrderInvoice(order || { id }, locale);
            showToast(
                locale === 'ar'
                    ? 'تم تجهيز الفاتورة الضريبية بنجاح!'
                    : 'ZATCA Tax Invoice ready!',
                'success'
            );
        } catch (err) {
            console.error('Invoice download error:', err);
            showToast(
                locale === 'ar'
                    ? 'فشل تحميل الفاتورة الضريبية'
                    : 'Failed to download ZATCA invoice',
                'error'
            );
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const handleShareStatus = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: 'Falcon Order Status',
                text: 'Track my live delivery on Falcon Grocery!',
                url: window.location.href,
            });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            showToast(locale === 'ar' ? 'تم نسخ رابط المتابعة!' : 'Tracking link copied to clipboard!', 'success');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Dynamic Extractors
    const customerName = order?.customer?.first_name
        ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
        : (order?.address?.full_name || order?.customer_name || '');

    const greetingFirstName = order?.customer?.first_name
        || (order?.address?.full_name ? order.address.full_name.split(' ')[0] : null)
        || (order?.customer_name ? order.customer_name.split(' ')[0] : '');

    const addressLine = order?.address?.address_line || order?.address_line || '';
    const areaCity = order?.address
        ? `${order.address.area ? order.address.area + ', ' : ''}${order.address.city || ''}${order.address.postal_code ? ' ' + order.address.postal_code : ''}`
        : (order?.area_city || '');
    const countryName = order?.address?.country || order?.country || 'Kingdom of Saudi Arabia';
    const contactPhone = order?.address?.mobile || order?.customer?.user?.mobile || order?.mobile || '+966 54 *** *821';
    const driverNotes = order?.notes && order.notes.trim()
        ? order.notes
        : 'Please ring the video doorbell at the outer black courtyard gate. If no response within 2 minutes, leave chilled tote bag beside the shaded entry porch bench. Contactless OK.';

    // Dynamic Order Items
    const itemsList = (order?.items && order.items.length > 0)
        ? order.items.map((it, idx) => {
            const pName = locale === 'ar'
                ? (it.product_name_ar || it.product_name_en || it.product?.name_ar || it.product?.name_en || 'منتج طازج')
                : (it.product_name_en || it.product_name_ar || it.product?.name_en || 'Fresh Grocery Item');

            let imgUrl = '';
            if (it.product?.images && it.product.images.length > 0) {
                const firstImg = it.product.images[0];
                imgUrl = typeof firstImg === 'string' ? firstImg : (firstImg.image_url || firstImg.url || '');
            } else if (it.product?.image) {
                imgUrl = it.product.image;
            }

            if (!imgUrl) {
                imgUrl = DEMO_ORDER_ITEMS[idx % DEMO_ORDER_ITEMS.length]?.image;
            }

            const unitPrice = parseFloat(it.unit_price || it.price || 0);
            const qty = it.quantity || 1;
            const lineTotal = parseFloat(it.total_price || (unitPrice * qty) || 0);

            return {
                id: it.id || `item-${idx}`,
                name: pName,
                subtitle: `${it.product?.unit || it.product?.pack_size || 'Fresh Pack'} • Qty: ${qty}`,
                price: lineTotal.toFixed(2),
                originalPrice: it.product?.price && parseFloat(it.product.price) > unitPrice ? (parseFloat(it.product.price) * qty).toFixed(2) : null,
                tag: 'Cold Storage',
                tagColor: 'green',
                image: imgUrl,
            };
        })
        : DEMO_ORDER_ITEMS.map((item) => ({
            ...item,
            name: locale === 'ar' ? (item.name_ar || item.name_en) : item.name_en,
        }));

    // Dynamic Totals
    const subtotalVal = parseFloat(order?.subtotal || itemsList.reduce((acc, i) => acc + parseFloat(i.price), 0));
    const deliveryFeeVal = parseFloat(order?.delivery_fee ?? 25.00);
    const vatVal = parseFloat(order?.tax_total ?? (subtotalVal * 0.15));
    const grandTotalVal = parseFloat(order?.grand_total ?? (subtotalVal + deliveryFeeVal + vatVal));

    const driverInfo = order?.delivery?.driver || order?.driver || {
        name: 'Tariq Al-Harbi',
        rating: 4.98,
        drops: '1,420+ drops',
        van: 'Toyota HiAce • KSA 4812 ABC',
        phone: '+966 50 123 4567'
    };

    const status = (order?.order_status || 'PENDING_PAYMENT').toUpperCase();

    return (
        <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900 pb-24 select-none">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">

                {/* TOP HEADER TITLE ROW */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        {/* Green Checkmark Circle */}
                        <div className="w-10 h-10 rounded-full bg-[#05A764] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                            <Check className="w-6 h-6 stroke-[3]" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                                <span className="text-[#05A764] font-black uppercase tracking-wider">
                                    {status === 'DELIVERED'
                                        ? (locale === 'ar' ? 'تم التوصيل بنجاح' : 'ORDER DELIVERED')
                                        : status === 'OUT_FOR_DELIVERY'
                                            ? (locale === 'ar' ? 'الطلب في الطريق' : 'OUT FOR DELIVERY')
                                            : (locale === 'ar' ? 'تم تأكيد الطلب' : 'ORDER CONFIRMED')}
                                </span>
                                <span>•</span>
                                <span>Order #{order?.order_number || 'SA-849204'}</span>
                                <span>•</span>
                                <span>Placed {formatPlacedTime(order?.createdAt || order?.created_at || order?.placed_at)}</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                                {locale === 'ar' ? `شكراً لك، ${greetingFirstName}!` : `Thank You, ${greetingFirstName}!`}
                            </h1>

                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5 flex-wrap">
                                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>
                                    {order?.delivery_date || order?.delivery_slot
                                        ? (locale === 'ar' ? 'فترة التوصيل المجدولة:' : 'Scheduled Delivery Slot:')
                                        : (locale === 'ar' ? 'الوقت المتوقع للتوصيل:' : 'Estimated Arrival:')}
                                </span>
                                <strong className="text-slate-900 font-black">
                                    {order?.delivery_date && order?.delivery_slot
                                        ? `${order.delivery_date} • ${order.delivery_slot}`
                                        : order?.delivery_slot || order?.delivery_date || 'Today, 3:15 PM – 3:45 PM'}
                                </strong>
                                <span>in {order?.address?.area || order?.address?.city || 'Al-Olaya, Riyadh'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 self-start md:self-center">
                        <button
                            type="button"
                            onClick={handleDownloadInvoice}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-sans border border-slate-200/80"
                        >
                            <FileCheck className="w-4 h-4 text-slate-600" />
                            <span>{locale === 'ar' ? 'الفاتورة الضريبية' : 'Tax Invoice'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleShareStatus}
                            className="bg-[#05A764] hover:bg-[#048b53] text-white text-xs font-extrabold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-md font-sans"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>{locale === 'ar' ? 'مشاركة الحالة' : 'Share Status'}</span>
                        </button>
                    </div>
                </div>

                {/* STEPPER TIMELINE CARD */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#05A764] animate-pulse" />
                            <h2 className="text-xs sm:text-sm font-black text-[#05A764] tracking-wider uppercase font-sans">
                                LIVE DISPATCH TRACKER
                            </h2>
                        </div>

                        <span className="text-xs font-semibold text-slate-500 font-sans">
                            Step 3 of 4: <strong className="text-slate-900">Courier En Route</strong>
                        </span>
                    </div>

                    {/* 4 Step Timeline Progress Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 relative">

                        {/* Step 1: Order Placed */}
                        <div className="flex flex-col space-y-1.5 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs z-10">
                                    <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                                <div className="h-1 bg-[#05A764] flex-1 rounded-full hidden sm:block" />
                            </div>
                            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                                Order Placed
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {formatPlacedTime(order?.createdAt || order?.created_at || order?.placed_at)} • Verified
                            </p>
                            <p className="text-[11px] font-black text-emerald-700 font-sans">
                                Payment Approved
                            </p>
                        </div>

                        {/* Step 2: Packed with Care */}
                        <div className="flex flex-col space-y-1.5 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs z-10">
                                    <Box className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                                <div className="h-1 bg-[#05A764] flex-1 rounded-full hidden sm:block" />
                            </div>
                            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                                Packed with Care
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Inspected • Central Hub
                            </p>
                            <p className="text-[11px] font-black text-emerald-700 font-sans">
                                Cold-chain insulated
                            </p>
                        </div>

                        {/* Step 3: Out for Delivery (ACTIVE) */}
                        <div className="flex flex-col space-y-1.5 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md ring-4 ring-emerald-100 z-10">
                                    <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                                <div className="h-1 bg-slate-200 flex-1 rounded-full hidden sm:block" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                                    Out for Delivery
                                </h3>
                                <span className="bg-[#05A764] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans">
                                    Active
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Live Courier Delivery
                            </p>
                            <p className="text-[11px] font-black text-amber-600 font-sans">
                                Estimated in 18 mins
                            </p>
                        </div>

                        {/* Step 4: Delivered to Door */}
                        <div className="flex flex-col space-y-1.5 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 z-10">
                                    <Home className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-400 font-sans">
                                Delivered to Door
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Estimated 3:25 PM
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400 font-sans">
                                Contactless handoff
                            </p>
                        </div>

                    </div>
                </div>

                {/* MAIN 2-COLUMN SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: Map Telemetry & Driver Details (8 Columns) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* LIVE GPS MAP CARD */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-[#05A764]" />
                                        <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                                            Real-Time Route Telemetry
                                        </h2>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Express Van is 2.4 km from your pin
                                    </p>
                                </div>

                                <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live GPS
                                </span>
                            </div>

                            {/* Map View Box */}
                            <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
                                <LiveTrackingMap
                                    destLat={order?.address?.latitude ? parseFloat(order.address.latitude) : 24.7136}
                                    destLng={order?.address?.longitude ? parseFloat(order.address.longitude) : 46.6753}
                                    title={`${driverInfo.name} (${driverInfo.van || 'Toyota HiAce'})`}
                                />

                                {/* Top-Left Traffic Status Tag */}
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-extrabold text-slate-800 z-10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Traffic Speed: <strong className="text-slate-900">Normal Flow • King Fahd Rd</strong></span>
                                </div>

                                {/* Bottom-Right Temperature Sensor Tag */}
                                <div className="absolute bottom-3 right-3 bg-[#043927] text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-md flex items-center gap-1.5 text-xs font-black font-sans z-10">
                                    <Thermometer className="w-4 h-4 text-emerald-400" />
                                    <span>Refrigerated Cargo Temp: 3.8°C</span>
                                </div>
                            </div>

                            {/* Courier Info Bar below Map */}
                            <div className="bg-[#F5F6F8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/60">
                                <div className="flex items-center gap-3">
                                    {/* Courier Avatar */}
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-slate-200">
                                        <img
                                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                                            alt={driverInfo.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-sm text-slate-900 font-sans">
                                                {driverInfo.name}
                                            </h3>
                                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                ★ {driverInfo.rating || '4.98'}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-slate-500 font-semibold">
                                            Top Express Delivery Specialist • {driverInfo.drops || '1,420+ drops'}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Van: {driverInfo.van || 'Toyota HiAce • KSA 4812 ABC'}
                                        </p>
                                    </div>
                                </div>

                                {/* Driver Buttons */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`tel:${driverInfo.phone || '+966501234567'}`}
                                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-sans"
                                    >
                                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Call {driverInfo.name.split(' ')[0]}</span>
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => showToast(locale === 'ar' ? 'جاري فتح محادثة السائق...' : 'Opening driver chat...', 'info')}
                                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                                        <span>Message</span>
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* DELIVERY DESTINATION CARD */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#05A764]" />
                                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                                        Delivery Destination
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => showToast(locale === 'ar' ? 'تم تحديث تعليمات التوصيل للسائق' : 'Delivery instructions updated for driver', 'success')}
                                    className="text-xs font-extrabold text-[#05A764] hover:underline cursor-pointer font-sans"
                                >
                                    ✏️ Update Instructions
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                                {/* Left Details */}
                                <div className="md:col-span-6 space-y-1.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">
                                        CUSTOMER & ADDRESS
                                    </span>
                                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                                        {customerName}
                                    </h3>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {addressLine}
                                    </p>
                                    <p className="text-xs text-slate-600 font-medium">
                                        {areaCity}
                                    </p>
                                    <p className="text-xs text-slate-600 font-medium">
                                        {countryName}
                                    </p>
                                    <p className="text-xs text-slate-500 font-semibold pt-1">
                                        Contact: {contactPhone}
                                    </p>
                                </div>

                                {/* Right Driver Access Note Box */}
                                <div className="md:col-span-6 bg-[#FFF9E6] border border-[#FFE8A3] rounded-2xl p-4 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs font-sans">
                                        <Key className="w-3.5 h-3.5" />
                                        <span>Driver Access Note:</span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                                        "{driverNotes}"
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Items & Payment Breakdown (4 Columns) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* ITEMS IN THIS DELIVERY CARD */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">

                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-slate-900" />
                                    <h2 className="font-extrabold text-base text-slate-900 font-sans">
                                        Items in this Delivery
                                    </h2>
                                </div>

                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-sans">
                                    {itemsList.length} {itemsList.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                {itemsList.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-[#F5F6F8] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/60"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                <img
                                                    src={getImageUrl(item.image)}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = DEMO_ORDER_ITEMS[0].image;
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                                                    {item.name}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-medium truncate">
                                                    {item.subtitle}
                                                </p>
                                                {item.tag && (
                                                    <span
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded inline-block mt-0.5 font-sans ${item.tagColor === 'green'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : item.tagColor === 'blue'
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : 'bg-amber-50 text-amber-800'
                                                            }`}
                                                    >
                                                        {item.tag}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-black text-xs sm:text-sm text-slate-900 font-sans block">
                                                SAR {item.price}
                                            </span>
                                            {item.originalPrice && (
                                                <span className="text-[10px] text-slate-400 line-through font-semibold block">
                                                    SAR {item.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Forgot Something? Bundling Offer Widget */}
                            <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                                <div className="space-y-0.5">
                                    <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1 font-sans">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Forgot something?</span>
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        Add extra items with free bundling
                                    </p>
                                </div>

                                <Link
                                    href="/products"
                                    className="bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs font-sans"
                                >
                                    Add (+0 SAR)
                                </Link>
                            </div>

                        </div>

                        {/* PAYMENT & BILLING CARD */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                            <h2 className="font-extrabold text-base text-slate-900 font-sans border-b border-slate-100 pb-3">
                                Payment & Billing
                            </h2>

                            <div className="space-y-2.5 text-xs font-semibold text-slate-600 font-sans">
                                <div className="flex justify-between">
                                    <span>Items Subtotal</span>
                                    <span className="font-extrabold text-slate-900">SAR {subtotalVal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Express Refrigerated Delivery</span>
                                    <span className="font-black text-[#05A764]">
                                        {deliveryFeeVal > 0 ? `SAR ${deliveryFeeVal.toFixed(2)}` : 'FREE (VIP Member)'}
                                    </span>
                                </div>

                                <div className="flex justify-between text-slate-500">
                                    <span>Standard VAT (15% included)</span>
                                    <span>SAR {vatVal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between text-emerald-700 font-extrabold">
                                    <span>Loyalty Points Earned</span>
                                    <span>+{Math.round(grandTotalVal)} FreshPoints</span>
                                </div>

                                <div className="border-t border-dashed border-slate-200 pt-3 my-2" />

                                <div className="flex items-baseline justify-between pt-1">
                                    <div>
                                        <span className="text-sm font-extrabold text-slate-900 block">
                                            Total Paid
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Paid via mada (•••• 4192)
                                        </span>
                                    </div>

                                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight flex items-baseline gap-1">
                                        <span className="text-xs font-bold text-slate-700">SAR</span>
                                        <span>{grandTotalVal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ZATCA e-Invoice Verified Footer Box */}
                            <div className="bg-[#E8F8F0] border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between mt-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#05A764] font-sans">
                                        <FileCheck className="w-4 h-4" />
                                        <span>ZATCA e-Invoice Verified</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-mono">
                                        UUID: {order?.id ? `${order.id.slice(0, 8)}...${order.id.slice(-4)}` : 'b6c1...91ea'} • VAT: 300192837400003
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDownloadInvoice}
                                    className="text-xs font-extrabold text-[#05A764] hover:underline cursor-pointer font-sans shrink-0 ml-2"
                                >
                                    Download PDF
                                </button>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <OrderConfirmationContent />
        </Suspense>
    );
}
