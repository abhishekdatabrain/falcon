'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { Truck, UserPlus, Phone, X } from 'lucide-react';

export default function AdminDriversPage() {
  const { t, locale } = useLanguage();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    email: '',
    mobile: '',
    password: '',
    license_number: '',
    vehicle_details: '',
  });
  const [creating, setCreating] = useState(false);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/drivers');
      if (res.success) {
        setDrivers(res.data.drivers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetchApi('/admin/drivers', {
        method: 'POST',
        body: JSON.stringify(newDriver),
      });
      if (res.success) {
        alert(locale === 'ar' ? 'تم إنشاء حساب السائق بنجاح!' : 'Driver account created successfully!');
        setShowModal(false);
        setNewDriver({ email: '', mobile: '', password: '', license_number: '', vehicle_details: '' });
        await loadDrivers();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (driverId, currentStatus, currentAvail) => {
    const nextAvail = currentAvail === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
    try {
      const res = await fetchApi(`/admin/drivers/${driverId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ availabilityStatus: nextAvail }),
      });
      if (res.success) {
        await loadDrivers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة أسطول السائقين' : 'Driver Fleet Management'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'إضافة سائقين جدد ومتابعة حالتهم وحضورهم' : 'Admin-only driver creation and availability management'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs py-3 px-5 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20"
        >
          <UserPlus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة سائق جديد' : 'Create New Driver'}
        </button>
      </div>

      {/* Driver Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading driver fleet...</div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No driver accounts created yet. Click "Create New Driver" to add drivers.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {drivers.map((drv) => (
            <div key={drv.id} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3 hover:border-cyan-300 shadow-xs transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="truncate">
                  <h3 className="font-bold text-slate-900 truncate text-base">{drv.user?.email}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-cyan-600" /> {drv.user?.mobile}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  drv.availability_status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  drv.availability_status === 'BUSY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {drv.availability_status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <p><strong>License Number:</strong> <span className="font-mono text-cyan-700 font-bold">{drv.license_number}</span></p>
                <p><strong>Vehicle Info:</strong> {drv.vehicle_details || 'Standard Commercial Delivery Van'}</p>
                <p><strong>Account Status:</strong> <span className="text-emerald-700 font-semibold">{drv.user?.status}</span></p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleToggleStatus(drv.id, drv.driver_status, drv.availability_status)}
                  className="w-full btn-secondary text-xs py-2 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1.5"
                >
                  Toggle Availability ({drv.availability_status === 'AVAILABLE' ? 'Set Offline' : 'Set Available'})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">Create New Driver Account</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" required placeholder="driver@platform.com" value={newDriver.email} onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                <input type="text" required placeholder="+966500000000" value={newDriver.mobile} onChange={(e) => setNewDriver({ ...newDriver, mobile: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
                <input type="password" required placeholder="••••••••" value={newDriver.password} onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">License Number</label>
                <input type="text" required placeholder="DL-8839201" value={newDriver.license_number} onChange={(e) => setNewDriver({ ...newDriver, license_number: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle Details</label>
                <input type="text" placeholder="Toyota HiAce 2024 White" value={newDriver.vehicle_details} onChange={(e) => setNewDriver({ ...newDriver, vehicle_details: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm py-2.5 bg-slate-100 border-slate-200 text-slate-700">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 text-sm py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white">{creating ? 'Creating...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
