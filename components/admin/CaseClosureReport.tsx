import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Users, Calendar, MapPin, CheckCircle, AlertTriangle,
  Star, MessageSquare, TrendingUp, Clock, Printer, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourSession, Booking } from '@/types';

// ============================================
// Types
// ============================================

interface CaseClosureReportProps {
  session: TourSession;
  bookings: Booking[];
  onClose?: () => void;
}

interface FeedbackSummary {
  averageRating: number;
  totalResponses: number;
  categoryRatings: {
    category: string;
    rating: number;
  }[];
  highlights: string[];
  improvements: string[];
}

interface IncidentLog {
  id: string;
  type: 'delay' | 'complaint' | 'medical' | 'lost_item' | 'other';
  description: string;
  resolution: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

// ============================================
// Mock Data
// ============================================

const MOCK_FEEDBACK: FeedbackSummary = {
  averageRating: 4.5,
  totalResponses: 28,
  categoryRatings: [
    { category: '行程安排', rating: 4.6 },
    { category: '住宿品質', rating: 4.4 },
    { category: '餐食安排', rating: 4.3 },
    { category: '導遊服務', rating: 4.8 },
    { category: '交通安排', rating: 4.2 },
  ],
  highlights: [
    '導遊張先生非常專業，講解詳細',
    '飯店升等讓大家很滿意',
    '行程安排充實但不趕',
  ],
  improvements: [
    '第三天午餐等待時間過長',
    '建議增加自由活動時間',
  ],
};

const MOCK_INCIDENTS: IncidentLog[] = [
  {
    id: 'inc_1',
    type: 'delay',
    description: '第二天因交通擁塞，抵達景點延遲30分鐘',
    resolution: '調整後續行程，壓縮購物時間補回',
    timestamp: '2025-03-16 10:30',
    severity: 'low',
  },
  {
    id: 'inc_2',
    type: 'medical',
    description: '旅客王小姐輕微暈車',
    resolution: '提供暈車藥，安排前座位置',
    timestamp: '2025-03-17 09:15',
    severity: 'low',
  },
];

// ============================================
// Helper Components
// ============================================

function StatCard({ icon, label, value, subValue, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
          {icon}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {subValue && (
          <span className={cn(
            'text-sm',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'neutral' && 'text-gray-500'
          )}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

function RatingBar({ label, rating, maxRating = 5 }: {
  label: string;
  rating: number;
  maxRating?: number;
}) {
  const percentage = (rating / maxRating) * 100;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={cn(
            'h-full rounded-full',
            rating >= 4.5 ? 'bg-green-500' :
            rating >= 4.0 ? 'bg-blue-500' :
            rating >= 3.5 ? 'bg-yellow-500' : 'bg-red-500'
          )}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 w-10 text-right">{rating.toFixed(1)}</span>
    </div>
  );
}

function IncidentCard({ incident }: { incident: IncidentLog }) {
  const typeLabels: Record<string, { label: string; color: string }> = {
    delay: { label: '延誤', color: 'bg-yellow-100 text-yellow-700' },
    complaint: { label: '客訴', color: 'bg-red-100 text-red-700' },
    medical: { label: '醫療', color: 'bg-blue-100 text-blue-700' },
    lost_item: { label: '遺失', color: 'bg-purple-100 text-purple-700' },
    other: { label: '其他', color: 'bg-gray-100 text-gray-700' },
  };

  const { label, color } = typeLabels[incident.type] || typeLabels.other;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-2">
        <span className={cn('px-2 py-1 rounded-lg text-xs font-medium', color)}>
          {label}
        </span>
        <span className="text-xs text-gray-400">{incident.timestamp}</span>
      </div>
      <p className="text-sm text-gray-900 mb-2">{incident.description}</p>
      <div className="flex items-start gap-2 text-sm">
        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
        <span className="text-gray-600">{incident.resolution}</span>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CaseClosureReport({
  session,
  bookings,
}: CaseClosureReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'incidents' | 'export'>('overview');

  const feedback = MOCK_FEEDBACK;
  const incidents = MOCK_INCIDENTS;

  // 計算統計數據
  const totalPax = session.current_pax;
  const confirmedPax = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length;
  const specialNeedsCount = bookings.filter(b => b.special_needs).length;
  const duration = Math.ceil(
    (new Date(session.end_date).getTime() - new Date(session.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReportHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReportHTML = (): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>結案報告 - ${session.group_number || session.series_id}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; line-height: 1.6; }
          .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .meta { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #333; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f5f5f5; font-weight: bold; }
          .rating { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
          .rating-high { background: #dcfce7; color: #166534; }
          .rating-mid { background: #fef3c7; color: #92400e; }
          .highlight { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 15px; margin: 5px 0; }
          .improvement { background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 15px; margin: 5px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">團次結案報告</div>
          <div class="meta">
            團號：${session.group_number || 'N/A'} |
            出發日期：${session.start_date} ~ ${session.end_date} |
            報告日期：${new Date().toLocaleDateString('zh-TW')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">基本資訊</div>
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value">${totalPax}</div>
              <div class="stat-label">總人數</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${duration}</div>
              <div class="stat-label">天數</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${feedback.averageRating.toFixed(1)}</div>
              <div class="stat-label">平均評分</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${incidents.length}</div>
              <div class="stat-label">事件記錄</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">滿意度分析</div>
          <p>回覆率：${feedback.totalResponses}/${totalPax} (${Math.round(feedback.totalResponses / totalPax * 100)}%)</p>
          <table>
            <thead>
              <tr>
                <th>評分項目</th>
                <th>評分</th>
              </tr>
            </thead>
            <tbody>
              ${feedback.categoryRatings.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td><span class="rating ${cat.rating >= 4.5 ? 'rating-high' : 'rating-mid'}">${cat.rating.toFixed(1)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">旅客回饋</div>
          <h4 style="margin: 15px 0 10px; color: #166534;">✓ 好評項目</h4>
          ${feedback.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
          <h4 style="margin: 15px 0 10px; color: #dc2626;">△ 待改進項目</h4>
          ${feedback.improvements.map(i => `<div class="improvement">${i}</div>`).join('')}
        </div>

        <div class="section">
          <div class="section-title">事件記錄</div>
          ${incidents.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>類型</th>
                  <th>說明</th>
                  <th>處理方式</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                ${incidents.map(inc => `
                  <tr>
                    <td>${inc.type}</td>
                    <td>${inc.description}</td>
                    <td>${inc.resolution}</td>
                    <td>${inc.timestamp}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>本團次無特殊事件記錄</p>'}
        </div>

        <div class="footer">
          本報告由 TrvicERP 自動生成 | ${new Date().toLocaleString('zh-TW')}
        </div>
      </body>
      </html>
    `;
  };

  const tabs = [
    { key: 'overview', label: '總覽', icon: <FileText className="w-4 h-4" /> },
    { key: 'feedback', label: '滿意度', icon: <Star className="w-4 h-4" /> },
    { key: 'incidents', label: '事件記錄', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'export', label: '匯出', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">結案報告</h3>
          <p className="text-sm text-gray-500 mt-1">
            團號：{session.group_number || session.series_id} | {session.start_date} ~ {session.end_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            列印報告
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-100 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="總參加人數"
              value={totalPax.toString()}
              subValue={`${confirmedPax} 已確認`}
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="行程天數"
              value={`${duration} 天`}
            />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              label="平均評分"
              value={feedback.averageRating.toFixed(1)}
              subValue={`${feedback.totalResponses} 則評價`}
              trend={feedback.averageRating >= 4.5 ? 'up' : 'neutral'}
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="事件記錄"
              value={incidents.length.toString()}
              subValue={incidents.filter(i => i.severity === 'high').length > 0 ? '需關注' : '正常'}
              trend={incidents.filter(i => i.severity === 'high').length > 0 ? 'down' : 'up'}
            />
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Ratings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4">滿意度概覽</h4>
              <div className="space-y-3">
                {feedback.categoryRatings.map((cat) => (
                  <RatingBar key={cat.category} label={cat.category} rating={cat.rating} />
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4">事件摘要</h4>
              {incidents.length > 0 ? (
                <div className="space-y-3">
                  {incidents.slice(0, 3).map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>本團次無特殊事件記錄</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'feedback' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Rating Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-gray-900">整體滿意度</h4>
                <p className="text-sm text-gray-500 mt-1">
                  共 {feedback.totalResponses} 則評價 (回覆率 {Math.round(feedback.totalResponses / totalPax * 100)}%)
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{feedback.averageRating.toFixed(1)}</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-5 h-5',
                        star <= Math.round(feedback.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {feedback.categoryRatings.map((cat) => (
                <RatingBar key={cat.category} label={cat.category} rating={cat.rating} />
              ))}
            </div>
          </div>

          {/* Highlights & Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
              <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                好評項目
              </h4>
              <div className="space-y-3">
                {feedback.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-green-800">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
              <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                待改進項目
              </h4>
              <div className="space-y-3">
                {feedback.improvements.map((improvement, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-amber-800">{improvement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'incidents' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {incidents.length > 0 ? (
            incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">無事件記錄</h4>
              <p className="text-gray-500">本團次順利完成，無特殊事件需要記錄</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'export' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPDF}
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">匯出 PDF 報告</h4>
              <p className="text-sm text-gray-500">完整的結案報告，可列印或分享</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Excel 匯出功能開發中')}
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">匯出 Excel 數據</h4>
              <p className="text-sm text-gray-500">原始數據，可進一步分析</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Email 發送功能開發中')}
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Email 發送報告</h4>
              <p className="text-sm text-gray-500">將報告發送給相關人員</p>
            </div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
