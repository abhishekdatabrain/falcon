'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { Leaf, PhoneCall, Mail, MapPin, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  // Hide global footer on Admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-[#05442e] text-slate-200 border-t border-emerald-900/60 font-sans pt-14 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About Us */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-lime-300">
                <Leaf className="w-5 h-5 fill-current" />
              </div>
              <span className="text-2xl font-extrabold text-white font-serif tracking-tight">Groceru</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'متجر المقاضي اليومية الأول بالكامل، نوفر لك خضار وفواكه عضوية 100% ومستلزمات منزلية طازجة حصرياً مع خدمة التوصيل السريع خلال 30 دقيقة وفاتورة معتمدة.'
                : 'Daily grocery store providing 100% farm-fresh organic fruits, vegetables, dairy, farm eggs, and daily essentials delivered directly from farm to doorstep in 30 minutes.'}
            </p>
          </div>

          {/* Col 2: Product Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800/80 pb-2">
              {locale === 'ar' ? 'أقسام المنتجات' : 'Product Categories'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link href="/products" className="hover:text-lime-300 transition-colors">Fresh Vegetables & Fruits</Link></li>
              <li><Link href="/products" className="hover:text-lime-300 transition-colors">Dairy Products & Farm Eggs</Link></li>
              <li><Link href="/products" className="hover:text-lime-300 transition-colors">Pure Cold Pressed Juices</Link></li>
              <li><Link href="/products" className="hover:text-lime-300 transition-colors">Bakery & Fresh Snacks</Link></li>
              <li><Link href="/products" className="hover:text-lime-300 transition-colors">Personal Care & Organic Oil</Link></li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800/80 pb-2">
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link href="/" className="hover:text-lime-300 transition-colors">Home Page</Link></li>
              <li><Link href="/products" className="hover:text-lime-300 transition-colors">Browse Grocery Catalog</Link></li>
              <li><Link href="/orders" className="hover:text-lime-300 transition-colors">Track Active Deliveries</Link></li>
              <li><Link href="/cart" className="hover:text-lime-300 transition-colors">Shopping Cart</Link></li>
              <li><Link href="/login" className="hover:text-lime-300 transition-colors">Customer Account Login</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800/80 pb-2">
              {locale === 'ar' ? 'تواصل معنا' : 'Contact Details'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                <span>King Fahd Road, Olaya District, Riyadh, Kingdom of Saudi Arabia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-lime-400 shrink-0" />
                <span>+966 500 000 000 / +966 11 200 0000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-lime-400 shrink-0" />
                <span>support@groceru-supermarket.sa</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Groceru Supermart. All rights reserved. Saudi ZATCA E-Invoicing Compliant.</p>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <span>100% Secure Single Vendor Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
