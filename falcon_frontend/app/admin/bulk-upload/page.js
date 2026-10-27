'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi } from '../../../src/services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  FolderTree,
  ShoppingBag,
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  FileText,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronRight,
  Info,
  Check,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import AdminPagination from '../../../src/components/AdminPagination';

export default function BulkUploadPage({ initialTab = 'products' }) {
  const searchParams = useSearchParams();
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(paramTab || initialTab); // 'categories', 'products', 'history'

  const { locale } = useLanguage();
  const { showToast } = useToast();

  // Mode and strategy states
  const [importMode, setImportMode] = useState('UPSERT'); // 'UPSERT', 'CREATE_ONLY', 'UPDATE_ONLY'
  const [errorHandling, setErrorHandling] = useState('SKIP_INVALID'); // 'SKIP_INVALID', 'ALL_OR_NOTHING'

  // File states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Validation states
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [previewFilter, setPreviewFilter] = useState('ALL'); // 'ALL', 'ERROR', 'WARNING', 'VALID'
  const [previewSearch, setPreviewSearch] = useState('');

  // Import execution states
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // History Tab states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalRecords, setHistoryTotalRecords] = useState(0);
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [selectedHistoryModal, setSelectedHistoryModal] = useState(null);

  // Sync tab with URL if changed
  useEffect(() => {
    if (paramTab && ['categories', 'products', 'history'].includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  // Reset file/validation when switching between Category and Product tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setPreviewFilter('ALL');
    setPreviewSearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (tab === 'history') {
      loadHistory();
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      showToast('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file', 'error');
      return;
    }
    setSelectedFile(file);
    setValidationResult(null);
    setImportResult(null);
  };

  // Download sample templates
  const handleDownloadTemplate = (type, format = 'xlsx') => {
    const endpoint = `/admin/bulk-upload/${type}-template?format=${format}`;
    const cleanApiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace(/\/$/, '');
    const url = `${cleanApiBase}${endpoint}`;
    window.open(url, '_blank');
  };

  // Validate uploaded file
  const handleValidate = async () => {
    if (!selectedFile) {
      showToast('Please select a file first', 'error');
      return;
    }
    try {
      setValidating(true);
      setValidationResult(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('importType', activeTab === 'categories' ? 'CATEGORY' : 'PRODUCT');
      formData.append('importMode', importMode);

      const res = await fetchApi('/admin/bulk-upload/validate', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data) {
        setValidationResult(res.data);
        if (res.data.errorCount === 0) {
          showToast(`File validated! ${res.data.validCount} valid records ready to import.`, 'success');
        } else {
          showToast(`Validation finished with ${res.data.errorCount} error(s). Please review below.`, 'error');
        }
      } else {
        throw new Error(res.message || 'Validation failed');
      }
    } catch (err) {
      showToast(err.message || 'Validation failed', 'error');
    } finally {
      setValidating(false);
    }
  };

  // Execute database import
  const handleImport = async () => {
    if (!selectedFile) {
      showToast('Please upload a file', 'error');
      return;
    }

    if (errorHandling === 'ALL_OR_NOTHING' && validationResult && validationResult.errorCount > 0) {
      showToast('Cannot proceed in All-or-Nothing mode while errors exist. Fix errors or switch to "Skip Invalid Rows".', 'error');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('importType', activeTab === 'categories' ? 'CATEGORY' : 'PRODUCT');
      formData.append('importMode', importMode);
      formData.append('errorHandling', errorHandling);

      const res = await fetchApi('/admin/bulk-upload/import', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        showToast(
          `Import finished! Successfully imported ${res.data.successCount} item(s).`,
          res.data.failedCount > 0 ? 'info' : 'success'
        );
      } else {
        throw new Error(res.message || 'Import failed');
      }
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Load History
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      params.append('page', historyPage);
      params.append('limit', 10);
      if (historyTypeFilter !== 'ALL') params.append('importType', historyTypeFilter);
      if (historyStatusFilter !== 'ALL') params.append('status', historyStatusFilter);

      const res = await fetchApi(`/admin/bulk-upload/history?${params.toString()}`);
      if (res.success && res.data) {
        setHistoryRecords(res.data.records || []);
        if (res.data.pagination) {
          setHistoryTotalPages(res.data.pagination.totalPages || 1);
          setHistoryTotalRecords(res.data.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      showToast('Failed to load import history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyPage, historyTypeFilter, historyStatusFilter]);

  // Download Error Report CSV
  const handleDownloadErrors = (historyId) => {
    const cleanApiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace(/\/$/, '');
    const url = `${cleanApiBase}/admin/bulk-upload/history/${historyId}/errors`;
    window.open(url, '_blank');
  };

  // Filter preview rows
  const filteredPreviewRows = (validationResult?.previewRows || []).filter((row) => {
    if (previewFilter !== 'ALL' && row.status !== previewFilter) return false;
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const matchId = (row.identifier || '').toLowerCase().includes(q);
      const matchName = (row.name || '').toLowerCase().includes(q);
      const matchIssue = (row.issues || []).some((i) => i.toLowerCase().includes(q));
      if (!matchId && !matchName && !matchIssue) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {locale === 'ar' ? 'الرفع المجمع للبيانات' : 'Bulk Upload Management'}
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Excel & CSV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
              {locale === 'ar'
                ? 'إضافة وتحديث المنتجات والفئات بكميات كبيرة عبر ملفات Excel و CSV مع دعم التسلسل الهرمي الرباعي والتحقق المسبق من الأخطاء'
                : 'Batch create and update categories, 4-level hierarchy, products, variants, and inventory with real-time validation & error reporting'}
            </p>
          </div>
        </div>

        {/* Quick Sample Downloads */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative group">
            <button className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-2xs">
              <FolderTree className="w-4 h-4 text-emerald-600" />
              <span>{locale === 'ar' ? 'نموذج الأقسام' : 'Category Template'}</span>
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-30 animate-in fade-in duration-150">
              <button
                onClick={() => handleDownloadTemplate('category', 'xlsx')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <span>Excel (.xlsx)</span>
                <span className="text-[10px] text-emerald-600 font-bold">Standard</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('category', 'csv')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <span>CSV (.csv)</span>
                <span className="text-[10px] text-slate-400">Lightweight</span>
              </button>
            </div>
          </div>

          <div className="relative group">
            <button className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-2xs">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>{locale === 'ar' ? 'نموذج المنتجات' : 'Product Template'}</span>
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-30 animate-in fade-in duration-150">
              <button
                onClick={() => handleDownloadTemplate('product', 'xlsx')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <span>Excel (.xlsx)</span>
                <span className="text-[10px] text-indigo-600 font-bold">Standard</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('product', 'csv')}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <span>CSV (.csv)</span>
                <span className="text-[10px] text-slate-400">Lightweight</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-1.5">
        <button
          onClick={() => handleTabChange('products')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{locale === 'ar' ? 'الرفع المجمع للمنتجات' : 'Product Bulk Upload'}</span>
        </button>

        <button
          onClick={() => handleTabChange('categories')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{locale === 'ar' ? 'الرفع المجمع للأقسام (L1-L4)' : 'Category Bulk Upload (L1-L4)'}</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{locale === 'ar' ? 'سجل العمليات والتقارير' : 'Upload History & Reports'}</span>
        </button>
      </div>

      {/* TABS 1 & 2: Category or Product Upload View */}
      {activeTab !== 'history' && (
        <div className="space-y-6">
          {/* Configuration & Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import Mode Selector */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {locale === 'ar' ? 'نمط الاستيراد (Import Mode)' : 'Import Mode'}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? 'اختر كيفية التعامل مع السجلات الموجودة في قاعدة البيانات'
                  : 'Specify how records are matched and inserted or updated'}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setImportMode('UPSERT')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    importMode === 'UPSERT'
                      ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">Upsert</span>
                    {importMode === 'UPSERT' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Create new & update existing</p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('CREATE_ONLY')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    importMode === 'CREATE_ONLY'
                      ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">Create Only</span>
                    {importMode === 'CREATE_ONLY' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Skip or error on existing items</p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('UPDATE_ONLY')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    importMode === 'UPDATE_ONLY'
                      ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">Update Only</span>
                    {importMode === 'UPDATE_ONLY' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Only update existing items</p>
                </button>
              </div>
            </div>

            {/* Error Handling Strategy */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  {locale === 'ar' ? 'سلوك معالجة الأخطاء' : 'Error Handling Strategy'}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? 'تحديد المعاملة البنكية عند وجود أخطاء في بعض الصفوف'
                  : 'Define transaction behavior when rows fail validation'}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setErrorHandling('SKIP_INVALID')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    errorHandling === 'SKIP_INVALID'
                      ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">Skip Invalid Rows</span>
                    {errorHandling === 'SKIP_INVALID' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">
                    Import valid items & log errors in report (Recommended)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setErrorHandling('ALL_OR_NOTHING')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    errorHandling === 'ALL_OR_NOTHING'
                      ? 'bg-rose-50/70 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">All or Nothing</span>
                    {errorHandling === 'ALL_OR_NOTHING' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">
                    Strict rollback: abort everything if 1 error exists
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileSelected(e.target.files[0])}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-3">
                <div
                  className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all ${
                    selectedFile
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {selectedFile ? (
                    <FileSpreadsheet className="w-8 h-8" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                {selectedFile ? (
                  <div>
                    <h4 className="text-base font-bold text-slate-900 break-all">{selectedFile.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready to validate & import
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      ✓ File Loaded
                    </span>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {locale === 'ar' ? 'اسحب وأفلت الملف هنا، أو انقر للاختيار' : 'Drag & drop file here, or click to browse'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 25MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {activeTab === 'categories'
                    ? 'Categories match by unique category_code. Parent categories must be declared before subcategories.'
                    : 'Products and variants match by unique SKU. Images reference filenames or public URLs.'}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setValidationResult(null);
                      setImportResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Clear File
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={!selectedFile || validating || importing}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shadow-md shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {validating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating Rows...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validate File</span>
                    </>
                  )}
                </button>

                {validationResult && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={
                      importing ||
                      validationResult.validCount === 0 ||
                      (errorHandling === 'ALL_OR_NOTHING' && validationResult.errorCount > 0)
                    }
                    className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Importing to Database...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        <span>Proceed with Import ({validationResult.validCount})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Import Result Banner */}
          {importResult && (
            <div
              className={`rounded-3xl p-6 border shadow-sm transition-all animate-in fade-in ${
                importResult.status === 'COMPLETED'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : importResult.status === 'PARTIAL_SUCCESS'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      importResult.status === 'COMPLETED'
                        ? 'bg-emerald-200 text-emerald-800'
                        : importResult.status === 'PARTIAL_SUCCESS'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-rose-200 text-rose-800'
                    }`}
                  >
                    {importResult.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {importResult.status === 'COMPLETED'
                        ? 'Import Completed Successfully!'
                        : importResult.status === 'PARTIAL_SUCCESS'
                        ? 'Import Finished with Partial Errors'
                        : 'Import Failed'}
                    </h3>
                    <p className="text-xs opacity-80 mt-0.5">
                      Successfully processed {importResult.successCount} record(s).{' '}
                      {importResult.failedCount > 0 && `${importResult.failedCount} item(s) skipped due to errors.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {importResult.failedCount > 0 && importResult.historyId && (
                    <button
                      onClick={() => handleDownloadErrors(importResult.historyId)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Error CSV</span>
                    </button>
                  )}

                  <Link
                    href={activeTab === 'categories' ? '/admin/categories' : '/admin/products'}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>View in {activeTab === 'categories' ? 'Categories' : 'Products'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Validation Metrics & Preview Table */}
          {validationResult && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Total Rows Checked</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{validationResult.totalRows}</div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Valid Rows (Ready)</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">{validationResult.validCount}</div>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
                  <div className="text-xs text-rose-700 font-semibold">Errors Found</div>
                  <div className="text-2xl font-black text-rose-800 mt-1">{validationResult.errorCount}</div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <div className="text-xs text-amber-700 font-semibold">Warnings Flagged</div>
                  <div className="text-2xl font-black text-amber-800 mt-1">{validationResult.warningCount}</div>
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setPreviewFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({validationResult.totalRows})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('ERROR')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewFilter === 'ERROR'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Errors ({validationResult.errorCount})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('WARNING')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewFilter === 'WARNING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Warnings ({validationResult.warningCount})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('VALID')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewFilter === 'VALID'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Valid ({validationResult.validCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter preview rows..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Identifier (Code / SKU)</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Category / Parent</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Validation Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                            No rows match your preview filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-400">#{row.rowNumber}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{row.identifier}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-800">
                              <div>{row.name}</div>
                              {row.secondary && <div className="text-[11px] text-slate-400 font-normal">{row.secondary}</div>}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-600">{row.parent}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  row.status === 'VALID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : row.status === 'ERROR'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {row.status === 'VALID' ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {row.issues && row.issues.length > 0 ? (
                                <ul className="space-y-1">
                                  {row.issues.map((issue, iIdx) => (
                                    <li
                                      key={iIdx}
                                      className={`text-[11px] font-medium flex items-center gap-1 ${
                                        row.status === 'ERROR' ? 'text-rose-600' : 'text-amber-600'
                                      }`}
                                    >
                                      • {issue}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Ready for database import</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Upload History & Reports */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {locale === 'ar' ? 'سجل عمليات الرفع السابقة' : 'Bulk Upload History & Audit'}
              </h3>
              <p className="text-xs text-slate-500">
                Audit log of all batch file executions with itemized error reports
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer outline-hidden"
              >
                <option value="ALL">All Types</option>
                <option value="CATEGORY">Categories</option>
                <option value="PRODUCT">Products</option>
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PARTIAL_SUCCESS">Partial Success</option>
                <option value="FAILED">Failed</option>
                <option value="PROCESSING">Processing</option>
              </select>

              <button
                onClick={loadHistory}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200 cursor-pointer"
                title="Refresh History"
              >
                <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* History Records Table */}
          {historyLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-bold">Loading upload history log...</p>
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No bulk upload history recorded yet.</p>
              <p className="text-xs text-slate-400">Completed file imports will appear here automatically.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">File Details</th>
                      <th className="px-5 py-3.5">Import Type</th>
                      <th className="px-5 py-3.5">Mode</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-center">Results (Success / Failed)</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {historyRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-xs">{item.file_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Direct API'} •{' '}
                            {item.uploader?.email || 'Admin'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              item.import_type === 'CATEGORY'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {item.import_type}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-700">
                          {item.import_mode}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'PARTIAL_SUCCESS'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : item.status === 'PROCESSING'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 font-mono text-xs">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ✓ {item.success_count || 0}
                            </span>
                            <span className="text-slate-300">/</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-md border ${
                                item.failed_count > 0
                                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                                  : 'text-slate-500 bg-slate-50 border-slate-200'
                              }`}
                            >
                              ✕ {item.failed_count || 0}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedHistoryModal(item)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                              title="Inspect Error Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {item.failed_count > 0 ? (
                              <button
                                onClick={() => handleDownloadErrors(item.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Download Error Report CSV"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>CSV</span>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AdminPagination
                currentPage={historyPage}
                totalPages={historyTotalPages}
                totalRecords={historyTotalRecords}
                pageSize={10}
                onPageChange={(p) => setHistoryPage(p)}
                locale={locale}
              />
            </div>
          )}
        </div>
      )}

      {/* History Error Summary Modal */}
      {selectedHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Import Error Details: {selectedHistoryModal.file_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedHistoryModal.failed_count} failed row(s) out of {selectedHistoryModal.total_rows} total
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryModal(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {(!selectedHistoryModal.error_summary || selectedHistoryModal.error_summary.length === 0) ? (
                <div className="text-center py-8 text-emerald-700 font-bold text-xs space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                  <p>All rows imported cleanly with zero failures!</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Row</th>
                        <th className="px-4 py-2.5">Identifier</th>
                        <th className="px-4 py-2.5">Field</th>
                        <th className="px-4 py-2.5">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedHistoryModal.error_summary.map((err, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-mono font-bold text-slate-400">#{err.row || 'N/A'}</td>
                          <td className="px-4 py-2 font-mono font-bold text-slate-900">{err.identifier || '-'}</td>
                          <td className="px-4 py-2 text-slate-500">{err.field || 'general'}</td>
                          <td className="px-4 py-2 text-rose-600 font-medium">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              {selectedHistoryModal.failed_count > 0 ? (
                <button
                  onClick={() => handleDownloadErrors(selectedHistoryModal.id)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Error Report (.csv)</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                onClick={() => setSelectedHistoryModal(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
