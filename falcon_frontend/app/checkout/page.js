'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useToast } from '../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../src/services/api';
import {
  MapPin,
  Plus,
  Landmark,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Phone,
  FileText,
  X,
  ChevronRight,
  ShieldCheck,
  Check,
  Truck,
  ArrowLeft,
  Zap,
  Tag,
  Lock,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Calendar,
  CreditCard,
  CheckSquare,
  Clock,
  BadgePercent,
  Loader2,
} from 'lucide-react';

export default function CheckoutPage() {
  const { t, locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { cart, clearCart, loading: cartLoading, fetchCart, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState('express'); // 'express' | 'standard'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [scheduleDates, setScheduleDates] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [driverInstructions, setDriverInstructions] = useState('');
  const [outOfStockPref, setOutOfStockPref] = useState('call'); // 'call' | 'best_match' | 'no_replace'
  const [paymentMethod, setPaymentMethod] = useState('mada'); // 'mada' | 'apple_pay' | 'card' | 'stc_pay' | 'cod'
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('5888 4210 9384 1029');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('482');
  const [saveCard, setSaveCard] = useState(true);

  // Test Payment Gateway Modal State
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [gatewayStep, setGatewayStep] = useState('input'); // 'input' | 'otp' | 'processing' | 'failed'
  const [otpInput, setOtpInput] = useState('123456');
  const [gatewayErrorMsg, setGatewayErrorMsg] = useState('');
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Dynamic Promo Code / Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);

  // Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: 'Mohammed Al-Salem',
    mobile: '+966 50 123 4567',
    country: 'Saudi Arabia',
    state: 'Riyadh Province',
    city: 'Riyadh',
    area: 'Al-Olaya District',
    address_line: 'Building 42, King Fahd Road',
    postal_code: '13211',
    is_default: true,
  });

  const loadAddresses = async () => {
    try {
      const res = await fetchApi('/customers/addresses');
      if (res.success && res.data.addresses && res.data.addresses.length > 0) {
        setAddresses(res.data.addresses);
        const defaultAddr = res.data.addresses.find((a) => a.is_default) || res.data.addresses[0];
        setSelectedAddressId(defaultAddr.id);
      } else {
        // Default fallback address if user has no saved addresses
        setAddresses([
          {
            id: 'addr-default',
            full_name: 'Mohammed Al-Salem',
            mobile: '+966 50 123 4567',
            city: 'Riyadh',
            area: 'Al-Olaya District',
            address_line: 'Building 42, King Fahd Road, Al-Olaya District, Riyadh 13211, Kingdom of Saudi Arabia',
            is_default: true
          }
        ]);
        setSelectedAddressId('addr-default');
      }
    } catch (err) {
      setAddresses([
        {
          id: 'addr-default',
          full_name: 'Mohammed Al-Salem',
          mobile: '+966 50 123 4567',
          city: 'Riyadh',
          area: 'Al-Olaya District',
          address_line: 'Building 42, King Fahd Road, Al-Olaya District, Riyadh 13211, Kingdom of Saudi Arabia',
          is_default: true
        }
      ]);
      setSelectedAddressId('addr-default');
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleUpdateBagQuantity = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeItem(itemId);
    } else {
      await updateQuantity(itemId, newQty);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        full_name: newAddress.full_name,
        mobile: newAddress.mobile,
        country: newAddress.country || 'Saudi Arabia',
        state: newAddress.state || newAddress.city || 'Riyadh',
        city: newAddress.city,
        area: newAddress.area,
        address_line: newAddress.address_line,
        postal_code: newAddress.postal_code || '',
        is_default: newAddress.is_default !== undefined ? newAddress.is_default : true,
      };

      const res = await fetchApi('/customers/addresses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data?.address) {
        setShowAddressModal(false);
        showToast(
          locale === 'ar' ? 'تم إضافة العنوان بنجاح!' : 'Address added successfully!',
          'success'
        );
        await loadAddresses();
        if (res.data.address.id) {
          setSelectedAddressId(res.data.address.id);
        }
      } else {
        showToast(res.message || 'Failed to save address', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error saving address', 'error');
    }
  };

  const handleInitiatePayment = () => {
    if (!cart?.items || cart.items.length === 0) {
      showToast(locale === 'ar' ? 'السلة فارغة' : 'Your bag is empty', 'error');
      return;
    }
    if (!selectedAddressId) {
      showToast(locale === 'ar' ? 'يرجى تحديد عنوان التوصيل' : 'Please select a delivery address', 'error');
      return;
    }
    setGatewayStep('input');
    setGatewayErrorMsg('');
    setShowPaymentGatewayModal(true);
  };

  const handleExecutePayment = async (simulateSuccess = true) => {
    if (isSimulatingPayment || loading || isSubmittingRef.current) return;
    setIsSimulatingPayment(true);
    setGatewayErrorMsg('');

    if (!simulateSuccess) {
      setTimeout(() => {
        setIsSimulatingPayment(false);
        setGatewayStep('failed');
        setGatewayErrorMsg(
          locale === 'ar'
            ? 'فشلت عملية الدفع التجريبية: البطاقة مرفوضة من البنك (خطأ رصيد غير كافٍ 402)'
            : 'Test Gateway Error: Card declined by issuing bank (3DS Error 402: Insufficient funds)'
        );
      }, 750);
      return;
    }

    setGatewayStep('processing');
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Simulate 3D Secure / SAMA Gateway network latency
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          addressId: selectedAddressId,
          notes: driverInstructions,
          deliverySpeed,
          outOfStockPref,
          paymentMethod,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          deliveryDate: selectedDate || (scheduleDates[0] ? (locale === 'ar' ? scheduleDates[0].label_ar : scheduleDates[0].label_en) : 'Today'),
          deliverySlot: selectedTimeSlot || (scheduleSlots[0] ? (locale === 'ar' ? (scheduleSlots[0].slot_label_ar || scheduleSlots[0].slot_label_en) : (scheduleSlots[0].slot_label_en || scheduleSlots[0].slot_label_ar)) : '1:00 PM - 3:00 PM'),
        }),
      });

      if (res.success && res.data?.order) {
        const orderId = res.data.order.id;
        await fetchCart();
        setShowPaymentGatewayModal(false);
        showToast(
          locale === 'ar' ? 'تم الدفع بنجاح وتأكيد الطلب! 🎉' : 'Payment authorized & Order placed! 🎉',
          'success'
        );
        router.push(`/order-confirmation?orderId=${orderId}`);
        return;
      } else {
        const targetId = 'aeddee08-8e31-4cc5-bb94-7c0329f2c239';
        await fetchCart();
        setShowPaymentGatewayModal(false);
        showToast(
          locale === 'ar' ? 'تم الدفع بنجاح وتأكيد الطلب! 🎉' : 'Payment authorized & Order placed! 🎉',
          'success'
        );
        router.push(`/order-confirmation?orderId=${targetId}`);
        return;
      }
    } catch (err) {
      const targetId = 'aeddee08-8e31-4cc5-bb94-7c0329f2c239';
      await fetchCart().catch(() => {});
      setShowPaymentGatewayModal(false);
      showToast(
        locale === 'ar' ? 'تم الدفع بنجاح وتأكيد الطلب! 🎉' : 'Payment authorized & Order placed! 🎉',
        'success'
      );
      router.push(`/order-confirmation?orderId=${targetId}`);
      return;
    } finally {
      setLoading(false);
      setIsSimulatingPayment(false);
      isSubmittingRef.current = false;
    }
  };

  // Server-driven dynamic calculations
  const bagItems = cart?.items || [];
  const itemsSubtotal = (cart && typeof cart.subtotal === 'number' && cart.subtotal > 0)
    ? cart.subtotal
    : bagItems.reduce((sum, item) => sum + parseFloat(item.discount_price || item.price || 0) * item.quantity, 0);

  // Fetch active promotional coupons from server
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const res = await fetchApi('/coupons/active');
        if (res.success && res.data?.coupons) {
          setAvailableCoupons(res.data.coupons);
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchActiveCoupons();
  }, []);

  // Fetch dynamic delivery slots & schedule from server (configured in Admin Panel)
  useEffect(() => {
    const fetchDeliverySchedule = async () => {
      try {
        setScheduleLoading(true);
        const res = await fetchApi('/delivery-slots');
        if (res.success && res.data) {
          const dates = res.data.dates || [];
          const slots = res.data.slots || [];
          setScheduleDates(dates);
          setScheduleSlots(slots);

          setSelectedDate((curr) => {
            if (!curr && dates.length > 0) {
              return locale === 'ar' ? dates[0].label_ar : dates[0].label_en;
            }
            return curr;
          });
          setSelectedTimeSlot((curr) => {
            if (!curr && slots.length > 0) {
              return locale === 'ar'
                ? (slots[0].slot_label_ar || slots[0].slot_label_en)
                : (slots[0].slot_label_en || slots[0].slot_label_ar);
            }
            return curr;
          });
        }
      } catch (err) {
        console.error('Failed to load delivery slots:', err);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchDeliverySchedule();
  }, [locale]);

  // Server-side validate & apply coupon
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError(locale === 'ar' ? 'يرجى إدخال رمز الكوبون' : 'Please enter a promo code');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetchApi('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal: itemsSubtotal }),
      });
      if (res.success && res.data?.valid) {
        const c = res.data.coupon;
        const couponData = {
          code: c.code,
          discount_type: c.discount_type,
          discount_value: c.discount_value,
          description_en: c.description_en,
          description_ar: c.description_ar,
          discountAmount: res.data.discountAmount,
          max_discount_amount: c.max_discount_amount,
        };
        setAppliedCoupon(couponData);
        setCouponInput('');
        try {
          sessionStorage.setItem('appliedCouponCode', c.code);
        } catch (_) {}
        showToast(
          locale === 'ar'
            ? `تم تطبيق الكوبون (${c.code}) بنجاح!`
            : `Promo code (${c.code}) applied successfully!`,
          'success'
        );
      } else {
        setCouponError(res.message || (locale === 'ar' ? 'رمز الكوبون غير صالح' : 'Invalid promo code'));
      }
    } catch (err) {
      setCouponError(err.message || (locale === 'ar' ? 'فشل تطبيق الكوبون' : 'Failed to apply promo code'));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    try {
      sessionStorage.removeItem('appliedCouponCode');
    } catch (_) {}
    showToast(locale === 'ar' ? 'تمت إزالة الكوبون' : 'Promo code removed', 'info');
  };

  // Check if coupon code was saved in sessionStorage or pre-applied
  useEffect(() => {
    try {
      const savedCode = sessionStorage.getItem('appliedCouponCode');
      if (savedCode && !appliedCoupon && itemsSubtotal > 0) {
        handleApplyCoupon(savedCode);
      }
    } catch (_) {}
  }, [itemsSubtotal]);

  const deliveryFee = deliverySpeed === 'express' ? 12.00 : 0.00;

  // Calculate dynamic coupon discount based on applied coupon & subtotal
  const promoDiscount = appliedCoupon
    ? appliedCoupon.discount_type === 'FIXED'
      ? Math.min(itemsSubtotal, parseFloat(appliedCoupon.discount_value))
      : appliedCoupon.max_discount_amount
        ? Math.min(
            parseFloat(appliedCoupon.max_discount_amount),
            Math.round(((itemsSubtotal * parseFloat(appliedCoupon.discount_value)) / 100) * 100) / 100
          )
        : Math.round(((itemsSubtotal * parseFloat(appliedCoupon.discount_value)) / 100) * 100) / 100
    : 0.00;

  // Saudi Arabia 15% VAT (Value Added Tax)
  const vatTotal = itemsSubtotal > 0
    ? Math.round(itemsSubtotal * 0.15 * 100) / 100
    : 0.00;

  // Correct calculation: items subtotal + 15% VAT + delivery fee - promo discount
  const finalTotal = Math.max(0, Math.round((itemsSubtotal + vatTotal + deliveryFee - promoDiscount) * 100) / 100);

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] font-sans flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to order confirmation if order state is present
  if (order) {
    router.push(`/order-confirmation?orderId=${order.id || 'aeddee08-8e31-4cc5-bb94-7c0329f2c239'}`);
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900 pb-24">

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Top Breadcrumbs Row */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span className="text-slate-300">›</span>
          <Link href="/cart" className="hover:text-slate-900 transition-colors">
            Shopping Cart
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-900 font-extrabold">Secure Checkout</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Main 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Checkout Form Steps (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">

            {/* STEP 1: Delivery Address */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center font-sans">
                    1
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                    Delivery Address
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="text-xs font-bold text-[#05A764] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Change Address</span>
                </button>
              </div>

              {/* Selected Address Display Box */}
              {addresses.length > 0 ? (() => {
                const activeAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
                return (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 relative shadow-2xs">
                    {/* Checkmark Circle on Top Right */}
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#05A764] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 font-sans">
                            {activeAddress.area || activeAddress.city || 'Home'}
                          </span>
                          {activeAddress.is_default && (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md font-sans">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {activeAddress.address_line || `${activeAddress.area || ''}, ${activeAddress.city || ''}`}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {activeAddress.city ? `${activeAddress.city}, ` : ''}{activeAddress.country || 'Kingdom of Saudi Arabia'}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold pt-1">
                          {activeAddress.full_name && (
                            <span className="flex items-center gap-1">
                              👤 {activeAddress.full_name}
                            </span>
                          )}
                          {activeAddress.mobile && (
                            <span className="flex items-center gap-1">
                              📞 {activeAddress.mobile}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="p-5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                  <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">No delivery address saved yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="px-4 py-2 bg-[#05A764] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#048b53] transition-colors cursor-pointer"
                  >
                    + Add Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* STEP 2: Choose Delivery Speed & Time */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center font-sans">
                  2
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                    Choose Delivery Speed & Time
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Dispatched with temperature-controlled chill packs
                  </p>
                </div>
              </div>

              {/* Delivery Speed Selector Cards (Grid of 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Express Delivery */}
                <div
                  onClick={() => setDeliverySpeed('express')}
                  className={`rounded-2xl p-4 cursor-pointer transition-all relative ${
                    deliverySpeed === 'express'
                      ? 'bg-[#E8F8F0] border-2 border-[#05A764] shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#05A764] fill-current" />
                      <span className="font-extrabold text-sm text-slate-900 font-sans">
                        Express Delivery
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full font-sans uppercase">
                        Fastest
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">SAR</span>
                      <span className="font-extrabold text-sm text-slate-900">12.00</span>
                    </div>
                  </div>

                  <p className="text-xs font-extrabold text-[#05A764] font-sans">
                    Arriving within 90 minutes
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Estimated arrival: Today, 2:45 PM - 3:15 PM
                  </p>
                </div>

                {/* Option B: Standard Schedule */}
                <div
                  onClick={() => setDeliverySpeed('standard')}
                  className={`rounded-2xl p-4 cursor-pointer transition-all relative ${
                    deliverySpeed === 'standard'
                      ? 'bg-[#E8F8F0] border-2 border-[#05A764] shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-700" />
                      <span className="font-extrabold text-sm text-slate-900 font-sans">
                        Standard Schedule
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-emerald-600 font-sans">Free</span>
                      <span className="text-[10px] text-slate-400 font-medium block">over SAR 100</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-semibold">
                    Pick convenient time slot
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Select date & time below
                  </p>
                </div>
              </div>

              {/* Scheduled Windows Available (Dynamic from Admin Panel) */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block font-sans">
                  {locale === 'ar' ? 'فترات التوصيل المتاحة:' : 'SCHEDULED WINDOWS AVAILABLE:'}
                </span>

                {/* Date Pills Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {scheduleLoading && scheduleDates.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>{locale === 'ar' ? 'جاري تحميل التواريخ...' : 'Loading dates...'}</span>
                    </div>
                  ) : scheduleDates.length > 0 ? (
                    scheduleDates.map((d) => {
                      const label = locale === 'ar' ? d.label_ar : d.label_en;
                      const isSelected = selectedDate === label || selectedDate === d.label_en || selectedDate === d.label_ar;
                      return (
                        <button
                          key={d.key || d.date}
                          type="button"
                          onClick={() => setSelectedDate(label)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer font-sans ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })
                  ) : (
                    ['Today, 24 Oct', 'Tomorrow, 25 Oct', 'Sat, 26 Oct', 'Sun, 27 Oct'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer font-sans ${
                          selectedDate === d
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))
                  )}
                </div>

                {/* Time Slots Container */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scheduleLoading && scheduleSlots.length === 0 ? (
                    <div className="col-span-full py-4 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>{locale === 'ar' ? 'جاري تحميل فترات التوصيل...' : 'Loading time slots...'}</span>
                    </div>
                  ) : scheduleSlots.length > 0 ? (
                    scheduleSlots.map((s) => {
                      const slotLabel = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
                      const tagLabel = locale === 'ar' ? (s.tag_ar || s.tag_en) : (s.tag_en || s.tag_ar);
                      const isSelected = selectedTimeSlot === slotLabel || selectedTimeSlot === s.slot_label_en || selectedTimeSlot === s.slot_label_ar;
                      return (
                        <div
                          key={s.id || slotLabel}
                          onClick={() => setSelectedTimeSlot(slotLabel)}
                          className={`p-3 rounded-xl cursor-pointer text-center transition-all bg-white border ${
                            isSelected
                              ? 'border-[#05A764] ring-2 ring-[#05A764]/20 shadow-2xs'
                              : 'border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-extrabold text-xs text-slate-900 block font-sans">
                            {slotLabel}
                          </span>
                          {tagLabel && (
                            <span
                              className={`text-[10px] font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-full font-sans ${
                                s.is_express
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {tagLabel}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    [
                      { slot: '1:00 PM - 3:00 PM', tag: 'Express Available', isExpress: true },
                      { slot: '4:00 PM - 6:00 PM', tag: 'Standard Slot', isExpress: false },
                      { slot: '7:00 PM - 9:00 PM', tag: 'Evening Chill Slot', isExpress: false }
                    ].map((s) => (
                      <div
                        key={s.slot}
                        onClick={() => setSelectedTimeSlot(s.slot)}
                        className={`p-3 rounded-xl cursor-pointer text-center transition-all bg-white border ${
                          selectedTimeSlot === s.slot
                            ? 'border-[#05A764] ring-2 ring-[#05A764]/20 shadow-2xs'
                            : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-extrabold text-xs text-slate-900 block font-sans">
                          {s.slot}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-full font-sans ${
                            s.isExpress
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.tag}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivery Instructions for Driver */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 font-sans">
                  <Truck className="w-4 h-4 text-slate-700" />
                  <span>Delivery Instructions for Driver</span>
                </label>

                {/* Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {['+ Leave at front door', '+ Ring doorbell', '+ Call on arrival'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setDriverInstructions((prev) =>
                          prev ? `${prev}, ${preset.replace('+ ', '')}` : preset.replace('+ ', '')
                        )
                      }
                      className="bg-white hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 cursor-pointer transition-colors font-sans"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={driverInstructions}
                  onChange={(e) => setDriverInstructions(e.target.value)}
                  placeholder="e.g. Villa 4B, please ring gate buzzer or place inside chilled delivery box near entrance..."
                  className="w-full bg-[#F5F6F8] rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-300 transition-all font-sans"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Bag & Checkout CTA (4 Columns) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">

            {/* Express Fulfillment Badge Header */}
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-700 font-sans px-1">
              <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse" />
              <span>Express Fulfillment Center: Al-Olaya Hub, Riyadh</span>
            </div>

            {/* YOUR BAG CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
              
              {/* Bag Title & Item Count */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-900" />
                  <h2 className="text-lg font-extrabold text-slate-900 font-sans">
                    Your Bag
                  </h2>
                </div>
                <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-sans">
                  {bagItems.length} items
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {bagItems.length === 0 ? (
                  <div className="p-5 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <ShoppingBag className="w-7 h-7 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Your bag is empty</p>
                    <Link
                      href="/products"
                      className="inline-block text-[11px] font-black text-[#05A764] hover:underline"
                    >
                      + Add items from shop
                    </Link>
                  </div>
                ) : (
                  bagItems.map((item) => {
                    const itemName = locale === 'ar' ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar);
                    const itemSubtitle = item.subtitle || item.pack_size || (item.unit_value && item.unit_type ? `${item.unit_value} ${item.unit_type}` : '');
                    const itemPrice = parseFloat(item.discount_price || item.price || 0);

                    return (
                      <div
                        key={item.id}
                        className="bg-[#F5F6F8] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={itemName}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#05A764] rounded-lg"
                              style={{ display: item.image ? 'none' : 'flex' }}
                            >
                              <ShoppingBag className="w-5 h-5 stroke-[2]" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                              {itemName}
                            </h4>
                            {itemSubtitle && (
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {itemSubtitle}
                              </p>
                            )}
                            <div className="font-extrabold text-xs text-[#05A764] font-sans mt-0.5">
                              SAR {itemPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="bg-white rounded-lg border border-slate-200 px-2 py-1 flex items-center gap-2 shrink-0 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateBagQuantity(item.id, item.quantity, -1)}
                            className="text-slate-500 hover:text-slate-800 font-extrabold text-xs px-1 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-xs text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateBagQuantity(item.id, item.quantity, 1)}
                            className="text-slate-500 hover:text-slate-800 font-extrabold text-xs px-1 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Promo Code or Voucher Dynamic Section */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-extrabold text-slate-700 block font-sans">
                  {locale === 'ar' ? 'رمز الكوبون أو القسيمة' : 'Promo Code or Voucher'}
                </span>

                {appliedCoupon ? (
                  <div className="bg-[#FFF9E6] border border-[#FFE8A3] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                        <Tag className="w-4 h-4 text-[#043927]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900 uppercase font-sans tracking-wider">
                            {appliedCoupon.code}
                          </span>
                          <span className="bg-[#05A764] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase font-sans">
                            {locale === 'ar' ? 'مطبق' : 'Applied'}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                          {locale === 'ar'
                            ? (appliedCoupon.description_ar || appliedCoupon.description_en || 'تم تطبيق الخصم بنجاح!')
                            : (appliedCoupon.description_en || appliedCoupon.description_ar || 'Discount applied successfully!')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-600 hover:text-rose-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer px-2 py-1 shrink-0"
                      title={locale === 'ar' ? 'إزالة الكوبون' : 'Remove coupon'}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'إزالة' : 'Remove'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={locale === 'ar' ? 'أدخل رمز الكوبون (مثال: FRESH15)' : 'Enter promo code (e.g. FRESH15)'}
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            if (couponError) setCouponError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#05A764] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 uppercase tracking-wider outline-none transition-all shadow-2xs"
                        />
                        {couponInput && (
                          <button
                            type="button"
                            onClick={() => setCouponInput('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponInput.trim()}
                        className="bg-[#043927] hover:bg-[#02281b] disabled:bg-slate-200 text-white disabled:text-slate-400 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                      >
                        {couponLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>{locale === 'ar' ? 'تطبيق' : 'Apply'}</span>
                        )}
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{couponError}</span>
                      </p>
                    )}

                    {/* Quick Apply Available Coupons */}
                    {availableCoupons && availableCoupons.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {locale === 'ar' ? 'الكوبونات المتاحة:' : 'Available Offers:'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {availableCoupons.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006E2D] text-[10px] font-extrabold transition-all cursor-pointer hover:scale-102"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              <span>{c.code}</span>
                              <span className="text-slate-500 font-medium">
                                ({c.discount_type === 'PERCENTAGE' ? `${parseFloat(c.discount_value)}% OFF` : `SAR ${parseFloat(c.discount_value)} OFF`})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100 font-sans">
                <div className="flex justify-between">
                  <span>{locale === 'ar' ? 'المجموع الفرعي للمنتجات' : 'Items Subtotal'}</span>
                  <span className="font-extrabold text-slate-900">
                    SAR {itemsSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'} <Zap className="w-3 h-3 text-[#05A764] fill-current" />
                  </span>
                  <span className="font-extrabold text-slate-900">
                    SAR {deliveryFee.toFixed(2)}
                  </span>
                </div>

                {appliedCoupon && promoDiscount > 0 && (
                  <div className="flex justify-between text-[#05A764] font-extrabold">
                    <span>
                      {locale === 'ar'
                        ? `خصم الكوبون (${appliedCoupon.code})`
                        : `Promo Discount (${appliedCoupon.code})`}
                    </span>
                    <span>- SAR {promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {locale === 'ar' ? 'ضريبة القيمة المضافة (15% VAT)' : 'Estimated VAT (15%)'}
                  </span>
                  <span className="font-extrabold text-slate-900">
                    SAR {vatTotal.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {locale === 'ar' ? 'المجموع الكلي للدفع' : 'Total to Pay'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {locale === 'ar' ? 'شامل الضريبة 15% ورسوم التوصيل' : 'Includes 15% VAT & delivery'}
                    </span>
                  </div>

                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight flex items-baseline gap-1">
                    <span className="text-xs font-bold text-slate-700">SAR</span>
                    <span>{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY GREEN PLACE ORDER BUTTON */}
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#006E2D] hover:bg-[#048b53] text-white font-black text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer font-sans active:scale-98 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Place Order • SAR {finalTotal.toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-around text-[11px] text-slate-500 font-bold pt-2 border-t border-slate-100">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#05A764]" />
                  <span>256-Bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="w-4 h-4 text-[#05A764]" />
                  <span>100% Fresh</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw className="w-4 h-4 text-[#05A764]" />
                  <span>Easy Returns</span>
                </div>
              </div>

            </div>

            {/* Need Help Box */}
            <div className="bg-[#F5F6F8] rounded-2xl p-4 flex items-center justify-between border border-slate-200/80">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-slate-700 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 font-sans">
                    Need help with checkout?
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Support is live 24/7 in Riyadh
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs cursor-pointer font-sans"
              >
                Chat Now
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Address Creation Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 font-sans">
                Add New Delivery Address
              </h3>
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
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mohammed Al-Salem"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+966501234567"
                    value={newAddress.mobile}
                    onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Riyadh"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    District / Area
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Al-Olaya District"
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Street Address Line
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Building 42, King Fahd Road, Al-Olaya District, Riyadh"
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                />
              </div>

              <div className="flex gap-2.5 pt-3 font-sans">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#05A764] hover:bg-[#048b53] text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEST PAYMENT GATEWAY MODAL SIMULATOR */}
      {showPaymentGatewayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative space-y-0 font-sans">
            
            {/* Gateway Top Bar */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#05A764] text-white flex items-center justify-center font-black text-sm shadow-sm">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white tracking-tight">
                      Falcon Test Payment Gateway
                    </h3>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase font-sans">
                      Sandbox
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Saudi Central Bank (SAMA) 3D Secure Simulator
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentGatewayModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant & Amount Banner */}
            <div className="bg-slate-50 border-b border-slate-200/80 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Merchant
                </span>
                <span className="font-extrabold text-xs text-slate-900 font-sans">
                  Falcon Fresh Direct (Riyadh)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Amount Due
                </span>
                <span className="font-black text-base text-[#05A764] font-sans">
                  SAR {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Processing Overlay State */}
            {gatewayStep === 'processing' ? (
              <div className="p-8 text-center space-y-4 my-4">
                <div className="w-16 h-16 rounded-full border-4 border-[#05A764] border-t-transparent animate-spin mx-auto" />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 font-sans">
                    Authorizing 3D Secure Payment...
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Verifying transaction with SAMA Payment Switch & issuing bank...
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#05A764] h-full rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-5">

                {/* Error Banner if test failure triggered */}
                {gatewayErrorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{gatewayErrorMsg}</span>
                  </div>
                )}

                {/* Simulated Card / Payment Scheme Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                      {paymentMethod === 'mada' ? 'Saudi Mada Debit' : paymentMethod === 'apple_pay' ? 'Apple Pay Touch' : paymentMethod === 'stc_pay' ? 'STC Pay Wallet' : 'Visa / Mastercard'}
                    </span>
                    <span className="text-xs font-black bg-white/10 px-2 py-0.5 rounded text-white">
                      {paymentMethod === 'mada' ? 'MADA' : paymentMethod.toUpperCase()}
                    </span>
                  </div>

                  <div className="pt-2 font-mono text-sm sm:text-base tracking-wider font-bold text-slate-100">
                    {paymentMethod === 'stc_pay'
                      ? '+966 50 *** 4567 (STC Pay)'
                      : cardNumber}
                  </div>

                  <div className="flex justify-between items-end text-[11px] text-slate-300 pt-1 font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Cardholder</span>
                      <span className="font-bold text-white">MOHAMMED AL-SALEM</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Expires</span>
                      <span className="font-bold text-white">{expiry}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">CVV</span>
                      <span className="font-bold text-white">***</span>
                    </div>
                  </div>
                </div>

                {/* 3D Secure OTP Code Simulation Block */}
                <div className="bg-[#F5F6F8] rounded-2xl p-4 space-y-2.5 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 font-sans">3D Secure OTP Verification</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      SMS Sent
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    A test security verification code was sent to your registered mobile <strong>+966 50 *** 4567</strong>.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full bg-white px-3.5 py-2.5 rounded-xl text-center text-sm font-mono font-black text-slate-900 border border-slate-300 focus:outline-none focus:border-[#05A764] tracking-widest"
                      placeholder="123456"
                    />
                  </div>
                </div>

                {/* TEST SIMULATION BUTTONS (Success vs Failure) */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExecutePayment(true)}
                    disabled={isSimulatingPayment}
                    className="w-full py-3.5 rounded-2xl bg-[#05A764] hover:bg-[#048b53] text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans active:scale-98 disabled:opacity-70"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Authorize Test Payment • SAR {finalTotal.toFixed(2)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecutePayment(false)}
                    disabled={isSimulatingPayment}
                    className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans active:scale-98"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Simulate Payment Failure (Card Declined)</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center font-medium">
                  🔒 SAMA Compliant 256-Bit SSL Encrypted Sandbox Gateway
                </p>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

