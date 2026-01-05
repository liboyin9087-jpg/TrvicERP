// =====================================================
// TravelCanvas - RFP Generator Panel
// 福委會需求提案產生器：楔子策略核心入口
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  Send,
  Copy,
  X,
  ChevronRight,
  Star,
  Building,
  Mail
} from './Icons';
import { fetchRFPRequests, createRFPRequest } from '../services/mockDataService';
import type { RFPRequest } from '../services/types';

interface RFPGeneratorPanelProps {
  onClose?: () => void;
  userRole?: 'welfare_committee' | 'agency';
  /** 若為 true，進入頁面後會自動打開「建立需求」表單 */
  startInCreateMode?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-slate-600', bg: 'bg-slate-100' },
  open: { label: '開放報價', color: 'text-green-600', bg: 'bg-green-100' },
  reviewing: { label: '審核中', color: 'text-amber-600', bg: 'bg-amber-100' },
  awarded: { label: '已決標', color: 'text-blue-600', bg: 'bg-blue-100' },
  cancelled: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-50' }
};

const DESTINATIONS = [
  { id: 'japan', label: '日本', popular: true },
  { id: 'korea', label: '韓國', popular: true },
  { id: 'thailand', label: '泰國', popular: true },
  { id: 'vietnam', label: '越南', popular: false },
  { id: 'singapore', label: '新加坡', popular: false },
  { id: 'china', label: '中國大陸', popular: false },
  { id: 'europe', label: '歐洲', popular: false },
  { id: 'usa', label: '美國', popular: false }
];

const COMMON_REQUIREMENTS = [
  '素食餐點', '無障礙需求', '團體保險', '專業導遊',
  '購物時間', '自由活動時間', '五星飯店', '商務艙', '專車接送'
];

