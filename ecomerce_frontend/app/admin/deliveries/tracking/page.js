'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchApi } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { Radio } from 'lucide-react';

const LiveTrackingMap = dynamic(
  () => import('../../../../src/components/LiveTrackingMap'),
  { ssr: false, loading: () => <div className="py-12 text-center text-slate-500">Loading map component...</div> }
);

export default function AdminDeliveriesTrackingPage() {
  const { t, locale } = useLanguage();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/deliveries');
      if (res.success) {
        setDeliveries(res.data.deliveries || []);
        if (res.data.deliveries?.length > 0 && !selectedDelivery) {
          setSelectedDelivery(res.data.deliveries[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shadow-xs">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'التتبع المباشر لأسطول التوصيل' : 'Live Fleet GPS Tracking'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'متابعة موقع السائقين المباشر عبر الخريطة التفاعلية' : 'Real-time WebSocket driver position streaming for active delivery runs'}
            </p>
          </div>
        </div>

        <button onClick={loadDeliveries} className="btn-secondary text-xs py-2.5 px-4 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200">
          Refresh Deliveries
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading active fleet runs...</div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No active delivery runs currently in progress.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Deliveries List Sidebar */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Active Deliveries ({deliveries.length})</h3>
            {deliveries.map((del) => {
              const isSelected = selectedDelivery?.id === del.id;
              return (
                <div
                  key={del.id}
                  onClick={() => setSelectedDelivery(del)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                    isSelected ? 'border-cyan-500 bg-cyan-50/80 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 text-sm">Order #{del.order?.order_number}</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-200">
                      {del.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 truncate">
                    Driver: <span className="font-semibold text-slate-900">{del.driver?.user?.email}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    📍 {del.order?.address?.area}, {del.order?.address?.city}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Live Map Display */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDelivery ? (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Tracking Order #{selectedDelivery.order?.order_number}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Assigned Driver: {selectedDelivery.driver?.user?.email} ({selectedDelivery.driver?.user?.mobile})
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      Live Stream Active
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-2 border border-slate-200 overflow-hidden min-h-[450px] shadow-xs">
                  <LiveTrackingMap deliveryId={selectedDelivery.id} initialStatus={selectedDelivery.status} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
                Select a delivery run to view live tracking map.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
