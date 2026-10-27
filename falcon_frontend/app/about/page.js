'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  Leaf,
  ShieldCheck,
  Truck,
  Users,
  Recycle,
  Zap,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Share2,
  Droplets,
  Sun,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen bg-[#FBFDFB] pb-24 text-slate-800 space-y-16 sm:space-y-24">
      
      {/* ================= SECTION 1: HERO BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-[#EAF5EF] border border-[#CDE5D7] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#064E3B]">
              <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse"></span>
              <span>{isAr ? 'قصتنا ومهمتنا' : 'Our Story & Mission'}</span>
            </div>

            {/* Main Hero Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#043927] leading-[1.14] tracking-tight">
              {isAr
                ? 'جذور ممتدة في الطزاجة، تصل إلى باب منزلك.'
                : 'Rooted in Freshness,\nDelivered to Your\nDoorstep.'}
            </h1>

            {/* Paragraph Descriptions */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              <p>
                {isAr
                  ? 'تمكين العائلات السعودية بمقاضي طازجة ومستدامة من المزرعة إلى المائدة مباشرة في غضون 30 دقيقة. انطلقت فالكون ماركت من قلب الرياض بناءً على سؤال جوهري: لماذا تقضي الأغذية الطازجة أسبوعين في مستودعات التبريد التقليدية قبل أن تصل لمائدة عائلتك؟'
                  : 'Empowering Saudi households with fresh, sustainable, farm-to-table groceries delivered in as little as 30 minutes. Founded in the heart of Riyadh, FreshMart was born from a fundamental question: why should fresh food spend two weeks in static cold-storage depots before reaching your family\'s dinner table?'}
              </p>
              <p>
                {isAr
                  ? 'لقد جسّرنا الفجوة بالشراكة المباشرة مع مزارعي الهيدروبونيك المحليين في الرياض، ومزارعي التمور التقليديين، والتعاونيات الزراعية الحديثة من الخرج إلى الجوف — لنقدم لك منتجات حُصدت في ذات الصباح مباشرة إلى مطبخك.'
                  : 'We bridged the gap by partnering directly with local Saudi hydroponic cultivators, traditional date growers, and modern agricultural cooperatives across Al-Kharj to Al-Jouf — delivering produce harvested that very morning straight to your kitchen.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? 'استكشف شركاء المزارع' : 'Explore Farm Partners'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-emerald-300" />
              </Link>
              <a
                href="#standards"
                className="px-6 py-3.5 rounded-full bg-white border border-[#043927]/30 hover:border-[#043927] text-[#043927] font-bold text-xs shadow-2xs hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#05A764]" />
                <span>{isAr ? 'معايير الجودة لدينا' : 'Our Quality Standard'}</span>
              </a>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl aspect-[4/3] bg-emerald-950">
              <img
                src="/images/about/greenhouse.jpg"
                alt="Saudi Hydroponic Vertical Farm Harvest"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Badge Top Right */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/90 text-slate-800 text-[11px] font-bold shadow-md flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#05A764]" />
                <span className="text-slate-500 font-medium">{isAr ? 'جودة موثقة' : 'Verified Quality'}</span>
                <span className="font-bold text-[#043927]">{isAr ? 'سلسلة تبريد 100%' : '100% Cold-Chain'}</span>
              </div>

              {/* Overlay Floating Card Bottom */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 text-slate-900 flex items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] text-[#05A764] flex items-center justify-center shrink-0 text-base font-bold">
                    🌱
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      {isAr ? 'من الحصاد الفوري إلى بابك' : 'Dawn Harvest to Doorstep'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isAr ? 'أقل من 12 ساعة من المزرعة للمستهلك' : 'Under 12 hours guaranteed farm-to-hand time'}
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-[#043927] border border-emerald-300 font-black text-[9px] uppercase px-2.5 py-1 rounded-md tracking-wider">
                  {isAr ? 'مضمون' : 'GUARANTEED'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 2: KEY METRIC STATS BAR ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#043927] text-white rounded-3xl p-7 sm:p-10 shadow-xl border border-emerald-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative overflow-hidden">
          
          {/* Stat 1 */}
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-emerald-800/70 pb-6 sm:pb-0 pr-0 sm:pr-6 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/70 flex items-center justify-center text-[#34D399]">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">2M+</div>
            <h4 className="font-bold text-xs text-[#34D399]">
              {isAr ? 'طلبات طازجة تم توصيلها' : 'Fresh Orders Delivered'}
            </h4>
            <p className="text-[11px] text-emerald-100/70 font-medium leading-relaxed">
              {isAr ? 'عبر الرياض، جدة، الخبر، الدمام و12 مدينة أخرى.' : 'Across Riyadh, Jeddah, Khobar, Dammam & 12 other urban hubs.'}
            </p>
          </div>

          {/* Stat 2 */}
          <div className="space-y-2 border-b sm:border-b-0 lg:border-r border-emerald-800/70 pb-6 sm:pb-0 pr-0 lg:pr-6 rtl:lg:border-r-0 rtl:lg:border-l rtl:pr-0 rtl:pl-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/70 flex items-center justify-center text-[#34D399]">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">250+</div>
            <h4 className="font-bold text-xs text-[#34D399]">
              {isAr ? 'مزرعة شريكة محلية' : 'Local Farm Partners'}
            </h4>
            <p className="text-[11px] text-emerald-100/70 font-medium leading-relaxed">
              {isAr ? 'مزارع هيدروبونيك وعضوية سعودية معتمدة بعقود مباشرة.' : 'Certified organic and hydroponic Saudi growers under direct contract.'}
            </p>
          </div>

          {/* Stat 3 */}
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-emerald-800/70 pb-6 sm:pb-0 pr-0 sm:pr-6 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/70 flex items-center justify-center text-[#34D399]">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">&lt; 12h</div>
            <h4 className="font-bold text-xs text-[#34D399]">
              {isAr ? 'سرعة التوصيل بعد الحصاد' : 'Harvest-to-Door Speed'}
            </h4>
            <p className="text-[11px] text-emerald-100/70 font-medium leading-relaxed">
              {isAr ? 'من قطف الصباح إلى بابك بعد الظهر مع الحفاظ الكامل على المغذيات.' : 'Morning pick to afternoon delivery, keeping nutrients fully intact.'}
            </p>
          </div>

          {/* Stat 4 */}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/70 flex items-center justify-center text-[#34D399]">
              <Star className="w-4.5 h-4.5 fill-[#34D399]" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">99.4%</div>
            <h4 className="font-bold text-xs text-[#34D399]">
              {isAr ? 'نسبة رضا الطزاجة' : 'Freshness Satisfaction'}
            </h4>
            <p className="text-[11px] text-emerald-100/70 font-medium leading-relaxed">
              {isAr ? 'مقاسة بتقييمات العملاء الموثقة ومؤشر جودة المحصول اليومي.' : 'Measured by verified Saudi customer reviews and freshness index.'}
            </p>
          </div>

        </div>
      </section>

      {/* ================= SECTION 3: THE PRINCIPLES THAT GUIDE EVERY BASKET ================= */}
      <section id="standards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-[#EAF5EF] border border-[#CDE5D7] px-3 py-1 rounded-full text-[10px] font-bold text-[#064E3B] tracking-wider uppercase">
            <span>🌱</span>
            <span>{isAr ? 'مبادئنا الأساسية' : 'GUIDING PRINCIPLES'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
            {isAr ? 'المبادئ التي تقود كل سلة مقاضي' : 'The Principles That Guide Every Basket'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            {isAr
              ? 'كل تفاحة، علبة حليب، ورأس خس تخضع لأربعة معايير تشغيلية صارمة لا تقبل المساومة.'
              : 'Every apple, bottle of milk, and head of crisp romaine is handled according to four non-negotiable operational standards.'}
          </p>
        </div>

        {/* 4 Core Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold border border-cyan-100">
                <ShieldCheck className="w-4.5 h-4.5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                01. QUALITY PROTOCOL
              </span>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {isAr ? 'طزاجة لا تقبل المساومة' : 'Uncompromised Freshness'}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {isAr
                  ? 'تخضع كل شحنة لفحص جودة يدوي وإلكتروني إلزامي يشمل 17 نقطة قبل الانطلاق. إذا وُجد أي عيب، لا يدخل المنتج سلتك أبداً.'
                  : 'Every shipment passes a mandatory 17-point physical freshness inspection prior to dispatch. If a leaf isn\'t crisp or a fruit shows blemishes, it never enters your grocery bag.'}
              </p>
            </div>
            <a href="#standards" className="text-xs font-bold text-[#05A764] hover:text-[#043927] flex items-center gap-1 pt-2">
              <span>{isAr ? 'بروتوكول فحص الـ 17 نقطة' : '17-Point Visual Check'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                <Users className="w-4.5 h-4.5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                02. ECONOMIC IMPACT
              </span>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {isAr ? 'دعم وتمكين المزارع المحلي' : 'Championing Local Growers'}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {isAr
                  ? 'نوقع عقوداً مباشرة بأسعار عادلة تتجاوز وسطاء التجارة التقليديين. يحصل شركاؤنا على تسويات مالية فورية وطلب مستدام لإعادة الاستثمار في أراضيهم.'
                  : 'We sign direct, fair-value contracts that eliminate predatory commodity brokers. Our partners receive prompt settlements and predictable demand to invest back into their soil.'}
              </p>
            </div>
            <a href="#farmers" className="text-xs font-bold text-[#05A764] hover:text-[#043927] flex items-center gap-1 pt-2">
              <span>{isAr ? 'التجارة العادلة المباشرة' : 'Direct Fair Trade'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-100">
                <Recycle className="w-4.5 h-4.5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                03. GREEN FLEET
              </span>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {isAr ? 'تغليف صديق للبيئة' : 'Eco-Conscious Packaging'}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {isAr
                  ? 'نستخدم حاويات عازلة للحرارة قابلة لإعادة التدوير بنسبة 100% وألغينا أكياس البلاستيك أحادية الاستخدام تماماً لتقليل البصمة الكربونية.'
                  : 'We use 100% recyclable cold-chain insulated totes and eliminated single-use polypropylene bags. Customer return program allows totes to be sanitized and reused.'}
              </p>
            </div>
            <a href="#sustainability" className="text-xs font-bold text-[#05A764] hover:text-[#043927] flex items-center gap-1 pt-2">
              <span>{isAr ? 'معيار صفر بلاستيك' : 'Zero Single-Use Plastic'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                <Zap className="w-4.5 h-4.5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                04. MICRO-HUBS
              </span>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {isAr ? 'سرعة مقرونة بالدقة' : 'Speed with Precision'}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {isAr
                  ? 'شبكة من 32 مركز تبريد مصغر داخل أحياء المدن السعودية تضمن وصول طلبك مبرداً بأقل من 4 درجات مئوية حتى في أشد أيام الصيف حرارة.'
                  : 'Our 32 proprietary cold-storage micro-fulfillment pods across major Saudi neighborhoods guarantee low-cold delivery temperatures even during the hottest summer afternoons.'}
              </p>
            </div>
            <a href="#micro-hubs" className="text-xs font-bold text-[#05A764] hover:text-[#043927] flex items-center gap-1 pt-2">
              <span>{isAr ? 'ضمان التبريد تحت 4°م' : 'Sub-4°C Guarantee'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </section>

      {/* ================= SECTION 4: FEATURED SAUDI FARMER SPOTLIGHT ================= */}
      <section id="farmers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Farmer Portrait */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-slate-200 shadow-md bg-emerald-950">
              <img
                src="/images/about/farmer.jpg"
                alt="Saudi Master Farmer holding fresh harvest"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 text-white text-[11px] font-bold shadow-md flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                <span className="truncate">{isAr ? 'مزارع محلي معتمد • واحة الخرج' : 'Verified Local Grower • Al-Kharj Oasis'}</span>
              </div>
            </div>
          </div>

          {/* Right Farm Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-[#EAF5EF] px-3 py-1 rounded-full border border-[#CDE5D7] inline-block">
                🇸🇦 KINGDOM FIRST • LOCAL AGRICULTURAL VENTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight leading-tight">
                {isAr
                  ? 'شراكة مباشرة مع أكثر من 250 مزرعة سعودية'
                  : 'Partnering Directly with Over 250+ Saudi Farms'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                {isAr
                  ? 'تشهد الزراعة الوطنية نهضة مستدامة غير مسبوقة. عبر البيوت المحمية الذكية وتقنيات الهيدروبونيك، ينتج مزارعونا أجود أنواع الخضار الورقية، التمور، الأجبان، والحمضيات بمقاييس عالمية.'
                  : 'Saudi Arabia\'s domestic agriculture is going through an unprecedented sustainable renaissance. Through precision hydroponics, solar greenhouse arrays, and ancestral soil stewardship, local growers are yielding world-class vegetables, dates, cheeses, and citrus.'}
              </p>
            </div>

            {/* 4 Regions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{isAr ? 'القصيم' : 'Al-Qassim'}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'تمور السكري وأعشاب برية' : 'Sukkari Dates & Heirloom Herbs'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{isAr ? 'الجوف' : 'Al-Jouf'}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'زيت زيتون بكر معصور على البارد' : 'Cold-Pressed Virgin Olive Oils'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{isAr ? 'الخرج' : 'Al-Kharj'}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'ألبان طازجة وخضار مائية' : 'Farm-Fresh Dairy & Hydro Greens'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{isAr ? 'تبوك والطائف' : 'Tabuk & Taif'}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'تين، رمان، وفواكه جبلية' : 'Figs, Pomegranates & Apricots'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quote Box */}
            <div className="bg-emerald-50/60 border-l-4 rtl:border-r-4 rtl:border-l-0 border-[#043927] p-4 rounded-r-xl rtl:rounded-l-xl rtl:rounded-r-none space-y-1.5">
              <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                {isAr
                  ? '"منحتنا منصة فالكون وصولاً مباشراً لآلاف العائلات في الرياض كل صباح. نحصد مع شروق الشمس، ومحصولنا يكون على مائدة الغداء قبل الظهر."'
                  : '"FreshMart gave our family greenhouse farm direct access to thousands of homes in Riyadh every single morning. We harvest at dawn, and our produce is on family dining tables before lunchtime."'}
              </p>
              <span className="text-[11px] font-black text-[#043927] block">
                {isAr ? '— أبو فهد السبيعي • مزارع رئيسي، وادي الخرج' : 'Abu Fahad Al-Subaie • Master Grower, Al-Kharj Valley'}
              </span>
            </div>

            <a
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#05A764] hover:text-[#043927] transition-colors"
            >
              <span>{isAr ? 'اقرأ المزيد عن شركائنا الزراعيين في المملكة' : 'Read more about our Kingdom Farming Partners'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>

        </div>
      </section>

      {/* ================= SECTION 5: EXECUTIVE LEADERSHIP TEAM ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1 bg-[#EAF5EF] border border-[#CDE5D7] px-3 py-1 rounded-full text-[10px] font-bold text-[#064E3B] tracking-wider uppercase">
            <span>EXECUTIVE LEADERSHIP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
            {isAr ? 'يقودنا شغف بالطعام الجيد والتكنولوجيا' : 'Driven by Passion for Good Food & Technology'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            {isAr
              ? 'فريق تنفيذي يجمع بين الخبرة الزراعية، الذكاء الاصطناعي لسلاسل الإمداد، وتقنيات التبريد الذكية.'
              : 'Meet the executive team bridging agronomy, artificial intelligence routing, cold-chain tech, and customer delight.'}
          </p>
        </div>

        {/* 3 Executive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Executive 1 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <img
                  src="/images/about/tariq.jpg"
                  alt="Tariq Al-Mansoor"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#05A764] uppercase tracking-wider block">
                    EXECUTIVE BOARD
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Share profile">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-lg font-black text-slate-900">Tariq Al-Mansoor</h3>
                <p className="text-xs text-emerald-900 font-bold">
                  {isAr ? 'شريك مؤسس والرئيس التنفيذي' : 'Co-Founder & Chief Executive Officer'}
                </p>
                <p className="text-xs text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'شريك لوجستي سابق في الشحن الجوي. قاد مشاريع استشارية لسلاسل التبريد تماشياً مع مستهدفات الاكتفاء الذاتي الزراعي لرؤية 2030.'
                    : 'Former logistics partner at Riyadh Air Freight. Led accelerated cold-chain consulting on Saudi Vision 2030 agricultural self-sufficiency initiatives.'}
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-100 pt-3">
              <span>{isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
              <a href="#" className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-colors">
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Executive 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <img
                  src="/images/about/layla.jpg"
                  alt="Layla Al-Ghamdi"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#05A764] uppercase tracking-wider block">
                    OPERATIONS LEAD
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Share profile">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-lg font-black text-slate-900">Layla Al-Ghamdi</h3>
                <p className="text-xs text-emerald-900 font-bold">
                  {isAr ? 'شريكة مؤسسة والرئيس التنفيذي للعمليات' : 'Co-Founder & Chief Operating Officer'}
                </p>
                <p className="text-xs text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'خبيرة لوجستية مع أكثر من 14 عاماً في تحسين شبكات التوزيع فائق السرعة بمراكز مدن الخليج وإدارة الأساطيل الخضراء المبردة.'
                    : 'Logistics specialist with track innovation across 14+ years optimizing high-frequency distribution across GCC metropolitan hubs and temperature-monitored green fleets.'}
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-100 pt-3">
              <span>{isAr ? 'جدة، الرياض' : 'Jeddah, Riyadh'}</span>
              <a href="#" className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-colors">
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Executive 3 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <img
                  src="/images/about/sarah.jpg"
                  alt="Dr. Sarah Jenkins"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#05A764] uppercase tracking-wider block">
                    FOOD SCIENCE
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Share profile">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-lg font-black text-slate-900">Dr. Sarah Jenkins</h3>
                <p className="text-xs text-emerald-900 font-bold">
                  {isAr ? 'رئيسة قسم الجودة وعلوم الأغذية' : 'Head of Quality & Food Science'}
                </p>
                <p className="text-xs text-slate-500 font-normal leading-relaxed pt-1">
                  {isAr
                    ? 'دكتوراه في فسيولوجيا ما بعد الحصاد والتقنيات الزراعية. تقود بروتوكول فحص الجودة المكون من 17 نقطة ومختبرات الفحص في المستودعات.'
                    : 'Ph.D. in Post-Harvest Physiology and AgTech. Leads FreshMart\'s rigorous 17-point quality protocol and oversees USDA-equivalent testing across all micro-hubs.'}
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-100 pt-3">
              <span>{isAr ? 'مقر الرياض المركزي' : 'Riyadh Hub HQ'}</span>
              <a href="#" className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-colors">
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 6: SUSTAINABILITY & ENVIRONMENTAL IMPACT BANNER ================= */}
      <section id="sustainability" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & Key Highlights */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700 inline-block">
                🌿 Eco-Fleet Green Initiative 2030
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                {isAr ? 'نحترم أرضنا، ونرعى مجتمعاتنا.' : 'Honoring Our Land, Nurturing Our Communities.'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed">
                {isAr
                  ? 'لا ينبغي أن يأتي الطعام الطازج على حساب بيئتنا. نحن نبني البنية التحتية الأكثر مسؤولية واستدامة لتوصيل البقالة في الشرق الأوسط.'
                  : 'FreshMart foods not only serve the expanse of our environment. We are building the most environmentally responsible grocery infrastructure in the Middle East.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-800/80">
                <Leaf className="w-4.5 h-4.5 text-[#34D399] mb-1.5" />
                <span className="font-bold text-white block">{isAr ? 'انبعاثات صفرية' : 'Zero Emissions'}</span>
                <span className="text-[10px] text-emerald-200/80">
                  {isAr ? 'أسطول كهربائي 100% في المراكز الحضرية.' : '100% Electric delivery fleet in urban centers'}
                </span>
              </div>

              <div className="bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-800/80">
                <Sun className="w-4.5 h-4.5 text-[#34D399] mb-1.5" />
                <span className="font-bold text-white block">{isAr ? 'مستودعات شمسية' : 'Solar Micro-Hubs'}</span>
                <span className="text-[10px] text-emerald-200/80">
                  {isAr ? '70% من غرف التبريد تعمل بالطاقة المتجددة.' : '70% renewable energy powering cold storage'}
                </span>
              </div>

              <div className="bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-800/80">
                <Recycle className="w-4.5 h-4.5 text-[#34D399] mb-1.5" />
                <span className="font-bold text-white block">{isAr ? 'شجرة لكل 10 طلبات' : 'Tree Per 10-packs'}</span>
                <span className="text-[10px] text-emerald-200/80">
                  {isAr ? 'أشجار محلية مزروعة في عسير والعلا.' : 'Native trees planted across Asir & Al-Ula'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Progress Impact Card */}
          <div className="lg:col-span-5 bg-[#032a1c]/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              {isAr ? 'الوفر البيئي السنوي' : 'Annual Environmental Savings'}
            </h4>

            {/* Metric 1 */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-100">{isAr ? 'أكياس بلاستيكية تم تفاديها' : 'Plastic Bags Prevented'}</span>
                <span className="text-[#34D399] font-black">1,420,000 bags</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#34D399] w-[95%]" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-100">{isAr ? 'تقليل هدر الأغذية' : 'Food Loss Under Delivery'}</span>
                <span className="text-[#34D399] font-black">89,200 kg</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#34D399] w-[92%]" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-100">{isAr ? 'انبعاثات كربونية موفرة' : 'CO2 Emissions Averted'}</span>
                <span className="text-[#34D399] font-black">380 metric tons</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#34D399] w-[88%]" />
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-800 flex items-center justify-between text-[11px] text-emerald-200 font-bold">
              <span>🌱 {isAr ? 'زراعة أشجار وطنية' : 'Native Trees Planted'}</span>
              <span className="text-white font-black">42,000+ Trees</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 7: COMPANY GROWTH TIMELINE ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1 bg-[#EAF5EF] border border-[#CDE5D7] px-3 py-1 rounded-full text-[10px] font-bold text-[#064E3B] tracking-wider uppercase">
            <span>{isAr ? 'قصة مسيرتنا' : 'OUR GROWTH STORY'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
            {isAr ? 'من مركبة توزيع واحدة إلى تغطية كافة أرجاء المملكة' : 'From a Single Green Van to Kingdom-Wide Delivery'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#043927] text-white font-black text-xs flex items-center justify-center">
              1
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              2021 • FOUNDING
            </span>
            <h4 className="font-bold text-slate-900 text-sm">
              {isAr ? 'إطلاق تجريبي بالرياض' : 'Riyadh Pilot'}
            </h4>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {isAr
                ? 'الانطلاق بمركز تبريد واحد وشراكة مع 5 مزارع محلية بالرياض لتوصيل مباشر خلال 30 دقيقة.'
                : 'Launched with 1 micro-hub and 5 farms in Riyadh, pioneering 30-min local farm delivery.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#043927] text-white font-black text-xs flex items-center justify-center">
              2
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              2023 • EXPANSION
            </span>
            <h4 className="font-bold text-slate-900 text-sm">
              {isAr ? 'مراكز تبريد مصغرة' : 'Hyper-Local Cold Hubs'}
            </h4>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {isAr
                ? 'التوسع إلى 12 مركز تبريد متقدم في الرياض وجدة مع أكثر من 100 مزرعة شريكة.'
                : 'Expanded to 12 cold-chain hubs across Riyadh & Jeddah with 100+ partner farms.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#043927] text-white font-black text-xs flex items-center justify-center">
              3
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              2025 • TECH STACK
            </span>
            <h4 className="font-bold text-slate-900 text-sm">
              {isAr ? 'تنبؤ الطلب بالذكاء الاصطناعي' : 'AI Demand Prediction'}
            </h4>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {isAr
                ? 'دمج نماذج تعلم الآلة للتنبؤ الدقيق بالطلب والحد من هدر المحاصيل قبل الحصاد.'
                : 'Integrated machine learning demand models to eliminate farm food waste before harvest.'}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-300 bg-emerald-50/20 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#05A764] text-white font-black text-xs flex items-center justify-center">
              4
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              TODAY • MARKET LEADER
            </span>
            <h4 className="font-bold text-slate-900 text-sm">
              {isAr ? 'أكثر من 250 مزرعة وتوصيل مليوني' : '250+ Farms & 2M+ Delivery'}
            </h4>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {isAr
                ? 'تشغيل خدمات التوصيل فائق السرعة عبر مدن المملكة مع ضمان جودة وطزاجة بنسبة 99.4%.'
                : 'Operating express fulfillment across Saudi Arabia with 99.4% freshness guarantee.'}
            </p>
          </div>

        </div>
      </section>

      {/* ================= SECTION 8: BOTTOM CALL TO ACTION BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-emerald-900 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#05A764] text-white flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            🌱
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'تذوق الفرق الذي تصنعه الطزاجة الحقيقية' : 'Taste the Difference That Real Freshness Makes'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed">
              {isAr
                ? 'جرب خضاراً وفواكه حُصدت من المزارع المحلية صباح اليوم وتصل إلى باب منزلك في أقل من 30 دقيقة.'
                : 'Experience groceries harvested locally this morning and delivered to your doorstep in under 30 minutes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/products"
              className="px-8 py-3.5 rounded-full bg-[#05A764] hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'تسوق المقاضي الطازجة الآن' : 'Shop Fresh Groceries Now'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>

            <Link
              href="/products"
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
            >
              {isAr ? 'تعرف على شركاء المزارع' : 'View Farm Partners'}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
