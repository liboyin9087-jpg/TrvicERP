// =====================================================
// TravelCanvas - 員工 / 導遊工作台 (Employee)
// - 行前資訊、每日行程
// - 投票（與福委會同瀏覽器同步，localStorage demo）
// - 旅途中導覽：沿用 Bolt 的 PocketGuide
// =====================================================

import React, { useState } from 'react';
import { ArrowLeft, Calendar, FileText, LogOut, MapPin, Phone, Plane, User, Vote as VoteIcon } from '../../components/Icons';
import PocketGuide from '../../components/PocketGuide';
import VotingCenter from '../../components/voting/VotingCenter';

type ActiveTab = 'trip' | 'itinerary' | 'vote' | 'info' | 'guide';

interface EmployeeDashboardProps {
  onLogout: () => void;
  voterId?: string;
}

// Mock 數據
const UPCOMING_TRIP = {
  title: '2025 東京迪士尼 5 日遊',
  destination: '日本東京',
  dates: '2025/03/15 - 2025/03/19',
  agency: '陽光旅行社',
  guide: '王導遊',
  guidePhone: '0912-345-678',
  participants: 50,
  daysUntil: 70
};

const ITINERARY = [
  {
    day: 1,
    date: '3/15 (六)',
    title: '台北 → 東京',
    items: [
      { time: '06:30', title: '桃園機場集合', location: '第一航廈' },
      { time: '09:00', title: '搭乘 CI-100 前往東京', location: '成田機場' },
      { time: '17:30', title: '入住新宿凱悅酒店', location: '新宿區' },
      { time: '19:00', title: '歡迎晚宴', location: '飯店餐廳' }
    ]
  },
  {
    day: 2,
    date: '3/16 (日)',
    title: '東京迪士尼樂園',
    items: [
      { time: '07:00', title: '飯店早餐', location: '' },
      { time: '09:00', title: '東京迪士尼樂園全日遊', location: '舞濱' },
      { time: '21:00', title: '返回飯店', location: '' }
    ]
  },
  {
    day: 3,
    date: '3/17 (一)',
    title: '淺草 & 晴空塔',
    items: [
      { time: '09:00', title: '淺草寺參拜', location: '淺草' },
      { time: '11:00', title: '仲見世通商店街', location: '淺草' },
      { time: '14:00', title: '晴空塔展望台', location: '墨田區' }
    ]
  }
];

const MY_INFO = {
  name: '張小明',
  department: '研發部',
  emergencyContact: '張媽媽 0923-456-789',
  dietaryRestrictions: '無',
  passportExpiry: '2027-06-15',
  roommate: '李大華'
};

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onLogout, voterId = 'EMPLOYEE_DEMO' }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('trip');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onLogout} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="登出">
              <LogOut size={20} />
            </button>
            <div className="text-center">
              <h1 className="font-bold">我的旅程</h1>
              <p className="text-sm text-emerald-100">2025 員工旅遊</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Trip Card */}
      {activeTab === 'trip' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white pb-8">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">即將出發</p>
                  <h2 className="text-2xl font-bold">{UPCOMING_TRIP.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{UPCOMING_TRIP.daysUntil}</p>
                  <p className="text-emerald-100 text-sm">天後出發</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-200" />
                  <span>{UPCOMING_TRIP.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-200" />
                  <span>{UPCOMING_TRIP.dates}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-emerald-200" />
                  <span>{UPCOMING_TRIP.guide} {UPCOMING_TRIP.guidePhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane size={16} className="text-emerald-200" />
                  <span>{UPCOMING_TRIP.participants} 位同事</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 -mt-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm mb-6">
          <TabButton active={activeTab === 'trip'} onClick={() => setActiveTab('trip')} icon={<Plane size={16} />} label="行程總覽" />
          <TabButton active={activeTab === 'itinerary'} onClick={() => setActiveTab('itinerary')} icon={<Calendar size={16} />} label="每日行程" />
          <TabButton active={activeTab === 'vote'} onClick={() => setActiveTab('vote')} icon={<VoteIcon size={16} />} label="投票" />
          <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<FileText size={16} />} label="我的資料" />
          <TabButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<ArrowLeft size={16} />} label="旅途中導覽" />
        </div>

        {/* Content */}
        {activeTab === 'trip' && <TripOverview />}
        {activeTab === 'itinerary' && <ItineraryView />}
        {activeTab === 'vote' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-[70vh]">
              <VotingCenter mode="employee" voterId={voterId} />
            </div>
          </div>
        )}
        {activeTab === 'info' && <MyInfoPanel />}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-[70vh] overflow-y-auto">
              <PocketGuide />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================
// Subcomponents
// =========================

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const TripOverview: React.FC = () => (
  <div className="space-y-4 pb-6">
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">旅遊資訊</h3>
      </div>
      <div className="divide-y divide-slate-100 text-sm">
        <InfoRow label="旅行社" value={UPCOMING_TRIP.agency} />
        <InfoRow label="領隊" value={`${UPCOMING_TRIP.guide} ${UPCOMING_TRIP.guidePhone}`} />
        <InfoRow label="集合時間" value="2025/03/15 06:30" />
        <InfoRow label="集合地點" value="桃園機場第一航廈" />
      </div>
    </div>
  </div>
);

const ItineraryView: React.FC = () => (
  <div className="space-y-4 pb-6">
    {ITINERARY.map((day) => (
      <div key={day.day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Day {day.day} · {day.title}</h3>
            <p className="text-sm text-slate-500">{day.date}</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {day.items.map((item, idx) => (
            <div key={idx} className="p-4 flex items-start gap-4">
              <div className="w-16 text-sm font-bold text-emerald-700">{item.time}</div>
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                {item.location && <p className="text-sm text-slate-500">{item.location}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const MyInfoPanel: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="p-4 border-b border-slate-100">
      <h3 className="font-bold text-slate-900">我的資料</h3>
    </div>
    <div className="divide-y divide-slate-100 text-sm">
      <InfoRow label="姓名" value={MY_INFO.name} />
      <InfoRow label="部門" value={MY_INFO.department} />
      <InfoRow label="緊急聯絡人" value={MY_INFO.emergencyContact} />
      <InfoRow label="飲食限制" value={MY_INFO.dietaryRestrictions} />
      <InfoRow label="護照效期" value={MY_INFO.passportExpiry} />
      <InfoRow label="同房" value={MY_INFO.roommate} />
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between p-4">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);

export default EmployeeDashboard;
