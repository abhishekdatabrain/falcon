'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  Headphones,
  Ticket,
  Settings,
  Tag,
  MapPin,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Save,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

const STATUS_COLORS = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminContactSupportPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'settings' | 'categories' | 'locations'
  const [loading, setLoading] = useState(true);

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketFilters, setTicketFilters] = useState({
    status: 'ALL',
    category_code: 'ALL',
    search: '',
    fromDate: '',
    toDate: '',
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketStatusForm, setTicketStatusForm] = useState({ status: 'NEW', internal_notes: '' });
  const [savingTicket, setSavingTicket] = useState(false);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    support_email: '',
    support_phone: '',
    whatsapp_number: '',
    business_address_en: '',
    business_address_ar: '',
    support_hours_en: '',
    support_hours_ar: '',
    dispatch_hours_en: '',
    dispatch_hours_ar: '',
    live_chat_wait_en: '',
    live_chat_wait_ar: '',
    social_links: { facebook: '', instagram: '', twitter: '', linkedin: '' },
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState({ open: false, mode: 'create', data: null });
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name_en: '',
    name_ar: '',
    is_active: true,
    display_order: 0,
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Locations State
  const [locations, setLocations] = useState([]);
  const [locationModal, setLocationModal] = useState({ open: false, mode: 'create', data: null });
  const [locationForm, setLocationForm] = useState({
    name_en: '',
    name_ar: '',
    location_type: 'DISPATCH_HUB',
    badge_en: '',
    badge_ar: '',
    region_en: '',
    region_ar: '',
    address_en: '',
    address_ar: '',
    latitude: '',
    longitude: '',
    service_areas_en: '',
    service_areas_ar: '',
    support_hours_en: '',
    support_hours_ar: '',
    dispatch_hours_en: '',
    dispatch_hours_ar: '',
    is_active: true,
    display_order: 0,
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // Custom Confirm Delete Dialog (No browser confirm())
  const [confirmDelete, setConfirmDelete] = useState({ open: false, type: null, id: null, label: '' });
  const [deleting, setDeleting] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (ticketFilters.status !== 'ALL') params.append('status', ticketFilters.status);
      if (ticketFilters.category_code !== 'ALL') params.append('category_code', ticketFilters.category_code);
      if (ticketFilters.search.trim()) params.append('search', ticketFilters.search.trim());
      if (ticketFilters.fromDate) params.append('fromDate', ticketFilters.fromDate);
      if (ticketFilters.toDate) params.append('toDate', ticketFilters.toDate);

      const res = await fetchApi(`/contact/admin/tickets?${params.toString()}`);
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load tickets', 'error');
    }
  }, [ticketFilters, showToast]);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [setRes, catRes, locRes] = await Promise.all([
        fetchApi('/contact/admin/settings'),
        fetchApi('/contact/admin/categories'),
        fetchApi('/contact/admin/locations'),
      ]);

      if (setRes.success && setRes.data?.settings) {
        const s = setRes.data.settings;
        setSettingsForm({
          support_email: s.support_email || '',
          support_phone: s.support_phone || '',
          whatsapp_number: s.whatsapp_number || '',
          business_address_en: s.business_address_en || '',
          business_address_ar: s.business_address_ar || '',
          support_hours_en: s.support_hours_en || '',
          support_hours_ar: s.support_hours_ar || '',
          dispatch_hours_en: s.dispatch_hours_en || '',
          dispatch_hours_ar: s.dispatch_hours_ar || '',
          live_chat_wait_en: s.live_chat_wait_en || '',
          live_chat_wait_ar: s.live_chat_wait_ar || '',
          social_links: {
            facebook: s.social_links?.facebook || '',
            instagram: s.social_links?.instagram || '',
            twitter: s.social_links?.twitter || '',
            linkedin: s.social_links?.linkedin || '',
          },
        });
      }
      if (catRes.success && catRes.data?.categories) {
        setCategories(catRes.data.categories);
      }
      if (locRes.success && locRes.data?.locations) {
        setLocations(locRes.data.locations);
      }
      await loadTickets();
    } catch (err) {
      showToast(err.message || 'Failed to load contact management data', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadTickets, showToast]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadAllAdminData();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      loadTickets();
    }, 0);
    return () => clearTimeout(t);
  }, [ticketFilters.status, ticketFilters.category_code, ticketFilters.fromDate, ticketFilters.toDate]);

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetchApi('/contact/admin/settings', {
        method: 'PUT',
        body: settingsForm,
      });
      if (res.success) {
        showToast(isAr ? 'تم حفظ إعدادات التواصل بنجاح ✓' : 'Contact settings saved successfully ✓', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save contact settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Ticket Update
  const openTicketModal = (t) => {
    setSelectedTicket(t);
    setTicketStatusForm({
      status: t.status || 'NEW',
      internal_notes: t.internal_notes || '',
    });
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setSavingTicket(true);
    try {
      const res = await fetchApi(`/contact/admin/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        body: ticketStatusForm,
      });
      if (res.success && res.data?.ticket) {
        showToast(isAr ? 'تم تحديث التذكرة بنجاح' : 'Ticket updated successfully', 'success');
        setSelectedTicket(null);
        loadTickets();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update ticket', 'error');
    } finally {
      setSavingTicket(false);
    }
  };

  // Category CRUD
  const openCategoryModal = (mode, cat = null) => {
    if (mode === 'edit' && cat) {
      setCategoryForm({
        code: cat.code,
        name_en: cat.name_en,
        name_ar: cat.name_ar,
        is_active: cat.is_active,
        display_order: cat.display_order || 0,
      });
    } else {
      setCategoryForm({
        code: '',
        name_en: '',
        name_ar: '',
        is_active: true,
        display_order: categories.length + 1,
      });
    }
    setCategoryModal({ open: true, mode, data: cat });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const url = categoryModal.mode === 'edit'
        ? `/contact/admin/categories/${categoryModal.data.id}`
        : '/contact/admin/categories';
      const method = categoryModal.mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetchApi(url, { method, body: categoryForm });
      if (res.success) {
        showToast(isAr ? 'تم حفظ الفئة بنجاح' : 'Inquiry category saved', 'success');
        setCategoryModal({ open: false, mode: 'create', data: null });
        const catRes = await fetchApi('/contact/admin/categories');
        if (catRes.success) setCategories(catRes.data.categories || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      const res = await fetchApi(`/contact/admin/categories/${cat.id}`, {
        method: 'PUT',
        body: { is_active: !cat.is_active },
      });
      if (res.success) {
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c)));
        showToast('Category status updated', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Location CRUD
  const openLocationModal = (mode, loc = null) => {
    if (mode === 'edit' && loc) {
      setLocationForm({
        name_en: loc.name_en || '',
        name_ar: loc.name_ar || '',
        location_type: loc.location_type || 'DISPATCH_HUB',
        badge_en: loc.badge_en || '',
        badge_ar: loc.badge_ar || '',
        region_en: loc.region_en || '',
        region_ar: loc.region_ar || '',
        address_en: loc.address_en || '',
        address_ar: loc.address_ar || '',
        latitude: loc.latitude ?? '',
        longitude: loc.longitude ?? '',
        service_areas_en: loc.service_areas_en || '',
        service_areas_ar: loc.service_areas_ar || '',
        support_hours_en: loc.support_hours_en || '',
        support_hours_ar: loc.support_hours_ar || '',
        dispatch_hours_en: loc.dispatch_hours_en || '',
        dispatch_hours_ar: loc.dispatch_hours_ar || '',
        is_active: loc.is_active !== false,
        display_order: loc.display_order || 0,
      });
    } else {
      setLocationForm({
        name_en: '',
        name_ar: '',
        location_type: 'DISPATCH_HUB',
        badge_en: '',
        badge_ar: '',
        region_en: '',
        region_ar: '',
        address_en: '',
        address_ar: '',
        latitude: '',
        longitude: '',
        service_areas_en: '',
        service_areas_ar: '',
        support_hours_en: 'Sun – Thu: 8:00 AM – 6:00 PM',
        support_hours_ar: 'الأحد – الخميس: 8:00 ص – 6:00 م',
        dispatch_hours_en: 'Operating 24/7',
        dispatch_hours_ar: 'يعمل 24/7',
        is_active: true,
        display_order: locations.length + 1,
      });
    }
    setLocationModal({ open: true, mode, data: loc });
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      const url = locationModal.mode === 'edit'
        ? `/contact/admin/locations/${locationModal.data.id}`
        : '/contact/admin/locations';
      const method = locationModal.mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetchApi(url, { method, body: locationForm });
      if (res.success) {
        showToast(isAr ? 'تم حفظ الموقع بنجاح' : 'Location saved successfully', 'success');
        setLocationModal({ open: false, mode: 'create', data: null });
        const locRes = await fetchApi('/contact/admin/locations');
        if (locRes.success) setLocations(locRes.data.locations || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save location', 'error');
    } finally {
      setSavingLocation(false);
    }
  };

  // Delete Handler (Custom Modal)
  const handleConfirmDelete = async () => {
    if (!confirmDelete.id || !confirmDelete.type) return;
    setDeleting(true);
    try {
      const endpoint = confirmDelete.type === 'category'
        ? `/contact/admin/categories/${confirmDelete.id}`
        : `/contact/admin/locations/${confirmDelete.id}`;
      const res = await fetchApi(endpoint, { method: 'DELETE' });
      if (res.success) {
        showToast('Deleted successfully', 'success');
        if (confirmDelete.type === 'category') {
          setCategories((prev) => prev.filter((c) => c.id !== confirmDelete.id));
        } else {
          setLocations((prev) => prev.filter((l) => l.id !== confirmDelete.id));
        }
        setConfirmDelete({ open: false, type: null, id: null, label: '' });
      }
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#043927]">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              {isAr ? 'إدارة التواصل والدعم الفني' : 'Contact & Support Management'}
            </h1>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'إدارة تذاكر الدعم ومعلومات التواصل وفئات الاستفسار ومواقع الفروع.'
                : 'Manage customer support tickets, contact channels, inquiry categories & hub locations.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAllAdminData}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        {[
          { key: 'tickets', label: isAr ? 'تذاكر الدعم' : 'Support Tickets', icon: Ticket, count: tickets.length },
          { key: 'settings', label: isAr ? 'معلومات التواصل' : 'Contact Info', icon: Settings },
          { key: 'categories', label: isAr ? 'فئات الاستفسار' : 'Inquiry Categories', icon: Tag, count: categories.length },
          { key: 'locations', label: isAr ? 'المواقع والمراكز' : 'Office & Dispatch Locations', icon: MapPin, count: locations.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                active
                  ? 'bg-[#043927] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: SUPPORT TICKETS ==================== */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket #, name, email, mobile, order..."
                value={ticketFilters.search}
                onChange={(e) => setTicketFilters((p) => ({ ...p, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && loadTickets()}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={ticketFilters.status}
              onChange={(e) => setTicketFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              value={ticketFilters.category_code}
              onChange={(e) => setTicketFilters((p) => ({ ...p, category_code: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.code}>{c.name_en}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadTickets}
              className="px-4 py-2 rounded-xl bg-[#043927] text-white font-bold hover:bg-[#02281b] cursor-pointer"
            >
              Apply Filters
            </button>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-bold">Ticket #</th>
                  <th className="p-3 font-bold">Customer</th>
                  <th className="p-3 font-bold">Category</th>
                  <th className="p-3 font-bold">Order Ref</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Submitted</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No support tickets found matching your filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-[#043927]">{t.ticket_number}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.full_name}</div>
                        <div className="text-[11px] text-slate-500">{t.email} • {t.mobile}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{t.category_name || t.category_code}</td>
                      <td className="p-3 font-mono text-slate-600">{t.order_number || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[t.status] || STATUS_COLORS.NEW}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => openTicketModal(t)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#043927] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CONTACT SETTINGS ==================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                required
                value={settingsForm.support_email}
                onChange={(e) => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Phone (Toll-Free)</label>
              <input
                type="text"
                required
                value={settingsForm.support_phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, support_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Support Number</label>
              <input
                type="text"
                required
                value={settingsForm.whatsapp_number}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Address (English)</label>
              <textarea
                rows={2}
                value={settingsForm.business_address_en}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_address_en: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Address (Arabic)</label>
              <textarea
                rows={2}
                dir="rtl"
                value={settingsForm.business_address_ar}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_address_ar: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Hours (EN)</label>
              <input
                type="text"
                value={settingsForm.support_hours_en}
                onChange={(e) => setSettingsForm({ ...settingsForm, support_hours_en: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dispatch Hours (EN)</label>
              <input
                type="text"
                value={settingsForm.dispatch_hours_en}
                onChange={(e) => setSettingsForm({ ...settingsForm, dispatch_hours_en: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Live Chat Wait Time (EN)</label>
              <input
                type="text"
                value={settingsForm.live_chat_wait_en}
                onChange={(e) => setSettingsForm({ ...settingsForm, live_chat_wait_en: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-black text-slate-800 mb-3">Social Media Links (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {['facebook', 'instagram', 'twitter', 'linkedin'].map((net) => (
                <div key={net}>
                  <label className="block font-bold text-slate-600 capitalize mb-1">{net}</label>
                  <input
                    type="url"
                    placeholder={`https://${net}.com/...`}
                    value={settingsForm.social_links[net] || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        social_links: { ...settingsForm.social_links, [net]: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Contact Info</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================== TAB 3: INQUIRY CATEGORIES ==================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-slate-900 text-sm">Inquiry Categories</h2>
            <button
              type="button"
              onClick={() => openCategoryModal('create')}
              className="px-4 py-2 rounded-xl bg-[#043927] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-bold">Order</th>
                  <th className="p-3 font-bold">Code</th>
                  <th className="p-3 font-bold">Name (EN)</th>
                  <th className="p-3 font-bold">Name (AR)</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold">{cat.display_order}</td>
                    <td className="p-3 font-mono text-slate-600">{cat.code}</td>
                    <td className="p-3 font-bold text-slate-900">{cat.name_en}</td>
                    <td className="p-3 text-slate-700" dir="rtl">{cat.name_ar}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                          cat.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openCategoryModal('edit', cat)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ open: true, type: 'category', id: cat.id, label: cat.name_en })}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: OFFICE & DISPATCH LOCATIONS ==================== */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-slate-900 text-sm">Office & Dispatch Locations</h2>
            <button
              type="button"
              onClick={() => openLocationModal('create')}
              className="px-4 py-2 rounded-xl bg-[#043927] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <div key={loc.id} className="border border-slate-200 rounded-2xl p-4 space-y-2 text-xs bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">{loc.location_type}</span>
                    <span className="text-slate-400 font-bold">Order: {loc.display_order}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${loc.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button type="button" onClick={() => openLocationModal('edit', loc)} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setConfirmDelete({ open: true, type: 'location', id: loc.id, label: loc.name_en })} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-black text-slate-900 text-sm">{loc.name_en}</h3>
                <p className="text-slate-600">{loc.address_en}</p>
                <div className="text-[11px] text-slate-500">
                  Coordinates: <span className="font-mono">{loc.latitude || 'N/A'}, {loc.longitude || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL: TICKET DETAILS ==================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-black text-[#043927] text-sm">{selectedTicket.ticket_number}</span>
                <p className="text-slate-500 text-[11px]">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div><span className="text-slate-400 block">Customer Name:</span><strong className="text-slate-900">{selectedTicket.full_name}</strong></div>
              <div><span className="text-slate-400 block">Email:</span><strong className="text-slate-900">{selectedTicket.email}</strong></div>
              <div><span className="text-slate-400 block">Mobile:</span><strong className="text-slate-900">{selectedTicket.mobile}</strong></div>
              <div><span className="text-slate-400 block">Category:</span><strong className="text-slate-900">{selectedTicket.category_name || selectedTicket.category_code}</strong></div>
              {selectedTicket.order_number && (
                <div className="sm:col-span-2"><span className="text-slate-400 block">Order Reference:</span><strong className="font-mono text-[#043927]">{selectedTicket.order_number}</strong></div>
              )}
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Customer Message:</span>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.message}
              </div>
            </div>

            {selectedTicket.attachment_url && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Attachment:</span>
                <a
                  href={getImageUrl(selectedTicket.attachment_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#043927] font-bold hover:bg-emerald-100"
                >
                  <span>{selectedTicket.attachment_name || 'View Attachment'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Ticket Status</label>
                <select
                  value={ticketStatusForm.status}
                  onChange={(e) => setTicketStatusForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="NEW">NEW</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add internal resolution notes..."
                  value={ticketStatusForm.internal_notes}
                  onChange={(e) => setTicketStatusForm((p) => ({ ...p, internal_notes: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSelectedTicket(null)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer">
                Close
              </button>
              <button
                type="button"
                onClick={handleUpdateTicket}
                disabled={savingTicket}
                className="px-5 py-2 rounded-xl bg-[#043927] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {savingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Ticket Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CATEGORY FORM ==================== */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCategory} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {categoryModal.mode === 'edit' ? 'Edit Inquiry Category' : 'Add Inquiry Category'}
              </h3>
              <button type="button" onClick={() => setCategoryModal({ open: false, mode: 'create', data: null })} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryModal.mode === 'create' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DELIVERY_ISSUE"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Name (English) *</label>
              <input
                type="text"
                required
                value={categoryForm.name_en}
                onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Name (Arabic) *</label>
              <input
                type="text"
                dir="rtl"
                required
                value={categoryForm.name_ar}
                onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div className="flex items-center pt-5 gap-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                />
                <label htmlFor="catActive" className="font-bold text-slate-700">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCategoryModal({ open: false, mode: 'create', data: null })} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={savingCategory} className="px-5 py-2 rounded-xl bg-[#043927] text-white font-bold cursor-pointer">
                {savingCategory ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: LOCATION FORM ==================== */}
      {locationModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveLocation} className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 text-xs shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {locationModal.mode === 'edit' ? 'Edit Office / Dispatch Location' : 'Add Office / Dispatch Location'}
              </h3>
              <button type="button" onClick={() => setLocationModal({ open: false, mode: 'create', data: null })} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Name (EN) *</label>
                <input type="text" required value={locationForm.name_en} onChange={(e) => setLocationForm({ ...locationForm, name_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Name (AR) *</label>
                <input type="text" dir="rtl" required value={locationForm.name_ar} onChange={(e) => setLocationForm({ ...locationForm, name_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Type</label>
                <select value={locationForm.location_type} onChange={(e) => setLocationForm({ ...locationForm, location_type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                  <option value="HQ">HQ</option>
                  <option value="DISPATCH_HUB">DISPATCH_HUB</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                  <option value="MICRO_HUB">MICRO_HUB</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Region / Badge (EN)</label>
                <input type="text" placeholder="e.g. Riyadh Central" value={locationForm.region_en} onChange={(e) => setLocationForm({ ...locationForm, region_en: e.target.value, badge_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Full Address (EN) *</label>
                <input type="text" required value={locationForm.address_en} onChange={(e) => setLocationForm({ ...locationForm, address_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Full Address (AR)</label>
                <input type="text" dir="rtl" value={locationForm.address_ar} onChange={(e) => setLocationForm({ ...locationForm, address_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                <input type="number" step="any" placeholder="24.7136" value={locationForm.latitude} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                <input type="number" step="any" placeholder="46.6753" value={locationForm.longitude} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Service Areas (EN)</label>
                <input type="text" value={locationForm.service_areas_en} onChange={(e) => setLocationForm({ ...locationForm, service_areas_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Support Hours (EN)</label>
                <input type="text" value={locationForm.support_hours_en} onChange={(e) => setLocationForm({ ...locationForm, support_hours_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dispatch Hours (EN)</label>
                <input type="text" value={locationForm.dispatch_hours_en} onChange={(e) => setLocationForm({ ...locationForm, dispatch_hours_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                <input type="number" value={locationForm.display_order} onChange={(e) => setLocationForm({ ...locationForm, display_order: parseInt(e.target.value, 10) || 0 })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div className="flex items-center pt-5 gap-2">
                <input type="checkbox" id="locActive" checked={locationForm.is_active} onChange={(e) => setLocationForm({ ...locationForm, is_active: e.target.checked })} />
                <label htmlFor="locActive" className="font-bold text-slate-700">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setLocationModal({ open: false, mode: 'create', data: null })} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={savingLocation} className="px-5 py-2 rounded-xl bg-[#043927] text-white font-bold cursor-pointer">
                {savingLocation ? 'Saving...' : 'Save Location'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: CUSTOM CONFIRM DELETE ==================== */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-xs shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-sm text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-slate-600">
              Are you sure you want to delete <strong>{confirmDelete.label}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setConfirmDelete({ open: false, type: null, id: null, label: '' })} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
