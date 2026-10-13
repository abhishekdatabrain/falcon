'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  FolderTree,
  ShoppingBag,
  Sliders,
  Eye,
  Check,
  Plus,
  Trash2,
  Edit,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Loader2,
  Save,
  RotateCcw,
  Upload,
  Globe,
  Settings,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  GripVertical,
  Image as ImageIcon
} from 'lucide-react';

const SECTION_TYPE_BADGES = {
  HERO_BANNER: { label: 'Hero Banner Slider', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  CATEGORY_SHOWCASE: { label: 'Category Showcase', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PRODUCT_GRID: { label: 'Product Grid / Carousel', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  PROMO_BANNER: { label: 'Promotional Banners', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  CUSTOM_CONTENT: { label: 'Custom Content Banner', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
};

export default function AdminHomepageCmsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('layout'); // 'layout' | 'header_footer' | 'quick_links'
  const [sections, setSections] = useState([]);
  const [settings, setSettings] = useState({});
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Section Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({
    title_en: '',
    title_ar: '',
    subtitle_en: '',
    subtitle_ar: '',
    config: {},
  });

  // Live Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Settings Form State
  const [announcementForm, setAnnouncementForm] = useState({
    enabled: true,
    text_en: '',
    text_ar: '',
    bg_color: '#043927',
    text_color: '#FFFFFF',
  });
  const [footerForm, setFooterForm] = useState({
    company_name: 'Falcon Supermarket',
    phone: '',
    email: '',
    address_en: '',
    address_ar: '',
    social_links: { twitter: '', instagram: '', facebook: '' },
  });

  // Load CMS Data
  const loadCmsData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/homepage-cms/admin/all');
      if (res.success) {
        setSections(res.data?.sections || []);
        const s = res.data?.settings || {};
        setSettings(s);
        setHasUnpublished(Boolean(res.data?.has_unpublished_changes));

        // Populate header/footer forms
        if (s.announcement_bar) {
          const val = s.announcement_bar.draft || s.announcement_bar.live || {};
          setAnnouncementForm({
            enabled: val.enabled !== undefined ? val.enabled : true,
            text_en: val.text_en || '',
            text_ar: val.text_ar || '',
            bg_color: val.bg_color || '#043927',
            text_color: val.text_color || '#FFFFFF',
          });
        }
        if (s.footer_config) {
          const val = s.footer_config.draft || s.footer_config.live || {};
          setFooterForm({
            company_name: val.company_name || 'Falcon Supermarket',
            phone: val.phone || '',
            email: val.email || '',
            address_en: val.address_en || '',
            address_ar: val.address_ar || '',
            social_links: val.social_links || { twitter: '', instagram: '', facebook: '' },
          });
        }
      } else {
        showToast(res.message || 'Failed to load CMS data', 'error');
      }
    } catch (err) {
      console.error('Error fetching CMS data:', err);
      showToast(err.message || 'Failed to load CMS configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  // Reorder Sections in Draft
  const handleMoveSection = async (index, direction) => {
    const updated = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const orderList = updated.map((sec, idx) => ({
      id: sec.id,
      display_order: idx + 1,
    }));

    setSections(updated.map((sec, idx) => ({ ...sec, draft_display_order: idx + 1, has_unpublished_changes: true })));
    setHasUnpublished(true);

    try {
      await fetchApi('/homepage-cms/admin/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderList, publish_immediately: false }),
      });
      showToast(locale === 'ar' ? 'تم تحديث الترتيب بالمسودة' : 'Section order updated in draft', 'info');
    } catch (err) {
      showToast('Failed to save order change', 'error');
      loadCmsData();
    }
  };

  // Toggle Section Visibility in Draft
  const handleToggleDraft = async (id) => {
    try {
      const res = await fetchApi(`/homepage-cms/admin/section/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res.success) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  draft_is_active: res.data?.draft_is_active,
                  has_unpublished_changes: true,
                }
              : s
          )
        );
        setHasUnpublished(true);
        showToast(locale === 'ar' ? 'تم تعديل ظهور القسم بالمسودة' : 'Section visibility updated in draft', 'info');
      }
    } catch (err) {
      showToast('Failed to toggle section', 'error');
    }
  };

  // Open Edit Section Modal
  const handleOpenEditSection = (section) => {
    setEditingSection(section);
    const cfg = section.draft_config || section.config || {};
    setSectionFormData({
      title_en: section.title_en || '',
      title_ar: section.title_ar || '',
      subtitle_en: section.subtitle_en || '',
      subtitle_ar: section.subtitle_ar || '',
      config: cfg,
    });
    setIsEditModalOpen(true);
  };

  // Handle banner image upload
  const handleBannerImageUpload = async (e, targetKey = 'image_url') => {
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
        setSectionFormData((prev) => ({
          ...prev,
          config: {
            ...prev.config,
            [targetKey]: res.data.url,
            ...(targetKey === 'image_url' && prev.config?.banner_mode === 'full_banner' ? { full_banner_url: res.data.url } : {}),
          },
        }));
        showToast(locale === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully!', 'success');
      } else {
        showToast(res.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Section Configuration in Draft or Publish Immediately
  const handleSaveSection = async (e, publishNow = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingSection) return;

    try {
      setSaving(true);
      const res = await fetchApi(`/homepage-cms/admin/section/${editingSection.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title_en: sectionFormData.title_en,
          title_ar: sectionFormData.title_ar,
          subtitle_en: sectionFormData.subtitle_en,
          subtitle_ar: sectionFormData.subtitle_ar,
          config: sectionFormData.config,
          publish_immediately: publishNow,
        }),
      });

      if (res.success) {
        showToast(
          publishNow
            ? (locale === 'ar' ? '✓ تم نشر القسم مباشرة على المتجر بنجاح' : '✓ Section published live to storefront!')
            : (locale === 'ar' ? 'تم حفظ التعديلات في المسودة' : 'Section changes saved to draft'),
          'success'
        );
        setIsEditModalOpen(false);
        setHasUnpublished(!publishNow);
        loadCmsData();
      } else {
        showToast(res.message || 'Failed to update section', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error saving section', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Publish All Changes to Live Storefront
  const handlePublishAll = async () => {
    try {
      setPublishing(true);
      const res = await fetchApi('/homepage-cms/admin/publish', {
        method: 'POST',
      });
      if (res.success) {
        showToast(
          locale === 'ar'
            ? '✓ تم نشر جميع التعديلات مباشرة على واجهة المتجر بنجاح!'
            : '✓ All homepage changes successfully published live to the storefront!',
          'success'
        );
        setHasUnpublished(false);
        loadCmsData();
      } else {
        showToast(res.message || 'Failed to publish changes', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error publishing changes', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Discard All Draft Changes
  const handleDiscardDraft = async () => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من التراجع عن جميع تعديلات المسودة؟' : 'Are you sure you want to discard all unpublished draft changes?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetchApi('/homepage-cms/admin/discard-draft', {
        method: 'POST',
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم التراجع عن مسودة التعديلات' : 'Draft changes discarded. Reverted to live version.', 'info');
        setHasUnpublished(false);
        loadCmsData();
      } else {
        showToast(res.message || 'Failed to discard draft', 'error');
      }
    } catch (err) {
      showToast('Error discarding draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Settings (Announcement Bar & Footer)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all([
        fetchApi('/homepage-cms/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({
            setting_key: 'announcement_bar',
            value: announcementForm,
            publish_immediately: false,
          }),
        }),
        fetchApi('/homepage-cms/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({
            setting_key: 'footer_config',
            value: footerForm,
            publish_immediately: false,
          }),
        }),
      ]);

      showToast(locale === 'ar' ? 'تم حفظ إعدادات الهيدر والفوتر في المسودة' : 'Header & Footer settings saved to draft', 'success');
      setHasUnpublished(true);
      loadCmsData();
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async () => {
    try {
      const res = await fetchApi('/homepage-cms/preview');
      if (res.success) {
        setPreviewData(res.data);
        setIsPreviewOpen(true);
      } else {
        showToast('Failed to load preview data', 'error');
      }
    } catch (err) {
      showToast('Error preparing preview', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. Header Banner & Publishing Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#043927] text-white rounded-2xl shadow-sm">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {locale === 'ar' ? 'إدارة الصفحة الرئيسية (CMS)' : 'Homepage CMS Management'}
                </h1>
                {hasUnpublished && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'تعديلات غير منشورة' : 'Unpublished Changes'}</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {locale === 'ar'
                  ? 'بناء وترتيب أقسام الصفحة الرئيسية، البنرات، عروض الفئات وإعدادات الهيدر والفوتر'
                  : 'Drag-and-drop homepage layout builder, hero banners, category showcase, and header/footer settings'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Preview Button */}
            <button
              onClick={handleOpenPreview}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>{locale === 'ar' ? 'معاينة حية' : 'Preview Changes'}</span>
            </button>

            {/* Discard Draft Button */}
            {hasUnpublished && (
              <button
                onClick={handleDiscardDraft}
                className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تراجع عن المسودة' : 'Discard Draft'}</span>
              </button>
            )}

            {/* Publish Changes Button */}
            <button
              onClick={handlePublishAll}
              disabled={publishing || !hasUnpublished}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer ${
                hasUnpublished
                  ? 'bg-[#043927] hover:bg-[#03291c] text-white ring-2 ring-emerald-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === 'ar' ? 'جارٍ النشر...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'نشر التعديلات للمتجر' : 'Publish Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CMS Sub-modules Navigation Bar */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-4 flex-wrap">
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'layout'
                ? 'bg-[#043927] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{locale === 'ar' ? 'مخطط وترتيب الأقسام' : 'Layout & Sections Builder'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {sections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('header_footer')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'header_footer'
                ? 'bg-[#043927] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إعدادات الهيدر والفوتر' : 'Header & Footer CMS'}</span>
          </button>

          {/* Quick links to existing dedicated modules */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/admin/hero-banners"
              className="text-xs font-bold text-slate-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1 border border-slate-200/60"
            >
              <span>{locale === 'ar' ? 'البنرات الرئيسية' : 'Hero Banners'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
              href="/admin/promo-banners"
              className="text-xs font-bold text-slate-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1 border border-slate-200/60"
            >
              <span>{locale === 'ar' ? 'البطاقات الترويجية' : 'Promo Cards'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
              href="/admin/category-sections"
              className="text-xs font-bold text-slate-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1 border border-slate-200/60"
            >
              <span>{locale === 'ar' ? 'معرض الفئات' : 'Category Showcase'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTENT */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#043927] mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            {locale === 'ar' ? 'جارٍ تحميل بيانات الصفحة الرئيسية...' : 'Loading homepage CMS structure...'}
          </p>
        </div>
      ) : activeTab === 'layout' ? (
        /* SECTION BUILDER & REORDERING */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-slate-900">
                {locale === 'ar' ? 'ترتيب وتخصيص أقسام الصفحة الرئيسية' : 'Active Storefront Section Pipeline'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? 'استخدم الأسهم لتغيير الترتيب، وزر التفعيل لإخفاء أو إظهار أي قسم على المتجر'
                  : 'Reorder sections, toggle visibility, and configure parameters for each section.'}
              </p>
            </div>
            <button
              onClick={loadCmsData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {sections.map((sec, idx) => {
              const typeBadge = SECTION_TYPE_BADGES[sec.section_type] || {
                label: sec.section_type,
                color: 'bg-slate-100 text-slate-700 border-slate-200',
              };
              const isActiveInDraft = sec.draft_is_active !== undefined ? sec.draft_is_active : sec.is_active;

              return (
                <div
                  key={sec.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    !isActiveInDraft ? 'opacity-65 bg-slate-50/80 border-slate-200' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Order buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMoveSection(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Order Number Badge */}
                    <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-black text-xs text-slate-800 font-mono shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Section Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 font-sans">
                          {sec.title_en}
                        </h3>
                        <span className="text-xs text-slate-400 font-bold">/</span>
                        <span className="text-sm font-bold text-slate-700 font-sans">{sec.title_ar}</span>

                        {sec.has_unpublished_changes && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Draft
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        Key: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{sec.section_key}</code>
                        {sec.subtitle_en ? ` • ${sec.subtitle_en}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status Toggle */}
                  <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleDraft(sec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActiveInDraft
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {isActiveInDraft
                        ? locale === 'ar'
                          ? 'ظاهر بالمتجر'
                          : 'Visible'
                        : locale === 'ar'
                        ? 'مخفي'
                        : 'Hidden'}
                    </button>

                    {/* Edit config */}
                    <button
                      onClick={() => handleOpenEditSection(sec)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{locale === 'ar' ? 'تخصيص' : 'Configure'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* HEADER & FOOTER SETTINGS TAB */
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Announcement Bar Settings */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {locale === 'ar' ? 'شريط الإعلانات العلوي (Announcement Bar)' : 'Top Announcement Bar'}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === 'ar'
                    ? 'رسالة العروض الترويجية في أعلى الموقع'
                    : 'Highlight promotional announcements, free delivery notices, or discount codes'}
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementForm.enabled}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#043927]"
                />
                <span className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'تفعيل الشريط' : 'Enable Bar'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'النص بالإنجليزية' : 'Announcement Text (EN)'}
                </label>
                <input
                  type="text"
                  value={announcementForm.text_en}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, text_en: e.target.value })}
                  placeholder="e.g. Free delivery on orders over 150 SAR! Code: FREESHIP"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'النص بالعربية' : 'Announcement Text (AR)'}
                </label>
                <input
                  type="text"
                  value={announcementForm.text_ar}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, text_ar: e.target.value })}
                  placeholder="مثال: توصيل مجاني للطلبات فوق 150 ريال!"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white text-right font-sans"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'لون الخلفية:' : 'Background Color:'}
                </label>
                <input
                  type="color"
                  value={announcementForm.bg_color}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, bg_color: e.target.value })}
                  className="w-7 h-7 rounded-md cursor-pointer border p-0.5"
                />
                <span className="text-xs font-mono font-bold text-slate-500">{announcementForm.bg_color}</span>
              </div>
            </div>
          </div>

          {/* Footer Configuration */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {locale === 'ar' ? 'إعدادات الفوتر ومعلومات التواصل' : 'Footer & Contact Information'}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? 'بيانات الاتصال، العنوان وروابط وسائل التواصل الظاهرة في أسفل الصفحة'
                  : 'Manage store support email, hotline, location, and social media handles'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'اسم الشركة' : 'Company Name'}
                </label>
                <input
                  type="text"
                  value={footerForm.company_name}
                  onChange={(e) => setFooterForm({ ...footerForm, company_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'رقم الهاتف / خدمة العملاء' : 'Support Phone'}
                </label>
                <input
                  type="text"
                  value={footerForm.phone}
                  onChange={(e) => setFooterForm({ ...footerForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Support Email'}
                </label>
                <input
                  type="email"
                  value={footerForm.email}
                  onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'العنوان (الإنجليزية)' : 'Address (EN)'}
                </label>
                <input
                  type="text"
                  value={footerForm.address_en}
                  onChange={(e) => setFooterForm({ ...footerForm, address_en: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {locale === 'ar' ? 'العنوان (العربية)' : 'Address (AR)'}
                </label>
                <input
                  type="text"
                  value={footerForm.address_ar}
                  onChange={(e) => setFooterForm({ ...footerForm, address_ar: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white text-right font-sans"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                {locale === 'ar' ? 'روابط مواقع التواصل الاجتماعي' : 'Social Media Links'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Twitter / X URL"
                  value={footerForm.social_links.twitter || ''}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      social_links: { ...footerForm.social_links, twitter: e.target.value },
                    })
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
                <input
                  type="text"
                  placeholder="Instagram URL"
                  value={footerForm.social_links.instagram || ''}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      social_links: { ...footerForm.social_links, instagram: e.target.value },
                    })
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
                <input
                  type="text"
                  placeholder="Facebook URL"
                  value={footerForm.social_links.facebook || ''}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      social_links: { ...footerForm.social_links, facebook: e.target.value },
                    })
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#043927] hover:bg-[#032b1d] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'حفظ إعدادات الهيدر والفوتر' : 'Save Header & Footer'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. SECTION EDIT MODAL */}
      {isEditModalOpen && editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#043927] text-white rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'تخصيص القسم' : 'Configure Section'}: {editingSection.title_en}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Key: {editingSection.section_key} • Type: {editingSection.section_type}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {locale === 'ar' ? 'عنوان القسم (EN)' : 'Section Title (EN)'}
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.title_en}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, title_en: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {locale === 'ar' ? 'عنوان القسم (AR)' : 'Section Title (AR)'}
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.title_ar}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, title_ar: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white text-right font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {locale === 'ar' ? 'العنوان الفرعي (EN)' : 'Subtitle (EN)'}
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.subtitle_en}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, subtitle_en: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {locale === 'ar' ? 'العنوان الفرعي (AR)' : 'Subtitle (AR)'}
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.subtitle_ar}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, subtitle_ar: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white text-right font-sans"
                  />
                </div>
              </div>

              {/* Special configuration fields depending on section_key */}
              {editingSection.section_key === 'household_featured' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-[#043927] rounded-lg">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {locale === 'ar' ? 'تخصيص البانر والنصوص والصورة' : 'Household Banner Content & Image Management'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {locale === 'ar'
                            ? 'تحكم في وضع العرض، النصوص الإنجليزية والعربية، وصورة المنتجات أو البانر الكامل'
                            : 'Manage display layout, multilingual text, button, trust badges and product image/banner'}
                        </p>
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          setSectionFormData({
                            ...sectionFormData,
                            config: { ...sectionFormData.config, banner_mode: 'split_content' },
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          sectionFormData.config?.banner_mode !== 'full_banner'
                            ? 'bg-white text-[#043927] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {locale === 'ar' ? 'تصميم ديناميكي (نص + صورة)' : 'Dynamic Layout'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSectionFormData({
                            ...sectionFormData,
                            config: { ...sectionFormData.config, banner_mode: 'full_banner' },
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          sectionFormData.config?.banner_mode === 'full_banner'
                            ? 'bg-white text-[#043927] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {locale === 'ar' ? 'بانر كامل (صورة مدمجة)' : 'Full Banner Image'}
                      </button>
                    </div>
                  </div>

                  {/* 1. Image Upload & Selection Card */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-3">
                    <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                      <span>
                        {sectionFormData.config?.banner_mode === 'full_banner'
                          ? (locale === 'ar' ? 'صورة البانر الكامل (عرض 1024 × 315)' : 'Full Master Banner Image (1024x315)')
                          : (locale === 'ar' ? 'صورة المنتجات المميزة (الجهة اليمنى)' : 'Featured Products Showcase Image (Right Side)')}
                      </span>
                      {uploadingImage && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{locale === 'ar' ? 'جارٍ رفع الصورة...' : 'Uploading image...'}</span>
                        </span>
                      )}
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Current Image Preview */}
                      <div className="w-full sm:w-44 h-24 rounded-xl border border-slate-200 bg-[#FAF7F0] flex items-center justify-center overflow-hidden shrink-0 relative group">
                        <img
                          src={getImageUrl(
                            sectionFormData.config?.banner_mode === 'full_banner'
                              ? (sectionFormData.config?.full_banner_url || sectionFormData.config?.image_url || '/banners/household_banner_exact.png')
                              : (sectionFormData.config?.image_url || '/banners/household_products_exact.png')
                          )}
                          alt="Banner Preview"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>

                      {/* Upload Controls */}
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-[#043927] hover:bg-[#03291c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'رفع صورة جديدة من الجهاز' : 'Upload New Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingImage}
                              onChange={(e) =>
                                handleBannerImageUpload(
                                  e,
                                  sectionFormData.config?.banner_mode === 'full_banner' ? 'full_banner_url' : 'image_url'
                                )
                              }
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: {
                                  ...sectionFormData.config,
                                  image_url:
                                    sectionFormData.config?.banner_mode === 'full_banner'
                                      ? '/banners/household_banner_exact.png'
                                      : '/banners/household_products_exact.png',
                                  full_banner_url: '/banners/household_banner_exact.png',
                                },
                              })
                            }
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            {locale === 'ar' ? 'استعادة الصورة الأصلية' : 'Reset to Default'}
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="/banners/household_products_exact.png or https://..."
                            value={
                              sectionFormData.config?.banner_mode === 'full_banner'
                                ? (sectionFormData.config?.full_banner_url || sectionFormData.config?.image_url || '')
                                : (sectionFormData.config?.image_url || '')
                            }
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: {
                                  ...sectionFormData.config,
                                  image_url: e.target.value,
                                  ...(sectionFormData.config?.banner_mode === 'full_banner' ? { full_banner_url: e.target.value } : {}),
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Dynamic Text Settings (shown if in dynamic layout mode) */}
                  {sectionFormData.config?.banner_mode !== 'full_banner' && (
                    <div className="space-y-4">
                      {/* Tagline */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Category Tag (EN)</label>
                          <input
                            type="text"
                            value={sectionFormData.config?.category_tag_en || 'HOUSEHOLD ESSENTIALS'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, category_tag_en: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Category Tag (AR)</label>
                          <input
                            type="text"
                            value={sectionFormData.config?.category_tag_ar || 'مستلزمات منزلية'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, category_tag_ar: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right font-sans"
                          />
                        </div>
                      </div>

                      {/* Main Headline Line 1 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Headline Line 1 (EN - Green)</label>
                          <input
                            type="text"
                            value={sectionFormData.config?.headline_en_1 || 'A Cleaner Home,'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, headline_en_1: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#043927]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Headline Line 1 (AR - Green)</label>
                          <input
                            type="text"
                            value={sectionFormData.config?.headline_ar_1 || 'منزل أكثر نظافة،'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, headline_ar_1: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#043927] text-right font-sans"
                          />
                        </div>
                      </div>

                      {/* Main Headline Line 2 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Headline Line 2 (EN - Gold/Amber)</label>
                          <input
                            type="text"
                            value={sectionFormData.config?.headline_en_2 || 'A Happier You.'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, headline_en_2: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#C68A27]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Headline Line 2 (AR - Gold/Amber)</label>
                          <input
                            type="text"
                            value={sectionFormData.config?.headline_ar_2 || 'وحياة أكثر سعادة.'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, headline_ar_2: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#C68A27] text-right font-sans"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Description (EN)</label>
                          <textarea
                            rows={2}
                            value={sectionFormData.config?.desc_en || 'Quality household essentials for a fresher, cleaner and more comfortable home.'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, desc_en: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Description (AR)</label>
                          <textarea
                            rows={2}
                            value={sectionFormData.config?.desc_ar || 'مستلزمات منزلية عالية الجودة لمنزل أكثر انتعاشاً ونظافة وراحة.'}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                config: { ...sectionFormData.config, desc_ar: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed text-right font-sans"
                          />
                        </div>
                      </div>

                      {/* Trust Badges */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                        <label className="text-xs font-bold text-slate-800 block">Trust Badges Labels</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Badge 1 (Shield)</span>
                            <input
                              type="text"
                              value={sectionFormData.config?.badge_1_en || 'Trusted Brands'}
                              onChange={(e) =>
                                setSectionFormData({
                                  ...sectionFormData,
                                  config: { ...sectionFormData.config, badge_1_en: e.target.value },
                                })
                              }
                              placeholder="Trusted Brands"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                            <input
                              type="text"
                              value={sectionFormData.config?.badge_1_ar || 'علامات موثوقة'}
                              onChange={(e) =>
                                setSectionFormData({
                                  ...sectionFormData,
                                  config: { ...sectionFormData.config, badge_1_ar: e.target.value },
                                })
                              }
                              placeholder="علامات موثوقة"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-right font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Badge 2 (Truck)</span>
                            <input
                              type="text"
                              value={sectionFormData.config?.badge_2_en || 'Fast & Reliable Delivery'}
                              onChange={(e) =>
                                setSectionFormData({
                                  ...sectionFormData,
                                  config: { ...sectionFormData.config, badge_2_en: e.target.value },
                                })
                              }
                              placeholder="Fast & Reliable Delivery"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                            <input
                              type="text"
                              value={sectionFormData.config?.badge_2_ar || 'توصيل سريع وموثوق'}
                              onChange={(e) =>
                                setSectionFormData({
                                  ...sectionFormData,
                                  config: { ...sectionFormData.config, badge_2_ar: e.target.value },
                                })
                              }
                              placeholder="توصيل سريع وموثوق"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-right font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Badge 3 (Leaf)</span>
                            <input
                              type="text"
                              value={sectionFormData.config?.badge_3_en || 'Everyday Value'}
                              onChange={(e) =>
                                setSectionFormData({
                                  ...sectionFormData,
                                  config: { ...sectionFormData.config, badge_3_en: e.target.value },
                                })
                              }
                              placeholder="Everyday Value"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                            <input
                              type="text"
                              value={sectionFormData.config?.badge_3_ar || 'قيمة يومية'}
                              onChange={(e) =>
                                setSectionFormData({
                                  ...sectionFormData,
                                  config: { ...sectionFormData.config, badge_3_ar: e.target.value },
                                })
                              }
                              placeholder="قيمة يومية"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-right font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Button & Background Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Button Text (EN)</label>
                      <input
                        type="text"
                        value={sectionFormData.config?.btn_text_en || 'Shop Now'}
                        onChange={(e) =>
                          setSectionFormData({
                            ...sectionFormData,
                            config: { ...sectionFormData.config, btn_text_en: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Button Text (AR)</label>
                      <input
                        type="text"
                        value={sectionFormData.config?.btn_text_ar || 'تسوق الآن'}
                        onChange={(e) =>
                          setSectionFormData({
                            ...sectionFormData,
                            config: { ...sectionFormData.config, btn_text_ar: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Button Link</label>
                      <input
                        type="text"
                        value={sectionFormData.config?.btn_link || '/products?category=household'}
                        onChange={(e) =>
                          setSectionFormData({
                            ...sectionFormData,
                            config: { ...sectionFormData.config, btn_link: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => handleSaveSection(e, false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {saving ? (locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ في المسودة' : 'Save to Draft')}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => handleSaveSection(e, true)}
                  className="px-5 py-2.5 bg-[#043927] hover:bg-[#03291c] text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'نشر مباشرة إلى المتجر' : 'Publish Live Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. LIVE PREVIEW MODAL */}
      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black">
                  {locale === 'ar' ? 'معاينة الصفحة الرئيسية التفاعلية (المسودة)' : 'Interactive Homepage Live Preview (Draft State)'}
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 bg-slate-50 flex-1">
              <div className="text-center p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">
                {locale === 'ar'
                  ? 'هذه معاينة مباشرة لتسلسل الأقسام كما ستظهر على المتجر بعد النقر على زر "نشر التعديلات للمتجر".'
                  : 'This is the live preview of active draft sections in exact display sequence.'}
              </div>

              {/* Sections list in preview */}
              <div className="space-y-4">
                {previewData.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#043927] text-white flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-black text-slate-900">{sec.title_en}</h4>
                        <span className="text-xs text-slate-400">/</span>
                        <span className="text-xs font-bold text-slate-600">{sec.title_ar}</span>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {sec.section_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      Key: <code className="text-slate-800">{sec.section_key}</code>
                      {sec.subtitle_en ? ` • ${sec.subtitle_en}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                {locale === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handlePublishAll();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#043927] hover:bg-[#032b1d] rounded-xl shadow-xs"
              >
                {locale === 'ar' ? 'نشر التعديلات الآن' : 'Publish Changes Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
