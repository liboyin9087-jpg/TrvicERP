import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Phone, Mail, Calendar, DollarSign, FileText, CheckCircle,
  Clock, AlertCircle, ChevronRight, Plus, Search, Filter, MoreVertical,
  ArrowRight, MessageSquare, History, Tag, Building2, User, Briefcase,
  TrendingUp, Target, Zap, Star, Edit, Trash2, X, Send
} from 'lucide-react';

// Types
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type LeadSource = 'website' | 'referral' | 'advertisement' | 'social_media' | 'event' | 'cold_call';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: LeadSource;
  status: LeadStatus;
  expectedValue: number;
  expectedCloseDate: string;
  assignedTo: string;
  tags: string[];
  notes: string;
  createdAt: string;
  lastActivity: string;
  activities: Activity[];
  tourInterests: string[];
  groupSize: number;
  probability: number;
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'quote_sent' | 'status_change';
  description: string;
  createdAt: string;
  createdBy: string;
}

interface Quote {
  id: string;
  leadId: string;
  tourName: string;
  departureDate: string;
  groupSize: number;
  pricePerPerson: number;
  totalAmount: number;
  discount: number;
  validUntil: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

// Mock Data
const mockLeads: Lead[] = [
  {
    id: 'L001',
    companyName: '台積電福委會',
    contactName: '林小姐',
    contactEmail: 'lin@tsmc.com',
    contactPhone: '03-563-6688',
    source: 'referral',
    status: 'proposal',
    expectedValue: 1500000,
    expectedCloseDate: '2024-03-15',
    assignedTo: '王業務',
    tags: ['企業團', 'VIP', '日本'],
    notes: '需要高級飯店，預計50人',
    createdAt: '2024-02-01',
    lastActivity: '2024-02-20',
    activities: [
      { id: 'a1', type: 'call', description: '初次電話聯繫，確認需求', createdAt: '2024-02-01', createdBy: '王業務' },
      { id: 'a2', type: 'meeting', description: '實地拜訪討論行程細節', createdAt: '2024-02-10', createdBy: '王業務' },
      { id: 'a3', type: 'quote_sent', description: '發送日本五日遊報價單', createdAt: '2024-02-15', createdBy: '王業務' },
    ],
    tourInterests: ['日本東京五日遊', '日本大阪五日遊'],
    groupSize: 50,
    probability: 70,
  },
  {
    id: 'L002',
    companyName: '聯發科技',
    contactName: '陳經理',
    contactEmail: 'chen@mediatek.com',
    contactPhone: '03-567-0766',
    source: 'website',
    status: 'qualified',
    expectedValue: 800000,
    expectedCloseDate: '2024-04-01',
    assignedTo: '李業務',
    tags: ['企業團', '韓國'],
    notes: '員工旅遊，約30人',
    createdAt: '2024-02-05',
    lastActivity: '2024-02-18',
    activities: [
      { id: 'a4', type: 'email', description: '回覆網站詢問', createdAt: '2024-02-05', createdBy: '李業務' },
      { id: 'a5', type: 'call', description: '電話確認行程偏好', createdAt: '2024-02-12', createdBy: '李業務' },
    ],
    tourInterests: ['韓國首爾四日遊'],
    groupSize: 30,
    probability: 50,
  },
  {
    id: 'L003',
    companyName: '國泰人壽',
    contactName: '張副總',
    contactEmail: 'chang@cathaylife.com.tw',
    contactPhone: '02-2755-1399',
    source: 'event',
    status: 'negotiation',
    expectedValue: 2500000,
    expectedCloseDate: '2024-03-01',
    assignedTo: '王業務',
    tags: ['企業團', 'VIP', '歐洲', '大團'],
    notes: '業績達標獎勵旅遊，100人以上',
    createdAt: '2024-01-15',
    lastActivity: '2024-02-22',
    activities: [
      { id: 'a6', type: 'meeting', description: '高層拜訪提案', createdAt: '2024-01-20', createdBy: '王業務' },
      { id: 'a7', type: 'quote_sent', description: '發送歐洲十日遊報價', createdAt: '2024-02-01', createdBy: '王業務' },
      { id: 'a8', type: 'meeting', description: '價格協商會議', createdAt: '2024-02-15', createdBy: '王業務' },
      { id: 'a9', type: 'note', description: '客戶要求再降5%', createdAt: '2024-02-22', createdBy: '王業務' },
    ],
    tourInterests: ['歐洲十日遊'],
    groupSize: 120,
    probability: 85,
  },
  {
    id: 'L004',
    companyName: '鴻海精密',
    contactName: '黃專員',
    contactEmail: 'huang@foxconn.com',
    contactPhone: '02-2268-3466',
    source: 'cold_call',
    status: 'contacted',
    expectedValue: 600000,
    expectedCloseDate: '2024-05-01',
    assignedTo: '李業務',
    tags: ['企業團'],
    notes: '初步接觸，需跟進',
    createdAt: '2024-02-18',
    lastActivity: '2024-02-18',
    activities: [
      { id: 'a10', type: 'call', description: '首次開發電話', createdAt: '2024-02-18', createdBy: '李業務' },
    ],
    tourInterests: [],
    groupSize: 25,
    probability: 20,
  },
  {
    id: 'L005',
    companyName: '新光人壽',
    contactName: '吳處長',
    contactEmail: 'wu@skl.com.tw',
    contactPhone: '02-2389-5858',
    source: 'referral',
    status: 'new',
    expectedValue: 1200000,
    expectedCloseDate: '2024-06-01',
    assignedTo: '王業務',
    tags: ['企業團', '日本'],
    notes: '由國泰人壽張副總介紹',
    createdAt: '2024-02-22',
    lastActivity: '2024-02-22',
    activities: [],
    tourInterests: ['日本北海道五日遊'],
    groupSize: 60,
    probability: 30,
  },
];

const mockQuotes: Quote[] = [
  {
    id: 'Q001',
    leadId: 'L001',
    tourName: '日本東京五日遊',
    departureDate: '2024-04-15',
    groupSize: 50,
    pricePerPerson: 32900,
    totalAmount: 1645000,
    discount: 5,
    validUntil: '2024-03-01',
    status: 'sent',
    createdAt: '2024-02-15',
  },
  {
    id: 'Q002',
    leadId: 'L003',
    tourName: '歐洲十日遊',
    departureDate: '2024-05-01',
    groupSize: 120,
    pricePerPerson: 89900,
    totalAmount: 10788000,
    discount: 8,
    validUntil: '2024-03-15',
    status: 'viewed',
    createdAt: '2024-02-01',
  },
];

// Pipeline Stages
const pipelineStages: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: '新詢問', color: 'slate' },
  { id: 'contacted', label: '已聯繫', color: 'blue' },
  { id: 'qualified', label: '已評估', color: 'purple' },
  { id: 'proposal', label: '報價中', color: 'amber' },
  { id: 'negotiation', label: '協商中', color: 'orange' },
  { id: 'won', label: '成交', color: 'green' },
  { id: 'lost', label: '失敗', color: 'red' },
];

