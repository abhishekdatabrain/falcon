'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
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
} from 'lucide-react';

export default function AdminOrdersPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  // Data States
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Quick Tab Filter: ALL, ACTIVE, COMPLETED, CANCELLED
  const [activeTab, setActiveTab] = useState('ALL');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer / Modals State
  const [selectedOrder, setSelectedOrder] = useState(null); // For Order Details Drawer
  const [detailsTab, setDetailsTab] = useState('overview'); // 'overview', 'progress', 'history'

  const [assignModalOrder, setAssignModalOrder] = useState(null); // For Assign Driver Modal
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const [statusModalOrder, setStatusModalOrder] = useState(null); // For Update Status Modal
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const [paymentModalOrder, setPaymentModalOrder] = useState(null); // For Payment Verification Modal
  const [rejectionReason, setRejectionReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Fetch Orders and Drivers
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
  ]);

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
    setActiveTab('ALL');
    setCurrentPage(1);
  };

  // 1. Assign / Reassign Driver Handler
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

  // 2. Update Order Status Handler
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

  // 3. Verify Payment Handler
  const handleConfirmVerifyPayment = async (paymentId) => {
    try {
      setSubmitting(true);
      const res = await fetchApi(`/payments/${paymentId}/verify`, {
        method: 'POST',
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم توثيق الدفع بنجاح!' : 'Payment verified successfully!',
          'success'
        );
        setPaymentModalOrder(null);
        if (selectedOrder) {
          const updated = await fetchApi(`/orders/${selectedOrder.id}`);
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

  // 4. Reject Payment Handler
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
          locale === 'ar' ? 'تم رفض الدفع' : 'Payment rejected',
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

  // Open Full Order Details Drawer
  const openOrderDetails = async (orderId, initialTab = 'overview') => {
    setDetailsTab(initialTab);
    try {
      const res = await fetchApi(`/orders/${orderId}`);
      if (res.success) {
        setSelectedOrder(res.data.order);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch order details', 'error');
    }
  };

  // Render Status Badge Pill
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">DELIVERED</span>;
      case 'PAYMENT_VERIFIED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">CONFIRMED (PAID)</span>;
      case 'DRIVER_ASSIGNED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">DRIVER ASSIGNED</span>;
      case 'DRIVER_ACCEPTED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">DRIVER ACCEPTED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse">OUT FOR DELIVERY</span>;
      case 'ARRIVED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">ARRIVED</span>;
      case 'PENDING_PAYMENT':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">PENDING PAYMENT</span>;
      case 'PAYMENT_SUBMITTED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">PAYMENT SUBMITTED</span>;
      case 'CANCELLED':
      case 'PAYMENT_REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  // Render Payment Status Badge
  const renderPaymentBadge = (payment) => {
    if (!payment) return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Unpaid</span>;
    switch (payment.status) {
      case 'VERIFIED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ PAID</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">REVIEW SUBMITTED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">✗ REJECTED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">PENDING</span>;
    }
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
                {locale === 'ar' ? 'إدارة وتتبع الطلبات الشاملة' : 'Order Management'}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">{locale === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{stats?.total || 0}</div>
        </div>

        <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200 shadow-xs">
          <div className="text-[11px] text-amber-800 font-semibold">{locale === 'ar' ? 'في انتظار الدفع' : 'Pending Orders'}</div>
          <div className="text-lg font-black text-amber-900 mt-0.5">{stats?.pending || 0}</div>
        </div>

        <div className="bg-indigo-50/80 rounded-2xl p-3.5 border border-indigo-200 shadow-xs">
          <div className="text-[11px] text-indigo-800 font-semibold">{locale === 'ar' ? 'قيد التجهيز/التعيين' : 'Processing'}</div>
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
          <div className="text-[11px] text-rose-800 font-semibold">{locale === 'ar' ? 'ملغية/مرفوضة' : 'Cancelled'}</div>
          <div className="text-lg font-black text-rose-900 mt-0.5">{stats?.cancelled || 0}</div>
        </div>

        <div className="bg-blue-50/80 rounded-2xl p-3.5 border border-blue-200 shadow-xs">
          <div className="text-[11px] text-blue-800 font-semibold">{locale === 'ar' ? 'مدفوعات معلقة' : 'Pending Pay'}</div>
          <div className="text-lg font-black text-blue-900 mt-0.5">{stats?.pendingPayments || 0}</div>
        </div>

        <div className="bg-teal-50/80 rounded-2xl p-3.5 border border-teal-200 shadow-xs">
          <div className="text-[11px] text-teal-800 font-semibold">{locale === 'ar' ? 'مدفوعات مؤكدة' : 'Completed Pay'}</div>
          <div className="text-lg font-black text-teal-900 mt-0.5">{stats?.completedPayments || 0}</div>
        </div>
      </div>

      {/* Quick Filter Tabs Navigation (Requirement 8) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          {locale === 'ar' ? 'جميع الطلبات' : 'All Orders'} ({stats?.total || 0})
        </button>

        <button
          onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'ACTIVE'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          ⚡ {locale === 'ar' ? 'الطلبات النشطة' : 'Active Orders'} ({(stats?.pending || 0) + (stats?.processing || 0) + (stats?.outForDelivery || 0)})
        </button>

        <button
          onClick={() => { setActiveTab('COMPLETED'); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          ✓ {locale === 'ar' ? 'الطلبات المكتملة' : 'Completed Orders'} ({stats?.delivered || 0})
        </button>

        <button
          onClick={() => { setActiveTab('CANCELLED'); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'CANCELLED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          ✕ {locale === 'ar' ? 'الطلبات الملغية' : 'Cancelled Orders'} ({stats?.cancelled || 0})
        </button>
      </div>

      {/* Control Bar: Search & Advanced Filters Panel (Requirement 2) */}
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

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${showAdvancedFilters || orderStatusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || driverFilter !== 'ALL' || fromDate || minAmount
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{locale === 'ar' ? 'الفلاتر المتقدمة' : 'Advanced Filters'}</span>
              {(orderStatusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || driverFilter !== 'ALL' || fromDate || minAmount) && (
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

        {/* Expandable Advanced Filters Grid */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in duration-150 text-xs">
            {/* Order Status Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'حالة الطلب' : 'Order Status'}</label>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white outline-hidden cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="PAYMENT_SUBMITTED">PAYMENT_SUBMITTED</option>
                <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                <option value="DRIVER_ASSIGNED">DRIVER_ASSIGNED</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
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
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
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
                    {drv.user?.email}
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

            {/* Min Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{locale === 'ar' ? 'الحد الأدنى للمبلغ' : 'Min Amount (SAR)'}</label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
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
              <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'رقم الطلب والتاريخ' : 'Order ID & Date'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'بيانات العميل' : 'Customer Info'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'حالة الدفع' : 'Payment Status'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'حالة الطلب' : 'Order Status'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'السائق المسند' : 'Assigned Driver'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const cust = ord.customer || {};
                  const custUser = cust.user || {};
                  const addr = ord.address || {};
                  const drv = ord.delivery?.driver || null;
                  const drvUser = drv?.user || {};

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-all">
                      {/* Order Number & Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <button
                              onClick={() => openOrderDetails(ord.id)}
                              className="text-xs font-black text-slate-900 font-mono hover:text-indigo-600 text-left transition-colors cursor-pointer"
                            >
                              #{ord.order_number}
                            </button>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {new Date(ord.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">
                            {cust.first_name ? `${cust.first_name} ${cust.last_name || ''}` : 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {custUser.mobile || custUser.email || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-black text-xs text-slate-900">
                        {parseFloat(ord.grand_total || 0).toFixed(2)} SAR
                      </td>

                      {/* Payment Status Pill */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {renderPaymentBadge(ord.payment)}
                          {ord.payment?.status === 'SUBMITTED' && (
                            <button
                              onClick={() => setPaymentModalOrder(ord)}
                              className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-all cursor-pointer"
                              title="Verify Bank Payment"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Order Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(ord.order_status)}
                      </td>

                      {/* Assigned Driver */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {drv ? (
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-cyan-600" />
                            <span className="text-xs font-bold text-slate-800">{drvUser.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 font-medium max-w-xs truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{addr.street ? `${addr.building_number || ''} ${addr.street}, ${addr.city || 'Riyadh'}` : 'Delivery Location'}</span>
                        </div>
                      </td>

                      {/* Actions Buttons Column */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => openOrderDetails(ord.id, 'overview')}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="View Complete Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Assign Driver */}
                          <button
                            onClick={() => { setAssignModalOrder(ord); setAssignDriverId(ord.delivery?.driver_id || ''); }}
                            className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition-all cursor-pointer"
                            title="Assign or Reassign Driver"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Update Status */}
                          <button
                            onClick={() => { setStatusModalOrder(ord); setTargetStatus(ord.order_status); }}
                            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer"
                            title="Update Order Status"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* View Audit History */}
                          <button
                            onClick={() => openOrderDetails(ord.id, 'history')}
                            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer"
                            title="View Complete History Log"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
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
      {/* 3. ORDER DETAILS DRAWER / MODAL (3 TAB PANELS) */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end p-0 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">Order #{selectedOrder.order_number}</h2>
                    {renderStatusBadge(selectedOrder.order_status)}
                  </div>
                  <p className="text-xs text-slate-500">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Sub-Header Tabs Navigation */}
            <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-6 bg-slate-50/50 text-xs font-bold">
              <button
                onClick={() => setDetailsTab('overview')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${detailsTab === 'overview'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Overview & Products
              </button>
              <button
                onClick={() => setDetailsTab('progress')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${detailsTab === 'progress'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Delivery Progress & GPS Tracker
              </button>
              <button
                onClick={() => setDetailsTab('history')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${detailsTab === 'history'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Activity History Log ({selectedOrder.status_history?.length || 0})
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs custom-scrollbar">
              {/* TAB 1: OVERVIEW & PRODUCTS */}
              {detailsTab === 'overview' && (
                <>
                  {/* Customer & Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Information</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {selectedOrder.customer?.first_name} {selectedOrder.customer?.last_name}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedOrder.customer?.user?.mobile || 'No mobile listed'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedOrder.customer?.user?.email || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Address</div>
                      <div className="text-xs font-bold text-slate-800 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                        <span>
                          {selectedOrder.address?.building_number && `Building ${selectedOrder.address.building_number}, `}
                          {selectedOrder.address?.street}, {selectedOrder.address?.area}, {selectedOrder.address?.city || 'Riyadh'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Postal Code: {selectedOrder.address?.postal_code || '11564'}
                      </div>
                    </div>
                  </div>

                  {/* Payment Info Card & Verification */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-700" />
                        <span className="font-extrabold text-indigo-950 text-xs">Payment Information</span>
                      </div>
                      {renderPaymentBadge(selectedOrder.payment)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Payment Method</span>
                        <strong className="text-slate-900">Bank Transfer / Cash</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Bank Name</span>
                        <strong className="text-slate-900">{selectedOrder.payment?.confirmation?.bank_name || 'Saudi National Bank'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Transaction / Ref #</span>
                        <strong className="text-slate-900 font-mono">{selectedOrder.payment?.confirmation?.payment_reference || 'REF-9876543'}</strong>
                      </div>
                    </div>

                    {selectedOrder.payment?.status === 'SUBMITTED' && (
                      <div className="pt-2 border-t border-indigo-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-blue-800">
                          Proof file submitted by customer. Please verify to enable dispatch.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmVerifyPayment(selectedOrder.payment.id)}
                            disabled={submitting}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Verify Payment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Products Table */}
                  <div className="space-y-3">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Ordered Products ({selectedOrder.items?.length || 0})</h3>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3 text-right">Tax (15%)</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedOrder.items || []).map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 font-bold text-slate-900">{item.product_name_en}</td>
                              <td className="px-4 py-3 font-mono">{parseFloat(item.unit_price).toFixed(2)} SAR</td>
                              <td className="px-4 py-3 font-mono font-bold text-center">{item.quantity}</td>
                              <td className="px-4 py-3 font-mono text-right">{parseFloat(item.tax_amount || 0).toFixed(2)} SAR</td>
                              <td className="px-4 py-3 font-mono font-bold text-right text-slate-900">{parseFloat(item.total_price).toFixed(2)} SAR</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Breakdown Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-right max-w-xs ml-auto font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-mono">{parseFloat(selectedOrder.subtotal || 0).toFixed(2)} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">VAT (15%):</span>
                        <span className="font-mono">{parseFloat(selectedOrder.tax_total || 0).toFixed(2)} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivery Charge:</span>
                        <span className="font-mono">{parseFloat(selectedOrder.delivery_fee || 0).toFixed(2)} SAR</span>
                      </div>
                      {parseFloat(selectedOrder.discount_total || 0) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount:</span>
                          <span className="font-mono">-{parseFloat(selectedOrder.discount_total).toFixed(2)} SAR</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 mt-1">
                        <span>Grand Total:</span>
                        <span className="font-mono text-emerald-700">{parseFloat(selectedOrder.grand_total || 0).toFixed(2)} SAR</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: DELIVERY PROGRESS & LIVE GPS TRACKING (Requirement 7) */}
              {detailsTab === 'progress' && (
                <div className="space-y-6">
                  {/* 7-Stage Visual Timeline Progress */}
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Visual Delivery Timeline
                    </h3>

                    <div className="relative pl-6 space-y-6 border-l-2 border-slate-200">
                      {[
                        { title: '1. Order Placed', statusKey: 'PENDING_PAYMENT' },
                        { title: '2. Payment Verified', statusKey: 'PAYMENT_VERIFIED' },
                        { title: '3. Processing Order', statusKey: 'PROCESSING' },
                        { title: '4. Ready for Pickup', statusKey: 'READY_FOR_PICKUP' },
                        { title: '5. Driver Assigned', statusKey: 'DRIVER_ASSIGNED' },
                        { title: '6. Out for Delivery', statusKey: 'OUT_FOR_DELIVERY' },
                        { title: '7. Order Delivered', statusKey: 'DELIVERED' },
                      ].map((stage, idx) => {
                        const historyMatch = (selectedOrder.status_history || []).find(h => h.to_status === stage.statusKey);
                        const isCurrent = selectedOrder.order_status === stage.statusKey;
                        const isPassed = !!historyMatch || isCurrent;

                        return (
                          <div key={idx} className="relative">
                            <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${isCurrent
                                ? 'bg-indigo-600 border-white ring-4 ring-indigo-100 animate-pulse'
                                : isPassed
                                  ? 'bg-emerald-500 border-white'
                                  : 'bg-slate-300 border-white'
                              }`}></span>
                            <div className="space-y-0.5">
                              <div className={`font-black text-xs ${isCurrent ? 'text-indigo-700' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                                {stage.title}
                              </div>
                              {historyMatch ? (
                                <div className="text-[11px] text-slate-500 font-mono">
                                  Completed at {new Date(historyMatch.createdAt).toLocaleString()} {historyMatch.notes && `• Note: ${historyMatch.notes}`}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 italic">Stage pending</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Driver & GPS Live Tracker Card */}
                  <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <h4 className="font-extrabold text-sm text-white">Live Driver GPS Radar Tracker</h4>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        GPS Active (35 km/h)
                      </span>
                    </div>

                    {selectedOrder.delivery?.driver ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Driver</span>
                          <div className="font-extrabold text-white text-sm">{selectedOrder.delivery.driver.user?.email}</div>
                          <div className="text-slate-400 font-mono">Phone: {selectedOrder.delivery.driver.user?.mobile || 'N/A'}</div>
                        </div>

                        <div className="space-y-1 font-mono text-slate-300">
                          <div>Latitude: <strong className="text-cyan-400">24.7136 N</strong></div>
                          <div>Longitude: <strong className="text-cyan-400">46.6753 E</strong></div>
                          <div>Target ETA: <strong className="text-emerald-400">18 minutes</strong></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        No active driver assigned to this order yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: COMPLETE ORDER HISTORY AUDIT LOG (Requirement 9) */}
              {detailsTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Chronological Activity Audit Log
                  </h3>

                  {(selectedOrder.status_history || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      No status history recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedOrder.status_history || []).map((hist) => (
                        <div key={hist.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 text-xs">
                              {hist.from_status ? `${hist.from_status} → ${hist.to_status}` : `Initialized: ${hist.to_status}`}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{new Date(hist.createdAt).toLocaleString()}</span>
                          </div>
                          {hist.notes && <p className="text-slate-600 text-xs">{hist.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/90">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAssignModalOrder(selectedOrder); setAssignDriverId(selectedOrder.delivery?.driver_id || ''); }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-all cursor-pointer"
                >
                  Assign Driver
                </button>
                <button
                  onClick={() => { setStatusModalOrder(selectedOrder); setTargetStatus(selectedOrder.order_status); }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer"
                >
                  Update Status
                </button>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ASSIGN DRIVER MODAL */}
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
                <label className="block text-slate-600 font-bold mb-1.5">Select Available Driver *</label>
                <select
                  value={assignDriverId}
                  onChange={(e) => setAssignDriverId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-cyan-500 outline-hidden"
                  required
                >
                  <option value="">-- Choose active driver --</option>
                  {drivers.map((drv) => (
                    <option key={drv.id} value={drv.id}>
                      {drv.user?.email} ({drv.availability_status || 'OFFLINE'}) - License: {drv.license_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Reassignment / Dispatch Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched for express delivery"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black shadow-md shadow-cyan-500/20"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. UPDATE STATUS MODAL */}
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold focus:border-indigo-500 outline-hidden"
                  required
                >
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="PAYMENT_SUBMITTED">PAYMENT_SUBMITTED</option>
                  <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                  <option value="DRIVER_ASSIGNED">DRIVER_ASSIGNED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Status Update Note / Cancellation Reason</label>
                <textarea
                  rows={2}
                  placeholder="Enter reason or audit note..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-500/20"
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PAYMENT VERIFICATION / REJECTION MODAL */}
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
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 font-medium">
                <div>Bank Name: <strong>{paymentModalOrder.payment?.confirmation?.bank_name || 'Saudi National Bank'}</strong></div>
                <div>Reference ID: <strong className="font-mono">{paymentModalOrder.payment?.confirmation?.payment_reference || 'REF-876543'}</strong></div>
                <div>Amount: <strong className="font-mono text-emerald-700">{parseFloat(paymentModalOrder.grand_total || 0).toFixed(2)} SAR</strong></div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Rejection Reason (If rejecting)</label>
                <input
                  type="text"
                  placeholder="e.g. Invalid transaction reference"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmRejectPayment}
                  disabled={submitting || !rejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-40"
                >
                  Reject Payment
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmVerifyPayment(paymentModalOrder.payment?.id)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/20"
                >
                  Verify & Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
