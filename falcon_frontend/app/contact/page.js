'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  PhoneCall,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Headphones,
  Clock,
  MessageSquare,
  Building2,
  Upload,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageCircle,
  FileText,
  User,
  Check,
  AlertCircle
} from 'lucide-react';

export default function ContactPage() {
  const { locale } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    category: '',
    message: '',
    agreed: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        category: '',
        message: '',
        agreed: false,
      });
    }, 5000);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How quickly will my fresh groceries arrive?',
      a: 'Express orders arrive in as little as 20 minutes across covered districts in Riyadh, Jeddah, and Dammam. You can also select scheduled delivery slots up to 7 days in advance.'
    },
    {
      q: 'What is the Falcon 100% Freshness Guarantee policy?',
      a: 'If any farm produce, dairy, or chilled cut arrives below your exacting standard, claim an instant replacement or full MartPoints credit in under 2 minutes directly via My Orders. No paperwork required.'
    },
    {
      q: 'How do I modify or cancel an order that is already placed?',
      a: 'You can add items or change delivery slots up to 15 minutes before farm packing starts directly from your My Orders dashboard with zero extra delivery fee.'
    },
    {
      q: 'Are your vegetables, meats, and dairy SFDA certified?',
      a: 'Yes, 100% of our products are certified by the Saudi Food & Drug Authority (SFDA) and sourced from licensed local Saudi agricultural partners with continuous cold-chain temperature logs.'
    },
    {
      q: 'How can local Saudi farmers sell produce through Falcon Mart?',
      a: 'Local growers can apply through our Farm Desk for direct cash settlement within 48 hours of harvest inspection. Click "Apply for Farmer Partnership" on this page to get started.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-12 sm:space-y-16">
      
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-[#043927] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/support" className="hover:text-[#043927] transition-colors">
            Help & Support
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">Contact Us</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ================= SECTION 1: TOP HEADER & STATUS CARD ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#043927]">
              <span>🌱</span>
              <span>WE'RE HERE TO HELP 24/7</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Get in Touch with the Care Team
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Whether you have a question about an ongoing 20-min express delivery, farm freshness verification, corporate bulk subscriptions, or local farm onboarding — our dedicated team is at your service.
            </p>
          </div>

          {/* Floating Status Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 shrink-0 font-sans text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span>Live Chat Wait Time:</span>
              <span className="text-emerald-700 font-black">&lt; 2 mins</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Active Hubs:</span>
              <span className="text-slate-900 font-black">Riyadh, Jeddah, Dammam</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700 pt-1 border-t border-slate-100">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Toll-free KSA:</span>
              <span className="text-[#043927] font-mono font-black text-sm">800 124 2000</span>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: 4 QUICK CONTACT CHANNEL CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Channel 1: 24/7 Live Support */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                  <MessageSquare className="w-5 h-5 text-[#05A764]" />
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase">
                  RECOMMENDED
                </span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">24/7 Live Support</h3>
                <span className="text-[11px] font-bold text-slate-400">Instant In-App Chat</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Instant resolution for active order changes, delivery status, or live driver tracking.
              </p>
            </div>
            <button
              type="button"
              className="w-full py-3 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Live Chat</span>
              <span>💬</span>
            </button>
          </div>

          {/* Channel 2: WhatsApp Care */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                  <MessageCircle className="w-5 h-5 text-[#05A764]" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">Instant Text Delivery</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">WhatsApp Care</h3>
                <span className="text-[11px] font-bold text-emerald-700 font-mono">+966 11 907 6543</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Direct support & photo/video verification for farm freshness inquiries.
              </p>
            </div>
            <a
              href="https://wa.me/966119076543"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Channel 3: Toll-Free Hotline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                  <PhoneCall className="w-5 h-5 text-[#05A764]" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">6:00 AM - 1:00 AM</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Toll-Free Hotline</h3>
                <span className="text-[11px] font-mono font-black text-slate-900">800 124 2000</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Speak directly with our Riyadh-based Arabic & English support team.
              </p>
            </div>
            <a
              href="tel:8001242000"
              className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Call Toll-Free</span>
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

          {/* Channel 4: Corporate & Farm Desk */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                  <Building2 className="w-5 h-5 text-[#05A764]" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">B2B & Partnerships</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Corporate & Farm Desk</h3>
                <span className="text-[11px] font-bold text-slate-600">b2b@falcon.sa</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Partner portal, wholesale procurement, institutional catering, and farm supplier inquiries.
              </p>
            </div>
            <a
              href="mailto:b2b@falcon.sa"
              className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Contact Corporate</span>
              <Mail className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>

        {/* ================= SECTION 3: FORM & COVERAGE MAP MAIN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: DIRECT MESSAGE FORM (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#05A764] uppercase tracking-wider block">DIRECT DISPATCH TICKET</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Send Us a Direct Message
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Submit your formal inquiry, quality feedback, or partner request below. Our response team logs each request with ticketing.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-[#043927] text-white flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#05A764]" />
                </div>
                <h3 className="font-black text-[#043927] text-lg">Ticket Dispatched Successfully!</h3>
                <p className="text-xs text-emerald-800 font-medium max-w-md mx-auto">
                  Thank you, {formData.fullName || 'valued customer'}. Your inquiry ticket has been logged. Our Riyadh Care team will respond to your email and SMS within 30 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
                
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Noura Al-Mansoor"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. noura@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] transition-all"
                    />
                  </div>
                </div>

                {/* Mobile Number & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Saudi Mobile Number *
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 shrink-0">
                        🇸🇦 +966
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 55 907 6543"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      Required for your order & response status SMS
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Inquiry Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] cursor-pointer transition-all"
                    >
                      <option value="">Select a category relevant to your request...</option>
                      <option value="ORDER_STATUS">Order Status & Express Delivery</option>
                      <option value="QUALITY">Farm Freshness & Quality Assurance</option>
                      <option value="SUBSCRIPTION">Subscription & Weekly Basket</option>
                      <option value="CORPORATE">Corporate & Bulk B2B Orders</option>
                      <option value="FARMER">Local Farm Onboarding & Partnerships</option>
                      <option value="TECH">Technical Support & App Issues</option>
                    </select>
                  </div>
                </div>

                {/* Message Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Message Details *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please describe your query, damaged item name, or delivery order number in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#043927] transition-all resize-none"
                  />
                </div>

                {/* Attach File Upload Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attach Photos or Documents (Optional)
                  </label>
                  <div className="border border-dashed border-slate-300 bg-slate-50 rounded-2xl p-4 text-center space-y-1 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                    <span className="text-xs font-bold text-slate-700 block">
                      Drag & drop photos or delivery receipts here
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      (JPG, PNG, PDF max 5MB for fast response on quality verification)
                    </span>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="termsAgreed"
                    required
                    checked={formData.agreed}
                    onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-[#043927] focus:ring-[#043927] cursor-pointer"
                  />
                  <label htmlFor="termsAgreed" className="text-[11px] font-semibold text-slate-600 cursor-pointer">
                    I agree to receive SMS/Email updates regarding my inquiry under Privacy Policy and Terms of Service.
                  </label>
                </div>

                {/* Submit Dispatch Ticket Button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#05A764]" />
                  <span>Submit Dispatch Ticket</span>
                </button>

              </form>
            )}
          </div>

          {/* RIGHT COLUMN: COVERAGE & FULFILLMENT CENTERS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Coverage & Fulfillment Centers
                </h3>
              </div>

              {/* Saudi Interactive Map Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/9] flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800"
                  alt="Saudi Arabia Delivery Network Map"
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Floating City Badges */}
                <div className="absolute inset-0 bg-slate-900/40 p-4 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between text-[10px] font-extrabold">
                    <span className="bg-emerald-600 px-2 py-0.5 rounded-md">LIVE NETWORK MAP</span>
                    <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">20-MIN EXPRESS HUB</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-extrabold">
                    <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-sm">📍 Riyadh Central</span>
                    <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-sm">📍 Jeddah Western</span>
                    <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-sm">📍 Dammam Eastern</span>
                  </div>
                </div>
              </div>

              {/* Office Directory List */}
              <div className="space-y-4 pt-1 text-xs">
                
                {/* Office 1: Riyadh */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">1. Riyadh Central HQ (Main Office)</span>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">HEADQUARTERS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    King Fahd Road, Al Malqa District, Building 402, Riyadh 13524, KSA
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-600 font-bold">
                    <span>Customer Support: 6:00 AM - 1:00 AM</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-extrabold">Farm Supplier Hub: Open 24/7</span>
                  </div>
                </div>

                {/* Office 2: Jeddah */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="font-extrabold text-slate-900 text-xs block">2. Jeddah Cold-Chain Logistics Hub</span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Al Andalus District, Corner Rawdah Road, Jeddah 23432
                  </p>
                  <span className="text-[10px] text-slate-600 font-bold block pt-0.5">
                    Servicing Jeddah, Makkah, and Taif Fresh Distribution
                  </span>
                </div>

                {/* Office 3: Dammam */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="font-extrabold text-slate-900 text-xs block">3. Dammam & Khobar Micro-Hub</span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    King Saud Street, Al Amamrah District, Dammam 32415
                  </p>
                  <span className="text-[10px] text-slate-600 font-bold block pt-0.5">
                    Servicing Dammam, Al Khobar, Jubail & Dhahran corridor
                  </span>
                </div>

              </div>

            </div>

            {/* Farmer Partnership Banner */}
            <div className="bg-[#043927] text-white rounded-3xl p-6 shadow-md border border-emerald-900 space-y-3 font-sans">
              <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
                LOCAL FARMER ONBOARDING
              </span>
              <h3 className="font-black text-[#05A764] text-base">
                Are you a Saudi organic grower?
              </h3>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Partner with Falcon Mart for 100% direct farm-to-table distribution across Saudi homes.
              </p>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-white text-[#043927] hover:bg-emerald-50 font-black text-xs shadow-xs transition-colors cursor-pointer"
              >
                Apply for Farmer Partnership ➔
              </button>
            </div>

          </div>

        </div>

        {/* ================= SECTION 4: FREQUENTLY ASKED QUESTIONS (ACCORDION) ================= */}
        <div className="max-w-4xl mx-auto space-y-8 pt-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-black text-[#05A764] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              SELF-SERVICE HELP
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Browse common questions regarding delivery slots, quality guarantees, and order modifications before contacting support.
            </p>
          </div>

          <div className="space-y-3 font-sans">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-[#043927] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{faq.q}</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-slate-50/50 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 5: FOOTER SATISFACTION GUARANTEE BANNER ================= */}
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs font-sans">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#043927] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-[#05A764]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-[#043927] text-base">Our 100% Farm-Fresh Satisfaction Guarantee</h3>
              <p className="text-xs text-emerald-900/80 font-medium leading-relaxed max-w-2xl">
                If any item in your order doesn't meet your standard for peak freshness, claim an instant credit or full refund in under 2 minutes. No paperwork required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/support"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Knowledge Base
            </Link>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Talk to a Supervisor
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
