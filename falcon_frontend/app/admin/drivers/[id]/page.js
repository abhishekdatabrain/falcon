'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { useToast } from '../../../../src/contexts/ToastContext';
import {
  Truck,
  Phone,
  Mail,
  Calendar,
  MapPin,
  History,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Navigation,
  FileText,
  DollarSign,
  PackageCheck,
  ChevronRight,
  User,
} from 'lucide-react';

export default function AdminDriverHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const { showToast } = useToast();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadDriverDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/admin/drivers/${id}`);
      if (res.success && res.data.driver) {
        setDriver(res.data.driver);
      } else {
        showToast('Driver profile not found', 'error');
      }
    } catch (err) {
      console.error('Failed to load driver profile history:', err);
      showToast(err.message || 'Failed to fetch driver delivery history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDriverDetails();
    }
  }, [id]);

  const deliveries = driver?.deliveries || [];

  const filteredDeliveries = deliveries.filter((del) => {
    const q = searchQuery.toLowerCase().trim();
    const orderNo = (del.order?.order_number || del.order_id || '').toLowerCase();
    const custName = `${del.order?.customer?.first_name || ''} ${del.order?.customer?.last_name || ''}`.toLowerCase();
    const custPhone = (del.order?.customer?.user?.mobile || '').toLowerCase();
    const address = `${del.order?.address?.street || ''} ${del.order?.address?.city || ''}`.toLowerCase();

    const matchesQuery = !q || orderNo.includes(q) || custName.includes(q) || custPhone.includes(q) || address.includes(q);
    const matchesStatus = statusFilter === 'ALL' || del.status === statusFilter || del.order?.order_status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  // Calculate Statistics
  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED' || d.order?.order_status === 'DELIVERED').length;
  const activeDeliveries = deliveries.filter((d) => ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(d.status || d.order?.order_status)).length;
  const totalRevenueHandled = deliveries
    .filter((d) => d.status === 'DELIVERED' || d.order?.order_status === 'DELIVERED')
    .reduce((sum, d) => sum + (parseFloat(d.order?.grand_total) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/drivers"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
            title={locale === 'ar' ? 'الرجوع إلى السائقين' : 'Back to Drivers'}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">
                {locale === 'ar' ? 'سجل توصيل السائق' : 'Driver Delivery History'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 font-mono">
                {driver?.user?.email || 'Driver Profile'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {locale === 'ar'
                ? 'عرض السجل الكامل لجميع طلبات الشحن والتوصيل المسندة لهذا السائق'
                : 'Detailed audit trail and complete record of all orders assigned to this driver'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDriverDetails}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">{locale === 'ar' ? 'جاري تحميل سجل السائق...' : 'Loading driver delivery history profile...'}</p>
        </div>
      ) : !driver ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">{locale === 'ar' ? 'لم يتم العثور على ملف السائق' : 'Driver record not found'}</p>
          <Link
            href="/admin/drivers"
            className="inline-block text-xs font-bold px-4 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-all"
          >
            {locale === 'ar' ? 'العودة إلى السائقين' : 'Return to Drivers List'}
          </Link>
        </div>
      ) : (
        <>
          {/* Driver Summary Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Driver Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-xl shadow-md shrink-0">
                {driver.user?.email?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">{driver.user?.email}</h2>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${driver.user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {driver.user?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{driver.user?.mobile || 'No mobile listed'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{driver.user?.createdAt ? new Date(driver.user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* License & Vehicle Details */}
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{locale === 'ar' ? 'معلومات المركبة والرخصة' : 'Vehicle & License Info'}</div>
              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-600" />
                <span>License: <strong className="font-mono text-cyan-700">{driver.license_number}</strong></span>
              </div>
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>{driver.vehicle_details || 'No vehicle info registered'}</span>
              </div>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                  driver.availability_status === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : driver.availability_status === 'BUSY'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${driver.availability_status === 'AVAILABLE' ? 'bg-emerald-500' : driver.availability_status === 'BUSY' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {driver.availability_status || 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Performance Key Metrics */}
            <div className="grid grid-cols-2 gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="text-[11px] font-bold text-slate-500">{locale === 'ar' ? 'إجمالي التوصيلات' : 'Total Orders'}</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{totalDeliveries}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80">
                <div className="text-[11px] font-bold text-emerald-700">{locale === 'ar' ? 'مكتملة بنجاح' : 'Completed'}</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">{completedDeliveries}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80">
                <div className="text-[11px] font-bold text-amber-700">{locale === 'ar' ? 'قيد التوصيل' : 'Active Now'}</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">{activeDeliveries}</div>
              </div>
              <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-200/80">
                <div className="text-[11px] font-bold text-cyan-700">{locale === 'ar' ? 'القيمة الشاملة' : 'Total Handled'}</div>
                <div className="text-sm font-black text-cyan-800 mt-0.5">{totalRevenueHandled.toFixed(2)} SAR</div>
              </div>
            </div>
          </div>

          {/* Delivery History Section Header & Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-600" />
              <h3 className="text-base font-black text-slate-900">
                {locale === 'ar' ? 'سجل الطلبات المسندة' : 'Assigned Deliveries Log'}
              </h3>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredDeliveries.length} {locale === 'ar' ? 'طلب' : 'Records'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="relative w-full sm:w-48">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-cyan-500 outline-hidden cursor-pointer"
                >
                  <option value="ALL">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="DELIVERED">DELIVERED (تم التوصيل)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (خرج للتوصيل)</option>
                  <option value="DRIVER_ASSIGNED">DRIVER_ASSIGNED (مسند)</option>
                  <option value="CANCELLED">CANCELLED (ملغي)</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'بحث برقم الطلب، العميل أو العنوان...' : 'Search order #, customer, address...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Delivery History Table */}
          {filteredDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchQuery || statusFilter !== 'ALL'
                  ? (locale === 'ar' ? 'لم يتم العثور على طلبات تطابق الفلتر' : 'No delivery records match your search filter')
                  : (locale === 'ar' ? 'لا يوجد سجل توصيل لهذا السائق بعد' : 'No delivery history found for this driver yet')}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'رقم الطلب' : 'Order Details'}</th>
                      <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'العميل والموبايل' : 'Customer Info'}</th>
                      <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</th>
                      <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'حالة الشحنة' : 'Delivery Status'}</th>
                      <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                      <th className="px-6 py-4 whitespace-nowrap">{locale === 'ar' ? 'تاريخ التعيين' : 'Assigned Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeliveries.map((del) => {
                      const order = del.order || {};
                      const cust = order.customer || {};
                      const custUser = cust.user || {};
                      const addr = order.address || {};

                      const isDelivered = del.status === 'DELIVERED' || order.order_status === 'DELIVERED';
                      const isActive = ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(del.status || order.order_status);

                      return (
                        <tr key={del.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Order Number & Items count */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0">
                                <PackageCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-900 font-mono">
                                  #{order.order_number || del.order_id?.slice(0, 8)}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {order.items?.length || 1} {locale === 'ar' ? 'عناصر' : 'items'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Customer Info */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-xs font-extrabold text-slate-800">
                                {cust.first_name ? `${cust.first_name} ${cust.last_name || ''}` : 'Customer'}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {custUser.mobile || custUser.email || 'N/A'}
                              </div>
                            </div>
                          </td>

                          {/* Address */}
                          <td className="px-6 py-4">
                            <div className="text-xs text-slate-700 font-medium max-w-xs truncate flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{addr.street ? `${addr.building_number || ''} ${addr.street}, ${addr.city || 'Riyadh'}` : 'Standard Shipping Address'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${
                              isDelivered
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? 'bg-emerald-500' : isActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              {del.status || order.order_status || 'ASSIGNED'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                            {parseFloat(order.grand_total || 0).toFixed(2)} SAR
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                            {del.createdAt ? new Date(del.createdAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
