'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { fetchApi, getImageUrl } from '../services/api';
import {
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FolderTree,
  Eye,
  ShieldCheck,
  Search,
  Filter,
  Check,
  ArrowRight,
  Loader2,
  Tag,
  Info,
} from 'lucide-react';

// Pure dynamic hierarchy builder using database parent_id tree
function buildDynamicCategoryHierarchy(dbCategories) {
  if (!Array.isArray(dbCategories)) return [];

  // Index categories by their DB UUID id
  const idMap = new Map();
  dbCategories.forEach((cat) => {
    if (cat?.id) {
      idMap.set(cat.id, cat);
    }
  });

  return dbCategories.map((dbCat) => {
    // Traverse parent chain dynamically to determine hierarchy level and full breadcrumb path
    let lvl = 1;
    const pathSegments = [dbCat.slug];
    let curr = dbCat;
    const visited = new Set([dbCat.id]);

    while (curr.parent_id && idMap.has(curr.parent_id)) {
      curr = idMap.get(curr.parent_id);
      if (visited.has(curr.id)) break; // guard against cycle
      visited.add(curr.id);
      pathSegments.unshift(curr.slug);
      lvl += 1;
      if (lvl >= 10) break;
    }

    return {
      id: dbCat.id,
      slug: dbCat.slug,
      name_en: dbCat.name_en,
      name_ar: dbCat.name_ar,
      level: lvl,
      parent_id: dbCat.parent_id || null,
      parentCategory: dbCat.parentCategory || null,
      image_url: dbCat.image_url || '',
      banner: dbCat.banner || {},
      content: dbCat.content || {},
      hasCustomDbBanner: !!(dbCat.banner && Object.keys(dbCat.banner).length > 0),
      path: `/category/${pathSegments.join('/')}`,
    };
  });
}

const LEVEL_CONFIG = {
  1: {
    title_en: 'Main Category Banners (Level 1)',
    title_ar: 'بانرات الأقسام الرئيسية (المستوى 1)',
    subtitle_en: 'Configure hero banners for top-level root categories (e.g., Grocery, Frozen Items, Fresh Produce)',
    subtitle_ar: 'إدارة وتخصيص البانر الرئيسي لأقسام المستوى الأول الأساسية',
    badge_en: 'MAIN CATEGORY',
    badge_ar: 'التصنيف الرئيسي',
    route: '/admin/main-category-banners',
  },
  2: {
    title_en: 'Sub-Category Banners (Level 2)',
    title_ar: 'بانرات الأقسام الفرعية (المستوى 2)',
    subtitle_en: 'Configure unique banners for 2nd-level subcategories (e.g., Food & Staples, Fresh Fruits)',
    subtitle_ar: 'إدارة وتخصيص البانر لأقسام المستوى الثاني الفرعية',
    badge_en: 'SUBCATEGORY',
    badge_ar: 'تصنيف فرعي',
    route: '/admin/subcategory-banners',
  },
  3: {
    title_en: 'Sub-Sub-Category Banners (Level 3)',
    title_ar: 'بانرات الأقسام الفرعية الثانية (المستوى 3)',
    subtitle_en: 'Configure specialty banners for 3rd-level product lines (e.g., Rice, Flour, Apples)',
    subtitle_ar: 'إدارة وتخصيص البانر لأقسام المستوى الثالث المتخصصة',
    badge_en: 'SPECIALTY SELECTION',
    badge_ar: 'تشكيلة متخصصة',
    route: '/admin/sub-subcategory-banners',
  },
  4: {
    title_en: 'Sub-Sub-Sub-Category Banners (Level 4)',
    title_ar: 'بانرات الأقسام الفرعية الثالثة (المستوى 4)',
    subtitle_en: 'Configure premium banners for 4th-level micro categories (e.g., Basmati Rice, Sella Rice)',
    subtitle_ar: 'إدارة وتخصيص البانر لأقسام المستوى الرابع الدقيقة والفاخرة',
    badge_en: 'PREMIUM GRADE',
    badge_ar: 'درجة ممتازة',
    route: '/admin/sub-sub-subcategory-banners',
  },
};

