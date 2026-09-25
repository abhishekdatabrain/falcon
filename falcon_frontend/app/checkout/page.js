'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../src/contexts/CartContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useToast } from '../../src/contexts/ToastContext';
import { fetchApi } from '../../src/services/api';
import {
  MapPin,
  Plus,
  Landmark,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Leaf,
  Phone,
  FileText,
  X,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function CheckoutPage() {
  const { t, locale } = useLanguage();
  const { cart, clearCart, loading: cartLoading, fetchCart } = useCart();
  console.log(cart, "cart");

  const { showToast } = useToast();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);

  // New Address Form Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    mobile: '',
    country: 'Saudi Arabia',
    state: 'Riyadh Province',
    city: 'Riyadh',
    area: '',
    address_line: '',
    postal_code: '12211',
    is_default: true,
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
      console.error('Failed to load delivery addresses:', err);
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
        setNewAddress({
          full_name: '',
          mobile: '',
          country: 'Saudi Arabia',
          state: 'Riyadh Province',
          city: 'Riyadh',
          area: '',
          address_line: '',
          postal_code: '12211',
          is_default: true,
        });
        await loadAddresses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add address', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (loading || isSubmittingRef.current) return;

    if (!cart?.items || cart.items.length === 0) {
      const msg = locale === 'ar' ? 'سلة التسوق الخاصة بك فارغة' : 'Your shopping cart is empty';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (!selectedAddressId) {
      setError(locale === 'ar' ? 'يرجى اختيار أو إضافة عنوان التوصيل' : 'Please select or add a delivery address');
      showToast(
        locale === 'ar' ? 'يرجى اختيار أو إضافة عنوان التوصيل' : 'Please select or add a delivery address',
        'error'
      );
      return;
    }

    isSubmittingRef.current = true;
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
        await fetchCart();
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
      isSubmittingRef.current = false;
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

  // STEP 2: Post-Order Bank Payment Upload View
  if (order) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] font-sans py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg space-y-6 relative overflow-hidden">
            {/* Top Brand Accent */}
            <div className="h-2 bg-[#05442e] absolute top-0 left-0 right-0" />

            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#05442e] flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-8 h-8 text-[#05442e]" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {locale === 'ar' ? `تم إنشاء الطلب: #${order.order_number}` : `Order Created: #${order.order_number}`}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {locale === 'ar'
                  ? 'يرجى تحويل المبلغ وحفظ وصل الدفع لإتمامه واعتماده من الإدارة'
                  : 'Please submit your bank transfer receipt below for verification'}
              </p>
            </div>

            {/* Bank Instructions Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-[#05442e] font-black text-sm">
                <Landmark className="w-5 h-5 text-emerald-700" />
                <span>{t('checkout.bankInstructionsTitle')}</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1.5 font-medium border-t border-emerald-200/60 pt-2.5">
                <p><strong>Bank Name:</strong> {t('checkout.bankName')}</p>
                <p><strong>Account Name:</strong> {t('checkout.accountName')}</p>
                <p><strong>IBAN:</strong> <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block">{t('checkout.iban')}</span></p>
                <p><strong>Total Amount:</strong> <span className="text-[#05442e] font-black text-sm">{parseFloat(order.grand_total).toFixed(2)} SAR</span></p>
              </div>
            </div>

            {paymentSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500 text-white text-center font-extrabold text-sm shadow-md animate-in fade-in duration-300">
                {locale === 'ar' ? 'تم تقديم تفاصيل الدفع بنجاح! جاري التوجيه لمتابعة الطلب...' : 'Payment submitted successfully! Redirecting to tracking...'}
              </div>
            ) : (
              <form onSubmit={handleSubmitBankPayment} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {locale === 'ar' ? 'اسم البنك المحول منه' : 'Select Bank Name'}
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  >
                    <option value="Al Rajhi Bank">Al Rajhi Bank (مصرف الراجحي)</option>
                    <option value="SNB (National Commercial Bank)">SNB (البنك الأهلي السعودي)</option>
                    <option value="Riyad Bank">Riyad Bank (بنك الرياض)</option>
                    <option value="Bank AlJazira">Bank AlJazira (بنك الجزيرة)</option>
                    <option value="STC Pay / Urpay">STC Pay / Urpay Digital Wallet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {locale === 'ar' ? 'رقم المرجع / رقم الحوالة' : 'Bank Reference / Transaction ID'}
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. TR-9876543210"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {locale === 'ar' ? 'إرفاق صور الإيصال (JPEG, PNG, PDF)' : 'Upload Receipt Slip (Image or PDF)'}
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-[#05442e] file:text-white hover:file:bg-emerald-800 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="w-full py-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
                >
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>{paymentSubmitting ? 'Uploading Receipt...' : t('checkout.submitPayment')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] font-sans flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#05442e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order && (!cart?.items || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] font-sans py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">
              {locale === 'ar' ? 'سلة التسوق فارغة' : 'Your Shopping Cart is Empty'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {locale === 'ar'
                ? 'يرجى إضافة بعض المنتجات إلى سلة التسوق للمتابعة إلى صفحة الدفع.'
                : 'Please add items to your shopping cart before proceeding to checkout.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="w-full py-3.5 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{locale === 'ar' ? 'تصفح المنتجات والتسوق' : 'Explore Products & Shop'}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180 text-amber-300" />
          </button>
        </div>
      </div>
    );
  }

  // STEP 1: Main Checkout View
  return (
    <div className="min-h-screen bg-[#f7f9f7] font-sans pb-28">

      {/* Top Banner Header */}
      <div className="bg-white border-b border-slate-200/80 py-6 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#05442e] flex items-center justify-center shrink-0 shadow-2xs">
              <ShoppingBag className="w-6 h-6 text-[#05442e]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t('checkout.title')}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {locale === 'ar' ? 'حدد عنوان التوصيل وأتمم طلب المواد الغذائية' : 'Select delivery location & complete your grocery order'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left Column: Address Selection & Delivery Notes */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Address Card Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#05442e] flex items-center justify-center border border-emerald-200/60">
                    <MapPin className="w-5 h-5 text-[#05442e]" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    {t('checkout.selectAddress')}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t('checkout.addAddress')}</span>
                </button>
              </div>

              {/* List of Delivery Addresses */}
              {addresses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">
                    {locale === 'ar' ? 'لم يتم العثور على أي عنوان توصيل' : 'No delivery addresses found'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="text-xs font-extrabold text-emerald-700 hover:underline cursor-pointer"
                  >
                    + {locale === 'ar' ? 'إضافة عنوان جديد الآن' : 'Add New Address Now'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;

                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${isSelected
                            ? 'bg-emerald-50/70 border-2 border-[#05442e] shadow-sm'
                            : 'bg-slate-50/80 border-slate-200/80 hover:border-emerald-300 hover:bg-slate-100/50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900">{addr.full_name}</span>
                          <div className="flex items-center gap-1.5">
                            {addr.is_default && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#05442e] font-black uppercase">
                                DEFAULT
                              </span>
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#05442e]" />
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                          {addr.address_line}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {addr.area ? `${addr.area}, ` : ''}{addr.city}, {addr.state}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 pt-1">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>{addr.mobile}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Delivery Notes Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>{locale === 'ar' ? 'ملاحظات التوصيل (اختياري)' : 'Order Delivery Notes (Optional)'}</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={locale === 'ar' ? 'مثال: ترك الشحنة عند الباب / رمز البوابة 1234' : 'e.g. Leave package at door / Gate passcode 1234'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>

          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md lg:sticky lg:top-24 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">{t('checkout.orderSummary')}</h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {cart.items ? cart.items.length : 0} {locale === 'ar' ? 'منتجات' : 'Items'}
              </span>
            </div>

            {/* Summary Lines */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>{t('cart.subtotal')}</span>
                <span className="font-extrabold text-slate-900">{parseFloat(cart.subtotal || 0).toFixed(2)} SAR</span>
              </div>

              <div className="flex justify-between text-slate-600 font-semibold">
                <span>{t('cart.vat')}</span>
                <span className="font-extrabold text-slate-900">{parseFloat(cart.taxTotal || 0).toFixed(2)} SAR</span>
              </div>

              <div className="flex justify-between text-slate-600 font-semibold items-center">
                <span>{t('cart.deliveryFee')}</span>
                <span>
                  {cart.deliveryFee === 0 ? (
                    <span className="bg-emerald-100 text-[#05442e] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      FREE EXPRESS
                    </span>
                  ) : (
                    <span className="font-extrabold text-slate-900">{parseFloat(cart.deliveryFee || 0).toFixed(2)} SAR</span>
                  )}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900">{t('cart.total')}</span>
                <span className="text-xl font-black text-[#05442e]">
                  {parseFloat(cart.grandTotal || 0).toFixed(2)} SAR
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading || addresses.length === 0 || !cart?.items || cart.items.length === 0}
              className="w-full py-4 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>{locale === 'ar' ? 'إتمام الطلب' : 'Place Order'}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* New Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">{t('checkout.addAddress')}</h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-3.5 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'رقم الجوال' : 'Mobile Number'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+966500000000"
                    value={newAddress.mobile}
                    onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'المدينة' : 'City'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City (e.g. Riyadh)"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'المنطقة / الحي' : 'District / Area'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Area (e.g. Al-Olaya)"
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'عنوان الشارع' : 'Street Address Line'}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Building No, Street Name, Landmark"
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                >
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
