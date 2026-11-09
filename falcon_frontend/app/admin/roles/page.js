'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import {
  ShieldCheck,
  Shield,
  Users,
  Key,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  ChevronRight,
  Filter,
  UserPlus,
  ShieldAlert,
  Building,
  Mail,
  Phone,
  Layers,
  Sparkles,
} from 'lucide-react';
import AdminPagination from '../../../src/components/AdminPagination';

const MODULE_DISPLAY_CONFIG = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'admin_management', label: 'Role & Admin Management' },
  { key: 'customers', label: 'Customer Management' },
  { key: 'products', label: 'Product Catalog' },
  { key: 'categories', label: 'Category Management' },
  { key: 'inventory', label: 'Stock & Inventory' },
  { key: 'orders', label: 'Order Processing' },
  { key: 'payments', label: 'Payment Reconciliation' },
  { key: 'refunds', label: 'Refund Management' },
  { key: 'delivery', label: 'Delivery & Logistics' },
  { key: 'drivers', label: 'Driver Fleet' },
  { key: 'invoices', label: 'Tax Invoices' },
  { key: 'zatca', label: 'ZATCA Compliance' },
  { key: 'cms', label: 'Homepage CMS Content' },
  { key: 'banners', label: 'Hero & Promo Banners' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'coupons', label: 'Coupons & Discounts' },
  { key: 'feedback', label: 'Customer Feedback' },
  { key: 'notifications', label: 'Push Notifications' },
];

