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

  // Modal & Address State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalTab, setAddressModalTab] = useState('list'); // 'list' | 'new'
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    mobile: '',
    country: 'Saudi Arabia',
    state: 'Riyadh Province',
    city: 'Riyadh',
    area: '',
    address_line: '',
    postal_code: '',
    is_default: true,
  });

  // Prefill newAddress full_name and mobile from logged in user if available
  useEffect(() => {
    if (user) {
      const name = user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || (user.email ? user.email.split('@')[0] : '');
      const phone = user.mobile || user.phone_number || '';
      setNewAddress((prev) => ({
        ...prev,
        full_name: prev.full_name || name,
        mobile: prev.mobile || phone,
      }));
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const res = await fetchApi('/customers/addresses');
      if (res.success && res.data?.addresses && res.data.addresses.length > 0) {
        setAddresses(res.data.addresses);
        setSelectedAddressId((prevId) => {
          if (prevId && res.data.addresses.some((a) => a.id === prevId)) {
            return prevId;
          }
          const defaultAddr = res.data.addresses.find((a) => a.is_default) || res.data.addresses[0];
          return defaultAddr.id;
        });
      } else {
        setAddresses([]);
        setSelectedAddressId('');
      }
    } catch (err) {
      setAddresses([]);
      setSelectedAddressId('');
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
        full_name: (newAddress.full_name || '').trim(),
        mobile: (newAddress.mobile || '').trim(),
        country: newAddress.country || 'Saudi Arabia',
        state: newAddress.state || newAddress.city || 'Riyadh',
        city: (newAddress.city || '').trim() || 'Riyadh',
        area: (newAddress.area || '').trim(),
        address_line: (newAddress.address_line || '').trim(),
        postal_code: (newAddress.postal_code || '').trim(),
        is_default: addresses.length === 0 ? true : Boolean(newAddress.is_default),
      };

      if (!payload.full_name || !payload.mobile || !payload.city || !payload.area || !payload.address_line) {
        showToast(
          locale === 'ar' ? 'يرجى ملء جميع حقول العنوان المطلوبة' : 'Please fill in all required address fields',
          'error'
        );
        return;
      }

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
    if (!selectedAddressId || addresses.length === 0) {
      showToast(
        locale === 'ar' ? 'يرجى إضافة عنوان التوصيل أولاً للمتابعة' : 'Please add a delivery address first to proceed',
        'error'
      );
      setAddressModalTab('new');
      setShowAddressModal(true);
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

      const addressIdToUse = selectedAddressId;
      if (!addressIdToUse || addresses.length === 0) {
        setShowPaymentGatewayModal(false);
        showToast(
          locale === 'ar' ? 'يرجى تحديد أو إضافة عنوان التوصيل' : 'Please select or add a delivery address',
          'error'
        );
        setAddressModalTab('new');
        setShowAddressModal(true);
        return;
      }

      if (deliverySpeed === 'standard') {
        const slotToUse = selectedTimeSlot || (scheduleSlots[0] ? (locale === 'ar' ? (scheduleSlots[0].slot_label_ar || scheduleSlots[0].slot_label_en) : (scheduleSlots[0].slot_label_en || scheduleSlots[0].slot_label_ar)) : '1:00 PM - 3:00 PM');
        if (!slotToUse || isSlotExpired(slotToUse, selectedDate)) {
          setShowPaymentGatewayModal(false);
          showToast(
            locale === 'ar'
              ? 'فترة التوصيل المحددة انتهى وقتها، يرجى اختيار فترة قادمة متاحة'
              : 'The selected delivery slot has already passed. Please choose an upcoming slot.',
            'error'
          );
          return;
        }
      }

      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          addressId: addressIdToUse,
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
        await clearCart(false);
        await fetchCart().catch(() => {});
        setShowPaymentGatewayModal(false);
        showToast(
          locale === 'ar' ? 'تم الدفع بنجاح وتأكيد الطلب! 🎉' : 'Payment authorized & Order placed! 🎉',
          'success'
        );
        router.push(`/order-confirmation?orderId=${orderId}`);
        return;
      } else {
        setShowPaymentGatewayModal(false);
        showToast(
          res?.message || (locale === 'ar' ? 'فشل إتمام الطلب' : 'Failed to place order'),
          'error'
        );
        return;
      }
    } catch (err) {
      setShowPaymentGatewayModal(false);
      showToast(
        err.message || (locale === 'ar' ? 'حدث خطأ أثناء إتمام الطلب' : 'An error occurred while placing order'),
        'error'
      );
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

  // Parse slot start time for time-passed validation
  const parseSlotStartTime = (slotStr) => {
    if (!slotStr || typeof slotStr !== 'string') return null;
    let str = slotStr
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/م/g, 'PM')
      .replace(/ص/g, 'AM');

    const parts = str.split(/[-–—]/);
    if (!parts[0]) return null;
    const startPart = parts[0].trim();
    const endPart = parts[1] ? parts[1].trim() : '';

    const match = startPart.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    let meridian = match[3] ? match[3].toUpperCase() : null;

    if (!meridian && endPart) {
      const endMeridianMatch = endPart.match(/(AM|PM)/i);
      if (endMeridianMatch) {
        const endMeridian = endMeridianMatch[1].toUpperCase();
        const endHourMatch = endPart.match(/(\d{1,2})/);
        const endHour = endHourMatch ? parseInt(endHourMatch[1], 10) : hours;
        if (endMeridian === 'PM') {
          if (hours < endHour || hours === 12) {
            meridian = 'PM';
          } else if (hours > endHour && hours !== 12) {
            meridian = 'AM';
          } else {
            meridian = 'PM';
          }
        } else {
          meridian = 'AM';
        }
      }
    }

    if (meridian === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridian === 'AM' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  };

  // Check if a given date label represents "Today"
  const isDateToday = (dateLabel = selectedDate) => {
    if (!dateLabel) return true;
    const found = scheduleDates.find(
      (d) => dateLabel === d.label_en || dateLabel === d.label_ar || dateLabel === d.key || dateLabel === d.date
    );
    if (found) {
      return Boolean(found.is_today);
    }
    const lower = String(dateLabel).toLowerCase();
    return lower.includes('today') || lower.includes('اليوم');
  };

  // Check if a time slot is passed/expired for the currently (or specified) selected date
  const isSlotExpired = (slotLabel, dateToCheck = selectedDate) => {
    if (!isDateToday(dateToCheck)) {
      return false; // Tomorrow or later days are never expired
    }
    const parsed = parseSlotStartTime(slotLabel);
    if (!parsed) return false;

    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    // If current time >= slot start time, the slot is expired / passed
    if (currentH > parsed.hours) return true;
    if (currentH === parsed.hours && currentM >= parsed.minutes) return true;

    return false;
  };

  // Handle Date Selection and auto-shift slot if expired
  const handleSelectDate = (dateLabel) => {
    setSelectedDate(dateLabel);
    if (isSlotExpired(selectedTimeSlot, dateLabel)) {
      const availableList = scheduleSlots.length > 0 ? scheduleSlots : [
        { slot_label_en: '1:00 PM - 3:00 PM', slot_label_ar: '1:00 م - 3:00 م' },
        { slot_label_en: '4:00 PM - 6:00 PM', slot_label_ar: '4:00 م - 6:00 م' },
        { slot_label_en: '7:00 PM - 9:00 PM', slot_label_ar: '7:00 م - 9:00 م' },
      ];
      const validSlot = availableList.find((s) => {
        const label = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
        return !isSlotExpired(label, dateLabel);
      });
      if (validSlot) {
        const validLabel = locale === 'ar'
          ? (validSlot.slot_label_ar || validSlot.slot_label_en)
          : (validSlot.slot_label_en || validSlot.slot_label_ar);
        setSelectedTimeSlot(validLabel);
      } else {
        setSelectedTimeSlot('');
      }
    }
  };

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

          const defaultDate = dates.length > 0 ? (locale === 'ar' ? dates[0].label_ar : dates[0].label_en) : '';
          setSelectedDate((curr) => curr || defaultDate);

          setSelectedTimeSlot((curr) => {
            if (curr && !isSlotExpired(curr, defaultDate)) return curr;
            // Find first available slot whose time has not passed
            const validSlot = slots.find((s) => {
              const label = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
              return !isSlotExpired(label, defaultDate);
            });
            if (validSlot) {
              return locale === 'ar'
                ? (validSlot.slot_label_ar || validSlot.slot_label_en)
                : (validSlot.slot_label_en || validSlot.slot_label_ar);
            }
            return '';
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
  if (order?.id) {
    router.push(`/order-confirmation?orderId=${order.id}`);
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
                  onClick={() => {
                    setAddressModalTab(addresses.length > 0 ? 'list' : 'new');
                    setShowAddressModal(true);
                  }}
                  className="text-xs font-bold text-[#05A764] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {addresses.length > 0
                      ? (locale === 'ar' ? 'تغيير العنوان' : 'Change Address')
                      : (locale === 'ar' ? '+ إضافة عنوان' : '+ Add Address')}
                  </span>
                </button>
              </div>

              {/* Selected Address Display Box OR Empty State */}
              {addresses.length > 0 && selectedAddressId ? (() => {
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
                              {locale === 'ar' ? 'افتراضي' : 'Default'}
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
                <div className="p-6 bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#05A764] flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      {locale === 'ar' ? 'لم يتم حفظ أي عنوان توصيل' : 'No delivery address saved yet'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {locale === 'ar' ? 'يرجى إضافة عنوانك لتوصيل الطلب إليك' : 'Please add a delivery address to proceed with checkout'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressModalTab('new');
                      setShowAddressModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#05A764] hover:bg-[#048b53] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إضافة عنوان توصيل' : 'Add Delivery Address'}</span>
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
                          onClick={() => handleSelectDate(label)}
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
                        onClick={() => handleSelectDate(d)}
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
                      const expired = isSlotExpired(slotLabel);
                      const isSelected = !expired && (selectedTimeSlot === slotLabel || selectedTimeSlot === s.slot_label_en || selectedTimeSlot === s.slot_label_ar);

                      return (
                        <div
                          key={s.id || slotLabel}
                          onClick={() => {
                            if (expired) {
                              showToast(
                                locale === 'ar'
                                  ? 'انتهى وقت هذه الفترة لليوم، يرجى اختيار موعد آخر'
                                  : 'This time slot has already passed today. Please pick an upcoming slot.',
                                'warning'
                              );
                              return;
                            }
                            setSelectedTimeSlot(slotLabel);
                          }}
                          className={`p-3 rounded-xl text-center transition-all border relative ${
                            expired
                              ? 'bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed select-none opacity-60'
                              : isSelected
                              ? 'bg-white border-[#05A764] ring-2 ring-[#05A764]/20 shadow-2xs cursor-pointer'
                              : 'bg-white border-slate-200/80 hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className={`font-extrabold text-xs block font-sans ${expired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {slotLabel}
                          </span>
                          {expired ? (
                            <span className="text-[10px] font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 font-sans">
                              {locale === 'ar' ? 'انتهى الوقت' : 'Time Passed'}
                            </span>
                          ) : tagLabel ? (
                            <span
                              className={`text-[10px] font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-full font-sans ${
                                s.is_express
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {tagLabel}
                            </span>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    [
                      { slot: '1:00 PM - 3:00 PM', tag: 'Express Available', isExpress: true },
                      { slot: '4:00 PM - 6:00 PM', tag: 'Standard Slot', isExpress: false },
                      { slot: '7:00 PM - 9:00 PM', tag: 'Evening Chill Slot', isExpress: false }
                    ].map((s) => {
                      const expired = isSlotExpired(s.slot);
                      const isSelected = !expired && selectedTimeSlot === s.slot;

                      return (
                        <div
                          key={s.slot}
                          onClick={() => {
                            if (expired) {
                              showToast(
                                locale === 'ar'
                                  ? 'انتهى وقت هذه الفترة لليوم، يرجى اختيار موعد آخر'
                                  : 'This time slot has already passed today. Please pick an upcoming slot.',
                                'warning'
                              );
                              return;
                            }
                            setSelectedTimeSlot(s.slot);
                          }}
                          className={`p-3 rounded-xl text-center transition-all border relative ${
                            expired
                              ? 'bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed select-none opacity-60'
                              : isSelected
                              ? 'bg-white border-[#05A764] ring-2 ring-[#05A764]/20 shadow-2xs cursor-pointer'
                              : 'border-slate-200/80 hover:border-slate-300 bg-white cursor-pointer'
                          }`}
                        >
                          <span className={`font-extrabold text-xs block font-sans ${expired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {s.slot}
                          </span>
                          {expired ? (
                            <span className="text-[10px] font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 font-sans">
                              {locale === 'ar' ? 'انتهى الوقت' : 'Time Passed'}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-full font-sans ${
                                s.isExpress
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {s.tag}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* If all slots for today have ended, show warning */}
                {isDateToday() && (scheduleSlots.length > 0 ? scheduleSlots : [
                  { slot_label_en: '1:00 PM - 3:00 PM' },
                  { slot_label_en: '4:00 PM - 6:00 PM' },
                  { slot_label_en: '7:00 PM - 9:00 PM' }
                ]).every((s) => isSlotExpired(s.slot_label_en || s.slot)) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-bold font-sans">
                    {locale === 'ar' ? '⚠️ انتهت جميع مواعيد التوصيل لليوم، يرجى اختيار موعد ليوم الغد للمتابعة' : '⚠️ All delivery slots for today have ended. Please select tomorrow to schedule your order.'}
                  </div>
                )}
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

      {/* Address Selection & Creation Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 font-sans">
                {addressModalTab === 'list' && addresses.length > 0
                  ? (locale === 'ar' ? 'اختر عنوان التوصيل' : 'Select Delivery Address')
                  : (locale === 'ar' ? 'إضافة عنوان توصيل جديد' : 'Add New Delivery Address')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If tab is list and user has saved addresses */}
            {addressModalTab === 'list' && addresses.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setShowAddressModal(false);
                          showToast(
                            locale === 'ar' ? 'تم اختيار عنوان التوصيل' : 'Delivery address selected',
                            'success'
                          );
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-[#05A764] bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                              isSelected
                                ? 'border-[#05A764] bg-[#05A764]'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">
                                {addr.area || addr.city || 'Home'}
                              </span>
                              {addr.is_default && (
                                <span className="bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                  {locale === 'ar' ? 'افتراضي' : 'Default'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium">
                              {addr.address_line || `${addr.area || ''}, ${addr.city || ''}`}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium pt-0.5">
                              {addr.full_name && <span>👤 {addr.full_name}</span>}
                              {addr.mobile && <span>📞 {addr.mobile}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setAddressModalTab('new')}
                    className="flex-1 py-2.5 rounded-xl border border-dashed border-[#05A764] text-[#05A764] hover:bg-emerald-50 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إضافة عنوان جديد' : '+ Add New Address'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    {locale === 'ar' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateAddress} className="space-y-3.5 text-xs font-semibold">
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddressModalTab('list')}
                    className="text-[11px] font-bold text-[#05A764] hover:underline flex items-center gap-1 mb-1 cursor-pointer"
                  >
                    ← {locale === 'ar' ? 'الرجوع إلى العناوين المحفوظة' : 'Back to saved addresses'}
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={locale === 'ar' ? 'مثال: أحمد الصالح' : 'e.g. Ahmed Al-Saleh'}
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'رقم الجوال *' : 'Mobile Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={locale === 'ar' ? 'مثال: 0501234567' : 'e.g. +966 50 123 4567'}
                      value={newAddress.mobile}
                      onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'المدينة *' : 'City *'}
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
                      {locale === 'ar' ? 'الحي / المنطقة *' : 'District / Area *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={locale === 'ar' ? 'مثال: حي العليا' : 'e.g. Al-Olaya'}
                      value={newAddress.area}
                      onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'تفاصيل العنوان / الشارع *' : 'Street Address Line *'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={locale === 'ar' ? 'اسم الشارع، رقم المبنى، رقم الشقة أو المعلم القريب' : 'Street name, building number, apartment, or landmark'}
                    value={newAddress.address_line}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-3 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      if (addresses.length > 0) {
                        setAddressModalTab('list');
                      } else {
                        setShowAddressModal(false);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#05A764] hover:bg-[#048b53] text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    {locale === 'ar' ? 'حفظ العنوان' : 'Save Address'}
                  </button>
                </div>
              </form>
            )}
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

