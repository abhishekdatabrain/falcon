'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  ShieldCheck,
  FileText,
  Building2,
  PhoneCall,
  Mail,
  Calendar,
  AlertTriangle,
  CreditCard,
  Truck,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function TermsAndConditionsPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [activeSection, setActiveSection] = useState('section-1');

  const sections = [
    { id: 'section-1', title_en: '1. Our Legal Identity & About Us', title_ar: '1. هويتنا القانونية وعن الشركة' },
    { id: 'section-2', title_en: '2. Customer Eligibility', title_ar: '2. أهلية العميل' },
    { id: 'section-3', title_en: '3. Customer Accounts & Security', title_ar: '3. حسابات العملاء وأمان الموقع' },
    { id: 'section-4', title_en: '4. Orders, Payments, Cancellations & Returns', title_ar: '4. الطلبات والدفع والإلغاء والاسترجاع' },
    { id: 'section-5', title_en: '5. Discount Campaigns & Promotions', title_ar: '5. حملات الخصم والعروض الترويجية' },
    { id: 'section-6', title_en: '6. Shipping & Delivery Policy', title_ar: '6. سياسة الشحن والتوصيل' },
    { id: 'section-7', title_en: '7. Product Details, Images & Reviews', title_ar: '7. تفاصيل المنتجات والصور والتقييمات' },
    { id: 'section-8', title_en: '8. Payment Card & Financial Terms', title_ar: '8. شروط بطاقات الدفع والمعاملات المالية' },
    { id: 'section-9', title_en: '9. Third-Party Platforms & Apps', title_ar: '9. منصات وتطبيقات الطرف الثالث' },
    { id: 'section-10', title_en: '10. Acceptable Use of Website', title_ar: '10. الاستخدام المقبول للموقع' },
    { id: 'section-11', title_en: '11. Ownership of Website Content', title_ar: '11. ملكية محتوى الموقع وحقوق النشر' },
    { id: 'section-12', title_en: '12. Website Availability & Liability', title_ar: '12. توفر الموقع وحدود المسؤولية' },
    { id: 'section-13', title_en: '13. Changes to These Terms', title_ar: '13. التعديلات على الشروط والأحكام' },
    { id: 'section-14', title_en: '14. Applicable Law & Dispute Resolution', title_ar: '14. القانون الواجب التطبيق وتسوية النزاعات' },
    { id: 'section-15', title_en: '15. Payment Authorization, OTP & Disputes', title_ar: '15. تفويض الدفع والتحقق بـ OTP والنزاعات' },
    { id: 'section-16', title_en: '16. Customer Support & Official Contacts', title_ar: '16. خدمة العملاء وبيانات التواصل الرسمية' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFDFB] text-slate-800 pb-20">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-b from-[#043927] to-[#02281b] text-white pt-10 pb-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-900">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-700/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
            <span>{isAr ? 'وثيقة رسمية ومعتمدة' : 'Official Legal Document'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base max-w-3xl leading-relaxed font-normal">
            {isAr
              ? 'تحكم هذه الشروط والأحكام استخدامك لمتجر صقر كارت (SaqrCart) التابع لشركة صقر الاندماج التجارية بالمملكة العربية السعودية.'
              : 'These Terms and Conditions govern your access to and use of the SaqrCart online store operated by Saqr Alindimaj Trading Company LLC in the Kingdom of Saudi Arabia.'}
          </p>

          {/* Quick Legal Credentials Badge */}
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-emerald-200/90">
            <div className="flex items-center gap-1.5 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-700/40">
              <Building2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>CR: <strong>7052257016</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-700/40">
              <FileText className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>VAT: <strong>314339742700003</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-700/40">
              <Calendar className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{isAr ? 'آخر تحديث: نوفمبر 2026' : 'Last Updated: November 2026'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Table of Contents Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {isAr ? 'فهرس الشروط' : 'Table of Contents'}
            </h3>
            <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`block px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeSection === sec.id
                      ? 'bg-[#EAF5EF] text-[#043927] font-bold border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#05A764]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isAr ? sec.title_ar : sec.title_en}
                </a>
              ))}
            </nav>

            {/* Quick Contact Box */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-700">{isAr ? 'هل لديك استفسار قانوني؟' : 'Have a legal inquiry?'}</p>
              <a href="mailto:saqr.alindimaj@gmail.com" className="flex items-center gap-1.5 text-emerald-700 hover:underline">
                <Mail className="w-3.5 h-3.5" />
                <span>saqr.alindimaj@gmail.com</span>
              </a>
              <a href="tel:+966595974591" className="flex items-center gap-1.5 text-emerald-700 hover:underline">
                <PhoneCall className="w-3.5 h-3.5" />
                <span dir="ltr">+966 595 974 591</span>
              </a>
            </div>
          </div>

          {/* Right Main Legal Clauses Content */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-10 leading-relaxed text-slate-700 text-sm">
            
            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#043927]">
                <Building2 className="w-5 h-5 text-[#05A764]" />
                <h2 className="text-lg sm:text-xl font-bold">
                  {isAr ? '1. هويتنا القانونية وعن الشركة' : '1. Our Legal Identity & About Our Company'}
                </h2>
              </div>
              <p>
                <strong>“SaqrCart”</strong> is the commercial trade name of <strong>Saqr ALindimaj Trading Company (شركة صقر الاندماج)</strong>, a registered company established under the laws of the Kingdom of Saudi Arabia.
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span className="text-slate-400 block font-medium">Commercial Registration (CR):</span> <strong className="text-slate-800 text-sm">7052257016</strong></div>
                  <div><span className="text-slate-400 block font-medium">VAT Registration Number:</span> <strong className="text-slate-800 text-sm">314339742700003</strong></div>
                  <div><span className="text-slate-400 block font-medium">Official Commercial Brand:</span> <strong className="text-slate-800 text-sm">SaqrCart (صقر كارت)</strong></div>
                  <div><span className="text-slate-400 block font-medium">Official Online Store:</span> <strong className="text-slate-800 text-sm">www.SaqrCart.com</strong></div>
                </div>
              </div>

              <p>
                The name <em>“Saqr ALindimaj Trading Company”</em> is the official English translation of our Arabic company name as registered by the Saudi government authority. We operate commercially under the brand <strong>“SaqrCart”</strong> and our online store at <a href="http://www.saqrcart.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold underline">www.SaqrCart.com</a>.
              </p>
              <p>
                These Terms and Conditions govern your access to and use of our website, services, products, and online shopping facilities. By accessing our website or placing an order, you acknowledge that you have read, understood, and agreed to comply with these Terms and Conditions.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '2. أهلية العميل' : '2. Customer Eligibility'}
              </h2>
              <p>
                Our services are intended for individuals who are at least 18 years old or otherwise legally permitted to enter into binding agreements under applicable Saudi laws and regulations.
              </p>
              <p>
                Customers purchasing on behalf of a company or another legal entity confirm that they have the necessary authority to represent and legally bind that entity.
              </p>
              <p>
                By using “SaqrCart”, you confirm that all information provided by you is accurate, complete, and that you satisfy the applicable eligibility requirements.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '3. حسابات العملاء وأمان الموقع' : '3. Customer Accounts and Website Security'}
              </h2>
              <p>
                Certain website services may require customers to register an account. During registration, customers must submit genuine, accurate, and up-to-date information and maintain its accuracy whenever changes occur.
              </p>
              <p>
                Customers may also place orders through the guest checkout facility without creating a permanent account.
              </p>
              <p>
                Each registered customer is solely responsible for keeping their login credentials confidential and ensuring that their account is not accessed or used by unauthorized individuals. Any suspected misuse, security breach, or unauthorized account activity should be reported to us immediately.
              </p>
              <p>
                SaqrCart reserves the right to restrict, suspend, or close accounts where fraudulent activity, misuse, or violations of these Terms are identified.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-24 space-y-4 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '4. الطلبات، الدفع، الإلغاء والاسترجاع' : '4. Orders, Payments, Cancellations and Returns'}
              </h2>
              
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Order Submission and Confirmation:</h4>
                <p>
                  Submitting an order through our website represents the customer&apos;s intention to purchase the selected products. An order will be treated as confirmed once the applicable payment has been successfully received and verified through our authorized payment service provider.
                </p>
                <p>
                  An order confirmation notification will normally be sent to the customer&apos;s registered email address and via SMS to their registered mobile number.
                </p>
                <p>
                  SaqrCart reserves the right to decline or cancel an order where necessary, including circumstances involving incorrect product information, pricing errors, stock shortages, payment verification issues, or suspected fraudulent activity. If the Company cancels an order after receiving payment, the amount paid for that order will be refunded through the original payment channel, subject to the applicable payment provider&apos;s procedures.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-sm">Product Pricing & VAT:</h4>
                <p>
                  All prices displayed on SaqrCart are quoted in Saudi Riyals (SAR). Unless expressly indicated otherwise, displayed prices include applicable Value Added Tax (VAT 15%). We make reasonable efforts to maintain accurate pricing; however, corrections or updates may occasionally be necessary due to technical errors, supplier adjustments, or market conditions.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-sm">Payment Methods:</h4>
                <p>
                  Customers must complete payments using the payment options officially presented during checkout (including Mada, Visa, MasterCard, Apple Pay, and Cash on Delivery where supported). Transactions involving invalid payment information, unauthorized payment instruments, or suspected misuse may be declined or cancelled immediately.
                </p>
              </div>

              {/* Crucial Callout: Frozen & Chilled Goods */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Important Chilled & Frozen Food Return Policy</span>
                </div>
                <p className="text-xs leading-relaxed font-semibold">
                  Frozen and chilled items are non-refundable and non-returnable once received by the customer due to cold-chain health and hygiene safety standards.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-sm">Reporting Problems with Delivered Products:</h4>
                <p>
                  Customers are encouraged to examine their deliveries immediately upon receipt. Any concerns relating to missing items, incorrect products, damaged goods, or other order discrepancies should be reported within <strong>14 days of delivery</strong>.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <p><strong>WhatsApp Support:</strong> +966 595 974 591</p>
                  <p><strong>Support Email:</strong> saqr.alindimaj@gmail.com</p>
                  <p><strong>Telephone Support:</strong> +966 595 974 591</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-sm">Refund Processing:</h4>
                <p>
                  Approved refunds will generally be initiated within <strong>10 days</strong> and returned to the customer&apos;s eligible bank account or original payment method, depending on the payment arrangement and banking procedures.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '5. حملات الخصم والعروض الترويجية' : '5. Discount Campaigns and Promotional Offers'}
              </h2>
              <p>
                From time to time, SaqrCart may provide promotional discounts, special campaigns, voucher codes, or other customer incentives. Each promotion may have its own eligibility requirements, validity period, and usage restrictions.
              </p>
              <p>
                Unless explicitly stated otherwise, promotional codes cannot be combined with other discounts or special offers. The Company reserves the right to amend, suspend, or withdraw a promotional campaign where commercially or operationally necessary, subject to applicable consumer protection requirements.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '6. سياسة الشحن والتوصيل' : '6. Shipping and Delivery Policy'}
              </h2>
              <p>
                <strong>Delivery Coverage:</strong> SaqrCart currently offers delivery services across the <strong>Makkah city</strong> of the Kingdom of Saudi Arabia, subject to product availability and delivery coverage at the customer&apos;s selected address.
              </p>
              <p>
                <strong>Shipping Charges:</strong> Standard shipping is offered free of charge to customers, unless a different arrangement or minimum order threshold is clearly communicated before checkout.
              </p>
              <p>
                <strong>Estimated Delivery Periods:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
                <li><strong>Standard Shipping:</strong> Normally 2–5 business days, or as per the schedule selected on the website.</li>
                <li><strong>Express Shipping:</strong> Same-day or express delivery may be available for qualifying products and orders placed before 2:00 PM.</li>
              </ul>
              <p className="text-xs text-slate-500">
                Delivery schedules may be extended during Eid holidays, official public holidays, peak shopping periods, or exceptional events outside our reasonable control.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '7. تفاصيل المنتجات، الصور، والتقييمات' : '7. Product Details, Images and Customer Feedback / Reviews'}
              </h2>
              <p>
                www.SaqrCart.com strives to provide accurate product descriptions, specifications, photographs, and information. Nevertheless, minor discrepancies and variations (such as color hue, dimensions, presentation, or packaging updates) may occur. The images and descriptions are for informational purposes only and do not necessarily indicate that the delivered product is defective.
              </p>
              <p>
                Customers who submit reviews, ratings, or feedback grant SaqrCart a non-exclusive, worldwide, royalty-free license to publish, display, and use that content in connection with its website and commercial activities. Offensive, unlawful, misleading, or abusive reviews may be removed at the Company&apos;s discretion.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '8. شروط بطاقات الدفع والمعاملات المالية' : '8. Payment Card and Financial Transaction Conditions'}
              </h2>
              <p>
                By submitting payment details, customers confirm that they are legally entitled to use the selected credit card, debit card, or other approved payment facility.
              </p>
              <p>
                All transactions remain subject to the rules, security requirements, and conditions established by the relevant card issuer, bank, or payment service provider. SaqrCart does not control the independent policies of financial institutions and is not responsible for their individual fees, processing restrictions, or account-related decisions.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '9. منصات وتطبيقات الطرف الثالث' : '9. Third-Party Platforms and Applications'}
              </h2>
              <p>
                Customers accessing SaqrCart through external platforms, mobile applications, or third-party distribution services may also be subject to the separate terms and policies of those providers. SaqrCart is not responsible for independent charges, restrictions, service interruptions, or disputes arising solely from third-party platforms.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '10. الاستخدام المقبول للموقع' : '10. Acceptable Use of Our Website'}
              </h2>
              <p>
                Customers must use SaqrCart responsibly and in strict accordance with the applicable laws and regulations of the Kingdom of Saudi Arabia. The following activities are prohibited:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                <li>Publishing unlawful, threatening, abusive, or offensive material.</li>
                <li>Attempting to access restricted systems, server databases, or another customer&apos;s account without permission.</li>
                <li>Interfering with the normal operation, security, or performance of the website.</li>
                <li>Using the platform for fraudulent, deceptive, or unauthorized commercial activities.</li>
                <li>Violating the intellectual property or legal rights of other parties.</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '11. ملكية محتوى الموقع' : '11. Ownership of Website Content'}
              </h2>
              <p>
                All materials published on SaqrCart—including branding, website design, written content, graphics, photographs, logos, software, and other digital assets—are protected by intellectual property laws. Such materials belong to <strong>Saqr Alindimaj Company LLC</strong> or the respective third-party licensors.
              </p>
              <p>
                No website content may be copied, republished, modified, distributed, or commercially exploited without obtaining the prior written permission from the relevant rights holder.
              </p>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '12. توفر الموقع وحدود المسؤولية' : '12. Website Availability and Liability'}
              </h2>
              <p>
                SaqrCart aims to maintain a reliable and accessible online shopping experience. However, uninterrupted website availability cannot be guaranteed. Temporary service interruptions may occur due to maintenance, technical faults, or circumstances beyond our reasonable control.
              </p>
              <p>
                To the maximum extent permitted under applicable Saudi law, the Company shall not be responsible for indirect or consequential losses arising from the use or temporary unavailability of the website.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '13. التعديلات على هذه الشروط' : '13. Changes to These Terms'}
              </h2>
              <p>
                Saqr Alindimaj Company LLC may revise these Terms and Conditions from time to time to reflect changes in its services, business operations, legal requirements, or website policies. The latest version will be published on <a href="http://www.saqrcart.com" className="text-emerald-700 underline font-semibold">www.SaqrCart.com</a> with its effective date.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '14. القانون الواجب التطبيق وتسوية النزاعات' : '14. Applicable Law and Dispute Resolution'}
              </h2>
              <p>
                These Terms and Conditions shall be interpreted, construed, and governed in accordance with the <strong>laws and regulations of the Kingdom of Saudi Arabia</strong>.
              </p>
              <p>
                Any disagreement arising from the use of SaqrCart, an order, or these Terms should initially be addressed through direct communication with our customer service team. Where an amicable resolution cannot be achieved, the dispute shall be referred to the competent judicial or dispute-resolution authorities in the Kingdom of Saudi Arabia.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="scroll-mt-24 space-y-3 pb-8 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-[#043927]">
                {isAr ? '15. تفويض الدفع، التحقق عبر OTP ونزاعات الاسترداد' : '15. Payment Authorization, OTP Verification and Chargeback Disputes'}
              </h2>
              <p>
                SaqrCart may use security measures such as one-time passwords (OTP), two-factor authentication (2FA), telephone verification, and other authentication procedures to help protect payment transactions.
              </p>
              <p>
                By completing a purchase, the customer confirms that they have authorized the payment transaction, are the legitimate cardholder or authorized user of the payment instrument, and that the submitted payment details are accurate. Where a transaction has been successfully authenticated and the order dispatched or delivered, any subsequent chargeback dispute will be verified against transaction and delivery records.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="scroll-mt-24 space-y-4 pt-2">
              <div className="flex items-center gap-2 text-[#043927]">
                <HelpCircle className="w-5 h-5 text-[#05A764]" />
                <h2 className="text-lg sm:text-xl font-bold">
                  {isAr ? '16. خدمة العملاء وبيانات التواصل الرسمية' : '16. Customer Support and Official Contact Details'}
                </h2>
              </div>
              <p>
                For assistance, order-related enquiries, complaints, or clarification regarding these Terms and Conditions, customers may reach our team through the following official channels:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3.5 bg-[#F5FBF7] rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Company:</span>
                  <strong className="text-slate-900 block text-sm">Saqr Alindimaj Company LLC</strong>
                  <span className="text-slate-500 font-arabic block">شركة صقر الاندماج التجارية</span>
                </div>
                <div className="p-3.5 bg-[#F5FBF7] rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Commercial Registration (CR):</span>
                  <strong className="text-slate-900 block text-sm">7052257016</strong>
                  <span className="text-slate-400 font-medium block mt-1">VAT Number:</span>
                  <strong className="text-slate-900 block text-sm">314339742700003</strong>
                </div>
                <div className="p-3.5 bg-[#F5FBF7] rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Email:</span>
                  <a href="mailto:saqr.alindimaj@gmail.com" className="text-emerald-700 font-bold text-sm underline block">
                    saqr.alindimaj@gmail.com
                  </a>
                </div>
                <div className="p-3.5 bg-[#F5FBF7] rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Phone / WhatsApp:</span>
                  <a href="https://wa.me/966595974591" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold text-sm block" dir="ltr">
                    +966 595 974 591
                  </a>
                </div>
              </div>

              <div className="pt-4 text-center text-xs text-slate-500 font-medium">
                Thank you for choosing SaqrCart. We appreciate your trust and look forward to providing you with a convenient, secure, and reliable grocery shopping experience.
              </div>
            </section>

          </div>
        </div>
      </div>

    </div>
  );
}
