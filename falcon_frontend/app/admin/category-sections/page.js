'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Upload,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
  X,
  Palette,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  GripVertical,
  Check,
  AlertCircle,
  Search,
  ShoppingBag
} from 'lucide-react';

const PRESET_BG_COLORS = [
  { name: 'Soft Pastel Mint (Default)', hex: '#F6FFF8' },
  { name: 'Warm Cream / Almond', hex: '#FAF7F0' },
  { name: 'Crisp Slate White', hex: '#F8FAFC' },
  { name: 'Sky Soft Blue', hex: '#F0F9FF' },
  { name: 'Warm Amber Cream', hex: '#FFFBEB' },
  { name: 'Soft Rose Tint', hex: '#FFF1F2' },
];

const PRESET_IMAGES = [
  { label: 'Laundry Care (OMO & Persil)', url: '/subcategories/laundry_care.png' },
  { label: 'Toilet Cleaner (Harpic Blue)', url: '/subcategories/toilet_cleaner.png' },
  { label: 'Vacuum Cleaner', url: '/subcategories/vacuum_cleaner.png' },
  { label: 'Storage (Rack)', url: '/subcategories/storage.png' },
  { label: 'Lights & Lamps', url: '/subcategories/lights_lamps.png' },
  { label: 'Chairs (Wooden)', url: '/subcategories/chairs.png' },
  { label: 'Rice & Grains (Daawat)', url: '/subcategories/rice_grains.png' },
  { label: 'Flour & Baking (Al Baker)', url: '/subcategories/flour_baking.png' },
  { label: 'Pulses & Lentils (Royal Chana)', url: '/subcategories/pulses_lentils.png' },
  { label: 'Pasta & Noodles (Dubai)', url: '/subcategories/pasta_noodles.png' },
  { label: 'Tea & Coffee Pack', url: '/subcategories/tea_coffee.png' },
  { label: 'Sugar & Sweeteners', url: '/subcategories/sugar_sweeteners.png' },
];

