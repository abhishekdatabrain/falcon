'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { ShoppingBag, Plus, Search, Edit3, Trash2, X, Apple, Layers, Image as ImageIcon, Sparkles, ArrowLeft, CheckCircle2, Upload, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AdminProductsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Page View Mode: 'list' | 'form'
  const [viewMode, setViewMode] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [productForm, setProductForm] = useState({
    category_id: '',
    subcategory_id: '',
    sku: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    unit: '200 g',
    price: '',
    stock_quantity: '',
    is_active: true,
    images: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetchApi('/products?onlyActive=false'),
        fetchApi('/categories'),
      ]);
      if (prodRes.success) {
        setProducts(prodRes.data?.products?.products || prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []));
      }
      if (catRes.success) {
        const fetchedCats = catRes.data?.categories || (Array.isArray(catRes.data) ? catRes.data : []);
        setCategories(fetchedCats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parentCategoriesList = categories.filter((c) => !c.parent_id);
  const parentCategories = parentCategoriesList;

  const dbSubcategories = categories.filter((c) => c.parent_id && c.parent_id === productForm.category_id);
  const availableSubcategories = dbSubcategories;

  const resetForm = () => {
    setEditingProduct(null);
    setUrlInput('');
    setProductForm({
      category_id: '',
      subcategory_id: '',
      sku: '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      unit: '200 g',
      price: '',
      stock_quantity: '',
      is_active: true,
      images: [],
    });
  };

  const openAdd = () => {
    resetForm();
    setEditingProduct(null);
    setViewMode('form');
  };

  const openEdit = (prod) => {
    setEditingProduct(prod);
    let initialImgs = [];
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      initialImgs = prod.images.map(i => typeof i === 'string' ? i : (i?.image_url || i?.url)).filter(Boolean);
    }
    if (initialImgs.length === 0 && prod.image_url) {
      initialImgs = [prod.image_url];
    }
    setUrlInput('');
    setProductForm({
      category_id: prod.category_id || '',
      subcategory_id: prod.subcategory_id || '',
      sku: prod.sku || '',
      name_en: prod.name_en || '',
      name_ar: prod.name_ar || '',
      description_en: prod.description_en || '',
      description_ar: prod.description_ar || '',
      unit: prod.unit || '200 g',
      price: prod.price || '',
      stock_quantity: prod.stock_quantity || '',
      is_active: prod.is_active !== undefined ? prod.is_active : true,
      images: initialImgs,
    });
    setViewMode('form');
  };

  const handleAddImage = (url) => {
    if (!url || !url.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, url.trim()],
    }));
  };

  const handleRemoveImage = (index) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const compressedUrl = await compressImageFile(file);
        handleAddImage(compressedUrl);
      } catch (err) {
        console.error('Compression error:', err);
      }
    }
  };

  const handleUrlAdd = () => {
    if (urlInput) {
      handleAddImage(urlInput);
      setUrlInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        images: productForm.images.filter(Boolean),
      };

      if (editingProduct) {
        const res = await fetchApi(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          showToast(
            locale === 'ar' ? 'تم تحديث منتج البقالة بنجاح!' : 'Grocery item updated successfully!',
            'success'
          );
        }
      } else {
        const res = await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          showToast(
            locale === 'ar' ? 'تم إضافة منتج البقالة بنجاح!' : 'Fresh grocery item created successfully!',
            'success'
          );
        }
      }
      setViewMode('list');
      resetForm();
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this grocery item?')) return;
    try {
      const res = await fetchApi(`/products/${productId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Grocery product deleted successfully', 'info');
        await loadData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (productId, currentIsActive) => {
    const newIsActive = !currentIsActive;
    try {
      const res = await fetchApi(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: newIsActive }),
      });
      if (res.success) {
        showToast(
          locale === 'ar'
            ? `تم ${newIsActive ? 'تفعيل' : 'تعطيل'} المنتج بنجاح`
            : `Product ${newIsActive ? 'enabled' : 'disabled'} successfully`,
          'info'
        );
        await loadData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const title = (locale === 'ar' ? p.name_ar : p.name_en) || '';
    const sku = p.sku || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page View 1: Products List Table */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
                <Apple className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة كتالوج المواد الغذائية والطازج' : 'Fresh Product'}</h1>
                <p className="text-xs text-slate-500">
                  {locale === 'ar' ? 'إضافة وتعديل أصناف الخضروات، الفواكه، المشروبات، وتحديد الأقسام الفرعية والمخزون' : 'Manage fresh product SKUs, sub-categories, prices, and stock inventory'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'بحث بالمنتج أو SKU...' : 'Search grocery item or SKU...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2.5 pl-9 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs w-full sm:w-48 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={openAdd}
                className="text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة صنف طازج' : 'Add Fresh Grocery Item'}
              </button>
            </div>
          </div>

          {/* Table of Products */}
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading fresh product catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
              No grocery products found. Click "Add Fresh Grocery Item" to create new listings.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'المنتج والصور' : 'Product & Images'}</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'القسم / القسم الفرعي' : 'Category / Sub-Category'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'السعر' : 'Price (SAR)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'المخزون والوحدة' : 'Stock & Unit'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => {
                      const imgList = (prod.images && prod.images.length > 0)
                        ? prod.images.map(i => typeof i === 'string' ? i : i.image_url)
                        : (prod.image_url ? [prod.image_url] : []);
                      const firstImg = imgList[0];

                      return (
                        <tr key={prod.id} className={`hover:bg-slate-50/80 transition-all ${prod.is_active === false ? 'bg-slate-50/60 opacity-80' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {firstImg ? (
                                <div className="relative">
                                  <img
                                    src={firstImg}
                                    alt={prod.name_en}
                                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                                  />
                                  {imgList.length > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                      +{imgList.length - 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-emerald-600">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                  {prod.name_en}
                                </h4>
                                <p className="text-xs text-emerald-700 font-semibold">
                                  {prod.name_ar}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-xs">
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              {prod.sku}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs font-medium text-slate-700">
                            <span className="font-bold text-slate-900 block">{prod.category?.name_en || ''}</span>
                            {prod.subcategory && (
                              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                                ↪ {prod.subcategory.name_en}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 font-extrabold text-emerald-700 text-base">
                            {parseFloat(prod.price).toFixed(2)} <span className="text-xs font-bold text-slate-500">SAR</span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${prod.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              {prod.stock_quantity > 0 ? `${prod.stock_quantity} ${prod.unit || 'PCS'}` : 'Out of Stock'}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                                prod.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {prod.is_active !== false ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {locale === 'ar' ? 'مفعل' : 'Active'}
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> {locale === 'ar' ? 'معطل' : 'Disabled'}
                                </>
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(prod.id, prod.is_active)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                                  prod.is_active !== false
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={prod.is_active !== false ? 'Disable Product' : 'Enable Product'}
                              >
                                {prod.is_active !== false ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Enable')}
                              </button>
                              <button
                                onClick={() => openEdit(prod)}
                                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(prod.id)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                                title="Delete Product"
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

      {/* Page View 2: Dedicated Full-Page Add/Edit Product Form with Multiple Images */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          {/* Form Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> {locale === 'ar' ? 'العودة للقائمة' : 'Back to Products'}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Apple className="w-6 h-6 text-emerald-600" />
                  {editingProduct ? (locale === 'ar' ? 'تعديل منتج بقالة' : 'Edit Grocery Item') : (locale === 'ar' ? 'إضافة منتج بقالة جديد' : 'Add New Fresh Super Mart Item')}
                </h1>
                <p className="text-xs text-slate-500">
                  {locale === 'ar' ? 'أدخل تفاصيل المنتج، الفئات، الصور المتعددة، السعر، والكمية المتوفرة' : 'Fill in comprehensive product details, pricing, stock, and upload multiple product gallery images'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </div>

          {/* Form Body - Clean 2 Column Layout */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (2 Cols wide on desktop) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Card 1: Category & Sub-Category */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers className="w-4 h-4 text-emerald-600" /> Category Classification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Main Category *
                    </label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value, subcategory_id: '' })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Select Main Category --</option>
                      {parentCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Sub-Category (Optional)
                    </label>
                    <select
                      disabled={!productForm.category_id}
                      value={productForm.subcategory_id}
                      onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">-- Select Sub-Category (Optional) --</option>
                      {availableSubcategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name_en} / {sc.name_ar}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Product Name & Descriptions */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Apple className="w-4 h-4 text-emerald-600" /> Product Name & Description
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fresh Organic Apples (1 kg)"
                      value={productForm.name_en}
                      onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      اسم المنتج (بالعربية) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: تفاح أحمر طازج (١ كجم)"
                      value={productForm.name_ar}
                      onChange={(e) => setProductForm({ ...productForm, name_ar: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Description (English)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Fresh organic produce sourced daily from local farms..."
                      value={productForm.description_en}
                      onChange={(e) => setProductForm({ ...productForm, description_en: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      الوصف (بالعربية)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="منتج طازج عالي الجودة مقطوف يومياً..."
                      value={productForm.description_ar}
                      onChange={(e) => setProductForm({ ...productForm, description_ar: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: SKU, Price, Unit & Stock */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" /> Inventory, Pricing & Stock
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GROC-001"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Price (SAR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="14.50"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Unit / Net Weight *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 200 g, 1 kg"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['200 g', '500 g', '1 kg', '1 pc', '250 ml'].map((u) => (
                        <button
                          type="button"
                          key={u}
                          onClick={() => setProductForm({ ...productForm, unit: u })}
                          className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold cursor-pointer"
                        >
                          + {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Fresh Stock Qty *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="100"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Product Status *
                    </label>
                    <select
                      value={productForm.is_active ? 'true' : 'false'}
                      onChange={(e) => setProductForm({ ...productForm, is_active: e.target.value === 'true' })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="true">Active (Enabled)</option>
                      <option value="false">Disabled (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (1 Col wide) - Multiple Images Upload */}
            <div className="space-y-6">

              {/* Product Gallery Images Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Multiple Gallery Images ({productForm.images.length})
                  </h3>
                </div>

                {/* Upload Buttons Box */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" /> Upload Files from Computer:
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer border border-slate-200 rounded-xl p-1 bg-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Or Add Image via URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleUrlAdd}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Uploaded Images List Grid */}
                {productForm.images.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Uploaded Gallery Images (First image is main cover):
                    </span>
                    <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {productForm.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group bg-slate-50 border border-slate-200 rounded-2xl p-1.5 flex flex-col items-center">
                          <img
                            src={imgUrl}
                            alt={`Product view ${idx + 1}`}
                            className="w-full h-16 object-contain rounded-xl bg-white border border-slate-100"
                          />
                          <span className={`text-[9px] font-extrabold mt-1 px-1.5 py-0.2 rounded-md ${idx === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
                            {idx === 0 ? '★ Main' : `#${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs text-xs cursor-pointer transition-all"
                            title="Remove Image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-300 text-center text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No Gallery Images Uploaded Yet</p>
                    <p className="text-[10px] text-slate-400">Upload multiple images to show front view, back view, & nutrition details on product page.</p>
                  </div>
                )}

                {/* Preset Quick Images */}
                {/* <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Add Sample Images:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_GROCERY_IMAGES.map((img, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleAddImage(img.url)}
                        className="text-[11px] bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1 rounded-xl text-slate-600 transition-all font-medium cursor-pointer"
                      >
                        + {img.name}
                      </button>
                    ))}
                  </div>
                </div> */}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Product & Images' : 'Publish Product with Gallery'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>

            </div>

          </form>
        </div>
      )}
    </div>
  );
}
