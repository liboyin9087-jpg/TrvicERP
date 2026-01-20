import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Clock, MapPin, Phone, Mail, FileText, Download,
  Printer, ChevronDown, ChevronRight, Search, Filter, Check, X,
  AlertTriangle, Utensils, Accessibility, Baby, Heart, Plane,
  Hotel, Bus, Camera, Coffee, Sun, Moon, User, Briefcase, Shield,
  Edit, Eye, MoreVertical, Share2, Copy
} from 'lucide-react';

// Types
interface Passenger {
  id: string;
  name: string;
  englishName: string;
  gender: 'male' | 'female';
  birthDate: string;
  idNumber: string;
  passportNumber: string;
  passportExpiry: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  roomType: 'single' | 'double' | 'triple';
  roomNumber?: string;
  roommate?: string;
  seatNumber?: string;
  dietaryNeeds: string[];
  specialNeeds: string[];
  visaStatus: 'none' | 'applied' | 'approved' | 'rejected';
  insuranceStatus: 'none' | 'purchased';
  notes: string;
}

interface DaySchedule {
  id: string;
  day: number;
  date: string;
  title: string;
  activities: DayActivity[];
  meals: MealInfo;
  accommodation: AccommodationInfo;
  notes: string;
}

interface DayActivity {
  id: string;
  time: string;
  type: 'transport' | 'attraction' | 'meal' | 'hotel' | 'free' | 'shopping';
  title: string;
  location: string;
  duration: string;
  description: string;
  contactInfo?: string;
}

interface MealInfo {
  breakfast: { included: boolean; venue?: string; type?: string };
  lunch: { included: boolean; venue?: string; type?: string };
  dinner: { included: boolean; venue?: string; type?: string };
}

interface AccommodationInfo {
  hotel: string;
  address: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
}

interface TourGroup {
  id: string;
  code: string;
  tourName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  duration: number;
  status: 'preparing' | 'confirmed' | 'departed' | 'completed';
  leader: { name: string; phone: string; email: string };
  localGuide?: { name: string; phone: string };
  passengers: Passenger[];
  schedule: DaySchedule[];
  totalPax: number;
  confirmedPax: number;
}

