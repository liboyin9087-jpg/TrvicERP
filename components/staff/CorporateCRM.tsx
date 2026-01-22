import React, { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  Star,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'accounts' | 'stakeholders' | 'engagement';

interface CorporateAccount {
  id: string;
  name: string;
  industry: string;
  size: string;
  status: 'active' | 'at_risk' | 'prospect';
  nextRenewal: string;
  pipelineValue: number;
}

interface ContactPerson {
  id: string;
  accountId: string;
  name: string;
  title: string;
  role: 'decision_maker' | 'influencer' | 'user';
  concern: string;
  phone: string;
  email: string;
}

interface EngagementLog {
  id: string;
  accountId: string;
  date: string;
  channel: 'meeting' | 'email' | 'call';
  summary: string;
  objections: string[];
  response: string;
}

const MOCK_ACCOUNTS: CorporateAccount[] = [
  {
    id: 'corp-1',
    name: '宏觀科技',
    industry: '科技業',
    size: '1,200 人',
    status: 'active',
    nextRenewal: '2025-06-30',
    pipelineValue: 3200000,
  },
  {
    id: 'corp-2',
    name: '新創動能',
    industry: '金融服務',
    size: '480 人',
    status: 'prospect',
    nextRenewal: '2025-09-15',
    pipelineValue: 1800000,
  },
  {
    id: 'corp-3',
    name: '遠景製造',
    industry: '製造業',
    size: '2,500 人',
    status: 'at_risk',
    nextRenewal: '2025-04-20',
    pipelineValue: 4500000,
  },
];

const MOCK_CONTACTS: ContactPerson[] = [
  {
    id: 'contact-1',
    accountId: 'corp-1',
    name: '林雅婷',
    title: 'HR 主管',
    role: 'decision_maker',
    concern: '合規與安全',
    phone: '02-1234-5678',
    email: 'hr@macro.com',
  },
  {
    id: 'contact-2',
    accountId: 'corp-1',
    name: '陳志豪',
    title: '財務經理',
    role: 'influencer',
    concern: '預算控制',
    phone: '02-8888-9999',
    email: 'finance@macro.com',
  },
  {
    id: 'contact-3',
    accountId: 'corp-1',
    name: '王大明',
    title: '福委召集人',
    role: 'user',
    concern: '省事、溝通效率',
    phone: '02-2222-3333',
    email: 'welfare@macro.com',
  },
];

const MOCK_ENGAGEMENTS: EngagementLog[] = [
  {
    id: 'eng-1',
    accountId: 'corp-1',
    date: '2025-02-12',
    channel: 'meeting',
    summary: '說明 Portal 可追蹤護照與保險進度',
    objections: ['擔心追蹤資訊不即時'],
    response: '展示即時同步畫面與提醒機制',
  },
  {
    id: 'eng-2',
    accountId: 'corp-1',
    date: '2025-02-20',
    channel: 'email',
    summary: '提供三版本提案差異與毛利表',
    objections: ['希望有更高彈性'],
    response: '建議採混合方案並提供客製模組',
  },
];

const ROLE_LABELS: Record<ContactPerson['role'], { label: string; color: string }> = {
  decision_maker: { label: 'Decision Maker', color: 'bg-emerald-100 text-emerald-700' },
  influencer: { label: 'Influencer', color: 'bg-blue-100 text-blue-700' },
  user: { label: 'User', color: 'bg-amber-100 text-amber-700' },
};

const STATUS_STYLE: Record<CorporateAccount['status'], { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'text-emerald-600', icon: <CheckCircle className="w-4 h-4" /> },
  prospect: { label: 'Prospect', color: 'text-blue-600', icon: <Star className="w-4 h-4" /> },
  at_risk: { label: 'At Risk', color: 'text-red-500', icon: <ShieldAlert className="w-4 h-4" /> },
};

export default function CorporateCRM() {
  const [activeTab, setActiveTab] = useState<TabKey>('accounts');
  const [selectedAccountId, setSelectedAccountId] = useState('corp-1');

  const selectedAccount = useMemo(
    () => MOCK_ACCOUNTS.find((account) => account.id === selectedAccountId) || MOCK_ACCOUNTS[0],
    [selectedAccountId]
  );

  const accountContacts = useMemo(
    () => MOCK_CONTACTS.filter((contact) => contact.accountId === selectedAccountId),
    [selectedAccountId]
  );

  const engagementLogs = useMemo(
    () => MOCK_ENGAGEMENTS.filter((log) => log.accountId === selectedAccountId),
    [selectedAccountId]
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              B2B CRM
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">企業客戶決策鏈管理</h2>
          <p className="text-sm text-slate-500">掌握企業內部關鍵角色與互動紀錄</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-slate-100 pb-3">
            {([
              { key: 'accounts', label: '企業帳戶' },
              { key: 'stakeholders', label: '決策鏈' },
              { key: 'engagement', label: '互動紀錄' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {MOCK_ACCOUNTS.map((account) => {
                const status = STATUS_STYLE[account.status];
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={cn(
                      'w-full text-left rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all',
                      selectedAccountId === account.id ? 'ring-2 ring-indigo-500' : 'hover:border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{account.name}</h3>
                        <p className="text-xs text-slate-500">{account.industry} · {account.size}</p>
                      </div>
                      <div className={cn('flex items-center gap-1 text-xs font-semibold', status.color)}>
                        {status.icon}
                        {status.label}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-slate-500">
                      <div>
                        <p>續約日期</p>
                        <p className="text-sm font-semibold text-slate-900">{account.nextRenewal}</p>
                      </div>
                      <div>
                        <p>預估案值</p>
                        <p className="text-sm font-semibold text-slate-900">
                          NT$ {account.pipelineValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'stakeholders' && (
            <div className="space-y-3">
              {accountContacts.map((contact) => {
                const roleStyle = ROLE_LABELS[contact.role];
                return (
                  <div key={contact.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{contact.title}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{contact.name}</h3>
                      </div>
                      <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', roleStyle.color)}>
                        {roleStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">關注點：{contact.concern}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{contact.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{contact.email}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-3">
              {engagementLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {log.date}
                    </div>
                    <span className="text-xs text-slate-400">{log.channel}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">{log.summary}</h4>
                  <div className="mt-3 text-xs text-slate-500">
                    <p className="font-semibold text-slate-600">客戶疑慮</p>
                    <ul className="list-disc list-inside mt-1">
                      {log.objections.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    <p className="font-semibold text-slate-600">回應策略</p>
                    <p>{log.response}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">目前帳戶</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedAccount.name}</h3>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>產業</span>
                <span className="text-slate-700">{selectedAccount.industry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>規模</span>
                <span className="text-slate-700">{selectedAccount.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>續約日期</span>
                <span className="text-slate-700">{selectedAccount.nextRenewal}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users className="w-4 h-4 text-indigo-500" />
              決策角色摘要
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-500">
              {accountContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <span>{contact.name}</span>
                  <span className="text-slate-700">{ROLE_LABELS[contact.role].label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              下一步建議
            </div>
            <ul className="mt-3 text-xs text-slate-500 space-y-2">
              <li>• 排程下一次簡報會議 (Decision Maker)</li>
              <li>• 提供三版本提案與毛利差異</li>
              <li>• 強調 Portal 風險可視化能力</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
