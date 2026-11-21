'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { fetchApi } from '../../../src/services/api';
import {
  Truck,
  Zap,
  Calendar,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Loader2,
  Sparkles,
  Info,
  X
} from 'lucide-react';

const DEFAULT_CONFIG = {
  express: {
    is_enabled: true,
    base_fee: '12.00',
    estimated_delivery_minutes: 90,
    min_order_amount: '0.00',
    name_en: 'Express Delivery',
    name_ar: 'توصيل سريع',
  },
  standard: {
    is_enabled: true,
    base_fee: '0.00',
    free_delivery_threshold: '100.00',
    min_order_amount: '0.00',
    name_en: 'Standard Schedule',
    name_ar: 'توصيل قياسي مجدول',
  },
};

export default function AdminDeliveryChargesPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('delivery.edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form State
  const [expressConfig, setExpressConfig] = useState(DEFAULT_CONFIG.express);
  const [standardConfig, setStandardConfig] = useState(DEFAULT_CONFIG.standard);

  // Initial State for dirty checking
  const [initialData, setInitialData] = useState(null);

  // Confirmation Modal for Disabling Method
  const [disableModal, setDisableModal] = useState({
    isOpen: false,
    method: null, // 'express' | 'standard'
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/admin/delivery-charges');
      if (res.success && res.data) {
        const exp = res.data.express || DEFAULT_CONFIG.express;
        const std = res.data.standard || DEFAULT_CONFIG.standard;

        const formattedExp = {
          is_enabled: exp.is_enabled !== undefined ? Boolean(exp.is_enabled) : true,
          base_fee: exp.base_fee !== undefined ? String(parseFloat(exp.base_fee).toFixed(2)) : '12.00',
          estimated_delivery_minutes: exp.estimated_delivery_minutes ? parseInt(exp.estimated_delivery_minutes, 10) : 90,
          min_order_amount: exp.min_order_amount ? String(parseFloat(exp.min_order_amount).toFixed(2)) : '0.00',
          name_en: exp.name_en || 'Express Delivery',
          name_ar: exp.name_ar || 'توصيل سريع',
        };

        const formattedStd = {
          is_enabled: std.is_enabled !== undefined ? Boolean(std.is_enabled) : true,
          base_fee: std.base_fee !== undefined ? String(parseFloat(std.base_fee).toFixed(2)) : '0.00',
          free_delivery_threshold: std.free_delivery_threshold !== null && std.free_delivery_threshold !== undefined
            ? String(parseFloat(std.free_delivery_threshold).toFixed(2))
            : '100.00',
          min_order_amount: std.min_order_amount ? String(parseFloat(std.min_order_amount).toFixed(2)) : '0.00',
          name_en: std.name_en || 'Standard Schedule',
          name_ar: std.name_ar || 'توصيل قياسي مجدول',
        };

        setExpressConfig(formattedExp);
        setStandardConfig(formattedStd);
        setInitialData({ express: formattedExp, standard: formattedStd });
        setHasChanges(false);
      } else {
        showToast(res.message || 'Failed to load delivery settings', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error loading delivery settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleExpress = () => {
    if (!canEdit) {
      showToast(locale === 'ar' ? 'ليس لديك صلاحية لتعديل الرسوم' : 'You do not have permission to edit delivery charges', 'error');
      return;
    }
    if (expressConfig.is_enabled) {
      // Opening confirmation dialog before disabling
      if (!standardConfig.is_enabled) {
        showToast(
          locale === 'ar'
            ? 'لا يمكن تعطيل كلتا الطريقتين معاً. يجب تفعيل طريقة واحدة على الأقل لضمان إتمام طلبات العملاء.'
            : 'Cannot disable both delivery methods. At least one method must remain active.',
          'warning'
        );
        return;
      }
      setDisableModal({ isOpen: true, method: 'express' });
    } else {
      setExpressConfig((prev) => ({ ...prev, is_enabled: true }));
      setHasChanges(true);
    }
  };

  const handleToggleStandard = () => {
    if (!canEdit) {
      showToast(locale === 'ar' ? 'ليس لديك صلاحية لتعديل الرسوم' : 'You do not have permission to edit delivery charges', 'error');
      return;
    }
    if (standardConfig.is_enabled) {
      // Opening confirmation dialog before disabling
      if (!expressConfig.is_enabled) {
        showToast(
          locale === 'ar'
            ? 'لا يمكن تعطيل كلتا الطريقتين معاً. يجب تفعيل طريقة واحدة على الأقل لضمان إتمام طلبات العملاء.'
            : 'Cannot disable both delivery methods. At least one method must remain active.',
          'warning'
        );
        return;
      }
      setDisableModal({ isOpen: true, method: 'standard' });
    } else {
      setStandardConfig((prev) => ({ ...prev, is_enabled: true }));
      setHasChanges(true);
    }
  };

  const confirmDisableMethod = () => {
    if (disableModal.method === 'express') {
      setExpressConfig((prev) => ({ ...prev, is_enabled: false }));
    } else if (disableModal.method === 'standard') {
      setStandardConfig((prev) => ({ ...prev, is_enabled: false }));
    }
    setHasChanges(true);
    setDisableModal({ isOpen: false, method: null });
  };

  const handleResetToDefaults = () => {
    if (!confirm(locale === 'ar' ? 'هل تريد استعادة الإعدادات الافتراضية للنظام؟' : 'Reset all delivery charges to default values?')) {
      return;
    }
    setExpressConfig(DEFAULT_CONFIG.express);
    setStandardConfig(DEFAULT_CONFIG.standard);
    setHasChanges(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!canEdit) {
      showToast(locale === 'ar' ? 'ليس لديك صلاحية لحفظ التعديلات' : 'You do not have permission to update settings', 'error');
      return;
    }

    // Validation
    const expressFee = parseFloat(expressConfig.base_fee);
    if (isNaN(expressFee) || expressFee < 0) {
      showToast(locale === 'ar' ? 'يرجى إدخال رسوم توصيل سريع صحيحة (أكبر من أو تساوي 0)' : 'Please enter a valid non-negative Express charge', 'error');
      return;
    }

    const expressMinutes = parseInt(expressConfig.estimated_delivery_minutes, 10);
    if (isNaN(expressMinutes) || expressMinutes <= 0) {
      showToast(locale === 'ar' ? 'يرجى إدخال وقت توصيل تقديري بالدقائق (أكبر من 0)' : 'Please enter an estimated delivery time greater than 0 minutes', 'error');
      return;
    }

    const standardFee = parseFloat(standardConfig.base_fee);
    if (isNaN(standardFee) || standardFee < 0) {
      showToast(locale === 'ar' ? 'يرجى إدخال رسوم توصيل قياسي صحيحة (أكبر من أو تساوي 0)' : 'Please enter a valid non-negative Standard charge', 'error');
      return;
    }

    const freeThreshold = parseFloat(standardConfig.free_delivery_threshold);
    if (isNaN(freeThreshold) || freeThreshold < 0) {
      showToast(locale === 'ar' ? 'يرجى إدخال حد التوصيل المجاني صحيحاً (أكبر من أو يساوي 0)' : 'Please enter a valid non-negative Free Delivery threshold', 'error');
      return;
    }

    if (!expressConfig.is_enabled && !standardConfig.is_enabled) {
      showToast(locale === 'ar' ? 'يجب تفعيل خيار توصيل واحد على الأقل' : 'At least one delivery method must be enabled', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        express: {
          is_enabled: expressConfig.is_enabled,
          base_fee: expressFee,
          estimated_delivery_minutes: expressMinutes,
          min_order_amount: parseFloat(expressConfig.min_order_amount || 0),
          name_en: expressConfig.name_en,
          name_ar: expressConfig.name_ar,
        },
        standard: {
          is_enabled: standardConfig.is_enabled,
          base_fee: standardFee,
          free_delivery_threshold: freeThreshold,
          min_order_amount: parseFloat(standardConfig.min_order_amount || 0),
          name_en: standardConfig.name_en,
          name_ar: standardConfig.name_ar,
        },
      };

      const res = await fetchApi('/admin/delivery-charges', {
        method: 'PUT',
        body: payload,
      });

      if (res.success) {
        showToast(
          locale === 'ar'
            ? 'تم حفظ وتطبيق رسوم التوصيل بنجاح في صفحة الدفع للعملاء'
            : 'Delivery charges updated and synced live with customer checkout successfully!',
          'success'
        );
        setInitialData({
          express: { ...expressConfig },
          standard: { ...standardConfig },
        });
        setHasChanges(false);
      } else {
        showToast(res.message || 'Failed to update delivery charges', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error saving delivery charges', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-spin mb-4">
          <Loader2 className="w-6 h-6" />
        </div>
        <p className="text-slate-600 font-bold text-sm">
          {locale === 'ar' ? 'جارِ تحميل إعدادات رسوم التوصيل...' : 'Loading Delivery Charges Configuration...'}
        </p>
      </div>
    );
  }

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
              {locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Charges'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#006E2D]/10 text-[#006E2D] border border-[#006E2D]/20 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'إدارة رسوم التوصيل' : 'Delivery Charges Management'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {locale === 'ar'
                  ? 'التحكم في رسوم التوصيل السريع والمجدول والحد الأدنى للشحن المجاني، مع المزامنة الفورية لصفحة الدفع'
                  : 'Configure Express & Standard delivery charges and free shipping threshold with instant customer checkout sync'}
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#006E2D] hover:bg-[#005a24] text-white text-xs font-black transition-all shadow-sm shadow-emerald-900/10 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving
                ? (locale === 'ar' ? 'جارِ الحفظ...' : 'Saving Changes...')
                : (locale === 'ar' ? 'حفظ رسوم التوصيل' : 'Save Delivery Charges')}
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
              ? 'أي تعديل يتم حفظه هنا ينعكس فورياً وديناميكياً على احتساب رسوم صفحة الدفع (Checkout) وسلة المشتريات للعملاء.'
              : 'All charges saved here are applied immediately to customer checkout calculation and shopping basket totals.'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {locale === 'ar' ? 'مزامنة مباشرة' : 'LIVE SYNC ACTIVE'}
        </span>
      </div>

      {/* Main Grid: 2 Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* CARD 1: EXPRESS DELIVERY CONFIGURATION */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="p-5 bg-gradient-to-r from-amber-50/50 via-white to-white border-b border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 fill-current text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">
                      {locale === 'ar' ? 'التوصيل السريع (Express)' : 'Express Delivery'}
                    </h2>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Fastest
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar' ? 'توصيل مبرد فوري للطلبات المستعجلة' : 'Instant cold-chain delivery for urgent orders'}
                  </p>
                </div>
              </div>

              {/* Toggle Active Switch */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleExpress}
                  disabled={!canEdit}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    expressConfig.is_enabled ? 'bg-[#006E2D]' : 'bg-slate-200'
                  }`}
                  aria-label="Toggle Express Delivery"
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      expressConfig.is_enabled ? 'translate-x-5.5 rtl:-translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-black ${expressConfig.is_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expressConfig.is_enabled ? (locale === 'ar' ? 'مفعل' : 'Active') : (locale === 'ar' ? 'معطل' : 'Disabled')}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-5">
              {/* Charge Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === 'ar' ? 'رسوم التوصيل السريع (ر.س) *' : 'Express Delivery Charge (SAR) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">
                    SAR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!canEdit || !expressConfig.is_enabled}
                    value={expressConfig.base_fee}
                    onChange={(e) => {
                      setExpressConfig({ ...expressConfig, base_fee: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="12.00"
                    className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-mono font-black text-sm focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {locale === 'ar'
                    ? 'المبلغ الثابت الذي يضاف لفاتورة العميل عند اختيار التوصيل السريع (القيمة الافتراضية: 12.00 ر.س)'
                    : 'Fixed charge added to the customer total when choosing Express Delivery (Default: SAR 12.00)'}
                </p>
              </div>

              {/* Estimated Delivery Time Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === 'ar' ? 'وقت التوصيل التقديري (بالدقائق) *' : 'Estimated Delivery Time (Minutes) *'}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="5"
                    min="10"
                    disabled={!canEdit || !expressConfig.is_enabled}
                    value={expressConfig.estimated_delivery_minutes}
                    onChange={(e) => {
                      setExpressConfig({
                        ...expressConfig,
                        estimated_delivery_minutes: e.target.value,
                      });
                      setHasChanges(true);
                    }}
                    placeholder="90"
                    className="w-full pl-10 pr-16 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-mono font-black text-sm focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    {locale === 'ar' ? 'دقيقة' : 'Minutes'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {locale === 'ar'
                    ? 'يظهر للعميل في صفحة الدفع بالشكل: "الوصول خلال X دقيقة" (القيمة الافتراضية: 90 دقيقة)'
                    : 'Shown to customer at checkout as: "Arriving within X minutes" (Default: 90 minutes)'}
                </p>
              </div>

              {/* Status Note */}
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                expressConfig.is_enabled
                  ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {expressConfig.is_enabled
                      ? (locale === 'ar' ? 'نشط في صفحة الدفع' : 'Active at Checkout')
                      : (locale === 'ar' ? 'معطل حالياً في صفحة الدفع' : 'Currently Disabled at Checkout')}
                  </span>
                </div>
                <p className="text-[11px]">
                  {expressConfig.is_enabled
                    ? (locale === 'ar'
                        ? `سيتم تحصيل SAR ${parseFloat(expressConfig.base_fee || 0).toFixed(2)} مع وصول خلال ${expressConfig.estimated_delivery_minutes} دقيقة.`
                        : `Customers selecting Express will be charged SAR ${parseFloat(expressConfig.base_fee || 0).toFixed(2)} with estimated arrival within ${expressConfig.estimated_delivery_minutes} minutes.`)
                    : (locale === 'ar'
                        ? 'لن يتمكن العملاء من اختيار التوصيل السريع أثناء إتمام الطلب وسيظهر كخيار غير متاح.'
                        : 'Express delivery will be grayed out and unavailable for selection at checkout.')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-semibold">{locale === 'ar' ? 'المعرف الداخلي: EXPRESS' : 'Internal Key: EXPRESS'}</span>
            <span className="font-mono">SAR {parseFloat(expressConfig.base_fee || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: STANDARD SCHEDULE DELIVERY CONFIGURATION */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-50/50 via-white to-white border-b border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">
                      {locale === 'ar' ? 'التوصيل المجدول (Standard)' : 'Standard Schedule'}
                    </h2>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar' ? 'توصيل حسب فترات الوقت والتواريخ المتاحة' : 'Time slot and date based scheduled fulfillment'}
                  </p>
                </div>
              </div>

              {/* Toggle Active Switch */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleStandard}
                  disabled={!canEdit}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    standardConfig.is_enabled ? 'bg-[#006E2D]' : 'bg-slate-200'
                  }`}
                  aria-label="Toggle Standard Delivery"
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      standardConfig.is_enabled ? 'translate-x-5.5 rtl:-translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-black ${standardConfig.is_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {standardConfig.is_enabled ? (locale === 'ar' ? 'مفعل' : 'Active') : (locale === 'ar' ? 'معطل' : 'Disabled')}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-5">
              {/* Standard Base Charge Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === 'ar' ? 'رسوم التوصيل القياسي الأساسية (ر.س) *' : 'Standard Delivery Base Charge (SAR) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">
                    SAR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!canEdit || !standardConfig.is_enabled}
                    value={standardConfig.base_fee}
                    onChange={(e) => {
                      setStandardConfig({ ...standardConfig, base_fee: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-mono font-black text-sm focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {locale === 'ar'
                    ? 'الرسوم المطبقة عند عدم تجاوز سلة العميل حد الشحن المجاني (القيمة الافتراضية: 0.00 ر.س)'
                    : 'Fee applied when the customer basket subtotal is below the free threshold (Default: SAR 0.00)'}
                </p>
              </div>

              {/* Free Delivery Minimum Order Amount Threshold */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === 'ar' ? 'الحد الأدنى للشحن المجاني (ر.س) *' : 'Free Delivery Minimum Order Amount (SAR) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">
                    SAR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!canEdit || !standardConfig.is_enabled}
                    value={standardConfig.free_delivery_threshold}
                    onChange={(e) => {
                      setStandardConfig({
                        ...standardConfig,
                        free_delivery_threshold: e.target.value,
                      });
                      setHasChanges(true);
                    }}
                    placeholder="100.00"
                    className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-mono font-black text-sm focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {locale === 'ar'
                    ? 'إذا كان مجموع المنتجات بالسلة أكبر من أو يساوي هذا المبلغ، يصبح التوصيل القياسي مجانياً (0 ر.س). القيمة الافتراضية: 100 ر.س'
                    : 'Orders equal to or above this amount receive FREE standard delivery (Default: SAR 100.00)'}
                </p>
              </div>

              {/* Status Note */}
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                standardConfig.is_enabled
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {standardConfig.is_enabled
                      ? (locale === 'ar' ? 'قاعدة الشحن المجاني نشطة' : 'Free Delivery Logic Active')
                      : (locale === 'ar' ? 'معطل حالياً في صفحة الدفع' : 'Currently Disabled at Checkout')}
                  </span>
                </div>
                <p className="text-[11px]">
                  {standardConfig.is_enabled
                    ? (locale === 'ar'
                        ? `الطلبات ≥ SAR ${parseFloat(standardConfig.free_delivery_threshold || 0).toFixed(2)} تحصل على شحن مجاني. الطلبات الأقل تدفع SAR ${parseFloat(standardConfig.base_fee || 0).toFixed(2)}.`
                        : `Orders ≥ SAR ${parseFloat(standardConfig.free_delivery_threshold || 0).toFixed(2)} get FREE delivery. Orders below pay SAR ${parseFloat(standardConfig.base_fee || 0).toFixed(2)}.`)
                    : (locale === 'ar'
                        ? 'لن يتمكن العملاء من اختيار التوصيل القياسي المجدول وسيظهر كخيار غير متاح.'
                        : 'Standard delivery will be disabled and unavailable at customer checkout.')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-semibold">{locale === 'ar' ? 'المعرف الداخلي: STANDARD' : 'Internal Key: STANDARD'}</span>
            <span className="font-mono">Threshold: SAR {parseFloat(standardConfig.free_delivery_threshold || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: LIVE STOREFRONT CHECKOUT PREVIEW */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {locale === 'ar' ? 'معاينة حية كما يراها العميل في صفحة الدفع (Checkout)' : 'Live Storefront Checkout Preview'}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? 'هكذا ستظهر خيارات التوصيل للمشتري في صفحة الدفع حسب الإعدادات الحالية أعلاه'
                  : 'This is exactly how delivery cards will render on the checkout page for buyers'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 self-start sm:self-auto font-mono">
            Interactive Preview
          </span>
        </div>

        {/* Live Preview Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl pt-2">
          {/* Preview Express Card */}
          <div
            className={`rounded-2xl p-4 transition-all relative border ${
              expressConfig.is_enabled
                ? 'bg-[#E8F8F0] border-2 border-[#05A764] shadow-2xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#05A764] fill-current" />
                <span className="font-bold text-sm text-slate-900">
                  {expressConfig.name_en}
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Fastest
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">SAR</span>
                <span className="font-bold text-sm text-slate-900 font-mono">
                  {parseFloat(expressConfig.base_fee || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs font-bold text-[#05A764]">
              {locale === 'ar'
                ? `الوصول خلال ${expressConfig.estimated_delivery_minutes || 90} دقيقة`
                : `Arriving within ${expressConfig.estimated_delivery_minutes || 90} minutes`}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {locale === 'ar' ? 'توصيل مبرد فوري للطلبات المستعجلة' : 'Estimated arrival: Today, immediate dispatch'}
            </p>

            {!expressConfig.is_enabled && (
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                <XCircle className="w-3 h-3" />
                <span>{locale === 'ar' ? 'غير متاح حالياً' : 'Currently Unavailable'}</span>
              </div>
            )}
          </div>

          {/* Preview Standard Card */}
          <div
            className={`rounded-2xl p-4 transition-all relative border ${
              standardConfig.is_enabled
                ? 'bg-[#E8F8F0] border-2 border-[#05A764] shadow-2xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-sm text-slate-900">
                  {standardConfig.name_en}
                </span>
              </div>
              <div className="text-right">
                {parseFloat(standardConfig.base_fee || 0) === 0 ? (
                  <span className="font-bold text-sm text-emerald-600">Free</span>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">SAR</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {parseFloat(standardConfig.base_fee || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 font-medium block">
                  over SAR {parseFloat(standardConfig.free_delivery_threshold || 100).toFixed(0)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-semibold">
              {locale === 'ar' ? 'اختيار الوقت والتاريخ المناسبين' : 'Pick convenient time slot'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {locale === 'ar' ? 'اختر الفترة من القائمة أدناه' : 'Select date & time below'}
            </p>

            {!standardConfig.is_enabled && (
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                <XCircle className="w-3 h-3" />
                <span>{locale === 'ar' ? 'غير متاح حالياً' : 'Currently Unavailable'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: ARCHITECTURE & ZONE EXTENSIBILITY NOTICE */}
      {/* ========================================================= */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {locale === 'ar' ? 'قابلية التوسع المستقبلي: المناطق والمدن (Zone-Ready Architecture)' : 'Future Extensibility: City & Zone Delivery Ready'}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-3xl leading-relaxed">
              {locale === 'ar'
                ? 'تم بناء هيكل البيانات ليدعم مستقبلاً تخصيص رسوم توصيل مختلفة حسب المدينة أو المنطقة الجغرافية (Zone/City) دون الحاجة لإعادة هيكلة نموذج الطلبات أو الدفع.'
                : 'The underlying database schema supports future extensions for location/zone-based rates, city rules, and minimum order requirements without changing order models.'}
            </p>
          </div>
        </div>

        <Link
          href="/admin/delivery-slots"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{locale === 'ar' ? 'إدارة فترات الوقت' : 'Delivery Slots'}</span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG: DISABLE DELIVERY METHOD */}
      {/* ========================================================= */}
      {disableModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'تأكيد تعطيل طريقة التوصيل' : 'Disable Delivery Method?'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {disableModal.method === 'express'
                      ? (locale === 'ar' ? 'التوصيل السريع (Express Delivery)' : 'Express Delivery')
                      : (locale === 'ar' ? 'التوصيل المجدول (Standard Schedule)' : 'Standard Schedule')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisableModal({ isOpen: false, method: null })}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                {locale === 'ar'
                  ? `هل أنت متأكد من رغبتك في تعطيل ${
                      disableModal.method === 'express' ? 'التوصيل السريع' : 'التوصيل المجدول'
                    }؟ لن يتمكن العملاء من اختياره أثناء إتمام الطلب وسيظهر كخيار غير متاح.`
                  : `Are you sure you want to disable ${
                      disableModal.method === 'express' ? 'Express Delivery' : 'Standard Schedule'
                    }? Customers will not be able to select this option during checkout.`}
              </p>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block">
                  {locale === 'ar' ? 'تنبيه تشغيلي مهم:' : 'Important Operational Notice:'}
                </span>
                <p>
                  {locale === 'ar'
                    ? 'الطلبات التي تم إنشاؤها مسبقاً ستحتفظ برسومها الأصلية ولن تتأثر بهذا التعديل.'
                    : 'Previously created orders retain their original delivery fee snapshot and will remain unaffected.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDisableModal({ isOpen: false, method: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء وإبقاء التفعيل' : 'Cancel & Keep Active'}
              </button>
              <button
                type="button"
                onClick={confirmDisableMethod}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'تأكيد التعطيل' : 'Confirm Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
