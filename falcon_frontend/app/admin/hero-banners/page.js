'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Upload,
  Link as LinkIcon,
  ArrowRight,
  MoveUp,
  MoveDown,
  Loader2,
  X,
  Truck,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export default function AdminHeroBannersPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    subtitle_en: '',
    subtitle_ar: '',
    desc_en: '',
    desc_ar: '',
    tag_en: '',
    tag_ar: '',
    btn_text_en: '',
    btn_text_ar: '',
    btn_link: '',
    image_url: '',
    bg_color: '#FAF7F0',
    order_index: 0,
    is_active: true,
    show_badges: true,
    badge_1_title_en: 'Fast & Reliable',
    badge_1_title_ar: 'سريع وموثوق',
    badge_1_subtitle_en: 'Delivery',
    badge_1_subtitle_ar: 'التوصيل',
    badge_2_title_en: 'Great Prices',
    badge_2_title_ar: 'أسعار رائعة',
    badge_2_subtitle_en: 'Everyday',
    badge_2_subtitle_ar: 'كل يوم',
    badge_3_title_en: 'Secure',
    badge_3_title_ar: 'آمن ومحمي',
    badge_3_subtitle_en: 'Payments',
    badge_3_subtitle_ar: 'المدفوعات',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Fetch Banners on Mount
  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/hero-banners/admin/all');
      if (res.success) {
        setBanners(res.data?.banners || []);
      } else {
        showToast(res.message || 'Failed to fetch hero banners', 'error');
      }
    } catch (err) {
      console.error('Error fetching hero banners:', err);
      showToast(err.message || 'Failed to load hero banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setFormData({
      title_en: 'Everything You need',
      title_ar: 'كل ما تحتاجه',
      subtitle_en: 'Delivered Simply',
      subtitle_ar: 'يصلك بكل بساطة',
      desc_en: 'Shop groceries, snacks, personal care and more at great prices. Freshness you can trust.',
      desc_ar: 'تسوق البقالة والوجبات الخفيفة والعناية الشخصية والمزيد بأفضل الأسعار. طازجة يمكنك الوثوق بها.',
      tag_en: 'Daily Grocery',
      tag_ar: 'البقالة اليومية',
      btn_text_en: 'Shop Now',
      btn_text_ar: 'تسوق الآن',
      btn_link: '/products',
      image_url: '/hero_grocery_bag_fresh.png',
      bg_color: '#FAF7F0',
      order_index: banners.length,
      is_active: true,
      show_badges: true,
      badge_1_title_en: 'Fast & Reliable',
      badge_1_title_ar: 'سريع وموثوق',
      badge_1_subtitle_en: 'Delivery',
      badge_1_subtitle_ar: 'التوصيل',
      badge_2_title_en: 'Great Prices',
      badge_2_title_ar: 'أسعار رائعة',
      badge_2_subtitle_en: 'Everyday',
      badge_2_subtitle_ar: 'كل يوم',
      badge_3_title_en: 'Secure',
      badge_3_title_ar: 'آمن ومحمي',
      badge_3_subtitle_en: 'Payments',
      badge_3_subtitle_ar: 'المدفوعات',
    });
    setSelectedFile(null);
    setPreviewUrl('/hero_grocery_bag_fresh.png');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title_en: banner.title_en || '',
      title_ar: banner.title_ar || '',
      subtitle_en: banner.subtitle_en || '',
      subtitle_ar: banner.subtitle_ar || '',
      desc_en: banner.desc_en || '',
      desc_ar: banner.desc_ar || '',
      tag_en: banner.tag_en || '',
      tag_ar: banner.tag_ar || '',
      btn_text_en: banner.btn_text_en || '',
      btn_text_ar: banner.btn_text_ar || '',
      btn_link: banner.btn_link || '',
      image_url: banner.image_url || '',
      bg_color: banner.bg_color || '#FAF7F0',
      order_index: banner.order_index ?? 0,
      is_active: banner.is_active ?? true,
      show_badges: banner.show_badges ?? true,
      badge_1_title_en: banner.badge_1_title_en || 'Fast & Reliable',
      badge_1_title_ar: banner.badge_1_title_ar || 'سريع وموثوق',
      badge_1_subtitle_en: banner.badge_1_subtitle_en || 'Delivery',
      badge_1_subtitle_ar: banner.badge_1_subtitle_ar || 'التوصيل',
      badge_2_title_en: banner.badge_2_title_en || 'Great Prices',
      badge_2_title_ar: banner.badge_2_title_ar || 'أسعار رائعة',
      badge_2_subtitle_en: banner.badge_2_subtitle_en || 'Everyday',
      badge_2_subtitle_ar: banner.badge_2_subtitle_ar || 'كل يوم',
      badge_3_title_en: banner.badge_3_title_en || 'Secure',
      badge_3_title_ar: banner.badge_3_title_ar || 'آمن ومحمي',
      badge_3_subtitle_en: banner.badge_3_subtitle_en || 'Payments',
      badge_3_subtitle_ar: banner.badge_3_subtitle_ar || 'المدفوعات',
    });
    setSelectedFile(null);
    setPreviewUrl(banner.image_url || '');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let finalImageUrl = formData.image_url;

      // 1. If file is selected, upload file first
      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', selectedFile);

        const uploadRes = await fetchApi('/upload', {
          method: 'POST',
          body: uploadForm,
        });

        if (uploadRes.success && uploadRes.data?.url) {
          finalImageUrl = uploadRes.data.url;
        } else {
          showToast('Image upload failed', 'error');
          setSubmitting(false);
          return;
        }
      }

      if (!finalImageUrl) {
        showToast('Please provide an image file or image URL', 'error');
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl,
      };

      let res;
      if (editingBanner) {
        res = await fetchApi(`/hero-banners/${editingBanner.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/hero-banners', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        showToast(
          editingBanner
            ? locale === 'ar' ? 'تم تحديث شريحة الهيرو بنجاح' : 'Hero slide updated successfully'
            : locale === 'ar' ? 'تم إضافة شريحة الهيرو بنجاح' : 'Hero slide added successfully',
          'success'
        );
        try {
          if (typeof window !== 'undefined') localStorage.removeItem('falcon_hero_banners');
        } catch (e) {}
        setIsModalOpen(false);
        loadBanners();
      } else {
        showToast(res.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error('Submit hero banner error:', err);
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      const updatedStatus = !banner.is_active;
      const res = await fetchApi(`/hero-banners/${banner.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: updatedStatus }),
      });
      if (res.success) {
        showToast(
          updatedStatus
            ? locale === 'ar' ? 'تم تفعيل الشريحة' : 'Slide activated'
            : locale === 'ar' ? 'تم تعطيل الشريحة' : 'Slide deactivated',
          'success'
        );
        try {
          if (typeof window !== 'undefined') localStorage.removeItem('falcon_hero_banners');
        } catch (e) {}
        loadBanners();
      }
    } catch (err) {
      showToast(err.message || 'Failed to toggle slide status', 'error');
    }
  };

  const handleDelete = async (bannerId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت تأكد من حذف هذه الشريحة؟' : 'Are you sure you want to delete this hero slide?')) {
      return;
    }
    try {
      const res = await fetchApi(`/hero-banners/${bannerId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم حذف الشريحة بنجاح' : 'Hero slide deleted successfully', 'success');
        try {
          if (typeof window !== 'undefined') localStorage.removeItem('falcon_hero_banners');
        } catch (e) {}
        loadBanners();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete hero slide', 'error');
    }
  };

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#043927]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {locale === 'ar' ? 'إدارة بنرات الهيرو الرئيسة' : 'Hero Banners Management'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {locale === 'ar'
              ? 'إدارة الصور والشرائح والنصوص التي تظهر في الواجهة الرئيسية للموقع باللغتين العربية والإنجليزية.'
              : 'Manage hero slides, images, and text content displayed on the homepage in English & Arabic.'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>{locale === 'ar' ? 'إضافة شريحة جديد' : 'Add New Slide'}</span>
        </button>
      </div>

      {/* Switcher Tabs to Jump between Hero Banners and Promotional Cards */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md">
        <span className="flex-1 py-2 text-center text-xs font-bold bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200/80">
          {locale === 'ar' ? 'سلايدر الهيرو الرئيسي' : 'Hero Carousel Banners'}
        </span>
        <Link
          href="/admin/promo-banners"
          className="flex-1 py-2 text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-all rounded-xl"
        >
          {locale === 'ar' ? 'البطاقات الترويجية الثلاثية' : 'Promotional Cards (3 Grid)'}
        </Link>
      </div>

      {/* Hero Banners Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
          <p className="text-slate-500 font-medium">{locale === 'ar' ? 'جاري تحميل شرائح الهيرو...' : 'Loading hero slides...'}</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#043927] flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {locale === 'ar' ? 'لا توجد شرائح هيرو حالياً' : 'No Hero Slides Available'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
            {locale === 'ar'
              ? 'أنشئ أول شريحة هيرو لعرضها في الصفحة الرئيسية بمظهر متألق.'
              : 'Create your first hero banner slide to showcase on the homepage.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#043927] text-white font-bold text-sm hover:bg-[#02281b] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة شريحة جديدة' : 'Add New Slide'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md ${
 banner.is_active ? 'border-slate-200' : 'border-slate-200 opacity-75'
 }`}
            >
              {/* Card Header Preview Box */}
              <div className="relative bg-[#FAF7F0] p-6 border-b border-amber-100 flex items-center justify-between overflow-hidden min-h-[180px]">
                <div className="z-10 max-w-[60%] space-y-2 text-left rtl:text-right">
                  {banner.tag_en && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200/80">
                      {locale === 'ar' ? banner.tag_ar || banner.tag_en : banner.tag_en}
                    </span>
                  )}
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {locale === 'ar' ? banner.title_ar || banner.title_en : banner.title_en}
                  </h3>
                  {banner.subtitle_en && (
                    <p className="text-xs font-bold text-[#01813E]">
                      {locale === 'ar' ? banner.subtitle_ar || banner.subtitle_en : banner.subtitle_en}
                    </p>
                  )}
                </div>

                {/* Banner Image Preview */}
                <div className="w-32 h-32 relative shrink-0 flex items-center justify-center">
                  <img
                    src={getImageUrl(banner.image_url)}
                    alt={banner.title_en}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                    onError={(e) => {
                      e.target.src = '/hero_grocery_bag_fresh.png';
                    }}
                  />
                </div>

                {/* Active / Status Badge */}
                <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-900/10 text-slate-800 backdrop-blur-xs">
                    #{banner.order_index}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(banner)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
 banner.is_active
 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
 : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
 }`}
                  >
                    {banner.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{banner.is_active ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطل' : 'Inactive')}</span>
                  </button>
                </div>
              </div>

              {/* Card Details Body */}
              <div className="p-5 space-y-4 text-left rtl:text-right">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block mb-0.5">{locale === 'ar' ? 'العنوان بالعربية:' : 'Arabic Title:'}</span>
                    <span className="font-semibold text-slate-800">{banner.title_ar || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block mb-0.5">{locale === 'ar' ? 'العنوان بالإنجليزية:' : 'English Title:'}</span>
                    <span className="font-semibold text-slate-800">{banner.title_en || '-'}</span>
                  </div>
                </div>

                {banner.desc_en && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {locale === 'ar' ? banner.desc_ar || banner.desc_en : banner.desc_en}
                  </p>
                )}

                {banner.show_badges !== false && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[10px]">
                      <Truck className="w-3 h-3 text-emerald-700" />
                      {locale === 'ar' ? (banner.badge_1_title_ar || 'سريع وموثوق') : (banner.badge_1_title_en || 'Fast & Reliable')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[10px]">
                      <Tag className="w-3 h-3 text-emerald-700" />
                      {locale === 'ar' ? (banner.badge_2_title_ar || 'أسعار رائعة') : (banner.badge_2_title_en || 'Great Prices')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[10px]">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      {locale === 'ar' ? (banner.badge_3_title_ar || 'آمن ومحمي') : (banner.badge_3_title_en || 'Secure')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{banner.btn_link || '/products'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title={locale === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={locale === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-[#043927] text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {editingBanner
                      ? (locale === 'ar' ? 'تعديل شريحة الهيرو' : 'Edit Hero Slide')
                      : (locale === 'ar' ? 'إضافة شريحة هيرو جديدة' : 'Add New Hero Slide')}
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    {locale === 'ar' ? 'أدخل تفاصيل الشريحة باللغتين العربية والإنجليزية' : 'Configure bilingual title, text, CTA, and image'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-emerald-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-left rtl:text-right">
              {/* Image Upload / URL Selector Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {locale === 'ar' ? 'صورة الشريحة الهيرو' : 'Hero Slide Image'}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4 flex justify-center">
                    <div className="relative w-36 h-36 rounded-2xl bg-[#FAF7F0] border-2 border-dashed border-amber-200 flex items-center justify-center p-2 overflow-hidden shadow-xs">
                      {previewUrl ? (
                        <img
                          src={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:') ? previewUrl : getImageUrl(previewUrl)}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain drop-shadow-sm transition-all"
                          onError={(e) => {
                            if (!selectedFile) {
                              e.target.src = '/hero_grocery_bag_fresh.png';
                            }
                          }}
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-[11px] font-medium">{locale === 'ar' ? 'اختر صورة' : 'Select image'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        {locale === 'ar' ? 'رفع صورة جديدة من الجهاز:' : 'Upload New File:'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#043927] file:text-white hover:file:bg-[#02281b] cursor-pointer"
                      />
                      {selectedFile && (
                        <div className="flex items-center justify-between gap-2 mt-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                          <span className="truncate font-medium">{selectedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(formData.image_url || '/hero_grocery_bag_fresh.png');
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold shrink-0 cursor-pointer ml-2"
                          >
                            {locale === 'ar' ? 'إزالة' : 'Clear'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        {locale === 'ar' ? 'أو رابط صورة مباشر (URL):' : 'Or Direct Image URL:'}
                      </span>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/... or /hero_grocery_bag_fresh.png"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          if (!selectedFile) setPreviewUrl(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tag / Badge Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'العلامة / الوسم (English Tag)' : 'English Tag / Badge'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daily Grocery"
                    value={formData.tag_en}
                    onChange={(e) => setFormData({ ...formData, tag_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'العلامة / الوسم (بالعربية)' : 'Arabic Tag / Badge'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: البقالة اليومية"
                    value={formData.tag_ar}
                    onChange={(e) => setFormData({ ...formData, tag_ar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Title Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'العنوان الرئيسي (English Title) *' : 'Main Title (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Everything You need"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'العنوان الرئيسي (بالعربية) *' : 'Main Title (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كل ما تحتاجه"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Subtitle / Highlight Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'العنوان الفرعي الملون (English Subtitle)' : 'Highlighted Subtitle (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delivered Simply"
                    value={formData.subtitle_en}
                    onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'العنوان الفرعي الملون (بالعربية)' : 'Highlighted Subtitle (Arabic)'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: يصلك بكل بساطة"
                    value={formData.subtitle_ar}
                    onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-emerald-700 font-bold text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Description Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'الوصف (English Description)' : 'Description (English)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Shop groceries, snacks, personal care and more..."
                    value={formData.desc_en}
                    onChange={(e) => setFormData({ ...formData, desc_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'الوصف (بالعربية)' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="تسوق البقالة والوجبات الخفيفة والعناية الشخصية والمزيد..."
                    value={formData.desc_ar}
                    onChange={(e) => setFormData({ ...formData, desc_ar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Button Text & CTA Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'نص الزر (English)' : 'Button Text (EN)'}
                  </label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={formData.btn_text_en}
                    onChange={(e) => setFormData({ ...formData, btn_text_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'نص الزر (بالعربية)' : 'Button Text (AR)'}
                  </label>
                  <input
                    type="text"
                    placeholder="تسوق الآن"
                    value={formData.btn_text_ar}
                    onChange={(e) => setFormData({ ...formData, btn_text_ar: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'رابط التوجيه (CTA Link)' : 'CTA Target Link'}
                  </label>
                  <input
                    type="text"
                    placeholder="/products"
                    value={formData.btn_link}
                    onChange={(e) => setFormData({ ...formData, btn_link: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Trust Badges & Highlights (Hero Features) */}
              <div className="space-y-4 bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#043927] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {locale === 'ar' ? 'شارات الثقة ومميزات الهيرو' : 'Trust Badges & Highlights'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {locale === 'ar' ? 'تخصيص الشارات الـ 3 الظاهرة أسفل زر التسوق' : 'Manage the 3 highlight badges displayed below the CTA button'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {formData.show_badges ? (locale === 'ar' ? 'إظهار الشارات' : 'Show Badges') : (locale === 'ar' ? 'إخفاء الشارات' : 'Hide Badges')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, show_badges: !formData.show_badges })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
 formData.show_badges ? 'bg-[#043927]' : 'bg-slate-300'
 }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
 formData.show_badges ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
 }`}
                      />
                    </button>
                  </div>
                </div>

                {formData.show_badges && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                    {/* Badge 1 */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs pb-1 border-b border-emerald-100">
                        <div className="w-6 h-6 rounded-full bg-[#E6F4EA] text-[#043927] flex items-center justify-center shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <span>{locale === 'ar' ? 'الشارة 1 (التوصيل)' : 'Badge 1 (Delivery)'}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'العنوان الرئيسي (English)' : 'Title (English)'}
                          </label>
                          <input
                            type="text"
                            placeholder="Fast & Reliable"
                            value={formData.badge_1_title_en}
                            onChange={(e) => setFormData({ ...formData, badge_1_title_en: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'العنوان الرئيسي (بالعربية)' : 'Title (Arabic)'}
                          </label>
                          <input
                            type="text"
                            placeholder="سريع وموثوق"
                            value={formData.badge_1_title_ar}
                            onChange={(e) => setFormData({ ...formData, badge_1_title_ar: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-right"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'النص الفرعي (English)' : 'Subtitle (English)'}
                          </label>
                          <input
                            type="text"
                            placeholder="Delivery"
                            value={formData.badge_1_subtitle_en}
                            onChange={(e) => setFormData({ ...formData, badge_1_subtitle_en: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'النص الفرعي (بالعربية)' : 'Subtitle (Arabic)'}
                          </label>
                          <input
                            type="text"
                            placeholder="التوصيل"
                            value={formData.badge_1_subtitle_ar}
                            onChange={(e) => setFormData({ ...formData, badge_1_subtitle_ar: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-right"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badge 2 */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs pb-1 border-b border-emerald-100">
                        <div className="w-6 h-6 rounded-full bg-[#E6F4EA] text-[#043927] flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span>{locale === 'ar' ? 'الشارة 2 (الأسعار)' : 'Badge 2 (Prices)'}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'العنوان الرئيسي (English)' : 'Title (English)'}
                          </label>
                          <input
                            type="text"
                            placeholder="Great Prices"
                            value={formData.badge_2_title_en}
                            onChange={(e) => setFormData({ ...formData, badge_2_title_en: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'العنوان الرئيسي (بالعربية)' : 'Title (Arabic)'}
                          </label>
                          <input
                            type="text"
                            placeholder="أسعار رائعة"
                            value={formData.badge_2_title_ar}
                            onChange={(e) => setFormData({ ...formData, badge_2_title_ar: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-right"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'النص الفرعي (English)' : 'Subtitle (English)'}
                          </label>
                          <input
                            type="text"
                            placeholder="Everyday"
                            value={formData.badge_2_subtitle_en}
                            onChange={(e) => setFormData({ ...formData, badge_2_subtitle_en: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'النص الفرعي (بالعربية)' : 'Subtitle (Arabic)'}
                          </label>
                          <input
                            type="text"
                            placeholder="كل يوم"
                            value={formData.badge_2_subtitle_ar}
                            onChange={(e) => setFormData({ ...formData, badge_2_subtitle_ar: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-right"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badge 3 */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs pb-1 border-b border-emerald-100">
                        <div className="w-6 h-6 rounded-full bg-[#E6F4EA] text-[#043927] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span>{locale === 'ar' ? 'الشارة 3 (الأمان والدفع)' : 'Badge 3 (Payments)'}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'العنوان الرئيسي (English)' : 'Title (English)'}
                          </label>
                          <input
                            type="text"
                            placeholder="Secure"
                            value={formData.badge_3_title_en}
                            onChange={(e) => setFormData({ ...formData, badge_3_title_en: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'العنوان الرئيسي (بالعربية)' : 'Title (Arabic)'}
                          </label>
                          <input
                            type="text"
                            placeholder="آمن ومحمي"
                            value={formData.badge_3_title_ar}
                            onChange={(e) => setFormData({ ...formData, badge_3_title_ar: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-right"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'النص الفرعي (English)' : 'Subtitle (English)'}
                          </label>
                          <input
                            type="text"
                            placeholder="Payments"
                            value={formData.badge_3_subtitle_en}
                            onChange={(e) => setFormData({ ...formData, badge_3_subtitle_en: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {locale === 'ar' ? 'النص الفرعي (بالعربية)' : 'Subtitle (Arabic)'}
                          </label>
                          <input
                            type="text"
                            placeholder="المدفوعات"
                            value={formData.badge_3_subtitle_ar}
                            onChange={(e) => setFormData({ ...formData, badge_3_subtitle_ar: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-right"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order & Active Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'ترتيب العرض:' : 'Display Order Index:'}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-1.5 text-sm font-bold text-center rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'حالة الشريحة:' : 'Slide Status:'}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
 formData.is_active ? 'bg-[#043927]' : 'bg-slate-200'
 }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
 formData.is_active ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
 }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-slate-600">
                    {formData.is_active ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطل' : 'Inactive')}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingBanner ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (locale === 'ar' ? 'إضافة الشريحة' : 'Create Slide')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
