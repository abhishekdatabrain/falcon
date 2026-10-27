'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import {
  LogIn,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export default function LoginPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading, login, logout } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        const redirectParam = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('redirect')
          : null;
        router.replace(redirectParam || '/');
      }
    }
  }, [user, authLoading, router]);

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ loginInput: '', password: '' });
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#043927] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Clear specific field error as user types
  const handleInputChange = (field, value) => {
    if (field === 'loginInput') {
      setLoginInput(value);
      if (fieldErrors.loginInput) {
        setFieldErrors((prev) => ({ ...prev, loginInput: '' }));
      }
    } else if (field === 'password') {
      setPassword(value);
      if (fieldErrors.password) {
        setFieldErrors((prev) => ({ ...prev, password: '' }));
      }
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    // Client-side validation
    const errors = { loginInput: '', password: '' };
    if (!loginInput.trim()) {
      errors.loginInput =
        locale === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني أو رقم الجوال'
          : 'Please enter your email or mobile number';
    }
    if (!password) {
      errors.password =
        locale === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password';
    }

    if (errors.loginInput || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({ loginInput: '', password: '' });
    setLoading(true);

    try {
      const res = await login(loginInput.trim(), password);
      if (res.success) {
        const user = res.data.user;
        if (user.role !== 'CUSTOMER') {
          await logout();
          setGeneralError(
            locale === 'ar'
              ? 'غير مسموح بحسابات المسؤول أو السائقين بالتسجيل من هنا. يرجى استخدام بوابة الإدارة.'
              : 'Admin & Driver accounts cannot log in from the Customer Storefront. Please use your dedicated Admin portal.'
          );
          return;
        }
        const redirectParam =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('redirect')
            : null;
        router.push(redirectParam || '/');
      }
    } catch (err) {
      const serverFieldErrors = err.fieldErrors || err.data?.fieldErrors || {};
      const errMsg = err.message || '';

      const updatedErrors = { loginInput: '', password: '' };

      if (serverFieldErrors.loginInput) {
        updatedErrors.loginInput =
          locale === 'ar'
            ? 'لا يوجد حساب مسجل بهذا البريد الإلكتروني أو رقم الجوال'
            : serverFieldErrors.loginInput;
      }

      if (serverFieldErrors.password) {
        updatedErrors.password =
          locale === 'ar'
            ? 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.'
            : serverFieldErrors.password;
      }

      // Fallback matching if server didn't provide fieldErrors map directly
      if (!updatedErrors.loginInput && !updatedErrors.password) {
        if (/no account|user not found|account not found|email.*not found/i.test(errMsg)) {
          updatedErrors.loginInput =
            locale === 'ar'
              ? 'لا يوجد حساب مسجل بهذا البريد الإلكتروني أو رقم الجوال'
              : 'No account found with this email or mobile number';
        } else if (/incorrect password|password.*incorrect|wrong password/i.test(errMsg)) {
          updatedErrors.password =
            locale === 'ar'
              ? 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.'
              : 'Incorrect password. Please try again.';
        } else if (/invalid credential/i.test(errMsg)) {
          updatedErrors.password =
            locale === 'ar'
              ? 'بيانات الاعتماد غير متطابقة. يرجى التحقق من كلمة المرور.'
              : 'Invalid credentials. Please verify your password.';
        } else {
          setGeneralError(
            errMsg ||
              (locale === 'ar'
                ? 'فشل تسجيل الدخول. يرجى التحقق من البيانات.'
                : 'Login failed. Please check your credentials.')
          );
        }
      }

      setFieldErrors(updatedErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f7faf8] via-[#fbfcfb] to-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-[440px] w-full relative z-10 space-y-4">
        {/* Back Link */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#05442e] transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
            <span>{locale === 'ar' ? 'العودة للمتجر' : 'Back to Store'}</span>
          </Link>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === 'ar' ? 'تسوق آمن ومحمي' : 'Secure Sign In'}</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-[0_20px_50px_rgba(5,68,46,0.08)] relative overflow-hidden">
          {/* Top Brand Gradient Ribbon */}
          <div className="h-1.5 bg-gradient-to-r from-[#05442e] via-emerald-500 to-lime-400 absolute top-0 left-0 right-0" />

          {/* Header */}
          <div className="text-center space-y-3 pt-1">
            <Link href="/" className="inline-block group">
              <div className="bg-white px-3 py-1.5 rounded-2xl border border-slate-200/80 shadow-xs group-hover:border-emerald-300 group-hover:shadow-sm transition-all mx-auto">
                <img
                  src="/logo.png"
                  alt="Falcon"
                  className="h-8 sm:h-9 w-auto object-contain mx-auto"
                />
              </div>
            </Link>

            <div>
              <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'أهلاً بك مجدداً' : 'Welcome Back'}
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1">
                {locale === 'ar'
                  ? 'سجل الدخول لإدارة حسابك ومتابعة طلباتك'
                  : 'Sign in to access your account, orders, or portal'}
              </p>
            </div>
          </div>

          {/* General Error Banner (only for non-field system/role errors) */}
          {generalError && (
            <div className="mt-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {/* Email or Mobile Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {locale === 'ar' ? 'البريد الإلكتروني أو رقم الجوال' : 'Email or Mobile Number'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => handleInputChange('loginInput', e.target.value)}
                  placeholder={
                    locale === 'ar'
                      ? 'مثال: customer@example.com أو 0500000001'
                      : 'e.g. name@example.com or 0500000001'
                  }
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-[13px] font-semibold transition-all outline-none ${
 fieldErrors.loginInput
 ? 'bg-rose-50/40 border-2 border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
 : 'bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#05442e] focus:ring-4 focus:ring-[#05442e]/10'
 }`}
                />
                <Mail
                  className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${
 fieldErrors.loginInput ? 'text-rose-500' : 'text-slate-400'
 }`}
                />
              </div>

              {/* Field-specific Error Message for Email/Mobile */}
              {fieldErrors.loginInput && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mt-1.5 px-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{fieldErrors.loginInput}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {locale === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-[13px] font-semibold transition-all outline-none ${
 fieldErrors.password
 ? 'bg-rose-50/40 border-2 border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
 : 'bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#05442e] focus:ring-4 focus:ring-[#05442e]/10'
 }`}
                />
                <Lock
                  className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${
 fieldErrors.password ? 'text-rose-500' : 'text-slate-400'
 }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Field-specific Error Message for Password */}
              {fieldErrors.password && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mt-1.5 px-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 rounded-2xl bg-[#05442e] hover:bg-[#07593c] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-emerald-950/15 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Registration Redirect Footer */}
          <div className="text-center pt-5 mt-5 border-t border-slate-100 text-xs text-slate-500 font-medium">
            {locale === 'ar' ? 'ليس لديك حساب حتى الآن؟' : "Don't have an account?"}{' '}
            <Link
              href="/register"
              className="text-[#05442e] hover:text-emerald-700 font-bold hover:underline transition-colors"
            >
              {locale === 'ar' ? 'إنشاء حساب جديد' : 'Register Now'}
            </Link>
          </div>
        </div>

        {/* Subtle Trust Footer */}
        <p className="text-center text-[11px] text-slate-400 font-medium">
          {locale === 'ar'
            ? 'محمي بتقنيات التشفير المتقدمة'
            : 'Protected with end-to-end SSL encryption'}
        </p>
      </div>
    </div>
  );
}
