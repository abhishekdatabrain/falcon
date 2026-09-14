'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchApi } from '../../src/services/api';
import { Package, Clock, ArrowRight, Truck, FileText } from 'lucide-react';

export default function OrdersPage() {
  const { t } = useLanguage();
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'OUT_FOR_DELIVERY':
      case 'ARRIVED':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse';
      case 'PAYMENT_VERIFIED':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'PAYMENT_SUBMITTED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CANCELLED':
      case 'PAYMENT_REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading your orders...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-gray-400 space-y-4">
          <Package className="w-12 h-12 mx-auto text-gray-500" />
          <p>You have not placed any orders yet.</p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2 text-sm">
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-white">#{order.order_number}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.order_status)}`}>
                    {order.order_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-4">
                  <span>📅 {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>📦 {order.items ? order.items.length : 0} Items</span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Total</span>
                  <span className="text-xl font-bold text-cyan-400">{parseFloat(order.grand_total).toFixed(2)} SAR</span>
                </div>

                <div className="flex items-center gap-2">
                  {['OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.order_status) && (
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 hover:bg-cyan-500/30 transition-colors"
                    >
                      <Truck className="w-4 h-4 animate-bounce" /> Live Tracking
                    </Link>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <span>{t('orders.viewDetails')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
