'use client';
import React, { useState } from 'react';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { PhoneCall, Mail, MapPin, Send, CheckCircle2, Headphones, Clock, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const { locale } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="space-y-16 pb-16 font-sans bg-[#fbfcfb]">
      {/* Header Banner */}
      <section className="bg-[#05442e] text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="text-lime-300 font-serif italic text-lg sm:text-xl font-medium tracking-wide">
            {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            {locale === 'ar' ? 'نحن هنا لخدمتك على مدار الساعة' : 'We are Here to Help 24/7'}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'هل لديك سؤال أو استفسار حول طلبك؟ يسعدنا تواصلك معنا وسيقوم فريق خدمة العملاء بالرد عليك فوراً.'
              : 'Have a question regarding your order, delivery or products? Send us a message or reach out through our hotline.'}
          </p>
        </div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-lime-400/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Details Cards (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#05442e] flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{locale === 'ar' ? 'العنوان الرئيسي' : 'Store Location'}</h3>
                  <p className="text-xs text-slate-500">King Fahd Road, Olaya District, Riyadh, Saudi Arabia</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#05442e] flex items-center justify-center font-bold">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{locale === 'ar' ? 'الهاتف والواتساب' : 'Hotline & WhatsApp'}</h3>
                  <p className="text-xs text-slate-500">+966 500 000 000 / +966 11 200 0000</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#05442e] flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Support'}</h3>
                  <p className="text-xs text-slate-500">support@groceru-supermarket.sa</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#05442e] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{locale === 'ar' ? 'ساعات العمل' : 'Operating Hours'}</h3>
                  <p className="text-xs text-slate-500">24/7 Daily (365 Days per Year)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (2 Cols) */}
          <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {locale === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {locale === 'ar' ? 'قم بملء النموذج وسيقوم فريق الدعم بالتواصل معك مباشرة.' : 'Fill in the form below and our customer support team will reply within 1 hour.'}
              </p>
            </div>

            {submitted && (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-3 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{locale === 'ar' ? 'تم استلام رسالتك بنجاح! وسنتواصل معك قريباً.' : 'Thank you! Your message has been sent successfully. We will contact you shortly.'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#05442e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#05442e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#05442e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'الموضوع' : 'Subject'}</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Order Inquiry / Product Request"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#05442e]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">{locale === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist you today?"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#05442e]"
                />
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 rounded-full bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{locale === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
