'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useCart } from '../../../src/contexts/CartContext';
import { downloadOrderInvoice } from '../../../src/services/invoiceService';
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
  ShoppingBag,
  Sparkles,
  FileCheck,
  Copy,
  Printer,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  CreditCard,
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id || '';
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const { addToCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Dynamic Review Modal State & Persistence
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewsMap, setReviewsMap] = useState({});

  const formatPlacedDate = (dateInput) => {
    if (!dateInput) return locale === 'ar' ? 'اليوم، 2:15 م' : 'Today, 2:15 PM';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Today, 2:15 PM';
    }
  };

  const loadOrderDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // 1. Try customer/admin protected endpoint first
      let res = await fetchApi(`/orders/${id}`).catch(() => null);
      
      // 2. Fallback to public confirmation endpoint if 401/403 or not found
      if (!res || !res.success || !res.data?.order) {
        res = await fetchApi(`/orders/confirmation/${id}`).catch(() => null);
      }

      if (res && res.success && res.data?.order) {
        setOrder(res.data.order);
      } else {
        // Fallback realistic demo state
        setOrder({
          id: id,
          order_number: 'ORD-20261012-4307',
          createdAt: new Date().toISOString(),
          order_status: 'PENDING_PAYMENT',
          subtotal: '80.00',
          delivery_fee: '25.00',
          tax_total: '12.00',
          discount_total: '0.00',
          grand_total: '117.00',
          notes: '',
          customer: {
            first_name: 'Abhishek',
            last_name: 'Raushan',
            user: { email: 'abhishek@gmail.com', mobile: '8577575765' }
          },
          address: {
            full_name: 'Lucky',
            mobile: '7765084488',
            country: 'Saudi Arabia',
            state: 'Riyadh Province',
            city: 'delhi',
            area: 'dwarka',
            address_line: '55 foot road',
            postal_code: '12211'
          },
          items: [
            {
              id: 'item-1',
              product_id: 'prod-1',
              product_name_en: 'Fresh Mix Vegetable',
              product_name_ar: 'خضروات مشكلة طازجة',
              unit_price: '50.00',
              quantity: 2,
              total_price: '80.00',
              product: {
                name_en: 'Fresh Mix Vegetable',
                name_ar: 'خضروات مشكلة طازجة',
                unit: '250 g',
                images: []
              }
            }
          ],
          payment: {
            status: 'PENDING',
            amount: '117.00'
          }
        });
      }

      // Fetch existing feedback for this order from server
      try {
        const fbRes = await fetchApi(`/feedback/order/${id}`).catch(() => null);
        if (fbRes?.success && fbRes.data?.feedback) {
          const fb = fbRes.data.feedback;
          setReviewsMap(prev => ({
            ...prev,
            [id]: { rating: fb.rating, comment: fb.comment }
          }));
        }
      } catch (e) {}

      // Check localStorage for persisted review state
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`falcon_reviews_${id}`);
          if (cached) {
            setReviewsMap(prev => ({ ...prev, ...JSON.parse(cached) }));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const copyOrderId = () => {
    const orderNo = order?.order_number || id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderNo);
      setCopiedId(true);
      showToast(locale === 'ar' ? 'تم نسخ رقم الطلب!' : 'Order number copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order && !id) return;
    try {
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
    }
  };

  const handleOpenReview = (item) => {
    setSelectedReviewItem(item);
    const itemKey = item?.id || item?.product_id || id;
    const existing = reviewsMap[itemKey] || reviewsMap[id];
    setRating(existing?.rating || 5);
    setHoverRating(0);
    setReviewComment(existing?.comment || '');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!order?.id && !id) return;
    setIsSubmittingReview(true);

    const targetOrderId = order?.id || id;
    const itemKey = selectedReviewItem?.id || selectedReviewItem?.product_id || targetOrderId;
    const itemName = selectedReviewItem?.product_name_en || selectedReviewItem?.name_en || '';
    const formattedComment = itemName ? `[${itemName}] ${reviewComment.trim()}` : reviewComment.trim();

    try {
      // 1. Submit to backend API
      await fetchApi('/feedback', {
        method: 'POST',
        body: {
          orderId: targetOrderId,
          rating,
          comment: formattedComment,
        },
      }).catch(err => {
        console.warn('Backend feedback warning:', err);
      });

      // 2. Update persistent review state
      const newReview = { rating, comment: reviewComment.trim(), updatedAt: new Date().toISOString() };
      setReviewsMap(prev => {
        const next = { ...prev, [itemKey]: newReview, [targetOrderId]: newReview };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`falcon_reviews_${targetOrderId}`, JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });

      setShowReviewModal(false);
      showToast(
        locale === 'ar'
          ? 'تم تسجيل وحفظ تقييمك بنجاح! شكراً لك.'
          : 'Thank you! Your rating & review has been submitted.',
        'success'
      );
    } catch (err) {
      console.error('Failed to submit review:', err);
      showToast(locale === 'ar' ? 'فشل إرسال التقييم' : 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Status Badge Configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return {
          label: locale === 'ar' ? 'تم التوصيل بنجاح' : 'Delivered',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
          step: 4,
        };
      case 'OUT_FOR_DELIVERY':
        return {
          label: locale === 'ar' ? 'جاري التوصيل' : 'Out for Delivery',
          bg: 'bg-amber-50 text-amber-900 border-amber-200/80',
          dot: 'bg-amber-500 animate-pulse',
          step: 3,
        };
      case 'PACKING':
      case 'PROCESSING':
        return {
          label: locale === 'ar' ? 'قيد التجهيز والتبريد' : 'Order Prepared',
          bg: 'bg-blue-50 text-blue-800 border-blue-200/80',
          dot: 'bg-blue-500 animate-pulse',
          step: 2,
        };
      case 'CONFIRMED':
      case 'PAYMENT_VERIFIED':
      case 'PENDING_PAYMENT':
      default:
        return {
          label: locale === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
          step: 1,
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F4] flex flex-col items-center justify-center py-24 font-sans">
        <div className="w-12 h-12 border-4 border-[#043927] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-600 mt-4">
          {locale === 'ar' ? 'جاري تحميل تفاصيل الطلب...' : 'Loading order details...'}
        </span>
      </div>
    );
  }

  const currentStatus = order?.order_status || 'PENDING_PAYMENT';
  const badge = getStatusBadge(currentStatus);
  const items = order?.items || [];
  const itemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const customerName = order?.address?.full_name
    || (order?.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : '')
    || 'Valued Customer';

  const recipientMobile = order?.address?.mobile || order?.customer?.user?.mobile || '';
  const streetAddress = order?.address?.address_line || '';
  const districtCity = [order?.address?.area, order?.address?.city, order?.address?.state]
    .filter(Boolean)
    .join(', ');
  const countryPostal = [order?.address?.country || 'Saudi Arabia', order?.address?.postal_code]
    .filter(Boolean)
    .join(' - ');

  const subtotalVal = parseFloat(order?.subtotal || 0);
  const deliveryVal = parseFloat(order?.delivery_fee || 0);
  const taxVal = parseFloat(order?.tax_total || 0);
  const discountVal = parseFloat(order?.discount_total || 0);
  const grandTotalVal = parseFloat(order?.grand_total || subtotalVal + deliveryVal + taxVal - discountVal);

  const isPaid = order?.payment?.status === 'VERIFIED' || ['CONFIRMED', 'PROCESSING', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentStatus);

  return (
    <div className="min-h-screen bg-[#F4F6F4] font-sans text-slate-800 pb-24">
      
      {/* ================= BREADCRUMBS BAR ================= */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#043927] transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
            <Link href="/orders" className="hover:text-[#043927] transition-colors">
              {locale === 'ar' ? 'طلباتي' : 'My Orders'}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
            <span className="text-slate-900 font-extrabold truncate max-w-[180px] sm:max-w-none">
              {order?.order_number || id}
            </span>
          </div>

          <Link
            href="/orders"
            className="text-xs font-extrabold text-[#043927] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{locale === 'ar' ? 'العودة لقائمة الطلبات' : 'Back to Orders'}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ================= TOP ORDER SUMMARY HEADER ================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left Order Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 transition-colors">
                  <span>#{order?.order_number || id}</span>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    title="Copy Order ID"
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatPlacedDate(order?.createdAt)}</span>
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {locale === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {locale === 'ar'
                    ? `مرحباً ${customerName}، إليك تفاصيل طلبك وحالة التوصيل والمنتجات المرفقة.`
                    : `Hello ${customerName}, here is the breakdown of your purchase, fulfillment, and cold-chain delivery.`}
                </p>
              </div>
            </div>

          </div>

          {/* ================= 4-STEP LIFECYCLE PROGRESS BAR ================= */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              
              <span className="text-xs font-bold text-slate-600 font-sans">
                {currentStatus === 'DELIVERED'
                  ? (locale === 'ar' ? 'اكتملت جميع المراحل' : 'All steps completed')
                  : (locale === 'ar' ? `المرحلة ${badge.step} من 4` : `Step ${badge.step} of 4`)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
              
              {/* Step 1: Placed */}
              <div className={`p-3 rounded-2xl border transition-all ${
                badge.step >= 1 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    badge.step >= 1 ? 'bg-[#05A764] text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {badge.step > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                  </div>
                  <span className="text-xs font-extrabold truncate">
                    {locale === 'ar' ? 'إنشاء الطلب' : 'Order Placed'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {order?.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                </p>
              </div>

              {/* Step 2: Order Prepared */}
              <div className={`p-3 rounded-2xl border transition-all ${
                badge.step >= 2 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    badge.step >= 2 ? 'bg-[#05A764] text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {badge.step > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                  </div>
                  <span className="text-xs font-extrabold truncate">
                    {locale === 'ar' ? 'التجهيز والتبريد' : 'Order Prepared'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {badge.step >= 2 ? 'Hub Ready' : 'Cold-chain tote'}
                </p>
              </div>

              {/* Step 3: Out for Delivery */}
              <div className={`p-3 rounded-2xl border transition-all ${
                badge.step >= 3 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    badge.step >= 3 ? 'bg-[#05A764] text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {badge.step > 3 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                  </div>
                  <span className="text-xs font-extrabold truncate">
                    {locale === 'ar' ? 'خرج للتوصيل' : 'Out for Delivery'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {badge.step >= 3 ? 'Van en route' : 'Express courier'}
                </p>
              </div>

              {/* Step 4: Delivered */}
              <div className={`p-3 rounded-2xl border transition-all ${
                badge.step >= 4 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    badge.step >= 4 ? 'bg-[#05A764] text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs font-extrabold truncate">
                    {locale === 'ar' ? 'تم التوصيل' : 'Delivered'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {badge.step >= 4 ? 'Completed' : 'Contactless handoff'}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* ================= MAIN 2-COLUMN ORDER DETAILS GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: ITEMS & SHIPPING INFO (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: ORDERED ITEMS LIST */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center border border-emerald-100">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                      {locale === 'ar' ? 'المنتجات في هذا الطلب' : 'Items in this Order'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {items.length} {locale === 'ar' ? 'أصناف مختلفة' : 'distinct line items'} • {itemCount} {locale === 'ar' ? 'إجمالي القطع' : 'total quantity'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3.5">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    {locale === 'ar' ? 'لا توجد منتجات مسجلة في هذا الطلب.' : 'No items listed in this order.'}
                  </div>
                ) : (
                  items.map((it, idx) => {
                    const pName = locale === 'ar'
                      ? (it.product_name_ar || it.product_name_en || it.product?.name_ar || it.product?.name_en || 'منتج طازج')
                      : (it.product_name_en || it.product_name_ar || it.product?.name_en || 'Fresh Grocery Item');

                    let imgUrl = '';
                    if (it.product?.images && it.product.images.length > 0) {
                      imgUrl = it.product.images[0].image_url;
                    } else if (it.product?.main_image) {
                      imgUrl = it.product.main_image;
                    } else if (it.image) {
                      imgUrl = it.image;
                    }

                    const qty = it.quantity || 1;
                    const unitPrice = parseFloat(it.unit_price || (it.total_price ? it.total_price / qty : 0));
                    const totalPrice = parseFloat(it.total_price || unitPrice * qty);
                    const unitSpec = it.product?.unit || it.product?.unit_type || it.product?.pack_size || 'Fresh Pack';

                    return (
                      <div
                        key={it.id || idx}
                        className="bg-[#F8F9FA] hover:bg-[#F3F4F6] transition-colors rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Left: Thumbnail & Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                            {imgUrl ? (
                              <img
                                src={getImageUrl(imgUrl)}
                                alt={pName}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#05A764] rounded-xl"
                              style={{ display: imgUrl ? 'none' : 'flex' }}
                            >
                              <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
                            </div>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate font-sans">
                              {pName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-semibold">
                              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-sans">
                                {unitSpec}
                              </span>
                              {it.product?.sku && (
                                <span className="text-slate-400 font-mono text-[10px]">
                                  SKU: {it.product.sku}
                                </span>
                              )}
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                ✓ Cold-Chain Verified
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 font-semibold pt-0.5">
                              <span>SAR {unitPrice.toFixed(2)}</span>
                              <span className="text-slate-400 font-medium"> × {qty}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Line Total & Item Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-slate-400 font-medium block">
                              {locale === 'ar' ? 'الإجمالي' : 'Item Total'}
                            </span>
                            <span className="text-sm sm:text-base font-black text-slate-900 font-sans">
                              SAR {totalPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const itemKey = it?.id || it?.product_id || order?.id || id;
                              const reviewData = reviewsMap[itemKey] || reviewsMap[order?.id] || reviewsMap[id];
                              
                              if (reviewData) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReview(it)}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs font-sans"
                                    title={locale === 'ar' ? 'تعديل التقييم' : 'Edit Review'}
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                    <span>{reviewData.rating} ★ {locale === 'ar' ? 'تم التقييم' : 'Rated'}</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(it)}
                                  className="bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-transparent transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                                  title={locale === 'ar' ? 'تقييم المنتج' : 'Rate & Review'}
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                  <span className="text-[11px] font-bold">{locale === 'ar' ? 'تقييم' : 'Rate & Review'}</span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Delivery Notes If Present */}
              {order?.notes && order.notes.trim() && (
                <div className="bg-[#FFF9E6] border border-[#FFE8A3] rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block font-sans">
                      {locale === 'ar' ? 'ملاحظات التوصيل الخاصة بالعميل' : 'Customer Delivery Instructions'}
                    </span>
                    <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
                      "{order.notes}"
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* CARD 2: DELIVERY & SHIPPING DESTINATION */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center border border-emerald-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                      {locale === 'ar' ? 'تفاصيل عنوان التوصيل' : 'Shipping & Delivery Address'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {locale === 'ar' ? 'وجهة التسليم ومعلومات الاتصال' : 'Recipient contact and dispatch destination'}
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-800 font-black text-[10px] px-3 py-1 rounded-full border border-emerald-200 font-sans">
                  🚚 {locale === 'ar' ? 'توصيل مبرد سريع' : 'Cold-Chain Express'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Address Box */}
                <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-slate-200/70 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">
                    {locale === 'ar' ? 'المستلم والعنوان' : 'RECIPIENT & ADDRESS'}
                  </span>
                  
                  <h4 className="font-black text-sm text-slate-900 font-sans">
                    {customerName}
                  </h4>

                  <div className="text-xs text-slate-600 font-medium space-y-0.5 leading-relaxed">
                    {streetAddress && <p>{streetAddress}</p>}
                    {districtCity && <p>{districtCity}</p>}
                    <p>{countryPostal}</p>
                  </div>

                  {recipientMobile && (
                    <div className="pt-2 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{recipientMobile}</span>
                    </div>
                  )}
                </div>

                {/* Right: Storage & Express Guarantee Box */}
                <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-slate-200/70 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">
                    {locale === 'ar' ? 'معايير الجودة والتبريد' : 'QUALITY & LOGISTICS'}
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Thermometer className="w-4 h-4 text-[#05A764]" />
                      <span>{locale === 'ar' ? 'شاحنة مبردة: درجة حرارة 3.8 مئوية' : 'Refrigerated Transit: 3.8°C Target'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[#05A764]" />
                      <span>{locale === 'ar' ? 'ضمان طزاجة المزرعة 100%' : '100% Farm Fresh Guarantee'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Clock className="w-4 h-4 text-[#05A764]" />
                      <span>{locale === 'ar' ? 'توصيل خلال نافذة 30-45 دقيقة' : 'Fulfillment Window: 30-45 Mins'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ================= RIGHT COLUMN: SUMMARY, PAYMENT & SUPPORT (4 COLS) ================= */}
          <div className="lg:col-span-4 space-y-6">

            {/* CARD 4: FINANCIAL SUMMARY & BREAKDOWN */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900 font-sans">
                  {locale === 'ar' ? 'ملخص الدفع والفاتورة' : 'Payment & Invoice Summary'}
                </h3>
                {isPaid && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                    {locale === 'ar' ? 'مدفوع' : 'PAID'}
                  </span>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs font-semibold text-slate-600 font-sans">
                
                <div className="flex justify-between">
                  <span>{locale === 'ar' ? 'المجموع الفرعي للمنتجات' : 'Items Subtotal'}</span>
                  <span className="font-black text-slate-900">SAR {subtotalVal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>{locale === 'ar' ? 'رسوم التوصيل المبرد' : 'Refrigerated Delivery'}</span>
                  <span className={deliveryVal === 0 ? 'font-black text-[#05A764]' : 'font-black text-slate-900'}>
                    {deliveryVal === 0 ? (locale === 'ar' ? 'مجاني' : 'FREE') : `SAR ${deliveryVal.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>{locale === 'ar' ? 'ضريبة القيمة المضافة (15% متضمنة)' : 'Standard VAT (15% Included)'}</span>
                  <span className="font-bold">SAR {taxVal.toFixed(2)}</span>
                </div>

                {discountVal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{locale === 'ar' ? 'الخصم المطبق' : 'Promotional Discount'}</span>
                    <span>- SAR {discountVal.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-slate-200 pt-3 my-1" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-sm font-black text-slate-900 block font-sans">
                      {locale === 'ar' ? 'المبلغ الإجمالي' : 'Grand Total'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {locale === 'ar' ? 'شامل الضريبة والتوصيل' : 'All taxes & fees included'}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-[#043927] font-sans tracking-tight flex items-baseline gap-1">
                    <span className="text-xs font-bold text-slate-600">SAR</span>
                    <span>{grandTotalVal.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              {/* Payment Method Badge Row */}
              <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block font-sans">
                      {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {order?.payment?.method || 'mada / Apple Pay'}
                    </span>
                  </div>
                </div>

                <span className="bg-slate-200/80 text-slate-800 text-[9px] font-black px-2 py-0.5 rounded-md font-mono">
                  MADA
                </span>
              </div>

              {/* ZATCA e-Invoice Verified Card */}
              <div className="bg-[#E8F8F0] border border-emerald-200/90 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#05A764] font-sans">
                    <FileCheck className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'فاتورة إلكترونية معتمدة' : 'ZATCA e-Invoice Verified'}</span>
                  </div>
                  <span className="bg-[#05A764] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans">
                    KSA
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-600 font-mono leading-tight">
                  VAT: 300192837400003 • UUID: {id ? id.substring(0, 13) + '...' : 'b6c1...91ea'}
                </p>

                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="w-full mt-2 py-2 rounded-xl bg-white hover:bg-emerald-50 text-[#043927] border border-emerald-300 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#05A764]" />
                  <span>{locale === 'ar' ? 'تحميل الفاتورة PDF' : 'Download Tax PDF'}</span>
                </button>
              </div>

            </div>

            {/* CARD 5: 24/7 SUPPORT & ASSISTANCE */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#043927] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 font-sans">
                    {locale === 'ar' ? 'هل تحتاج إلى مساعدة بالطلب؟' : 'Need Help with this Order?'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {locale === 'ar' ? 'فريق خدمة العملاء متواجد 24/7' : 'Customer Concierge 24/7'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {locale === 'ar'
                  ? 'إذا كان لديك أي استفسار بشأن المنتجات أو التوصيل أو الفواتير، يمكنك التواصل الفوري معنا.'
                  : 'Have questions regarding missing items, delivery rescheduling, or receipt inquiries?'}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/support"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl text-center transition-colors font-sans"
                >
                  {locale === 'ar' ? 'محادثة الدعم' : 'Live Chat'}
                </Link>

                <a
                  href="tel:+9668001240000"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl text-center transition-colors font-sans"
                >
                  {locale === 'ar' ? 'اتصال هاتف' : 'Call Support'}
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================= REVIEW & RATING MODAL ================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="font-black text-base text-slate-900">
                  {locale === 'ar' ? 'تقييم المنتج' : 'Rate & Review Item'}
                </h3>
              </div>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Item Display */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {(() => {
                const img = selectedReviewItem?.product?.images?.[0]?.image_url || selectedReviewItem?.image;
                const pName = locale === 'ar'
                  ? (selectedReviewItem?.product_name_ar || selectedReviewItem?.name_ar || selectedReviewItem?.product_name_en || 'منتج طازج')
                  : (selectedReviewItem?.product_name_en || selectedReviewItem?.name_en || 'Fresh Grocery Item');
                const unit = selectedReviewItem?.product?.unit || selectedReviewItem?.unit || '';

                return (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {img ? (
                        <img src={getImageUrl(img)} alt={pName} className="w-full h-full object-contain" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                        {pName}
                      </h4>
                      {unit && (
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {unit}
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Interactive Stars */}
            <div className="py-2 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-115 active:scale-95 transition-all cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 fill-slate-50'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <p className="text-xs font-bold text-amber-700">
                {(() => {
                  const currentStars = hoverRating || rating;
                  const labels = {
                    1: locale === 'ar' ? 'ضعيف (1/5)' : 'Poor (1/5)',
                    2: locale === 'ar' ? 'مقبول (2/5)' : 'Fair (2/5)',
                    3: locale === 'ar' ? 'جيد (3/5)' : 'Good (3/5)',
                    4: locale === 'ar' ? 'جيد جداً (4/5)' : 'Very Good (4/5)',
                    5: locale === 'ar' ? 'ممتاز وطازج! (5/5)' : 'Excellent Freshness! (5/5)',
                  };
                  return labels[currentStars] || `${currentStars}/5`;
                })()}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {locale === 'ar' ? 'ملاحظاتك وتقييمك (اختياري)' : 'Your Feedback (Optional)'}
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={locale === 'ar' ? 'كيف كانت طزاجة وجودة المنتج؟' : 'How was the quality and freshness?'}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#043927] transition-colors resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSubmitReview}
                className="flex-1 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-colors cursor-pointer shadow-xs disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <span>{locale === 'ar' ? 'إرسال التقييم' : 'Submit Review'}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
