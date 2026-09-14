'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { Truck, AlertCircle } from 'lucide-react';

export default function DriverLoginPage() {
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
        if (res.data.user.role !== 'DRIVER') {
          setError('Access denied. This portal is strictly for Driver accounts.');
          return;
        }
        router.push('/driver/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Driver login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel rounded-3xl p-8 border border-cyan-500/30 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/40">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">{t('driver.title')}</h1>
          <p className="text-xs text-gray-400">Driver Portal (Admin Created Credentials Only)</p>
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
              Driver Email or Mobile
            </label>
            <input
              type="text"
              required
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="driver1@platform.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
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
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30"
          >
            {loading ? 'Authenticating Driver...' : 'Login to Driver Web Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
