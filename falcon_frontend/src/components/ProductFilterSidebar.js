'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Check,
  Zap,
  X,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Reusable Falcon Product Filter Sidebar
 * Supports:
 * - Hierarchical Category Tree (with auto-expansion of ancestors and active highlighting)
 * - Delivery Speed
 * - Price Range (SAR) slider and inputs
 * - Brand filters
 * - Reset All (clears optional filters without losing category context)
 * - Mobile Drawer mode with slide-over backdrop and close button
 */
export default function ProductFilterSidebar({
  categories = [],
  selectedCategory = '',
  selectedSubcategory = '',
  selectedSubSubcategory = '',
  selectedSubSubSubcategory = '',
  activeCategoryId: propActiveCategoryId = '',
  selectedCategoryId = '',
  selectedCategoryIds = [],
  onToggleCategory,
  onSelectCategory,
  minPrice = 0,
  maxPrice = 500,
  currentMinPrice = 0,
  currentMaxPrice = 500,
  onChangePrice,
  selectedBrands = [],
  availableBrands = [],
  onToggleBrand,
  onClearBrands,
  deliverySpeed = 'express',
  onChangeDeliverySpeed,
  onResetFilters,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const { locale } = useLanguage();
  const [expandedCats, setExpandedCats] = useState(new Set());

  // Single active selected category (mutually exclusive, no multiple checkboxes)
  const singleSelectedId =
    selectedCategoryId ||
    (Array.isArray(selectedCategoryIds) && selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : '') ||
    propActiveCategoryId ||
    selectedSubSubSubcategory ||
    selectedSubSubcategory ||
    selectedSubcategory ||
    selectedCategory ||
    '';

  // Build 4-level category hierarchy tree for sidebar
  const displayCategoryTree = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    const getNodeChildren = (node) => {
      if (!node) return [];
      if (Array.isArray(node.subcategories) && node.subcategories.length > 0) {
        return node.subcategories;
      }
      if (Array.isArray(node.children) && node.children.length > 0) {
        return node.children;
      }
      // If categories is flat list
      const direct = categories.filter((c) => String(c.parent_id) === String(node.id));
      if (direct.length > 0) return direct;
      return [];
    };

    const mainCats = categories.filter((c) => !c.parent_id);

    return mainCats.map((main) => {
      const mainPath = `/category/${main.slug || main.id}`;
      const level2 = getNodeChildren(main);
      return {
        ...main,
        path: mainPath,
        level: 1,
        children: level2.map((sub) => {
          const subPath = `${mainPath}/${sub.slug || sub.id}`;
          const level3 = getNodeChildren(sub);
          return {
            ...sub,
            path: subPath,
            level: 2,
            children: level3.map((subSub) => {
              const subSubPath = `${subPath}/${subSub.slug || subSub.id}`;
              const level4 = getNodeChildren(subSub);
              return {
                ...subSub,
                path: subSubPath,
                level: 3,
                children: level4.map((l4) => ({
                  ...l4,
                  path: `${subSubPath}/${l4.slug || l4.id}`,
                  level: 4,
                  children: [],
                })),
              };
            }),
          };
        }),
      };
    });
  }, [categories]);

  // Auto-expand all ancestors of the currently selected category
  useEffect(() => {
    if (!displayCategoryTree || displayCategoryTree.length === 0) return;

    const targetId = singleSelectedId ? String(singleSelectedId).toLowerCase() : '';
    if (!targetId) return;

    const toExpand = new Set();

    const findAndCollectAncestors = (nodes, currentAncestors = []) => {
      for (const node of nodes) {
        const nodeIdStr = String(node.id).toLowerCase();
        const nodeSlugStr = node.slug ? String(node.slug).toLowerCase() : '';

        const isMatch = nodeIdStr === targetId || (nodeSlugStr && nodeSlugStr === targetId);

        if (isMatch) {
          currentAncestors.forEach((ancId) => toExpand.add(ancId));
        }

        if (node.children && node.children.length > 0) {
          findAndCollectAncestors(node.children, [...currentAncestors, node.id]);
        }
      }
    };

    findAndCollectAncestors(displayCategoryTree);

    if (toExpand.size > 0) {
      setExpandedCats((prev) => {
        const next = new Set(prev);
        toExpand.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [singleSelectedId, displayCategoryTree]);

  const toggleCatExpand = (catId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleCheckboxClick = (node, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onToggleCategory) {
      onToggleCategory(node.id, node);
    } else if (onSelectCategory) {
      onSelectCategory(node, node.level || 1, node.path);
    }
  };

  const renderCategoryNode = (node, level = 1) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expandedCats.has(node.id);

    // Exact single match for checkbox checkmark
    const isDirectMatch = Boolean(
      singleSelectedId && (
        String(singleSelectedId).toLowerCase() === String(node.id).toLowerCase() ||
        (node.slug && String(singleSelectedId).toLowerCase() === String(node.slug).toLowerCase())
      )
    );

    // Helper to check if any descendant of this node is selected
    const isDescendantSelected = (parent) => {
      if (!singleSelectedId || !parent.children || parent.children.length === 0) return false;
      const targetStr = String(singleSelectedId).toLowerCase();
      const checkNodes = (nodes) => {
        for (const n of nodes) {
          if (String(n.id).toLowerCase() === targetStr || (n.slug && String(n.slug).toLowerCase() === targetStr)) {
            return true;
          }
          if (n.children && n.children.length > 0 && checkNodes(n.children)) {
            return true;
          }
        }
        return false;
      };
      return checkNodes(parent.children);
    };

    const isNodeSelected = isDirectMatch;
    const isAncestorActive = isExpanded || isNodeSelected || isDescendantSelected(node);
    const name = (locale === 'ar' ? node.name_ar : node.name_en) || node.name_en || node.name || '';

    // If node has children -> render expandable parent pill + indented connector line
    if (hasChildren) {
      const isParentAllChecked = isDirectMatch;

      return (
        <div key={node.id} className="space-y-1 font-sans">
          {/* Parent Pill matching Screenshot 1 */}
          <div
            onClick={(e) => toggleCatExpand(node.id, e)}
            className={`w-full py-2 px-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${isExpanded || isAncestorActive
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Expand / Collapse Icon (- / +) */}
              <span className="w-4 h-4 flex items-center justify-center text-[#043927] font-black text-sm shrink-0 select-none">
                {isExpanded ? '−' : '+'}
              </span>
              <span className="font-bold text-xs sm:text-[13px] text-slate-800 truncate">
                {name}
              </span>
            </div>

            {/* Right Chevron Down / Right */}
            <div className="shrink-0 ml-1 text-slate-600">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-700 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-slate-400 stroke-[2]" />
              )}
            </div>
          </div>

          {/* Indented Connector Line matching Screenshot 1 & 2 */}
          {isExpanded && (
            <div className="relative pl-3.5 rtl:pr-3.5 ml-4 rtl:mr-4 border-l-2 border-[#86EFAC] rtl:border-r-2 rtl:border-l-0 space-y-2 pt-1.5 pb-1">
              {/* "All [Category Name]" Option matching Screenshot 2 */}
              <div
                onClick={(e) => handleCheckboxClick(node, e)}
                className={`flex items-center gap-2.5 py-1 px-1.5 rounded-lg transition-colors cursor-pointer select-none ${isParentAllChecked ? 'text-[#043927] font-bold bg-emerald-50/70' : 'text-slate-700 hover:text-[#043927]'
                  }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isParentAllChecked
                      ? 'bg-[#043927] border-[#043927] text-white shadow-2xs'
                      : 'border-slate-300 bg-white hover:border-[#043927]'
                    }`}
                >
                  {isParentAllChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <span className={`text-xs sm:text-[13px] truncate ${isParentAllChecked ? 'font-bold text-[#043927]' : 'font-medium text-slate-700'}`}>
                  {locale === 'ar' ? `كل ${name}` : `All ${name}`}
                </span>
              </div>

              {/* Children Nodes */}
              {node.children.map((child) => renderCategoryNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf category node (no children) matching Screenshot 1 (e.g. Pea, Hayat Mix Veget...)
    return (
      <div
        key={node.id}
        onClick={(e) => handleCheckboxClick(node, e)}
        className={`flex items-center gap-2.5 py-1 px-1.5 rounded-lg transition-colors cursor-pointer select-none ${isNodeSelected ? 'text-[#043927] font-bold bg-emerald-50/70' : 'text-slate-700 hover:text-[#043927]'
          }`}
      >
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isNodeSelected
              ? 'bg-[#043927] border-[#043927] text-white shadow-2xs'
              : 'border-slate-300 bg-white hover:border-[#043927]'
            }`}
        >
          {isNodeSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
        </div>
        <span
          title={name}
          className={`text-xs sm:text-[13px] truncate max-w-[170px] ${isNodeSelected ? 'font-bold text-[#043927]' : 'font-medium text-slate-700'
            }`}
        >
          {name}
        </span>
      </div>
    );
  };

  // Sidebar Body Content
  const sidebarContent = (
    <div className="space-y-5 font-sans">

      {/* 1. Header with Reset Filters */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2 font-heading">
          <SlidersHorizontal className="w-4 h-4 text-[#043927]" />
          <span>{locale === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}</span>
        </h3>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{locale === 'ar' ? 'إعادة ضبط' : 'Reset All'}</span>
          </button>
        )}
      </div>

      {/* 2. Hierarchical Category Tree */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
          {locale === 'ar' ? 'تصنيفات المنتجات' : 'Category Hierarchy'}
        </h4>
        {displayCategoryTree && displayCategoryTree.length > 0 ? (
          <div className="space-y-1 text-xs">
            {displayCategoryTree.map((catNode) => renderCategoryNode(catNode, 1))}
          </div>
        ) : (
          <div className="space-y-2 animate-pulse py-1">
            <div className="h-8 bg-slate-100 rounded-2xl w-full"></div>
            <div className="h-8 bg-slate-100 rounded-2xl w-full"></div>
            <div className="h-8 bg-slate-100 rounded-2xl w-full"></div>
          </div>
        )}
      </div>

      {/* 3. Delivery Speed */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
          {locale === 'ar' ? 'سرعة التوصيل' : 'Delivery Speed'}
        </h4>
        <div className="space-y-1.5 text-xs font-medium text-slate-700">
          <label
            onClick={() => onChangeDeliverySpeed && onChangeDeliverySpeed('express')}
            className={`flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-lg transition-colors ${deliverySpeed === 'express' ? 'text-[#043927] font-bold bg-emerald-50/70' : 'text-slate-700 hover:text-slate-900'
              }`}
          >
            <input
              type="radio"
              name="deliverySpeed"
              checked={deliverySpeed === 'express'}
              onChange={() => onChangeDeliverySpeed && onChangeDeliverySpeed('express')}
              className="w-3.5 h-3.5 accent-[#043927]"
            />
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{locale === 'ar' ? 'توصيل سريع (خلال ساعتين)' : 'Express 2-Hours'}</span>
            </span>
          </label>
          <label
            onClick={() => onChangeDeliverySpeed && onChangeDeliverySpeed('scheduled')}
            className={`flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded-lg transition-colors ${deliverySpeed === 'scheduled' ? 'text-[#043927] font-bold bg-emerald-50/70' : 'text-slate-700 hover:text-slate-900'
              }`}
          >
            <input
              type="radio"
              name="deliverySpeed"
              checked={deliverySpeed === 'scheduled'}
              onChange={() => onChangeDeliverySpeed && onChangeDeliverySpeed('scheduled')}
              className="w-3.5 h-3.5 accent-[#043927]"
            />
            <span>{locale === 'ar' ? 'توصيل مجدول حسب الموعد' : 'Scheduled Delivery Slot'}</span>
          </label>
        </div>
      </div>

      {/* 4. Price Range (SAR) */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <span>{locale === 'ar' ? 'نطاق السعر (ريال)' : 'Price Range (SAR)'}</span>
          <span className="text-[#043927] font-black">
            SAR {currentMinPrice} - SAR {currentMaxPrice}
          </span>
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={currentMaxPrice}
          onChange={(e) => onChangePrice && onChangePrice(currentMinPrice, Number(e.target.value))}
          className="w-full accent-[#043927] cursor-pointer"
        />
        <div className="flex items-center gap-2">
          <div className="w-1/2 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700">
            <span className="text-slate-400 mr-1 font-normal text-[10px]">SAR</span>
            <input
              type="number"
              min={minPrice}
              max={currentMaxPrice}
              value={currentMinPrice}
              onChange={(e) => onChangePrice && onChangePrice(Number(e.target.value), currentMaxPrice)}
              className="w-full bg-transparent text-center font-bold focus:outline-none"
            />
          </div>
          <span className="text-slate-400 text-xs">-</span>
          <div className="w-1/2 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700">
            <span className="text-slate-400 mr-1 font-normal text-[10px]">SAR</span>
            <input
              type="number"
              min={currentMinPrice}
              max={maxPrice}
              value={currentMaxPrice}
              onChange={(e) => onChangePrice && onChangePrice(currentMinPrice, Number(e.target.value))}
              className="w-full bg-transparent text-center font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Trusted Brands */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
            {locale === 'ar' ? 'العلامات التجارية' : 'Trusted Brands'}
          </h4>
          {selectedBrands.length > 0 && onClearBrands && (
            <button
              type="button"
              onClick={onClearBrands}
              className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              {locale === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
        <div className="space-y-1.5 text-xs font-medium text-slate-700 max-h-48 overflow-y-auto pr-1">
          {(() => {
            const brandsToDisplay = (availableBrands && availableBrands.length > 0)
              ? availableBrands
              : [
                { name: 'Falcon Reserve', count: 18 },
                { name: 'Hayat', count: 14 },
                { name: 'Al Walimah', count: 12 },
                { name: 'Abu Kass', count: 10 },
                { name: 'California Garden', count: 8 },
              ];

            return brandsToDisplay.map((brand, idx) => {
              const brandName = typeof brand === 'string' ? brand : brand.name;
              const brandCount = typeof brand === 'object' ? brand.count : null;
              const isChecked = selectedBrands.includes(brandName);

              return (
                <label
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onToggleBrand) onToggleBrand(brandName);
                  }}
                  className={`flex items-center justify-between transition-colors cursor-pointer select-none py-1 px-1.5 rounded-lg ${isChecked ? 'text-[#043927] font-bold bg-emerald-50/80' : 'text-slate-700 hover:text-[#043927]'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
                          ? 'bg-[#043927] border-[#043927] text-white shadow-2xs'
                          : 'border-slate-300 bg-white'
                        }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs truncate max-w-[150px]">{brandName}</span>
                  </div>
                  {brandCount !== null && (
                    <span className="text-slate-400 text-[10px]">({brandCount})</span>
                  )}
                </label>
              );
            });
          })()}
        </div>
      </div>

    </div>
  );

  // Desktop Rendering
  return (
    <>
      {/* Desktop Sticky Aside */}
      <aside className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs sticky top-24 self-start font-sans">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over Modal) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex font-sans">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#043927] text-white">
              <div className="flex items-center gap-2 font-black font-heading text-base">
                <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
                <span>{locale === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-7 h-7 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {sidebarContent}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 rounded-xl bg-[#043927] hover:bg-[#006E2D] text-white font-bold text-xs shadow-md transition-all text-center cursor-pointer"
              >
                {locale === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
