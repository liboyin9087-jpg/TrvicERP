import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Bed, Bus, AlertCircle, Download, FileText, TrendingUp,
  UserCheck, UserX, Filter, Search, X
} from 'lucide-react';
import { cn } from '../../src/lib/utils';
import type { TourSession, Booking, RoomAssignment, SeatAssignment, SpecialNeedsSummary } from '../../types';

// ============================================
// Types
// ============================================

interface GroupRosterProps {
  session: TourSession;
  bookings: Booking[];
  roomAssignments?: RoomAssignment[];
  seatAssignments?: SeatAssignment[];
}

// ============================================
// Component
// ============================================

export default function GroupRoster({
  session,
  bookings,
  roomAssignments = [],
  seatAssignments = [],
}: GroupRosterProps) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 計算報名進度
  const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length;
  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_payment').length;
  const registrationProgress = session.max_pax > 0
    ? Math.round((session.current_pax / session.max_pax) * 100)
    : 0;

  // 特殊需求統計
  const specialNeedsMap: Record<string, { count: number; passengers: { id: string; name: string }[] }> = {};
  bookings.forEach(booking => {
    if (booking.special_needs) {
      const needs = booking.special_needs.split(',').map(s => s.trim());
      needs.forEach(need => {
        if (!specialNeedsMap[need]) {
          specialNeedsMap[need] = { count: 0, passengers: [] };
        }
        specialNeedsMap[need].count++;
        specialNeedsMap[need].passengers.push({
          id: booking.id,
          name: booking.customer_name,
        });
      });
    }
  });
  const specialNeedsSummary: SpecialNeedsSummary[] = Object.entries(specialNeedsMap).map(([category, data]) => ({
    category,
    count: data.count,
    passengers: data.passengers,
  }));

  // 過濾訂單
  const filteredBookings = bookings.filter(b => {
    if (filter === 'confirmed' && b.status !== 'confirmed' && b.status !== 'paid') return false;
    if (filter === 'pending' && b.status !== 'pending' && b.status !== 'pending_payment') return false;
    if (searchQuery && !b.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">全團名單總覽</h3>
          <p className="text-sm text-gray-500 mt-1">即時查看報名進度與名單資訊</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">總報名人數</p>
              <p className="text-2xl font-bold text-gray-900">{session.current_pax}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all"
              style={{ width: `${registrationProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">進度 {registrationProgress}% ({session.current_pax}/{session.max_pax})</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已確認</p>
              <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待確認</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
              <Bed className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已分房</p>
              <p className="text-2xl font-bold text-accent-600">{roomAssignments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋旅客姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'confirmed', 'pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status === 'all' && '全部'}
              {status === 'confirmed' && '已確認'}
              {status === 'pending' && '待確認'}
            </button>
          ))}
        </div>
      </div>

      {/* Passenger List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-bold text-gray-900">旅客名單</h4>
          <span className="text-sm text-gray-500">{filteredBookings.length} 位</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">姓名</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">狀態</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">房間</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">座位</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">特殊需求</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{booking.customer_name}</p>
                    {booking.email && (
                      <p className="text-sm text-gray-500">{booking.email}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-sm font-medium',
                      booking.status === 'confirmed' || booking.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'pending' || booking.status === 'pending_payment'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {booking.status === 'confirmed' && '已確認'}
                      {booking.status === 'paid' && '已付款'}
                      {booking.status === 'pending' && '待確認'}
                      {booking.status === 'pending_payment' && '待付款'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {booking.assigned_room || (
                      <span className="text-gray-400">未分配</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {booking.assigned_seat || (
                      <span className="text-gray-400">未分配</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {booking.special_needs ? (
                      <span className="text-orange-600">{booking.special_needs}</span>
                    ) : (
                      <span className="text-gray-400">無</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Special Needs Summary */}
      {specialNeedsSummary.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              特殊需求統計
            </h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialNeedsSummary.map((item) => (
                <div key={item.category} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-orange-900">{item.category}</span>
                    <span className="text-lg font-bold text-orange-600">{item.count}</span>
                  </div>
                  <div className="text-sm text-orange-700">
                    {item.passengers.slice(0, 3).map(p => p.name).join('、')}
                    {item.passengers.length > 3 && ` 等${item.passengers.length}位`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Room & Seat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Assignments */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Bed className="w-5 h-5 text-accent-600" />
              分房表預覽
            </h4>
            <span className="text-sm text-gray-500">{roomAssignments.length} 間</span>
          </div>
          <div className="p-6 max-h-64 overflow-y-auto">
            {roomAssignments.length > 0 ? (
              <div className="space-y-3">
                {roomAssignments.slice(0, 5).map((room) => (
                  <div key={room.roomNumber} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">房號 {room.roomNumber}</span>
                      <span className="text-sm text-gray-500">{room.roomType}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {room.occupants.map(o => o.name).join('、')}
                    </div>
                  </div>
                ))}
                {roomAssignments.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">還有 {roomAssignments.length - 5} 間...</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">尚未分配房間</p>
            )}
          </div>
        </div>

        {/* Seat Assignments */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Bus className="w-5 h-5 text-brand-600" />
              座位表預覽
            </h4>
            <span className="text-sm text-gray-500">
              {seatAssignments.filter(s => s.is_assigned).length} / {seatAssignments.length}
            </span>
          </div>
          <div className="p-6">
            {seatAssignments.length > 0 ? (
              <div className="grid grid-cols-10 gap-1">
                {seatAssignments.slice(0, 20).map((seat) => (
                  <div
                    key={seat.id}
                    className={cn(
                      'aspect-square rounded border-2 flex items-center justify-center text-sm font-medium',
                      seat.is_assigned
                        ? 'bg-brand-100 border-brand-300 text-brand-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    )}
                  >
                    {seat.seat_number}
                  </div>
                ))}
                {seatAssignments.length > 20 && (
                  <div className="col-span-10 text-sm text-gray-500 text-center py-2">
                    還有 {seatAssignments.length - 20} 個座位...
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">尚未設定座位</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
