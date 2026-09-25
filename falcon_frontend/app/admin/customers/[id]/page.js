'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { useToast } from '../../../../src/contexts/ToastContext';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  Star,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  ChevronRight,
  X,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AdminCustomerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
  });

  const [addressForm, setAddressForm] = useState({
    address_name: 'Home',
    building_number: '',
    street: '',
    area: '',
    city: 'Riyadh',
    postal_code: '',
  });

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      const detRes = await fetchApi(`/admin/customers/${id}`);

      if (detRes.success && detRes.data.customer) {
        setCustomer(detRes.data.customer);
        setCustomerForm({
          first_name: detRes.data.customer.first_name || '',
          last_name: detRes.data.customer.last_name || '',
          email: detRes.data.customer.user?.email || '',
          mobile: detRes.data.customer.user?.mobile || '',
        });
      }

      try {
        const fbRes = await fetchApi('/feedback');
        if (fbRes.success) {
          const userFb = (fbRes.data.feedbacks || []).filter(
            (f) => String(f.customer_id) === String(id) || String(f.customer_id) === String(detRes.data?.customer?.id)
          );
          setFeedbackList(userFb);
        }
      } catch (fbErr) {
        console.warn('Could not fetch feedback:', fbErr);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
      showToast(err.message || 'Failed to load customer profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCustomerDetails();
    }
  }, [id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerForm),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer profile updated successfully!',
          'success'
        );
        setShowEditModal(false);
        await loadCustomerDetails();
      }
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!customer?.user) return;
    const currentStatus = customer.user.status;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/customers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? `تم تغيير حالة العميل إلى ${newStatus}` : `Customer account status updated to ${newStatus}`,
          'info'
        );
        await loadCustomerDetails();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchApi(`/admin/customers/${id}/addresses`, {
        method: 'POST',
        body: JSON.stringify(addressForm),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم إضافة العنوان بنجاح!' : 'Address added successfully!', 'success');
        setShowAddressModal(false);
        setAddressForm({
          address_name: 'Home',
          building_number: '',
          street: '',
          area: '',
          city: 'Riyadh',
          postal_code: '',
        });
        await loadCustomerDetails();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm(locale === 'ar' ? 'هل أنت تأكد من حذف هذا العنوان؟' : 'Are you sure you want to delete this address?')) return;
    try {
      const res = await fetchApi(`/admin/customers/addresses/${addressId}`, { method: 'DELETE' });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم حذف العنوان بنجاح' : 'Address deleted successfully', 'info');
        await loadCustomerDetails();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {locale === 'ar' ? 'جاري تحميل ملف العميل...' : 'Loading Customer Profile & Order History...'}
        </p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto mt-10">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Customer Not Found</h2>
        <p className="text-xs text-slate-500">The requested customer record does not exist or has been removed.</p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer List
        </Link>
      </div>
    );
  }

  const totalSpent = (customer.orders || []).reduce(
    (sum, ord) => sum + parseFloat(ord.grand_total || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/admin/customers" className="hover:text-slate-900 transition-all flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'العملاء' : 'Customers'}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-extrabold">{customer.first_name} {customer.last_name}</span>
        </div>

        <Link
          href="/admin/customers"
          className="text-xs font-bold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>{locale === 'ar' ? 'العودة لقائمة العملاء' : 'Back to Customers'}</span>
        </Link>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0 border-2 border-white">
            {customer.first_name?.charAt(0) || 'C'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {customer.first_name} {customer.last_name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${customer.user?.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
              >
                {customer.user?.status === 'ACTIVE' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Account
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Disabled Account
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Customer ID: {customer.id}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" /> Member registered on{' '}
              <span className="font-bold text-slate-700">
                {new Date(customer.user?.createdAt || customer.createdAt).toLocaleDateString()}
              </span>
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1 font-semibold">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> {customer.user?.email || 'N/A'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> {customer.user?.mobile || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Orders</span>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{(customer.orders || []).length}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Spent</span>
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{totalSpent.toFixed(2)} SAR</div>
        </div>
      </div>

      {/* Main Order History Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" /> Complete Order History
          </span>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {(customer.orders || []).length} Orders
          </span>
        </h3>

        {(customer.orders || []).length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500">No orders placed by this customer yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {customer.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3.5 font-black text-slate-900">
                      #{ord.order_number}
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">
                      {new Date(ord.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[10px]">
                        {ord.order_status}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-emerald-700 text-sm">
                      {parseFloat(ord.grand_total || 0).toFixed(2)} SAR
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Edit Customer Account */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Customer Profile</h3>
                  <p className="text-xs text-slate-500">Update customer information</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="editCustomerProfileForm" onSubmit={handleUpdateProfile} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.first_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.last_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editCustomerProfileForm"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Delivery Address */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Add Delivery Address</h3>
                  <p className="text-xs text-slate-500">For {customer.first_name} {customer.last_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="addAddressDetailForm" onSubmit={handleAddAddress} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Address Label *</label>
                <input
                  type="text"
                  required
                  placeholder="Home / Office"
                  value={addressForm.address_name}
                  onChange={(e) => setAddressForm({ ...addressForm, address_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Building # *</label>
                  <input
                    type="text"
                    required
                    placeholder="Building 42"
                    value={addressForm.building_number}
                    onChange={(e) => setAddressForm({ ...addressForm, building_number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Street *</label>
                  <input
                    type="text"
                    required
                    placeholder="King Fahd Rd"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Area / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="Al Olaya"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Riyadh"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="addAddressDetailForm"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save Address</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
