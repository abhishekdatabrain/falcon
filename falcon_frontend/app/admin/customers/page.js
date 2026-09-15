'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import {
  Users,
  Search,
  UserPlus,
  Edit3,
  MapPin,
  ShoppingBag,
  Star,
  Plus,
  Trash2,
  Phone,
  Mail,
  Calendar,
  X,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const [addressForm, setAddressForm] = useState({
    address_name: 'Home',
    building_number: '',
    street: '',
    area: '',
    city: 'Riyadh',
    postal_code: '',
  });

  // Selected Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerFeedback, setCustomerFeedback] = useState([]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/customers');
      if (res.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/admin/customers', {
        method: 'POST',
        body: JSON.stringify(customerForm),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم إضافة العميل بنجاح!' : 'Customer created successfully!', 'success');
        setShowAddModal(false);
        setCustomerForm({ id: '', first_name: '', last_name: '', email: '', mobile: '', password: '' });
        await loadCustomers();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi(`/admin/customers/${customerForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(customerForm),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer updated successfully!', 'success');
        setShowEditModal(false);
        await loadCustomers();
        if (selectedCustomer && selectedCustomer.id === customerForm.id) {
          openDetails({ ...selectedCustomer, ...customerForm });
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (customerId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/customers/${customerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        showToast(
          locale === 'ar' ? `تم تغيير حالة العميل إلى ${newStatus}` : `Customer status set to ${newStatus}`,
          'info'
        );
        await loadCustomers();
        if (selectedCustomer && selectedCustomer.id === customerId) {
          setSelectedCustomer({
            ...selectedCustomer,
            user: { ...selectedCustomer.user, status: newStatus },
          });
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const res = await fetchApi(`/admin/customers/${selectedCustomer.id}/addresses`, {
        method: 'POST',
        body: JSON.stringify(addressForm),
      });
      if (res.success) {
        showToast(locale === 'ar' ? 'تم إضافة العنوان بنجاح!' : 'Address added successfully!', 'success');
        setShowAddressModal(false);
        setAddressForm({ address_name: 'Home', building_number: '', street: '', area: '', city: 'Riyadh', postal_code: '' });
        openDetails(selectedCustomer);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetchApi(`/admin/customers/addresses/${addressId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Address deleted successfully', 'info');
        openDetails(selectedCustomer);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openDetails = async (c) => {
    setSelectedCustomer(c);
    try {
      setDetailLoading(true);
      const [detRes, fbRes] = await Promise.all([
        fetchApi(`/admin/customers/${c.id}`),
        fetchApi('/admin/feedback'),
      ]);
      if (detRes.success) setCustomerDetails(detRes.data.customer);
      if (fbRes.success) {
        const userFb = (fbRes.data.feedbacks || []).filter((f) => f.customer_id === c.id);
        setCustomerFeedback(userFb);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditModal = (c) => {
    setCustomerForm({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.user?.email || '',
      mobile: c.user?.mobile || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const filtered = customers.filter((c) => {
    const name = `${c.first_name || ''} ${c.last_name || ''}`;
    const email = c.user?.email || '';
    const mobile = c.user?.mobile || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           mobile.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'إدارة العملاء المسجلين' : 'Customer Management'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'عرض وإضافة وتعديل بيانات العملاء وسجل الطلبات والعناوين والتقييمات' : 'View, create, edit info, toggle status, manage addresses, and view customer orders & feedback'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search name, email, or mobile...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 pl-9 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs w-full sm:w-60 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            onClick={() => {
              setCustomerForm({ id: '', first_name: '', last_name: '', email: '', mobile: '', password: '' });
              setShowAddModal(true);
            }}
            className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 text-white"
          >
            <UserPlus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة عميل جديد' : 'Add Customer'}
          </button>
        </div>
      </div>

      {/* Customer List Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading registered customers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No registered customer accounts match your search.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="p-4">{locale === 'ar' ? 'الاسم' : 'Customer Name'}</th>
                <th className="p-4">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="p-4">{locale === 'ar' ? 'الجوال' : 'Mobile'}</th>
                <th className="p-4">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4 text-right">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {c.first_name?.charAt(0) || 'C'}
                    </div>
                    <span>{c.first_name} {c.last_name}</span>
                  </td>
                  <td className="p-4 text-slate-600 font-mono">{c.user?.email}</td>
                  <td className="p-4 text-slate-600">{c.user?.mobile}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {c.user?.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openDetails(c)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100 transition-all"
                    >
                      Details & History
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-semibold hover:bg-slate-200 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(c.id, c.user?.status)}
                      className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                        c.user?.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {c.user?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Details & Management Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-slate-200 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 font-extrabold text-lg shadow-xs">
                  {selectedCustomer.first_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCustomer.user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    Account Status: {selectedCustomer.user?.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedCustomer)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit Profile
                </button>
                <button onClick={() => { setSelectedCustomer(null); setCustomerDetails(null); }} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-500">Loading profile, orders, addresses, and feedback...</div>
            ) : (
              <div className="space-y-6 text-xs">
                
                {/* 1. Profile Info & Contact Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Address
                    </span>
                    <p className="font-semibold text-slate-900 font-mono">{selectedCustomer.user?.email}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-cyan-600" /> Mobile Number
                    </span>
                    <p className="font-semibold text-slate-900">{selectedCustomer.user?.mobile}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" /> Registered Date
                    </span>
                    <p className="font-semibold text-slate-900">{new Date(selectedCustomer.user?.createdAt || selectedCustomer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* 2. Saved Delivery Addresses */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                      <MapPin className="w-4 h-4 text-rose-600" /> Customer Addresses ({customerDetails?.addresses?.length || 0})
                    </h4>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 hover:bg-rose-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Address
                    </button>
                  </div>

                  {customerDetails?.addresses?.length === 0 ? (
                    <p className="text-slate-500 italic">No saved delivery addresses.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customerDetails?.addresses?.map((addr) => (
                        <div key={addr.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 relative group">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{addr.address_name}</span>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                              title="Delete address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-slate-700">{addr.building_number}, {addr.street}</p>
                          <p className="text-slate-500">{addr.area}, {addr.city} {addr.postal_code}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Customer Orders */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" /> Customer Orders ({customerDetails?.orders?.length || 0})
                  </h4>

                  {customerDetails?.orders?.length === 0 ? (
                    <p className="text-slate-500 italic">No orders placed by this customer yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerDetails?.orders?.map((ord) => (
                        <div key={ord.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">Order #{ord.order_number}</span>
                            <span className="ml-3 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                              {ord.order_status}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(ord.createdAt).toLocaleString()}</p>
                          </div>
                          <span className="font-extrabold text-emerald-700 text-sm">{parseFloat(ord.grand_total).toFixed(2)} SAR</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Customer Feedback Reviews */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Customer Reviews & Feedback ({customerFeedback.length})
                  </h4>

                  {customerFeedback.length === 0 ? (
                    <p className="text-slate-500 italic">No reviews submitted by this customer.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerFeedback.map((fb) => (
                        <div key={fb.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                              <span>{fb.rating} / 5</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(fb.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 italic">"{fb.comment || 'No written comment.'}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add New Customer Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Create New Customer Account</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">First Name</label>
                  <input type="text" required placeholder="John" value={customerForm.first_name} onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Last Name</label>
                  <input type="text" required placeholder="Doe" value={customerForm.last_name} onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" required placeholder="customer@example.com" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                <input type="text" required placeholder="+966500000000" value={customerForm.mobile} onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
                <input type="password" placeholder="Customer@123456 (default)" value={customerForm.password} onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 text-sm py-2.5 bg-slate-100 border-slate-200 text-slate-700">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm py-2.5 bg-rose-600 hover:bg-rose-700 text-white">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer Account */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Edit Customer Profile</h3>
            <form onSubmit={handleUpdateCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">First Name</label>
                  <input type="text" required value={customerForm.first_name} onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Last Name</label>
                  <input type="text" required value={customerForm.last_name} onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" required value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                <input type="text" required value={customerForm.mobile} onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 text-sm py-2.5 bg-slate-100 border-slate-200 text-slate-700">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm py-2.5 bg-rose-600 hover:bg-rose-700 text-white">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Delivery Address */}
      {showAddressModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Add Delivery Address for {selectedCustomer.first_name}</h3>
            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Address Label</label>
                <input type="text" required placeholder="Home / Office" value={addressForm.address_name} onChange={(e) => setAddressForm({ ...addressForm, address_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Building #</label>
                  <input type="text" required placeholder="Building 42" value={addressForm.building_number} onChange={(e) => setAddressForm({ ...addressForm, building_number: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Street</label>
                  <input type="text" required placeholder="King Fahd Rd" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Area / District</label>
                  <input type="text" required placeholder="Al Olaya" value={addressForm.area} onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">City</label>
                  <input type="text" required placeholder="Riyadh" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddressModal(false)} className="btn-secondary flex-1 text-sm py-2.5 bg-slate-100 border-slate-200 text-slate-700">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm py-2.5 bg-rose-600 hover:bg-rose-700 text-white">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
