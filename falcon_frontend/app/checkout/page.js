'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useToast } from '../../src/contexts/ToastContext';
import { fetchApi } from '../../src/services/api';
import { MapPin, Plus, Landmark, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { t, locale } = useLanguage();
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  // New Address Form Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    mobile: '',
    city: 'Riyadh',
    district: '',
    street_address: '',
    building_no: '',
    zip_code: '',
  });

  // Bank Transfer Form state
  const [bankName, setBankName] = useState('Al Rajhi Bank');
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadAddresses = async () => {
    try {
      const res = await fetchApi('/customers/addresses');
      if (res.success && res.data.addresses) {
        setAddresses(res.data.addresses);
        if (res.data.addresses.length > 0) {
          setSelectedAddressId(res.data.addresses[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/customers/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      });
      if (res.success) {
        setShowAddressModal(false);
        showToast(
          locale === 'ar' ? 'تم إضافة العنوان بنجاح!' : 'Address added successfully!',
          'success'
        );
        await loadAddresses();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      showToast(
        locale === 'ar' ? 'يرجى اختيار أو إضافة عنوان التوصيل' : 'Please select or add a delivery address',
        'error'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          addressId: selectedAddressId,
          notes,
        }),
      });

      if (res.success && res.data.order) {
        setOrder(res.data.order);
        showToast(
          locale === 'ar' ? 'تم إنشاء الطلب بنجاح!' : 'Order created successfully!',
          'success'
        );
      }
    } catch (err) {
      setError(err.message || 'Unable to place order');
      showToast(err.message || 'Unable to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBankPayment = async (e) => {
    e.preventDefault();
    if (!proofFile || !paymentReference) {
      showToast(
        locale === 'ar' ? 'يرجى إدخال رقم المرجع وإرفاق إيصال التحويل' : 'Please enter payment reference and upload receipt file',
        'error'
      );
      return;
    }

    setPaymentSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order.id);
      formData.append('bankName', bankName);
      formData.append('paymentReference', paymentReference);
      formData.append('proofFile', proofFile);

      const res = await fetchApi('/payments/submit', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setPaymentSuccess(true);
        showToast(
          locale === 'ar' ? 'تم إرسال إيصال الدفع بنجاح!' : 'Payment confirmation submitted successfully!',
          'success'
        );
        setTimeout(() => {
          router.push(`/orders/${order.id}`);
        }, 2000);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit payment confirmation', 'error');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (order) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-8">
        <div className="glass-panel rounded-3xl p-8 border border-white/15 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Order Created: #{order.order_number}</h1>
            <p className="text-sm text-gray-300">
              Please submit your bank transfer receipt below for Admin verification.
            </p>
          </div>

          {/* Bank Instructions Card */}
          <div className="p-5 rounded-2xl bg-indigo-950/50 border border-indigo-700/40 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Landmark className="w-5 h-5" />
              <span>{t('checkout.bankInstructionsTitle')}</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <p><strong>Bank:</strong> {t('checkout.bankName')}</p>
              <p><strong>Account Name:</strong> {t('checkout.accountName')}</p>
              <p><strong>IBAN:</strong> {t('checkout.iban')}</p>
              <p><strong>Total Amount to Transfer:</strong> <span className="text-cyan-400 font-bold">{parseFloat(order.grand_total).toFixed(2)} SAR</span></p>
            </div>
          </div>

          {paymentSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-semibold">
              Payment details submitted! Redirecting to order tracking...
            </div>
          ) : (
            <form onSubmit={handleSubmitBankPayment} className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Your Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
                >
                  <option value="Al Rajhi Bank">Al Rajhi Bank</option>
                  <option value="SNB (National Commercial Bank)">SNB (National Commercial Bank)</option>
                  <option value="Riyad Bank">Riyad Bank</option>
                  <option value="Bank AlJazira">Bank AlJazira</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Bank Reference Number / Transaction ID
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. TR-9876543210"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Upload Payment Proof Slip (JPEG, PNG, PDF)
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <button
                type="submit"
                disabled={paymentSubmitting}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                <span>{paymentSubmitting ? 'Uploading Receipt...' : t('checkout.submitPayment')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">{t('checkout.title')}</h1>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Address Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>{t('checkout.selectAddress')}</span>
              </h2>

              <button
                onClick={() => setShowAddressModal(true)}
                className="btn-secondary text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> {t('checkout.addAddress')}
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No delivery address found. Please add a new address to continue.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{addr.full_name}</span>
                      {addr.is_default && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 mt-2">{addr.address_line}</p>
                    <p className="text-xs text-gray-400 mt-1">{addr.area}, {addr.city}, {addr.state}</p>
                    <p className="text-xs text-gray-400 mt-1">📞 {addr.mobile}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/15">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Order Delivery Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave package at gate / Gate code 1234"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="glass-panel rounded-3xl p-6 border border-white/15 h-fit space-y-6">
          <h2 className="text-xl font-bold border-b border-white/10 pb-4">{t('checkout.orderSummary')}</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>{t('cart.subtotal')}</span>
              <span className="font-semibold">{parseFloat(cart.subtotal || 0).toFixed(2)} SAR</span>
            </div>

            <div className="flex justify-between text-gray-300">
              <span>{t('cart.vat')}</span>
              <span className="font-semibold">{parseFloat(cart.taxTotal || 0).toFixed(2)} SAR</span>
            </div>

            <div className="flex justify-between text-gray-300">
              <span>{t('cart.deliveryFee')}</span>
              <span className="font-semibold">
                {cart.deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `${parseFloat(cart.deliveryFee || 0).toFixed(2)} SAR`}
              </span>
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-between text-lg font-bold text-white">
              <span>{t('cart.total')}</span>
              <span className="text-cyan-400">{parseFloat(cart.grandTotal || 0).toFixed(2)} SAR</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || addresses.length === 0}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Creating Order...' : t('checkout.placeOrder')}
          </button>
        </div>

      </div>

      {/* New Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full border border-white/20 space-y-4">
            <h3 className="text-xl font-bold">{t('checkout.addAddress')}</h3>
            <form onSubmit={handleCreateAddress} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newAddress.full_name}
                onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
              />
              <input
                type="text"
                required
                placeholder="Mobile Number"
                value={newAddress.mobile}
                onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
              />
              <input
                type="text"
                required
                placeholder="City (e.g. Riyadh)"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
              />
              <input
                type="text"
                required
                placeholder="Area (e.g. Al-Olaya)"
                value={newAddress.area}
                onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
              />
              <textarea
                required
                placeholder="Street Address Line"
                value={newAddress.address_line}
                onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 text-sm">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
