'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { fetchApi } from '../../src/services/api';
import AdminNavbar from '../../src/components/AdminNavbar';
import AdminSidebar from '../../src/components/AdminSidebar';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
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
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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
          {children}
        </main>
      </div>
    </div>
  );
}