export default function AdminCategorySectionsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [sections, setSections] = useState([]);
  const [categoriesCatalog, setCategoriesCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('settings'); // 'settings' | 'items' | 'preview'
  const [availableSectionProducts, setAvailableSectionProducts] = useState([]);
  const [loadingProductsPicker, setLoadingProductsPicker] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    bg_color: '#F6FFF8',
    max_items: 6,
    display_order: 1,
    is_active: true,
    view_more_link: '/products',
    view_more_text_en: 'View more',
    view_more_text_ar: 'عرض المزيد',
    category_id: '',
    product_ids: [],
    items: [],
  });

  // Load sections and catalog categories
  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, catRes] = await Promise.all([
        fetchApi('/category-sections/admin/all'),
        fetchApi('/categories'),
      ]);

      if (sectionsRes.success) {
        setSections(sectionsRes.data?.sections || []);
      } else {
        showToast(sectionsRes.message || 'Failed to fetch sections', 'error');
      }

      if (catRes.success) {
        const raw = catRes.data?.categories || catRes.data || [];
        setCategoriesCatalog(raw);
      }
    } catch (err) {
      console.error('Error fetching category sections:', err);
      showToast(err.message || 'Failed to load sections data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolveSectionCategoryId = (sectionObj) => {
    if (sectionObj?.category_id) return sectionObj.category_id;
    const titleEn = (sectionObj?.title_en || '').trim().toLowerCase();
    if (titleEn) {
      const normalizedTitle = titleEn.replace('bevarages', 'beverages');
      const foundByName =
        categoriesCatalog.find((c) => !c.parent_id && (c.name_en || '').trim().toLowerCase() === normalizedTitle) ||
        categoriesCatalog.find((c) => (c.name_en || '').trim().toLowerCase() === normalizedTitle) ||
        categoriesCatalog.find((c) => !c.parent_id && (c.name_en || '').trim().toLowerCase().includes(normalizedTitle)) ||
        categoriesCatalog.find((c) => (c.name_en || '').trim().toLowerCase().includes(normalizedTitle));
      if (foundByName) return foundByName.id;
    }
    const link = (sectionObj?.view_more_link || '').trim();
    const match = link.match(/[?&]category=([^&#]+)/i);
    if (match && match[1]) {
      const slugOrId = decodeURIComponent(match[1]).trim().toLowerCase();
      const found = categoriesCatalog.find(
        (c) => String(c.id).toLowerCase() === slugOrId || (c.slug || '').toLowerCase() === slugOrId
      );
      if (found) return found.id;
    }
    return '';
  };

  const loadCategoryProductsForSection = async (sectionObj) => {
    try {
      setLoadingProductsPicker(true);
      const catId = resolveSectionCategoryId(sectionObj);
      const endpoint = catId
        ? `/products?category_id=${encodeURIComponent(catId)}&limit=100`
        : '/products?limit=100';
      const res = await fetchApi(endpoint);
      if (res.success && res.data) {
        const list = res.data.products?.products || res.data.products || (Array.isArray(res.data) ? res.data : []);
        setAvailableSectionProducts(Array.isArray(list) ? list : []);
      } else {
        setAvailableSectionProducts([]);
      }
    } catch (err) {
      console.error('Failed to load category products:', err);
      setAvailableSectionProducts([]);
    } finally {
      setLoadingProductsPicker(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSection(null);
    setProductSearchQuery('');
    setFormData({
      title_en: '',
      title_ar: '',
      bg_color: '#F6FFF8',
      max_items: 6,
      display_order: sections.length + 1,
      is_active: true,
      view_more_link: '/products',
      view_more_text_en: 'View more',
      view_more_text_ar: 'عرض المزيد',
      category_id: '',
      product_ids: [],
      items: [],
    });
    loadCategoryProductsForSection({});
    setActiveModalTab('settings');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (section, initialTab = 'settings') => {
    setEditingSection(section);
    setProductSearchQuery('');
    const resolvedCatId = resolveSectionCategoryId(section);
    const initialProductIds = Array.isArray(section.product_ids) ? section.product_ids : [];
    setFormData({
      title_en: section.title_en || '',
      title_ar: section.title_ar || '',
      bg_color: section.bg_color || '#F6FFF8',
      max_items: section.max_items || 6,
      display_order: section.display_order || 1,
      is_active: section.is_active !== undefined ? section.is_active : true,
      view_more_link: section.view_more_link || '/products',
      view_more_text_en: section.view_more_text_en || 'View more',
      view_more_text_ar: section.view_more_text_ar || 'عرض المزيد',
      category_id: resolvedCatId,
      product_ids: initialProductIds,
      items: (section.items || []).map((it, idx) => ({
        id: it.id || 'item-' + idx,
        category_id: it.category_id || '',
        title_en: it.title_en || '',
        title_ar: it.title_ar || '',
        image_url: it.image_url || '',
        link_url: it.link_url || '/products',
        display_order: it.display_order !== undefined ? it.display_order : idx + 1,
        is_active: it.is_active !== undefined ? it.is_active : true,
      })),
    });
    loadCategoryProductsForSection(section);
    setActiveModalTab(initialTab);
    setIsModalOpen(true);
  };

  // Toggle Section Status
  const handleToggleSectionStatus = async (id) => {
    try {
      const res = await fetchApi(`/category-sections/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res.success) {
        showToast('Section status updated', 'success');
        setSections((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: res.data?.is_active } : s))
        );
      } else {
        showToast(res.message || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error toggling section status', 'error');
    }
  };

  // Delete Section
  const handleDeleteSection = async (id) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this section?')) {
      return;
    }
    try {
      const res = await fetchApi(`/category-sections/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('Section deleted successfully', 'success');
        setSections((prev) => prev.filter((s) => s.id !== id));
      } else {
        showToast(res.message || 'Failed to delete section', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error deleting section', 'error');
    }
  };

  // Reorder Sections
  const handleMoveSection = async (index, direction) => {
    const newSections = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    // Reassign display_order
    const orderList = newSections.map((sec, idx) => ({
      id: sec.id,
      display_order: idx + 1,
    }));

    setSections(
      newSections.map((sec, idx) => ({ ...sec, display_order: idx + 1 }))
    );

    try {
      await fetchApi('/category-sections/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderList }),
      });
      showToast('Section order updated', 'success');
    } catch (err) {
      showToast('Failed to update order', 'error');
      loadData();
    }
  };

  // Item Management inside Modal
  const handleAddItemToForm = () => {
    const nextOrder = formData.items.length + 1;
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: 'temp-' + Date.now(),
          category_id: '',
          title_en: 'New Category Item',
          title_ar: 'عنصر فئة جديد',
          image_url: '/subcategories/laundry_care.png',
          link_url: '/products',
          display_order: nextOrder,
          is_active: true,
        },
      ],
    }));
  };

  const handleRemoveItemFromForm = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated.splice(index, 1);
      return {
        ...prev,
        items: updated.map((it, idx) => ({ ...it, display_order: idx + 1 })),
      };
    });
  };

  const handleUpdateItemInForm = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleSelectCategoryForModalItem = (index, catId) => {
    const cat = categoriesCatalog.find((c) => c.id === catId);
    if (!cat) return;

    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        category_id: cat.id,
        title_en: cat.name_en || updated[index].title_en,
        title_ar: cat.name_ar || updated[index].title_ar,
        link_url: `/products?category=${cat.slug}`,
        image_url: cat.image_url || updated[index].image_url || '/subcategories/laundry_care.png',
      };
      return { ...prev, items: updated };
    });
  };

  const handleMoveItemInForm = (index, direction) => {
    const updated = [...formData.items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setFormData((prev) => ({
      ...prev,
      items: updated.map((it, idx) => ({ ...it, display_order: idx + 1 })),
    }));
  };

  // Image Upload helper for an item in modal
  const handleUploadItemImage = async (index, file) => {
    if (!file) return;
    const uploadForm = new FormData();
    uploadForm.append('file', file);

    try {
      showToast(locale === 'ar' ? 'جارٍ رفع الصورة...' : 'Uploading image...', 'info');
      const res = await fetchApi('/upload', {
        method: 'POST',
        body: uploadForm,
      });
      if (res.success && res.data?.url) {
        handleUpdateItemInForm(index, 'image_url', res.data.url);
        showToast(locale === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully', 'success');
      } else {
        showToast(res.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Upload error', 'error');
    }
  };

  const handleMoveProductInSection = (index, direction) => {
    setFormData((prev) => {
      const baseIds =
        prev.product_ids && prev.product_ids.length > 0
          ? prev.product_ids
          : availableSectionProducts.map((p) => p.id);
      const updated = [...baseIds];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return { ...prev, product_ids: updated };
    });
  };

  const handleAddProductToSection = (productId) => {
    setFormData((prev) => {
      const current = prev.product_ids || [];
      if (current.includes(productId)) return prev;
      return { ...prev, product_ids: [...current, productId] };
    });
  };

  const handleRemoveProductFromSection = (productId) => {
    setFormData((prev) => {
      const baseIds =
        prev.product_ids && prev.product_ids.length > 0
          ? prev.product_ids
          : availableSectionProducts.map((p) => p.id);
      return {
        ...prev,
        product_ids: baseIds.filter((id) => String(id) !== String(productId)),
      };
    });
  };

  const resolveProductImg = (prod) => {
    if (!prod) return '';
    return (
      prod.images?.find((img) => img.is_primary)?.image_url ||
      prod.images?.[0]?.image_url ||
      prod.variants?.[0]?.images?.find((img) => img.is_primary)?.image_url ||
      prod.variants?.[0]?.images?.[0]?.image_url ||
      prod.variants?.[0]?.image_url ||
      ''
    );
  };

  const selectedProductObjects = (formData.product_ids || []).length > 0
    ? (formData.product_ids || [])
        .map((pid) => {
          return (
            availableSectionProducts.find((p) => String(p.id) === String(pid)) ||
            (editingSection?.products || []).find((p) => String(p.id) === String(pid)) ||
            null
          );
        })
        .filter(Boolean)
    : availableSectionProducts;

  // Submit Section Form
  const handleSubmitSection = async (e) => {
    e.preventDefault();
    if (!formData.title_en || !formData.title_ar) {
      showToast(
        locale === 'ar' ? 'يرجى ملء العنوان باللغتين الإنجليزية والعربية' : 'Please provide titles in both English & Arabic',
        'error'
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        display_order: parseInt(formData.display_order, 10) || 1,
        max_items: parseInt(formData.max_items, 10) || 6,
      };

      let res;
      if (editingSection) {
        res = await fetchApi(`/category-sections/${editingSection.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/category-sections', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        showToast(
          editingSection
            ? (locale === 'ar' ? 'تم تحديث القسم بنجاح' : 'Section updated successfully')
            : (locale === 'ar' ? 'تم إنشاء القسم بنجاح' : 'Section created successfully'),
          'success'
        );
        setIsModalOpen(false);
        loadData();
      } else {
        showToast(res.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Error saving section:', err);
      showToast(err.message || 'Failed to save section', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format image source safely
  const resolveImgSrc = (url) => {
    if (!url) return '/subcategories/laundry_care.png';
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http')) {
      return url;
    }
    return getImageUrl(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#043927] text-white rounded-xl shadow-xs">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'أقسام الفئات بالصفحة الرئيسية' : 'Homepage Category Showcase'}
              </h1>
              <p className="text-sm font-medium text-slate-500">
                {locale === 'ar'
                  ? 'إدارة الأقسام الديناميكية وشبكات الفئات والمنتجات الظاهرة على الصفحة الرئيسية'
                  : 'Manage dynamic category showcase sections, layout order, items, and styles for the storefront'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#043927] hover:bg-[#032b1d] rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة قسم جديد' : 'New Section'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === 'ar' ? 'إجمالي الأقسام' : 'Total Showcase Sections'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{sections.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === 'ar' ? 'الأقسام النشطة' : 'Active Sections'}
            </p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              {sections.filter((s) => s.is_active).length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100/60 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === 'ar' ? 'إجمالي العناصر المعروضة' : 'Total Category Items'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Sections List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#043927]" />
          <p className="text-sm font-semibold text-slate-600">
            {locale === 'ar' ? 'جارٍ تحميل الأقسام...' : 'Loading showcase sections...'}
          </p>
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-4">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            {locale === 'ar' ? 'لا توجد أقسام بعد' : 'No Showcase Sections Configured Yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {locale === 'ar'
              ? 'قم بإنشاء قسم جديد مثل المستلزمات المنزلية أو البقالة لعرضه في الصفحة الرئيسية'
              : 'Create a section like Household Essentials or Groceries with category cards for the storefront.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#043927] rounded-xl hover:bg-[#032b1d]"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إنشاء أول قسم' : 'Create First Section'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((sec, secIdx) => (
            <div
              key={sec.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Section Header Controls */}
              <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Order control arrows */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveSection(secIdx, -1)}
                      disabled={secIdx === 0}
                      title="Move Up"
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/70 rounded-md transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(secIdx, 1)}
                      disabled={secIdx === sections.length - 1}
                      title="Move Down"
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/70 rounded-md transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        #{sec.display_order || secIdx + 1}
                      </span>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {sec.title_en}
                      </h2>
                      <span className="text-sm font-bold text-slate-400">/</span>
                      <span className="text-lg font-bold text-slate-700">{sec.title_ar}</span>

                      {/* Status Badge */}
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
 sec.is_active
 ? 'bg-emerald-100 text-emerald-800'
 : 'bg-slate-100 text-slate-500'
 }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
 sec.is_active ? 'bg-emerald-600' : 'bg-slate-400'
 }`}
                        />
                        {sec.is_active
                          ? locale === 'ar'
                            ? 'نشط'
                            : 'Active'
                          : locale === 'ar'
                          ? 'معطل'
                          : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: sec.bg_color || '#F6FFF8' }}
                        />
                        <span>BG: {sec.bg_color || '#F6FFF8'}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {sec.items?.length || 0} {locale === 'ar' ? 'عناصر' : 'Items'} (Max {sec.max_items || 6} visible)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <LinkIcon className="w-3 h-3" />
                        {sec.view_more_link || '/products'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleSectionStatus(sec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 sec.is_active
 ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
 : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
 }`}
                  >
                    {sec.is_active
                      ? locale === 'ar'
                        ? 'تعطيل'
                        : 'Disable'
                      : locale === 'ar'
                      ? 'تفعيل'
                      : 'Enable'}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(sec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{locale === 'ar' ? 'تعديل' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Showcase Preview Row as it appears on Storefront */}
              <div
                style={{ backgroundColor: sec.bg_color || '#F6FFF8' }}
                className="p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
                    {locale === 'ar' ? 'معاينة العرض الحي' : 'Live Storefront Layout Preview'}
                  </span>
                  {sec.view_more_link && (
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <span>{locale === 'ar' ? (sec.view_more_text_ar || 'عرض المزيد') : (sec.view_more_text_en || 'View more')}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                  {(sec.products || []).slice(0, sec.max_items || 6).map((prod, pIdx) => {
                    const primaryImg =
                      prod.images?.find((img) => img.is_primary)?.image_url ||
                      prod.images?.[0]?.image_url ||
                      prod.variants?.[0]?.images?.find((img) => img.is_primary)?.image_url ||
                      prod.variants?.[0]?.images?.[0]?.image_url ||
                      prod.variants?.[0]?.image_url ||
                      '';
                    const prodTitle = locale === 'ar' ? (prod.name_ar || prod.name_en) : prod.name_en;
                    const basePrice = parseFloat(prod.price || 0);
                    const discPrice = prod.discount_price ? parseFloat(prod.discount_price) : null;
                    const hasDiscount = discPrice && discPrice < basePrice;
                    const displayPrice = hasDiscount ? discPrice : basePrice;

                    return (
                      <div
                        key={prod.id || pIdx}
                        className="group flex flex-col items-center text-center relative min-w-0"
                      >
                        <div className="relative w-full aspect-square bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-3 sm:p-4 flex items-center justify-center overflow-hidden shrink-0 min-h-0 min-w-0 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                          <img
                            src={resolveImgSrc(primaryImg)}
                            alt={prodTitle}
                            className="w-full h-full max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                            onError={(e) => {
                              if (e.currentTarget.dataset.errorHandled) {
                                e.currentTarget.style.opacity = '0';
                                return;
                              }
                              e.currentTarget.dataset.errorHandled = 'true';
                              e.currentTarget.src = '/subcategories/laundry_care.png';
                            }}
                          />
                        </div>

                        <div className="w-full mt-2.5 flex flex-col items-center px-0.5 space-y-1">
                          <span className="font-bold text-slate-800 text-xs sm:text-[13px] text-center leading-snug line-clamp-2 min-h-[34px]">
                            {prodTitle}
                          </span>
                          <div className="flex items-baseline justify-center gap-1.5 text-xs">
                            <span className="font-extrabold text-[#043927]">
                              SAR {displayPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through">
                                SAR {basePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Slot Placeholder if under max_items */}
                  {(!sec.products || sec.products.length < (sec.max_items || 6)) && (
                    <button
                      onClick={() => handleOpenEditModal(sec, 'items')}
                      className="aspect-square border-2 border-dashed border-slate-300/80 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-700 hover:border-emerald-500 hover:bg-white/50 transition-all cursor-pointer p-4"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-bold">
                        {locale === 'ar' ? 'إضافة عناصر' : 'Add More'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Create / Edit Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#043927] text-white rounded-xl">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingSection
                      ? locale === 'ar'
                        ? 'تعديل قسم الفئات'
                        : 'Edit Showcase Section'
                      : locale === 'ar'
                      ? 'إنشاء قسم فئات جديد'
                      : 'Create Showcase Section'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar'
                      ? 'تحديد العناوين، الألوان، العناصر والترتيب'
                      : 'Configure titles, background color, category mappings, and display limits'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-200 bg-white px-6 shrink-0 gap-6">
              <button
                type="button"
                onClick={() => setActiveModalTab('settings')}
                className={`py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
 activeModalTab === 'settings'
 ? 'border-[#043927] text-[#043927]'
 : 'border-transparent text-slate-500 hover:text-slate-900'
 }`}
              >
                <Sliders className="w-4 h-4" />
                <span>{locale === 'ar' ? 'إعدادات القسم' : 'Section Settings'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('items')}
                className={`py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
 activeModalTab === 'items'
 ? 'border-[#043927] text-[#043927]'
 : 'border-transparent text-slate-500 hover:text-slate-900'
 }`}
              >
                <Layers className="w-4 h-4" />
                <span>
                  {locale === 'ar' ? 'منتجات القسم' : 'Showcase Products'} ({(formData.product_ids || []).length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('preview')}
                className={`py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
 activeModalTab === 'preview'
 ? 'border-[#043927] text-[#043927]'
 : 'border-transparent text-slate-500 hover:text-slate-900'
 }`}
              >
                <Eye className="w-4 h-4" />
                <span>{locale === 'ar' ? 'معاينة حية' : 'Live Preview'}</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitSection} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: SECTION SETTINGS */}
              {activeModalTab === 'settings' && (
                <div className="space-y-6">
                  {/* Linked Parent Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {locale === 'ar' ? 'الفئة المرتبطة (تحديد المنتجات تلقائياً)' : 'Linked Category (Determines Products)'}
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        const catObj = categoriesCatalog.find((c) => String(c.id) === String(newCatId));
                        setFormData((prev) => ({
                          ...prev,
                          category_id: newCatId,
                          title_en: catObj ? catObj.name_en : prev.title_en,
                          title_ar: catObj ? (catObj.name_ar || catObj.name_en) : prev.title_ar,
                          view_more_link: catObj ? `/products?category=${catObj.slug}` : prev.view_more_link,
                          product_ids: [],
                        }));
                        loadCategoryProductsForSection({ category_id: newCatId });
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-emerald-600 transition-all"
                    >
                      <option value="">
                        {locale === 'ar' ? '-- اختر الفئة الرئيسية --' : '-- Auto-detect by Title / Select Category --'}
                      </option>
                      {categoriesCatalog
                        .filter((c) => !c.parent_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_en} ({c.name_ar})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Title Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {locale === 'ar' ? 'عنوان القسم (الإنجليزية) *' : 'Section Title (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Household Essentials"
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-emerald-600 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {locale === 'ar' ? 'عنوان القسم (العربية) *' : 'Section Title (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: المستلزمات المنزلية"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-emerald-600 transition-all text-right"
                      />
                    </div>
                  </div>

                  {/* Background Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{locale === 'ar' ? 'لون الخلفية للقسم' : 'Section Background Color'}</span>
                    </label>

                    <div className="flex flex-wrap gap-2.5 items-center">
                      {PRESET_BG_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, bg_color: col.hex })}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
 formData.bg_color === col.hex
 ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/50'
 : 'border-slate-200 bg-white hover:bg-slate-50'
 }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      ))}

                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="color"
                          value={formData.bg_color || '#F6FFF8'}
                          onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                        <span className="text-xs font-mono font-bold text-slate-600">{formData.bg_color}</span>
                      </div>
                    </div>
                  </div>

                  {/* Limits and Ordering */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {locale === 'ar' ? 'الحد الأقصى للعناصر الظاهرة' : 'Max Visible Items (Default 6)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.max_items}
                        onChange={(e) => setFormData({ ...formData, max_items: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-emerald-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {locale === 'ar' ? 'ترتيب عرض القسم' : 'Section Display Order'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-emerald-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {locale === 'ar' ? 'حالة التفعيل' : 'Status'}
                      </label>
                      <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded text-[#043927] focus:ring-emerald-500"
                          />
                          <span className="text-sm font-bold text-slate-800">
                            {formData.is_active
                              ? locale === 'ar'
                                ? 'نشط على الصفحة الرئيسية'
                                : 'Active on Homepage'
                              : locale === 'ar'
                              ? 'معطل'
                              : 'Disabled'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* "View More" Configuration */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {locale === 'ar' ? 'إعدادات رابط عرض المزيد' : '"View More" Link Configuration'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {locale === 'ar' ? 'الرابط المستهدف' : 'Target URL'}
                        </label>
                        <input
                          type="text"
                          placeholder="/products?category=household"
                          value={formData.view_more_link}
                          onChange={(e) => setFormData({ ...formData, view_more_link: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {locale === 'ar' ? 'نص الزر (EN)' : 'Button Text (EN)'}
                        </label>
                        <input
                          type="text"
                          value={formData.view_more_text_en}
                          onChange={(e) => setFormData({ ...formData, view_more_text_en: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {locale === 'ar' ? 'نص الزر (AR)' : 'Button Text (AR)'}
                        </label>
                        <input
                          type="text"
                          value={formData.view_more_text_ar}
                          onChange={(e) => setFormData({ ...formData, view_more_text_ar: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHOWCASE PRODUCTS */}
              {activeModalTab === 'items' && (
                <div className="space-y-6">
                  {/* Selected Products (Ordered) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {locale === 'ar' ? 'المنتجات المختارة للعرض' : 'Selected Showcase Products'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {locale === 'ar'
                            ? 'رتب المنتجات أو احذفها. تظهر المنتجات بالترتيب المحدد في الصفحة الرئيسية.'
                            : 'Reorder or remove products. Products appear on the homepage in this exact order.'}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-[#043927]">
                        {(formData.product_ids || []).length} {locale === 'ar' ? 'محدد' : 'Selected'} / Max {formData.max_items}
                      </span>
                    </div>

                    {selectedProductObjects.length === 0 ? (
                      <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/60">
                        <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto" />
                        <p className="text-xs font-medium text-slate-500">
                          {locale === 'ar'
                            ? 'لم يتم تحديد منتجات مخصصة بعد. اختر منتجات من القائمة أدناه.'
                            : 'No custom products selected yet. Add products from the category list below.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedProductObjects.map((prod, idx) => {
                          const prodName = locale === 'ar' ? (prod.name_ar || prod.name_en) : prod.name_en;
                          const prodImg = resolveProductImg(prod);
                          const prodPrice = parseFloat(prod.discount_price || prod.price || 0).toFixed(2);
                          const isOverLimit = idx >= (parseInt(formData.max_items, 10) || 6);

                          return (
                            <div
                              key={prod.id}
                              className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                                isOverLimit
                                  ? 'bg-amber-50/40 border-amber-200/80 opacity-75'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-black text-slate-400 w-5 text-center shrink-0">
                                  #{idx + 1}
                                </span>
                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                  <img
                                    src={resolveImgSrc(prodImg)}
                                    alt={prodName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = '/subcategories/laundry_care.png';
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{prodName}</p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {prod.brand ? `${prod.brand} • ` : ''}SAR {prodPrice}
                                    {isOverLimit && (
                                      <span className="ml-2 text-amber-700 font-semibold">
                                        ({locale === 'ar' ? 'خارج الحد الأقصى' : 'Hidden by Max limit'})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveProductInSection(idx, -1)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === selectedProductObjects.length - 1}
                                  onClick={() => handleMoveProductInSection(idx, 1)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromSection(prod.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer ml-1"
                                  title="Remove product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Available Category Products Picker */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-800">
                        {locale === 'ar' ? 'إضافة منتجات من القسم' : 'Add Products from Category'}
                      </h4>
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          placeholder={locale === 'ar' ? 'ابحث عن منتج...' : 'Search products by name, brand, SKU...'}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-emerald-600"
                        />
                      </div>
                    </div>

                    {loadingProductsPicker ? (
                      <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-[#043927]" />
                        <span>{locale === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading category products...'}</span>
                      </div>
                    ) : (() => {
                      const q = productSearchQuery.trim().toLowerCase();
                      const filteredAvailable = availableSectionProducts.filter((p) => {
                        if (!q) return true;
                        return (
                          (p.name_en || '').toLowerCase().includes(q) ||
                          (p.name_ar || '').toLowerCase().includes(q) ||
                          (p.brand || '').toLowerCase().includes(q) ||
                          (p.sku || '').toLowerCase().includes(q)
                        );
                      });

                      if (filteredAvailable.length === 0) {
                        return (
                          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/70">
                            {locale === 'ar'
                              ? 'لا توجد منتجات مطابقة في هذا القسم'
                              : 'No matching products found in this category.'}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                          {filteredAvailable.map((prod) => {
                            const isSelected = (formData.product_ids || []).includes(prod.id);
                            const prodName = locale === 'ar' ? (prod.name_ar || prod.name_en) : prod.name_en;
                            const prodImg = resolveProductImg(prod);
                            const prodPrice = parseFloat(prod.discount_price || prod.price || 0).toFixed(2);

                            return (
                              <div
                                key={prod.id}
                                className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                                  isSelected
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                      src={resolveImgSrc(prodImg)}
                                      alt={prodName}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/subcategories/laundry_care.png';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{prodName}</p>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      {prod.brand ? `${prod.brand} • ` : ''}SAR {prodPrice}
                                    </p>
                                  </div>
                                </div>

                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-[#043927] text-[11px] font-bold shrink-0">
                                    <Check className="w-3 h-3" />
                                    <span>{locale === 'ar' ? 'مضاف' : 'Added'}</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddProductToSection(prod.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#043927] hover:bg-[#02281b] text-white text-[11px] font-bold shrink-0 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{locale === 'ar' ? 'إضافة' : 'Add'}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE PREVIEW */}
              {activeModalTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {locale === 'ar' ? 'معاينة مباشرة كما تظهر في الصفحة الرئيسية' : 'Instant Homepage Section Preview'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedProductObjects.length} {locale === 'ar' ? 'منتجات' : 'Products'}
                    </span>
                  </div>

                  <div
                    style={{ backgroundColor: formData.bg_color || '#F6FFF8' }}
                    className="rounded-[28px] p-6 sm:p-10 space-y-6 border border-slate-200/50 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        {locale === 'ar' ? (formData.title_ar || formData.title_en) : (formData.title_en || 'Section Title')}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                      {selectedProductObjects.slice(0, parseInt(formData.max_items, 10) || 6).map((prod, pIdx) => {
                        const prodName = locale === 'ar' ? (prod.name_ar || prod.name_en) : prod.name_en;
                        const prodImg = resolveProductImg(prod);
                        const basePrice = parseFloat(prod.price || 0);
                        const discPrice = prod.discount_price ? parseFloat(prod.discount_price) : null;
                        const hasDiscount = discPrice && discPrice < basePrice;
                        const displayPrice = hasDiscount ? discPrice : basePrice;

                        return (
                          <div key={prod.id || pIdx} className="group flex flex-col items-center text-center min-w-0">
                            <div className="relative w-full aspect-square bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-3 sm:p-4 flex items-center justify-center overflow-hidden shrink-0 min-h-0 min-w-0 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                              <img
                                src={resolveImgSrc(prodImg)}
                                alt={prodName}
                                className="w-full h-full max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                                onError={(e) => {
                                  if (e.currentTarget.dataset.errorHandled) {
                                    e.currentTarget.style.opacity = '0';
                                    return;
                                  }
                                  e.currentTarget.dataset.errorHandled = 'true';
                                  e.currentTarget.src = '/subcategories/laundry_care.png';
                                }}
                              />
                            </div>
                            <div className="w-full mt-2.5 flex flex-col items-center px-0.5 space-y-1">
                              <span className="font-bold text-slate-800 text-xs sm:text-[13px] text-center leading-snug line-clamp-2 min-h-[34px]">
                                {prodName}
                              </span>
                              <div className="flex items-baseline justify-center gap-1.5 text-xs">
                                <span className="font-extrabold text-[#043927]">
                                  SAR {displayPrice.toFixed(2)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    SAR {basePrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {formData.view_more_link && (
                      <div className="flex justify-end pt-1">
                        <span className="text-[12px] sm:text-[13px] font-medium text-slate-500 flex items-center gap-1">
                          <span>{locale === 'ar' ? (formData.view_more_text_ar || 'عرض المزيد') : (formData.view_more_text_en || 'View more')}</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#043927] hover:bg-[#032b1d] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'حفظ القسم' : 'Save Section'}</span>
                    </>
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
