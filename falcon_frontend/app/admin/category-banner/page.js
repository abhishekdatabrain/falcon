'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  Sparkles,
  Save,
  RotateCcw,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Layers,
  Palette,
  Globe,
  ExternalLink,
  Tag,
  ArrowRight,
  HelpCircle,
  FolderTree
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Farm Produce Shelf (Exact Ref)', url: '/banners/farm_fresh_produce.jpg' },
  { label: 'Organic Groceries', url: '/categories/cat_groceries.jpg' },
  { label: 'Fresh Fruits & Veggies', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800' },
  { label: 'Saudi Hydroponic Harvest', url: '/images/about/greenhouse.jpg' },
  { label: 'Local Farm Tomatoes', url: '/images/about/farmer.jpg' },
];

const PRESET_COLORS = [
  { label: 'Forest Green (Default)', hex: '#043927' },
  { label: 'Deep Emerald', hex: '#064E3B' },
  { label: 'Rich Sage', hex: '#0d4030' },
  { label: 'Dark Slate', hex: '#0F172A' },
  { label: 'Olive Bronze', hex: '#2C3E20' },
];

const DEFAULT_BANNER_CONFIG = {
  enabled: true,
  title_en: 'Fresh Farm Fruits & Groceries',
  title_ar: 'فواكه وخضروات طازجة من المزرعة',
  badge1_en: '100% FARM FRESH',
  badge1_ar: 'طازج 100% من المزرعة',
  badge2_en: 'BEST PRICE GUARANTEED',
  badge2_ar: 'أفضل سعر مضمون',
  desc_en: 'Hand-picked 100% certified fresh farm produce, fruits, herbs and whole foods for your daily nutrition. Direct farm-to-table for your family\'s health.',
  desc_ar: 'منتجات مزارع طازجة منتقاة بعناية وموثقة 100٪ للتغذية اليومية لعائلتك، مباشرة من المزرعة إلى مائدتك.',
  image_url: '/banners/farm_fresh_produce.jpg',
  image_badge_en: '🌿 Farm Fresh Produce',
  image_badge_ar: '🌿 منتجات مزارع طازجة',
  bg_color: '#043927',
};

