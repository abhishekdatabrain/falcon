'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi } from '../../../src/services/api';
import { Mail, Phone, ChevronDown, AlertCircle, CheckCircle2, Loader2, FileText, Building2, Hash, MapPin } from 'lucide-react';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [hasVat, setHasVat] = useState(false);
  const [vatNo, setVatNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [crNo, setCrNo] = useState('');
  const [vatAddress, setVatAddress] = useState('');

  // Independent Email Verification States
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCodeVerified, setEmailCodeVerified] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);

  // Independent Mobile Verification States
  const [mobileCodeSent, setMobileCodeSent] = useState(false);
  const [mobileCountdown, setMobileCountdown] = useState(0);
  const [sendingMobileCode, setSendingMobileCode] = useState(false);
  const [mobileVerificationCode, setMobileVerificationCode] = useState('');
  const [mobileCodeVerified, setMobileCodeVerified] = useState(false);
  const [verifyingMobileCode, setVerifyingMobileCode] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
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

  // Independent 60-second countdown for Email Send Code
  useEffect(() => {
    let timer;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // Independent 60-second countdown for Mobile Send Code
  useEffect(() => {
    let timer;
    if (mobileCountdown > 0) {
      timer = setTimeout(() => setMobileCountdown(mobileCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [mobileCountdown]);

  // Send Email Verification Code
  const handleSendEmailCode = async () => {
    if (sendingEmailCode || emailCountdown > 0) return;

    const identifier = emailAddress.trim().toLowerCase();
    if (!identifier) {
      const msg = locale === 'ar' ? 'يرجى إدخال البريد الإلكتروني أولاً' : 'Please enter email address first';
      setFieldErrors(prev => ({ ...prev, email: msg }));
      showToast(msg, 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      const msg = locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
      setFieldErrors(prev => ({ ...prev, email: msg }));
      showToast(msg, 'error');
      return;
    }

    try {
      setSendingEmailCode(true);
      const res = await fetchApi('/auth/send-code', {
        method: 'POST',
        body: { identifier, type: 'email' },
      });

      if (res.success) {
        setEmailCodeSent(true);
        setEmailCodeVerified(false);
        setEmailCountdown(60);
        setEmailVerificationCode('');
        setFieldErrors(prev => ({ ...prev, email: null, emailVerificationCode: null }));
        showToast(
          locale === 'ar'
            ? `تم إرسال رمز التحقق إلى بريدك الإلكتروني (${identifier}). يرجى مراجعة صندوق الوارد.`
            : `Verification code sent to your email (${identifier}). Please check your inbox.`,
          'success'
        );
      } else {
        throw new Error(res.message || 'Failed to send verification code');
      }
    } catch (err) {
      const errMsg = err.message || (locale === 'ar' ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code');
      showToast(errMsg, 'error');
      if (err.fieldErrors) setFieldErrors(prev => ({ ...prev, ...err.fieldErrors }));
    } finally {
      setSendingEmailCode(false);
    }
  };

  // Send Mobile Verification Code
  const handleSendMobileCode = async () => {
    if (sendingMobileCode || mobileCountdown > 0) return;

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (!cleanMobile) {
      const msg = locale === 'ar' ? 'يرجى إدخال رقم الجوال أولاً' : 'Please enter mobile number first';
      setFieldErrors(prev => ({ ...prev, mobile: msg }));
      showToast(msg, 'error');
      return;
    }
    if (cleanMobile.length < 9) {
      const msg = locale === 'ar' ? 'رقم الجوال غير مكتمل' : 'Please enter a valid mobile number';
      setFieldErrors(prev => ({ ...prev, mobile: msg }));
      showToast(msg, 'error');
      return;
    }
    if (mobileStatus === 'taken') {
      const msg = locale === 'ar' ? 'رقم الجوال هذا مسجل بالفعل' : 'This mobile number is already registered';
      setFieldErrors(prev => ({ ...prev, mobile: msg }));
      showToast(msg, 'error');
      return;
    }

    const identifier = `${countryCode}${cleanMobile.replace(/^0+/, '')}`;

    try {
      setSendingMobileCode(true);
      const res = await fetchApi('/auth/send-code', {
        method: 'POST',
        body: { identifier, type: 'mobile' },
      });

      if (res.success) {
        setMobileCodeSent(true);
        setMobileCodeVerified(false);
        setMobileCountdown(60);
        if (res.data?.code) {
          setMobileVerificationCode(res.data.code);
        } else {
          setMobileVerificationCode('');
        }
        setFieldErrors(prev => ({ ...prev, mobile: null, mobileVerificationCode: null }));
        showToast(
          res.data?.code
            ? `${locale === 'ar' ? 'تم إرسال رمز التحقق:' : 'Verification code sent:'} ${res.data.code}`
            : (res.message || (locale === 'ar' ? 'تم إرسال رمز التحقق بنجاح' : 'Verification code sent successfully')),
          'success'
        );
      } else {
        throw new Error(res.message || 'Failed to send verification code');
      }
    } catch (err) {
      const errMsg = err.message || (locale === 'ar' ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code');
      showToast(errMsg, 'error');
      if (err.fieldErrors) setFieldErrors(prev => ({ ...prev, ...err.fieldErrors }));
    } finally {
      setSendingMobileCode(false);
    }
  };

  // Verify Email Code via Backend
  const handleVerifyEmailCode = async () => {
    if (verifyingEmailCode || emailCodeVerified) return;
    const code = emailVerificationCode.trim();
    const identifier = emailAddress.trim().toLowerCase();

    if (!code) {
      const msg = locale === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code';
      setFieldErrors(prev => ({ ...prev, emailVerificationCode: msg }));
      showToast(msg, 'error');
      return;
    }

    try {
      setVerifyingEmailCode(true);
      const res = await fetchApi('/auth/verify-code', {
        method: 'POST',
        body: { identifier, code },
      });

      if (res.success) {
        setEmailCodeVerified(true);
        setFieldErrors(prev => ({ ...prev, emailVerificationCode: null }));
        showToast(locale === 'ar' ? 'تم التحقق من البريد الإلكتروني بنجاح ✓' : 'Email verified successfully ✓', 'success');
      } else {
        throw new Error(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setEmailCodeVerified(false);
      const msg = err.message || (locale === 'ar' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired verification code');
      setFieldErrors(prev => ({ ...prev, emailVerificationCode: msg }));
      showToast(msg, 'error');
    } finally {
      setVerifyingEmailCode(false);
    }
  };

  // Verify Mobile Code via Backend
  const handleVerifyMobileCode = async () => {
    if (verifyingMobileCode || mobileCodeVerified) return;
    const code = mobileVerificationCode.trim();
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    const identifier = `${countryCode}${cleanMobile.replace(/^0+/, '')}`;

    if (!code) {
      const msg = locale === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code';
      setFieldErrors(prev => ({ ...prev, mobileVerificationCode: msg }));
      showToast(msg, 'error');
      return;
    }

    try {
      setVerifyingMobileCode(true);
      const res = await fetchApi('/auth/verify-code', {
        method: 'POST',
        body: { identifier, code },
      });

      if (res.success) {
        setMobileCodeVerified(true);
        setFieldErrors(prev => ({ ...prev, mobileVerificationCode: null }));
        showToast(locale === 'ar' ? 'تم التحقق من رقم الجوال بنجاح ✓' : 'Mobile number verified successfully ✓', 'success');
      } else {
        throw new Error(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setMobileCodeVerified(false);
      const msg = err.message || (locale === 'ar' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired verification code');
      setFieldErrors(prev => ({ ...prev, mobileVerificationCode: msg }));
      showToast(msg, 'error');
    } finally {
      setVerifyingMobileCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = {};

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedFirstName) {
      errors.firstName = locale === 'ar' ? 'الاسم الأول مطلوب' : 'First name is required';
    } else if (trimmedFirstName.length < 2) {
      errors.firstName = locale === 'ar' ? 'يجب أن يتكون الاسم الأول من حرفين على الأقل' : 'First name must be at least 2 characters';
    }

    if (!trimmedLastName) {
      errors.lastName = locale === 'ar' ? 'الاسم الأخير مطلوب' : 'Last name is required';
    } else if (trimmedLastName.length < 2) {
      errors.lastName = locale === 'ar' ? 'يجب أن يتكون الاسم الأخير من حرفين على الأقل' : 'Last name must be at least 2 characters';
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
      } else if (!mobileCodeSent) {
        errors.mobile = locale === 'ar' ? 'يرجى إرسال رمز التحقق إلى رقم الجوال أولاً' : 'Please send and enter the mobile verification code';
      } else if (!mobileVerificationCode.trim()) {
        errors.mobileVerificationCode = locale === 'ar' ? 'رمز التحقق مطلوب' : 'Mobile verification code is required';
      }
    } else {
      if (!emailAddress.trim()) {
        errors.email = locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim())) {
        errors.email = locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
      } else if (!emailCodeSent) {
        errors.email = locale === 'ar' ? 'يرجى إرسال رمز التحقق إلى بريدك الإلكتروني أولاً' : 'Please send and enter the email verification code';
      } else if (!emailVerificationCode.trim()) {
        errors.emailVerificationCode = locale === 'ar' ? 'رمز التحقق مطلوب' : 'Email verification code is required';
      }
    }

    if (!agreedToPolicy) {
      errors.agreedToPolicy = locale === 'ar' ? 'يجب الموافقة على سياسة الخصوصية' : 'You must agree to the Privacy Policy';
    }

    if (hasVat) {
      const cleanVat = vatNo.trim();
      if (!cleanVat) {
        errors.vatNo = locale === 'ar' ? 'الرقم الضريبي مطلوب' : 'VAT No is required';
      } else if (!/^\d{15}$/.test(cleanVat)) {
        errors.vatNo = locale === 'ar' ? 'الرقم الضريبي يجب أن يتكون من 15 رقم' : 'VAT No must be a valid 15-digit number';
      }

      if (!companyName.trim()) {
        errors.companyName = locale === 'ar' ? 'اسم الشركة مطلوب' : 'Company Name is required';
      }

      if (!crNo.trim()) {
        errors.crNo = locale === 'ar' ? 'رقم السجل التجاري مطلوب' : 'CR No is required';
      }

      if (!vatAddress.trim()) {
        errors.address = locale === 'ar' ? 'العنوان مطلوب' : 'Address is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'error');
      return;
    }

    setLoading(true);

    try {
      const first_name = trimmedFirstName;
      const last_name = trimmedLastName;

      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      const fullMobile = signupMode === 'mobile'
        ? `${countryCode}${cleanMobile.replace(/^0+/, '')}`
        : ``;

      const fullEmail = signupMode === 'email' && emailAddress.trim()
        ? emailAddress.trim().toLowerCase()
        : ``;

      const activeCode = signupMode === 'mobile'
        ? mobileVerificationCode.trim()
        : emailVerificationCode.trim();

      const res = await register({
        full_name: `${first_name} ${last_name}`.trim(),
        first_name,
        last_name,
        email: fullEmail,
        mobile: fullMobile,
        password,
        verificationCode: activeCode,
        vatNo: hasVat ? vatNo.trim() : null,
        companyName: hasVat ? companyName.trim() : null,
        crNo: hasVat ? crNo.trim() : null,
        address: hasVat ? vatAddress.trim() : null,
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#f9fafb]">
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

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left rtl:text-right">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                {locale === 'ar' ? 'الاسم الأول' : 'First Name'}
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: null }));
                  if (error) setError('');
                }}
                placeholder={locale === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
                className={`w-full px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.firstName
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                }`}
              />

              {fieldErrors.firstName && (
                <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                {locale === 'ar' ? 'الاسم الأخير' : 'Last Name'}
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: null }));
                  if (error) setError('');
                }}
                placeholder={locale === 'ar' ? 'أدخل الاسم الأخير' : 'Enter last name'}
                className={`w-full px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.lastName
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                }`}
              />

              {fieldErrors.lastName && (
                <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.lastName}</p>
              )}
            </div>
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
            <div className="space-y-3 text-left rtl:text-right">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-800">
                  {locale === 'ar' ? 'رقم الجوال' : 'Mobile number'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className={`flex-1 flex items-center rounded-xl bg-[#f5f6f8] border focus-within:ring-2 focus-within:ring-[#00c269] focus-within:bg-white focus-within:border-transparent transition-all overflow-hidden ${fieldErrors.mobile ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/80'}`}>
                    {/* Country Code Dropdown */}
                    <div className="relative flex items-center pl-3.5 pr-2 border-r border-slate-200/80 shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value);
                          setMobileCodeSent(false);
                          setMobileCodeVerified(false);
                          setMobileVerificationCode('');
                          setMobileCountdown(0);
                        }}
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
                        if (mobileCodeSent || mobileVerificationCode || mobileCodeVerified) {
                          setMobileCodeSent(false);
                          setMobileCodeVerified(false);
                          setMobileVerificationCode('');
                          setMobileCountdown(0);
                        }
                        if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: null }));
                        if (error) setError('');
                      }}
                      placeholder={locale === 'ar' ? 'أدخل رقم الجوال' : 'Enter mobile number'}
                      className="w-full px-3.5 py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
                    />
                  </div>

                  {/* Send Code Button beside Mobile Input */}
                  <button
                    type="button"
                    onClick={handleSendMobileCode}
                    disabled={mobileCountdown > 0 || sendingMobileCode}
                    className="px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-sm font-semibold text-[#00c269] hover:text-emerald-700 shrink-0 cursor-pointer disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {sendingMobileCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#00c269]" />
                        <span>{locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</span>
                      </>
                    ) : mobileCountdown > 0 ? (
                      <span>{locale === 'ar' ? `إعادة الإرسال (${mobileCountdown})` : `Resend (${mobileCountdown}s)`}</span>
                    ) : (
                      <span>{locale === 'ar' ? 'إرسال الرمز' : 'Send Code'}</span>
                    )}
                  </button>
                </div>
                {fieldErrors.mobile && (
                  <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.mobile}</p>
                )}
              </div>

              {/* Conditional Mobile Verification Code Input (Hidden until code sent) */}
              {mobileCodeSent && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      {locale === 'ar' ? 'رمز التحقق للجوال' : 'Mobile Verification Code'}
                    </label>
                    {mobileCodeVerified && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{locale === 'ar' ? 'تم التحقق ✓' : 'Verified ✓'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={mobileVerificationCode}
                      onChange={(e) => {
                        setMobileVerificationCode(e.target.value);
                        if (mobileCodeVerified) setMobileCodeVerified(false);
                        if (fieldErrors.mobileVerificationCode) setFieldErrors(prev => ({ ...prev, mobileVerificationCode: null }));
                        if (error) setError('');
                      }}
                      placeholder={locale === 'ar' ? 'أدخل رمز التحقق' : 'Enter verification code'}
                      className={`flex-1 px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.mobileVerificationCode
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                        : mobileCodeVerified
                        ? 'border-[#00c269] focus:ring-[#00c269] focus:border-transparent'
                        : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMobileCode}
                      disabled={verifyingMobileCode || mobileCodeVerified}
                      className={`px-4 py-3 rounded-xl border text-sm font-semibold shrink-0 transition-colors flex items-center justify-center gap-1.5 ${mobileCodeVerified
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default'
                        : 'bg-[#00c269] hover:bg-[#00a859] border-[#00c269] text-white cursor-pointer disabled:opacity-60'
                      }`}
                    >
                      {verifyingMobileCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{locale === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}</span>
                        </>
                      ) : mobileCodeVerified ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{locale === 'ar' ? 'تم التحقق' : 'Verified'}</span>
                        </>
                      ) : (
                        <span>{locale === 'ar' ? 'تحقق' : 'Verify'}</span>
                      )}
                    </button>
                  </div>
                  {fieldErrors.mobileVerificationCode && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.mobileVerificationCode}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-left rtl:text-right">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-800">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                      if (emailCodeSent || emailVerificationCode || emailCodeVerified) {
                        setEmailCodeSent(false);
                        setEmailCodeVerified(false);
                        setEmailVerificationCode('');
                        setEmailCountdown(0);
                      }
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                      if (error) setError('');
                    }}
                    placeholder={locale === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                    className={`flex-1 px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.email
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                    }`}
                  />

                  {/* Send Code Button beside Email Input */}
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={emailCountdown > 0 || sendingEmailCode}
                    className="px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-sm font-semibold text-[#00c269] hover:text-emerald-700 shrink-0 cursor-pointer disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {sendingEmailCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#00c269]" />
                        <span>{locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</span>
                      </>
                    ) : emailCountdown > 0 ? (
                      <span>{locale === 'ar' ? `إعادة الإرسال (${emailCountdown})` : `Resend (${emailCountdown}s)`}</span>
                    ) : (
                      <span>{locale === 'ar' ? 'إرسال الرمز' : 'Send Code'}</span>
                    )}
                  </button>
                </div>
                {fieldErrors.email && (
                  <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Conditional Email Verification Code Input (Hidden until code sent) */}
              {emailCodeSent && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      {locale === 'ar' ? 'رمز التحقق للبريد الإلكتروني' : 'Email Verification Code'}
                    </label>
                    {emailCodeVerified && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{locale === 'ar' ? 'تم التحقق ✓' : 'Verified ✓'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={emailVerificationCode}
                      onChange={(e) => {
                        setEmailVerificationCode(e.target.value);
                        if (emailCodeVerified) setEmailCodeVerified(false);
                        if (fieldErrors.emailVerificationCode) setFieldErrors(prev => ({ ...prev, emailVerificationCode: null }));
                        if (error) setError('');
                      }}
                      placeholder={locale === 'ar' ? 'أدخل رمز التحقق' : 'Enter verification code'}
                      className={`flex-1 px-4 py-3 rounded-xl bg-[#f5f6f8] border text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 transition-all ${fieldErrors.emailVerificationCode
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                        : emailCodeVerified
                        ? 'border-[#00c269] focus:ring-[#00c269] focus:border-transparent'
                        : 'border-slate-200/80 focus:ring-[#00c269] focus:border-transparent'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailCode}
                      disabled={verifyingEmailCode || emailCodeVerified}
                      className={`px-4 py-3 rounded-xl border text-sm font-semibold shrink-0 transition-colors flex items-center justify-center gap-1.5 ${emailCodeVerified
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default'
                        : 'bg-[#00c269] hover:bg-[#00a859] border-[#00c269] text-white cursor-pointer disabled:opacity-60'
                      }`}
                    >
                      {verifyingEmailCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{locale === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}</span>
                        </>
                      ) : emailCodeVerified ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{locale === 'ar' ? 'تم التحقق' : 'Verified'}</span>
                        </>
                      ) : (
                        <span>{locale === 'ar' ? 'تحقق' : 'Verify'}</span>
                      )}
                    </button>
                  </div>
                  {fieldErrors.emailVerificationCode && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.emailVerificationCode}</p>
                  )}
                </div>
              )}
            </div>
          )}

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
                className="mt-1 w-4 h-4 rounded border-slate-300 accent-[#00B14F] text-[#00B14F] focus:ring-[#00B14F] cursor-pointer"
              />
              <span className="text-xs sm:text-[13px] text-slate-500 font-normal leading-relaxed">
                {locale === 'ar' ? (
                  <>
                    لقد قرأت ووافقت على{' '}
                    <Link href="/privacy" className="text-[#00B14F] hover:underline font-medium">
                      &quot;سياسة الخصوصية&quot;
                    </Link>
                  </>
                ) : (
                  <>
                    I have read and agree to the{' '}
                    <Link href="/privacy" className="text-[#00B14F] hover:underline font-medium">
                      &quot;Privacy Policy&quot;
                    </Link>
                  </>
                )}
              </span>
            </label>
            {fieldErrors.agreedToPolicy && (
              <p className="text-xs font-medium text-rose-600 mt-1">{fieldErrors.agreedToPolicy}</p>
            )}
          </div>

          {/* VAT No (Optional) Checkbox Toggle */}
          <div className="pt-1 text-left rtl:text-right">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={hasVat}
                onChange={(e) => {
                  setHasVat(e.target.checked);
                  if (!e.target.checked) {
                    setFieldErrors(prev => {
                      const { vatNo, companyName, crNo, address, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 accent-[#00B14F] text-[#00B14F] focus:ring-[#00B14F] cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                {locale === 'ar' ? 'الرقم الضريبي (اختياري)' : 'VAT No (Optional)'}
              </span>
            </label>

            {/* Conditional Expandable Fields (Soft mint-green container) */}
            {hasVat && (
              <div className="bg-[#E8F8EE] border border-[#00B14F]/20 rounded-2xl p-3.5 mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* 1. VAT No */}
                <div className="space-y-1">
                  <div
                    className={`bg-white rounded-xl border flex items-center overflow-hidden transition-all ${
                      fieldErrors.vatNo
                        ? 'border-rose-400 ring-1 ring-rose-400'
                        : 'border-slate-200/80 focus-within:border-[#00B14F]'
                    }`}
                  >
                    <div className="bg-[#F8FAFC] px-3.5 py-3 text-slate-600 border-r border-slate-100 rtl:border-l rtl:border-r-0 shrink-0">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="vatNo"
                      value={vatNo}
                      maxLength={15}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
                        setVatNo(val);
                        if (fieldErrors.vatNo) setFieldErrors(prev => ({ ...prev, vatNo: null }));
                      }}
                      placeholder={locale === 'ar' ? 'أدخل الرقم الضريبي' : 'Enter VAT No'}
                      className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-700 placeholder-slate-400 font-medium focus:outline-none"
                    />
                  </div>
                  {fieldErrors.vatNo && (
                    <p className="text-[11px] font-medium text-rose-600 px-1">{fieldErrors.vatNo}</p>
                  )}
                </div>

                {/* 2. Company Name */}
                <div className="space-y-1">
                  <div
                    className={`bg-white rounded-xl border flex items-center overflow-hidden transition-all ${
                      fieldErrors.companyName
                        ? 'border-rose-400 ring-1 ring-rose-400'
                        : 'border-slate-200/80 focus-within:border-[#00B14F]'
                    }`}
                  >
                    <div className="bg-[#F8FAFC] px-3.5 py-3 text-slate-600 border-r border-slate-100 rtl:border-l rtl:border-r-0 shrink-0">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (fieldErrors.companyName) setFieldErrors(prev => ({ ...prev, companyName: null }));
                      }}
                      placeholder={locale === 'ar' ? 'أدخل اسم الشركة' : 'Enter Company Name'}
                      className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-700 placeholder-slate-400 font-medium focus:outline-none"
                    />
                  </div>
                  {fieldErrors.companyName && (
                    <p className="text-[11px] font-medium text-rose-600 px-1">{fieldErrors.companyName}</p>
                  )}
                </div>

                {/* 3. CR No */}
                <div className="space-y-1">
                  <div
                    className={`bg-white rounded-xl border flex items-center overflow-hidden transition-all ${
                      fieldErrors.crNo
                        ? 'border-rose-400 ring-1 ring-rose-400'
                        : 'border-slate-200/80 focus-within:border-[#00B14F]'
                    }`}
                  >
                    <div className="bg-[#F8FAFC] px-3.5 py-3 text-slate-600 border-r border-slate-100 rtl:border-l rtl:border-r-0 shrink-0">
                      <Hash className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="crNo"
                      value={crNo}
                      onChange={(e) => {
                        setCrNo(e.target.value);
                        if (fieldErrors.crNo) setFieldErrors(prev => ({ ...prev, crNo: null }));
                      }}
                      placeholder={locale === 'ar' ? 'أدخل رقم السجل التجاري' : 'Enter CR No'}
                      className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-700 placeholder-slate-400 font-medium focus:outline-none"
                    />
                  </div>
                  {fieldErrors.crNo && (
                    <p className="text-[11px] font-medium text-rose-600 px-1">{fieldErrors.crNo}</p>
                  )}
                </div>

                {/* 4. Address */}
                <div className="space-y-1">
                  <div
                    className={`bg-white rounded-xl border flex items-center overflow-hidden transition-all ${
                      fieldErrors.address
                        ? 'border-rose-400 ring-1 ring-rose-400'
                        : 'border-slate-200/80 focus-within:border-[#00B14F]'
                    }`}
                  >
                    <div className="bg-[#F8FAFC] px-3.5 py-3 text-slate-600 border-r border-slate-100 rtl:border-l rtl:border-r-0 shrink-0">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={vatAddress}
                      onChange={(e) => {
                        setVatAddress(e.target.value);
                        if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: null }));
                      }}
                      placeholder={locale === 'ar' ? 'أدخل العنوان' : 'Enter Address'}
                      className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-700 placeholder-slate-400 font-medium focus:outline-none"
                    />
                  </div>
                  {fieldErrors.address && (
                    <p className="text-[11px] font-medium text-rose-600 px-1">{fieldErrors.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Sign up button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#00B14F] hover:bg-[#009b45] active:scale-[0.99] text-white font-semibold text-base transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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
