'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '../../src/services/api';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useSocket } from '../../src/contexts/SocketContext';
import { useToast } from '../../src/contexts/ToastContext';
import { downloadOrderInvoice } from '../../src/services/invoiceService';
import {
    ShoppingBag,
    Check,
    Clock,
    MapPin,
    Key,
    Share2,
    FileCheck,
    ArrowLeft,
    AlertCircle,
    Package
} from 'lucide-react';

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('orderId') || searchParams.get('id') || '';
    const router = useRouter();
    const { t, locale } = useLanguage();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    const formatPlacedTime = (dateInput) => {
        if (!dateInput) return locale === 'ar' ? 'اليوم' : 'Today';
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return String(dateInput);
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return isToday
                ? (locale === 'ar' ? `اليوم، ${timeStr}` : `Today, ${timeStr}`)
                : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
        } catch {
            return locale === 'ar' ? 'اليوم' : 'Today';
        }
    };

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            let res = null;

            if (id) {
                res = await fetchApi(`/orders/confirmation/${id}`).catch(() => null);
                if (!res || !res.success || !res.data?.order) {
                    res = await fetchApi(`/orders/${id}`).catch(() => null);
                }
            }

            // Fallback: If not found by query ID (e.g. invalid ID or stale URL), fetch latest order from user
            if (!res || !res.success || !res.data?.order) {
                const myOrdersRes = await fetchApi('/orders/my-orders').catch(() => null);
                if (myOrdersRes?.success && Array.isArray(myOrdersRes.data?.orders) && myOrdersRes.data.orders.length > 0) {
                    res = { success: true, data: { order: myOrdersRes.data.orders[0] } };
                }
            }

            if (res && res.success && res.data?.order) {
                setOrder(res.data.order);
            } else {
                setOrder(null);
            }
        } catch (err) {
            console.error('Failed to load order confirmation:', err);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrderDetails();
    }, [id]);

    const handleDownloadInvoice = async () => {
        if (!order) return;
        try {
            setDownloadingInvoice(true);
            showToast(
                locale === 'ar'
                    ? 'جاري تجهيز وتحميل الفاتورة الضريبية ZATCA...'
                    : 'Preparing & downloading ZATCA Tax Invoice PDF...',
                'info'
            );
            await downloadOrderInvoice(order, locale);
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
                text: `Track my live delivery on Falcon Grocery #${order?.order_number || ''}!`,
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

    if (!order) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24 px-4 font-sans">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">
                        {locale === 'ar' ? 'لم يتم العثور على الطلب' : 'Order Not Found'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {locale === 'ar'
                            ? 'تعذر العثور على تفاصيل هذا الطلب. يمكنك تصفح قائمة طلباتك أو متابعة التسوق.'
                            : "We couldn't locate this order confirmation. You can review your past purchases or continue shopping."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Link
                            href="/orders"
                            className="flex-1 bg-[#05A764] hover:bg-[#048b53] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
                        >
                            {locale === 'ar' ? 'طلباتي' : 'My Orders'}
                        </Link>
                        <Link
                            href="/products"
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
                        >
                            {locale === 'ar' ? 'متابعة التسوق' : 'Browse Products'}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic Extractors
    const customerName = order?.address?.full_name
        || (order?.customer?.first_name ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() : '')
        || (locale === 'ar' ? 'عميلنا العزيز' : 'Valued Customer');

    const greetingFirstName = order?.address?.full_name
        ? order.address.full_name.split(' ')[0]
        : (order?.customer?.first_name || (locale === 'ar' ? 'عميلنا العزيز' : 'Customer'));

    const addressLine = order?.address?.address_line || (locale === 'ar' ? 'العنوان المسجل' : 'Registered Address');
    const areaCity = [order?.address?.area, order?.address?.city, order?.address?.postal_code].filter(Boolean).join(', ')
        || (locale === 'ar' ? 'الرياض' : 'Riyadh');
    const countryName = order?.address?.country || 'Saudi Arabia';
    const contactPhone = order?.address?.mobile || order?.customer?.user?.mobile || (locale === 'ar' ? 'غير متوفر' : 'Not provided');
    const driverNotes = order?.notes && order.notes.trim()
        ? order.notes
        : (locale === 'ar' ? 'لا توجد تعليمات خاصة بالتسليم' : 'No driver instructions provided.');

    // Dynamic Order Items
    const itemsList = Array.isArray(order?.items)
        ? order.items.map((it, idx) => {
            const pName = locale === 'ar'
                ? (it.product_name_ar || it.product_name_en || it.product?.name_ar || it.product?.name_en || 'منتج')
                : (it.product_name_en || it.product_name_ar || it.product?.name_en || 'Grocery Item');

            let imgUrl = '';
            if (it.product?.images && it.product.images.length > 0) {
                const firstImg = it.product.images[0];
                imgUrl = typeof firstImg === 'string' ? firstImg : (firstImg.image_url || firstImg.url || '');
            } else if (it.product?.image) {
                imgUrl = it.product.image;
            } else if (it.product?.image_url) {
                imgUrl = it.product.image_url;
            }

            const unitPrice = parseFloat(it.unit_price || it.price || 0);
            const qty = it.quantity || 1;
            const lineTotal = parseFloat(it.total_price || (unitPrice * qty) || 0);

            return {
                id: it.id || `item-${idx}`,
                name: pName,
                subtitle: it.product?.pack_size ? `${it.product.pack_size} • Qty: ${qty}` : `Qty: ${qty}`,
                price: lineTotal.toFixed(2),
                tag: it.product?.unit_type ? `${it.product.unit_type}` : (locale === 'ar' ? 'طازج' : 'Fresh'),
                tagColor: 'green',
                image: imgUrl,
            };
        })
        : [];

    // Dynamic Totals
    const subtotalVal = parseFloat(order?.subtotal || itemsList.reduce((acc, i) => acc + parseFloat(i.price), 0));
    const deliveryFeeVal = parseFloat(order?.delivery_fee ?? 0.00);
    const discountVal = parseFloat(order?.discount_total ?? 0.00);
    const vatVal = parseFloat(order?.tax_total ?? (subtotalVal * 0.15));
    const grandTotalVal = parseFloat(order?.grand_total ?? (subtotalVal + deliveryFeeVal + vatVal - discountVal));

    const status = (order?.order_status || 'CONFIRMED').toUpperCase();

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
                                <span>Order #{order?.order_number || (order?.id ? order.id.slice(0, 8).toUpperCase() : '')}</span>
                                <span>•</span>
                                <span>Placed {formatPlacedTime(order?.createdAt || order?.created_at)}</span>
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
                                        : order?.delivery_slot || order?.delivery_date || (locale === 'ar' ? 'اليوم، التوصيل السريع' : 'Today, Express Delivery')}
                                </strong>
                                <span>in {order?.address?.area || order?.address?.city || 'Riyadh'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 self-start md:self-center">
                        <button
                            type="button"
                            onClick={handleDownloadInvoice}
                            disabled={downloadingInvoice}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-sans border border-slate-200/80 disabled:opacity-50"
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

                {/* MAIN 2-COLUMN SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: Delivery Details (8 Columns) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* DELIVERY DESTINATION CARD */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#05A764]" />
                                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                                        {locale === 'ar' ? 'وجهة التوصيل' : 'Delivery Destination'}
                                    </h2>
                                </div>

                                <Link
                                    href="/orders"
                                    className="text-xs font-extrabold text-[#05A764] hover:underline cursor-pointer font-sans"
                                >
                                    {locale === 'ar' ? 'عرض طلباتي' : 'View All Orders'}
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Left Details */}
                                <div className="md:col-span-6 space-y-1.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">
                                        {locale === 'ar' ? 'العميل والعنوان' : 'CUSTOMER & ADDRESS'}
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
                                        {locale === 'ar' ? 'الهاتف:' : 'Contact:'} {contactPhone}
                                    </p>
                                </div>

                                {/* Right Driver Access Note Box */}
                                <div className="md:col-span-6 bg-[#FFF9E6] border border-[#FFE8A3] rounded-2xl p-4 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs font-sans">
                                        <Key className="w-3.5 h-3.5" />
                                        <span>{locale === 'ar' ? 'ملاحظات التوصيل للسائق:' : 'Driver Access Note:'}</span>
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
                                        {locale === 'ar' ? 'المنتجات في هذا الطلب' : 'Items in this Delivery'}
                                    </h2>
                                </div>

                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-sans">
                                    {itemsList.length} {itemsList.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {itemsList.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-4">
                                        {locale === 'ar' ? 'لا توجد منتجات مسجلة في هذا الطلب' : 'No items recorded for this order.'}
                                    </p>
                                ) : (
                                    itemsList.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-[#F5F6F8] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/60"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.image ? (
                                                        <img
                                                            src={getImageUrl(item.image)}
                                                            alt={item.name}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-medium truncate">
                                                        {item.subtitle}
                                                    </p>
                                                    {item.tag && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded inline-block mt-0.5 font-sans bg-emerald-50 text-emerald-700">
                                                            {item.tag}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="font-black text-xs sm:text-sm text-slate-900 font-sans block">
                                                    SAR {item.price}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Bundling Offer Widget */}
                            <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                                <div className="space-y-0.5">
                                    <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1 font-sans">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{locale === 'ar' ? 'نسيت شيئاً؟' : 'Forgot something?'}</span>
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        {locale === 'ar' ? 'أضف منتجات إضافية بسهولة' : 'Add extra items to your next delivery'}
                                    </p>
                                </div>

                                <Link
                                    href="/products"
                                    className="bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs font-sans"
                                >
                                    {locale === 'ar' ? 'تصفح' : 'Add Items'}
                                </Link>
                            </div>
                        </div>

                        {/* PAYMENT & BILLING CARD */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                            <h2 className="font-extrabold text-base text-slate-900 font-sans border-b border-slate-100 pb-3">
                                {locale === 'ar' ? 'الدفع والفاتورة' : 'Payment & Billing'}
                            </h2>

                            <div className="space-y-2.5 text-xs font-semibold text-slate-600 font-sans">
                                <div className="flex justify-between">
                                    <span>{locale === 'ar' ? 'المجموع الفرعي للمنتجات' : 'Items Subtotal'}</span>
                                    <span className="font-extrabold text-slate-900">SAR {subtotalVal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>{locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                                    <span className="font-extrabold text-slate-900">
                                        {deliveryFeeVal === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : `SAR ${deliveryFeeVal.toFixed(2)}`}
                                    </span>
                                </div>

                                {discountVal > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>{locale === 'ar' ? 'الخصم' : 'Discount'} ({order?.coupon_code || ''})</span>
                                        <span className="font-extrabold">- SAR {discountVal.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-slate-500">
                                    <span>{locale === 'ar' ? 'ضريبة القيمة المضافة (15% مشمولة)' : 'Standard VAT (15% included)'}</span>
                                    <span>SAR {vatVal.toFixed(2)}</span>
                                </div>

                                <div className="border-t border-dashed border-slate-200 pt-3 my-2" />

                                <div className="flex items-baseline justify-between pt-1">
                                    <div>
                                        <span className="text-sm font-extrabold text-slate-900 block">
                                            {locale === 'ar' ? 'الإجمالي المدفوع' : 'Total Paid'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {locale === 'ar' ? 'طريقة الدفع:' : 'Paid via'} {order?.payment_method || order?.payment?.payment_method || 'Online'}
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
                                        <span>{locale === 'ar' ? 'فاتورة ضريبية إلكترونية معتمدة' : 'ZATCA e-Invoice Verified'}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-mono">
                                        UUID: {order?.id ? `${order.id.slice(0, 8)}...${order.id.slice(-4)}` : ''} • VAT: 300192837400003
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDownloadInvoice}
                                    disabled={downloadingInvoice}
                                    className="text-xs font-extrabold text-[#05A764] hover:underline cursor-pointer font-sans shrink-0 ml-2 disabled:opacity-50"
                                >
                                    {locale === 'ar' ? 'تحميل PDF' : 'Download PDF'}
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
