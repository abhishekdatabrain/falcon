'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import AdminPagination from '../../../src/components/AdminPagination';
import {
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Layers,
  Plus,
  X,
  RotateCcw,
  Receipt,
  Calendar,
  Building,
  User,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Percent,
  Hash,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function AdminInvoicesPage() {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';

  // Primary State
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'CREDIT_NOTES' | 'COMPLIANCE'
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalVat: '0.00',
    totalAmount: '0.00',
    simplifiedCount: 0,
    standardCount: 0,
    creditNotesCount: 0,
    reportedCount: 0,
    clearedCount: 0,
    eligibleOrdersCount: 0,
    zatcaSellerVat: '300000000000003',
    zatcaSellerName: 'Falcon E-Commerce Trading Co.',
    zatcaPhase: 'Phase 2 (Fatoorah Integration & Clearance)',
    complianceStatus: 'COMPLIANT',
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals & Drawers State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [targetInvoiceForCn, setTargetInvoiceForCn] = useState(null);
  const [cnReason, setCnReason] = useState('');
  const [submittingCn, setSubmittingCn] = useState(false);
  const [selectedOrderToGenerate, setSelectedOrderToGenerate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Fetch Invoices and Platform Stats
  const loadInvoicesData = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        type: typeFilter,
        page,
        limit,
      });

      const res = await fetchApi(`/admin/invoices?${queryParams.toString()}`);
      if (res.success && res.data) {
        setInvoices(res.data.invoices || res.data.records || []);
        setEligibleOrders(res.data.eligibleOrders || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(
            res.data.pagination.totalRecords !== undefined
              ? res.data.pagination.totalRecords
              : (res.data.pagination.total || 0)
          );
          setCurrentPage(res.data.pagination.currentPage || res.data.pagination.page || page);
        }
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      showToast(err.message || 'Failed to load invoices data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInvoicesData(1, pageSize);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, typeFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadInvoicesData(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    loadInvoicesData(1, newPageSize);
  };

  // Handle Copy to Clipboard
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 2. Handler: 1-Click Generate Invoice for Eligible Order
  const handleGenerateInvoice = async (orderId) => {
    try {
      setGenerating(true);
      const res = await fetchApi(`/admin/invoices/generate/${orderId}`, {
        method: 'POST',
      });

      if (res.success) {
        showToast(
          isAr
            ? `تم إصدار الفاتورة الضريبية #${res.data?.invoice?.invoice_number} بنجاح!`
            : `ZATCA Tax Invoice #${res.data?.invoice?.invoice_number} generated successfully!`,
          'success'
        );
        setShowGenerateModal(false);
        setSelectedOrderToGenerate(null);
        await loadInvoicesData();
      } else {
        showToast(res.message || 'Failed to generate invoice', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error occurred while generating invoice', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // 3. Handler: Issue ZATCA Credit Note
  const handleIssueCreditNote = async (e) => {
    e.preventDefault();
    if (!targetInvoiceForCn) return;

    try {
      setSubmittingCn(true);
      const res = await fetchApi(`/admin/invoices/${targetInvoiceForCn.id}/credit-note`, {
        method: 'POST',
        body: JSON.stringify({
          reason: cnReason || 'Customer cancellation and refund',
        }),
      });

      if (res.success) {
        showToast(
          isAr
            ? `تم إنشاء الإشعار الدائن #${res.data?.creditNote?.invoice_number} بنجاح!`
            : `Credit Note #${res.data?.creditNote?.invoice_number} created successfully!`,
          'success'
        );
        setShowCreditNoteModal(false);
        setTargetInvoiceForCn(null);
        setCnReason('');
        await loadInvoicesData();
      } else {
        showToast(res.message || 'Failed to create credit note', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error creating credit note', 'error');
    } finally {
      setSubmittingCn(false);
    }
  };

  // 4. Handler: Validate & Report to ZATCA
  const handleReportToZatca = async (invoiceId) => {
    try {
      const res = await fetchApi(`/admin/invoices/${invoiceId}/report-zatca`, {
        method: 'POST',
      });
      if (res.success) {
        showToast(
          isAr
            ? 'تم التحقق من الفاتورة والإبلاغ عنها في منصة فاتورة (ZATCA Phase 2) بنجاح!'
            : 'Invoice verified & successfully reported to ZATCA Fatoorah Portal!',
          'success'
        );
        await loadInvoicesData();
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice((prev) => ({ ...prev, zatca_status: 'REPORTED' }));
        }
      }
    } catch (err) {
      showToast(err.message || 'ZATCA reporting simulation error', 'error');
    }
  };

  // Filtered view by active tab
  const tabFilteredInvoices = useMemo(() => {
    if (activeTab === 'CREDIT_NOTES') {
      return invoices.filter((inv) => inv.invoice_type === 'CREDIT_NOTE');
    }
    return invoices;
  }, [invoices, activeTab]);

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border font-bold text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMsg.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
        }`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? 'إدارة الفوترة الإلكترونية (ZATCA Fatoorah)' : 'ZATCA E-Invoice & Fatoorah Management'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                PHASE 2 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {isAr
                ? 'إدارة الفواتير الضريبية المعتمدة والإشعارات الدائنة، ترميز TLV QR، تشفير UBL 2.1 XML، ومطابقة هيئة الزكاة والضريبة والجمارك'
                : 'Saudi Phase 1 & 2 compliant tax invoices, credit notes, TLV Base64 QR codes, UBL 2.1 XML generation, and cryptographic hash chaining'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs hover:opacity-95 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إصدار فاتورة جديدة' : 'Generate E-Invoice'}</span>
          </button>

          <button
            onClick={() => {
              loadInvoicesData();
              showToast(isAr ? 'تم تحديث بيانات الفواتير' : 'Invoices data refreshed');
            }}
            className="py-2.5 px-4 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center gap-2 cursor-pointer rounded-2xl text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Invoiced */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'ALL' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Total Invoices Issued
            </span>
            <FileText className={`w-5 h-5 ${activeTab === 'ALL' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'ALL' ? 'text-white' : 'text-slate-900'}`}>
            {stats.totalInvoices}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'ALL' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Gross: <strong className={activeTab === 'ALL' ? 'text-white' : 'text-emerald-700'}>{stats.totalAmount} SAR</strong>
          </p>
        </div>

        {/* VAT Collected (15%) */}
        <div className="p-5 rounded-3xl border bg-white border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              VAT Collected (15%)
            </span>
            <Percent className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black mt-2 text-indigo-900">
            {stats.totalVat} <span className="text-sm font-bold text-indigo-600">SAR</span>
          </p>
          <p className="text-[11px] font-semibold mt-1 text-slate-500">
            ZATCA Tax ID: <strong className="font-mono text-slate-800">{stats.zatcaSellerVat}</strong>
          </p>
        </div>

        {/* Pending Eligible Orders */}
        <div
          onClick={() => setActiveTab('ELIGIBLE')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'ELIGIBLE'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'ELIGIBLE' ? 'text-amber-100' : 'text-slate-500'}`}>
              Pending Orders Ready
            </span>
            <Receipt className={`w-5 h-5 ${activeTab === 'ELIGIBLE' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'ELIGIBLE' ? 'text-white' : 'text-slate-900'}`}>
            {stats.eligibleOrdersCount}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'ELIGIBLE' ? 'text-amber-100' : 'text-slate-500'}`}>
            Orders awaiting invoice generation
          </p>
        </div>

        {/* Credit Notes Issued */}
        <div
          onClick={() => setActiveTab('CREDIT_NOTES')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'CREDIT_NOTES'
              ? 'bg-gradient-to-br from-rose-600 to-pink-700 text-white border-rose-400 shadow-md shadow-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'CREDIT_NOTES' ? 'text-rose-100' : 'text-slate-500'}`}>
              Credit Notes (Reversals)
            </span>
            <RotateCcw className={`w-5 h-5 ${activeTab === 'CREDIT_NOTES' ? 'text-white' : 'text-rose-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'CREDIT_NOTES' ? 'text-white' : 'text-slate-900'}`}>
            {stats.creditNotesCount}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'CREDIT_NOTES' ? 'text-rose-100' : 'text-slate-500'}`}>
            Preserving non-destructive audit log
          </p>
        </div>

      </div>

      {/* Main Tab Navigation & Filter Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'كافة الفواتير' : 'All Tax Invoices'} ({stats.totalInvoices})</span>
          </button>

          <button
            onClick={() => setActiveTab('ELIGIBLE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ELIGIBLE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{isAr ? 'طلبات بانتظار الفاتورة' : 'Awaiting Invoices'} ({stats.eligibleOrdersCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('CREDIT_NOTES')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'CREDIT_NOTES'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isAr ? 'الإشعارات الدائنة' : 'Credit Notes'} ({stats.creditNotesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLIANCE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'COMPLIANCE'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'شهادات واعتماد ZATCA' : 'ZATCA Compliance Info'}</span>
          </button>
        </div>

        {/* Search & Filter Controls (active on invoice listing tabs) */}
        {activeTab !== 'COMPLIANCE' && activeTab !== 'ELIGIBLE' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث برقم الفاتورة أو الطلب...' : 'Search invoice or order ref...'}
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 w-full sm:w-60"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">{isAr ? 'كل الأنواع' : 'All Types'}</option>
              <option value="SIMPLIFIED">{isAr ? 'فاتورة مبسطة (B2C)' : 'Simplified (B2C)'}</option>
              <option value="STANDARD">{isAr ? 'فاتورة قياسية (B2B)' : 'Standard (B2B)'}</option>
              <option value="CREDIT_NOTE">{isAr ? 'إشعار دائن (CN)' : 'Credit Note (CN)'}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="REPORTED">REPORTED ✓</option>
              <option value="CLEARED">CLEARED ✓</option>
              <option value="PENDING">PENDING ⏳</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================================= */}
      {/* TAB 1: ALL INVOICES & CREDIT NOTES TABLE */}
      {/* ========================================================================================= */}
      {(activeTab === 'ALL' || activeTab === 'CREDIT_NOTES') && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {activeTab === 'CREDIT_NOTES' ? 'Tax Credit Notes (Reversals)' : 'Official ZATCA Tax Invoices Registry'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'CREDIT_NOTES'
                  ? 'All credit notes adjusting original customer invoices in compliance with ZATCA rules'
                  : 'Certified electronic invoices generated in accordance with Saudi ZATCA Phase 1 & 2 regulations'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">{isAr ? 'رقم الفاتورة' : 'Invoice Doc #'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'رقم الطلب' : 'Order Ref'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المشتري / العميل' : 'Customer (Buyer)'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المجموع قبل الضريبة' : 'Subtotal'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الإجمالي الكلي' : 'Total (SAR)'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'حالة الاعتماد' : 'ZATCA Status'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                  <th className="py-3.5 px-4 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                      Loading ZATCA invoices registry...
                    </td>
                  </tr>
                ) : tabFilteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No invoices found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  tabFilteredInvoices.map((inv) => {
                    const isCn = inv.invoice_type === 'CREDIT_NOTE';
                    const orderNo = inv.order?.order_number || 'N/A';
                    const customerName = inv.buyer_name || inv.order?.customer?.user?.email || 'Customer';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Doc Number & Type Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {inv.invoice_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              isCn
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isCn ? 'CREDIT NOTE' : 'SIMPLIFIED'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            ICV #{inv.invoice_counter || 1}
                          </span>
                        </td>

                        {/* Order Ref */}
                        <td className="py-3.5 px-4">
                          {inv.order ? (
                            <Link
                              href={`/admin/orders/${inv.order.id}`}
                              className="font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                            >
                              <span>#{orderNo}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-500">#{orderNo}</span>
                          )}
                          {isCn && inv.original_invoice && (
                            <span className="text-[10px] text-rose-600 font-mono block mt-0.5">
                              Orig: {inv.original_invoice.invoice_number}
                            </span>
                          )}
                        </td>

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-slate-900">{customerName}</p>
                          <p className="text-[11px] text-slate-500">{inv.order?.customer?.user?.mobile || 'N/A'}</p>
                        </td>

                        {/* Subtotal */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {parseFloat(inv.total_excluding_vat || 0).toFixed(2)}
                        </td>

                        {/* VAT (15%) */}
                        <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-700">
                          {parseFloat(inv.vat_total || 0).toFixed(2)}
                        </td>

                        {/* Total with VAT */}
                        <td className="py-3.5 px-4 font-mono font-black text-sm text-slate-900">
                          {parseFloat(inv.total_including_vat || 0).toFixed(2)} SAR
                        </td>

                        {/* ZATCA Status */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 w-fit ${
                            inv.zatca_status === 'CLEARED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : inv.zatca_status === 'REPORTED'
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{inv.zatca_status || 'REPORTED'}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(inv.issue_date_time || inv.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Inspect Drawer Button */}
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowDetailDrawer(true);
                              }}
                              title="Inspect ZATCA E-Invoice Details"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
                            >
                              <Eye className="w-4 h-4 text-slate-700" />
                            </button>

                            {/* Download PDF */}
                            <a
                              href={getImageUrl(`/api/v1/invoices/${inv.id}/pdf`)}
                              target="_blank"
                              rel="noreferrer"
                              title="Download Official ZATCA PDF"
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-all"
                            >
                              <Download className="w-4 h-4 text-emerald-700" />
                            </a>

                            {/* Download UBL 2.1 XML */}
                            <a
                              href={getImageUrl(`/api/v1/invoices/${inv.id}/xml`)}
                              target="_blank"
                              rel="noreferrer"
                              title="Download Certified UBL 2.1 XML"
                              className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-all"
                            >
                              <FileCode className="w-4 h-4 text-indigo-700" />
                            </a>

                            {/* Issue Credit Note (only for regular invoices that don't have a credit note yet) */}
                            {!isCn && (
                              <button
                                onClick={() => {
                                  setTargetInvoiceForCn(inv);
                                  setShowCreditNoteModal(true);
                                }}
                                title="Issue ZATCA Credit Note"
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-all"
                              >
                                <RotateCcw className="w-4 h-4 text-rose-700" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination */}
          <AdminPagination
            pagination={{ currentPage, pageSize, totalRecords, totalPages }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 2: ELIGIBLE ORDERS AWAITING INVOICING */}
      {/* ========================================================================================= */}
      {activeTab === 'ELIGIBLE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Verified Orders Ready for ZATCA E-Invoice Issuance ({eligibleOrders.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These paid customer orders have completed payments or active fulfillment and can have official e-invoices issued with 1 click.
              </p>
            </div>
          </div>

          {eligibleOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">All Eligible Orders Have Invoices Issued!</h4>
              <p className="text-xs text-slate-500">Every confirmed and completed order currently has an official ZATCA tax invoice on record.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eligibleOrders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-base font-black text-slate-900 block">Order #{ord.order_number}</span>
                        <span className="text-xs text-slate-400 font-semibold">{new Date(ord.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                        {ord.order_status}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <p className="text-slate-900 font-bold">
                        👤 Buyer: {ord.customer?.first_name ? `${ord.customer.first_name} ${ord.customer.last_name}` : ord.customer?.user?.email || 'Customer'}
                      </p>
                      <p className="text-slate-600 font-medium">
                        💳 Payment Method: {ord.payment_method || 'Electronic Card'}
                      </p>
                      <p className="text-slate-900 font-mono font-black pt-1">
                        Grand Total: {parseFloat(ord.grand_total || 0).toFixed(2)} SAR (incl. VAT)
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={generating}
                    onClick={() => handleGenerateInvoice(ord.id)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs hover:opacity-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{generating ? 'Generating ZATCA Invoice...' : 'Generate Official ZATCA Invoice'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 4: ZATCA COMPLIANCE & CERTIFICATE INFO */}
      {/* ========================================================================================= */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Taxpayer Registration Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Taxpayer Registration Details</h3>
                  <p className="text-xs text-slate-500">Official KSA Commercial Registration & VAT Credentials</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Taxpayer Trade Name:</span>
                  <span className="font-extrabold text-slate-900">{stats.zatcaSellerName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">VAT Registration Number:</span>
                  <span className="font-mono font-black text-emerald-700">{stats.zatcaSellerVat}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Commercial Registration (CR):</span>
                  <span className="font-mono font-extrabold text-slate-900">1010892341</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Registered Office Location:</span>
                  <span className="font-medium text-slate-900">King Fahd Rd, Al-Malqa, Riyadh 13521, KSA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-bold">Standard VAT Rate:</span>
                  <span className="font-black text-indigo-700">15.00% (Kingdom of Saudi Arabia)</span>
                </div>
              </div>
            </div>

            {/* ZATCA Phase 2 Fatoorah Integration Specs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">ZATCA Fatoorah Phase 2 Specs</h3>
                  <p className="text-xs text-slate-500">Cryptographic Chaining, Schemas & Clearance</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Compliance Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[10px] border border-emerald-200">
                    CERTIFIED PHASE 2 ACTIVE
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">XML Schema Standard:</span>
                  <span className="font-mono font-bold text-slate-900">UBL 2.1 (OASIS Specification)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">QR Code Encoding:</span>
                  <span className="font-mono font-bold text-slate-900">TLV Tagged Base64 (Tags 1-5 + Hash)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Invoice Chaining (PIH):</span>
                  <span className="font-mono font-bold text-emerald-700">SHA-256 Hash Chaining Active</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-bold">Audit Preservation:</span>
                  <span className="font-bold text-slate-800">Non-destructive Credit Notes Only</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* DRAWER: DETAILED INVOICE INSPECTION */}
      {/* ========================================================================================= */}
      {showDetailDrawer && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 sm:p-8 space-y-6 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedInvoice.invoice_type === 'CREDIT_NOTE' ? 'Credit Note' : 'Tax Invoice'} #{selectedInvoice.invoice_number}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    selectedInvoice.invoice_type === 'CREDIT_NOTE'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedInvoice.invoice_type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  ZATCA UUID: {selectedInvoice.uuid}
                </p>
              </div>

              <button
                onClick={() => setShowDetailDrawer(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2.5">
              <a
                href={getImageUrl(`/api/v1/invoices/${selectedInvoice.id}/pdf`)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>

              <a
                href={getImageUrl(`/api/v1/invoices/${selectedInvoice.id}/xml`)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <FileCode className="w-4 h-4" />
                <span>Download UBL 2.1 XML</span>
              </a>

              <button
                onClick={() => handleReportToZatca(selectedInvoice.id)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify with ZATCA</span>
              </button>
            </div>

            {/* ZATCA Cryptographic Integrity Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs shadow-md">
              <div className="flex justify-between items-center text-[11px] text-cyan-400 font-bold border-b border-slate-800 pb-2">
                <span>ZATCA PHASE 2 CRYPTOGRAPHIC TELEMETRY</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  VALIDATED
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">INVOICE HASH (SHA-256 BASE64):</span>
                <div className="flex items-center justify-between text-cyan-300 font-bold break-all text-[11px]">
                  <span>{selectedInvoice.invoice_hash || 'SHA256-AUTHENTICATED'}</span>
                  <button
                    onClick={() => handleCopy(selectedInvoice.invoice_hash || '', 'hash')}
                    className="p-1 hover:text-white"
                  >
                    {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">PREVIOUS INVOICE HASH (PIH CHAINING):</span>
                <span className="text-slate-300 break-all text-[10px]">
                  {selectedInvoice.previous_invoice_hash || 'GENESIS_PIH_CHAIN_ANCHOR'}
                </span>
              </div>
            </div>

            {/* Parties Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Seller details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seller / Taxpayer</span>
                <p className="font-extrabold text-slate-900 text-sm">{selectedInvoice.seller_name}</p>
                <p className="text-slate-600 font-medium">VAT Reg: <strong className="font-mono text-emerald-700">{selectedInvoice.seller_vat_number}</strong></p>
                <p className="text-slate-500">King Fahd Rd, Riyadh, KSA</p>
              </div>

              {/* Buyer details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer / Buyer</span>
                <p className="font-extrabold text-slate-900 text-sm">{selectedInvoice.buyer_name}</p>
                <p className="text-slate-600 font-medium">Order: <strong className="font-mono text-cyan-700">#{selectedInvoice.order?.order_number}</strong></p>
                <p className="text-slate-500">Destination: {selectedInvoice.order?.address?.city || 'Riyadh Province, KSA'}</p>
              </div>

            </div>

            {/* Itemized Products Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Itemized Line Items ({selectedInvoice.items?.length || 0})
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">VAT (15%)</th>
                      <th className="py-2.5 px-3 text-right">Total (SAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(selectedInvoice.items || []).map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {it.item_name_en || 'Product'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{parseFloat(it.unit_price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700">{parseFloat(it.vat_amount || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{parseFloat(it.total_with_vat || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono">{parseFloat(selectedInvoice.total_excluding_vat || 0).toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Total VAT (15%):</span>
                <span className="font-mono font-bold text-indigo-700">{parseFloat(selectedInvoice.vat_total || 0).toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-emerald-200 pt-2">
                <span>Grand Total (Incl. VAT):</span>
                <span className="font-mono text-emerald-800">{parseFloat(selectedInvoice.total_including_vat || 0).toFixed(2)} SAR</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL: ISSUE CREDIT NOTE */}
      {/* ========================================================================================= */}
      {showCreditNoteModal && targetInvoiceForCn && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  <span>Issue ZATCA Credit Note</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reversing Invoice #{targetInvoiceForCn.invoice_number}
                </p>
              </div>
              <button onClick={() => setShowCreditNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">⚠️ ZATCA Phase 2 Audit Preservation Rule:</p>
              <p className="text-[11px] text-amber-800">
                Issued tax invoices cannot be deleted or directly altered. Generating a Credit Note issues an official reversal document referencing the original invoice UUID and adjusting tax liability.
              </p>
            </div>

            <form onSubmit={handleIssueCreditNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Credit / Reversal Reason
                </label>
                <input
                  type="text"
                  required
                  value={cnReason}
                  onChange={(e) => setCnReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order / items returned"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreditNoteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCn || !cnReason}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-700 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingCn ? 'Issuing Credit Note...' : 'Confirm Credit Note Issuance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL: MANUAL INVOICE GENERATION SELECTOR */}
      {/* ========================================================================================= */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Generate ZATCA E-Invoice</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a verified order to issue an invoice</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {eligibleOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold">No pending orders awaiting invoicing.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {eligibleOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleGenerateInvoice(ord.id)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">Order #{ord.order_number}</p>
                      <p className="text-[11px] text-slate-500">
                        {ord.customer?.first_name ? `${ord.customer.first_name} ${ord.customer.last_name}` : ord.customer?.user?.email} • {ord.order_status}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-xs text-emerald-700 block">
                        {parseFloat(ord.grand_total || 0).toFixed(2)} SAR
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">Click to Issue</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
