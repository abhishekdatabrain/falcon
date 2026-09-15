'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi } from '../../src/services/api';
import AdminNavbar from '../../src/components/AdminNavbar';
import AdminSidebar from '../../src/components/AdminSidebar';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

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
    fetchQuickBadges();
  }, [pathname]);

  // If on admin login page, render without sidebar or admin header
  if (pathname === '/admin/login') {
    return <>{children}</>;
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
