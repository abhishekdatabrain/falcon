'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(loginInput, password);
      if (res.success) {
        const user = res.data.user;
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (user.role === 'DRIVER') {
          router.push('/driver/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel rounded-3xl p-8 border border-white/15 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">{t('nav.login')}</h1>
          <p className="text-sm text-gray-400">Access your Customer, Driver, or Admin account</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Email or Mobile Number
            </label>
            <input
              type="text"
              required
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. admin@platform.com or +966500000001"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 mt-4 text-base font-semibold"
          >
            {loading ? 'Authenticating...' : t('nav.login')}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-white/10 text-sm text-gray-400">
          Don't have a customer account?{' '}
          <Link href="/register" className="text-cyan-400 hover:underline font-medium">
            {t('nav.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
