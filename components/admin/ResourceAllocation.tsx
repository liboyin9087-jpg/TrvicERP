import React, { useState, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Bus, User, Plus, Minus, Lock, Unlock, Edit, Trash2,
  Save, X, Users, Bed, MapPin, Phone, Mail, Award, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HotelRoomAllocation, SeatAssignment, TourLeader } from '@/core/types/session';
import { RoomType, VehicleType } from '@/core/types/session';
import { RequirePermission } from '@/core/components/RequirePermission';
import { Permission } from '@/core/types/auth';

type TabKey = 'hotel' | 'transport' | 'leader';

interface ResourceAllocationProps {
  sessionId: string;
  hotelRooms?: HotelRoomAllocation[];
  transportationSeats?: SeatAssignment[];
  tourLeaderId?: string;
  onUpdate?: (data: {
    hotelRooms?: HotelRoomAllocation[];
    transportationSeats?: SeatAssignment[];
    tourLeaderId?: string;
  }) => void;
}

const MOCK_TOUR_LEADERS: TourLeader[] = [
  { id: 'tl1' as any, name: '張導遊', phone: '0912-345-678', email: 'guide1@travel.com', licenseNumber: 'TL-2020-001', experienceYears: 5 },
  { id: 'tl2' as any, name: '李領隊', phone: '0912-345-679', email: 'guide2@travel.com', licenseNumber: 'TL-2018-015', experienceYears: 8 },
  { id: 'tl3' as any, name: '王導遊', phone: '0912-345-680', email: 'guide3@travel.com', licenseNumber: 'TL-2021-023', experienceYears: 3 },
];

interface HotelAllocationTabProps {
  rooms: HotelRoomAllocation[];
  onUpdate: (rooms: HotelRoomAllocation[]) => void;
}

interface AddHotelModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<HotelRoomAllocation>) => void;
}

interface TransportAllocationTabProps {
  seats: SeatAssignment[];
  onUpdate: (seats: SeatAssignment[]) => void;
}

interface TourLeaderTabProps {
  leaderId?: string;
  onUpdate: (leaderId: string) => void;
}

