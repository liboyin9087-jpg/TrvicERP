// =====================================================
// TravelCanvas - Warning Database Panel
// 反雷資料庫：群眾外包機制 + 地雷指數
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X
} from './Icons';
import {
  fetchWarningReports,
  submitWarningReport
} from '../services/mockDataService';
import type { WarningReport, WarningSeverity, WarningCategory, SupplierType } from '../services/types';

interface WarningDatabasePanelProps {
  onClose?: () => void;
}

const SEVERITY_CONFIG: Record<WarningSeverity, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  critical: { label: '嚴重', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: <AlertTriangle size={16} /> },
  high: { label: '高風險', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: <AlertTriangle size={16} /> },
  medium: { label: '中等', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: <AlertCircle size={16} /> },
  low: { label: '低風險', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: <CheckCircle2 size={16} /> }
};

const CATEGORY_LABELS: Record<WarningCategory, string> = {
  quality: '品質問題',
  service: '服務態度',
  safety: '安全疑慮',
  price: '價格糾紛',
  reliability: '可靠度',
  legal: '法規問題'
};

const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  hotel: '飯店',
  restaurant: '餐廳',
  transport: '交通',
  activity: '活動',
  shopping: '購物',
  other: '其他'
};

const WarningDatabasePanel: React.FC<WarningDatabasePanelProps> = ({ onClose }) => {
  const [warnings, setWarnings] = useState<WarningReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarning, setSelectedWarning] = useState<WarningReport | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    supplier_type: '',
    verified_only: false,
    search: ''
  });
  const [userCredits, setUserCredits] = useState(25);

  useEffect(() => {
    loadWarnings();
  }, [filters]);

  const loadWarnings = async () => {
    setLoading(true);
    try {
      const data = await fetchWarningReports({
        severity: filters.severity || undefined,
        supplier_type: filters.supplier_type || undefined,
        verified_only: filters.verified_only
      });
      
      let filtered = data;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = data.filter(w => 
          w.supplier_name.toLowerCase().includes(search) ||
          w.title.toLowerCase().includes(search)
        );
      }
      
      setWarnings(filtered);
    } catch (error) {
      console.error('Error loading warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWarning = (warning: WarningReport) => {
    if (userCredits > 0) {
      setUserCredits(prev => prev - 1);
      setSelectedWarning(warning);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-orange-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <ShieldAlert className="text-rose-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">反雷資料庫</h2>
              <p className="text-sm text-slate-500">供應商風險情報中心</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">查詢額度</span>
              <span className="ml-2 text-lg font-bold text-rose-600">{userCredits}</span>
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              <Plus size={18} /> 回報問題
            </button>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="總回報數"
            value={warnings.length}
            icon={<AlertTriangle size={16} />}
            color="slate"
          />
          <StatCard
            label="嚴重警告"
            value={warnings.filter(w => w.severity === 'critical').length}
            icon={<AlertTriangle size={16} />}
            color="red"
          />
          <StatCard
            label="已驗證"
            value={warnings.filter(w => w.verified).length}
            icon={<CheckCircle2 size={16} />}
            color="green"
          />
          <StatCard
            label="本月新增"
            value={12}
            icon={<Plus size={16} />}
            color="blue"
          />
        </div>
      </div>

      {/* 篩選器 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋供應商名稱..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-100 focus:border-rose-300 outline-none"
          />
        </div>
        
        <select
          value={filters.supplier_type}
          onChange={(e) => setFilters(prev => ({ ...prev, supplier_type: e.target.value }))}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">所有類型</option>
          {Object.entries(SUPPLIER_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">所有風險等級</option>
          {Object.entries(SEVERITY_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.verified_only}
            onChange={(e) => setFilters(prev => ({ ...prev, verified_only: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="text-sm text-slate-600">僅顯示已驗證</span>
        </label>
      </div>

      {/* 警告列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full" />
          </div>
        ) : warnings.length === 0 ? (
          <div className="text-center py-12">
            <ShieldAlert size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">沒有符合條件的警告紀錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((warning) => (
              <WarningCard
                key={warning.id}
                warning={warning}
                onView={() => handleViewWarning(warning)}
                hasCredits={userCredits > 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* 警告詳情 Modal */}
      {selectedWarning && (
        <WarningDetailModal
          warning={selectedWarning}
          onClose={() => setSelectedWarning(null)}
        />
      )}

      {/* 回報表單 Modal */}
      {showReportForm && (
        <ReportFormModal
          onClose={() => setShowReportForm(false)}
          onSubmit={async (report) => {
            await submitWarningReport(report);
            setUserCredits(prev => prev + 5); // 回報獲得額度
            setShowReportForm(false);
            loadWarnings();
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// 子元件
// =====================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'red' | 'green' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

interface WarningCardProps {
  warning: WarningReport;
  onView: () => void;
  hasCredits: boolean;
}

const WarningCard: React.FC<WarningCardProps> = ({ warning, onView, hasCredits }) => {
  const severity = SEVERITY_CONFIG[warning.severity];

  return (
    <div className={`p-4 rounded-xl border ${severity.bg} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${severity.color} bg-white/80`}>
              {severity.icon}
              {severity.label}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
              {SUPPLIER_TYPE_LABELS[warning.supplier_type]}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
              {CATEGORY_LABELS[warning.category]}
            </span>
            {warning.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                <CheckCircle2 size={12} /> 已驗證
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-slate-900 mb-1">{warning.supplier_name}</h3>
          <p className="text-sm text-slate-600 mb-2">{warning.title}</p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye size={12} /> {warning.view_count} 次查看
            </span>
            <span>回報於 {warning.reported_at}</span>
            <span className="flex items-center gap-1">
              信任分數: <strong className="text-slate-700">{warning.trust_score}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={onView}
          disabled={!hasCredits}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hasCredits
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          查看詳情
        </button>
      </div>
    </div>
  );
};

interface WarningDetailModalProps {
  warning: WarningReport;
  onClose: () => void;
}

const WarningDetailModal: React.FC<WarningDetailModalProps> = ({ warning, onClose }) => {
  const severity = SEVERITY_CONFIG[warning.severity];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className={`p-6 ${severity.bg} border-b`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${severity.color} bg-white`}>
                  {severity.icon}
                  {severity.label}
                </span>
                {warning.verified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                    <CheckCircle2 size={14} /> 官方驗證
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{warning.supplier_name}</h2>
              <p className="text-slate-600 mt-1">{warning.title}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <X size={24} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* 詳細描述 */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">問題描述</h3>
              <p className="text-slate-700 leading-relaxed">{warning.description}</p>
            </div>

            {/* 證據 */}
            {warning.evidence.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">相關證據</h3>
                <ul className="space-y-2">
                  {warning.evidence.map((ev, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 元資料 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500">供應商類型</p>
                <p className="font-medium text-slate-900">{SUPPLIER_TYPE_LABELS[warning.supplier_type]}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">問題分類</p>
                <p className="font-medium text-slate-900">{CATEGORY_LABELS[warning.category]}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">回報日期</p>
                <p className="font-medium text-slate-900">{warning.reported_at}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">信任分數</p>
                <p className="font-medium text-slate-900">{warning.trust_score} / 100</p>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium">
                <ThumbsUp size={18} /> 有幫助
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors font-medium">
                <ThumbsDown size={18} /> 資訊不正確
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReportFormModalProps {
  onClose: () => void;
  onSubmit: (report: any) => Promise<void>;
}

const ReportFormModal: React.FC<ReportFormModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_type: 'hotel' as SupplierType,
    severity: 'medium' as WarningSeverity,
    category: 'quality' as WarningCategory,
    title: '',
    description: '',
    evidence: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        supplier_id: `sup-${Date.now()}`,
        evidence: formData.evidence.split('\n').filter(Boolean),
        reported_by: 'current-user'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-200 bg-rose-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <ShieldAlert className="text-rose-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">回報問題供應商</h2>
                <p className="text-sm text-slate-500">回報成功可獲得 5 點查詢額度</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">供應商名稱 *</label>
              <input
                type="text"
                required
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
                placeholder="例如：某某飯店"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">供應商類型 *</label>
              <select
                value={formData.supplier_type}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_type: e.target.value as SupplierType }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              >
                {Object.entries(SUPPLIER_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">嚴重程度 *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as WarningSeverity }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              >
                {Object.entries(SEVERITY_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">問題分類 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as WarningCategory }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">問題標題 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              placeholder="簡短描述問題"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">詳細描述 *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg h-24 resize-none"
              placeholder="請詳細描述遇到的問題..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">證據（選填，每行一項）</label>
            <textarea
              value={formData.evidence}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg h-20 resize-none"
              placeholder="例如：&#10;客訴照片3張&#10;退款紀錄"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交回報'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarningDatabasePanel;
