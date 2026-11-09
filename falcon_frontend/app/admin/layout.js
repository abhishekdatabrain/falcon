'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { fetchApi } from '../../src/services/api';
import AdminNavbar from '../../src/components/AdminNavbar';
import AdminSidebar from '../../src/components/AdminSidebar';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ROUTE_PERMISSIONS = {
  '/admin/dashboard': 'dashboard.view',
  '/admin/roles': 'admin_management.view',
  '/admin/employees': 'admin_management.view',
  '/admin/customers': 'customers.view',
  '/admin/products': 'products.view',
  '/admin/categories': 'categories.view',
  '/admin/bulk-upload': 'products.view',
  '/admin/payments': 'payments.view',
  '/admin/orders': 'orders.view',
  '/admin/invoices': 'invoices.view',
  '/admin/homepage-cms': 'cms.view',
  '/admin/hero-banners': 'banners.view',
  '/admin/category-banner': 'banners.view',
  '/admin/category-hierarchy-banners': 'banners.view',
  '/admin/main-category-banners': 'banners.view',
  '/admin/subcategory-banners': 'banners.view',
  '/admin/sub-subcategory-banners': 'banners.view',
  '/admin/sub-sub-subcategory-banners': 'banners.view',
  '/admin/promo-banners': 'banners.view',
  '/admin/category-sections': 'cms.view',
  '/admin/drivers': 'drivers.view',
  '/admin/delivery-slots': 'delivery.view',
  '/admin/deliveries': 'delivery.view',
  '/admin/notifications': 'notifications.view',
  '/admin/feedback': 'feedback.view',
  '/admin/coupons': 'coupons.view',
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, loading, hasPermission, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const isPublicAdminRoute = pathname === '/admin/login' || pathname === '/admin/register';

  // Protect Admin pages: Redirect to /admin/login if not authenticated as ADMIN
  useEffect(() => {
    if (!loading && !isPublicAdminRoute) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/admin/login');
      }
    }
  }, [user, loading, pathname, isPublicAdminRoute]);

  useEffect(() => {
    const fetchQuickBadges = async () => {
      try {
        const res = await fetchApi('/payments/pending');
        if (res.success && res.data.payments) {
          setPendingPaymentsCount(res.data.payments.length);
        }
      } catch (err) {
        // Silent catch for background stats
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchQuickBadges();
    }
  }, [pathname, user]);

  // If on admin login or register page, render without sidebar or admin header
  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Check URL authorization for current path
  const matchedRouteKey = Object.keys(ROUTE_PERMISSIONS).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const requiredPermission = matchedRouteKey ? ROUTE_PERMISSIONS[matchedRouteKey] : null;
  const isAuthorized = !requiredPermission || isSuperAdmin || hasPermission(requiredPermission);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* 1. Full-Width Top Header Navbar Across Entire Screen */}
      <AdminNavbar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* 2. Main Container Below Navbar */}
      <div className="flex flex-1 relative">
        {/* Fixed Sidebar Under Navbar */}
        <AdminSidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          pendingPaymentsCount={pendingPaymentsCount}
        />

        {/* Scrollable Sub-Page Content Panel */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto min-w-0">
          {!isAuthorized ? (
            <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-red-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {locale === 'ar' ? 'غير مصرح لك بالدخول' : 'Access Restricted'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {locale === 'ar'
                  ? `عفواً، حسابك لا يملك صلاحية [${requiredPermission}] للوصول إلى هذه الصفحة. يرجى مراجعة المسؤول المباشر (Super Admin).`
                  : `Your assigned sub-admin role does not have the required permission [${requiredPermission}] to view this section. Please contact your Super Administrator.`}
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{locale === 'ar' ? 'العودة للوحة التحكم' : 'Return to Dashboard'}</span>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