const HotelAllocationTab = memo(({ rooms, onUpdate }: HotelAllocationTabProps) => {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleLockRoom = (roomId: string, count: number) => {
    const updated = rooms.map(r => {
      if (r.id === roomId) {
        const newLocked = Math.min(r.lockedCount + count, r.totalCount);
        return {
          ...r,
          lockedCount: newLocked,
          availableCount: r.totalCount - newLocked,
        };
      }
      return r;
    });
    onUpdate(updated);
  };

  const handleAddRoom = (data: Partial<HotelRoomAllocation>) => {
    const newRoom: HotelRoomAllocation = {
      id: `room_${Date.now()}` as any,
      hotelName: data.hotelName || '',
      roomType: (data.roomType || RoomType.DOUBLE) as any,
      roomTypeLabel: data.roomTypeLabel || '雙人房',
      totalCount: data.totalCount || 0,
      lockedCount: 0,
      availableCount: data.totalCount || 0,
      pricePerNight: data.pricePerNight as any,
      nights: data.nights || 0,
    };
    onUpdate([...rooms, newRoom]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6" role="tabpanel" aria-labelledby="hotel-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">飯店房型分配</h3>
          <p className="text-sm text-gray-500 mt-1">鎖定飯店房型與房數</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-medium text-sm"
          aria-label="新增飯店"
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
            className="bg-white p-6 rounded-2xl border border-gray-100"
            aria-labelledby={`room-${room.id}-title`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h4 id={`room-${room.id}-title`} className="font-bold text-gray-900">{room.hotelName}</h4>
                  <p className="text-xs text-gray-500">{room.roomTypeLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoom(editingRoom === room.id ? null : room.id)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="編輯房型"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">總房數</span>
                <span className="font-semibold text-gray-900">{room.totalCount} 間</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">已鎖定</span>
                <span className="font-semibold text-brand-600">{room.lockedCount} 間</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">可用</span>
                <span className="font-semibold text-green-600">{room.availableCount} 間</span>
              </div>

              {room.pricePerNight && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">每晚單價</span>
                    <span className="font-semibold">NT${(room.pricePerNight as any).toLocaleString()}</span>
                  </div>
                  {room.nights && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-500">總價（{room.nights}晚）</span>
                      <span className="font-semibold text-brand-600">
                        NT${(((room.pricePerNight as any) || 0) * room.nights).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleLockRoom(room.id, 1)}
                  disabled={room.availableCount === 0}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                    room.availableCount > 0
                      ? 'bg-blue-100 text-brand-700 hover:bg-brand-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                  aria-label="鎖定1間"
                >
                  <Lock className="w-4 h-4" />
                  鎖定1間
                </button>
                <button
                  onClick={() => handleLockRoom(room.id, -1)}
                  disabled={room.lockedCount === 0}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                    room.lockedCount > 0
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                  aria-label="釋放1間"
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
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100" aria-live="polite">
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
});

const AddHotelModal = memo(({ onClose, onSubmit }: AddHotelModalProps) => {
  const [formData, setFormData] = useState<Partial<HotelRoomAllocation>>({
    roomType: RoomType.DOUBLE,
    roomTypeLabel: '雙人房',
    totalCount: 0,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="trvic-card w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">新增飯店</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="關閉">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1.5">飯店名稱</label>
            <input
              id="hotelName"
              type="text"
              value={formData.hotelName || ''}
              onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
              className="trvic-input w-full"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1.5">房型</label>
            <select
              id="roomType"
              value={formData.roomType}
              onChange={(e) => {
                const selected = roomTypes.find(t => t.value === e.target.value);
                setFormData({
                  ...formData,
                  roomType: e.target.value as any,
                  roomTypeLabel: selected?.label || '',
                });
              }}
              className="trvic-input w-full"
            >
              {roomTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="totalCount" className="block text-sm font-medium text-gray-700 mb-1.5">總房數</label>
            <input
              id="totalCount"
              type="number"
              min="1"
              value={formData.totalCount || 0}
              onChange={(e) => setFormData({
                ...formData,
                totalCount: parseInt(e.target.value),
                availableCount: parseInt(e.target.value),
              })}
              className="trvic-input w-full"
              required
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pricePerNight" className="block text-sm font-medium text-gray-700 mb-1.5">每晚單價（選填）</label>
              <input
                id="pricePerNight"
                type="number"
                min="0"
                value={(formData.pricePerNight as any) || ''}
                onChange={(e) => setFormData({ ...formData, pricePerNight: (parseInt(e.target.value) || 0) as any })}
                className="trvic-input w-full"
              />
            </div>
            <div>
              <label htmlFor="nights" className="block text-sm font-medium text-gray-700 mb-1.5">住宿晚數（選填）</label>
              <input
                id="nights"
                type="number"
                min="1"
                value={formData.nights || ''}
                onChange={(e) => setFormData({ ...formData, nights: parseInt(e.target.value) || undefined })}
                className="trvic-input w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="trvic-btn trvic-btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="trvic-btn trvic-btn-primary flex-1 gap-2">
              <Save className="w-4 h-4" />
              新增
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

const TransportAllocationTab = memo(({ seats, onUpdate }: TransportAllocationTabProps) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.BUS);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [totalSeats, setTotalSeats] = useState(40);

  const generateSeats = () => {
    const newSeats: SeatAssignment[] = [];
    for (let i = 1; i <= totalSeats; i++) {
      const seatNum = String(i).padStart(2, '0');
      newSeats.push({
        id: `seat_${i}` as any,
        vehicleType,
        vehicleNumber,
        seatNumber: seatNum,
        passengerId: '',
        passengerName: '',
        bookingId: '',
        isAssigned: false,
      });
    }
    onUpdate(newSeats);
  };

  const assignedSeats = useMemo(() => seats.filter(s => s.isAssigned).length, [seats]);
  const availableSeats = useMemo(() => seats.length - assignedSeats, [seats, assignedSeats]);

  return (
    <div className="space-y-6" role="tabpanel" aria-labelledby="transport-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">交通座位分配</h3>
          <p className="text-sm text-gray-500 mt-1">設定交通工具與座位配置</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-4">交通工具設定</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1.5">交通工具類型</label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="trvic-input w-full"
            >
              <option value={VehicleType.BUS}>遊覽車</option>
              <option value={VehicleType.TRAIN}>火車</option>
              <option value={VehicleType.PLANE}>飛機</option>
              <option value={VehicleType.FERRY}>渡輪</option>
            </select>
          </div>
          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1.5">車號/航班號</label>
            <input
              id="vehicleNumber"
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="例：BUS-001"
              className="trvic-input w-full"
            />
          </div>
          <div>
            <label htmlFor="totalSeats" className="block text-sm font-medium text-gray-700 mb-1.5">總座位數</label>
            <input
              id="totalSeats"
              type="number"
              min="1"
              value={totalSeats}
              onChange={(e) => setTotalSeats(parseInt(e.target.value))}
              className="trvic-input w-full"
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateSeats}
          className="mt-4 trvic-btn trvic-btn-primary gap-2"
          aria-label="產生座位表"
        >
          <Plus className="w-4 h-4" />
          產生座位表
        </motion.button>
      </div>

      {seats.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                <span className="text-sm text-gray-600">可用 ({availableSeats})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
                <span className="text-sm text-gray-600">已分配 ({assignedSeats})</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-10 gap-2">
              {seats.map((seat) => (
                <motion.button
                  key={seat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all',
                    seat.isAssigned
                      ? 'bg-brand-100 border-brand-300 text-brand-700'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  )}
                  onClick={() => {
                    const updated = seats.map(s =>
                      s.id === seat.id ? { ...s, isAssigned: !s.isAssigned } : s
                    );
                    onUpdate(updated);
                  }}
                  aria-label={`座位 ${seat.seatNumber}`}
                >
                  {seat.seatNumber}
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {seats.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100" aria-live="polite">
          <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">請先設定交通工具並產生座位表</p>
        </div>
      )}
    </div>
  );
});

const TourLeaderTab = memo(({ leaderId, onUpdate }: TourLeaderTabProps) => {
  const selectedLeader = useMemo(() => MOCK_TOUR_LEADERS.find(l => l.id === leaderId), [leaderId]);

  return (
    <div className="space-y-6" role="tabpanel" aria-labelledby="leader-tab">
      <div>
        <h3 className="text-lg font-bold text-gray-900">導遊/領隊派任</h3>
        <p className="text-sm text-gray-500 mt-1">指派導遊或領隊負責此團體</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_TOUR_LEADERS.map((leader) => (
          <motion.button
            key={leader.id}
            whileHover={{ y: -2 }}
            onClick={() => onUpdate(leader.id)}
            className={cn(
              'p-6 rounded-2xl border-2 text-left transition-all',
              leaderId === leader.id
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
            aria-pressed={leaderId === leader.id}
            aria-label={`選擇導遊 ${leader.name}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  leaderId === leader.id ? 'bg-blue-100' : 'bg-gray-100'
                )}>
                  <User className={cn('w-6 h-6', leaderId === leader.id ? 'text-brand-600' : 'text-gray-600')} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{leader.name}</h4>
                  <p className="text-xs text-gray-500">執照：{leader.licenseNumber}</p>
                </div>
              </div>
              {leaderId === leader.id && (
                <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
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
                <span>經驗 {leader.experienceYears} 年</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {selectedLeader && (
        <div className="bg-brand-50 border border-blue-200 rounded-2xl p-6" aria-live="polite">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-brand-600" />
            <div>
              <p className="font-semibold text-blue-900">已指派：{selectedLeader.name}</p>
              <p className="text-sm text-brand-700">聯絡電話：{selectedLeader.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const ResourceAllocation = memo(({
  sessionId,
  hotelRooms = [],
  transportationSeats = [],
  tourLeaderId,
  onUpdate,
}: ResourceAllocationProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>('hotel');
  const [rooms, setRooms] = useState<HotelRoomAllocation[]>(hotelRooms);
  const [seats, setSeats] = useState<SeatAssignment[]>(transportationSeats);
  const [leaderId, setLeaderId] = useState<string | undefined>(tourLeaderId);

  const handleUpdate = () => {
    onUpdate?.({
      hotelRooms: rooms,
      transportationSeats: seats,
      tourLeaderId: leaderId,
    });
  };

  const tabs = useMemo<{ key: TabKey; label: string; icon: React.ReactNode }[]>(() => [
    { key: 'hotel', label: '飯店分配', icon: <Building2 className="w-4 h-4" /> },
    { key: 'transport', label: '交通座位', icon: <Bus className="w-4 h-4" /> },
    { key: 'leader', label: '導遊派任', icon: <User className="w-4 h-4" /> },
  ], []);

  return (
    <RequirePermission permission={Permission.ADMIN_MANAGE}>
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-gray-200" role="tablist">
          {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`${tab.key}-tab`}
            id={`${tab.key}-tab-btn`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'hotel' && (
          <HotelAllocationTab
            rooms={rooms}
            onUpdate={(updated) => {
              setRooms(updated);
              handleUpdate();
            }}
          />
        )}
        {activeTab === 'transport' && (
          <TransportAllocationTab
            seats={seats}
            onUpdate={(updated) => {
              setSeats(updated);
              handleUpdate();
            }}
          />
        )}
        {activeTab === 'leader' && (
          <TourLeaderTab
            leaderId={leaderId}
            onUpdate={(id) => {
              setLeaderId(id);
              handleUpdate();
            }}
          />
        )}
      </div>
    </div>
    </RequirePermission>
  );
});

export default ResourceAllocation;