export default function CategoryBannerManager({ activeLevel = 1 }) {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const levelInfo = LEVEL_CONFIG[activeLevel] || LEVEL_CONFIG[1];

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewLocale, setPreviewLocale] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [parentFilter, setParentFilter] = useState('');

  // Selected file for banner upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState('');

  // Form State
  const [bannerForm, setBannerForm] = useState({
    heading_en: '',
    heading_ar: '',
    description_en: '',
    description_ar: '',
    tag_en: '100% FARM FRESH',
    tag_ar: 'طازج 100% من المزرعة',
    badge_en: 'BEST PRICE GUARANTEED',
    badge_ar: 'أفضل سعر مضمون',
    desktop_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
    mobile_image: '',
  });

  const [contentForm, setContentForm] = useState({
    short_desc_en: '',
    short_desc_ar: '',
    features: [
      { label_en: 'Direct Farm Sourcing', label_ar: 'توريد مباشر من المزرعة' },
      { label_en: 'Express Delivery in 30 Mins', label_ar: 'توصيل فوري خلال 30 دقيقة' },
      { label_en: '100% Quality Guaranteed', label_ar: 'ضمان الجودة 100%' },
    ],
  });

  // Load all dynamic categories from DB API
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/categories?all=true');
      const dbCategories = res.success ? (res.data?.categories || []) : [];
      const dynamicCategories = buildDynamicCategoryHierarchy(dbCategories);

      setCategories(dynamicCategories);

      // Select first category belonging to this level
      const forThisLevel = dynamicCategories.filter((c) => c.level === activeLevel);
      if (forThisLevel.length > 0) {
        setSelectedCatId(forThisLevel[0].id || forThisLevel[0].slug);
      } else {
        setSelectedCatId('');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      showToast('Error loading categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [activeLevel]);

  // Categories belonging strictly to this level
  const levelCategories = useMemo(() => {
    return categories.filter((c) => c.level === activeLevel);
  }, [categories, activeLevel]);

  // Parent categories (for dropdown filter when level > 1)
  const parentCategories = useMemo(() => {
    if (activeLevel === 1) return [];
    return categories.filter((c) => c.level === activeLevel - 1);
  }, [categories, activeLevel]);

  // Filter categories by search and parent
  const filteredCategories = useMemo(() => {
    return levelCategories.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name_ar?.includes(searchQuery) ||
        c.slug?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchParent =
        !parentFilter ||
        c.parent_id === parentFilter ||
        String(c.parent_id) === String(parentFilter) ||
        Boolean(
          parentCategories.some(
            (p) =>
              (p.id === parentFilter || p.slug === parentFilter) &&
              (p.id === c.parent_id || p.slug === c.parent_id)
          )
        );

      return matchSearch && matchParent;
    });
  }, [levelCategories, searchQuery, parentFilter, parentCategories]);

  // Auto select first category in filtered list if current selected is not in it
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const exists = filteredCategories.some(
        (c) => c.id === selectedCatId || c.slug === selectedCatId
      );
      if (!exists) {
        setSelectedCatId(filteredCategories[0].id || filteredCategories[0].slug);
      }
    }
  }, [filteredCategories, selectedCatId]);

  // Currently selected category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCatId || c.slug === selectedCatId) || null;
  }, [categories, selectedCatId]);

  // When selected category changes, populate form
  useEffect(() => {
    if (!activeCategory) return;

    const b = activeCategory.banner || {};
    const c = activeCategory.content || {};

    setBannerForm({
      heading_en: b.heading_en || activeCategory.name_en || '',
      heading_ar: b.heading_ar || activeCategory.name_ar || '',
      description_en: b.description_en || 'Explore our hand-picked selection of premium quality items delivered fast to your door.',
      description_ar: b.description_ar || 'استكشف تشكيلتنا المختارة بعناية من أفضل المنتجات الطازجة وبأفضل الأسعار.',
      tag_en: b.tag_en || '100% FARM FRESH',
      tag_ar: b.tag_ar || 'طازج 100% من المزرعة',
      badge_en: b.badge_en || 'BEST PRICE GUARANTEED',
      badge_ar: b.badge_ar || 'أفضل سعر مضمون',
      desktop_image: b.desktop_image || activeCategory.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
      mobile_image: b.mobile_image || '',
    });

    const defaultFeatures = [
      { label_en: 'Direct Farm Sourcing', label_ar: 'توريد مباشر من المزرعة' },
      { label_en: 'Express Delivery in 30 Mins', label_ar: 'توصيل فوري خلال 30 دقيقة' },
      { label_en: '100% Quality Guaranteed', label_ar: 'ضمان الجودة 100%' },
    ];

    setContentForm({
      short_desc_en: c.short_desc_en || '',
      short_desc_ar: c.short_desc_ar || '',
      features: Array.isArray(c.features) && c.features.length > 0 ? c.features : defaultFeatures,
    });

    setSelectedFile(null);
    setPreviewFileUrl('');
  }, [activeCategory]);

  // File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewFileUrl(objUrl);
    }
  };

  // Update feature item
  const handleFeatureChange = (index, field, value) => {
    setContentForm((prev) => {
      const next = [...prev.features];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, features: next };
    });
  };

  // Add a feature pill
  const handleAddFeature = () => {
    if (contentForm.features.length >= 4) {
      showToast('Maximum 4 feature pills supported', 'info');
      return;
    }
    setContentForm((prev) => ({
      ...prev,
      features: [...prev.features, { label_en: 'Express Service', label_ar: 'خدمة سريعة' }],
    }));
  };

  // Remove a feature pill
  const handleRemoveFeature = (index) => {
    setContentForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }));
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!activeCategory) return;
    try {
      setSaving(true);
      let finalDesktopImage = bannerForm.desktop_image;

      // If file uploaded, upload it first
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const uploadRes = await fetchApi('/upload', {
          method: 'POST',
          body: uploadData,
        });

        if (uploadRes.success && uploadRes.data?.url) {
          finalDesktopImage = uploadRes.data.url;
        } else {
          showToast('Image upload failed', 'error');
          setSaving(false);
          return;
        }
      }

      const updatedBanner = {
        ...bannerForm,
        desktop_image: finalDesktopImage,
      };

      const payload = {
        name_en: activeCategory.name_en,
        name_ar: activeCategory.name_ar,
        slug: activeCategory.slug,
        parent_id: activeCategory.parent_id,
        image_url: activeCategory.image_url,
        banner: updatedBanner,
        content: contentForm,
      };

      const targetId = activeCategory.id || activeCategory.slug;
      const res = await fetchApi(`/categories/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showToast(
          isAr
            ? `تم حفظ وتحديث بانر قسم (${activeCategory.name_ar}) بنجاح!`
            : `Banner for (${activeCategory.name_en}) saved successfully!`,
          'success'
        );

        // Update local state
        setCategories((prev) =>
          prev.map((c) =>
            c.id === activeCategory.id
              ? { ...c, banner: updatedBanner, content: contentForm, hasCustomDbBanner: true }
              : c
          )
        );
        setSelectedFile(null);
        setPreviewFileUrl('');
      } else {
        showToast(res.message || 'Failed to save banner', 'error');
      }
    } catch (err) {
      console.error('Error saving category banner:', err);
      showToast(err.message || 'Error saving category banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset banner form to category defaults
  const handleResetToDefaults = () => {
    if (!activeCategory) return;

    setBannerForm({
      heading_en: activeCategory.name_en || '',
      heading_ar: activeCategory.name_ar || '',
      description_en: '',
      description_ar: '',
      tag_en: '',
      tag_ar: '',
      badge_en: '',
      badge_ar: '',
      desktop_image: activeCategory.image_url || '',
      mobile_image: '',
    });

    setContentForm({
      short_desc_en: '',
      short_desc_ar: '',
      features: [
        { label_en: 'Direct Farm Sourcing', label_ar: 'توريد مباشر من المزرعة' },
        { label_en: 'Express Delivery in 30 Mins', label_ar: 'توصيل فوري خلال 30 دقيقة' },
        { label_en: '100% Quality Guaranteed', label_ar: 'ضمان الجودة 100%' },
      ],
    });

    showToast(isAr ? 'تم استرجاع الإعدادات الافتراضية للقسم' : 'Restored category defaults', 'info');
  };

  // Preview values computed based on previewLocale toggle
  const previewHeading = previewLocale === 'ar' ? (bannerForm.heading_ar || activeCategory?.name_ar) : (bannerForm.heading_en || activeCategory?.name_en);
  const previewDesc = previewLocale === 'ar' ? bannerForm.description_ar : bannerForm.description_en;
  const previewTag = previewLocale === 'ar' ? bannerForm.tag_ar : bannerForm.tag_en;
  const previewBadge = previewLocale === 'ar' ? bannerForm.badge_ar : bannerForm.badge_en;
  const previewImg = previewFileUrl || (bannerForm.desktop_image ? getImageUrl(bannerForm.desktop_image) : (activeCategory?.image_url ? getImageUrl(activeCategory.image_url) : '/banners/farm_fresh_produce.jpg'));
  const levelBadgeText = previewLocale === 'ar' ? levelInfo.badge_ar : levelInfo.badge_en;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 4-Level Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-1.5 sm:gap-2">
        {[1, 2, 3, 4].map((lvl) => {
          const cfg = LEVEL_CONFIG[lvl];
          const isCurrent = lvl === activeLevel;
          return (
            <Link
              key={lvl}
              href={cfg.route}
              className={`flex-1 min-w-[170px] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2 transition-all ${
 isCurrent
 ? 'bg-[#043927] text-white shadow-md'
 : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
 }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  L{lvl}
                </span>
                <span className="truncate">{isAr ? cfg.badge_ar : cfg.badge_en}</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isCurrent ? 'bg-white/20' : 'bg-slate-200/80 text-slate-500'}`}>
                {categories.filter((c) => c.level === lvl).length}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#043927] text-white flex items-center justify-center shadow-md shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? levelInfo.title_ar : levelInfo.title_en}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                {levelCategories.length} {isAr ? 'قسم متوفر' : 'Categories'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? levelInfo.subtitle_ar : levelInfo.subtitle_en}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-3">
          {activeCategory && (
            <Link
              href={activeCategory.path || `/category/${activeCategory.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'معاينة الصفحة الحية' : 'View Live Category Page'}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !activeCategory}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Category Selector Sidebar + Banner Editor with Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Category Hierarchy Selector List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-800">
                {isAr ? `أقسام المستوى ${activeLevel}` : `Level ${activeLevel} Categories`}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredCategories.length} / {levelCategories.length}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث في هذا المستوى...' : `Search level ${activeLevel} categories...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 rtl:pl-3 rtl:pr-9"
            />
          </div>

          {/* Optional Parent Category Filter when level > 1 */}
          {activeLevel > 1 && parentCategories.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                {isAr ? `تصفية حسب قسم المستوى ${activeLevel - 1}:` : `Filter by Level ${activeLevel - 1} Parent:`}
              </label>
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="">{isAr ? 'جميع الأقسام الرئيسية' : 'All Parents'}</option>
                {parentCategories.map((p) => (
                  <option key={p.id || p.slug} value={p.id || p.slug}>
                    {isAr ? (p.name_ar || p.name_en) : p.name_en}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading level {activeLevel} categories...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isAr ? 'لا توجد أقسام في هذا المستوى' : `No categories found for Level ${activeLevel}`}
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedCatId || cat.slug === selectedCatId;
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => setSelectedCatId(cat.id || cat.slug)}
                    className={`w-full text-left rtl:text-right p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
 isSelected
 ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
 : 'bg-white hover:bg-slate-50 border-slate-200/70'
 }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {cat.image_url ? (
                          <img
                            src={getImageUrl(cat.image_url)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {isAr ? (cat.name_ar || cat.name_en) : cat.name_en}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          <span>{cat.path || `/category/${cat.slug}`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        L{activeLevel}
                      </span>
                      {cat.hasCustomDbBanner && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Custom DB Banner Configured" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Banner Preview + Detailed Banner Configuration (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!activeCategory ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <FolderTree className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-800">
                  {isAr ? `لا توجد أقسام في المستوى ${activeLevel}` : `No Level ${activeLevel} Categories Found`}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? `أضف أقساماً جديدة في المستوى ${activeLevel} من خلال صفحة إدارة الأقسام لإدارتها هنا.`
                    : `Add new categories for Level ${activeLevel} in the Category Management section to configure their hero banners here.`}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/categories"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#043927] text-white text-xs font-bold hover:bg-[#02281b] transition-all shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{isAr ? 'الانتقال إلى إدارة الأقسام' : 'Go to Category Management'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Interactive Live Category Banner Preview */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-sm text-slate-800">
                      {isAr ? `معاينة حية لبانر المستوى ${activeLevel}` : `Live Preview (Level ${activeLevel} Banner)`}
                    </h3>
                  </div>

                  {/* Language Toggle for Live Preview */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewLocale('en')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
 previewLocale === 'en' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-500'
 }`}
                >
                  English Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLocale('ar')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
 previewLocale === 'ar' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-500'
 }`}
                >
                  معاينة بالعربية
                </button>
              </div>
            </div>

            {/* Exactly replicates CategoryBanner.js on /category/[slug] */}
            <div
              dir={previewLocale === 'ar' ? 'rtl' : 'ltr'}
              className="relative rounded-3xl overflow-hidden bg-[#043927] text-white shadow-lg border border-emerald-900/50 p-4 sm:p-5 lg:px-7 lg:py-5"
            >
              {/* Background Graphic Accents */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-400 blur-3xl" />
                <div className="absolute left-10 -bottom-20 w-80 h-80 rounded-full bg-[#00B074] blur-3xl" />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
                {/* Left Column Texts */}
                <div className="lg:col-span-7 space-y-2 sm:space-y-2.5 text-left rtl:text-right">
                  {/* Top Badges */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {levelBadgeText && (
                      <span className="bg-emerald-950/80 border border-emerald-700/60 text-[#a7f3d0] text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {levelBadgeText}
                      </span>
                    )}
                    {previewTag && (
                      <span className="bg-[#05A764] text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                        {previewTag}
                      </span>
                    )}
                    {previewBadge && (
                      <span className="bg-[#ea580c] text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                        {previewBadge}
                      </span>
                    )}
                  </div>

                  {/* Heading */}
                  <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight leading-tight text-white">
                    {previewHeading || 'Category Title & Highlights'}
                  </h2>

                  {/* Description */}
                  <p className="text-emerald-100/90 font-medium text-xs sm:text-[13px] leading-relaxed max-w-2xl line-clamp-2">
                    {previewDesc || 'Category description text explaining the fresh quality and offerings available.'}
                  </p>

                  {/* Features / Guarantee Pills */}
                  <div className="pt-1.5 flex items-center gap-1.5 sm:gap-2 flex-wrap text-emerald-200 text-[11px] sm:text-xs font-semibold border-t border-emerald-800/80">
                    {contentForm.features.map((feat, idx) => {
                      const text = previewLocale === 'ar' ? (feat.label_ar || feat.label_en) : (feat.label_en || feat.label_ar);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1 bg-emerald-900/70 px-2 py-0.5 rounded-md border border-emerald-700/50 text-[10px] sm:text-[11px]"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#34d399] shrink-0" />
                          <span>{text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column Visual Image */}
                <div className="lg:col-span-5 relative flex items-center justify-center">
                  <div className="relative w-full h-[140px] sm:h-[160px] lg:h-[180px] rounded-2xl overflow-hidden border border-emerald-700/40 shadow-inner group">
                    <img
                      src={previewImg}
                      alt={previewHeading}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = '/banners/farm_fresh_produce.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-black/70 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{previewLocale === 'ar' ? 'جودة معتمدة' : 'Quality Verified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Detailed Banner Configuration Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isAr ? `تخصيص بانر قسم المستوى ${activeLevel}` : `Level ${activeLevel} Banner Configuration`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? `تعديل بانر: ${activeCategory?.name_ar || activeCategory?.name_en} (${activeCategory?.slug})`
                    : `Editing: ${activeCategory?.name_en} (${activeCategory?.path || `/category/${activeCategory?.slug}`})`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                title="Reset to default mock values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
              </button>
            </div>

            {/* Form Inputs Grid */}
            <div className="space-y-5">
              
              {/* Heading Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عنوان البانر الرئيسي (English Heading) *' : 'Main Banner Heading (English) *'}
                  </label>
                  <input
                    type="text"
                    value={bannerForm.heading_en}
                    onChange={(e) => setBannerForm({ ...bannerForm, heading_en: e.target.value })}
                    placeholder="e.g. Food & Cooking Staples"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عنوان البانر الرئيسي (بالعربية) *' : 'Main Banner Heading (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={bannerForm.heading_ar}
                    onChange={(e) => setBannerForm({ ...bannerForm, heading_ar: e.target.value })}
                    placeholder="مثال: الأغذية والمواد التموينية الأساسية"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 text-right"
                  />
                </div>
              </div>

              {/* Description Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الوصف الترويجي (English Description)' : 'Promotional Description (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={bannerForm.description_en}
                    onChange={(e) => setBannerForm({ ...bannerForm, description_en: e.target.value })}
                    placeholder="Stock your kitchen with high-grade daily grains..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الوصف الترويجي (بالعربية)' : 'Promotional Description (Arabic)'}
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={bannerForm.description_ar}
                    onChange={(e) => setBannerForm({ ...bannerForm, description_ar: e.target.value })}
                    placeholder="زوّد مطبخك بأجود أنواع الحبوب اليومية..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 resize-none text-right"
                  />
                </div>
              </div>

              {/* Tag & Highlight Badges */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'الشارات العلوية (Top Highlights Badges)' : 'Top Highlights Badges'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      {isAr ? 'الشارة الخضراء 1 (Green Tag)' : 'Badge 1: Green Tag (e.g. PANTRY ESSENTIALS)'}
                    </label>
                    <input
                      type="text"
                      placeholder="PANTRY ESSENTIALS"
                      value={bannerForm.tag_en}
                      onChange={(e) => setBannerForm({ ...bannerForm, tag_en: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="أساسيات المطبخ والمؤن"
                      value={bannerForm.tag_ar}
                      onChange={(e) => setBannerForm({ ...bannerForm, tag_ar: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      {isAr ? 'الشارة البرتقالية 2 (Orange Badge)' : 'Badge 2: Orange Badge (e.g. PURITY & TASTE)'}
                    </label>
                    <input
                      type="text"
                      placeholder="PURITY & TASTE"
                      value={bannerForm.badge_en}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge_en: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="نقاء وجودة لا تضاهى"
                      value={bannerForm.badge_ar}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge_ar: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Feature Guarantee Pills */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {isAr ? 'ميزات وضمانات القسم (Bottom Feature Pills)' : 'Bottom Feature & Guarantee Pills'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'الأقراص الصغيرة الظاهرة أسفل الوصف في البانر' : 'The guarantee items with shield icons displayed below the description'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    {isAr ? '+ إضافة ميزة' : '+ Add Pill'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {contentForm.features.map((feat, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-emerald-200/60 shadow-2xs space-y-1.5 relative group">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                        <span>PILL #{idx + 1}</span>
                        {contentForm.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Rigorous Purity Tests"
                        value={feat.label_en}
                        onChange={(e) => handleFeatureChange(idx, 'label_en', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 font-medium"
                      />
                      <input
                        type="text"
                        dir="rtl"
                        placeholder="فحوصات نقاء صارمة"
                        value={feat.label_ar}
                        onChange={(e) => handleFeatureChange(idx, 'label_ar', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 font-medium text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Banner Image Upload & Direct URL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'صورة البانر المرئية' : 'Banner Visual Graphic Image'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isAr ? 'رفع صورة جديدة من جهازك:' : 'Upload from Device:'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#043927] file:text-white hover:file:bg-[#02281b] cursor-pointer"
                    />
                    {selectedFile && (
                      <div className="flex items-center justify-between gap-2 mt-2 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                        <span className="truncate font-medium">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewFileUrl('');
                          }}
                          className="text-rose-600 font-bold shrink-0 cursor-pointer ml-2"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Direct Image URL */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isAr ? 'أو رابط صورة مباشر (Image URL):' : 'Or Direct Image URL:'}
                    </span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or /banners/..."
                      value={bannerForm.desktop_image}
                      onChange={(e) => {
                        setBannerForm({ ...bannerForm, desktop_image: e.target.value });
                        if (!selectedFile) setPreviewFileUrl('');
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Save Action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !activeCategory}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>
                    {isAr
                      ? `حفظ وتطبيق بانر قسم (${activeCategory?.name_ar || activeCategory?.name_en || ''})`
                      : `Save Banner for (${activeCategory?.name_en || ''})`}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>

      </div>
    </div>
  );
}
