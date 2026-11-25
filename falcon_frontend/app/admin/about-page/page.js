'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { fetchApi, getImageUrl } from '../../../src/services/api';
import {
  Sparkles,
  Save,
  Loader2,
  ExternalLink,
  Upload,
  Plus,
  Trash2,
  Eye,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Leaf,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AdminAboutPageCMS() {
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [activeTab, setActiveTab] = useState('hero_stats'); // 'hero_stats' | 'principles_farmers' | 'leadership' | 'sustainability_timeline' | 'cta_visibility'

  const [aboutData, setAboutData] = useState(null);

  const loadAboutData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/about-page/admin');
      if (res.success && res.data?.about) {
        setAboutData(res.data.about);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load About page content', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadAboutData();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleSave = async () => {
    if (!aboutData || saving) return;
    setSaving(true);
    try {
      const res = await fetchApi('/about-page/admin', {
        method: 'PUT',
        body: aboutData,
      });
      if (res.success) {
        showToast(isAr ? 'تم حفظ محتوى صفحة من نحن بنجاح ✓' : 'About Us page content saved successfully ✓', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save About page content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, targetKey, onSuccessUrl) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }
    setUploadingField(targetKey);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchApi('/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.data?.url) {
        onSuccessUrl(res.data.url);
        showToast('Image uploaded ✓', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const updateSection = (sectionKey, value) => {
    setAboutData((prev) => ({
      ...prev,
      [sectionKey]: value,
    }));
  };

  if (loading || !aboutData) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#043927] animate-spin" />
      </div>
    );
  }

  const hero = aboutData.hero_section || {};
  const stats = aboutData.stats_section || [];
  const principles = aboutData.principles_section || { cards: [] };
  const farmer = aboutData.farmer_spotlight_section || { regions: [] };
  const leadership = aboutData.leadership_section || { members: [] };
  const sustainability = aboutData.sustainability_section || { highlights: [], metrics: [] };
  const timeline = aboutData.timeline_section || { steps: [] };
  const cta = aboutData.cta_section || {};
  const vis = aboutData.section_visibility || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#043927]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              {isAr ? 'إدارة محتوى صفحة من نحن' : 'About Us Page CMS'}
            </h1>
            <p className="text-xs text-slate-500">
              Edit all sections, bilingual copy, images, team members, stats & visibility for `/about`.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAboutData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-[#043927] flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Live Page</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#043927] hover:bg-[#02281b] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        {[
          { key: 'hero_stats', label: '1. Hero & Stats', icon: LayoutDashboard },
          { key: 'principles_farmers', label: '2. Principles & Farmers', icon: ShieldCheck },
          { key: 'leadership', label: '3. Leadership Team', icon: Users },
          { key: 'sustainability_timeline', label: '4. Sustainability & Timeline', icon: Leaf },
          { key: 'cta_visibility', label: '5. CTA & Visibility', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                active ? 'bg-[#043927] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: HERO & STATS ==================== */}
      {activeTab === 'hero_stats' && (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h2 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">Hero Banner</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge (EN)</label>
                <input type="text" value={hero.badge_en || ''} onChange={(e) => updateSection('hero_section', { ...hero, badge_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge (AR)</label>
                <input type="text" dir="rtl" value={hero.badge_ar || ''} onChange={(e) => updateSection('hero_section', { ...hero, badge_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Heading (EN)</label>
                <textarea rows={2} value={hero.title_en || ''} onChange={(e) => updateSection('hero_section', { ...hero, title_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Heading (AR)</label>
                <textarea rows={2} dir="rtl" value={hero.title_ar || ''} onChange={(e) => updateSection('hero_section', { ...hero, title_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paragraph 1 (EN)</label>
                <textarea rows={3} value={hero.paragraph1_en || ''} onChange={(e) => updateSection('hero_section', { ...hero, paragraph1_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paragraph 1 (AR)</label>
                <textarea rows={3} dir="rtl" value={hero.paragraph1_ar || ''} onChange={(e) => updateSection('hero_section', { ...hero, paragraph1_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paragraph 2 (EN)</label>
                <textarea rows={3} value={hero.paragraph2_en || ''} onChange={(e) => updateSection('hero_section', { ...hero, paragraph2_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paragraph 2 (AR)</label>
                <textarea rows={3} dir="rtl" value={hero.paragraph2_ar || ''} onChange={(e) => updateSection('hero_section', { ...hero, paragraph2_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            </div>

            {/* Hero Image Upload */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
              <img
                src={hero.image_url?.startsWith('/images/') ? hero.image_url : getImageUrl(hero.image_url)}
                alt="Hero Preview"
                className="w-28 h-20 rounded-xl object-cover border border-slate-200"
              />
              <label className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#043927] font-bold cursor-pointer inline-flex items-center gap-2 border border-emerald-200">
                <Upload className="w-4 h-4" />
                <span>{uploadingField === 'hero' ? 'Uploading...' : 'Upload Hero Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0], 'hero', (url) => updateSection('hero_section', { ...hero, image_url: url }))}
                />
              </label>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="font-black text-sm text-slate-900">Key Metric Stats Bar</h2>
              <button
                type="button"
                onClick={() => updateSection('stats_section', [...stats, { icon: 'truck', value: '100+', title_en: 'New Stat', title_ar: 'إحصائية جديدة', description_en: '', description_ar: '' }])}
                className="px-3 py-1.5 rounded-lg bg-[#043927] text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((st, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Stat #{idx + 1}</span>
                    <button type="button" onClick={() => updateSection('stats_section', stats.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Value (e.g. 2M+)" value={st.value || ''} onChange={(e) => {
                      const next = [...stats]; next[idx] = { ...st, value: e.target.value }; updateSection('stats_section', next);
                    }} className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold" />
                    <select value={st.icon || 'truck'} onChange={(e) => {
                      const next = [...stats]; next[idx] = { ...st, icon: e.target.value }; updateSection('stats_section', next);
                    }} className="px-3 py-2 rounded-lg border border-slate-200 bg-white">
                      <option value="truck">Truck</option>
                      <option value="leaf">Leaf</option>
                      <option value="clock">Clock</option>
                      <option value="star">Star</option>
                    </select>
                    <input type="text" placeholder="Title (EN)" value={st.title_en || ''} onChange={(e) => {
                      const next = [...stats]; next[idx] = { ...st, title_en: e.target.value }; updateSection('stats_section', next);
                    }} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                    <input type="text" dir="rtl" placeholder="Title (AR)" value={st.title_ar || ''} onChange={(e) => {
                      const next = [...stats]; next[idx] = { ...st, title_ar: e.target.value }; updateSection('stats_section', next);
                    }} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                    <input type="text" placeholder="Description (EN)" value={st.description_en || ''} onChange={(e) => {
                      const next = [...stats]; next[idx] = { ...st, description_en: e.target.value }; updateSection('stats_section', next);
                    }} className="px-3 py-2 rounded-lg border border-slate-200 bg-white col-span-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PRINCIPLES & FARMER SPOTLIGHT ==================== */}
      {activeTab === 'principles_farmers' && (
        <div className="space-y-6 text-xs">
          {/* Principles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">Guiding Principles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Title (EN)" value={principles.title_en || ''} onChange={(e) => updateSection('principles_section', { ...principles, title_en: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold" />
              <input type="text" dir="rtl" placeholder="Title (AR)" value={principles.title_ar || ''} onChange={(e) => updateSection('principles_section', { ...principles, title_ar: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(principles.cards || []).map((card, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-slate-600">
                    <span>Card #{idx + 1}</span>
                    <input type="text" value={card.step_label || ''} onChange={(e) => {
                      const next = [...principles.cards]; next[idx] = { ...card, step_label: e.target.value }; updateSection('principles_section', { ...principles, cards: next });
                    }} className="px-2 py-0.5 rounded border border-slate-200 bg-white text-[11px]" />
                  </div>
                  <input type="text" placeholder="Title (EN)" value={card.title_en || ''} onChange={(e) => {
                    const next = [...principles.cards]; next[idx] = { ...card, title_en: e.target.value }; updateSection('principles_section', { ...principles, cards: next });
                  }} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold" />
                  <input type="text" dir="rtl" placeholder="Title (AR)" value={card.title_ar || ''} onChange={(e) => {
                    const next = [...principles.cards]; next[idx] = { ...card, title_ar: e.target.value }; updateSection('principles_section', { ...principles, cards: next });
                  }} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold" />
                  <textarea rows={2} placeholder="Description (EN)" value={card.description_en || ''} onChange={(e) => {
                    const next = [...principles.cards]; next[idx] = { ...card, description_en: e.target.value }; updateSection('principles_section', { ...principles, cards: next });
                  }} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                </div>
              ))}
            </div>
          </div>

          {/* Farmer Spotlight */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">Saudi Farmer Spotlight</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Title (EN)" value={farmer.title_en || ''} onChange={(e) => updateSection('farmer_spotlight_section', { ...farmer, title_en: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold" />
              <input type="text" dir="rtl" placeholder="Title (AR)" value={farmer.title_ar || ''} onChange={(e) => updateSection('farmer_spotlight_section', { ...farmer, title_ar: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold" />
              <textarea rows={3} placeholder="Description (EN)" value={farmer.description_en || ''} onChange={(e) => updateSection('farmer_spotlight_section', { ...farmer, description_en: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              <textarea rows={3} dir="rtl" placeholder="Description (AR)" value={farmer.description_ar || ''} onChange={(e) => updateSection('farmer_spotlight_section', { ...farmer, description_ar: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              <textarea rows={2} placeholder="Quote (EN)" value={farmer.quote_en || ''} onChange={(e) => updateSection('farmer_spotlight_section', { ...farmer, quote_en: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              <input type="text" placeholder="Quote Author (EN)" value={farmer.quote_author_en || ''} onChange={(e) => updateSection('farmer_spotlight_section', { ...farmer, quote_author_en: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
              <img
                src={farmer.image_url?.startsWith('/images/') ? farmer.image_url : getImageUrl(farmer.image_url)}
                alt="Farmer Preview"
                className="w-16 h-20 rounded-xl object-cover border border-slate-200"
              />
              <label className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#043927] font-bold cursor-pointer inline-flex items-center gap-2 border border-emerald-200">
                <Upload className="w-4 h-4" />
                <span>{uploadingField === 'farmer' ? 'Uploading...' : 'Upload Farmer Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0], 'farmer', (url) => updateSection('farmer_spotlight_section', { ...farmer, image_url: url }))}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: LEADERSHIP TEAM ==================== */}
      {activeTab === 'leadership' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="font-black text-sm text-slate-900">Executive Leadership Team</h2>
            <button
              type="button"
              onClick={() => updateSection('leadership_section', {
                ...leadership,
                members: [...(leadership.members || []), {
                  department: 'EXECUTIVE',
                  name: 'New Member',
                  role_en: 'Director',
                  role_ar: 'مدير',
                  bio_en: '',
                  bio_ar: '',
                  location_en: 'Riyadh',
                  location_ar: 'الرياض',
                  image_url: '/images/about/tariq.jpg',
                }],
              })}
              className="px-3 py-1.5 rounded-lg bg-[#043927] text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(leadership.members || []).map((mem, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <img
                    src={mem.image_url?.startsWith('/images/') ? mem.image_url : getImageUrl(mem.image_url)}
                    alt={mem.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <label className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold cursor-pointer text-[11px]">
                    {uploadingField === `mem_${idx}` ? '...' : 'Change Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], `mem_${idx}`, (url) => {
                      const next = [...leadership.members]; next[idx] = { ...mem, image_url: url }; updateSection('leadership_section', { ...leadership, members: next });
                    })} />
                  </label>
                  <button type="button" onClick={() => updateSection('leadership_section', { ...leadership, members: leadership.members.filter((_, i) => i !== idx) })} className="text-rose-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input type="text" placeholder="Name" value={mem.name || ''} onChange={(e) => {
                  const next = [...leadership.members]; next[idx] = { ...mem, name: e.target.value }; updateSection('leadership_section', { ...leadership, members: next });
                }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold" />
                <input type="text" placeholder="Department" value={mem.department || ''} onChange={(e) => {
                  const next = [...leadership.members]; next[idx] = { ...mem, department: e.target.value }; updateSection('leadership_section', { ...leadership, members: next });
                }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                <input type="text" placeholder="Role (EN)" value={mem.role_en || ''} onChange={(e) => {
                  const next = [...leadership.members]; next[idx] = { ...mem, role_en: e.target.value }; updateSection('leadership_section', { ...leadership, members: next });
                }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                <input type="text" dir="rtl" placeholder="Role (AR)" value={mem.role_ar || ''} onChange={(e) => {
                  const next = [...leadership.members]; next[idx] = { ...mem, role_ar: e.target.value }; updateSection('leadership_section', { ...leadership, members: next });
                }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                <textarea rows={2} placeholder="Bio (EN)" value={mem.bio_en || ''} onChange={(e) => {
                  const next = [...leadership.members]; next[idx] = { ...mem, bio_en: e.target.value }; updateSection('leadership_section', { ...leadership, members: next });
                }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SUSTAINABILITY & TIMELINE ==================== */}
      {activeTab === 'sustainability_timeline' && (
        <div className="space-y-6 text-xs">
          {/* Sustainability */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">Sustainability & Impact Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Title (EN)" value={sustainability.title_en || ''} onChange={(e) => updateSection('sustainability_section', { ...sustainability, title_en: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold" />
              <input type="text" dir="rtl" placeholder="Title (AR)" value={sustainability.title_ar || ''} onChange={(e) => updateSection('sustainability_section', { ...sustainability, title_ar: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(sustainability.metrics || []).map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <input type="text" placeholder="Label (EN)" value={m.label_en || ''} onChange={(e) => {
                    const next = [...sustainability.metrics]; next[idx] = { ...m, label_en: e.target.value }; updateSection('sustainability_section', { ...sustainability, metrics: next });
                  }} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold" />
                  <input type="text" placeholder="Value (e.g. 1,420,000 bags)" value={m.value_text || ''} onChange={(e) => {
                    const next = [...sustainability.metrics]; next[idx] = { ...m, value_text: e.target.value }; updateSection('sustainability_section', { ...sustainability, metrics: next });
                  }} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  <input type="number" min={0} max={100} placeholder="Progress %" value={m.percentage || 0} onChange={(e) => {
                    const next = [...sustainability.metrics]; next[idx] = { ...m, percentage: parseInt(e.target.value, 10) || 0 }; updateSection('sustainability_section', { ...sustainability, metrics: next });
                  }} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#043927]" />
                <span>Company Growth Timeline</span>
              </h2>
              <button
                type="button"
                onClick={() => updateSection('timeline_section', {
                  ...timeline,
                  steps: [...(timeline.steps || []), { step_number: (timeline.steps?.length || 0) + 1, year_tag: '2026 • MILESTONE', title_en: 'New Milestone', title_ar: 'إنجاز جديد', description_en: '', description_ar: '', is_highlighted: false }],
                })}
                className="px-3 py-1.5 rounded-lg bg-[#043927] text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(timeline.steps || []).map((st, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Step #{idx + 1}</span>
                    <button type="button" onClick={() => updateSection('timeline_section', { ...timeline, steps: timeline.steps.filter((_, i) => i !== idx) })} className="text-rose-500 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input type="text" placeholder="Year Tag (e.g. 2021 • FOUNDING)" value={st.year_tag || ''} onChange={(e) => {
                    const next = [...timeline.steps]; next[idx] = { ...st, year_tag: e.target.value }; updateSection('timeline_section', { ...timeline, steps: next });
                  }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  <input type="text" placeholder="Title (EN)" value={st.title_en || ''} onChange={(e) => {
                    const next = [...timeline.steps]; next[idx] = { ...st, title_en: e.target.value }; updateSection('timeline_section', { ...timeline, steps: next });
                  }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold" />
                  <textarea rows={2} placeholder="Description (EN)" value={st.description_en || ''} onChange={(e) => {
                    const next = [...timeline.steps]; next[idx] = { ...st, description_en: e.target.value }; updateSection('timeline_section', { ...timeline, steps: next });
                  }} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: CTA & SECTION VISIBILITY ==================== */}
      {activeTab === 'cta_visibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Bottom CTA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h2 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">Bottom CTA Banner</h2>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Title (EN)</label>
              <input type="text" value={cta.title_en || ''} onChange={(e) => updateSection('cta_section', { ...cta, title_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Title (AR)</label>
              <input type="text" dir="rtl" value={cta.title_ar || ''} onChange={(e) => updateSection('cta_section', { ...cta, title_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description (EN)</label>
              <textarea rows={2} value={cta.description_en || ''} onChange={(e) => updateSection('cta_section', { ...cta, description_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Button (EN)</label>
                <input type="text" value={cta.primary_btn_en || ''} onChange={(e) => updateSection('cta_section', { ...cta, primary_btn_en: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary URL</label>
                <input type="text" value={cta.primary_btn_url || ''} onChange={(e) => updateSection('cta_section', { ...cta, primary_btn_url: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            </div>
          </div>

          {/* Section Visibility Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h2 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">Section Visibility Controls</h2>
            <p className="text-slate-500">Toggle which sections are visible on the public `/about` page.</p>
            <div className="space-y-2.5 pt-1">
              {[
                { key: 'hero', label: '1. Hero Story & Mission Banner' },
                { key: 'stats', label: '2. Key Metric Stats Bar' },
                { key: 'principles', label: '3. Guiding Principles Cards' },
                { key: 'farmers', label: '4. Featured Saudi Farmer Spotlight' },
                { key: 'leadership', label: '5. Executive Leadership Team' },
                { key: 'sustainability', label: '6. Sustainability & Impact Banner' },
                { key: 'timeline', label: '7. Company Growth Timeline' },
                { key: 'cta', label: '8. Bottom Call-to-Action Banner' },
              ].map((sec) => (
                <label key={sec.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <span className="font-bold text-slate-800">{sec.label}</span>
                  <input
                    type="checkbox"
                    checked={vis[sec.key] !== false}
                    onChange={(e) => updateSection('section_visibility', { ...vis, [sec.key]: e.target.checked })}
                    className="w-4 h-4 accent-[#043927] cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
