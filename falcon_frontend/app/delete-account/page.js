'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import { fetchApi } from '../../src/services/api';
import {
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Lock,
  User,
  FileText,
  Smartphone,
  Mail,
  Loader2,
  AlertTriangle,
  Home,
} from 'lucide-react';

export default function PublicDeleteAccountPage() {
  const { locale } = useLanguage();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    if (!confirmChecked) {
      const msg = isAr
        ? 'يرجى تأكيد أنك تفهم أن حذف الحساب إجراء نهائي.'
        : 'Please confirm that you understand account deletion is permanent.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    if (!user && (!loginInput.trim() || !password)) {
      const msg = isAr
        ? 'يرجى إدخال البريد الإلكتروني أو رقم الجوال وكلمة المرور.'
        : 'Please enter your registered email/mobile and password.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      let authHeader = {};

      // If not already logged in, authenticate first using provided credentials
      if (!user) {
        const loginRes = await fetchApi('/auth/login', {
          method: 'POST',
          body: {
            loginInput: loginInput.trim(),
            password,
          },
        });

        if (!loginRes.success || !loginRes.data?.accessToken) {
          throw new Error(loginRes.message || 'Invalid account credentials');
        }
        authHeader = { Authorization: `Bearer ${loginRes.data.accessToken}` };
      }

      // Execute Account Deletion API
      const delRes = await fetchApi('/customers/account', {
        method: 'DELETE',
        headers: authHeader,
        body: password ? { password } : {},
      });

      if (delRes.success) {
        setDeletedSuccess(true);
        showToast(
          isAr ? 'تم حذف حسابك وإخفاء بياناتك الشخصية بنجاح.' : 'Your account has been permanently deleted and personal data anonymized.',
          'success'
        );
        if (user && logout) {
          setTimeout(() => {
            logout('CUSTOMER');
          }, 2000);
        }
      } else {
        throw new Error(delRes.message || 'Failed to delete account');
      }
    } catch (err) {
      const msg = err.message || (isAr ? 'فشل حذف الحساب. يرجى التحقق من البيانات.' : 'Failed to delete account. Please verify your details.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] pb-24 text-slate-800">
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-[#043927] flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800 font-bold">
            {isAr ? 'حذف الحساب والبيانات' : 'Delete Account & Data'}
          </span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-700">
            <ShieldAlert className="w-4 h-4" />
            <span>{isAr ? 'مركز خصوصية صقر كارت • حذف الحساب' : 'SaaRCart Privacy Center • Account Deletion'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isAr ? 'طلب حذف حساب صقر كارت (SaaRCart)' : 'Delete Your SaaRCart Account & Personal Data'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isAr
              ? 'توفر شركة صقر الاندماج للتجارة (SaaRCart) هذه الصفحة العامة لتمكين المستخدمين من حذف حساباتهم وبياناتهم الشخصية بشكل نهائي، سواء عبر تطبيق الهاتف أو مباشرة عبر الويب.'
              : 'Saqr Alindimaj Trading Company (SaaRCart) provides this public portal so users can permanently delete their SaaRCart account and personal data directly from the web, even if the mobile app is no longer installed.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Deletion Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/90 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">
                  {isAr ? 'حذف الحساب نهائياً' : 'Permanent Account Deletion'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isAr ? 'تحقق من هويتك لتأكيد الحذف الفوري.' : 'Verify your credentials to permanently delete your account.'}
                </p>
              </div>
            </div>

            {deletedSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-black text-emerald-950 text-base">
                  {isAr ? 'تم حذف الحساب بنجاح' : 'Account Deleted Successfully'}
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {isAr
                    ? 'تم تعطيل حسابك وإخفاء جميع بياناتك الشخصية، العناوين، السلة، وقائمة المفضلة بشكل نهائي.'
                    : 'Your SaaRCart account has been deactivated and your personal data, saved addresses, cart, wishlist, and device tokens have been permanently removed.'}
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 rounded-full bg-[#043927] text-white font-bold text-xs"
                >
                  {isAr ? 'العودة للرئيسية' : 'Return to Home'}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleDeleteSubmit} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {user ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'الحساب المسجل حالياً' : 'Signed-in Account'}
                    </span>
                    <div className="font-bold text-slate-900 text-sm">{user.name || user.email || user.mobile}</div>
                    <div className="text-slate-500">{user.email} {user.mobile ? `• ${user.mobile}` : ''}</div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      {isAr ? 'البريد الإلكتروني أو رقم الجوال المسجل *' : 'Registered Email or Mobile Number *'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 rtl:left-auto rtl:right-3.5" />
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'مثال: user@example.com أو +9665XXXXXXXX' : 'e.g. user@example.com or +9665XXXXXXXX'}
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-rose-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {user
                      ? (isAr ? 'كلمة المرور (اختياري لحسابات OTP)' : 'Password (Optional for OTP accounts)')
                      : (isAr ? 'كلمة المرور *' : 'Password *')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 rtl:left-auto rtl:right-3.5" />
                    <input
                      type="password"
                      required={!user}
                      placeholder={isAr ? 'أدخل كلمة المرور للتأكيد' : 'Enter your password to confirm'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-rose-400"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 accent-rose-600 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    {isAr
                      ? 'أقر وأفهم أن حذف حسابي إجراء نهائي ولا يمكن التراجع عنه، وسيتم حذف بياناتي الشخصية وعناويني المحفوظة فوراً.'
                      : 'I understand that deleting my SaaRCart account is permanent and irreversible, and all my personal profile data and saved addresses will be deleted.'}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري حذف الحساب...' : 'Deleting Account...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{isAr ? 'حذف حسابي نهائياً' : 'Permanently Delete My Account'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Google Play Data Policy Disclosure & In-App Steps */}
          <div className="lg:col-span-5 space-y-5 text-xs">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'البيانات التي يتم حذفها والاحتفاظ بها' : 'Data Deletion & Retention Policy'}</span>
              </div>

              <div className="space-y-2 text-slate-600 leading-relaxed">
                <p>
                  <strong className="text-slate-900">{isAr ? 'يتم حذفها فوراً:' : 'Deleted Immediately:'}</strong>{' '}
                  {isAr
                    ? 'الاسم، البريد الإلكتروني، رقم الجوال، تاريخ الميلاد، الهوية الوطنية، العناوين المحفوظة، سلة التسوق، المفضلة، ورموز الإشعارات.'
                    : 'Name, email address, mobile number, date of birth, national ID, saved addresses, shopping cart, wishlist, and push notification tokens.'}
                </p>
                <p>
                  <strong className="text-slate-900">{isAr ? 'يتم الاحتفاظ بها بموجب النظام:' : 'Retained for Legal Compliance:'}</strong>{' '}
                  {isAr
                    ? 'يتم إخفاء الهوية عن سجلات الطلبات والفواتير الضريبية (ZATCA) والاحتفاظ بها للأغراض المحاسبية والضريبية وفقاً لأنظمة المملكة العربية السعودية.'
                    : 'Historical order records and ZATCA tax invoices are anonymized and retained only as required by Saudi commercial and tax regulations.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? 'ملاحظة: لا يمكن حذف الحساب أثناء وجود طلبات توصيل نشطة قيد التنفيذ.'
                    : 'Note: Accounts with active in-progress delivery orders cannot be deleted until delivery is completed or cancelled.'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Smartphone className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'الحذف من داخل التطبيق' : 'Delete In-App Steps'}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>{isAr ? 'افتح تطبيق صقر كارت وسجل الدخول.' : 'Open the SaaRCart app and sign in.'}</li>
                <li>{isAr ? 'انتقل إلى الملف الشخصي (Profile).' : 'Navigate to Profile.'}</li>
                <li>{isAr ? 'انزل إلى منطقة الخطر (Danger Zone) واضغط على "حذف الحساب".' : 'Scroll to Danger Zone and tap "Delete My Account".'}</li>
              </ol>
            </div>

            <div className="bg-[#EAF5EF] rounded-2xl p-4 border border-[#CDE5D7] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#043927]">
                <Mail className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'نسيت كلمة المرور؟' : 'Need Help or Forgot Password?'}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {isAr
                  ? 'يمكنك طلب حذف الحساب عبر البريد الإلكتروني care@saqrcart.com أو من خلال صفحة تواصل معنا.'
                  : 'Contact us via care@saqrcart.com or visit our '}
                {!isAr && (
                  <Link href="/contact" className="font-bold text-[#043927] underline">
                    Contact Support
                  </Link>
                )}
                {!isAr && ' page for manual verification.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
