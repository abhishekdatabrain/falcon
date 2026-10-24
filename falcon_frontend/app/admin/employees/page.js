'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import AdminPagination from '../../../src/components/AdminPagination';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  Mail,
  Phone,
  Building,
  RefreshCw,
  X,
  AlertCircle,
  Key,
} from 'lucide-react';

export default function AdminEmployeesPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { user: currentAdmin, isSuperAdmin, hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [subAdmins, setSubAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: 'Operations',
    email: '',
    mobile: '',
    password: '',
    roleId: '',
  });

  const loadData = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter !== 'ALL') params.append('roleId', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', limit);

      const [subAdminsRes, rolesRes] = await Promise.all([
        fetchApi(`/admin/rbac/sub-admins?${params.toString()}`),
        fetchApi('/admin/rbac/roles'),
      ]);

      if (subAdminsRes.success && subAdminsRes.data) {
        setSubAdmins(subAdminsRes.data.subAdmins || subAdminsRes.data.records || []);
        if (subAdminsRes.data.pagination) {
          setTotalPages(subAdminsRes.data.pagination.totalPages || 1);
          setTotalRecords(
            subAdminsRes.data.pagination.totalRecords !== undefined
              ? subAdminsRes.data.pagination.totalRecords
              : (subAdminsRes.data.pagination.total || 0)
          );
          setCurrentPage(subAdminsRes.data.pagination.currentPage || subAdminsRes.data.pagination.page || page);
        } else {
          setTotalPages(1);
          setTotalRecords((subAdminsRes.data.subAdmins || []).length);
        }
      }
      if (rolesRes.success && rolesRes.data?.roles) {
        setRoles(rolesRes.data.roles);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load employee accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, pageSize);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadData(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    loadData(1, newPageSize);
  };

  const openCreateModal = () => {
    setEditingSubAdmin(null);
    setFormData({
      name: '',
      department: 'Operations',
      email: '',
      mobile: '',
      password: '',
      roleId: roles.find((r) => r.slug !== 'super_admin')?.id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setEditingSubAdmin(admin);
    const assignedRole = admin.assigned_role || (admin.roles && admin.roles[0]) || null;
    setFormData({
      name: admin.name || admin.admin_profile?.name || '',
      department: admin.department || admin.admin_profile?.department || 'Operations',
      email: admin.email || '',
      mobile: admin.mobile || '',
      password: '',
      roleId: assignedRole?.id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const isEdit = Boolean(editingSubAdmin);
      const url = isEdit
        ? `/admin/rbac/sub-admins/${editingSubAdmin.id}`
        : '/admin/rbac/sub-admins';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(),
        department: formData.department,
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        roleId: formData.roleId,
      };

      if (!isEdit || formData.password) {
        payload.password = formData.password;
      }

      const res = await fetchApi(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showToast(
          isEdit
            ? (locale === 'ar' ? 'تم تحديث بيانات الموظف بنجاح' : 'Employee updated successfully')
            : (locale === 'ar' ? 'تم إنشاء حساب الموظف بنجاح' : 'Employee created successfully'),
          'success'
        );
        setShowModal(false);
        loadData();
      } else {
        showToast(res.message || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error saving employee account', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const newStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/rbac/sub-admins/${admin.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        showToast(
          newStatus === 'ACTIVE'
            ? (locale === 'ar' ? 'تم تفعيل الحساب' : 'Account activated')
            : (locale === 'ar' ? 'تم تعطيل الحساب' : 'Account suspended'),
          'success'
        );
        setSubAdmins((prev) =>
          prev.map((a) => (a.id === admin.id ? { ...a, status: newStatus } : a))
        );
      } else {
        showToast(res.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error updating status', 'error');
    }
  };

  const handleDelete = async (admin) => {
    if (admin.id === currentAdmin?.id) {
      showToast(
        locale === 'ar' ? 'لا يمكنك حذف حسابك الحالي' : 'You cannot delete your own account',
        'error'
      );
      return;
    }

    if (!confirm(locale === 'ar' ? `هل أنت متأكد من حذف ${admin.email}؟` : `Delete employee ${admin.email}?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/admin/rbac/sub-admins/${admin.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم حذف الحساب بنجاح' : 'Employee deleted', 'success');
        setSubAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      } else {
        showToast(res.message || 'Failed to delete employee', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error deleting employee', 'error');
    }
  };

  // SubAdmins list rendered directly from server
  const filteredSubAdmins = subAdmins;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#043927] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Employees & Admin Users</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {locale === 'ar' ? 'إدارة الموظفين والمشرفين' : 'Employees Management'}
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 font-medium leading-relaxed">
              {locale === 'ar'
                ? 'إدارة حسابات فريق العمل، تعيين الأدوار والصلاحيات، وتتبع حالة النشاط لكل عضو.'
                : 'Manage staff credentials, assign custom roles, and monitor account operational statuses.'}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>{locale === 'ar' ? 'إضافة موظف جديد' : 'New Employee'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search employees...'}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">{locale === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">{locale === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
            <option value="ACTIVE">{locale === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="INACTIVE">{locale === 'ar' ? 'معطل' : 'Inactive'}</option>
          </select>

          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-extrabold">
              <tr>
                <th className="py-3.5 px-6">Employee / Staff</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Assigned Role</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading employees...</span>
                  </td>
                </tr>
              ) : filteredSubAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>No employee records found.</span>
                  </td>
                </tr>
              ) : (
                filteredSubAdmins.map((admin) => {
                  const role = admin.assigned_role || (admin.roles && admin.roles[0]) || null;
                  const isSuper = role?.slug === 'super_admin' || admin.isSuperAdmin;
                  const isActive = admin.status === 'ACTIVE';
                  const displayName = admin.name || admin.admin_profile?.name || admin.email?.split('@')[0] || 'Admin User';
                  const displayDept = admin.department || admin.admin_profile?.department || 'Operations';

                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isSuper
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {displayName[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{displayName}</span>
                              {admin.id === currentAdmin?.id && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {admin.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{admin.email}</span>
                          </div>
                          {admin.mobile && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span dir="ltr">{admin.mobile}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {role ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border bg-emerald-50 text-emerald-900 border-emerald-200">
                            <Key className="w-3 h-3 text-emerald-600" />
                            <span>{role.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{displayDept}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          disabled={admin.id === currentAdmin?.id || isSuper}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                          }`}
                        >
                          {isActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Employee & Assign Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {admin.id !== currentAdmin?.id && !isSuper && (
                            <button
                              onClick={() => handleDelete(admin)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <AdminPagination
          pagination={{ currentPage, pageSize, totalRecords, totalPages }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>

      {/* 4. Create / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <UserPlus className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingSubAdmin
                      ? (locale === 'ar' ? 'تعديل بيانات الموظف' : 'Edit Employee')
                      : (locale === 'ar' ? 'إضافة موظف جديد' : 'New Employee Account')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar'
                      ? 'حدد بيانات الموظف والدور المخصص له في لوحة التحكم.'
                      : 'Define credentials, department, and assigned role.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tariq Al-Ghamdi"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'القسم *' : 'Department *'}
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="Operations">Operations</option>
                  <option value="Catalog & Inventory">Catalog & Inventory</option>
                  <option value="Order Fulfillment">Order Fulfillment</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Logistics & Delivery">Logistics & Delivery</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. staff@platform.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'رقم الجوال *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="e.g. +966501234567"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingSubAdmin
                    ? (locale === 'ar' ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)')
                    : (locale === 'ar' ? 'كلمة المرور *' : 'Password *')}
                </label>
                <input
                  type="password"
                  required={!editingSubAdmin}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Assign Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'الدور المخصص (Role) *' : 'Assign Role *'}
                </label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissionsCount || r.permissions?.length || 0} permissions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-[#043927] hover:bg-[#065037] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading
                    ? 'Saving...'
                    : editingSubAdmin
                    ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                    : (locale === 'ar' ? 'إنشاء الحساب' : 'Create Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
