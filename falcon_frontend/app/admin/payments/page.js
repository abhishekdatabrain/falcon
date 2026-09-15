'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { Landmark, CheckCircle2, XCircle, Clock, Eye, FileText, Search, User, ExternalLink, X } from 'lucide-react';

export default function AdminPaymentsPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة التحويلات البنكية' : 'Bank Payment Verification'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'مراجعة إيصالات التحويل البنكي وتأكيدها لبدء التوصيل' : 'Audit uploaded bank transfer receipts and approve orders for delivery'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5" />
          <input
            type="text"
            placeholder={locale === 'ar' ? 'بحث برقم الطلب أو المرجع...' : 'Search order # or reference...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2.5 pl-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs w-full sm:w-64 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Grid of Pending Payments */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading pending bank receipts...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">{locale === 'ar' ? 'لا يوجد تحويلات بنكية معلقة' : 'No Pending Payments'}</h3>
          <p className="text-xs text-slate-500">All submitted bank transfer receipts have been audited.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPayments.map((pay) => (
            <div key={pay.id} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 hover:border-amber-300 shadow-xs transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-extrabold text-slate-900 text-base">Order #{pay.order?.order_number}</span>
                  <p className="text-xs text-slate-500">Customer: {pay.order?.customer?.first_name} {pay.order?.customer?.last_name}</p>
                </div>
                <span className="text-xl font-black text-amber-600">{parseFloat(pay.amount).toFixed(2)} SAR</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-semibold text-slate-900">{pay.confirmation?.bank_name || 'Al Rajhi Bank'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Reference:</span>
                  <span className="font-mono text-cyan-700 font-bold">{pay.confirmation?.payment_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted Date:</span>
                  <span className="text-slate-700">{new Date(pay.confirmation?.createdAt || pay.createdAt).toLocaleString()}</span>
                </div>
                {pay.confirmation?.proof_file_url && (
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Payment Proof Slip:</span>
                    <button
                      onClick={() => setSelectedProofUrl(`http://localhost:5001${pay.confirmation.proof_file_url}`)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Receipt Image
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleVerify(pay.id)}
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" /> {locale === 'ar' ? 'قبول وتأكيد التحويل' : 'Approve & Verify'}
                </button>
                <button
                  onClick={() => handleReject(pay.id)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 flex items-center justify-center gap-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4" /> {locale === 'ar' ? 'رفض' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Bank Receipt Proof File</h3>
              <button onClick={() => setSelectedProofUrl(null)} className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
              <img src={selectedProofUrl} alt="Bank Transfer Slip" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
            <button onClick={() => setSelectedProofUrl(null)} className="btn-secondary w-full text-xs bg-slate-100 border-slate-200 text-slate-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
