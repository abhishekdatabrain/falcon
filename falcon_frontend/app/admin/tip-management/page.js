'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { fetchApi } from '../../../src/services/api';
import {
  Heart,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
  EyeOff,
  Coins,
  Sliders,
  DollarSign,
  Check,
  X
} from 'lucide-react';

const DEFAULT_CONFIG = {
  is_enabled: true,
  show_on_checkout: true,
  presets: [
    { id: '1', amount: 5, is_enabled: true },
    { id: '2', amount: 10, is_enabled: true },
    { id: '3', amount: 15, is_enabled: true },
  ],
  allow_custom: true,
  min_custom_amount: 1.00,
  max_custom_amount: 500.00,
};

export default function AdminTipManagementPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('delivery.edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form State
  const [isEnabled, setIsEnabled] = useState(DEFAULT_CONFIG.is_enabled);
  const [showOnCheckout, setShowOnCheckout] = useState(DEFAULT_CONFIG.show_on_checkout);
  const [presets, setPresets] = useState(DEFAULT_CONFIG.presets);
  const [allowCustom, setAllowCustom] = useState(DEFAULT_CONFIG.allow_custom);
  const [minCustomAmount, setMinCustomAmount] = useState('1.00');
  const [maxCustomAmount, setMaxCustomAmount] = useState('500.00');
  const [updatedByInfo, setUpdatedByInfo] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  // New Preset inline state
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  // Confirmation Modals
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [deletePresetId, setDeletePresetId] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/admin/tip-management');
      if (res.success && res.data) {
        const d = res.data;
        setIsEnabled(d.is_enabled !== undefined ? Boolean(d.is_enabled) : true);
        setShowOnCheckout(d.show_on_checkout !== undefined ? Boolean(d.show_on_checkout) : true);
        setPresets(
          Array.isArray(d.presets)
            ? d.presets.map((p, idx) => ({
                id: String(p.id || `preset-${idx + 1}`),
                amount: parseFloat(p.amount) || 0,
                is_enabled: p.is_enabled !== false,
              }))
            : DEFAULT_CONFIG.presets
        );
        setAllowCustom(d.allow_custom !== undefined ? Boolean(d.allow_custom) : true);
        setMinCustomAmount(d.min_custom_amount !== undefined ? String(parseFloat(d.min_custom_amount).toFixed(2)) : '1.00');
        setMaxCustomAmount(d.max_custom_amount !== undefined ? String(parseFloat(d.max_custom_amount).toFixed(2)) : '500.00');
        setUpdatedByInfo(d.updated_by || null);
        setUpdatedAt(d.updated_at || null);
        setHasChanges(false);
      }
    } catch (err) {
      showToast(
        locale === 'ar' ? 'فشل تحميل إعدادات الإكرامية' : 'Failed to load tip settings',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleGlobalEnabled = () => {
    if (!canEdit) {
      showToast(locale === 'ar' ? 'ليس لديك صلاحية لتعديل الإعدادات' : 'Permission denied to edit settings', 'error');
      return;
    }
    if (isEnabled) {
      setDisableModalOpen(true);
    } else {
      setIsEnabled(true);
      setHasChanges(true);
    }
  };

  const confirmDisableGlobal = () => {
    setIsEnabled(false);
    setHasChanges(true);
    setDisableModalOpen(false);
  };

  const handleTogglePreset = (id) => {
    if (!canEdit) return;
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_enabled: !p.is_enabled } : p))
    );
    setHasChanges(true);
  };

  const handlePresetAmountChange = (id, newAmountStr) => {
    if (!canEdit) return;
    setPresets((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, amount: newAmountStr };
        }
        return p;
      })
    );
    setHasChanges(true);
  };

  const handleDeletePreset = (id) => {
    if (!canEdit) return;
    if (presets.length <= 1) {
      showToast(
        locale === 'ar'
          ? 'يجب الاحتفاظ بخيار إكرامية محدد مسبقاً واحد على الأقل'
          : 'You must keep at least one preset tip option',
        'warning'
      );
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== id));
    setDeletePresetId(null);
    setHasChanges(true);
    showToast(locale === 'ar' ? 'تم حذف الخيار' : 'Preset removed', 'info');
  };

  const handleAddPreset = () => {
    if (!canEdit) return;
    const parsed = parseFloat(newPresetAmount);
    if (isNaN(parsed) || parsed <= 0) {
      showToast(
        locale === 'ar' ? 'يرجى إدخال مبلغ إكرامية صحيح أكبر من 0' : 'Please enter a valid amount greater than 0',
        'warning'
      );
      return;
    }

    // Check duplicate
    if (presets.some((p) => Math.abs(parseFloat(p.amount) - parsed) < 0.001)) {
      showToast(
        locale === 'ar' ? 'هذا المبلغ موجود بالفعل في الخيارات المحددة' : 'A preset with this amount already exists',
        'warning'
      );
      return;
    }

    const newPreset = {
      id: `preset-${Date.now()}`,
      amount: Math.round(parsed * 100) / 100,
      is_enabled: true,
    };

    setPresets((prev) => [...prev, newPreset].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount)));
    setNewPresetAmount('');
    setIsAddingPreset(false);
    setHasChanges(true);
    showToast(locale === 'ar' ? 'تمت إضافة خيار الإكرامية' : 'Preset tip added', 'success');
  };

  const handleResetToDefaults = () => {
    if (!canEdit) return;
    if (!confirm(locale === 'ar' ? 'هل تريد استعادة الإعدادات الافتراضية للإكرامية؟' : 'Reset all tip settings to default values?')) {
      return;
    }
    setIsEnabled(DEFAULT_CONFIG.is_enabled);
    setShowOnCheckout(DEFAULT_CONFIG.show_on_checkout);
    setPresets(DEFAULT_CONFIG.presets);
    setAllowCustom(DEFAULT_CONFIG.allow_custom);
    setMinCustomAmount(String(DEFAULT_CONFIG.min_custom_amount.toFixed(2)));
    setMaxCustomAmount(String(DEFAULT_CONFIG.max_custom_amount.toFixed(2)));
    setHasChanges(true);
    showToast(locale === 'ar' ? 'تمت استعادة الإعدادات الافتراضية' : 'Default settings restored', 'info');
  };

  const handleSave = async () => {
    if (!canEdit) {
      showToast(locale === 'ar' ? 'ليس لديك صلاحية لحفظ الإعدادات' : 'Permission denied', 'error');
      return;
    }

    // Validation
    const minVal = parseFloat(minCustomAmount);
    const maxVal = parseFloat(maxCustomAmount);

    if (allowCustom) {
      if (isNaN(minVal) || minVal < 0) {
        showToast(
          locale === 'ar' ? 'الحد الأدنى لمبلغ الإكرامية المخصصة يجب أن يكون رقماً موجباً' : 'Minimum custom tip must be a non-negative number',
          'warning'
        );
        return;
      }
      if (isNaN(maxVal) || maxVal <= 0) {
        showToast(
          locale === 'ar' ? 'الحد الأقصى لمبلغ الإكرامية المخصصة يجب أن يكون أكبر من 0' : 'Maximum custom tip must be greater than 0',
          'warning'
        );
        return;
      }
      if (minVal > maxVal) {
        showToast(
          locale === 'ar' ? 'الحد الأدنى لا يمكن أن يكون أكبر من الحد الأقصى' : 'Minimum custom tip cannot exceed maximum custom tip',
          'warning'
        );
        return;
      }
    }

    // Validate presets
    for (const p of presets) {
      const amt = parseFloat(p.amount);
      if (isNaN(amt) || amt <= 0) {
        showToast(
          locale === 'ar' ? `مبلغ الخيار المسبق غير صالح: ${p.amount}` : `Invalid preset tip amount: ${p.amount}`,
          'warning'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        is_enabled: isEnabled,
        show_on_checkout: showOnCheckout,
        presets: presets.map((p) => ({
          id: p.id,
          amount: parseFloat(p.amount),
          is_enabled: Boolean(p.is_enabled),
        })),
        allow_custom: allowCustom,
        min_custom_amount: minVal,
        max_custom_amount: maxVal,
      };

      const res = await fetchApi('/admin/tip-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم حفظ إعدادات إكرامية مندوب التوصيل بنجاح' : 'Delivery partner tip settings saved successfully',
          'success'
        );
        setHasChanges(false);
        loadSettings();
      } else {
        showToast(res.message || (locale === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings'), 'error');
      }
    } catch (err) {
      showToast(err.message || (locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-spin mb-4">
          <Loader2 className="w-6 h-6" />
        </div>
        <p className="text-slate-600 font-bold text-sm">
          {locale === 'ar' ? 'جارِ تحميل إعدادات إكرامية السائقين...' : 'Loading Tip Management Settings...'}
        </p>
      </div>
    );
  }

  // Active presets count
  const enabledPresets = presets.filter((p) => p.is_enabled);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1.5">
            <Link href="/admin/dashboard" className="hover:text-emerald-700 transition-colors">
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
            <span>{locale === 'ar' ? 'إدارة العمليات والمالية' : 'Operations & Finance'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
            <span className="text-emerald-700 font-bold">
              {locale === 'ar' ? 'إدارة الإكرامية' : 'Tip Management'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#006E2D]/10 text-[#006E2D] border border-[#006E2D]/20 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 fill-[#006E2D]/20" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {locale === 'ar' ? 'إدارة إكرامية مندوب التوصيل' : 'Delivery Partner Tip Management'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    isEnabled && showOnCheckout
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isEnabled && showOnCheckout ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isEnabled && showOnCheckout
                    ? (locale === 'ar' ? 'مفعلة بصفحة الدفع' : 'ACTIVE ON CHECKOUT')
                    : (locale === 'ar' ? 'معطلة' : 'DISABLED')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {locale === 'ar'
                  ? 'التحكم المركزي في خيارات الإكرامية المسبقة، والمبالغ المخصصة، ومزامنتها المباشرة مع صفحة الدفع'
                  : 'Centralized control for quick tip chips, custom tipping limits, and instant customer checkout synchronization'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={saving || !canEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{locale === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canEdit}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
              hasChanges
                ? 'bg-[#006E2D] hover:bg-[#005a24] shadow-emerald-900/20 ring-2 ring-[#006E2D]/20 animate-pulse'
                : 'bg-[#006E2D] hover:bg-[#005a24] shadow-emerald-900/10'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving
                ? (locale === 'ar' ? 'جارِ الحفظ...' : 'Saving Changes...')
                : (locale === 'ar' ? 'حفظ إعدادات الإكرامية' : 'Save Tip Settings')}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time sync alert banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            {locale === 'ar'
              ? 'أي تغيير في المبالغ أو تفعيل/تعطيل الخيارات ينعكس فورياً في واجهة الدفع (Checkout) للعملاء وفي التحقق المالي للطلبات.'
              : 'All tip adjustments, presets, and limits update customer checkout chips immediately and are strictly verified on the backend.'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {locale === 'ar' ? 'مزامنة مباشرة' : 'LIVE SYNC ACTIVE'}
        </span>
      </div>

      {/* Main Grid: 2 Configuration Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): General Settings & Presets */}
        <div className="lg:col-span-7 space-y-6">
          {/* ========================================================= */}
          {/* CARD 1: GENERAL CONTROLS */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {locale === 'ar' ? 'الإعدادات العامة للإكرامية' : 'General Tip Settings'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar' ? 'التحكم الشامل في تفعيل الميزة وظهورها للعميل' : 'Global toggles for feature availability & visibility'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Toggle 1: Global Enable/Disable */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {locale === 'ar' ? 'تفعيل إكرامية مندوب التوصيل' : 'Enable Delivery Partner Tips'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isEnabled ? (locale === 'ar' ? 'مفعل' : 'Enabled') : (locale === 'ar' ? 'معطل' : 'Disabled')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {locale === 'ar'
                      ? 'عند التعطيل، يتم إيقاف الإكرامية تماماً من كافة أرجاء النظام وعدم قبولها في الطلبات'
                      : 'Global master switch. When disabled, tipping is completely deactivated platform-wide'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={handleToggleGlobalEnabled}
                    disabled={!canEdit}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006E2D]" />
                </label>
              </div>

              {/* Toggle 2: Show/Hide on Customer Checkout */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {locale === 'ar' ? 'إظهار قسم الإكرامية في صفحة الدفع' : 'Show Tip Section on Checkout'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        showOnCheckout
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {showOnCheckout ? (locale === 'ar' ? 'ظاهر' : 'Visible') : (locale === 'ar' ? 'مخفي' : 'Hidden')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {locale === 'ar'
                      ? 'إذا تم إخفاؤه، لن تظهر بطاقة الإكرامية في صفحة الدفع للعملاء'
                      : 'Controls whether the appreciation card is presented to buyers during checkout'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showOnCheckout}
                    onChange={() => {
                      if (!canEdit) return;
                      setShowOnCheckout(!showOnCheckout);
                      setHasChanges(true);
                    }}
                    disabled={!canEdit || !isEnabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006E2D] peer-disabled:opacity-40" />
                </label>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CARD 2: PRESET TIP AMOUNTS */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {locale === 'ar' ? 'الخيارات المسبقة للإكرامية (SAR)' : 'Preset Tip Amounts'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar'
                      ? 'أزرار الاختيار السريع المعروضة للعميل في صفحة الدفع'
                      : 'Manage quick-selection buttons presented to customers during checkout'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingPreset(true)}
                disabled={!canEdit || isAddingPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006E2D]/10 hover:bg-[#006E2D]/20 text-[#006E2D] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'إضافة خيار' : 'Add Preset'}</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Inline Add Preset Form */}
              {isAddingPreset && (
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#A7F3D0] space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#00482B]">
                      {locale === 'ar' ? 'إضافة مبلغ إكرامية محدد مسبقاً' : 'Add New Preset Tip Option'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPreset(false);
                        setNewPresetAmount('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        SAR
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="1"
                        value={newPresetAmount}
                        onChange={(e) => setNewPresetAmount(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full pl-12 pr-4 py-2 text-xs font-bold bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPreset}
                      className="px-4 py-2 rounded-xl bg-[#006E2D] hover:bg-[#005a24] text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      {locale === 'ar' ? 'حفظ الخيار' : 'Save Preset'}
                    </button>
                  </div>
                </div>
              )}

              {/* Presets List */}
              <div className="space-y-2.5">
                {presets.map((preset, index) => (
                  <div
                    key={preset.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      preset.is_enabled
                        ? 'bg-white border-slate-200/90 shadow-2xs'
                        : 'bg-slate-50/70 border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                        {index + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">SAR</span>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          step="1"
                          value={preset.amount}
                          onChange={(e) => handlePresetAmountChange(preset.id, e.target.value)}
                          disabled={!canEdit}
                          className="w-20 px-2.5 py-1 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePreset(preset.id)}
                        disabled={!canEdit}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          preset.is_enabled
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.is_enabled ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{locale === 'ar' ? 'مفعل' : 'Active'}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-slate-400" />
                            <span>{locale === 'ar' ? 'معطل' : 'Disabled'}</span>
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(preset.id)}
                        disabled={!canEdit || presets.length <= 1}
                        title={locale === 'ar' ? 'حذف الخيار' : 'Delete preset'}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {presets.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  {locale === 'ar' ? 'لا توجد خيارات إكرامية مسبقة محددة' : 'No preset tips configured'}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* CARD 3: CUSTOM TIP (OTHER OPTION) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {locale === 'ar' ? 'الإكرامية المخصصة (خيار آخر)' : 'Custom Tip ("Other" Option)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar'
                      ? 'السماح للعميل بإدخال مبلغ تقديري بحرية وتحديد الحدود المالية'
                      : 'Allow customers to input custom amounts and configure allowed thresholds'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Allow Custom Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {locale === 'ar' ? 'تفعيل خيار "مبلغ آخر"' : 'Enable "Other" Option'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        allowCustom
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {allowCustom ? (locale === 'ar' ? 'مفعل' : 'Enabled') : (locale === 'ar' ? 'معطل' : 'Disabled')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {locale === 'ar'
                      ? 'إذا تم تعطيله، سيقتصر العميل على اختيار المبالغ المسبقة فقط'
                      : 'If disabled, the "Other" button will be hidden on checkout'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allowCustom}
                    onChange={() => {
                      if (!canEdit) return;
                      setAllowCustom(!allowCustom);
                      setHasChanges(true);
                    }}
                    disabled={!canEdit}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006E2D]" />
                </label>
              </div>

              {/* Min & Max Inputs */}
              {allowCustom && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{locale === 'ar' ? 'الحد الأدنى للمبلغ (SAR)' : 'Minimum Amount (SAR)'}</span>
                      <span className="text-[10px] text-slate-400">Min: 0.50</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        SAR
                      </span>
                      <input
                        type="number"
                        min="0.5"
                        max="100"
                        step="0.5"
                        value={minCustomAmount}
                        onChange={(e) => {
                          setMinCustomAmount(e.target.value);
                          setHasChanges(true);
                        }}
                        disabled={!canEdit}
                        className="w-full pl-12 pr-4 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{locale === 'ar' ? 'الحد الأقصى للمبلغ (SAR)' : 'Maximum Amount (SAR)'}</span>
                      <span className="text-[10px] text-slate-400">Max: 1000.00</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        SAR
                      </span>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        step="5"
                        value={maxCustomAmount}
                        onChange={(e) => {
                          setMaxCustomAmount(e.target.value);
                          setHasChanges(true);
                        }}
                        disabled={!canEdit}
                        className="w-full pl-12 pr-4 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Preview & Financial Compliance */}
        <div className="lg:col-span-5 space-y-6">
          {/* ========================================================= */}
          {/* LIVE CHECKOUT PREVIEW CARD */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden sticky top-6">
            <div className="p-4 bg-gradient-to-r from-emerald-50/60 to-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>{locale === 'ar' ? 'معاينة صفحة الدفع الحية' : 'Live Checkout Preview'}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                {locale === 'ar' ? 'ما يراه العميل' : 'Customer View'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* If hidden / disabled */}
              {(!isEnabled || !showOnCheckout) ? (
                <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-2">
                  <EyeOff className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-amber-900">
                    {locale === 'ar' ? 'قسم الإكرامية مخفي حالياً في صفحة الدفع' : 'Tip section is currently hidden on checkout'}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {locale === 'ar'
                      ? 'لإظهار البطاقة للعملاء، قم بتفعيل الميزة وإظهارها في الإعدادات العامة'
                      : 'Enable delivery partner tips and checkout visibility above to display this widget.'}
                  </p>
                </div>
              ) : (
                /* The actual customer checkout widget replica */
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#A7F3D0] space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#05A764]/20 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 fill-[#006E2D] text-[#006E2D]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {locale === 'ar' ? 'إكرامية لمندوب التوصيل' : 'Tip for Delivery Partner'}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {locale === 'ar' ? 'أظهر تقديرك لخدمتهم المميزة' : 'Show your appreciation for their service'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chips Grid */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {enabledPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="py-2 px-1 rounded-xl text-xs font-bold text-center border bg-white border-slate-200 text-slate-800 shadow-2xs"
                      >
                        SAR {parseFloat(preset.amount).toFixed(0)}
                      </div>
                    ))}

                    {allowCustom && (
                      <div className="py-2 px-1 rounded-xl text-xs font-bold text-center border bg-white border-slate-200 text-slate-800 shadow-2xs">
                        {locale === 'ar' ? 'آخر' : 'Other'}
                      </div>
                    )}
                  </div>

                  {enabledPresets.length === 0 && !allowCustom && (
                    <div className="text-center py-2 text-[11px] text-amber-700 font-medium">
                      {locale === 'ar'
                        ? 'تنبيه: لا توجد خيارات مسبقة مفعلة وخيار "آخر" معطل.'
                        : 'Warning: No active presets and custom tip is disabled.'}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 pt-1 text-center">
                    {locale === 'ar'
                      ? '100% من الإكرامية تذهب مباشرة إلى مندوب التوصيل'
                      : '100% of the tip goes directly to your delivery partner'}
                  </p>
                </div>
              )}

              {/* Behavior Notes */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{locale === 'ar' ? 'قواعد السلوك والمالية' : 'Financial Rules & Behavior'}</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
                  <li>
                    {locale === 'ar'
                      ? 'القيمة الافتراضية المحددة هي دائماً 0 ريال (التخطي افتراضي للعميل)'
                      : 'Default tip is always SAR 0.00. Customers are never forced to tip.'}
                  </li>
                  <li>
                    {locale === 'ar'
                      ? 'لا تُحسب ضريبة القيمة المضافة (VAT) على الإكرامية وفقاً للأنظمة'
                      : 'Saudi VAT (15%) is strictly excluded from delivery partner tips.'}
                  </li>
                  <li>
                    {locale === 'ar'
                      ? 'يتم حفظ الإكرامية بشكل منفصل عن قيمة المنتجات ورسوم التوصيل'
                      : 'Tips are tracked independently in order records and driver reports.'}
                  </li>
                </ul>
              </div>

              {/* Audit Metadata */}
              {(updatedAt || updatedByInfo) && (
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                  {updatedByInfo && (
                    <div>
                      {locale === 'ar' ? 'آخر تحديث بواسطة: ' : 'Last updated by: '}
                      <span className="font-semibold text-slate-600">{updatedByInfo.name || updatedByInfo.email}</span>
                    </div>
                  )}
                  {updatedAt && (
                    <div>
                      {locale === 'ar' ? 'تاريخ التحديث: ' : 'Updated at: '}
                      <span className="font-semibold text-slate-600">{new Date(updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Disabling Tip Globally */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {locale === 'ar' ? 'تعطيل إكرامية مندوب التوصيل؟' : 'Disable Delivery Partner Tips?'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {locale === 'ar'
                ? 'سيؤدي تعطيل هذه الميزة إلى إخفاء خيارات الإكرامية من صفحة الدفع وعدم قبول أي إكراميات جديدة في طلبات العملاء. هل أنت متأكد؟'
                : 'Disabling this feature will remove tipping from the checkout summary and prevent customers from sending tips. Are you sure?'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDisableModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDisableGlobal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'نعم، قم بالتعطيل' : 'Yes, Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
