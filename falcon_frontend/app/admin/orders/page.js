'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import {
  Package,
  Truck,
  UserCheck,
  Search,
  X,
  Filter,
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
  ChevronLeft,
  Navigation,
  Compass,
  Check,
  XCircle,
  HelpCircle,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { socket } = useSocket();
  const { hasPermission } = useAuth();
  const canAssign = hasPermission('orders.assign');
  const canEdit = hasPermission('orders.edit');

  // Data States
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Status Tabs (Requirement 8): ALL, PENDING, PROCESSING, OUT_FOR_DELIVERY, COMPLETED, CANCELLED, RETURNED
  const [activeTab, setActiveTab] = useState('ALL');

  // Search & Filter States (Requirement 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Quick View Drawer & Modals State
  const [selectedOrder, setSelectedOrder] = useState(null); // For Quick Preview Drawer
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview', 'progress', 'history'

  const [assignModalOrder, setAssignModalOrder] = useState(null); // For Assign Driver Modal
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const [statusModalOrder, setStatusModalOrder] = useState(null); // For Update Status Modal
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const [paymentModalOrder, setPaymentModalOrder] = useState(null); // For Payment Verification Modal
  const [verifyGateway, setVerifyGateway] = useState('Razorpay');
  const [verifyTxnId, setVerifyTxnId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [refundModalOrder, setRefundModalOrder] = useState(null); // For Payment Refund Modal
  const [refundReason, setRefundReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Fetch Orders and Drivers from Backend REST API
  const loadData = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);

      if (activeTab !== 'ALL') params.append('tab', activeTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (orderStatusFilter !== 'ALL') params.append('status', orderStatusFilter);
      if (paymentStatusFilter !== 'ALL') params.append('paymentStatus', paymentStatusFilter);
      if (paymentMethodFilter !== 'ALL') params.append('paymentMethod', paymentMethodFilter);
      if (driverFilter !== 'ALL') params.append('driverId', driverFilter);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const [ordRes, drvRes] = await Promise.all([
        fetchApi(`/admin/orders?${params.toString()}`),
        fetchApi('/admin/drivers'),
      ]);

      if (ordRes.success) {
        setOrders(ordRes.data?.orders || []);
        if (ordRes.data?.pagination) setPagination(ordRes.data.pagination);
        if (ordRes.data?.stats) setStats(ordRes.data.stats);
      }

      if (drvRes.success) {
        setDrivers(drvRes.data?.drivers || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      showToast(err.message || 'Failed to fetch platform orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    activeTab,
    searchQuery,
    orderStatusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    driverFilter,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  ]);

  // Real-time synchronization across Admin Orders Panel
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_admin_room');

    const handleSync = () => {
      loadData(currentPage);
    };

    socket.on('order_status_update', handleSync);
    socket.on('order_assigned', handleSync);

    return () => {
      socket.off('order_status_update', handleSync);
      socket.off('order_assigned', handleSync);
    };
  }, [socket, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      loadData(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setOrderStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setPaymentMethodFilter('ALL');
    setDriverFilter('ALL');
    setFromDate('');
    setToDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('createdAt');
    setSortOrder('DESC');
    setActiveTab('ALL');
    setCurrentPage(1);
  };

  // 1. Assign / Reassign Driver Handler (Requirement 5)
  const handleConfirmAssignDriver = async (e) => {
    e.preventDefault();
    if (!assignModalOrder || !assignDriverId) {
      showToast('Please select a driver first', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/orders/${assignModalOrder.id}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify({
          driverId: assignDriverId,
          reassignmentReason: assignReason,
        }),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تعيين السائق للطلب بنجاح!' : 'Driver assigned to order successfully!',
          'success'
        );
        setAssignModalOrder(null);
        setAssignDriverId('');
        setAssignReason('');
        await loadData(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Update Order Status Handler (Requirement 6)
  const handleConfirmUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalOrder || !targetStatus) return;

    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/orders/${statusModalOrder.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: targetStatus,
          notes: statusNote,
        }),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث حالة الطلب بنجاح!' : `Order status updated to ${targetStatus}!`,
          'success'
        );
        setStatusModalOrder(null);
        setTargetStatus('');
        setStatusNote('');
        await loadData(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Verify Payment Handler (Requirement 4)
  const handleConfirmVerifyPayment = async () => {
    if (!paymentModalOrder) return;
    try {
      setSubmitting(true);
      const paymentId = paymentModalOrder.payment?.id;
      const res = await fetchApi(`/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          gateway: verifyGateway,
          transactionId: verifyTxnId.trim() || undefined,
          paymentMethod: verifyGateway,
        }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم توثيق الدفع بنجاح!' : 'Payment verified successfully and marked as PAID!',
          'success'
        );
        setPaymentModalOrder(null);
        setVerifyTxnId('');
        if (selectedOrder) {
          const updated = await fetchApi(`/admin/orders/${selectedOrder.id}`);
          if (updated.success) setSelectedOrder(updated.data.order);
        }
        await loadData(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Payment verification failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Reject Payment Handler (Requirement 4)
  const handleConfirmRejectPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalOrder || !rejectionReason.trim()) {
      showToast('Please enter a rejection reason', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const paymentId = paymentModalOrder.payment?.id;
      const res = await fetchApi(`/payments/${paymentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم رفض الدفع' : 'Payment marked as rejected',
          'success'
        );
        setPaymentModalOrder(null);
        setRejectionReason('');
        await loadData(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to reject payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Refund Payment Handler (Requirement 4)
  const handleConfirmRefundPayment = async (e) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    try {
      setSubmitting(true);
      const paymentId = refundModalOrder.payment?.id;
      const res = await fetchApi(`/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ refundReason: refundReason.trim() || 'Refund processed by Admin' }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم رد المبلغ واسترجاع المخزون بنجاح!' : 'Payment refunded and stock restored!',
          'success'
        );
        setRefundModalOrder(null);
        setRefundReason('');
        await loadData(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to refund payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Quick Drawer
  const openOrderDrawer = async (orderId, initialTab = 'overview') => {
    setDrawerTab(initialTab);
    try {
      const res = await fetchApi(`/admin/orders/${orderId}`);
      if (res.success) {
        setSelectedOrder(res.data.order);
      } else {
        const altRes = await fetchApi(`/orders/${orderId}`);
        if (altRes.success) setSelectedOrder(altRes.data.order);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch order details', 'error');
    }
  };

  // Render Order Status Badge Pill
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">DELIVERED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse">OUT FOR DELIVERY</span>;
      case 'PACKED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-50 text-teal-700 border border-teal-200">PACKED</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">PROCESSING</span>;
      case 'CONFIRMED':
      case 'PAYMENT_VERIFIED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">CONFIRMED (PAID)</span>;
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">DRIVER ASSIGNED</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">ARRIVED</span>;
      case 'PENDING_PAYMENT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">PENDING PAYMENT</span>;
      case 'PAYMENT_SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">PAYMENT SUBMITTED</span>;
      case 'CANCELLED':
      case 'PAYMENT_REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
      case 'DELIVERY_FAILED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">DELIVERY FAILED</span>;
      case 'RETURNED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-orange-50 text-orange-700 border border-orange-200">RETURNED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  // Render Payment Status Badge
  const renderPaymentBadge = (payment) => {
    if (!payment) return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Unpaid</span>;
    switch (payment.status) {
      case 'PAID':
      case 'VERIFIED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ PAID</span>;
      case 'REFUNDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300">↺ REFUNDED</span>;
      case 'FAILED':
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">✗ FAILED</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">UNDER REVIEW</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">PENDING</span>;
    }
  };

  // Render Payment Method Badge
  const renderPaymentMethodBadge = (method) => {
    const m = (method || '').toUpperCase();
    if (m.includes('RAZORPAY')) {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Razorpay</span>;
    }
    if (m.includes('CASHFREE')) {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Cashfree</span>;
    }
    if (m.includes('COD') || m.includes('CASH')) {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">COD</span>;
    }
    if (m.includes('BANK')) {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Bank Transfer</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{method || 'COD'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-xs shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {locale === 'ar' ? 'إدارة الطلبات الشاملة' : 'Order Management'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {stats?.total || 0} {locale === 'ar' ? 'طلب' : 'Total Orders'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {locale === 'ar'
                ? 'لوحة تحكم مركزية لمتابعة جميع طلبات العملاء، توثيق الدفع، تعيين السائقين، وتتبع الشحنات'
                : 'Centralized admin control panel to monitor, verify payments, assign drivers, and track customer orders'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(currentPage)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer flex items-center gap-2 text-xs font-bold"
            title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh Orders'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top Dynamic Dashboard Summary Cards (Requirement 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">{locale === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{stats?.total || 0}</div>
        </div>

        <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200 shadow-xs">
          <div className="text-[11px] text-amber-800 font-semibold">{locale === 'ar' ? 'في انتظار الدفع' : 'Pending Orders'}</div>
          <div className="text-lg font-black text-amber-900 mt-0.5">{stats?.pending || 0}</div>
        </div>

        <div className="bg-indigo-50/80 rounded-2xl p-3.5 border border-indigo-200 shadow-xs">
          <div className="text-[11px] text-indigo-800 font-semibold">{locale === 'ar' ? 'قيد التجهيز' : 'Processing'}</div>
          <div className="text-lg font-black text-indigo-900 mt-0.5">{stats?.processing || 0}</div>
        </div>

        <div className="bg-cyan-50/80 rounded-2xl p-3.5 border border-cyan-200 shadow-xs">
          <div className="text-[11px] text-cyan-800 font-semibold">{locale === 'ar' ? 'خرج للتوصيل' : 'Out for Delivery'}</div>
          <div className="text-lg font-black text-cyan-900 mt-0.5">{stats?.outForDelivery || 0}</div>
        </div>

        <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200 shadow-xs">
          <div className="text-[11px] text-emerald-800 font-semibold">{locale === 'ar' ? 'مكتمل ومسلم' : 'Delivered'}</div>
          <div className="text-lg font-black text-emerald-900 mt-0.5">{stats?.delivered || 0}</div>
        </div>

        <div className="bg-rose-50/80 rounded-2xl p-3.5 border border-rose-200 shadow-xs">
          <div className="text-[11px] text-rose-800 font-semibold">{locale === 'ar' ? 'ملغية' : 'Cancelled'}</div>
          <div className="text-lg font-black text-rose-900 mt-0.5">{stats?.cancelled || 0}</div>
        </div>

        <div className="bg-orange-50/80 rounded-2xl p-3.5 border border-orange-200 shadow-xs">
          <div className="text-[11px] text-orange-800 font-semibold">{locale === 'ar' ? 'مسترجعة' : 'Returned'}</div>
          <div className="text-lg font-black text-orange-900 mt-0.5">{stats?.returned || 0}</div>
        </div>
      </div>

      {/* Status-Based Quick Filter Tabs (Requirement 8) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {locale === 'ar' ? 'جميع الطلبات' : 'All Orders'} ({stats?.total || 0})
        </button>

        <button
          onClick={() => { setActiveTab('PENDING'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ⏳ {locale === 'ar' ? 'قيد الانتظار' : 'Pending'} ({stats?.pending || 0})
        </button>

        <button
          onClick={() => { setActiveTab('PROCESSING'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PROCESSING'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ⚙️ {locale === 'ar' ? 'قيد المعالجة' : 'Processing'} ({stats?.processing || 0})
        </button>

        <button
          onClick={() => { setActiveTab('OUT_FOR_DELIVERY'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'OUT_FOR_DELIVERY'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🚚 {locale === 'ar' ? 'خرج للتوصيل' : 'Out for Delivery'} ({stats?.outForDelivery || 0})
        </button>

        <button
          onClick={() => { setActiveTab('COMPLETED'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ✓ {locale === 'ar' ? 'المكتملة' : 'Completed'} ({stats?.delivered || 0})
        </button>

        <button
          onClick={() => { setActiveTab('CANCELLED'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CANCELLED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ✕ {locale === 'ar' ? 'الملغية' : 'Cancelled'} ({stats?.cancelled || 0})
        </button>

        <button
          onClick={() => { setActiveTab('RETURNED'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'RETURNED'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ↺ {locale === 'ar' ? 'المسترجعة' : 'Returned'} ({stats?.returned || 0})
        </button>
      </div>

      {/* Control Bar: Search & Advanced Filters Panel (Requirement 3) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Main Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث برقم الطلب، اسم العميل، الجوال أو السائق...' : 'Search order #, customer, mobile, driver...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Sorting Select */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline">Sort:</span>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white outline-hidden cursor-pointer text-xs"
              >
                <option value="createdAt:DESC">Date (Newest First)</option>
                <option value="createdAt:ASC">Date (Oldest First)</option>
                <option value="grand_total:DESC">Amount (Highest First)</option>
                <option value="grand_total:ASC">Amount (Lowest First)</option>
                <option value="order_number:DESC">Order # (Descending)</option>
              </select>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showAdvancedFilters || orderStatusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || driverFilter !== 'ALL' || fromDate || minAmount
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{locale === 'ar' ? 'الفلاتر المتقدمة' : 'Advanced Filters'}</span>
              {(orderStatusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || driverFilter !== 'ALL' || fromDate || minAmount) && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              )}
            </button>

            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            >
              {locale === 'ar' ? 'إعادة ضبط' : 'Reset Filters'}
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters Grid (Requirement 3) */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in duration-150 text-xs">
            {/* Order Status Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'حالة الطلب' : 'Order Status'}</label>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white outline-hidden cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                <option value="CONFIRMED">CONFIRMED</option>
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

            {/* Payment Status Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'حالة الدفع' : 'Payment Status'}</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white outline-hidden cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="SUBMITTED">UNDER REVIEW</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Payment Method Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white outline-hidden cursor-pointer"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Cashfree">Cashfree</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Assigned Driver Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'السائق المسند' : 'Assigned Driver'}</label>
              <select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white outline-hidden cursor-pointer"
              >
                <option value="ALL">All Drivers</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.user?.email} ({drv.availability_status || 'AVAILABLE'})
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'من تاريخ' : 'From Date'}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white outline-hidden"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Order Listing Table (Requirement 1) */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'جاري تحميل جدول إدارة الطلبات...' : 'Loading orders table from database...'}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {searchQuery || orderStatusFilter !== 'ALL' || activeTab !== 'ALL'
              ? (locale === 'ar' ? 'لم يتم العثور على طلبات تطابق فلاتر البحث الحالية' : 'No orders match your search query or status filter criteria')
              : (locale === 'ar' ? 'لا توجد طلبات مسجلة في النظام بعد' : 'No orders recorded in the platform database yet')}
          </p>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
          >
            {locale === 'ar' ? 'إعادة ضبط البحث' : 'Clear Filters & Reload'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">Order ID & Date</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Customer Name</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Customer Mobile</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Total Amount</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Payment Method</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Payment Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Order Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Assigned Driver</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const cust = ord.customer || {};
                  const custUser = cust.user || {};
                  const drv = ord.delivery?.driver || null;
                  const drvUser = drv?.user || {};
                  const pay = ord.payment || {};

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-all">
                      {/* 1. Order ID & Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="text-xs font-black text-slate-900 font-mono hover:text-indigo-600 transition-colors"
                              title="Open dedicated order page"
                            >
                              #{ord.order_number}
                            </Link>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Customer Name */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-extrabold text-slate-900">
                          {cust.first_name ? `${cust.first_name} ${cust.last_name || ''}` : 'Customer'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {custUser.email || 'N/A'}
                        </div>
                      </td>

                      {/* 3. Customer Mobile */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-700 font-medium">
                        {custUser.mobile || 'N/A'}
                      </td>

                      {/* 4. Total Amount */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-black text-xs text-slate-900">
                        {parseFloat(ord.grand_total || 0).toFixed(2)} SAR
                      </td>

                      {/* 5. Payment Method */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderPaymentMethodBadge(ord.payment_method || pay.payment_method)}
                      </td>

                      {/* 6. Payment Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {renderPaymentBadge(pay)}
                          {pay.status !== 'PAID' && pay.status !== 'VERIFIED' && (
                            <button
                              onClick={() => {
                                setPaymentModalOrder(ord);
                                setVerifyGateway(ord.payment_method || 'Razorpay');
                                setVerifyTxnId(pay.transaction_id || '');
                              }}
                              className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold transition-all cursor-pointer"
                              title="Verify Payment"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 7. Order Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(ord.order_status)}
                      </td>

                      {/* 8. Assigned Driver */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {drv ? (
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-slate-800 leading-tight">
                                {drvUser.email}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {drvUser.mobile || ''}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* 9. Actions Column */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dedicated Page Link */}
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer"
                            title="Open Full Details Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick Drawer Preview */}
                          <button
                            onClick={() => openOrderDrawer(ord.id, 'overview')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="Quick Drawer Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Assign Driver */}
                          {canAssign && (
                            <button
                              onClick={() => {
                                setAssignModalOrder(ord);
                                setAssignDriverId(ord.delivery?.driver_id || '');
                              }}
                              className="p-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition-all cursor-pointer"
                              title="Assign or Reassign Driver"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Update Status */}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setStatusModalOrder(ord);
                                setTargetStatus(ord.order_status);
                              }}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer"
                              title="Update Order Status"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-semibold">
              Showing <strong className="text-slate-900">{orders.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> total orders
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-slate-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK PREVIEW DRAWER */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end p-0 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 font-mono">#{selectedOrder.order_number}</h2>
                    {renderStatusBadge(selectedOrder.order_status)}
                  </div>
                  <p className="text-[11px] text-slate-500">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${selectedOrder.id}`}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Page</span>
                </Link>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs Navigation */}
            <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-6 bg-slate-50/50 text-xs font-bold">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview & Items
              </button>
              <button
                onClick={() => setDrawerTab('progress')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  drawerTab === 'progress'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Delivery Timeline
              </button>
              <button
                onClick={() => setDrawerTab('history')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  drawerTab === 'history'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Audit History ({selectedOrder.status_history?.length || 0})
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {drawerTab === 'overview' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Customer</div>
                      <div className="font-extrabold text-slate-900">
                        {selectedOrder.customer?.first_name} {selectedOrder.customer?.last_name}
                      </div>
                      <div className="text-slate-600 font-mono">{selectedOrder.customer?.user?.mobile || 'N/A'}</div>
                      <div className="text-slate-500 truncate">{selectedOrder.customer?.user?.email || 'N/A'}</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address & Schedule</div>
                      <div className="font-bold text-slate-800">
                        {selectedOrder.address?.address_line || selectedOrder.address?.street || 'Delivery Address'}, {selectedOrder.address?.city || 'Riyadh'}
                      </div>
                      <div className="text-slate-500">Postal: {selectedOrder.address?.postal_code || '11564'}</div>
                      {(selectedOrder.delivery_date || selectedOrder.delivery_slot) && (
                        <div className="pt-2 border-t border-slate-200 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{selectedOrder.delivery_date || 'Today'} • {selectedOrder.delivery_slot || 'Express'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Card */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-950">Payment Status</span>
                      {renderPaymentBadge(selectedOrder.payment)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Method / Gateway</span>
                        <strong className="text-slate-900">{selectedOrder.payment_method || selectedOrder.payment?.payment_method || 'COD'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Transaction ID</span>
                        <strong className="text-slate-900 font-mono">{selectedOrder.payment?.transaction_id || 'PENDING'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Ordered Products ({selectedOrder.items?.length || 0})</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {(selectedOrder.items || []).map((it) => (
                        <div key={it.id} className="p-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{it.product_name_en}</div>
                            <div className="text-[11px] text-slate-500 font-mono">Qty: {it.quantity} × {parseFloat(it.unit_price).toFixed(2)} SAR</div>
                          </div>
                          <div className="font-mono font-bold text-slate-900">{parseFloat(it.total_price).toFixed(2)} SAR</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center font-bold">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-700 text-sm">{parseFloat(selectedOrder.grand_total || 0).toFixed(2)} SAR</span>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'progress' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Visual Progress Timeline</h3>
                  <div className="relative pl-5 space-y-5 border-l-2 border-slate-200">
                    {[
                      { title: 'Order Confirmed', key: 'CONFIRMED', alt: 'PAYMENT_VERIFIED' },
                      { title: 'Processing Order', key: 'PROCESSING' },
                      { title: 'Packed', key: 'PACKED' },
                      { title: 'Driver Assigned', key: 'DRIVER_ASSIGNED', alt: 'DRIVER_ACCEPTED' },
                      { title: 'Out for Delivery', key: 'OUT_FOR_DELIVERY', alt: 'ARRIVED' },
                      { title: 'Delivered', key: 'DELIVERED' },
                    ].map((st, i) => {
                      const match = (selectedOrder.status_history || []).find((h) => h.to_status === st.key || (st.alt && h.to_status === st.alt));
                      const isCurrent = selectedOrder.order_status === st.key || (st.alt && selectedOrder.order_status === st.alt);
                      const isPassed = !!match || isCurrent;
                      return (
                        <div key={i} className="relative">
                          <span className={`absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full border-2 ${
                            isCurrent ? 'bg-indigo-600 border-white ring-2 ring-indigo-200 animate-pulse' : isPassed ? 'bg-emerald-500 border-white' : 'bg-slate-300 border-white'
                          }`}></span>
                          <div>
                            <div className={`font-bold ${isCurrent ? 'text-indigo-700' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                              {st.title}
                            </div>
                            {match && <div className="text-[10px] text-slate-500 font-mono">{new Date(match.createdAt).toLocaleString()}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {drawerTab === 'history' && (
                <div className="space-y-2.5">
                  {(selectedOrder.status_history || []).map((h) => (
                    <div key={h.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{h.from_status ? `${h.from_status} → ${h.to_status}` : `Initialized: ${h.to_status}`}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{new Date(h.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {h.notes && <p className="text-slate-600">{h.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/90">
              <Link
                href={`/admin/orders/${selectedOrder.id}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Go to Dedicated Page
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN DRIVER MODAL (Requirement 5) */}
      {/* ========================================================================= */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Assign Driver to Order #{assignModalOrder.order_number}
              </h3>
              <button onClick={() => setAssignModalOrder(null)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Select Available Delivery Driver *</label>
                <select
                  value={assignDriverId}
                  onChange={(e) => setAssignDriverId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-cyan-500 outline-hidden cursor-pointer"
                  required
                >
                  <option value="">-- Choose active driver --</option>
                  {drivers.map((drv) => (
                    <option key={drv.id} value={drv.id}>
                      {drv.user?.email} ({drv.availability_status || 'AVAILABLE'}) - Mobile: {drv.user?.mobile || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Reassignment / Dispatch Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Assigned for express delivery"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPDATE STATUS MODAL (Requirement 6) */}
      {/* ========================================================================= */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Update Status for Order #{statusModalOrder.order_number}
              </h3>
              <button onClick={() => setStatusModalOrder(null)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmUpdateStatus} className="space-y-4 text-xs">
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
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Status Update Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks or reason for update..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOrder(null)}
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
      {/* VERIFY PAYMENT MODAL (Requirement 4) */}
      {/* ========================================================================= */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Payment Verification for Order #{paymentModalOrder.order_number}
              </h3>
              <button onClick={() => setPaymentModalOrder(null)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1">
                <div>Amount to Verify: <strong className="font-mono text-emerald-700">{parseFloat(paymentModalOrder.grand_total || 0).toFixed(2)} SAR</strong></div>
                <div>Current Payment Status: <strong>{paymentModalOrder.payment?.status || 'PENDING'}</strong></div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Gateway / Method</label>
                <select
                  value={verifyGateway}
                  onChange={(e) => setVerifyGateway(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold outline-hidden cursor-pointer"
                >
                  <option value="Razorpay">Razorpay Gateway</option>
                  <option value="Cashfree">Cashfree Gateway</option>
                  <option value="Bank Transfer">Bank Transfer / Manual Slip</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Transaction ID / Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. pay_Rzp827361 or REF-987654"
                  value={verifyTxnId}
                  onChange={(e) => setVerifyTxnId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Rejection Reason (If rejecting payment)</label>
                <input
                  type="text"
                  placeholder="e.g. Invalid reference / payment unverified"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmRejectPayment}
                  disabled={submitting || !rejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-40 cursor-pointer"
                >
                  Reject Payment
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerifyPayment}
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
    </div>
  );
}
