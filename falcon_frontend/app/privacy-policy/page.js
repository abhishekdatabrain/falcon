'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Globe, Building2, Calendar } from 'lucide-react';

const PRIVACY_SECTIONS = [
  {
    id: 'introduction',
    title: 'INTRODUCTION',
    paragraphs: [
      'Saqr Alandimaj Company ("Company", "we", "us", or "our") operates Saqr Cart through its website, https://www.saqrcart.com/, and associated mobile applications (collectively referred to as the "Platforms").',
      'We respect your privacy and are committed to protecting the personal information of our customers, visitors, and users. This Privacy Policy explains how we collect, use, store, process, disclose, and protect your personal information when you access or use our Platforms and services.',
      'Saqr Cart operates as a single-vendor online grocery shopping business, offering customers the ability to purchase groceries, household essentials, personal care products, frozen foods, snacks, and other everyday products through retail and wholesale purchasing options.',
      'All products listed on Saqr Cart are offered and managed by Saqr Alandimaj Company. Orders are processed by our company, and deliveries are handled by our own delivery team.',
      'This Privacy Policy applies to all individuals who access our Platforms, create an account, browse products, place orders, communicate with our customer support team, or otherwise use our services.',
      'By accessing or using our Platforms, you acknowledge that you have read and understood this Privacy Policy and that your personal information may be processed as described herein and in accordance with applicable data protection laws, including the Saudi Personal Data Protection Law (PDPL) and its Implementing Regulations.',
    ],
  },
  {
    id: 'section-1',
    title: "1. WE DO NOT KNOWINGLY COLLECT CHILDREN'S PERSONAL DATA",
    paragraphs: [
      'Our Platforms and services are intended for individuals who are legally permitted to enter into transactions under applicable laws.',
      'We do not knowingly collect personal information directly from children without appropriate authorization or consent where required by law.',
      'If you are a parent or legal guardian and believe that your child has provided personal information to us without appropriate authorization, please contact us at info@saqrcart.com. We will take appropriate steps to review and address your request in accordance with applicable laws.',
    ],
  },
  {
    id: 'section-2',
    title: '2. WHAT PERSONAL DATA DO WE COLLECT?',
    paragraphs: [
      'We collect personal information necessary to provide, manage, and improve our grocery shopping services.',
      'The types of information we may collect include:',
    ],
    subsections: [
      {
        heading: 'A. Identity Information',
        bullets: [
          'First name and last name.',
          'Username or account identification.',
          'Date of birth, where required.',
          'Other identification details where necessary for verification or legal compliance.',
        ],
      },
      {
        heading: 'B. Contact Information',
        bullets: [
          'Mobile number and telephone number.',
          'Email address.',
          'Billing address, where applicable.',
          'Shipping and delivery address.',
          'Other contact details provided by you.',
        ],
      },
      {
        heading: 'C. Account Information',
        bullets: [
          'Account registration details.',
          'Login credentials and encrypted passwords.',
          'Account preferences.',
          'Saved delivery addresses.',
          'Shopping preferences and account settings.',
        ],
      },
      {
        heading: 'D. Order and Transaction Information',
        bullets: [
          'Products purchased or added to your shopping cart.',
          'Order history and order reference numbers.',
          'Order quantities and product preferences.',
          'Retail and wholesale purchase information.',
          'Order delivery and fulfillment details.',
          'Discounts, promotional codes, and coupon usage.',
          'Refunds, cancellations, returns, and exchange records.',
          'Cash on Delivery (COD) order and payment status.',
        ],
      },
      {
        heading: 'E. Cash on Delivery Information',
        paragraphs: [
          'Saqr Cart currently offers Cash on Delivery (COD) as its payment method.',
          'When you place an order using COD, we may collect and process information relating to:',
        ],
        bullets: [
          'Order amount payable upon delivery.',
          'COD payment status.',
          'Cash collection confirmation.',
          'Order delivery and payment records.',
          'Refund or adjustment information, where applicable.',
        ],
        afterParagraphs: [
          'We do not collect or store complete payment card details, such as card numbers or CVV codes, for COD transactions.',
        ],
      },
      {
        heading: 'F. Technical Information',
        paragraphs: [
          'When you access our Platforms, we may automatically collect certain technical information, including:',
        ],
        bullets: [
          'IP address.',
          'Device type and device identification.',
          'Browser type and version.',
          'Operating system.',
          'Mobile application version.',
          'Login timestamps.',
          'Time zone and language preferences.',
          'Website usage and browsing information.',
          'Cookies and similar tracking technologies.',
        ],
      },
      {
        heading: 'G. Location Information',
        paragraphs: ['We may collect location-related information, including:'],
        bullets: [
          'GPS-based device location, where you provide permission.',
          'Manually entered delivery addresses.',
          'Saved delivery locations.',
          'Location details selected during checkout.',
        ],
        afterParagraphs: [
          'This information helps us determine delivery availability, service areas, applicable delivery charges, and estimated delivery times.',
          'You may choose to enter your delivery address manually instead of granting GPS access. However, certain location-based features may not work without location permission.',
        ],
      },
      {
        heading: 'H. Communication Information',
        paragraphs: ['We may collect information relating to your communications with us, including:'],
        bullets: [
          'Customer support requests.',
          'Complaints and feedback.',
          'Email and WhatsApp communications.',
          'Product reviews and ratings.',
          'Survey responses.',
          'Other correspondence with our team.',
        ],
      },
      {
        heading: 'I. Marketing and Preference Information',
        paragraphs: [
          'We may collect information about your preferences regarding promotional offers, discounts, product recommendations, newsletters, and marketing communications.',
        ],
      },
      {
        heading: 'J. Aggregated Information',
        paragraphs: [
          'We may also collect statistical and aggregated information about how users interact with our Platforms. Such information may be used for analytics and business improvement, provided it does not identify you personally.',
        ],
      },
    ],
  },
  {
    id: 'section-3',
    title: '3. HOW DO WE COLLECT YOUR PERSONAL DATA?',
    paragraphs: ['We collect personal information through the following methods:'],
    subsections: [
      {
        heading: 'A. Directly From You',
        paragraphs: ['We collect information when you:'],
        bullets: [
          'Register or create an account on our website or mobile application.',
          'Browse products or use our shopping services.',
          'Add products to your cart or wishlist.',
          'Place retail or wholesale orders.',
          'Select Cash on Delivery (COD) during checkout.',
          'Enter or save your delivery address.',
          'Allow GPS access for location-based services.',
          'Request a return, refund, or exchange.',
          'Contact our customer support team.',
          'Submit reviews, ratings, or feedback.',
          'Subscribe to promotional offers or newsletters.',
          'Participate in contests, surveys, or promotional campaigns.',
          'Communicate with us through email, telephone, WhatsApp, or other available channels.',
        ],
      },
      {
        heading: 'B. Automatically Through Our Platforms',
        paragraphs: [
          'Certain information may be collected automatically when you visit or interact with our website or mobile application.',
          'This may include IP addresses, device information, browsing behavior, pages visited, session details, and other technical information through cookies, log files, analytics tools, and similar technologies.',
        ],
      },
      {
        heading: 'C. From Third-Party Service Providers',
        paragraphs: ['We may receive relevant information from third parties that support our business operations, including:'],
        bullets: [
          'Technology and hosting service providers.',
          'Website and application maintenance providers.',
          'Marketing and advertising service providers.',
          'Analytics providers.',
          'Social media platforms, where you interact with our business through them.',
          'Fraud prevention and verification service providers.',
          'Communication and notification service providers.',
        ],
        afterParagraphs: [
          'If you provide personal information relating to another individual, you confirm that you are authorized to share that information with us and that any required consent has been obtained.',
        ],
      },
    ],
  },
  {
    id: 'section-4',
    title: '4. COOKIES AND SIMILAR TECHNOLOGIES',
    paragraphs: [
      'We use cookies and similar technologies to improve your experience on our website and understand how visitors interact with our Platforms.',
      'Cookies are small text files stored on your device that help websites remember information about your visits.',
      'We may use cookies for the following purposes:',
    ],
    bullets: [
      'To remember your login sessions and account preferences.',
      'To maintain shopping cart information.',
      'To improve website functionality and performance.',
      'To understand visitor behavior and website traffic.',
      'To analyze product searches and browsing activities.',
      'To provide relevant advertisements and promotional offers, where permitted.',
      'To improve the overall shopping experience.',
    ],
    afterParagraphs: [
      'You may control or disable cookies through your browser settings or available cookie preference tools.',
      'Where required by applicable law, we will obtain your consent before using non-essential cookies or similar tracking technologies.',
      'Please note that disabling certain cookies may affect the functionality of our website and some services may not operate as intended.',
    ],
  },
  {
    id: 'section-5',
    title: '5. WHY DO WE COLLECT AND USE YOUR PERSONAL DATA?',
    paragraphs: ['We collect and process your personal information for the following business and operational purposes:'],
    subsections: [
      {
        heading: 'A. Account Management',
        bullets: [
          'To create and manage customer accounts.',
          'To verify user information where necessary.',
          'To enable login and account authentication.',
          'To maintain customer profiles and preferences.',
        ],
      },
      {
        heading: 'B. Order Processing and Fulfillment',
        bullets: [
          'To process and confirm customer orders.',
          'To manage shopping carts and checkout activities.',
          'To prepare and fulfill retail and wholesale orders.',
          'To manage product availability and order quantities.',
          'To coordinate product packaging and delivery.',
          'To provide order confirmation and delivery updates.',
          'To manage cancellations, returns, exchanges, and refunds.',
        ],
      },
      {
        heading: 'C. Cash on Delivery Processing',
        bullets: [
          'To provide COD as the available payment option.',
          'To communicate the payable order amount.',
          'To record cash collection by our delivery team.',
          'To update order payment status.',
          'To maintain transaction and order records.',
          'To manage payment-related complaints or discrepancies.',
        ],
      },
      {
        heading: 'D. Delivery and Location Services',
        bullets: [
          'To verify delivery addresses.',
          'To identify available delivery locations.',
          'To calculate delivery charges.',
          'To assign orders to our internal delivery team.',
          'To provide delivery status and updates.',
          'To coordinate deliveries with our authorized delivery staff.',
        ],
      },
      {
        heading: 'E. Customer Support',
        bullets: [
          'To respond to customer questions and complaints.',
          'To resolve order-related issues.',
          'To provide assistance with COD payments, refunds, and deliveries.',
          'To improve customer service quality.',
        ],
      },
      {
        heading: 'F. Marketing and Promotions',
        bullets: [
          'To communicate special offers, discounts, and promotional campaigns.',
          'To inform customers about new products and services.',
          'To provide personalized product recommendations.',
          'To send promotional notifications through WhatsApp, email, and push notifications, where permitted and subject to applicable consent requirements.',
        ],
        afterParagraphs: [
          'You may opt out of promotional communications at any time using the available unsubscribe option, notification settings, or by contacting us.',
        ],
      },
      {
        heading: 'G. Website and Application Improvement',
        bullets: [
          'To improve website and mobile application functionality.',
          'To analyze shopping trends and customer preferences.',
          'To identify technical errors and resolve performance issues.',
          'To develop new features and improve existing services.',
        ],
      },
      {
        heading: 'H. Security and Fraud Prevention',
        bullets: [
          'To protect customer accounts and transactions.',
          'To detect suspicious activities.',
          'To prevent unauthorized access and fraudulent orders.',
          'To protect our business, customers, and Platforms.',
        ],
      },
      {
        heading: 'I. Legal and Regulatory Compliance',
        bullets: [
          'To comply with applicable laws and regulations.',
          'To maintain business, financial, and transaction records.',
          'To respond to lawful requests from regulatory authorities.',
          'To protect our legal rights and interests.',
        ],
      },
    ],
  },
  {
    id: 'section-6',
    title: '6. HOW DO WE USE YOUR PERSONAL DATA?',
    paragraphs: [
      'We process your personal information only where we have an appropriate legal basis under applicable data protection laws.',
      'Depending on the circumstances, these legal bases may include:',
    ],
    subsections: [
      {
        heading: 'A. Contractual Necessity',
        paragraphs: [
          'We process your information to create your account, accept and fulfill orders, arrange deliveries, manage COD transactions, and provide services requested by you.',
        ],
      },
      {
        heading: 'B. Legal and Regulatory Obligations',
        paragraphs: [
          'We may process your information to comply with applicable legal, tax, accounting, consumer protection, and regulatory requirements.',
        ],
      },
      {
        heading: 'C. Legitimate Business Interests',
        paragraphs: [
          'We may process certain information to improve our services, maintain security, prevent fraud, manage business operations, and enhance the customer experience, where such processing is permitted under applicable law and does not override your rights.',
        ],
      },
      {
        heading: 'D. Consent',
        paragraphs: [
          'Where required by law, we will obtain your consent before processing personal information for specific purposes, including certain marketing activities, optional cookies, or GPS-based location services.',
          'You may withdraw your consent at any time, subject to applicable legal requirements and any consequences this may have for the services you use.',
        ],
      },
    ],
  },
  {
    id: 'section-7',
    title: '7. WHO DO WE SHARE YOUR PERSONAL DATA WITH?',
    paragraphs: [
      'We do not sell your personal information to third parties.',
      'However, we may share relevant personal information with authorized individuals and trusted service providers when necessary to operate our business and provide our services.',
      'These may include:',
    ],
    subsections: [
      {
        heading: 'A. Our Internal Delivery Team',
        paragraphs: [
          'Saqr Cart manages deliveries through its own delivery team.',
          'We may share relevant customer information with our authorized delivery staff, including:',
        ],
        bullets: [
          'Customer name.',
          'Contact number.',
          'Delivery address.',
          'Order details.',
          'Delivery instructions.',
          'Order amount payable upon delivery.',
          'COD payment status, where necessary.',
        ],
        afterParagraphs: [
          'This information is shared only to prepare, deliver, and complete customer orders, collect COD payments, and provide delivery-related assistance.',
          'Our delivery staff are expected to handle customer information confidentially and use it only for authorized business purposes.',
        ],
      },
      {
        heading: 'B. Technology and Hosting Service Providers',
        paragraphs: [
          'We may share relevant information with technology providers, website developers, mobile application service providers, and hosting providers who help us operate, maintain, secure, and improve our Platforms.',
        ],
      },
      {
        heading: 'C. Marketing and Communication Service Providers',
        paragraphs: [
          'We may share limited information with authorized service providers that help us send WhatsApp messages, emails, push notifications, promotional communications, and customer updates.',
        ],
      },
      {
        heading: 'D. Analytics and Security Providers',
        paragraphs: [
          'We may share certain technical or usage information with analytics, cybersecurity, fraud prevention, and technical support providers to maintain and improve our Platforms.',
        ],
      },
      {
        heading: 'E. Government and Regulatory Authorities',
        paragraphs: [
          'We may disclose personal information where required by applicable laws, regulations, court orders, or lawful requests from competent government authorities.',
        ],
      },
      {
        heading: 'F. Professional and Legal Advisors',
        paragraphs: [
          'We may share relevant information with our legal, accounting, auditing, or professional advisors when necessary for legitimate business or legal purposes.',
          'We require service providers who process personal information on our behalf to protect it and use it only for authorized purposes, in accordance with applicable legal requirements.',
        ],
      },
    ],
  },
  {
    id: 'section-8',
    title: '8. WHERE DO WE STORE YOUR PERSONAL DATA?',
    paragraphs: [
      'We currently use hosting infrastructure located in the Kingdom of Saudi Arabia to store and manage personal information collected through our Platforms.',
      'We take reasonable steps to ensure that customer information is stored securely and accessed only by authorized personnel and service providers.',
      'However, certain third-party services, such as communication tools, analytics platforms, technical support services, or application integrations, may process limited information outside Saudi Arabia.',
      'Where personal data is transferred or accessed outside the Kingdom, we will ensure that such transfers are carried out in accordance with the Saudi PDPL, its Implementing Regulations, and applicable cross-border data transfer requirements.',
    ],
  },
  {
    id: 'section-9',
    title: '9. HOW LONG DO WE RETAIN YOUR PERSONAL DATA?',
    paragraphs: [
      'We retain personal information only for as long as necessary to fulfill the purposes for which it was collected, including:',
    ],
    bullets: [
      'Managing customer accounts.',
      'Processing and delivering orders.',
      'Maintaining COD payment and transaction records.',
      'Handling customer complaints and support requests.',
      'Managing returns, refunds, and exchanges.',
      'Meeting legal, accounting, tax, and regulatory obligations.',
      'Resolving disputes and protecting our legal rights.',
    ],
    afterParagraphs: [
      'When personal information is no longer required for these purposes, we will securely delete, destroy, or anonymize it, unless we are legally required or permitted to retain it for a longer period.',
      'The retention period may vary depending on the type of information and applicable legal requirements.',
    ],
  },
  {
    id: 'section-10',
    title: '10. HOW DO WE PROTECT YOUR PERSONAL DATA?',
    paragraphs: [
      'We take reasonable technical, organizational, and administrative measures to protect personal information against unauthorized access, misuse, alteration, disclosure, loss, or destruction.',
      'These measures may include:',
    ],
    bullets: [
      'Restricted access to customer information.',
      'Password protection and authentication controls.',
      'Secure hosting and database management.',
      'Appropriate access permissions for employees.',
      'Monitoring and security measures.',
      'Regular system maintenance and updates.',
      'Confidentiality obligations for authorized personnel.',
      'Appropriate data backup and recovery measures.',
    ],
    afterParagraphs: [
      'Although we take reasonable steps to protect your information, no website, application, or electronic transmission can be guaranteed to be completely secure.',
    ],
  },
  {
    id: 'section-11',
    title: '11. PERSONAL DATA BREACHES',
    paragraphs: [
      'In the event of a personal data breach, unauthorized access, loss, or disclosure of personal information, we will take appropriate steps to investigate, contain, and address the incident.',
      'Where required under applicable Saudi data protection laws, we will notify the competent authority within the legally prescribed timeframe, including the applicable 72-hour notification requirement for reportable incidents.',
      'We will also notify affected individuals where required by applicable law, particularly where the incident may cause harm to their personal data or affect their rights and interests.',
    ],
  },
  {
    id: 'section-12',
    title: '12. YOUR RIGHTS UNDER SAUDI PERSONAL DATA PROTECTION LAW (PDPL)',
    paragraphs: [
      'Subject to applicable laws and legal exceptions, individuals may have the following rights regarding their personal information:',
    ],
    subsections: [
      {
        heading: 'A. Right to Be Informed',
        paragraphs: ['You have the right to know how and why your personal information is collected and processed.'],
      },
      {
        heading: 'B. Right to Access',
        paragraphs: ['You may request access to the personal information we hold about you, subject to applicable legal requirements.'],
      },
      {
        heading: 'C. Right to Obtain Your Personal Data',
        paragraphs: ['You may request to receive your personal information in a clear and readable format, where applicable.'],
      },
      {
        heading: 'D. Right to Request Correction',
        paragraphs: ['You may request that we correct, complete, or update inaccurate or incomplete personal information.'],
      },
      {
        heading: 'E. Right to Request Destruction',
        paragraphs: ['You may request the destruction of your personal information where applicable, subject to legal obligations and permitted exceptions.'],
      },
      {
        heading: 'F. Right to Withdraw Consent',
        paragraphs: ['Where processing is based on your consent, you may withdraw that consent at any time.'],
      },
    ],
    afterParagraphs: [
      'To exercise your rights, please contact us at:',
      'Email: info@saqrcart.com',
      'We may request reasonable information to verify your identity before processing your request.',
      'We will respond to valid requests within the period required by applicable law. Under the applicable Implementing Regulations, requests concerning data subject rights are generally handled within 30 days, subject to permitted extensions and exceptions.',
    ],
  },
  {
    id: 'section-13',
    title: '13. MARKETING COMMUNICATIONS AND NOTIFICATIONS',
    paragraphs: ['We may send you promotional and service-related communications through:'],
    bullets: [
      'WhatsApp messages.',
      'Email.',
      'Mobile application push notifications.',
    ],
    afterParagraphs: [
      'Service-related communications may include order confirmations, delivery updates, COD payment reminders, account notifications, and customer support messages.',
      'Promotional communications may include special offers, discounts, product recommendations, new product announcements, and marketing campaigns.',
      'Where required by applicable law, we will obtain your consent before sending promotional communications.',
      'You may opt out of promotional communications at any time by:',
    ],
    afterBullets: [
      'Using the unsubscribe option in emails, where available.',
      'Adjusting push notification settings on your device.',
      'Following the available WhatsApp opt-out instructions.',
      'Contacting us at info@saqrcart.com.',
    ],
    closingParagraphs: [
      'Please note that opting out of promotional communications will not prevent us from sending essential service-related messages about your account or orders.',
    ],
  },
  {
    id: 'section-14',
    title: '14. ACCOUNT DELETION AND PERSONAL DATA REQUESTS',
    paragraphs: [
      'You may request the deletion of your Saqr Cart account by contacting us at info@saqrcart.com or through any account deletion option made available within our Platforms.',
      'Upon receiving your request, we will review and process it in accordance with applicable laws.',
      'Please note that certain information may need to be retained for legal, tax, accounting, regulatory, fraud prevention, or dispute resolution purposes, even after an account deletion request.',
    ],
  },
  {
    id: 'section-15',
    title: '15. THIRD-PARTY WEBSITES AND SERVICES',
    paragraphs: [
      'Our Platforms may contain links to third-party websites, applications, or services.',
      'These third-party services may have their own privacy policies and data handling practices. We are not responsible for the privacy practices, content, or security of third-party websites or services that are not operated by us.',
      'We encourage users to review the privacy policies of third-party services before sharing personal information with them.',
    ],
  },
  {
    id: 'section-16',
    title: '16. CHANGES TO THIS PRIVACY POLICY',
    paragraphs: [
      'We may update or modify this Privacy Policy from time to time to reflect changes in our business operations, services, technology, or applicable laws and regulations.',
      'Any updates will be published on our website and may also be communicated through our mobile application or other appropriate communication channels.',
      'The updated policy will become effective from the date stated at the beginning of the revised Privacy Policy.',
      'We encourage users to review this page periodically to remain informed about how we collect, use, and protect personal information.',
    ],
  },
  {
    id: 'section-17',
    title: '17. CONTACT US',
    paragraphs: [
      'If you have any questions, concerns, complaints, or requests regarding this Privacy Policy or the processing of your personal information, you may contact us using the details below:',
      'Company Name: Saqr Alandimaj Company',
      'Business Name: Saqr Cart',
      'Website: https://www.saqrcart.com/',
      'Email: info@saqrcart.com',
      'Registered Address: [Insert Complete Registered Business Address, Saudi Arabia]',
      'Commercial Registration Number: [Insert CR Number, if applicable]',
      'We will review and respond to your privacy-related requests in accordance with applicable laws and regulations.',
      'End of Privacy Policy',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FBFDFB] text-slate-800 pb-20">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-[#022C22] via-[#043927] to-[#064E3B] text-white py-12 sm:py-16 px-4 border-b border-emerald-900/40">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Saqr Cart – Saqr Alandimaj Company</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            PRIVACY POLICY
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs sm:text-sm text-emerald-100/90">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Saqr Alandimaj Company</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-300 shrink-0" />
              <a href="https://www.saqrcart.com/" className="underline hover:text-white">
                https://www.saqrcart.com/
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-300 shrink-0" />
              <a href="mailto:info@saqrcart.com" className="underline hover:text-white">
                info@saqrcart.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Effective: 26 November 2026</span>
            </div>
          </div>
          <p className="text-xs text-emerald-200/80">
            Effective Date: 26 November 2026 &bull; Last Updated: 26 November 2026
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Table of Contents */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
            Contents
          </h2>
          <nav className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
            {PRIVACY_SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="block text-xs font-semibold text-slate-600 hover:text-[#043927] hover:bg-emerald-50/70 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                {sec.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Policy Body */}
        <main className="lg:col-span-8 space-y-6">
          {PRIVACY_SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-3 scroll-mt-24"
            >
              <h2 className="text-base sm:text-lg font-extrabold text-[#043927] tracking-tight">
                {sec.title}
              </h2>

              {sec.paragraphs?.map((p, idx) => (
                <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                  {p}
                </p>
              ))}

              {sec.bullets && (
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
                  {sec.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}

              {sec.subsections?.map((sub, subIdx) => (
                <div key={subIdx} className="pt-2 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">{sub.heading}</h3>
                  {sub.paragraphs?.map((p, pIdx) => (
                    <p key={pIdx} className="text-sm text-slate-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                  {sub.bullets && (
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
                      {sub.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {sub.afterParagraphs?.map((p, aIdx) => (
                    <p key={aIdx} className="text-sm text-slate-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              ))}

              {sec.afterParagraphs?.map((p, idx) => (
                <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                  {p}
                </p>
              ))}

              {sec.afterBullets && (
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
                  {sec.afterBullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}

              {sec.closingParagraphs?.map((p, idx) => (
                <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          ))}

          
        </main>
      </div>
    </div>
  );
}
