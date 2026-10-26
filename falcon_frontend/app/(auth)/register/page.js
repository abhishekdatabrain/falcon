'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi } from '../../../src/services/api';
import { Mail, Phone, ChevronDown, Check, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+966', flag: '🇸🇦' },

];

export default function RegisterPage() {
  const { locale } = useLanguage();
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Mode: 'mobile' (default matching screenshot) or 'email'
  const [signupMode, setSignupMode] = useState('mobile');

  // Form Fields matching screenshot
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'short'
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [usernameMsg, setUsernameMsg] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // Debounced username availability check & suggestion generator
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      setUsernameMsg('');
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus('short');
      setUsernameMsg(locale === 'ar' ? 'اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل' : 'Username must be at least 3 characters');
      const base = trimmed.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
      setUsernameSuggestions([
        `${base}${Math.floor(10 + Math.random() * 90)}`,
        `${base}_saqr`,
        `${base}99`,
      ]);
      return;
    }

    setUsernameStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(`/auth/check-username?username=${encodeURIComponent(trimmed)}`);
        if (res.success && res.data) {
          if (res.data.available) {
            setUsernameStatus('available');
            setUsernameMsg(locale === 'ar' ? 'اسم المستخدم متاح ✓' : 'Username is available ✓');
            setUsernameSuggestions(res.data.suggestions || []);
          } else {
            setUsernameStatus('taken');
            setUsernameMsg(res.data.message || (locale === 'ar' ? 'اسم المستخدم محجوز بالفعل' : 'Username is already taken'));
            setUsernameSuggestions(res.data.suggestions || []);
          }
        }
      } catch (err) {
        setUsernameStatus('available');
        setUsernameMsg(locale === 'ar' ? 'اسم المستخدم متاح ✓' : 'Username is available ✓');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, locale]);

  // Handle click on suggestion pill
  const handleSelectSuggestion = (sug) => {
    setUsername(sug);
    setUsernameStatus('available');
    setUsernameMsg(locale === 'ar' ? 'تم اختيار اسم المستخدم ✓' : 'Username selected ✓');
    if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: null }));
    if (error) setError('');
  };

  const [sendingCode, setSendingCode] = useState(false);
  const [mobileStatus, setMobileStatus] = useState(null); // null | 'checking' | 'available' | 'taken'

  // Real-time mobile availability check
  useEffect(() => {
    if (signupMode !== 'mobile') {
      setMobileStatus(null);
      return;
    }

    const clean = mobileNumber.replace(/[^0-9]/g, '');
    if (clean.length < 9) {
      setMobileStatus(null);
      return;
    }

    const full = `${countryCode}${clean.replace(/^0+/, '')}`;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(`/auth/check-mobile?mobile=${encodeURIComponent(full)}`);
        if (res.success && res.data) {
          if (res.data.available) {
            setMobileStatus('available');
            if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: null }));
          } else {
            setMobileStatus('taken');
            setFieldErrors(prev => ({
              ...prev,
              mobile: locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered',
            }));
          }
        }
      } catch (e) {
        // non-blocking
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [mobileNumber, countryCode, signupMode, locale]);

  // Handle 60-second countdown for 'Send code'
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Dynamic 'Send code' trigger
  const handleSendCode = async () => {
    const isMobile = signupMode === 'mobile';
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    const identifier = isMobile ? `${countryCode}${cleanMobile.replace(/^0+/, '')}` : emailAddress.trim();

    if (isMobile) {
      if (!cleanMobile) {
        showToast(
          locale === 'ar' ? 'يرجى إدخال رقم الجوال أولاً' : 'Please enter mobile number first',
          'error'
        );
        return;
      }
      if (cleanMobile.length < 9) {
        showToast(
          locale === 'ar' ? 'رقم الجوال غير مكتمل' : 'Please enter a valid 10-digit mobile number',
          'error'
        );
        return;
      }
    } else {
      if (!identifier) {
        showToast(
          locale === 'ar' ? 'يرجى إدخال البريد الإلكتروني أولاً' : 'Please enter email address first',
          'error'
        );
        return;
      }
    }

    try {
      setSendingCode(true);
      const res = await fetchApi('/auth/send-code', {
        method: 'POST',
        body: { identifier, type: isMobile ? 'mobile' : 'email' },
      });

      if (res.success) {
        setCodeSent(true);
        setCountdown(60);
        if (isMobile && res.data?.code) {
          setVerificationCode(res.data.code);
        } else {
          setVerificationCode('');
        }
        showToast(
          !isMobile
            ? (locale === 'ar'
              ? `تم إرسال رمز التحقق إلى بريدك الإلكتروني (${identifier}). يرجى مراجعة صندوق الوارد.`
              : `Verification code sent to your email (${identifier}). Please check your inbox.`)
            : res.data?.code
              ? `${locale === 'ar' ? 'تم إرسال رمز التحقق:' : 'Verification code sent:'} ${res.data.code}`
              : (res.message || (locale === 'ar' ? 'تم إرسال رمز التحقق بنجاح' : 'Verification code sent successfully')),
          'success'
        );
      }
    } catch (err) {
      const errMsg = err.message || (locale === 'ar' ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code');
      showToast(errMsg, 'error');
      if (err.fieldErrors) setFieldErrors(prev => ({ ...prev, ...err.fieldErrors }));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = {};

    if (!username.trim()) {
      errors.username = locale === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required';
    } else if (usernameStatus === 'taken') {
      errors.username = locale === 'ar' ? 'اسم المستخدم محجوز بالفعل. يرجى اختيار اسم من الاقتراحات' : 'Username is already taken. Please choose one of the suggestions';
    }

    if (!password) {
      errors.password = locale === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (password.length < 6) {
      errors.password = locale === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = locale === 'ar' ? 'يرجى تأكيد كلمة المرور' : 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    }

    if (signupMode === 'mobile') {
      if (!mobileNumber.trim()) {
        errors.mobile = locale === 'ar' ? 'رقم الجوال مطلوب' : 'Mobile number is required';
      } else if (mobileStatus === 'taken') {
        errors.mobile = locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered';
      }
    } else {
      if (!emailAddress.trim()) {
        errors.email = locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email address is required';
      }
    }

    if (!verificationCode.trim()) {
      errors.verificationCode = locale === 'ar' ? 'رمز التحقق مطلوب' : 'Verification code is required';
    }

    if (!agreedToPolicy) {
      errors.agreedToPolicy = locale === 'ar' ? 'يجب الموافقة على سياسة الخصوصية' : 'You must agree to the Privacy Policy';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'error');
      return;
    }

    setLoading(true);

    try {
      const parts = username.trim().split(/\s+/);
      const first_name = parts[0] || 'User';
      const last_name = parts.slice(1).join(' ') || parts[0] || 'Customer';

      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      const fullMobile = signupMode === 'mobile'
        ? `${countryCode}${cleanMobile.replace(/^0+/, '')}`
        : `+9665${Math.floor(10000000 + Math.random() * 90000000)}`;

      const fullEmail = signupMode === 'email' && emailAddress.trim()
        ? emailAddress.trim().toLowerCase()
        : `user_${cleanMobile || Date.now()}@saqrcart.com`;

      const res = await register({
        username: username.trim(),
        first_name,
        last_name,
        email: fullEmail,
        mobile: fullMobile,
        password,
        verificationCode: verificationCode.trim(),
      });

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

      if (isEmailTaken && isMobileTaken) {
        showToast(locale === 'ar' ? 'البريد ورقم الجوال مسجلان بالفعل' : 'Both email and mobile are already registered', 'error');
        setError(locale === 'ar' ? 'البريد ورقم الجوال مسجلان بالفعل' : 'Both email and mobile are already registered');
      } else if (isMobileTaken) {
        fErrors.mobile = locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered';
        showToast(fErrors.mobile, 'error');
        setError(fErrors.mobile);
      } else if (isEmailTaken) {
        fErrors.email = locale === 'ar' ? 'هذا البريد مسجل بالفعل' : 'This email address is already registered';
        showToast(fErrors.email, 'error');
        setError(fErrors.email);
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans bg-[#f9fafb]">
      <div className="max-w-[460px] w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/70 shadow-sm space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight text-left rtl:text-right">
            {locale === 'ar' ? 'تسجيل جديد' : 'Sign up'}
          </h1>
        </div>

        {/* Global Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{locale === 'ar' ? 'تم إنشاء الحساب بنجاح! جاري التحويل...' : 'Account created successfully! Redirecting to sign in...'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div className="space-y-1.5 text-left rtl:text-right">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-800">
                {locale === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>

              {/* Real-time Status Indicator */}
              {usernameStatus === 'checking' && (
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  <span>{locale === 'ar' ? 'جارٍ الفحص...' : 'Checking...'}</span>
                </span>
              )}
              {usernameStatus === 'available' && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{usernameMsg}</span>
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{usernameMsg}</span>
                </span>
              )}
              {usernameStatus === 'short' && (
                <span className="text-xs font-medium text-amber-600">
                  {usernameMsg}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: null }));
                  if (error) setError('');
                }}
                placeholder={locale === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                className={`w-full px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.username || usernameStatus === 'taken'
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : usernameStatus === 'available'
                      ? 'border-[#00c269] focus:ring-[#00c269] focus:border-transparent'
                      : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                  }`}
              />

              <div className="absolute right-3.5 top-3.5 rtl:right-auto rtl:left-3.5 pointer-events-none">
                {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-[#00c269]" />}
                {usernameStatus === 'taken' && <AlertCircle className="w-4 h-4 text-rose-500" />}
              </div>
            </div>

            {/* Clickable Username Suggestions */}
            {usernameSuggestions.length > 0 && (
              <div className="pt-1.5 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Sparkles className="w-3 h-3 text-[#00c269]" />
                  <span>
                    {usernameStatus === 'taken'
                      ? (locale === 'ar' ? 'اقتراحات بديلة متاحة:' : 'Suggestions you can use:')
                      : (locale === 'ar' ? 'اقتراحات أسماء متاحة:' : 'Available suggestions:')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {usernameSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${username === sug
                          ? 'bg-[#00c269] text-white border-[#00c269] shadow-sm'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                        }`}
                    >
                      <span>{sug}</span>
                      {username === sug && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fieldErrors.username && (
              <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="block text-sm font-semibold text-slate-800">
              {locale === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                if (error) setError('');
              }}
              placeholder={locale === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
              className={`w-full px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.password
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                }`}
            />
            {fieldErrors.password && (
              <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5 text-left rtl:text-right">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-800">
                {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
              </label>
              {confirmPassword.length > 0 && password.length > 0 && (
                confirmPassword === password ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{locale === 'ar' ? 'متطابقة ✓' : 'Passwords match ✓'}</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
                    <span>{locale === 'ar' ? 'غير متطابقة' : 'Passwords do not match'}</span>
                  </span>
                )
              )}
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                if (error) setError('');
              }}
              placeholder={locale === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter new password'}
              className={`w-full px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.confirmPassword || (confirmPassword.length > 0 && password.length > 0 && confirmPassword !== password)
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : confirmPassword.length > 0 && confirmPassword === password
                    ? 'border-[#00c269] focus:ring-[#00c269] focus:border-transparent'
                    : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                }`}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Mobile number (or Email in email mode) */}
          {signupMode === 'mobile' ? (
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="block text-sm font-semibold text-slate-800">
                {locale === 'ar' ? 'رقم الجوال' : 'Mobile number'}
              </label>
              <div className="flex items-center rounded-xl bg-[#f5f6f8] border border-slate-200/80 focus-within:ring-2 focus-within:ring-[#00c269] focus-within:bg-white focus-within:border-transparent transition-all overflow-hidden">
                {/* Country Code Dropdown */}
                <div className="relative flex items-center pl-3.5 pr-2 border-r border-slate-200/80 shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="appearance-none bg-transparent py-3 pr-5 text-sm font-medium text-slate-800 cursor-pointer focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1 pointer-events-none" />
                </div>

                {/* Mobile Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setMobileNumber(numericValue);
                    if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: null }));
                    if (error) setError('');
                  }}
                  placeholder={locale === 'ar' ? 'أدخل رقم الجوال' : 'Enter mobile number'}
                  className="w-full px-3.5 py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
                />
              </div>
              {fieldErrors.mobile && (
                <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.mobile}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="block text-sm font-semibold text-slate-800">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => {
                  setEmailAddress(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                  if (error) setError('');
                }}
                placeholder={locale === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                className={`w-full px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.email
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                  }`}
              />
              {fieldErrors.email && (
                <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>
          )}

          {/* Verification code with Send code action */}
          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="block text-sm font-semibold text-slate-800">
              {locale === 'ar' ? 'رمز التحقق' : 'Verification code'}
            </label>
            <div className="flex items-center justify-between rounded-xl bg-[#f5f6f8] border border-slate-200/80 focus-within:ring-2 focus-within:ring-[#00c269] focus-within:bg-white focus-within:border-transparent transition-all px-3.5 py-1">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  if (fieldErrors.verificationCode) setFieldErrors(prev => ({ ...prev, verificationCode: null }));
                  if (error) setError('');
                }}
                placeholder={locale === 'ar' ? 'أدخل رمز التحقق' : 'Enter verification code'}
                className="w-full py-2 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0 || sendingCode}
                className="text-sm font-medium text-[#00c269] hover:text-emerald-700 hover:underline shrink-0 pl-2 rtl:pr-2 cursor-pointer disabled:text-slate-400 disabled:no-underline flex items-center gap-1"
              >
                {sendingCode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00c269]" />
                    <span>{locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</span>
                  </>
                ) : countdown > 0 ? (
                  (locale === 'ar' ? `إعادة الإرسال (${countdown})` : `Resend (${countdown}s)`)
                ) : (
                  (locale === 'ar' ? 'إرسال الرمز' : 'Send code')
                )}
              </button>
            </div>
            {fieldErrors.verificationCode && (
              <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.verificationCode}</p>
            )}
          </div>

          {/* Privacy Policy Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-left rtl:text-right select-none">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => {
                  setAgreedToPolicy(e.target.checked);
                  if (fieldErrors.agreedToPolicy) setFieldErrors(prev => ({ ...prev, agreedToPolicy: null }));
                }}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-[#00c269] focus:ring-[#00c269] cursor-pointer"
              />
              <span className="text-xs sm:text-[13px] text-slate-500 font-normal leading-relaxed">
                {locale === 'ar' ? (
                  <>
                    لقد قرأت ووافقت على{' '}
                    <Link href="/privacy" className="text-[#00c269] hover:underline font-medium">
                      "سياسة الخصوصية"
                    </Link>
                  </>
                ) : (
                  <>
                    I have read and agree to the{' '}
                    <Link href="/privacy" className="text-[#00c269] hover:underline font-medium">
                      "Privacy Policy"
                    </Link>
                  </>
                )}
              </span>
            </label>
            {fieldErrors.agreedToPolicy && (
              <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.agreedToPolicy}</p>
            )}
          </div>

          {/* Main Sign up button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#00c269] hover:bg-[#00ab5d] active:scale-[0.99] text-white font-semibold text-base transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{locale === 'ar' ? 'تسجيل جديد' : 'Sign up'}</span>
            )}
          </button>
        </form>

        {/* Divider 'or' */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-200/80 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">
            {locale === 'ar' ? 'أو' : 'or'}
          </span>
        </div>

        {/* Sign up with email / mobile toggle button */}
        <button
          type="button"
          onClick={() => {
            setSignupMode(signupMode === 'mobile' ? 'email' : 'mobile');
            setFieldErrors({});
            setError('');
          }}
          className="w-full py-3 px-4 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-medium text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          {signupMode === 'mobile' ? (
            <>
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{locale === 'ar' ? 'التسجيل عبر البريد الإلكتروني' : 'Sign up with email'}</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{locale === 'ar' ? 'التسجيل عبر رقم الجوال' : 'Sign up with mobile number'}</span>
            </>
          )}
        </button>

        {/* Footer: Already have an account? Sign in now */}
        <div className="text-center pt-2 text-xs sm:text-[13px] text-slate-500 font-normal">
          {locale === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          <Link
            href="/login"
            className="text-[#00c269] hover:text-emerald-700 hover:underline font-medium"
          >
            {locale === 'ar' ? 'تسجيل الدخول الآن' : 'Sign in now'}
          </Link>
        </div>

      </div>
    </div>
  );
}