// Components
const StatusBadge = ({ status, type = 'lead' }: { status: string; type?: 'lead' | 'quote' }) => {
  const leadColors: Record<string, string> = {
    new: 'bg-slate-100 text-slate-700',
    contacted: 'bg-blue-100 text-blue-700',
    qualified: 'bg-purple-100 text-purple-700',
    proposal: 'bg-amber-100 text-amber-700',
    negotiation: 'bg-orange-100 text-orange-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };

  const quoteColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
  };

  const labels: Record<string, string> = {
    new: '新詢問',
    contacted: '已聯繫',
    qualified: '已評估',
    proposal: '報價中',
    negotiation: '協商中',
    won: '成交',
    lost: '失敗',
    draft: '草稿',
    sent: '已發送',
    viewed: '已讀取',
    accepted: '已接受',
    rejected: '已拒絕',
    expired: '已過期',
  };

  const colors = type === 'lead' ? leadColors : quoteColors;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
};

const SourceBadge = ({ source }: { source: LeadSource }) => {
  const config: Record<LeadSource, { label: string; color: string }> = {
    website: { label: '網站', color: 'bg-blue-100 text-blue-700' },
    referral: { label: '轉介', color: 'bg-green-100 text-green-700' },
    advertisement: { label: '廣告', color: 'bg-purple-100 text-purple-700' },
    social_media: { label: '社群', color: 'bg-pink-100 text-pink-700' },
    event: { label: '活動', color: 'bg-amber-100 text-amber-700' },
    cold_call: { label: '陌開', color: 'bg-slate-100 text-slate-700' },
  };

  const { label, color } = config[source];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

// Lead Card for Kanban View
const LeadCard = ({ lead, onClick }: { lead: Lead; onClick: () => void }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-slate-900 text-sm">{lead.companyName}</h4>
          <p className="text-xs text-slate-500">{lead.contactName}</p>
        </div>
        <SourceBadge source={lead.source} />
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {lead.tags.slice(0, 2).map((tag, i) => (
          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
            {tag}
          </span>
        ))}
        {lead.tags.length > 2 && (
          <span className="text-xs text-slate-400">+{lead.tags.length - 2}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{lead.groupSize} 人</span>
        <span className="font-medium text-indigo-600">
          NT$ {(lead.expectedValue / 10000).toFixed(0)}萬
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {lead.lastActivity}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs text-indigo-600">{lead.assignedTo[0]}</span>
          </div>
        </div>
      </div>

      {/* Probability Bar */}
      <div className="mt-2">
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              lead.probability >= 70 ? 'bg-green-500' :
              lead.probability >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${lead.probability}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 mt-0.5 text-right">{lead.probability}%</div>
      </div>
    </motion.div>
  );
};

// Lead Detail Modal
const LeadDetailModal = ({
  lead,
  quotes,
  onClose,
  onStatusChange,
  onAddActivity
}: {
  lead: Lead;
  quotes: Quote[];
  onClose: () => void;
  onStatusChange: (status: LeadStatus) => void;
  onAddActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'createdBy'>) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'quotes'>('overview');
  const [newNote, setNewNote] = useState('');

  const leadQuotes = quotes.filter(q => q.leadId === lead.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-900">{lead.companyName}</h2>
                <StatusBadge status={lead.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" /> {lead.contactName}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" /> {lead.contactEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {lead.contactPhone}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Pipeline */}
          <div className="mt-4 flex items-center gap-1">
            {pipelineStages.filter(s => s.id !== 'lost').map((stage, i) => (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => onStatusChange(stage.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    lead.status === stage.id
                      ? 'bg-indigo-600 text-white'
                      : pipelineStages.findIndex(s => s.id === lead.status) > i
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {stage.label}
                </button>
                {i < pipelineStages.length - 2 && (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {[
            { id: 'overview', label: '概覽' },
            { id: 'activities', label: '活動記錄' },
            { id: 'quotes', label: '報價單' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 mb-1">預估金額</div>
                    <div className="text-xl font-bold text-slate-900">
                      NT$ {lead.expectedValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 mb-1">預計人數</div>
                    <div className="text-xl font-bold text-slate-900">{lead.groupSize} 人</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 mb-1">成交機率</div>
                    <div className="text-xl font-bold text-slate-900">{lead.probability}%</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 mb-1">預計成交日</div>
                    <div className="text-xl font-bold text-slate-900">{lead.expectedCloseDate}</div>
                  </div>
                </div>

                {/* Tour Interests */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">感興趣的行程</h3>
                  {lead.tourInterests.length > 0 ? (
                    <div className="space-y-2">
                      {lead.tourInterests.map((tour, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm">{tour}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">尚未指定行程</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">標籤</h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm">
                        {tag}
                      </span>
                    ))}
                    <button className="px-2 py-1 border border-dashed border-slate-300 text-slate-500 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-500">
                      + 新增
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Notes */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">備註</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
                    {lead.notes || '無備註'}
                  </p>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">快速動作</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">撥打電話</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">發送郵件</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">建立報價</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">排程會議</span>
                    </button>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">負責業務</h3>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="font-medium text-indigo-600">{lead.assignedTo[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{lead.assignedTo}</div>
                      <div className="text-sm text-slate-500">業務專員</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {/* Add Note */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="新增活動備註..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    if (newNote.trim()) {
                      onAddActivity({ type: 'note', description: newNote });
                      setNewNote('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                {lead.activities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'call' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'email' ? 'bg-green-100 text-green-600' :
                      activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'quote_sent' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {activity.type === 'call' && <Phone className="w-4 h-4" />}
                      {activity.type === 'email' && <Mail className="w-4 h-4" />}
                      {activity.type === 'meeting' && <Users className="w-4 h-4" />}
                      {activity.type === 'quote_sent' && <FileText className="w-4 h-4" />}
                      {activity.type === 'note' && <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>{activity.createdBy}</span>
                        <span>•</span>
                        <span>{activity.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                <Plus className="w-5 h-5" />
                建立新報價單
              </button>

              {leadQuotes.map((quote) => (
                <div key={quote.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900">{quote.tourName}</h4>
                      <p className="text-sm text-slate-500">
                        報價單號: {quote.id} | 建立日期: {quote.createdAt}
                      </p>
                    </div>
                    <StatusBadge status={quote.status} type="quote" />
                  </div>

                  <div className="grid grid-cols-4 gap-4 py-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">出發日期</div>
                      <div className="font-medium">{quote.departureDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">人數</div>
                      <div className="font-medium">{quote.groupSize} 人</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">單價</div>
                      <div className="font-medium">NT$ {quote.pricePerPerson.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">總金額</div>
                      <div className="font-medium text-indigo-600">NT$ {quote.totalAmount.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                      有效期限至: {quote.validUntil}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                        編輯
                      </button>
                      <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        發送報價
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Kanban Column
const KanbanColumn = ({
  stage,
  leads,
  onLeadClick
}: {
  stage: typeof pipelineStages[0];
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) => {
  const totalValue = leads.reduce((sum, lead) => sum + lead.expectedValue, 0);

  return (
    <div className="flex-shrink-0 w-72 bg-slate-50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-900">{stage.label}</h3>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">
            {leads.length}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          NT$ {(totalValue / 10000).toFixed(0)}萬
        </span>
      </div>

      <div className="space-y-2 min-h-[200px]">
        <AnimatePresence>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
          ))}
        </AnimatePresence>
      </div>

      <button className="w-full mt-3 flex items-center justify-center gap-1 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
        <Plus className="w-4 h-4" />
        新增
      </button>
    </div>
  );
};

// Stats Cards
const StatsCards = ({ leads }: { leads: Lead[] }) => {
  const totalValue = leads.reduce((sum, lead) => sum + lead.expectedValue, 0);
  const weightedValue = leads.reduce((sum, lead) => sum + lead.expectedValue * (lead.probability / 100), 0);
  const wonDeals = leads.filter(l => l.status === 'won');
  const activeDeals = leads.filter(l => !['won', 'lost'].includes(l.status));

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">管道總額</div>
            <div className="text-lg font-bold text-slate-900">
              NT$ {(totalValue / 10000).toFixed(0)}萬
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">加權預測</div>
            <div className="text-lg font-bold text-slate-900">
              NT$ {(weightedValue / 10000).toFixed(0)}萬
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">進行中案件</div>
            <div className="text-lg font-bold text-slate-900">{activeDeals.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Star className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">本月成交</div>
            <div className="text-lg font-bold text-slate-900">{wonDeals.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function CRMPipeline() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [quotes] = useState<Quote[]>(mockQuotes);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = leads.filter((lead) =>
    lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads(leads.map(l =>
      l.id === leadId ? { ...l, status: newStatus } : l
    ));
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleAddActivity = (leadId: string, activity: Omit<Activity, 'id' | 'createdAt' | 'createdBy'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: '當前用戶',
    };

    setLeads(leads.map(l =>
      l.id === leadId
        ? { ...l, activities: [newActivity, ...l.activities], lastActivity: newActivity.createdAt }
        : l
    ));

    if (selectedLead?.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        activities: [newActivity, ...selectedLead.activities],
        lastActivity: newActivity.createdAt,
      });
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">銷售管道</h1>
          <p className="text-slate-500">管理潛在客戶與銷售流程</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋客戶..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              看板
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              列表
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            新增潛客
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards leads={filteredLeads} />

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={filteredLeads.filter(l => l.status === stage.id)}
              onLeadClick={setSelectedLead}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">公司名稱</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">聯絡人</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">狀態</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">預估金額</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">機率</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">負責人</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">最後活動</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{lead.companyName}</div>
                    <div className="text-xs text-slate-500">{lead.contactEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{lead.contactName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    NT$ {lead.expectedValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            lead.probability >= 70 ? 'bg-green-500' :
                            lead.probability >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${lead.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{lead.probability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{lead.assignedTo}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{lead.lastActivity}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal
            lead={selectedLead}
            quotes={quotes}
            onClose={() => setSelectedLead(null)}
            onStatusChange={(status) => handleStatusChange(selectedLead.id, status)}
            onAddActivity={(activity) => handleAddActivity(selectedLead.id, activity)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// MapPin component for tour interests (imported from lucide but adding here for completeness)
const MapPin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
