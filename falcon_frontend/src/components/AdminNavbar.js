'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../services/api';
import {
  ShoppingBag,
  Globe,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
  Apple,
  Bell,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function AdminNavbar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  // Fetch recent notifications for header
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetchApi('/admin/notifications');
        if (isMounted && res.success && res.data?.notifications) {
          const list = res.data.notifications;
          setNotifications(list.slice(0, 5));
          const unread = list.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        // Silent catch for background stats
      }
    };

    if (user && user.role === 'ADMIN') {
      fetchNotifications();
    }

    return () => {
      isMounted = false;
    };
  }, [user, pathname]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get human-readable section name from path
  const currentSection = pathname.split('/')[2] || 'dashboard';

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-xs text-slate-900">
      <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">

        {/* Left Side: Brand Logo & Breadcrumb Navigation */}
        <div className="flex items-center gap-4">

          {/* Brand Logo Header */}
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="saqrcart"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Breadcrumb Separator Line & Current Path */}
          <div className="hidden sm:flex items-center gap-2.5 border-l border-slate-200 pl-4 ml-1 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 rtl:ml-0 rtl:mr-1">
            <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700">
              {locale === 'ar' ? 'إدارة سوبرماركت أورا' : 'Super Mart Admin'}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
            <span className="font-bold text-emerald-700 uppercase tracking-wider text-xs">
              {currentSection.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Right Side: Notification Icon, Language Switcher, User Avatar & Direct Logout Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setShowNotifDropdown((prev) => !prev)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all shadow-xs cursor-pointer flex items-center justify-center"
              title={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
              aria-label={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Dropdown Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span className="font-black text-xs text-slate-900">
                      {locale === 'ar' ? 'الإشعارات والتنبيهات' : 'Notifications'}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      {unreadCount} {locale === 'ar' ? 'جديد' : 'new'}
                    </span>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center text-slate-400 text-xs">
                      <Bell className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                      <span>{locale === 'ar' ? 'لا توجد إشعارات جديدة حالياً' : 'No notifications yet'}</span>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const title = locale === 'ar' ? item.title_ar || item.title_en : item.title_en;
                      const body = locale === 'ar' ? item.body_ar || item.body_en : item.body_en;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 hover:bg-slate-50/80 transition-colors ${
 !item.is_read ? 'bg-emerald-50/40' : ''
 }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 line-clamp-1">
                              {title}
                            </span>
                            {!item.is_read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                            )}
                          </div>
                          {body && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {body}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer: Link to full notifications page */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    href="/admin/notifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-xs font-bold text-emerald-700 transition-all shadow-2xs"
                  >
                    <span>{locale === 'ar' ? 'عرض جميع الإشعارات' : 'View All Notifications'}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            )}
          </div>

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
