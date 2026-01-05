/**
 * Employee Trip App - 員工旅遊體驗主入口
 */

import React, { useState } from 'react';
import TripExperience from './components/employee/TripExperience';
import TripChecklist from './components/employee/TripChecklist';
import TripVoting from './components/employee/TripVoting';
import { SharedAlbum, FeedbackSurvey, TripMemoir } from './components/employee/TripMemories';

type AppView = 
  | 'home'
  | 'experience'
  | 'checklist'
  | 'voting'
  | 'album'
  | 'survey'
  | 'memoir';

export default function EmployeeApp() {
  const [currentView, setCurrentView] = useState<AppView>('home');

  // 根據視圖渲染對應組件
  const renderView = () => {
    switch (currentView) {
      case 'experience':
        return <TripExperience />;
      case 'checklist':
        return <TripChecklist />;
      case 'voting':
        return <TripVoting />;
      case 'album':
        return <SharedAlbum />;
      case 'survey':
        return <FeedbackSurvey />;
      case 'memoir':
        return <TripMemoir />;
      default:
        return <HomePage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="relative">
      {currentView !== 'home' && (
        <button
          onClick={() => setCurrentView('home')}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-100"
        >
          ←
        </button>
      )}
      {renderView()}
    </div>
  );
}

// 首頁組件
function HomePage({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const tripInfo = {
    name: '2024 日本京都員工旅遊',
    destination: '日本京都',
    dates: '2024/03/15 - 2024/03/19',
    daysUntil: 12,
    status: 'upcoming' as const,
  };

  const features = [
    {
      id: 'checklist',
      icon: '✅',
      title: '行前準備',
      description: '打包清單、證件檢查',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      id: 'experience',
      icon: '📅',
      title: '行程導覽',
      description: '即時行程、打卡分享',
      color: 'from-blue-400 to-indigo-500',
    },
    {
      id: 'voting',
      icon: '🗳️',
      title: '投票中心',
      description: '餐廳選擇、活動投票',
      color: 'from-purple-400 to-pink-500',
    },
    {
      id: 'album',
      icon: '📸',
      title: '共享相簿',
      description: '團體照片、美好回憶',
      color: 'from-pink-400 to-rose-500',
    },
    {
      id: 'survey',
      icon: '📝',
      title: '滿意度調查',
      description: '給我們您的寶貴意見',
      color: 'from-amber-400 to-orange-500',
    },
    {
      id: 'memoir',
      icon: '📖',
      title: '旅遊回憶錄',
      description: 'AI 生成專屬回憶',
      color: 'from-cyan-400 to-blue-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="p-6 pb-24">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">即將出發</p>
              <h1 className="text-2xl font-bold mt-1">{tripInfo.name}</h1>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🗾</span>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 bg-white/10 rounded-xl p-4">
              <p className="text-blue-200 text-sm">出發日期</p>
              <p className="font-bold mt-1">{tripInfo.dates}</p>
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{tripInfo.daysUntil}</span>
              <span className="text-sm text-blue-200">天後出發</span>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <svg className="w-full -mb-1" viewBox="0 0 1440 120" fill="none">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="#f9fafb"
          />
        </svg>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '📋', label: '行程表', view: 'experience' },
              { icon: '🆘', label: '緊急聯絡', view: 'experience' },
              { icon: '☁️', label: '天氣', view: 'experience' },
              { icon: '💬', label: '群組', view: 'experience' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.view as AppView)}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs text-gray-600 mt-1">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="p-4 mt-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">功能選單</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => onNavigate(feature.id as AppView)}
              className={`bg-gradient-to-br ${feature.color} rounded-2xl p-5 text-white text-left transform transition-all hover:scale-105 active:scale-95`}
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="font-bold mt-3">{feature.title}</h3>
              <p className="text-sm text-white/80 mt-1">{feature.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📢 最新公告</h2>
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500">
            <p className="text-sm text-amber-600 font-medium">重要提醒</p>
            <p className="text-gray-800 mt-1">護照效期請確認超過 6 個月</p>
            <p className="text-xs text-gray-500 mt-2">2024/03/01</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-blue-600 font-medium">行程更新</p>
            <p className="text-gray-800 mt-1">第三天晚餐投票已開放</p>
            <p className="text-xs text-gray-500 mt-2">2024/03/05</p>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
}
