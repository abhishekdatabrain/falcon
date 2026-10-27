'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import AdminPagination from '../../../src/components/AdminPagination';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Search,
  User,
  ExternalLink,
  X,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Package,
  RotateCcw,
  AlertTriangle,
  Copy,
  Check,
  Plus,
  Info,
  DollarSign,
  ChevronRight,
  Upload,
  ArrowUpRight
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('payments.approve');
  const canRefund = hasPermission('refunds.refund');

  // Primary Data State
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalVolume: 0,
    paidCount: 0,
    paidVolume: 0,
    pendingBankAuditCount: 0,
    pendingBankAuditVolume: 0,
    pendingPaymentCount: 0,
    pendingPaymentVolume: 0,
    failedRejectedCount: 0,
    refundedCount: 0,
    refundedVolume: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Views
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'BANK_AUDIT' | 'PAID' | 'PENDING' | 'REJECTED' | 'REFUNDED'
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals & Drawers
  const [selectedProofPayment, setSelectedProofPayment] = useState(null);
  const [inspectPayment, setInspectPayment] = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionNote, setCustomRejectionNote] = useState('');
  const [refundingPayment, setRefundingPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund');
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Unpaid Orders for Manual Bank Slip Recording
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [recordForm, setRecordForm] = useState({
    orderId: '',
    bankName: 'Al Rajhi Bank',
    paymentReference: '',
    proofFile: null,
    proofPreview: '',
    autoVerify: true,
  });

  // Copied indicator state
  const [copiedId, setCopiedId] = useState(null);

  // Load Payments Data
  const loadPayments = async (overridePage, overrideLimit) => {
    try {
      setLoading(true);
      const currentPage = overridePage !== undefined ? overridePage : pagination.page;
      const currentLimit = overrideLimit !== undefined ? overrideLimit : (pagination.limit || 10);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', currentLimit);

      if (activeTab !== 'ALL') {
        params.append('status', activeTab);
      }
      if (paymentMethodFilter && paymentMethodFilter !== 'ALL') {
        params.append('method', paymentMethodFilter);
      }
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetchApi(`/payments?${params.toString()}`);
      if (res.success && res.data) {
        setPayments(res.data.payments || res.data.records || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
      showToast(err.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search & filter reload
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, paymentMethodFilter, dateFrom, dateTo]);

  // Load Unpaid Orders for Manual Record Modal
  const loadUnpaidOrders = async () => {
    try {
      const res = await fetchApi('/admin/orders?limit=50&status=PENDING_PAYMENT');
      if (res.success && res.data && res.data.orders) {
        setUnpaidOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load unpaid orders:', err);
    }
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(locale === 'ar' ? 'تم نسخ المرجع إلى الحافظة' : 'Copied reference to clipboard', 'info');
  };

  // 1. Approve & Verify Payment
  const handleVerify = async (paymentId) => {
    try {
      setActionLoading(true);
      const res = await fetchApi(`/payments/${paymentId}/verify`, { method: 'POST' });
      if (res.success) {
        showToast(
          locale === 'ar'
            ? 'تم تأكيد الدفع بنجاح! تم تحديث حالة الطلب إلى (مؤكد) وجاهز للإسناد.'
            : 'Payment verified and marked as PAID! Order status updated to CONFIRMED.',
          'success'
        );
        setSelectedProofPayment(null);
        setInspectPayment(null);
        await loadPayments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Reject Payment
  const confirmReject = async () => {
    if (!rejectingPayment) return;
    const finalReason = [rejectionReason, customRejectionNote].filter(Boolean).join(' - ') || 'Payment rejected by administrator';

    try {
      setActionLoading(true);
      const res = await fetchApi(`/payments/${rejectingPayment.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: finalReason }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم رفض إيصال التحويل بنجاح وتحديث حالة الطلب' : 'Payment rejected and marked as REJECTED',
          'info'
        );
        setRejectingPayment(null);
        setRejectionReason('');
        setCustomRejectionNote('');
        setSelectedProofPayment(null);
        setInspectPayment(null);
        await loadPayments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Refund Payment
  const confirmRefund = async () => {
    if (!refundingPayment) return;
    try {
      setActionLoading(true);
      const res = await fetchApi(`/payments/${refundingPayment.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ refundReason: refundReason || 'Refund initiated by Admin' }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم استرداد المبلغ بنجاح واسترجاع المخزون' : 'Payment refunded successfully and inventory restored',
          'success'
        );
        setRefundingPayment(null);
        setInspectPayment(null);
        await loadPayments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Record Manual Bank Slip
  const handleRecordBankSlip = async (e) => {
    e.preventDefault();
    if (!recordForm.orderId || !recordForm.paymentReference) {
      showToast(locale === 'ar' ? 'يرجى اختيار الطلب وإدخال رقم المرجع' : 'Please select order and provide payment reference', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('orderId', recordForm.orderId);
      formData.append('bankName', recordForm.bankName);
      formData.append('paymentReference', recordForm.paymentReference);
      formData.append('autoVerify', recordForm.autoVerify);

      if (recordForm.proofFile) {
        formData.append('proofFile', recordForm.proofFile);
      }

      const res = await fetchApi('/payments/admin-submit', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        showToast(
          locale === 'ar'
            ? recordForm.autoVerify
              ? 'تم تسجيل التحويل وتأكيده بنجاح!'
              : 'تم تسجيل إيصال التحويل وهو بانتظار التأكيد'
            : recordForm.autoVerify
            ? 'Bank payment recorded and verified!'
            : 'Bank payment proof recorded successfully for audit',
          'success'
        );
        setShowRecordModal(false);
        setRecordForm({
          orderId: '',
          bankName: 'Al Rajhi Bank',
          paymentReference: '',
          proofFile: null,
          proofPreview: '',
          autoVerify: true,
        });
        await loadPayments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for Payment Status Badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{locale === 'ar' ? 'مكتمل الدفع' : 'PAID'}</span>
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-black whitespace-nowrap shadow-2xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>{locale === 'ar' ? 'بانتظار التدقيق' : 'UNDER REVIEW'}</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{locale === 'ar' ? 'معلق للدفع' : 'PENDING'}</span>
          </span>
        );
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-black whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{locale === 'ar' ? 'مرفوض' : 'REJECTED'}</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-black whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>{locale === 'ar' ? 'مسترد' : 'REFUNDED'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  // Helper for Payment Method Badges
  const renderMethodBadge = (method) => {
    const m = (method || '').toLowerCase();
    const isBank = m.includes('bank');
    const isCOD = m === 'cod' || m.includes('cash');
    const isMada = m.includes('mada');
    const isCard = m.includes('razorpay') || m.includes('card') || m.includes('visa') || m.includes('master');

    let badgeClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    let icon = <CreditCard className="w-3.5 h-3.5 shrink-0" />;

    if (isBank) {
      badgeClasses = 'bg-sky-50 text-sky-800 border-sky-200';
      icon = <Landmark className="w-3.5 h-3.5 text-sky-700 shrink-0" />;
    } else if (isMada) {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      icon = <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
    } else if (isCOD) {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      icon = <DollarSign className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
    } else if (isCard) {
      badgeClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      icon = <CreditCard className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap shadow-2xs ${badgeClasses}`}>
        {icon}
        <span>{method || 'COD'}</span>
      </span>
    );
  };

  // Helper for 4-Step Payment Lifecycle Tracking
  const renderPaymentTracker = (pay) => {
    const isBank = (pay.payment_method || '').toLowerCase().includes('bank') || !!pay.confirmation;
    const isPaid = ['PAID', 'VERIFIED'].includes(pay.status);
    const isSubmitted = ['SUBMITTED', 'UNDER_REVIEW'].includes(pay.status);
    const isRejected = ['REJECTED', 'FAILED'].includes(pay.status);
    const isRefunded = pay.status === 'REFUNDED';

    const steps = [
      {
        title: locale === 'ar' ? 'إنشاء الطلب' : 'Order Placed',
        done: true,
        desc: new Date(pay.createdAt).toLocaleDateString(),
      },
      {
        title: isBank ? (locale === 'ar' ? 'تقديم الإيصال' : 'Proof Uploaded') : (locale === 'ar' ? 'بوابة الدفع' : 'Gateway Auth'),
        done: isSubmitted || isPaid || isRefunded,
        current: isSubmitted,
        desc: pay.confirmation?.payment_reference || pay.transaction_id || (isSubmitted ? 'Awaiting Audit' : 'Pending'),
      },
      {
        title: locale === 'ar' ? 'التدقيق والاعتماد' : 'Admin Audit / Verification',
        done: isPaid || isRefunded,
        failed: isRejected,
        current: isSubmitted,
        desc: isRejected
          ? (locale === 'ar' ? 'تم الرفض' : 'Rejected')
          : isPaid
          ? (pay.verified_by_admin?.name || (locale === 'ar' ? 'معتمد' : 'Approved'))
          : (locale === 'ar' ? 'قيد المراجعة' : 'Pending Verification'),
      },
      {
        title: locale === 'ar' ? 'التنفيذ والتسليم' : 'Order Released',
        done: ['CONFIRMED', 'PROCESSING', 'PACKED', 'DRIVER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(pay.order?.order_status),
        failed: isRefunded,
        desc: pay.order?.order_status || 'Pending Payment',
      },
    ];

    return (
      <div className="w-full pt-2 pb-1">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
          {steps.map((st, idx) => (
            <div key={idx} className="flex flex-col items-center relative z-10 text-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
 st.failed
 ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
 : st.done
 ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
 : st.current
 ? 'bg-amber-400 border-amber-500 text-slate-900 animate-pulse shadow-xs'
 : 'bg-white border-slate-300 text-slate-400'
 }`}
              >
                {st.failed ? <X className="w-3.5 h-3.5" /> : st.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-black mt-1 line-clamp-1 ${st.failed ? 'text-rose-600' : st.done ? 'text-emerald-800' : 'text-slate-500'}`}>
                {st.title}
              </span>
              <span className="text-[9px] text-slate-400 line-clamp-1 max-w-[80px]">
                {st.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-slate-950 via-[#05442e] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-lime-400 flex items-center justify-center shadow-inner shrink-0">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black text-lime-300 tracking-wider uppercase bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15">
                  Section 4.6
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {locale === 'ar' ? 'إدارة المدفوعات والتحويلات البنكية' : 'Payment Management'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 border border-lime-400/30 text-lime-300 text-[11px] font-black uppercase">
                  {locale === 'ar' ? 'مباشر' : 'Live Gateway & Audit'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1.5 max-w-2xl leading-relaxed">
                {locale === 'ar'
                  ? 'سجلات الدفع المتكاملة، التدقيق الفوري لإيصالات التحويل البنكي، اعتماد ورفض المدفوعات، وتتبع دورة الدفع وربطها بالطلبات.'
                  : 'View payment records, audit bank transfer confirmations, approve/reject receipts, track payment lifecycles, and link records with orders.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {canApprove && (
              <button
                onClick={() => {
                  loadUnpaidOrders();
                  setShowRecordModal(true);
                }}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تسجيل إيصال بنكي يدوياً' : 'Record Bank Slip'}</span>
              </button>
            )}

            <button
              onClick={() => loadPayments()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all shadow-xs cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics & Bank Audit Alert Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Payments Volume */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'إجمالي المدفوعات المسجلة' : 'Total Payment Volume'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {stats.totalVolume.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">SAR</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {stats.totalCount} {locale === 'ar' ? 'عملية دفع' : 'records total'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Bank Audits Pending - High Attention Card */}
        <div
          onClick={() => setActiveTab('BANK_AUDIT')}
          className={`rounded-3xl p-5 border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden group ${
 stats.pendingBankAuditCount > 0
 ? 'bg-gradient-to-br from-amber-500/10 via-amber-50 to-white border-amber-300 shadow-md ring-2 ring-amber-400/30'
 : 'bg-white border-slate-200/80 shadow-xs'
 }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider block">
                {locale === 'ar' ? 'إيصالات بانتظار التدقيق' : 'Bank Proofs To Audit'}
              </span>
              {stats.pendingBankAuditCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-800">
                {stats.pendingBankAuditCount}
              </span>
              <span className="text-xs font-bold text-amber-700">
                ({stats.pendingBankAuditVolume.toFixed(2)} SAR)
              </span>
            </div>
            <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1 group-hover:underline">
              <span>{locale === 'ar' ? 'انقر للتدقيق الفوري' : 'Click to inspect & approve'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Verified & Paid Volume */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'المدفوعات المعتمدة' : 'Verified & Paid'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-800">
                {stats.paidVolume.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-emerald-600">SAR</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              {stats.paidCount} {locale === 'ar' ? 'مدفوعة بنجاح' : 'settled payments'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Rejected & Refunded */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'المرفوض والمسترد' : 'Rejected & Refunded'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">
                {stats.failedRejectedCount}
              </span>
              <span className="text-xs font-bold text-slate-400">/</span>
              <span className="text-lg font-black text-purple-700">
                {stats.refundedCount} {locale === 'ar' ? 'مسترد' : 'refunded'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {stats.refundedVolume.toFixed(2)} SAR {locale === 'ar' ? 'مبالغ مستردة' : 'refunded total'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Filter Toolbar & Tabs */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {[
            { key: 'ALL', label: locale === 'ar' ? 'جميع السجلات' : 'All Payments', count: stats.totalCount },
            {
              key: 'BANK_AUDIT',
              label: locale === 'ar' ? 'تدقيق التحويلات البنكية' : 'Bank Audit',
              count: stats.pendingBankAuditCount,
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
            },
            { key: 'PAID', label: locale === 'ar' ? 'معتمد / مدفوع' : 'Verified / Paid', count: stats.paidCount },
            { key: 'PENDING', label: locale === 'ar' ? 'معلق للدفع' : 'Pending', count: stats.pendingPaymentCount },
            { key: 'REJECTED', label: locale === 'ar' ? 'المرفوضة' : 'Rejected / Failed', count: stats.failedRejectedCount },
            { key: 'REFUNDED', label: locale === 'ar' ? 'المستردة' : 'Refunded', count: stats.refundedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
 isActive
 ? 'bg-[#05442e] text-white shadow-md'
 : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
 }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
 isActive
 ? 'bg-white/20 text-white'
 : tab.badgeColor || 'bg-slate-200 text-slate-700'
 }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث برقم الطلب، رقم المرجع، اسم البنك، اسم العميل، أو المعرف...' : 'Search by Order #, Ref #, Bank Name, Customer, or Txn ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#05442e] focus:bg-white transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#05442e] cursor-pointer"
            >
              <option value="ALL">{locale === 'ar' ? 'جميع طرق الدفع' : 'All Methods'}</option>
              <option value="Bank Transfer">{locale === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
              <option value="COD">{locale === 'ar' ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}</option>
              <option value="mada">{locale === 'ar' ? 'مدى (mada)' : 'mada'}</option>
              <option value="Razorpay">Razorpay / Card</option>
              <option value="Cashfree">Cashfree</option>
            </select>

            {/* Date Filter */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                title={locale === 'ar' ? 'تصفية حسب التاريخ' : 'Filter by Date'}
              />
              {dateFrom && (
                <button
                  type="button"
                  onClick={() => setDateFrom('')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title={locale === 'ar' ? 'مسح التاريخ' : 'Clear Date'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
 viewMode === 'grid' ? 'bg-white text-[#05442e] shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
 }`}
                title="Grid / Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
 viewMode === 'table' ? 'bg-white text-[#05442e] shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
 }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {(searchQuery || paymentMethodFilter !== 'ALL' || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPaymentMethodFilter('ALL');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-3 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'مسح الفلاتر' : 'Reset'}
              </button>
            )}

          </div>

        </div>

      </div>

      {/* 4. Main Records Container: Grid or Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white h-72 rounded-3xl animate-pulse border border-slate-200/80" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {locale === 'ar' ? 'لا توجد سجلات دفع مطابقة' : 'No Payment Records Found'}
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            {locale === 'ar'
              ? 'لم يتم العثور على أي مدفوعات تطابق معايير البحث والفلترة المحددة. جرب تغيير حالة البحث أو مسح الفلاتر.'
              : 'No payment entries match the selected filters or search terms. Try clearing filters or recording a new bank receipt.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payments.map((pay) => {
            const proofUrl = pay.confirmation?.proof_file_url
              ? getImageUrl(pay.confirmation.proof_file_url)
              : null;
            const isBankAuditNeeded = ['SUBMITTED', 'UNDER_REVIEW'].includes(pay.status);
            const isPaid = ['PAID', 'VERIFIED'].includes(pay.status);
            const isAmountMatch = parseFloat(pay.amount || 0) === parseFloat(pay.order?.grand_total || 0);

            return (
              <div
                key={pay.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 space-y-5 flex flex-col justify-between group shadow-xs hover:shadow-xl ${
 isBankAuditNeeded
 ? 'border-amber-300 ring-2 ring-amber-400/20'
 : 'border-slate-200/80 hover:border-emerald-500/40'
 }`}
              >
                
                {/* Card Top: Order Link, Method, Amount */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Linked Order Link (Requirement 5) */}
                        <Link
                          href={`/admin/orders?search=${pay.order?.order_number || pay.order_id}`}
                          className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200/60 inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                          title="View Order in Orders Management"
                        >
                          <Package className="w-3.5 h-3.5 text-emerald-700" />
                          <span>#{pay.order?.order_number || 'N/A'}</span>
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        </Link>
                        {renderMethodBadge(pay.payment_method)}
                        {renderStatusBadge(pay.status)}
                      </div>

                      {/* Customer Name & Link */}
                      <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5 pt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {pay.order?.customer?.first_name} {pay.order?.customer?.last_name || ''}
                        </span>
                        {pay.order?.customer?.mobile && (
                          <span className="text-slate-400 font-normal">({pay.order.customer.mobile})</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-[#05442e] block leading-tight">
                        {parseFloat(pay.amount || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">SAR</span>
                      </span>
                      {pay.order?.grand_total && (
                        <span className={`text-[10px] font-bold block ${isAmountMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isAmountMatch
                            ? (locale === 'ar' ? 'مطابق لإجمالي الطلب' : 'Matches Order Total')
                            : `${locale === 'ar' ? 'الطلب:' : 'Order:'} ${parseFloat(pay.order.grand_total).toFixed(2)} SAR`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bank Confirmation Box (Requirement 2: Verify Bank Confirmation) */}
                  {pay.confirmation ? (
                    <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-900 font-black flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-amber-700" />
                          <span>{locale === 'ar' ? 'إيصال التحويل البنكي المقدم:' : 'Submitted Bank Proof:'}</span>
                        </span>
                        <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                          {pay.confirmation.bank_name || 'Bank Transfer'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">{locale === 'ar' ? 'رقم مرجع الحوالة:' : 'Reference / Slip #:'}</span>
                        <div className="flex items-center gap-1.5 font-mono text-emerald-800 font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span>{pay.confirmation.payment_reference || 'N/A'}</span>
                          <button
                            onClick={() => handleCopy(pay.confirmation.payment_reference, pay.id)}
                            className="text-slate-400 hover:text-slate-800 cursor-pointer"
                            title="Copy reference"
                          >
                            {copiedId === pay.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{locale === 'ar' ? 'تاريخ التقديم:' : 'Submitted Time:'}</span>
                        <span className="text-slate-700 font-bold">
                          {new Date(pay.confirmation.submitted_at || pay.confirmation.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* View Proof Button */}
                      {proofUrl && (
                        <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between">
                          <span className="text-amber-900 font-bold text-[11px] flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>{locale === 'ar' ? 'صورة الإيصال المرفقة' : 'Receipt Document Attached'}</span>
                          </span>
                          <button
                            onClick={() => setSelectedProofPayment(pay)}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 hover:text-black bg-white hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-all cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-700" />
                            <span>{locale === 'ar' ? 'معاينة وتدقيق الإيصال' : 'Audit Receipt Proof'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Non-bank or Electronic Gateway Info */
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">{locale === 'ar' ? 'معرف المعاملة:' : 'Transaction ID:'}</span>
                        <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {pay.transaction_id || (locale === 'ar' ? 'غير مسجل بعد' : 'Not generated yet')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">{locale === 'ar' ? 'تاريخ المعاملة:' : 'Transaction Date:'}</span>
                        <span className="text-slate-700 font-semibold">{new Date(pay.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Rejection Note Alert if rejected */}
                  {pay.rejection_reason && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black block">{locale === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}</span>
                        <p className="text-[11px] mt-0.5 text-rose-900">{pay.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* 4-Step Payment Lifecycle Tracker (Requirement 4) */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {locale === 'ar' ? 'مراحل دورة الدفع والتأكيد:' : 'Payment Status Tracking:'}
                    </span>
                    {renderPaymentTracker(pay)}
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  
                  {/* Approve / Reject buttons for bank audit (Requirement 3) */}
                  {isBankAuditNeeded ? (
                    <>
                      <button
                        onClick={() => handleVerify(pay.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-700/50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-lime-300" />
                        <span>{locale === 'ar' ? 'قبول وتأكيد التحويل' : 'Approve & Verify'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingPayment(pay);
                          setRejectionReason('Invalid or fake reference number');
                        }}
                        disabled={actionLoading}
                        className="py-2.5 px-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition-all border border-rose-200 hover:border-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>{locale === 'ar' ? 'رفض' : 'Reject'}</span>
                      </button>
                    </>
                  ) : null}

                  {/* Verify button if pending and not submitted */}
                  {pay.status === 'PENDING' && (
                    <button
                      onClick={() => handleVerify(pay.id)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-lime-400" />
                      <span>{locale === 'ar' ? 'تأكيد الدفع اليدوي' : 'Mark as Paid'}</span>
                    </button>
                  )}

                  {/* Refund action if paid */}
                  {isPaid && (
                    <button
                      onClick={() => setRefundingPayment(pay)}
                      disabled={actionLoading}
                      className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                      <span>{locale === 'ar' ? 'استرداد' : 'Refund'}</span>
                    </button>
                  )}

                  {/* Inspect Details Drawer Button */}
                  <button
                    onClick={() => setInspectPayment(pay)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="View Full Payment & Order Reconciliation"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-600" />
                    <span>{locale === 'ar' ? 'تفاصيل السجل' : 'Full Audit'}</span>
                  </button>

                  {/* Link to Orders */}
                  {pay.order && (
                    <Link
                      href={`/admin/orders?search=${pay.order.order_number}`}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer border border-emerald-200"
                      title={locale === 'ar' ? 'فتح الطلب في إدارة الطلبات' : 'Open in Order Management'}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  )}

                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* MODERN TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px] border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-black">
                <tr>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'معرف الدفع' : 'Payment ID'}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'الطلب والعميل' : 'Linked Order & Customer'}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'حالة السداد' : 'Payment Status'}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'إيصال التحويل' : 'Bank Proof'}</th>
                  <th className="py-4 px-5 whitespace-nowrap">{locale === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                  <th className="py-4 px-5 text-right whitespace-nowrap">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => {
                  const proofUrl = pay.confirmation?.proof_file_url ? getImageUrl(pay.confirmation.proof_file_url) : null;
                  const isAudit = ['SUBMITTED', 'UNDER_REVIEW'].includes(pay.status);
                  const isAmountMatch = parseFloat(pay.amount || 0) === parseFloat(pay.order?.grand_total || 0);

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* 1. Payment ID & Ref */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono text-xs font-black text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                              <span>#{pay.id.slice(0, 8).toUpperCase()}</span>
                              <button
                                onClick={() => handleCopy(pay.id, `id-${pay.id}`)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                title="Copy ID"
                              >
                                {copiedId === `id-${pay.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block whitespace-nowrap">
                              {pay.payment_gateway || 'Direct Gateway'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Linked Order & Customer */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/admin/orders?search=${pay.order?.order_number || pay.order_id}`}
                              className="font-mono text-xs font-black text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                              title="Open in Orders Management"
                            >
                              <span>#{pay.order?.order_number || 'N/A'}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </Link>
                            <div className="text-xs font-bold text-slate-900 whitespace-nowrap mt-0.5">
                              {pay.order?.customer?.first_name ? `${pay.order.customer.first_name} ${pay.order.customer.last_name || ''}` : 'Customer'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                              {pay.order?.customer?.mobile || pay.order?.customer?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Method */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        {renderMethodBadge(pay.payment_method)}
                      </td>

                      {/* 4. Amount */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        <div>
                          <div className="text-sm font-black text-slate-900 font-mono tracking-tight whitespace-nowrap">
                            {parseFloat(pay.amount || 0).toFixed(2)} <span className="text-[10px] font-bold text-slate-400">SAR</span>
                          </div>
                          {pay.order?.grand_total && (
                            <span className={`text-[10px] font-bold block whitespace-nowrap ${isAmountMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isAmountMatch ? (locale === 'ar' ? '✓ مطابق للطلب' : '✓ Matches Total') : `Order: ${parseFloat(pay.order.grand_total).toFixed(2)} SAR`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        <div className="space-y-0.5">
                          {renderStatusBadge(pay.status)}
                          {pay.verified_by_admin?.name && (
                            <span className="text-[10px] text-slate-400 block whitespace-nowrap">
                              {locale === 'ar' ? 'بواسطة: ' : 'by: '}
                              {pay.verified_by_admin.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Bank Proof */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        {pay.confirmation ? (
                          <div className="flex items-center gap-2.5">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-slate-800 block whitespace-nowrap">
                                {pay.confirmation.bank_name || 'Bank'}
                              </span>
                              <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                <span>{pay.confirmation.payment_reference || 'Ref'}</span>
                                <button
                                  onClick={() => handleCopy(pay.confirmation.payment_reference, `ref-${pay.id}`)}
                                  className="text-slate-400 hover:text-slate-800 cursor-pointer"
                                  title="Copy reference"
                                >
                                  {copiedId === `ref-${pay.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            {proofUrl && (
                              <button
                                onClick={() => setSelectedProofPayment(pay)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                                title="Inspect Proof Slip"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700" />
                                <span>{locale === 'ar' ? 'الإيصال' : 'Proof'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">-</span>
                        )}
                      </td>

                      {/* 7. Date & Time */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        <div className="whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-700 block">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {new Date(pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4 px-5 whitespace-nowrap text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isAudit ? (
                            <>
                              <button
                                onClick={() => handleVerify(pay.id)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer border border-emerald-700/50"
                                title="Approve & Verify"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-lime-300" />
                                <span>{locale === 'ar' ? 'اعتماد' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingPayment(pay);
                                  setRejectionReason('Invalid or fake reference number');
                                }}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-all cursor-pointer"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>{locale === 'ar' ? 'رفض' : 'Reject'}</span>
                              </button>
                            </>
                          ) : null}

                          <button
                            onClick={() => setInspectPayment(pay)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer border border-slate-200"
                            title="View Full Audit"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            <span>{locale === 'ar' ? 'التفاصيل' : 'Audit'}</span>
                          </button>

                          {pay.order && (
                            <Link
                              href={`/admin/orders?search=${pay.order.order_number}`}
                              className="p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors border border-slate-200 hover:border-emerald-200"
                              title="Open in Orders"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Controls */}
      <AdminPagination
        pagination={pagination}
        onPageChange={(p) => loadPayments(p, pagination.limit || pagination.pageSize || 10)}
        onPageSizeChange={(newLimit) => loadPayments(1, newLimit)}
        loading={loading}
      />

      {/* MODAL 1: Bank Receipt Proof Inspector (Requirement 2 & 3) */}
      {selectedProofPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] flex flex-col justify-between">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {locale === 'ar' ? 'تدقيق إيصال التحويل البنكي' : 'Bank Transfer Receipt Audit'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar' ? 'مطابقة بيانات إشعار التحويل البنكي مع بيانات الطلب' : 'Verify bank document proof against linked order credentials'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProofPayment(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Image Proof & Verification Checklist Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
              
              {/* Proof Image Container */}
              <div className="space-y-3">
                <div className="h-80 sm:h-96 rounded-2xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center overflow-hidden relative group">
                  {selectedProofPayment.confirmation?.proof_file_url ? (
                    <img
                      src={getImageUrl(selectedProofPayment.confirmation.proof_file_url)}
                      alt="Bank Receipt Slip"
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">No image proof file</span>
                  )}
                </div>

                {selectedProofPayment.confirmation?.proof_file_url && (
                  <div className="flex justify-between items-center">
                    <a
                      href={getImageUrl(selectedProofPayment.confirmation.proof_file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'فتح الصورة بالحجم الكامل' : 'Open Full High-Res Image'}</span>
                    </a>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedProofPayment.confirmation.submitted_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Checklist & Linked Order Data */}
              <div className="space-y-4">
                
                {/* Linked Order Summary */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{locale === 'ar' ? 'الطلب المرتبط:' : 'Linked Order:'}</span>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      #{selectedProofPayment.order?.order_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{locale === 'ar' ? 'العميل:' : 'Customer:'}</span>
                    <span className="font-bold text-slate-800">
                      {selectedProofPayment.order?.customer?.first_name} {selectedProofPayment.order?.customer?.last_name || ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{locale === 'ar' ? 'المبلغ المطلوب سداده:' : 'Required Order Amount:'}</span>
                    <span className="font-black text-slate-900 text-sm">
                      {parseFloat(selectedProofPayment.order?.grand_total || selectedProofPayment.amount).toFixed(2)} SAR
                    </span>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-black text-amber-900 block uppercase tracking-wider">
                    {locale === 'ar' ? 'قائمة التدقيق والمطابقة:' : 'Auditor Verification Checklist:'}
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{locale === 'ar' ? 'اسم البنك:' : 'Bank Name:'}</strong> {selectedProofPayment.confirmation?.bank_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{locale === 'ar' ? 'رقم المرجع:' : 'Reference ID:'}</strong>{' '}
                        <code className="bg-white px-1.5 py-0.5 rounded font-mono text-emerald-700">
                          {selectedProofPayment.confirmation?.payment_reference}
                        </code>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{locale === 'ar' ? 'مبلغ الحوالة:' : 'Slip Amount:'}</strong>{' '}
                        {parseFloat(selectedProofPayment.amount).toFixed(2)} SAR (
                        {locale === 'ar' ? 'تطابق مع الفاتورة' : 'Matches Grand Total'}
                        )
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval & Rejection Direct Trigger */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleVerify(selectedProofPayment.id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-lime-300" />
                    <span>{locale === 'ar' ? 'اعتماد الإيصال وتأكيد الطلب' : 'Approve & Release Order'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setRejectingPayment(selectedProofPayment);
                      setRejectionReason('Invalid or fake reference number');
                    }}
                    disabled={actionLoading}
                    className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition-all border border-rose-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>{locale === 'ar' ? 'رفض الإيصال' : 'Reject Proof'}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Reject Payment Confirmation (Requirement 3) */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-black text-slate-900">
                  {locale === 'ar' ? 'رفض إيصال التحويل البنكي' : 'Reject Bank Payment'}
                </h3>
              </div>
              <button
                onClick={() => setRejectingPayment(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {locale === 'ar'
                ? `أنت على وشك رفض إيصال التحويل الخاص بالطلب #${rejectingPayment.order?.order_number}. سيتم تحديث حالة الطلب إلى (تم رفض الدفع) وإبلاغ العميل بالسبب لإعادة الإرسال.`
                : `You are rejecting the payment confirmation for order #${rejectingPayment.order?.order_number}. The order will be moved to PAYMENT_REJECTED.`}
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {locale === 'ar' ? 'اختر سبب الرفض المباشر:' : 'Select Rejection Reason:'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Invalid or fake reference number',
                  'Amount mismatch with order grand total',
                  'Unclear or illegible bank slip image',
                  'Funds not credited to bank account',
                  'Duplicate transaction submission',
                  'Other reason',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectionReason(chip)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
 rejectionReason === chip
 ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
 : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
 }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {locale === 'ar' ? 'ملاحظات وتوجيهات إضافية للعميل:' : 'Custom Explanation / Guidance for Customer:'}
              </label>
              <textarea
                rows={3}
                placeholder={locale === 'ar' ? 'أدخل تفاصيل إضافية لتوضيح سبب الرفض وكيفية تصحيحه...' : 'Provide clear details for the customer on why this was rejected...'}
                value={customRejectionNote}
                onChange={(e) => setCustomRejectionNote(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md"
              >
                {actionLoading ? 'Processing...' : (locale === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Refund Modal */}
      {refundingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-lg font-black text-slate-900">
                  {locale === 'ar' ? 'استرداد المبلغ وإلغاء الطلب' : 'Process Payment Refund'}
                </h3>
              </div>
              <button onClick={() => setRefundingPayment(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {locale === 'ar'
                ? `سيتم استرداد مبلغ ${refundingPayment.amount} SAR للطلب #${refundingPayment.order?.order_number}، وإعادة المنتجات إلى المخزون تلقائياً.`
                : `Refunding ${refundingPayment.amount} SAR for order #${refundingPayment.order?.order_number}. Products stock will be restored.`}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {locale === 'ar' ? 'سبب الاسترداد:' : 'Refund Reason:'}
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundingPayment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmRefund}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md"
              >
                {actionLoading ? 'Refunding...' : (locale === 'ar' ? 'تأكيد الاسترداد' : 'Execute Refund')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Payment & Order Reconciliation Drawer (Requirements 1, 4, 5) */}
      {inspectPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    {locale === 'ar' ? 'سجل التدقيق والتسوية المالية' : 'Payment & Order Audit Reconciliation'}
                  </h3>
                  {renderStatusBadge(inspectPayment.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  ID: {inspectPayment.id}
                </p>
              </div>

              <button
                onClick={() => setInspectPayment(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifecycle Stepper */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
                {locale === 'ar' ? 'مخطط تتبع حالة الدفع المباشر:' : 'Payment Lifecycle Progression:'}
              </span>
              {renderPaymentTracker(inspectPayment)}
            </div>

            {/* Financial Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block uppercase font-bold">{locale === 'ar' ? 'المبلغ المسدد:' : 'Payment Amount:'}</span>
                <span className="text-xl font-black text-[#05442e]">{parseFloat(inspectPayment.amount).toFixed(2)} SAR</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block uppercase font-bold">{locale === 'ar' ? 'طريقة الدفع:' : 'Method / Gateway:'}</span>
                <span className="text-sm font-black text-slate-800 block pt-1">{inspectPayment.payment_method} ({inspectPayment.payment_gateway || 'Direct'})</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block uppercase font-bold">{locale === 'ar' ? 'رقم المعاملة / المرجع:' : 'Transaction / Ref:'}</span>
                <span className="font-mono text-xs font-bold text-slate-800 block pt-1 break-all">
                  {inspectPayment.transaction_id || inspectPayment.confirmation?.payment_reference || 'N/A'}
                </span>
              </div>
            </div>

            {/* Linked Order & Customer Details (Requirement 5) */}
            {inspectPayment.order && (
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700" />
                    <span className="text-sm font-black text-slate-900">
                      {locale === 'ar' ? 'بيانات الطلب المرتبط:' : 'Linked Order Details:'} #{inspectPayment.order.order_number}
                    </span>
                  </div>
                  <Link
                    href={`/admin/orders?search=${inspectPayment.order.order_number}`}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>{locale === 'ar' ? 'فتح الطلب كاملاً' : 'Open in Orders'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">{locale === 'ar' ? 'العميل:' : 'Customer:'}</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {inspectPayment.order.customer?.first_name} {inspectPayment.order.customer?.last_name || ''}
                    </span>
                    <p className="text-slate-500 mt-0.5">{inspectPayment.order.customer?.email} | {inspectPayment.order.customer?.mobile}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block">{locale === 'ar' ? 'عنوان التوصيل:' : 'Delivery Address:'}</span>
                    <span className="font-semibold text-slate-700">
                      {inspectPayment.order.address?.city}, {inspectPayment.order.address?.area} - {inspectPayment.order.address?.address_line}
                    </span>
                  </div>
                </div>

                {/* Ordered Items Preview */}
                {inspectPayment.order.items && inspectPayment.order.items.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase">
                      {locale === 'ar' ? 'المنتجات المطلوبة:' : 'Ordered Items:'}
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {inspectPayment.order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                          <span className="font-bold text-slate-800">{item.product_name_en} x {item.quantity}</span>
                          <span className="font-mono font-bold text-slate-900">{parseFloat(item.total_price || item.unit_price * item.quantity).toFixed(2)} SAR</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status History Timeline (Requirement 4: Track Payment Status) */}
            {inspectPayment.order?.status_history && inspectPayment.order.status_history.length > 0 && (
              <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="text-xs font-black text-slate-900 block uppercase tracking-wider">
                  {locale === 'ar' ? 'سجل العمليات والتدقيق التاريخي (Audit Trail):' : 'Audit Trail & Status History:'}
                </span>
                <div className="space-y-3">
                  {inspectPayment.order.status_history.map((hist) => (
                    <div key={hist.id} className="border-l-2 border-emerald-500 pl-3 space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">{hist.to_status}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(hist.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{hist.notes || 'Status changed'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectPayment(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: Manual Bank Slip Recording (Requirement 2 & 5) */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center border border-lime-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {locale === 'ar' ? 'تسجيل إيصال تحويل بنكي' : 'Record Bank Payment Slip'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar' ? 'ربط إشعار تحويل وارد مع طلب معلق' : 'Attach an incoming bank receipt to an unpaid order'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowRecordModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRecordBankSlip} className="space-y-4">
              
              {/* Select Unpaid Order */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {locale === 'ar' ? 'اختر الطلب المراد ربطه بالتحويل:' : 'Select Target Order:'} *
                </label>
                <select
                  required
                  value={recordForm.orderId}
                  onChange={(e) => setRecordForm({ ...recordForm, orderId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#05442e]"
                >
                  <option value="">{locale === 'ar' ? '-- اختر الطلب --' : '-- Select Order --'}</option>
                  {unpaidOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.order_number} - {ord.customer?.first_name} ({ord.grand_total} SAR)
                    </option>
                  ))}
                </select>
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {locale === 'ar' ? 'اسم البنك المحوّل إليه / منه:' : 'Bank Name:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Rajhi Bank, SNB, Riyad Bank"
                  value={recordForm.bankName}
                  onChange={(e) => setRecordForm({ ...recordForm, bankName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              {/* Reference ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {locale === 'ar' ? 'رقم المرجع / العملية البنكية:' : 'Bank Reference / Txn Number:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARB-TXN-8829103"
                  value={recordForm.paymentReference}
                  onChange={(e) => setRecordForm({ ...recordForm, paymentReference: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              {/* Upload Proof Document */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {locale === 'ar' ? 'صورة إشعار التحويل البنكي (اختياري):' : 'Bank Receipt Slip Document (Optional):'}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setRecordForm({
                        ...recordForm,
                        proofFile: file,
                        proofPreview: URL.createObjectURL(file),
                      });
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                {recordForm.proofPreview && (
                  <div className="mt-2 h-24 w-36 rounded-xl border border-slate-200 overflow-hidden">
                    <img src={recordForm.proofPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Auto Verify Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={recordForm.autoVerify}
                    onChange={(e) => setRecordForm({ ...recordForm, autoVerify: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-black text-emerald-900 block">
                      {locale === 'ar' ? 'اعتماد فوري للدفع وتأكيد الطلب' : 'Auto-Approve & Release Order Immediately'}
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      {locale === 'ar'
                        ? 'تحديث حالة الطلب إلى (مؤكد) وجاهز للإسناد للسائق مباشرة'
                        : 'Sets status to PAID and updates order to CONFIRMED'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-black text-xs shadow-md"
                >
                  {actionLoading ? 'Saving...' : (locale === 'ar' ? 'حفظ وإدراج الإيصال' : 'Record Receipt')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
