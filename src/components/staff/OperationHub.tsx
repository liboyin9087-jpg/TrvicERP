import React from 'react';
import { Activity, Users, Calendar, AlertTriangle, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';

interface ActiveTrip {
  id: string;
  name: string;
  destination: string;
  currentLocation: string;
  leader: string;
  leaderPhone: string;
  paxCount: number;
  status: 'on_track' | 'delayed' | 'issue';
  nextActivity: string;
  nextTime: string;
}

export interface OperationHubConfig {
  activeTrips: ActiveTrip[];
}

const getStatusStyle = (status: string) => {
  const styles: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    on_track: { bg: 'bg-primary-100', text: 'text-primary-700', label: '正常進行', icon: <CheckCircle className="w-4 h-4" /> },
    delayed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '稍有延遲', icon: <Clock className="w-4 h-4" /> },
    issue: { bg: 'bg-red-100', text: 'text-red-700', label: '有狀況', icon: <AlertTriangle className="w-4 h-4" /> },
  };
  return styles[status] || styles.on_track;
};

export default function OperationHub({ activeTrips }: OperationHubConfig) {
  const totalPaxCount = activeTrips.reduce((sum, t) => sum + t.paxCount, 0);
  const onTrackCount = activeTrips.filter(t => t.status === 'on_track').length;
  const attentionNeededCount = activeTrips.filter(t => t.status !== 'on_track').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in bg-gray-50 rounded-lg shadow-sm border border-gray-100">
      <div className="drag-handle flex items-center justify-between cursor-grab py-2 -mx-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">營運中心</h2>
          <p className="text-gray-500 mt-1">即時監控出團狀態</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-lg">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-primary-700">即時監控中</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button type="button" className="bg-white p-6 rounded-2xl border border-gray-100 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-150">
          <Activity className="w-10 h-10 text-primary-600 mb-4" />
          <p className="text-sm text-gray-500">進行中團次</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeTrips.length}</p>
        </button>
        <button type="button" className="bg-white p-6 rounded-2xl border border-gray-100 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-150">
          <Users className="w-10 h-10 text-gray-600 mb-4" />
          <p className="text-sm text-gray-500">出團旅客</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalPaxCount}</p>
        </button>
        <button type="button" className="bg-white p-6 rounded-2xl border border-gray-100 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-150">
          <CheckCircle className="w-10 h-10 text-primary-600 mb-4" />
          <p className="text-sm text-gray-500">正常進行</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{onTrackCount}</p>
        </button>
        <button type="button" className="bg-white p-6 rounded-2xl border border-gray-100 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-150">
          <AlertTriangle className="w-10 h-10 text-yellow-600 mb-4" />
          <p className="text-sm text-gray-500">需注意</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{attentionNeededCount}</p>
        </button>
      </div>

      <div className="space-y-4">
        {activeTrips.map((trip) => {
          const status = getStatusStyle(trip.status);
          return (
            <button
              key={trip.id}
              type="button"
              className="w-full text-left bg-white p-6 rounded-2xl border border-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-150"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{trip.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{trip.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{trip.leader}</p>
                  <a href={`tel:${trip.leaderPhone}`} className="text-sm text-primary-600 flex items-center gap-1 justify-end hover:underline" onClick={(e) => e.stopPropagation()}>
                    <Phone className="w-3 h-3" /> {trip.leaderPhone}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 mb-1">目前位置</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><MapPin className="w-4 h-4 text-primary-500" /> {trip.currentLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">團員人數</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" /> {trip.paxCount} 人</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">下一行程</p>
                  <p className="text-sm font-semibold text-gray-900">{trip.nextActivity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">預計時間</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" /> {trip.nextTime}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}