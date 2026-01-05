// =====================================================
// TravelCanvas - AdminDashboard Component
// ERP 管理儀表板
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { TranslationDict } from '../types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  RefreshCw,
  Plus,
  Loader2,
  XCircle,
  CheckCircle2
} from './Icons';
import {
  fetchTravelPackages,
  fetchBookings
} from '../services/mockDataService';
import type { TravelPackage, Booking } from '../services/types';

interface AdminDashboardProps {
  t: TranslationDict;
}

interface DisplayPackage extends TravelPackage {
  bookingCount: number;
  totalRevenue: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ t }) => {
  const [packages, setPackages] = useState<DisplayPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'packages' | 'bookings'>('packages');

  const selectedPackage = useMemo(() =>
    packages.find(p => p.id === selectedPackageId),
    [packages, selectedPackageId]
  );

  const packageBookings = useMemo(() =>
    bookings.filter(b => b.package_id === selectedPackageId),
    [bookings, selectedPackageId]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setAdminLoading(true);
    try {
      const [packagesData, bookingsData] = await Promise.all([
        fetchTravelPackages(),
        fetchBookings()
      ]);

      const packagesWithStats = packagesData.map(pkg => {
        const pkgBookings = bookingsData.filter(b => b.package_id === pkg.id);
        const totalRevenue = pkgBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
        return {
          ...pkg,
          bookingCount: pkgBookings.length,
          totalRevenue
        };
      });

      setPackages(packagesWithStats);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;

    return { totalBookings, confirmedBookings, totalRevenue, pendingBookings };
  }, [bookings]);

  return (
    <div className="h-full flex bg-slate-50">
      {/* 側邊欄 */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-20">
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Overview
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm transition-all">
            <LayoutDashboard size={20} /> <span>{t.dashboard}</span>
          </button>
          <button
            onClick={() => setActiveView('packages')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium ${
              activeView === 'packages'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Package size={20} /> <span>Packages</span>
          </button>
          <button
            onClick={() => setActiveView('bookings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium ${
              activeView === 'bookings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShoppingCart size={20} /> <span>Bookings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-400 uppercase mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalBookings}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-600 uppercase mb-1">Revenue</p>
            <p className="text-xl font-bold text-emerald-700">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 flex overflow-hidden bg-slate-50 relative">

        {/* 表格區域 */}
        <div className={`${selectedPackage ? 'hidden lg:flex lg:w-3/5 xl:w-2/3' : 'w-full'} flex flex-col relative`}>
          {/* 工具列 */}
          <div className="p-4 flex justify-between items-center shrink-0 bg-slate-50/50 backdrop-blur-sm z-10">
            <div className="flex gap-3">
              <button
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-200 rounded-lg shadow-sm"
                onClick={() => { setSelectedPackageId(null); loadData(); }}
                aria-label="Refresh"
              >
                <RefreshCw size={18} className={adminLoading ? "animate-spin" : ""} />
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
                <Plus size={16} /> New {activeView === 'packages' ? 'Package' : 'Booking'}
              </button>
            </div>
          </div>

          {/* 資料表格 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {adminLoading ? (
              <div className="flex flex-col justify-center items-center h-full text-slate-400 gap-3">
                <Loader2 spinning className="text-blue-500" size={32} />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : activeView === 'packages' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Package</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Destination</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Duration</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Bookings</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Price</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {packages.map(pkg => (
                      <tr
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedPackageId === pkg.id ? 'bg-blue-50/60' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{pkg.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{pkg.description.slice(0, 50)}...</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {pkg.destination ? `${pkg.destination.city}, ${pkg.destination.country}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                          {pkg.duration_days} days
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-bold">
                            {pkg.bookingCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                          ${Number(pkg.base_price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-emerald-700 font-bold">
                          ${pkg.totalRevenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Booking #</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Travel Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Travelers</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map(booking => (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-slate-700">{booking.booking_number}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'N/A'}
                          </div>
                          <div className="text-xs text-slate-400">{booking.customer?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{booking.travel_date}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                          {booking.number_of_travelers}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : booking.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600 font-bold">
                          ${Number(booking.total_price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 詳情面板 */}
        {selectedPackage && (
          <div className="w-full lg:w-2/5 xl:w-1/3 bg-white border-l border-slate-200 h-full overflow-y-auto shadow-xl z-20 absolute right-0 lg:static animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Package Detail</span>
                <h3 className="text-xl font-bold text-slate-800">{selectedPackage.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPackageId(null)}
                className="text-slate-400 hover:text-slate-900"
                aria-label="Close"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedPackage.image_url && (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={selectedPackage.image_url}
                    alt={selectedPackage.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedPackage.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase mb-1">Duration</p>
                  <p className="text-lg font-bold text-slate-700">{selectedPackage.duration_days} days</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase mb-1">Capacity</p>
                  <p className="text-lg font-bold text-slate-700">{selectedPackage.max_capacity}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Base Price</label>
                <div className="text-3xl font-bold text-slate-900">
                  ${Number(selectedPackage.base_price).toLocaleString()}
                  <span className="text-sm text-slate-400 ml-2">{selectedPackage.currency}</span>
                </div>
              </div>

              {selectedPackage.features && selectedPackage.features.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Features</label>
                  <ul className="space-y-1">
                    {selectedPackage.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Bookings ({packageBookings.length})</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {packageBookings.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No bookings yet</p>
                  ) : (
                    packageBookings.map(booking => (
                      <div key={booking.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-slate-500">{booking.booking_number}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'N/A'}
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                          <span>{booking.travel_date}</span>
                          <span className="font-bold">${Number(booking.total_price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-600 uppercase mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ${selectedPackage.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
