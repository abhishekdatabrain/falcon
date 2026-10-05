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
  Grid,
  GitCommit,
  GitBranch,
  CornerDownRight
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('parent'); // 'parent' | 'sub' | 'subsub'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState('');
  const [selectedSubFilter, setSelectedSubFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form state
  const [formLevel, setFormLevel] = useState('LEVEL_1'); // 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    slug: '',
    image_url: '',
    parent_main_id: '', // Used for selecting level 1 when setting up level 2/3
    parent_id: '',      // Final parent_id saved in backend
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/categories?all=true');
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Compute 3 Levels of Hierarchy
  const mainCategories = categories.filter((c) => !c.parent_id);
  const mainIds = new Set(mainCategories.map((c) => c.id));

  const subCategories = categories.filter((c) => c.parent_id && mainIds.has(c.parent_id));
  const subIds = new Set(subCategories.map((c) => c.id));

  // Level 3 (Sub-Subcategories) are items whose parent_id is in Level 2 or any non-main parent
  const subSubCategories = categories.filter((c) => c.parent_id && (subIds.has(c.parent_id) || (!mainIds.has(c.parent_id) && c.parent_id !== null)));

  // Filtered lists based on search & dropdown filters
  const filteredParents = mainCategories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name_en?.toLowerCase().includes(q) ||
      cat.name_ar?.includes(q) ||
      cat.slug?.toLowerCase().includes(q)
    );
  });

  const filteredSubs = subCategories.filter((cat) => {
    if (selectedParentFilter && String(cat.parent_id) !== String(selectedParentFilter)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name_en?.toLowerCase().includes(q) ||
      cat.name_ar?.includes(q) ||
      cat.slug?.toLowerCase().includes(q)
    );
  });

  const filteredSubSubs = subSubCategories.filter((cat) => {
    if (selectedSubFilter && String(cat.parent_id) !== String(selectedSubFilter)) return false;
    if (selectedParentFilter) {
      // Find parent subcategory
      const parentSub = subCategories.find((s) => String(s.id) === String(cat.parent_id));
      if (!parentSub || String(parentSub.parent_id) !== String(selectedParentFilter)) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name_en?.toLowerCase().includes(q) ||
      cat.name_ar?.includes(q) ||
      cat.slug?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      let finalParentId = null;
      if (formLevel === 'LEVEL_2') {
        finalParentId = form.parent_main_id || null;
      } else if (formLevel === 'LEVEL_3') {
        finalParentId = form.parent_id || null;
      }

      if ((formLevel === 'LEVEL_2' && !finalParentId) || (formLevel === 'LEVEL_3' && !finalParentId)) {
        showToast(locale === 'ar' ? 'يرجى اختيار القسم التابع له' : 'Please select a valid parent category', 'error');
        setSubmitting(false);
        return;
      }

      const payload = {
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
        slug: form.slug.trim(),
        image_url: form.image_url || '',
        parent_id: finalParentId,
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
      setForm({ name_en: '', name_ar: '', slug: '', image_url: '', parent_main_id: '', parent_id: '' });
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
    
    // Determine level
    let level = 'LEVEL_1';
    let mainParentId = '';
    let subParentId = '';

    if (cat.parent_id) {
      const isParentMain = mainIds.has(cat.parent_id);
      if (isParentMain) {
        level = 'LEVEL_2';
        mainParentId = cat.parent_id;
      } else {
        level = 'LEVEL_3';
        subParentId = cat.parent_id;
        const parentSub = subCategories.find((s) => String(s.id) === String(cat.parent_id));
        if (parentSub) {
          mainParentId = parentSub.parent_id;
        }
      }
    }

    setFormLevel(level);
    setForm({
      name_en: cat.name_en || '',
      name_ar: cat.name_ar || '',
      slug: cat.slug || '',
      image_url: cat.image_url || '',
      parent_main_id: mainParentId,
      parent_id: subParentId,
    });
    setShowModal(true);
  };

  const openAdd = (targetLevel = 'LEVEL_1', targetParentMain = '', targetParentSub = '') => {
    setEditingCategory(null);
    setFormLevel(targetLevel);
    setForm({
      name_en: '',
      name_ar: '',
      slug: '',
      image_url: '',
      parent_main_id: targetParentMain || mainCategories[0]?.id || '',
      parent_id: targetParentSub || '',
    });
    setShowModal(true);
  };

  const categoriesWithImage = categories.filter((c) => !!c.image_url).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
            <FolderTree className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 font-sans">
                {locale === 'ar' ? 'إدارة الأقسام (٣ مستويات تنظيمي)' : 'Category & Sub-Category Management'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                {categories.length} {locale === 'ar' ? 'قسم' : 'Total Categories'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {locale === 'ar'
                ? 'إدارة الهيكل التنظيمي لجميع الأقسام والأقسام الفرعية والأقسام الفرعية الدقيقة'
                : 'Organize 3-level catalog hierarchy: Main Categories ➔ Sub-Categories ➔ Sub-Subcategories'}
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
            onClick={() => {
              if (activeTab === 'subsub') openAdd('LEVEL_3');
              else if (activeTab === 'sub') openAdd('LEVEL_2');
              else openAdd('LEVEL_1');
            }}
            className="text-xs font-extrabold py-3 px-5 rounded-xl flex items-center gap-2 bg-[#043927] hover:bg-[#02281b] text-white shadow-lg transition-all cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>
              {activeTab === 'subsub'
                ? (locale === 'ar' ? 'إضافة فرعي فرعي' : 'Add Sub-Subcategory')
                : activeTab === 'sub'
                ? (locale === 'ar' ? 'إضافة قسم فرعي' : 'Add Sub-Category')
                : (locale === 'ar' ? 'إضافة قسم رئيسي' : 'Add Main Category')}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Cards (3-Level Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Main Categories */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 font-sans">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'الأقسام الرئيسية' : 'Main Categories'}</div>
            <div className="text-xl font-black text-slate-900">{mainCategories.length}</div>
          </div>
        </div>

        {/* Sub-Categories */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 font-sans">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'الأقسام الفرعية' : 'Sub-Categories'}</div>
            <div className="text-xl font-black text-slate-900">{subCategories.length}</div>
          </div>
        </div>

        {/* Sub-Subcategories */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 font-sans">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <CornerDownRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'أقسام فرعية فرعية' : 'Sub-Subcategories'}</div>
            <div className="text-xl font-black text-slate-900">{subSubCategories.length}</div>
          </div>
        </div>

        {/* With Images */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 font-sans">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'أقسام مصورة' : 'With Images'}</div>
            <div className="text-xl font-black text-slate-900">{categoriesWithImage}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 font-sans">
        
        {/* Top Row: 3 Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          {/* Tab 1: Main */}
          <button
            onClick={() => { setActiveTab('parent'); setSelectedParentFilter(''); setSelectedSubFilter(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'parent'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>{locale === 'ar' ? 'الرئيسية (مستوى ١)' : 'Main Categories'}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800">
              {mainCategories.length}
            </span>
          </button>

          {/* Tab 2: Sub */}
          <button
            onClick={() => { setActiveTab('sub'); setSelectedSubFilter(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'sub'
                ? 'bg-white text-blue-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{locale === 'ar' ? 'الفرعية (مستوى ٢)' : 'Sub-Categories'}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800">
              {subCategories.length}
            </span>
          </button>

          {/* Tab 3: Sub-Sub */}
          <button
            onClick={() => setActiveTab('subsub')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'subsub'
                ? 'bg-white text-purple-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CornerDownRight className="w-4 h-4" />
            <span>{locale === 'ar' ? 'فرعية فرعية (مستوى ٣)' : 'Sub-Subcategories'}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800">
              {subSubCategories.length}
            </span>
          </button>
        </div>

        {/* Bottom Row: Search & Parent Filters aligned on the Right */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100 w-full">
          
          {/* Level 1 Parent Filter */}
          {(activeTab === 'sub' || activeTab === 'subsub') && (
            <div className="relative w-full sm:w-48">
              <Filter className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedParentFilter}
                onChange={(e) => {
                  setSelectedParentFilter(e.target.value);
                  setSelectedSubFilter('');
                }}
                className="w-full h-10 pl-9 pr-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer transition-all shadow-2xs"
              >
                <option value="">{locale === 'ar' ? 'جميع الأقسام الرئيسية' : 'All Main Parents'}</option>
                {mainCategories.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_en}</option>
                ))}
              </select>
            </div>
          )}

          {/* Level 2 Sub Filter (when on Sub-Sub tab) */}
          {activeTab === 'subsub' && (
            <div className="relative w-full sm:w-48">
              <Filter className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedSubFilter}
                onChange={(e) => setSelectedSubFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer transition-all shadow-2xs"
              >
                <option value="">{locale === 'ar' ? 'جميع الأقسام الفرعية' : 'All Sub-Parents'}</option>
                {subCategories
                  .filter((s) => !selectedParentFilter || String(s.parent_id) === String(selectedParentFilter))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name_en}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث باسم القسم أو الـ Slug...' : 'Search category or slug...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-8 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* TAB 1: MAIN CATEGORIES (LEVEL 1) TABLE */}
      {activeTab === 'parent' && (
        <>
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-4 border-[#043927] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 font-sans">{locale === 'ar' ? 'جاري تحميل الأقسام الرئيسية...' : 'Loading main categories...'}</p>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3 font-sans">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery ? (locale === 'ar' ? 'لم يتم العثور على أقسام تطابق البحث' : 'No main categories match your search') : (locale === 'ar' ? 'لا توجد أقسام رئيسية بعد' : 'No main categories created yet')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); openAdd('LEVEL_1'); }}
                className="text-xs font-extrabold px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 transition-all cursor-pointer"
              >
                + {locale === 'ar' ? 'إضافة قسم رئيسي' : 'Add Main Category'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden font-sans">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الرئيسي' : 'Main Category (EN)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الأقسام الفرعية (مستوى ٢)' : 'Sub-Categories (L2)'}</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParents.map((cat) => {
                      const childSubs = subCategories.filter((s) => String(s.parent_id) === String(cat.id));
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Image */}
                          <td className="px-6 py-3.5">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name_en}
                                className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-50 shadow-2xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <FolderTree className="w-5 h-5" />
                              </div>
                            )}
                          </td>

                          {/* English Name */}
                          <td className="px-6 py-3.5 font-extrabold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#05A764] shrink-0" />
                              <span>{cat.name_en}</span>
                            </div>
                          </td>

                          {/* Arabic Name */}
                          <td className="px-6 py-3.5 font-extrabold text-emerald-800" dir="rtl">
                            {cat.name_ar}
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                              {cat.slug}
                            </span>
                          </td>

                          {/* Sub Categories count */}
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-500" />
                              {childSubs.length} {locale === 'ar' ? 'أقسام فرعية' : 'Sub-Categories'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAdd('LEVEL_2', cat.id)}
                                className="text-xs text-blue-700 hover:text-blue-800 font-extrabold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-sans"
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

      {/* TAB 2: SUB-CATEGORIES (LEVEL 2) TABLE */}
      {activeTab === 'sub' && (
        <>
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 font-sans">{locale === 'ar' ? 'جاري تحميل الأقسام الفرعية...' : 'Loading sub-categories...'}</p>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3 font-sans">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery || selectedParentFilter
                  ? (locale === 'ar' ? 'لم يتم العثور على أقسام فرعية تطابق الفلتر' : 'No sub-categories match your filter')
                  : (locale === 'ar' ? 'لا توجد أقسام فرعية بعد' : 'No sub-categories created yet')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedParentFilter(''); openAdd('LEVEL_2'); }}
                className="text-xs font-extrabold px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
              >
                + {locale === 'ar' ? 'إضافة قسم فرعي' : 'Add Sub-Category'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden font-sans">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الفرعي' : 'Sub-Category (L2)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الرئيسي التابع له' : 'Parent Main Category (L1)'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الأقسام الفرعية الدقيقة (مستوى ٣)' : 'Sub-Subcategories (L3)'}</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubs.map((cat) => {
                      const parentMain = mainCategories.find((p) => String(p.id) === String(cat.parent_id));
                      const childSubSubs = subSubCategories.filter((ss) => String(ss.parent_id) === String(cat.id));

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Image */}
                          <td className="px-6 py-3.5">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name_en}
                                className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-50 shadow-2xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Layers className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </td>

                          {/* English Name & Arabic Name */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                              <span className="font-extrabold text-slate-900">{cat.name_en}</span>
                            </div>
                            <span className="text-xs text-emerald-800 font-bold block pt-0.5" dir="rtl">
                              {cat.name_ar}
                            </span>
                          </td>

                          {/* Parent Category */}
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-600" />
                              {parentMain ? `${parentMain.name_en}` : 'Unassigned'}
                            </span>
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                              {cat.slug}
                            </span>
                          </td>

                          {/* Level 3 Sub-Subcategories Count */}
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-purple-600" />
                              {childSubSubs.length} {locale === 'ar' ? 'فرعي فرعي' : 'Sub-Subcategories'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAdd('LEVEL_3', parentMain?.id || '', cat.id)}
                                className="text-xs text-purple-700 hover:text-purple-800 font-extrabold bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-sans"
                              >
                                <Plus className="w-3.5 h-3.5" /> {locale === 'ar' ? '+ فرعي فرعي' : '+ Sub-Sub'}
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

      {/* TAB 3: SUB-SUBCATEGORIES (LEVEL 3) TABLE */}
      {activeTab === 'subsub' && (
        <>
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 font-sans">{locale === 'ar' ? 'جاري تحميل الأقسام الفرعية الفرعية...' : 'Loading sub-subcategories...'}</p>
            </div>
          ) : filteredSubSubs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3 font-sans">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery || selectedParentFilter || selectedSubFilter
                  ? (locale === 'ar' ? 'لم يتم العثور على أقسام فرعية فرعية تطابق الفلتر' : 'No sub-subcategories match your filter')
                  : (locale === 'ar' ? 'لا توجد أقسام فرعية فرعية بعد' : 'No sub-subcategories created yet')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedParentFilter(''); setSelectedSubFilter(''); openAdd('LEVEL_3'); }}
                className="text-xs font-extrabold px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
              >
                + {locale === 'ar' ? 'إضافة قسم فرعي فرعي' : 'Add Sub-Subcategory'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden font-sans">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الفرعي الفرعي' : 'Sub-Subcategory (L3)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'مسار التسلسل الهرمي' : 'Hierarchy Path'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubSubs.map((cat) => {
                      const parentSub = subCategories.find((s) => String(s.id) === String(cat.parent_id));
                      const parentMain = parentSub ? mainCategories.find((p) => String(p.id) === String(parentSub.parent_id)) : null;

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Image */}
                          <td className="px-6 py-3.5">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name_en}
                                className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-50 shadow-2xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <CornerDownRight className="w-5 h-5 text-purple-400" />
                              </div>
                            )}
                          </td>

                          {/* English & Arabic Name */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                              <span className="font-extrabold text-slate-900">{cat.name_en}</span>
                            </div>
                            <span className="text-xs text-emerald-800 font-bold block pt-0.5" dir="rtl">
                              {cat.name_ar}
                            </span>
                          </td>

                          {/* Full Hierarchy Breadcrumb Path */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 flex-wrap">
                              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                                {parentMain ? parentMain.name_en : 'Main'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                                {parentSub ? parentSub.name_en : 'Sub'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-black">
                                {cat.name_en}
                              </span>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
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

      {/* CREATE / EDIT MODAL FOR ALL 3 LEVELS */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#043927] flex items-center justify-center font-bold">
                  {editingCategory ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingCategory
                      ? (locale === 'ar' ? 'تعديل القسم' : 'Edit Category')
                      : formLevel === 'LEVEL_3'
                      ? (locale === 'ar' ? 'إضافة قسم فرعي فرعي (مستوى ٣)' : 'Add Sub-Subcategory (Level 3)')
                      : formLevel === 'LEVEL_2'
                      ? (locale === 'ar' ? 'إضافة قسم فرعي (مستوى ٢)' : 'Add Sub-Category (Level 2)')
                      : (locale === 'ar' ? 'إضافة قسم رئيسي (مستوى ١)' : 'Add Main Category (Level 1)')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {formLevel === 'LEVEL_3'
                      ? 'Nested under a Level 2 Sub-Category'
                      : formLevel === 'LEVEL_2'
                      ? 'Nested under a Main Level 1 Category'
                      : 'Top-level department'}
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

            {/* Modal Form Body */}
            <form id="categoryModalForm" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Classification Level Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Category Hierarchy Level
                </label>
                <select
                  value={formLevel}
                  onChange={(e) => {
                    const newLvl = e.target.value;
                    setFormLevel(newLvl);
                    if (newLvl === 'LEVEL_1') {
                      setForm((prev) => ({ ...prev, parent_main_id: '', parent_id: '' }));
                    } else if (newLvl === 'LEVEL_2') {
                      setForm((prev) => ({ ...prev, parent_main_id: prev.parent_main_id || mainCategories[0]?.id || '', parent_id: '' }));
                    } else if (newLvl === 'LEVEL_3') {
                      const firstMainId = mainCategories[0]?.id || '';
                      const subsForFirstMain = subCategories.filter((s) => String(s.parent_id) === String(firstMainId));
                      setForm((prev) => ({
                        ...prev,
                        parent_main_id: prev.parent_main_id || firstMainId,
                        parent_id: prev.parent_id || subsForFirstMain[0]?.id || '',
                      }));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="LEVEL_1">Level 1: Main Category (Top-Level)</option>
                  <option value="LEVEL_2">Level 2: Sub-Category (Nested in Main)</option>
                  <option value="LEVEL_3">Level 3: Sub-Subcategory (Nested in Sub-Category)</option>
                </select>
              </div>

              {/* LEVEL 2: Select Main Category */}
              {formLevel === 'LEVEL_2' && (
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    Select Parent Main Category (Level 1) *
                  </label>
                  <select
                    required
                    value={form.parent_main_id}
                    onChange={(e) => setForm({ ...form, parent_main_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-blue-300 text-slate-900 text-sm font-semibold outline-hidden cursor-pointer"
                  >
                    <option value="">-- Select Main Category --</option>
                    {mainCategories.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_en} / {p.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* LEVEL 3: Select Main Category AND Sub-Category */}
              {formLevel === 'LEVEL_3' && (
                <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Step 1: Select Main Category (Level 1)
                    </label>
                    <select
                      value={form.parent_main_id}
                      onChange={(e) => {
                        const newMainId = e.target.value;
                        const availableSubs = subCategories.filter((s) => String(s.parent_id) === String(newMainId));
                        setForm({
                          ...form,
                          parent_main_id: newMainId,
                          parent_id: availableSubs[0]?.id || '',
                        });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-purple-300 text-slate-900 text-xs font-semibold outline-hidden cursor-pointer"
                    >
                      <option value="">-- Select Main Category --</option>
                      {mainCategories.map((p) => (
                        <option key={p.id} value={p.id}>{p.name_en}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Step 2: Select Parent Sub-Category (Level 2) *
                    </label>
                    <select
                      required
                      value={form.parent_id}
                      onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-purple-300 text-slate-900 text-xs font-extrabold outline-hidden cursor-pointer text-purple-900"
                    >
                      <option value="">-- Select Sub-Category --</option>
                      {subCategories
                        .filter((s) => !form.parent_main_id || String(s.parent_id) === String(form.parent_main_id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name_en} / {s.name_ar}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Name (English) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bottled Mineral Water"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 transition-all outline-hidden font-semibold"
                />
              </div>

              {/* Name (Arabic) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Name (Arabic) *
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="مثال: مياه معدنية معبأة"
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 transition-all outline-hidden font-semibold"
                />
              </div>

              {/* Image Upload & Preview */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Category Image (Upload or URL)
                  </label>
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      Upload File from Computer:
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
                      Or Paste Image URL:
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
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="bottled-mineral-water"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-emerald-500 transition-all outline-hidden"
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                form="categoryModalForm"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-extrabold rounded-xl bg-[#043927] hover:bg-[#02281b] text-white shadow-lg transition-all cursor-pointer disabled:opacity-60 font-sans"
              >
                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
