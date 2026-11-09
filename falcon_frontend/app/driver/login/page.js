'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import {
  Truck,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Globe,
  KeyRound,
  Store
} from 'lucide-react';

export default function DriverLoginPage() {
  const { locale, toggleLanguage } = useLanguage();
  const { user, loading: authLoading, login, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && user && user.role === 'DRIVER') {
      router.replace('/driver/dashboard');
    }
  }, [user, authLoading, router]);

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading || (user && user.role === 'DRIVER')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(loginInput, password);
      if (res.success) {
        if (res.data.user.role !== 'DRIVER') {
          await logout();
          setError(
            locale === 'ar'
              ? 'تم رفض الوصول. هذه البوابة مخصصة لحسابات السائقين المعتمدين فقط.'
              : 'Access denied. This portal is strictly for authorized Driver accounts.'
          );
          return;
        }
        router.push('/driver/dashboard');
      }
    } catch (err) {
      setError(
        err.message ||
          (locale === 'ar'
            ? 'فشل تسجيل الدخول. يرجى التحقق من صحة بيانات السائق.'
            : 'Driver login failed. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (email, pass) => {
    setLoginInput(email);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between relative overflow-hidden">
      {/* Ambient Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-12 left-10 w-80 h-80 rounded-full bg-[#05442e]/5 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center group">
            <img
              src="/logo.png"
              alt="saqrcart"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#05A764]" />
            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Storefront Link */}
          {/* <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#05442e] bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-2xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'المتجر الرئيسي' : 'Storefront'}</span>
          </Link> */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto relative z-10">
        <div className="max-w-md w-full space-y-6">

          {/* Main Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-2xl relative overflow-hidden space-y-6">

            {/* Top Brand Accent Gradient Bar */}
            <div className="h-2 bg-gradient-to-r from-[#05442e] via-[#05A764] to-[#DA9628] absolute top-0 left-0 right-0" />

            {/* Header Icon, Title & Badge */}
            <div className="text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-[#05442e] text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20 border border-emerald-700/50 relative">
                <Truck className="w-8 h-8 text-[#05A764]" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-500/20" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {locale === 'ar' ? 'بوابة السائقين' : 'Driver Web Portal'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {locale === 'ar' ? 'نظام إدارة وتوصيل الطلبات الميدانية' : 'Fleet Dispatch & Real-Time Delivery Management'}
                </p>
              </div>

              {/* Security Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {locale === 'ar' ? 'بيانات معتمدة من الإدارة فقط' : 'Admin Created Credentials Only'}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Driver Email or Mobile */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {locale === 'ar' ? 'البريد الإلكتروني أو رقم الجوال' : 'Driver Email or Mobile'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="driver1@platform.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05442e] focus:border-transparent transition-all shadow-2xs"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {locale === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05442e] focus:border-transparent transition-all shadow-2xs"
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#05442e] hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md hover:shadow-xl hover:shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {locale === 'ar' ? 'تسجيل الدخول إلى بوابة السائق' : 'Login to Driver Web Portal'}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <KeyRound className="w-3.5 h-3.5 text-[#05A764]" />
                  <span>{locale === 'ar' ? 'حساب تجريبي للتجربة' : 'Demo Driver Account'}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  driver1@platform.com • Driver@123456
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleFillDemo('driver1@platform.com', 'Driver@123456')}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#05442e] hover:bg-[#05442e] hover:text-white transition-all shadow-2xs cursor-pointer shrink-0"
              >
                {locale === 'ar' ? 'تعبئة تلقائية' : 'Auto Fill'}
              </button>
            </div>
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#05A764]" />
            <span>
              {locale === 'ar'
                ? 'نظام تتبع وإسناد مشفر وآمن بالكامل'
                : 'Encrypted Real-Time GPS Tracking & Logistics Portal'}
            </span>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Falcon Logistics. All rights reserved.
      </footer>
    </div>
  );
}
