'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useSocket } from '../../../src/contexts/SocketContext';
import { useToast } from '../../../src/contexts/ToastContext';
import LiveTrackingMap from '../../../src/components/LiveTrackingMap';
import { Package, Truck, Download, Star, CheckCircle2, MapPin, Landmark, MessageSquare } from 'lucide-react';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { t, locale } = useLanguage();
  const { socket, joinDeliveryRoom, leaveDeliveryRoom } = useSocket();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  // Feedback Form State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const loadOrderDetails = async () => {
    try {
      const res = await fetchApi(`/orders/${id}`);
      if (res.success && res.data.order) {
        setOrder(res.data.order);
        if (res.data.order.feedback) {
          setFeedbackSubmitted(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOrderDetails();
  }, [id]);

  useEffect(() => {
    if (order && order.delivery) {
      const deliveryId = order.delivery.id;
      joinDeliveryRoom(deliveryId);

      if (order.delivery.current_lat && order.delivery.current_lng) {
        setDriverLocation({
          lat: parseFloat(order.delivery.current_lat),
          lng: parseFloat(order.delivery.current_lng),
        });
      }

      if (socket) {
        socket.on('driverLocationUpdate', (data) => {
          if (data.deliveryId === deliveryId) {
            setDriverLocation({ lat: data.lat, lng: data.lng });
          }
        });
      }

      return () => {
        leaveDeliveryRoom(deliveryId);
        if (socket) socket.off('driverLocationUpdate');
      };
    }
  }, [order, socket]);

  const handleDownloadInvoice = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    window.open(`${API_BASE}/invoices/order/${order.id}/pdf`, '_blank');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment,
        }),
      });

      if (res.success) {
        setFeedbackSubmitted(true);
        setShowFeedbackModal(false);
        showToast(
          locale === 'ar' ? 'شكراً لتقييمك الفائق!' : 'Thank you for your feedback!',
          'success'
        );
        await loadOrderDetails();
      } else {
        showToast(res.message || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading order details...</div>;
  }

  if (!order) {
    return <div className="py-12 text-center text-red-400">Order not found or access denied.</div>;
  }

  const isLiveTrackingActive = order.delivery && ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.order_status);

  return (
    <div className="space-y-8">
      
      {/* Header Info */}
      <div className="glass-panel rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-gray-400 block uppercase tracking-wider">Order Reference</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">#{order.order_number}</h1>
          <p className="text-xs text-gray-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.order_status === 'DELIVERED' && (
            <>
              <button
                onClick={handleDownloadInvoice}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> ZATCA Invoice (PDF)
              </button>

              {!order.feedback && (
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 hover:bg-amber-500/30"
                >
                  <Star className="w-4 h-4" /> Leave Review
                </button>
              )}
            </>
          )}

          <span className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 font-semibold text-sm border border-indigo-500/30">
            {order.order_status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Live GPS Map Section (If Active Delivery) */}
      {isLiveTrackingActive && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Truck className="w-6 h-6 text-cyan-400 animate-bounce" />
              <span>{t('tracking.title')}</span>
            </h2>
            {driverLocation && (
              <span className="text-xs text-emerald-400 font-mono">
                Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          <LiveTrackingMap
            driverLat={driverLocation ? driverLocation.latitude : (order.delivery?.driver_locations?.[0]?.latitude ? parseFloat(order.delivery.driver_locations[0].latitude) : null)}
            driverLng={driverLocation ? driverLocation.longitude : (order.delivery?.driver_locations?.[0]?.longitude ? parseFloat(order.delivery.driver_locations[0].longitude) : null)}
            destLat={order.address?.latitude ? parseFloat(order.address.latitude) : 24.7136}
            destLng={order.address?.longitude ? parseFloat(order.address.longitude) : 46.6753}
            title={`Assigned Driver: ${order.delivery?.driver?.user?.email || 'Active Driver'}`}
          />
        </div>
      )}

      {/* Order Items & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Ordered Items</h2>
          {order.items?.map((item) => (
            <div key={item.id} className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white">
                  {locale === 'ar' ? item.product_name_ar : item.product_name_en}
                </h3>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × {parseFloat(item.unit_price).toFixed(2)} SAR</p>
              </div>
              <span className="font-bold text-cyan-400">{parseFloat(item.total_price).toFixed(2)} SAR</span>
            </div>
          ))}

          {/* Delivery Address Details */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-2">
            <h3 className="font-bold text-sm text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" /> Delivery Address
            </h3>
            <p className="text-sm font-semibold text-white">{order.address?.full_name} ({order.address?.mobile})</p>
            <p className="text-xs text-gray-400">{order.address?.address_line}, {order.address?.area}, {order.address?.city}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="glass-panel rounded-3xl p-6 border border-white/15 h-fit space-y-4">
          <h2 className="text-xl font-bold border-b border-white/10 pb-4">Payment & Totals</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between"><span>Subtotal:</span><span>{parseFloat(order.subtotal).toFixed(2)} SAR</span></div>
            <div className="flex justify-between"><span>VAT (15%):</span><span>{parseFloat(order.tax_total).toFixed(2)} SAR</span></div>
            <div className="flex justify-between"><span>Delivery Fee:</span><span>{parseFloat(order.delivery_fee).toFixed(2)} SAR</span></div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-base font-bold text-white">
              <span>Grand Total:</span><span className="text-cyan-400">{parseFloat(order.grand_total).toFixed(2)} SAR</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs space-y-1">
            <p className="font-bold text-gray-200">Bank Transfer Status:</p>
            <p className="text-indigo-400 font-mono font-semibold">{order.payment?.status}</p>
            {order.payment?.confirmation && (
              <p className="text-gray-400">Ref: {order.payment.confirmation.payment_reference}</p>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full border border-white/20 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> Leave Delivery Review
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl text-xl font-bold transition-transform hover:scale-110 ${
                        rating >= star ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-900 text-gray-600'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Comments & Feedback</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your delivery experience..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
