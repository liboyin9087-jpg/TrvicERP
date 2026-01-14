import React, { useState } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, Users, Calendar, Shield } from 'lucide-react';

interface InsuranceRecord {
  id: string;
  tripName: string;
  travelerCount: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'submitted' | 'confirmed';
  provider: string;
}

const MOCK_RECORDS: InsuranceRecord[] = [
  { id: '1', tripName: '東京五日深度遊', travelerCount: 24, startDate: '2025-03-15', endDate: '2025-03-19', status: 'confirmed', provider: '新光產險' },
  { id: '2', tripName: '北海道冬季雪祭', travelerCount: 38, startDate: '2025-02-01', endDate: '2025-02-06', status: 'submitted', provider: '國泰產險' },
  { id: '3', tripName: '首爾購物美食團', travelerCount: 12, startDate: '2025-04-20', endDate: '2025-04-24', status: 'pending', provider: '富邦產險' },
];

export default function InsuranceExport() {
  const [records] = useState<InsuranceRecord[]>(MOCK_RECORDS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待提交' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已提交' },
      confirmed: { bg: 'bg-brand-100', text: 'text-brand-700', label: '已確認' },
    };
    return styles[status] || styles.pending;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">保險管理</h2>
          <p className="text-gray-500 mt-1">團體保險申報與匯出</p>
        </div>
        <button disabled={selectedIds.length === 0} className="bg-black text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-300">
          <Download className="w-5 h-5" />
          匯出 ({selectedIds.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <Shield className="w-10 h-10 text-brand-600 mb-4" />
          <p className="text-sm text-gray-500">已投保人數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{records.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.travelerCount, 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <AlertCircle className="w-10 h-10 text-yellow-600 mb-4" />
          <p className="text-sm text-gray-500">待處理</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{records.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <FileText className="w-10 h-10 text-gray-600 mb-4" />
          <p className="text-sm text-gray-500">本月團次</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 w-12"><input type="checkbox" className="w-4 h-4 rounded" /></th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">團次</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">日期</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">人數</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">保險公司</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => {
              const status = getStatusStyle(record.status);
              return (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleSelect(record.id)} className="w-4 h-4 rounded" /></td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{record.tripName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.startDate} ~ {record.endDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.travelerCount} 人</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.provider}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
