'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import {
  Truck,
  UserPlus,
  Phone,
  Mail,
  Search,
  Edit3,
  MapPin,
  PackageCheck,
  History,
  ShieldCheck,
  ShieldAlert,
  Filter,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  Navigation,
  Compass,
  CreditCard,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function AdminDriversPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // ALL, AVAILABLE, BUSY, OFFLINE
  const [accountFilter, setAccountFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Modals & States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Active Selected Driver
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Forms
  const [driverForm, setDriverForm] = useState({
    id: '',
    email: '',
    mobile: '',
    password: '',
    license_number: '',
    vehicle_details: '',
  });

  const [assignForm, setAssignForm] = useState({
    order_id: '',
    reassignment_reason: '',
  });

  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [historyDeliveries, setHistoryDeliveries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [serverStats, setServerStats] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (availabilityFilter !== 'ALL') params.append('availability', availabilityFilter);
      if (accountFilter !== 'ALL') params.append('accountStatus', accountFilter);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const [drvRes, ordRes] = await Promise.all([
        fetchApi(`/admin/drivers${queryString}`),
        fetchApi('/orders').catch(() => ({ success: false })),
      ]);

      if (drvRes.success) {
        setDrivers(drvRes.data?.drivers || []);
        if (drvRes.data?.stats) {
          setServerStats(drvRes.data.stats);
        }
      }

      if (ordRes.success) {
        const rawOrders = ordRes.data?.orders?.orders || ordRes.data?.orders || (Array.isArray(ordRes.data) ? ordRes.data : []);
        setAllOrders(rawOrders);
      }
    } catch (err) {
      console.error('Failed to load drivers or orders data:', err);
      showToast(err.message || 'Failed to fetch driver fleet', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, availabilityFilter, accountFilter]);

  // Server-side filtered drivers
  const filteredDrivers = drivers;

  // Fleet Statistics
  const totalCount = serverStats?.total ?? drivers.length;
  const availableCount = serverStats?.available ?? drivers.filter((d) => d.availability_status === 'AVAILABLE').length;
  const busyCount = serverStats?.busy ?? drivers.filter((d) => d.availability_status === 'BUSY').length;
  const offlineCount = serverStats?.offline ?? drivers.filter((d) => d.availability_status === 'OFFLINE').length;
  const activeAccountCount = serverStats?.activeAccount ?? drivers.filter((d) => d.user?.status === 'ACTIVE').length;

  // 1. Create Driver Handler
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchApi('/admin/drivers', {
        method: 'POST',
        body: JSON.stringify(driverForm),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم إضافة السائق بنجاح!' : 'New driver account created successfully!',
          'success'
        );
        setShowCreateModal(false);
        setDriverForm({ id: '', email: '', mobile: '', password: '', license_number: '', vehicle_details: '' });
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Edit Driver Profile Handler
  const openEditModal = (drv) => {
    setSelectedDriver(drv);
    setDriverForm({
      id: drv.id,
      email: drv.user?.email || '',
      mobile: drv.user?.mobile || '',
      password: '',
      license_number: drv.license_number || '',
      vehicle_details: drv.vehicle_details || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/drivers/${driverForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(driverForm),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث بيانات السائق بنجاح!' : 'Driver profile updated successfully!',
          'success'
        );
        setShowEditModal(false);
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Toggle Availability Handler (AVAILABLE / BUSY / OFFLINE)
  const handleToggleAvailability = async (driverId, nextAvail) => {
    try {
      const res = await fetchApi(`/admin/drivers/${driverId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ availabilityStatus: nextAvail }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? `تم تغيير حالة الحضور إلى ${nextAvail}` : `Driver status updated to ${nextAvail}`,
          'info'
        );
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Status change failed', 'error');
    }
  };

  // 4. Toggle Account Status Handler (ACTIVE / INACTIVE)
  const handleToggleAccountStatus = async (driverId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/drivers/${driverId}/account-status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? `تم تغيير حالة الحساب إلى ${newStatus}` : `Driver account ${newStatus.toLowerCase()}`,
          'info'
        );
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Account status toggle failed', 'error');
    }
  };

  // 5. Open Assign Order Modal
  const openAssignModal = (drv) => {
    setSelectedDriver(drv);
    setAssignForm({ order_id: '', reassignment_reason: '' });
    setShowAssignModal(true);
  };

  const handleAssignOrder = async (e) => {
    e.preventDefault();
    if (!assignForm.order_id || !selectedDriver) return;
    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/orders/${assignForm.order_id}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify({
          driverId: selectedDriver.id,
          reassignmentReason: assignForm.reassignment_reason,
        }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تعيين السائق للطلب بنجاح!' : 'Order assigned to driver successfully!',
          'success'
        );
        setShowAssignModal(false);
        setAssignForm({ order_id: '', reassignment_reason: '' });
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Order assignment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. View Driver Delivery History Modal
  const openHistoryModal = async (drv) => {
    setSelectedDriver(drv);
    setShowHistoryModal(true);
    try {
      setHistoryLoading(true);
      const res = await fetchApi(`/admin/drivers/${drv.id}`);
      if (res.success && res.data.driver) {
        setHistoryDeliveries(res.data.driver.deliveries || []);
      } else {
        setHistoryDeliveries(drv.deliveries || []);
      }
    } catch (err) {
      setHistoryDeliveries(drv.deliveries || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 7. Track GPS Location Modal
  const openGpsModal = async (drv) => {
    setSelectedDriver(drv);
    setShowGpsModal(true);
    try {
      setGpsLoading(true);
      const res = await fetchApi(`/admin/drivers/${drv.id}/location`);
      if (res.success) {
        setGpsData(res.data?.location || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shadow-xs shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {locale === 'ar' ? 'إدارة أسطول السائقين والتوصيل' : 'Driver Fleet Management'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                {totalCount} {locale === 'ar' ? 'سائق' : 'Fleet Total'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {locale === 'ar'
                ? 'متابعة أداء السائقين، تعيين الطلبات، تتبع الموقع الجغرافي GPS، وسجل التوصيل'
                : 'Monitor driver availability, assign orders, inspect delivery history, and track real-time GPS locations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer"
            title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh Fleet'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setDriverForm({ id: '', email: '', mobile: '', password: '', license_number: '', vehicle_details: '' });
              setShowCreateModal(true);
            }}
            className="text-xs font-bold py-3 px-5 rounded-xl flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <UserPlus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة سائق جديد' : 'Create New Driver'}
          </button>
        </div>
      </div>

      {/* Fleet KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'إجمالي الأسطول' : 'Total Fleet'}</div>
            <div className="text-xl font-black text-slate-900">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'متاح للتوصيل' : 'Available Drivers'}</div>
            <div className="text-xl font-black text-emerald-700">{availableCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'قيد التوصيل (مشغول)' : 'Busy / On Delivery'}</div>
            <div className="text-xl font-black text-amber-700">{busyCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <X className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{locale === 'ar' ? 'غير متصل (Off)' : 'Offline Drivers'}</div>
            <div className="text-xl font-black text-slate-700">{offlineCount}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Availability Filter */}
          <div className="relative w-full sm:w-48">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-cyan-500 outline-hidden cursor-pointer appearance-none"
            >
              <option value="ALL">{locale === 'ar' ? 'جميع حالات الحضور' : 'All Availability'}</option>
              <option value="AVAILABLE">AVAILABLE (متاح)</option>
              <option value="BUSY">BUSY (مشغول)</option>
              <option value="OFFLINE">OFFLINE (غير متصل)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div className="relative w-full sm:w-44">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-cyan-500 outline-hidden cursor-pointer"
            >
              <option value="ALL">{locale === 'ar' ? 'جميع الحسابات' : 'All Accounts'}</option>
              <option value="ACTIVE">{locale === 'ar' ? 'الحسابات النشطة' : 'Active Only'}</option>
              <option value="INACTIVE">{locale === 'ar' ? 'الحسابات المعطلة' : 'Disabled Only'}</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={locale === 'ar' ? 'بحث بالبريد، الجوال أو الرخصة...' : 'Search email, mobile, license...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Drivers Management Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'جاري تحميل أسطول السائقين...' : 'Loading driver fleet management table...'}</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {searchQuery || availabilityFilter !== 'ALL' || accountFilter !== 'ALL'
              ? (locale === 'ar' ? 'لم يتم العثور على سائقين يطابقون نتائج البحث' : 'No drivers match your search or status filter')
              : (locale === 'ar' ? 'لا يوجد سائقين مسجلين بعد' : 'No driver accounts registered yet')}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setAvailabilityFilter('ALL'); setAccountFilter('ALL'); setShowCreateModal(true); }}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition-all cursor-pointer"
          >
            + {locale === 'ar' ? 'إضافة سائق جديد' : 'Create New Driver'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'السائق' : 'Driver Account'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'بيانات المركبة والرخصة' : 'License & Vehicle'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'حالة الحضور' : 'Availability Status'}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'حالة الحساب' : 'Account Status'}</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">{locale === 'ar' ? 'التتبع والسجل' : 'Tracking & History'}</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.map((drv) => (
                  <tr key={drv.id} className="hover:bg-slate-50/80 transition-all">
                    {/* Driver & Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                          {drv.user?.email?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-cyan-600" />
                            {drv.user?.email || 'N/A'}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {drv.user?.mobile || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* License & Vehicle */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1 text-xs">
                        <div className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200 inline-block">
                          {drv.license_number}
                        </div>
                        <p className="text-slate-600 text-[11px] truncate max-w-xs">
                          {drv.vehicle_details || 'Standard Commercial Van'}
                        </p>
                      </div>
                    </td>

                    {/* Availability Status & Dropdown Toggle */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={drv.availability_status}
                        onChange={(e) => handleToggleAvailability(drv.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-extrabold border cursor-pointer outline-hidden transition-all ${
                          drv.availability_status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : drv.availability_status === 'BUSY'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <option value="AVAILABLE">AVAILABLE (متاح)</option>
                        <option value="BUSY">BUSY (مشغول)</option>
                        <option value="OFFLINE">OFFLINE (غير متصل)</option>
                      </select>
                    </td>

                    {/* Account Status Pill & Toggle */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                          drv.user?.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {drv.user?.status === 'ACTIVE' ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Disabled
                          </>
                        )}
                      </span>
                    </td>

                    {/* Tracking & Delivery History Buttons */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/drivers/${drv.id}`}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="View Driver Delivery History"
                        >
                          <History className="w-3.5 h-3.5" /> History ({(drv.deliveries || []).length})
                        </Link>

                        <button
                          onClick={() => openGpsModal(drv)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Track Driver GPS"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-600" /> GPS Track
                        </button>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Assign Order Button */}
                        <button
                          onClick={() => openAssignModal(drv)}
                          disabled={drv.availability_status === 'OFFLINE' || drv.user?.status !== 'ACTIVE'}
                          className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          title="Assign Order to Driver"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Assign Order
                        </button>

                        {/* Edit Driver Button */}
                        <button
                          onClick={() => openEditModal(drv)}
                          className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                          title="Edit Driver Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Activate/Deactivate Account Button */}
                        <button
                          onClick={() => handleToggleAccountStatus(drv.id, drv.user?.status)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                            drv.user?.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {drv.user?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create New Driver Account */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {locale === 'ar' ? 'إضافة سائق جديد' : 'Create Driver Account'}
                  </h3>
                  <p className="text-xs text-slate-500">Register new fleet driver credentials</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="createDriverForm" onSubmit={handleCreateDriver} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="driver@platform.com"
                  value={driverForm.email}
                  onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+966500000000"
                  value={driverForm.mobile}
                  onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={driverForm.password}
                  onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">License Number *</label>
                <input
                  type="text"
                  required
                  placeholder="SA-DL-987654321"
                  value={driverForm.license_number}
                  onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Vehicle Details</label>
                <input
                  type="text"
                  placeholder="Toyota Hilux 2024 (White) - License Plate 4321-KSA"
                  value={driverForm.vehicle_details}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicle_details: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="createDriverForm"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UserPlus className="w-4 h-4" />}
                <span>Create Driver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Driver Information */}
      {showEditModal && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Driver Information</h3>
                  <p className="text-xs text-slate-500">Update vehicle & license details</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="editDriverForm" onSubmit={handleUpdateDriver} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={driverForm.email}
                  onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  value={driverForm.mobile}
                  onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">License Number *</label>
                <input
                  type="text"
                  required
                  value={driverForm.license_number}
                  onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Vehicle Details</label>
                <input
                  type="text"
                  value={driverForm.vehicle_details}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicle_details: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editDriverForm"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Order to Driver */}
      {showAssignModal && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Assign Order to Driver</h3>
                  <p className="text-xs text-slate-500">Driver: {selectedDriver.user?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="assignOrderForm" onSubmit={handleAssignOrder} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Select Order *</label>
                <select
                  required
                  value={assignForm.order_id}
                  onChange={(e) => setAssignForm({ ...assignForm, order_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="">-- Choose an Order to Assign --</option>
                  {allOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      Order #{ord.order_number} ({ord.order_status}) - {parseFloat(ord.grand_total || 0).toFixed(2)} SAR
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Reassignment / Dispatch Note</label>
                <input
                  type="text"
                  placeholder="Optional notes for driver..."
                  value={assignForm.reassignment_reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reassignment_reason: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assignOrderForm"
                disabled={submitting || !assignForm.order_id}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PackageCheck className="w-4 h-4" />}
                <span>Assign Order</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Modal 5: Live Driver GPS Location Tracker */}
      {showGpsModal && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <Navigation className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Live Driver GPS Location</h3>
                  <p className="text-xs text-slate-500">{selectedDriver.user?.email} ({selectedDriver.vehicle_details || 'Van'})</p>
                </div>
              </div>
              <button onClick={() => setShowGpsModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 text-xs">
              {gpsLoading ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <div className="w-6 h-6 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p>Acquiring driver GPS satellite signal...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Map Preview Graphic */}
                  <div className="relative w-full h-48 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {/* Animated Radar Pulse */}
                    <div className="w-24 h-24 rounded-full bg-cyan-500/20 animate-ping absolute"></div>
                    <div className="w-12 h-12 rounded-full bg-cyan-500/40 animate-pulse absolute"></div>
                    <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg relative z-10 font-bold border-2 border-white">
                      <Truck className="w-5 h-5" />
                    </div>

                    {/* GPS Coordinates Badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700 backdrop-blur-xs font-mono text-[11px] flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>
                        {gpsData?.latitude || 24.7136}° N, {gpsData?.longitude || 46.6753}° E
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-emerald-500/90 text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      GPS Signal Active
                    </div>
                  </div>

                  {/* Coordinates Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Current Latitude</span>
                      <p className="font-extrabold text-slate-900 font-mono text-sm">{gpsData?.latitude || 24.7136}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Current Longitude</span>
                      <p className="font-extrabold text-slate-900 font-mono text-sm">{gpsData?.longitude || 46.6753}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Movement Speed</span>
                      <p className="font-extrabold text-slate-900 text-sm">{gpsData?.speed || 35} km/h</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Last Signal Ping</span>
                      <p className="font-extrabold text-slate-900 text-xs">
                        {gpsData?.updatedAt ? new Date(gpsData.updatedAt).toLocaleTimeString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowGpsModal(false)}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
              >
                Close Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
