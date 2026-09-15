'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { fetchApi } from '../../../src/services/api';
import { Truck, MapPin, CheckCircle2, Clock, Navigation, AlertCircle, RefreshCw } from 'lucide-react';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { emitDriverLocation, joinDeliveryRoom, leaveDeliveryRoom } = useSocket();

  const [driver, setDriver] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDeliveryId, setActiveDeliveryId] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Idle');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/drivers/dashboard');
      if (res.success) {
        setDriver(res.data.driver);
        setDeliveries(res.data.deliveries || []);

        // Find active delivery run
        const active = (res.data.deliveries || []).find((d) =>
          ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(d.status)
        );
        if (active) {
          setActiveDeliveryId(active.id);
        } else {
          setActiveDeliveryId(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // HTML5 Browser Geolocation API Watcher during active delivery
  useEffect(() => {
    if (!activeDeliveryId) {
      setGpsStatus('Stopped');
      return;
    }

    joinDeliveryRoom(activeDeliveryId);
    setGpsStatus('Active & Sharing Location');

    if (!navigator.geolocation) {
      setGpsStatus('Browser Geolocation Not Supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;

        // Broadcast to Socket.IO Delivery Room
        emitDriverLocation({
          deliveryId: activeDeliveryId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
        });

        // Periodically log location to backend persistence
        fetchApi('/drivers/gps-location', {
          method: 'POST',
          body: JSON.stringify({
            deliveryId: activeDeliveryId,
            latitude,
            longitude,
            speed,
            heading,
          }),
        }).catch(() => {});
      },
      (err) => {
        setGpsStatus(`GPS Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      leaveDeliveryRoom(activeDeliveryId);
    };
  }, [activeDeliveryId]);

  const handleUpdateAvailability = async (newStatus) => {
    try {
      const res = await fetchApi('/drivers/availability', {
        method: 'PUT',
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      if (res.success) {
        await loadDashboard();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAcceptDelivery = async (deliveryId) => {
    try {
      const res = await fetchApi(`/drivers/deliveries/${deliveryId}/accept`, {
        method: 'POST',
      });
      if (res.success) {
        await loadDashboard();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusUpdate = async (deliveryId, nextStatus) => {
    try {
      const res = await fetchApi(`/drivers/deliveries/${deliveryId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.success) {
        await loadDashboard();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading Driver Portal...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Header & Availability Controls */}
      <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{t('driver.dashboard')}</h1>
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/40">
              License: {driver?.license_number}
            </span>
          </div>
          <p className="text-xs text-gray-400">Vehicle: {driver?.vehicle_details}</p>
        </div>

        {/* Availability Toggle Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
          {['AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
            <button
              key={status}
              onClick={() => handleUpdateAvailability(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                driver?.availability_status === status
                  ? status === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : status === 'BUSY'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-slate-700 text-gray-200'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time GPS Tracker Status Card */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className={`w-5 h-5 ${activeDeliveryId ? 'text-emerald-400 animate-spin' : 'text-gray-500'}`} />
          <div>
            <span className="text-xs text-gray-400 block font-semibold uppercase">Browser Geolocation Stream</span>
            <span className="text-sm font-bold text-white">{gpsStatus}</span>
          </div>
        </div>
        <button onClick={loadDashboard} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Assigned Deliveries List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t('driver.assignedDeliveries')}</h2>

        {deliveries.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-gray-400">
            No delivery runs assigned at the moment.
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((del) => {
              const order = del.order;
              const status = del.status;

              return (
                <div key={del.id} className="glass-panel rounded-2xl p-6 border border-white/15 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-white">Order #{order?.order_number}</span>
                        <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Customer: {order?.customer?.first_name} {order?.customer?.last_name} ({order?.customer?.user?.mobile})</p>
                    </div>

                    <span className="text-xl font-bold text-cyan-400">{parseFloat(order?.grand_total || 0).toFixed(2)} SAR</span>
                  </div>

                  {/* Destination Address */}
                  <div className="p-3 rounded-xl bg-slate-900/60 text-xs text-gray-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">{order?.address?.full_name}</p>
                      <p>{order?.address?.address_line}, {order?.address?.area}, {order?.address?.city}</p>
                    </div>
                  </div>

                  {/* Delivery Workflow Control Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {status === 'DRIVER_ASSIGNED' && (
                      <button
                        onClick={() => handleAcceptDelivery(del.id)}
                        className="btn-primary text-xs py-2 px-4"
                      >
                        Accept Delivery Run
                      </button>
                    )}

                    {status === 'DRIVER_ACCEPTED' && (
                      <button
                        onClick={() => handleStatusUpdate(del.id, 'OUT_FOR_DELIVERY')}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" /> Start Delivery (Out For Delivery)
                      </button>
                    )}

                    {status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleStatusUpdate(del.id, 'ARRIVED')}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" /> Mark as Arrived at Customer Location
                      </button>
                    )}

                    {status === 'ARRIVED' && (
                      <button
                        onClick={() => handleStatusUpdate(del.id, 'DELIVERED')}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete Delivery & Issue ZATCA Invoice
                      </button>
                    )}

                    {status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Delivery Completed Successfully
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
