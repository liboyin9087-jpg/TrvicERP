// =====================================================
// TravelCanvas - Version Control Panel
// 行程版本控制：Git for Itinerary
// =====================================================

import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, User, DollarSign, ChevronRight, Plus, Minus, Edit, X, CheckCircle2 } from './Icons';
import { fetchVersionHistory, compareVersions } from '../services/mockDataService';
import type { VersionHistory, VersionChange } from '../services/types';

interface VersionControlPanelProps {
  entityType: string;
  entityId: string;
  entityName?: string;
  onClose?: () => void;
}

type ViewMode = 'timeline' | 'cost' | 'history';

const VersionControlPanel: React.FC<VersionControlPanelProps> = ({ entityType, entityId, entityName = '行程', onClose }) => {
  const [versions, setVersions] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);
  const [comparison, setComparison] = useState<{ changes: VersionChange[]; total_price_impact: number; changed_by: string; changed_at: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  useEffect(() => { loadVersions(); }, [entityType, entityId]);

  const loadVersions = async () => {
    setLoading(true);
    const data = await fetchVersionHistory(entityType, entityId);
    setVersions(data.sort((a, b) => b.version - a.version));
    setLoading(false);
  };

  const handleCompare = async (v1Id: string, v2Id: string) => {
    setSelectedVersions([v1Id, v2Id]);
    setComparison(await compareVersions(v1Id, v2Id));
  };

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center"><GitBranch className="text-violet-600" size={24} /></div>
            <div><h2 className="text-xl font-bold text-slate-900">版本歷程</h2><p className="text-sm text-slate-500">{entityName} · {versions.length} 個版本</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              {(['timeline', 'cost', 'history'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === mode ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}>
                  {mode === 'timeline' ? '時間軸' : mode === 'cost' ? '成本影響' : '變更紀錄'}
                </button>
              ))}
            </div>
            {onClose && <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} className="text-slate-500" /></button>}
          </div>
        </div>
        {comparison && (
          <div className="p-4 bg-white rounded-xl border border-violet-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">版本比較結果</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${comparison.total_price_impact > 0 ? 'bg-rose-100 text-rose-700' : comparison.total_price_impact < 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {comparison.total_price_impact > 0 ? '+' : ''}{comparison.total_price_impact.toLocaleString()} TWD
                </span>
              </div>
              <button onClick={() => { setSelectedVersions(null); setComparison(null); }} className="text-sm text-violet-600 hover:underline">清除比較</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" /></div>
          : viewMode === 'timeline' ? <TimelineView versions={versions} selectedVersions={selectedVersions} onCompare={handleCompare} formatDateTime={formatDateTime} />
          : viewMode === 'cost' ? <CostImpactView versions={versions} />
          : <HistoryView versions={versions} formatDateTime={formatDateTime} />}
      </div>

      {comparison && comparison.changes.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 max-h-64 overflow-y-auto">
          <h3 className="font-bold text-slate-900 mb-3">變更明細</h3>
          <div className="space-y-2">{comparison.changes.map((change, i) => <ChangeItem key={i} change={change} />)}</div>
        </div>
      )}
    </div>
  );
};

