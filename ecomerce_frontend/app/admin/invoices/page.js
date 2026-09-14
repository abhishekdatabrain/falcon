'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { FileText, Download, Search } from 'lucide-react';

export default function AdminInvoicesPage() {
  const { t, locale } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/invoices');
      if (res.success) {
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = invoices.filter((inv) => {
    const num = inv.invoice_number || '';
    const orderNum = inv.order?.order_number || '';
    return num.toLowerCase().includes(searchQuery.toLowerCase()) ||
           orderNum.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'بوابة الفواتير الإلكترونية (ZATCA)' : 'ZATCA E-Invoices Portal'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'إدارة وتصدير الفواتير الضريبية المعتمدة مع رمز الاستجابة السريعة TLV QR' : 'Saudi Phase 1 & 2 compliant tax invoices and PDF downloads'}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
          <input
            type="text"
            placeholder={locale === 'ar' ? 'بحث برقم الفاتورة أو الطلب...' : 'Search invoice or order #...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2.5 pl-9 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs w-full sm:w-64 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Invoices */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading ZATCA invoices...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No e-invoices generated yet. Invoices are automatically generated upon order completion.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inv) => (
            <div key={inv.id} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 hover:border-indigo-300 shadow-xs transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-extrabold text-slate-900 text-base">Invoice #{inv.invoice_number}</span>
                  <p className="text-xs text-slate-500">Order #{inv.order?.order_number}</p>
                </div>
                <span className="text-xl font-black text-indigo-700">{parseFloat(inv.total_amount).toFixed(2)} SAR</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <p><strong>ZATCA UUID:</strong> <span className="text-slate-500 break-all">{inv.uuid}</span></p>
                <p><strong>Subtotal:</strong> {parseFloat(inv.subtotal).toFixed(2)} SAR</p>
                <p><strong>VAT (15%):</strong> <span className="text-emerald-700 font-bold">{parseFloat(inv.tax_amount).toFixed(2)} SAR</span></p>
                <p><strong>Issue Date:</strong> {new Date(inv.issue_date || inv.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`http://localhost:5001/api/v1/invoices/${inv.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                >
                  <Download className="w-4 h-4" /> Download Official ZATCA PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
