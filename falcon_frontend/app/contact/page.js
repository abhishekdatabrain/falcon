'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import { fetchApi, getImageUrl, getCsrfToken } from '../../src/services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
import {
  Home,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Mail,
  Send,
  MapPin,
  Truck,
  Headphones,
  ExternalLink,
  Upload,
  Map,
  Building2,
  Snowflake,
  Store,
  Compass,
  ArrowRight,
  Check,
  Loader2,
  X,
  FileText,
  AlertCircle,
  Globe,
} from 'lucide-react';

export default function ContactPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAr = locale === 'ar';
  const formRef = useRef(null);

  // Dynamic Backend Data
  const [loadingData, setLoadingData] = useState(true);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeLocationId, setActiveLocationId] = useState(null);

  // Contact Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    orderId: '',
    category: '',
    message: '',
    agreed: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Attachment Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachment, setAttachment] = useState(null);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user.mobile ? user.mobile.replace(/^\+?966/, '').replace(/^0+/, '') : ''),
      }));
    }, 0);
    return () => clearTimeout(t);
  }, [user]);

  // Fetch dynamic contact settings, categories & locations
  useEffect(() => {
    let isMounted = true;
    const loadContactData = async () => {
      try {
        setLoadingData(true);
        const res = await fetchApi('/contact/settings');
        if (!isMounted) return;
        if (res.success && res.data) {
          setSettings(res.data.settings || null);
          setCategories(Array.isArray(res.data.categories) ? res.data.categories : []);
          const locs = Array.isArray(res.data.locations) ? res.data.locations : [];
          setLocations(locs);
          if (locs.length > 0) {
            setActiveLocationId(locs[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic contact data:', err.message);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };
    loadContactData();
    return () => { isMounted = false; };
  }, []);

  // File Attachment Upload Handler with real progress
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showToast(
        isAr ? 'صيغة الملف غير مدعومة. يرجى رفع JPG أو PNG أو PDF فقط.' : 'Invalid file format. Only JPG, PNG, and PDF files are allowed.',
        'error'
      );
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(
        isAr ? 'حجم الملف يتجاوز الحد الأقصى 5 ميجابايت.' : 'File size exceeds the maximum 5MB limit.',
        'error'
      );
      e.target.value = '';
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    const payload = new FormData();
    payload.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/upload`, true);
    xhr.withCredentials = true;

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      xhr.setRequestHeader('x-csrf-token', csrfToken);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploadingFile(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success && res.data?.url) {
          setAttachment({
            url: res.data.url,
            name: res.data.originalname || file.name,
            type: res.data.mimetype || file.type,
            size: res.data.sizeBytes || file.size,
            formattedSize: res.data.formattedSize || `${(file.size / 1024).toFixed(1)} KB`,
          });
          showToast(isAr ? 'تم رفع المرفق بنجاح ✓' : 'File uploaded successfully ✓', 'success');
        } else {
          showToast(res.message || (isAr ? 'فشل رفع الملف' : 'Failed to upload file'), 'error');
        }
      } catch {
        showToast(isAr ? 'فشل رفع الملف' : 'Failed to upload file', 'error');
      }
    };

    xhr.onerror = () => {
      setUploadingFile(false);
      showToast(isAr ? 'حدث خطأ أثناء رفع الملف' : 'Network error while uploading file', 'error');
    };

    xhr.send(payload);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || uploadingFile) return;

    const errors = {};
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const cleanDigits = formData.phone.replace(/[^0-9]/g, '');
    const trimmedMsg = formData.message.trim();

    if (!trimmedName || trimmedName.length < 2) {
      errors.fullName = isAr ? 'الاسم الكامل مطلوب' : 'Full name is required (at least 2 characters)';
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
    }
    if (!cleanDigits || cleanDigits.length < 9) {
      errors.phone = isAr ? 'يرجى إدخال رقم جوال سعودي صحيح' : 'Please enter a valid Saudi mobile number';
    }
    if (!formData.category) {
      errors.category = isAr ? 'يرجى اختيار نوع الاستفسار' : 'Please select an inquiry category';
    }
    if (!trimmedMsg || trimmedMsg.length < 10) {
      errors.message = isAr ? 'يرجى كتابة تفاصيل الرسالة (10 أحرف على الأقل)' : 'Please describe your inquiry (at least 10 characters)';
    }
    if (!formData.agreed) {
      errors.agreed = isAr ? 'يجب الموافقة على سياسة الخصوصية وشروط الخدمة' : 'You must agree to the Privacy Policy and Terms of Service';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast(Object.values(errors)[0], 'error');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const fullMobile = `+966${cleanDigits.replace(/^0+/, '')}`;
      const res = await fetchApi('/contact/tickets', {
        method: 'POST',
        body: {
          full_name: trimmedName,
          email: trimmedEmail,
          mobile: fullMobile,
          order_id: formData.orderId.trim() || null,
          category_code: formData.category,
          message: trimmedMsg,
          attachment_url: attachment?.url || null,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
          attachment_size: attachment?.size || null,
          agreed: formData.agreed,
        },
      });

      if (res.success && res.data?.ticket) {
        setSubmittedTicket(res.data.ticket);
        showToast(
          isAr
            ? `تم إرسال تذكرة الدعم بنجاح (${res.data.ticket.ticket_number})`
            : `Support ticket submitted successfully (${res.data.ticket.ticket_number})`,
          'success'
        );
        setFormData({
          fullName: user?.name || '',
          email: user?.email || '',
          phone: user?.mobile ? user.mobile.replace(/^\+?966/, '').replace(/^0+/, '') : '',
          orderId: '',
          category: '',
          message: '',
          agreed: false,
        });
        setAttachment(null);
        setUploadProgress(0);
      } else {
        throw new Error(res.message || 'Failed to submit support ticket');
      }
    } catch (err) {
      const fErrors = err.fieldErrors || err.data?.fieldErrors || {};
      setFieldErrors(fErrors);
      showToast(err.message || (isAr ? 'فشل إرسال التذكرة' : 'Failed to submit support ticket'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Derived dynamic values with safe fallbacks
  const supportEmail = settings?.support_email || 'care@saqrcart.com';
  const supportPhone = settings?.support_phone || '800 124 5555';
  const whatsappNumber = settings?.whatsapp_number || '+966 59 597 4591';
  const cleanWhatsappDigits = whatsappNumber.replace(/[^0-9]/g, '');
  const cleanPhoneDigits = supportPhone.replace(/[^0-9+]/g, '');
  const supportHours = isAr
    ? (settings?.support_hours_ar || '6:00 ص – 1:00 ص')
    : (settings?.support_hours_en || '6:00 AM – 1:00 AM');
  const liveChatWait = isAr
    ? (settings?.live_chat_wait_ar || 'أقل من 3 دقائق')
    : (settings?.live_chat_wait_en || '< 3 mins');
  const socialLinks = settings?.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((v) => Boolean(v && String(v).trim()));

  const activeLocation = locations.find((l) => l.id === activeLocationId) || locations[0] || null;
  const activeHubsSummary = locations.length > 0
    ? locations.map((l) => (isAr ? (l.region_ar || l.name_ar) : (l.region_en || l.name_en))).slice(0, 3).join(', ')
    : (isAr ? 'الرياض، جدة، الدمام' : 'Riyadh, Jeddah, Dammam');

  const getLocationIcon = (type) => {
    if (type === 'HQ') return <Building2 className="w-4 h-4 text-slate-700" />;
    if (type === 'DISPATCH_HUB') return <Snowflake className="w-4 h-4 text-[#05A764]" />;
    return <Store className="w-4 h-4 text-emerald-800" />;
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] pb-24 text-slate-800 space-y-8 sm:space-y-12">

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
                  تواصل مع فريق خدمة <span className="text-[#05A764]">صقر كارت</span>
                </>
              ) : (
                <>
                  Get in Touch with the <span className="text-[#05A764]">SaqrCart</span><br />Care Team
                </>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              {isAr
                ? 'سواء كان لديك استفسار حول طلب قيد التوصيل المبرد، التحقق من طزاجة المنتجات، الطلبات المؤسسية، أو شراكات الموردين — فريقنا المتخصص في خدمتك دائماً.'
                : 'Whether you have a question about an ongoing delivery, product freshness verification, corporate bulk orders, or supplier onboarding — our dedicated SaqrCart team is at your service.'}
            </p>
          </div>

          {/* Right Floating Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2.5 shrink-0 min-w-[280px] sm:min-w-[320px] text-xs">
            {loadingData ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
                <div className="h-4 bg-slate-100 rounded w-4/5" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 text-slate-700">
                  <div className="flex items-center gap-2 font-medium">
                    <MessageSquare className="w-4 h-4 text-[#05A764]" />
                    <span>{isAr ? 'وقت انتظار المحادثة:' : 'Live Support Wait Time:'}</span>
                  </div>
                  <span className="text-[#05A764] font-black">{liveChatWait}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-slate-700">
                  <div className="flex items-center gap-2 font-medium">
                    <Truck className="w-4 h-4 text-[#05A764]" />
                    <span>{isAr ? 'المراكز النشطة:' : 'Active Hubs:'}</span>
                  </div>
                  <span className="text-slate-900 font-bold text-right truncate max-w-[160px]">{activeHubsSummary}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-slate-700 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 font-medium">
                    <Headphones className="w-4 h-4 text-[#05A764]" />
                    <span>{isAr ? 'الرقم المجاني بالمملكة:' : 'Toll-Free KSA:'}</span>
                  </div>
                  <span className="text-slate-900 font-mono font-black text-sm" dir="ltr">{supportPhone}</span>
                </div>
              </>
            )}
          </div>

        </div>

        {/* ================= SECTION 2: 4 QUICK CONTACT CHANNEL CARDS ================= */}
        {loadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/90 h-48 animate-pulse space-y-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-100 rounded-full w-full mt-4" />
              </div>
            ))}
          </div>
        ) : (
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
                    {isAr ? 'دعم مباشر 24/7' : '24/7 Direct Support'}
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
                onClick={() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  showToast(isAr ? 'يرجى تعبئة نموذج التذكرة أدناه وسنرد عليك فوراً' : 'Submit your inquiry below for immediate assistance', 'info');
                }}
                className="w-full py-2.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isAr ? 'افتح تذكرة دعم' : 'Open Support Ticket'}</span>
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
                  <div className="pt-2 text-xs font-mono font-bold text-slate-900" dir="ltr">
                    {whatsappNumber}
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/${cleanWhatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
              >
                <span>{isAr ? 'محادثة عبر واتساب' : 'Chat on WhatsApp'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

            {/* Card 4: Corporate & Support Desk */}
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
                    {isAr ? 'مكتب الدعم والشركات' : 'Corporate & Care Desk'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed pt-1">
                    {isAr
                      ? 'شراكات الموردين، التموين المؤسسي، والاستفسارات الرسمية والتنظيمية.'
                      : 'Vendor partnerships, bulk business catering, and official inquiries.'}
                  </p>
                  <div className="pt-2 text-xs font-bold text-slate-900 truncate">
                    {supportEmail}
                  </div>
                </div>
              </div>

              <a
                href={`mailto:${supportEmail}`}
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
              >
                <span>{isAr ? 'إرسال بريد إلكتروني' : 'Send an Email'}</span>
                <Send className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

          </div>
        )}

        {/* Social Media Links Bar (Only if configured in Admin Panel) */}
        {hasSocialLinks && (
          <div className="flex flex-wrap items-center justify-center gap-3 bg-white rounded-2xl py-3 px-5 border border-slate-200/80 shadow-2xs text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#05A764]" />
              <span>{isAr ? 'تابع صقر كارت:' : 'Connect with SaqrCart:'}</span>
            </span>
            {Object.entries(socialLinks).map(([network, url]) =>
              url && String(url).trim() ? (
                <a
                  key={network}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full bg-[#EAF5EF] hover:bg-[#d7eee1] text-[#043927] font-bold capitalize transition-colors flex items-center gap-1"
                >
                  <span>{network}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null
            )}
          </div>
        )}

        {/* ================= SECTION 3: FORM & COVERAGE MAP MAIN GRID ================= */}
        <div id="contactFormSection" ref={formRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

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
                  : 'Submit your order inquiry, quality feedback, or partner request below. Our operations team logs each request with a unique tracking number.'}
              </p>
            </div>

            {submittedTicket ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-[#043927] text-white flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#34D399]" />
                </div>
                <h3 className="font-black text-[#043927] text-lg">
                  {isAr ? 'تم استلام تذكرتك بنجاح!' : 'Your Enquiry has been Submitted!'}
                </h3>
                <div className="inline-block bg-white border border-emerald-300 rounded-xl px-4 py-2 font-mono font-black text-sm text-[#043927]">
                  {submittedTicket.ticket_number}
                </div>
                <p className="text-xs text-emerald-900 font-medium max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? `تم تسجيل طلبك في نظام المتابعة برقم المرجع ${submittedTicket.ticket_number}. سيتواصل معك فريق دعم صقر كارت قريباً.`
                    : `Your enquiry has been logged in our support system with tracking reference ${submittedTicket.ticket_number}. Our SaqrCart Care team will respond promptly.`}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="px-6 py-2.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'إرسال استفسار آخر' : 'Submit Another Enquiry'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>

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
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${fieldErrors.fullName ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#043927] focus:ring-[#043927]'}`}
                    />
                    {fieldErrors.fullName && <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.fullName}</p>}
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
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${fieldErrors.email ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#043927] focus:ring-[#043927]'}`}
                    />
                    {fieldErrors.email && <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.email}</p>}
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
                        inputMode="numeric"
                        maxLength={10}
                        required
                        placeholder="5X XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => {
                          const numeric = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: numeric });
                          if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: null }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${fieldErrors.phone ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#043927] focus:ring-[#043927]'}`}
                      />
                    </div>
                    {fieldErrors.phone && <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      {isAr ? 'رقم الطلب (اختياري)' : 'Order ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-20261125-0001"
                      value={formData.orderId}
                      onChange={(e) => {
                        setFormData({ ...formData, orderId: e.target.value });
                        if (fieldErrors.orderId) setFieldErrors((p) => ({ ...p, orderId: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${fieldErrors.orderId ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#043927] focus:ring-[#043927]'}`}
                    />
                    {fieldErrors.orderId ? (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.orderId}</p>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal block mt-1">
                        {isAr ? 'موجود في إيصالات التطبيق أو رابط رسالة الشحن' : 'Located in your app receipts or SMS dispatch link'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Dynamic Inquiry Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    {isAr ? 'نوع الاستفسار *' : 'Inquiry Category *'}
                  </label>
                  {loadingData ? (
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  ) : categories.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'لا توجد فئات استفسار متاحة حالياً.' : 'No active inquiry categories available right now.'}</span>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value });
                        if (fieldErrors.category) setFieldErrors((p) => ({ ...p, category: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:ring-1 cursor-pointer transition-all ${fieldErrors.category ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#043927] focus:ring-[#043927]'}`}
                    >
                      <option value="">{isAr ? 'اختر موضوعاً لتوجيهه للفريق المختص...' : 'Select a topic to route to the correct team...'}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.code}>
                          {isAr ? (cat.name_ar || cat.name_en) : cat.name_en}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.category && <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.category}</p>}
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
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 transition-all resize-none ${fieldErrors.message ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#043927] focus:ring-[#043927]'}`}
                  />
                  {fieldErrors.message && <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.message}</p>}
                </div>

                {/* Row 6: Agreement Checkbox */}
                <div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="contactAgreement"
                      required
                      checked={formData.agreed}
                      onChange={(e) => {
                        setFormData({ ...formData, agreed: e.target.checked });
                        if (fieldErrors.agreed) setFieldErrors((p) => ({ ...p, agreed: null }));
                      }}
                      className="mt-0.5 rounded border-slate-300 accent-[#043927] text-[#043927] focus:ring-[#043927] cursor-pointer"
                    />
                    <label htmlFor="contactAgreement" className="text-[11px] text-slate-600 font-normal cursor-pointer leading-snug">
                      {isAr ? (
                        <>
                          أوافق على معالجة صقر كارت لبياناتي وفقاً لـ{' '}
                          <Link href="/privacy" className="font-bold underline text-slate-800 hover:text-[#043927]">سياسة الخصوصية</Link> و{' '}
                          <Link href="/terms" className="font-bold underline text-slate-800 hover:text-[#043927]">شروط الخدمة</Link> لسرعة المعالجة.
                        </>
                      ) : (
                        <>
                          I agree to SaqrCart processing my information in accordance with the{' '}
                          <Link href="/privacy" className="font-bold underline text-slate-800 hover:text-[#043927]">Privacy Policy</Link> and{' '}
                          <Link href="/terms" className="font-bold underline text-slate-800 hover:text-[#043927]">Terms of Service</Link> for prompt resolution.
                        </>
                      )}
                    </label>
                  </div>
                  {fieldErrors.agreed && <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.agreed}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="w-full py-3.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#34D399]" />
                      <span>{isAr ? 'جاري إرسال التذكرة...' : 'Submitting Ticket...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#34D399]" />
                      <span>{isAr ? 'إرسال تذكرة الدعم' : 'Submit Support Ticket'}</span>
                    </>
                  )}
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
                    {isAr ? 'شبكة التبريد والتوزيع' : 'DISPATCH & LOGISTICS NETWORK'}
                  </span>
                  <h3 className="font-black text-slate-900 text-base">
                    {isAr ? 'مراكز التغطية والتنفيذ' : 'Coverage & Fulfillment Centers'}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#05A764] flex items-center justify-center">
                  <Map className="w-4.5 h-4.5" />
                </div>
              </div>

              {loadingData ? (
                <div className="space-y-4 animate-pulse">
                  <div className="aspect-[16/9] rounded-2xl bg-slate-100" />
                  <div className="h-24 rounded-2xl bg-slate-100" />
                  <div className="h-24 rounded-2xl bg-slate-100" />
                </div>
              ) : locations.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                  <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    {isAr ? 'لا توجد مواقع أو مراكز توصيل نشطة حالياً.' : 'No active office or dispatch locations configured.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Interactive Map Visual (Google Maps Embed if lat/lng present, else Map Image) */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-100 shadow-inner">
                    {activeLocation?.latitude && activeLocation?.longitude ? (
                      <iframe
                        title={isAr ? activeLocation.name_ar : activeLocation.name_en}
                        src={`https://maps.google.com/maps?q=${activeLocation.latitude},${activeLocation.longitude}&z=13&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <img
                        src={activeLocation?.map_image_url ? getImageUrl(activeLocation.map_image_url) : '/images/contact/riyadh_map.jpg'}
                        alt={isAr ? activeLocation?.name_ar : activeLocation?.name_en || 'Coverage Map'}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Floating Hub Toggle Badges at Bottom */}
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
                      {locations.map((loc) => {
                        const isSelected = activeLocation?.id === loc.id;
                        const label = isAr ? (loc.region_ar || loc.name_ar) : (loc.region_en || loc.name_en);
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => setActiveLocationId(loc.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${isSelected
                                ? 'bg-[#043927] text-white'
                                : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200'
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#34D399]' : 'bg-slate-400'}`}></span>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Location Cards List */}
                  <div className="space-y-4 pt-1">
                    {locations.map((loc) => {
                      const isSelected = activeLocation?.id === loc.id;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => setActiveLocationId(loc.id)}
                          className={`p-4 rounded-2xl border transition-all space-y-2 cursor-pointer ${isSelected
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300'
                              : 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-200'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${isSelected
                                ? 'text-emerald-800 bg-[#EAF5EF] border border-[#CDE5D7]'
                                : 'text-slate-600 bg-slate-100'
                              }`}>
                              {isAr ? (loc.badge_ar || loc.location_type) : (loc.badge_en || loc.location_type)}
                            </span>
                            {getLocationIcon(loc.location_type)}
                          </div>

                          <div>
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                              {isAr ? (loc.name_ar || loc.name_en) : loc.name_en}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-normal flex items-start gap-1 pt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{isAr ? (loc.address_ar || loc.address_en) : loc.address_en}</span>
                            </p>
                          </div>

                          {(loc.support_hours_en || loc.dispatch_hours_en) && (
                            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-400 block">{isAr ? 'مكتب العملاء:' : 'Customer Desk:'}</span>
                                <span className="font-bold text-slate-800">
                                  {isAr ? (loc.support_hours_ar || loc.support_hours_en) : loc.support_hours_en}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">{isAr ? 'أسطول التوزيع:' : 'Dispatch Fleet:'}</span>
                                <span className="font-black text-[#05A764]">
                                  {isAr ? (loc.dispatch_hours_ar || loc.dispatch_hours_en) : loc.dispatch_hours_en}
                                </span>
                              </div>
                            </div>
                          )}

                          {(loc.service_areas_en || loc.service_areas_ar) && (
                            <div className="text-[10px] text-slate-600 font-semibold pt-0.5">
                              {isAr
                                ? `نطاق الخدمة: ${loc.service_areas_ar || loc.service_areas_en}`
                                : `Servicing: ${loc.service_areas_en}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>

            {/* Partner Onboarding Dark Banner */}
            <div className="bg-[#043927] text-white rounded-3xl p-6 shadow-md border border-emerald-900 space-y-3">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                {isAr ? 'شراكة الموردين والمزارع' : 'LOCAL SUPPLIER ONBOARDING'}
              </span>
              <h3 className="font-black text-white text-base">
                {isAr ? 'هل أنت مورد أو مزارع سعودي؟' : 'Are you a Saudi supplier or grower?'}
              </h3>
              <p className="text-xs text-emerald-100/90 font-normal leading-relaxed">
                {isAr
                  ? 'شارك مع صقر كارت للتوزيع المباشر إلى آلاف المنازل والشركات في المملكة العربية السعودية.'
                  : 'Partner with SaqrCart for direct distribution to thousands of households and businesses across Saudi Arabia.'}
              </p>
              <Link
                href="/about"
                className="w-full py-2.5 rounded-full bg-white text-[#043927] hover:bg-emerald-50 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isAr ? 'تعرّف على صقر كارت' : 'Learn About SaqrCart'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
