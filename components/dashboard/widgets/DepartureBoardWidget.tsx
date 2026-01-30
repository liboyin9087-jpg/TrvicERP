import React from 'react';
import { Plane, Clock, Users } from 'lucide-react';
import type { GenericWidget } from '@/core/types/dashboard';

/**
 * Departure Board Widget Configuration
 */
export interface DepartureBoardWidgetConfig {
  /** Maximum number of sessions to display */
  maxSessions?: number;
  /** Whether to show the boarding animation */
  showAnimation?: boolean;
}

/**
 * Session data structure for departure board
 */
interface SessionData {
  id: string;
  code: string;           // 團號（顯示為航班號）
  destination: string;    // 目的地
  date: string;          // 出發日期
  pax: number;           // 已報名人數
  maxPax: number;        // 最大人數
  status: 'boarding' | 'scheduled' | 'delayed';
}

interface DepartureBoardWidgetProps {
  widget: GenericWidget<DepartureBoardWidgetConfig>;
  sessions?: SessionData[];
}

/**
 * Airport Departure Board Style Widget
 * 機場出發顯示屏風格 Widget
 */
export default function DepartureBoardWidget({ widget, sessions = [] }: DepartureBoardWidgetProps) {
  const { maxSessions = 5, showAnimation = true } = widget.config;

  // Use sample data if no sessions provided
  const displaySessions = sessions.length > 0 ? sessions : [
    { id: '1', code: 'TRV001', destination: '東京', date: '2024-03-15', pax: 28, maxPax: 30, status: 'boarding' as const },
    { id: '2', code: 'TRV002', destination: '首爾', date: '2024-03-16', pax: 25, maxPax: 35, status: 'scheduled' as const },
    { id: '3', code: 'TRV003', destination: '峇里島', date: '2024-03-18', pax: 15, maxPax: 25, status: 'scheduled' as const },
    { id: '4', code: 'TRV004', destination: '曼谷', date: '2024-03-20', pax: 20, maxPax: 30, status: 'delayed' as const },
  ];

  const limitedSessions = displaySessions.slice(0, maxSessions);

  const getStatusColor = (status: SessionData['status']) => {
    switch (status) {
      case 'boarding':
        return 'text-green-400';
      case 'delayed':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusText = (status: SessionData['status']) => {
    switch (status) {
      case 'boarding':
        return 'BOARDING';
      case 'delayed':
        return 'DELAYED';
      default:
        return 'SCHEDULED';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-yellow-500/20 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-yellow-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Plane className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-yellow-400 tracking-wide">DEPARTURES</h3>
            <p className="text-xs text-yellow-400/60">出發看板</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-yellow-400 font-mono">{new Date().toLocaleTimeString('en-US', { hour12: false })}</p>
          <p className="text-xs text-yellow-400/60">{new Date().toLocaleDateString('zh-TW')}</p>
        </div>
      </div>

      {/* Departure Board */}
      <div className="flex-1 overflow-auto space-y-3 scrollbar-thin">
        {limitedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-yellow-400/40">
            <Plane className="w-12 h-12 mb-2" />
            <p className="text-sm">No scheduled departures</p>
          </div>
        ) : (
          limitedSessions.map((session) => (
            <div
              key={session.id}
              className="bg-slate-800/50 border border-yellow-500/10 rounded-lg p-4 hover:scale-105 hover:border-yellow-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-bold text-yellow-400 font-mono tracking-wider">
                      {session.code}
                    </span>
                    <span className="text-lg text-white font-medium">
                      {session.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-yellow-400/60">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-mono">{session.pax}/{session.maxPax}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold font-mono tracking-widest ${getStatusColor(session.status)} ${
                      session.status === 'boarding' && showAnimation ? 'animate-pulse' : ''
                    }`}
                  >
                    {getStatusText(session.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-yellow-500/30 text-center">
        <p className="text-xs text-yellow-400/40 font-mono">
          TravelMaster Departure System v2.0
        </p>
      </div>
    </div>
  );
}
