'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Apple,
  Layers,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Upload,
  ShieldCheck,
  ShieldAlert,
  CornerDownRight,
  Tag,
  Filter,
  Package,
  Globe,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  AlertCircle
} from 'lucide-react';

export default function AdminProductsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Page View Mode: 'list' | 'form'
  const [viewMode, setViewMode] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [urlInput, setUrlInput] = useState('');

  // Stock Adjustment Modal State
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockAdjType, setStockAdjType] = useState('RESTOCK'); // 'RESTOCK' | 'DAMAGE' | 'CORRECTION'
  const [stockAdjQty, setStockAdjQty] = useState('');
  const [stockAdjNewTotal, setStockAdjNewTotal] = useState('');
  const [stockAdjReason, setStockAdjReason] = useState('');
  const [stockLogs, setStockLogs] = useState([]);
  const [loadingStockLogs, setLoadingStockLogs] = useState(false);
  const [submittingStockAdj, setSubmittingStockAdj] = useState(false);

  const fetchStockLogs = async (productId) => {
    try {
      setLoadingStockLogs(true);
      const res = await fetchApi(`/products/${productId}/stock-logs`);
      if (res.success) {
        setStockLogs(res.data?.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch stock logs:', err);
    } finally {
      setLoadingStockLogs(false);
    }
  };

  const openStockModal = (product) => {
    setStockModalProduct(product);
    setStockAdjType('RESTOCK');
    setStockAdjQty('');
    setStockAdjNewTotal(String(product.stock_quantity || 0));
    setStockAdjReason('');
    setStockLogs([]);
    fetchStockLogs(product.id);
  };

  const handleSaveStockAdjustment = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    try {
      setSubmittingStockAdj(true);
      const res = await fetchApi(`/products/${stockModalProduct.id}/stock-adjustment`, {
        method: 'POST',
        body: JSON.stringify({
          type: stockAdjType,
          quantity: parseInt(stockAdjQty || '0', 10),
          new_total_stock: stockAdjType === 'CORRECTION' ? parseInt(stockAdjNewTotal || '0', 10) : undefined,
          reason: stockAdjReason,
        }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث سجلات المخزون بنجاح!' : 'Stock adjusted & logged successfully!',
          'success'
        );
        loadData();
        if (editingProduct && editingProduct.id === stockModalProduct.id) {
          setProductForm((prev) => ({
            ...prev,
            stock_quantity: res.data?.product?.stock_quantity ?? prev.stock_quantity,
          }));
        }
        setStockModalProduct(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setSubmittingStockAdj(false);
    }
  };
  const [productForm, setProductForm] = useState({
    category_id: '',
    subcategory_id: '',
    sub_subcategory_id: '',
    sku: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    brand: '',
    unit: '200 g',
    unit_type: 'g',
    unit_value: '200',
    pack_size: '',
    sold_by: 'Piece',
    price: '',
    purchase_price: '',
    discount_price: '',
    vat_percentage: '15',
    price_includes_vat: true,
    stock_quantity: '',
    is_available: true,
    is_active: true,
    is_featured: false,
    is_new_arrival: true,
    is_best_seller: false,
    images: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetchApi('/products?onlyActive=false'),
        fetchApi('/categories?all=true'),
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

  // Compute 3 Levels of Category Hierarchy
  const mainCategories = categories.filter((c) => !c.parent_id);
  const mainIds = new Set(mainCategories.map((c) => c.id));

  const subCategories = categories.filter((c) => c.parent_id && mainIds.has(c.parent_id));
  const subIds = new Set(subCategories.map((c) => c.id));

  const subSubCategories = categories.filter((c) => c.parent_id && (subIds.has(c.parent_id) || (!mainIds.has(c.parent_id) && c.parent_id !== null)));

  // Available Level 2 options based on selected Level 1 (category_id)
  const availableSubcategories = subCategories.filter((sc) => String(sc.parent_id) === String(productForm.category_id));

  // Available Level 3 options based on selected Level 2 (subcategory_id)
  const availableSubSubcategories = subSubCategories.filter((ssc) => String(ssc.parent_id) === String(productForm.subcategory_id));

  const resetForm = () => {
    setEditingProduct(null);
    setUrlInput('');
    setProductForm({
      category_id: '',
      subcategory_id: '',
      sub_subcategory_id: '',
      sku: '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      brand: '',
      unit: '200 g',
      unit_type: 'g',
      unit_value: '200',
      pack_size: '',
      sold_by: 'Piece',
      price: '',
      purchase_price: '',
      discount_price: '',
      vat_percentage: '15',
      price_includes_vat: true,
      stock_quantity: '',
      is_available: true,
      is_active: true,
      is_featured: false,
      is_new_arrival: true,
      is_best_seller: false,
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
      sub_subcategory_id: prod.sub_subcategory_id || '',
      sku: prod.sku || '',
      name_en: prod.name_en || '',
      name_ar: prod.name_ar || '',
      description_en: prod.description_en || '',
      description_ar: prod.description_ar || '',
      brand: prod.brand || '',
      unit: prod.unit || '200 g',
      unit_type: prod.unit_type || 'g',
      unit_value: prod.unit_value || '200',
      pack_size: prod.pack_size || '',
      sold_by: prod.sold_by || 'Piece',
      price: prod.price || '',
      purchase_price: prod.purchase_price || '',
      discount_price: prod.discount_price || '',
      vat_percentage: prod.vat_percentage !== undefined ? String(prod.vat_percentage) : '15',
      price_includes_vat: prod.price_includes_vat !== undefined ? prod.price_includes_vat : true,
      stock_quantity: prod.stock_quantity || '',
      is_available: prod.is_available !== undefined ? prod.is_available : true,
      is_active: prod.is_active !== undefined ? prod.is_active : true,
      is_featured: prod.is_featured !== undefined ? prod.is_featured : false,
      is_new_arrival: prod.is_new_arrival !== undefined ? prod.is_new_arrival : true,
      is_best_seller: prod.is_best_seller !== undefined ? prod.is_best_seller : false,
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
        category_id: productForm.category_id || null,
        subcategory_id: productForm.subcategory_id || null,
        sub_subcategory_id: productForm.sub_subcategory_id || null,
        brand: productForm.brand || null,
        unit_type: productForm.unit_type || null,
        unit_value: productForm.unit_value || null,
        pack_size: productForm.pack_size || null,
        sold_by: productForm.sold_by || null,
        purchase_price: productForm.purchase_price !== '' && productForm.purchase_price !== null ? parseFloat(productForm.purchase_price) : null,
        discount_price: productForm.discount_price !== '' && productForm.discount_price !== null ? parseFloat(productForm.discount_price) : null,
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
    if (selectedCategoryFilter && String(p.category_id) !== String(selectedCategoryFilter)) return false;
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
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
            {/* Top Row: Title & Subtitle on Left | "+ Add Grocery Item" Button on Top Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
                  <Apple className="w-6.5 h-6.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl font-black text-slate-900 whitespace-nowrap">
                      {locale === 'ar' ? 'إدارة كتالوج المواد الغذائية وطازج' : 'Fresh Product Catalog'}
                    </h1>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {products.length} {locale === 'ar' ? 'منتج' : 'Items'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {locale === 'ar' ? 'إدارة المنتجات وتحديد الأقسام والأقسام الفرعية الدقيقة للمخزون' : 'Manage products across 3 category levels, prices, stock, and image gallery'}
                  </p>
                </div>
              </div>

              {/* Add Grocery Item Button (Top Right) */}
              <button
                onClick={openAdd}
                className="h-11 px-5 rounded-xl flex items-center justify-center gap-2 bg-[#043927] hover:bg-[#02281b] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{locale === 'ar' ? 'إضافة صنف طازج' : 'Add Item'}</span>
              </button>
            </div>

            {/* Bottom Row: Filter Dropdown & Search Box aligned on the Right */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              {/* Category Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer transition-all shadow-2xs"
                >
                  <option value="">{locale === 'ar' ? 'جميع الأقسام الرئيسية' : 'All Main Categories'}</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'بحث بالمنتج أو SKU...' : 'Search item or SKU...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Table of Products */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-sans">Loading product catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 font-sans">
              No grocery products found. Click "Add Grocery Item" to create new listings.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden font-sans">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{locale === 'ar' ? 'المنتج والصور' : 'Product & Images'}</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'التسلسل الهرمي للقسم (٣ مستويات)' : 'Category Hierarchy (3 Levels)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'السعر' : 'Price (SAR)'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'المخزون' : 'Stock'}</th>
                      <th className="px-6 py-4">{locale === 'ar' ? 'الوحدة والعبوة' : 'Unit & Size'}</th>
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
                          <td className="px-6 py-4 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              {firstImg ? (
                                <div className="relative">
                                  <img
                                    src={firstImg}
                                    alt={prod.name_en}
                                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                                  />
                                  {imgList.length > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#05A764] text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
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
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug font-sans">
                                  {prod.name_en}
                                </h4>
                                <p className="text-xs text-emerald-700 font-bold">
                                  {prod.name_ar}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block font-mono">
                              {prod.sku}
                            </span>
                          </td>

                          {/* 3-Level Category Hierarchy Column */}
                          <td className="px-6 py-4 text-xs font-medium text-slate-700 min-w-[170px]">
                            <span className="font-extrabold text-slate-900 block">{prod.category?.name_en || 'Main Category'}</span>
                            {prod.subcategory && (
                              <span className="text-[11px] text-[#05A764] font-bold flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                ↪ {prod.subcategory.name_en}
                              </span>
                            )}
                            {prod.sub_subcategory && (
                              <span className="text-[10px] text-[#043927] font-extrabold flex items-center gap-1 mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 w-fit whitespace-nowrap">
                                ↳ {prod.sub_subcategory.name_en}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 font-black text-slate-900 text-base font-sans whitespace-nowrap">
                            {parseFloat(prod.price).toFixed(2)} <span className="text-xs font-bold text-slate-500">SAR</span>
                          </td>

                          {/* Stock Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center text-xs font-extrabold px-3 py-1.5 rounded-full border whitespace-nowrap ${prod.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                {prod.stock_quantity > 0 ? `Stock: ${prod.stock_quantity}` : 'Out of Stock'}
                              </span>
                              <button
                                onClick={() => openStockModal(prod)}
                                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-[#043927] rounded-xl text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 shadow-2xs border border-emerald-200/80 whitespace-nowrap"
                                title="Adjust Stock & View Movement History"
                              >
                                <Sliders className="w-3 h-3 text-[#05A764]" /> Adjust
                              </button>
                            </div>
                          </td>

                          {/* Unit & Size Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                            {prod.unit ? (
                              <span className="inline-block bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-800 font-semibold font-sans">
                                {(prod.unit_value)} {(prod.unit_type)} {(prod.pack_size)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal text-xs">-</span>
                            )}
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

      {/* Page View 2: Dedicated Add/Edit Product Form with 3-Level Category Selection */}
      {viewMode === 'form' && (
        <div className="space-y-6 font-sans">
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
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Apple className="w-6 h-6 text-emerald-600" />
                  {editingProduct ? (locale === 'ar' ? 'تعديل منتج بقالة' : 'Edit Grocery Item') : (locale === 'ar' ? 'إضافة منتج بقالة جديد' : 'Add New Item')}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {locale === 'ar' ? 'أدخل تفاصيل المنتج، الفئات، الأقسام الفرعية الفرعية، الصور المتعددة، السعر، والمخزون' : 'Fill in comprehensive product details across 3 category levels, stock, and image gallery'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </div>

          {/* Form Body - 2 Column Layout */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (2 Cols wide) */}
            <div className="lg:col-span-2 space-y-6">

              {/* CARD 1: CATEGORY CLASSIFICATION */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers className="w-4 h-4 text-[#05A764]" /> Category Classification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Level 1: Main Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Main Category (Level 1) *
                    </label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category_id: e.target.value,
                          subcategory_id: '',
                          sub_subcategory_id: '',
                        })
                      }
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
                    >
                      <option value="">-- Select Main Category --</option>
                      {mainCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_en} / {c.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Level 2: Sub-Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sub-Category (Level 2)
                    </label>
                    <select
                      disabled={!productForm.category_id}
                      value={productForm.subcategory_id}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          subcategory_id: e.target.value,
                          sub_subcategory_id: '',
                        })
                      }
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      <option value="">-- Select Sub-Category --</option>
                      {availableSubcategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name_en} / {sc.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Level 3: Sub-Subcategory */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sub-Subcategory (Level 3)
                    </label>
                    <select
                      disabled={!productForm.subcategory_id}
                      value={productForm.sub_subcategory_id}
                      onChange={(e) => setProductForm({ ...productForm, sub_subcategory_id: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      <option value="">-- Select Sub-Subcategory --</option>
                      {availableSubSubcategories.map((ssc) => (
                        <option key={ssc.id} value={ssc.id}>
                          {ssc.name_en} / {ssc.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Hierarchy Breadcrumb Preview Path Bar */}
                {(productForm.category_id || productForm.subcategory_id || productForm.sub_subcategory_id) && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-slate-700 font-sans mt-2 flex-wrap">
                    <span className="text-slate-400 font-bold">Selected Path:</span>
                    {productForm.category_id && (
                      <span className="bg-white border border-slate-200 text-slate-900 font-extrabold px-2.5 py-1 rounded-lg shadow-2xs">
                        {mainCategories.find((c) => String(c.id) === String(productForm.category_id))?.name_en || 'Main Category'}
                      </span>
                    )}
                    {productForm.subcategory_id && (
                      <>
                        <span className="text-slate-400">➔</span>
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold px-2.5 py-1 rounded-lg">
                          {subCategories.find((sc) => String(sc.id) === String(productForm.subcategory_id))?.name_en || 'Sub-Category'}
                        </span>
                      </>
                    )}
                    {productForm.sub_subcategory_id && (
                      <>
                        <span className="text-slate-400">➔</span>
                        <span className="bg-[#043927] text-white font-black px-2.5 py-1 rounded-lg shadow-2xs">
                          {subSubCategories.find((ssc) => String(ssc.id) === String(productForm.sub_subcategory_id))?.name_en || 'Sub-Subcategory'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* CARD 2: PRODUCT INFORMATION */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Apple className="w-4 h-4 text-[#05A764]" /> 2. Product Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Product Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mai Dubai Bottled Water 1.5L"
                      value={productForm.name_en}
                      onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Product Name (Arabic) / اسم المنتج *
                    </label>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      placeholder="مثال: مياه مي دبي معبأة ١.٥ لتر"
                      value={productForm.name_ar}
                      onChange={(e) => setProductForm({ ...productForm, name_ar: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Description (English)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Fresh organic produce sourced daily..."
                      value={productForm.description_en}
                      onChange={(e) => setProductForm({ ...productForm, description_en: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Description (Arabic) / الوصف
                    </label>
                    <textarea
                      rows={3}
                      dir="rtl"
                      placeholder="منتج طازج عالي الجودة..."
                      value={productForm.description_ar}
                      onChange={(e) => setProductForm({ ...productForm, description_ar: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Almarai, Nestlé, Mai Dubai, Fresh Farm"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>
              </div>

              {/* CARD 3: UNIT & PACKAGING */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Package className="w-4 h-4 text-[#05A764]" /> 3. Unit & Packaging
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Unit Type * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Unit Type *
                    </label>
                    <select
                      required
                      value={productForm.unit_type}
                      onChange={(e) => setProductForm({ ...productForm, unit_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer"
                    >
                      <option value="g">Gram (g)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="L">Liter (L)</option>
                      <option value="PCS">Piece (Pcs)</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack / Bundle</option>
                    </select>
                  </div>

                  {/* Unit Value * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Unit Value *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 200, 500, 1.5, 1"
                      value={productForm.unit_value}
                      onChange={(e) => setProductForm({ ...productForm, unit_value: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                    />
                  </div>

                  {/* Pack Size */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pack Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pack of 6, Box of 12"
                      value={productForm.pack_size}
                      onChange={(e) => setProductForm({ ...productForm, pack_size: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                    />
                  </div>

                  {/* Sold By */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sold By
                    </label>
                    <select
                      value={productForm.sold_by}
                      onChange={(e) => setProductForm({ ...productForm, sold_by: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer"
                    >
                      <option value="Piece">Piece / Item</option>
                      <option value="Weight">Weight (kg / g)</option>
                      <option value="Volume">Volume (L / ml)</option>
                      <option value="Box">Box / Bundle</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CARD 4: INVENTORY & STOCK */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShoppingBag className="w-4 h-4 text-[#05A764]" /> 4. Inventory & Stock
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GROC-001"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fresh Stock Qty *
                    </label>
                   
                      <input
                        type="number"
                        required
                        placeholder="100"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                  
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Product Status *
                    </label>
                    <select
                      value={productForm.is_active ? 'true' : 'false'}
                      onChange={(e) => setProductForm({ ...productForm, is_active: e.target.value === 'true' })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer"
                    >
                      <option value="true">Active (Enabled)</option>
                      <option value="false">Disabled (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CARD 5: PRICING */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Tag className="w-4 h-4 text-[#05A764]" /> 5. Pricing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                

                  {/* Selling Price * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Selling Price *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="14.50"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-black focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-700">SAR</span>
                    </div>
                  </div>

                  {/* Discount Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Discount Price
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 12.00"
                        value={productForm.discount_price}
                        onChange={(e) => setProductForm({ ...productForm, discount_price: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">SAR</span>
                    </div>
                  </div>

                  {/* VAT % */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      VAT %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="15"
                        value={productForm.vat_percentage}
                        onChange={(e) => setProductForm({ ...productForm, vat_percentage: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Price Includes VAT Toggle Checkbox */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between mt-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-900 block">Price Includes VAT</span>
                    <span className="text-[11px] text-slate-500 font-medium">When enabled, the selling price already includes calculated tax (ZATCA compliant).</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.price_includes_vat}
                      onChange={(e) => setProductForm({ ...productForm, price_includes_vat: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                  </label>
                </div>
              </div>

              {/* CARD 6: ONLINE STORE */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Globe className="w-4 h-4 text-[#05A764]" /> 6. Online Store
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Show on Website */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5 pr-3">
                      <span className="text-xs font-extrabold text-slate-900 block">Show on Website</span>
                      <span className="text-[11px] text-slate-500 font-medium block">Display product on website & mobile storefront</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={productForm.is_available}
                        onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                    </label>
                  </div>

                  {/* Featured */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5 pr-3">
                      <span className="text-xs font-extrabold text-slate-900 block">Featured</span>
                      <span className="text-[11px] text-slate-500 font-medium block">Highlight in featured product sections</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={productForm.is_featured}
                        onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                    </label>
                  </div>

                  {/* New Arrival */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5 pr-3">
                      <span className="text-xs font-extrabold text-slate-900 block">New Arrival</span>
                      <span className="text-[11px] text-slate-500 font-medium block">Show NEW badge on store listings</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={productForm.is_new_arrival}
                        onChange={(e) => setProductForm({ ...productForm, is_new_arrival: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                    </label>
                  </div>

                  {/* Best Seller */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5 pr-3">
                      <span className="text-xs font-extrabold text-slate-900 block">Best Seller</span>
                      <span className="text-[11px] text-slate-500 font-medium block">Mark item as top customer favorite</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={productForm.is_best_seller}
                        onChange={(e) => setProductForm({ ...productForm, is_best_seller: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                    </label>
                  </div>
                </div>

                {/* Product Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product Status *
                  </label>
                  <select
                    value={productForm.is_active ? 'true' : 'false'}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.value === 'true' })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer"
                  >
                    <option value="true">Active (Enabled on Store)</option>
                    <option value="false">Disabled (Hidden / Archived)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Right Column - Multiple Images Upload */}
            <div className="space-y-6">

              {/* Product Gallery Images Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Gallery Images ({productForm.images.length})
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
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#043927] file:text-white hover:file:bg-[#02281b] cursor-pointer border border-slate-200 rounded-xl p-1 bg-white"
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
                        className="px-3 py-2 bg-[#043927] hover:bg-[#02281b] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
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
                      Uploaded Gallery Images:
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
                  </div>
                )}
              </div>

            </div>

          </form>
        </div>
      )}

      {/* STOCK ADJUSTMENT & MANAGEMENT MODAL */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sliders className="w-3.5 h-3.5" /> Stock Adjustment & Inventory Audit
                </span>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {stockModalProduct.name_en}
                </h2>
                <p className="text-xs text-slate-500 font-mono font-medium">
                  SKU: <span className="font-bold text-slate-800">{stockModalProduct.sku}</span> | Current Stock: <span className="font-bold text-emerald-700">{stockModalProduct.stock_quantity || 0} {stockModalProduct.unit || 'PCS'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Adjustment Form */}
            <form onSubmit={handleSaveStockAdjustment} className="space-y-5">
              {/* Movement Type Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Adjustment Movement Type *
                </label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStockAdjType('RESTOCK')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stockAdjType === 'RESTOCK'
                        ? 'bg-[#043927] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    📥 Restock (+ Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjType('DAMAGE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stockAdjType === 'DAMAGE'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-300" />
                    📤 Waste / Damage (- Remove)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjType('CORRECTION')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stockAdjType === 'CORRECTION'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 text-amber-200" />
                    ✏️ Audit Count (Set Total)
                  </button>
                </div>
              </div>

              {/* Quantity / New Total Inputs */}
              {stockAdjType === 'CORRECTION' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Exact Stock Count Total *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 150"
                    value={stockAdjNewTotal}
                    onChange={(e) => setStockAdjNewTotal(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-extrabold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Calculated Change: <span className="font-bold text-slate-800">{parseInt(stockAdjNewTotal || '0', 10) - (stockModalProduct.stock_quantity || 0) >= 0 ? `+${parseInt(stockAdjNewTotal || '0', 10) - (stockModalProduct.stock_quantity || 0)}` : `${parseInt(stockAdjNewTotal || '0', 10) - (stockModalProduct.stock_quantity || 0)}`} PCS</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {stockAdjType === 'RESTOCK' ? 'Quantity to Add (+)' : 'Quantity to Remove (-)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={stockAdjQty}
                    onChange={(e) => setStockAdjQty(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-extrabold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Resulting Total Stock: <span className="font-extrabold text-emerald-700">
                      {stockAdjType === 'RESTOCK'
                        ? (stockModalProduct.stock_quantity || 0) + (parseInt(stockAdjQty || '0', 10))
                        : Math.max(0, (stockModalProduct.stock_quantity || 0) - (parseInt(stockAdjQty || '0', 10)))} {stockModalProduct.unit || 'PCS'}
                    </span>
                  </p>
                </div>
              )}

              {/* Adjustment Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adjustment Reason / Audit Note *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    stockAdjType === 'RESTOCK'
                      ? 'e.g. Supplier Shipment Batch #402 received'
                      : stockAdjType === 'DAMAGE'
                      ? 'e.g. Discarded 5 expired / damaged items'
                      : 'e.g. Annual physical inventory audit reconciliation'
                  }
                  value={stockAdjReason}
                  onChange={(e) => setStockAdjReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#043927]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStockAdj}
                  className="px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingStockAdj ? 'Saving...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>

            {/* Stock Movement Audit Trail History */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" /> Stock Movement Audit Log ({stockLogs.length})
              </h4>

              {loadingStockLogs ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium animate-pulse">
                  Loading stock audit trail history...
                </div>
              ) : stockLogs.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {stockLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-sans"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                              log.type === 'RESTOCK' || log.type === 'ADD'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : log.type === 'DAMAGE' || log.type === 'REMOVE'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="font-extrabold text-slate-800">
                            {log.quantity >= 0 ? `+${log.quantity}` : log.quantity} PCS
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({log.previous_stock} ➔ {log.new_stock})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {log.reason || 'No note provided'}
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-medium shrink-0 pl-2">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No stock adjustment history logged yet for this item.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
