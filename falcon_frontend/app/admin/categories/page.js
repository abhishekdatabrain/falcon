'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { FolderTree, Plus, Edit3, Trash2, X, ChevronRight, Layers, Tag } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('parent'); // 'parent' | 'sub'

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    slug: '',
    parent_id: '',
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/categories');
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subCategories = categories.filter((c) => !!c.parent_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name_en: form.name_en,
        name_ar: form.name_ar,
        slug: form.slug,
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
      setForm({ name_en: '', name_ar: '', slug: '', parent_id: '' });
      await loadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (catId) => {
    if (!confirm('Are you sure you want to delete this category? Sub-categories will be affected.')) return;
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
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      slug: cat.slug || '',
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
      parent_id: parentId || (isSub && parentCategories.length > 0 ? parentCategories[0].id : ''),
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة الأقسام والأقسام الفرعية' : 'Category & Sub-Category Management'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'إدارة الأقسام الرئيسية والأقسام الفرعية التابعة لها للمنتجات' : 'Manage main catalog categories and nested sub-categories'}
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => openAdd(activeTab === 'sub')}
            className="text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة قسم' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('parent')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'parent'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{locale === 'ar' ? 'الأقسام الرئيسية' : 'Main Categories'} ({parentCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sub')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sub'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{locale === 'ar' ? 'الأقسام الفرعية' : 'Sub-Categories'} ({subCategories.length})</span>
        </button>
      </div>

      {/* Tab 1: Parent Categories */}
      {activeTab === 'parent' && (
        <>
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading main categories...</div>
          ) : parentCategories.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
              No main categories created yet. Click "Add Category" to start.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الرئيسي' : 'Main Category'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الأقسام الفرعية' : 'Sub-Categories'}</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parentCategories.map((cat) => {
                      const childCount = subCategories.filter((s) => s.parent_id === cat.id).length;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              {cat.name_en}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-emerald-700">
                            {cat.name_ar}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            {cat.slug}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                              {childCount} {locale === 'ar' ? 'أقسام فرعية' : 'sub-categories'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAdd(true, cat.id)}
                                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> {locale === 'ar' ? 'إضافة قسم فرعي' : '+ Sub-Category'}
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

      {/* Tab 2: Sub-Categories */}
      {activeTab === 'sub' && (
        <>
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading sub-categories...</div>
          ) : subCategories.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
              No sub-categories created yet. Click "Add Category" to link nested sub-categories.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الفرعي' : 'Sub-Category'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم الرئيسي' : 'Parent Category'}</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subCategories.map((cat) => {
                      const parent = parentCategories.find((p) => p.id === cat.parent_id);
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {cat.name_en}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-emerald-700">
                            {cat.name_ar}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 w-fit">
                              <Tag className="w-3 h-3 text-emerald-600" />
                              {parent ? `${parent.name_en} / ${parent.name_ar}` : 'Main'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            {cat.slug}
                          </td>
                          <td className="px-6 py-4 text-right">
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

      {/* Category / Sub-Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : form.parent_id ? 'Add New Sub-Category' : 'Add Main Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Category Classification
                </label>
                <select
                  value={form.parent_id ? 'SUB' : 'MAIN'}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value === 'SUB' ? (parentCategories[0]?.id || '') : '' })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                >
                  <option value="MAIN">Main Category (Top-Level)</option>
                  <option value="SUB">Sub-Category (Nested under Parent Category)</option>
                </select>
              </div>

              {form.parent_id !== '' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Select Parent Category
                  </label>
                  <select
                    required
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                  >
                    <option value="">-- Select Parent Category --</option>
                    {parentCategories.map((p) => (
                      <option key={p.id} value={p.id}>{p.name_en} / {p.name_ar}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Milk or Organic Fruits"
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">الاسم (بالعربية)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حليب طازج أو فواكه عضوية"
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="fresh-milk"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 text-sm font-semibold py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 text-sm font-semibold py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
