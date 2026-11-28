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
  Sparkles,
  Calendar,
  CreditCard,
  Banknote,
  CheckSquare,
  Clock,
  BadgePercent,
  Loader2,
  Heart,
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
  const [selectedTipOption, setSelectedTipOption] = useState(null); // null | presetId | 'other'
  const [customTipInput, setCustomTipInput] = useState('');
  const [tipSettings, setTipSettings] = useState({
    is_enabled: true,
    show_on_checkout: true,
    presets: [
      { id: '1', amount: 5, is_enabled: true },
      { id: '2', amount: 10, is_enabled: true },
      { id: '3', amount: 15, is_enabled: true },
    ],
    allow_custom: true,
    min_custom_amount: 1.00,
    max_custom_amount: 500.00,
  });
  const [deliverySettings, setDeliverySettings] = useState({
    express: {
      is_enabled: true,
      base_fee: 12.00,
      estimated_delivery_minutes: 90,
      name_en: 'Express Delivery',
      name_ar: 'توصيل سريع',
    },
    standard: {
      is_enabled: true,
      base_fee: 0.00,
      free_delivery_threshold: 100.00,
      name_en: 'Standard Schedule',
      name_ar: 'توصيل قياسي مجدول',
    },
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [scheduleDates, setScheduleDates] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([]);

  // Separate Express and Standard delivery schedules and states
  const [expressDates, setExpressDates] = useState([]);
  const [expressSlots, setExpressSlots] = useState([]);
  const [expressSelectedDate, setExpressSelectedDate] = useState('');
  const [expressSelectedSlot, setExpressSelectedSlot] = useState('');

  const [standardDates, setStandardDates] = useState([]);
  const [standardSlots, setStandardSlots] = useState([]);
  const [standardSelectedDate, setStandardSelectedDate] = useState('');
  const [standardSelectedSlot, setStandardSelectedSlot] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [driverInstructions, setDriverInstructions] = useState('');
  const [outOfStockPref, setOutOfStockPref] = useState('call'); // 'call' | 'best_match' | 'no_replace'
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'online' | 'cod'

  // Card details state
  const [cardNumber, setCardNumber] = useState('5888 4210 9384 1029');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('482');
  const [saveCard, setSaveCard] = useState(true);

  // Test Payment Gateway Modal State
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [showCodConfirmModal, setShowCodConfirmModal] = useState(false);
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
  const getEmptyAddress = () => ({
    full_name: '',
    mobile: '',
    country: 'Saudi Arabia',
    state: '',
    city: '',
    area: '',
    address_line: '',
    postal_code: '',
    is_default: false,
  });

  const [newAddress, setNewAddress] = useState({
    full_name: '',
    mobile: '',
    country: 'Saudi Arabia',
    state: '',
    city: '',
    area: '',
    address_line: '',
    postal_code: '',
    is_default: false,
  });

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
        setNewAddress(getEmptyAddress());
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

  const triggerBrowserPushNotification = (order) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const orderNumber = order?.order_number || `#${order?.id || ''}`;
    const grandTotal = parseFloat(order?.grand_total || 0).toFixed(2);
    const title = locale === 'ar'
      ? `تم تأكيد طلبك بنجاح! #${orderNumber}`
      : `Order Confirmed! #${orderNumber}`;
    const body = locale === 'ar'
      ? `شكراً لك! تم استلام طلبك بقيمة ${grandTotal} ر.س وجارٍ تحضيره.`
      : `Thank you! Your order of SAR ${grandTotal} has been confirmed and is being prepared.`;

    const send = () => {
      try {
        new Notification(title, {
          body,
          icon: '/saqrcart-logo.png',
          badge: '/saqrcart-logo.png',
        });
      } catch (_) { }
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          send();
        }
      });
    }
  };

  const handleExecuteCodOrder = async () => {
    if (loading || isSubmittingRef.current) return;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const addressIdToUse = selectedAddressId;
      if (!addressIdToUse || addresses.length === 0) {
        showToast(
          locale === 'ar' ? 'يرجى تحديد أو إضافة عنوان التوصيل' : 'Please select or add a delivery address',
          'error'
        );
        setAddressModalTab('new');
        setShowAddressModal(true);
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      if (deliverySpeed === 'express' && deliverySettings?.express?.is_enabled === false) {
        showToast(
          locale === 'ar'
            ? 'التوصيل السريع غير متاح حالياً، يرجى اختيار التوصيل القياسي'
            : 'Express delivery is currently unavailable. Please choose Standard Schedule.',
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }
      if (deliverySpeed === 'standard' && deliverySettings?.standard?.is_enabled === false) {
        showToast(
          locale === 'ar'
            ? 'التوصيل القياسي غير متاح حالياً، يرجى اختيار التوصيل السريع'
            : 'Standard schedule is currently unavailable. Please choose Express Delivery.',
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const activeDate = deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate;
      const activeSlot = deliverySpeed === 'express' ? expressSelectedSlot : standardSelectedSlot;
      const activeSlotsList = deliverySpeed === 'express' ? expressSlots : standardSlots;

      if (!activeSlot) {
        showToast(
          deliverySpeed === 'express'
            ? (locale === 'ar' ? 'يرجى اختيار فترة توصيل سريع متاحة للمتابعة' : 'Please select an available Express delivery slot to proceed.')
            : (locale === 'ar' ? 'يرجى اختيار فترة توصيل قياسي متاحة للمتابعة' : 'Please select an available Standard delivery slot to proceed.'),
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      if (isSlotExpired(activeSlot, activeDate)) {
        showToast(
          locale === 'ar'
            ? 'فترة التوصيل المحددة انتهى وقتها، يرجى اختيار فترة قادمة متاحة'
            : 'The selected delivery slot has already passed. Please choose an upcoming slot.',
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const isSlotValidForMethod = activeSlotsList.some((s) => {
        const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
        return lbl === activeSlot || s.slot_label_en === activeSlot || s.slot_label_ar === activeSlot;
      });

      if (!isSlotValidForMethod) {
        showToast(
          deliverySpeed === 'express'
            ? (locale === 'ar' ? 'الفترة المحددة غير صالحة للتوصيل السريع' : 'The selected slot is not valid for Express delivery.')
            : (locale === 'ar' ? 'الفترة المحددة غير صالحة للتوصيل القياسي' : 'The selected slot is not valid for Standard delivery.'),
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          addressId: addressIdToUse,
          notes: driverInstructions,
          deliverySpeed,
          outOfStockPref,
          paymentMethod: 'COD',
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          deliveryDate: activeDate,
          deliverySlot: activeSlot,
          tipAmount,
        }),
      });

      if (res.success && res.data?.order) {
        const orderId = res.data.order.id;
        triggerBrowserPushNotification(res.data.order);
        await clearCart(false);
        await fetchCart().catch(() => { });
        setShowCodConfirmModal(false);
        showToast(
          locale === 'ar' ? 'تم تأكيد طلبك بنجاح! 🎉 الدفع عند الاستلام' : 'Order placed successfully! 🎉 Cash on delivery',
          'success'
        );
        router.push(`/order-confirmation?orderId=${orderId}`);
        return;
      } else {
        showToast(
          res?.message || (locale === 'ar' ? 'فشل إتمام الطلب' : 'Failed to place order'),
          'error'
        );
        isSubmittingRef.current = false;
      }
    } catch (err) {
      showToast(
        err.message || (locale === 'ar' ? 'حدث خطأ أثناء إتمام الطلب' : 'An error occurred while placing order'),
        'error'
      );
      isSubmittingRef.current = false;
    } finally {
      setLoading(false);
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

    const activeDate = deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate;
    const activeSlot = deliverySpeed === 'express' ? expressSelectedSlot : standardSelectedSlot;
    const activeSlotsList = deliverySpeed === 'express' ? expressSlots : standardSlots;

    if (!activeSlot) {
      showToast(
        deliverySpeed === 'express'
          ? (locale === 'ar' ? 'يرجى اختيار فترة توصيل سريع متاحة للمتابعة' : 'Please select an available Express delivery slot to proceed.')
          : (locale === 'ar' ? 'يرجى اختيار فترة توصيل قياسي متاحة للمتابعة' : 'Please select an available Standard delivery slot to proceed.'),
        'error'
      );
      return;
    }

    if (isSlotExpired(activeSlot, activeDate)) {
      showToast(
        locale === 'ar'
          ? 'فترة التوصيل المحددة انتهى وقتها، يرجى اختيار فترة قادمة متاحة'
          : 'The selected delivery slot has already passed. Please choose an upcoming slot.',
        'error'
      );
      return;
    }

    const isSlotValidForMethod = activeSlotsList.some((s) => {
      const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
      return lbl === activeSlot || s.slot_label_en === activeSlot || s.slot_label_ar === activeSlot;
    });

    if (!isSlotValidForMethod) {
      showToast(
        deliverySpeed === 'express'
          ? (locale === 'ar' ? 'الفترة المحددة غير صالحة للتوصيل السريع' : 'The selected slot is not valid for Express delivery.')
          : (locale === 'ar' ? 'الفترة المحددة غير صالحة للتوصيل القياسي' : 'The selected slot is not valid for Standard delivery.'),
        'error'
      );
      return;
    }

    if (paymentMethod === 'online') {
      showToast(
        locale === 'ar'
          ? 'الدفع الإلكتروني غير متاح مؤقتاً، يرجى اختيار الدفع عند الاستلام (COD)'
          : 'Pay Online is temporarily unavailable. Please use Cash on Delivery (COD).',
        'warning'
      );
      return;
    }

    if (paymentMethod === 'cod') {
      setShowCodConfirmModal(true);
    } else {
      setGatewayStep('input');
      setGatewayErrorMsg('');
      setShowPaymentGatewayModal(true);
    }
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

      if (deliverySpeed === 'express' && deliverySettings?.express?.is_enabled === false) {
        showToast(
          locale === 'ar'
            ? 'التوصيل السريع غير متاح حالياً، يرجى اختيار التوصيل القياسي'
            : 'Express delivery is currently unavailable. Please choose Standard Schedule.',
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }
      if (deliverySpeed === 'standard' && deliverySettings?.standard?.is_enabled === false) {
        showToast(
          locale === 'ar'
            ? 'التوصيل القياسي غير متاح حالياً، يرجى اختيار التوصيل السريع'
            : 'Standard schedule is currently unavailable. Please choose Express Delivery.',
          'error'
        );
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const activeDate = deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate;
      const activeSlot = deliverySpeed === 'express' ? expressSelectedSlot : standardSelectedSlot;
      const activeSlotsList = deliverySpeed === 'express' ? expressSlots : standardSlots;

      if (!activeSlot) {
        setShowPaymentGatewayModal(false);
        showToast(
          deliverySpeed === 'express'
            ? (locale === 'ar' ? 'يرجى اختيار فترة توصيل سريع متاحة للمتابعة' : 'Please select an available Express delivery slot to proceed.')
            : (locale === 'ar' ? 'يرجى اختيار فترة توصيل قياسي متاحة للمتابعة' : 'Please select an available Standard delivery slot to proceed.'),
          'error'
        );
        return;
      }

      if (isSlotExpired(activeSlot, activeDate)) {
        setShowPaymentGatewayModal(false);
        showToast(
          locale === 'ar'
            ? 'فترة التوصيل المحددة انتهى وقتها، يرجى اختيار فترة قادمة متاحة'
            : 'The selected delivery slot has already passed. Please choose an upcoming slot.',
          'error'
        );
        return;
      }

      const isSlotValidForMethod = activeSlotsList.some((s) => {
        const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
        return lbl === activeSlot || s.slot_label_en === activeSlot || s.slot_label_ar === activeSlot;
      });

      if (!isSlotValidForMethod) {
        setShowPaymentGatewayModal(false);
        showToast(
          deliverySpeed === 'express'
            ? (locale === 'ar' ? 'الفترة المحددة غير صالحة للتوصيل السريع' : 'The selected slot is not valid for Express delivery.')
            : (locale === 'ar' ? 'الفترة المحددة غير صالحة للتوصيل القياسي' : 'The selected slot is not valid for Standard delivery.'),
          'error'
        );
        return;
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
          deliveryDate: activeDate,
          deliverySlot: activeSlot,
          tipAmount,
        }),
      });

      if (res.success && res.data?.order) {
        const orderId = res.data.order.id;
        triggerBrowserPushNotification(res.data.order);
        await clearCart(false);
        await fetchCart().catch(() => { });
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
  const isDateToday = (dateLabel) => {
    const targetDate = dateLabel || (deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate);
    if (!targetDate) return true;
    const allDates = [...expressDates, ...standardDates, ...scheduleDates];
    const found = allDates.find(
      (d) => targetDate === d.label_en || targetDate === d.label_ar || targetDate === d.key || targetDate === d.date
    );
    if (found) {
      return Boolean(found.is_today);
    }
    const lower = String(targetDate).toLowerCase();
    return lower.includes('today') || lower.includes('اليوم');
  };

  // Check if a time slot is passed/expired for the currently (or specified) selected date
  const isSlotExpired = (slotLabel, dateToCheck) => {
    const targetDate = dateToCheck || (deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate);
    if (!isDateToday(targetDate)) {
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

  // Handle Date Selection and auto-shift slot if expired for the selected method
  const handleSelectDate = (dateLabel) => {
    if (deliverySpeed === 'express') {
      setExpressSelectedDate(dateLabel);
      if (isSlotExpired(expressSelectedSlot, dateLabel)) {
        const validSlot = expressSlots.find((s) => {
          const label = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
          return !isSlotExpired(label, dateLabel);
        });
        setExpressSelectedSlot(validSlot ? (locale === 'ar' ? (validSlot.slot_label_ar || validSlot.slot_label_en) : (validSlot.slot_label_en || validSlot.slot_label_ar)) : '');
      }
    } else {
      setStandardSelectedDate(dateLabel);
      if (isSlotExpired(standardSelectedSlot, dateLabel)) {
        const validSlot = standardSlots.find((s) => {
          const label = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
          return !isSlotExpired(label, dateLabel);
        });
        setStandardSelectedSlot(validSlot ? (locale === 'ar' ? (validSlot.slot_label_ar || validSlot.slot_label_en) : (validSlot.slot_label_en || validSlot.slot_label_ar)) : '');
      }
    }
  };

  // Handle Slot Selection with expired check
  const handleSelectSlot = (slotLabel) => {
    const activeDate = deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate;
    if (isSlotExpired(slotLabel, activeDate)) {
      showToast(
        locale === 'ar'
          ? 'انتهى وقت هذه الفترة لليوم، يرجى اختيار موعد آخر'
          : 'This time slot has already passed today. Please pick an upcoming slot.',
        'warning'
      );
      return;
    }
    if (deliverySpeed === 'express') {
      setExpressSelectedSlot(slotLabel);
    } else {
      setStandardSelectedSlot(slotLabel);
    }
  };

  // Handle switching delivery methods with state isolation and slot validation
  const handleSwitchDeliverySpeed = (newSpeed) => {
    if (newSpeed === 'express') {
      if (deliverySettings?.express?.is_enabled === false) {
        showToast(
          locale === 'ar' ? 'التوصيل السريع غير متاح حالياً' : 'Express delivery is currently unavailable',
          'error'
        );
        return;
      }
      setDeliverySpeed('express');
      // Validate that expressSelectedSlot is valid and not expired for expressSelectedDate
      const targetDate = expressSelectedDate || (expressDates[0] ? (locale === 'ar' ? expressDates[0].label_ar : expressDates[0].label_en) : '');
      const isSlotStillValid = expressSelectedSlot && expressSlots.some((s) => {
        const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
        return (lbl === expressSelectedSlot || s.slot_label_en === expressSelectedSlot || s.slot_label_ar === expressSelectedSlot) && !isSlotExpired(expressSelectedSlot, targetDate);
      });
      if (!isSlotStillValid) {
        const firstValid = expressSlots.find((s) => {
          const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
          return !isSlotExpired(lbl, targetDate);
        });
        setExpressSelectedSlot(firstValid ? (locale === 'ar' ? (firstValid.slot_label_ar || firstValid.slot_label_en) : (firstValid.slot_label_en || firstValid.slot_label_ar)) : '');
      }
    } else {
      if (deliverySettings?.standard?.is_enabled === false) {
        showToast(
          locale === 'ar' ? 'التوصيل القياسي غير متاح حالياً' : 'Standard schedule is currently unavailable',
          'error'
        );
        return;
      }
      setDeliverySpeed('standard');
      // Validate that standardSelectedSlot is valid and not expired for standardSelectedDate
      const targetDate = standardSelectedDate || (standardDates[0] ? (locale === 'ar' ? standardDates[0].label_ar : standardDates[0].label_en) : '');
      const isSlotStillValid = standardSelectedSlot && standardSlots.some((s) => {
        const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
        return (lbl === standardSelectedSlot || s.slot_label_en === standardSelectedSlot || s.slot_label_ar === standardSelectedSlot) && !isSlotExpired(standardSelectedSlot, targetDate);
      });
      if (!isSlotStillValid) {
        const firstValid = standardSlots.find((s) => {
          const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
          return !isSlotExpired(lbl, targetDate);
        });
        setStandardSelectedSlot(firstValid ? (locale === 'ar' ? (firstValid.slot_label_ar || firstValid.slot_label_en) : (firstValid.slot_label_en || firstValid.slot_label_ar)) : '');
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

          // Extract Express and Standard schedules from backend or filter slots
          const expSlots = res.data.express?.slots || slots.filter((s) => s.is_express);
          const stdSlots = res.data.standard?.slots || slots.filter((s) => !s.is_express);
          const expDates = res.data.express?.dates || (dates.length > 0 ? dates.slice(0, 2) : []);
          const stdDates = res.data.standard?.dates || dates;

          setExpressSlots(expSlots);
          setStandardSlots(stdSlots);
          setExpressDates(expDates);
          setStandardDates(stdDates);

          // Initial Express date and slot
          const defaultExpDate = expDates.length > 0 ? (locale === 'ar' ? expDates[0].label_ar : expDates[0].label_en) : '';
          setExpressSelectedDate((curr) => curr || defaultExpDate);
          setExpressSelectedSlot((curr) => {
            if (curr && !isSlotExpired(curr, defaultExpDate)) return curr;
            const validExp = expSlots.find((s) => {
              const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
              return !isSlotExpired(lbl, defaultExpDate);
            });
            return validExp ? (locale === 'ar' ? (validExp.slot_label_ar || validExp.slot_label_en) : (validExp.slot_label_en || validExp.slot_label_ar)) : '';
          });

          // Initial Standard date and slot
          const defaultStdDate = stdDates.length > 0 ? (locale === 'ar' ? stdDates[0].label_ar : stdDates[0].label_en) : '';
          setStandardSelectedDate((curr) => curr || defaultStdDate);
          setStandardSelectedSlot((curr) => {
            if (curr && !isSlotExpired(curr, defaultStdDate)) return curr;
            const validStd = stdSlots.find((s) => {
              const lbl = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
              return !isSlotExpired(lbl, defaultStdDate);
            });
            return validStd ? (locale === 'ar' ? (validStd.slot_label_ar || validStd.slot_label_en) : (validStd.slot_label_en || validStd.slot_label_ar)) : '';
          });

          // Fetch dynamic delivery charges configuration
          let charges = res.data.deliveryCharges;
          if (!charges) {
            try {
              const chargesRes = await fetchApi('/delivery-settings');
              if (chargesRes.success && chargesRes.data) {
                charges = chargesRes.data;
              }
            } catch (_) { }
          }
          if (charges) {
            setDeliverySettings(charges);
            if (charges.express?.is_enabled === false) {
              setDeliverySpeed('standard');
            } else if (charges.standard?.is_enabled === false) {
              setDeliverySpeed('express');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load delivery slots:', err);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchDeliverySchedule();
  }, [locale]);

  // Fetch dynamic delivery partner tip configuration
  useEffect(() => {
    const fetchTipSettings = async () => {
      try {
        const res = await fetchApi('/tip-settings');
        if (res.success && res.data) {
          setTipSettings(res.data);
        }
      } catch (err) {
        // Fallback gracefully to default
      }
    };
    fetchTipSettings();
  }, []);

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
        } catch (_) { }
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
    } catch (_) { }
    showToast(locale === 'ar' ? 'تمت إزالة الكوبون' : 'Promo code removed', 'info');
  };

  // Check if coupon code was saved in sessionStorage or pre-applied
  useEffect(() => {
    try {
      const savedCode = sessionStorage.getItem('appliedCouponCode');
      if (savedCode && !appliedCoupon && itemsSubtotal > 0) {
        handleApplyCoupon(savedCode);
      }
    } catch (_) { }
  }, [itemsSubtotal]);

  const expressFee = parseFloat(deliverySettings?.express?.base_fee ?? 12.00);
  const expressMinutes = parseInt(deliverySettings?.express?.estimated_delivery_minutes ?? 90, 10);
  const standardBaseFee = parseFloat(deliverySettings?.standard?.base_fee ?? 0.00);
  const freeThreshold = parseFloat(deliverySettings?.standard?.free_delivery_threshold ?? 100.00);

  const isStandardFree = freeThreshold > 0 && itemsSubtotal >= freeThreshold;
  const standardFee = isStandardFree ? 0.00 : standardBaseFee;

  const deliveryFee = deliverySpeed === 'express' ? expressFee : standardFee;

  // Active delivery schedule values for active method
  const activeDates = deliverySpeed === 'express' ? expressDates : standardDates;
  const activeSlots = deliverySpeed === 'express' ? expressSlots : standardSlots;
  const activeSelectedDate = deliverySpeed === 'express' ? expressSelectedDate : standardSelectedDate;
  const activeSelectedSlot = deliverySpeed === 'express' ? expressSelectedSlot : standardSelectedSlot;

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

  // Calculate delivery partner tip amount dynamically from backend settings
  const tipAmount = (() => {
    if (!tipSettings?.is_enabled || !tipSettings?.show_on_checkout) return 0.00;
    if (!selectedTipOption) return 0.00;
    if (selectedTipOption === 'other') {
      if (!tipSettings.allow_custom) return 0.00;
      const parsed = parseFloat(customTipInput);
      const minVal = parseFloat(tipSettings.min_custom_amount ?? 1.00);
      const maxVal = parseFloat(tipSettings.max_custom_amount ?? 500.00);
      return (!isNaN(parsed) && parsed >= minVal && parsed <= maxVal)
        ? Math.round(parsed * 100) / 100
        : 0.00;
    }
    // Match preset by id or amount
    const preset = tipSettings?.presets?.find(
      (p) => String(p.id) === String(selectedTipOption) || String(p.amount) === String(selectedTipOption)
    );
    if (preset && preset.is_enabled !== false) {
      return parseFloat(preset.amount);
    }
    return 0.00;
  })();

  // Correct calculation: items subtotal + 15% VAT + delivery fee - promo discount + tip
  const finalTotal = Math.max(0, Math.round((itemsSubtotal + vatTotal + deliveryFee - promoDiscount + tipAmount) * 100) / 100);

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24">
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
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 pb-24">

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Top Breadcrumbs Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">›</span>
            <Link href="/cart" className="hover:text-slate-900 transition-colors">
              Shopping Cart
            </Link>
            <span className="text-slate-300">›</span>
            <span className="text-slate-900 font-bold">Secure Checkout</span>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-[#043927] border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'مواصلة التسوق' : 'Continue Shopping'}</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-3">
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
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
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
                          <span className="font-bold text-sm text-slate-900">
                            {activeAddress.area || activeAddress.city || 'Home'}
                          </span>
                          {activeAddress.is_default && (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
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
                      setNewAddress(getEmptyAddress());
                      setAddressModalTab('new');
                      setShowAddressModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#05A764] hover:bg-[#048b53] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
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
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
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
                  onClick={() => handleSwitchDeliverySpeed('express')}
                  className={`rounded-2xl p-4 transition-all relative ${deliverySettings?.express?.is_enabled === false
                    ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed select-none'
                    : deliverySpeed === 'express'
                      ? 'bg-[#E8F8F0] border-2 border-[#05A764] shadow-2xs cursor-pointer'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#05A764] fill-current" />
                      <span className="font-bold text-sm text-slate-900">
                        {locale === 'ar'
                          ? (deliverySettings?.express?.name_ar || 'توصيل سريع')
                          : (deliverySettings?.express?.name_en || 'Express Delivery')}
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Fastest
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">SAR</span>
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {expressFee.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#05A764]">
                    {locale === 'ar' ? `الوصول خلال ${expressMinutes} دقيقة` : `Arriving within ${expressMinutes} minutes`}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {deliverySettings?.express?.is_enabled === false ? (
                      <span className="text-rose-600 font-bold">
                        {locale === 'ar' ? 'غير متاح حالياً' : 'Currently Unavailable'}
                      </span>
                    ) : (
                      locale === 'ar' ? 'توصيل مبرد فوري للطلبات المستعجلة' : 'Estimated arrival: Today, immediate dispatch'
                    )}
                  </p>
                </div>

                {/* Option B: Standard Schedule */}
                <div
                  onClick={() => handleSwitchDeliverySpeed('standard')}
                  className={`rounded-2xl p-4 transition-all relative ${deliverySettings?.standard?.is_enabled === false
                    ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed select-none'
                    : deliverySpeed === 'standard'
                      ? 'bg-[#E8F8F0] border-2 border-[#05A764] shadow-2xs cursor-pointer'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-sm text-slate-900">
                        {locale === 'ar'
                          ? (deliverySettings?.standard?.name_ar || 'جدول قياسي')
                          : (deliverySettings?.standard?.name_en || 'Standard Schedule')}
                      </span>
                    </div>
                    <div className="text-right">
                      {isStandardFree ? (
                        <span className="font-bold text-sm text-emerald-600">Free</span>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">SAR</span>
                          <span className="font-bold text-sm text-slate-900 font-mono">
                            {standardBaseFee.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {freeThreshold > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          over SAR {freeThreshold.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-semibold">
                    {locale === 'ar' ? 'اختيار الوقت والتاريخ المناسبين' : 'Pick convenient time slot'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {deliverySettings?.standard?.is_enabled === false ? (
                      <span className="text-rose-600 font-bold">
                        {locale === 'ar' ? 'غير متاح حالياً' : 'Currently Unavailable'}
                      </span>
                    ) : (
                      locale === 'ar' ? 'اختر تاريخ ووقت التوصيل أدناه' : 'Select date & time below'
                    )}
                  </p>
                </div>
              </div>

              {/* Scheduled Windows Available (Separated for Express vs Standard) */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {deliverySpeed === 'express'
                    ? (locale === 'ar' ? 'فترات التوصيل السريع المتاحة:' : 'EXPRESS DELIVERY WINDOWS AVAILABLE:')
                    : (locale === 'ar' ? 'فترات التوصيل المجدولة المتاحة:' : 'SCHEDULED WINDOWS AVAILABLE:')}
                </span>

                {/* Date Pills Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {scheduleLoading && activeDates.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>{locale === 'ar' ? 'جاري تحميل التواريخ...' : 'Loading dates...'}</span>
                    </div>
                  ) : activeDates.length > 0 ? (
                    activeDates.map((d) => {
                      const label = locale === 'ar' ? d.label_ar : d.label_en;
                      const isSelected = activeSelectedDate === label || activeSelectedDate === d.label_en || activeSelectedDate === d.label_ar;
                      return (
                        <button
                          key={d.key || d.date}
                          type="button"
                          onClick={() => handleSelectDate(label)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                        >
                          {label}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      {locale === 'ar' ? 'لا توجد تواريخ متاحة' : 'No dates available'}
                    </span>
                  )}
                </div>

                {/* Time Slots Container */}
                <div className="bg-[#F5F6F8] rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scheduleLoading && activeSlots.length === 0 ? (
                    <div className="col-span-full py-4 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>{locale === 'ar' ? 'جاري تحميل فترات التوصيل...' : 'Loading time slots...'}</span>
                    </div>
                  ) : activeSlots.length > 0 ? (
                    activeSlots.map((s) => {
                      const slotLabel = locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar);
                      const tagLabel = locale === 'ar' ? (s.tag_ar || s.tag_en) : (s.tag_en || s.tag_ar);
                      const expired = isSlotExpired(slotLabel, activeSelectedDate);
                      const isSelected = !expired && (activeSelectedSlot === slotLabel || activeSelectedSlot === s.slot_label_en || activeSelectedSlot === s.slot_label_ar);

                      return (
                        <div
                          key={s.id || slotLabel}
                          onClick={() => handleSelectSlot(slotLabel)}
                          className={`p-3 rounded-xl text-center transition-all border relative ${expired
                            ? 'bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed select-none opacity-60'
                            : isSelected
                              ? 'bg-white border-[#05A764] ring-2 ring-[#05A764]/20 shadow-2xs cursor-pointer'
                              : 'bg-white border-slate-200/80 hover:border-slate-300 cursor-pointer'
                            }`}
                        >
                          <span className={`font-bold text-xs block ${expired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {slotLabel}
                          </span>
                          {expired ? (
                            <span className="text-[10px] font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                              {locale === 'ar' ? 'انتهى الوقت' : 'Time Passed'}
                            </span>
                          ) : tagLabel ? (
                            <span
                              className={`text-[10px] font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${s.is_express
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
                    <div className="col-span-full py-5 text-center text-xs text-slate-500 font-medium">
                      {deliverySpeed === 'express'
                        ? (locale === 'ar' ? 'لا توجد فترات توصيل سريع متاحة حالياً' : 'No Express delivery slots currently available.')
                        : (locale === 'ar' ? 'لا توجد فترات توصيل مجدولة متاحة حالياً' : 'No Standard delivery slots currently available.')}
                    </div>
                  )}
                </div>

                {/* If all slots for today have ended, show warning */}
                {isDateToday(activeSelectedDate) && activeSlots.length > 0 && activeSlots.every((s) => isSlotExpired(locale === 'ar' ? (s.slot_label_ar || s.slot_label_en) : (s.slot_label_en || s.slot_label_ar), activeSelectedDate)) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-bold">
                    {deliverySpeed === 'express'
                      ? (locale === 'ar'
                        ? '⚠️ انتهت جميع مواعيد التوصيل السريع لليوم، يرجى اختيار موعد ليوم الغد للمتابعة'
                        : '⚠️ All Express delivery slots for today have ended. Please select tomorrow to schedule your order.')
                      : (locale === 'ar'
                        ? '⚠️ انتهت جميع مواعيد التوصيل المجدول لليوم، يرجى اختيار موعد ليوم الغد للمتابعة'
                        : '⚠️ All Standard delivery slots for today have ended. Please select tomorrow to schedule your order.')}
                  </div>
                )}
              </div>


            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Bag & Checkout CTA (4 Columns) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">

            {/* Express Fulfillment Badge Header */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 px-1">
              <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse" />
              <span>Express Fulfillment Center: Al-Olaya Hub, Riyadh</span>
            </div>

            {/* YOUR BAG CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">

              {/* Bag Title & Item Count */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-900" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Your Bag
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
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
                            {(() => {
                              const itemImg = item.variant?.images?.find(i => i.is_primary)?.image_url || item.variant?.image_url || item.image;
                              return (
                                <>
                                  {itemImg ? (
                                    <img
                                      src={getImageUrl(itemImg)}
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
                                    style={{ display: itemImg ? 'none' : 'flex' }}
                                  >
                                    <ShoppingBag className="w-5 h-5 stroke-[2]" />
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {itemName}
                            </h4>
                            {itemSubtitle && (
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {itemSubtitle}
                              </p>
                            )}
                            <div className="font-bold text-xs text-[#05A764] mt-0.5">
                              SAR {itemPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="bg-white rounded-lg border border-slate-200 px-2 py-1 flex items-center gap-2 shrink-0 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateBagQuantity(item.id, item.quantity, -1)}
                            className="text-slate-500 hover:text-slate-800 font-bold text-xs px-1 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-xs text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateBagQuantity(item.id, item.quantity, 1)}
                            className="text-slate-500 hover:text-slate-800 font-bold text-xs px-1 cursor-pointer"
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
                <span className="text-xs font-bold text-slate-700 block">
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
                          <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                            {appliedCoupon.code}
                          </span>
                          <span className="bg-[#05A764] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
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
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer px-2 py-1 shrink-0"
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
                        className="bg-[#043927] hover:bg-[#02281b] disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006E2D] text-[10px] font-bold transition-all cursor-pointer hover:scale-102"
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

              {/* Choose Payment Method Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-800" />
                  <span className="text-xs font-bold text-slate-800">
                    {locale === 'ar' ? 'اختر طريقة الدفع' : 'Choose Payment Method'}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Card 1: Pay Online (Temporarily Disabled) */}
                  <div
                    className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 opacity-60 cursor-not-allowed select-none flex items-center justify-between gap-2.5 transition-all"
                    title={locale === 'ar' ? 'الدفع الإلكتروني غير متاح مؤقتاً' : 'Pay Online is temporarily unavailable'}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Radio Circle (Disabled) */}
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center shrink-0" />

                      {/* Card Icon */}
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-700/70 shrink-0">
                        <CreditCard className="w-4 h-4 stroke-[2]" />
                      </div>

                      {/* Text & Badge */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-700 leading-tight">
                            {locale === 'ar' ? 'الدفع الإلكتروني' : 'Pay Online'}
                          </span>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 tracking-wide">
                            {locale === 'ar' ? 'غير متاح مؤقتاً' : 'Temporarily Unavailable'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate">
                          {locale === 'ar' ? 'ادفع بأمان عبر بطاقة مدى، فيزا، أو Apple Pay' : 'Pay securely using card, mada, or Apple Pay'}
                        </p>
                      </div>
                    </div>

                    {/* Logos */}
                    <div className="flex items-center gap-1 shrink-0 select-none grayscale-[40%]">
                      {/* Visa */}
                      <div className="h-5 px-1.5 rounded bg-white/80 border border-slate-200 shadow-2xs flex items-center justify-center">
                        <span className="font-black italic text-[9px] tracking-tighter text-[#1A1F71] leading-none">
                          VISA
                        </span>
                      </div>
                      {/* Mastercard */}
                      <div className="h-5 px-1.5 rounded bg-white/80 border border-slate-200 shadow-2xs flex items-center justify-center" title="Mastercard">
                        <div className="flex items-center -space-x-1 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]" />
                        </div>
                      </div>
                      {/* mada */}
                      <div className="h-5 px-1 rounded bg-white/80 border border-slate-200 shadow-2xs flex items-center justify-center" title="mada">
                        <span className="font-extrabold text-[8px] tracking-tight text-[#005B94] flex items-center gap-0.5 leading-none">
                          <span className="w-1 h-1 rounded-full bg-[#82B93D]" />
                          <span>mada</span>
                        </span>
                      </div>
                      {/* Apple Pay */}
                      <div className="h-5 px-1.5 rounded bg-black/80 border border-black/80 shadow-2xs flex items-center justify-center" title="Apple Pay">
                        <span className="font-bold text-[8px] tracking-tight text-white flex items-center gap-0.5 leading-none">
                          <svg className="w-2 h-2 fill-current" viewBox="0 0 170 170">
                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-8.08-12-15-5.57-8.9-9.9-18.77-13-29.62-3.1-10.84-4.66-21.2-4.66-31.06 0-14.07 3.53-25.75 10.59-35.03 7.06-9.29 16.03-14.05 26.91-14.28 5.43 0 11.23 1.5 17.41 4.5 6.18 3 10.14 4.54 11.89 4.62 1.63-.08 5.75-1.68 12.35-4.8 6.6-3.12 12.37-4.5 17.31-4.14 13.58.98 24.31 5.99 32.2 15.02-12.07 7.3-18.01 17.2-17.82 29.7.2 9.77 4.07 18.01 11.61 24.71 7.54 6.7 16.51 10.42 26.91 11.16-2.07 6.3-4.58 12.82-7.53 19.56zM119.22 33.15c0-7.39 2.66-14.41 7.99-21.05 5.33-6.65 11.97-10.74 19.92-12.27.2 1.09.31 2.07.31 2.94 0 7.39-2.83 14.62-8.5 21.69-5.66 7.07-12.44 11.16-20.34 12.27-.19-1.2-.29-2.06-.29-2.58z" />
                          </svg>
                          <span>Pay</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Cash on Delivery (COD) */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${paymentMethod === 'cod'
                      ? 'border-[#00B074] bg-[#F0FDF4] shadow-2xs ring-1 ring-[#00B074]/30'
                      : 'border-slate-200/90 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Radio Circle */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'cod'
                          ? 'border-[#00B074] bg-white'
                          : 'border-slate-300 bg-white'
                          }`}
                      >
                        {paymentMethod === 'cod' && (
                          <div className="w-2 h-2 rounded-full bg-[#00B074]" />
                        )}
                      </div>

                      {/* Cash Icon */}
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#00B074] shrink-0">
                        <Banknote className="w-4 h-4 stroke-[2]" />
                      </div>

                      {/* Text */}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 leading-tight">
                          {locale === 'ar' ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                          {locale === 'ar' ? 'ادفع نقداً عند استلام طلبك' : 'Pay in cash when your order is delivered'}
                        </p>
                      </div>
                    </div>

                    {/* COD Badge */}
                    <span className="bg-[#E8F8EE] text-[#00B074] border border-[#00B074]/30 font-bold text-[9px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                      COD
                    </span>
                  </div>
                </div>
              </div>

              {/* Tip for Delivery Partner Section */}
              {tipSettings?.is_enabled && tipSettings?.show_on_checkout && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0FDF4] border border-[#A7F3D0] space-y-3 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#05A764]/15 flex items-center justify-center text-[#006E2D] shrink-0">
                        <Heart className="w-4 h-4 fill-[#006E2D] text-[#006E2D]" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {locale === 'ar' ? 'إكرامية لمندوب التوصيل' : 'Tip for Delivery Partner'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {locale === 'ar' ? 'أظهر تقديرك لخدمتهم وسرعة التوصيل' : 'Show your appreciation for their service'}
                        </p>
                      </div>
                    </div>

                    {selectedTipOption && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTipOption(null);
                          setCustomTipInput('');
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        {locale === 'ar' ? 'إلغاء الإكرامية' : 'Remove'}
                      </button>
                    )}
                  </div>

                  {/* Dynamic Selectable Tip Options */}
                  <div className="grid grid-cols-4 gap-2">
                    {tipSettings.presets
                      ?.filter((preset) => preset.is_enabled !== false)
                      .map((preset) => {
                        const isSelected = selectedTipOption === String(preset.id) || selectedTipOption === String(preset.amount);
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTipOption(null);
                                setCustomTipInput('');
                              } else {
                                setSelectedTipOption(String(preset.id));
                              }
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${isSelected
                              ? 'bg-[#006E2D] border-[#006E2D] text-white shadow-xs scale-102'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-[#05A764]/50'
                              }`}
                          >
                            SAR {parseFloat(preset.amount).toFixed(0)}
                          </button>
                        );
                      })}

                    {tipSettings.allow_custom !== false && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedTipOption === 'other') {
                            setSelectedTipOption(null);
                            setCustomTipInput('');
                          } else {
                            setSelectedTipOption('other');
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${selectedTipOption === 'other'
                          ? 'bg-[#006E2D] border-[#006E2D] text-white shadow-xs scale-102'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-[#05A764]/50'
                          }`}
                      >
                        {locale === 'ar' ? 'مبلغ آخر' : 'Other'}
                      </button>
                    )}
                  </div>

                  {/* Custom Amount Input for 'Other' */}
                  {selectedTipOption === 'other' && tipSettings.allow_custom !== false && (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                            SAR
                          </span>
                          <input
                            type="number"
                            min={tipSettings.min_custom_amount || 1}
                            max={tipSettings.max_custom_amount || 500}
                            step="1"
                            value={customTipInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              const maxVal = parseFloat(tipSettings.max_custom_amount || 500);
                              if (val === '' || (Number(val) >= 0 && Number(val) <= maxVal)) {
                                setCustomTipInput(val);
                              }
                            }}
                            placeholder={locale === 'ar' ? `أدخل المبلغ (${tipSettings.min_custom_amount || 1} - ${tipSettings.max_custom_amount || 500})` : `Enter amount (${tipSettings.min_custom_amount || 1} - ${tipSettings.max_custom_amount || 500})`}
                            className="w-full pl-12 pr-3 py-2 text-xs font-bold bg-white border border-[#05A764]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05A764]/30 text-slate-900"
                          />
                        </div>
                        {customTipInput && (
                          <button
                            type="button"
                            onClick={() => setCustomTipInput('')}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {locale === 'ar' ? '100% من الإكرامية تذهب مباشرة إلى مندوب التوصيل' : '100% of the tip goes directly to your delivery partner'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>{locale === 'ar' ? 'المجموع الفرعي للمنتجات' : 'Item Subtotal'}</span>
                  <span className="font-bold text-slate-900">
                    SAR {itemsSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'} <Zap className="w-3 h-3 text-[#05A764] fill-current" />
                  </span>
                  <span className="font-bold text-slate-900">
                    SAR {deliveryFee.toFixed(2)}
                  </span>
                </div>

                {appliedCoupon && promoDiscount > 0 && (
                  <div className="flex justify-between text-[#05A764] font-bold">
                    <span>
                      {locale === 'ar'
                        ? `خصم الكوبون (${appliedCoupon.code})`
                        : `Discount (${appliedCoupon.code})`}
                    </span>
                    <span>- SAR {promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                {tipAmount > 0 && (
                  <div className="flex justify-between text-[#006E2D] font-bold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-[#006E2D] text-[#006E2D]" />
                      {locale === 'ar' ? 'إكرامية مندوب التوصيل' : 'Tip'}
                    </span>
                    <span className="font-bold text-[#006E2D]">SAR {tipAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {locale === 'ar' ? 'ضريبة القيمة المضافة (15% VAT)' : 'Estimated VAT (15%)'}
                  </span>
                  <span className="font-bold text-slate-900">
                    SAR {vatTotal.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {locale === 'ar' ? 'المجموع الكلي للدفع' : 'Total to Pay'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {locale === 'ar' ? 'شامل ضريبة القيمة المضافة (إن وجدت)' : 'Inclusive of VAT (if applicable)'}
                    </span>
                  </div>

                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
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
                className="w-full py-4 rounded-full bg-[#006E2D] hover:bg-[#048b53] text-white font-black text-sm sm:text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'cod'
                        ? (locale === 'ar' ? `تأكيد الطلب (الدفع عند الاستلام) – SAR ${finalTotal.toFixed(2)}` : `Place Order (COD) – SAR ${finalTotal.toFixed(2)}`)
                        : (locale === 'ar' ? `الدفع الإلكتروني – SAR ${finalTotal.toFixed(2)}` : `Pay Online – SAR ${finalTotal.toFixed(2)}`)}
                    </span>
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

          </div>

        </div>

      </div>

      {/* Address Selection & Creation Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
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
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${isSelected
                          ? 'border-[#05A764] bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${isSelected
                              ? 'border-[#05A764] bg-[#05A764]'
                              : 'border-slate-300 bg-white'
                              }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {addr.area || addr.city || 'Home'}
                              </span>
                              {addr.is_default && (
                                <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
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
                    onClick={() => {
                      setNewAddress(getEmptyAddress());
                      setAddressModalTab('new');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-dashed border-[#05A764] text-[#05A764] hover:bg-emerald-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إضافة عنوان جديد' : '+ Add New Address'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
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
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'المدينة *' : 'City *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={locale === 'ar' ? 'مثال: الرياض' : 'e.g. Riyadh'}
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#05A764] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (addresses.length > 0) {
                        setAddressModalTab('list');
                      } else {
                        setShowAddressModal(false);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#05A764] hover:bg-[#048b53] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative space-y-0">

            {/* Gateway Top Bar */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#05A764] text-white flex items-center justify-center font-black text-sm shadow-sm">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white tracking-tight">
                      Falcon Test Payment Gateway
                    </h3>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
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
                <span className="font-bold text-xs text-slate-900">
                  Falcon Fresh Direct (Riyadh)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Amount Due
                </span>
                <span className="font-black text-base text-[#05A764]">
                  SAR {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Processing Overlay State */}
            {gatewayStep === 'processing' ? (
              <div className="p-8 text-center space-y-4 my-4">
                <div className="w-16 h-16 rounded-full border-4 border-[#05A764] border-t-transparent animate-spin mx-auto" />
                <div>
                  <h4 className="font-bold text-base text-slate-900">
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
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                      {paymentMethod === 'online' ? 'Visa / Mastercard / Mada' : paymentMethod === 'mada' ? 'Saudi Mada Debit' : paymentMethod === 'apple_pay' ? 'Apple Pay Touch' : paymentMethod === 'stc_pay' ? 'STC Pay Wallet' : 'Visa / Mastercard'}
                    </span>
                    <span className="text-xs font-black bg-white/10 px-2 py-0.5 rounded text-white">
                      {paymentMethod === 'online' ? 'SECURE' : paymentMethod.toUpperCase()}
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
                    <span className="font-bold text-slate-800">3D Secure OTP Verification</span>
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
                    className="w-full py-3.5 rounded-2xl bg-[#05A764] hover:bg-[#048b53] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Authorize Test Payment • SAR {finalTotal.toFixed(2)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecutePayment(false)}
                    disabled={isSimulatingPayment}
                    className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
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

      {/* COD ORDER CONFIRMATION MODAL */}
      {showCodConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!loading) setShowCodConfirmModal(false);
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cod-confirm-modal-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] border border-emerald-200/80 flex items-center justify-center text-[#006E2D] shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cod-confirm-modal-title" className="text-lg font-black text-slate-900">
                    {locale === 'ar' ? 'تأكيد طلبك' : 'Confirm Your Order'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    {locale === 'ar'
                      ? 'هل أنت متأكد من أنك تريد تأكيد هذا الطلب؟'
                      : 'Are you sure you want to place this order?'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!loading) setShowCodConfirmModal(false);
                }}
                disabled={loading}
                aria-label="Close"
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-semibold">
                  {locale === 'ar' ? 'إجمالي الطلب' : 'Order Total'}
                </span>
                <span className="text-base font-black text-[#043927]">
                  SAR {finalTotal.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-200" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-semibold">
                  {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </span>
                <span className="font-bold text-slate-900">
                  {locale === 'ar' ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCodConfirmModal(false)}
                disabled={loading}
                className="w-full sm:flex-1 py-3 px-4 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteCodOrder}
                disabled={loading}
                className="w-full sm:flex-1 py-3 px-4 rounded-full bg-[#006E2D] hover:bg-[#048b53] text-white font-black text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{locale === 'ar' ? 'جاري التأكيد...' : 'Placing Order...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'نعم، تأكيد الطلب' : 'Yes, Place Order'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

