'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Landmark,
  Package,
  Truck,
  ShoppingBag,
  FolderTree,
  Users,
  MapPin,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Bell,
  Clock,
  ShieldCheck,
  Layers,
  UploadCloud,
  FileSpreadsheet,
  History,
} from 'lucide-react';

export default function AdminSidebar({ mobileOpen, setMobileOpen, pendingPaymentsCount = 0 }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { hasPermission, isSuperAdmin, user } = useAuth();

  const navCategories = [
    {
      key: 'overview',
      title: locale === 'ar' ? 'الرئيسية والإحصائيات' : 'Overview',
      items: [
        {
          href: '/admin/dashboard',
          label: locale === 'ar' ? 'لوحة التحكم' : 'Dashboard Overview',
          icon: LayoutDashboard,
          permission: 'dashboard.view',
        },
      ],
    },
     {
      key: 'homepage_cms',
      title: locale === 'ar' ? 'إدارة الصفحة الرئيسية' : 'Homepage Management',
      isExpandable: true,
      items: [
        {
          href: '/admin/homepage-cms',
          label: locale === 'ar' ? 'إدارة الصفحة الرئيسية' : 'Homepage Management',
          icon: LayoutDashboard,
          permission: 'cms.view',
        },
        {
          href: '/admin/hero-banners',
          label: locale === 'ar' ? 'شريط البانر الرئيسي' : 'Hero Banners',
          icon: Sparkles,
          permission: 'banners.view',
        },
        {
          href: '/admin/promo-banners',
          label: locale === 'ar' ? 'البطاقات الترويجية' : 'Promotional Cards',
          icon: LayoutDashboard,
          permission: 'banners.view',
        },
        {
          href: '/admin/featured-banner',
          label: locale === 'ar' ? 'بانر المستلزمات المميز' : 'Featured Household Banner',
          icon: Sparkles,
          permission: 'cms.view',
        },
        {
          href: '/admin/category-sections',
          label: locale === 'ar' ? 'معرض الفئات' : 'Category Showcase',
          icon: FolderTree,
          permission: 'cms.view',
        },
      ],
    },
    {
      key: 'category_banners',
      title: locale === 'ar' ? 'بانرات الأقسام' : 'Category Banners',
      isExpandable: true,
      items: [
        {
          href: '/admin/main-category-banners',
          label: locale === 'ar' ? 'بانرات الأقسام الرئيسية (L1)' : 'Main Category Banners (L1)',
          icon: Layers,
          permission: 'banners.view',
        },
        {
          href: '/admin/subcategory-banners',
          label: locale === 'ar' ? 'بانرات الأقسام الفرعية (L2)' : 'Subcategory Banners (L2)',
          icon: FolderTree,
          permission: 'banners.view',
        },
        {
          href: '/admin/sub-subcategory-banners',
          label: locale === 'ar' ? 'بانرات الأقسام الفرعية 2 (L3)' : 'Sub-Subcategory Banners (L3)',
          icon: Layers,
          permission: 'banners.view',
        },
        {
          href: '/admin/sub-sub-subcategory-banners',
          label: locale === 'ar' ? 'بانرات الأقسام الفرعية 3 (L4)' : 'Sub-Sub-Subcategory (L4)',
          icon: Sparkles,
          permission: 'banners.view',
        },
        {
          href: '/admin/category-banner',
          label: locale === 'ar' ? 'بانر صفحة المنتجات (Hero)' : 'Category Hero Banner',
          icon: Sparkles,
          permission: 'banners.view',
        },
      ],
    },
    {
      key: 'identity_access',
      title: locale === 'ar' ? 'الهوية وإدارة الصلاحيات' : 'Identity & Access',
      isExpandable: true,
      items: [
        {
          href: '/admin/roles',
          label: locale === 'ar' ? 'إدارة الصلاحيات والأدوار' : 'Role & Permission RBAC',
          icon: ShieldCheck,
          permission: 'admin_management.view',
        },
        {
          href: '/admin/employees',
          label: locale === 'ar' ? 'إدارة الموظفين' : 'Employees Management',
          icon: Users,
          permission: 'admin_management.view',
        },
      ],
    },
    {
      key: 'customers',
      title: locale === 'ar' ? 'إدارة العملاء' : 'Customers',
      isExpandable: true,
      items: [
        {
          href: '/admin/customers',
          label: locale === 'ar' ? 'إدارة العملاء' : 'Customer Management',
          icon: Users,
          permission: 'customers.view',
        },
      ],
    },
    {
      key: 'catalog',
      title: locale === 'ar' ? 'إدارة الكتالوج والمخزون' : 'Inventory',
      isExpandable: true,
      items: [
        {
          href: '/admin/products',
          label: locale === 'ar' ? 'إدارة المنتجات' : 'Product Management',
          icon: ShoppingBag,
          permission: 'products.view',
        },
        {
          href: '/admin/categories',
          label: locale === 'ar' ? 'إدارة الأقسام والتصنيفات' : 'Category Management',
          icon: FolderTree,
          permission: 'categories.view',
        },
      ],
    },
    {
      key: 'bulk_upload',
      title: locale === 'ar' ? 'الرفع المجمع للبيانات' : 'Bulk Upload',
      isExpandable: true,
      items: [
        {
          href: '/admin/bulk-upload/categories',
          label: locale === 'ar' ? 'الرفع المجمع للأقسام' : 'Category Bulk Upload',
          icon: FolderTree,
          permission: 'categories.view',
        },
        {
          href: '/admin/bulk-upload/products',
          label: locale === 'ar' ? 'الرفع المجمع للمنتجات' : 'Product Bulk Upload',
          icon: ShoppingBag,
          permission: 'products.view',
        },
        {
          href: '/admin/bulk-upload/history',
          label: locale === 'ar' ? 'سجل عمليات الرفع' : 'Upload History',
          icon: History,
          permission: 'products.view',
        },
      ],
    },
    {
      key: 'orders',
      title: locale === 'ar' ? 'إدارة الطلبات' : 'Order Management',
      isExpandable: true,
      items: [
        {
          href: '/admin/orders',
          label: locale === 'ar' ? 'إدارة وتوجيه الطلبات' : 'Order Management',
          icon: Package,
          permission: 'orders.view',
        },
      ],
    },
    {
      key: 'finance',
      title: locale === 'ar' ? 'إدارة العمليات والمالية' : 'Operations & Finance',
      isExpandable: true,
      items: [
        {
          href: '/admin/payments',
          label: locale === 'ar' ? 'إدارة مدفوعات التحويل' : 'Payment Management',
          icon: Landmark,
          badge: pendingPaymentsCount,
          permission: 'payments.view',
        },
        {
          href: '/admin/invoices',
          label: locale === 'ar' ? 'إدارة فواتير ZATCA' : 'ZATCA Invoice Management',
          icon: FileText,
          permission: 'invoices.view',
        },
      ],
    },
   
    {
      key: 'fleet',
      title: locale === 'ar' ? 'إدارة التوصيل والأسطول' : 'Fleet & Delivery',
      isExpandable: true,
      items: [
        {
          href: '/admin/drivers',
          label: locale === 'ar' ? 'إدارة السائقين والأسطول' : 'Driver Management',
          icon: Truck,
          permission: 'drivers.view',
        },
        {
          href: '/admin/delivery-slots',
          label: locale === 'ar' ? 'مواعيد وفترات التوصيل' : 'Delivery Slots & Schedule',
          icon: Clock,
          permission: 'delivery.view',
        },
        {
          href: '/admin/deliveries/tracking',
          label: locale === 'ar' ? 'إدارة التوصيل والتتبع المباشر' : 'Delivery Management',
          icon: MapPin,
          permission: 'delivery.view',
        },
      ],
    },
    {
      key: 'communication',
      title: locale === 'ar' ? 'التواصل والملاحظات' : 'Communications & Feedback',
      isExpandable: true,
      items: [
        {
          href: '/admin/notifications',
          label: locale === 'ar' ? 'إدارة الإشعارات' : 'Notification Management',
          icon: Bell,
          permission: 'notifications.view',
        },
        {
          href: '/admin/feedback',
          label: locale === 'ar' ? 'إدارة الملاحظات' : 'Feedback Management',
          icon: MessageSquare,
          permission: 'feedback.view',
        },
      ],
    },
  ];

  // Filter categories and menu items dynamically based on assigned RBAC permissions
  const visibleCategories = navCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((cat) => cat.items.length > 0);

  // Single Accordion State: Only one dropdown category open at a time
  const [expandedKey, setExpandedKey] = useState(() => {
    const matched = visibleCategories.find((cat) =>
      cat.isExpandable && cat.items.some((item) => item.href === pathname)
    );
    return matched ? matched.key : 'homepage_cms';
  });

  // Auto-expand the category containing the current active route
  useEffect(() => {
    const matched = visibleCategories.find((cat) =>
      cat.isExpandable && cat.items.some((item) => item.href === pathname)
    );
    if (matched) {
      setExpandedKey(matched.key);
    }
  }, [pathname]);

  const toggleCategory = (catKey) => {
    // If clicked category is open, close it; otherwise open it and close all others
    setExpandedKey((prev) => (prev === catKey ? null : catKey));
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: Fixed directly under Navbar (top-16) with Fresh Grocery Styling */}
      <aside
        className={`fixed md:sticky top-16 inset-y-0 ${locale === 'ar' ? 'right-0' : 'left-0'} z-30 h-[calc(100vh-4rem)] w-72 bg-white/95 backdrop-blur-2xl border-${locale === 'ar' ? 'l' : 'r'} border-slate-200 text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-lg ${
 mobileOpen ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'
 }`}
      >
        {/* Navigation Items */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Admin User Role Tag */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-700 truncate max-w-[140px]">
                {user?.profile?.name || user?.name || user?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
 isSuperAdmin
 ? 'bg-purple-100 text-purple-700 border border-purple-200'
 : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
 }`}
            >
              {isSuperAdmin
                ? 'Super Admin'
                : user?.roles?.[0]?.name || 'Sub-Admin'}
            </span>
          </div>

          <nav className="space-y-4">
            {visibleCategories.map((cat) => {
              const isExpanded = !cat.isExpandable || expandedKey === cat.key;
              const hasActiveChild = cat.items.some((item) => pathname === item.href);

              return (
                <div key={cat.key} className="space-y-1.5">
                  {/* Category Section Header / Single Accordion Toggle */}
                  <div
                    onClick={() => cat.isExpandable && toggleCategory(cat.key)}
                    className={`flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
 cat.isExpandable ? 'cursor-pointer hover:text-slate-900 text-slate-400' : 'text-slate-400'
 }`}
                  >
                    <span className={hasActiveChild ? 'text-emerald-700 font-black' : ''}>{cat.title}</span>
                    {cat.isExpandable && (
                      <span className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                      </span>
                    )}
                  </div>

                  {/* Sub-children Menu Links with Grocery Emerald Theme */}
                  {isExpanded && (
                    <div className="space-y-1 pl-2 border-l border-emerald-200/80 rtl:pl-0 rtl:pr-2 rtl:border-l-0 rtl:border-r">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group ${
 isActive
 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs'
 : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 border border-transparent'
 }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                              <span>{item.label}</span>
                            </div>

                            {item.badge > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs animate-pulse">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
