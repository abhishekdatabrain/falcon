'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Search,
  User,
  ExternalLink,
  X,
  Receipt,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/payments/verify-list');
      if (res.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleVerify = async (paymentId) => {
    try {
      const res = await fetchApi(`/payments/${paymentId}/verify`, { method: 'POST' });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تأكيد التحويل بنجاح! أصبح الطلب جاهزاً للتعيين للسائق.' : 'Payment verified successfully! Order is ready for driver assignment.',
          'success'
        );
        await loadPayments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (paymentId) => {
    const reason = prompt(locale === 'ar' ? 'أدخل سبب رفض التحويل للعميل:' : 'Enter rejection reason for customer:');
    if (!reason) return;
    try {
      const res = await fetchApi(`/payments/${paymentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم رفض التحويل وإبلاغ العميل' : 'Payment rejected successfully',
          'info'
        );
        await loadPayments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const ref = p.confirmation?.payment_reference || '';
    const orderNum = p.order?.order_number || '';
    const name = `${p.order?.customer?.first_name || ''} ${p.order?.customer?.last_name || ''}`;
    return ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
           orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
           name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPendingAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-950 via-[#05442e] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-lime-400 flex items-center justify-center shadow-inner shrink-0">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {locale === 'ar' ? 'تأكيد التحويلات البنكية' : 'Bank Payment Audit'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 border border-lime-400/30 text-lime-300 text-[11px] font-black uppercase">
                  {locale === 'ar' ? 'مباشر' : 'Live Receipts'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
                {locale === 'ar'
                  ? 'مراجعة وتأكيد إيصالات التحويل البنكي لتحويل الطلبات تلقائياً للسائقين والتجهيز.'
                  : 'Audit incoming bank payment proofs, verify transaction IDs, and release orders for instant driver dispatch.'}
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-auto relative shrink-0">
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث برقم الطلب أو المرجع...' : 'Search Order # or Reference...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-72 pl-10 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-lime-400 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-3.5" />
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {locale === 'ar' ? 'التحويلات المعلقة' : 'Pending Verification'}
            </span>
            <span className="text-2xl font-black text-slate-900 block">
              {filteredPayments.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {locale === 'ar' ? 'إجمالي المبالغ المعلقة' : 'Pending Amount'}
            </span>
            <span className="text-2xl font-black text-[#05442e] block">
              {totalPendingAmount.toFixed(2)} <span className="text-xs font-bold text-slate-500">SAR</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {locale === 'ar' ? 'حالة التفتيش' : 'Audit Status'}
            </span>
            <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {locale === 'ar' ? 'نظام التأكيد الفوري' : 'Express Verification Active'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid of Payments */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white h-64 rounded-3xl animate-pulse border border-slate-200/80" />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200/80 shadow-xs my-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            {locale === 'ar' ? 'لا يوجد تحويلات بنكية معلقة حالياً' : 'All Bank Receipts Verified!'}
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            {locale === 'ar'
              ? 'تمت مراجعة جميع إيصالات التحويل البنكي وتأكيدها. لا يوجد أي طلبات بانتظار المراجعة.'
              : 'Every submitted bank transfer receipt has been audited. New incoming receipts will automatically appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPayments.map((pay) => {
            const proofUrl = pay.confirmation?.proof_file_url
              ? (pay.confirmation.proof_file_url.startsWith('http')
                  ? pay.confirmation.proof_file_url
                  : `http://localhost:5001${pay.confirmation.proof_file_url}`)
              : null;

            return (
              <div
                key={pay.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all duration-300 space-y-5 flex flex-col justify-between group"
              >
                {/* Header: Order Number & Amount */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                        #{pay.order?.order_number || pay.order_id}
                      </span>
                      <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                        {locale === 'ar' ? 'بانتظار التأكيد' : 'Pending Audit'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-bold flex items-center gap-1.5 pt-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pay.order?.customer?.first_name} {pay.order?.customer?.last_name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-[#05442e] block leading-tight">
                      {parseFloat(pay.amount || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">SAR</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      {locale === 'ar' ? 'المبلغ المستحق' : 'Transfer Amount'}
                    </span>
                  </div>
                </div>

                {/* Audit Details Box */}
                <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/70 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">{locale === 'ar' ? 'اسم البنك المصرفي:' : 'Bank Name:'}</span>
                    <span className="font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      {pay.confirmation?.bank_name || 'Al Rajhi Bank'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">{locale === 'ar' ? 'رقم المرجع / العملية:' : 'Payment Reference:'}</span>
                    <span className="font-mono text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                      {pay.confirmation?.payment_reference || 'REF-N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">{locale === 'ar' ? 'تاريخ التقديم:' : 'Submitted Date:'}</span>
                    <span className="text-slate-700 font-bold">
                      {new Date(pay.confirmation?.createdAt || pay.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Proof Slip Row */}
                  {proofUrl && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{locale === 'ar' ? 'إيصال التحويل:' : 'Receipt Slip:'}</span>
                      </span>

                      <button
                        onClick={() => setSelectedProofUrl(proofUrl)}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{locale === 'ar' ? 'عرض الإيصال' : 'View Proof Image'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Approve & Reject Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleVerify(pay.id)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-700/50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-lime-300" />
                    <span>{locale === 'ar' ? 'قبول وتأكيد التحويل' : 'Approve & Verify'}</span>
                  </button>

                  <button
                    onClick={() => handleReject(pay.id)}
                    className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs transition-all border border-rose-200/80 hover:border-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'رفض' : 'Reject'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Proof Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  {locale === 'ar' ? 'إيصال التحويل البنكي' : 'Bank Receipt Slip Proof'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-900 p-2 flex items-center justify-center">
              <img
                src={selectedProofUrl}
                alt="Bank Transfer Receipt Slip"
                className="max-w-full h-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={selectedProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'فتح الصورة بالكامل' : 'Open Full Image'}</span>
              </a>

              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

