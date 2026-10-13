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
  Upload,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
  X,
  Palette,
  ExternalLink,
  ChevronRight,
  Eye,
  Sliders
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Warm Amber / Yellow', hex: '#F5BF38' },
  { name: 'Vibrant Sky Blue', hex: '#38BDF8' },
  { name: 'Fresh Lime Green', hex: '#A3E062' },
  { name: 'Emerald Forest', hex: '#05A764' },
  { name: 'Coral Rose', hex: '#FB7185' },
  { name: 'Lavender Purple', hex: '#A78BFA' },
  { name: 'Warm Tangerine', hex: '#F97316' },
  { name: 'Dark Slate', hex: '#1E293B' },
];

const PRESET_IMAGES = [
  { label: 'Tata Salt & Bayara (Groceries)', url: '/promo/promo_groceries.png' },
  { label: 'Clorox & Harpic (Home Care)', url: '/promo/promo_cleaning.png' },
  { label: "Lay's Classic (Snacks)", url: '/promo/promo_snacks.jpg' },
];

export default function AdminPromoBannersPage() {
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
    desc_en: '',
    desc_ar: '',
    btn_text_en: '',
    btn_text_ar: '',
    btn_link: '',
    image_url: '',
    bg_color: '#F5BF38',
    order_index: 0,
    is_active: true,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Fetch Banners on Mount
  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/promo-banners/admin/all');
      if (res.success) {
        setBanners(res.data?.banners || []);
      } else {
        showToast(res.message || 'Failed to fetch promo banners', 'error');
      }
    } catch (err) {
      console.error('Error fetching promo banners:', err);
      showToast(err.message || 'Failed to load promo banners', 'error');
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
      title_en: 'Everyday groceries, made easy!',
      title_ar: 'البقالة اليومية، بأسهل طريقة!',
      desc_en: 'Fresh staples, pantry essentials & more',
      desc_ar: 'مواد أساسية طازجة، مستلزمات المؤونة والمزيد',
      btn_text_en: 'Order Now',
      btn_text_ar: 'اطلب الآن',
      btn_link: '/products?category=groceries',
      image_url: '/promo/promo_groceries.png',
      bg_color: '#F5BF38',
      order_index: banners.length,
      is_active: true,
    });
    setSelectedFile(null);
    setPreviewUrl('/promo/promo_groceries.png');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title_en: banner.title_en || '',
      title_ar: banner.title_ar || '',
      desc_en: banner.desc_en || '',
      desc_ar: banner.desc_ar || '',
      btn_text_en: banner.btn_text_en || 'Order Now',
      btn_text_ar: banner.btn_text_ar || 'اطلب الآن',
      btn_link: banner.btn_link || '/products',
      image_url: banner.image_url || '',
      bg_color: banner.bg_color || '#F5BF38',
      order_index: banner.order_index ?? 0,
      is_active: banner.is_active ?? true,
    });
    setSelectedFile(null);
    setPreviewUrl(banner.image_url || '');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await fetchApi(`/promo-banners/${banner.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      if (res.success) {
        showToast(
          locale === 'ar'
            ? 'تم تحديث حالة تفعيل البطاقة'
            : `Card is now ${!banner.is_active ? 'Active' : 'Inactive'}`,
          'success'
        );
        loadBanners();
      } else {
        showToast(res.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Status toggle failed', 'error');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (
      !window.confirm(
        locale === 'ar'
          ? 'هل أنت متأكد من حذف هذه البطاقة الترويجية؟'
          : 'Are you sure you want to delete this promo card?'
      )
    ) {
      return;
    }

    try {
      const res = await fetchApi(`/promo-banners/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم الحذف بنجاح' : 'Promo card deleted successfully', 'success');
        loadBanners();
      } else {
        showToast(res.message || 'Failed to delete card', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Delete operation failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const endpoint = editingBanner
        ? `/promo-banners/${editingBanner.id}`
        : '/promo-banners';
      const method = editingBanner ? 'PUT' : 'POST';

      let bodyData;
      if (selectedFile) {
        const formDataObj = new FormData();
        Object.keys(formData).forEach((key) => {
          formDataObj.append(key, formData[key]);
        });
        formDataObj.append('image', selectedFile);
        bodyData = formDataObj;
      } else {
        bodyData = JSON.stringify(formData);
      }

      const res = await fetchApi(endpoint, {
        method,
        body: bodyData,
      });

      if (res.success) {
        showToast(
          editingBanner
            ? locale === 'ar'
              ? 'تم تحديث البطاقة الترويجية بنجاح!'
              : 'Promo card updated successfully!'
            : locale === 'ar'
            ? 'تم إضافة البطاقة الترويجية بنجاح!'
            : 'Promo card created successfully!',
          'success'
        );
        setIsModalOpen(false);
        loadBanners();
      } else {
        showToast(res.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Error saving promo card:', err);
      showToast(err.message || 'Failed to save promo card', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Quick Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {locale === 'ar' ? 'إدارة البطاقات الترويجية (٣ بطاقات)' : 'Promotional Cards Banner Management'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Homepage 3-Grid
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {locale === 'ar'
              ? 'تخصيص العناوين، الأوصاف، الصور، ألوان الخلفية وروابط الأزرار للبطاقات الترويجية الثلاثية في الصفحة الرئيسية'
              : 'Customize text, images, button actions, and background colors for the 3 promotional highlight cards on the storefront'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBanners}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="btn-primary py-2.5 px-4 text-xs font-bold bg-[#05442e] hover:bg-emerald-900 text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة بطاقة جديدة' : 'Add New Card'}</span>
          </button>
        </div>
      </div>

      {/* 2. Switcher Tabs to Jump between Hero Banners and Promotional Cards */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md">
        <Link
          href="/admin/hero-banners"
          className="flex-1 py-2 text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-all rounded-xl"
        >
          {locale === 'ar' ? 'سلايدر الهيرو الرئيسي' : 'Hero Carousel Banners'}
        </Link>
        <span className="flex-1 py-2 text-center text-xs font-extrabold bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200/80">
          {locale === 'ar' ? 'البطاقات الترويجية الثلاثية' : 'Promotional Cards (3 Grid)'}
        </span>
      </div>

      {/* 3. Cards Live Grid Preview */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#05442e] animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">
            {locale === 'ar' ? 'جارٍ تحميل البطاقات الترويجية...' : 'Loading promotional cards...'}
          </p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {locale === 'ar' ? 'لا توجد بطاقات ترويجية مضافة' : 'No Promotional Cards Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {locale === 'ar'
              ? 'أضف أول بطاقة ترويجية لتظهر في الصفحة الرئيسية لمتجرك.'
              : 'Add your first promotional card to feature on the customer storefront homepage.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#05442e] text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-900 cursor-pointer"
          >
            Add First Card
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              {locale === 'ar' ? 'معاينة البطاقات الحالية' : 'Current Promotional Cards'} ({banners.length})
            </h2>
            <span className="text-xs text-slate-400">
              Cards display on homepage in the exact order below
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {banners.map((card, idx) => {
              const bgStyle = card.bg_color ? { backgroundColor: card.bg_color } : { backgroundColor: '#F5BF38' };
              const imgSrc = getImageUrl(card.image_url);

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Bar with Badge & Order */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>Order #{card.order_index}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(card)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          card.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {card.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Real-Life Exact Storefront Render Preview */}
                  <div className="p-4 flex-1">
                    <div
                      style={bgStyle}
                      className="rounded-[24px] relative overflow-hidden flex justify-between min-h-[190px] shadow-xs group font-sans"
                    >
                      {/* Left Text Content */}
                      <div className="p-5 max-w-[62%] flex flex-col justify-between z-10">
                        <div className="space-y-1.5">
                          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug tracking-tight font-sans">
                            {locale === 'ar' ? card.title_ar : card.title_en}
                          </h3>
                          <p className="text-slate-800/80 font-medium text-[11px] leading-relaxed">
                            {locale === 'ar' ? card.desc_ar : card.desc_en}
                          </p>
                        </div>

                        <div className="pt-3">
                          <span className="bg-white text-slate-900 font-bold text-[11px] px-4 py-2 rounded-xl shadow-xs inline-block">
                            {locale === 'ar' ? card.btn_text_ar : card.btn_text_en}
                          </span>
                        </div>
                      </div>

                      {/* Right Image Container with Rounded Cutout */}
                      <div className="w-[38%] bg-white rounded-tl-[40px] rounded-bl-none absolute right-0 top-0 bottom-0 flex items-center justify-center p-2.5 shadow-inner">
                        <img
                          src={imgSrc}
                          alt={card.title_en}
                          className="w-full h-full object-contain drop-shadow-sm"
                          onError={(e) => {
                            e.target.src = '/promo/promo_groceries.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Background Color:</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: card.bg_color }}
                          />
                          <span className="font-mono text-slate-700 font-bold">{card.bg_color}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center truncate">
                        <span>Button Link:</span>
                        <span className="font-mono text-slate-700 font-semibold truncate max-w-[150px]">
                          {card.btn_link}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditModal(card)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>{locale === 'ar' ? 'تعديل' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBanner(card.id)}
                      className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl relative overflow-hidden my-8 space-y-6">
            <div className="h-1.5 bg-gradient-to-r from-[#05442e] via-[#05A764] to-[#DA9628]" />

            {/* Modal Header */}
            <div className="px-6 sm:px-8 pt-2 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-900">
                  {editingBanner
                    ? locale === 'ar'
                      ? 'تعديل البطاقة الترويجية'
                      : 'Edit Promotional Card'
                    : locale === 'ar'
                    ? 'إضافة بطاقة ترويجية جديدة'
                    : 'Create New Promotional Card'}
                </h3>
                <p className="text-xs text-slate-500">
                  Update text, image, background color, and destination link
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="px-6 sm:px-8 space-y-5 max-h-[72vh] overflow-y-auto">
              {/* Titles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Title (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="Everyday groceries, made easy!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    العنوان (بالعربية) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    placeholder="البقالة اليومية، بأسهل طريقة!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>
              </div>

              {/* Subtitles / Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Description / Subtitle (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.desc_en}
                    onChange={(e) => setFormData({ ...formData, desc_en: e.target.value })}
                    placeholder="Fresh staples, pantry essentials & more"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    الوصف / العنوان الفرعي (بالعربية)
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={formData.desc_ar}
                    onChange={(e) => setFormData({ ...formData, desc_ar: e.target.value })}
                    placeholder="مواد أساسية طازجة، مستلزمات المؤونة والمزيد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Button Text (EN)</label>
                  <input
                    type="text"
                    value={formData.btn_text_en}
                    onChange={(e) => setFormData({ ...formData, btn_text_en: e.target.value })}
                    placeholder="Order Now"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نص الزر (AR)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.btn_text_ar}
                    onChange={(e) => setFormData({ ...formData, btn_text_ar: e.target.value })}
                    placeholder="اطلب الآن"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Destination Link</label>
                  <input
                    type="text"
                    value={formData.btn_link}
                    onChange={(e) => setFormData({ ...formData, btn_link: e.target.value })}
                    placeholder="/products?category=groceries"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#05442e]"
                  />
                </div>
              </div>

              {/* Background Color Picker */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#05A764]" />
                    <span>Card Background Color</span>
                  </span>
                  <span className="font-mono text-slate-800 font-bold">{formData.bg_color}</span>
                </label>

                {/* Preset Swatches */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, bg_color: preset.hex })}
                      title={preset.name}
                      style={{ backgroundColor: preset.hex }}
                      className={`w-7 h-7 rounded-xl border transition-all cursor-pointer ${
                        formData.bg_color?.toLowerCase() === preset.hex.toLowerCase()
                          ? 'ring-2 ring-slate-900 scale-110 shadow-sm border-white'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                    />
                  ))}

                  {/* Custom Hex Color Picker Input */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="color"
                      value={formData.bg_color}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      className="w-7 h-7 rounded-xl border border-slate-300 cursor-pointer p-0 bg-transparent"
                      title="Choose custom color"
                    />
                    <input
                      type="text"
                      value={formData.bg_color}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      placeholder="#F5BF38"
                      className="w-24 px-2 py-1 rounded-lg bg-white border border-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Image Selection & Upload */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#05A764]" />
                  <span>Card Product Image</span>
                </label>

                {/* File Upload or Preset Quick Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Upload from Computer:
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#05442e] bg-white cursor-pointer transition-all text-xs font-bold text-slate-700">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Choose Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Or Choose Preset Pack:
                    </label>
                    <select
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setPreviewUrl(e.target.value);
                        setSelectedFile(null);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                    >
                      <option value="">-- Choose Image --</option>
                      {PRESET_IMAGES.map((p) => (
                        <option key={p.url} value={p.url}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image URL text input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Or Enter Image URL:
                  </label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setPreviewUrl(e.target.value);
                      setSelectedFile(null);
                    }}
                    placeholder="/promo/promo_groceries.png or https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono"
                  />
                </div>

                {/* Preview Box */}
                {previewUrl && (
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Image Preview:</span>
                    <div
                      style={{ backgroundColor: formData.bg_color }}
                      className="w-24 h-24 rounded-2xl p-2 flex items-center justify-center border border-slate-200 shadow-2xs relative overflow-hidden"
                    >
                      <img
                        src={previewUrl.startsWith('blob:') ? previewUrl : getImageUrl(previewUrl)}
                        alt="Preview"
                        className="w-full h-full object-contain drop-shadow-sm"
                        onError={(e) => {
                          e.target.src = '/promo/promo_groceries.png';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Index & Active Switch */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Display Order Index</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Publishing Status</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-[#05442e] focus:ring-[#05442e]"
                      />
                      <span>Active on Homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 pb-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#05442e] hover:bg-emerald-900 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Update Promotional Card' : 'Create Promotional Card'}</span>
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
