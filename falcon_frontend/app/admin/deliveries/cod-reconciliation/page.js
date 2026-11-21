'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { useToast } from '../../../../src/contexts/ToastContext';
import { useAuth } from '../../../../src/contexts/AuthContext';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Search,
  User,
  Truck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  Phone,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  CheckSquare,
  Square,
  DollarSign
} from 'lucide-react';

export default function AdminCodReconciliationPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'SETTLED'
  const [data, setData] = useState({ summary: {}, drivers: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDrivers, setExpandedDrivers] = useState({});

  // Selection state: strictly per driver { driverId: Set([orderId1, orderId2]) }
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

  // Settlement Confirmation Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalDriver, setModalDriver] = useState(null);
  const [modalExpectedAmount, setModalExpectedAmount] = useState(0);
  const [modalReceivedAmount, setModalReceivedAmount] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [submittingSettlement, setSubmittingSettlement] = useState(false);
  const [settlementSuccessResult, setSettlementSuccessResult] = useState(null);

  // Load reconciliation data
  const loadReconciliation = async (tab = activeTab) => {
    try {
      setLoading(true);
      const res = await fetchApi(`/admin/cod-reconciliation?tab=${tab}`);
      if (res.success && res.data) {
        setData(res.data);
        // Expand all driver cards by default
        const initExpanded = {};
        (res.data.drivers || []).forEach((d) => {
          initExpanded[d.driverId] = true;
        });
        setExpandedDrivers(initExpanded);
      } else {
        showToast(res.message || 'Failed to load reconciliation data', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error fetching COD reconciliation', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliation(activeTab);
    // Clear selection on tab switch
    setSelectedDriverId(null);
    setSelectedOrderIds(new Set());
  }, [activeTab]);

  // Toggle order checkbox
  const toggleOrderSelection = (driverId, orderId) => {
    // If a different driver was selected, reset selection to this driver (prevent mixing drivers)
    if (selectedDriverId && selectedDriverId !== driverId) {
      setSelectedDriverId(driverId);
      setSelectedOrderIds(new Set([orderId]));
      return;
    }

    setSelectedDriverId(driverId);
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      if (next.size === 0) {
        setSelectedDriverId(null);
      }
      return next;
    });
  };

  // Toggle select all orders for a driver
  const toggleSelectAllForDriver = (driver) => {
    if (selectedDriverId === driver.driverId && selectedOrderIds.size === driver.orders.length) {
      // Deselect all
      setSelectedDriverId(null);
      setSelectedOrderIds(new Set());
    } else {
      // Select all for this driver only
      setSelectedDriverId(driver.driverId);
      setSelectedOrderIds(new Set(driver.orders.map((o) => o.orderId)));
    }
  };

  // Calculate dynamic total of selected orders
  const selectedTotalAmount = useMemo(() => {
    if (!selectedDriverId || selectedOrderIds.size === 0) return 0;
    const driver = data.drivers?.find((d) => d.driverId === selectedDriverId);
    if (!driver) return 0;

    let total = 0;
    driver.orders.forEach((ord) => {
      if (selectedOrderIds.has(ord.orderId)) {
        total += parseFloat(ord.grand_total || ord.codAmountCollected || 0);
      }
    });
    return Math.round(total * 100) / 100;
  }, [selectedDriverId, selectedOrderIds, data]);

  // Open Bulk Confirmation Modal
  const openConfirmationModal = (driver) => {
    if (selectedOrderIds.size === 0) {
      showToast(
        locale === 'ar'
          ? 'يرجى تحديد طلب واحد على الأقل لتأكيد استلام النقد'
          : 'Please select at least one delivered COD order to confirm cash receipt',
        'warning'
      );
      return;
    }

    setModalDriver(driver);
    setModalExpectedAmount(selectedTotalAmount);
    setModalReceivedAmount(selectedTotalAmount.toFixed(2));
    setModalNotes('');
    setConfirmModalOpen(true);
  };

  // Submit Settlement to Backend
  const handleConfirmSettlement = async (e) => {
    if (e) e.preventDefault();
    if (!modalDriver || selectedOrderIds.size === 0) return;

    const receivedNum = parseFloat(modalReceivedAmount);
    if (isNaN(receivedNum) || receivedNum <= 0) {
      showToast(locale === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid received amount', 'error');
      return;
    }

    if (Math.abs(receivedNum - modalExpectedAmount) > 0.01) {
      showToast(
        locale === 'ar'
          ? `المبلغ المدخل (${receivedNum.toFixed(2)} ر.س) لا يطابق إجمالي الطلبات المحددة (${modalExpectedAmount.toFixed(2)} ر.س)`
          : `Received amount (SAR ${receivedNum.toFixed(2)}) must match expected total (SAR ${modalExpectedAmount.toFixed(2)}) exactly.`,
        'error'
      );
      return;
    }

    try {
      setSubmittingSettlement(true);
      const res = await fetchApi('/admin/cod-reconciliation/confirm', {
        method: 'POST',
        body: JSON.stringify({
          driverId: modalDriver.driverId,
          orderIds: Array.from(selectedOrderIds),
          receivedAmount: receivedNum,
          notes: modalNotes.trim() || undefined,
        }),
      });

      if (res.success && res.data) {
        setSettlementSuccessResult(res.data);
        showToast(
          locale === 'ar'
            ? `تم تأكيد استلام النقد وتسوية الطلبات بنجاح! رقم المرجع: ${res.data.handoverReference}`
            : `Cash received & settled successfully! Handover Ref: ${res.data.handoverReference}`,
          'success'
        );
        setConfirmModalOpen(false);
        setSelectedDriverId(null);
        setSelectedOrderIds(new Set());
        loadReconciliation(activeTab);
      } else {
        showToast(res.message || 'Settlement failed. Please verify amounts.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error executing settlement transaction', 'error');
    } finally {
      setSubmittingSettlement(false);
    }
  };

  // Filtered drivers based on search
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return data.drivers || [];
    const q = searchQuery.toLowerCase();
    return (data.drivers || []).filter((d) => {
      const matchName = d.driverName?.toLowerCase().includes(q);
      const matchEmail = d.driverEmail?.toLowerCase().includes(q);
      const matchMobile = d.driverMobile?.toLowerCase().includes(q);
      const matchOrder = d.orders?.some(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerMobile?.toLowerCase().includes(q)
      );
      return matchName || matchEmail || matchMobile || matchOrder;
    });
  }, [data.drivers, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>{locale === 'ar' ? 'الأسطول والمالية' : 'Fleet & Delivery Operations'}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-semibold">{locale === 'ar' ? 'التسوية النقدية' : 'COD Reconciliation'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {locale === 'ar' ? 'تسوية مبالغ الدفع عند الاستلام (COD)' : 'COD Cash Reconciliation'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {locale === 'ar'
              ? 'متابعة وتأكيد استلام مبالغ الطلبات المسلمة نقداً من السائقين وتحديث حالة الدفع إلى مدفوع (PAID).'
              : 'Reconcile and confirm physical cash collections from delivery drivers for delivered COD orders.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadReconciliation(activeTab)}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Drivers with Pending Cash */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {locale === 'ar' ? 'السائقون مع نقد معلق' : 'Drivers with Pending Cash'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {data.summary?.totalDriversWithPendingCash || 0}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold block">
            {locale === 'ar' ? 'سائق لديهم مبالغ قيد التوريد' : 'Drivers holding collected cash'}
          </span>
        </div>

        {/* Metric 2: Orders Awaiting Confirmation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {locale === 'ar' ? 'الطلبات بانتظار التأكيد' : 'Orders Awaiting Confirmation'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">
            {data.summary?.totalOrdersAwaitingConfirmation || 0}
          </p>
          <span className="text-[11px] text-amber-700 font-semibold block">
            {locale === 'ar' ? 'طلبات COD مسلمة ومعلقة الدفع' : 'Delivered COD orders pending cash audit'}
          </span>
        </div>

        {/* Metric 3: Total Cash Awaiting Confirmation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {locale === 'ar' ? 'إجمالي النقد بانتظار التأكيد' : 'Total Cash Awaiting Confirmation'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700">
            {parseFloat(data.summary?.totalCashAwaitingConfirmation || 0).toFixed(2)}{' '}
            <span className="text-sm font-bold text-emerald-900">SAR</span>
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            {locale === 'ar' ? 'نقد فعلي مطلوب استلامه من السائقين' : 'Cash to be received and verified'}
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{locale === 'ar' ? 'بانتظار تأكيد الإدارة' : 'Awaiting Cash Confirmation'}</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
              {data.summary?.totalOrdersAwaitingConfirmation || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SETTLED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SETTLED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{locale === 'ar' ? 'سجل التسويات المكتملة' : 'Settled History'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={locale === 'ar' ? 'البحث عن سائق، طلب، عميل...' : 'Search driver, order #, customer...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-emerald-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Driver-wise Accordions / Cards */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">
            {locale === 'ar' ? 'جاري تحميل سجلات التسوية النقدية...' : 'Loading COD reconciliation records...'}
          </p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            {activeTab === 'PENDING'
              ? (locale === 'ar' ? 'لا توجد مبالغ نقدية معلقة للتسوية' : 'No Pending COD Collections')
              : (locale === 'ar' ? 'لا توجد تسويات سابقة' : 'No Settled History Found')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? (locale === 'ar'
                ? 'جميع طلبات الدفع عند الاستلام المسلمة تمت تسويتها وتأكيد استلام مبالغها في الخزينة.'
                : 'All delivered Cash on Delivery orders have been verified and reconciled with the admin.')
              : (locale === 'ar' ? 'ستظهر سجلات التسويات هنا بعد تأكيد استلام النقد من السائقين.' : 'Confirmed driver handovers will appear in this history list.')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDrivers.map((driver) => {
            const isExpanded = expandedDrivers[driver.driverId] ?? true;
            const isThisDriverSelected = selectedDriverId === driver.driverId;
            const selectedCountForThisDriver = isThisDriverSelected ? selectedOrderIds.size : 0;
            const allSelectedForThisDriver =
              isThisDriverSelected && selectedOrderIds.size === driver.orders.length;

            return (
              <div
                key={driver.driverId}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Driver Card Header */}
                <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#006E2D]/10 text-[#006E2D] border border-[#006E2D]/20 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-slate-900">{driver.driverName}</h2>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200/70 text-slate-700">
                          ID: {driver.driverId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                        {driver.driverMobile && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {driver.driverMobile}
                          </span>
                        )}
                        {driver.driverEmail && (
                          <span>• {driver.driverEmail}</span>
                        )}
                        {driver.vehicleDetails && (
                          <span>• {driver.vehicleDetails}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Driver Stats & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left sm:text-right px-3 py-1.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        {locale === 'ar' ? 'الطلبات المعلقة' : 'Pending Orders'}
                      </span>
                      <strong className="text-sm font-black text-amber-950 font-mono">
                        {driver.pendingCount} {locale === 'ar' ? 'طلب' : 'orders'}
                      </strong>
                    </div>

                    <div className="text-left sm:text-right px-3 py-1.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        {locale === 'ar' ? 'إجمالي النقد المحصل' : 'Total Cash Collected'}
                      </span>
                      <strong className="text-sm font-black text-emerald-950 font-mono">
                        SAR {parseFloat(driver.totalCashCollected || 0).toFixed(2)}
                      </strong>
                    </div>

                    {/* Toggle Accordion */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDrivers((prev) => ({
                          ...prev,
                          [driver.driverId]: !isExpanded,
                        }))
                      }
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Driver Orders Table */}
                {isExpanded && (
                  <div>
                    {/* Multi-selection Toolbar for Pending Tab */}
                    {activeTab === 'PENDING' && (
                      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectAllForDriver(driver)}
                            className="flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                          >
                            {allSelectedForThisDriver ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                            <span>
                              {allSelectedForThisDriver
                                ? (locale === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All')
                                : (locale === 'ar' ? 'تحديد جميع طلبات هذا السائق' : `Select All for ${driver.driverName}`)}
                            </span>
                          </button>

                          {selectedCountForThisDriver > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
                              {selectedCountForThisDriver} {locale === 'ar' ? 'محدد' : 'selected'}
                            </span>
                          )}
                        </div>

                        {/* Bulk Action Button for this Driver */}
                        {selectedCountForThisDriver > 0 && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-600">
                              {locale === 'ar' ? 'المجموع المحدد:' : 'Selected Total:'}{' '}
                              <strong className="text-emerald-700 font-mono text-sm">
                                SAR {selectedTotalAmount.toFixed(2)}
                              </strong>
                            </span>

                            <button
                              type="button"
                              onClick={() => openConfirmationModal(driver)}
                              className="px-4 py-2 rounded-xl bg-[#006E2D] hover:bg-[#048b53] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>
                                {locale === 'ar'
                                  ? 'تأكيد استلام النقد وتحديث الطلبات لمدفوعة'
                                  : 'Confirm Cash Received & Mark Selected Orders Paid'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {activeTab === 'PENDING' && (
                              <th className="px-4 py-3 w-10 text-center">#</th>
                            )}
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'رقم الطلب' : 'Order ID'}
                            </th>
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'العميل' : 'Customer Name'}
                            </th>
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'تاريخ التوصيل' : 'Delivery Date'}
                            </th>
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'مبلغ الطلب' : 'COD Amount'}
                            </th>
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'المبلغ المحصل' : 'Driver Collected'}
                            </th>
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'حالة الدفع' : 'Payment Status'}
                            </th>
                            <th className="px-5 py-3">
                              {locale === 'ar' ? 'حالة التسوية' : 'Cash Status'}
                            </th>
                            {activeTab === 'SETTLED' && (
                              <th className="px-5 py-3">
                                {locale === 'ar' ? 'رقم المرجع' : 'Handover Ref'}
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {driver.orders.map((ord) => {
                            const isSelected =
                              isThisDriverSelected && selectedOrderIds.has(ord.orderId);

                            return (
                              <tr
                                key={ord.orderId}
                                className={`transition-all hover:bg-slate-50/80 ${
                                  isSelected ? 'bg-emerald-50/40' : ''
                                }`}
                              >
                                {activeTab === 'PENDING' && (
                                  <td className="px-4 py-3.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleOrderSelection(driver.driverId, ord.orderId)
                                      }
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                )}

                                {/* Order ID */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="font-mono font-bold text-slate-900">
                                    #{ord.orderNumber}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {ord.itemCount} items
                                  </span>
                                </td>

                                {/* Customer Name & Mobile */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="font-bold text-slate-900">{ord.customerName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {ord.customerMobile || ord.customerEmail || '—'}
                                  </div>
                                </td>

                                {/* Delivery Date */}
                                <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                                  <div>
                                    {new Date(ord.deliveryDate).toLocaleDateString()}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {new Date(ord.deliveryDate).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </td>

                                {/* COD Amount */}
                                <td className="px-5 py-3.5 whitespace-nowrap font-mono font-black text-slate-900">
                                  SAR {parseFloat(ord.grandTotal || 0).toFixed(2)}
                                </td>

                                {/* Driver Collected Amount */}
                                <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-emerald-700">
                                  SAR {parseFloat(ord.codAmountCollected || ord.grandTotal).toFixed(2)}
                                </td>

                                {/* Payment Status */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  {ord.paymentStatus === 'PAID' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      ✓ PAID
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      PENDING
                                    </span>
                                  )}
                                </td>

                                {/* Cash Reconciliation Status */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  {ord.cashHandoverStatus === 'SETTLED' ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                      SETTLED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                      Awaiting Admin Confirmation
                                    </span>
                                  )}
                                </td>

                                {/* Handover Reference (Settled tab) */}
                                {activeTab === 'SETTLED' && (
                                  <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-slate-600">
                                    {ord.handoverReference || '—'}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL (No native window.confirm) */}
      {confirmModalOpen && modalDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative overflow-hidden space-y-6">
            {/* Top decorative stripe */}
            <div className="h-1.5 bg-gradient-to-r from-[#006E2D] to-emerald-400" />

            {/* Modal Header */}
            <div className="px-6 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006E2D] border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'تأكيد استلام النقد والتسوية' : 'Confirm Cash Handover'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar'
                      ? 'مراجعة وتأكيد استلام النقد الفعلي من السائق وتحديث الطلبات لـ PAID'
                      : 'Audit physical cash receipt from driver and mark orders as PAID.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSettlement} className="px-6 space-y-4">
              {/* Summary Cards */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">{locale === 'ar' ? 'السائق المسئول:' : 'Assigned Driver:'}</span>
                  <div className="text-right">
                    <strong className="text-slate-900 block font-bold">{modalDriver.driverName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {modalDriver.driverId.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">{locale === 'ar' ? 'عدد الطلبات المحددة:' : 'Selected Orders Count:'}</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    {selectedOrderIds.size} {locale === 'ar' ? 'طلبات' : 'orders'}
                  </strong>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">{locale === 'ar' ? 'المبلغ المتوقع تحصيله:' : 'Total Amount Expected:'}</span>
                  <strong className="text-base font-black text-slate-900 font-mono">
                    SAR {modalExpectedAmount.toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Exact Cash Received Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'المبلغ المستلم فعلياً في الخزينة (ر.س) *' : 'Actual Cash Amount Received (SAR) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">
                    SAR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modalReceivedAmount}
                    onChange={(e) => setModalReceivedAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-black text-sm focus:outline-emerald-600"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {locale === 'ar'
                    ? 'يجب أن يطابق المبلغ المستلم إجمالي الطلبات تماماً لمنع حدوث فروقات نقدية.'
                    : 'Amount must match the total expected cash exactly to prevent accounting mismatch.'}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'ملاحظات التسوية والخزينة (اختياري)' : 'Handover Reference Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: تم الاستلام نقداً في خزينة المستودع الرئيسي' : 'e.g. Received at Central Warehouse Cash Desk'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-emerald-600"
                />
              </div>

              {/* Immutable Audit Trail Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{locale === 'ar' ? 'سجل تدقيق مالي غير قابل للتعديل' : 'Tamper-Proof Audit Trail'}</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {locale === 'ar'
                    ? 'هذا الإجراء سيقوم بتسجيل المعاملة برقم مرجعي فريد وتحديث حالة الدفع لجميع الطلبات المحددة إلى مدفوعة (PAID).'
                    : 'This action will generate a unique Handover Reference, update payment status to PAID, and log an immutable entry in AuditLog.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 pb-6">
                <button
                  type="button"
                  disabled={submittingSettlement}
                  onClick={() => setConfirmModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submittingSettlement}
                  className="px-5 py-2.5 rounded-xl bg-[#006E2D] hover:bg-[#048b53] text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {submittingSettlement ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {locale === 'ar'
                          ? 'تأكيد الاستلام وتسوية الطلبات'
                          : 'Confirm Cash & Settle Orders'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
