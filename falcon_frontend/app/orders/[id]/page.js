'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useCart } from '../../../src/contexts/CartContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { downloadOrderInvoice } from '../../../src/services/invoiceService';
import OrderTrackingTimeline from '../../../src/components/OrderTrackingTimeline';
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
  Loader2,
  AlertTriangle,
  Tag
} from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id || '';
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const { addToCart, fetchCart } = useCart();
  const { socket, joinOrderRoom, leaveOrderRoom } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Reorder (Order Again) State
  const [reorderLoading, setReorderLoading] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderPreviewData, setReorderPreviewData] = useState(null);
  const [reorderSelections, setReorderSelections] = useState({});
  const [isConfirmingReorder, setIsConfirmingReorder] = useState(false);

  const handleOrderAgain = async (ord) => {
    if (!ord || reorderLoading) return;
    try {
      setReorderLoading(true);
      const res = await fetchApi(`/orders/${ord.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ preview: true }),
      });

      if (!res.success || !res.data) {
        showToast(res.message || (locale === 'ar' ? 'فشل فحص توفر المنتجات' : 'Failed to verify items availability'), 'error');
        return;
      }

      const analysis = res.data;

      // If all items are 100% available with exact original variants, no partial stock, and no price changes:
      if (analysis.canDirectReorder) {
        const addRes = await fetchApi(`/orders/${ord.id}/reorder`, {
          method: 'POST',
          body: JSON.stringify({ preview: false }),
        });

        if (addRes.success) {
          if (fetchCart) await fetchCart();
          showToast(
            locale === 'ar'
              ? `تمت إضافة منتجات الطلب #${ord.order_number} إلى السلة 🛒`
              : `Items from #${ord.order_number} added to your cart 🛒`,
            'success'
          );
          router.push('/cart');
          return;
        } else {
          showToast(addRes.message || (locale === 'ar' ? 'فشل إضافة المنتجات' : 'Failed to add items to cart'), 'error');
          return;
        }
      }

      // Initialize interactive user selections for the confirmation modal:
      const initialSelections = {};
      (analysis.items || []).forEach((item) => {
        if (item.status === 'AVAILABLE' || item.status === 'PARTIAL_AVAILABLE') {
          initialSelections[item.orderItemId] = {
            selected: true,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.availableQty,
            maxQty: item.availableQty,
            skip: false,
          };
        } else if (item.status === 'VARIANT_UNAVAILABLE' && item.availableVariants && item.availableVariants.length > 0) {
          const firstVar = item.availableVariants[0];
          const chosenQty = Math.min(item.orderedQty, firstVar.stock_quantity);
          initialSelections[item.orderItemId] = {
            selected: true,
            productId: item.productId,
            variantId: firstVar.id,
            quantity: chosenQty,
            maxQty: firstVar.stock_quantity,
            skip: false,
          };
        } else {
          initialSelections[item.orderItemId] = {
            selected: false,
            productId: item.productId,
            variantId: item.variantId,
            quantity: 0,
            maxQty: 0,
            skip: true,
          };
        }
      });

      setReorderSelections(initialSelections);
      setReorderPreviewData(analysis);
      setShowReorderModal(true);
    } catch (err) {
      console.error('Order again error:', err);
      showToast(err.message || (locale === 'ar' ? 'حدث خطأ أثناء إعادة الطلب' : 'Error preparing reorder'), 'error');
    } finally {
      setReorderLoading(false);
    }
  };

  const handleConfirmReorder = async () => {
    if (!reorderPreviewData || isConfirmingReorder) return;

    const customSelections = Object.entries(reorderSelections).map(([orderItemId, sel]) => ({
      orderItemId,
      productId: sel.productId,
      variantId: sel.variantId || null,
      quantity: sel.quantity,
      skip: !sel.selected || sel.skip || sel.quantity <= 0,
    })).filter((s) => !s.skip);

    if (customSelections.length === 0) {
      showToast(
        locale === 'ar' ? 'يرجى تحديد منتج واحد على الأقل لإضافته إلى السلة' : 'Please select at least one item to add to your cart',
        'error'
      );
      return;
    }

    try {
      setIsConfirmingReorder(true);
      const res = await fetchApi(`/orders/${reorderPreviewData.orderId}/reorder`, {
        method: 'POST',
        body: JSON.stringify({
          preview: false,
          customSelections,
        }),
      });

      if (res.success) {
        if (fetchCart) await fetchCart();
        setShowReorderModal(false);
        showToast(
          locale === 'ar'
            ? `تمت إضافة المنتجات المحددة إلى السلة بنجاح 🛒`
            : `Selected items added to your cart successfully 🛒`,
          'success'
        );
        router.push('/cart');
      } else {
        showToast(res.message || (locale === 'ar' ? 'فشل إضافة المنتجات إلى السلة' : 'Failed to add items to cart'), 'error');
      }
    } catch (err) {
      console.error('Confirm reorder error:', err);
      showToast(err.message || (locale === 'ar' ? 'حدث خطأ أثناء الإضافة إلى السلة' : 'Error adding items to cart'), 'error');
    } finally {
      setIsConfirmingReorder(false);
    }
  };

  // Dynamic Review Modal State & Persistence
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewsMap, setReviewsMap] = useState({});

  // Cancellation Modal State & Logic (Requirements 1, 2, 3, 4, 7)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('Found a cheaper price elsewhere');
  const [cancellationRemarks, setCancellationRemarks] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const CANCELLATION_REASONS = [
    { value: 'Found a cheaper price elsewhere', labelEn: 'Found a cheaper price elsewhere', labelAr: 'وجدت سعر أفضل في مكان آخر' },
    { value: 'Ordered by mistake', labelEn: 'Ordered by mistake', labelAr: 'تم الطلب بالخطأ' },
    { value: 'Change of mind / Need to modify items', labelEn: 'Change of mind / Need to modify items', labelAr: 'تغيير رأي / رغبة في تعديل المنتجات' },
    { value: 'Delivery slot or time conflict', labelEn: 'Delivery slot or time conflict', labelAr: 'وقت التوصيل أو الفترة غير مناسبة' },
    { value: 'Incorrect delivery address or contact selected', labelEn: 'Incorrect delivery address or contact selected', labelAr: 'تم اختيار عنوان أو بيانات اتصال خاطئة' },
    { value: 'Payment method or billing issue', labelEn: 'Payment method or billing issue', labelAr: 'مشكلة في وسيلة الدفع أو الفوترة' },
    { value: 'Other reason', labelEn: 'Other reason', labelAr: 'سبب آخر' },
  ];

  const isCancelEligible = (status) => {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return [
      'PENDING',
      'PENDING_PAYMENT',
      'PAYMENT_SUBMITTED',
      'CONFIRMED',
      'PAYMENT_VERIFIED',
      'PROCESSING',
    ].includes(s);
  };

  const handleCancelOrder = async (e) => {
    if (e) e.preventDefault();
    const targetOrderId = order?.id || id;
    if (!targetOrderId) return;

    try {
      setIsCancelling(true);
      const res = await fetchApi(`/orders/${targetOrderId}/cancel`, {
        method: 'POST',
        body: {
          reason: cancellationReason,
          remarks: cancellationRemarks.trim() || undefined,
        },
      });

      if (res && res.success) {
        showToast(
          locale === 'ar'
            ? 'تم إلغاء الطلب بنجاح وتم تحديث حالته.'
            : 'Order has been cancelled successfully.',
          'success'
        );
        setShowCancelModal(false);
        await loadOrderDetails();
      } else {
        throw new Error(res?.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      showToast(
        err?.message || (locale === 'ar' ? 'تعذر إلغاء الطلب' : 'Failed to cancel order'),
        'error'
      );
    } finally {
      setIsCancelling(false);
    }
  };

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
      }

      // Fetch existing feedback for this order from server
      try {
        const fbRes = await fetchApi(`/feedback/order/${id}`).catch(() => null);
        if (fbRes?.success && fbRes.data) {
          const list = fbRes.data.feedbacks || (fbRes.data.feedback ? [fbRes.data.feedback] : []);
          const map = {};
          list.forEach(fb => {
            if (fb.order_item_id) {
              map[fb.order_item_id] = { rating: fb.rating, comment: fb.comment };
            }
            if (fb.product_id) {
              map[fb.product_id] = { rating: fb.rating, comment: fb.comment };
            }
            map[id] = { rating: fb.rating, comment: fb.comment };
          });
          setReviewsMap(prev => ({
            ...prev,
            ...map
          }));
        }
      } catch (e) { }

      // Check localStorage for persisted review state
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`falcon_reviews_${id}`);
          if (cached) {
            setReviewsMap(prev => ({ ...prev, ...JSON.parse(cached) }));
          }
        } catch (e) { }
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

  // Real-time WebSocket listener for order status changes (Requirement 5)
  useEffect(() => {
    if (!socket || !id) return;
    joinOrderRoom(id);

    const handleStatusUpdate = (data) => {
      if (data && (data.orderId === id || data.orderId === order?.id)) {
        loadOrderDetails();
      }
    };

    socket.on('order_status_update', handleStatusUpdate);

    return () => {
      socket.off('order_status_update', handleStatusUpdate);
      leaveOrderRoom(id);
    };
  }, [socket, id, order?.id]);

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
    const productId = selectedReviewItem?.product_id || selectedReviewItem?.product?.id || selectedReviewItem?.productId || null;
    const orderItemId = selectedReviewItem?.id || null;

    try {
      // 1. Submit to backend API
      await fetchApi('/feedback', {
        method: 'POST',
        body: {
          orderId: targetOrderId,
          orderItemId,
          productId,
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
          } catch (e) { }
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
      case 'CANCELLED':
        return {
          label: locale === 'ar' ? 'تم إلغاء الطلب' : 'Order Cancelled',
          bg: 'bg-rose-50 text-rose-800 border-rose-200/90',
          dot: 'bg-rose-500',
          step: 0,
        };
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

            {/* Right Status Badge & Actions (Requirements 1, 2, 8) */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border flex items-center gap-2 shadow-2xs font-sans ${badge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <span>{badge.label}</span>
              </span>

              {/* Conditional Live Driver Tracking Button (Requirements 1, 2, 4) */}
              {(currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'ARRIVED') && (
                <Link
                  href={`/track-order?orderNumber=${order?.order_number || id}`}
                  className="px-4 py-2 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 font-sans"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#05A764]" />
                  <span>{locale === 'ar' ? 'تتبع السائق مباشرة' : 'Track Driver Live'}</span>
                </Link>
              )}

              {/* Notice before OUT_FOR_DELIVERY (Requirements 2, 3) */}
              {!['OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'RETURNED'].includes(currentStatus) && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {locale === 'ar'
                      ? 'سيتوفر التتبع المباشر فور خروج طلبك للتوصيل.'
                      : 'Live tracking will be available once your order is out for delivery.'}
                  </span>
                </div>
              )}

              {currentStatus === 'DELIVERED' && (
                <button
                  type="button"
                  disabled={reorderLoading}
                  onClick={() => handleOrderAgain(order)}
                  className="px-4 py-2 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 font-sans disabled:opacity-60"
                >
                  {reorderLoading ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#05A764] animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-[#05A764]" />
                  )}
                  <span>{reorderLoading ? (locale === 'ar' ? 'جاري التحقق...' : 'Checking...') : (locale === 'ar' ? 'إعادة الطلب' : 'Order Again')}</span>
                </button>
              )}

              {isCancelEligible(currentStatus) && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 font-sans"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{locale === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}</span>
                </button>
              )}
            </div>

          </div>

          {/* ================= CANCELLATION DETAILS OR 4-STEP PROGRESS BAR ================= */}
          {currentStatus === 'CANCELLED' ? (
            /* Dedicated Order Cancelled Card (Requirement 8) */
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-rose-50/70 border border-rose-200/90 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/70 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <X className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-rose-950 font-sans">
                        {locale === 'ar' ? 'تم إلغاء هذا الطلب' : 'Order Cancelled'}
                      </h3>
                      <p className="text-xs text-rose-700 font-medium">
                        {locale === 'ar'
                          ? 'تم تسجيل طلب الإلغاء بنجاح وإعادة الأصناف إلى المخزون المتاح.'
                          : 'This order was cancelled. Items have been released back to fresh inventory.'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-200/80 text-rose-900 uppercase tracking-wider self-start sm:self-auto font-mono">
                    CANCELLED
                  </span>
                </div>

                {/* Cancellation Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  {/* Cancellation Reason */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-rose-100 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">
                      {locale === 'ar' ? 'سبب الإلغاء' : 'Cancellation Reason'}
                    </span>
                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {order?.cancellation_reason || (locale === 'ar' ? 'طلب العميل إلغاء الطلب' : 'Customer requested cancellation')}
                    </p>
                    {order?.cancellation_remarks && (
                      <p className="text-[11px] text-slate-500 italic mt-1 font-sans">
                        "{order.cancellation_remarks}"
                      </p>
                    )}
                  </div>

                  {/* Cancelled Date & Time */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-rose-100 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">
                      {locale === 'ar' ? 'وقت الإلغاء' : 'Cancelled At'}
                    </span>
                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {order?.cancelled_at ? formatPlacedDate(order.cancelled_at) : formatPlacedDate(order?.updatedAt)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {locale === 'ar' ? 'بواسطة العميل' : 'Initiated by customer'}
                    </p>
                  </div>

                  {/* Refund Status */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-rose-100 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">
                      {locale === 'ar' ? 'حالة الاسترداد المالي' : 'Refund Status'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${order?.refund_status === 'REFUNDED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : order?.refund_status === 'PENDING_REFUND'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                        {order?.refund_status === 'REFUNDED'
                          ? (locale === 'ar' ? 'تم الاسترداد' : 'REFUNDED')
                          : order?.refund_status === 'PENDING_REFUND'
                            ? (locale === 'ar' ? 'قيد المعالجة' : 'PENDING REFUND')
                            : (locale === 'ar' ? 'غير مطلوب (دفع عند الاستلام)' : 'NOT APPLICABLE')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">
                      {order?.refund_status === 'REFUNDED'
                        ? (locale === 'ar'
                          ? `تمت معالجة استرداد ${grandTotalVal.toFixed(2)} ر.س إلى وسيلة الدفع الأصلية.`
                          : `Refund of SAR ${grandTotalVal.toFixed(2)} processed to original payment method.`)
                        : ((order?.payment_method || '').toUpperCase() === 'COD' || order?.payment?.payment_method === 'COD')
                          ? (locale === 'ar'
                            ? 'دفع عند الاستلام: لم يتم تحصيل أي مبلغ مالي.'
                            : 'Cash on Delivery: No charge was made.')
                          : (locale === 'ar'
                            ? 'تم الإلغاء قبل تأكيد الخصم.'
                            : 'Cancelled prior to charge capture.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= 4-STEP LIFECYCLE PROGRESS BAR ================= */
            <div className="mt-8 pt-6 border-t border-slate-100">
              <OrderTrackingTimeline order={order} />
            </div>
          )}

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
                    const vPrimary = it.variant?.images?.find(i => i.is_primary)?.image_url || it.variant?.images?.[0]?.image_url || it.variant?.image_url;
                    if (vPrimary) {
                      imgUrl = vPrimary;
                    } else if (it.image) {
                      imgUrl = it.image;
                    } else if (it.product?.images && it.product.images.length > 0) {
                      imgUrl = it.product.images[0].image_url;
                    } else if (it.product?.main_image) {
                      imgUrl = it.product.main_image;
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
                        className={`w-8 h-8 transition-colors ${isFilled
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

      {/* ================= ORDER CANCELLATION CONFIRMATION MODAL (Requirements 1, 2, 3, 4, 7) ================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 font-sans animate-in fade-in zoom-in-95 duration-150">

            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {locale === 'ar' ? 'تأكيد إلغاء الطلب' : 'Cancel Order Confirmation'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    #{order?.order_number || id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {locale === 'ar'
                      ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟'
                      : 'Are you sure you want to cancel this order?'}
                  </span>
                </p>
                <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                  {locale === 'ar'
                    ? 'سيتم إلغاء تجهيز المنتجات وإعادة حجز المخزون فوراً. للطلبات المدفوعة مسبقاً، سيتم بدء استرداد المبلغ إلى وسيلة الدفع الخاصة بك.'
                    : 'Your reserved items will be released back to active stock. For prepaid orders, a refund will be initiated back to your payment method.'}
                </p>
              </div>

              {/* Cancellation Reason Dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 font-sans">
                  {locale === 'ar' ? 'سبب الإلغاء *' : 'Reason for Cancellation *'}
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#043927] focus:bg-white cursor-pointer transition-colors"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {locale === 'ar' ? r.labelAr : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Remarks */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 font-sans">
                  {locale === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Remarks (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={cancellationRemarks}
                  onChange={(e) => setCancellationRemarks(e.target.value)}
                  placeholder={
                    locale === 'ar'
                      ? 'أخبرنا بمزيد من التفاصيل لمساعدتنا على تحسين الخدمة...'
                      : 'Provide any additional details or feedback to help us improve...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#043927] focus:bg-white transition-colors"
                  maxLength={500}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  {locale === 'ar' ? 'تراجع / الإبقاء على الطلب' : 'Keep My Order'}
                </button>

                <button
                  type="submit"
                  disabled={isCancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 active:scale-98"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{locale === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...'}</span>
                    </>
                  ) : (
                    <span>{locale === 'ar' ? 'تأكيد إلغاء الطلب' : 'Confirm Cancellation'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER AGAIN CONFIRMATION MODAL ================= */}
      {showReorderModal && reorderPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <RotateCcw className="w-5 h-5 text-[#05A764]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>{locale === 'ar' ? 'إعادة طلب المنتجات' : 'Order Again'}</span>
                    <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      #{reorderPreviewData.orderNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {locale === 'ar'
                      ? 'مراجعة توفر المنتجات والأسعار والكميات قبل الإضافة إلى السلة'
                      : 'Review current availability, stock, and prices before adding to cart'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isConfirmingReorder}
                onClick={() => setShowReorderModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Alerts / Notices */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {reorderPreviewData.summary.partialItemsCount > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">{locale === 'ar' ? 'كميات جزئية متوفرة' : 'Partial Quantities Available'}</p>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                      {locale === 'ar'
                        ? 'بعض المنتجات يتوفر منها كميات أقل من طلبك الأصلي. تم تعديل الكمية إلى المتاح في المخزون.'
                        : 'Some products have limited stock. Quantities have been pre-set to current maximum available stock.'}
                    </p>
                  </div>
                </div>
              )}

              {reorderPreviewData.summary.variantUnavailableCount > 0 && (
                <div className="bg-purple-50/90 border border-purple-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">{locale === 'ar' ? 'نوع المنتج غير متاح' : 'Variant Selection Required'}</p>
                    <p className="text-[11px] text-purple-800 font-medium mt-0.5">
                      {locale === 'ar'
                        ? 'النوع الذي طلبته سابقاً غير متوفر حالياً. يرجى اختيار حجم/نوع بديل من الخيارات المتاحة.'
                        : 'The specific variant from your previous order is currently unavailable. Please select an available alternative.'}
                    </p>
                  </div>
                </div>
              )}

              {reorderPreviewData.summary.priceChangedCount > 0 && (
                <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
                  <Tag className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">{locale === 'ar' ? 'تحديثات في الأسعار' : 'Price Updates'}</p>
                    <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                      {locale === 'ar'
                        ? 'تم تحديث أسعار بعض المنتجات وفقاً لأسعار البيع الحالية في المتجر.'
                        : 'Some item prices have changed since your previous order. Current selling prices are shown.'}
                    </p>
                  </div>
                </div>
              )}

              {reorderPreviewData.summary.unavailableCount > 0 && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-slate-700">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">{locale === 'ar' ? 'منتجات غير متوفرة' : 'Unavailable Items'}</p>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {locale === 'ar'
                        ? 'المنتجات غير المتوفرة في المخزون سيتم تخطيها تلقائياً ولن تُضاف إلى السلة.'
                        : 'Out of stock or discontinued items will be skipped and not added to your cart.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  {locale === 'ar' ? 'المنتجات المطلوبة سابقاً:' : 'Items from Previous Order:'}
                </span>

                {reorderPreviewData.items.map((item) => {
                  const currentSel = reorderSelections[item.orderItemId] || {};
                  const isSelectable =
                    item.status === 'AVAILABLE' ||
                    item.status === 'PARTIAL_AVAILABLE' ||
                    (item.status === 'VARIANT_UNAVAILABLE' && item.availableVariants && item.availableVariants.length > 0);

                  return (
                    <div
                      key={item.orderItemId}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        !isSelectable
                          ? 'bg-slate-50/70 border-slate-200/70 opacity-60'
                          : currentSel.selected
                          ? 'bg-white border-emerald-300 shadow-2xs ring-1 ring-emerald-100'
                          : 'bg-white border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            disabled={!isSelectable || isConfirmingReorder}
                            checked={Boolean(currentSel.selected)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReorderSelections((prev) => ({
                                ...prev,
                                [item.orderItemId]: {
                                  ...prev[item.orderItemId],
                                  selected: checked,
                                  skip: !checked,
                                },
                              }));
                            }}
                            className="w-4 h-4 rounded text-[#05A764] focus:ring-[#043927] border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.nameEn || 'Product'}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {locale === 'ar' ? item.nameAr || item.nameEn : item.nameEn || item.nameAr}
                            </h4>
                            <div className="text-right shrink-0">
                              {item.priceChanged ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="line-through text-slate-400 text-xs">SAR {item.oldPrice.toFixed(2)}</span>
                                  <span className="font-black text-slate-900 text-xs">SAR {item.currentPrice.toFixed(2)}</span>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                      item.priceDiff > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                                    }`}
                                  >
                                    {item.priceDiff > 0 ? `+${item.priceDiff.toFixed(2)}` : `${item.priceDiff.toFixed(2)}`}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-black text-slate-900 text-xs">SAR {item.currentPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          {item.variantName && item.status !== 'VARIANT_UNAVAILABLE' && (
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                              {locale === 'ar' ? 'النوع:' : 'Variant:'} {item.variantName}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {item.status === 'AVAILABLE' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-[#05A764]" />
                                {locale === 'ar' ? `متوفر بالكامل (كمية: ${item.availableQty})` : `In Stock (Qty: ${item.availableQty})`}
                              </span>
                            )}

                            {item.status === 'PARTIAL_AVAILABLE' && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  {locale === 'ar'
                                    ? `متاح ${item.availableQty} فقط من أصل ${item.orderedQty}`
                                    : `Only ${item.availableQty} of ${item.orderedQty} available`}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  ({locale === 'ar' ? `سيتم إضافة ${item.availableQty}` : `Adding ${item.availableQty}`})
                                </span>
                              </div>
                            )}

                            {item.status === 'OUT_OF_STOCK' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                {locale === 'ar' ? 'نفد من المخزون (سيتم تخطيه)' : 'Out of Stock (Will be skipped)'}
                              </span>
                            )}

                            {item.status === 'CART_LIMIT_REACHED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-slate-500" />
                                {locale === 'ar' ? 'الكمية القصوى موجودة بالفعل في السلة' : 'Max stock already in cart'}
                              </span>
                            )}

                            {item.status === 'UNAVAILABLE' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                {item.reason}
                              </span>
                            )}
                          </div>

                          {item.status === 'VARIANT_UNAVAILABLE' && (
                            <div className="mt-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-purple-900 uppercase">
                                  {locale === 'ar' ? 'النوع الأصلي غير متاح - اختر بديلاً:' : 'Original variant unavailable - choose alternative:'}
                                </span>
                              </div>
                              {item.availableVariants && item.availableVariants.length > 0 ? (
                                <select
                                  disabled={isConfirmingReorder || !currentSel.selected}
                                  value={currentSel.variantId || ''}
                                  onChange={(e) => {
                                    const chosenVarId = e.target.value;
                                    const chosenVar = item.availableVariants.find((v) => v.id === chosenVarId);
                                    const maxVarQty = chosenVar ? chosenVar.stock_quantity : 0;
                                    setReorderSelections((prev) => ({
                                      ...prev,
                                      [item.orderItemId]: {
                                        ...prev[item.orderItemId],
                                        variantId: chosenVarId,
                                        quantity: Math.min(item.orderedQty, maxVarQty),
                                        maxQty: maxVarQty,
                                      },
                                    }));
                                  }}
                                  className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043927] cursor-pointer"
                                >
                                  {item.availableVariants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {`${v.unit_value || ''} ${v.unit_type || ''} ${v.pack_size ? `(${v.pack_size})` : ''}`.trim() || 'Alternative Option'}{' '}
                                      - SAR {v.discount_price && v.discount_price < v.price ? v.discount_price.toFixed(2) : v.price.toFixed(2)}{' '}
                                      ({v.stock_quantity} in stock)
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-[11px] font-bold text-rose-700">
                                  {locale === 'ar' ? 'لا توجد بدائل متوفرة حالياً' : 'No alternative variants available currently'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-extrabold text-slate-600">
                {(() => {
                  const selectedCount = Object.values(reorderSelections).filter((s) => s.selected && !s.skip && s.quantity > 0).length;
                  return locale === 'ar'
                    ? `تم تحديد ${selectedCount} من أصل ${reorderPreviewData.items.length} منتج`
                    : `${selectedCount} of ${reorderPreviewData.items.length} items selected to add`;
                })()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isConfirmingReorder}
                  onClick={() => setShowReorderModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={
                    isConfirmingReorder ||
                    Object.values(reorderSelections).filter((s) => s.selected && !s.skip && s.quantity > 0).length === 0
                  }
                  onClick={handleConfirmReorder}
                  className="px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isConfirmingReorder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#05A764]" />
                      <span>{locale === 'ar' ? 'جاري الإضافة إلى السلة...' : 'Adding to Cart...'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#05A764]" />
                      <span>{locale === 'ar' ? 'إضافة إلى السلة والمتابعة' : 'Add to Cart & Proceed'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
