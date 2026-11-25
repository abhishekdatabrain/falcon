'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi, getImageUrl } from '../../src/services/api';
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
  Sun,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP = {
  truck: <Truck className="w-4.5 h-4.5" />,
  leaf: <Leaf className="w-4.5 h-4.5" />,
  clock: <Clock className="w-4.5 h-4.5" />,
  star: <Star className="w-4.5 h-4.5 fill-[#34D399]" />,
  shield: <ShieldCheck className="w-4.5 h-4.5 text-[#05A764]" />,
  users: <Users className="w-4.5 h-4.5 text-[#05A764]" />,
  recycle: <Recycle className="w-4.5 h-4.5 text-[#05A764]" />,
  zap: <Zap className="w-4.5 h-4.5 text-[#05A764]" />,
  sun: <Sun className="w-4.5 h-4.5 text-[#34D399]" />,
};

function resolveMedia(url, fallback) {
  const target = url || fallback;
  if (!target) return '';
  if (target.startsWith('/images/')) return target;
  return getImageUrl(target);
}

export default function AboutPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadAbout = async () => {
      try {
        setLoading(true);
        const res = await fetchApi('/about-page');
        if (mounted && res.success && res.data?.about) {
          setAbout(res.data.about);
        }
      } catch (err) {
        console.warn('Failed to load dynamic about page:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAbout();
    return () => { mounted = false; };
  }, []);

  if (loading && !about) {
    return (
      <div className="min-h-screen bg-[#FBFDFB] pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded-full" />
            <div className="h-12 w-full bg-slate-200 rounded-2xl" />
            <div className="h-24 w-full bg-slate-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-6 aspect-[4/3] bg-slate-200 rounded-3xl" />
        </div>
        <div className="h-40 bg-emerald-950/20 rounded-3xl" />
      </div>
    );
  }

  const vis = about?.section_visibility || {
    hero: true,
    stats: true,
    principles: true,
    farmers: true,
    leadership: true,
    sustainability: true,
    timeline: true,
    cta: true,
  };

  const hero = about?.hero_section || {};
  const stats = Array.isArray(about?.stats_section) ? about.stats_section : [];
  const principles = about?.principles_section || {};
  const farmer = about?.farmer_spotlight_section || {};
  const leadership = about?.leadership_section || {};
  const sustainability = about?.sustainability_section || {};
  const timeline = about?.timeline_section || {};
  const cta = about?.cta_section || {};

  return (
    <div className="min-h-screen bg-[#FBFDFB] pb-24 text-slate-800 space-y-16 sm:space-y-24">

      {/* ================= SECTION 1: HERO BANNER ================= */}
      {vis.hero !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left Hero Text Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#EAF5EF] border border-[#CDE5D7] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#064E3B]">
                <span className="w-2 h-2 rounded-full bg-[#05A764] animate-pulse"></span>
                <span>{isAr ? (hero.badge_ar || 'قصتنا ومهمتنا') : (hero.badge_en || 'Our Story & Mission')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#043927] leading-[1.14] tracking-tight whitespace-pre-line">
                {isAr
                  ? (hero.title_ar || 'جذور ممتدة في الطزاجة، تصل إلى باب منزلك.')
                  : (hero.title_en || 'Rooted in Freshness,\nDelivered to Your\nDoorstep.')}
              </h1>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                {(isAr ? hero.paragraph1_ar : hero.paragraph1_en) && (
                  <p>{isAr ? hero.paragraph1_ar : hero.paragraph1_en}</p>
                )}
                {(isAr ? hero.paragraph2_ar : hero.paragraph2_en) && (
                  <p>{isAr ? hero.paragraph2_ar : hero.paragraph2_en}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href={hero.primary_btn_url || '/products'}
                  className="px-6 py-3.5 rounded-full bg-[#043927] hover:bg-[#02281b] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isAr ? (hero.primary_btn_ar || 'استكشف شركاء المزارع') : (hero.primary_btn_en || 'Explore Farm Partners')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-emerald-300" />
                </Link>
                <a
                  href={hero.secondary_btn_url || '#standards'}
                  className="px-6 py-3.5 rounded-full bg-white border border-[#043927]/30 hover:border-[#043927] text-[#043927] font-bold text-xs shadow-2xs hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#05A764]" />
                  <span>{isAr ? (hero.secondary_btn_ar || 'معايير الجودة لدينا') : (hero.secondary_btn_en || 'Our Quality Standard')}</span>
                </a>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl aspect-[4/3] bg-emerald-950">
                <img
                  src={resolveMedia(hero.image_url, '/images/about/greenhouse.jpg')}
                  alt="SaaRCart Freshness"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/90 text-slate-800 text-[11px] font-bold shadow-md flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#05A764]" />
                  <span className="text-slate-500 font-medium">{isAr ? hero.top_badge_label_ar : hero.top_badge_label_en}</span>
                  <span className="font-bold text-[#043927]">{isAr ? hero.top_badge_value_ar : hero.top_badge_value_en}</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 text-slate-900 flex items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] text-[#05A764] flex items-center justify-center shrink-0 text-base font-bold">
                      🌱
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {isAr ? hero.bottom_card_title_ar : hero.bottom_card_title_en}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {isAr ? hero.bottom_card_subtitle_ar : hero.bottom_card_subtitle_en}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-[#043927] border border-emerald-300 font-black text-[9px] uppercase px-2.5 py-1 rounded-md tracking-wider">
                    {isAr ? hero.bottom_card_badge_ar : hero.bottom_card_badge_en}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ================= SECTION 2: KEY METRIC STATS BAR ================= */}
      {vis.stats !== false && stats.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#043927] text-white rounded-3xl p-7 sm:p-10 shadow-xl border border-emerald-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative overflow-hidden">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`space-y-2 ${
                  idx < stats.length - 1
                    ? 'border-b sm:border-b-0 sm:border-r border-emerald-800/70 pb-6 sm:pb-0 pr-0 sm:pr-6 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-6'
                    : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-900/70 flex items-center justify-center text-[#34D399]">
                  {ICON_MAP[stat.icon] || <Truck className="w-4.5 h-4.5" />}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</div>
                <h4 className="font-bold text-xs text-[#34D399]">
                  {isAr ? (stat.title_ar || stat.title_en) : stat.title_en}
                </h4>
                <p className="text-[11px] text-emerald-100/70 font-medium leading-relaxed">
                  {isAr ? (stat.description_ar || stat.description_en) : stat.description_en}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= SECTION 3: GUIDING PRINCIPLES ================= */}
      {vis.principles !== false && (
        <section id="standards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-[#EAF5EF] border border-[#CDE5D7] px-3 py-1 rounded-full text-[10px] font-bold text-[#064E3B] tracking-wider uppercase">
              <span>🌱</span>
              <span>{isAr ? principles.badge_ar : principles.badge_en}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
              {isAr ? principles.title_ar : principles.title_en}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              {isAr ? principles.subtitle_ar : principles.subtitle_en}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(principles.cards || []).map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#043927] flex items-center justify-center font-bold border border-emerald-100">
                    {ICON_MAP[card.icon] || <ShieldCheck className="w-4.5 h-4.5 text-[#05A764]" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {card.step_label}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {isAr ? (card.title_ar || card.title_en) : card.title_en}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    {isAr ? (card.description_ar || card.description_en) : card.description_en}
                  </p>
                </div>
                {(card.link_label_en || card.link_label_ar) && (
                  <a href={card.link_url || '#standards'} className="text-xs font-bold text-[#05A764] hover:text-[#043927] flex items-center gap-1 pt-2">
                    <span>{isAr ? (card.link_label_ar || card.link_label_en) : card.link_label_en}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= SECTION 4: FEATURED SAUDI FARMER SPOTLIGHT ================= */}
      {vis.farmers !== false && (
        <section id="farmers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-slate-200 shadow-md bg-emerald-950">
                <img
                  src={resolveMedia(farmer.image_url, '/images/about/farmer.jpg')}
                  alt="Saudi Master Farmer holding fresh harvest"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 text-white text-[11px] font-bold shadow-md flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span className="truncate">{isAr ? farmer.image_badge_ar : farmer.image_badge_en}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-[#EAF5EF] px-3 py-1 rounded-full border border-[#CDE5D7] inline-block">
                  {isAr ? (farmer.badge_ar || farmer.badge_en) : farmer.badge_en}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight leading-tight">
                  {isAr ? farmer.title_ar : farmer.title_en}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  {isAr ? farmer.description_ar : farmer.description_en}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(farmer.regions || []).map((reg, idx) => (
                  <div key={idx} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">{isAr ? (reg.name_ar || reg.name_en) : reg.name_en}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isAr ? (reg.produce_ar || reg.produce_en) : reg.produce_en}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {(farmer.quote_en || farmer.quote_ar) && (
                <div className="bg-emerald-50/60 border-l-4 rtl:border-r-4 rtl:border-l-0 border-[#043927] p-4 rounded-r-xl rtl:rounded-l-xl rtl:rounded-r-none space-y-1.5">
                  <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                    {isAr ? farmer.quote_ar : farmer.quote_en}
                  </p>
                  <span className="text-[11px] font-black text-[#043927] block">
                    {isAr ? farmer.quote_author_ar : farmer.quote_author_en}
                  </span>
                </div>
              )}

              <Link
                href={farmer.link_url || '/products'}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#05A764] hover:text-[#043927] transition-colors"
              >
                <span>{isAr ? farmer.link_label_ar : farmer.link_label_en}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* ================= SECTION 5: EXECUTIVE LEADERSHIP TEAM ================= */}
      {vis.leadership !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1 bg-[#EAF5EF] border border-[#CDE5D7] px-3 py-1 rounded-full text-[10px] font-bold text-[#064E3B] tracking-wider uppercase">
              <span>{isAr ? (leadership.badge_ar || leadership.badge_en) : leadership.badge_en}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
              {isAr ? leadership.title_ar : leadership.title_en}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              {isAr ? leadership.subtitle_ar : leadership.subtitle_en}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(leadership.members || []).map((member, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="h-56 overflow-hidden bg-slate-100 relative">
                    <img
                      src={resolveMedia(member.image_url, '/images/about/tariq.jpg')}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#05A764] uppercase tracking-wider block">
                        {member.department}
                      </span>
                      <span className="text-slate-400 p-1">
                        <Share2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                    <p className="text-xs text-emerald-900 font-bold">
                      {isAr ? (member.role_ar || member.role_en) : member.role_en}
                    </p>
                    <p className="text-xs text-slate-500 font-normal leading-relaxed pt-1">
                      {isAr ? (member.bio_ar || member.bio_en) : member.bio_en}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-100 pt-3">
                  <span>{isAr ? (member.location_ar || member.location_en) : member.location_en}</span>
                  <a href={member.profile_url || '#'} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= SECTION 6: SUSTAINABILITY BANNER ================= */}
      {vis.sustainability !== false && (
        <section id="sustainability" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700 inline-block">
                  {isAr ? (sustainability.badge_ar || sustainability.badge_en) : sustainability.badge_en}
                </span>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  {isAr ? sustainability.title_ar : sustainability.title_en}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed">
                  {isAr ? sustainability.description_ar : sustainability.description_en}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                {(sustainability.highlights || []).map((hl, idx) => (
                  <div key={idx} className="bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-800/80">
                    <div className="mb-1.5 text-[#34D399]">
                      {ICON_MAP[hl.icon] || <Leaf className="w-4.5 h-4.5" />}
                    </div>
                    <span className="font-bold text-white block">{isAr ? (hl.title_ar || hl.title_en) : hl.title_en}</span>
                    <span className="text-[10px] text-emerald-200/80">
                      {isAr ? (hl.description_ar || hl.description_en) : hl.description_en}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#032a1c]/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-800/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {isAr ? sustainability.savings_title_ar : sustainability.savings_title_en}
              </h4>

              {(sustainability.metrics || []).map((m, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-100">{isAr ? (m.label_ar || m.label_en) : m.label_en}</span>
                    <span className="text-[#34D399] font-black">{m.value_text}</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                    <div className="h-full bg-[#34D399]" style={{ width: `${Math.min(100, Math.max(0, Number(m.percentage) || 0))}%` }} />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-emerald-800 flex items-center justify-between text-[11px] text-emerald-200 font-bold">
                <span>🌱 {isAr ? sustainability.bottom_metric_label_ar : sustainability.bottom_metric_label_en}</span>
                <span className="text-white font-black">{sustainability.bottom_metric_value}</span>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ================= SECTION 7: COMPANY GROWTH TIMELINE ================= */}
      {vis.timeline !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1 bg-[#EAF5EF] border border-[#CDE5D7] px-3 py-1 rounded-full text-[10px] font-bold text-[#064E3B] tracking-wider uppercase">
              <span>{isAr ? timeline.badge_ar : timeline.badge_en}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#043927] tracking-tight">
              {isAr ? timeline.title_ar : timeline.title_en}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(timeline.steps || []).map((step, idx) => (
              <div
                key={idx}
                className={`bg-white p-6 rounded-2xl border shadow-xs space-y-3 relative ${
                  step.is_highlighted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/90'
                }`}
              >
                <div className={`w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center ${
                  step.is_highlighted ? 'bg-[#05A764]' : 'bg-[#043927]'
                }`}>
                  {step.step_number || idx + 1}
                </div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {step.year_tag}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {isAr ? (step.title_ar || step.title_en) : step.title_en}
                </h4>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  {isAr ? (step.description_ar || step.description_en) : step.description_en}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= SECTION 8: BOTTOM CALL TO ACTION BANNER ================= */}
      {vis.cta !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#043927] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-emerald-900 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#05A764] text-white flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              {cta.emoji || '🌱'}
            </div>

            <div className="space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isAr ? cta.title_ar : cta.title_en}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed">
                {isAr ? cta.description_ar : cta.description_en}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                href={cta.primary_btn_url || '/products'}
                className="px-8 py-3.5 rounded-full bg-[#05A764] hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? cta.primary_btn_ar : cta.primary_btn_en}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>

              <Link
                href={cta.secondary_btn_url || '/products'}
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                {isAr ? cta.secondary_btn_ar : cta.secondary_btn_en}
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
