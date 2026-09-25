'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { LogIn, AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { locale } = useLanguage();
  const { login, logout } = useAuth();
  const router = useRouter();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(loginInput, password);
      if (res.success) {
        const user = res.data.user;
        if (user.role !== 'CUSTOMER') {
          await logout();
          setError(
            locale === 'ar'
              ? 'غير مسموح بحسابات المسؤول أو السائقين بالتسجيل من هنا. يرجى استخدام بوابة الإدارة.'
              : 'Admin & Driver accounts cannot log in from the Customer Storefront. Please use your dedicated Admin portal.'
          );
          return;
        }
        router.push('/');
      }
    } catch (err) {
      setError(err.message || (locale === 'ar' ? 'فشل تسجيل الدخول. يرجى التحقق من البيانات.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (email, pass) => {
    setLoginInput(email);
    setPassword(pass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[#fbfcfb] relative overflow-hidden">

      {/* Ambient Background Blur Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">

        {/* Main Login Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xl relative overflow-hidden space-y-6">

          {/* Top Brand Accent Line */}
          <div className="h-2 bg-gradient-to-r from-[#05442e] via-emerald-500 to-lime-400 absolute top-0 left-0 right-0" />

          {/* Header Icon & Title */}
          <div className="text-center space-y-3 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-[#05442e] text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-950/20 border border-emerald-700/50">
              <LogIn className="w-7 h-7 text-lime-300" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'تسجيل الدخول' : 'Welcome Back'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                {locale === 'ar' ? 'سجل الدخول لإدارة حسابك ومتابعة طلباتك' : 'Sign in to access your account, orders, or portal'}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Login Input */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {locale === 'ar' ? 'البريد الإلكتروني أو رقم الجوال' : 'Email or Mobile Number'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: customer@example.com أو +966500000001' : 'e.g. customer@example.com or +966500000001'}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05442e] focus:border-transparent transition-all shadow-xs"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
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
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05442e] focus:border-transparent transition-all shadow-xs"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Sign In to Account'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Registration Redirect Footer */}
          <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500 font-semibold">
            {locale === 'ar' ? 'ليس لديك حساب عميل حتى الآن؟' : "Don't have a customer account?"}{' '}
            <Link href="/register" className="text-[#05442e] hover:text-emerald-700 font-extrabold hover:underline">
              {locale === 'ar' ? 'إنشاء حساب جديد' : 'Register Now'}
            </Link>
          </div>

        </div>



      </div>
    </div>
  );
}
