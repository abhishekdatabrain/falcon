'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi } from '../../../src/services/api';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  X,
  Zap,
  Calendar,
  Settings,
  Sliders,
  Check,
  Eye,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const INITIAL_FORM = {
  slot_label_en: '',
  slot_label_ar: '',
  tag_en: 'Standard Slot',
  tag_ar: 'فترة قياسية',
  is_express: false,
  is_active: true,
  display_order: 1,
  max_orders: 20,
};

export default function AdminDeliverySlotsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [slots, setSlots] = useState([]);
  const [settings, setSettings] = useState({
    days_ahead: 4,
    same_day_delivery_enabled: true,
    same_day_cutoff_time: '18:00',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Preview date selection state
  const [previewDateIdx, setPreviewDateIdx] = useState(0);
  const [previewSlotId, setPreviewSlotId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/delivery-slots/admin/all');
      if (res.success && res.data) {
        setSlots(res.data.slots || []);
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
        if (res.data.slots?.length > 0 && !previewSlotId) {
          setPreviewSlotId(res.data.slots[0].id);
        }
      } else {
        showToast(res.message || 'Failed to load delivery slots', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error loading slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSlot(null);
    setFormData({
      ...INITIAL_FORM,
      display_order: slots.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setFormData({
      slot_label_en: slot.slot_label_en || '',
      slot_label_ar: slot.slot_label_ar || '',
      tag_en: slot.tag_en || 'Standard Slot',
      tag_ar: slot.tag_ar || 'فترة قياسية',
      is_express: Boolean(slot.is_express),
      is_active: Boolean(slot.is_active),
      display_order: slot.display_order || 0,
      max_orders: slot.max_orders || 20,
    });
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!formData.slot_label_en.trim()) {
      showToast(locale === 'ar' ? 'يرجى إدخال وقت الفترة بالإنجليزية' : 'Slot label (EN) is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        slot_label_ar: formData.slot_label_ar || formData.slot_label_en,
        display_order: parseInt(formData.display_order, 10) || 0,
        max_orders: parseInt(formData.max_orders, 10) || 20,
      };

      if (editingSlot) {
        const res = await fetchApi(`/delivery-slots/${editingSlot.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          showToast(locale === 'ar' ? 'تم تحديث فترة التوصيل بنجاح' : 'Delivery slot updated successfully', 'success');
          setIsModalOpen(false);
          await loadData();
        } else {
          showToast(res.message || 'Failed to update slot', 'error');
        }
      } else {
        const res = await fetchApi('/delivery-slots', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          showToast(locale === 'ar' ? 'تم إنشاء فترة التوصيل بنجاح' : 'Delivery slot created successfully', 'success');
          setIsModalOpen(false);
          await loadData();
        } else {
          showToast(res.message || 'Failed to create slot', 'error');
        }
      }
    } catch (err) {
      showToast(err.message || 'Error saving slot', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      const res = await fetchApi(`/delivery-slots/${slot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !slot.is_active }),
      });
      if (res.success) {
        showToast(
          locale === 'ar'
            ? `تم ${!slot.is_active ? 'تفعيل' : 'تعطيل'} الفترة`
            : `Slot ${!slot.is_active ? 'activated' : 'deactivated'}`,
          'success'
        );
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, is_active: !slot.is_active } : s))
        );
      } else {
        showToast(res.message || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الفترة؟' : 'Are you sure you want to delete this delivery slot?')) {
      return;
    }

    try {
      const res = await fetchApi(`/delivery-slots/${slotId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم حذف فترة التوصيل' : 'Delivery slot deleted', 'success');
        await loadData();
      } else {
        showToast(res.message || 'Failed to delete slot', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetchApi('/delivery-slots/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم حفظ إعدادات الجدولة بنجاح' : 'Schedule settings saved successfully', 'success');
      } else {
        showToast(res.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Generate preview dates based on settings
  const previewDates = (() => {
    const dates = [];
    const now = new Date();
    const count = parseInt(settings.days_ahead, 10) || 4;
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 0; i < count; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayNum = d.getDate();
      const mIdx = d.getMonth();
      const wIdx = d.getDay();
      let labelEn = `${dayNamesEn[wIdx]}, ${dayNum} ${monthNamesEn[mIdx]}`;
      let labelAr = `${dayNamesAr[wIdx]}، ${dayNum} ${monthNamesAr[mIdx]}`;
      if (i === 0) {
        labelEn = `Today, ${dayNum} ${monthNamesEn[mIdx]}`;
        labelAr = `اليوم، ${dayNum} ${monthNamesAr[mIdx]}`;
      } else if (i === 1) {
        labelEn = `Tomorrow, ${dayNum} ${monthNamesEn[mIdx]}`;
        labelAr = `غداً، ${dayNum} ${monthNamesAr[mIdx]}`;
      }
      dates.push({ labelEn, labelAr });
    }
    return dates;
  })();

  const activeSlots = slots.filter((s) => s.is_active);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-slate-900 transition-colors">
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {locale === 'ar' ? 'مواعيد وفترات التوصيل' : 'Delivery Slots & Schedule'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {locale === 'ar' ? 'إدارة فترات ومواعيد التوصيل' : 'Delivery Slots & Schedule Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {locale === 'ar'
              ? 'تحكم في المواعيد والفترات المتاحة للعملاء عند إتمام الطلب (Checkout)'
              : 'Configure live delivery windows, express availability, and schedule options shown on checkout'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{locale === 'ar' ? 'إضافة فترة توصيل جديدة' : 'Add Delivery Slot'}</span>
          </button>
        </div>
      </div>

      {/* Live Storefront Checkout Visual Preview Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#05A764]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'ar' ? 'معاينة حية كما تظهر للعميل في صفحة الدفع (Checkout Preview)' : 'Live Storefront Checkout Preview'}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            {activeSlots.length} {locale === 'ar' ? 'فترات نشطة' : 'Active Slots'}
          </span>
        </div>

        {/* The exact Checkout Delivery Schedule visual component */}
        <div className="bg-[#FAFBFD] p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {locale === 'ar' ? 'المواعيد المتاحة للتوصيل:' : 'SCHEDULED WINDOWS AVAILABLE:'}
          </span>

          {/* Date Pills Row */}
          <div className="flex flex-wrap items-center gap-2">
            {previewDates.map((d, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPreviewDateIdx(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
 previewDateIdx === idx
 ? 'bg-slate-900 text-white shadow-2xs'
 : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
 }`}
              >
                {locale === 'ar' ? d.labelAr : d.labelEn}
              </button>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="bg-[#F5F6F8] rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeSlots.length === 0 ? (
              <div className="sm:col-span-3 text-center py-6 text-slate-400 text-xs font-bold">
                {locale === 'ar' ? 'لا توجد فترات توصيل مفعلة حالياً' : 'No active delivery slots configured'}
              </div>
            ) : (
              activeSlots.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setPreviewSlotId(s.id)}
                  className={`p-3 rounded-xl cursor-pointer text-center transition-all bg-white border ${
 previewSlotId === s.id
 ? 'border-[#05A764] ring-2 ring-[#05A764]/20 shadow-2xs'
 : 'border-slate-200/80 hover:border-slate-300'
 }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">
                    {locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : s.slot_label_en}
                  </span>
                  <span
                    className={`text-[10px] font-bold mt-1 inline-block px-2.5 py-0.5 rounded-full ${
 s.is_express
 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
 : 'bg-slate-100 text-slate-600'
 }`}
                  >
                    {locale === 'ar' ? (s.tag_ar || s.tag_en) : s.tag_en}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2-Column: Schedule Settings & Slots Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Schedule Settings (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              {locale === 'ar' ? 'إعدادات الجدولة' : 'Schedule Settings'}
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {locale === 'ar' ? 'عدد الأيام المتاحة للحجز مسبقاً' : 'Days Ahead Available'}
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={settings.days_ahead}
                onChange={(e) => setSettings({ ...settings, days_ahead: parseInt(e.target.value, 10) || 4 })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {locale === 'ar' ? 'كم يوم يظهر للعميل في قائمة التواريخ (الافتراضي 4 أيام)' : 'Number of calendar day pills to display (default: 4)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {locale === 'ar' ? 'توصيل في نفس اليوم' : 'Same-Day Delivery'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {locale === 'ar' ? 'السماح بحجز مواعيد اليوم الحالي' : 'Allow customers to pick Today'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.same_day_delivery_enabled}
                onChange={(e) => setSettings({ ...settings, same_day_delivery_enabled: e.target.checked })}
                className="w-4 h-4 accent-[#05A764] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {locale === 'ar' ? 'وقت الإغلاق للتوصيل في نفس اليوم' : 'Same-Day Cutoff Time'}
              </label>
              <input
                type="time"
                value={settings.same_day_cutoff_time || '18:00'}
                onChange={(e) => setSettings({ ...settings, same_day_cutoff_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {locale === 'ar' ? 'بعد هذا الوقت يتم تعطيل تاريخ اليوم تلقائياً' : 'After this time, Today pill is automatically hidden'}
              </span>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{locale === 'ar' ? 'حفظ إعدادات الجدولة' : 'Save Schedule Settings'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Time Slots List & Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">
                {locale === 'ar' ? 'قائمة فترات التوصيل' : 'Configured Delivery Windows'}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {slots.length} {locale === 'ar' ? 'فترات مسجلة' : 'Total Slots'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#05A764] animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">
                {locale === 'ar' ? 'لم يتم إضافة فترات توصيل بعد' : 'No delivery slots configured yet'}
              </p>
              <button
                onClick={openCreateModal}
                className="text-xs font-bold text-[#05A764] hover:underline cursor-pointer"
              >
                + {locale === 'ar' ? 'إضافة أول فترة' : 'Add First Slot'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
 s.is_active
 ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
 : 'bg-slate-50/80 border-slate-200 opacity-60'
 }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {s.slot_label_en}
                      </span>
                      {s.slot_label_ar && s.slot_label_ar !== s.slot_label_en && (
                        <span className="text-xs font-medium text-slate-400">
                          ({s.slot_label_ar})
                        </span>
                      )}
                      {s.is_express && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5 fill-current text-amber-500" />
                          <span>Express</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                        {s.tag_en}
                      </span>
                      {s.tag_ar && (
                        <span className="text-slate-400">
                          {s.tag_ar}
                        </span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span>Order: {s.display_order}</span>
                      <span className="text-slate-300">•</span>
                      <span>Max: {s.max_orders} orders</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
 s.is_active
 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
 : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
 }`}
                    >
                      {s.is_active ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{s.is_active ? (locale === 'ar' ? 'مفعلة' : 'Active') : (locale === 'ar' ? 'معطلة' : 'Inactive')}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      title={locale === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(s.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                      title={locale === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Delivery Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#05A764]" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSlot
                    ? locale === 'ar'
                      ? 'تعديل فترة التوصيل'
                      : 'Edit Delivery Slot'
                    : locale === 'ar'
                    ? 'إضافة فترة توصيل جديدة'
                    : 'Create New Delivery Slot'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Slot Label (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1:00 PM - 3:00 PM"
                    value={formData.slot_label_en}
                    onChange={(e) => setFormData({ ...formData, slot_label_en: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Slot Label (AR)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 1:00 م - 3:00 م"
                    value={formData.slot_label_ar}
                    onChange={(e) => setFormData({ ...formData, slot_label_ar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Badge Tag (EN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Express Available"
                    value={formData.tag_en}
                    onChange={(e) => setFormData({ ...formData, tag_en: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Badge Tag (AR)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: سريع متوفر"
                    value={formData.tag_ar}
                    onChange={(e) => setFormData({ ...formData, tag_ar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Max Orders Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_orders}
                    onChange={(e) => setFormData({ ...formData, max_orders: parseInt(e.target.value, 10) || 20 })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_express}
                    onChange={(e) => setFormData({ ...formData, is_express: e.target.checked })}
                    className="w-4 h-4 accent-[#05A764] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {locale === 'ar' ? 'فترة توصيل سريع (Express)' : 'Express Delivery Slot'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#05A764] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {locale === 'ar' ? 'فترة مفعلة (Active)' : 'Active Slot'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingSlot ? (locale === 'ar' ? 'تحديث' : 'Update Slot') : (locale === 'ar' ? 'إنشاء' : 'Create Slot')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
