'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useToast } from '../../src/contexts/ToastContext';
import { fetchApi } from '../../src/services/api';
import {
  MapPin,
  Home,
  Building2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Lock,
  Clock,
  Navigation,
  Globe,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  Package,
  CreditCard,
  User,
  Bell,
  Headphones,
  LogOut,
  X,
  Sparkles,
  Star,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function SavedAddressesPage() {
  const { user, logout } = useAuth();
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [form, setForm] = useState({
    title: 'Home',
    recipient_name: '',
    phone: '',
    district: '',
    city: 'Riyadh',
    address_text: '',
    short_code: '',
    courier_notes: '',
    is_default: false,
  });

  // Toggles for Global Preferences
  const [prefContactless, setPrefContactless] = useState(true);
  const [prefWhatsappAlerts, setPrefWhatsappAlerts] = useState(true);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/customers/addresses');
      if (res.success && res.data?.addresses) {
        setAddresses(res.data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddr(null);
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
    setForm({
      title: 'Home',
      recipient_name: userName || 'Customer',
      phone: user?.mobile || '',
      district: '',
      city: 'Riyadh',
      address_text: '',
      short_code: '',
      courier_notes: '',
      is_default: addresses.length === 0,
    });
    setShowModal(true);
  };

  const openEditModal = (addr) => {
    setEditingAddr(addr);
    setForm({
      title: addr.title || addr.area || 'Home',
      recipient_name: addr.full_name || addr.recipient_name || '',
      phone: addr.mobile || addr.phone || '',
      district: addr.area || '',
      city: addr.city || 'Riyadh',
      address_text: addr.address_line || addr.address_text || '',
      short_code: addr.postal_code || addr.short_code || '',
      courier_notes: addr.courier_notes || '',
      is_default: !!addr.is_default,
    });
    setShowModal(true);
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetchApi(`/customers/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_default: true }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تعيين العنوان كافتراضي' : 'Address set as default',
          'success'
        );
        await loadAddresses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update address', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (!confirm(locale === 'ar' ? 'هل أنت تأكد من إزالة هذا العنوان؟' : 'Are you sure you want to remove this delivery address?')) return;
    try {
      const res = await fetchApi(`/customers/addresses/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم حذف العنوان بنجاح' : 'Address removed successfully',
          'info'
        );
        await loadAddresses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete address', 'error');
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const payload = {
        full_name: form.recipient_name,
        mobile: form.phone,
        country: 'Saudi Arabia',
        state: form.city || 'Riyadh',
        city: form.city || 'Riyadh',
        area: form.district || '',
        address_line: form.address_text,
        postal_code: form.short_code || '',
        is_default: form.is_default,
      };

      if (editingAddr) {
        const res = await fetchApi(`/customers/addresses/${editingAddr.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          showToast(
            locale === 'ar' ? 'تم تحديث العنوان بنجاح!' : 'Address updated successfully!',
            'success'
          );
        }
      } else {
        const res = await fetchApi('/customers/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          showToast(
            locale === 'ar' ? 'تم إضافة العنوان بنجاح!' : 'Address added successfully!',
            'success'
          );
        }
      }
      setShowModal(false);
      await loadAddresses();
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const userDisplayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Customer';
  const userInitials = userDisplayName ? userDisplayName.slice(0, 2).toUpperCase() : 'CU';
  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-8">
      
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#043927] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-[#043927] transition-colors">
              My Account
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">Saved Addresses</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">Active Dispatch Center:</span>
            <span className="text-[#043927] font-black">Riyadh Hub</span>
            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-mono text-[10px] font-black">
              35 - 45 MIN
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= PAGE HEADER & TOP METRICS ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
              Saved Addresses & Delivery Locations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage your delivery destinations, pin precision drop-offs, and custom courier instructions.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start lg:self-center"
          >
            <Plus className="w-4 h-4 text-[#05A764]" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* Stats Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold mb-6">
          <span className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-700 shadow-2xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{addresses.length} Saved Locations</span>
          </span>

          {defaultAddress && (
            <span className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-700 shadow-2xs flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                Primary: {defaultAddress.area || defaultAddress.city || 'Default'} ({defaultAddress.address_line?.split(',')[0] || ''})
              </span>
            </span>
          )}

          <span className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-emerald-900 shadow-2xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Server Verified</span>
          </span>
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ================= LEFT ACCOUNT SIDEBAR (3 Cols) ================= */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Customer Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 font-sans">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#043927] text-white flex items-center justify-center font-black text-sm border-2 border-emerald-100 shadow-2xs shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                    {userDisplayName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {user?.mobile || user?.email || ''}
                  </p>
                  <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-md mt-1">
                    VERIFIED CUSTOMER
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-1 text-xs font-sans">
              
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Dashboard Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>My Orders</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Wishlist</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 rounded-2xl text-white font-black bg-[#043927] shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-[#05A764]" />
                  <span>Saved Addresses</span>
                </div>
                <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  {addresses.length} <Check className="w-3 h-3" />
                </span>
              </Link>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>

            {/* Fast-Track Delivery Card */}
            <div className="bg-[#043927] text-white rounded-3xl p-5 shadow-md border border-emerald-900 space-y-3 font-sans relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 fill-emerald-300 text-emerald-300" />
                <span>FAST-TRACK DELIVERY</span>
              </div>
              <h4 className="text-base font-black text-white">Falcon Express™</h4>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Order fresh organic groceries with guaranteed priority delivery across Riyadh.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#05A764] hover:text-emerald-300 pt-1"
              >
                <span>Browse Express Pantry</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

          </div>

          {/* ================= RIGHT ADDRESS CARDS LIST (9 Cols) ================= */}
          <div className="lg:col-span-9 space-y-6">

            {loading ? (
              <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200/90 shadow-xs">
                <div className="w-8 h-8 border-4 border-[#043927] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-slate-500 font-sans">
                  {locale === 'ar' ? 'جاري تحميل العناوين المسجلة...' : 'Loading saved delivery locations...'}
                </p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4 shadow-xs font-sans">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#05A764] flex items-center justify-center mx-auto border border-emerald-200">
                  <MapPin className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">No Saved Delivery Locations</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                    Add your home, office, or compound villa address to enjoy express 45-minute delivery.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-5 py-3 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#05A764]" />
                  <span>+ Add First Address</span>
                </button>
              </div>
            ) : (
              addresses.map((addr) => {
                const recipientName = addr.full_name || addr.recipient_name || userDisplayName;
                const phoneNum = addr.mobile || addr.phone || user?.mobile || '';
                const titleLabel = addr.title || addr.area || addr.city || 'Home';
                const fullAddressText = addr.address_line || `${addr.area ? addr.area + ', ' : ''}${addr.city ? addr.city + ', ' : ''}${addr.country || 'Saudi Arabia'}`;

                return (
                  <div
                    key={addr.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 font-sans p-6 hover:shadow-md transition-all"
                  >
                    {/* Header Tag Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold">
                          {titleLabel.toLowerCase().includes('office') || titleLabel.toLowerCase().includes('work') ? (
                            <Building2 className="w-4 h-4 text-[#05A764]" />
                          ) : (
                            <Home className="w-4 h-4 text-[#05A764]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 text-base">{titleLabel}</h3>
                            {addr.is_default && (
                              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-300 uppercase tracking-wider">
                                ✓ DEFAULT ADDRESS
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {addr.city || 'Riyadh'}, {addr.country || 'Saudi Arabia'}
                          </span>
                        </div>
                      </div>

                      {phoneNum && (
                        <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">
                          📞 {phoneNum}
                        </span>
                      )}
                    </div>

                    {/* Card Main Body Grid: Details Left + Location Graphic Right */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Address Details */}
                      <div className="md:col-span-8 space-y-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">👤 {recipientName}</h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                            {fullAddressText}
                          </p>
                        </div>

                        {/* Metadata Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                          {addr.area && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                              District: {addr.area}
                            </span>
                          )}

                          {addr.postal_code && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                              # Postal Code: {addr.postal_code}
                            </span>
                          )}

                          <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-extrabold">
                            🧊 Chilled Cold-Chain Box OK
                          </span>
                        </div>
                      </div>

                      {/* Right Location Card Visual */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-700 font-extrabold">
                            <MapPin className="w-4 h-4 text-[#05A764]" />
                            <span>{addr.city || 'Riyadh'}, KSA</span>
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(fullAddressText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 text-[11px] font-extrabold transition-colors"
                          >
                            <span>Open in Google Maps</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(addr.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            ✓ Set as Default
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(addr)}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Details</span>
                        </button>
                      </div>

                      {addr.is_default ? (
                        <span className="text-emerald-700 text-xs font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Default Selection</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(addr.id)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}

            {/* Add New Delivery Address Banner Box */}
            <div className="bg-slate-100/80 rounded-3xl p-6 border border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#043927] border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">+ Add a New Delivery Address</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Add an apartment, compound villa, or workplace address anywhere in Saudi Arabia.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="px-5 py-3 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
              >
                <span>Add Address</span>
                <ArrowRight className="w-4 h-4 text-[#05A764] rtl:rotate-180" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ================= ADD / EDIT ADDRESS MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#043927] flex items-center justify-center font-bold">
                  {editingAddr ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingAddr ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure drop-off location & contact details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs font-sans">
              
              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mohammed Al-Salem"
                    value={form.recipient_name}
                    onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+966 50 123 4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>
              </div>

              {/* City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Riyadh"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District / Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al Malqa / Al Olaya"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927]"
                  />
                </div>
              </div>

              {/* Full Address Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Street & Villa / Building Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Building 42, King Fahd Road, Al Olaya District"
                  value={form.address_text}
                  onChange={(e) => setForm({ ...form, address_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] resize-none"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Postal Code / Short Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 13211"
                  value={form.short_code}
                  onChange={(e) => setForm({ ...form, short_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:bg-white focus:border-[#043927]"
                />
              </div>

              {/* Set Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="w-4 h-4 rounded text-[#05A764] focus:ring-[#05A764] accent-[#05A764] cursor-pointer"
                />
                <label htmlFor="is_default" className="text-xs font-extrabold text-slate-800 cursor-pointer">
                  Set as my primary default delivery address
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-4 font-sans">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editingAddr ? 'Save Changes' : 'Add Address'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
