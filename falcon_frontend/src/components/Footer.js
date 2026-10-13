'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { Leaf } from 'lucide-react';
import FooterWaveDivider from './FooterWaveDivider';

export default function Footer() {
  const pathname = usePathname();
  const { locale, setLanguage } = useLanguage();

  // Hide global footer on Admin and Driver routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/driver')) {
    return null;
  }

  return (
    <footer className="relative bg-[#043927] text-slate-200 font-sans mt-16 overflow-hidden">
      
      {/* Top Decorative Wave Divider */}
      <div className="w-full bg-white leading-none relative z-10 pointer-events-none -mb-1">
        <FooterWaveDivider />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 relative z-20">
        
        {/* Main Grid: Brand Column + 4 Link Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          
          {/* Col 1: Brand, Tagline, Socials & App Downloads */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-1.5 group">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">Logo</span>
              <Leaf className="w-6 h-6 text-[#05A764] fill-[#05A764] -mt-1 group-hover:rotate-12 transition-transform" />
            </Link>

            {/* Tagline */}
            <p className="text-[#DA9628] font-semibold text-base sm:text-lg leading-snug font-sans">
              {locale === 'ar' ? 'المستلزمات اليومية، تصلك بكل بساطة.' : 'Everyday essentials, delivered simply.'}
            </p>

            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {/* X / Twitter */}
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-emerald-700/80 bg-emerald-950/40 text-slate-200 flex items-center justify-center hover:bg-[#DA9628] hover:border-[#DA9628] hover:text-white transition-all shadow-2xs"
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-emerald-700/80 bg-emerald-950/40 text-slate-200 flex items-center justify-center hover:bg-[#DA9628] hover:border-[#DA9628] hover:text-white transition-all shadow-2xs"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-emerald-700/80 bg-emerald-950/40 text-slate-200 flex items-center justify-center hover:bg-[#DA9628] hover:border-[#DA9628] hover:text-white transition-all shadow-2xs"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.742-2.971 2.84v1.131h3.766l-.55 3.667h-3.216v7.98H9.101z"/>
                </svg>
              </a>
            </div>

            {/* Download Our App */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-xs sm:text-sm tracking-wide font-sans">
                <span className="w-0.5 h-4 bg-[#DA9628] inline-block"></span>
                <span>{locale === 'ar' ? 'تنزيل تطبيقنا' : 'Download Our App'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Google Play */}
                <a
                  href="#"
                  className="bg-[#02281b] hover:bg-black text-white px-3.5 py-2 rounded-xl border border-emerald-800/80 flex items-center gap-2.5 shadow-sm transition-all hover:scale-105 group"
                >
                  <svg className="w-5 h-5 fill-current text-emerald-400 group-hover:text-white transition-colors" viewBox="0 0 24 24">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L14.81,13.12L18.4,9.53L16.81,15.12M14.81,10.88L16.81,8.88L18.4,14.47L14.81,10.88M15.5,12.71L18.67,15.88L20.88,14.61C21.63,14.18 21.63,13.18 20.88,12.75L18.67,11.48L15.5,12.71Z" />
                  </svg>
                  <div className="flex flex-col text-left rtl:text-right leading-none">
                    <span className="text-[9px] uppercase text-slate-300 font-medium">GET IT ON</span>
                    <span className="text-xs font-bold text-white tracking-wide">Google Play</span>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href="#"
                  className="bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-sm transition-all hover:scale-105 group"
                >
                  <svg className="w-5 h-5 fill-current text-slate-900" viewBox="0 0 24 24">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.09,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  <div className="flex flex-col text-left rtl:text-right leading-none">
                    <span className="text-[9px] uppercase text-slate-500 font-medium">Download on the</span>
                    <span className="text-xs font-bold text-slate-900 tracking-wide">App Store</span>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* Col 2: Shop */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-base font-extrabold text-white tracking-tight font-heading">
              {locale === 'ar' ? 'التسوق' : 'Shop'}
            </h4>
            <div className="w-7 h-0.5 bg-[#DA9628] -mt-1 mb-4"></div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li><Link href="/products?category=groceries" className="hover:text-white transition-colors">{locale === 'ar' ? 'البقالة' : 'Groceries'}</Link></li>
              <li><Link href="/products?category=snacks" className="hover:text-white transition-colors">{locale === 'ar' ? 'الوجبات الخفيفة' : 'Snacks'}</Link></li>
              <li><Link href="/products?category=personal-care" className="hover:text-white transition-colors">{locale === 'ar' ? 'العناية الشخصية' : 'Personal Care'}</Link></li>
              <li><Link href="/products?category=household" className="hover:text-white transition-colors">{locale === 'ar' ? 'المستلزمات المنزلية' : 'Household'}</Link></li>
              <li><Link href="/products?category=frozen" className="hover:text-white transition-colors">{locale === 'ar' ? 'الأطعمة المجمدة' : 'Frozen Foods'}</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">{locale === 'ar' ? 'وصل حديثاً' : 'New Arrivals'}</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-base font-extrabold text-white tracking-tight font-heading">
              {locale === 'ar' ? 'خدمة العملاء' : 'Customer Care'}
            </h4>
            <div className="w-7 h-0.5 bg-[#DA9628] -mt-1 mb-4"></div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li><Link href="/contact" className="hover:text-white transition-colors">{locale === 'ar' ? 'مركز المساعدة' : 'Help Center'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{locale === 'ar' ? 'اتصل بنا' : 'Contact Us'}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">{locale === 'ar' ? 'معلومات التوصيل' : 'Delivery Information'}</Link></li>
              <li><Link href="/orders/track" className="hover:text-white transition-colors">{locale === 'ar' ? 'تتبع الطلب' : 'Track Order'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}</Link></li>
            </ul>
          </div>

          {/* Col 4: My Account */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-base font-extrabold text-white tracking-tight font-heading">
              {locale === 'ar' ? 'حسابي' : 'My Account'}
            </h4>
            <div className="w-7 h-0.5 bg-[#DA9628] -mt-1 mb-4"></div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li><Link href="/profile" className="hover:text-white transition-colors">{locale === 'ar' ? 'ملفي الشخصي' : 'My Profile'}</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">{locale === 'ar' ? 'طلباتي' : 'My Orders'}</Link></li>
              <li><Link href="/addresses" className="hover:text-white transition-colors">{locale === 'ar' ? 'العناوين' : 'Addresses'}</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">{locale === 'ar' ? 'سجل الطلبات' : 'Order History'}</Link></li>
            </ul>
          </div>

          {/* Col 5: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-base font-extrabold text-white tracking-tight font-heading">
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <div className="w-7 h-0.5 bg-[#DA9628] -mt-1 mb-4"></div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li><Link href="/about" className="hover:text-white transition-colors">{locale === 'ar' ? 'من نحن' : 'About Us'}</Link></li>
              <li><Link href="/products?on_sale=true" className="hover:text-white transition-colors">{locale === 'ar' ? 'العروض والخصومات' : 'Deals & Offers'}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Language Switcher Bar */}
        <div className="pt-8 mt-12 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-300 font-sans">
          <p className="text-center sm:text-left rtl:sm:text-right">
            © 2026 Logo. All rights reserved.
          </p>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage && setLanguage('en')}
              className={`hover:text-white transition-colors cursor-pointer ${locale === 'en' ? 'text-white font-bold' : 'text-slate-400'}`}
            >
              English
            </button>
            <span className="text-emerald-700">|</span>
            <button
              onClick={() => setLanguage && setLanguage('ar')}
              className={`hover:text-white transition-colors cursor-pointer ${locale === 'ar' ? 'text-white font-bold' : 'text-slate-400'}`}
            >
              العربية
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