// Mock Data
const mockGroup: TourGroup = {
  id: 'G001',
  code: 'JP2024031501',
  tourName: '日本東京五日遊',
  destination: '日本東京',
  departureDate: '2024-03-15',
  returnDate: '2024-03-19',
  duration: 5,
  status: 'confirmed',
  leader: { name: '陳領隊', phone: '0912-345-678', email: 'leader@trvic.com' },
  localGuide: { name: '田中太郎', phone: '+81-90-1234-5678' },
  totalPax: 30,
  confirmedPax: 28,
  passengers: [
    {
      id: 'P001',
      name: '王大明',
      englishName: 'WANG, TA-MING',
      gender: 'male',
      birthDate: '1985-06-15',
      idNumber: 'A123456789',
      passportNumber: '123456789',
      passportExpiry: '2028-05-20',
      phone: '0912-111-222',
      email: 'wang@email.com',
      emergencyContact: '王小美',
      emergencyPhone: '0922-333-444',
      roomType: 'double',
      roomNumber: '1501',
      roommate: '王小美',
      seatNumber: '12A',
      dietaryNeeds: [],
      specialNeeds: [],
      visaStatus: 'none',
      insuranceStatus: 'purchased',
      notes: '',
    },
    {
      id: 'P002',
      name: '王小美',
      englishName: 'WANG, HSIAO-MEI',
      gender: 'female',
      birthDate: '1988-03-22',
      idNumber: 'A987654321',
      passportNumber: '987654321',
      passportExpiry: '2027-08-15',
      phone: '0922-333-444',
      email: 'mei@email.com',
      emergencyContact: '王大明',
      emergencyPhone: '0912-111-222',
      roomType: 'double',
      roomNumber: '1501',
      roommate: '王大明',
      seatNumber: '12B',
      dietaryNeeds: ['素食'],
      specialNeeds: [],
      visaStatus: 'none',
      insuranceStatus: 'purchased',
      notes: '全素',
    },
    {
      id: 'P003',
      name: '李志明',
      englishName: 'LEE, CHIH-MING',
      gender: 'male',
      birthDate: '1978-11-08',
      idNumber: 'B234567890',
      passportNumber: '234567890',
      passportExpiry: '2026-12-30',
      phone: '0933-555-666',
      email: 'lee@email.com',
      emergencyContact: '李太太',
      emergencyPhone: '0944-777-888',
      roomType: 'single',
      roomNumber: '1502',
      seatNumber: '14A',
      dietaryNeeds: [],
      specialNeeds: ['輪椅'],
      visaStatus: 'none',
      insuranceStatus: 'purchased',
      notes: '需要無障礙設施',
    },
    // More passengers would be here...
  ],
  schedule: [
    {
      id: 'D1',
      day: 1,
      date: '2024-03-15',
      title: '台北 → 東京成田',
      activities: [
        { id: 'A1', time: '06:00', type: 'transport', title: '桃園機場集合', location: '第二航廈', duration: '2h', description: '請於出發前2小時抵達機場辦理登機手續', contactInfo: '領隊電話: 0912-345-678' },
        { id: 'A2', time: '08:30', type: 'transport', title: '搭乘 CI-100 航班', location: '桃園 → 成田', duration: '3h', description: '中華航空直飛東京' },
        { id: 'A3', time: '12:30', type: 'transport', title: '抵達成田機場', location: '成田國際機場', duration: '1h', description: '入境、提領行李、海關檢查' },
        { id: 'A4', time: '14:00', type: 'attraction', title: '淺草觀音寺', location: '東京淺草', duration: '2h', description: '參觀雷門、仲見世通商店街' },
        { id: 'A5', time: '17:00', type: 'hotel', title: '入住飯店', location: '新宿華盛頓飯店', duration: '', description: '辦理入住手續，自由活動' },
      ],
      meals: {
        breakfast: { included: false },
        lunch: { included: true, venue: '機上', type: '航空餐' },
        dinner: { included: true, venue: '飯店內', type: '日式自助餐' },
      },
      accommodation: {
        hotel: '新宿華盛頓飯店',
        address: '東京都新宿區西新宿3-2-9',
        phone: '+81-3-3343-3111',
        checkIn: '15:00',
        checkOut: '11:00',
        roomType: '標準雙人房',
      },
      notes: '今日較為緊湊，請務必準時集合',
    },
    {
      id: 'D2',
      day: 2,
      date: '2024-03-16',
      title: '東京市區觀光',
      activities: [
        { id: 'A6', time: '07:00', type: 'meal', title: '飯店早餐', location: '飯店餐廳', duration: '1h', description: '自助式早餐' },
        { id: 'A7', time: '09:00', type: 'attraction', title: '明治神宮', location: '涉谷區', duration: '1.5h', description: '參觀日本最大的神社' },
        { id: 'A8', time: '11:00', type: 'shopping', title: '表參道', location: '表參道', duration: '2h', description: '時尚購物街自由逛街' },
        { id: 'A9', time: '14:00', type: 'attraction', title: '東京鐵塔', location: '港區', duration: '2h', description: '登塔眺望東京市景' },
        { id: 'A10', time: '17:00', type: 'free', title: '新宿自由活動', location: '新宿', duration: '3h', description: '可自行前往歌舞伎町、藥妝店等' },
      ],
      meals: {
        breakfast: { included: true, venue: '飯店', type: '自助式' },
        lunch: { included: true, venue: '表參道餐廳', type: '西式料理' },
        dinner: { included: false },
      },
      accommodation: {
        hotel: '新宿華盛頓飯店',
        address: '東京都新宿區西新宿3-2-9',
        phone: '+81-3-3343-3111',
        checkIn: '15:00',
        checkOut: '11:00',
        roomType: '標準雙人房',
      },
      notes: '晚餐敬請自理，推薦新宿拉麵街',
    },
  ],
};

// Components
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    preparing: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    departed: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-700',
    purchased: 'bg-green-100 text-green-700',
    none: 'bg-slate-100 text-slate-500',
    applied: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    preparing: '準備中',
    confirmed: '已確認',
    departed: '已出發',
    completed: '已完成',
    purchased: '已購買',
    none: '未處理',
    applied: '申請中',
    approved: '已核准',
    rejected: '已拒絕',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {labels[status] || status}
    </span>
  );
};

const ActivityIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    transport: <Bus className="w-4 h-4" />,
    attraction: <Camera className="w-4 h-4" />,
    meal: <Utensils className="w-4 h-4" />,
    hotel: <Hotel className="w-4 h-4" />,
    free: <Coffee className="w-4 h-4" />,
    shopping: <Briefcase className="w-4 h-4" />,
  };

  const colors: Record<string, string> = {
    transport: 'bg-blue-100 text-blue-600',
    attraction: 'bg-purple-100 text-purple-600',
    meal: 'bg-orange-100 text-orange-600',
    hotel: 'bg-green-100 text-green-600',
    free: 'bg-amber-100 text-amber-600',
    shopping: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[type] || 'bg-slate-100 text-slate-600'}`}>
      {icons[type] || <MapPin className="w-4 h-4" />}
    </div>
  );
};

// Daily Operation Sheet Component
const DailyOperationSheet = ({ group, selectedDay }: { group: TourGroup; selectedDay: number }) => {
  const daySchedule = group.schedule.find(s => s.day === selectedDay);

  if (!daySchedule) return <div>找不到該日行程</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">第 {daySchedule.day} 天</div>
            <h2 className="text-xl font-bold mt-1">{daySchedule.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {daySchedule.date}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {group.confirmedPax} 人
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <Printer className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Leader & Guide Info */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500">領隊</div>
            <div className="font-medium text-slate-900">{group.leader.name}</div>
            <div className="text-sm text-slate-600">{group.leader.phone}</div>
          </div>
        </div>
        {group.localGuide && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">當地導遊</div>
              <div className="font-medium text-slate-900">{group.localGuide.name}</div>
              <div className="text-sm text-slate-600">{group.localGuide.phone}</div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Timeline */}
      <div className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">今日行程</h3>
        <div className="space-y-4">
          {daySchedule.activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <ActivityIcon type={activity.type} />
                {index < daySchedule.activities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-indigo-600">{activity.time}</span>
                  {activity.duration && (
                    <span className="text-xs text-slate-400">({activity.duration})</span>
                  )}
                </div>
                <h4 className="font-medium text-slate-900">{activity.title}</h4>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </div>
                {activity.description && (
                  <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                )}
                {activity.contactInfo && (
                  <p className="text-xs text-indigo-600 mt-1">{activity.contactInfo}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="p-6 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">餐食安排</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg ${daySchedule.meals.breakfast.included ? 'bg-green-50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-slate-700">早餐</span>
            </div>
            {daySchedule.meals.breakfast.included ? (
              <div className="text-sm text-slate-600">
                <div>{daySchedule.meals.breakfast.venue}</div>
                <div className="text-xs text-slate-400">{daySchedule.meals.breakfast.type}</div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">敬請自理</div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${daySchedule.meals.lunch.included ? 'bg-green-50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-slate-700">午餐</span>
            </div>
            {daySchedule.meals.lunch.included ? (
              <div className="text-sm text-slate-600">
                <div>{daySchedule.meals.lunch.venue}</div>
                <div className="text-xs text-slate-400">{daySchedule.meals.lunch.type}</div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">敬請自理</div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${daySchedule.meals.dinner.included ? 'bg-green-50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-slate-700">晚餐</span>
            </div>
            {daySchedule.meals.dinner.included ? (
              <div className="text-sm text-slate-600">
                <div>{daySchedule.meals.dinner.venue}</div>
                <div className="text-xs text-slate-400">{daySchedule.meals.dinner.type}</div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">敬請自理</div>
            )}
          </div>
        </div>
      </div>

      {/* Accommodation */}
      <div className="p-6 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">住宿資訊</h3>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Hotel className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900">{daySchedule.accommodation.hotel}</h4>
              <p className="text-sm text-slate-600 mt-1">{daySchedule.accommodation.address}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {daySchedule.accommodation.phone}
                </span>
                <span>入住: {daySchedule.accommodation.checkIn}</span>
                <span>退房: {daySchedule.accommodation.checkOut}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {daySchedule.notes && (
        <div className="p-6 border-t border-slate-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">注意事項</h4>
              <p className="text-sm text-amber-700 mt-1">{daySchedule.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Passenger List Component
const PassengerList = ({ passengers, onExport }: { passengers: Passenger[]; onExport: (format: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredPassengers = passengers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.passportNumber.includes(searchQuery)
  );

  const toggleSelectAll = () => {
    if (selectedPassengers.length === filteredPassengers.length) {
      setSelectedPassengers([]);
    } else {
      setSelectedPassengers(filteredPassengers.map(p => p.id));
    }
  };

  const specialNeedsCount = passengers.filter(p => p.specialNeeds.length > 0 || p.dietaryNeeds.length > 0).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">團員名單</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">共 {passengers.length} 人</span>
            {specialNeedsCount > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                {specialNeedsCount} 人有特殊需求
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋姓名、護照號碼..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" />
            篩選
          </button>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Download className="w-4 h-4" />
              匯出
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedPassengers.length === filteredPassengers.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">姓名</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">護照號碼</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">效期</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">房型/房號</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">座位</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">特殊需求</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">保險</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPassengers.map((passenger) => (
              <tr key={passenger.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedPassengers.includes(passenger.id)}
                    onChange={() => {
                      if (selectedPassengers.includes(passenger.id)) {
                        setSelectedPassengers(selectedPassengers.filter(id => id !== passenger.id));
                      } else {
                        setSelectedPassengers([...selectedPassengers, passenger.id]);
                      }
                    }}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-900">{passenger.name}</div>
                    <div className="text-xs text-slate-500">{passenger.englishName}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{passenger.passportNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{passenger.passportExpiry}</td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      passenger.roomType === 'single' ? 'bg-purple-100 text-purple-700' :
                      passenger.roomType === 'double' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {passenger.roomType === 'single' ? '單人' : passenger.roomType === 'double' ? '雙人' : '三人'}
                    </span>
                    {passenger.roomNumber && (
                      <span className="ml-2 text-slate-600">#{passenger.roomNumber}</span>
                    )}
                  </div>
                  {passenger.roommate && (
                    <div className="text-xs text-slate-400 mt-0.5">與 {passenger.roommate} 同房</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{passenger.seatNumber || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {passenger.dietaryNeeds.map((need, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs flex items-center gap-0.5">
                        <Utensils className="w-3 h-3" />
                        {need}
                      </span>
                    ))}
                    {passenger.specialNeeds.map((need, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs flex items-center gap-0.5">
                        <Accessibility className="w-3 h-3" />
                        {need}
                      </span>
                    ))}
                    {passenger.dietaryNeeds.length === 0 && passenger.specialNeeds.length === 0 && (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={passenger.insuranceStatus} />
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-slate-100 rounded">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {selectedPassengers.length > 0 ? `已選擇 ${selectedPassengers.length} 人` : ''}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('excel')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white"
          >
            匯出 Excel
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white"
          >
            匯出 PDF
          </button>
          <button
            onClick={() => onExport('insurance')}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            匯出保險名單
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function GroupManagement() {
  const [group] = useState<TourGroup>(mockGroup);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'passengers' | 'rooms'>('overview');
  const [selectedDay, setSelectedDay] = useState(1);

  const handleExport = (format: string) => {
    console.log('Exporting in format:', format);
    // Implementation would go here
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{group.tourName}</h1>
            <StatusBadge status={group.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              團號: {group.code}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {group.departureDate} ~ {group.returnDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {group.destination}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {group.confirmedPax}/{group.totalPax} 人
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-white">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Download className="w-4 h-4" />
            匯出全部
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-slate-200 w-fit">
        {[
          { id: 'overview', label: '團次總覽' },
          { id: 'schedule', label: '每日行程' },
          { id: 'passengers', label: '團員名單' },
          { id: 'rooms', label: '房間分配' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Stats */}
          <div className="col-span-2 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">總人數</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{group.confirmedPax}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">天數</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{group.duration} 天</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">特殊需求</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {group.passengers.filter(p => p.specialNeeds.length > 0).length}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">素食</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {group.passengers.filter(p => p.dietaryNeeds.includes('素食')).length}
                </div>
              </div>
            </div>

            {/* Quick Schedule Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">行程概覽</h3>
              <div className="space-y-3">
                {group.schedule.map((day) => (
                  <div
                    key={day.id}
                    onClick={() => { setActiveTab('schedule'); setSelectedDay(day.day); }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-indigo-600">Day</span>
                      <span className="text-lg font-bold text-indigo-600">{day.day}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{day.title}</div>
                      <div className="text-sm text-slate-500">{day.date}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">領隊資訊</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{group.leader.name}</div>
                  <div className="text-sm text-slate-500">領隊</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  {group.leader.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  {group.leader.email}
                </div>
              </div>
            </div>

            {group.localGuide && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">當地導遊</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{group.localGuide.name}</div>
                    <div className="text-sm text-slate-500">導遊</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  {group.localGuide.phone}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-4 gap-6">
          {/* Day Selector */}
          <div className="space-y-2">
            {group.schedule.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.day)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedDay === day.day
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                  selectedDay === day.day ? 'bg-white/20' : 'bg-indigo-100'
                }`}>
                  <span className={`text-xs ${selectedDay === day.day ? 'text-white/80' : 'text-indigo-600'}`}>
                    Day
                  </span>
                  <span className={`text-lg font-bold ${selectedDay === day.day ? 'text-white' : 'text-indigo-600'}`}>
                    {day.day}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-medium ${selectedDay === day.day ? 'text-white' : 'text-slate-900'}`}>
                    {day.title}
                  </div>
                  <div className={`text-sm ${selectedDay === day.day ? 'text-white/70' : 'text-slate-500'}`}>
                    {day.date}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Day Detail */}
          <div className="col-span-3">
            <DailyOperationSheet group={group} selectedDay={selectedDay} />
          </div>
        </div>
      )}

      {activeTab === 'passengers' && (
        <PassengerList passengers={group.passengers} onExport={handleExport} />
      )}

      {activeTab === 'rooms' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">房間分配</h3>
          <div className="grid grid-cols-4 gap-4">
            {Array.from(new Set(group.passengers.map(p => p.roomNumber).filter(Boolean))).map((roomNumber) => {
              const roommates = group.passengers.filter(p => p.roomNumber === roomNumber);
              return (
                <div key={roomNumber} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hotel className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-slate-900">房號 {roomNumber}</span>
                  </div>
                  <div className="space-y-2">
                    {roommates.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
