import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Bus, User, Plus, Minus, Lock, Unlock, Edit, Trash2,
  Save, X, Users, Bed, MapPin, Phone, Mail, Award, CheckCircle, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HotelRoomAllocation, SeatAssignment, TourLeader } from '../../types';

// ============================================
// Types and Config Interfaces
// ============================================

type TabKey = 'hotel' | 'transport' | 'leader';

// Main component's configuration props
interface ResourceAllocationConfig {
  sessionId: string;
  hotelRooms: HotelRoomAllocation[]; // Initial hotel room allocations
  transportationSeats: SeatAssignment[]; // Initial transportation seat assignments
  tourLeaderId?: string; // Currently assigned tour leader ID
  availableTourLeaders: TourLeader[]; // List of available tour leaders (replaces mock data)
  onUpdate?: (data: { // Callback for when any resource allocation changes
    hotelRooms?: HotelRoomAllocation[];
    transportationSeats?: SeatAssignment[];
    tourLeaderId?: string;
  }) => void;
}

// Props for HotelAllocationTab
interface HotelAllocationTabProps {
  rooms: HotelRoomAllocation[];
  onUpdateRooms: (rooms: HotelRoomAllocation[]) => void;
}

// Props for AddHotelModal
interface AddHotelModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<HotelRoomAllocation>) => void;
}

// Props for TransportAllocationTab
interface TransportAllocationTabProps {
  seats: SeatAssignment[];
  onUpdateSeats: (seats: SeatAssignment[]) => void;
}

// Props for TourLeaderTab
interface TourLeaderTabProps {
  leaderId?: string;
  availableLeaders: TourLeader[];
  onUpdateLeader: (leaderId: string) => void;
}

// ============================================
// Hotel Allocation Tab Component
// ============================================

function HotelAllocationTab({ rooms, onUpdateRooms }: HotelAllocationTabProps) {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleLockRoom = (roomId: string, count: number) => {
    const updated = rooms.map(r => {
      if (r.id === roomId) {
        const newLocked = Math.min(Math.max(0, r.locked_count + count), r.total_count);
        return {
          ...r,
          locked_count: newLocked,
          available_count: r.total_count - newLocked,
        };
      }
      return r;
    });
    onUpdateRooms(updated);
  };

  const handleAddRoom = (data: Partial<HotelRoomAllocation>) => {
    const newRoom: HotelRoomAllocation = {
      id: `room_${Date.now()}`,
      hotel_name: data.hotel_name || '',
      room_type: data.room_type || 'double',
      room_type_label: data.room_type_label || '雙人房',
      total_count: data.total_count || 0,
      locked_count: 0,
      available_count: data.total_count || 0,
      price_per_night: data.price_per_night,
      nights: data.nights,
    };
    onUpdateRooms([...rooms, newRoom]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">飯店房型分配</h3>
          <p className="text-sm text-gray-500 mt-1">鎖定飯店房型與房數</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
        >
          <Plus className="w-4 h-4" />
          新增飯店
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{room.hotel_name}</h4>
                  <p className="text-sm text-gray-500">{room.room_type_label}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoom(editingRoom === room.id ? null : room.id)}
                className="p-2 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-primary-300"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">總房數</span>
                <span className="font-semibold text-gray-900">{room.total_count} 間</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">已鎖定</span>
                <span className="font-semibold text-primary-600">{room.locked_count} 間</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">可用</span>
                <span className="font-semibold text-green-600">{room.available_count} 間</span>
              </div>

              {room.price_per_night && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">每晚單價</span>
                    <span className="font-semibold">NT${room.price_per_night.toLocaleString()}</span>
                  </div>
                  {room.nights && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-500">總價（{room.nights}晚）</span>
                      <span className="font-semibold text-primary-600">
                        NT${(room.price_per_night * room.nights).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleLockRoom(room.id, 1)}
                  disabled={room.available_count === 0}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                    room.available_count > 0
                      ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 focus:ring-2 focus:ring-primary-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Lock className="w-4 h-4" />
                  鎖定1間
                </button>
                <button
                  onClick={() => handleLockRoom(room.id, -1)}
                  disabled={room.locked_count === 0}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                    room.locked_count > 0
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-2 focus:ring-red-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Unlock className="w-4 h-4" />
                  釋放1間
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">尚未新增飯店</p>
        </div>
      )}

      {showAddModal && (
        <AddHotelModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddRoom}
        />
      )}
    </div>
  );
}