const TimelineView: React.FC<{ versions: VersionHistory[]; selectedVersions: [string, string] | null; onCompare: (v1: string, v2: string) => void; formatDateTime: (iso: string) => string }> = ({ versions, onCompare, formatDateTime }) => {
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const handleVersionClick = (verId: string) => {
    if (!compareMode) return;
    if (selected.includes(verId)) { setSelected(selected.filter(id => id !== verId)); }
    else if (selected.length < 2) {
      const newSelected = [...selected, verId];
      setSelected(newSelected);
      if (newSelected.length === 2) { onCompare(newSelected[0], newSelected[1]); setCompareMode(false); setSelected([]); }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">版本時間軸</h3>
        <button onClick={() => { setCompareMode(!compareMode); setSelected([]); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${compareMode ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
          {compareMode ? '取消比較' : '選擇比較版本'}
        </button>
      </div>
      {compareMode && <div className="mb-4 p-3 bg-violet-50 border border-violet-100 rounded-lg text-sm text-violet-700">請選擇兩個版本進行比較（已選 {selected.length}/2）</div>}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {versions.map((ver, idx) => (
            <div key={ver.id} onClick={() => handleVersionClick(ver.id)} className={`relative pl-16 cursor-pointer group ${compareMode ? 'hover:bg-violet-50 rounded-xl p-4 -ml-4' : ''} ${selected.includes(ver.id) ? 'bg-violet-100 rounded-xl p-4 -ml-4' : ''}`}>
              <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${idx === 0 ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-300'} ${selected.includes(ver.id) ? 'bg-violet-600 border-violet-600' : ''}`}>
                {idx === 0 && <div className="w-2 h-2 bg-white rounded-full" />}
                {selected.includes(ver.id) && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm group-hover:border-violet-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">v{ver.version}</span>
                    {idx === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">最新</span>}
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} />{formatDateTime(ver.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 mb-2">{ver.note || '版本更新'}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><User size={12} />{ver.created_by}</span>
                  <span className="flex items-center gap-1"><Edit size={12} />{ver.changes.length} 項變更</span>
                  {ver.changes.length > 0 && <span className={`flex items-center gap-1 ${ver.changes.reduce((sum, c) => sum + c.price_impact, 0) > 0 ? 'text-rose-500' : 'text-green-500'}`}><DollarSign size={12} />{ver.changes.reduce((sum, c) => sum + c.price_impact, 0) > 0 ? '+' : ''}{ver.changes.reduce((sum, c) => sum + c.price_impact, 0).toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CostImpactView: React.FC<{ versions: VersionHistory[] }> = ({ versions }) => {
  const impacts = versions.slice(0, -1).map(ver => ({ version: ver.version, note: ver.note, impact: ver.changes.reduce((sum, c) => sum + c.price_impact, 0), changes: ver.changes })).filter(v => v.impact !== 0);
  const totalImpact = impacts.reduce((sum, v) => sum + v.impact, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">成本影響摘要</h3>
        <div className={`px-4 py-2 rounded-lg font-bold ${totalImpact > 0 ? 'bg-rose-100 text-rose-700' : totalImpact < 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>淨變動：{totalImpact > 0 ? '+' : ''}{totalImpact.toLocaleString()} TWD</div>
      </div>
      <div className="space-y-3">
        {impacts.map(item => (
          <div key={item.version} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">v{item.version}</span><span className="text-sm text-slate-700">{item.note}</span></div>
              <span className={`font-bold ${item.impact > 0 ? 'text-rose-600' : 'text-green-600'}`}>{item.impact > 0 ? '+' : ''}{item.impact.toLocaleString()} TWD</span>
            </div>
            <div className="space-y-2">
              {item.changes.filter(c => c.price_impact !== 0).map((change, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">{change.price_impact > 0 ? <Plus size={14} className="text-rose-500" /> : <Minus size={14} className="text-green-500" />}<span className="text-slate-600">{change.field}</span></div>
                  <div className="flex items-center gap-4"><span className="text-slate-400 line-through">{change.old_value}</span><ChevronRight size={14} className="text-slate-300" /><span className="text-slate-700 font-medium">{change.new_value}</span><span className={`font-medium ${change.price_impact > 0 ? 'text-rose-600' : 'text-green-600'}`}>{change.price_impact > 0 ? '+' : ''}{change.price_impact.toLocaleString()}</span></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryView: React.FC<{ versions: VersionHistory[]; formatDateTime: (iso: string) => string }> = ({ versions, formatDateTime }) => (
  <div>
    <h3 className="font-bold text-slate-900 mb-4">完整變更紀錄</h3>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">版本</th><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">時間</th><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">操作者</th><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">變更</th><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">說明</th><th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">價格影響</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {versions.map(ver => (
            <tr key={ver.id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">v{ver.version}</span></td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(ver.created_at)}</td>
              <td className="px-4 py-3 text-slate-700">{ver.created_by}</td>
              <td className="px-4 py-3 text-slate-600">{ver.changes.length} 項</td>
              <td className="px-4 py-3 text-slate-700">{ver.note || '-'}</td>
              <td className="px-4 py-3 text-right">{ver.changes.length > 0 ? <span className={`font-medium ${ver.changes.reduce((sum, c) => sum + c.price_impact, 0) > 0 ? 'text-rose-600' : ver.changes.reduce((sum, c) => sum + c.price_impact, 0) < 0 ? 'text-green-600' : 'text-slate-600'}`}>{ver.changes.reduce((sum, c) => sum + c.price_impact, 0) > 0 ? '+' : ''}{ver.changes.reduce((sum, c) => sum + c.price_impact, 0).toLocaleString()}</span> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ChangeItem: React.FC<{ change: VersionChange }> = ({ change }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${change.price_impact > 0 ? 'bg-rose-100' : change.price_impact < 0 ? 'bg-green-100' : 'bg-slate-100'}`}>
        {change.price_impact > 0 ? <Plus size={16} className="text-rose-600" /> : change.price_impact < 0 ? <Minus size={16} className="text-green-600" /> : <Edit size={16} className="text-slate-600" />}
      </div>
      <div><p className="font-medium text-slate-900">{change.field}</p><p className="text-sm text-slate-500"><span className="line-through">{change.old_value}</span><span className="mx-2">→</span><span className="text-slate-700">{change.new_value}</span></p></div>
    </div>
    <span className={`font-bold ${change.price_impact > 0 ? 'text-rose-600' : change.price_impact < 0 ? 'text-green-600' : 'text-slate-600'}`}>{change.price_impact !== 0 ? (change.price_impact > 0 ? '+' : '') + change.price_impact.toLocaleString() + ' TWD' : '無價格影響'}</span>
  </div>
);

export default VersionControlPanel;