export default function AdminCategoryBannerPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewLocale, setPreviewLocale] = useState('en');

  const [form, setForm] = useState(DEFAULT_BANNER_CONFIG);

  // Load existing banner configuration from API
  useEffect(() => {
    loadBannerConfig();
  }, []);

  const loadBannerConfig = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/category-banner');
      if (res.success && res.data?.banner) {
        setForm({
          ...DEFAULT_BANNER_CONFIG,
          ...res.data.banner,
        });
      }
    } catch (err) {
      console.error('Failed to load category banner config:', err);
      showToast('Could not load banner settings. Using defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetchApi('/category-banner', {
        method: 'PUT',
        body: JSON.stringify({ banner: form }),
      });

      if (res.success) {
        showToast(
          isAr
            ? 'تم حفظ وتحديث بانر صفحة المنتجات بنجاح!'
            : 'Category hero banner saved & published successfully!',
          'success'
        );
        if (res.data?.banner) {
          setForm({ ...DEFAULT_BANNER_CONFIG, ...res.data.banner });
        }
      } else {
        showToast(res.message || 'Failed to save banner', 'error');
      }
    } catch (err) {
      console.error('Save banner error:', err);
      showToast(err.message || 'Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm(isAr ? 'هل أنت متأكد من استعادة الإعدادات الافتراضية؟' : 'Reset all banner fields to defaults?')) {
      setForm(DEFAULT_BANNER_CONFIG);
      showToast(isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to default configuration', 'info');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchApi('/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, image_url: res.data.url }));
        showToast('Image uploaded successfully!', 'success');
      } else {
        showToast(res.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header & Action Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#043927] border border-emerald-200/80">
              <Sparkles className="w-5 h-5 text-[#05A764]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isAr ? 'إدارة بانر المنتجات والفئات (Hero)' : 'Category Hero Banner Management'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-2xl">
            {isAr
              ? 'تحكم بنصوص، شارات، صورة، وألوان البانر الرئيسي الترويجي الذي يظهر في أعلى صفحة المنتجات والكتالوج.'
              : 'Customize the badges, main heading, description, right crate illustration, and background color for the catalog hero banner.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/products"
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'معاينة بالمتجر' : 'View in Store'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'حفظ ونشر التغييرات' : 'Save & Publish'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= LIVE PREVIEW SECTION ================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              {isAr ? 'معاينة حية فورية للبانر' : 'Live Interactive Banner Preview'}
            </h2>
            <span className="bg-emerald-100 text-[#043927] text-[10px] font-black px-2 py-0.5 rounded-full">
              {form.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setPreviewLocale('en')}
              className={`px-3 py-1 rounded-lg transition-all ${
 previewLocale === 'en' ? 'bg-white shadow-2xs text-[#043927]' : 'text-slate-600 hover:text-slate-900'
 }`}
            >
              English Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewLocale('ar')}
              className={`px-3 py-1 rounded-lg transition-all ${
 previewLocale === 'ar' ? 'bg-white shadow-2xs text-[#043927]' : 'text-slate-600 hover:text-slate-900'
 }`}
            >
              العربية (RTL)
            </button>
          </div>
        </div>

        {/* Live Banner Box rendered with exact dimensions & style */}
        <div
          dir={previewLocale === 'ar' ? 'rtl' : 'ltr'}
          style={{ backgroundColor: form.bg_color || '#043927' }}
          className="rounded-3xl p-6 sm:p-8 min-h-[200px] relative overflow-hidden text-white shadow-lg transition-all"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-3 z-10 text-left rtl:text-right">
              <div className="flex items-center gap-2">
                <span className="bg-[#05A764] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  {previewLocale === 'ar' ? (form.badge1_ar || form.badge1_en) : form.badge1_en}
                </span>
                <span className="bg-[#ea580c] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  {previewLocale === 'ar' ? (form.badge2_ar || form.badge2_en) : form.badge2_en}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
                {previewLocale === 'ar' ? (form.title_ar || form.title_en) : form.title_en}
              </h3>

              <p className="text-[#a7f3d0] font-medium text-xs sm:text-sm max-w-2xl leading-relaxed">
                {previewLocale === 'ar' ? (form.desc_ar || form.desc_en) : form.desc_en}
              </p>
            </div>

            {/* Right Crate Illustration Card */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end z-10">
              <div className="relative w-48 sm:w-60 h-36 sm:h-40 bg-emerald-950/80 rounded-2xl border border-emerald-500/30 p-2 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden group">
                <img
                  src={getImageUrl(form.image_url) || '/banners/farm_fresh_produce.jpg'}
                  alt="Banner preview"
                  className="w-full h-full object-cover rounded-xl opacity-95 group-hover:scale-105 transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/banners/farm_fresh_produce.jpg';
                  }}
                />
                <span className="absolute bottom-2 bg-emerald-950/90 text-amber-300 font-bold text-[10px] px-3 py-1 rounded-full border border-amber-400/40 shadow-md whitespace-nowrap max-w-[90%] truncate">
                  {previewLocale === 'ar' ? (form.image_badge_ar || form.image_badge_en) : form.image_badge_en}
                </span>
              </div>
            </div>

          </div>

          {/* Decorative Wave Subtle Highlight */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none bg-gradient-to-l from-emerald-400 to-transparent"></div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          💡 {isAr ? 'هذا البانر سيظهر مباشرة في أعلى صفحة المنتجات لكافة الزوار والعملاء.' : 'This banner is dynamically displayed at the top of the products catalog page.'}
        </p>
      </div>

      {/* ================= FORM CONTROLS GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Text & Badges Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Titles Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Tag className="w-4 h-4 text-[#05A764]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isAr ? 'العنوان الرئيسي والوصف' : 'Banner Title & Descriptions'}
              </h3>
            </div>

            {/* Title EN & AR */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Main Heading (English) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Displayed on English store</span>
                </label>
                <input
                  type="text"
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  placeholder="Fresh Farm Fruits & Groceries"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#043927] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>العنوان الرئيسي (العربية) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">يعرض بالمتجر العربي</span>
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  placeholder="فواكه وخضروات طازجة من المزرعة"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#043927] transition-all"
                />
              </div>
            </div>

            {/* Description EN & AR */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description Subtitle (English)
                </label>
                <textarea
                  rows={2}
                  value={form.desc_en}
                  onChange={(e) => setForm({ ...form, desc_en: e.target.value })}
                  placeholder="Hand-picked 100% certified fresh farm produce..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الوصف التوضيحي (العربية)
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={form.desc_ar}
                  onChange={(e) => setForm({ ...form, desc_ar: e.target.value })}
                  placeholder="منتجات مزارع طازجة منتقاة بعناية..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Badges & Tags Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isAr ? 'شارات وأوسمة البانر العلوية' : 'Pill Badges & Tags'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Badge 1 (Green Pill) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#05A764]"></span>
                  <span className="text-xs font-black text-[#043927]">Badge 1 (Green Pill)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">English</label>
                  <input
                    type="text"
                    value={form.badge1_en}
                    onChange={(e) => setForm({ ...form, badge1_en: e.target.value })}
                    placeholder="100% FARM FRESH"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">العربية</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={form.badge1_ar}
                    onChange={(e) => setForm({ ...form, badge1_ar: e.target.value })}
                    placeholder="طازج 100% من المزرعة"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Badge 2 (Orange Pill) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ea580c]"></span>
                  <span className="text-xs font-black text-amber-900">Badge 2 (Orange Pill)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">English</label>
                  <input
                    type="text"
                    value={form.badge2_en}
                    onChange={(e) => setForm({ ...form, badge2_en: e.target.value })}
                    placeholder="BEST PRICE GUARANTEED"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">العربية</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={form.badge2_ar}
                    onChange={(e) => setForm({ ...form, badge2_ar: e.target.value })}
                    placeholder="أفضل سعر مضمون"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Image & Color Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Crate Image Upload & Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-[#05A764]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isAr ? 'صورة الصندوق التوضيحية والشارة' : 'Illustration Image & Badge'}
              </h3>
            </div>

            {/* Current Image Preview */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
              <img
                src={getImageUrl(form.image_url) || '/banners/farm_fresh_produce.jpg'}
                alt="Banner Illustration"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/banners/farm_fresh_produce.jpg';
                }}
              />
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className="bg-emerald-950/90 text-amber-300 font-bold text-[10px] px-3 py-1 rounded-full border border-amber-400/40 shadow-xs inline-block">
                  {form.image_badge_en}
                </span>
              </div>
            </div>

            {/* Upload Button */}
            <div>
              <label className="border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 text-center block cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-[#05A764] mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-800 block">
                  {uploading ? 'Uploading Image...' : (isAr ? 'رفع صورة جديدة من جهازك' : 'Upload New Banner Image')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  JPG, PNG, WEBP (Max 5MB)
                </span>
              </label>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">Quick Preset Images:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, image_url: preset.url })}
                    className={`p-2 rounded-xl text-left rtl:text-right border text-[11px] font-semibold transition-all flex items-center gap-2 cursor-pointer ${
 form.image_url === preset.url
 ? 'border-emerald-500 bg-emerald-50/60 text-[#043927] font-bold'
 : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
 }`}
                  >
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image URL */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Image URL:</label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="/banners/farm_fresh_produce.jpg or https://..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
              />
            </div>

            {/* Image Badge Text EN & AR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Image Badge (EN)</label>
                <input
                  type="text"
                  value={form.image_badge_en}
                  onChange={(e) => setForm({ ...form, image_badge_en: e.target.value })}
                  placeholder="🌿 Farm Fresh Produce"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">شارة الصورة (AR)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.image_badge_ar}
                  onChange={(e) => setForm({ ...form, image_badge_ar: e.target.value })}
                  placeholder="🌿 منتجات مزارع طازجة"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

          </div>

          {/* Theme & Background Color Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Palette className="w-4 h-4 text-[#05A764]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isAr ? 'لون خلفية البانر' : 'Background Theme & Color'}
              </h3>
            </div>

            {/* Preset Color Swatches */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">Select Color Palette:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {PRESET_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, bg_color: color.hex })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
 form.bg_color === color.hex
 ? 'border-emerald-600 bg-emerald-50 text-[#043927] ring-1 ring-emerald-500'
 : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
 }`}
                  >
                    <span
                      className="w-5 h-5 rounded-lg border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: color.hex }}
                    ></span>
                    <span className="truncate">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hex Color Picker */}
            <div className="flex items-center gap-3 pt-2">
              <div
                className="w-10 h-10 rounded-xl border border-slate-300 shrink-0 shadow-xs"
                style={{ backgroundColor: form.bg_color || '#043927' }}
              ></div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Custom Hex Code:</label>
                <input
                  type="text"
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  placeholder="#043927"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Banner Enabled Toggle */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  {isAr ? 'تفعيل ظهور البانر' : 'Display Banner on Store'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'عند التعطيل لن يظهر البانر في صفحة المنتجات' : 'When disabled, the banner will be hidden'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
 form.enabled ? 'bg-[#043927] justify-end' : 'bg-slate-300 justify-start'
 }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
