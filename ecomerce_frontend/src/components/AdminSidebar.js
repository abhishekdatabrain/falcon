'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
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
  Bell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function AdminSidebar({ mobileOpen, setMobileOpen, pendingPaymentsCount = 0 }) {
  const pathname = usePathname();
  const { locale } = useLanguage();

  const navCategories = [
    {
      key: 'overview',
      title: locale === 'ar' ? 'الرئيسية والإحصائيات' : 'Overview',
      items: [
        { href: '/admin/dashboard', label: locale === 'ar' ? 'لوحة التحكم' : 'Dashboard Overview', icon: LayoutDashboard },
      ],
    },
    {
      key: 'finance',
      title: locale === 'ar' ? 'إدارة العمليات والمالية' : 'Operations & Finance',
      isExpandable: true,
      items: [
        { href: '/admin/payments', label: locale === 'ar' ? 'إدارة مدفوعات التحويل' : 'Payment Management', icon: Landmark, badge: pendingPaymentsCount },
        { href: '/admin/orders', label: locale === 'ar' ? 'إدارة وتوجيه الطلبات' : 'Order Management', icon: Package },
        { href: '/admin/invoices', label: locale === 'ar' ? 'إدارة فواتير ZATCA' : 'ZATCA Invoice Management', icon: FileText },
      ],
    },
    {
      key: 'catalog',
      title: locale === 'ar' ? 'إدارة الكتالوج والمخزون' : 'Catalog & Inventory',
      isExpandable: true,
      items: [
        { href: '/admin/products', label: locale === 'ar' ? 'إدارة المنتجات' : 'Product Management', icon: ShoppingBag },
        { href: '/admin/categories', label: locale === 'ar' ? 'إدارة الأقسام والتصنيفات' : 'Category Management', icon: FolderTree },
      ],
    },
    {
      key: 'fleet',
      title: locale === 'ar' ? 'إدارة التوصيل والأسطول' : 'Fleet & Delivery',
      isExpandable: true,
      items: [
        { href: '/admin/drivers', label: locale === 'ar' ? 'إدارة السائقين والأسطول' : 'Driver Management', icon: Truck },
        { href: '/admin/deliveries/tracking', label: locale === 'ar' ? 'إدارة التوصيل والتتبع المباشر' : 'Delivery Management', icon: MapPin },
      ],
    },
    {
      key: 'users',
      title: locale === 'ar' ? 'المستخدمون والإشراف' : 'Users & Moderation',
      isExpandable: true,
      items: [
        { href: '/admin/customers', label: locale === 'ar' ? 'إدارة العملاء' : 'Customer Management', icon: Users },
        { href: '/admin/notifications', label: locale === 'ar' ? 'إدارة الإشعارات' : 'Notification Management', icon: Bell },
        { href: '/admin/feedback', label: locale === 'ar' ? 'إدارة الملاحظات' : 'Feedback Management', icon: MessageSquare },
      ],
    },
  ];

  // Single Accordion State: Only 1 category expanded at a time
  const [activeCategoryKey, setActiveCategoryKey] = useState('finance');

  // Auto-expand category containing current active route
  useEffect(() => {
    const matched = navCategories.find((cat) =>
      cat.items.some((item) => item.href === pathname)
    );
    if (matched && matched.isExpandable) {
      setActiveCategoryKey(matched.key);
    }
  }, [pathname]);

  const toggleCategory = (catKey) => {
    setActiveCategoryKey((prevKey) => (prevKey === catKey ? null : catKey));
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
          
          <nav className="space-y-4">
            {navCategories.map((cat) => {
              const isExpanded = !cat.isExpandable || activeCategoryKey === cat.key;
              const hasActiveChild = cat.items.some((item) => pathname === item.href);

              return (
                <div key={cat.key} className="space-y-1.5">
                  {/* Category Section Header / Single Accordion Toggle */}
                  <div
                    onClick={() => cat.isExpandable && toggleCategory(cat.key)}
                    className={`flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
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
