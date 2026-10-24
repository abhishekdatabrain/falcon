'use client';
import React from 'react';
import { Check, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Formats a valid ISO date string into a clear date and time display:
 * e.g., "24 Oct 2026, 04:30 PM"
 */
function formatStepDateTime(dateStr, locale) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const datePart = d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timePart = d.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${datePart}, ${timePart}`;
}

/**
 * OrderTrackingTimeline Component
 * 
 * Clean, professional 4-step order tracking timeline:
 * 1. Order Confirmed
 * 2. Shipped
 * 3. Out for Delivery
 * 4. Delivered
 * 
 * - Responsive: Horizontal progress bar on desktop, vertical timeline on mobile.
 * - Green checkmarks for completed steps, highlighted current step, light grey for upcoming.
 * - Shows real status history timestamps (never fake dates), "Pending" when not occurred,
 *   and clearly labeled "Estimated" if backend provides estimated delivery dates.
 * - Separate handling for CANCELLED, DELIVERY_FAILED, and RETURNED orders.
 */
export default function OrderTrackingTimeline({ order, className = '' }) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  if (!order) return null;

  const status = String(order.order_status || order.status || '').toUpperCase();
  const history = Array.isArray(order.status_history) ? order.status_history : [];

  // Helper to extract timestamp for specific statuses in order history
  const getTimestampFor = (statusList) => {
    const match = history.find((h) => statusList.includes(String(h.to_status || '').toUpperCase()));
    return match?.createdAt || null;
  };

  // ================= 1. TERMINAL / EXCEPTION STATUS HANDLING =================
  if (status === 'CANCELLED') {
    const cancelledTime = order.cancelled_at || getTimestampFor(['CANCELLED']) || order.updatedAt;
    return (
      <div className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-rose-200/90 shadow-2xs font-sans ${className}`}>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
            <XCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-rose-900">
                {isAr ? 'تم إلغاء الطلب' : 'Order Cancelled'}
              </h3>
              {cancelledTime && (
                <span className="text-xs font-semibold text-rose-600 font-mono">
                  {formatStepDateTime(cancelledTime, locale)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {order.cancellation_reason || order.cancellation_remarks || (isAr ? 'تم إلغاء هذا الطلب ولا يمكن متابعة التوصيل.' : 'This order was cancelled and will not be delivered.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'DELIVERY_FAILED') {
    const failedTime = getTimestampFor(['DELIVERY_FAILED']) || order.updatedAt;
    return (
      <div className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-amber-200/90 shadow-2xs font-sans ${className}`}>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-amber-900">
                {isAr ? 'تعذر توصيل الطلب' : 'Delivery Attempt Failed'}
              </h3>
              {failedTime && (
                <span className="text-xs font-semibold text-amber-600 font-mono">
                  {formatStepDateTime(failedTime, locale)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {order.delivery?.failure_reason || (isAr ? 'تعذر على مندوب التوصيل إكمال عملية التسليم. سيتم إعادة الجدولة والتوصيل.' : 'The courier was unable to complete delivery. A new delivery attempt will be scheduled.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'RETURNED') {
    const returnedTime = getTimestampFor(['RETURNED']) || order.updatedAt;
    return (
      <div className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-300 shadow-2xs font-sans ${className}`}>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {isAr ? 'تم إرجاع الطلب' : 'Order Returned'}
              </h3>
              {returnedTime && (
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {formatStepDateTime(returnedTime, locale)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {isAr ? 'تمت إعادة المنتجات بنجاح إلى المستودع.' : 'The products have been returned to our fulfilment centre.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. 4-STEP TIMELINE MAPPING =================
  // Step 1: Order Confirmed
  const confirmedTimestamp = getTimestampFor(['CONFIRMED', 'PAYMENT_VERIFIED']) || order.createdAt || null;
  const isStep1Reached = ['CONFIRMED', 'PROCESSING', 'PACKED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status) || Boolean(order.createdAt);

  // Step 2: Shipped
  const shippedTimestamp = getTimestampFor(['PACKED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PROCESSING']) || order.delivery?.createdAt || null;
  const isStep2Reached = ['PROCESSING', 'PACKED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status) || Boolean(order.delivery?.id);

  // Step 3: Out for Delivery
  const outForDeliveryTimestamp = getTimestampFor(['OUT_FOR_DELIVERY', 'ARRIVED']) || order.delivery?.start_time || null;
  const isStep3Reached = ['OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status) || Boolean(order.delivery?.start_time);

  // Step 4: Delivered
  const deliveredTimestamp = getTimestampFor(['DELIVERED', 'COMPLETED']) || order.delivery?.end_time || order.delivery?.otp_verified_at || (['DELIVERED', 'COMPLETED'].includes(status) ? order.updatedAt : null);
  const isStep4Reached = ['DELIVERED', 'COMPLETED'].includes(status);

  // Determine current active step (1 to 4)
  let currentStep = 1;
  if (isStep4Reached) {
    currentStep = 4;
  } else if (isStep3Reached) {
    currentStep = 3;
  } else if (isStep2Reached) {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  const steps = [
    {
      id: 1,
      name: isAr ? 'تم تأكيد الطلب' : 'Order Confirmed',
      isCompleted: isStep1Reached && currentStep > 1,
      isCurrent: currentStep === 1,
      timestamp: confirmedTimestamp,
      displayTime: confirmedTimestamp
        ? formatStepDateTime(confirmedTimestamp, locale)
        : (isAr ? 'قيد الانتظار' : 'Pending'),
      isEstimated: false,
    },
    {
      id: 2,
      name: isAr ? 'تم الشحن' : 'Shipped',
      isCompleted: isStep2Reached && currentStep > 2,
      isCurrent: currentStep === 2,
      timestamp: shippedTimestamp,
      displayTime: shippedTimestamp
        ? formatStepDateTime(shippedTimestamp, locale)
        : (isAr ? 'قيد الانتظار' : 'Pending'),
      isEstimated: false,
    },
    {
      id: 3,
      name: isAr ? 'خرج للتوصيل' : 'Out for Delivery',
      isCompleted: isStep3Reached && currentStep > 3,
      isCurrent: currentStep === 3,
      timestamp: outForDeliveryTimestamp,
      displayTime: outForDeliveryTimestamp
        ? formatStepDateTime(outForDeliveryTimestamp, locale)
        : (isAr ? 'قيد الانتظار' : 'Pending'),
      isEstimated: false,
    },
    {
      id: 4,
      name: isAr ? 'تم التوصيل' : 'Delivered',
      isCompleted: isStep4Reached,
      isCurrent: currentStep === 4,
      timestamp: deliveredTimestamp,
      displayTime: deliveredTimestamp
        ? formatStepDateTime(deliveredTimestamp, locale)
        : (order.delivery_date
          ? `${isAr ? 'تقديري: ' : 'Estimated: '}${order.delivery_date}${order.delivery_slot ? ' (' + order.delivery_slot + ')' : ''}`
          : (isAr ? 'قيد الانتظار' : 'Pending')),
      isEstimated: !deliveredTimestamp && Boolean(order.delivery_date),
    },
  ];

  return (
    <div className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs font-sans ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#05A764] animate-pulse" />
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            {isAr ? 'مراحل تتبع الطلب' : 'Order Tracking Progress'}
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {currentStep === 4
            ? (isAr ? 'اكتمل التوصيل' : 'Delivered')
            : (isAr ? `المرحلة ${currentStep} من 4` : `Step ${currentStep} of 4`)}
        </span>
      </div>

      {/* ================= DESKTOP HORIZONTAL TIMELINE (md:block) ================= */}
      <div className="hidden md:block">
        <div className="grid grid-cols-4 relative items-start">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isLineCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="relative flex flex-col items-center text-center px-1">
                {/* Connecting Horizontal Line between markers */}
                {!isLast && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-1 z-0 transition-colors duration-500 rtl:right-1/2 rtl:left-auto ${
                      isLineCompleted ? 'bg-[#05A764]' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Marker Circle */}
                <div className="relative z-10 mb-2.5">
                  {step.isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-[#05A764] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : step.isCurrent ? (
                    <div className="w-8 h-8 rounded-full bg-[#05A764] text-white flex items-center justify-center font-black text-xs ring-4 ring-emerald-100 shadow-sm animate-pulse">
                      <span>{step.id}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs">
                      <span>{step.id}</span>
                    </div>
                  )}
                </div>

                {/* Step Title */}
                <h4
                  className={`text-xs sm:text-sm tracking-tight ${
                    step.isCurrent
                      ? 'font-black text-slate-900'
                      : step.isCompleted
                        ? 'font-extrabold text-slate-800'
                        : 'font-semibold text-slate-400'
                  }`}
                >
                  {step.name}
                </h4>

                {/* Date & Time / Pending / Estimated */}
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    step.isEstimated
                      ? 'font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/60'
                      : step.isCurrent
                        ? 'font-bold text-[#05A764]'
                        : step.isCompleted
                          ? 'font-medium text-slate-600'
                          : 'font-normal text-slate-400'
                  }`}
                >
                  {step.displayTime}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MOBILE VERTICAL TIMELINE (block md:hidden) ================= */}
      <div className="block md:hidden space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isLineCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
              {/* Connecting Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute top-7 left-3.5 -ml-0.5 w-1 h-[calc(100%-1.25rem)] z-0 transition-colors duration-500 rtl:right-3.5 rtl:left-auto rtl:-mr-0.5 ${
                    isLineCompleted ? 'bg-[#05A764]' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Marker Circle */}
              <div className="relative z-10 shrink-0">
                {step.isCompleted ? (
                  <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : step.isCurrent ? (
                  <div className="w-7 h-7 rounded-full bg-[#05A764] text-white flex items-center justify-center font-black text-xs ring-4 ring-emerald-100 shadow-sm animate-pulse">
                    <span>{step.id}</span>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs">
                    <span>{step.id}</span>
                  </div>
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4
                    className={`text-xs sm:text-sm ${
                      step.isCurrent
                        ? 'font-black text-slate-900'
                        : step.isCompleted
                          ? 'font-extrabold text-slate-800'
                          : 'font-semibold text-slate-400'
                    }`}
                  >
                    {step.name}
                  </h4>
                  {step.isCurrent && (
                    <span className="text-[10px] font-bold text-[#05A764] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {isAr ? 'المرحلة الحالية' : 'Current Step'}
                    </span>
                  )}
                </div>

                <p
                  className={`text-[11px] sm:text-xs mt-0.5 leading-snug ${
                    step.isEstimated
                      ? 'font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/60'
                      : step.isCurrent
                        ? 'font-bold text-[#05A764]'
                        : step.isCompleted
                          ? 'font-medium text-slate-600'
                          : 'font-normal text-slate-400'
                  }`}
                >
                  {step.displayTime}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
