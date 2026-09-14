'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import {
  Bell,
  Send,
  Search,
  Trash2,
  X,
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const { t, locale } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    target_audience: 'ALL_CUSTOMERS',
    user_id: '',
    type: 'SYSTEM_UPDATE',
    title_en: '',
    title_ar: '',
    body_en: '',
    body_ar: '',
  });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const url = activeTypeFilter === 'ALL' ? '/admin/notifications' : `/admin/notifications?type=${activeTypeFilter}`;
      const res = await fetchApi(url);
      if (res.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTypeFilter]);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      const res = await fetchApi('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (res.success) {
        alert(locale === 'ar' ? 'تم إرسال الإشعار بنجاح!' : 'Notification broadcasted successfully!');
        setShowModal(false);
        setForm({
          target_audience: 'ALL_CUSTOMERS',
          user_id: '',
          type: 'SYSTEM_UPDATE',
          title_en: '',
          title_ar: '',
          body_en: '',
          body_ar: '',
        });
        await loadNotifications();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification log?')) return;
    try {
      const res = await fetchApi(`/admin/notifications/${notificationId}`, { method: 'DELETE' });
      if (res.success) {
        await loadNotifications();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const notificationTypes = [
    { key: 'ALL', label: 'All Notifications' },
    { key: 'ORDER_CONFIRMATION', label: 'Order Confirmation' },
    { key: 'PAYMENT_CONFIRMATION', label: 'Payment Confirmation' },
    { key: 'DRIVER_ASSIGNMENT', label: 'Driver Assignment' },
    { key: 'ORDER_STATUS_CHANGED', label: 'Order Status' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERY_COMPLETED', label: 'Delivery Completion' },
    { key: 'SYSTEM_UPDATE', label: 'System Updates' },
  ];

  const filtered = notifications.filter((n) => {
    const title = (locale === 'ar' ? n.title_ar : n.title_en) || '';
    const userEmail = n.user?.email || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           userEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shadow-xs">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة الإشعارات والتنبيهات' : 'System Notification Management'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'إدارة وتوجيه إشعارات الطلبات والدفع والسائق والتحديثات' : 'Manage & broadcast order, payment, driver assignment, delivery & system notifications'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs py-3 px-5 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
        >
          <Send className="w-4 h-4" /> {locale === 'ar' ? 'إرسال إشعار جديد' : 'Broadcast Notification'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {notificationTypes.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTypeFilter === t.key
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-2.5 left-3" />
          <input
            type="text"
            placeholder={locale === 'ar' ? 'بحث بالإشعار أو البريد...' : 'Search title or recipient...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs w-full sm:w-56 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Notification Logs List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading system notification logs...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No notifications match the selected filter type.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {locale === 'ar' ? n.title_ar : n.title_en}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    n.type === 'ORDER_CONFIRMATION' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    n.type === 'PAYMENT_CONFIRMATION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    n.type === 'DRIVER_ASSIGNMENT' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    n.type === 'DELIVERY_COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {n.type}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {locale === 'ar' ? n.body_ar : n.body_en}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Recipient: <strong className="text-slate-800 font-mono">{n.user?.email || 'System User'}</strong> ({n.user?.role})</span>
                  <span>Sent: {new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" /> Send System Notification
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Target Audience</label>
                <select
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                  required
                >
                  <option value="ALL_CUSTOMERS">All Customers</option>
                  <option value="ALL_DRIVERS">All Drivers</option>
                  <option value="ALL_USERS">All Registered Users</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Notification Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                  required
                >
                  <option value="ORDER_CONFIRMATION">Order Confirmation</option>
                  <option value="PAYMENT_CONFIRMATION">Payment Confirmation</option>
                  <option value="DRIVER_ASSIGNMENT">Driver Assignment</option>
                  <option value="ORDER_STATUS_CHANGED">Order Status</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERY_COMPLETED">Delivery Completion</option>
                  <option value="SYSTEM_UPDATE">System Update</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Title (English)</label>
                  <input type="text" required placeholder="Important Update" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">العنوان (بالعربية)</label>
                  <input type="text" required placeholder="تحديث هام" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Message Body (English)</label>
                <textarea required rows={2} placeholder="Your order status has been updated..." value={form.body_en} onChange={(e) => setForm({ ...form, body_en: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">نص الرسالة (بالعربية)</label>
                <textarea required rows={2} placeholder="تم تحديث حالة طلبك بنجاح..." value={form.body_ar} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm py-2.5 bg-slate-100 border-slate-200 text-slate-700">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1 text-sm py-2.5 bg-purple-600 hover:bg-purple-700 text-white">{sending ? 'Broadcasting...' : 'Send Broadcast'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
