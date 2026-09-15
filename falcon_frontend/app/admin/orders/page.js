'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { Package, Truck, UserCheck, Search, X } from 'lucide-react';

export default function AdminOrdersPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, drvRes] = await Promise.all([
        fetchApi('/admin/orders'),
        fetchApi('/admin/drivers'),
      ]);
      if (ordRes.success) setOrders(ordRes.data.orders || []);
      if (drvRes.success) setDrivers(drvRes.data.drivers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !selectedDriverId) return;
    try {
      setAssigning(true);
      const res = await fetchApi(`/admin/orders/${selectedOrder.id}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تعيين السائق بنجاح!' : 'Driver assigned successfully!',
          'success'
        );
        setSelectedOrder(null);
        setSelectedDriverId('');
        await loadData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === 'ALL' || ord.order_status === statusFilter;
    const matchesSearch = ord.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ord.customer?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ord.customer?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-xs">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة وتوجيه الطلبات' : 'Order Dispatch & Management'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'متابعة حالة الطلبات وتعيين السائقين للطلبات المؤكدة' : 'Track order statuses and assign active drivers to verified orders'}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث برقم الطلب...' : 'Search order #...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 pl-9 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs w-full sm:w-48 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
            <option value="DRIVER_ASSIGNED">DRIVER_ASSIGNED</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading orders catalog...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No orders match the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => (
            <div key={ord.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900 text-base">#{ord.order_number}</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    ord.order_status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    ord.order_status === 'PAYMENT_VERIFIED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    ord.order_status === 'OUT_FOR_DELIVERY' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {ord.order_status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Customer: <span className="font-semibold text-slate-900">{ord.customer?.first_name} {ord.customer?.last_name}</span> | Address: {ord.address?.area}, {ord.address?.city}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>Grand Total: <strong className="text-emerald-700">{parseFloat(ord.grand_total).toFixed(2)} SAR</strong></span>
                  <span>Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                  {ord.delivery?.driver && (
                    <span className="text-cyan-700 font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Driver: {ord.delivery.driver.user?.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {['PAYMENT_VERIFIED', 'DRIVER_ASSIGNED'].includes(ord.order_status) && (
                  <button
                    onClick={() => { setSelectedOrder(ord); setSelectedDriverId(ord.delivery?.driver_id || ''); }}
                    className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                  >
                    <UserCheck className="w-4 h-4" /> {locale === 'ar' ? 'تعيين / تغيير السائق' : 'Assign / Change Driver'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Driver Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">
                {locale === 'ar' ? `تعيين سائق للطلب #${selectedOrder.order_number}` : `Assign Driver to Order #${selectedOrder.order_number}`}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  {locale === 'ar' ? 'اختر السائق المتاح' : 'Select Available Driver'}
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500"
                  required
                >
                  <option value="">-- {locale === 'ar' ? 'اختر سائق' : 'Choose Driver'} --</option>
                  {drivers.map((drv) => (
                    <option key={drv.id} value={drv.id}>
                      {drv.user?.email} ({drv.availability_status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary flex-1 text-sm py-2.5 bg-slate-100 border-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="btn-primary flex-1 text-sm py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
