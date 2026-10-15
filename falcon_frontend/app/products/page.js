'use client';
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useCart } from '../../src/contexts/CartContext';
import { useWishlist } from '../../src/contexts/WishlistContext';
import { fetchApi, getImageUrl } from '../../src/services/api';
import {
  Search,
  ShoppingBag,
  Leaf,
  Sparkles,
  Heart,
  Check,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Filter,
  Star,
  Truck,
  ShieldCheck,
  Zap,
  Tag,
  SlidersHorizontal,
  Trash2,
  Loader2,
  Ban,
} from 'lucide-react';

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const { addToCart, cart, updateQuantity, removeItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const categoryIdParam = searchParams.get('categoryId') || searchParams.get('category') || '';
  const subcategoryIdParam = searchParams.get('subcategoryId') || searchParams.get('sub') || '';
  const subSubcategoryIdParam = searchParams.get('subSubcategoryId') || searchParams.get('subSub') || '';
  const subSubSubcategoryIdParam = searchParams.get('subSubSubcategoryId') || searchParams.get('subSubSub') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryIdParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryIdParam);
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState(subSubcategoryIdParam);
  const [selectedSubSubSubcategory, setSelectedSubSubSubcategory] = useState(subSubSubcategoryIdParam);
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [addingId, setAddingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [activeFilterChip, setActiveFilterChip] = useState('ALL');
  const [priceRange, setPriceRange] = useState(150);
  const [minPrice, setMinPrice] = useState(5);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const sortParam = searchParams.get('sort') || searchParams.get('sortBy') || 'featured';
  const [sortOption, setSortOption] = useState(sortParam);

  // Dynamic Pagination State
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(pageParam || 1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (categoryIdParam !== selectedCategory) setSelectedCategory(categoryIdParam);
    if (subcategoryIdParam !== selectedSubcategory) setSelectedSubcategory(subcategoryIdParam);
    if (subSubcategoryIdParam !== selectedSubSubcategory) setSelectedSubSubcategory(subSubcategoryIdParam);
    if (subSubSubcategoryIdParam !== selectedSubSubSubcategory) setSelectedSubSubSubcategory(subSubSubcategoryIdParam);
    if (pageParam && pageParam !== currentPage) setCurrentPage(pageParam);
    if (sortParam && sortParam !== sortOption) setSortOption(sortParam);
  }, [categoryIdParam, subcategoryIdParam, subSubcategoryIdParam, subSubSubcategoryIdParam, pageParam, sortParam]);

  const loadCategories = async () => {
    try {
      const res = await fetchApi('/categories?all=true');
      if (res.success) {
        setCategories(res.data.categories || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const [heroBannerConfig, setHeroBannerConfig] = useState(null);

  const loadHeroBanner = async () => {
    try {
      const res = await fetchApi('/category-banner');
      if (res.success && res.data?.banner) {
        setHeroBannerConfig(res.data.banner);
      }
    } catch (err) {
      console.error('Failed to load category hero banner:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = `/products?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`;
      if (selectedCategory) query += `&categoryId=${selectedCategory}`;
      if (selectedSubcategory) query += `&subcategoryId=${selectedSubcategory}`;
      if (selectedSubSubcategory) query += `&subSubcategoryId=${selectedSubSubcategory}`;
      if (selectedSubSubSubcategory) query += `&subSubSubcategoryId=${selectedSubSubSubcategory}`;

      if (minPrice !== undefined && minPrice !== null && minPrice !== '') query += `&minPrice=${minPrice}`;
      if (priceRange !== undefined && priceRange !== null && priceRange !== '') query += `&maxPrice=${priceRange}`;

      if (selectedBrands.length > 0) {
        query += `&brands=${encodeURIComponent(selectedBrands.join(','))}`;
      }

      query += `&sort=${encodeURIComponent(sortOption)}`;

      const res = await fetchApi(query);
      if (res.success && res.data) {
        const fetched = res.data.products?.products || res.data.products || (Array.isArray(res.data) ? res.data : []);
        setProducts(fetched);
        if (res.data.pagination) {
          setTotalItems(res.data.pagination.total ?? 0);
          setTotalPages(res.data.pagination.totalPages ?? 1);
        } else {
          setTotalItems(fetched.length);
          setTotalPages(1);
        }
        if (Array.isArray(res.data.brands)) {
          setAvailableBrands(res.data.brands);
        }
      } else {
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('API product load error:', err);
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadHeroBanner();
  }, []);

  // When filters, brands or search change, reset page back to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedSubSubSubcategory, search, minPrice, priceRange, sortOption, selectedBrands]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedSubSubSubcategory, search, minPrice, priceRange, sortOption, selectedBrands, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', newPage);
    router.push(`/products?${newParams.toString()}`, { scroll: false });

    // Smooth scroll to catalog main view
    const mainElem = document.getElementById('products-catalog-main');
    if (mainElem) {
      mainElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const displayCategoryTree = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [];
    }

    const mainCats = categories.filter((c) => !c.parent_id);

    const getChildren = (parentId) => {
      return categories.filter((c) => String(c.parent_id) === String(parentId));
    };

    return mainCats.map((main) => {
      const level2 = (main.subcategories && main.subcategories.length > 0) ? main.subcategories : getChildren(main.id);
      return {
        ...main,
        children: level2.map((sub) => {
          const level3 = (sub.subcategories && sub.subcategories.length > 0) ? sub.subcategories : getChildren(sub.id);
          return {
            ...sub,
            children: level3.map((subSub) => {
              const level4 = (subSub.subcategories && subSub.subcategories.length > 0) ? subSub.subcategories : getChildren(subSub.id);
              return {
                ...subSub,
                children: level4,
              };
            }),
          };
        }),
      };
    });
  }, [categories]);

  const getCategoryBannerImage = (cat) => {
    if (cat?.image_url && typeof cat.image_url === 'string' && cat.image_url.trim() !== '') {
      return getImageUrl(cat.image_url);
    }
    const nameStr = (cat?.slug || cat?.name_en || cat?.name_ar || '').toLowerCase();
    if (nameStr.includes('frozen')) return '/categories/cat_frozen_food.jpg';
    if (nameStr.includes('house') || nameStr.includes('clean')) return '/categories/cat_household.jpg';
    if (nameStr.includes('groc') || nameStr.includes('veg') || nameStr.includes('fruit')) return '/categories/cat_groceries.jpg';
    if (nameStr.includes('snack') || nameStr.includes('biscuit')) return '/categories/cat_snacks.jpg';
    if (nameStr.includes('person') || nameStr.includes('care')) return '/categories/cat_personal_care.jpg';
    if (nameStr.includes('dairy') || nameStr.includes('milk')) return '/categories/cat_dairy.jpg';
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';
  };

  const activeCategoryObj = useMemo(() => {
    const activeId = selectedSubSubSubcategory || selectedSubSubcategory || selectedSubcategory || selectedCategory;
    if (!activeId || !categories || categories.length === 0) return null;

    const findCategory = (list) => {
      if (!list || !Array.isArray(list)) return null;
      for (const item of list) {
        if (
          String(item.id) === String(activeId) ||
          (item.slug && String(item.slug).toLowerCase() === String(activeId).toLowerCase())
        ) {
          return item;
        }
        if (item.subcategories && item.subcategories.length > 0) {
          const found = findCategory(item.subcategories);
          if (found) return found;
        }
        if (item.children && item.children.length > 0) {
          const found = findCategory(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findCategory(categories);
  }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedSubSubSubcategory, categories]);

  const toggleCatExpand = (catId, e) => {
    e.stopPropagation();
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleSelectCat = (node, level) => {
    let newCat = '', newSub = '', newSubSub = '', newSubSubSub = '';

    const isCurrentlySelected =
      (level === 1 && selectedCategory === node.id && !selectedSubcategory) ||
      (level === 2 && selectedSubcategory === node.id && !selectedSubSubcategory) ||
      (level === 3 && selectedSubSubcategory === node.id && !selectedSubSubSubcategory) ||
      (level === 4 && selectedSubSubSubcategory === node.id);

    if (!isCurrentlySelected) {
      if (level === 1) {
        newCat = node.id;
      } else if (level === 2) {
        newCat = node.parent_id || selectedCategory;
        newSub = node.id;
      } else if (level === 3) {
        newCat = selectedCategory;
        newSub = node.parent_id || selectedSubcategory;
        newSubSub = node.id;
      } else if (level === 4) {
        newCat = selectedCategory;
        newSub = selectedSubcategory;
        newSubSub = node.parent_id || selectedSubSubcategory;
        newSubSubSub = node.id;
      }
    }

    setSelectedCategory(newCat);
    setSelectedSubcategory(newSub);
    setSelectedSubSubcategory(newSubSub);
    setSelectedSubSubSubcategory(newSubSubSub);

    const newParams = new URLSearchParams(searchParams.toString());
    if (newCat) newParams.set('categoryId', newCat); else newParams.delete('categoryId');
    if (newSub) newParams.set('subcategoryId', newSub); else newParams.delete('subcategoryId');
    if (newSubSub) newParams.set('subSubcategoryId', newSubSub); else newParams.delete('subSubcategoryId');
    if (newSubSubSub) newParams.set('subSubSubcategoryId', newSubSubSub); else newParams.delete('subSubSubcategoryId');
    newParams.delete('category');
    newParams.delete('sub');

    router.push(`/products?${newParams.toString()}`, { scroll: false });
  };

  const renderCategoryNode = (node, level = 1) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCats.has(node.id) || 
      (selectedSubcategory && node.children?.some(c => String(c.id) === String(selectedSubcategory))) ||
      (selectedSubSubcategory && node.children?.some(c => c.children?.some(cc => String(cc.id) === String(selectedSubSubcategory))));

    const isSelected =
      (level === 1 && String(selectedCategory) === String(node.id) && !selectedSubcategory) ||
      (level === 2 && String(selectedSubcategory) === String(node.id) && !selectedSubSubcategory) ||
      (level === 3 && String(selectedSubSubcategory) === String(node.id) && !selectedSubSubSubcategory) ||
      (level === 4 && String(selectedSubSubSubcategory) === String(node.id));

    const isAncestorActive = isExpanded || isSelected ||
      (selectedCategory && String(selectedCategory) === String(node.id));

    const name = (locale === 'ar' ? node.name_ar : node.name_en) || node.name_en || node.name || '';

    return (
      <div key={node.id} className="space-y-1 font-sans">
        
        {/* Category Item Row */}
        <div
          onClick={() => {
            if (hasChildren && !isExpanded) {
              setExpandedCats((prev) => new Set(prev).add(node.id));
            }
            handleSelectCat(node, level);
          }}
          className={`flex items-center justify-between py-2 px-3 rounded-xl transition-all cursor-pointer group select-none ${
            isAncestorActive || isSelected
              ? 'bg-emerald-50/90 text-[#043927] font-extrabold border border-emerald-100/90 shadow-2xs'
              : 'hover:bg-slate-100/80 text-slate-700 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Collapse/Expand Toggle (- / +) for parents, or Checkbox */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCatExpand(node.id, e)}
                className="w-4 h-4 flex items-center justify-center text-[#043927] font-black hover:opacity-80 transition-opacity shrink-0"
              >
                {isExpanded ? (
                  <span className="text-lg leading-none font-black">−</span>
                ) : (
                  <span className="text-base leading-none font-bold">+</span>
                )}
              </button>
            ) : (
              /* Blue / White Checkbox matching reference screenshot */
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'border-slate-300 bg-white group-hover:border-[#043927]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </div>
            )}

            {/* Category Name */}
            <span className={`text-xs truncate font-sans ${isAncestorActive || isSelected ? 'font-black text-[#043927]' : 'font-semibold text-slate-800 group-hover:text-[#043927]'}`}>
              {name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {node.count !== undefined && (
              <span className="text-slate-400 text-[11px] font-medium">({node.count})</span>
            )}
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => toggleCatExpand(node.id, e)}
                className="p-1 text-[#043927] hover:bg-emerald-100/60 rounded-md transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#043927] stroke-[2.5]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180 stroke-[2]" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Render Nested Children (With Vertical Line Indicator & "All [Category]" Option) */}
        {hasChildren && isExpanded && (
          <div className="pl-4 rtl:pr-4 border-l-2 border-emerald-100/80 rtl:border-r-2 rtl:border-l-0 ml-4 rtl:mr-4 space-y-1.5 pt-1 pb-1">
            
            {/* "All [Category Name]" Option */}
            <div
              onClick={() => handleSelectCat(node, level)}
              className={`flex items-center gap-2.5 py-1.5 px-3 rounded-xl cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-emerald-50/90 text-[#043927] font-black border border-emerald-200/80 shadow-2xs'
                  : 'hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <span className={`text-xs font-semibold ${isSelected ? 'text-[#043927] font-black' : 'text-slate-700'}`}>
                {locale === 'ar' ? `كل ${name}` : `All ${name}`}
              </span>
            </div>

            {/* Child Subcategories */}
            {node.children.map((child) => renderCategoryNode(child, level + 1))}
          </div>
        )}

      </div>
    );
  };

  const toggleBrand = (brandName) => {
    setSelectedBrands((prev) => {
      const next = prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName];
      return next;
    });
  };

  const resetAllFilters = () => {
    setActiveFilterChip('ALL');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedSubSubcategory('');
    setSelectedSubSubSubcategory('');
    setMinPrice(5);
    setPriceRange(200);
    setSelectedBrands([]);
    setCurrentPage(1);
    router.push('/products', { scroll: false });
  };

  const getCartItem = (productId) => {
    if (!cart?.items || !productId) return null;
    return cart.items.find(
      (item) => item.product_id === productId || item.productId === productId || item.product?.id === productId
    );
  };

  const handleAddToCart = async (productId, prodData = null) => {
    try {
      setAddingId(productId);
      setActionId(productId);
      await addToCart(productId, 1, prodData);
    } catch (err) {
      // Toast notification is managed by CartContext
    } finally {
      setAddingId(null);
      setActionId(null);
    }
  };

  const handleIncrement = async (productId, prodData = null) => {
    const item = getCartItem(productId);
    if (!item) {
      await handleAddToCart(productId, prodData);
      return;
    }
    try {
      setActionId(productId);
      await updateQuantity(item.id, item.quantity + 1);
    } catch (err) {
      // Toast notification is managed by CartContext
    } finally {
      setActionId(null);
    }
  };

  const handleDecrement = async (productId) => {
    const item = getCartItem(productId);
    if (!item) return;
    try {
      setActionId(productId);
      if (item.quantity <= 1) {
        await removeItem(item.id);
      } else {
        await updateQuantity(item.id, item.quantity - 1);
      }
    } catch (err) {
      // Toast notification is managed by CartContext
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 font-sans bg-[#fbfcfb]">

      {/* 1. Dynamic Category Hero Banner */}
      {heroBannerConfig?.enabled !== false && (
        <div
          style={{ backgroundColor: heroBannerConfig?.bg_color || '#043927' }}
          className="rounded-2xl sm:p-8 min-h-[180px] relative overflow-hidden text-white shadow-md font-sans transition-all"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Text Block */}
            <div className="lg:col-span-8 space-y-3 text-left rtl:text-right z-10">
              <div className="flex items-center gap-2">
                <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  {locale === 'ar'
                    ? (heroBannerConfig?.badge1_ar || heroBannerConfig?.badge1_en || 'طازج 100% من المزرعة')
                    : (heroBannerConfig?.badge1_en || '100% FARM FRESH')}
                </span>
                <span className="bg-[#ea580c] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  {locale === 'ar'
                    ? (heroBannerConfig?.badge2_ar || heroBannerConfig?.badge2_en || 'أفضل سعر مضمون')
                    : (heroBannerConfig?.badge2_en || 'BEST PRICE GUARANTEED')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-tight font-heading">
                {locale === 'ar'
                  ? (heroBannerConfig?.title_ar || heroBannerConfig?.title_en || 'فواكه وخضروات طازجة من المزرعة')
                  : (heroBannerConfig?.title_en || 'Fresh Farm Fruits & Groceries')}
              </h1>

              <p className="text-[#a7f3d0] font-medium text-xs sm:text-sm lg:text-base max-w-2xl leading-relaxed font-sans">
                {locale === 'ar'
                  ? (heroBannerConfig?.desc_ar || heroBannerConfig?.desc_en || 'منتجات مزارع طازجة منتقاة بعناية وموثقة 100٪ للتغذية اليومية لعائلتك، مباشرة من المزرعة إلى مائدتك.')
                  : (heroBannerConfig?.desc_en || 'Hand-picked 100% certified fresh farm produce, fruits, herbs and whole foods for your daily nutrition. Direct farm-to-table for your family\'s health.')}
              </p>
            </div>

            {/* Right Crate Visual Illustration */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end z-10">
              <div className="relative w-55 sm:w-64 h-36 sm:h-40 flex flex-col items-center justify-center text-center overflow-hidden">
                <img
                  src={getImageUrl(heroBannerConfig?.image_url) || '/banners/farm_fresh_produce.jpg'}
                  alt={heroBannerConfig?.title_en || 'Fresh Farm Fruits & Groceries'}
                  className="w-full h-full object-cover rounded-xl opacity-90 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/banners/farm_fresh_produce.jpg';
                  }}
                />
                
              </div>
            </div>

          </div>

          {/* Decorative Wave Accent Overlay */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none bg-gradient-to-l from-emerald-400 to-transparent"></div>
        </div>
      )}

      {/* 2. Breadcrumb Navigation & Active Filter Chips Bar */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <span>›</span>
          <Link href="/products" className="hover:text-emerald-700 transition-colors">{locale === 'ar' ? 'البقالة والمنتجات' : 'Groceries & Products'}</Link>
          {activeCategoryObj && (
            <>
              <span>›</span>
              <span className="text-slate-900 font-bold">
                {locale === 'ar' ? (activeCategoryObj.name_ar || activeCategoryObj.name_en) : (activeCategoryObj.name_en || activeCategoryObj.name)}
              </span>
            </>
          )}
        </div>

        {/* Filter Chips Row & Sort Control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          
          {/* Left Chips */}
          {/* <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label_en: 'ALL (148)', label_ar: 'الكل (١٤٨)' },
              { id: 'ORGANIC', label_en: 'Organic Section 1', label_ar: 'قسم العضوي ١' },
              { id: 'FRESH_SMALL', label_en: 'Fresh Small Produce 1', label_ar: 'منتجات طازجة 1' },
              { id: 'SMALL_MED', label_en: 'Small Medium 1', label_ar: 'حجم متوسط ١' },
              { id: 'DISCOUNT', label_en: 'Discounts > 45%', label_ar: 'خصومات ٤٥٪+', isGold: true },
              { id: 'SHOW_ALL', label_en: 'Show All', label_ar: 'عرض الكل' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilterChip(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilterChip === chip.id
                    ? 'bg-[#043927] text-white shadow-xs'
                    : chip.isGold
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {locale === 'ar' ? chip.label_ar : chip.label_en}
              </button>
            ))}
          </div> */}

          {/* Right Items Count & Sort Selector */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 shrink-0 self-end sm:self-auto">
            <span>{locale === 'ar' ? `عرض ${totalItems} منتج` : `Showing ${totalItems} items`}</span>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-slate-400">{locale === 'ar' ? 'ترتيب حسب:' : 'Sort By:'}</span>
              <select
                value={sortOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setSortOption(val);
                  const newParams = new URLSearchParams(searchParams.toString());
                  newParams.set('sort', val);
                  newParams.set('page', '1');
                  router.push(`/products?${newParams.toString()}`, { scroll: false });
                }}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="featured">{locale === 'ar' ? 'المميزة' : 'Featured'}</option>
                <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل' : 'Price: Low to High'}</option>
                <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى' : 'Price: High to Low'}</option>
                <option value="rating">{locale === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main 2-Column Catalog Layout (Left Sidebar Filters + Right 4-Column Product Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT SIDEBAR FILTERS PANEL (3 Columns) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-6 sticky top-24 self-start font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#043927]" />
              <span>{locale === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}</span>
            </h3>
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {locale === 'ar' ? 'إعادة ضبط' : 'Reset All'}
            </button>
          </div>

          {/* 1. Produce Categories (Nested Tree) */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'تصنيفات المنتجات' : 'Produce Categories'}
            </h4>
            <div className="space-y-1 text-xs font-medium text-slate-700">
              {displayCategoryTree.map((catNode) => renderCategoryNode(catNode, 1))}
            </div>
          </div>

          {/* 2. Delivery Speed */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'سرعة التوصيل' : 'Delivery Speed'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer text-[#043927] font-bold">
                <input type="radio" name="speed" defaultChecked className="w-4 h-4 text-[#043927]" />
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Express 2-Hours</span>
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                <input type="radio" name="speed" className="w-4 h-4 text-[#043927]" />
                <span>Scheduled Delivery Slot</span>
              </label>
            </div>
          </div>

          {/* 3. Price Range (SAR) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{locale === 'ar' ? 'نطاق السعر (ريال)' : 'Price Range (SAR)'}</span>
              <span className="text-[#043927] font-black">SAR {minPrice} - SAR {priceRange}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-[#043927] cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <div className="w-1/2 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700">
                <span className="text-slate-400 mr-1 font-normal">SAR</span>
                <input
                  type="number"
                  min="0"
                  max={priceRange}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-bold focus:outline-none"
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="w-1/2 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700">
                <span className="text-slate-400 mr-1 font-normal">SAR</span>
                <input
                  type="number"
                  min={minPrice}
                  max="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Dietary & Harvest Type */}
          {/* <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {locale === 'ar' ? 'نوع الحصاد' : 'Dietary & Harvest Type'}
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              {[
                { name: '100% Organic Certified', count: 45 },
                { name: 'Saudi Local Farm Produce', count: 74 },
                { name: 'Pesticide Free & Hydroponic', count: 61 },
                { name: 'Halal Certified', count: 98 },
                { name: 'Winter Fresh Harvest', count: 19 },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between hover:text-[#043927] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#043927]" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">({item.count})</span>
                </label>
              ))}
            </div>
          </div> */}

          {/* 5. Trusted Farm Brands */}
          <div className="space-y-3 pt-3 border-t border-slate-100 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                {locale === 'ar' ? 'العلامات التجارية الموثوقة' : 'Trusted Farm Brands'}
              </h4>
              {selectedBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBrands([])}
                  className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  {locale === 'ar' ? 'إعادة ضبط' : 'Clear'}
                </button>
              )}
            </div>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              {(() => {
                // If DB has brands, use DB brands; otherwise fallback to default list
                const displayBrands = (availableBrands && availableBrands.length > 0)
                  ? availableBrands
                  : [
                      { name: 'FreshKart Organic Farms', count: 41 },
                      { name: 'Almarai / Al Kabeer', count: 35 },
                      { name: 'NADEC Foods', count: 28 },
                      { name: 'Sunbulah / Hayat', count: 19 },
                      { name: 'Emirates Selection', count: 11 },
                    ];

                return displayBrands.map((brand, idx) => {
                  const isChecked = selectedBrands.includes(brand.name);
                  return (
                    <label
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleBrand(brand.name);
                      }}
                      className={`flex items-center justify-between transition-colors cursor-pointer select-none py-0.5 ${
                        isChecked ? 'text-[#043927] font-bold' : 'text-slate-700 hover:text-[#043927]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? 'bg-[#043927] border-[#043927] text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-[#043927]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs">{brand.name}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] font-normal">({brand.count})</span>
                    </label>
                  );
                });
              })()}
            </div>
          </div>

          {/* 6. Customer Ratings */}
        

        </aside>

        {/* RIGHT MAIN CONTENT AREA: 4-Column Product Cards Grid (9 Columns) */}
        <main id="products-catalog-main" className="lg:col-span-9 w-full space-y-6">

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4.5">
            {products.map((prod) => {
              const isWish = isInWishlist(prod.id);
              const currentPrice = parseFloat(prod.price || 0);
              let finalPrice = currentPrice;
              let originalPrice = null;
              const hasVariants = Boolean(prod.has_variants && prod.variants && prod.variants.length > 0);

              if (hasVariants) {
                const activeVariants = prod.variants.filter((v) => v.is_active !== false);
                const varsToUse = activeVariants.length > 0 ? activeVariants : prod.variants;
                const prices = varsToUse
                  .map((v) => parseFloat(v.discount_price || v.price))
                  .filter((p) => !isNaN(p) && p > 0);
                if (prices.length > 0) {
                  finalPrice = Math.min(...prices);
                }
              } else {
                const isDiscounted = prod.discount_price && parseFloat(prod.discount_price) < currentPrice;
                finalPrice = isDiscounted ? parseFloat(prod.discount_price) : currentPrice;
                originalPrice = isDiscounted ? currentPrice : (prod.purchase_price ? parseFloat(prod.purchase_price) : null);
              }

                const totalVariantStock = hasVariants && Array.isArray(prod.variants)
                  ? prod.variants.reduce((acc, v) => acc + parseInt(v.stock_quantity || '0', 10), 0)
                  : 0;
                const isOutOfStock = hasVariants
                  ? (prod.variants.length > 0 && totalVariantStock <= 0)
                  : (prod.stock_quantity !== undefined && prod.stock_quantity !== null && parseInt(prod.stock_quantity, 10) <= 0);

                return (
                <div
                  key={prod.id}
                  onClick={() => router.push(`/products/${prod.id}`)}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#05A764] shadow-2xs hover:shadow-lg transition-all duration-300 p-3.5 flex flex-col justify-between relative font-sans cursor-pointer h-full"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10 mb-1">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                        <Ban className="w-2.5 h-2.5 text-white" />
                        <span>{locale === 'ar' ? 'نفذت الكمية' : 'OUT OF STOCK'}</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs ${
                          prod.badgeType === 'red'
                            ? 'bg-rose-600'
                            : prod.badgeType === 'green'
                            ? 'bg-[#05A764]'
                            : 'bg-[#FFA500]'
                        }`}
                      >
                        <Star className="w-2.5 h-2.5 fill-current text-white" />
                        <span>{prod.badge || (hasVariants ? (locale === 'ar' ? 'متعدد الأحجام' : 'MULTI-PACK') : 'BEST SELLER')}</span>
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(prod);
                      }}
                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                      title="Add to Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isWish ? 'text-rose-500 fill-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Product Image Container */}
                  <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] p-2 overflow-hidden flex items-center justify-center my-1.5 relative">
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
                        </span>
                      </div>
                    )}
                    <img
                      src={getImageUrl(prod.img || (prod.images && (typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.image_url)) || prod.image_url)}
                      alt={locale === 'ar' ? prod.name_ar || prod.title_ar : prod.name_en || prod.title_en}
                      className={`w-full h-full object-contain transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`}
                    />
                  </div>

                  {/* Info Content */}
                  <div className="flex-1 flex flex-col justify-between space-y-2 mt-1">
                    <div>
                      {/* Weight Tag & Rating Row */}
                      <div className="flex items-center justify-between text-[11px] font-medium mb-1.5 gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isOutOfStock ? (
                            <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block shrink-0">
                              {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
                            </span>
                          ) : hasVariants ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
                              <Zap className="w-2.5 h-2.5 text-amber-500" />
                              {prod.variants.length} {locale === 'ar' ? 'خيارات' : 'Options'}
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block shrink-0">
                              {prod.unit || (prod.unit_value && prod.unit_type ? `${prod.unit_value} ${prod.unit_type}` : '400g Tray')}
                            </span>
                          )}
                          {prod.brand_en && (
                            <span className="text-slate-400 truncate uppercase font-bold text-[10px]">
                              {prod.brand_en}
                            </span>
                          )}
                        </div>
                        {/* Dynamic Rating & Reviews Row */}
                        <div className="flex items-center gap-1 text-[11px] shrink-0 font-sans">
                          <span className="text-amber-500 font-bold text-xs">★</span>
                          <span className="text-slate-900 font-extrabold text-[11px]">
                            {prod.rating !== undefined && prod.rating !== null && prod.rating !== ''
                              ? Number(prod.rating).toFixed(1)
                              : (prod.avg_rating ? Number(prod.avg_rating).toFixed(1) : '4.8')}
                          </span>
                          <span className="text-slate-400 font-normal text-[10px]">
                            ({(
                              prod.reviews_count !== undefined && prod.reviews_count !== null
                                ? Number(prod.reviews_count)
                                : (prod.reviews !== undefined && prod.reviews !== null
                                  ? Number(prod.reviews)
                                  : (prod.review_count ? Number(prod.review_count) : 0))
                            ).toLocaleString()})
                          </span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug font-sans group-hover:text-[#043927] transition-colors">
                        {locale === 'ar' ? prod.name_ar || prod.title_ar : prod.name_en || prod.title_en}
                      </h3>
                    </div>

                    {/* Price & Add to Cart / Quantity Action Row */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 mt-auto">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-[15px] font-black text-slate-900 font-sans whitespace-nowrap leading-tight">
                            <span className="text-[10px] font-bold text-slate-500 mr-0.5">SAR</span>
                            {finalPrice.toFixed(2)}
                          </span>
                          {!hasVariants && originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-normal whitespace-nowrap">
                              SAR {originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Counter, Select Options, or Add to Cart Button */}
                      {(() => {
                        if (isOutOfStock) {
                          return (
                            <button
                              type="button"
                              disabled
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="h-8 w-full rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                            >
                              <Ban className="w-3.5 h-3.5 text-slate-400" />
                              <span>{locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}</span>
                            </button>
                          );
                        }

                        if (hasVariants) {
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/products/${prod.id}`);
                              }}
                              className="h-8 w-full rounded-xl bg-[#006E2D] hover:bg-[#00B074] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>{locale === 'ar' ? 'اختر الخيارات' : 'Select Options'}</span>
                            </button>
                          );
                        }

                        const cartItem = getCartItem(prod.id);
                        const inCart = cartItem && cartItem.quantity > 0;
                        const isBusy = addingId === prod.id || actionId === prod.id;

                        if (inCart) {
                          return (
                            <div
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="h-8 w-full bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between p-0.5 px-1 shadow-2xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDecrement(prod.id);
                                }}
                                disabled={isBusy}
                                className="w-6.5 h-6.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                title={cartItem.quantity === 1 ? (locale === 'ar' ? 'حذف' : 'Remove') : (locale === 'ar' ? 'إنقاص' : 'Decrease')}
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>

                              <span className="flex-1 text-center text-xs font-black text-slate-900 font-sans select-none">
                                {isBusy ? (
                                  <Loader2 className="w-3 h-3 animate-spin mx-auto text-emerald-600" />
                                ) : (
                                  cartItem.quantity
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleIncrement(prod.id, prod);
                                }}
                                disabled={isBusy || (prod.stock_quantity !== undefined && prod.stock_quantity !== null && cartItem.quantity >= prod.stock_quantity)}
                                className="w-6.5 h-6.5 rounded-lg bg-[#00B074] hover:bg-[#009663] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                title={prod.stock_quantity !== undefined && prod.stock_quantity !== null && cartItem.quantity >= prod.stock_quantity ? (locale === 'ar' ? 'تم الوصول للحد الأقصى للمخزون' : 'Max stock reached') : (locale === 'ar' ? 'زيادة' : 'Increase')}
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(prod.id, prod);
                            }}
                            disabled={isBusy}
                            className="h-8 w-full rounded-xl bg-[#006E2D] hover:bg-[#009663] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'أضف' : 'Add to Cart'}</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Pagination & Item Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
            <span className="text-slate-500 font-medium">
              {totalItems === 0
                ? (locale === 'ar' ? 'لا توجد منتجات' : 'No items found')
                : (locale === 'ar'
                    ? `عرض ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} من أصل ${totalItems} منتج`
                    : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} items`)}
            </span>

            {/* Server-Side Pagination Buttons */}
            {totalItems > 0 && (
              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p, pIdx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${pIdx}`} className="px-1 text-slate-400 font-bold select-none">
                        ...
                      </span>
                    );
                  }

                  const isActive = p === currentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#043927] text-white shadow-2xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Trust Feature Cards (3 Columns) */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 font-sans">
            <div className="bg-[#F0FDF4] p-4.5 rounded-2xl border border-emerald-100 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#05A764] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900">{locale === 'ar' ? '١٠٠٪ طازج أو مجاناً' : '100% Fresh or Free'}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {locale === 'ar' ? 'ضمان الانتعاش التام أو الاسترجاع الفوري' : '100% freshness guaranteed or return instantly with full refund.'}
                </p>
              </div>
            </div>

            <div className="bg-[#ECFEFF] p-4.5 rounded-2xl border border-cyan-100 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900">{locale === 'ar' ? 'سلسلة تبريد مستمرة' : 'Continuous Cold Chain'}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {locale === 'ar' ? 'توصيل مبرد بشاحنات محكومة الحرارة' : 'Harvested & delivered under temperature controlled environment.'}
                </p>
              </div>
            </div>

            <div className="bg-[#FFFBEB] p-4.5 rounded-2xl border border-amber-100 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900">{locale === 'ar' ? 'فواكه سعودية فاخرة' : 'Saudi Famous Fruit'}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {locale === 'ar' ? 'محاصيل محلياً من أفضل مزارع المملكة' : 'Selection of premier vegetables and fruits harvested locally.'}
                </p>
              </div>
            </div>
          </div> */}

        </main>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#043927] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}
