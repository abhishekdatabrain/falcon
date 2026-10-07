'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  Leaf,
  Award,
  Truck,
  ShieldCheck,
  Heart,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Sun,
  Droplets,
  Recycle,
  Users,
  MapPin,
  TrendingUp,
  Clock,
  Star,
  Building2,
  Zap,
  Globe,
  Check
} from 'lucide-react';

export default function AboutPage() {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-sans pb-24 text-slate-800 space-y-16 sm:space-y-20">
      
      {/* ================= SECTION 1: HERO BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#043927]">
              <span>🌱</span>
              <span>{locale === 'ar' ? 'قصتنا ومهمتنا' : 'Our Story & Mission'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              {locale === 'ar'
                ? 'جذور ممتدة في الطزاجة، تصل إلى باب منزلك.'
                : 'Rooted in Freshness, Delivered to Your Doorstep.'}
            </h1>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <p>
                {locale === 'ar'
                  ? 'تمكين العائلات السعودية بمقاضي طازجة ومستدامة من المزرعة إلى المائدة مباشرة في غضون 20 دقيقة. انطلقت فالكون ماركت من قلب الرياض بناءً على سؤال جوهري: لماذا تقضي الأغذية الطازجة أسبوعين في مستودعات التبريد التقليدية قبل أن تصل لمائدة عائلتك؟'
                  : 'Empowering Saudi households with fresh, sustainable, farm-to-table groceries delivered in as little as 20 minutes. Founded in the heart of Riyadh, Falcon Mart was born from a fundamental question: why should fresh food spend two weeks in static cold-storage depots before reaching your family\'s dinner table?'}
              </p>
              <p>
                {locale === 'ar'
                  ? 'لقد جسّرنا الفجوة بين أنشط مزارع المائية (الهيدروبونيك) في الرياض ومزارعي التمور التقليديين والتعاونيات الزراعية الحديثة مباشرة إلى باب بيتك — لنقدم لك طزاجة الحصاد المثالي التي ترتقي بالتغذية اليومية.'
                  : 'We bridged the gap between Riyadh\'s most passionate local hydroponic cultivators, traditional date growers, and modern agricultural cooperatives directly to your door — delivering peak-harvest freshness that truly elevates everyday nutrition.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-2xl bg-[#043927] hover:bg-[#02281b] text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{locale === 'ar' ? 'استكشف شركاء المزارع' : 'Explore Farm Partners'}</span>
                <ArrowRight className="w-4 h-4 text-[#05A764] rtl:rotate-180" />
              </Link>
              <a
                href="#standards"
                className="px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-extrabold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{locale === 'ar' ? 'معايير الجودة لدينا' : 'Our Quality Standard'}</span>
              </a>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl aspect-[4/3] bg-emerald-950">
              <img
                src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800"
                alt="Saudi Hydroponic Farm Harvest"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Badge Top Right */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-200 text-emerald-900 text-[11px] font-extrabold shadow-sm flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#05A764]" />
                <span>Verified 100% Cold-Chain</span>
              </div>

              {/* Overlay Banner Bottom Left */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#043927]/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/30 text-white flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#05A764] text-white flex items-center justify-center shrink-0 font-bold">
                    🌱
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs">Direct Harvest to Doorstep</h4>
                    <p className="text-[10px] text-emerald-200 font-medium">Under 20-min express fulfillment across Riyadh</p>
                  </div>
                </div>
                <span className="bg-emerald-800/80 text-emerald-100 font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-600">
                  LIVE API
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 2: KEY METRIC STATS BAR ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-emerald-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative overflow-hidden">
          
          {/* Stat 1 */}
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-emerald-800/80 pb-6 sm:pb-0 pr-0 sm:pr-6">
            <div className="flex items-center gap-2 text-[#05A764]">
              <Truck className="w-5 h-5" />
              <span className="text-2xl sm:text-3xl font-black text-white">2M+</span>
            </div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-200">Fresh Orders Delivered</h4>
            <p className="text-[11px] text-emerald-300/80 font-medium leading-relaxed">
              Across Riyadh, Jeddah, Dammam & Al Khobar in Saudi Arabia
            </p>
          </div>

          {/* Stat 2 */}
          <div className="space-y-2 border-b sm:border-b-0 lg:border-r border-emerald-800/80 pb-6 sm:pb-0 pr-0 lg:pr-6">
            <div className="flex items-center gap-2 text-[#05A764]">
              <Leaf className="w-5 h-5" />
              <span className="text-2xl sm:text-3xl font-black text-white">250+</span>
            </div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-200">Local Farm Partners</h4>
            <p className="text-[11px] text-emerald-300/80 font-medium leading-relaxed">
              Certified hyper-local cultivators of fresh greens, orchard fruits & dairy
            </p>
          </div>

          {/* Stat 3 */}
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-emerald-800/80 pb-6 sm:pb-0 pr-0 sm:pr-6">
            <div className="flex items-center gap-2 text-[#05A764]">
              <Zap className="w-5 h-5" />
              <span className="text-2xl sm:text-3xl font-black text-white">&lt; 12h</span>
            </div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-200">Harvest to Door Speed</h4>
            <p className="text-[11px] text-emerald-300/80 font-medium leading-relaxed">
              Far faster than 2-week traditional distribution, keeping nutrients fully intact
            </p>
          </div>

          {/* Stat 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#05A764]">
              <Star className="w-5 h-5 fill-[#05A764]" />
              <span className="text-2xl sm:text-3xl font-black text-white">99.4%</span>
            </div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-200">Freshness Satisfaction</h4>
            <p className="text-[11px] text-emerald-300/80 font-medium leading-relaxed">
              Measured by verified customer feedback & 0-hassle instant replacements
            </p>
          </div>

        </div>
      </section>

      {/* ================= SECTION 3: THE PRINCIPLES THAT GUIDE EVERY BASKET ================= */}
      <section id="standards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black text-[#05A764] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            🌱 OUR CORE COMMITMENT
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            The Principles That Guide Every Basket
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">
            Every apple, bottle of milk, and head of crisp romaine is treated according to five non-negotiable quality standards.
          </p>
        </div>

        {/* 4 Core Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                🌿 01. INTEGRITY FIRST
              </span>
              <h3 className="font-black text-slate-900 text-base leading-snug">
                Uncompromised Freshness
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Every product undergoes a strict 14-point physical inspection before loading. If a strawberry displays a minor blemish, it never makes your grocery bag.
              </p>
            </div>
            <a href="#" className="text-xs font-extrabold text-[#043927] hover:text-[#05A764] flex items-center gap-1 pt-2">
              <span>Read Quality Protocol</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                <Users className="w-5 h-5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                🤝 02. COMMUNITY IMPACT
              </span>
              <h3 className="font-black text-slate-900 text-base leading-snug">
                Championing Local Growers
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We pay 100% fair prices and provide 48-hour cash settlement to small Saudi farmers. Our partner network protects agricultural traditions while creating sustainable rural jobs.
              </p>
            </div>
            <a href="#" className="text-xs font-extrabold text-[#043927] hover:text-[#05A764] flex items-center gap-1 pt-2">
              <span>Meet Our Farmers</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                <Recycle className="w-5 h-5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                ♻️ 03. SUSTAINABILITY
              </span>
              <h3 className="font-black text-slate-900 text-base leading-snug">
                Eco-Conscious Packaging
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We use 100% recyclable, plant-based insulation boxes and biodegradable sugarcane totes. Zero single-use plastic bags in our delivery fleet.
              </p>
            </div>
            <a href="#" className="text-xs font-extrabold text-[#043927] hover:text-[#05A764] flex items-center gap-1 pt-2">
              <span>Zero Waste Standard</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                <Zap className="w-5 h-5 text-[#05A764]" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                ⚡ 04. SPEED & CARE
              </span>
              <h3 className="font-black text-slate-900 text-base leading-snug">
                Speed with Precision
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Our 20-minute delivery promise is driven by hyper-local micro-fulfillment hubs. Smart temperature logs guarantee zero heat exposure during transit.
              </p>
            </div>
            <a href="#" className="text-xs font-extrabold text-[#043927] hover:text-[#05A764] flex items-center gap-1 pt-2">
              <span>Hub API Ecosystem</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>

        </div>
      </section>

      {/* ================= SECTION 4: FEATURED SAUDI FARMER SPOTLIGHT ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Farmer Portrait */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] border border-slate-200 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=700"
                alt="Saudi Master Farmer holding fresh harvest"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 text-slate-900 text-[11px] font-extrabold shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#05A764]" />
                <span>Verified Local Partner • Al-Kharj Farms</span>
              </div>
            </div>
          </div>

          {/* Right Farm Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                🇸🇦 KINGDOM FIRST • LOCAL AGRICULTURAL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Partnering Directly With Over 250+ Saudi Farms
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Saudi Arabia's domestic agriculture is undergoing a remarkable renaissance. Through hydroponic towers, solar greenhouses, and geothermal irrigation, local growers produce world-class vegetables, dates, cheese, and citrus.
              </p>
            </div>

            {/* 4 Regions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Al-Kharj</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Hydroponic Tomatoes & Heirloom Herbs</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Al-Qassim</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Sukkari Dates & Premium Organic Grains</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Al-Ahsa</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Organic Milk & Artisanal Cheeses</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Tabuk & Taif</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Berries, Pomegranates & Figs</span>
                </div>
              </div>
            </div>

            {/* Quote Box */}
            <div className="bg-emerald-50/70 border-l-4 border-[#043927] p-4 rounded-r-2xl space-y-1">
              <p className="text-xs text-slate-700 italic font-semibold leading-relaxed">
                "Falcon Mart gave our family-greenhouse farm direct access to thousands of homes in Riyadh every single morning. We harvest at dawn, and our produce is on family dining tables before lunchtime."
              </p>
              <span className="text-[11px] font-black text-[#043927] block">
                — Abu Fahad Al-Otaibi • Master Grower, Al-Kharj Farms
              </span>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2 text-xs font-extrabold text-[#043927] hover:text-[#05A764] transition-colors"
            >
              <span>Read Stories from Our Kingdom Farming Partners</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </a>
          </div>

        </div>
      </section>

      {/* ================= SECTION 5: EXECUTIVE LEADERSHIP TEAM ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            AUTHENTIC LEADERSHIP
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Driven by Passion for Good Food & Technology
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">
            Veterans across agronomy, logistics, artificial intelligence supply chain networks, and customer delight.
          </p>
        </div>

        {/* 3 Executive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Executive 1 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500"
                  alt="Tariq Al-Mansoor"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-extrabold text-[#05A764] uppercase tracking-wider block">
                  CO-FOUNDER & CEO
                </span>
                <h3 className="text-lg font-black text-slate-900">Tariq Al-Mansoor</h3>
                <p className="text-xs text-slate-[#043927] font-bold">Co-Founder & Chief Executive Officer</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
                  Former Supply Chain Lead at Saudi Aramco. Tariq founded Falcon Mart with a single mission: to bring 100% farm-fresh nutrition to every Saudi home.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 text-[11px] text-slate-400 font-bold flex items-center justify-between border-t border-slate-100 pt-3">
              <span>Riyadh, Saudi Arabia</span>
              <a href="#" className="text-emerald-700 font-extrabold hover:underline">Read Bio ➔</a>
            </div>
          </div>

          {/* Executive 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500"
                  alt="Layla Al-Ghamdi"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-extrabold text-[#05A764] uppercase tracking-wider block">
                  CO-FOUNDER & COO
                </span>
                <h3 className="text-lg font-black text-slate-900">Layla Al-Ghamdi</h3>
                <p className="text-xs text-slate-[#043927] font-bold">Co-Founder & Chief Operating Officer</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
                  Logistics innovator with 12+ years optimizing last-mile cold-chain delivery networks across GCC metropolitan areas.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 text-[11px] text-slate-400 font-bold flex items-center justify-between border-t border-slate-100 pt-3">
              <span>Jeddah, Saudi Arabia</span>
              <a href="#" className="text-emerald-700 font-extrabold hover:underline">Read Bio ➔</a>
            </div>
          </div>

          {/* Executive 3 */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="h-56 overflow-hidden bg-slate-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500"
                  alt="Dr. Sarah Jenkins"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-extrabold text-[#05A764] uppercase tracking-wider block">
                  HEAD OF AGRONOMY
                </span>
                <h3 className="text-lg font-black text-slate-900">Dr. Sarah Jenkins</h3>
                <p className="text-xs text-slate-[#043927] font-bold">Head of Agricultural Sciences</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
                  PhD in Plant Biotechnology and AgTech. Lead consultant on high-yield climate-resilient farming techniques across hot arid climates.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 text-[11px] text-slate-400 font-bold flex items-center justify-between border-t border-slate-100 pt-3">
              <span>Dammam, Saudi Arabia</span>
              <a href="#" className="text-emerald-700 font-extrabold hover:underline">Read Bio ➔</a>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 6: SUSTAINABILITY & ENVIRONMENTAL IMPACT BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & Key Highlights */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700 inline-block">
                🌿 SUSTAINABLE VISION 2030
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Honoring Our Land, Nurturing Our Communities.
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
                Fresh food should not come at the expense of our environment. We are building the Kingdom's most sustainable, responsible grocery ecosystem in the Middle East.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-emerald-900/50 p-3.5 rounded-2xl border border-emerald-800">
                <Droplets className="w-5 h-5 text-[#05A764] mb-1.5" />
                <span className="font-extrabold text-white block">Water Saved</span>
                <span className="text-[10px] text-emerald-300">85% less water used via hydroponic farm partners.</span>
              </div>

              <div className="bg-emerald-900/50 p-3.5 rounded-2xl border border-emerald-800">
                <Sun className="w-5 h-5 text-[#05A764] mb-1.5" />
                <span className="font-extrabold text-white block">Solar Powered</span>
                <span className="text-[10px] text-emerald-300">30% of cold hubs powered by solar arrays.</span>
              </div>

              <div className="bg-emerald-900/50 p-3.5 rounded-2xl border border-emerald-800">
                <Recycle className="w-5 h-5 text-[#05A764] mb-1.5" />
                <span className="font-extrabold text-white block">Zero Single-Use</span>
                <span className="text-[10px] text-emerald-300">100% compostable sugarcane packaging.</span>
              </div>
            </div>
          </div>

          {/* Right Progress Impact Card */}
          <div className="lg:col-span-5 bg-emerald-900/60 p-6 rounded-3xl border border-emerald-800/80 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200">
              Annual Environmental Impact
            </h4>

            {/* Metric 1 */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-100">Plastic Bags Saved</span>
                <span className="text-[#05A764] font-black">1,420,000 bags</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#05A764] w-[95%]" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-100">Food Waste Reduction</span>
                <span className="text-[#05A764] font-black">94.8%</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#05A764] w-[94.8%]" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-100">CO2 Emission Saved vs Auto-Trips</span>
                <span className="text-[#05A764] font-black">385 Metric Tons</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#05A764] w-[88%]" />
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-800 flex items-center justify-between text-[11px] text-emerald-300 font-bold">
              <span>🌱 100% Tree Planted per 50 Orders</span>
              <span className="text-white font-black">12,400 Trees</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 7: COMPANY GROWTH TIMELINE ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            OUR GROWTH STORY
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            From a Single Green Van to Kingdom-Wide Delivery
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#043927] text-white font-black text-xs flex items-center justify-center">
              1
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
              2021 • FOUNDING
            </span>
            <h4 className="font-extrabold text-slate-900 text-sm">Riyadh Pilot</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Launched with 1 micro-hub and 5 farms in Riyadh, pioneering 30-min local farm delivery.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#043927] text-white font-black text-xs flex items-center justify-center">
              2
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
              2023 • EXPANSION
            </span>
            <h4 className="font-extrabold text-slate-900 text-sm">Hyper-Local Cold Hubs</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Expanded to 12 cold-chain hubs across Riyadh & Jeddah with 100+ partner farms.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-[#043927] text-white font-black text-xs flex items-center justify-center">
              3
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
              2025 • TECH STACK
            </span>
            <h4 className="font-extrabold text-slate-900 text-sm">AI Demand Prediction</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Integrated machine learning demand models to eliminate farm food waste before harvest.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 relative border-emerald-300 bg-emerald-50/20">
            <div className="w-8 h-8 rounded-full bg-[#05A764] text-white font-black text-xs flex items-center justify-center">
              4
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
              TODAY • MARKET LEADER
            </span>
            <h4 className="font-extrabold text-slate-900 text-sm">250+ Farms & 2M+ Delivery</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Operating 20-min express fulfillment across Saudi Arabia with 99.4% freshness guarantee.
            </p>
          </div>

        </div>
      </section>

      {/* ================= SECTION 8: BOTTOM CALL TO ACTION BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl border border-emerald-900 relative overflow-hidden">
          <div className="w-14 h-14 rounded-3xl bg-[#05A764] text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
            🌱
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Taste the Difference That Real Freshness Makes
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
              Experience groceries harvested locally this morning and delivered to your doorstep in under 20 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="px-8 py-3.5 rounded-2xl bg-[#05A764] hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Shop Fresh Groceries Now</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <Link
              href="/products"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition-all cursor-pointer"
            >
              View Farm Partners
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
