'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import AdminPagination from '../../../src/components/AdminPagination';
import {
  Users,
  Search,
  UserPlus,
  Edit3,
  ShoppingBag,
  Phone,
  Mail,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Eye,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pageSize, setPageSize] = useState(10);

  // Modals & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const loadCustomers = async (search = searchQuery, status = statusFilter, page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (status && status !== 'ALL') {
        params.append('status', status);
      }
      params.append('page', page);
      params.append('limit', limit);

      const queryString = params.toString();
      const endpoint = `/admin/customers?${queryString}`;

      const res = await fetchApi(endpoint);
      if (res.success) {
        setCustomers(res.data.customers || res.data.records || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.totalRecords !== undefined ? res.data.pagination.totalRecords : (res.data.pagination.total || 0));
          setCurrentPage(res.data.pagination.currentPage || res.data.pagination.page || page);
        } else {
          setTotalPages(1);
          setTotalRecords((res.data.customers || []).length);
        }
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounced server-side fetch trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(searchQuery, statusFilter, 1, pageSize);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadCustomers(searchQuery, statusFilter, newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    loadCustomers(searchQuery, statusFilter, 1, newPageSize);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchApi('/admin/customers', {
        method: 'POST',
        body: JSON.stringify(customerForm),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم إضافة العميل بنجاح!' : 'Customer created successfully!', 'success');
        setShowAddModal(false);
        setCustomerForm({ id: '', first_name: '', last_name: '', email: '', mobile: '', password: '' });
        await loadCustomers(searchQuery, statusFilter, 1);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/customers/${customerForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(customerForm),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer updated successfully!', 'success');
        setShowEditModal(false);
        await loadCustomers(searchQuery, statusFilter, currentPage);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (customerId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/customers/${customerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? `تم تغيير حالة العميل إلى ${newStatus}` : `Customer status updated to ${newStatus}`,
          'info'
        );
        await loadCustomers(searchQuery, statusFilter, currentPage);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openEditModal = (c) => {
    setCustomerForm({
      id: c.id,
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      email: c.user?.email || '',
      mobile: c.user?.mobile || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const activeCount = stats.active ?? customers.filter((c) => c.user?.status === 'ACTIVE').length;
  const inactiveCount = stats.inactive ?? customers.filter((c) => c.user?.status === 'INACTIVE').length;
  const totalDisplay = stats.total ?? totalRecords ?? customers.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'إدارة العملاء المسجلين' : 'Customer Management'}
              </h1>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {totalDisplay} {locale === 'ar' ? 'عميل' : 'Total'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {locale === 'ar'
                ? 'عرض وتعديل بيانات العملاء، العناوين المحفوظة، وحالة الحساب'
                : 'Manage customer accounts, contact details, saved addresses, and active clearance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/roles"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{locale === 'ar' ? 'إدارة الصلاحيات (RBAC)' : 'Role-Based Access'}</span>
          </Link>

          <button
            onClick={() => loadCustomers(searchQuery, statusFilter, currentPage)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-all border border-slate-200 shadow-xs cursor-pointer"
            title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh Customers'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{locale === 'ar' ? 'إجمالي العملاء' : 'Total Registered'}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalDisplay}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Customer Shoppers</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{locale === 'ar' ? 'حسابات نشطة' : 'Active Accounts'}</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Verified Shoppers</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{locale === 'ar' ? 'حسابات معطلة' : 'Disabled Accounts'}</div>
            <div className="text-2xl font-black text-slate-700 mt-1">{inactiveCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Suspended Access</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Server Search & Status Select Box */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Select Box */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none rtl:left-auto rtl:right-3" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all cursor-pointer appearance-none rtl:pl-8 rtl:pr-9"
            >
              <option value="ALL">{locale === 'ar' ? 'جميع الحالات (الكل)' : 'All Statuses (All Accounts)'}</option>
              <option value="ACTIVE">{locale === 'ar' ? 'الحسابات النشطة فقط' : 'Active Accounts Only'}</option>
              <option value="INACTIVE">{locale === 'ar' ? 'الحسابات المعطلة فقط' : 'Disabled Accounts Only'}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] rtl:right-auto rtl:left-3">
              ▼
            </div>
          </div>
        </div>

        {/* Server Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو الجوال...' : 'Search name, email, or mobile...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all rtl:pl-8 rtl:pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer rtl:right-auto rtl:left-2.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer List Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'جاري تحميل العملاء المسجلين...' : 'Loading registered customers...'}</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {searchQuery || statusFilter !== 'ALL'
              ? (locale === 'ar' ? 'لم يتم العثور على عملاء يطابقون الفلتر' : 'No registered customers match your filter')
              : (locale === 'ar' ? 'لا يوجد عملاء مسجلين بعد' : 'No registered customers found')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 rtl:text-right border-collapse border border-gray-400">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3.5 border border-gray-300 text-center whitespace-nowrap w-14">{locale === 'ar' ? 'م' : 'Sr. No'}</th>
                  <th className="px-5 py-3.5 border border-gray-300 whitespace-nowrap">{locale === 'ar' ? 'العميل والهوية' : 'Customer Identity'}</th>
                  <th className="px-5 py-3.5 border border-gray-300 whitespace-nowrap">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</th>
                  <th className="px-5 py-3.5 border border-gray-300 whitespace-nowrap">{locale === 'ar' ? 'رقم الجوال' : 'Mobile Phone'}</th>
                  <th className="px-5 py-3.5 border border-gray-300 whitespace-nowrap">{locale === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}</th>
                  <th className="px-5 py-3.5 border border-gray-300 whitespace-nowrap">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c, index) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sr. No */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-center font-bold text-xs text-slate-500 border border-gray-300">
                      {((currentPage || 1) - 1) * (pageSize || 10) + index + 1}
                    </td>

                    {/* Customer Identity */}
                    <td className="px-5 py-3.5 whitespace-nowrap border border-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                          {c.first_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {c.first_name} {c.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            CUST-{c.id.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 whitespace-nowrap border border-gray-300">
                      <a
                        href={`mailto:${c.user?.email}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.user?.email || 'N/A'}</span>
                      </a>
                    </td>

                    {/* Mobile */}
                    <td className="px-5 py-3.5 whitespace-nowrap border border-gray-300">
                      <a
                        href={`tel:${c.user?.mobile}`}
                        dir="ltr"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.user?.mobile || 'N/A'}</span>
                      </a>
                    </td>

                    {/* Saved Addresses */}
                    <td className="px-5 py-3.5 whitespace-nowrap border border-gray-300">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {c.addresses && c.addresses.length > 0
                            ? `${c.addresses.length} ${c.addresses[0]?.city ? `(${c.addresses[0].city})` : (locale === 'ar' ? 'عناوين' : 'saved')}`
                            : (locale === 'ar' ? 'لا يوجد عناوين' : 'None added')}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap border border-gray-300">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
 c.user?.status === 'ACTIVE'
 ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
 : 'bg-rose-50 text-rose-700 border-rose-200'
 }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.user?.status === 'ACTIVE' ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
                        <span>{c.user?.status === 'ACTIVE' ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطل' : 'Disabled')}</span>
                      </span>
                    </td>

                    {/* Actions: Sleek Uniform Icon Buttons */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center border border-gray-300">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. View Details & History */}
                        <Link
                          href={`/admin/customers/${c.id}`}
                          title={locale === 'ar' ? 'عرض التفاصيل وسجل الطلبات' : 'View Details & Order History'}
                          className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200/80 flex items-center justify-center shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* 2. Edit Profile */}
                        <button
                          onClick={() => openEditModal(c)}
                          title={locale === 'ar' ? 'تعديل بيانات العميل' : 'Edit Customer Profile'}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white border border-slate-200 flex items-center justify-center shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Toggle Status (Activate / Deactivate) */}
                        <button
                          onClick={() => handleToggleStatus(c.id, c.user?.status)}
                          title={
                            c.user?.status === 'ACTIVE'
                              ? locale === 'ar' ? 'تعطيل الحساب' : 'Deactivate Account'
                              : locale === 'ar' ? 'تفعيل الحساب' : 'Activate Account'
                          }
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs transition-all hover:scale-105 active:scale-95 border cursor-pointer ${
 c.user?.status === 'ACTIVE'
 ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200'
 : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200'
 }`}
                        >
                          {c.user?.status === 'ACTIVE' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <AdminPagination
            pagination={{ currentPage, pageSize, totalRecords, totalPages }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </div>
      )}

      {/* Modal: Add New Customer Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {locale === 'ar' ? 'إضافة عميل جديد' : 'Create New Customer Account'}
                  </h3>
                  <p className="text-xs text-slate-500">Register new customer login details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form id="addCustomerForm" onSubmit={handleCreateCustomer} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={customerForm.first_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={customerForm.last_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+966500000000"
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Customer@123456 (default if blank)"
                  value={customerForm.password}
                  onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="addCustomerForm"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Create Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer Account */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Customer Profile</h3>
                  <p className="text-xs text-slate-500">Update account personal details</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form id="editCustomerForm" onSubmit={handleUpdateCustomer} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.first_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.last_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editCustomerForm"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

