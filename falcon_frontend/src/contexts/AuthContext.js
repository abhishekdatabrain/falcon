'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi, setCsrfToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.success && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (loginInput, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginInput, password }),
    });
    if (res.success && res.data.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (data) => {
    return await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const logout = async (roleOverride) => {
    const isClient = typeof window !== 'undefined';
    const path = isClient ? window.location.pathname : '';
    const targetRole = roleOverride || (path.startsWith('/admin') ? 'ADMIN' : (path.startsWith('/driver') ? 'DRIVER' : 'CUSTOMER'));

    try {
      await fetchApi('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ role: targetRole }),
      });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setCsrfToken('');
      setUser(null);
      if (isClient) {
        if (targetRole === 'ADMIN' || path.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else if (targetRole === 'DRIVER' || path.startsWith('/driver')) {
          window.location.href = '/driver/login';
        } else {
          window.location.href = '/';
        }
      }
    }
  };

  const isSuperAdmin = Boolean(
    user?.isSuperAdmin ||
    (user?.role === 'ADMIN' && user?.roles?.some((r) => r.slug === 'super_admin'))
  );

  const hasPermission = (permissionCode) => {
    if (!user || user.role !== 'ADMIN') return false;
    if (isSuperAdmin) return true;
    const permissions = user.permissions || [];
    if (permissions.includes('*')) return true;
    if (!permissionCode) return true;
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (...codes) => {
    if (!user || user.role !== 'ADMIN') return false;
    if (isSuperAdmin) return true;
    return codes.some((c) => hasPermission(c));
  };

  const hasModuleAccess = (moduleName) => {
    if (!user || user.role !== 'ADMIN') return false;
    if (isSuperAdmin) return true;
    const permissions = user.permissions || [];
    if (permissions.includes('*')) return true;
    return permissions.some((p) => p.startsWith(`${moduleName}.`));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        hasModuleAccess,
        login,
        register,
        logout,
        checkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
