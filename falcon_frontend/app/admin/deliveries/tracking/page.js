'use client';
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { fetchApi } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { useSocket } from '../../../../src/contexts/SocketContext';
import {
  Radio,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Search,
  RefreshCw,
  ExternalLink,
  Navigation,
  ShieldAlert,
  UserX,
  ChevronRight,
  Filter,
  Calendar,
  Phone,
  Mail,
  Building,
  Star,
  Layers,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';

const LiveTrackingMap = dynamic(
  () => import('../../../../src/components/LiveTrackingMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center">
        <span className="text-cyan-400 font-medium animate-pulse text-sm">
          Loading Live GPS Tracking Map...
        </span>
      </div>
    ),
  }
);

export default function AdminDeliveriesTrackingPage() {
  const { t, locale } = useLanguage();
  const { socket, joinDeliveryRoom, leaveDeliveryRoom, emitDriverLocation } = useSocket();

  // Primary State
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'UNASSIGNED' | 'COMPLETED' | 'HISTORY'
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [stats, setStats] = useState({ activeCount: 0, completedCount: 0, unassignedCount: 0, totalCount: 0 });
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Available Drivers State
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Modal State for Driver Assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetOrderToAssign, setTargetOrderToAssign] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [reassignmentReason, setReassignmentReason] = useState('');
  const [assigning, setAssigning] = useState(false);

  // History Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Real-time GPS Telemetry State for Selected Delivery
  const [liveTelemetry, setLiveTelemetry] = useState(null);

  // Simulated Driver Movement State
  const [isSimulating, setIsSimulating] = useState(false);
  const simIntervalRef = useRef(null);

  // Notification Banner
  const [toastMsg, setToastMsg] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Fetch Deliveries & Unassigned Orders
  const loadDeliveriesData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/admin/deliveries?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
      if (res.success && res.data) {
        setDeliveries(res.data.deliveries || []);
        setUnassignedOrders(res.data.unassignedOrders || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }

        // Auto-select first active delivery if none selected
        if (res.data.deliveries && res.data.deliveries.length > 0 && !selectedDelivery) {
          setSelectedDelivery(res.data.deliveries[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load deliveries data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Drivers List for Assignment Modal
  const loadDriversList = async () => {
    try {
      setLoadingDrivers(true);
      const res = await fetchApi('/admin/drivers');
      if (res.success && res.data) {
        setDrivers(res.data.drivers || []);
      }
    } catch (err) {
      console.error('Failed to load drivers list:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    loadDeliveriesData();
    loadDriversList();
  }, [statusFilter]);

  // Handle Socket Room Connection for Selected Active Delivery
  useEffect(() => {
    if (!selectedDelivery) return;

    const deliveryId = selectedDelivery.id;
    joinDeliveryRoom(deliveryId);

    // Initial Telemetry from record locations or defaults
    const initialLoc = selectedDelivery.locations && selectedDelivery.locations.length > 0
      ? selectedDelivery.locations[0]
      : null;

    setLiveTelemetry({
      lat: initialLoc ? parseFloat(initialLoc.latitude) : 24.7136,
      lng: initialLoc ? parseFloat(initialLoc.longitude) : 46.6753,
      speed: initialLoc ? initialLoc.speed : 35,
      heading: initialLoc ? initialLoc.heading : 90,
      timestamp: initialLoc ? initialLoc.createdAt : new Date().toISOString(),
    });

    if (socket) {
      const handleLocationUpdate = (data) => {
        if (data.deliveryId === deliveryId) {
          setLiveTelemetry({
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            speed: data.speed || 40,
            heading: data.heading || 0,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        }
      };

      socket.on('location_updated', handleLocationUpdate);

      return () => {
        leaveDeliveryRoom(deliveryId);
        socket.off('location_updated', handleLocationUpdate);
      };
    }
  }, [selectedDelivery, socket]);

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Handler: Assign Driver to Order
  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!targetOrderToAssign || !selectedDriverId) {
      showNotification('Please select a valid driver.', 'error');
      return;
    }

    try {
      setAssigning(true);
      const res = await fetchApi(`/admin/orders/${targetOrderToAssign.id}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify({
          driverId: selectedDriverId,
          reassignmentReason: reassignmentReason || 'Assigned via Delivery Control Panel',
        }),
      });

      if (res.success) {
        showNotification(`Driver assigned successfully to Order #${targetOrderToAssign.order_number}!`);
        setShowAssignModal(false);
        setTargetOrderToAssign(null);
        setSelectedDriverId('');
        setReassignmentReason('');
        await loadDeliveriesData();
        await loadDriversList();
      } else {
        showNotification(res.message || 'Failed to assign driver', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error occurred while assigning driver', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // Handler: Admin Update Order / Delivery Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetchApi(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          notes: `Status updated by Admin to ${newStatus}`,
        }),
      });

      if (res.success) {
        showNotification(`Order status updated to ${newStatus}`);
        await loadDeliveriesData();

        // Update selected delivery status locally if matched
        if (selectedDelivery && selectedDelivery.order_id === orderId) {
          setSelectedDelivery(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        showNotification(res.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update status', 'error');
    }
  };

  // Handler: Simulate Live Driver GPS Movement
  const toggleGpsSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsSimulating(false);
      showNotification('Live GPS Telemetry Simulation Paused', 'info');
      return;
    }

    if (!selectedDelivery) return;

    setIsSimulating(true);
    showNotification('Live GPS Telemetry Simulation Started 🚀');

    const destLat = selectedDelivery.order?.address?.latitude
      ? parseFloat(selectedDelivery.order.address.latitude)
      : 24.7200;
    const destLng = selectedDelivery.order?.address?.longitude
      ? parseFloat(selectedDelivery.order.address.longitude)
      : 46.6850;

    let currLat = liveTelemetry ? liveTelemetry.lat : 24.7100;
    let currLng = liveTelemetry ? liveTelemetry.lng : 46.6700;

    simIntervalRef.current = setInterval(() => {
      // Step towards destination
      const latDiff = (destLat - currLat) * 0.15;
      const lngDiff = (destLng - currLng) * 0.15;

      currLat += latDiff;
      currLng += lngDiff;

      const currentSpeed = Math.floor(Math.random() * 25) + 30; // 30-55 km/h
      const heading = Math.floor(Math.random() * 360);

      // Broadcast via socket
      emitDriverLocation({
        deliveryId: selectedDelivery.id,
        latitude: currLat,
        longitude: currLng,
        speed: currentSpeed,
        heading: heading,
      });

      setLiveTelemetry({
        lat: currLat,
        lng: currLng,
        speed: currentSpeed,
        heading: heading,
        timestamp: new Date().toISOString(),
      });
    }, 2500);
  };

  // Delivery status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Delivered ✓' };
      case 'OUT_FOR_DELIVERY':
        return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 animate-pulse', label: 'Out For Delivery 🚚' };
      case 'ARRIVED':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse', label: 'Arrived At Customer 📍' };
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Driver Assigned 👤' };
      case 'PAYMENT_VERIFIED':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Pending Dispatch ⏳' };
      case 'CANCELLED':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Cancelled ✕' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status || 'Processing' };
    }
  };

  const getDriverAvailabilityBadge = (availStatus) => {
    switch (availStatus) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">AVAILABLE</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">BUSY</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">OFFLINE</span>;
    }
  };

  const filteredDeliveries = deliveries.filter((del) => {
    if (activeTab === 'ACTIVE') {
      return ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(del.status);
    }
    if (activeTab === 'COMPLETED') {
      return del.status === 'DELIVERED';
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMsg.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : toastMsg.type === 'info'
            ? 'bg-cyan-50 text-cyan-900 border-cyan-200'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
        }`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ar' ? 'إدارة التوصيل والتتبع المباشر' : 'Delivery Fleet Control & Real-Time Tracking'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-black uppercase border border-cyan-200">
                LIVE GPS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {locale === 'ar'
                ? 'متابعة أسطول السائقين، تعيين الطلبات، وتتبع مواقع التوصيل مباشرة عبر الخريطة'
                : 'Monitor active fleet runs, assign drivers to orders, track driver GPS telemetry, and view customer delivery locations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => {
              loadDeliveriesData();
              loadDriversList();
              showNotification('Fleet data refreshed');
            }}
            className="btn-secondary text-xs py-2.5 px-4 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center gap-2 cursor-pointer rounded-2xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
            <span>Refresh Fleet</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'ACTIVE' ? 'text-cyan-100' : 'text-slate-500'}`}>
              Active Deliveries
            </span>
            <Truck className={`w-5 h-5 ${activeTab === 'ACTIVE' ? 'text-white' : 'text-cyan-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'ACTIVE' ? 'text-white' : 'text-slate-900'}`}>
            {stats.activeCount}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'ACTIVE' ? 'text-cyan-100' : 'text-slate-500'}`}>
            In transit or assigned runs
          </p>
        </div>

        <div
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'UNASSIGNED'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'UNASSIGNED' ? 'text-amber-100' : 'text-slate-500'}`}>
              Unassigned Orders
            </span>
            <UserX className={`w-5 h-5 ${activeTab === 'UNASSIGNED' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'UNASSIGNED' ? 'text-white' : 'text-slate-900'}`}>
            {stats.unassignedCount}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'UNASSIGNED' ? 'text-amber-100' : 'text-slate-500'}`}>
            Orders awaiting driver assignment
          </p>
        </div>

        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'COMPLETED' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Completed Runs
            </span>
            <CheckCircle2 className={`w-5 h-5 ${activeTab === 'COMPLETED' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'COMPLETED' ? 'text-white' : 'text-slate-900'}`}>
            {stats.completedCount}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'COMPLETED' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Successfully delivered orders
          </p>
        </div>

        <div
          onClick={() => setActiveTab('HISTORY')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-400 shadow-md shadow-purple-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'HISTORY' ? 'text-purple-100' : 'text-slate-500'}`}>
              Available Fleet Drivers
            </span>
            <UserCheck className={`w-5 h-5 ${activeTab === 'HISTORY' ? 'text-white' : 'text-purple-600'}`} />
          </div>
          <p className={`text-3xl font-black mt-2 ${activeTab === 'HISTORY' ? 'text-white' : 'text-slate-900'}`}>
            {drivers.filter(d => d.availability_status === 'AVAILABLE').length} / {drivers.length}
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${activeTab === 'HISTORY' ? 'text-purple-100' : 'text-slate-500'}`}>
            Active online drivers ready
          </p>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ACTIVE'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Deliveries ({stats.activeCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'UNASSIGNED'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>Assign Drivers ({stats.unassignedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed Runs ({stats.completedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Delivery History & Search</span>
        </button>
      </div>

      {/* ========================================================================================= */}
      {/* TAB 1: ACTIVE DELIVERIES & REAL-TIME GPS MAP MONITOR */}
      {/* ========================================================================================= */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
              <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-3" />
              <p className="font-semibold text-sm">Loading live fleet deliveries...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-200">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Active Deliveries in Progress</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no active delivery runs in transit. Check the &apos;Assign Drivers&apos; tab to assign drivers to paid customer orders.
              </p>
              <button
                onClick={() => setActiveTab('UNASSIGNED')}
                className="px-5 py-2.5 rounded-2xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-700 transition-all shadow-sm"
              >
                View Unassigned Orders ({stats.unassignedCount})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Active Deliveries List Sidebar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Active Runs ({deliveries.length})
                  </h3>
                  <span className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                    Live Updates
                  </span>
                </div>

                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {deliveries.map((del) => {
                    const isSelected = selectedDelivery?.id === del.id;
                    const badge = getStatusBadge(del.status);
                    const orderNo = del.order?.order_number || 'N/A';
                    const driverEmail = del.driver?.user?.email || 'Unassigned Driver';
                    const customerName = del.order?.customer?.user?.email || 'Customer';
                    const addressStr = del.order?.address
                      ? `${del.order.address.area || ''}, ${del.order.address.city || ''}`
                      : 'Address specified';

                    return (
                      <div
                        key={del.id}
                        onClick={() => setSelectedDelivery(del)}
                        className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50/90 shadow-md ring-2 ring-cyan-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-cyan-600" />}

                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">Order #{orderNo}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">{new Date(del.updatedAt).toLocaleTimeString()}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-700">
                          <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <span className="truncate">{driverEmail}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">📍 {addressStr}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Selected Active Delivery Map & Telemetry Control */}
              <div className="lg:col-span-2 space-y-5">
                {selectedDelivery ? (
                  <div className="space-y-5">
                    
                    {/* Selected Delivery Action Header */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900">
                              Order #{selectedDelivery.order?.order_number}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedDelivery.status).bg}`}>
                              {getStatusBadge(selectedDelivery.status).label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            Assigned Driver: <strong className="text-slate-800">{selectedDelivery.driver?.user?.email}</strong> ({selectedDelivery.driver?.user?.mobile || 'N/A'})
                          </p>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setTargetOrderToAssign(selectedDelivery.order);
                              setShowAssignModal(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4 text-amber-700" />
                            <span>Reassign Driver</span>
                          </button>

                          <button
                            onClick={toggleGpsSimulation}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSimulating
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                            }`}
                          >
                            {isSimulating ? <Pause className="w-4 h-4 text-rose-600" /> : <Play className="w-4 h-4 text-cyan-600" />}
                            <span>{isSimulating ? 'Pause GPS Simulation' : 'Simulate GPS Movement'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Delivery Status Stepper Controls */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Update Order Delivery Status
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {['OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].map((st) => {
                            const isCurrent = selectedDelivery.status === st;
                            return (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(selectedDelivery.order_id, st)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isCurrent
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                <span>Mark as {st.replace(/_/g, ' ')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Real-time Telemetry Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Driver Latitude</span>
                        <span className="font-mono text-cyan-400 font-bold text-sm">
                          {liveTelemetry ? liveTelemetry.lat.toFixed(5) : '24.71360'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Driver Longitude</span>
                        <span className="font-mono text-cyan-400 font-bold text-sm">
                          {liveTelemetry ? liveTelemetry.lng.toFixed(5) : '46.67530'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Speed</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {liveTelemetry ? `${liveTelemetry.speed} km/h` : '35 km/h'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Telemetry Stream</span>
                        <span className="font-mono text-amber-400 font-bold text-[11px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          Live Connected
                        </span>
                      </div>
                    </div>

                    {/* Live GPS Map Container */}
                    <LiveTrackingMap
                      driverLat={liveTelemetry ? liveTelemetry.lat : null}
                      driverLng={liveTelemetry ? liveTelemetry.lng : null}
                      destLat={
                        selectedDelivery.order?.address?.latitude
                          ? parseFloat(selectedDelivery.order.address.latitude)
                          : 24.7200
                      }
                      destLng={
                        selectedDelivery.order?.address?.longitude
                          ? parseFloat(selectedDelivery.order.address.longitude)
                          : 46.6850
                      }
                      driverName={selectedDelivery.driver?.user?.email || 'Driver'}
                      customerName={selectedDelivery.order?.customer?.user?.email || 'Customer'}
                      orderNumber={selectedDelivery.order?.order_number || ''}
                      title={`Tracking Run #${selectedDelivery.order?.order_number}`}
                    />

                    {/* Customer Delivery Location Details Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-sm font-black text-slate-900">
                            Customer Delivery Destination & Contact Details
                          </h3>
                        </div>

                        {selectedDelivery.order?.address?.latitude && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedDelivery.order.address.latitude},${selectedDelivery.order.address.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
                          >
                            <span>Open Directions</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Info</span>
                          <p className="font-extrabold text-slate-900 text-sm">
                            {selectedDelivery.order?.customer?.first_name ? `${selectedDelivery.order.customer.first_name} ${selectedDelivery.order.customer.last_name}` : selectedDelivery.order?.customer?.user?.email}
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-600 font-semibold">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{selectedDelivery.order?.customer?.user?.email}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-600 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{selectedDelivery.order?.customer?.user?.mobile || selectedDelivery.order?.address?.mobile || 'N/A'}</span>
                          </p>
                        </div>

                        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Address</span>
                          <p className="font-bold text-slate-900">
                            {selectedDelivery.order?.address?.building_number ? `Bldg #${selectedDelivery.order.address.building_number}, ` : ''}
                            {selectedDelivery.order?.address?.street || ''}
                          </p>
                          <p className="text-slate-600 font-medium">
                            {selectedDelivery.order?.address?.area ? `${selectedDelivery.order.address.area}, ` : ''}
                            {selectedDelivery.order?.address?.city}, {selectedDelivery.order?.address?.postal_code || ''}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-mono font-bold pt-1">
                            📍 Coordinates: {selectedDelivery.order?.address?.latitude || '24.7200'}, {selectedDelivery.order?.address?.longitude || '46.6850'}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
                    Select an active delivery run from the left sidebar to view live map and tracking data.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 2: UNASSIGNED ORDERS & DRIVER ASSIGNMENT */}
      {/* ========================================================================================= */}
      {activeTab === 'UNASSIGNED' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Orders Awaiting Driver Assignment ({unassignedOrders.length})
              </h3>
              <p className="text-xs text-slate-500">
                These paid customer orders have been verified and require an assigned driver to initiate delivery dispatch.
              </p>
            </div>
          </div>

          {unassignedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">All Paid Orders Have Drivers Assigned!</h4>
              <p className="text-xs text-slate-500">There are no pending orders waiting for driver assignment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedOrders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-base font-black text-slate-900 block">Order #{ord.order_number}</span>
                        <span className="text-xs text-slate-400 font-semibold">{new Date(ord.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200">
                        {ord.order_status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <p className="text-slate-900 font-bold">
                        👤 Customer: {ord.customer?.user?.email || 'Customer'}
                      </p>
                      <p className="text-slate-600 font-medium">
                        📍 Destination: {ord.address ? `${ord.address.area || ''}, ${ord.address.city}` : 'Specified address'}
                      </p>
                      <p className="text-slate-600 font-medium">
                        📦 Items: {ord.items ? ord.items.length : 0} Products
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTargetOrderToAssign(ord);
                      setShowAssignModal(true);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Assign Driver to Order</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 3: COMPLETED DELIVERIES */}
      {/* ========================================================================================= */}
      {activeTab === 'COMPLETED' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-black text-slate-900">
              Completed Delivery History & Logs ({stats.completedCount})
            </h3>
            <p className="text-xs text-slate-500">
              Completed runs with driver information, timestamps, and customer feedback.
            </p>
          </div>

          {filteredDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80">
              No completed delivery runs found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeliveries.map((del) => (
                <div key={del.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-lg font-black text-slate-900 block">Order #{del.order?.order_number}</span>
                      <span className="text-xs text-slate-400 font-medium">Delivered: {new Date(del.updatedAt).toLocaleString()}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                      DELIVERED ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Driver</span>
                      <p className="font-extrabold text-slate-900 mt-1">{del.driver?.user?.email}</p>
                      <p className="text-slate-500 font-semibold">{del.driver?.user?.mobile}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Destination</span>
                      <p className="font-extrabold text-slate-900 mt-1">{del.order?.customer?.user?.email}</p>
                      <p className="text-slate-500 font-semibold">{del.order?.address?.area}, {del.order?.address?.city}</p>
                    </div>
                  </div>

                  {/* Customer Review / Feedback if available */}
                  {del.order?.feedback && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-amber-800 font-extrabold">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>Customer Review: {del.order.feedback.rating} / 5 Stars</span>
                      </div>
                      <p className="text-slate-700 font-medium italic">&quot;{del.order.feedback.comment}&quot;</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 4: DELIVERY HISTORY TABLE & SEARCH */}
      {/* ========================================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Comprehensive Delivery Logs</h3>
              <p className="text-xs text-slate-500">Filter and search through all historical delivery runs</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order # or Driver..."
                  className="pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 w-64"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none focus:border-cyan-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Runs Only</option>
                <option value="DRIVER_ASSIGNED">Driver Assigned</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No delivery records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => {
                    const badge = getStatusBadge(del.status);
                    return (
                      <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          #{del.order?.order_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{del.driver?.user?.email}</p>
                          <p className="text-[11px] text-slate-500">{del.driver?.user?.mobile}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {del.order?.customer?.user?.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          📍 {del.order?.address?.area}, {del.order?.address?.city}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(del.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL: ASSIGN / REASSIGN DRIVER */}
      {/* ========================================================================================= */}
      {showAssignModal && targetOrderToAssign && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Assign Driver to Order #{targetOrderToAssign.order_number}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select an active fleet driver for dispatch</p>
              </div>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4">
              
              {/* Drivers Selection List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Available Driver ({drivers.length} registered)
                </label>

                {loadingDrivers ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Loading drivers list...</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {drivers.map((drv) => {
                      const isSelected = selectedDriverId === drv.id;
                      return (
                        <div
                          key={drv.id}
                          onClick={() => setSelectedDriverId(drv.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{drv.user?.email}</p>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Mobile: {drv.user?.mobile} • Lic: {drv.license_number}
                            </p>
                          </div>
                          <div>
                            {getDriverAvailabilityBadge(drv.availability_status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reassignment Reason Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assignment Notes / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reassignmentReason}
                  onChange={(e) => setReassignmentReason(e.target.value)}
                  placeholder="e.g. Assigned to closest vehicle in area"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setTargetOrderToAssign(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedDriverId}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50"
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
