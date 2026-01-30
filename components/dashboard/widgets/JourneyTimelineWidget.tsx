import React from 'react';
import { MapPin, Plane, Clock, CheckCircle, DollarSign, Users } from 'lucide-react';
import type { GenericWidget } from '@/core/types/dashboard';

/**
 * Journey Timeline Widget Configuration
 */
export interface JourneyTimelineWidgetConfig {
  /** Maximum number of journeys to display */
  maxJourneys?: number;
  /** Whether to show revenue information */
  showRevenue?: boolean;
}

/**
 * Journey data structure
 */
interface JourneyData {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  pax: number;
  revenue: number;
  status: 'ongoing' | 'upcoming' | 'completed';
}

interface JourneyTimelineWidgetProps {
  widget: GenericWidget<JourneyTimelineWidgetConfig>;
  journeys?: JourneyData[];
}

/**
 * Journey Timeline Widget - Google Maps Style
 * 旅程時間軸 Widget - Google Maps 風格
 */
export default function JourneyTimelineWidget({ widget, journeys = [] }: JourneyTimelineWidgetProps) {
  const { maxJourneys = 5, showRevenue = true } = widget.config;

  // Use sample data if no journeys provided
  const displayJourneys = journeys.length > 0 ? journeys : [
    { id: '1', destination: '東京', startDate: '2024-03-15', endDate: '2024-03-20', days: 5, pax: 28, revenue: 840000, status: 'ongoing' as const },
    { id: '2', destination: '首爾', startDate: '2024-03-25', endDate: '2024-03-29', days: 4, pax: 25, revenue: 625000, status: 'upcoming' as const },
    { id: '3', destination: '峇里島', startDate: '2024-04-05', endDate: '2024-04-12', days: 7, pax: 15, revenue: 750000, status: 'upcoming' as const },
    { id: '4', destination: '巴黎', startDate: '2024-02-10', endDate: '2024-02-18', days: 8, pax: 20, revenue: 1200000, status: 'completed' as const },
  ];

  const limitedJourneys = displayJourneys.slice(0, maxJourneys);

  const getStatusConfig = (status: JourneyData['status']) => {
    switch (status) {
      case 'ongoing':
        return { 
          icon: Plane, 
          color: 'from-green-500 to-emerald-500', 
          bgColor: 'bg-green-500', 
          textColor: 'text-green-600',
          label: 'In Progress' 
        };
      case 'upcoming':
        return { 
          icon: Clock, 
          color: 'from-sky-500 to-blue-500', 
          bgColor: 'bg-sky-500', 
          textColor: 'text-sky-600',
          label: 'Upcoming' 
        };
      case 'completed':
        return { 
          icon: CheckCircle, 
          color: 'from-slate-400 to-slate-500', 
          bgColor: 'bg-slate-400', 
          textColor: 'text-slate-600',
          label: 'Completed' 
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-6 shadow-lg relative overflow-hidden">
      {/* Map Texture Background */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Clouds Animation */}
      <div className="absolute top-10 left-10 w-20 h-10 bg-white/50 rounded-full animate-float-cloud" />
      <div className="absolute top-20 right-20 w-16 h-8 bg-white/40 rounded-full animate-float-delayed" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Journey Timeline</h3>
            <p className="text-xs text-slate-600">旅程時間軸</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative z-10 flex-1 overflow-auto scrollbar-thin">
        {limitedJourneys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MapPin className="w-12 h-12 mb-2" />
            <p className="text-sm">No journey records</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500 via-orange-500 to-green-500 rounded-full" />

            {/* Journey Items */}
            <div className="space-y-6">
              {limitedJourneys.map((journey, index) => {
                const statusConfig = getStatusConfig(journey.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={journey.id} className="relative pl-14">
                    {/* Timeline Node */}
                    <div className={`absolute left-2.5 w-6 h-6 rounded-full ${statusConfig.bgColor} border-4 border-white shadow-lg ${
                      journey.status === 'ongoing' ? 'animate-pulse' : ''
                    }`}>
                      {journey.status === 'ongoing' && (
                        <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                      )}
                    </div>

                    {/* Journey Card */}
                    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 border border-blue-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
                          <h4 className="text-lg font-bold text-slate-800">{journey.destination}</h4>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusConfig.textColor} ${
                          journey.status === 'ongoing' ? 'bg-green-100' : 
                          journey.status === 'upcoming' ? 'bg-sky-100' : 
                          'bg-slate-100'
                        }`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{journey.startDate} - {journey.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4" />
                          <span>{journey.pax} travelers</span>
                        </div>
                        {showRevenue && (
                          <>
                            <div className="flex items-center gap-2 text-slate-600">
                              <span className="text-xs">Duration: {journey.days} days</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-600 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(journey.revenue)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
