'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  Sparkles,
  Save,
  RefreshCw,
  Loader2,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Eye,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sliders,
  Shield,
  Truck,
  Leaf,
  Layers,
  Palette
} from 'lucide-react';

const PRESET_BG_COLORS = [
  { name: 'Warm Cream (Default)', hex: '#FAF7F0' },
  { name: 'Fresh Mint', hex: '#F6FFF8' },
  { name: 'Soft Emerald', hex: '#F0FDF4' },
  { name: 'Light Amber', hex: '#FFFBEB' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

export default function AdminFeaturedBannerPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewLocale, setPreviewLocale] = useState(locale || 'en');
  const [sectionId, setSectionId] = useState(null);
  const [isActive, setIsActive] = useState(true);

  // Form State matching exact fields
  const [formData, setFormData] = useState({
    banner_mode: 'split_content', // 'split_content' | 'full_banner'
    image_url: '/banners/household_products_exact.png',
    full_banner_url: '/banners/household_banner_exact.png',
    category_tag_en: 'HOUSEHOLD ESSENTIALS',
    category_tag_ar: 'مستلزمات منزلية',
    headline_en_1: 'A Cleaner Home,',
    headline_ar_1: '،منزل أكثر نظافة',
    headline_en_2: 'A Happier You.',
    headline_ar_2: 'وحياة أكثر سعادة.',
    desc_en: 'Quality household essentials for a fresher, cleaner and more comfortable home.',
    desc_ar: 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.',
    btn_text_en: 'Shop Now',
    btn_text_ar: 'تسوق الآن',
    btn_link: '/products?category=household',
    badge_1_en: 'Trusted Brands',
    badge_1_ar: 'علامات موثوقة',
    badge_2_en: 'Fast & Reliable Delivery',
    badge_2_ar: 'توصيل سريع وموثوق',
    badge_3_en: 'Everyday Value',
    badge_3_ar: 'قيمة يومية',
    bg_color: '#FAF7F0',
  });

  // Fetch Banner Data from CMS API
  const loadBannerData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/homepage-cms/admin/all');
      if (res.success && res.data?.sections) {
        const found = res.data.sections.find((s) => s.section_key === 'household_featured');
        if (found) {
          setSectionId(found.id);
          setIsActive(found.draft_is_active !== undefined ? found.draft_is_active : found.is_active);
          const cfg = found.draft_config || found.config || {};
          setFormData((prev) => ({
            ...prev,
            ...cfg,
            banner_mode: cfg.banner_mode || 'split_content',
            image_url: cfg.image_url || '/banners/household_products_exact.png',
            full_banner_url: cfg.full_banner_url || '/banners/household_banner_exact.png',
            category_tag_en: cfg.category_tag_en || 'HOUSEHOLD ESSENTIALS',
            category_tag_ar: cfg.category_tag_ar || 'مستلزمات منزلية',
            headline_en_1: cfg.headline_en_1 || 'A Cleaner Home,',
            headline_ar_1: cfg.headline_ar_1 || '،منزل أكثر نظافة',
            headline_en_2: cfg.headline_en_2 || 'A Happier You.',
            headline_ar_2: cfg.headline_ar_2 || 'وحياة أكثر سعادة.',
            desc_en: cfg.desc_en || 'Quality household essentials for a fresher, cleaner and more comfortable home.',
            desc_ar: cfg.desc_ar || 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.',
            btn_text_en: cfg.btn_text_en || 'Shop Now',
            btn_text_ar: cfg.btn_text_ar || 'تسوق الآن',
            btn_link: cfg.btn_link || '/products?category=household',
            badge_1_en: cfg.badge_1_en || 'Trusted Brands',
            badge_1_ar: cfg.badge_1_ar || 'علامات موثوقة',
            badge_2_en: cfg.badge_2_en || 'Fast & Reliable Delivery',
            badge_2_ar: cfg.badge_2_ar || 'توصيل سريع وموثوق',
            badge_3_en: cfg.badge_3_en || 'Everyday Value',
            badge_3_ar: cfg.badge_3_ar || 'قيمة يومية',
            bg_color: cfg.bg_color || '#FAF7F0',
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching banner data:', err);
      showToast(err.message || 'Failed to load banner configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBannerData();
  }, []);

  // Handle Image Upload
  const handleImageUpload = async (e, field = 'image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetchApi('/upload', {
        method: 'POST',
        body: fd,
      });

      if (res.success && res.data?.url) {
        setFormData((prev) => ({
          ...prev,
          [field]: res.data.url,
        }));
        showToast(locale === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully!', 'success');
      } else {
        showToast(res.message || 'Failed to upload image', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error uploading image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset Image to Default
  const handleResetImage = () => {
    setFormData((prev) => ({
      ...prev,
      image_url: '/banners/household_products_exact.png',
      full_banner_url: '/banners/household_banner_exact.png',
    }));
    showToast(locale === 'ar' ? 'تمت استعادة الصورة الافتراضية' : 'Reset to default image', 'info');
  };

  // Save Banner Changes
  const handleSave = async (publishImmediately = true) => {
    if (!sectionId) {
      showToast('Section ID not found', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title_en: 'Household Essentials Featured Banner',
        title_ar: 'بانر المستلزمات المنزلية المميز',
        config: formData,
        is_active: isActive,
        publish_immediately: publishImmediately,
      };

      const res = await fetchApi(`/homepage-cms/admin/section/${sectionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        // Also call publish endpoint if publishImmediately is true
        if (publishImmediately) {
          await fetchApi('/homepage-cms/admin/publish', { method: 'POST' }).catch(() => {});
        }
        showToast(
          locale === 'ar'
            ? 'تم حفظ ونشر البانر المميز بنجاح!'
            : 'Featured Banner saved & published live!',
          'success'
        );
        loadBannerData();
      } else {
        showToast(res.message || 'Failed to save banner', 'error');
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      showToast(err.message || 'Error saving banner configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isAr = previewLocale === 'ar';
  const tagText = isAr ? formData.category_tag_ar : formData.category_tag_en;
  const h1Text = isAr ? formData.headline_ar_1 : formData.headline_en_1;
  const h2Text = isAr ? formData.headline_ar_2 : formData.headline_en_2;
  const descText = isAr ? formData.desc_ar : formData.desc_en;
  const btnText = isAr ? formData.btn_text_ar : formData.btn_text_en;
  const badge1 = isAr ? formData.badge_1_ar : formData.badge_1_en;
  const badge2 = isAr ? formData.badge_2_ar : formData.badge_2_en;
  const badge3 = isAr ? formData.badge_3_ar : formData.badge_3_en;
  const currentImg = formData.banner_mode === 'full_banner' ? formData.full_banner_url : formData.image_url;

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#043927] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              {locale === 'ar' ? 'إدارة بانر الصفحة الرئيسية المميز' : 'Homepage Featured Banner Management'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              Household Banner
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {locale === 'ar'
              ? 'تخصيص البانر العريض في الصفحة الرئيسية: العناوين، الصورة، شارات الثقة، وزر الشراء مع معاينة حية'
              : 'Customize the featured wide banner on the storefront: texts, showcase image, trust badges, and direct button link with live preview'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Status Toggle */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isActive ? (locale === 'ar' ? 'ظاهر بالمتجر' : 'Visible on Storefront') : (locale === 'ar' ? 'مخفي' : 'Hidden')}</span>
          </button>

          <button
            type="button"
            onClick={loadBannerData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#043927] animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">
            {locale === 'ar' ? 'جارٍ تحميل إعدادات البانر...' : 'Loading banner configuration...'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. REAL-TIME LIVE PREVIEW CARD */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  {locale === 'ar' ? 'معاينة حية فورية كما تظهر في المتجر' : 'Live Interactive Storefront Preview'}
                </h3>
              </div>

              {/* Preview Language Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Preview Language:</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewLocale('en')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      previewLocale === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    English (LTR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLocale('ar')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      previewLocale === 'ar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    العربية (RTL)
                  </button>
                </div>
              </div>
            </div>

            {/* The Actual Rendered Banner Matching Image 2 */}
            <div className="pt-1">
              {formData.banner_mode === 'full_banner' ? (
                <div className="rounded-[24px] sm:rounded-[32px] overflow-hidden border border-amber-200/60 shadow-md relative group bg-[#FAF7F0] aspect-[1024/315]">
                  <img
                    src={getImageUrl(formData.full_banner_url || '/banners/household_banner_exact.png')}
                    alt="Full Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/banners/household_banner_exact.png';
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{ backgroundColor: formData.bg_color || '#FAF7F0' }}
                  dir={isAr ? 'rtl' : 'ltr'}
                  className="rounded-[24px] sm:rounded-[32px] overflow-hidden border border-amber-200/70 shadow-sm relative font-sans transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                    {/* Left Column: Text Content */}
                    <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-4">
                      {/* Category Tag */}
                      <span className="text-[#043927] font-black text-xs sm:text-[13px] uppercase tracking-[0.22em] block">
                        {tagText || 'HOUSEHOLD ESSENTIALS'}
                      </span>

                      {/* Headlines */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.15]">
                          <span className="text-[#043927] block">{h1Text || 'A Cleaner Home,'}</span>
                          <span className="text-[#C68A27] inline-block mt-0.5">{h2Text || 'A Happier You.'}</span>
                        </h2>
                        <div className="inline-block self-end mb-2">
                          <svg className="w-6 h-6 text-[#043927] fill-[#043927]" viewBox="0 0 24 24">
                            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                          </svg>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[#475569] font-medium text-xs sm:text-sm max-w-md leading-relaxed">
                        {descText || 'Quality household essentials for a fresher, cleaner and more comfortable home.'}
                      </p>

                      {/* Button */}
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#043927] text-white font-bold text-xs sm:text-sm shadow-md">
                          <span>{btnText || 'Shop Now'}</span>
                          <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                        </span>
                      </div>

                      {/* Trust Badges Bar */}
                      <div className="pt-4 border-t border-amber-200/50 flex flex-wrap items-center gap-4 text-xs font-bold text-[#043927]">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-[#043927]" />
                          <span>{badge1 || 'Trusted Brands'}</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#043927]" />
                          <span>{badge2 || 'Fast & Reliable Delivery'}</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1.5">
                          <Leaf className="w-4 h-4 text-[#043927]" />
                          <span>{badge3 || 'Everyday Value'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Image */}
                    <div className="lg:col-span-5 p-6 flex items-center justify-center">
                      <div className="w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center p-2">
                        <img
                          src={getImageUrl(currentImg)}
                          alt="Showcase Products"
                          className="w-full h-full object-contain drop-shadow-md"
                          onError={(e) => {
                            e.target.src = '/banners/household_products_exact.png';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. CONFIGURATION CONTROLS FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Text Content & Customization */}
            <div className="lg:col-span-8 space-y-6">
              {/* Layout Mode Selector Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {locale === 'ar' ? 'وضع تصميم البانر' : 'Banner Display Mode'}
                    </h3>
                  </div>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, banner_mode: 'split_content' })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        formData.banner_mode !== 'full_banner'
                          ? 'bg-white text-[#043927] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {locale === 'ar' ? 'تصميم ديناميكي (نص + صورة)' : 'Dynamic Layout (Text + Image)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, banner_mode: 'full_banner' })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        formData.banner_mode === 'full_banner'
                          ? 'bg-white text-[#043927] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {locale === 'ar' ? 'صورة بانر كاملة (1024x315)' : 'Full Banner Image'}
                    </button>
                  </div>
                </div>

                {/* Multilingual Text Inputs */}
                <div className="space-y-4">
                  {/* Category Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Category Tag (EN)
                      </label>
                      <input
                        type="text"
                        value={formData.category_tag_en}
                        onChange={(e) => setFormData({ ...formData, category_tag_en: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Category Tag (AR)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={formData.category_tag_ar}
                        onChange={(e) => setFormData({ ...formData, category_tag_ar: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none text-right font-sans"
                      />
                    </div>
                  </div>

                  {/* Headline Line 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Headline Line 1 (EN - Green)
                      </label>
                      <input
                        type="text"
                        value={formData.headline_en_1}
                        onChange={(e) => setFormData({ ...formData, headline_en_1: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Headline Line 1 (AR - Green)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={formData.headline_ar_1}
                        onChange={(e) => setFormData({ ...formData, headline_ar_1: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-900 focus:bg-white focus:border-emerald-600 focus:outline-none text-right font-sans"
                      />
                    </div>
                  </div>

                  {/* Headline Line 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Headline Line 2 (EN - Gold/Amber)
                      </label>
                      <input
                        type="text"
                        value={formData.headline_en_2}
                        onChange={(e) => setFormData({ ...formData, headline_en_2: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Headline Line 2 (AR - Gold/Amber)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={formData.headline_ar_2}
                        onChange={(e) => setFormData({ ...formData, headline_ar_2: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 focus:bg-white focus:border-emerald-600 focus:outline-none text-right font-sans"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Description (EN)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.desc_en}
                        onChange={(e) => setFormData({ ...formData, desc_en: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Description (AR)
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={formData.desc_ar}
                        onChange={(e) => setFormData({ ...formData, desc_ar: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed text-right font-sans"
                      />
                    </div>
                  </div>

                  {/* Button & Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Button Text (EN)
                      </label>
                      <input
                        type="text"
                        value={formData.btn_text_en}
                        onChange={(e) => setFormData({ ...formData, btn_text_en: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Button Text (AR)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={formData.btn_text_ar}
                        onChange={(e) => setFormData({ ...formData, btn_text_ar: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white text-right font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Button Action Link
                      </label>
                      <input
                        type="text"
                        value={formData.btn_link}
                        onChange={(e) => setFormData({ ...formData, btn_link: e.target.value })}
                        placeholder="/products?category=household"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {locale === 'ar' ? 'شارات ومزايا الثقة السفلية' : 'Trust Badges Customization'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Badge 1 */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-700" /> Badge 1 (Brands)
                    </span>
                    <input
                      type="text"
                      value={formData.badge_1_en}
                      onChange={(e) => setFormData({ ...formData, badge_1_en: e.target.value })}
                      placeholder="Trusted Brands"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.badge_1_ar}
                      onChange={(e) => setFormData({ ...formData, badge_1_ar: e.target.value })}
                      placeholder="علامات موثوقة"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-sans"
                    />
                  </div>

                  {/* Badge 2 */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-700" /> Badge 2 (Delivery)
                    </span>
                    <input
                      type="text"
                      value={formData.badge_2_en}
                      onChange={(e) => setFormData({ ...formData, badge_2_en: e.target.value })}
                      placeholder="Fast & Reliable Delivery"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.badge_2_ar}
                      onChange={(e) => setFormData({ ...formData, badge_2_ar: e.target.value })}
                      placeholder="توصيل سريع وموثوق"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-sans"
                    />
                  </div>

                  {/* Badge 3 */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-700" /> Badge 3 (Value)
                    </span>
                    <input
                      type="text"
                      value={formData.badge_3_en}
                      onChange={(e) => setFormData({ ...formData, badge_3_en: e.target.value })}
                      placeholder="Everyday Value"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.badge_3_ar}
                      onChange={(e) => setFormData({ ...formData, badge_3_ar: e.target.value })}
                      placeholder="قيمة يومية"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Image Management & Color Picker */}
            <div className="lg:col-span-4 space-y-6">
              {/* Image Upload Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {formData.banner_mode === 'full_banner' ? 'Full Banner Image' : 'Showcase Products Image'}
                    </h3>
                  </div>
                </div>

                {/* Current Image Box */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[160px] relative overflow-hidden group">
                  <img
                    src={getImageUrl(currentImg)}
                    alt="Selected Showcase"
                    className="max-h-36 object-contain"
                    onError={(e) => {
                      e.target.src = '/banners/household_products_exact.png';
                    }}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>

                {/* Upload Actions */}
                <div className="flex flex-col gap-2">
                  <label className="w-full py-2.5 px-4 bg-[#043927] hover:bg-[#03291c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload New Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e, formData.banner_mode === 'full_banner' ? 'full_banner_url' : 'image_url')
                      }
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Image URL / Path:</span>
                  <input
                    type="text"
                    value={currentImg}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (formData.banner_mode === 'full_banner') {
                        setFormData({ ...formData, full_banner_url: val });
                      } else {
                        setFormData({ ...formData, image_url: val });
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Background Color Picker Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Palette className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {locale === 'ar' ? 'لون الخلفية للبانر' : 'Background Color'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.bg_color || '#FAF7F0'}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.bg_color || '#FAF7F0'}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Preset Palettes:</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {PRESET_BG_COLORS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, bg_color: preset.hex })}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            formData.bg_color === preset.hex
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-slate-100 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span>{preset.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{preset.hex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. BOTTOM ACTION SAVE BAR (Client Convenience) */}
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center border border-emerald-200/70 shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {locale === 'ar' ? 'جاهز للنشر على المتجر' : 'Ready to Publish to Storefront'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {locale === 'ar'
                    ? 'سيتم تحديث البانر في الصفحة الرئيسية فور الضغط على حفظ ونشر'
                    : 'Changes will immediately reflect on the customer homepage upon saving.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={loadBannerData}
                disabled={loading || saving}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{locale === 'ar' ? 'تراجع / تحديث' : 'Discard / Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || loading}
                className="py-3 px-7 text-xs sm:text-sm font-black bg-[#043927] hover:bg-[#03291c] text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'حفظ ونشر التعديلات' : 'Save & Publish Live'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
