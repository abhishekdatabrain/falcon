'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingBag,
  Globe,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
  Apple,
} from 'lucide-react';

export default function AdminNavbar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  // Get human-readable section name from path
  const currentSection = pathname.split('/')[2] || 'dashboard';

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-xs text-slate-900">
      <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">

        {/* Left Side: Brand Logo & Breadcrumb Navigation */}
        <div className="flex items-center gap-4">

          {/* Brand Logo Header */}
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center text-white">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                {locale === 'ar' ? 'أورا ماركت البقالة والطازج' : 'Super Mart'}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest -mt-0.5 flex items-center gap-1">
                <Apple className="w-2.5 h-2.5 text-emerald-500" /> Super Mart Control
              </span>
            </div>
          </Link>

          {/* Breadcrumb Separator Line & Current Path */}
          <div className="hidden sm:flex items-center gap-2.5 border-l border-slate-200 pl-4 ml-1 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 rtl:ml-0 rtl:mr-1">
            <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700">
              {locale === 'ar' ? 'إدارة سوبرماركت أورا' : 'Super Mart Admin'}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
            <span className="font-extrabold text-emerald-700 uppercase tracking-wider text-xs">
              {currentSection.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Right Side: Language Switcher, User Avatar & Direct Logout Button */}
        <div className="flex items-center gap-3">

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Admin User Info Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200 rtl:border-l-0 rtl:border-r rtl:pr-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate">
                {user.email}
              </span>
            </div>
          )}

          {/* Direct Navbar Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-600 hover:text-rose-700 transition-all shadow-xs"
            title={locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </header>
  );
}