function AddHotelModal({ onClose, onSubmit }: AddHotelModalProps) {
  const [formData, setFormData] = useState<Partial<HotelRoomAllocation>>({
    room_type: 'double',
    room_type_label: '雙人房',
    total_count: 0,
  });

  const roomTypes = useMemo(() => [
    { value: 'single', label: '單人房' },
    { value: 'double', label: '雙人房' },
    { value: 'twin', label: '兩床房' },
    { value: 'family', label: '家庭房' },
    { value: 'suite', label: '套房' },
  ], []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md bg-white rounded-2xl shadow-xl"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">新增飯店</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-primary-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">飯店名稱</label>
            <input
              type="text"
              value={formData.hotel_name || ''}
              onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
              className="input-modern w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">房型</label>
            <select
              value={formData.room_type}
              onChange={(e) => {
                const selected = roomTypes.find(t => t.value === e.target.value);
                setFormData({
                  ...formData,
                  room_type: e.target.value as HotelRoomAllocation['room_type'],
                  room_type_label: selected?.label || '',
                });
              }}
              className="input-modern w-full"
            >
              {roomTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">總房數</label>
            <input
              type="number"
              min="1"
              value={formData.total_count || 0}
              onChange={(e) => setFormData({
                ...formData,
                total_count: parseInt(e.target.value),
                available_count: parseInt(e.target.value),
              })}
              className="input-modern w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">每晚單價（選填）</label>
              <input
                type="number"
                min="0"
                value={formData.price_per_night || ''}
                onChange={(e) => setFormData({ ...formData, price_per_night: parseInt(e.target.value) || undefined })}
                className="input-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">住宿晚數（選填）</label>
              <input
                type="number"
                min="1"
                value={formData.nights || ''}
                onChange={(e) => setFormData({ ...formData, nights: parseInt(e.target.value) || undefined })}
                className="input-modern w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-pill btn-pill-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-pill btn-pill-primary flex-1 gap-2">
              <Save className="w-4 h-4" />
              新增
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// Transport Allocation Tab Component
// ============================================

function TransportAllocationTab({ seats, onUpdateSeats }: TransportAllocationTabProps) {
  const [vehicleType, setVehicleType] = useState<'bus' | 'train' | 'plane' | 'ferry'>('bus');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [totalSeats, setTotalSeats] = useState(40);

  const generateSeats = () => {
    if (totalSeats <= 0) return;
    const newSeats: SeatAssignment[] = [];
    for (let i = 1; i <= totalSeats; i++) {
      newSeats.push({
        id: `seat_${Date.now()}_${i}`, // Ensure unique ID for new seats
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        seat_number: String(i).padStart(2, '0'),
        is_assigned: false,
      });
    }
    onUpdateSeats(newSeats);
  };

  const assignedSeatsCount = seats.filter(s => s.is_assigned).length;
  const availableSeatsCount = seats.length - assignedSeatsCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">交通座位分配</h3>
          <p className="text-sm text-gray-500 mt-1">設定交通工具與座位配置</p>
        </div>
      </div>

      {/* Vehicle Setup */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-4">交通工具設定</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">交通工具類型</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as SeatAssignment['vehicle_type'])}
              className="input-modern w-full"
            >
              <option value="bus">遊覽車</option>
              <option value="train">火車</option>
              <option value="plane">飛機</option>
              <option value="ferry">渡輪</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">車號/航班號</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="例：BUS-001"
              className="input-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">總座位數</label>
            <input
              type="number"
              min="1"
              value={totalSeats}
              onChange={(e) => setTotalSeats(parseInt(e.target.value) || 0)}
              className="input-modern w-full"
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateSeats}
          className="mt-4 btn-pill btn-pill-primary gap-2"
          disabled={totalSeats <= 0 || !vehicleNumber}
        >
          <Plus className="w-4 h-4" />
          產生座位表
        </motion.button>
      </div>

      {/* Seat Grid */}
      {seats.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                <span className="text-sm text-gray-600">可用 ({availableSeatsCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded" />
                <span className="text-sm text-gray-600">已分配 ({assignedSeatsCount})</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-10 gap-2">
              {seats.map((seat) => (
                <motion.button
                  key={seat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all focus:ring-2 focus:ring-primary-300',
                    seat.is_assigned
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                  )}
                  onClick={() => {
                    const updated = seats.map(s =>
                      s.id === seat.id ? { ...s, is_assigned: !s.is_assigned } : s
                    );
                    onUpdateSeats(updated);
                  }}
                >
                  {seat.seat_number}
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {seats.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">請先設定交通工具並產生座位表</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Tour Leader Tab Component
// ============================================

function TourLeaderTab({ leaderId, availableLeaders, onUpdateLeader }: TourLeaderTabProps) {
  const selectedLeader = useMemo(() => availableLeaders.find(l => l.id === leaderId), [leaderId, availableLeaders]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">導遊/領隊派任</h3>
        <p className="text-sm text-gray-500 mt-1">指派導遊或領隊負責此團體</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableLeaders.map((leader) => (
          <motion.button
            key={leader.id}
            whileHover={{ y: -2 }}
            onClick={() => onUpdateLeader(leader.id)}
            className={cn(
              'p-6 rounded-2xl border-2 text-left transition-all focus:ring-2 focus:ring-primary-300',
              leaderId === leader.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center',
                  leaderId === leader.id ? 'bg-primary-100' : 'bg-gray-100'
                )}>
                  <User className={cn('w-6 h-6', leaderId === leader.id ? 'text-primary-600' : 'text-gray-600')} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{leader.name}</h4>
                  <p className="text-sm text-gray-500">執照：{leader.license_number}</p>
                </div>
              </div>
              {leaderId === leader.id && (
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{leader.phone}</span>
              </div>
              {leader.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{leader.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Award className="w-4 h-4" />
                <span>經驗 {leader.experience_years} 年</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {selectedLeader && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-semibold text-primary-900">已指派：{selectedLeader.name}</p>
              <p className="text-sm text-primary-700">聯絡電話：{selectedLeader.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function ResourceAllocation({
  sessionId,
  hotelRooms,
  transportationSeats,
  tourLeaderId,
  availableTourLeaders,
  onUpdate,
}: ResourceAllocationConfig) {
  const [activeTab, setActiveTab] = useState<TabKey>('hotel');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'hotel', label: '飯店分配', icon: <Building2 className="w-4 h-4" /> },
    { key: 'transport', label: '交通座位', icon: <Bus className="w-4 h-4" /> },
    { key: 'leader', label: '導遊派任', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"> {/* Dashtail Card Structure */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6 drag-handle"> {/* Drag handle */}
        <GripVertical className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-bold text-gray-900">資源分配管理</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 -mt-2"> {/* Negative margin to align with card border if needed */}
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors focus:ring-2 focus:ring-primary-300',
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-6">
        {activeTab === 'hotel' && (
          <HotelAllocationTab
            rooms={hotelRooms}
            onUpdateRooms={(updated) => {
              onUpdate?.({ hotelRooms: updated });
            }}
          />
        )}
        {activeTab === 'transport' && (
          <TransportAllocationTab
            seats={transportationSeats}
            onUpdateSeats={(updated) => {
              onUpdate?.({ transportationSeats: updated });
            }}
          />
        )}
        {activeTab === 'leader' && (
          <TourLeaderTab
            leaderId={tourLeaderId}
            availableLeaders={availableTourLeaders}
            onUpdateLeader={(id) => {
              onUpdate?.({ tourLeaderId: id });
            }}
          />
        )}
      </div>
    </div>
  );
}