const RFPGeneratorPanel: React.FC<RFPGeneratorPanelProps> = ({ onClose, userRole = 'welfare_committee', startInCreateMode = false }) => {
  const [rfpList, setRfpList] = useState<RFPRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRFP, setSelectedRFP] = useState<RFPRequest | null>(null);

  useEffect(() => {
    loadRFPs();
    if (startInCreateMode) setShowCreateForm(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRFPs = async () => {
    setLoading(true);
    try {
      const data = await fetchRFPRequests();
      setRfpList(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRFP = async (formData: any) => {
    await createRFPRequest(formData);
    setShowCreateForm(false);
    loadRFPs();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {userRole === 'welfare_committee' ? '福委會比價神器' : 'RFP 報價中心'}
              </h2>
              <p className="text-sm text-slate-500">
                {userRole === 'welfare_committee' ? '一鍵發送需求，輕鬆比較報價' : '瀏覽開放中的企業旅遊需求'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'welfare_committee' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} /> 建立新需求
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="進行中需求" value={rfpList.filter(r => r.status === 'open').length} icon={<FileText size={16} />} color="blue" />
          <StatCard label="收到報價" value={rfpList.reduce((sum, r) => sum + r.quote_count, 0)} icon={<Mail size={16} />} color="green" />
          <StatCard label="已決標" value={rfpList.filter(r => r.status === 'awarded').length} icon={<CheckCircle2 size={16} />} color="indigo" />
          <StatCard label="平均報價數" value={Math.round(rfpList.reduce((sum, r) => sum + r.quote_count, 0) / Math.max(rfpList.length, 1))} icon={<Users size={16} />} color="amber" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : rfpList.length === 0 ? (
          <EmptyState onCreateNew={() => setShowCreateForm(true)} />
        ) : (
          <div className="space-y-4">
            {rfpList.map((rfp) => (
              <RFPCard key={rfp.id} rfp={rfp} userRole={userRole} onView={() => setSelectedRFP(rfp)} />
            ))}
          </div>
        )}
      </div>

      {showCreateForm && <RFPCreateFormModal onClose={() => setShowCreateForm(false)} onSubmit={handleCreateRFP} />}
      {selectedRFP && <RFPDetailModal rfp={selectedRFP} userRole={userRole} onClose={() => setSelectedRFP(null)} />}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600'
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const RFPCard: React.FC<{ rfp: RFPRequest; userRole: string; onView: () => void }> = ({ rfp, userRole, onView }) => {
  const status = STATUS_CONFIG[rfp.status];
  const daysLeft = Math.ceil((new Date(rfp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Building size={20} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{rfp.company_name}</h3>
              <p className="text-sm text-slate-500">{rfp.contact_name}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${status.color} ${status.bg}`}>{status.label}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Users size={16} className="text-slate-400" /><span>{rfp.employee_count} 人</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar size={16} className="text-slate-400" /><span>{rfp.duration_days} 天</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} className="text-slate-400" /><span>{rfp.preferred_destinations.join('、')}</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-600"><DollarSign size={16} className="text-slate-400" /><span>${rfp.budget_per_person.min.toLocaleString()} - ${rfp.budget_per_person.max.toLocaleString()}</span></div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Mail size={12} /> {rfp.quote_count} 個報價</span>
              <span className={`flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-500 font-medium' : ''}`}><Clock size={12} />{daysLeft > 0 ? `剩餘 ${daysLeft} 天` : '已截止'}</span>
            </div>
            <button onClick={onView} className="flex items-center gap-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm">
              {userRole === 'agency' ? '填寫報價' : '查看詳情'}<ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <FileText size={40} className="text-blue-300" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">還沒有任何需求</h3>
    <p className="text-slate-500 mb-6 max-w-md mx-auto">建立您的第一個員工旅遊需求，系統會自動發送給合作旅行社，讓您輕鬆比較報價。</p>
    <button onClick={onCreateNew} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
      <Plus size={20} /> 建立第一個需求
    </button>
  </div>
);

const RFPCreateFormModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({ onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', contact_name: '', contact_email: '', contact_phone: '',
    employee_count: 30, budget_min: 25000, budget_max: 40000,
    preferred_destinations: [] as string[], date_start: '', date_end: '',
    duration_days: 5, special_requirements: [] as string[], custom_requirement: '', deadline: ''
  });

  const handleDestinationToggle = (dest: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_destinations: prev.preferred_destinations.includes(dest)
        ? prev.preferred_destinations.filter(d => d !== dest)
        : [...prev.preferred_destinations, dest]
    }));
  };

  const handleRequirementToggle = (req: string) => {
    setFormData(prev => ({
      ...prev,
      special_requirements: prev.special_requirements.includes(req)
        ? prev.special_requirements.filter(r => r !== req)
        : [...prev.special_requirements, req]
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const requirements = [...formData.special_requirements];
    if (formData.custom_requirement) requirements.push(formData.custom_requirement);
    await onSubmit({
      company_name: formData.company_name, contact_name: formData.contact_name,
      contact_email: formData.contact_email, contact_phone: formData.contact_phone,
      employee_count: formData.employee_count,
      budget_per_person: { min: formData.budget_min, max: formData.budget_max },
      preferred_destinations: formData.preferred_destinations,
      preferred_dates: { start: formData.date_start, end: formData.date_end },
      duration_days: formData.duration_days, special_requirements: requirements, deadline: formData.deadline
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-bold text-slate-900">建立員工旅遊需求</h2><p className="text-sm text-slate-500">步驟 {step} / 3</p></div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg"><X size={20} className="text-slate-500" /></button>
          </div>
          <div className="flex gap-2 mt-4">{[1, 2, 3].map(s => (<div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />))}</div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 mb-4">公司與聯絡資訊</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">公司名稱 *</label><input type="text" value={formData.company_name} onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="例如：台積電" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">聯絡人 *</label><input type="text" value={formData.contact_name} onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="您的姓名" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">電子郵件 *</label><input type="email" value={formData.contact_email} onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="your@company.com" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">聯絡電話</label><input type="tel" value={formData.contact_phone} onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="0912-345-678" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">預計人數 *</label><input type="number" min="10" value={formData.employee_count} onChange={(e) => setFormData(prev => ({ ...prev, employee_count: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" /></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div><h3 className="font-bold text-slate-900 mb-4">目的地偏好</h3><div className="grid grid-cols-4 gap-2">{DESTINATIONS.map(dest => (<button key={dest.id} onClick={() => handleDestinationToggle(dest.label)} className={`p-3 rounded-lg border text-sm font-medium transition-colors ${formData.preferred_destinations.includes(dest.label) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}>{dest.label}{dest.popular && <Star size={12} className="inline ml-1 text-amber-500" />}</button>))}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">預計出發日期</label><input type="date" value={formData.date_start} onChange={(e) => setFormData(prev => ({ ...prev, date_start: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">預計返回日期</label><input type="date" value={formData.date_end} onChange={(e) => setFormData(prev => ({ ...prev, date_end: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">天數</label><select value={formData.duration_days} onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg">{[3, 4, 5, 6, 7, 8, 9, 10].map(d => (<option key={d} value={d}>{d} 天 {d - 1} 夜</option>))}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">每人預算範圍 (TWD)</label><div className="grid grid-cols-2 gap-4"><input type="number" value={formData.budget_min} onChange={(e) => setFormData(prev => ({ ...prev, budget_min: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="最低" /><input type="number" value={formData.budget_max} onChange={(e) => setFormData(prev => ({ ...prev, budget_max: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="最高" /></div></div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div><h3 className="font-bold text-slate-900 mb-4">特殊需求</h3><div className="flex flex-wrap gap-2">{COMMON_REQUIREMENTS.map(req => (<button key={req} onClick={() => handleRequirementToggle(req)} className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${formData.special_requirements.includes(req) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}>{formData.special_requirements.includes(req) && <CheckCircle2 size={14} className="inline mr-1" />}{req}</button>))}</div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">其他需求（選填）</label><textarea value={formData.custom_requirement} onChange={(e) => setFormData(prev => ({ ...prev, custom_requirement: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg h-24 resize-none" placeholder="例如：需要素食10人、無障礙設施2位..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">報價截止日期 *</label><input type="date" value={formData.deadline} onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg" /></div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100"><h4 className="font-bold text-slate-900 mb-3">需求摘要</h4><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">公司：</span>{formData.company_name || '-'}</div><div><span className="text-slate-500">人數：</span>{formData.employee_count} 人</div><div><span className="text-slate-500">目的地：</span>{formData.preferred_destinations.join('、') || '-'}</div><div><span className="text-slate-500">天數：</span>{formData.duration_days} 天</div><div className="col-span-2"><span className="text-slate-500">預算：</span>${formData.budget_min.toLocaleString()} - ${formData.budget_max.toLocaleString()} / 人</div></div></div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between">
          {step > 1 ? <button onClick={() => setStep(step - 1)} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">上一步</button> : <button onClick={onClose} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">取消</button>}
          {step < 3 ? <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">下一步</button> : <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"><Send size={18} />{submitting ? '發送中...' : '發送需求'}</button>}
        </div>
      </div>
    </div>
  );
};

const RFPDetailModal: React.FC<{ rfp: RFPRequest; userRole: string; onClose: () => void }> = ({ rfp, userRole, onClose }) => {
  const status = STATUS_CONFIG[rfp.status];
  const shareUrl = `https://travelcanvas.app/rfp/${rfp.id}`;
  const copyShareLink = () => { navigator.clipboard.writeText(shareUrl); alert('連結已複製！'); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-200 bg-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color} ${status.bg}`}>{status.label}</span><span className="text-sm text-slate-500">{rfp.quote_count} 個報價</span></div>
              <h2 className="text-2xl font-bold text-slate-900">{rfp.company_name}</h2>
              <p className="text-slate-600">{rfp.contact_name} · {rfp.contact_email}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg"><X size={24} className="text-slate-500" /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase mb-1">人數</p><p className="text-xl font-bold text-slate-900">{rfp.employee_count} 人</p></div>
            <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase mb-1">天數</p><p className="text-xl font-bold text-slate-900">{rfp.duration_days} 天</p></div>
            <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase mb-1">預算/人</p><p className="text-xl font-bold text-slate-900">${rfp.budget_per_person.min.toLocaleString()}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase mb-1">截止日</p><p className="text-xl font-bold text-slate-900">{rfp.deadline}</p></div>
          </div>
          <div className="space-y-4">
            <div><h3 className="text-sm font-bold text-slate-500 uppercase mb-2">目的地偏好</h3><div className="flex flex-wrap gap-2">{rfp.preferred_destinations.map(dest => (<span key={dest} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{dest}</span>))}</div></div>
            <div><h3 className="text-sm font-bold text-slate-500 uppercase mb-2">出發日期</h3><p className="text-slate-700">{rfp.preferred_dates.start} ~ {rfp.preferred_dates.end}</p></div>
            <div><h3 className="text-sm font-bold text-slate-500 uppercase mb-2">特殊需求</h3><ul className="space-y-1">{rfp.special_requirements.map((req, i) => (<li key={i} className="flex items-center gap-2 text-slate-600"><CheckCircle2 size={14} className="text-green-500" />{req}</li>))}</ul></div>
          </div>
          {userRole === 'welfare_committee' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <h3 className="font-bold text-amber-800 mb-2">分享給旅行社報價</h3>
              <p className="text-sm text-amber-700 mb-3">將此連結發送給旅行社，他們可以直接填寫報價（無需註冊）</p>
              <div className="flex gap-2"><input type="text" readOnly value={shareUrl} className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm" /><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"><Copy size={16} /> 複製</button></div>
            </div>
          )}
          {userRole === 'agency' && rfp.status === 'open' && (
            <div className="mt-6"><button className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-lg flex items-center justify-center gap-2"><Send size={20} /> 填寫報價</button><p className="text-center text-sm text-slate-500 mt-2">完善行程細節可提高中標機率 47%</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFPGeneratorPanel;
