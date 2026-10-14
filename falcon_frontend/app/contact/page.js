'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  Home,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Mail,
  Send,
  MapPin,
  Clock,
  Truck,
  Headphones,
  CheckCircle2,
  ExternalLink,
  Upload,
  Map,
  Building2,
  Snowflake,
  Store,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ContactPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [activeHub, setActiveHub] = useState('riyadh');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    orderId: '',
    category: '',
    message: '',
    agreed: false,
    fileAttached: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        orderId: '',
        category: '',
        message: '',
        agreed: false,
        fileAttached: false,
      });
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-sans pb-24 text-slate-800 space-y-8 sm:space-y-12">
      
      {/* ================= BREADCRUMBS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-[#043927] flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </Link>
          <span className="text-slate-300">›</span>
          <Link href="/contact" className="hover:text-[#043927] transition-colors">
            {isAr ? 'المساعدة والدعم' : 'Help & Support'}
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800 font-bold">
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">

        {/* ================= SECTION 1: HEADER & STATUS CARD ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left Title and Description */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#EAF5EF] border border-[#CDE5D7] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#064E3B]">
              <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse"></span>
              <span>{isAr ? 'نحن هنا لمساعدتك على مدار الساعة' : "WE'RE HERE TO HELP 24/7"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {isAr ? (
                <>
                  تواصل مع فريق خدمة <span className="text-[#05A764]">فرش مارت</span>
                </>
              ) : (
                <>
                  Get in Touch with the <span className="text-[#05A764]">FreshMart</span><br />Care Team
                </>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              {isAr
                ? 'سواء كان لديك استفسار حول طلب قيد التوصيل المبرد، التحقق من طزاجة المزرعة، الاشتراكات المؤسسية، أو انضمام مزرعة محلية — فريقنا المتخصص في خدمتك دائماً.'
                : 'Whether you have a question about an ongoing cold-chain delivery, farm freshness verification, corporate bulk subscriptions, or local farm onboarding — our dedicated team is at your service.'}
            </p>
          </div>

          {/* Right Floating Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2.5 shrink-0 min-w-[280px] sm:min-w-[320px] text-xs">
            <div className="flex items-center justify-between gap-4 text-slate-700">
              <div className="flex items-center gap-2 font-medium">
                <MessageSquare className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'وقت انتظار المحادثة:' : 'Live Chat Wait Time:'}</span>
              </div>
              <span className="text-[#05A764] font-black">{isAr ? 'أقل من 3 دقائق' : '< 3 mins'}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-slate-700">
              <div className="flex items-center gap-2 font-medium">
                <Truck className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'المراكز النشطة:' : 'Active Hubs:'}</span>
              </div>
              <span className="text-slate-900 font-bold">{isAr ? 'الرياض، جدة، الدمام' : 'Riyadh, Jeddah, Dammam'}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-slate-700 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 font-medium">
                <Headphones className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'الرقم المجاني بالمملكة:' : 'Toll-Free KSA:'}</span>
              </div>
              <span className="text-slate-900 font-mono font-black text-sm">800 124 5555</span>
            </div>
          </div>

        </div>

        {/* ================= SECTION 2: 4 QUICK CONTACT CHANNEL CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: 24/7 Live Support */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] text-[#05A764] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#05A764] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05A764] animate-pulse"></span>
                  <span>{isAr ? 'متصل الآن' : 'ONLINE NOW'}</span>
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {isAr ? 'دعم مباشر 24/7' : '24/7 Live Support'}
                </h3>
                <p className="text-[11px] text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'مساعدة فورية لتعديل الطلبات، المنتجات الناقصة، أو التتبع الحي لمندوب التوصيل.'
                    : 'Instant assistance for order changes, missing items, or live delivery tracking.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(isAr ? 'جاري فتح المحادثة المباشرة...' : 'Opening Live Chat session...')}
              className="w-full py-2.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isAr ? 'بدء المحادثة المباشرة' : 'Start Live Chat'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {/* Card 2: WhatsApp Care */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] text-[#05A764] flex items-center justify-center font-bold">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isAr ? 'الأسرع للصور' : 'Fastest for Photos'}
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {isAr ? 'عناية واتساب' : 'WhatsApp Care'}
                </h3>
                <p className="text-[11px] text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'إرسال صور العبوات أو إيصالات التوصيل مباشرة إلى موظف الدعم.'
                    : 'Send pictures of packaging or delivery receipts directly to an agent.'}
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-slate-900">
                  +966 11 800 4545
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/966118004545"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
            >
              <span>{isAr ? 'محادثة عبر واتساب' : 'Chat on WhatsApp'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

          {/* Card 3: Toll-Free Hotline */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] text-[#05A764] flex items-center justify-center font-bold">
                  <PhoneCall className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isAr ? '6:00 ص – 1:00 ص' : '6:00 AM – 1:00 AM'}
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {isAr ? 'الرقم المجاني الموحد' : 'Toll-Free Hotline'}
                </h3>
                <p className="text-[11px] text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'تحدث مباشرة مع فريق خدمة العملاء بالرياض باللغتين العربية والإنجليزية.'
                    : 'Speak directly with our Riyadh-based Arabic & English customer team.'}
                </p>
                <div className="pt-2 text-xs font-mono font-black text-[#043927]">
                  800 124 5555
                </div>
              </div>
            </div>

            <a
              href="tel:8001245555"
              className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
            >
              <span>{isAr ? 'اتصال مجاني' : 'Call Toll-Free'}</span>
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

          {/* Card 4: Corporate & Farm Desk */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] text-[#05A764] flex items-center justify-center font-bold">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isAr ? 'رد خلال أقل من ساعتين' : '< 2h Response'}
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {isAr ? 'مكتب الشركات والمزارع' : 'Corporate & Farm Desk'}
                </h3>
                <p className="text-[11px] text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'شراكات الموردين، التموين المؤسسي، والاستفسارات الرسمية والتنظيمية.'
                    : 'Vendor partnerships, bulk business catering, and legal inquiries.'}
                </p>
                <div className="pt-2 text-xs font-bold text-slate-900 truncate">
                  care@freshmart.sa
                </div>
              </div>
            </div>

            <a
              href="mailto:care@freshmart.sa"
              className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
            >
              <span>{isAr ? 'إرسال بريد إلكتروني' : 'Send an Email'}</span>
              <Send className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>

        {/* ================= SECTION 3: FORM & COVERAGE MAP MAIN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: DIRECT MESSAGE FORM (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#05A764] uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>{isAr ? 'بوابة التصعيد المباشر' : 'Direct Escalation Portal'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? 'أرسل لنا رسالة مباشرة' : 'Send Us a Direct Message'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {isAr
                  ? 'أرسل استفسار طلبك، ملاحظات الجودة، أو طلب الشراكة أدناه. يقوم فريق العمليات بتسجيل وتتبع كل طلب.'
                  : 'Submit your order inquiry, quality feedback, or partner request below. Our operations team logs each request with tracking.'}
              </p>
            </div>

            {submitted ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-[#043927] text-white flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#05A764]" />
                </div>
                <h3 className="font-black text-[#043927] text-lg">
                  {isAr ? 'تم استلام تذكرتك بنجاح!' : 'Support Ticket Dispatched!'}
                </h3>
                <p className="text-xs text-emerald-900 font-medium max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? `شكراً لك، ${formData.fullName || 'عميلنا العزيز'}. تم تسجيل طلبك في نظام المتابعة. سيتواصل معك فريق الدعم عبر البريد الإلكتروني والرسائل النصية قريباً.`
                    : `Thank you, ${formData.fullName || 'valued customer'}. Your ticket has been logged with tracking reference #FM-${Math.floor(10000 + Math.random() * 90000)}. Our Riyadh Care team will respond promptly.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                
                {/* Row 1: Full Name & Email Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Noura Al-Mansoor"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-1 focus:ring-[#043927] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="noura@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-1 focus:ring-[#043927] transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Saudi Mobile Number & Order ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      {isAr ? 'رقم الجوال السعودي *' : 'Saudi Mobile Number *'}
                    </label>
                    <div className="flex gap-2">
                      <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
                        <span>🇸🇦</span>
                        <span>+966</span>
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="5X XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-1 focus:ring-[#043927] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      {isAr ? 'رقم الطلب (اختياري)' : 'Order ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #FM-89241"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-1 focus:ring-[#043927] transition-all"
                    />
                    <span className="text-[10px] text-slate-400 font-normal block mt-1">
                      {isAr ? 'موجود في إيصالات التطبيق أو رابط رسالة الشحن' : 'Located in your app receipts or SMS dispatch link'}
                    </span>
                  </div>
                </div>

                {/* Row 3: Inquiry Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    {isAr ? 'نوع الاستفسار *' : 'Inquiry Category *'}
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-1 focus:ring-[#043927] cursor-pointer transition-all"
                  >
                    <option value="">{isAr ? 'اختر موضوعاً لتوجيهه للفريق المختص...' : 'Select a topic to route to the correct team...'}</option>
                    <option value="ORDER_STATUS">{isAr ? 'حالة الطلب والتتبع المباشر للتوصيل' : 'Active Order Status & Live GPS Tracking'}</option>
                    <option value="QUALITY">{isAr ? 'طزاجة المزرعة وضمان الجودة 100%' : 'Farm Freshness & 100% Quality Assurance'}</option>
                    <option value="COLD_CHAIN">{isAr ? 'استفسار عن سلسلة التبريد ودرجات الحرارة' : 'Cold-Chain Temperature Report Inquiry'}</option>
                    <option value="FARMER">{isAr ? 'شراكات المزارعين والمنتجين المحليين' : 'Farmer & Producer Partnership Onboarding'}</option>
                    <option value="CORPORATE">{isAr ? 'الطلبات المؤسسية والتموين للشركات' : 'Corporate & Institutional Bulk Catering'}</option>
                    <option value="PAYMENT">{isAr ? 'المدفوعات والفواتير الضريبية' : 'Payment, Invoicing & VAT Receipts'}</option>
                  </select>
                </div>

                {/* Row 4: Message Details */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    {isAr ? 'تفاصيل الرسالة *' : 'Message Details *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={isAr ? 'يرجى وصف استفسارك، اسم الصنف، أو ملاحظة التوصيل بالتفصيل...' : 'Please describe your inquiry, produce item name, or delivery note in detail...'}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#043927] focus:ring-1 focus:ring-[#043927] transition-all resize-none"
                  />
                </div>

                {/* Row 5: Attach Photos or Invoices */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    {isAr ? 'إرفاق صور أو فواتير (اختياري، حد أقصى 5 ميجابايت)' : 'Attach Photos or Invoices (Optional, max 5MB)'}
                  </label>
                  <label className="border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/70 rounded-2xl p-4 text-center block cursor-pointer transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFormData({ ...formData, fileAttached: Boolean(e.target.files && e.target.files[0]) })}
                    />
                    <Upload className="w-5 h-5 text-[#05A764] mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {formData.fileAttached ? (isAr ? 'تم إرفاق الملف بنجاح ✓' : 'File attached successfully ✓') : (isAr ? 'اضغط للرفع أو اسحب الملف هنا' : 'Click to upload or drag and drop')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                      {isAr ? 'JPG, PNG, PDF حتى 5 ميجابايت (مفيد للبضائع المتضررة أو إثبات التوصيل)' : 'JPG, PNG, PDF up to 5MB (Helpful for damaged goods or proof of delivery)'}
                    </span>
                  </label>
                </div>

                {/* Row 6: Agreement Checkbox */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="contactAgreement"
                    required
                    checked={formData.agreed}
                    onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-[#043927] focus:ring-[#043927] cursor-pointer"
                  />
                  <label htmlFor="contactAgreement" className="text-[11px] text-slate-600 font-normal cursor-pointer leading-snug">
                    {isAr ? (
                      <>
                        أوافق على معالجة فرش مارت لبياناتي وفقاً لـ <span className="font-bold underline text-slate-800">سياسة الخصوصية</span> و <span className="font-bold underline text-slate-800">شروط الخدمة</span> لسرعة المعالجة.
                      </>
                    ) : (
                      <>
                        I agree to FreshMart processing my information in accordance with the <span className="font-bold underline text-slate-800">Privacy Policy</span> and <span className="font-bold underline text-slate-800">Terms of Service</span> for prompt resolution.
                      </>
                    )}
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>{isAr ? 'إرسال تذكرة الدعم' : 'Submit Support Ticket'}</span>
                </button>

              </form>
            )}

          </div>

          {/* RIGHT COLUMN: COVERAGE & FULFILLMENT CENTERS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              
              {/* Header Title with Map Icon */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    {isAr ? 'شبكة التبريد' : 'COLD-CHAIN NETWORK'}
                  </span>
                  <h3 className="font-black text-slate-900 text-base">
                    {isAr ? 'مراكز التغطية والتنفيذ' : 'Coverage & Fulfillment Centers'}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#05A764] flex items-center justify-center">
                  <Map className="w-4.5 h-4.5" />
                </div>
              </div>

              {/* Riyadh Interactive Map Visual */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-100 shadow-inner">
                <img
                  src="/images/contact/riyadh_map.jpg"
                  alt="Riyadh Cold-Chain Delivery Map"
                  className="w-full h-full object-cover"
                />
                
                {/* Floating Hub Toggle Badges at Bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveHub('riyadh')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                      activeHub === 'riyadh'
                        ? 'bg-[#043927] text-white'
                        : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeHub === 'riyadh' ? 'bg-[#34D399]' : 'bg-slate-400'}`}></span>
                    <span>{isAr ? 'الرياض المركزية' : 'Riyadh Central'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHub('jeddah')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                      activeHub === 'jeddah'
                        ? 'bg-[#043927] text-white'
                        : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeHub === 'jeddah' ? 'bg-[#34D399]' : 'bg-slate-400'}`}></span>
                    <span>{isAr ? 'جدة الغربية' : 'Jeddah West'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHub('dammam')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                      activeHub === 'dammam'
                        ? 'bg-[#043927] text-white'
                        : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeHub === 'dammam' ? 'bg-[#34D399]' : 'bg-slate-400'}`}></span>
                    <span>{isAr ? 'الدمام الشرقية' : 'Dammam East'}</span>
                  </button>
                </div>
              </div>

              {/* Location Cards List */}
              <div className="space-y-4 pt-1">
                
                {/* Location 1: Main Central HQ */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2 ${activeHub === 'riyadh' ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300' : 'bg-slate-50/70 border-slate-200/80'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-emerald-800 bg-[#EAF5EF] border border-[#CDE5D7] px-2 py-0.5 rounded-md uppercase">
                      {isAr ? 'المقر الرئيسي المركزي' : 'MAIN CENTRAL HQ'}
                    </span>
                    <Building2 className="w-4 h-4 text-slate-700" />
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {isAr ? 'المركز الرئيسي للتحكم والعمليات بالرياض' : 'Riyadh Central Dispatch & HQ'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal flex items-start gap-1 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'طريق الملك فهد، حي الملقا، ص.ب 8421، الرياض 13524، المملكة العربية السعودية' : 'King Fahd Road, Al Malqa District, P.O. Box 8421, Riyadh 13524, Saudi Arabia'}</span>
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">{isAr ? 'مكتب العملاء:' : 'Customer Desk:'}</span>
                      <span className="font-bold text-slate-800">{isAr ? 'الأحد – الخميس: 8:00 ص – 6:00 م' : 'Sun – Thu: 8:00 AM – 6:00 PM'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{isAr ? 'أسطول التوزيع:' : 'Dispatch Fleet:'}</span>
                      <span className="font-black text-[#05A764]">{isAr ? 'يعمل 24/7' : 'Operating 24/7'}</span>
                    </div>
                  </div>
                </div>

                {/* Location 2: Jeddah Cold-Chain */}
                <div className={`p-4 rounded-2xl border transition-all space-y-1.5 ${activeHub === 'jeddah' ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300' : 'bg-slate-50/70 border-slate-200/80'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                      {isAr ? 'المنطقة الغربية' : 'Western Province'}
                    </span>
                    <Snowflake className="w-4 h-4 text-[#05A764]" />
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {isAr ? 'مركز لوجستيات التبريد بجدة' : 'Jeddah Cold-Chain Logistics Hub'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal flex items-start gap-1 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'حي الأندلس، بالقرب من طريق المدينة، جدة 23326' : 'Al Andalus District, Near Madinah Road, Jeddah 23326'}</span>
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-600 font-semibold pt-1">
                    {isAr ? 'نطاق الخدمة: جدة، مكة المكرمة، والمناطق الساحلية للبحر الأحمر' : 'Servicing: Jeddah, Makkah, and Red Sea Coastal Areas'}
                  </div>
                </div>

                {/* Location 3: Dammam & Khobar */}
                <div className={`p-4 rounded-2xl border transition-all space-y-1.5 ${activeHub === 'dammam' ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300' : 'bg-slate-50/70 border-slate-200/80'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                      {isAr ? 'المنطقة الشرقية' : 'Eastern Province'}
                    </span>
                    <Store className="w-4 h-4 text-emerald-800" />
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {isAr ? 'مركز الدمام والخبر اللوجستي المصغر' : 'Dammam & Khobar Micro-Hub'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal flex items-start gap-1 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'شارع الملك سعود، حي الفيصلية، الدمام 32272' : 'King Saud Street, Al Faisaliyah District, Dammam 32272'}</span>
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-600 font-semibold pt-1">
                    {isAr ? 'نطاق الخدمة: الدمام، الخبر، الظهران ومحور الجبيل الصناعي' : 'Servicing: Dammam, Al Khobar, Dhahran & Jubail industrial corridor'}
                  </div>
                </div>

              </div>

            </div>

            {/* Farmer Partnership Dark Banner */}
            <div className="bg-[#043927] text-white rounded-3xl p-6 shadow-md border border-emerald-900 space-y-3 font-sans">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                {isAr ? 'انضمام المزارعين المحليين' : 'LOCAL FARMER ONBOARDING'}
              </span>
              <h3 className="font-black text-white text-base">
                {isAr ? 'هل أنت مزارع عضوي سعودي؟' : 'Are you a Saudi organic grower?'}
              </h3>
              <p className="text-xs text-emerald-100/90 font-normal leading-relaxed">
                {isAr
                  ? 'شارك مع فرش مارت للتوزيع المباشر بنسبة 100% من المزرعة إلى موائد العائلات السعودية.'
                  : 'Partner with FreshMart for 100% direct farm-to-table distribution across Saudi homes.'}
              </p>
              <Link
                href="/about#farmers"
                className="w-full py-2.5 rounded-full bg-white text-[#043927] hover:bg-emerald-50 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isAr ? 'التقديم لشراكة المزارع' : 'Apply for Farmer Partnership'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
