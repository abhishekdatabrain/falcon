'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronRight,
  Layers,
  Tag,
  Image as ImageIcon,
  Search,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('parent'); // 'parent' | 'sub'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    slug: '',
    image_url: '',
    parent_id: '',
  });

  const [allParents, setAllParents] = useState([]);

  const loadCategories = async (search = searchQuery, parentFilter = selectedParentFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (parentFilter) {
        params.append('parent_id', parentFilter);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/categories?${queryString}` : '/categories';

      const res = await fetchApi(endpoint);
      if (res.success) {
        const fetched = res.data.categories || [];
        setCategories(fetched);

        // Keep master list of parent categories for modal dropdowns when not filtering
        if (!search && !parentFilter) {
          setAllParents(fetched.filter((c) => !c.parent_id));
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load of master parent categories for modal dropdowns
  useEffect(() => {
    const initMasterParents = async () => {
      try {
        const res = await fetchApi('/categories');
        if (res.success) {
          const fetched = res.data.categories || [];
          setAllParents(fetched.filter((c) => !c.parent_id));
        }
      } catch (e) {}
    };
    initMasterParents();
  }, []);

  // Server-side debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories(searchQuery, selectedParentFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedParentFilter]);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subCategories = categories.filter((c) => !!c.parent_id);

  // Fallback client filter
  const filteredParents = parentCategories;
  const filteredSubs = subCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
        slug: form.slug.trim(),
        image_url: form.image_url || '',
        parent_id: form.parent_id || null,
      };

      if (editingCategory) {
        const res = await fetchApi(`/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) showToast(locale === 'ar' ? 'تم تحديث القسم بنجاح!' : 'Category updated successfully!', 'success');
      } else {
        const res = await fetchApi('/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) showToast(locale === 'ar' ? 'تم إنشاء القسم بنجاح!' : 'Category created successfully!', 'success');
      }
      setShowModal(false);
      setEditingCategory(null);
      setForm({ name_en: '', name_ar: '', slug: '', image_url: '', parent_id: '' });
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (catId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت تأكد من حذف هذا القسم؟ قد تتأثر الأقسام الفرعية التابعة.' : 'Are you sure you want to delete this category? Nested sub-categories may be affected.')) return;
    try {
      const res = await fetchApi(`/categories/${catId}`, { method: 'DELETE' });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم حذف القسم بنجاح!' : 'Category deleted successfully!', 'info');
        await loadCategories();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name_en: cat.name_en || '',
      name_ar: cat.name_ar || '',
      slug: cat.slug || '',
      image_url: cat.image_url || '',
      parent_id: cat.parent_id || '',
    });
    setShowModal(true);
  };

  const openAdd = (isSub = false, parentId = '') => {
    setEditingCategory(null);
    setForm({
      name_en: '',
      name_ar: '',
      slug: '',
      image_url: '',
      parent_id: parentId || (isSub ? (allParents[0]?.id || parentCategories[0]?.id || '') : ''),
    });
    setShowModal(true);
  };

  const categoriesWithImage = categories.filter((c) => !!c.image_url).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
            <FolderTree className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {locale === 'ar' ? 'إدارة الأقسام والأقسام الفرعية' : 'Category & SubCategory Management'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {categories.length} {locale === 'ar' ? 'قسم' : 'Total'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {locale === 'ar'
                ? 'إدارة الهيكل التنظيمي للأقسام الرئيسية والأقسام الفرعية للمنتجات والكتالوج'
                : 'Organize and manage top-level categories and nested sub-categories'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCategories}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer"
            title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openAdd(activeTab === 'sub')}
            className="text-xs font-bold py-3 px-5 rounded-xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة قسم جديد' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'الأقسام الرئيسية' : 'Main Categories'}</div>
            <div className="text-xl font-black text-slate-900">{parentCategories.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'الأقسام الفرعية' : 'Sub-Categories'}</div>
            <div className="text-xl font-black text-slate-900">{subCategories.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'أقسام مصورة' : 'With Images'}</div>
            <div className="text-xl font-black text-slate-900">{categoriesWithImage}</div>
          </div>
        </div>

        {/* <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'نسبة الصور' : 'Visual Coverage'}</div>
            <div className="text-xl font-black text-slate-900">
              {categories.length > 0 ? Math.round((categoriesWithImage / categories.length) * 100) : 0}%
            </div>
          </div>
        </div> */}
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('parent')}
            className={`flex-1 md:flex-none px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'parent'
              ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>{locale === 'ar' ? 'الأقسام الرئيسية' : 'Main Categories'}</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800">
              {parentCategories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sub')}
            className={`flex-1 md:flex-none px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'sub'
              ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>{locale === 'ar' ? 'الأقسام الفرعية' : 'Sub-Categories'}</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800">
              {subCategories.length}
            </span>
          </button>
        </div>

        {/* Search & Parent Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {activeTab === 'sub' && (
            <div className="relative w-full sm:w-48">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedParentFilter}
                onChange={(e) => setSelectedParentFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              >
                <option value="">{locale === 'ar' ? 'جميع الأقسام الرئيسية' : 'All Parents'}</option>
                {(allParents.length > 0 ? allParents : parentCategories).map((p) => (
                  <option key={p.id} value={p.id}>{p.name_en}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث باسم القسم أو الـ Slug...' : 'Search category or slug...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Parent Categories Table */}
      {activeTab === 'parent' && (
        <>
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'جاري تحميل الأقسام الرئيسية...' : 'Loading main categories...'}</p>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery ? (locale === 'ar' ? 'لم يتم العثور على أقسام تطابق البحث' : 'No main categories match your search') : (locale === 'ar' ? 'لا توجد أقسام رئيسية بعد' : 'No main categories created yet')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); openAdd(false); }}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
              >
                + {locale === 'ar' ? 'إضافة قسم رئيسي' : 'Add Main Category'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الرئيسي' : 'Main Category (EN)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الأقسام الفرعية' : 'Sub-Categories'}</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParents.map((cat) => {
                      const childCount = subCategories.filter((s) => String(s.parent_id) === String(cat.id)).length;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Image */}
                          <td className="px-6 py-3.5">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name_en}
                                className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-50 shadow-2xs"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/100x100?text=Category';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <FolderTree className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </td>

                          {/* English Name */}
                          <td className="px-6 py-3.5 font-extrabold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <span>{cat.name_en}</span>
                            </div>
                          </td>

                          {/* Arabic Name */}
                          <td className="px-6 py-3.5 font-bold text-emerald-800" dir="rtl">
                            {cat.name_ar}
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                              {cat.slug}
                            </span>
                          </td>

                          {/* Sub Categories count */}
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-indigo-500" />
                              {childCount} {locale === 'ar' ? 'أقسام فرعية' : 'sub-categories'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAdd(true, cat.id)}
                                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> {locale === 'ar' ? 'إضافة فرعي' : '+ Sub'}
                              </button>
                              <button
                                onClick={() => openEdit(cat)}
                                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Sub-Categories Table */}
      {activeTab === 'sub' && (
        <>
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'جاري تحميل الأقسام الفرعية...' : 'Loading sub-categories...'}</p>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery || selectedParentFilter
                  ? (locale === 'ar' ? 'لم يتم العثور على أقسام فرعية تطابق الفلتر' : 'No sub-categories match your filter')
                  : (locale === 'ar' ? 'لا توجد أقسام فرعية بعد' : 'No sub-categories created yet')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedParentFilter(''); openAdd(true); }}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
              >
                + {locale === 'ar' ? 'إضافة قسم فرعي' : 'Add Sub-Category'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الفرعي' : 'Sub-Category'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الرئيسي التابع له' : 'Parent Category'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubs.map((cat) => {
                      const parent = parentCategories.find((p) => String(p.id) === String(cat.parent_id));
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Image */}
                          <td className="px-6 py-3.5">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name_en}
                                className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-50 shadow-2xs"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/100x100?text=SubCat';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Layers className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </td>

                          {/* English Name */}
                          <td className="px-6 py-3.5 font-extrabold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                              <span>{cat.name_en}</span>
                            </div>
                          </td>

                          {/* Arabic Name */}
                          <td className="px-6 py-3.5 font-bold text-emerald-800" dir="rtl">
                            {cat.name_ar}
                          </td>

                          {/* Parent Category */}
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-600" />
                              {parent ? `${parent.name_en} / ${parent.name_ar}` : (locale === 'ar' ? 'غير محدد' : 'Unassigned')}
                            </span>
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                              {cat.slug}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(cat)}
                                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Category / Sub-Category SCROLLABLE Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            {/* Modal Header (Sticky / Fixed) */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {editingCategory ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editingCategory
                      ? (locale === 'ar' ? 'تعديل القسم' : 'Edit Category')
                      : form.parent_id
                        ? (locale === 'ar' ? 'إضافة قسم فرعي جديد' : 'Add New Sub-Category')
                        : (locale === 'ar' ? 'إضافة قسم رئيسي جديد' : 'Add Main Category')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {form.parent_id
                      ? (locale === 'ar' ? 'قسم فرعي مرتبط بقسم رئيسي' : 'Nested under a main parent category')
                      : (locale === 'ar' ? 'قسم رئيسي في أعلى مستوى للمتجر' : 'Top-level catalog department')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body (Scrollable Middle Container) */}
            <form id="categoryModalForm" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Category Classification */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {locale === 'ar' ? 'تصنيف القسم' : 'Category Classification'}
                </label>
                <select
                  value={form.parent_id ? 'SUB' : 'MAIN'}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value === 'SUB' ? (parentCategories[0]?.id || '') : '' })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden cursor-pointer"
                >
                  <option value="MAIN">{locale === 'ar' ? 'قسم رئيسي (أعلى مستوى)' : 'Main Category (Top-Level)'}</option>
                  <option value="SUB">{locale === 'ar' ? 'قسم فرعي (مرتبط بقسم رئيسي)' : 'Sub-Category (Nested under Parent Category)'}</option>
                </select>
              </div>

              {/* Select Parent Category */}
              {form.parent_id !== '' && (
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5">
                  <label className="block text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                    {locale === 'ar' ? 'اختر القسم الرئيسي' : 'Select Parent Category'} *
                  </label>
                  <select
                    required
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden cursor-pointer"
                  >
                    <option value="">{locale === 'ar' ? '-- اختر القسم الرئيسي --' : '-- Select Parent Category --'}</option>
                    {(allParents.length > 0 ? allParents : parentCategories).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_en} / {p.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name (English) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {locale === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Milk or Organic Fruits"
                  value={form.name_en}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                    setForm((prev) => ({
                      ...prev,
                      name_en: val,
                      slug: (!prev.slug || prev.slug === prev.name_en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')) ? autoSlug : prev.slug,
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden"
                />
              </div>

              {/* Name (Arabic) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {locale === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'} *
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="مثال: حليب طازج أو فواكه عضوية"
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden font-semibold"
                />
              </div>

              {/* Category Image Upload & Preview */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    {locale === 'ar' ? 'صورة القسم (تحميل ملف أو رابط)' : 'Category Image (Upload or URL)'}
                  </label>
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      {locale === 'ar' ? 'إزالة الصورة' : 'Remove Image'}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      {locale === 'ar' ? 'تحميل ملف من الكمبيوتر:' : 'Upload File from Computer:'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm({ ...form, image_url: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      {locale === 'ar' ? 'أو ألصق رابط الصورة (URL):' : 'Or Paste Image URL:'}
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden"
                    />
                  </div>
                </div>

                {form.image_url && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                    <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={form.image_url}
                        alt="Category Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Invalid+URL'; }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 min-w-0">
                      <span className="font-bold text-emerald-700 block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Image Loaded!
                      </span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{form.image_url.substring(0, 50)}...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {locale === 'ar' ? 'رابط الـ Slug' : 'URL Slug'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="fresh-milk"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Preview path: <span className="font-mono text-emerald-600 font-semibold">/category/{form.slug || 'slug'}</span>
                </p>
              </div>
            </form>

            {/* Modal Footer (Sticky / Fixed at Bottom) */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                form="categoryModalForm"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{editingCategory ? (locale === 'ar' ? 'تحديث القسم' : 'Update Category') : (locale === 'ar' ? 'حفظ القسم' : 'Save Category')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

