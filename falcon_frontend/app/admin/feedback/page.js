'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { MessageSquare, Star, User } from 'lucide-react';

export default function AdminFeedbackPage() {
  const { t, locale } = useLanguage();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/feedback');
      if (res.success) {
        setFeedbacks(res.data.feedbacks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{locale === 'ar' ? 'تقييمات وآراء العملاء' : 'Customer Feedback & Reviews'}</h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'عرض التقييمات والملاحظات الواردة من العملاء بعد التوصيل' : 'Customer ratings and delivered order review moderation'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading feedback...</div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          No customer reviews submitted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 hover:border-amber-300 shadow-xs transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{fb.customer?.first_name} {fb.customer?.last_name}</span>
                    <p className="text-[10px] text-slate-500">Order #{fb.order?.order_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-700 text-xs">{fb.rating} / 5</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                "{fb.comment || 'No written comment provided.'}"
              </p>

              <span className="text-[10px] text-slate-400 block text-right">
                Submitted on: {new Date(fb.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
