'use client';
import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../src/services/api';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import {
  ShoppingBag,
  Package,
  Truck,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Landmark,
  MapPin,
  TrendingUp,
  CreditCard,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Apple,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { t, locale } = useLanguage();
  const [metrics, setMetrics] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/dashboard');
      if (res.success) {
        setMetrics(res.data.metrics || {});
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          {locale === 'ar' ? 'جاري تحميل لوحة تحكم البقالة...' : 'Loading Fresh Grocery Dashboard...'}
        </p>
      </div>
    );
  }

  const pb = metrics.paymentsBreakdown || {};
  const db = metrics.deliveryBreakdown || {};

  const completionRate = metrics.totalOrders > 0
    ? Math.round(((metrics.completedOrders || 0) / metrics.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {locale === 'ar' ? 'لوحة تحكم بقالة وسوبرماركت أورا الطازج' : 'Super Mart Dashboard'}
            </h1>
            <p className="text-xs text-slate-500">
              {locale === 'ar' ? 'نظرة عامة شمولية على طلبات المواد الغذائية، التوصيل السريع، المخزون الطازج، والتحويلات البنكية' : 'Real-time Fresh Produce Inventory, Express Deliveries, Customer Grocery Orders & ZATCA Tax Invoices'}
            </p>
          </div>
        </div>

        <button
          onClick={loadDashboardData}
          className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'تحديث البيانات' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Primary KPI Stats Grid (6 Core Stats for Grocery) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* 1. Total Grocery Customers */}
        <Link href="/admin/customers" className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-700">
              {locale === 'ar' ? 'مستهلكي البقالة' : 'Total Customers '}
            </span>
            <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalCustomers || 0}</div>
          <p className="text-[10px] text-slate-500 font-medium">
            {locale === 'ar' ? 'عناوين التوصيل المسجلة' : 'Registered Buyers'}
          </p>
        </Link>

        {/* 2. Express Delivery Drivers */}
        <Link href="/admin/drivers" className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-cyan-300 hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-cyan-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-cyan-700">
              {locale === 'ar' ? 'سائقي التوصيل' : 'Total Drivers '}
            </span>
            <Truck className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalDrivers || 0}</div>
          <p className="text-[10px] text-cyan-700 font-medium">
            {metrics.activeDriversCount || 0} {locale === 'ar' ? 'نشط في الأسطول المبرد' : 'Active Fleet Drivers'}
          </p>
        </Link>

        {/* 4. Total Grocery Orders */}
        <Link href="/admin/orders" className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-700">
              {locale === 'ar' ? 'طلبات البقالة' : 'Total Orders'}
            </span>
            <Package className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalOrders || 0}</div>
          <p className="text-[10px] text-slate-500 font-medium">
            {locale === 'ar' ? 'إجمالي طلبات السوبرماركت' : 'All Lifetime Basket Orders'}
          </p>
        </Link>

        {/* 5. Pending / Packing Orders */}
        <Link href="/admin/orders" className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-700">
              {locale === 'ar' ? 'قيد التجهيز والدفع' : 'Pending Orders'}
            </span>
            <Clock className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.pendingOrders || 0}</div>
          <p className="text-[10px] text-amber-700 font-medium">
            {locale === 'ar' ? 'تنتظر التجهيز والاعتماد' : 'Awaiting Payment/Packing'}
          </p>
        </Link>

        {/* 6. Delivered Fresh Orders */}
        <Link href="/admin/orders" className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-700">
              {locale === 'ar' ? 'طلبات تم توصيلها' : 'Completed  Orders'}
            </span>
            <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.completedOrders || 0}</div>
          <p className="text-[10px] text-emerald-700 font-medium">
            {completionRate}% {locale === 'ar' ? 'نسبة نجاح التوصيل' : 'Fulfillment Success'}
          </p>
        </Link>
      </div>

      {/* Main Analytics Sections Grid (Payment Status & Delivery Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment Status Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {locale === 'ar' ? 'حالة مدفوعات البقالة' : 'Grocery Payment Audit'}
                </h2>
                <p className="text-xs text-slate-500">
                  {locale === 'ar' ? 'اعتماد إيصالات التحويل البنكي لطلبات المواد الغذائية' : 'Status of customer bank transfers & checkout payments'}
                </p>
              </div>
            </div>

            <Link
              href="/admin/payments"
              className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 group"
            >
              <span>{locale === 'ar' ? 'إدارة المدفوعات' : 'Audit Payments'}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>{locale === 'ar' ? 'مقبولة ومعتمدة' : 'Verified'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{pb.verified || 0}</p>
              <p className="text-[10px] text-slate-500">Approved for delivery dispatch</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
                <span>{locale === 'ar' ? 'بانتظار مراجعة الوصل' : 'Pending Verification'}</span>
                <Landmark className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-700">{pb.submitted || 0}</p>
              <p className="text-[10px] text-slate-500">Bank receipt uploaded by buyer</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-rose-700 font-semibold">
                <span>{locale === 'ar' ? 'إيصالات مرفوضة' : 'Rejected Payments'}</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-700">{pb.rejected || 0}</p>
              <p className="text-[10px] text-slate-500">Declined bank receipts</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                <span>{locale === 'ar' ? 'سلة بدون رفع وصل' : 'Unpaid Basket'}</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-800">{pb.pending || 0}</p>
              <p className="text-[10px] text-slate-500">New basket checkout</p>
            </div>
          </div>
        </div>

        {/* Cold Chain Express Delivery Status Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {locale === 'ar' ? 'حالة التوصيل السريع والمبرد' : 'Express Delivery & Cold Chain Status'}
                </h2>
                <p className="text-xs text-slate-500">
                  {locale === 'ar' ? 'متابعة توجيه السائقين المباشر وتتبع شحنات الأغذية' : 'Real-time dispatch & active driver grocery fulfillment'}
                </p>
              </div>
            </div>

            <Link
              href="/admin/deliveries/tracking"
              className="text-xs text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-1 group"
            >
              <span>{locale === 'ar' ? 'خريطة التتبع' : 'Live GPS Fleet Map'}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-indigo-700 font-semibold">
                <span>{locale === 'ar' ? 'جاهز للتوجيه' : 'Pending Dispatch'}</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-700">{db.pendingDispatch || 0}</p>
              <p className="text-[10px] text-slate-500">Payment approved, needs driver</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-700 font-semibold">
                <span>{locale === 'ar' ? 'تم تعيين السائق' : 'Driver Assigned'}</span>
                <Truck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-cyan-700">{db.assigned || 0}</p>
              <p className="text-[10px] text-slate-500">Assigned to fleet driver</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-purple-700 font-semibold">
                <span>{locale === 'ar' ? 'في الطريق للعميل' : 'Out for Delivery'}</span>
                <MapPin className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-700">{db.outForDelivery || 0}</p>
              <p className="text-[10px] text-slate-500">Express delivery in transit</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>{locale === 'ar' ? 'تم التوصيل بنجاح' : 'Delivered Fresh'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{db.delivered || 0}</p>
              <p className="text-[10px] text-slate-500">Completed order fulfillment</p>
            </div>
          </div>
        </div>

      </div>

      {/* Sales & Order Statistics Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {locale === 'ar' ? 'إحصائيات مبيعات المواد الغذائية' : 'Grocery Sales & Revenue Analytics'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'ar' ? 'تحليل الإيرادات المحصلة، ومتوسط قيمة السلة، وأحدث طلبات الأغذية' : 'Financial revenue metrics, average grocery basket value & live order stream'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm">
              {locale === 'ar' ? 'مبيعات الأغذية: ' : 'Grocery Sales: '}
              <span className="text-slate-900">{parseFloat(metrics.totalRevenue || 0).toFixed(2)} SAR</span>
            </div>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium">{locale === 'ar' ? 'إجمالي مبيعات البقالة المحصلة' : 'Net Grocery Sales Revenue'}</span>
            <div className="text-xl font-extrabold text-emerald-700 flex items-center gap-2">
              <span>{parseFloat(metrics.totalRevenue || 0).toFixed(2)} SAR</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium">{locale === 'ar' ? 'متوسط قيمة سلة التسوق' : 'Average Basket Value (ABV)'}</span>
            <div className="text-xl font-extrabold text-cyan-700">
              {parseFloat(metrics.avgOrderValue || 0).toFixed(2)} SAR
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium">{locale === 'ar' ? 'نسبة كفاءة التوصيل السريع' : 'Express Delivery Success'}</span>
            <div className="text-xl font-extrabold text-purple-700">
              {completionRate}%
            </div>
          </div>
        </div>

        {/* Recent Grocery Orders Stream */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>{locale === 'ar' ? 'أحدث طلبات السوبرماركت والبقالة' : 'Recent Grocery Orders Activity'}</span>
            <Link href="/admin/orders" className="text-emerald-700 hover:underline font-bold">
              {locale === 'ar' ? 'عرض كافة طلبات البقالة' : 'View All Grocery Orders →'}
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No grocery orders placed yet.</div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-all flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-emerald-700 shadow-xs">
                      #{ord.order_number?.substring(ord.order_number.length - 4)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">#{ord.order_number}</span>
                      <span className="text-slate-500 text-[11px]">
                        Customer: {ord.customer?.first_name ? `${ord.customer.first_name} ${ord.customer.last_name || ''}` : 'Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ord.order_status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      ord.order_status === 'PENDING_PAYMENT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        ord.order_status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                      {ord.order_status}
                    </span>

                    <span className="font-black text-slate-900 text-sm">
                      {parseFloat(ord.grand_total).toFixed(2)} SAR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
