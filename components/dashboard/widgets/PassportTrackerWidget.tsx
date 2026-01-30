import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { GenericWidget } from '@/core/types/dashboard';

/**
 * Passport Tracker Widget Configuration
 */
export interface PassportTrackerWidgetConfig {
  /** Show expiry warnings */
  showWarnings?: boolean;
  /** Warning threshold in months */
  warningMonths?: number;
}

/**
 * Passport data structure
 */
interface PassportData {
  id: string;
  name: string;
  number: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

interface PassportTrackerWidgetProps {
  widget: GenericWidget<PassportTrackerWidgetConfig>;
  passports?: PassportData[];
  totalPassports?: number;
  expiringPassports?: number;
}

/**
 * Passport Tracker Widget - Real Passport Appearance
 * 護照追蹤器 Widget - 真實護照外觀
 */
export default function PassportTrackerWidget({ 
  widget, 
  passports = [],
  totalPassports = 0,
  expiringPassports = 0 
}: PassportTrackerWidgetProps) {
  const { showWarnings = true, warningMonths = 6 } = widget.config;

  // Use sample data if no passports provided
  const displayPassports = passports.length > 0 ? passports : [
    { id: '1', name: '王小明', number: 'AB1234567', expiryDate: '2024-12-31', daysUntilExpiry: 280 },
    { id: '2', name: '李小華', number: 'CD2345678', expiryDate: '2024-06-15', daysUntilExpiry: 105 },
    { id: '3', name: '張大同', number: 'EF3456789', expiryDate: '2025-03-20', daysUntilExpiry: 365 },
  ];

  const total = totalPassports || displayPassports.length;
  const expiring = expiringPassports || displayPassports.filter(p => p.daysUntilExpiry < warningMonths * 30).length;

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { color: 'text-red-400', icon: AlertTriangle, label: 'Expired' };
    if (days < warningMonths * 30) return { color: 'text-yellow-400', icon: Clock, label: 'Expiring Soon' };
    return { color: 'text-green-400', icon: CheckCircle, label: 'Valid' };
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-900 to-red-800 rounded-lg border-4 border-yellow-500 p-6 shadow-2xl relative overflow-hidden">
      {/* Passport Texture Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Header - Passport Cover Style */}
      <div className="relative z-10 text-center mb-6 pb-6 border-b-2 border-yellow-500/50">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-yellow-400 tracking-widest mb-1">PASSPORT</h3>
        <p className="text-lg text-yellow-400/80 tracking-wider">護照管理系統</p>
      </div>

      {/* Statistics */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/30">
          <p className="text-3xl font-bold text-yellow-400">{total}</p>
          <p className="text-xs text-yellow-400/70 mt-1">Total Passports</p>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/30">
          <p className={`text-3xl font-bold ${expiring > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {expiring}
          </p>
          <p className="text-xs text-yellow-400/70 mt-1">Expiring Soon</p>
        </div>
      </div>

      {/* Passport List */}
      <div className="relative z-10 flex-1 overflow-auto space-y-2 scrollbar-thin">
        {displayPassports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-yellow-400/40">
            <Shield className="w-12 h-12 mb-2" />
            <p className="text-sm">No passport records</p>
          </div>
        ) : (
          displayPassports.map((passport) => {
            const status = getExpiryStatus(passport.daysUntilExpiry);
            const StatusIcon = status.icon;
            
            return (
              <div
                key={passport.id}
                className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 hover:bg-yellow-500/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{passport.name}</p>
                      <p className="text-xs text-yellow-400/60 font-mono">{passport.number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${status.color}`}>
                      {passport.daysUntilExpiry < 0 ? 'Expired' : `${passport.daysUntilExpiry}d`}
                    </p>
                    <p className="text-xs text-yellow-400/50">{passport.expiryDate}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer - Embassy Emblem Style */}
      <div className="relative z-10 mt-4 pt-4 border-t-2 border-yellow-500/50 text-center">
        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
        <p className="text-xs text-yellow-400/50 tracking-wider">TRVIC TRAVEL PASSPORT CONTROL</p>
      </div>
    </div>
  );
}
