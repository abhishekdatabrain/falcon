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
  Smartphone,
  Monitor,
  Palette,
  MousePointerClick,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  FileImage,
  Type,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// Pure dynamic hierarchy builder using database parent_id tree
function buildDynamicCategoryHierarchy(dbCategories) {
  if (!Array.isArray(dbCategories)) return [];

  const idMap = new Map();
  dbCategories.forEach((cat) => {
    if (cat?.id) {
      idMap.set(cat.id, cat);
    }
  });

  return dbCategories.map((dbCat) => {
    let lvl = 1;
    const pathSegments = [dbCat.slug];
    let curr = dbCat;
    const visited = new Set([dbCat.id]);

    while (curr.parent_id && idMap.has(curr.parent_id)) {
      curr = idMap.get(curr.parent_id);
      if (visited.has(curr.id)) break;
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
    subtitle_en: 'Configure promotional hero banners for top-level root categories (e.g., Grocery, Fresh Produce)',
    subtitle_ar: 'إدارة وتخصيص البانر الترويجي لأقسام المستوى الأول الأساسية',
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
    subtitle_en: 'Configure specialty banners for 3rd-level product lines (e.g., Rice, Flour, Cooking Oils)',
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

const DEFAULT_BANNER_CONFIG = {
  // Display Mode: 'hybrid' (Dynamic Hero Banner with Overlay), 'full_image', or 'dynamic'
  display_mode: 'hybrid',
  banner_style: 'promotional',

  // Background Images (100% width)
  desktop_image: '/banners/promotional_grocery_banner.jpg',
  mobile_image: '',
  overlay_opacity: 0.25,

  // Text Content (Multilingual EN & AR)
  heading_en: 'Stock up on daily essentials',
  heading_ar: 'تزود بالاحتياجات اليومية',
  description_en: 'Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more',
  description_ar: 'احصل على خيرات المزرعة الطازجة وتشكيلة واسعة من الفواكه والخضار والبيض وأكثر',

  // CTA Button Settings
  show_cta: true,
  cta_text_en: 'Shop Now',
  cta_text_ar: 'تسوق الآن',
  cta_url: '#products',
  cta_bg_color: '#ffffff',
  cta_text_color: '#111827',

  // Overlay Styling & Alignment
  text_alignment: 'left',
  text_color: '#ffffff',

  // Dynamic Split Mode Settings
  bg_color: '#0d5628',
  gradient_start: '#0d5628',
  gradient_end: '#248a4c',
  image_position: 'center',

  // Legacy Retained Badges
  tag_en: '100% FARM FRESH',
  tag_ar: 'طازج 100% من المزرعة',
  badge_en: 'BEST PRICE GUARANTEED',
  badge_ar: 'أفضل سعر مضمون',
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
  const [previewViewport, setPreviewViewport] = useState('desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [parentFilter, setParentFilter] = useState('');

  // Selected files for banner upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState('');

  const [selectedMobileFile, setSelectedMobileFile] = useState(null);
  const [previewMobileFileUrl, setPreviewMobileFileUrl] = useState('');

  // Form State
  const [bannerForm, setBannerForm] = useState(DEFAULT_BANNER_CONFIG);

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

  const levelCategories = useMemo(() => {
    return categories.filter((c) => c.level === activeLevel);
  }, [categories, activeLevel]);

  const parentCategories = useMemo(() => {
    if (activeLevel === 1) return [];
    return categories.filter((c) => c.level === activeLevel - 1);
  }, [categories, activeLevel]);

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

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCatId || c.slug === selectedCatId) || null;
  }, [categories, selectedCatId]);

  // When selected category changes, populate form (supports nested & flat keys)
  useEffect(() => {
    if (!activeCategory) return;

    const b = activeCategory.banner || {};
    const c = activeCategory.content || {};

    const titleObj = b.title || {};
    const descObj = b.description && typeof b.description === 'object' ? b.description : {};
    const ctaObj = b.cta || {};
    const ctaTextObj = ctaObj.text || {};

    // Determine display mode: Default to hybrid (Dynamic Hero Banner with Overlay)
    const effectiveDisplayMode = (b.display_mode === 'full_image')
      ? 'full_image'
      : (b.display_mode === 'dynamic' ? 'dynamic' : 'hybrid');

    setBannerForm({
      display_mode: effectiveDisplayMode,
      banner_style: b.banner_style || 'promotional',

      // Background Images
      desktop_image: b.backgroundImageDesktop || b.desktop_image || activeCategory.image_url || '/banners/promotional_grocery_banner.jpg',
      mobile_image: b.backgroundImageMobile || b.mobile_image || '',
      overlay_opacity: b.overlayOpacity !== undefined ? b.overlayOpacity : (b.overlay_opacity !== undefined ? b.overlay_opacity : 0.25),

      // Text Content (EN & AR)
      heading_en: titleObj.en || b.heading_en || activeCategory.name_en || 'Stock up on daily essentials',
      heading_ar: titleObj.ar || b.heading_ar || activeCategory.name_ar || 'تزود بالاحتياجات اليومية',
      description_en: descObj.en || (typeof b.description === 'string' ? b.description : null) || b.description_en || 'Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more',
      description_ar: descObj.ar || b.description_ar || 'احصل على خيرات المزرعة الطازجة وتشكيلة واسعة من الفواكه والخضار والبيض وأكثر',

      // CTA Settings
      show_cta: ctaObj.enabled !== undefined ? ctaObj.enabled : (b.show_cta !== false),
      cta_text_en: ctaTextObj.en || b.cta_text_en || 'Shop Now',
      cta_text_ar: ctaTextObj.ar || b.cta_text_ar || 'تسوق الآن',
      cta_url: ctaObj.link || b.cta_url || '#products',
      cta_bg_color: ctaObj.bgColor || b.cta_bg_color || '#ffffff',
      cta_text_color: ctaObj.textColor || b.cta_text_color || '#111827',

      // Overlay Styling & Alignment
      text_alignment: b.text_alignment || 'left',
      text_color: b.text_color || '#ffffff',

      // Split Dynamic Appearance
      bg_color: b.bg_color || '#0d5628',
      gradient_start: b.gradient_start || '#0d5628',
      gradient_end: b.gradient_end || '#248a4c',
      image_position: b.image_position || 'center',

      // Retained Badges
      tag_en: b.tag_en !== undefined ? b.tag_en : '100% FARM FRESH',
      tag_ar: b.tag_ar !== undefined ? b.tag_ar : 'طازج 100% من المزرعة',
      badge_en: b.badge_en !== undefined ? b.badge_en : 'BEST PRICE GUARANTEED',
      badge_ar: b.badge_ar !== undefined ? b.badge_ar : 'أفضل سعر مضمون',
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
    setSelectedMobileFile(null);
    setPreviewMobileFileUrl('');
  }, [activeCategory]);

  // Desktop File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewFileUrl(objUrl);
    }
  };

  // Mobile File upload handler
  const handleMobileFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMobileFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewMobileFileUrl(objUrl);
    }
  };

  // Feature pills handlers
  const handleFeatureChange = (index, field, value) => {
    setContentForm((prev) => {
      const next = [...prev.features];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, features: next };
    });
  };

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
      let finalMobileImage = bannerForm.mobile_image;

      // 1. Upload Desktop file if selected
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
          showToast('Desktop image upload failed', 'error');
          setSaving(false);
          return;
        }
      }

      // 2. Upload Mobile file if selected
      if (selectedMobileFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedMobileFile);

        const uploadRes = await fetchApi('/upload', {
          method: 'POST',
          body: uploadData,
        });

        if (uploadRes.success && uploadRes.data?.url) {
          finalMobileImage = uploadRes.data.url;
        } else {
          showToast('Mobile image upload failed', 'error');
          setSaving(false);
          return;
        }
      }

      // Build updated banner with both exact nested schema & flat keys
      const updatedBanner = {
        ...bannerForm,
        display_mode: bannerForm.display_mode,

        // User schema specification
        backgroundImageDesktop: finalDesktopImage,
        backgroundImageMobile: finalMobileImage,
        overlayOpacity: parseFloat(bannerForm.overlay_opacity || 0.25),
        title: {
          en: bannerForm.heading_en,
          ar: bannerForm.heading_ar,
        },
        description: {
          en: bannerForm.description_en,
          ar: bannerForm.description_ar,
        },
        cta: {
          enabled: bannerForm.show_cta,
          text: {
            en: bannerForm.cta_text_en,
            ar: bannerForm.cta_text_ar,
          },
          link: bannerForm.cta_url,
          bgColor: bannerForm.cta_bg_color,
          textColor: bannerForm.cta_text_color,
        },

        // Flat keys for backwards compatibility
        desktop_image: finalDesktopImage,
        mobile_image: finalMobileImage,
        overlay_opacity: parseFloat(bannerForm.overlay_opacity || 0.25),
        heading_en: bannerForm.heading_en,
        heading_ar: bannerForm.heading_ar,
        description_en: bannerForm.description_en,
        description_ar: bannerForm.description_ar,
        show_cta: bannerForm.show_cta,
        cta_text_en: bannerForm.cta_text_en,
        cta_text_ar: bannerForm.cta_text_ar,
        cta_url: bannerForm.cta_url,
      };

      const payload = {
        categoryId: activeCategory.id || activeCategory.slug,
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

        setCategories((prev) =>
          prev.map((c) =>
            c.id === activeCategory.id
              ? { ...c, banner: updatedBanner, content: contentForm, hasCustomDbBanner: true }
              : c
          )
        );
        setSelectedFile(null);
        setPreviewFileUrl('');
        setSelectedMobileFile(null);
        setPreviewMobileFileUrl('');
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

  // Reset banner form to defaults
  const handleResetToDefaults = () => {
    if (!activeCategory) return;

    setBannerForm({
      ...DEFAULT_BANNER_CONFIG,
      heading_en: activeCategory.name_en || 'Stock up on daily essentials',
      heading_ar: activeCategory.name_ar || 'تزود بالاحتياجات اليومية',
      desktop_image: activeCategory.image_url || '/banners/promotional_grocery_banner.jpg',
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

    setSelectedFile(null);
    setPreviewFileUrl('');
    setSelectedMobileFile(null);
    setPreviewMobileFileUrl('');

    showToast(isAr ? 'تم استرجاع الإعدادات الافتراضية للقسم' : 'Restored category defaults', 'info');
  };

  // Preview computations
  const isPreviewAr = previewLocale === 'ar';
  const previewHeading = isPreviewAr
    ? (bannerForm.heading_ar || activeCategory?.name_ar || 'تزود بالاحتياجات اليومية')
    : (bannerForm.heading_en || activeCategory?.name_en || 'Stock up on daily essentials');

  const previewDesc = isPreviewAr
    ? (bannerForm.description_ar || 'احصل على خيرات المزرعة الطازجة وتشكيلة واسعة من الفواكه والخضار والبيض وأكثر')
    : (bannerForm.description_en || 'Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more');

  const previewCtaText = isPreviewAr ? (bannerForm.cta_text_ar || 'تسوق الآن') : (bannerForm.cta_text_en || 'Shop Now');
  const previewTag = isPreviewAr ? bannerForm.tag_ar : bannerForm.tag_en;
  const previewBadge = isPreviewAr ? bannerForm.badge_ar : bannerForm.badge_en;

  const currentPreviewDesktopImg = previewFileUrl || (bannerForm.desktop_image ? getImageUrl(bannerForm.desktop_image) : '/banners/promotional_grocery_banner.jpg');
  const currentPreviewMobileImg = previewMobileFileUrl || (bannerForm.mobile_image ? getImageUrl(bannerForm.mobile_image) : currentPreviewDesktopImg);
  const previewActiveImg = previewViewport === 'mobile' ? currentPreviewMobileImg : currentPreviewDesktopImg;

  const previewOverlayOpacity = parseFloat(bannerForm.overlay_opacity || 0.25);
  const previewTextGradient = isPreviewAr
    ? `linear-gradient(to left, rgba(0,0,0,${Math.min(previewOverlayOpacity + 0.35, 0.85)}) 0%, rgba(0,0,0,${Math.max(previewOverlayOpacity, 0.15)}) 45%, rgba(0,0,0,0) 85%)`
    : `linear-gradient(to right, rgba(0,0,0,${Math.min(previewOverlayOpacity + 0.35, 0.85)}) 0%, rgba(0,0,0,${Math.max(previewOverlayOpacity, 0.15)}) 45%, rgba(0,0,0,0) 85%)`;

  const previewGradientStyle = {
    background: isPreviewAr
      ? `linear-gradient(to left, ${bannerForm.gradient_start} 0%, ${bannerForm.gradient_end} 100%)`
      : `linear-gradient(to right, ${bannerForm.gradient_start} 0%, ${bannerForm.gradient_end} 100%)`,
    backgroundColor: bannerForm.bg_color,
  };

  const levelBadgeText = isPreviewAr ? levelInfo.badge_ar : levelInfo.badge_en;

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
              {/* ========================================================= */}
              {/* 1. INTERACTIVE LIVE PROMOTIONAL BANNER PREVIEW            */}
              {/* ========================================================= */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-sm text-slate-800">
                      {isAr ? `معاينة حية لبانر المستوى ${activeLevel}` : `Live Promotional Banner Preview (Level ${activeLevel})`}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      DYNAMIC HERO BANNER
                    </span>
                  </div>

                  {/* Preview Controls: Viewport (Desktop/Mobile) & Language (EN/AR) */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('desktop')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                          previewViewport === 'desktop' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-500'
                        }`}
                        title="Desktop Preview"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('mobile')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                          previewViewport === 'mobile' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-500'
                        }`}
                        title="Mobile Preview"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mobile</span>
                      </button>
                    </div>

                    <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewLocale('en')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          previewLocale === 'en' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-500'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewLocale('ar')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          previewLocale === 'ar' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-500'
                        }`}
                      >
                        العربية
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Container */}
                <div className={`transition-all duration-300 ${previewViewport === 'mobile' ? 'max-w-[420px] mx-auto' : 'w-full'}`}>
                  
                  {/* PREVIEW: DYNAMIC HERO BANNER WITH OVERLAY */}
                  <div
                    dir={isPreviewAr ? 'rtl' : 'ltr'}
                    className="relative w-full rounded-2xl overflow-hidden shadow-md group h-[150px] sm:h-[180px] lg:h-[210px] min-h-[140px] flex items-center"
                  >
                      {/* Background Image Layer */}
                      <img
                        src={previewActiveImg}
                        alt="Banner Preview"
                        className="absolute inset-0 w-full h-full object-cover object-center block"
                        onError={(e) => {
                          e.currentTarget.src = '/banners/promotional_grocery_banner.jpg';
                        }}
                      />

                      {/* Text-side Directional Gradient Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{ background: previewTextGradient }}
                      />

                      {/* Optional Global Dark Dimmer Overlay */}
                      {previewOverlayOpacity > 0 && (
                        <div
                          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                          style={{ opacity: previewOverlayOpacity }}
                        />
                      )}

                      {/* Content Layer (Absolute HTML/CSS Overlay) */}
                      <div className="relative z-10 w-full p-4 sm:p-5 lg:px-8 lg:py-3.5">
                        <div
                          className={`max-w-md space-y-1 sm:space-y-1.5 ${
                            bannerForm.text_alignment === 'center'
                              ? 'mx-auto text-center'
                              : bannerForm.text_alignment === 'right'
                              ? 'ml-auto text-right'
                              : isPreviewAr
                              ? 'ml-auto text-right'
                              : 'mr-auto text-left'
                          }`}
                        >
                          <h2
                            className="text-base sm:text-lg lg:text-xl font-bold leading-tight tracking-tight drop-shadow-sm"
                            style={{ color: bannerForm.text_color }}
                          >
                            {previewHeading}
                          </h2>

                          {previewDesc && (
                            <p
                              className="text-xs font-medium leading-relaxed opacity-95 drop-shadow-xs max-w-sm line-clamp-2"
                              style={{ color: bannerForm.text_color }}
                            >
                              {previewDesc}
                            </p>
                          )}

                          {bannerForm.show_cta && (
                            <div className="pt-1 sm:pt-1.5">
                              <span
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs shadow-md"
                                style={{ backgroundColor: bannerForm.cta_bg_color, color: bannerForm.cta_text_color }}
                              >
                                <span>{previewCtaText}</span>
                                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* ========================================================= */}
              {/* 2. COMPREHENSIVE CONFIGURATION CONTROLS FORM              */}
              {/* ========================================================= */}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'استرجاع الافتراضي' : 'Reset Defaults'}</span>
                  </button>
                </div>

                <div className="space-y-6">

                  {/* ---------------- SECTION 1: BACKGROUND IMAGES & UPLOADS ---------------- */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ImageIcon className="w-4 h-4 text-emerald-700" />
                        <span>{isAr ? 'صور الخلفية (Desktop & Mobile Background Images)' : 'Background Images (Desktop & Mobile)'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Desktop Background Image */}
                      <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 block">
                            {isAr ? 'صورة الخلفية لسطح المكتب (Desktop Image)' : 'Desktop Banner Background (100% Width)'}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">High-Res Recommended</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#043927] file:text-white cursor-pointer"
                        />
                        {selectedFile && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded truncate">
                            Uploaded: {selectedFile.name}
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="/banners/... or https://..."
                          value={bannerForm.desktop_image}
                          onChange={(e) => {
                            setBannerForm({ ...bannerForm, desktop_image: e.target.value });
                            if (!selectedFile) setPreviewFileUrl('');
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-mono"
                        />
                      </div>

                      {/* Mobile Background Image */}
                      <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 block">
                            {isAr ? 'صورة الخلفية للجوال (Mobile Fallback)' : 'Mobile Banner Background (Optional)'}
                          </span>
                          <span className="text-[10px] text-slate-400">Fallback for smaller screens</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMobileFileChange}
                          className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#043927] file:text-white cursor-pointer"
                        />
                        {selectedMobileFile && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded truncate">
                            Uploaded: {selectedMobileFile.name}
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="Optional mobile image URL"
                          value={bannerForm.mobile_image}
                          onChange={(e) => {
                            setBannerForm({ ...bannerForm, mobile_image: e.target.value });
                            if (!selectedMobileFile) setPreviewMobileFileUrl('');
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-mono"
                        />
                      </div>

                    </div>

                    {/* Quick Presets */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setBannerForm({
                          ...bannerForm,
                          desktop_image: '/banners/promotional_grocery_banner.jpg',
                          display_mode: 'hybrid',
                        })}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                      >
                        Promotional Banner (Full Reference Image)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerForm({
                          ...bannerForm,
                          desktop_image: '/banners/farm_fresh_produce.jpg',
                          display_mode: 'hybrid',
                        })}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                      >
                        Farm Fresh Background
                      </button>
                    </div>
                  </div>

                  {/* ---------------- SECTION 2: TEXT CONTENT FIELDS (Multilingual: EN & AR) ---------------- */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Type className="w-4 h-4 text-emerald-700" />
                      <span>{isAr ? 'نصوص البانر (Multilingual Title & Description)' : 'Text Content Fields (Multilingual: EN & AR)'}</span>
                    </div>

                    {/* Banner Titles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Banner Title (English)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Stock up on daily essentials"
                          value={bannerForm.heading_en}
                          onChange={(e) => setBannerForm({ ...bannerForm, heading_en: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          عنوان البانر (بالعربية)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="مثال: تزود بالاحتياجات اليومية"
                          value={bannerForm.heading_ar}
                          onChange={(e) => setBannerForm({ ...bannerForm, heading_ar: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-right"
                        />
                      </div>
                    </div>

                    {/* Banner Descriptions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Banner Description (English)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g., Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more"
                          value={bannerForm.description_en}
                          onChange={(e) => setBannerForm({ ...bannerForm, description_en: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          وصف البانر (بالعربية)
                        </label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          placeholder="مثال: احصل على خيرات المزرعة الطازجة وتشكيلة واسعة من الفواكه والخضار والبيض وأكثر"
                          value={bannerForm.description_ar}
                          onChange={(e) => setBannerForm({ ...bannerForm, description_ar: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white resize-none text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ---------------- SECTION 3: CTA BUTTON SETTINGS ---------------- */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <MousePointerClick className="w-4 h-4 text-emerald-700" />
                        <span>{isAr ? 'إعدادات زر الدعوة للإجراء (CTA Button Settings)' : 'CTA Button Settings'}</span>
                      </div>

                      {/* Button Visibility Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bannerForm.show_cta}
                          onChange={(e) => setBannerForm({ ...bannerForm, show_cta: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${bannerForm.show_cta ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${bannerForm.show_cta ? 'left-4.5 rtl:left-0.5' : 'left-0.5 rtl:left-4.5'}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {bannerForm.show_cta ? (isAr ? 'الزر مفعل (ظاهر)' : 'Show CTA Button') : (isAr ? 'الزر معطل (مخفي)' : 'Hide CTA Button')}
                        </span>
                      </label>
                    </div>

                    {bannerForm.show_cta && (
                      <div className="space-y-3 pt-2 border-t border-emerald-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Button Text (English):
                            </label>
                            <input
                              type="text"
                              value={bannerForm.cta_text_en}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_text_en: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                              placeholder="Shop Now"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              نص الزر (العربية):
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              value={bannerForm.cta_text_ar}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_text_ar: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-right"
                              placeholder="تسوق الآن"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Button Destination URL / Link:
                            </label>
                            <input
                              type="text"
                              value={bannerForm.cta_url}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_url: e.target.value })}
                              placeholder="#products or /category/..."
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Button Color Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-600">Button BG Color:</span>
                            <input
                              type="color"
                              value={bannerForm.cta_bg_color}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_bg_color: e.target.value })}
                              className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={bannerForm.cta_bg_color}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_bg_color: e.target.value })}
                              className="w-20 px-2 py-1 text-xs rounded border border-slate-200 font-mono"
                            />
                          </div>

                          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-600">Button Text Color:</span>
                            <input
                              type="color"
                              value={bannerForm.cta_text_color}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_text_color: e.target.value })}
                              className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={bannerForm.cta_text_color}
                              onChange={(e) => setBannerForm({ ...bannerForm, cta_text_color: e.target.value })}
                              className="w-20 px-2 py-1 text-xs rounded border border-slate-200 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ---------------- SECTION 4: OVERLAY STYLING & ALIGNMENT CONTROLS ---------------- */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Palette className="w-4 h-4 text-emerald-700" />
                      <span>{isAr ? 'تنسيق النص ودرجة تعتيم الخلفية (Overlay Styling & Dimmer)' : 'Overlay Styling & Alignment Controls'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Text Alignment */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Text Alignment:
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, text_alignment: 'left' })}
                            className={`py-1.5 rounded-lg flex items-center justify-center cursor-pointer ${bannerForm.text_alignment === 'left' ? 'bg-[#043927] text-white' : 'text-slate-600'}`}
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, text_alignment: 'center' })}
                            className={`py-1.5 rounded-lg flex items-center justify-center cursor-pointer ${bannerForm.text_alignment === 'center' ? 'bg-[#043927] text-white' : 'text-slate-600'}`}
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, text_alignment: 'right' })}
                            className={`py-1.5 rounded-lg flex items-center justify-center cursor-pointer ${bannerForm.text_alignment === 'right' ? 'bg-[#043927] text-white' : 'text-slate-600'}`}
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Text Color */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Text Color:
                        </label>
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                          <input
                            type="color"
                            value={bannerForm.text_color}
                            onChange={(e) => setBannerForm({ ...bannerForm, text_color: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={bannerForm.text_color}
                            onChange={(e) => setBannerForm({ ...bannerForm, text_color: e.target.value })}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border-0 font-mono uppercase"
                          />
                        </div>
                      </div>

                      {/* Overlay Dark Dimmer / Gradient Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-600">
                            Overlay Gradient / Dimmer:
                          </label>
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {Math.round(parseFloat(bannerForm.overlay_opacity || 0.25) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.80"
                          step="0.05"
                          value={bannerForm.overlay_opacity}
                          onChange={(e) => setBannerForm({ ...bannerForm, overlay_opacity: parseFloat(e.target.value) })}
                          className="w-full accent-[#043927] cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Darkens background behind text to ensure readability across bright images.
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* ---------------- SECTION 5: RETAINED BADGES & FEATURE PILLS ---------------- */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'الشارات وميزات الضمان (Classic Legacy Data)' : 'Highlight Badges & Guarantee Pills (Retained)'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Saved for backward compatibility
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 block">Badge 1 (Green Tag):</label>
                        <input
                          type="text"
                          placeholder="100% FARM FRESH"
                          value={bannerForm.tag_en}
                          onChange={(e) => setBannerForm({ ...bannerForm, tag_en: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="طازج 100% من المزرعة"
                          value={bannerForm.tag_ar}
                          onChange={(e) => setBannerForm({ ...bannerForm, tag_ar: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-right"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 block">Badge 2 (Orange Badge):</label>
                        <input
                          type="text"
                          placeholder="BEST PRICE GUARANTEED"
                          value={bannerForm.badge_en}
                          onChange={(e) => setBannerForm({ ...bannerForm, badge_en: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="أفضل سعر مضمون"
                          value={bannerForm.badge_ar}
                          onChange={(e) => setBannerForm({ ...bannerForm, badge_ar: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-right"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">Feature & Guarantee Pills:</span>
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                        >
                          + Add Pill
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {contentForm.features.map((feat, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span>Pill #{idx + 1}</span>
                              {contentForm.features.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeature(idx)}
                                  className="text-rose-500 font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={feat.label_en}
                              onChange={(e) => handleFeatureChange(idx, 'label_en', e.target.value)}
                              className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                            />
                            <input
                              type="text"
                              dir="rtl"
                              value={feat.label_ar}
                              onChange={(e) => handleFeatureChange(idx, 'label_ar', e.target.value)}
                              className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200 text-right"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ---------------- BOTTOM SAVE BUTTON ---------------- */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !activeCategory}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
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
