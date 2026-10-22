'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { UserPlus, AlertCircle, CheckCircle2, Mail, Phone, Lock, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { locale } = useLanguage();
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await register(formData);
      if (res.success) {
        setSuccess(true);
        showToast(
          locale === 'ar' ? 'تم إنشاء الحساب بنجاح! 🎉' : 'Account created successfully! 🎉',
          'success'
        );
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err) {
      const fErrors = err.fieldErrors || err.data?.fieldErrors || {};
      const errMsg = err.message || '';

      const isEmailTaken = fErrors.email || /email.*already/i.test(errMsg);
      const isMobileTaken = fErrors.mobile || /mobile.*already|phone.*already/i.test(errMsg);
      const isBothTaken = (isEmailTaken && isMobileTaken) || /both.*email.*mobile/i.test(errMsg) || /email or mobile/i.test(errMsg);

      if (isBothTaken) {
        fErrors.email = locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email address is already registered';
        fErrors.mobile = locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered';
        showToast(
          locale === 'ar' ? 'البريد الإلكتروني ورقم الجوال مسجلان بالفعل' : 'Email and mobile number are already registered',
          'error'
        );
        setError(locale === 'ar' ? 'البريد الإلكتروني ورقم الجوال مسجلان بالفعل' : 'Both email and mobile number are already registered');
      } else if (isEmailTaken) {
        fErrors.email = locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email address is already registered';
        showToast(
          locale === 'ar' ? 'البريد الإلكتروني مسجل بالفعل' : 'This email address is already registered',
          'error'
        );
        setError(locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email address is already registered');
      } else if (isMobileTaken) {
        fErrors.mobile = locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered';
        showToast(
          locale === 'ar' ? 'رقم الجوال مسجل بالفعل' : 'This mobile number is already registered',
          'error'
        );
        setError(locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered');
      } else {
        showToast(errMsg || (locale === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed'), 'error');
        setError(errMsg || (locale === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed.'));
      }

      setFieldErrors(fErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[#fbfcfb] relative overflow-hidden">
      
      {/* Ambient Background Blur Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Top Brand Accent Line */}
          <div className="h-2 bg-gradient-to-r from-[#05442e] via-emerald-500 to-lime-400 absolute top-0 left-0 right-0" />

          {/* Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-[#05442e] text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-950/20 border border-emerald-700/50">
              <UserPlus className="w-7 h-7 text-lime-300" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                {locale === 'ar' ? 'انضم إلينا واستمتع بتسوق طازج وسريع 30 دقيقة' : 'Join us for farm-fresh grocery shopping & 30-min delivery'}
              </p>
            </div>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{locale === 'ar' ? 'تم إنشاء الحساب بنجاح! جاري التوجيه لتسجيل الدخول...' : 'Account created successfully! Redirecting to sign in...'}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {locale === 'ar' ? 'الاسم الأول' : 'First Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => {
                    setFormData({ ...formData, first_name: e.target.value });
                    if (fieldErrors.first_name) setFieldErrors(prev => ({ ...prev, first_name: null }));
                    if (error) setError('');
                  }}
                  placeholder="Ahmed"
                  className={`w-full px-3.5 py-3 rounded-2xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    fieldErrors.first_name
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-[#05442e]'
                  }`}
                />
                {fieldErrors.first_name && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{fieldErrors.first_name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {locale === 'ar' ? 'اسم العائلة' : 'Last Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                    if (fieldErrors.last_name) setFieldErrors(prev => ({ ...prev, last_name: null }));
                    if (error) setError('');
                  }}
                  placeholder="Al-Mansoor"
                  className={`w-full px-3.5 py-3 rounded-2xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    fieldErrors.last_name
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-[#05442e]'
                  }`}
                />
                {fieldErrors.last_name && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{fieldErrors.last_name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                    if (error) setError('');
                  }}
                  placeholder="ahmed@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-[#05442e]'
                  }`}
                />
                <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 ${fieldErrors.email ? 'text-rose-400' : 'text-slate-400'}`} />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {locale === 'ar' ? 'رقم الجوال' : 'Mobile Number'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => {
                    setFormData({ ...formData, mobile: e.target.value });
                    if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: null }));
                    if (error) setError('');
                  }}
                  placeholder="+966501234567"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    fieldErrors.mobile
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-[#05442e]'
                  }`}
                />
                <Phone className={`w-4 h-4 absolute left-3.5 top-3.5 ${fieldErrors.mobile ? 'text-rose-400' : 'text-slate-400'}`} />
              </div>
              {fieldErrors.mobile && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{fieldErrors.mobile}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {locale === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/90 border text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-[#05442e]'
                  }`}
                />
                <Lock className={`w-4 h-4 absolute left-3.5 top-3.5 ${fieldErrors.password ? 'text-rose-400' : 'text-slate-400'}`} />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{locale === 'ar' ? 'إنشاء الحساب' : 'Create Customer Account'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500 font-semibold">
            {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link href="/login" className="text-[#05442e] hover:text-emerald-700 font-extrabold hover:underline">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In Now'}
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
