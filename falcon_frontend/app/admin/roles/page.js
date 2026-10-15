'use client';
import React, { useEffect, useState, useMemo } from 'react';
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

export default function AdminRolesPage() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const { user: currentAdmin, isSuperAdmin, hasPermission } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('sub_admins'); // 'sub_admins' | 'roles' | 'audit_logs'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [subAdmins, setSubAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);

  // Sub-Admins Filters
  const [subAdminSearch, setSubAdminSearch] = useState('');
  const [subAdminRoleFilter, setSubAdminRoleFilter] = useState('ALL');
  const [subAdminStatusFilter, setSubAdminStatusFilter] = useState('ALL');

  // Role & Matrix selection state
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState(new Set());

  // Audit Logs Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // Modals
  const [showCreateSubAdminModal, setShowCreateSubAdminModal] = useState(false);
  const [showEditSubAdminModal, setShowEditSubAdminModal] = useState(false);
  const [subAdminFormData, setSubAdminFormData] = useState({
    id: '',
    name: '',
    department: 'Operations',
    email: '',
    mobile: '',
    password: '',
    roleId: '',
  });

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
  });

  // Load Initial Data
  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [permRes, rolesRes, subAdminsRes] = await Promise.all([
        fetchApi('/admin/rbac/permissions'),
        fetchApi('/admin/rbac/roles'),
        fetchApi('/admin/rbac/sub-admins'),
      ]);

      if (permRes.success && permRes.data) {
        setAllPermissions(permRes.data.all || []);
        setPermissionGroups(permRes.data.grouped || {});
      }

      if (rolesRes.success && rolesRes.data?.roles) {
        const fetchedRoles = rolesRes.data.roles;
        setRoles(fetchedRoles);
        if (fetchedRoles.length > 0) {
          // Select Super Admin or first role by default
          const defaultRole = fetchedRoles.find((r) => r.slug === 'super_admin') || fetchedRoles[0];
          setSelectedRole(defaultRole);
          const permCodes = new Set((defaultRole.permissions || []).map((p) => p.code));
          setSelectedPermissionCodes(permCodes);
        }
      }

      if (subAdminsRes.success && subAdminsRes.data?.subAdmins) {
        setSubAdmins(subAdminsRes.data.subAdmins);
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
  const loadAuditLogs = async (page = 1) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '15');
      if (auditSearch.trim()) params.append('search', auditSearch.trim());
      if (auditModuleFilter !== 'all') params.append('module', auditModuleFilter);
      if (auditActionFilter !== 'all') params.append('action', auditActionFilter);

      const res = await fetchApi(`/admin/rbac/audit-logs?${params.toString()}`);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || []);
        setAuditTotal(res.data.total || 0);
        setAuditPage(res.data.page || 1);
      }
    } catch (error) {
      showToast('Failed to load audit logs', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      loadAuditLogs(1);
    }
  }, [activeTab, auditModuleFilter, auditActionFilter]);

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

  // Create Sub-Admin Account
  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetchApi('/admin/rbac/sub-admins', {
        method: 'POST',
        body: JSON.stringify(subAdminFormData),
      });

      if (res.success && res.data?.subAdmin) {
        showToast('Sub-Admin account created successfully!', 'success');
        setShowCreateSubAdminModal(false);
        setSubAdminFormData({
          id: '',
          name: '',
          department: 'Operations',
          email: '',
          mobile: '',
          password: '',
          roleId: '',
        });
        // Reload sub-admins
        const refreshed = await fetchApi('/admin/rbac/sub-admins');
        if (refreshed.success) setSubAdmins(refreshed.data.subAdmins);
      } else {
        showToast(res.message || 'Failed to create Sub-Admin', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error creating Sub-Admin account', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Sub-Admin Account
  const handleOpenEditSubAdmin = (subAdmin) => {
    setSubAdminFormData({
      id: subAdmin.id,
      name: subAdmin.name,
      department: subAdmin.department || 'Operations',
      email: subAdmin.email,
      mobile: subAdmin.mobile,
      password: '',
      roleId: subAdmin.roles?.[0]?.id || '',
    });
    setShowEditSubAdminModal(true);
  };

  const handleUpdateSubAdmin = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        name: subAdminFormData.name,
        department: subAdminFormData.department,
        email: subAdminFormData.email,
        mobile: subAdminFormData.mobile,
        roleId: subAdminFormData.roleId || null,
      };
      if (subAdminFormData.password && subAdminFormData.password.trim()) {
        payload.password = subAdminFormData.password.trim();
      }

      const res = await fetchApi(`/admin/rbac/sub-admins/${subAdminFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showToast('Sub-Admin account updated successfully!', 'success');
        setShowEditSubAdminModal(false);
        const refreshed = await fetchApi('/admin/rbac/sub-admins');
        if (refreshed.success) setSubAdmins(refreshed.data.subAdmins);
      } else {
        showToast(res.message || 'Failed to update Sub-Admin', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error updating Sub-Admin account', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Sub-Admin Active / Inactive
  const handleToggleSubAdminStatus = async (subAdmin) => {
    if (subAdmin.isSuperAdmin) {
      showToast('Super Admin accounts cannot be deactivated.', 'error');
      return;
    }

    const nextStatus = subAdmin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/rbac/sub-admins/${subAdmin.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.success) {
        showToast(`Account status updated to ${nextStatus}`, 'success');
        setSubAdmins((prev) =>
          prev.map((sa) => (sa.id === subAdmin.id ? { ...sa, status: nextStatus } : sa))
        );
      } else {
        showToast(res.message || 'Failed to toggle status', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error toggling account status', 'error');
    }
  };

  // Delete Sub-Admin Account
  const handleDeleteSubAdmin = async (subAdmin) => {
    if (subAdmin.isSuperAdmin) {
      showToast('Super Admin account cannot be deleted.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete the Sub-Admin account for "${subAdmin.name}" (${subAdmin.email})?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/admin/rbac/sub-admins/${subAdmin.id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        showToast('Sub-Admin account deleted successfully', 'success');
        setSubAdmins((prev) => prev.filter((sa) => sa.id !== subAdmin.id));
      } else {
        showToast(res.message || 'Failed to delete Sub-Admin', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error deleting Sub-Admin', 'error');
    }
  };

  // Create Custom Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleFormData.name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetchApi('/admin/rbac/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleFormData.name.trim(),
          description: roleFormData.description,
          permissionCodes: [],
        }),
      });

      if (res.success && res.data?.role) {
        showToast(`Role "${res.data.role.name}" created! Configure its permissions now.`, 'success');
        setShowCreateRoleModal(false);
        setRoleFormData({ name: '', description: '' });

        const refreshed = await fetchApi('/admin/rbac/roles');
        if (refreshed.success) {
          setRoles(refreshed.data.roles);
          const created = refreshed.data.roles.find((r) => r.id === res.data.role.id);
          if (created) handleSelectRole(created);
        }
      } else {
        showToast(res.message || 'Failed to create role', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error creating custom role', 'error');
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

  // Filtered Sub-Admins
  const filteredSubAdmins = useMemo(() => {
    return subAdmins.filter((sa) => {
      const matchSearch =
        !subAdminSearch.trim() ||
        sa.name?.toLowerCase().includes(subAdminSearch.toLowerCase()) ||
        sa.email?.toLowerCase().includes(subAdminSearch.toLowerCase()) ||
        sa.mobile?.includes(subAdminSearch);

      const matchRole =
        subAdminRoleFilter === 'ALL' ||
        sa.roles?.some((r) => r.id === subAdminRoleFilter || r.slug === subAdminRoleFilter);

      const matchStatus =
        subAdminStatusFilter === 'ALL' || sa.status === subAdminStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [subAdmins, subAdminSearch, subAdminRoleFilter, subAdminStatusFilter]);

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
    <div className="space-y-6 font-sans pb-20">
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
                  ? 'إدارة الأدوار وصلاحيات الوصول (RBAC)'
                  : 'Role-Based Access Control (RBAC)'}
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
              onClick={() => {
                setSubAdminFormData({
                  id: '',
                  name: '',
                  department: 'Operations',
                  email: '',
                  mobile: '',
                  password: '',
                  roleId: roles.find((r) => r.slug !== 'super_admin')?.id || '',
                });
                setShowCreateSubAdminModal(true);
              }}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>{locale === 'ar' ? 'إضافة مشرف جديد' : 'New Sub-Admin'}</span>
            </button>

            <button
              onClick={() => {
                setRoleFormData({ name: '', description: '' });
                setShowCreateRoleModal(true);
              }}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs transition-all shadow-xs cursor-pointer backdrop-blur-md"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
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

        {/* Card 2: Sub-Admin Team */}
        <div
          onClick={() => setActiveTab('sub_admins')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === 'ar' ? 'فريق المشرفين' : 'Sub-Admin Team'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                {subAdmins.length}
              </span>
              <span className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'مشرفين' : 'Members'}</span>
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold block">
              {subAdmins.filter((a) => a.status === 'ACTIVE').length} {locale === 'ar' ? 'نشط في النظام' : 'active accounts'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>

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
              {locale === 'ar' ? 'موزعة عبر 16 وحدة إدارية' : 'Across 16 core modules'}
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
            key: 'sub_admins',
            icon: Users,
            label: locale === 'ar' ? 'فريق المشرفين (Sub-Admins)' : 'Sub-Admin Accounts',
            count: subAdmins.length,
          },
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
      {/* TAB 1: Sub-Admin Accounts Management */}
      {/* ======================================================== */}
      {activeTab === 'sub_admins' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
              <input
                type="text"
                value={subAdminSearch}
                onChange={(e) => setSubAdminSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو الجوال...' : 'Search name, email, or mobile...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 rtl:pl-3 rtl:pr-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Role Filter */}
              <select
                value={subAdminRoleFilter}
                onChange={(e) => setSubAdminRoleFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                value={subAdminStatusFilter}
                onChange={(e) => setSubAdminStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">{locale === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                <option value="ACTIVE">{locale === 'ar' ? 'نشط (ACTIVE)' : 'Active'}</option>
                <option value="INACTIVE">{locale === 'ar' ? 'معطل (INACTIVE)' : 'Inactive'}</option>
              </select>

              <button
                onClick={async () => {
                  const refreshed = await fetchApi('/admin/rbac/sub-admins');
                  if (refreshed.success) setSubAdmins(refreshed.data.subAdmins);
                  showToast('Sub-admins refreshed', 'info');
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Admins Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">{locale === 'ar' ? 'المشرف' : 'Administrator'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'القسم' : 'Department'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الدور المخصص' : 'Assigned Role'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="px-5 py-4">{locale === 'ar' ? 'تاريخ الإنشاء' : 'Registered On'}</th>
                    <th className="px-5 py-4 text-center">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSubAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        {locale === 'ar'
                          ? 'لم يتم العثور على حسابات مشرفين مطابقة.'
                          : 'No sub-admin accounts found matching the criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubAdmins.map((admin) => {
                      const isSuper = admin.isSuperAdmin;
                      const roleObj = admin.roles?.[0];

                      return (
                        <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Name & Email */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                  isSuper
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{admin.name}</span>
                                  {isSuper && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-600 text-white">
                                      Super
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {admin.email}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {admin.mobile}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                              <Building className="w-3 h-3 text-slate-400" />
                              {admin.department || 'Operations'}
                            </span>
                          </td>

                          {/* Assigned Role */}
                          <td className="px-5 py-3.5">
                            {isSuper ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                                Super Admin
                              </span>
                            ) : roleObj ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                <Key className="w-3.5 h-3.5 text-emerald-600" />
                                {roleObj.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">
                                {locale === 'ar' ? 'بدون دور محدد' : 'No Role Assigned'}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                                admin.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  admin.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'
                                }`}
                              />
                              {admin.status}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditSubAdmin(admin)}
                                disabled={isSuper && !isSuperAdmin}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors disabled:opacity-40 cursor-pointer"
                                title="Edit Account"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Toggle Active/Inactive */}
                              <button
                                onClick={() => handleToggleSubAdminStatus(admin)}
                                disabled={isSuper}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  admin.status === 'ACTIVE'
                                    ? 'hover:bg-amber-50 text-slate-500 hover:text-amber-600'
                                    : 'hover:bg-emerald-50 text-slate-500 hover:text-emerald-700'
                                } disabled:opacity-40`}
                                title={admin.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                              >
                                {admin.status === 'ACTIVE' ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Unlock className="w-4 h-4" />
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteSubAdmin(admin)}
                                disabled={isSuper}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
      {/* TAB 2: Custom Roles & Permission Matrix */}
      {/* ======================================================== */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Roles Cards List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {locale === 'ar' ? 'الأدوار المعرفة' : 'System & Custom Roles'}
              </h2>
              <button
                onClick={() => {
                  setRoleFormData({ name: '', description: '' });
                  setShowCreateRoleModal(true);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'إضافة دور' : 'Add Role'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const isSuper = role.slug === 'super_admin';

                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSuper
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <span>{role.name}</span>
                            {role.is_system && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {role.description || 'No description provided'}
                          </p>
                        </div>
                      </div>

                      {!role.is_system && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-emerald-600" />
                        {isSuper
                          ? 'All Permissions (62)'
                          : `${role.permissions?.length || 0} permissions`}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {role.usersCount || role.users?.length || 0} users
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Permission Matrix Editor */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-6">
            {selectedRole ? (
              <>
                {/* Header of selected role */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{selectedRole.name}</h3>
                      {selectedRole.is_system ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                          {selectedRole.slug === 'super_admin' ? 'Unrestricted Super Admin' : 'System Core Role'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Custom Role
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {selectedRole.description || 'Configured with granular access rules below.'}
                    </p>
                  </div>

                  {/* Actions for Matrix */}
                  <div className="flex items-center gap-2">
                    {selectedRole.slug !== 'super_admin' && (
                      <>
                        <button
                          type="button"
                          onClick={selectAllPermissions}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          {locale === 'ar' ? 'تحديد الكل' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          onClick={clearAllPermissions}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          {locale === 'ar' ? 'إلغاء الكل' : 'Clear All'}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleSavePermissionMatrix}
                      disabled={savingMatrix || selectedRole.slug === 'super_admin'}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {savingMatrix ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'حفظ الصلاحيات' : 'Save Permissions'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Matrix Notice */}
                {selectedRole.slug === 'super_admin' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-purple-900">
                    <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                    <span>
                      {locale === 'ar'
                        ? 'يمتلك حساب المسؤول الأكبر (Super Admin) حق الوصول غير المقيد لجميع العمليات والوحدات.'
                        : 'The Super Admin role inherently holds full unconstrained administrative authority across all modules.'}
                    </span>
                  </div>
                )}

                {/* Modular Permission Grid */}
                <div className="space-y-4">
                  {Object.entries(permissionGroups).map(([moduleName, perms]) => {
                    const moduleCodes = perms.map((p) => p.code);
                    const isAllModuleSelected = moduleCodes.every((c) =>
                      selectedRole.slug === 'super_admin' || selectedPermissionCodes.has(c)
                    );
                    const isAnyModuleSelected = moduleCodes.some((c) =>
                      selectedRole.slug === 'super_admin' || selectedPermissionCodes.has(c)
                    );

                    return (
                      <div
                        key={moduleName}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                      >
                        {/* Module Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            <span className="font-black text-xs text-slate-800 uppercase tracking-wider">
                              {moduleName.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              ({moduleCodes.filter((c) => selectedRole.slug === 'super_admin' || selectedPermissionCodes.has(c)).length}/{perms.length})
                            </span>
                          </div>

                          {selectedRole.slug !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => toggleModulePermissions(moduleName)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                            >
                              {isAllModuleSelected ? 'Deselect Module' : 'Select All'}
                            </button>
                          )}
                        </div>

                        {/* Actions Checkbox Matrix */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {perms.map((p) => {
                            const isChecked =
                              selectedRole.slug === 'super_admin' || selectedPermissionCodes.has(p.code);

                            return (
                              <label
                                key={p.code}
                                onClick={() => togglePermission(p.code)}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-medium'
                                } ${selectedRole.slug === 'super_admin' ? 'cursor-default opacity-90' : ''}`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[11px] uppercase tracking-wider leading-tight">
                                    {p.action}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5" title={p.description}>
                                    {p.description || p.name}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-400">
                {locale === 'ar' ? 'حدد دوراً من القائمة الجانبية لتعديل صلاحياته.' : 'Select a role from the list to inspect and edit its permission matrix.'}
              </div>
            )}
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
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Create Sub-Admin Account */}
      {/* ======================================================== */}
      {showCreateSubAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <UserPlus className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'إنشاء حساب مشرف جديد' : 'Create Sub-Admin Account'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar'
                      ? 'حدد بيانات الحساب والدور الإداري المخصص.'
                      : 'Assign administrative access with tailored module privileges.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateSubAdminModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subAdminFormData.name}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, name: e.target.value })
                    }
                    placeholder="e.g. Tariq Al-Ghamdi"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'القسم *' : 'Department *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subAdminFormData.department}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, department: e.target.value })
                    }
                    placeholder="e.g. Inventory / Logistics"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'البريد الإلكتروني *' : 'Official Email *'}
                </label>
                <input
                  type="email"
                  required
                  value={subAdminFormData.email}
                  onChange={(e) =>
                    setSubAdminFormData({ ...subAdminFormData, email: e.target.value })
                  }
                  placeholder="tariq@falconfresh.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'رقم الجوال *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subAdminFormData.mobile}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, mobile: e.target.value })
                    }
                    placeholder="+966501234567"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'كلمة المرور *' : 'Initial Password *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={subAdminFormData.password}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'الدور المخصص (Role) *' : 'Assigned Role *'}
                </label>
                <select
                  required
                  value={subAdminFormData.roleId}
                  onChange={(e) =>
                    setSubAdminFormData({ ...subAdminFormData, roleId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">{locale === 'ar' ? 'اختر الدور...' : 'Select a Role...'}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.is_system ? '(System)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSubAdminModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : locale === 'ar' ? 'إنشاء الحساب' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Edit Sub-Admin Account */}
      {/* ======================================================== */}
      {showEditSubAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Edit2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'تعديل حساب المشرف' : 'Edit Sub-Admin Account'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {subAdminFormData.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditSubAdminModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subAdminFormData.name}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'القسم' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={subAdminFormData.department}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={subAdminFormData.email}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'ar' ? 'رقم الجوال *' : 'Mobile *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={subAdminFormData.mobile}
                    onChange={(e) =>
                      setSubAdminFormData({ ...subAdminFormData, mobile: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'تغيير كلمة المرور (اختياري)' : 'New Password (leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={subAdminFormData.password}
                  onChange={(e) =>
                    setSubAdminFormData({ ...subAdminFormData, password: e.target.value })
                  }
                  placeholder="Leave empty to retain existing password"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'الدور الإداري المخصص' : 'Assigned Role'}
                </label>
                <select
                  value={subAdminFormData.roleId}
                  onChange={(e) =>
                    setSubAdminFormData({ ...subAdminFormData, roleId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">{locale === 'ar' ? 'اختر الدور...' : 'Select a Role...'}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.is_system ? '(System)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditSubAdminModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Create Custom Role */}
      {/* ======================================================== */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Shield className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {locale === 'ar' ? 'إنشاء دور إداري جديد' : 'Create Custom Role'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'ar'
                      ? 'حدد اسم الدور ووصفه، ثم خصص صلاحياته في المصفوفة.'
                      : 'Define role metadata then tailor its permission matrix.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'اسم الدور *' : 'Role Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  placeholder="e.g. Warehouse Inventory Supervisor"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={roleFormData.description}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, description: e.target.value })
                  }
                  placeholder="Role responsibilities and module scope description..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : locale === 'ar' ? 'إنشاء الدور' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
