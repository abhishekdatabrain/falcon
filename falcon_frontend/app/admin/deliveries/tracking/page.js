'use client';
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
  Pause,
  Package,
  Eye,
  X,
  Check
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
  const [showMapModal, setShowMapModal] = useState(false);

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

        // Auto-select first active delivery or update current selection
        if (res.data.deliveries && res.data.deliveries.length > 0) {
          if (!selectedDelivery) {
            setSelectedDelivery(res.data.deliveries[0]);
          } else {
            const updatedMatch = res.data.deliveries.find((d) => d.id === selectedDelivery.id);
            if (updatedMatch) {
              setSelectedDelivery(updatedMatch);
            }
          }
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
    loadDriversList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDeliveriesData();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery]);

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
            lat: parseFloat(data.latitude || data.lat),
            lng: parseFloat(data.longitude || data.lng),
            speed: data.speed || 40,
            heading: data.heading || 0,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        }
      };

      socket.on('location_updated', handleLocationUpdate);
      socket.on('driver_location_update', handleLocationUpdate);

      return () => {
        leaveDeliveryRoom(deliveryId);
        socket.off('location_updated', handleLocationUpdate);
        socket.off('driver_location_update', handleLocationUpdate);
      };
    }
  }, [selectedDelivery, socket]);

  // Global Admin Room Real-time Sync for Order Assignments & Status Updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_admin_room');

    const handleGlobalStatusUpdate = (data) => {
      loadDeliveriesData();
      if (data && data.notes) {
        showNotification(`Update: ${data.notes}`);
      }
    };

    const handleGlobalOrderAssigned = (data) => {
      loadDeliveriesData();
      if (data && data.orderNumber) {
        showNotification(`Order #${data.orderNumber} assigned to driver.`);
      }
    };

    socket.on('order_status_update', handleGlobalStatusUpdate);
    socket.on('order_assigned', handleGlobalOrderAssigned);

    return () => {
      socket.off('order_status_update', handleGlobalStatusUpdate);
      socket.off('order_assigned', handleGlobalOrderAssigned);
    };
  }, [socket]);

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

  const activeDeliveries = deliveries.filter((del) =>
    ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(del.status)
  );

  const completedDeliveries = deliveries.filter((del) => del.status === 'DELIVERED');

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
            {activeDeliveries.length}
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
            {unassignedOrders.length}
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
            {completedDeliveries.length}
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
          <span>Active Deliveries ({activeDeliveries.length})</span>
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
          <span>Assign Drivers ({unassignedOrders.length})</span>
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
          <span>Completed Runs ({completedDeliveries.length})</span>
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
      {/* ========================================================================================= */}
      {/* TAB 1: ACTIVE DELIVERIES TABLE & REAL-TIME FLEET MONITOR */}
      {/* ========================================================================================= */}
      {activeTab === 'ACTIVE' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Active In-Transit Deliveries ({activeDeliveries.length})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase border border-cyan-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                  Live Fleet
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time tracking of active driver assignments, in-transit routes, and quick status controls
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Active runs: <strong className="text-slate-800">{activeDeliveries.length}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-3" />
              <p className="font-semibold text-sm">Loading live fleet deliveries...</p>
            </div>
          ) : activeDeliveries.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-200">
                <Truck className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No Active Deliveries in Progress</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no active delivery runs in transit. Check the &apos;Assign Drivers&apos; tab to assign drivers to paid customer orders.
              </p>
              <button
                onClick={() => setActiveTab('UNASSIGNED')}
                className="px-5 py-2.5 rounded-2xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-700 transition-all shadow-sm cursor-pointer"
              >
                View Unassigned Orders ({stats.unassignedCount})
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">Order Ref & Time</th>
                    <th className="px-5 py-4 whitespace-nowrap">Customer Info</th>
                    <th className="px-5 py-4 whitespace-nowrap">Destination Address</th>
                    <th className="px-5 py-4 whitespace-nowrap">Assigned Driver</th>
                    <th className="px-5 py-4 whitespace-nowrap">Delivery Status</th>
                    <th className="px-5 py-4 whitespace-nowrap">Quick Status Update</th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">Live Fleet Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeDeliveries.map((del) => {
                    const badge = getStatusBadge(del.status);
                    const orderNo = del.order?.order_number || 'N/A';
                    const customer = del.order?.customer;
                    const customerName = customer
                      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.user?.email || 'Customer'
                      : del.order?.customer?.user?.email || 'Customer';
                    const customerMobile = customer?.user?.mobile || del.order?.address?.mobile || 'N/A';
                    const customerEmail = customer?.user?.email || del.order?.customer?.email || '';
                    const address = del.order?.address;
                    const driver = del.driver;
                    const driverEmail = driver?.user?.email || 'Unassigned';
                    const driverMobile = driver?.user?.mobile || 'N/A';

                    return (
                      <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Order Ref & Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0 border border-cyan-100">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <Link
                                href={`/admin/orders/${del.order_id}`}
                                className="font-black text-slate-900 text-xs font-mono hover:text-cyan-600 transition-colors flex items-center gap-1"
                              >
                                <span>#{orderNo}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                              <span className="text-[11px] text-slate-400 font-medium block">
                                {new Date(del.updatedAt || del.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(del.updatedAt || del.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Customer Info */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{customerName}</p>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{customerMobile}</span>
                            </p>
                            {customerEmail && (
                              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                                {customerEmail}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 3. Destination Address */}
                        <td className="px-5 py-4">
                          <div className="max-w-[220px]">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {address?.area ? `${address.area}, ` : ''}{address?.city || 'Riyadh'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {address?.building_number ? `Bldg ${address.building_number}, ` : ''}{address?.street || 'Customer Location'}
                            </p>
                            {address?.latitude && address?.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 mt-1"
                              >
                                <MapPin className="w-3 h-3 text-emerald-500" />
                                <span>View on Maps</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 4. Assigned Driver */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                              <span className="truncate max-w-[170px]">{driverEmail}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Tel: {driverMobile}
                            </p>
                            {driver?.license_number && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Lic: {driver.license_number}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Delivery Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border inline-flex items-center gap-1 ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* 6. Quick Status Update */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {['OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].map((st) => {
                              const isCurrent = del.status === st;
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateStatus(del.order_id, st)}
                                  title={`Mark as ${st.replace(/_/g, ' ')}`}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                    isCurrent
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  {isCurrent && <Check className="w-3 h-3 text-emerald-400" />}
                                  <span>{st === 'OUT_FOR_DELIVERY' ? 'Out' : st === 'ARRIVED' ? 'Arrived' : 'Delivered'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* 7. Live Fleet Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedDelivery(del);
                                setShowMapModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              title="Open Live GPS Tracking Map"
                            >
                              <Radio className="w-3.5 h-3.5 animate-pulse" />
                              <span>Live GPS</span>
                            </button>

                            <button
                              onClick={() => {
                                setTargetOrderToAssign(del.order);
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Reassign to another driver"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                              <span>Reassign</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 2: UNASSIGNED ORDERS TABLE & DRIVER ASSIGNMENT */}
      {/* ========================================================================================= */}
      {activeTab === 'UNASSIGNED' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Orders Awaiting Driver Assignment ({unassignedOrders.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                These paid customer orders have been verified and require an assigned driver to initiate delivery dispatch
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200">
              Awaiting Assignment: <strong className="text-amber-950">{unassignedOrders.length}</strong>
            </span>
          </div>

          {unassignedOrders.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">All Paid Orders Have Drivers Assigned!</h4>
              <p className="text-xs text-slate-500">There are no pending orders waiting for driver assignment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">Order Ref & Date</th>
                    <th className="px-5 py-4 whitespace-nowrap">Customer Info</th>
                    <th className="px-5 py-4 whitespace-nowrap">Delivery Address</th>
                    <th className="px-5 py-4 whitespace-nowrap">Items Count</th>
                    <th className="px-5 py-4 whitespace-nowrap">Total Amount</th>
                    <th className="px-5 py-4 whitespace-nowrap">Order Status</th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {unassignedOrders.map((ord) => {
                    const cust = ord.customer;
                    const custName = cust
                      ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || cust.user?.email || 'Customer'
                      : 'Customer';
                    const custMobile = cust?.user?.mobile || ord.address?.mobile || 'N/A';
                    const custEmail = cust?.user?.email || '';
                    const addr = ord.address;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Order Ref */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-100">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <Link
                                href={`/admin/orders/${ord.id}`}
                                className="font-black text-slate-900 text-xs font-mono hover:text-amber-600 transition-colors flex items-center gap-1"
                              >
                                <span>#{ord.order_number}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                              <span className="text-[11px] text-slate-400 font-medium block">
                                {new Date(ord.createdAt).toLocaleDateString()} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Customer */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{custName}</p>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{custMobile}</span>
                            </p>
                            {custEmail && (
                              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">
                                {custEmail}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 3. Address */}
                        <td className="px-5 py-4">
                          <div className="max-w-[220px]">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {addr?.area ? `${addr.area}, ` : ''}{addr?.city || 'Riyadh'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {addr?.building_number ? `Bldg ${addr.building_number}, ` : ''}{addr?.street || 'Customer Address'}
                            </p>
                          </div>
                        </td>

                        {/* 4. Items */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 border border-slate-200">
                            <Package className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ord.items?.length || 0} Products</span>
                          </span>
                        </td>

                        {/* 5. Total Amount */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {ord.total_amount ? `${parseFloat(ord.total_amount).toFixed(2)} SAR` : 'N/A'}
                          </span>
                        </td>

                        {/* 6. Order Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200">
                            {ord.order_status}
                          </span>
                        </td>

                        {/* 7. Action */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setTargetOrderToAssign(ord);
                              setShowAssignModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:opacity-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign Driver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 3: COMPLETED DELIVERIES TABLE */}
      {/* ========================================================================================= */}
      {activeTab === 'COMPLETED' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Completed Delivery Runs ({completedDeliveries.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Successfully delivered orders, completed runs by driver, destination logs, and customer reviews
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
              Completed runs: <strong className="text-emerald-950">{completedDeliveries.length}</strong>
            </span>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">No Completed Deliveries Yet</h4>
              <p className="text-xs text-slate-500">Completed delivery runs will show up here once marked as delivered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">Order Ref & Delivered At</th>
                    <th className="px-5 py-4 whitespace-nowrap">Customer Info</th>
                    <th className="px-5 py-4 whitespace-nowrap">Delivered By (Driver)</th>
                    <th className="px-5 py-4 whitespace-nowrap">Destination Address</th>
                    <th className="px-5 py-4 whitespace-nowrap">Customer Review & Rating</th>
                    <th className="px-5 py-4 whitespace-nowrap">Delivery Status</th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {completedDeliveries.map((del) => {
                    const cust = del.order?.customer;
                    const custName = cust
                      ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || cust.user?.email || 'Customer'
                      : 'Customer';
                    const custMobile = cust?.user?.mobile || del.order?.address?.mobile || 'N/A';
                    const drv = del.driver;
                    const feedback = del.order?.feedback;

                    return (
                      <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Order Ref & Delivered Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <Link
                                href={`/admin/orders/${del.order_id}`}
                                className="font-black text-slate-900 text-xs font-mono hover:text-emerald-600 transition-colors flex items-center gap-1"
                              >
                                <span>#{del.order?.order_number}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                              <span className="text-[11px] text-slate-400 font-medium block">
                                {new Date(del.updatedAt).toLocaleDateString()} • {new Date(del.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Customer Info */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{custName}</p>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{custMobile}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {cust?.user?.email}
                            </p>
                          </div>
                        </td>

                        {/* 3. Delivered By (Driver) */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[170px]">{drv?.user?.email || 'Driver'}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {drv?.user?.mobile || 'N/A'}
                            </p>
                          </div>
                        </td>

                        {/* 4. Destination Address */}
                        <td className="px-5 py-4">
                          <div className="max-w-[220px]">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {del.order?.address?.area ? `${del.order.address.area}, ` : ''}{del.order?.address?.city || 'Riyadh'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {del.order?.address?.street || 'Delivered'}
                            </p>
                          </div>
                        </td>

                        {/* 5. Customer Review / Rating */}
                        <td className="px-5 py-4">
                          {feedback ? (
                            <div className="max-w-[200px]">
                              <div className="flex items-center gap-1 text-amber-600 font-extrabold text-xs">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{feedback.rating} / 5</span>
                              </div>
                              {feedback.comment && (
                                <p className="text-[11px] text-slate-600 italic truncate mt-0.5" title={feedback.comment}>
                                  &quot;{feedback.comment}&quot;
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No review submitted</span>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200 inline-flex items-center gap-1">
                            DELIVERED ✓
                          </span>
                        </td>

                        {/* 7. Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${del.order_id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Order</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 4: DELIVERY HISTORY TABLE & SEARCH */}
      {/* ========================================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Comprehensive Delivery Logs & Search</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Filter and search through all historical and active delivery records</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order #, Driver or Customer..."
                  className="pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-purple-600 w-64 sm:w-72"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Runs Only</option>
                <option value="DRIVER_ASSIGNED">Driver Assigned</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="ARRIVED">Arrived</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>

          {deliveries.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">No delivery records found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">Order Ref & Date</th>
                    <th className="px-5 py-4 whitespace-nowrap">Assigned Driver</th>
                    <th className="px-5 py-4 whitespace-nowrap">Customer Info</th>
                    <th className="px-5 py-4 whitespace-nowrap">Destination</th>
                    <th className="px-5 py-4 whitespace-nowrap">Delivery Status</th>
                    <th className="px-5 py-4 whitespace-nowrap">Last Updated</th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deliveries.map((del) => {
                    const badge = getStatusBadge(del.status);
                    const isDelivered = del.status === 'DELIVERED';
                    return (
                      <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${del.order_id}`}
                            className="font-black text-slate-900 font-mono hover:text-purple-600 transition-colors flex items-center gap-1"
                          >
                            <span>#{del.order?.order_number}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            {new Date(del.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{del.driver?.user?.email || 'Unassigned'}</p>
                          <p className="text-[11px] text-slate-500">{del.driver?.user?.mobile || 'N/A'}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">
                            {del.order?.customer?.first_name ? `${del.order.customer.first_name} ${del.order.customer.last_name || ''}` : (del.order?.customer?.user?.email || 'Customer')}
                          </p>
                          <p className="text-[11px] text-slate-400">{del.order?.customer?.user?.mobile || del.order?.address?.mobile || ''}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="max-w-[200px]">
                            <p className="text-slate-700 truncate font-semibold">
                              📍 {del.order?.address?.area ? `${del.order.address.area}, ` : ''}{del.order?.address?.city || 'Riyadh'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{del.order?.address?.street || ''}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(del.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isDelivered && (
                              <button
                                onClick={() => {
                                  setSelectedDelivery(del);
                                  setShowMapModal(true);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Live GPS Track"
                              >
                                <Radio className="w-3 h-3" />
                                <span>Track</span>
                              </button>
                            )}
                            <Link
                              href={`/admin/orders/${del.order_id}`}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL: LIVE GPS TRACKING MAP & TELEMETRY */}
      {/* ========================================================================================= */}
      {showMapModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5 relative">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">
                        Live GPS Tracking - Order #{selectedDelivery.order?.order_number}
                      </h2>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedDelivery.status).bg}`}>
                        {getStatusBadge(selectedDelivery.status).label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Assigned Driver: <strong className="text-slate-800">{selectedDelivery.driver?.user?.email}</strong> ({selectedDelivery.driver?.user?.mobile || 'N/A'})
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                <button
                  onClick={() => setShowMapModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Map"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stepper Status Update Controls */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Update Order Delivery Status:
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
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>Mark as {st.replace(/_/g, ' ')}</span>
                    </button>
                  );
                })}
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

            {/* Destination & Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Info</span>
                <p className="font-extrabold text-slate-900 text-sm">
                  {selectedDelivery.order?.customer?.first_name ? `${selectedDelivery.order.customer.first_name} ${selectedDelivery.order.customer.last_name || ''}` : selectedDelivery.order?.customer?.user?.email}
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Address</span>
                  {selectedDelivery.order?.address?.latitude && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedDelivery.order.address.latitude},${selectedDelivery.order.address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
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