export default function AdminRolesPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { user: currentAdmin, isSuperAdmin, hasPermission } = useAuth();

  // Active Tab: default to roles matrix
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'audit_logs'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Roles Filters
  const [roleSearch, setRoleSearch] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('ALL'); // 'ALL' | 'SYSTEM' | 'CUSTOM'

  // Role & Matrix selection state
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState(new Set());

  // Audit Logs Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
  });
  const [roleModalPermissions, setRoleModalPermissions] = useState(new Set());

  // Load Initial Data
  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [permRes, rolesRes] = await Promise.all([
        fetchApi('/admin/rbac/permissions'),
        fetchApi('/admin/rbac/roles'),
      ]);

      if (permRes.success && permRes.data) {
        setAllPermissions(permRes.data.all || []);
        setPermissionGroups(permRes.data.grouped || {});
      }

      if (rolesRes.success && rolesRes.data?.roles) {
        const fetchedRoles = rolesRes.data.roles;
        setRoles(fetchedRoles);
        if (fetchedRoles.length > 0) {
          const defaultRole = fetchedRoles.find((r) => r.slug === 'super_admin') || fetchedRoles[0];
          setSelectedRole(defaultRole);
          const permCodes = new Set((defaultRole.permissions || []).map((p) => p.code));
          setSelectedPermissionCodes(permCodes);
        }
      }
    } catch (error) {
      showToast(error.message || 'Failed to load RBAC data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch Audit Logs when tab or page changes
  const loadAuditLogs = async (page = auditPage, limit = auditPageSize) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (auditSearch.trim()) params.append('search', auditSearch.trim());
      if (auditModuleFilter !== 'all') params.append('module', auditModuleFilter);
      if (auditActionFilter !== 'all') params.append('action', auditActionFilter);

      const res = await fetchApi(`/admin/rbac/audit-logs?${params.toString()}`);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || res.data.records || []);
        const total = res.data.pagination?.totalRecords || res.data.total || 0;
        setAuditTotal(total);
        setAuditPage(res.data.pagination?.currentPage || res.data.page || page);
        setAuditTotalPages(res.data.pagination?.totalPages || res.data.totalPages || 1);
      }
    } catch (error) {
      showToast('Failed to load audit logs', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      setAuditPage(1);
    }
  }, [auditModuleFilter, auditActionFilter, auditSearch]);

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      const timer = setTimeout(() => {
        loadAuditLogs(auditPage, auditPageSize);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, auditModuleFilter, auditActionFilter, auditSearch, auditPage, auditPageSize]);

  const handleAuditPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= auditTotalPages && newPage !== auditPage) {
      setAuditPage(newPage);
    }
  };

  const handleAuditPageSizeChange = (newSize) => {
    setAuditPageSize(newSize);
    setAuditPage(1);
  };

  // Handle Role selection for matrix view
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    const codes = new Set((role.permissions || []).map((p) => p.code));
    setSelectedPermissionCodes(codes);
  };

  // Toggle single permission checkbox
  const togglePermission = (code) => {
    if (!selectedRole || selectedRole.slug === 'super_admin') return;

    setSelectedPermissionCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Toggle all permissions within a specific module
  const toggleModulePermissions = (moduleName) => {
    if (!selectedRole || selectedRole.slug === 'super_admin') return;

    const modulePerms = permissionGroups[moduleName] || [];
    const moduleCodes = modulePerms.map((p) => p.code);
    const allSelected = moduleCodes.every((c) => selectedPermissionCodes.has(c));

    setSelectedPermissionCodes((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        moduleCodes.forEach((c) => next.delete(c));
      } else {
        moduleCodes.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  // Select all permissions for current role
  const selectAllPermissions = () => {
    if (!selectedRole || selectedRole.slug === 'super_admin') return;
    const all = new Set(allPermissions.map((p) => p.code));
    setSelectedPermissionCodes(all);
  };

  // Clear all permissions for current role
  const clearAllPermissions = () => {
    if (!selectedRole || selectedRole.slug === 'super_admin') return;
    setSelectedPermissionCodes(new Set());
  };

  // Save updated Permission Matrix for selected role
  const handleSavePermissionMatrix = async () => {
    if (!selectedRole) return;
    if (selectedRole.slug === 'super_admin') {
      showToast('Super Admin role automatically retains all permissions.', 'info');
      return;
    }

    try {
      setSavingMatrix(true);
      const res = await fetchApi(`/admin/rbac/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          permissionCodes: Array.from(selectedPermissionCodes),
        }),
      });

      if (res.success && res.data?.role) {
        showToast(`Permissions updated for role "${selectedRole.name}"!`, 'success');
        // Update local roles list
        setRoles((prev) =>
          prev.map((r) => (r.id === selectedRole.id ? res.data.role : r))
        );
        setSelectedRole(res.data.role);
      } else {
        showToast(res.message || 'Failed to update permissions', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error updating role matrix', 'error');
    } finally {
      setSavingMatrix(false);
    }
  };



  // Open Role Modal for Create
  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleFormData({ name: '', description: '' });
    setRoleModalPermissions(new Set());
    setShowRoleModal(true);
  };

  // Open Role Modal for Edit
  const openEditRoleModal = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name || '',
      description: role.description || '',
    });
    if (role.slug === 'super_admin') {
      const codes = new Set(allPermissions.map((p) => p.code));
      setRoleModalPermissions(codes);
    } else {
      const codes = new Set((role.permissions || []).map((p) => p.code));
      setRoleModalPermissions(codes);
    }
    setShowRoleModal(true);
  };

  // Toggle single permission inside Modal
  const toggleModalPermission = (code) => {
    if (!code || editingRole?.slug === 'super_admin') return;
    setRoleModalPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Toggle all permissions for a module inside Modal
  const toggleModalModulePermissions = (moduleName) => {
    if (editingRole?.slug === 'super_admin') return;
    const perms = permissionGroups[moduleName] || [];
    const codes = perms.map((p) => p.code);
    setRoleModalPermissions((prev) => {
      const next = new Set(prev);
      const isAllSelected = codes.length > 0 && codes.every((c) => next.has(c));
      if (isAllSelected) {
        codes.forEach((c) => next.delete(c));
      } else {
        codes.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  // Toggle all permissions in entire system inside Modal
  const toggleAllModalPermissions = () => {
    if (editingRole?.slug === 'super_admin') return;
    setRoleModalPermissions((prev) => {
      const allCodes = allPermissions.map((p) => p.code);
      const isAllSelected = allCodes.length > 0 && allCodes.every((c) => prev.has(c));
      if (isAllSelected) {
        return new Set();
      } else {
        return new Set(allCodes);
      }
    });
  };

  // Save Role (Create or Edit) with Permissions Matrix
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleFormData.name.trim()) {
      showToast(locale === 'ar' ? 'اسم الدور مطلوب' : 'Role name is required', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const isEdit = Boolean(editingRole);
      const url = isEdit ? `/admin/rbac/roles/${editingRole.id}` : '/admin/rbac/roles';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetchApi(url, {
        method,
        body: JSON.stringify({
          name: roleFormData.name.trim(),
          description: roleFormData.description,
          permissionCodes: Array.from(roleModalPermissions),
        }),
      });

      if (res.success && res.data?.role) {
        showToast(
          isEdit
            ? (locale === 'ar' ? `تم تحديث الدور "${res.data.role.name}" بنجاح!` : `Role "${res.data.role.name}" updated successfully!`)
            : (locale === 'ar' ? `تم إنشاء الدور "${res.data.role.name}" بنجاح!` : `Role "${res.data.role.name}" created successfully!`),
          'success'
        );
        setShowRoleModal(false);
        setEditingRole(null);
        setRoleFormData({ name: '', description: '' });
        setRoleModalPermissions(new Set());

        const refreshed = await fetchApi('/admin/rbac/roles');
        if (refreshed.success) {
          setRoles(refreshed.data.roles);
          const activeRole = refreshed.data.roles.find((r) => r.id === res.data.role.id);
          if (activeRole) handleSelectRole(activeRole);
        }
      } else {
        showToast(res.message || (isEdit ? 'Failed to update role' : 'Failed to create role'), 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error saving role', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (role) => {
    if (role.is_system || role.slug === 'super_admin') {
      showToast('System roles cannot be deleted', 'error');
      return;
    }

    if (!confirm(`Delete role "${role.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetchApi(`/admin/rbac/roles/${role.id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        showToast(`Role "${role.name}" deleted successfully`, 'success');
        const refreshed = await fetchApi('/admin/rbac/roles');
        if (refreshed.success) {
          setRoles(refreshed.data.roles);
          if (refreshed.data.roles.length > 0) {
            handleSelectRole(refreshed.data.roles[0]);
          }
        }
      } else {
        showToast(res.message || 'Failed to delete role', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error deleting role', 'error');
    }
  };



  // Filtered Roles for Table
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchSearch =
        !roleSearch.trim() ||
        role.name?.toLowerCase().includes(roleSearch.toLowerCase()) ||
        role.description?.toLowerCase().includes(roleSearch.toLowerCase()) ||
        role.slug?.toLowerCase().includes(roleSearch.toLowerCase());

      const matchType =
        roleTypeFilter === 'ALL' ||
        (roleTypeFilter === 'SYSTEM' && role.is_system) ||
        (roleTypeFilter === 'CUSTOM' && !role.is_system);

      return matchSearch && matchType;
    });
  }, [roles, roleSearch, roleTypeFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {locale === 'ar' ? 'جاري تحميل الصلاحيات والأدوار...' : 'Loading RBAC & Permissions Engine...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-950 via-[#05442e] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-lime-400 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono font-black text-lime-300 tracking-wider uppercase bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15">
                  RBAC Engine
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isSuperAdmin
                    ? locale === 'ar'
                      ? 'صلاحيات المسؤول الأكبر (Super Admin)'
                      : 'Super Admin Authority Active'
                    : locale === 'ar'
                    ? 'لوحة إدارة الصلاحيات'
                    : 'Role Management Active'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {locale === 'ar'
                  ? 'إدارة الأدوار وصلاحيات الوصول '
                  : 'Role-Based Access Control'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
                {locale === 'ar'
                  ? 'إدارة حسابات المشرفين، الأدوار المخصصة، ومصفوفة الصلاحيات الدقيقة لكل وحدة ومراقبة العمليات الحساسة في النظام.'
                  : 'Configure fine-grained module permissions, manage sub-admin team members, and audit sensitive operations.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">


            <button
              onClick={openCreateRoleModal}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{locale === 'ar' ? 'إنشاء دور مخصص' : 'Create Custom Role'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Defined Roles */}
        <div
          onClick={() => setActiveTab('roles')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'الأدوار النشطة' : 'Defined Roles'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                {roles.length}
              </span>
              <span className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'أدوار' : 'Roles'}</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              {locale === 'ar' ? 'أدوار النظام والأدوار المخصصة' : 'System & custom roles'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0 group-hover:scale-105 transition-transform">
            <Key className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Employees Portal */}
        <Link
          href="/admin/employees"
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'فريق الموظفين' : 'Employees Portal'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                {locale === 'ar' ? 'إدارة الموظفين' : 'Staff Directory'}
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold block">
              {locale === 'ar' ? 'فتح لوحة الموظفين والمشرفين ←' : 'Manage accounts & roles →'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 3: Modular Permissions */}
        <div
          onClick={() => setActiveTab('roles')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'الصلاحيات المعرفة' : 'Modular Permissions'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                {allPermissions.length}
              </span>
              <span className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'صلاحية' : 'Rules'}</span>
            </div>
            <span className="text-[11px] text-teal-700 font-semibold block">
              {locale === 'ar' ? 'موزعة عبر الوحدات الإدارية' : 'Across core modules'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Audit Logs */}
        <div
          onClick={() => setActiveTab('audit_logs')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'سجل الرقابة' : 'System Audit Trail'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                {auditTotal || auditLogs.length}
              </span>
              <span className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'عملية' : 'Events'}</span>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold block">
              {locale === 'ar' ? 'عمليات مالية وإدارية مسجلة' : 'Tracked security events'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0 group-hover:scale-105 transition-transform">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          {
            key: 'roles',
            icon: Key,
            label: locale === 'ar' ? 'الأدوار ومصفوفة الصلاحيات' : 'Roles & Permission Matrix',
            count: roles.length,
          },
          {
            key: 'audit_logs',
            icon: History,
            label: locale === 'ar' ? 'سجل العمليات والرقابة (Audit)' : 'System Audit Trail',
            count: auditTotal || auditLogs.length,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
 isActive
 ? 'bg-[#05442e] text-white shadow-md'
 : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
 }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
 isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
 }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TAB 2: Roles & Permission Matrix Table Management */}
      {/* ======================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {/* Filters & Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'بحث في الأدوار باسم أو وصف...' : 'Search roles by name or description...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 rtl:pl-3 rtl:pr-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Type Filter */}
              <select
                value={roleTypeFilter}
                onChange={(e) => setRoleTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">
                  {locale === 'ar' ? 'جميع الأدوار' : 'All Roles'} ({roles.length})
                </option>
                <option value="SYSTEM">
                  {locale === 'ar' ? 'أدوار النظام' : 'System Roles'} ({roles.filter((r) => r.is_system).length})
                </option>
                <option value="CUSTOM">
                  {locale === 'ar' ? 'أدوار مخصصة' : 'Custom Roles'} ({roles.filter((r) => !r.is_system).length})
                </option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={async () => {
                  try {
                    const refreshed = await fetchApi('/admin/rbac/roles');
                    if (refreshed.success) {
                      setRoles(refreshed.data.roles);
                      showToast(locale === 'ar' ? 'تم تحديث قائمة الأدوار' : 'Roles refreshed successfully', 'info');
                    }
                  } catch (err) {
                    showToast('Failed to refresh roles', 'error');
                  }
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Refresh Roles"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Add Custom Role Button */}
              <button
                onClick={openCreateRoleModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-all shadow-xs cursor-pointer ml-1"
              >
                <Plus className="w-4 h-4" />
                <span>{locale === 'ar' ? 'إضافة دور' : 'Add Role'}</span>
              </button>
            </div>
          </div>

          {/* Roles Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الدور الإداري' : 'Role'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الصلاحيات' : 'Permissions'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'المستخدمين' : 'Assigned Users'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="px-5 py-4 text-center">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        {locale === 'ar'
                          ? 'لم يتم العثور على أدوار مطابقة للبحث.'
                          : 'No roles found matching the criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => {
                      const isSuper = role.slug === 'super_admin';
                      const totalPerms = allPermissions.length || 62;
                      const permCount = isSuper
                        ? totalPerms
                        : role.permissions?.length || role.permissionsCount || 0;
                      const permPercent = Math.min(100, Math.round((permCount / (totalPerms || 1)) * 100));

                      return (
                        <tr key={role.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Role Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
 isSuper
 ? 'bg-purple-100 text-purple-700 border border-purple-200'
 : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
 }`}
                              >
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{role.name}</span>
                                  {isSuper && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                                      Root
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {role.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-5 py-4 max-w-xs">
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed" title={role.description}>
                              {role.description || (
                                <span className="text-slate-400 italic">
                                  {locale === 'ar' ? 'بدون وصف' : 'No description'}
                                </span>
                              )}
                            </p>
                          </td>

                          {/* Permissions */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5 min-w-[140px]">
                              <div className="flex items-center gap-1.5">
                                <Key className={`w-3.5 h-3.5 ${isSuper ? 'text-purple-600' : 'text-emerald-600'}`} />
                                <span
                                  className={`text-xs font-bold ${
 isSuper ? 'text-purple-700' : 'text-slate-800'
 }`}
                                >
                                  {isSuper ? `All (${totalPerms})` : `${permCount} / ${totalPerms}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  ({permPercent}%)
                                </span>
                              </div>
                              <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
 isSuper ? 'bg-purple-600' : 'bg-emerald-500'
 }`}
                                  style={{ width: `${permPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Users Count */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{role.usersCount || role.users?.length || 0}</span>
                              <span className="text-[10px] font-normal text-slate-500">
                                {locale === 'ar' ? 'مستخدم' : 'users'}
                              </span>
                            </span>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-4">
                            {role.is_system ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                System
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Custom
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Role & Permissions Button */}
                              <button
                                onClick={() => openEditRoleModal(role)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                title={
                                  isSuper
                                    ? 'View Permissions (Super Admin is permanent)'
                                    : 'Edit Role & Permission Matrix'
                                }
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{locale === 'ar' ? 'تعديل الصلاحيات' : 'Edit Permissions'}</span>
                              </button>

                              {/* Delete Role Button */}
                              {!role.is_system && !isSuper && (
                                <button
                                  onClick={() => handleDeleteRole(role)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete Role"
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
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: System Audit Trail (Audit Logs) */}
      {/* ======================================================== */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          {/* Audit Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs(1)}
                placeholder={locale === 'ar' ? 'بحث في سجل الرقابة...' : 'Search logs by admin, email, or entity...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 rtl:pl-3 rtl:pr-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
              >
                <option value="all">{locale === 'ar' ? 'جميع الوحدات' : 'All Modules'}</option>
                <option value="payments">Payments</option>
                <option value="refunds">Refunds</option>
                <option value="orders">Orders</option>
                <option value="admin_management">Admin Management</option>
                <option value="products">Products</option>
              </select>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
              >
                <option value="all">{locale === 'ar' ? 'جميع الإجراءات' : 'All Actions'}</option>
                <option value="VERIFY_PAYMENT">VERIFY_PAYMENT</option>
                <option value="REJECT_PAYMENT">REJECT_PAYMENT</option>
                <option value="REFUND_PAYMENT">REFUND_PAYMENT</option>
                <option value="CANCEL_ORDER">CANCEL_ORDER</option>
                <option value="CREATE_ROLE">CREATE_ROLE</option>
                <option value="UPDATE_ROLE">UPDATE_ROLE</option>
                <option value="CREATE_SUB_ADMIN">CREATE_SUB_ADMIN</option>
                <option value="UPDATE_SUB_ADMIN">UPDATE_SUB_ADMIN</option>
                <option value="TOGGLE_SUB_ADMIN_STATUS">TOGGLE_SUB_ADMIN_STATUS</option>
              </select>

              <button
                onClick={() => loadAuditLogs(1)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Search"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'المشرف المسؤول' : 'Admin User'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الإجراء' : 'Action'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الوحدة' : 'Module'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'التفاصيل والبيانات' : 'Details & Entity'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'عنوان IP' : 'Client IP'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        {locale === 'ar'
                          ? 'لا توجد سجلات رقابة مسجلة حالياً.'
                          : 'No audit logs recorded for this filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const isSensitive = ['VERIFY_PAYMENT', 'REFUND_PAYMENT', 'CANCEL_ORDER', 'UPDATE_ROLE'].includes(log.action);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Timestamp */}
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(log.created_at || log.createdAt).toLocaleString()}
                          </td>

                          {/* Admin */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{log.admin_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.admin_email}</div>
                          </td>

                          {/* Action Badge */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
 isSensitive
 ? 'bg-amber-100 text-amber-800 border border-amber-200'
 : 'bg-slate-100 text-slate-700 border border-slate-200'
 }`}
                            >
                              {log.action}
                            </span>
                          </td>

                          {/* Module */}
                          <td className="px-5 py-3.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                            {log.module}
                          </td>

                          {/* Details */}
                          <td className="px-5 py-3.5 max-w-xs">
                            <div className="text-[11px] text-slate-800 font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 truncate">
                              {JSON.stringify(log.details || { entity: log.entity_type, id: log.entity_id })}
                            </div>
                          </td>

                          {/* IP */}
                          <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={auditPage}
              totalPages={auditTotalPages}
              totalRecords={auditTotal}
              pageSize={auditPageSize}
              onPageChange={handleAuditPageChange}
              onPageSizeChange={handleAuditPageSizeChange}
              locale={locale}
            />
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* MODAL: Access Control Role Creation & Editing */}
      {/* ======================================================== */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header: Close X Button */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingRole
                    ? (locale === 'ar' ? `تعديل الدور: ${editingRole.name}` : `Edit Role & Permissions: ${editingRole.name}`)
                    : (locale === 'ar' ? 'إنشاء دور إداري جديد' : 'Create Custom Role')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingRole
                    ? (locale === 'ar' ? 'تعديل بيانات الدور ومصفوفة الصلاحيات الممنوحة' : 'Configure role details and fine-grained module access rights.')
                    : (locale === 'ar' ? 'حدد اسم الدور والصلاحيات المسموح بها' : 'Specify role name and assign modular permissions.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingRole(null);
                }}
                className="text-[#2563EB] hover:text-blue-700 transition-colors p-1 rounded-lg hover:bg-blue-50 cursor-pointer"
                title="Close"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Super Admin Notice if viewing super_admin */}
            {editingRole?.slug === 'super_admin' && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-purple-900">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                <span>
                  {locale === 'ar'
                    ? 'يمتلك دور المسؤول الأكبر (Super Admin) حق وصول غير مقيد لجميع العمليات والوحدات بشكل دائم.'
                    : 'The Super Admin role inherently holds full unconstrained administrative authority across all modules.'}
                </span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              {/* Role Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-900">
                    {locale === 'ar' ? 'اسم الدور' : 'Role Name'}
                  </label>
                  {editingRole?.is_system && (
                    <span className="text-[11px] font-bold text-slate-400">
                      ({locale === 'ar' ? 'اسم دور النظام محمي وغير قابل للتغيير' : 'System role name cannot be renamed'})
                    </span>
                  )}
                </div>
                <textarea
                  rows={1}
                  required
                  disabled={Boolean(editingRole?.is_system)}
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  placeholder="e.g., Administrator, Project Manager"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium resize-y ${
 editingRole?.is_system ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
 }`}
                />
              </div>

              {/* Role Description */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">
                  {locale === 'ar' ? 'وصف الدور' : 'Role Description'}
                </label>
                <textarea
                  rows={3}
                  disabled={editingRole?.slug === 'super_admin'}
                  value={roleFormData.description}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, description: e.target.value })
                  }
                  placeholder="Describe the responsibilities and access level for this role"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium resize-y ${
 editingRole?.slug === 'super_admin' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
 }`}
                />
              </div>

              {/* Access Control Permissions Matrix Table */}
              <div className="pt-2">
                <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                  {/* Table Header Bar: Vibrant Blue */}
                  <div className="bg-[#2563EB] text-white px-4 py-3 flex items-center justify-between font-bold text-xs select-none">
                    <div
                      onClick={toggleAllModalPermissions}
                      className={`flex items-center gap-2 ${
 editingRole?.slug === 'super_admin' ? 'cursor-default' : 'cursor-pointer hover:opacity-95'
 } transition-opacity`}
                    >
                      <input
                        type="checkbox"
                        disabled={editingRole?.slug === 'super_admin'}
                        checked={
                          allPermissions.length > 0 &&
                          allPermissions.every((p) => roleModalPermissions.has(p.code))
                        }
                        onChange={toggleAllModalPermissions}
                        className="w-4 h-4 rounded text-blue-600 border-white/60 bg-white/20 focus:ring-0 cursor-pointer disabled:opacity-75"
                      />
                      <span>Access Control</span>
                      <span className="font-normal text-[11px] opacity-90">
                        {editingRole?.slug === 'super_admin' ? '(All granted)' : '(Toggle all permissions)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 w-56 sm:w-72 md:w-80 text-center font-bold text-xs tracking-wide">
                      <div>Create</div>
                      <div>View</div>
                      <div>Edit</div>
                      <div>Remove</div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 bg-white">
                    {(() => {
                      const configuredKeys = new Set(MODULE_DISPLAY_CONFIG.map((m) => m.key));
                      const dynamicModules = Object.keys(permissionGroups)
                        .filter((k) => !configuredKeys.has(k))
                        .map((k) => ({
                          key: k,
                          label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                        }));
                      const displayList = [
                        ...MODULE_DISPLAY_CONFIG.filter((m) => permissionGroups[m.key]),
                        ...dynamicModules,
                      ];

                      return displayList.map(({ key: modKey, label: modLabel }) => {
                        const perms = permissionGroups[modKey] || [];
                        const createPerm = perms.find((p) => p.action === 'create');
                        const viewPerm = perms.find((p) => p.action === 'view');
                        const editPerm = perms.find((p) =>
                          ['edit', 'adjust', 'update'].includes(p.action)
                        );
                        const removePerm = perms.find((p) =>
                          ['delete', 'remove', 'cancel'].includes(p.action)
                        );
                        const extraPerms = perms.filter(
                          (p) =>
                            p !== createPerm &&
                            p !== viewPerm &&
                            p !== editPerm &&
                            p !== removePerm
                        );
                        const isModuleAll =
                          perms.length > 0 &&
                          perms.every((p) => roleModalPermissions.has(p.code));

                        return (
                          <div
                            key={modKey}
                            className="px-4 py-2.5 flex flex-col gap-1 hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              {/* Module Name + Master Checkbox */}
                              <label
                                className={`flex items-center gap-3 select-none py-0.5 ${
 editingRole?.slug === 'super_admin' ? 'cursor-default' : 'cursor-pointer'
 }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={editingRole?.slug === 'super_admin'}
                                  checked={isModuleAll}
                                  onChange={() => toggleModalModulePermissions(modKey)}
                                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                                />
                                <span className="text-xs font-semibold text-slate-800">
                                  {modLabel}
                                </span>
                              </label>

                              {/* Action Checkboxes */}
                              <div className="grid grid-cols-4 w-56 sm:w-72 md:w-80 items-center justify-items-center">
                                {/* Create */}
                                {createPerm ? (
                                  <input
                                    type="checkbox"
                                    disabled={editingRole?.slug === 'super_admin'}
                                    checked={roleModalPermissions.has(createPerm.code)}
                                    onChange={() => toggleModalPermission(createPerm.code)}
                                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                                    title={createPerm.name}
                                  />
                                ) : (
                                  <span className="w-4 h-4 rounded border border-slate-200 bg-slate-100/60 opacity-30 inline-block" />
                                )}

                                {/* View */}
                                {viewPerm ? (
                                  <input
                                    type="checkbox"
                                    disabled={editingRole?.slug === 'super_admin'}
                                    checked={roleModalPermissions.has(viewPerm.code)}
                                    onChange={() => toggleModalPermission(viewPerm.code)}
                                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                                    title={viewPerm.name}
                                  />
                                ) : (
                                  <span className="w-4 h-4 rounded border border-slate-200 bg-slate-100/60 opacity-30 inline-block" />
                                )}

                                {/* Edit */}
                                {editPerm ? (
                                  <input
                                    type="checkbox"
                                    disabled={editingRole?.slug === 'super_admin'}
                                    checked={roleModalPermissions.has(editPerm.code)}
                                    onChange={() => toggleModalPermission(editPerm.code)}
                                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                                    title={editPerm.name}
                                  />
                                ) : (
                                  <span className="w-4 h-4 rounded border border-slate-200 bg-slate-100/60 opacity-30 inline-block" />
                                )}

                                {/* Remove */}
                                {removePerm ? (
                                  <input
                                    type="checkbox"
                                    disabled={editingRole?.slug === 'super_admin'}
                                    checked={roleModalPermissions.has(removePerm.code)}
                                    onChange={() => toggleModalPermission(removePerm.code)}
                                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                                    title={removePerm.name}
                                  />
                                ) : (
                                  <span className="w-4 h-4 rounded border border-slate-200 bg-slate-100/60 opacity-30 inline-block" />
                                )}
                              </div>
                            </div>

                            {/* Extra Permissions tags if any (export, assign, approve, etc.) */}
                            {extraPerms.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pl-7 pt-0.5">
                                <span className="text-[10px] text-slate-400 font-medium">Extra:</span>
                                {extraPerms.map((ep) => {
                                  const checked = roleModalPermissions.has(ep.code);
                                  return (
                                    <button
                                      type="button"
                                      key={ep.code}
                                      disabled={editingRole?.slug === 'super_admin'}
                                      onClick={() => toggleModalPermission(ep.code)}
                                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all ${
 editingRole?.slug === 'super_admin'
 ? 'cursor-default opacity-80'
 : 'cursor-pointer'
 } ${
 checked
 ? 'bg-blue-50 border-blue-300 text-blue-700'
 : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
 }`}
                                      title={ep.description || ep.name}
                                    >
                                      {checked ? '✓ ' : '+ '}
                                      {ep.action.toUpperCase()} ({ep.name})
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {editingRole?.slug === 'super_admin' ? (locale === 'ar' ? 'إغلاق' : 'Close') : (locale === 'ar' ? 'إلغاء' : 'Cancel')}
                </button>
                {editingRole?.slug !== 'super_admin' && (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading
                      ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                      : editingRole
                      ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                      : (locale === 'ar' ? 'إنشاء الدور' : 'Create Role')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
