'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi } from '../../src/services/api';
import { Package, Clock, ArrowRight, Truck, ShoppingBag, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const { t, locale } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetchApi('/orders/my-orders');
        if (res.success) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-[#05442e] border-emerald-200';
      case 'OUT_FOR_DELIVERY':
      case 'ARRIVED':
        return 'bg-teal-50 text-teal-900 border-teal-200 animate-pulse';
      case 'PAYMENT_VERIFIED':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return 'bg-emerald-100 text-[#05442e] border-emerald-300';
      case 'PAYMENT_SUBMITTED':
        return 'bg-sky-50 text-sky-900 border-sky-200';
      case 'PENDING_PAYMENT':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'CANCELLED':
      case 'PAYMENT_REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#05442e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9f7] font-sans pb-28">
      
      {/* Top Banner Header */}
      <div className="bg-white border-b border-slate-200/80 py-6 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#05442e] flex items-center justify-center shrink-0 shadow-2xs">
              <Package className="w-6 h-6 text-[#05442e]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t('orders.title')}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {locale === 'ar' ? 'سجل طلباتك واستعراض تفاصيل وتتبع الشحنات' : 'Track current & past grocery order history'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {orders.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6 my-10">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#05442e] flex items-center justify-center mx-auto border border-emerald-100">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                {locale === 'ar' ? 'لم تقم بإنشاء أي طلب بعد' : 'No Orders Placed Yet'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {locale === 'ar' ? 'تصفح منتجاتنا الطازجة وأضف المواد الغذائية لسلتك الآن.' : 'Explore fresh products and start shopping for your groceries now.'}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
            >
              <span>{locale === 'ar' ? 'ابدأ التسوق الآن' : 'Start Shopping Now'}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180 text-amber-300" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-slate-900">#{order.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider ${getStatusBadge(order.order_status)}`}>
                      {order.order_status ? order.order_status.replace(/_/g, ' ') : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-4">
                    <span>📅 {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>📦 {order.items ? order.items.length : 0} {locale === 'ar' ? 'منتجات' : 'Items'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase">{t('cart.total')}</span>
                    <span className="text-lg font-black text-[#05442e]">{parseFloat(order.grand_total || 0).toFixed(2)} SAR</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {['OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.order_status) && (
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-3 py-2 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 text-xs font-black flex items-center gap-1.5 hover:bg-teal-100 transition-colors cursor-pointer"
                      >
                        <Truck className="w-4 h-4 text-emerald-700 animate-bounce" />
                        <span>Live Tracking</span>
                      </Link>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2.5 rounded-xl bg-[#05442e] hover:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{t('orders.viewDetails')}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
