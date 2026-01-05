/**
 * TripExperience - 員工旅遊體驗主組件
 * 
 * 功能：
 * - 行程時間軸
 * - 即時天氣
 * - 打卡分享
 * - 緊急聯絡
 * - 同團互動
 */

import React, { useState, useEffect } from 'react';

interface TripDay {
  date: string;
  dayNumber: number;
  activities: Activity[];
}

interface Activity {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  location: string;
  description?: string;
  type: 'transport' | 'meal' | 'activity' | 'hotel' | 'free_time' | 'meeting';
  coordinates?: { lat: number; lng: number };
  tips?: string;
  photos?: string[];
}

interface TripInfo {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: TripDay[];
  emergencyContacts: EmergencyContact[];
  groupMembers: GroupMember[];
  announcements: Announcement[];
}

interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  avatar?: string;
}

interface GroupMember {
  id: string;
  name: string;
  department: string;
  avatar?: string;
  phone?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  priority: 'normal' | 'important' | 'urgent';
}

// 活動圖標映射
const activityIcons: Record<string, string> = {
  transport: '🚌',
  meal: '🍽️',
  activity: '🎯',
  hotel: '🏨',
  free_time: '🎉',
  meeting: '📍',
};

export default function TripExperience() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'checkin' | 'group' | 'emergency'>('timeline');
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  
  // Mock 資料 - 實際應從 API 獲取
  const tripInfo: TripInfo = {
    id: 'trip-001',
    name: '2024 日本京都員工旅遊',
    destination: '日本京都',
    startDate: '2024-03-15',
    endDate: '2024-03-19',
    days: [
      {
        date: '2024-03-15',
        dayNumber: 1,
        activities: [
          {
            id: 'a1',
            time: '06:30',
            title: '桃園機場集合',
            location: '第一航廈 3F 出境大廳',
            type: 'meeting',
            tips: '請攜帶護照，提前 2.5 小時抵達',
          },
          {
            id: 'a2',
            time: '09:00',
            endTime: '12:30',
            title: '搭乘華航 CI156',
            location: '桃園 → 關西',
            type: 'transport',
            description: '飛行時間約 2.5 小時',
          },
          {
            id: 'a3',
            time: '13:30',
            title: '午餐：道頓堀美食街',
            location: '大阪道頓堀',
            type: 'meal',
            tips: '推薦：章魚燒、拉麵',
          },
          {
            id: 'a4',
            time: '15:00',
            endTime: '18:00',
            title: '心齋橋自由購物',
            location: '心齋橋筋商店街',
            type: 'free_time',
            tips: '集合點：Glico 跑跑人看板前',
          },
          {
            id: 'a5',
            time: '19:00',
            title: '晚餐：和牛燒肉',
            location: '燒肉力丸',
            type: 'meal',
          },
          {
            id: 'a6',
            time: '21:00',
            title: '入住飯店',
            location: '京都格蘭比亞大酒店',
            type: 'hotel',
            tips: '早餐 7:00-9:30',
          },
        ],
      },
      {
        date: '2024-03-16',
        dayNumber: 2,
        activities: [
          {
            id: 'b1',
            time: '08:00',
            title: '飯店早餐',
            location: '2F 餐廳',
            type: 'meal',
          },
          {
            id: 'b2',
            time: '09:30',
            endTime: '11:30',
            title: '金閣寺',
            location: '京都市北區',
            type: 'activity',
            description: '世界文化遺產',
            tips: '穿舒適的鞋子，會走很多路',
          },
          {
            id: 'b3',
            time: '12:00',
            title: '午餐：湯豆腐料理',
            location: '嵐山 嵯峨とうふ',
            type: 'meal',
          },
          {
            id: 'b4',
            time: '14:00',
            endTime: '17:00',
            title: '嵐山竹林 & 渡月橋',
            location: '嵐山地區',
            type: 'activity',
            tips: '拍照絕佳景點！',
          },
        ],
      },
    ],
    emergencyContacts: [
      { name: '王領隊', role: '領隊', phone: '+81-90-1234-5678', avatar: '👨‍✈️' },
      { name: '李導遊', role: '當地導遊', phone: '+81-80-8765-4321', avatar: '🧑‍🏫' },
      { name: '台灣駐日代表處', role: '緊急救助', phone: '+81-3-3280-7811', avatar: '🏛️' },
    ],
    groupMembers: [
      { id: 'm1', name: '陳小明', department: '研發部', avatar: '👨‍💻' },
      { id: 'm2', name: '林美玲', department: '行銷部', avatar: '👩‍💼' },
      { id: 'm3', name: '張大偉', department: '業務部', avatar: '👨‍💼' },
      { id: 'm4', name: '黃小華', department: '人資部', avatar: '👩‍🏫' },
    ],
    announcements: [
      {
        id: 'ann1',
        title: '明日行程調整',
        content: '因天氣因素，明天上午改為室內行程',
        timestamp: '2024-03-15T20:00:00',
        priority: 'important',
      },
    ],
  };

  const currentDay = tripInfo.days[selectedDay];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部資訊列 */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{tripInfo.name}</h1>
            <p className="text-sm text-blue-100">{tripInfo.destination}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">Day {selectedDay + 1}</p>
            <p className="text-sm text-blue-100">{currentDay?.date}</p>
          </div>
        </div>
        
        {/* 日期選擇器 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {tripInfo.days.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedDay === index
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </header>

      {/* 公告橫幅 */}
      {tripInfo.announcements.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">📢</span>
            <p className="text-sm text-amber-800 font-medium">
              {tripInfo.announcements[0].title}: {tripInfo.announcements[0].content}
            </p>
          </div>
        </div>
      )}

      {/* 主內容區 */}
      <main className="p-4 pb-24">
        {activeTab === 'timeline' && (
          <TimelineView activities={currentDay?.activities || []} />
        )}
        {activeTab === 'checkin' && (
          <CheckInView tripName={tripInfo.name} />
        )}
        {activeTab === 'group' && (
          <GroupView members={tripInfo.groupMembers} />
        )}
        {activeTab === 'emergency' && (
          <EmergencyView contacts={tripInfo.emergencyContacts} />
        )}
      </main>

      {/* 底部導航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around">
          {[
            { id: 'timeline', icon: '📅', label: '行程' },
            { id: 'checkin', icon: '📸', label: '打卡' },
            { id: 'group', icon: '👥', label: '同團' },
            { id: 'emergency', icon: '🆘', label: '緊急' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ============================================
// 時間軸視圖
// ============================================

function TimelineView({ activities }: { activities: Activity[] }) {
  const now = new Date();
  
  const getActivityStatus = (activity: Activity) => {
    // 簡化邏輯：實際應比較完整時間
    const activityHour = parseInt(activity.time.split(':')[0]);
    const currentHour = now.getHours();
    
    if (activityHour < currentHour) return 'completed';
    if (activityHour === currentHour) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>📋</span> 今日行程
      </h2>
      
      <div className="relative">
        {/* 時間軸線 */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {activities.map((activity, index) => {
          const status = getActivityStatus(activity);
          
          return (
            <div key={activity.id} className="relative flex gap-4 pb-6">
              {/* 時間點 */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl
                ${status === 'completed' ? 'bg-green-100' : ''}
                ${status === 'current' ? 'bg-blue-500 text-white ring-4 ring-blue-200 animate-pulse' : ''}
                ${status === 'upcoming' ? 'bg-gray-100' : ''}
              `}>
                {activityIcons[activity.type] || '📍'}
              </div>
              
              {/* 活動卡片 */}
              <div className={`flex-1 bg-white rounded-xl p-4 shadow-sm border transition-all
                ${status === 'current' ? 'border-blue-300 shadow-md' : 'border-gray-100'}
              `}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      {activity.time}
                      {activity.endTime && ` - ${activity.endTime}`}
                    </p>
                    <h3 className="font-bold text-gray-800 mt-1">{activity.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">📍 {activity.location}</p>
                  </div>
                  {status === 'current' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      進行中
                    </span>
                  )}
                </div>
                
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                )}
                
                {activity.tips && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">💡 {activity.tips}</p>
                  </div>
                )}
                
                {/* 導航按鈕 */}
                {activity.coordinates && (
                  <button className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    🗺️ 開啟導航
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 打卡分享視圖
// ============================================

function CheckInView({ tripName }: { tripName: string }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [checkIns, setCheckIns] = useState([
    {
      id: '1',
      user: '陳小明',
      avatar: '👨‍💻',
      photo: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
      caption: '金閣寺超美！',
      location: '金閣寺',
      timestamp: '2 小時前',
      likes: 12,
    },
    {
      id: '2',
      user: '林美玲',
      avatar: '👩‍💼',
      photo: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
      caption: '嵐山竹林太夢幻了 🎋',
      location: '嵐山竹林',
      timestamp: '4 小時前',
      likes: 18,
    },
  ]);

  const handlePhotoSelect = () => {
    // 模擬選擇照片
    setSelectedPhoto('https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400');
  };

  const handleCheckIn = () => {
    if (!selectedPhoto) return;
    
    setIsUploading(true);
    setTimeout(() => {
      setCheckIns([
        {
          id: Date.now().toString(),
          user: '我',
          avatar: '😊',
          photo: selectedPhoto,
          caption: caption || '美好的旅程！',
          location: '京都',
          timestamp: '剛剛',
          likes: 0,
        },
        ...checkIns,
      ]);
      setSelectedPhoto(null);
      setCaption('');
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* 打卡區 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">📸 分享此刻</h2>
        
        {selectedPhoto ? (
          <div className="relative">
            <img
              src={selectedPhoto}
              alt="Selected"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={handlePhotoSelect}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <span className="text-3xl mb-2">📷</span>
            <span className="text-sm">點擊選擇照片</span>
          </button>
        )}
        
        <input
          type="text"
          placeholder="說點什麼..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full mt-3 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <button
          onClick={handleCheckIn}
          disabled={!selectedPhoto || isUploading}
          className={`w-full mt-3 py-3 rounded-lg font-medium transition-all ${
            selectedPhoto && !isUploading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isUploading ? '上傳中...' : '🎉 發布打卡'}
        </button>
      </div>
      
      {/* 打卡動態 */}
      <div className="space-y-4">
        <h2 className="font-bold text-gray-800">🌟 同團動態</h2>
        
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-3 flex items-center gap-3">
              <span className="text-2xl">{checkIn.avatar}</span>
              <div>
                <p className="font-medium text-gray-800">{checkIn.user}</p>
                <p className="text-xs text-gray-500">📍 {checkIn.location} · {checkIn.timestamp}</p>
              </div>
            </div>
            
            <img
              src={checkIn.photo}
              alt={checkIn.caption}
              className="w-full h-64 object-cover"
            />
            
            <div className="p-3">
              <p className="text-gray-800">{checkIn.caption}</p>
              <div className="flex items-center gap-4 mt-2">
                <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                  ❤️ <span className="text-sm">{checkIn.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  💬 <span className="text-sm">留言</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 同團視圖
// ============================================

function GroupView({ members }: { members: GroupMember[] }) {
  const [activeChat, setActiveChat] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', user: '王領隊', avatar: '👨‍✈️', content: '大家好！今天行程順利，明天 8 點準時出發喔', time: '20:30' },
    { id: '2', user: '陳小明', avatar: '👨‍💻', content: '收到！', time: '20:31' },
    { id: '3', user: '林美玲', avatar: '👩‍💼', content: '期待明天的金閣寺！', time: '20:32' },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now().toString(), user: '我', avatar: '😊', content: message, time: '現在' },
    ]);
    setMessage('');
  };

  return (
    <div className="space-y-4">
      {/* 成員列表 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">👥 同團夥伴 ({members.length}人)</h2>
        <div className="grid grid-cols-4 gap-3">
          {members.map((member) => (
            <div key={member.id} className="text-center">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                {member.avatar}
              </div>
              <p className="text-sm font-medium text-gray-800 mt-1 truncate">{member.name}</p>
              <p className="text-xs text-gray-500 truncate">{member.department}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* 群組聊天 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">💬 團體聊天室</h2>
        </div>
        
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.user === '我' ? 'flex-row-reverse' : ''}`}>
              <span className="text-xl flex-shrink-0">{msg.avatar}</span>
              <div className={`max-w-[70%] ${msg.user === '我' ? 'text-right' : ''}`}>
                <p className="text-xs text-gray-500 mb-1">{msg.user} · {msg.time}</p>
                <div className={`inline-block px-3 py-2 rounded-2xl ${
                  msg.user === '我' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="輸入訊息..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            ➤
          </button>
        </div>
      </div>
      
      {/* 活動揪團 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">🎯 自由活動揪團</h2>
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-purple-800">🍜 晚上想去吃一蘭拉麵</p>
                <p className="text-sm text-purple-600 mt-1">發起人：張大偉 · 3/5 人</p>
              </div>
              <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700">
                +1
              </button>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-green-800">🛍️ 明天自由時間逛藥妝店</p>
                <p className="text-sm text-green-600 mt-1">發起人：黃小華 · 5/5 人 ✓</p>
              </div>
              <span className="px-3 py-1 bg-green-200 text-green-800 text-sm rounded-full">
                已滿
              </span>
            </div>
          </div>
          <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
            + 發起新揪團
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 緊急聯絡視圖
// ============================================

function EmergencyView({ contacts }: { contacts: EmergencyContact[] }) {
  return (
    <div className="space-y-4">
      {/* 緊急按鈕 */}
      <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200">
        <button className="w-24 h-24 bg-red-600 text-white rounded-full text-4xl shadow-lg hover:bg-red-700 transition-all active:scale-95">
          🆘
        </button>
        <p className="mt-3 text-red-800 font-bold">緊急求助</p>
        <p className="text-sm text-red-600 mt-1">點擊立即撥打緊急聯絡人</p>
      </div>
      
      {/* 緊急聯絡人 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">📞 緊急聯絡人</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {contacts.map((contact, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{contact.avatar}</span>
                <div>
                  <p className="font-medium text-gray-800">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.role}</p>
                </div>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                📱 撥打
              </a>
            </div>
          ))}
        </div>
      </div>
      
      {/* 實用資訊 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">ℹ️ 實用資訊</h2>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-800">🏨 飯店地址</p>
            <p className="text-sm text-blue-600 mt-1">京都市下京區烏丸通塩小路下ル JR 京都站正面</p>
            <button className="mt-2 text-sm text-blue-700 underline">複製地址</button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">🌡️ 今日天氣</p>
            <p className="text-sm text-gray-600 mt-1">京都 18°C 晴 ｜ 降雨機率 10%</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">💱 匯率參考</p>
            <p className="text-sm text-gray-600 mt-1">1 TWD = 4.85 JPY</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">🔌 日本插座</p>
            <p className="text-sm text-gray-600 mt-1">Type A（兩腳扁插）100V</p>
          </div>
        </div>
      </div>
      
      {/* 常用日語 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">🗣️ 常用日語</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { zh: '謝謝', ja: 'ありがとう', ro: 'Arigatou' },
            { zh: '不好意思', ja: 'すみません', ro: 'Sumimasen' },
            { zh: '多少錢？', ja: 'いくらですか', ro: 'Ikura desuka' },
            { zh: '救命！', ja: '助けて！', ro: 'Tasukete!' },
          ].map((phrase, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded-lg text-center">
              <p className="font-medium text-gray-800">{phrase.zh}</p>
              <p className="text-sm text-gray-600">{phrase.ja}</p>
              <p className="text-xs text-gray-400">{phrase.ro}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
