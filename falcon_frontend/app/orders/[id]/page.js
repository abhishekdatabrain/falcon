'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { useToast } from '../../../src/contexts/ToastContext';
import LiveTrackingMap from '../../../src/components/LiveTrackingMap';
import {
  Package,
  Truck,
  Download,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Phone,
  FileText,
  X,
  Share2,
  Check,
  Box,
  Home,
  Navigation,
  Thermometer,
  MessageSquare,
  Key,
  ShoppingBag,
  Sparkles,
  Award,
  FileCheck
} from 'lucide-react';

const DEMO_ORDER_ITEMS = [
  {
    id: 'item-1',
    name_en: 'Local Hydroponic Vine Tomatoes',
    subtitle: '500g Pack • Qty: 1',
    price: '6.95',
    tag: 'Farm Fresh',
    tagColor: 'green',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'item-2',
    name_en: 'Almarai Fresh Full Fat Milk',
    subtitle: '2.0 Liters • Qty: 2',
    price: '23.00',
    originalPrice: '25.00',
    tag: 'Chilled Storage',
    tagColor: 'blue',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'item-3',
    name_en: 'Artisanal Stoneground Sourdough',
    subtitle: '650g Loaf • Qty: 1',
    price: '18.50',
    tag: 'Baked Today',
    tagColor: 'amber',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'item-4',
    name_en: 'Qassim Premium Rutab Dates',
    subtitle: '500g Box • Qty: 1',
    price: '19.65',
    tag: 'Organic Verified',
    tagColor: 'green',
    image: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=300&auto=format&fit=crop&q=80',
  }
];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { socket, joinDeliveryRoom, leaveDeliveryRoom } = useSocket();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  // Review Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadOrderDetails = async () => {
    try {
      const res = await fetchApi(`/orders/${id}`);
      if (res.success && res.data.order) {
        setOrder(res.data.order);
      } else {
        // Fallback demo order state matching exact screenshot values
        setOrder({
          id: id || 'SA-849204',
          order_number: 'SA-849204',
          placed_at: 'Today, 2:15 PM',
          customer_name: 'Mohammed Al-Shehri',
          address_line: 'Villa 42, Prince Mohammed Bin Abdulaziz Rd',
          area_city: 'Al-Olaya District, Postal Code 12211',
          country: 'Riyadh, Kingdom of Saudi Arabia',
          mobile: '+966 54 *** *821',
          subtotal: 68.10,
          vat: 8.88,
          grand_total: 68.10,
          payment_method: 'mada (•••• 4192)',
          driver: {
            name: 'Tariq Al-Harbi',
            rating: 4.98,
            drops: '1,420+ drops',
            van: 'Toyota HiAce • KSA 4812 ABC',
            phone: '+966 50 123 4567'
          }
        });
      }
    } catch (err) {
      // Fallback demo order state matching exact screenshot values
      setOrder({
        id: id || 'SA-849204',
        order_number: 'SA-849204',
        placed_at: 'Today, 2:15 PM',
        customer_name: 'Mohammed Al-Shehri',
        address_line: 'Villa 42, Prince Mohammed Bin Abdulaziz Rd',
        area_city: 'Al-Olaya District, Postal Code 12211',
        country: 'Riyadh, Kingdom of Saudi Arabia',
        mobile: '+966 54 *** *821',
        subtotal: 68.10,
        vat: 8.88,
        grand_total: 68.10,
        payment_method: 'mada (•••• 4192)',
        driver: {
          name: 'Tariq Al-Harbi',
          rating: 4.98,
          drops: '1,420+ drops',
          van: 'Toyota HiAce • KSA 4812 ABC',
          phone: '+966 50 123 4567'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const handleDownloadInvoice = () => {
    showToast(locale === 'ar' ? 'جاري تحضير الفاتورة الضريبية ZATCA...' : 'Downloading ZATCA e-Invoice PDF...', 'info');
  };

  const handleShareStatus = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Falcon Order Status',
        text: 'Track my live delivery on Falcon Grocery!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast(locale === 'ar' ? 'تم نسخ رابط المتابعة!' : 'Tracking link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#05A764] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900 pb-24 select-none">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        
        {/* TOP HEADER TITLE ROW */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Green Checkmark Circle */}
            <div className="w-10 h-10 rounded-full bg-[#05A764] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                <span className="text-[#05A764] font-black uppercase tracking-wider">
                  ORDER CONFIRMED
                </span>
                <span>•</span>
                <span>Order #{order?.order_number || 'SA-849204'}</span>
                <span>•</span>
                <span>Placed Today, 2:15 PM</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                Thank You, Mohammed!
              </h1>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Estimated Express Arrival:</span>
                <strong className="text-slate-900 font-black">Today, 3:15 PM – 3:45 PM</strong>
                <span>in Al-Olaya, Riyadh</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-sans border border-slate-200/80"
            >
              <FileCheck className="w-4 h-4 text-slate-600" />
              <span>Tax Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleShareStatus}
              className="bg-[#05A764] hover:bg-[#048b53] text-white text-xs font-extrabold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-md font-sans"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Status</span>
            </button>
          </div>
        </div>

        {/* STEPPER STEPPER TIMELINE CARD */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#05A764] animate-pulse" />
              <h2 className="text-xs sm:text-sm font-black text-[#05A764] tracking-wider uppercase font-sans">
                LIVE DISPATCH TRACKER
              </h2>
            </div>

            <span className="text-xs font-semibold text-slate-500 font-sans">
              Step 3 of 4: <strong className="text-slate-900">Courier En Route</strong>
            </span>
          </div>

          {/* 4 Step Timeline Progress Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 relative">
            
            {/* Step 1: Order Placed */}
            <div className="flex flex-col space-y-1.5 relative">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs z-10">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="h-1 bg-[#05A764] flex-1 rounded-full hidden sm:block" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                Order Placed
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                2:15 PM • Verified
              </p>
              <p className="text-[11px] font-black text-emerald-700 font-sans">
                Payment Approved
              </p>
            </div>

            {/* Step 2: Packed with Care */}
            <div className="flex flex-col space-y-1.5 relative">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs z-10">
                  <Box className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="h-1 bg-[#05A764] flex-1 rounded-full hidden sm:block" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                Packed with Care
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                2:28 PM • Central Hub
              </p>
              <p className="text-[11px] font-black text-emerald-700 font-sans">
                Cold-chain insulated
              </p>
            </div>

            {/* Step 3: Out for Delivery (ACTIVE) */}
            <div className="flex flex-col space-y-1.5 relative">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md ring-4 ring-emerald-100 z-10">
                  <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="h-1 bg-slate-200 flex-1 rounded-full hidden sm:block" />
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                  Out for Delivery
                </h3>
                <span className="bg-[#05A764] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                2:42 PM • With Tariq K.
              </p>
              <p className="text-[11px] font-black text-amber-600 font-sans">
                Estimated in 18 mins
              </p>
            </div>

            {/* Step 4: Delivered to Door */}
            <div className="flex flex-col space-y-1.5 relative">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 z-10">
                  <Home className="w-3.5 h-3.5" />
                </div>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-400 font-sans">
                Delivered to Door
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Estimated 3:25 PM
              </p>
              <p className="text-[11px] font-semibold text-slate-400 font-sans">
                Contactless handoff
              </p>
            </div>

          </div>
        </div>

        {/* MAIN 2-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Map Telemetry & Driver Details (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">

            {/* LIVE GPS MAP CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#05A764]" />
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                      Real-Time Route Telemetry
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Express Van #4 is 2.4 km from your pin
                  </p>
                </div>

                <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live GPS
                </span>
              </div>

              {/* Map View Box */}
              <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
                <LiveTrackingMap
                  destLat={24.7136}
                  destLng={46.6753}
                  title="Tariq Al-Harbi (Toyota HiAce)"
                />

                {/* Top-Left Traffic Status Tag */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-extrabold text-slate-800 z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Traffic Speed: <strong className="text-slate-900">Normal Flow • King Fahd Rd</strong></span>
                </div>

                {/* Bottom-Right Temperature Sensor Tag */}
                <div className="absolute bottom-3 right-3 bg-[#043927] text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-md flex items-center gap-1.5 text-xs font-black font-sans z-10">
                  <Thermometer className="w-4 h-4 text-emerald-400" />
                  <span>Refrigerated Cargo Temp: 3.8°C</span>
                </div>
              </div>

              {/* Courier Info Bar below Map */}
              <div className="bg-[#F5F6F8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  {/* Courier Avatar */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-slate-200">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                      alt="Tariq Al-Harbi"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 font-sans">
                        Tariq Al-Harbi
                      </h3>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        ★ 4.98
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-semibold">
                      Top Express Delivery Specialist • 1,420+ drops
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Van: Toyota HiAce • KSA 4812 ABC
                    </p>
                  </div>
                </div>

                {/* Driver Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href="tel:+966501234567"
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-sans"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Tariq</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => showToast(locale === 'ar' ? 'جاري فتح محادثة السائق...' : 'Opening driver chat...', 'info')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                    <span>Message</span>
                  </button>
                </div>
              </div>

            </div>

            {/* DELIVERY DESTINATION CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#05A764]" />
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans">
                    Delivery Destination
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => showToast(locale === 'ar' ? 'تم تحديث تعليمات التوصيل للسائق' : 'Delivery instructions updated for driver', 'success')}
                  className="text-xs font-extrabold text-[#05A764] hover:underline cursor-pointer font-sans"
                >
                  ✏️ Update Instructions
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Left Details */}
                <div className="md:col-span-6 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">
                    CUSTOMER & ADDRESS
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-sans">
                    Mohammed Al-Shehri
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Villa 42, Prince Mohammed Bin Abdulaziz Rd
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Al-Olaya District, Postal Code 12211
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Riyadh, Kingdom of Saudi Arabia
                  </p>
                  <p className="text-xs text-slate-500 font-semibold pt-1">
                    Contact: +966 54 *** *821
                  </p>
                </div>

                {/* Right Driver Access Note Box */}
                <div className="md:col-span-6 bg-[#FFF9E6] border border-[#FFE8A3] rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs font-sans">
                    <Key className="w-3.5 h-3.5" />
                    <span>Driver Access Note:</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                    "Please ring the video doorbell at the outer black courtyard gate. If no response within 2 minutes, leave chilled tote bag beside the shaded entry porch bench. Contactless OK."
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Items & Payment Breakdown (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">

            {/* ITEMS IN THIS DELIVERY CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-slate-900" />
                  <h2 className="font-extrabold text-base text-slate-900 font-sans">
                    Items in this Delivery
                  </h2>
                </div>

                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-sans">
                  4 Items
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {DEMO_ORDER_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#F5F6F8] rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-slate-200/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={item.image}
                          alt={item.name_en}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate font-sans">
                          {item.name_en}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          {item.subtitle}
                        </p>
                        {item.tag && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded inline-block mt-0.5 font-sans ${
                              item.tagColor === 'green'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.tagColor === 'blue'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-xs sm:text-sm text-slate-900 font-sans block">
                        SAR {item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through font-semibold block">
                          SAR {item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Forgot Something? Bundling Offer Widget */}
              <div className="bg-[#F5F6F8] rounded-2xl p-3.5 flex items-center justify-between border border-slate-200/60">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1 font-sans">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Forgot something?</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Add extra items with free bundling
                  </p>
                </div>

                <Link
                  href="/products"
                  className="bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs font-sans"
                >
                  Add (+0 SAR)
                </Link>
              </div>

            </div>

            {/* PAYMENT & BILLING CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="font-extrabold text-base text-slate-900 font-sans border-b border-slate-100 pb-3">
                Payment & Billing
              </h2>

              <div className="space-y-2.5 text-xs font-semibold text-slate-600 font-sans">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-extrabold text-slate-900">SAR 68.10</span>
                </div>

                <div className="flex justify-between">
                  <span>Express Refrigerated Delivery</span>
                  <span className="font-black text-[#05A764]">FREE (VIP Member)</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Standard VAT (15% included)</span>
                  <span>SAR 8.88</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-extrabold">
                  <span>Loyalty Points Earned</span>
                  <span>+68 FreshPoints</span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block">
                      Total Paid
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Paid via mada (•••• 4192)
                    </span>
                  </div>

                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight flex items-baseline gap-1">
                    <span className="text-xs font-bold text-slate-700">SAR</span>
                    <span>68.10</span>
                  </div>
                </div>
              </div>

              {/* ZATCA e-Invoice Verified Footer Box */}
              <div className="bg-[#E8F8F0] border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between mt-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#05A764] font-sans">
                    <FileCheck className="w-4 h-4" />
                    <span>ZATCA e-Invoice Verified</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono">
                    UUID: b6c1...91ea • VAT: 300192837400003
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="text-xs font-extrabold text-[#05A764] hover:underline cursor-pointer font-sans shrink-0 ml-2"
                >
                  Download PDF
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
