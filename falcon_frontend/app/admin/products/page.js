'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useAuth } from '../../../src/contexts/AuthContext';
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
  AlertCircle,
  Star,
  ArrowUp,
  ArrowDown,
  FileText,
  Activity,
  Check,
  Calendar,
} from 'lucide-react';

export default function AdminProductsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Server-Side Filters (Active/Inactive Status & Date Range)
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // Gallery Images Upload & Metadata State
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [productFileMetas, setProductFileMetas] = useState({}); // { [imgUrl]: { size, type, name } }

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
    sub_sub_subcategory_id: '',
    sku: '',
    name_en: '',
    name_ar: '',
    description_title_en: '',
    description_title_ar: '',
    description_en: '',
    description_ar: '',
    long_description_en: '',
    long_description_ar: '',
    highlights: [],
    nutrition_facts: {
      serving_size: '',
      calories: '',
      protein: '',
      carbohydrates: '',
      fat: '',
      fiber: '',
      sugar: '',
      vitamins: '',
      minerals: '',
    },
    brand: '',
    unit: '',
    unit_type: 'kg',
    unit_value: '',
    pack_size: '',
    sold_by: '',
    price: '',
    purchase_price: '',
    discount_price: '',
    vat_percentage: '15',
    price_includes_vat: true,
    stock_quantity: '',
    is_available: false,
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
    is_best_seller: false,
    is_best_deal: false,
    is_popular_pick: false,
    has_variants: false,
    rating: '',
    reviews_count: '',
    variants: [],
    images: [],
  });

  const loadData = async (overrideParams = {}) => {
    try {
      setLoading(true);
      const activeStatus = overrideParams.statusFilter !== undefined ? overrideParams.statusFilter : statusFilter;
      const activeStart = overrideParams.startDate !== undefined ? overrideParams.startDate : startDate;
      const activeEnd = overrideParams.endDate !== undefined ? overrideParams.endDate : endDate;

      const params = new URLSearchParams();
      params.append('onlyActive', 'false');
      params.append('all', 'true');
      params.append('limit', '1000');

      if (activeStatus && activeStatus !== 'ALL') {
        params.append('status', activeStatus.toLowerCase());
      }
      if (activeStart) {
        params.append('startDate', activeStart);
      }
      if (activeEnd) {
        params.append('endDate', activeEnd);
      }

      const [prodRes, catRes] = await Promise.all([
        fetchApi(`/products?${params.toString()}`),
        categories.length === 0 ? fetchApi('/categories?all=true') : Promise.resolve({ success: true, data: { categories } }),
      ]);
      if (prodRes.success) {
        setProducts(prodRes.data?.products?.products || prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []));
      }
      if (catRes.success && categories.length === 0) {
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
  }, [statusFilter, startDate, endDate]);

  // Compute 4 Levels of Category Hierarchy
  const mainCategories = categories.filter((c) => !c.parent_id);
  const mainIds = new Set(mainCategories.map((c) => c.id));

  const subCategories = categories.filter((c) => c.parent_id && mainIds.has(c.parent_id));
  const subIds = new Set(subCategories.map((c) => c.id));

  const subSubCategories = categories.filter((c) => c.parent_id && subIds.has(c.parent_id));
  const subSubIds = new Set(subSubCategories.map((c) => c.id));

  const subSubSubCategories = categories.filter((c) => c.parent_id && (subSubIds.has(c.parent_id) || (!subIds.has(c.parent_id) && !mainIds.has(c.parent_id) && c.parent_id !== null)));

  // Available Level 2 options based on selected Level 1 (category_id)
  const availableSubcategories = subCategories.filter((sc) => String(sc.parent_id) === String(productForm.category_id));

  // Available Level 3 options based on selected Level 2 (subcategory_id)
  const availableSubSubcategories = subSubCategories.filter((ssc) => String(ssc.parent_id) === String(productForm.subcategory_id));

  // Available Level 4 options based on selected Level 3 (sub_subcategory_id)
  const availableSubSubSubcategories = subSubSubCategories.filter((sssc) => String(sssc.parent_id) === String(productForm.sub_subcategory_id));

  const resetForm = () => {
    setEditingProduct(null);
    setUrlInput('');
    setProductForm({
      category_id: '',
      subcategory_id: '',
      sub_subcategory_id: '',
      sub_sub_subcategory_id: '',
      sku: '',
      name_en: '',
      name_ar: '',
      description_title_en: '',
      description_title_ar: '',
      description_en: '',
      description_ar: '',
      long_description_en: '',
      long_description_ar: '',
      highlights: [],
      nutrition_facts: {
        serving_size: '',
        calories: '',
        protein: '',
        carbohydrates: '',
        fat: '',
        fiber: '',
        sugar: '',
        vitamins: '',
        minerals: '',
      },
      brand: '',
      unit: '',
      unit_type: 'kg',
      unit_value: '',
      pack_size: '',
      sold_by: 'Piece',
      price: '',
      purchase_price: '',
      discount_price: '',
      vat_percentage: '15',
      price_includes_vat: true,
      stock_quantity: '',
      is_available: false,
      is_active: true,
      is_featured: false,
      is_new_arrival: false,
      is_best_seller: false,
      is_best_deal: false,
      is_popular_pick: false,
      has_variants: false,
      rating: '',
      reviews_count: '',
      variants: [],
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

    const loadedVariants = Array.isArray(prod.variants)
      ? prod.variants.map((v) => ({
          id: v.id,
          sku: v.sku || '',
          unit_value: v.unit_value || '',
          unit_type: v.unit_type || 'kg',
          pack_size: v.pack_size || '',
          price: v.price !== undefined ? String(v.price) : '',
          discount_price: v.discount_price !== undefined && v.discount_price !== null ? String(v.discount_price) : '',
          stock_quantity: v.stock_quantity !== undefined ? String(v.stock_quantity) : '0',
          image_url: v.image_url || '',
          is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
        }))
      : [];

    let loadedHighlights = [];
    if (Array.isArray(prod.highlights)) {
      loadedHighlights = prod.highlights.map((h, i) => {
        if (typeof h === 'string') return { id: `hl-${i}`, text_en: h, text_ar: '' };
        return {
          id: h.id || `hl-${i}`,
          text_en: h.text_en || h.en || (typeof h === 'string' ? h : ''),
          text_ar: h.text_ar || h.ar || '',
        };
      });
    } else if (typeof prod.highlights === 'string') {
      try {
        const parsed = JSON.parse(prod.highlights);
        if (Array.isArray(parsed)) {
          loadedHighlights = parsed.map((h, i) => {
            if (typeof h === 'string') return { id: `hl-${i}`, text_en: h, text_ar: '' };
            return {
              id: h.id || `hl-${i}`,
              text_en: h.text_en || h.en || '',
              text_ar: h.text_ar || h.ar || '',
            };
          });
        }
      } catch (e) {}
    }

    let loadedNutrition = {
      serving_size: '',
      calories: '',
      protein: '',
      carbohydrates: '',
      fat: '',
      fiber: '',
      sugar: '',
      vitamins: '',
      minerals: '',
    };
    if (prod.nutrition_facts && typeof prod.nutrition_facts === 'object') {
      loadedNutrition = {
        ...loadedNutrition,
        ...prod.nutrition_facts,
      };
    } else if (typeof prod.nutrition_facts === 'string') {
      try {
        const parsed = JSON.parse(prod.nutrition_facts);
        if (typeof parsed === 'object' && parsed !== null) {
          loadedNutrition = { ...loadedNutrition, ...parsed };
        }
      } catch (e) {}
    }

    setProductForm({
      category_id: prod.category_id || '',
      subcategory_id: prod.subcategory_id || '',
      sub_subcategory_id: prod.sub_subcategory_id || '',
      sub_sub_subcategory_id: prod.sub_sub_subcategory_id || '',
      sku: prod.sku || '',
      name_en: prod.name_en || '',
      name_ar: prod.name_ar || '',
      description_title_en: prod.description_title_en || '',
      description_title_ar: prod.description_title_ar || '',
      description_en: prod.description_en || '',
      description_ar: prod.description_ar || '',
      long_description_en: prod.long_description_en || '',
      long_description_ar: prod.long_description_ar || '',
      highlights: loadedHighlights,
      nutrition_facts: loadedNutrition,
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
      is_best_deal: prod.is_best_deal !== undefined ? prod.is_best_deal : false,
      is_popular_pick: prod.is_popular_pick !== undefined ? prod.is_popular_pick : false,
      has_variants: Boolean(prod.has_variants),
      rating: prod.rating !== undefined && prod.rating !== null ? String(prod.rating) : '4.8',
      reviews_count: prod.reviews_count !== undefined && prod.reviews_count !== null ? String(prod.reviews_count) : (prod.reviews ? String(prod.reviews) : '120'),
      variants: loadedVariants,
      images: initialImgs,
    });
    setViewMode('form');
  };

  const handleAddVariant = () => {
    const nextIdx = (productForm.variants?.length || 0) + 1;
    const baseSku = productForm.sku ? productForm.sku.trim() : '';
    const newVariant = {
      id: null,
      sku: baseSku ? `${baseSku}-V${nextIdx}`.toUpperCase() : '',
      unit_value: '',
      unit_type: productForm.unit_type || 'kg',
      pack_size: '',
      price: '',
      discount_price: '',
      stock_quantity: '',
      image_url: '',
      is_active: true,
    };
    setProductForm((prev) => ({
      ...prev,
      has_variants: true,
      variants: [...(prev.variants || []), newVariant],
    }));
  };

  const handleRemoveVariant = (index) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Highlights Management Handlers
  const handleAddHighlight = () => {
    setProductForm((prev) => ({
      ...prev,
      highlights: [
        ...(prev.highlights || []),
        { id: `hl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, text_en: '', text_ar: '' },
      ],
    }));
  };

  const handleUpdateHighlight = (index, field, value) => {
    setProductForm((prev) => {
      const updated = [...(prev.highlights || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, highlights: updated };
    });
  };

  const handleDeleteHighlight = (index) => {
    setProductForm((prev) => {
      const updated = [...(prev.highlights || [])];
      updated.splice(index, 1);
      return { ...prev, highlights: updated };
    });
  };

  const handleMoveHighlight = (index, direction) => {
    setProductForm((prev) => {
      const updated = [...(prev.highlights || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, highlights: updated };
    });
  };

  // Nutrition Facts Management Handler
  const handleNutritionChange = (field, value) => {
    setProductForm((prev) => ({
      ...prev,
      nutrition_facts: {
        ...(prev.nutrition_facts || {}),
        [field]: value,
      },
    }));
  };

  const handleUpdateVariant = (index, field, value) => {
    setProductForm((prev) => {
      const nextVars = [...prev.variants];
      nextVars[index] = { ...nextVars[index], [field]: value };
      return { ...prev, variants: nextVars };
    });
  };

  const handleApplyPresetVariants = (presetType) => {
    const baseSku = productForm.sku ? productForm.sku.trim() : 'ITEM';
    let presets = [];
    if (presetType === 'rice') {
      presets = [
        { unit_value: '1', unit_type: 'kg', pack_size: '1kg Pouch', price: '12.00', discount_price: '', stock_quantity: '50' },
        { unit_value: '5', unit_type: 'kg', pack_size: '5kg Bag', price: '55.00', discount_price: '50.00', stock_quantity: '30' },
        { unit_value: '10', unit_type: 'kg', pack_size: '10kg Sack', price: '105.00', discount_price: '95.00', stock_quantity: '20' },
      ];
    } else if (presetType === 'oil') {
      presets = [
        { unit_value: '1', unit_type: 'L', pack_size: '1L Bottle', price: '14.50', discount_price: '', stock_quantity: '40' },
        { unit_value: '2', unit_type: 'L', pack_size: '2L Can', price: '27.00', discount_price: '25.00', stock_quantity: '30' },
        { unit_value: '5', unit_type: 'L', pack_size: '5L Jerry Can', price: '65.00', discount_price: '59.00', stock_quantity: '15' },
      ];
    } else if (presetType === 'eggs') {
      presets = [
        { unit_value: '6', unit_type: 'pcs', pack_size: '6 Pack Carton', price: '8.50', discount_price: '', stock_quantity: '60' },
        { unit_value: '12', unit_type: 'pcs', pack_size: '12 Pack Carton (Dozen)', price: '16.00', discount_price: '14.50', stock_quantity: '45' },
        { unit_value: '30', unit_type: 'pcs', pack_size: '30 Pieces Tray', price: '36.00', discount_price: '32.00', stock_quantity: '25' },
      ];
    }

    const generated = presets.map((p) => ({
      id: null,
      sku: `${baseSku}-${p.unit_value}${p.unit_type}`.toUpperCase().replace(/\s+/g, ''),
      unit_value: p.unit_value,
      unit_type: p.unit_type,
      pack_size: p.pack_size,
      price: p.price,
      discount_price: p.discount_price,
      stock_quantity: p.stock_quantity,
      image_url: productForm.images?.[0] || '',
      is_active: true,
    }));

    setProductForm((prev) => ({
      ...prev,
      has_variants: true,
      variants: [...(prev.variants || []), ...generated],
    }));
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
    if (files.length === 0) return;

    // Client-side validation: Max 5MB per file
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > MAX_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      showToast(
        locale === 'ar'
          ? `حجم الملف يجب ألا يتجاوز 5 ميجابايت (${oversizedFiles[0].name})`
          : `File size must not exceed 5MB (${oversizedFiles[0].name})`,
        'error'
      );
      e.target.value = '';
      return;
    }

    try {
      setUploadingProductImages(true);
      const formData = new FormData();
      if (files.length === 1) {
        const file = files[0];
        formData.append('file', file);
        const res = await fetchApi('/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.success && res.data?.url) {
          handleAddImage(res.data.url);
          setProductFileMetas((prev) => ({
            ...prev,
            [res.data.url]: {
              size: res.data.formattedSize,
              type: res.data.fileType,
              name: res.data.originalname || file.name,
            },
          }));
        }
      } else {
        files.forEach((f) => formData.append('files', f));
        const res = await fetchApi('/upload/multiple', {
          method: 'POST',
          body: formData,
        });
        if (res.success && Array.isArray(res.data?.files)) {
          const newMetas = {};
          res.data.files.forEach((item) => {
            if (item.url) {
              handleAddImage(item.url);
              newMetas[item.url] = {
                size: item.formattedSize,
                type: item.fileType,
                name: item.originalname || item.filename,
              };
            }
          });
          setProductFileMetas((prev) => ({ ...prev, ...newMetas }));
        }
      }
      showToast(
        locale === 'ar' ? 'تم رفع الصور بنجاح إلى السيرفر!' : 'Images uploaded to server successfully!',
        'success'
      );
    } catch (err) {
      console.error('File upload error:', err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingProductImages(false);
      e.target.value = '';
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
      if (productForm.has_variants) {
        if (!productForm.variants || productForm.variants.length === 0) {
          throw new Error(locale === 'ar' ? 'يرجى إضافة متغير واحد على الأقل أو تعطيل خيار المتغيرات' : 'Please add at least one variant or disable Has Variants toggle');
        }

        const skuSet = new Set();
        for (let i = 0; i < productForm.variants.length; i++) {
          const v = productForm.variants[i];
          const skuCode = (v.sku || '').trim().toUpperCase();
          if (!skuCode) {
            throw new Error(locale === 'ar' ? `رمز SKU مفقود في الصف #${i + 1}` : `Variant row #${i + 1} is missing a SKU code`);
          }
          if (skuSet.has(skuCode)) {
            throw new Error(locale === 'ar' ? `رمز SKU مكرر "${skuCode}" في المتغيرات` : `Duplicate SKU "${skuCode}" found in variants`);
          }
          skuSet.add(skuCode);

          const priceVal = parseFloat(v.price);
          if (isNaN(priceVal) || priceVal < 0) {
            throw new Error(locale === 'ar' ? `سعر غير صالح في الصف #${i + 1} (${skuCode})` : `Invalid price for variant row #${i + 1} (${skuCode})`);
          }

          if (v.discount_price !== '' && v.discount_price !== null && v.discount_price !== undefined) {
            const discVal = parseFloat(v.discount_price);
            if (isNaN(discVal) || discVal < 0) {
              throw new Error(locale === 'ar' ? `سعر الخصم غير صالح في الصف #${i + 1} (${skuCode})` : `Invalid discount price for variant row #${i + 1} (${skuCode})`);
            }
          }

          const stockVal = parseInt(v.stock_quantity !== '' ? v.stock_quantity : '0', 10);
          if (isNaN(stockVal) || stockVal < 0) {
            throw new Error(locale === 'ar' ? `المخزون لا يمكن أن يكون سالباً في الصف #${i + 1} (${skuCode})` : `Variant stock cannot be negative for row #${i + 1} (${skuCode})`);
          }
        }
      }

      let finalPrice = productForm.price;
      let finalStock = productForm.stock_quantity;
      if (productForm.has_variants && productForm.variants?.length > 0) {
        const minVarPrice = Math.min(...productForm.variants.map(v => parseFloat(v.price)));
        const sumVarStock = productForm.variants.reduce((acc, v) => acc + parseInt(v.stock_quantity || '0', 10), 0);
        if (!finalPrice || finalPrice === '') {
          finalPrice = String(minVarPrice);
        }
        finalStock = String(sumVarStock);
      }

      const payload = {
        ...productForm,
        rating: productForm.rating !== '' && productForm.rating !== null ? parseFloat(productForm.rating) : 4.8,
        reviews_count: productForm.reviews_count !== '' && productForm.reviews_count !== null ? parseInt(productForm.reviews_count, 10) : 120,
        price: finalPrice,
        stock_quantity: finalStock,
        category_id: productForm.category_id || null,
        subcategory_id: productForm.subcategory_id || null,
        sub_subcategory_id: productForm.sub_subcategory_id || null,
        sub_sub_subcategory_id: productForm.sub_sub_subcategory_id || null,
        description_title_en: productForm.description_title_en || null,
        description_title_ar: productForm.description_title_ar || null,
        long_description_en: productForm.long_description_en || null,
        long_description_ar: productForm.long_description_ar || null,
        highlights: Array.isArray(productForm.highlights)
          ? productForm.highlights.filter((h) => (h.text_en && h.text_en.trim()) || (h.text_ar && h.text_ar.trim()))
          : [],
        nutrition_facts: productForm.nutrition_facts || {},
        brand: productForm.brand || null,
        unit_type: productForm.unit_type || null,
        unit_value: productForm.unit_value || null,
        pack_size: productForm.pack_size || null,
        sold_by: productForm.sold_by || null,
        purchase_price: productForm.purchase_price !== '' && productForm.purchase_price !== null ? parseFloat(productForm.purchase_price) : null,
        discount_price: productForm.discount_price !== '' && productForm.discount_price !== null ? parseFloat(productForm.discount_price) : null,
        has_variants: Boolean(productForm.has_variants),
        variants: productForm.has_variants && Array.isArray(productForm.variants)
          ? productForm.variants.map((v) => ({
              id: v.id || undefined,
              sku: (v.sku || '').trim(),
              unit_value: v.unit_value || null,
              unit_type: v.unit_type || null,
              pack_size: v.pack_size || null,
              price: parseFloat(v.price),
              discount_price: v.discount_price !== '' && v.discount_price !== null ? parseFloat(v.discount_price) : null,
              stock_quantity: parseInt(v.stock_quantity !== '' ? v.stock_quantity : '0', 10),
              image_url: v.image_url || null,
              is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
            }))
          : [],
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
                      {filteredProducts.length} {locale === 'ar' ? 'منتج' : 'Items'}
                    </span>
                    {statusFilter === 'ACTIVE' && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                        {locale === 'ar' ? 'النشطة فقط' : 'Active Only'}
                      </span>
                    )}
                    {statusFilter === 'INACTIVE' && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300">
                        {locale === 'ar' ? 'المعطلة فقط' : 'Inactive Only'}
                      </span>
                    )}
                    {(startDate || endDate) && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                        {locale === 'ar' ? 'تاريخ مخصص' : 'Date Range'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {locale === 'ar' ? 'إدارة المنتجات وتحديد الأقسام والأقسام الفرعية الدقيقة للمخزون' : 'Manage products across 4 category levels, prices, stock, and image gallery'}
                  </p>
                </div>
              </div>

              {/* Add Grocery Item Button (Top Right) */}
              {canCreate && (
                <button
                  onClick={openAdd}
                  className="h-11 px-5 rounded-xl flex items-center justify-center gap-2 bg-[#043927] hover:bg-[#02281b] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>{locale === 'ar' ? 'إضافة صنف طازج' : 'Add Item'}</span>
                </button>
              )}
            </div>

            {/* Bottom Row: Comprehensive Server & Client Filters Bar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-1">
              {/* Left group: Status Filter & Date Range Filter (Server-side) */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Dropdown Filter (Server-side) */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 px-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="ALL">{locale === 'ar' ? 'جميع الحالات (الكل)' : 'All Products (All)'}</option>
                    <option value="ACTIVE">{locale === 'ar' ? 'المنتجات النشطة فقط' : 'Active Products Only'}</option>
                    <option value="INACTIVE">{locale === 'ar' ? 'المنتجات المعطلة فقط' : 'Inactive Products Only'}</option>
                  </select>
                </div>

                {/* Date Range: From Date */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 shadow-2xs focus-within:bg-white focus-within:border-[#043927] transition-all">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    {locale === 'ar' ? 'من' : 'From'}
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    title={locale === 'ar' ? 'من تاريخ الإضافة' : 'Created From Date'}
                  />
                </div>

                {/* Date Range: To Date */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 shadow-2xs focus-within:bg-white focus-within:border-[#043927] transition-all">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    {locale === 'ar' ? 'إلى' : 'To'}
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    title={locale === 'ar' ? 'إلى تاريخ الإضافة' : 'Created To Date'}
                  />
                </div>

                {/* Reset Filters button if any filter is active */}
                {(statusFilter !== 'ALL' || startDate || endDate || selectedCategoryFilter || searchQuery) && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setStartDate('');
                      setEndDate('');
                      setSelectedCategoryFilter('');
                      setSearchQuery('');
                    }}
                    className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs shrink-0"
                    title={locale === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset All Filters'}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'مسح الفلاتر' : 'Reset'}</span>
                  </button>
                )}
              </div>

              {/* Right group: Category Filter Dropdown & Search Box */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {/* Category Filter Dropdown */}
                {/* <div className="relative w-full sm:w-auto">
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
                </div> */}

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
                      <th className="px-6 py-4">{locale === 'ar' ? 'التسلسل الهرمي للقسم (٤ مستويات)' : 'Category Hierarchy (4 Levels)'}</th>
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
                                    src={getImageUrl(firstImg)}
                                    alt={prod.name_en}
                                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextSibling) {
                                        e.currentTarget.nextSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-emerald-600" style={{ display: 'none' }}>
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
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
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {prod.is_popular_pick && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                                      ⭐ Popular Pick
                                    </span>
                                  )}
                                  {prod.is_best_deal && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                                      🔥 Best Deal
                                    </span>
                                  )}
                                  {prod.is_best_seller && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                      ⭐ Best Seller
                                    </span>
                                  )}
                                  {prod.is_featured && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      ✨ Featured
                                    </span>
                                  )}
                                  {prod.has_variants && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                                      ⚡ {prod.variants?.length || 0} Variants
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                    <span className="text-amber-500 font-bold">★</span>
                                    <span>{prod.rating ? Number(prod.rating).toFixed(1) : '4.8'}</span>
                                    <span className="text-slate-400 font-normal">({Number(prod.reviews_count ?? prod.reviews ?? 0).toLocaleString()})</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block font-mono">
                              {prod.sku}
                            </span>
                          </td>

                          {/* 4-Level Category Hierarchy Column */}
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
                            {prod.sub_sub_subcategory && (
                              <span className="text-[10px] text-emerald-900 font-black flex items-center gap-1 mt-0.5 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 w-fit whitespace-nowrap">
                                ↳ {prod.sub_sub_subcategory.name_en}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 font-black text-slate-900 text-base font-sans whitespace-nowrap">
                            {prod.has_variants && prod.variants && prod.variants.length > 0 ? (
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">From</span>
                                <span>{Math.min(...prod.variants.map((v) => parseFloat(v.price) || 0)).toFixed(2)}</span>
                                <span className="text-xs font-bold text-slate-500 ml-1">SAR</span>
                              </div>
                            ) : (
                              <>
                                {parseFloat(prod.price).toFixed(2)} <span className="text-xs font-bold text-slate-500">SAR</span>
                              </>
                            )}
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
                            {prod.has_variants && prod.variants && prod.variants.length > 0 ? (
                              <span className="inline-block bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-emerald-900 font-bold font-sans">
                                {prod.variants.map((v) => `${v.unit_value || ''}${v.unit_type || ''}`).filter(Boolean).join(', ')}
                              </span>
                            ) : prod.unit ? (
                              <span className="inline-block bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-800 font-semibold font-sans">
                                {prod.unit_value} ({prod.unit_type} {prod.pack_size})
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
                              {canEdit && (
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
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => openEdit(prod)}
                                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(prod.id)}
                                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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

          {/* Form Body Layout */}
          <form onSubmit={handleSubmit} className="space-y-6">
{/* MIDDLE SECTION: FULL WIDTH CATEGORY CLASSIFICATION (4 LEVELS) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans w-full">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Layers className="w-4 h-4 text-[#05A764]" /> 2. Category Classification (4 Levels)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Level 1: Main Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
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
                        sub_sub_subcategory_id: '',
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
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
                        sub_sub_subcategory_id: '',
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    Sub-Subcategory (Level 3)
                  </label>
                  <select
                    disabled={!productForm.subcategory_id}
                    value={productForm.sub_subcategory_id}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        sub_subcategory_id: e.target.value,
                        sub_sub_subcategory_id: '',
                      })
                    }
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

                {/* Level 4: Sub-Sub-Subcategory */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    Sub-Sub-Subcategory (Level 4)
                  </label>
                  <select
                    disabled={!productForm.sub_subcategory_id}
                    value={productForm.sub_sub_subcategory_id}
                    onChange={(e) => setProductForm({ ...productForm, sub_sub_subcategory_id: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <option value="">-- Select Sub-Sub-Subcategory --</option>
                    {availableSubSubSubcategories.map((sssc) => (
                      <option key={sssc.id} value={sssc.id}>
                        {sssc.name_en} / {sssc.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Hierarchy Breadcrumb Preview Path Bar */}
              {(productForm.category_id || productForm.subcategory_id || productForm.sub_subcategory_id || productForm.sub_sub_subcategory_id) && (
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
                  {productForm.sub_sub_subcategory_id && (
                    <>
                      <span className="text-slate-400">➔</span>
                      <span className="bg-[#02281b] text-emerald-300 font-black px-2.5 py-1 rounded-lg shadow-2xs border border-emerald-600/40">
                        {subSubSubCategories.find((sssc) => String(sssc.id) === String(productForm.sub_sub_subcategory_id))?.name_en || 'Sub-Sub-Subcategory'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* TOP SECTION: Product Info (2 Cols) + Gallery Images (1 Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* CARD 1: PRODUCT INFORMATION */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Apple className="w-4 h-4 text-[#05A764]" /> 1. Product Information
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

              {/* CARD 2: GALLERY IMAGES */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Gallery Images ({productForm.images.length})
                  </h3>
                </div>

                {/* Upload Buttons Box */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" /> Upload File:
                      </label>
                    </div>

                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#043927] file:text-white hover:file:bg-[#02281b] cursor-pointer border border-slate-200 rounded-xl p-1 bg-white shadow-2xs"
                    />

                    {/* Allowed Size & Type Spec Banner */}
                    <div className="mt-2.5 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#043927]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#05A764]" /> Allowed Upload Specs:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-extrabold text-[10px]">
                          Types: JPG, PNG, WEBP, PDF
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-extrabold text-[10px]">
                          Max Size: 5MB / file
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loading spinner while uploading */}
                  {uploadingProductImages && (
                    <div className="py-2.5 px-3 rounded-xl bg-emerald-100/70 border border-emerald-200 text-xs font-extrabold text-[#043927] flex items-center justify-center gap-2 animate-pulse">
                      <div className="w-4 h-4 border-2 border-[#043927] border-t-transparent rounded-full animate-spin"></div>
                      Uploading image(s) & analyzing file size...
                    </div>
                  )}
                </div>

                {/* Uploaded Images List Grid */}
                {productForm.images.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Uploaded Gallery Images:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {productForm.images.map((imgUrl, idx) => {
                        const meta = productFileMetas[imgUrl];
                        return (
                          <div key={idx} className="relative group bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col items-center shadow-2xs hover:border-emerald-300 transition-all">
                            <img
                              src={getImageUrl(imgUrl)}
                              alt={`Product view ${idx + 1}`}
                              className="w-full h-20 object-contain rounded-xl bg-white border border-slate-100"
                            />
                            <div className="w-full flex items-center justify-between mt-1.5 gap-1">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${idx === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
                                {idx === 0 ? '★ Main' : `#${idx + 1}`}
                              </span>
                              {meta ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 truncate" title={`${meta.type} | ${meta.size}`}>
                                  {meta.type} ({meta.size})
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                  URL
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs text-xs cursor-pointer transition-all"
                              title="Remove Image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
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

            

            {/* BOTTOM SECTION: Packaging & Inventory (2 Cols) + Online Store Options (1 Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">

                {/* HAS VARIANTS TOGGLE BANNER */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white rounded-3xl p-6 border-2 border-emerald-200/90 shadow-xs space-y-4 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#043927]" />
                        <h3 className="text-base font-extrabold text-[#043927] tracking-tight">
                          Product Variants (Has Variants)
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                          Super Mart
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Enable to create multiple sizes or pack variations (e.g. Rice 1kg / 5kg / 10kg, Oil 1L / 5L, Eggs 6pcs / 12pcs).
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 bg-white px-4 py-2.5 rounded-2xl border border-emerald-200 shadow-2xs">
                      <span className="text-xs font-black text-slate-800">
                        {productForm.has_variants ? 'Variants Enabled' : 'Single Product (No Variants)'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.has_variants}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setProductForm((prev) => ({
                              ...prev,
                              has_variants: isChecked,
                              variants: isChecked && (!prev.variants || prev.variants.length === 0)
                                ? [{
                                    id: null,
                                    sku: prev.sku ? `${prev.sku}-V1` : 'SKU-V1',
                                    unit_value: prev.unit_value || '1',
                                    unit_type: prev.unit_type || 'kg',
                                    pack_size: prev.pack_size || '',
                                    price: prev.price || '',
                                    discount_price: prev.discount_price || '',
                                    stock_quantity: prev.stock_quantity || '10',
                                    image_url: prev.images?.[0] || '',
                                    is_active: true,
                                  }]
                                : prev.variants,
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* CONDITIONAL RENDERING BASED ON has_variants */}
                {!productForm.has_variants ? (
                  <>
                    {/* CARD 3: UNIT & PACKAGING (Single Product) */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Package className="w-4 h-4 text-[#05A764]" /> 3. Unit & Packaging
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Unit Type *
                          </label>
                          <select
                            required={!productForm.has_variants}
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

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Unit Value *
                          </label>
                          <input
                            type="text"
                            required={!productForm.has_variants}
                            placeholder="e.g. 200, 500, 1.5, 1"
                            value={productForm.unit_value}
                            onChange={(e) => setProductForm({ ...productForm, unit_value: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                          />
                        </div>

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

                    {/* CARD 4: INVENTORY & STOCK (Single Product) */}
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
                            required={!productForm.has_variants}
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

                    {/* CARD 5: PRICING (Single Product) */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Tag className="w-4 h-4 text-[#05A764]" /> 5. Pricing
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Selling Price *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              required={!productForm.has_variants}
                              placeholder="14.50"
                              value={productForm.price}
                              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-black focus:outline-none focus:bg-white focus:border-[#043927]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-700">SAR</span>
                          </div>
                        </div>

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
                  </>
                ) : (
                  <>
                    {/* VARIANTS ACTIVE: BASE SKU & TAX SETTINGS */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                        <ShoppingBag className="w-4 h-4 text-[#05A764]" /> Base SKU & Tax Settings
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Base SKU Code *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. RICE-BASM"
                            value={productForm.sku}
                            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                          />
                        </div>

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

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between mt-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold text-slate-900 block">Prices Include VAT</span>
                          <span className="text-[11px] text-slate-500 font-medium">When enabled, variant selling prices include tax.</span>
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

                    {/* DYNAMIC PRODUCT VARIANTS TABLE & PRESETS */}
                    <div className="bg-white rounded-3xl p-6 border-2 border-[#05A764]/40 shadow-xs space-y-5 font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-[#043927]" />
                            <h3 className="text-base font-black text-slate-900">
                              Product Variants ({productForm.variants?.length || 0})
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Configure SKU, packaging size, stock and pricing for each variant.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="px-4 py-2 bg-[#043927] hover:bg-[#05A764] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                        >
                          <Plus className="w-4 h-4" /> Add Variant
                        </button>
                      </div>

                      {/* QUICK PRESET CHIPS */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Super Mart Presets:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetVariants('rice')}
                          className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-[#043927]"
                        >
                          🌾 Rice (1kg / 5kg / 10kg)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetVariants('oil')}
                          className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-[#043927]"
                        >
                          🌻 Oil (1L / 2L / 5L)
                        </button>
                        
                      </div>

                      {/* VARIANTS ROWS */}
                      {(!productForm.variants || productForm.variants.length === 0) ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-bold text-slate-700">No Variants Added Yet</p>
                          <p className="text-xs text-slate-400">Click &quot;Add Variant&quot; or choose a quick preset above.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {productForm.variants.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#043927]/60 shadow-xs transition-all space-y-4 relative group"
                            >
                              {/* Header: Variant Title, Badge & Actions */}
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-7 h-7 rounded-xl bg-[#043927] text-white text-xs font-black flex items-center justify-center shadow-xs">
                                    {vIdx + 1}
                                  </span>
                                  <span className="text-xs font-black text-slate-900">
                                    Variant {vIdx + 1}
                                  </span>
                                  {v.unit_value && (
                                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                      {v.unit_value} {v.unit_type}
                                    </span>
                                  )}
                                  {v.sku && (
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                      {v.sku}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={v.is_active !== false}
                                      onChange={(e) => handleUpdateVariant(vIdx, 'is_active', e.target.checked)}
                                      className="rounded text-[#043927] focus:ring-[#043927] w-4 h-4 cursor-pointer"
                                    />
                                    <span>Active</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(vIdx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                                    title="Delete Variant"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Form Fields: Grid Layout with proper heights and SAR suffixes */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
                                {/* Unit Value */}
                                <div className="lg:col-span-2">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Value *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. 500, 1, 5"
                                    value={v.unit_value || ''}
                                    onChange={(e) => handleUpdateVariant(vIdx, 'unit_value', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs"
                                  />
                                </div>

                                {/* Unit Type */}
                                <div className="lg:col-span-2">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Type *
                                  </label>
                                  <select
                                    value={v.unit_type || 'kg'}
                                    onChange={(e) => handleUpdateVariant(vIdx, 'unit_type', e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs cursor-pointer"
                                  >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                    <option value="pcs">pcs</option>
                                    <option value="Pack">Pack</option>
                                    <option value="Tray">Tray</option>
                                    <option value="Box">Box</option>
                                  </select>
                                </div>

                                {/* Pack Size */}
                                <div className="lg:col-span-4">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Pack Size
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 5kg Sack, 1L Bottle"
                                    value={v.pack_size || ''}
                                    onChange={(e) => handleUpdateVariant(vIdx, 'pack_size', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs"
                                  />
                                </div>

                                {/* SKU */}
                                <div className="lg:col-span-4">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Variant SKU *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. RICE-5KG"
                                    value={v.sku || ''}
                                    onChange={(e) => handleUpdateVariant(vIdx, 'sku', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs"
                                  />
                                </div>

                                {/* Price */}
                                <div className="lg:col-span-4">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Price (SAR) *
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      placeholder="0.00"
                                      value={v.price ?? ''}
                                      onChange={(e) => handleUpdateVariant(vIdx, 'price', e.target.value)}
                                      className="w-full h-11 pl-3.5 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                      SAR
                                    </span>
                                  </div>
                                </div>

                                {/* Discount Price */}
                                <div className="lg:col-span-4">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Discount (SAR)
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Optional"
                                      value={v.discount_price ?? ''}
                                      onChange={(e) => handleUpdateVariant(vIdx, 'discount_price', e.target.value)}
                                      className="w-full h-11 pl-3.5 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                      SAR
                                    </span>
                                  </div>
                                </div>

                                {/* Stock */}
                                <div className="lg:col-span-4">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Stock *
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      required
                                      min="0"
                                      placeholder="0"
                                      value={v.stock_quantity ?? ''}
                                      onChange={(e) => handleUpdateVariant(vIdx, 'stock_quantity', e.target.value)}
                                      className="w-full h-11 pl-3.5 pr-14 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-2 focus:ring-[#043927]/10 transition-all shadow-2xs"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                                      Units
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* SUMMARY BAR */}
                          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <span className="font-extrabold text-[#043927]">
                              Total Stock: {productForm.variants.reduce((acc, v) => acc + parseInt(v.stock_quantity || '0', 10), 0)} units across {productForm.variants.length} variants
                            </span>
                            <span className="font-bold text-slate-700">
                              Price Range: SAR {Math.min(...productForm.variants.map(v => parseFloat(v.price) || 0)).toFixed(2)} - SAR {Math.max(...productForm.variants.map(v => parseFloat(v.price) || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* CARD: PRODUCT DESCRIPTION & DYNAMIC HIGHLIGHTS */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#05A764]" />
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Product Description & Highlights
                      </h3>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Storefront Details
                    </span>
                  </div>

                  {/* Description Section Titles */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Description Catchy Title (Optional)
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Main headline displayed above the product story on the details page (e.g. &quot;Naturally Fresh. Always Good.&quot;).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title (English)</label>
                        <input
                          type="text"
                          placeholder="e.g. Naturally Fresh. Always Good."
                          value={productForm.description_title_en || ''}
                          onChange={(e) => setProductForm({ ...productForm, description_title_en: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title (Arabic) / العنوان</label>
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="مثال: طازج طبيعياً. رائع دائماً."
                          value={productForm.description_title_ar || ''}
                          onChange={(e) => setProductForm({ ...productForm, description_title_ar: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rich / Long Description */}
                  <div className="space-y-1 pt-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Detailed Product Description
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Detailed background story, sourcing notes, or culinary usage for your customers.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Detailed Description (English)</label>
                        <textarea
                          rows={4}
                          placeholder="High quality fresh product sourced directly from local certified farms..."
                          value={productForm.long_description_en || ''}
                          onChange={(e) => setProductForm({ ...productForm, long_description_en: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] leading-relaxed resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Detailed Description (Arabic) / الوصف التفصيلي</label>
                        <textarea
                          rows={4}
                          dir="rtl"
                          placeholder="منتج طازج ومغذي عالي الجودة يتم توريده مباشرة من مزارع محلية موثوقة..."
                          value={productForm.long_description_ar || ''}
                          onChange={(e) => setProductForm({ ...productForm, long_description_ar: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] leading-relaxed resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Highlights Manager */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Product Highlights & Key Features ({productForm.highlights?.length || 0})
                        </label>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Manage dynamic bullet points with checkmarks. Add, edit, remove and sort up/down.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#043927] border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Highlight
                      </button>
                    </div>

                    {Array.isArray(productForm.highlights) && productForm.highlights.length > 0 ? (
                      <div className="space-y-2.5">
                        {productForm.highlights.map((hl, idx) => (
                          <div
                            key={hl.id || idx}
                            className="flex items-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors"
                          >
                            {/* Sorting Arrows */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveHighlight(idx, 'up')}
                                disabled={idx === 0}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveHighlight(idx, 'down')}
                                disabled={idx === productForm.highlights.length - 1}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Checkmark Indicator */}
                            <div className="w-6 h-6 rounded-full bg-[#05A764] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <input
                                type="text"
                                placeholder={`Highlight #${idx + 1} (English) - e.g. 100% natural`}
                                value={hl.text_en || ''}
                                onChange={(e) => handleUpdateHighlight(idx, 'text_en', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#043927]"
                              />
                              <input
                                type="text"
                                dir="rtl"
                                placeholder={`الميزة #${idx + 1} (عربي) - مثال: طبيعي ١٠٠٪`}
                                value={hl.text_ar || ''}
                                onChange={(e) => handleUpdateHighlight(idx, 'text_ar', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#043927]"
                              />
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteHighlight(idx)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                              title="Delete Highlight"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 space-y-1">
                        <p className="text-xs font-semibold">No dynamic highlights added yet.</p>
                        <p className="text-[11px] text-slate-500">Click &quot;Add Highlight&quot; to highlight key features like &quot;100% Organic&quot;, &quot;Rich in Protein&quot;, etc.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD: NUTRITION FACTS */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#05A764]" />
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Nutrition Facts Management
                      </h3>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Nutritional Values
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Specify serving size and key nutrient quantities. These are rendered dynamically on the storefront product detail page under the Nutrition Facts tab.
                  </p>

                  {/* Nutrition Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {/* Serving Size */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Serving Size (حجم الحصة)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 100g, 1 Pack (250g), 1 Cup (240ml)"
                        value={productForm.nutrition_facts?.serving_size || ''}
                        onChange={(e) => handleNutritionChange('serving_size', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Calories */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Calories (السعرات الحرارية)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 72 kcal"
                        value={productForm.nutrition_facts?.calories || ''}
                        onChange={(e) => handleNutritionChange('calories', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Protein */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Protein (البروتين)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 6.3 g"
                        value={productForm.nutrition_facts?.protein || ''}
                        onChange={(e) => handleNutritionChange('protein', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Carbohydrates */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Carbohydrates (الكربوهيدرات)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0.4 g"
                        value={productForm.nutrition_facts?.carbohydrates || ''}
                        onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Total Fat */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Total Fat (الدهون الكلية)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4.8 g"
                        value={productForm.nutrition_facts?.fat || ''}
                        onChange={(e) => handleNutritionChange('fat', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Dietary Fiber */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Dietary Fiber (الألياف الغذائية)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0 g"
                        value={productForm.nutrition_facts?.fiber || ''}
                        onChange={(e) => handleNutritionChange('fiber', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Sugars */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Sugars (السكريات)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0.2 g"
                        value={productForm.nutrition_facts?.sugar || ''}
                        onChange={(e) => handleNutritionChange('sugar', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Vitamins */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Vitamins (الفيتامينات)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vitamin D: 1 mcg, Vitamin A: 140 mcg, Vitamin C: 5 mg"
                        value={productForm.nutrition_facts?.vitamins || ''}
                        onChange={(e) => handleNutritionChange('vitamins', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>

                    {/* Minerals */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Minerals (المعادن)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Calcium: 28 mg, Iron: 0.9 mg, Potassium: 138 mg"
                        value={productForm.nutrition_facts?.minerals || ''}
                        onChange={(e) => handleNutritionChange('minerals', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                      />
                    </div>
                  </div>

                  {/* Live Nutrition Card Preview */}
                  {Object.values(productForm.nutrition_facts || {}).some((v) => v && String(v).trim()) && (
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Live Storefront Preview
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {productForm.nutrition_facts?.serving_size && (
                          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-[11px]">
                            Serving: {productForm.nutrition_facts.serving_size}
                          </span>
                        )}
                        {productForm.nutrition_facts?.calories && (
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-1 rounded-lg font-extrabold text-[11px]">
                            🔥 {productForm.nutrition_facts.calories}
                          </span>
                        )}
                        {productForm.nutrition_facts?.protein && (
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-1 rounded-lg font-extrabold text-[11px]">
                            Protein: {productForm.nutrition_facts.protein}
                          </span>
                        )}
                        {productForm.nutrition_facts?.carbohydrates && (
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-1 rounded-lg font-extrabold text-[11px]">
                            Carbs: {productForm.nutrition_facts.carbohydrates}
                          </span>
                        )}
                        {productForm.nutrition_facts?.fat && (
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-1 rounded-lg font-extrabold text-[11px]">
                            Fat: {productForm.nutrition_facts.fat}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column (1 Col) */}
              <div className="lg:col-span-1 space-y-6">

                {/* CARD 6: ONLINE STORE STOREFRONT SETTINGS */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-sans">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Globe className="w-4 h-4 text-[#05A764]" /> 6. Storefront Visibility & Badges
                  </h3>

                  <div className="space-y-3">
                    {/* Show on Website */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-extrabold text-slate-900 block">Show on Store</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Visible on app & website</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(productForm.is_available)}
                          onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                      </label>
                    </div>

                    {/* Featured */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-extrabold text-slate-900 block">Featured</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Highlight in home sliders</span>
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
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-extrabold text-slate-900 block">New Arrival</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Display NEW badge</span>
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
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-extrabold text-slate-900 block">Best Seller</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Display ⭐ Best Seller</span>
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

                    {/* Best Deal */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-extrabold text-slate-900 block">Best Deal</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Display 🔥 Best Deal</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={productForm.is_best_deal}
                          onChange={(e) => setProductForm({ ...productForm, is_best_deal: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                      </label>
                    </div>

                    {/* Popular Pick */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-extrabold text-slate-900 block">Popular Pick</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Display ⭐ Popular Pick</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={productForm.is_popular_pick}
                          onChange={(e) => setProductForm({ ...productForm, is_popular_pick: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#043927]"></div>
                      </label>
                    </div>

                    {/* Customer Rating & Reviews Settings */}
                  
                  </div>
                </div>

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
