import React, { memo, useMemo } from 'react';
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

const ACTIVE_TRIPS: ActiveTrip[] = [
  { id: '1', name: '東京五日深度遊', destination: '日本東京', currentLocation: '淺草寺', leader: '陳小明', leaderPhone: '0912-345-678', paxCount: 24, status: 'on_track', nextActivity: '午餐 - 淺草燒肉', nextTime: '12:30' },
  { id: '2', name: '北海道冬季雪祭', destination: '日本北海道', currentLocation: '札幌雪祭會場', leader: '林美玲', leaderPhone: '0923-456-789', paxCount: 38, status: 'delayed', nextActivity: '移動至小樽', nextTime: '14:00' },
];

interface StatusStyle {
  bg: string;
  text: string;
  label: string;
  icon: React.ReactNode;
}

const OperationHub: React.FC = memo(() => {
  const getStatusStyle = useMemo(() => (status: string): StatusStyle => {
    const styles: Record<string, StatusStyle> = {
      on_track: { bg: 'bg-brand-100', text: 'text-brand-700', label: '正常進行', icon: <CheckCircle className="w-4 h-4" aria-hidden="true" /> },
      delayed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '稍有延遲', icon: <Clock className="w-4 h-4" aria-hidden="true" /> },
      issue: { bg: 'bg-red-100', text: 'text-red-700', label: '有狀況', icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" /> },
    };
    return styles[status] || styles.on_track;
  }, []);

  const totalPaxCount = useMemo(() => ACTIVE_TRIPS.reduce((sum, t) => sum + t.paxCount, 0), []);
  const onTrackCount = useMemo(() => ACTIVE_TRIPS.filter(t => t.status === 'on_track').length, []);
  const warningCount = useMemo(() => ACTIVE_TRIPS.filter(t => t.status !== 'on_track').length, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in" role="main" aria-label="營運中心">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">營運中心</h1>
          <p className="text-gray-500 mt-1">即時監控出團狀態</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-100 rounded-xl">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" aria-hidden="true" />
          <span className="text-sm font-semibold text-brand-700">即時監控中</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100" aria-label="進行中團次">
          <Activity className="w-10 h-10 text-brand-600 mb-4" aria-hidden="true" />
          <p className="text-sm text-gray-500">進行中團次</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{ACTIVE_TRIPS.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100" aria-label="出團旅客">
          <Users className="w-10 h-10 text-gray-600 mb-4" aria-hidden="true" />
          <p className="text-sm text-gray-500">出團旅客</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalPaxCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100" aria-label="正常進行">
          <CheckCircle className="w-10 h-10 text-brand-600 mb-4" aria-hidden="true" />
          <p className="text-sm text-gray-500">正常進行</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{onTrackCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100" aria-label="需注意">
          <AlertTriangle className="w-10 h-10 text-yellow-600 mb-4" aria-hidden="true" />
          <p className="text-sm text-gray-500">需注意</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{warningCount}</p>
        </div>
      </div>

      <div className="space-y-4" role="list" aria-label="出團列表">
        {ACTIVE_TRIPS.map((trip) => {
          const status = getStatusStyle(trip.status);
          return (
            <div key={trip.id} className="bg-white p-6 rounded-2xl border border-gray-100" role="listitem" aria-labelledby={`trip-${trip.id}-title`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 id={`trip-${trip.id}-title`} className="text-lg font-bold text-gray-900">{trip.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{trip.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{trip.leader}</p>
                  <a href={`tel:${trip.leaderPhone}`} className="text-sm text-brand-600 flex items-center gap-1 justify-end" aria-label={`聯絡領隊 ${trip.leader}`}>
                    <Phone className="w-3 h-3" aria-hidden="true" /> {trip.leaderPhone}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">目前位置</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><MapPin className="w-4 h-4 text-brand-500" aria-hidden="true" /> {trip.currentLocation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">團員人數</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" aria-hidden="true" /> {trip.paxCount} 人</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">下一行程</p>
                  <p className="text-sm font-semibold text-gray-900">{trip.nextActivity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">預計時間</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" aria-hidden="true" /> {trip.nextTime}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

OperationHub.displayName = 'OperationHub';

export default OperationHub;