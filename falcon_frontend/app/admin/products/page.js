'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { ShoppingBag, Plus, Search, Edit3, Trash2, X, Apple, Layers, Image as ImageIcon, Sparkles } from 'lucide-react';

const SAMPLE_GROCERY_IMAGES = [
  { name: 'Fresh Apples', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop' },
  { name: 'Fresh Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop' },
  { name: 'Orange Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop' },
  { name: 'Fresh Vegetables', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop' },
  { name: 'Bakery Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop' },
];

export default function AdminProductsPage() {
  const { t, locale } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    category_id: '',
    subcategory_id: '',
    sku: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    price: '',
    stock_quantity: '',
    image_url: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/categories'),
      ]);
      if (prodRes.success) setProducts(prodRes.data.products?.products || prodRes.data.products || []);
      if (catRes.success) setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const availableSubcategories = categories.filter((c) => c.parent_id === productForm.category_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        images: productForm.image_url ? [productForm.image_url] : [],
      };

      if (editingProduct) {
        const res = await fetchApi(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          alert(locale === 'ar' ? 'تم تحديث منتج البقالة بنجاح!' : 'Grocery item updated successfully!');
        }
      } else {
        const res = await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          alert(locale === 'ar' ? 'تم إضافة منتج البقالة بنجاح!' : 'Fresh grocery item created successfully!');
        }
      }
      setShowModal(false);
      setEditingProduct(null);
      setProductForm({ category_id: '', subcategory_id: '', sku: '', name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', stock_quantity: '', image_url: '' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this grocery item?')) return;
    try {
      const res = await fetchApi(`/products/${productId}`, { method: 'DELETE' });
      if (res.success) {
        alert('Grocery product deleted successfully');
        await loadData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      category_id: prod.category_id,
      subcategory_id: prod.subcategory_id || '',
      sku: prod.sku,
      name_en: prod.name_en,
      name_ar: prod.name_ar,
      description_en: prod.description_en || '',
      description_ar: prod.description_ar || '',
      price: prod.price,
      stock_quantity: prod.stock_quantity,
      image_url: prod.images?.[0]?.image_url || '',
    });
    setShowModal(true);
  };

  const filteredProducts = products.filter((p) => {
    const title = (locale === 'ar' ? p.name_ar : p.name_en) || '';
    const sku = p.sku || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة كتالوج المواد الغذائية والطازج' : 'Fresh Produce & Grocery Catalog'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'إضافة وتعديل أصناف الخضروات، الفواكه، المشروبات، وتحديد الأقسام الفرعية والمخزون' : 'Manage fresh produce SKUs, sub-categories, prices, and stock inventory'}
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
            onClick={() => { setEditingProduct(null); setProductForm({ category_id: '', subcategory_id: '', sku: '', name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', stock_quantity: '', image_url: '' }); setShowModal(true); }}
            className="text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة صنف طازج' : 'Add Fresh Grocery Item'}
          </button>
        </div>
      </div>

      {/* Table of Products */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading fresh produce catalog...</div>
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
                  <th className="px-6 py-4">{locale === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">{locale === 'ar' ? 'القسم / القسم الفرعي' : 'Category / Sub-Category'}</th>
                  <th className="px-6 py-4">{locale === 'ar' ? 'السعر' : 'Price (SAR)'}</th>
                  <th className="px-6 py-4">{locale === 'ar' ? 'المخزون' : 'Stock Inventory'}</th>
                  <th className="px-6 py-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const imgUrl = prod.images?.[0]?.image_url;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={prod.name_en}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                            />
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
                        <span className="font-bold text-slate-900 block">{prod.category?.name_en || 'Main Category'}</span>
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
                          {prod.stock_quantity > 0 ? `${prod.stock_quantity} units` : 'Out of Stock'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(prod)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">{editingProduct ? 'Edit Grocery Item' : 'Add New Fresh Grocery Item'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Main Category</label>
                <select
                  required
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value, subcategory_id: '' })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold"
                >
                  <option value="">-- Select Main Category --</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>
                  ))}
                </select>
              </div>

              {productForm.category_id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" /> Sub-Category (Optional)
                  </label>
                  <select
                    value={productForm.subcategory_id}
                    onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                  >
                    <option value="">-- Select Sub-Category (Optional) --</option>
                    {availableSubcategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name_en} / {sc.name_ar}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Image Section */}
              <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" /> Product Image (File Upload / Image URL)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Upload File from Computer:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProductForm({ ...productForm, image_url: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Or Paste Image URL:</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                </div>

                {productForm.image_url && (
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-200">
                    <img
                      src={productForm.image_url}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-white"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold text-emerald-700">Image Loaded!</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{productForm.image_url.substring(0, 45)}...</p>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Sample Grocery Images:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_GROCERY_IMAGES.map((img, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setProductForm({ ...productForm, image_url: img.url })}
                        className="text-[10px] bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 px-2 py-1 rounded-lg text-slate-600 transition-all font-medium cursor-pointer"
                      >
                        + {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">SKU Code</label>
                  <input type="text" required placeholder="GROC-001" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Price (SAR)</label>
                  <input type="number" step="0.01" required placeholder="14.50" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Name (English)</label>
                  <input type="text" required placeholder="Fresh Organic Apples (1 kg)" value={productForm.name_en} onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">اسم المنتج (بالعربية)</label>
                  <input type="text" required placeholder="تفاح أحمر طازج (١ كجم)" value={productForm.name_ar} onChange={(e) => setProductForm({ ...productForm, name_ar: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Fresh Stock Quantity (Units/Kg/Packs)</label>
                <input type="number" required placeholder="100" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 text-sm font-semibold py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 text-sm font-semibold py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer">Save Grocery Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

