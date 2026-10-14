'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getImageUrl } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { useToast } from '../../../../src/contexts/ToastContext';
import {
  Package,
  Truck,
  UserCheck,
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  FileText,
  DollarSign,
  ArrowRight,
  SlidersHorizontal,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Printer,
  Copy,
  Hash,
} from 'lucide-react';

export default function OrderDetailsPage({ params }) {
  // Unwrap Next.js dynamic params
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const router = useRouter();
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');

  const [showVerifyPaymentModal, setShowVerifyPaymentModal] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState('Razorpay');
  const [transactionIdInput, setTransactionIdInput] = useState('');

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReasonInput, setRefundReasonInput] = useState('');

  const loadOrder = async () => {
    try {
      setLoading(true);
      const [orderRes, driversRes] = await Promise.all([
        fetchApi(`/admin/orders/${orderId}`),
        fetchApi('/admin/drivers'),
      ]);

      if (orderRes.success && orderRes.data?.order) {
        setOrder(orderRes.data.order);
        setTargetStatus(orderRes.data.order.order_status);
        if (orderRes.data.order.delivery?.driver_id) {
          setSelectedDriverId(orderRes.data.order.delivery.driver_id);
        }
      } else {
        // Fallback to /orders/:id if admin route differs
        const altRes = await fetchApi(`/orders/${orderId}`);
        if (altRes.success && altRes.data?.order) {
          setOrder(altRes.data.order);
          setTargetStatus(altRes.data.order.order_status);
          if (altRes.data.order.delivery?.driver_id) {
            setSelectedDriverId(altRes.data.order.delivery.driver_id);
          }
        } else {
          showToast('Failed to find order', 'error');
        }
      }

      if (driversRes.success) {
        setDrivers(driversRes.data?.drivers || []);
      }
    } catch (err) {
      console.error('Failed to load order:', err);
      showToast(err.message || 'Failed to fetch order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // Handle Order Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: targetStatus,
          notes: statusRemarks,
        }),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث حالة الطلب بنجاح!' : `Order status updated to ${targetStatus}!`,
          'success'
        );
        setShowStatusModal(false);
        setStatusRemarks('');
        await loadOrder();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Driver Assignment
  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      showToast('Please select a driver', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/orders/${orderId}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify({
          driverId: selectedDriverId,
          reassignmentReason: assignmentReason,
        }),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تعيين السائق للطلب بنجاح!' : 'Driver assigned successfully!',
          'success'
        );
        setShowAssignModal(false);
        setAssignmentReason('');
        await loadOrder();
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Payment Verification
  const handleVerifyPayment = async () => {
    try {
      setSubmitting(true);
      const paymentId = order.payment?.id;
      const res = await fetchApi(`/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          gateway: paymentGateway,
          transactionId: transactionIdInput.trim() || undefined,
          paymentMethod: paymentGateway,
        }),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم توثيق الدفع بنجاح!' : 'Payment verified and confirmed as PAID!',
          'success'
        );
        setShowVerifyPaymentModal(false);
        setTransactionIdInput('');
        await loadOrder();
      }
    } catch (err) {
      showToast(err.message || 'Payment verification failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Payment Refund
  const handleRefundPayment = async () => {
    try {
      setSubmitting(true);
      const paymentId = order.payment?.id;
      const res = await fetchApi(`/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          refundReason: refundReasonInput.trim() || 'Refund processed by Admin',
        }),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم رد المبلغ واسترجاع المخزون بنجاح!' : 'Payment refunded and stock restored!',
          'success'
        );
        setShowRefundModal(false);
        setRefundReasonInput('');
        await loadOrder();
      }
    } catch (err) {
      showToast(err.message || 'Refund failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // Render Status Badge Pill
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">DELIVERED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse">OUT FOR DELIVERY</span>;
      case 'PACKED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-700 border border-teal-200">PACKED</span>;
      case 'PROCESSING':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">PROCESSING</span>;
      case 'CONFIRMED':
      case 'PAYMENT_VERIFIED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">CONFIRMED (PAID)</span>;
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">DRIVER ASSIGNED</span>;
      case 'ARRIVED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">ARRIVED AT DESTINATION</span>;
      case 'PENDING_PAYMENT':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">PENDING PAYMENT</span>;
      case 'PAYMENT_SUBMITTED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">PAYMENT SUBMITTED</span>;
      case 'CANCELLED':
      case 'PAYMENT_REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
      case 'DELIVERY_FAILED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">DELIVERY FAILED</span>;
      case 'RETURNED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-200">RETURNED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  // Render Payment Badge
  const renderPaymentBadge = (payment) => {
    if (!payment) return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Unpaid</span>;
    switch (payment.status) {
      case 'PAID':
      case 'VERIFIED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ PAID</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 border border-orange-300">↺ REFUNDED</span>;
      case 'FAILED':
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">✗ FAILED</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">UNDER REVIEW</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">PENDING</span>;
    }
  };

  // Render Payment Method Badge
  const renderPaymentMethodBadge = (method) => {
    const m = (method || '').toUpperCase();
    if (m.includes('RAZORPAY')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">Razorpay</span>;
    }
    if (m.includes('CASHFREE')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">Cashfree</span>;
    }
    if (m.includes('COD') || m.includes('CASH')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">Cash on Delivery</span>;
    }
    if (m.includes('BANK')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">Bank Transfer</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">{method || 'Credit/Debit Card'}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-20 text-center space-y-4 border border-slate-200 shadow-xs">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold text-slate-600">Loading complete order details from database...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-xs">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500">The order ID #{orderId} could not be located in the platform database.</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders Dashboard</span>
        </Link>
      </div>
    );
  }

  const cust = order.customer || {};
  const custUser = cust.user || {};
  const addr = order.address || {};
  const pay = order.payment || {};
  const drv = order.delivery?.driver || null;
  const drvUser = drv?.user || {};
  const items = order.items || [];
  const history = order.status_history || [];
  const assignments = order.assignments || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Back to Orders List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order Management /</span>
              <span className="text-sm font-black text-slate-900 font-mono">#{order.order_number}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadOrder()}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Refresh order data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{drv ? 'Reassign Driver' : 'Assign Driver'}</span>
          </button>

          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Update Status</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Products, Delivery Tracking & History (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header Summary Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-100">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-black text-slate-900 font-mono">#{order.order_number}</h1>
                  <button
                    onClick={() => copyToClipboard(order.order_number, 'Order number')}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    title="Copy Order #"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {renderStatusBadge(order.order_status)}
                  {renderPaymentBadge(order.payment)}
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:pl-6 border-slate-100">
              <span className="text-xs text-slate-400 block font-bold uppercase">Grand Total</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {parseFloat(order.grand_total || 0).toFixed(2)} SAR
              </span>
              <div className="mt-1">
                {renderPaymentMethodBadge(order.payment_method || pay.payment_method)}
              </div>
            </div>
          </div>

          {/* Ordered Products Section (Requirement 2) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Ordered Products ({items.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {items.reduce((acc, it) => acc + (it.quantity || 0), 0)} Total Units
              </span>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Tax (15%)</th>
                    <th className="px-4 py-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const prod = item.product || {};
                    const primaryImg = (prod.images || []).find((img) => img.is_primary) || (prod.images || [])[0];
                    const imgUrl = primaryImg ? getImageUrl(primaryImg.image_url) : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {imgUrl ? (
                                <img src={imgUrl} alt={item.product_name_en} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{item.product_name_en}</div>
                              {item.product_name_ar && (
                                <div className="text-[11px] text-slate-400">{item.product_name_ar}</div>
                              )}
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {item.product_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium">
                          {parseFloat(item.unit_price).toFixed(2)} SAR
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-black text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                          {parseFloat(item.tax_amount || 0).toFixed(2)} SAR
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900">
                          {parseFloat(item.total_price).toFixed(2)} SAR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-right max-w-sm ml-auto">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span className="font-mono font-bold">{parseFloat(order.subtotal || 0).toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Value Added Tax (15% VAT):</span>
                <span className="font-mono font-bold">{parseFloat(order.tax_total || 0).toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping & Delivery Fee:</span>
                <span className="font-mono font-bold">{parseFloat(order.delivery_fee || 0).toFixed(2)} SAR</span>
              </div>
              {parseFloat(order.discount_total || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Special Discount:</span>
                  <span className="font-mono">-{parseFloat(order.discount_total).toFixed(2)} SAR</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2.5 mt-1.5">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700">{parseFloat(order.grand_total || 0).toFixed(2)} SAR</span>
              </div>
            </div>
          </div>

          {/* Delivery Progress & Tracking Timeline (Requirement 7) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Delivery Progress & Tracking
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Status: <strong className="text-slate-800">{order.order_status}</strong>
              </span>
            </div>

            {/* 6-Stage Visual Progress Timeline */}
            <div className="relative pl-6 space-y-6 border-l-2 border-slate-200">
              {[
                { title: 'Order Confirmed', key: 'CONFIRMED', altKey: 'PAYMENT_VERIFIED' },
                { title: 'Processing Order', key: 'PROCESSING' },
                { title: 'Packed & Ready', key: 'PACKED' },
                { title: 'Driver Assigned', key: 'DRIVER_ASSIGNED', altKey: 'DRIVER_ACCEPTED' },
                { title: 'Out for Delivery', key: 'OUT_FOR_DELIVERY', altKey: 'ARRIVED' },
                { title: 'Order Delivered', key: 'DELIVERED' },
              ].map((stage, idx) => {
                const historyMatch = history.find(
                  (h) => h.to_status === stage.key || (stage.altKey && h.to_status === stage.altKey)
                );
                const isCurrent = order.order_status === stage.key || (stage.altKey && order.order_status === stage.altKey);
                const isPassed = !!historyMatch || isCurrent;

                return (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-indigo-600 border-white ring-4 ring-indigo-100 animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500 border-white'
                          : 'bg-slate-300 border-white'
                      }`}
                    ></span>
                    <div className="space-y-0.5">
                      <div className={`font-black text-xs ${isCurrent ? 'text-indigo-700' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {idx + 1}. {stage.title}
                      </div>
                      {historyMatch ? (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Reached at {new Date(historyMatch.createdAt).toLocaleString()}
                          {historyMatch.notes && ` • Note: ${historyMatch.notes}`}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">Stage pending</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Driver & Delivery Status Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase text-slate-200">Delivery Status & Driver Dispatch</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-800">
                  {order.delivery?.status || (drv ? 'ASSIGNED' : 'UNASSIGNED')}
                </span>
              </div>

              {drv ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Driver</span>
                    <div className="text-sm font-extrabold text-white mt-0.5">{drvUser.email}</div>
                    <div className="text-slate-400 font-mono mt-0.5">Mobile: {drvUser.mobile || 'N/A'}</div>
                    <div className="text-slate-400 mt-0.5">License: {drv.license_number || 'N/A'}</div>
                    <div className="text-slate-400 mt-0.5">Vehicle: {drv.vehicle_details || 'Standard Fleet'}</div>
                  </div>

                  <div className="space-y-1 font-mono text-slate-300">
                    <div>
                      Dispatch Start:{' '}
                      <strong className="text-white">
                        {order.delivery?.start_time ? new Date(order.delivery.start_time).toLocaleString() : 'Pending dispatch'}
                      </strong>
                    </div>
                    <div>
                      Delivery Completed:{' '}
                      <strong className="text-emerald-400">
                        {order.delivery?.end_time ? new Date(order.delivery.end_time).toLocaleString() : 'In transit'}
                      </strong>
                    </div>
                    <div>
                      Last Status Update:{' '}
                      <strong className="text-cyan-400">
                        {new Date(order.updatedAt).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">
                  No delivery driver assigned to this order yet. Click &quot;Assign Driver&quot; above to allocate an active driver.
                </div>
              )}
            </div>
          </div>

          {/* Chronological Activity Audit Log (Requirement 9) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Order Activity History ({history.length})
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Complete Audit Trail</span>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                No activity logs recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((hist) => (
                  <div key={hist.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">
                          {hist.from_status ? `${hist.from_status} → ${hist.to_status}` : `Initialized: ${hist.to_status}`}
                        </span>
                        {hist.changed_by && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            By {hist.changed_by.email} ({hist.changed_by.role})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(hist.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {hist.notes && <p className="text-slate-600 font-medium mt-1">{hist.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details, Address & Payment Verification (1 Col) */}
        <div className="space-y-6">
          {/* Customer Information Card (Requirement 2) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Customer Details</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {custUser.status || 'ACTIVE'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Full Name</span>
                <strong className="text-sm text-slate-900 font-extrabold">
                  {cust.first_name ? `${cust.first_name} ${cust.last_name || ''}` : 'Customer'}
                </strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile Phone</span>
                <div className="flex items-center gap-2 text-slate-800 font-mono font-bold mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{custUser.mobile || 'No mobile listed'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
                <div className="flex items-center gap-2 text-slate-800 font-medium mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{custUser.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Delivery Address Card (Requirement 2) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Delivery Address</h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Street Address</span>
                <div className="text-slate-800 font-bold mt-0.5">
                  {addr.building_number ? `Building ${addr.building_number}, ` : ''}
                  {addr.street || addr.address_line || 'Delivery Address'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">City / Province</span>
                  <strong className="text-slate-800">{addr.city || 'Riyadh'}, {addr.state || 'KSA'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Postal Code</span>
                  <strong className="text-slate-800 font-mono">{addr.postal_code || '11564'}</strong>
                </div>
              </div>

              {(order.delivery_date || order.delivery_slot) && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  <span className="text-[10px] uppercase font-bold block text-emerald-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Scheduled Delivery Window
                  </span>
                  <p className="mt-0.5 font-bold">
                    {order.delivery_date || 'Today'} • {order.delivery_slot || 'Express'}
                  </p>
                </div>
              )}

              {order.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="text-[10px] uppercase font-bold block text-amber-800">Order Delivery Notes</span>
                  <p className="mt-0.5">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Gateway & Verification Details (Requirement 4) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Payment Information</h3>
              </div>
              {renderPaymentBadge(order.payment)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Payment Method:</span>
                <div>{renderPaymentMethodBadge(order.payment_method || pay.payment_method)}</div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Payment Gateway:</span>
                <strong className="text-slate-800">{pay.payment_gateway || 'Razorpay / Cashfree'}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Transaction ID / Ref #</span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 mt-1">
                  <span className="font-mono font-bold text-slate-900 truncate">
                    {pay.transaction_id || pay.confirmation?.payment_reference || 'REF-PENDING'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(pay.transaction_id || pay.confirmation?.payment_reference, 'Transaction ID')}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    title="Copy Transaction ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Verified At:</span>
                <span className="font-mono">
                  {pay.verified_at ? new Date(pay.verified_at).toLocaleString() : 'Unverified'}
                </span>
              </div>

              {pay.confirmation && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Bank Submission Details</span>
                  <div>Bank: <strong>{pay.confirmation.bank_name}</strong></div>
                  <div>Reference: <strong className="font-mono">{pay.confirmation.payment_reference}</strong></div>
                  {pay.confirmation.proof_file_url && (
                    <div className="pt-1">
                      <a
                        href={getImageUrl(pay.confirmation.proof_file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Payment Receipt Document</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {pay.status !== 'PAID' && pay.status !== 'VERIFIED' && (
                  <button
                    onClick={() => {
                      setTransactionIdInput(pay.transaction_id || '');
                      setShowVerifyPaymentModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Confirm Payment (Paid)</span>
                  </button>
                )}

                {(pay.status === 'PAID' || pay.status === 'VERIFIED') && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Process Payment Refund</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Driver Assignment Card (Requirement 5) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Assigned Driver</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="text-xs font-bold text-cyan-600 hover:underline cursor-pointer"
              >
                {drv ? 'Change' : 'Assign'}
              </button>
            </div>

            {drv ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Driver Name / Email</span>
                  <strong className="text-sm text-slate-900 font-extrabold">{drvUser.email}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone Number</span>
                  <div className="text-slate-800 font-mono font-bold">{drvUser.mobile || 'N/A'}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle Details</span>
                  <div className="text-slate-700 font-medium">{drv.vehicle_details || 'Standard'}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Driver Availability</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {drv.availability_status || 'BUSY'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs">
                No driver currently assigned.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UPDATE STATUS MODAL */}
      {/* ========================================================================= */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Update Status for Order #{order.order_number}
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Select New Target Status *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold focus:border-indigo-500 outline-hidden cursor-pointer"
                  required
                >
                  <option value="PENDING_PAYMENT">PENDING (Pending Payment)</option>
                  <option value="CONFIRMED">CONFIRMED (Payment Verified)</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="DRIVER_ASSIGNED">DRIVER ASSIGNED</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="DELIVERY_FAILED">DELIVERY FAILED</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Audit Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks or update reason..."
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN DRIVER MODAL */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {drv ? 'Reassign Driver' : 'Assign Driver'} for Order #{order.order_number}
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Select Active Driver *</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-cyan-500 outline-hidden cursor-pointer"
                  required
                >
                  <option value="">-- Choose active delivery driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user?.email} ({d.availability_status || 'AVAILABLE'}) - Mobile: {d.user?.mobile || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Reassignment / Dispatch Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched for express delivery"
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  {submitting ? 'Assigning...' : 'Confirm Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VERIFY PAYMENT MODAL */}
      {/* ========================================================================= */}
      {showVerifyPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Verify Payment for Order #{order.order_number}
              </h3>
              <button onClick={() => setShowVerifyPaymentModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1">
                <div>Amount to Verify: <strong className="font-mono text-emerald-700">{parseFloat(order.grand_total || 0).toFixed(2)} SAR</strong></div>
                <div>Current Status: <strong>{order.payment?.status || 'PENDING'}</strong></div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Payment Gateway / Method</label>
                <select
                  value={paymentGateway}
                  onChange={(e) => setPaymentGateway(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-hidden cursor-pointer"
                >
                  <option value="Razorpay">Razorpay Gateway</option>
                  <option value="Cashfree">Cashfree Gateway</option>
                  <option value="Bank Transfer">Bank Transfer / Manual</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Transaction ID / Payment Reference</label>
                <input
                  type="text"
                  placeholder="e.g. pay_Rzp837492 or REF-987654"
                  value={transactionIdInput}
                  onChange={(e) => setTransactionIdInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {submitting ? 'Verifying...' : 'Verify & Mark Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REFUND PAYMENT MODAL */}
      {/* ========================================================================= */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Refund Payment for Order #{order.order_number}
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-orange-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Refund Notice
                </div>
                <p>
                  Processing a refund will mark this payment as REFUNDED, cancel the order, and automatically restore the ordered quantities to inventory stock.
                </p>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Reason for Refund</label>
                <input
                  type="text"
                  placeholder="e.g. Customer cancelled order / Defective product return"
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRefundPayment}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {submitting ? 'Refunding...' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
