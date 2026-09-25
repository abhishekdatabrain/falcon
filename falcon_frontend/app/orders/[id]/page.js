'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { useToast } from '../../../src/contexts/ToastContext';
import LiveTrackingMap from '../../../src/components/LiveTrackingMap';
import {
  Package,
  Truck,
  Download,
  Star,
  CheckCircle2,
  MapPin,
  Landmark,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Phone,
  FileText,
  X
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { socket, joinDeliveryRoom, leaveDeliveryRoom } = useSocket();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  // Feedback Form State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const loadOrderDetails = async () => {
    try {
      const res = await fetchApi(`/orders/${id}`);
      if (res.success && res.data.order) {
        setOrder(res.data.order);
        if (res.data.order.feedback) {
          setFeedbackSubmitted(true);
        }
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOrderDetails();
  }, [id]);

  useEffect(() => {
    if (order && order.delivery) {
      const deliveryId = order.delivery.id;
      joinDeliveryRoom(deliveryId);

      if (order.delivery.current_lat && order.delivery.current_lng) {
        setDriverLocation({
          lat: parseFloat(order.delivery.current_lat),
          lng: parseFloat(order.delivery.current_lng),
        });
      }

      if (socket) {
        socket.on('driverLocationUpdate', (data) => {
          if (data.deliveryId === deliveryId) {
            setDriverLocation({ lat: data.lat, lng: data.lng });
          }
        });
      }

      return () => {
        leaveDeliveryRoom(deliveryId);
        if (socket) socket.off('driverLocationUpdate');
      };
    }
  }, [order, socket]);

  const handleDownloadInvoice = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    window.open(`${API_BASE}/invoices/order/${order.id}/pdf`, '_blank');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment,
        }),
      });

      if (res.success) {
        setFeedbackSubmitted(true);
        setShowFeedbackModal(false);
        showToast(
          locale === 'ar' ? 'شكراً لتقييمك الفائق!' : 'Thank you for your feedback!',
          'success'
        );
        await loadOrderDetails();
      } else {
        showToast(res.message || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return {
          bg: 'bg-emerald-50 text-[#05442e] border-emerald-200',
          label: locale === 'ar' ? 'تم التوصيل بنجاح ✓' : 'Delivered ✓',
        };
      case 'OUT_FOR_DELIVERY':
      case 'ARRIVED':
        return {
          bg: 'bg-teal-50 text-teal-900 border-teal-200 animate-pulse',
          label: locale === 'ar' ? 'جاري التوصيل 🚚' : 'Out for Delivery 🚚',
        };
      case 'PAYMENT_VERIFIED':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return {
          bg: 'bg-emerald-100 text-[#05442e] border-emerald-300',
          label: locale === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed',
        };
      case 'PAYMENT_SUBMITTED':
        return {
          bg: 'bg-sky-50 text-sky-900 border-sky-200',
          label: locale === 'ar' ? 'جاري التحقق من الدفع' : 'Payment Under Review',
        };
      case 'PENDING_PAYMENT':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          label: locale === 'ar' ? 'في انتظار التحويل البنكي' : 'Pending Bank Transfer',
        };
      case 'CANCELLED':
      case 'PAYMENT_REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: locale === 'ar' ? 'ملغي' : 'Cancelled',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: status ? status.replace(/_/g, ' ') : 'Processing',
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#05442e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] font-sans py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {locale === 'ar' ? 'لم يتم العثور على الطلب' : 'Order Not Found'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {locale === 'ar' ? 'الطلب غير موجود أو ليس لديك صلاحية للوصول إليه.' : 'Order does not exist or you do not have permission.'}
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-md"
          >
            <span>{locale === 'ar' ? 'العودة لطلباتي' : 'Back to My Orders'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const isLiveTrackingActive = order.delivery && ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.order_status);
  const statusBadge = getStatusBadge(order.order_status);

  return (
    <div className="min-h-screen bg-[#f7f9f7] font-sans pb-28">
      
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/orders" className="hover:text-[#05442e] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{locale === 'ar' ? 'قائمة طلباتي' : 'My Orders'}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
            <span className="text-slate-900 font-black">#{order.order_number}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Main Order Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden space-y-6">
          <div className="h-2 bg-[#05442e] absolute top-0 left-0 right-0" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>{locale === 'ar' ? 'رقم مرجع الطلب' : 'ORDER REFERENCE'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                #{order.order_number}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {locale === 'ar' ? 'تم إنشاء الطلب بتاريخ' : 'Placed on'}{' '}
                <span className="font-bold text-slate-700">{new Date(order.createdAt).toLocaleString()}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-4 py-2 rounded-2xl text-xs font-black border shadow-2xs ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>

              {order.order_status === 'DELIVERED' && (
                <>
                  <button
                    onClick={handleDownloadInvoice}
                    className="px-4 py-2.5 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white text-xs font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>ZATCA Invoice (PDF)</span>
                  </button>

                  {!order.feedback && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{locale === 'ar' ? 'تقييم الخدمة' : 'Leave Review'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live GPS Map Section (If Active Delivery) */}
        {isLiveTrackingActive && (
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700 animate-bounce" />
                <span>{t('tracking.title')}</span>
              </h2>
              {driverLocation && (
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Updated: {new Date(driverLocation.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              )}
            </div>

            <LiveTrackingMap
              driverLat={driverLocation ? driverLocation.latitude : (order.delivery?.driver_locations?.[0]?.latitude ? parseFloat(order.delivery.driver_locations[0].latitude) : null)}
              driverLng={driverLocation ? driverLocation.longitude : (order.delivery?.driver_locations?.[0]?.longitude ? parseFloat(order.delivery.driver_locations[0].longitude) : null)}
              destLat={order.address?.latitude ? parseFloat(order.address.latitude) : 24.7136}
              destLng={order.address?.longitude ? parseFloat(order.address.longitude) : 46.6753}
              title={`Assigned Driver: ${order.delivery?.driver?.user?.email || 'Active Driver'}`}
            />
          </div>
        )}

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Ordered Items & Delivery Location */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ordered Line Items Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#05442e] flex items-center justify-center border border-emerald-200/60">
                    <Package className="w-5 h-5 text-[#05442e]" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'المنتجات المطلوبة' : 'Ordered Items'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {order.items ? order.items.length : 0} {locale === 'ar' ? 'منتج' : 'Items'}
                </span>
              </div>

              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {locale === 'ar' ? item.product_name_ar : item.product_name_en}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>Qty: <strong className="text-slate-900">{item.quantity}</strong></span>
                        <span>•</span>
                        <span>Unit: <strong className="text-slate-800">{parseFloat(item.unit_price).toFixed(2)} SAR</strong></span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-[#05442e]">
                        {parseFloat(item.total_price).toFixed(2)} SAR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-emerald-50/70 rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#05442e] font-black text-sm border-b border-emerald-200/60 pb-2.5">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>{locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</span>
              </div>

              <div className="space-y-1 text-xs text-slate-800 font-medium pt-1">
                <p className="font-black text-sm text-slate-900">{order.address?.full_name}</p>
                <div className="flex items-center gap-1 text-slate-600 font-bold py-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{order.address?.mobile}</span>
                </div>
                <p className="text-slate-700 font-semibold leading-relaxed">
                  {order.address?.address_line}
                </p>
                <p className="text-slate-500 font-medium">
                  {order.address?.area ? `${order.address.area}, ` : ''}{order.address?.city}, {order.address?.state}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Financial Breakdown & Payment Summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md lg:sticky lg:top-24 space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              {locale === 'ar' ? 'تفاصيل الدفع والمجموع' : 'Payment & Totals'}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>{t('cart.subtotal')}</span>
                <span className="font-extrabold text-slate-900">{parseFloat(order.subtotal || 0).toFixed(2)} SAR</span>
              </div>

              <div className="flex justify-between text-slate-600 font-semibold">
                <span>{t('cart.vat')}</span>
                <span className="font-extrabold text-slate-900">{parseFloat(order.tax_total || 0).toFixed(2)} SAR</span>
              </div>

              <div className="flex justify-between text-slate-600 font-semibold items-center">
                <span>{t('cart.deliveryFee')}</span>
                <span>
                  {parseFloat(order.delivery_fee || 0) === 0 ? (
                    <span className="bg-emerald-100 text-[#05442e] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      FREE EXPRESS
                    </span>
                  ) : (
                    <span className="font-extrabold text-slate-900">{parseFloat(order.delivery_fee || 0).toFixed(2)} SAR</span>
                  )}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900">{t('cart.total')}</span>
                <span className="text-xl font-black text-[#05442e]">
                  {parseFloat(order.grand_total || 0).toFixed(2)} SAR
                </span>
              </div>
            </div>

            {/* Bank Transfer Info Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-black text-slate-800">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>{locale === 'ar' ? 'حالة التحويل البنكي' : 'Bank Transfer Status'}</span>
              </div>
              <p className="font-mono text-[#05442e] font-extrabold uppercase bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-center">
                {order.payment?.status || 'PENDING'}
              </p>
              {order.payment?.confirmation && (
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <p><strong>Bank:</strong> {order.payment.confirmation.bank_name}</p>
                  <p><strong>Ref:</strong> <span className="font-mono font-bold text-slate-900">{order.payment.confirmation.payment_reference}</span></p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Leave Review Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>{locale === 'ar' ? 'تقييم تجربة التوصيل' : 'Leave Delivery Review'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  {locale === 'ar' ? 'التقييم (من 1 إلى 5 نجوم)' : 'Rating (1 to 5 Stars)'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2.5 rounded-xl text-lg font-black flex-1 transition-all cursor-pointer ${
                        rating >= star
                          ? 'bg-amber-50 text-amber-900 border-2 border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'ملاحظات وتجربتك' : 'Comments & Feedback'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your delivery experience..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
