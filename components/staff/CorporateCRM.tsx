import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Edit2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  ShieldAlert,
  Star,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/shared/Modal';
import { useToast } from '@/store/useToastStore';
import CorporateService from '@/modules/corporate/services/corporateService';
import type {
  ContactPerson,
  CorporateAccount,
  CreateContactPersonData,
  CreateCorporateAccountData,
  CreateEngagementLogData,
  EngagementLog,
  UpdateContactPersonData,
  UpdateCorporateAccountData,
} from '@/core/types/corporate';

type TabKey = 'accounts' | 'stakeholders' | 'engagement';

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
  influencer: { label: 'Influencer', color: 'bg-brand-100 text-brand-700' },
  user: { label: 'User', color: 'bg-amber-100 text-amber-700' },
};

const STATUS_STYLE: Record<CorporateAccount['status'], { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'text-emerald-600', icon: <CheckCircle className="w-4 h-4" /> },
  prospect: { label: 'Prospect', color: 'text-brand-600', icon: <Star className="w-4 h-4" /> },
  at_risk: { label: 'At Risk', color: 'text-red-500', icon: <ShieldAlert className="w-4 h-4" /> },
};

export default function CorporateCRM() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('accounts');
  const [accounts, setAccounts] = useState<CorporateAccount[]>(MOCK_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState('corp-1');
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [engagements, setEngagements] = useState<EngagementLog[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CorporateAccount | null>(null);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [accountForm, setAccountForm] = useState<CreateCorporateAccountData>({
    name: '',
    industry: '',
    size: '',
    status: 'prospect',
    nextRenewal: '',
    pipelineValue: 0,
  });
  const [contactForm, setContactForm] = useState<CreateContactPersonData>({
    name: '',
    title: '',
    role: 'user',
    concern: '',
    phone: '',
    email: '',
  });
  const [engagementForm, setEngagementForm] = useState<CreateEngagementLogData>({
    date: '',
    channel: 'meeting',
    summary: '',
    objections: [],
    response: '',
  });
  const [objectionsText, setObjectionsText] = useState('');

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId),
    [accounts, selectedAccountId]
  );

  const accountContacts = useMemo(() => contacts, [contacts]);
  const engagementLogs = useMemo(() => engagements, [engagements]);

  useEffect(() => {
    let active = true;
    CorporateService.getAccounts().then((result) => {
      if (!active) return;
      if (result.data && result.data.length > 0) {
        setAccounts(result.data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    let active = true;
    CorporateService.getContacts(selectedAccountId).then((result) => {
      if (!active) return;
      if (result.data && result.data.length > 0) {
        setContacts(result.data);
      } else {
        setContacts(MOCK_CONTACTS.filter((contact) => contact.accountId === selectedAccountId));
      }
    });
    CorporateService.getEngagements(selectedAccountId).then((result) => {
      if (!active) return;
      if (result.data && result.data.length > 0) {
        setEngagements(result.data);
      } else {
        setEngagements(MOCK_ENGAGEMENTS.filter((log) => log.accountId === selectedAccountId));
      }
    });
    return () => {
      active = false;
    };
  }, [selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const resetAccountForm = (account?: CorporateAccount) => {
    setAccountForm({
      name: account?.name || '',
      industry: account?.industry || '',
      size: account?.size || '',
      status: account?.status || 'prospect',
      nextRenewal: account?.nextRenewal || '',
      pipelineValue: account?.pipelineValue ?? 0,
    });
  };

  const resetContactForm = (contact?: ContactPerson) => {
    setContactForm({
      name: contact?.name || '',
      title: contact?.title || '',
      role: contact?.role || 'user',
      concern: contact?.concern || '',
      phone: contact?.phone || '',
      email: contact?.email || '',
    });
  };

  const resetEngagementForm = () => {
    setEngagementForm({
      date: '',
      channel: 'meeting',
      summary: '',
      objections: [],
      response: '',
    });
    setObjectionsText('');
  };

  const openCreateAccount = () => {
    setEditingAccount(null);
    resetAccountForm();
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (account: CorporateAccount) => {
    setEditingAccount(account);
    resetAccountForm(account);
    setIsAccountModalOpen(true);
  };

  const openCreateContact = () => {
    setEditingContact(null);
    resetContactForm();
    setIsContactModalOpen(true);
  };

  const openEditContact = (contact: ContactPerson) => {
    setEditingContact(contact);
    resetContactForm(contact);
    setIsContactModalOpen(true);
  };

  const openCreateEngagement = () => {
    resetEngagementForm();
    setIsEngagementModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('請輸入企業名稱');
      return;
    }
    setIsSaving(true);
    const payload: CreateCorporateAccountData | UpdateCorporateAccountData = {
      name: accountForm.name.trim(),
      industry: accountForm.industry.trim(),
      size: accountForm.size.trim(),
      status: accountForm.status,
      nextRenewal: accountForm.nextRenewal,
      pipelineValue: Number(accountForm.pipelineValue) || 0,
    };
    try {
      if (editingAccount) {
        const result = await CorporateService.updateAccount(editingAccount.id, payload);
        const updated = result.data || {
          ...editingAccount,
          ...payload,
        };
        setAccounts((prev) =>
          prev.map((item) => (item.id === editingAccount.id ? updated : item))
        );
        toast.success('已更新企業帳戶');
      } else {
        const result = await CorporateService.createAccount(payload);
        const created: CorporateAccount = result.data || {
          id: `corp_${Date.now()}`,
          name: payload.name || '',
          industry: payload.industry || '',
          size: payload.size || '',
          status: payload.status || 'prospect',
          nextRenewal: payload.nextRenewal || '',
          pipelineValue: payload.pipelineValue || 0,
        };
        setAccounts((prev) => [created, ...prev]);
        setSelectedAccountId(created.id);
        toast.success('已新增企業帳戶');
      }
      setIsAccountModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!selectedAccountId) return;
    if (!contactForm.name.trim()) {
      toast.error('請輸入聯絡人姓名');
      return;
    }
    setIsSaving(true);
    const payload: CreateContactPersonData | UpdateContactPersonData = {
      name: contactForm.name.trim(),
      title: contactForm.title.trim(),
      role: contactForm.role,
      concern: contactForm.concern.trim(),
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim(),
    };
    try {
      if (editingContact) {
        const result = await CorporateService.updateContact(
          selectedAccountId,
          editingContact.id,
          payload
        );
        const updated = result.data || { ...editingContact, ...payload };
        setContacts((prev) =>
          prev.map((item) => (item.id === editingContact.id ? updated : item))
        );
        toast.success('已更新聯絡人');
      } else {
        const result = await CorporateService.addContact(selectedAccountId, payload);
        const created: ContactPerson = result.data || {
          id: `contact_${Date.now()}`,
          accountId: selectedAccountId,
          name: payload.name || '',
          title: payload.title || '',
          role: payload.role || 'user',
          concern: payload.concern || '',
          phone: payload.phone || '',
          email: payload.email || '',
        };
        setContacts((prev) => [created, ...prev]);
        toast.success('已新增聯絡人');
      }
      setIsContactModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEngagement = async () => {
    if (!selectedAccountId) return;
    if (!engagementForm.summary.trim()) {
      toast.error('請輸入互動摘要');
      return;
    }
    setIsSaving(true);
    const payload: CreateEngagementLogData = {
      date: engagementForm.date,
      channel: engagementForm.channel,
      summary: engagementForm.summary.trim(),
      objections: objectionsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      response: engagementForm.response.trim(),
    };
    try {
      const result = await CorporateService.addEngagement(selectedAccountId, payload);
      const created: EngagementLog = result.data || {
        id: `eng_${Date.now()}`,
        accountId: selectedAccountId,
        ...payload,
      };
      setEngagements((prev) => [created, ...prev]);
      toast.success('已新增互動紀錄');
      setIsEngagementModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              B2B CRM
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">企業客戶決策鏈管理</h2>
          <p className="text-sm text-slate-500">掌握企業內部關鍵角色與互動紀錄</p>
        </div>
        <button
          onClick={openCreateAccount}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800"
        >
          <Plus className="w-4 h-4" />
          新增企業
        </button>
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
                  activeTab === tab.key ? 'bg-brand-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {accounts.map((account) => {
                const status = STATUS_STYLE[account.status];
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={cn(
                      'w-full text-left rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all',
                      selectedAccountId === account.id ? 'ring-2 ring-brand-500' : 'hover:border-slate-200'
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
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditAccount(account);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        編輯
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'stakeholders' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={openCreateContact}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-900 text-white text-xs font-semibold hover:bg-brand-800"
                >
                  <Plus className="w-4 h-4" />
                  新增聯絡人
                </button>
              </div>
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
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openEditContact(contact)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        編輯
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={openCreateEngagement}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-900 text-white text-xs font-semibold hover:bg-brand-800"
                >
                  <Plus className="w-4 h-4" />
                  新增互動
                </button>
              </div>
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
                <h3 className="text-lg font-semibold text-slate-900">{selectedAccount?.name || '未選擇'}</h3>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>產業</span>
                <span className="text-slate-700">{selectedAccount?.industry || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>規模</span>
                <span className="text-slate-700">{selectedAccount?.size || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>續約日期</span>
                <span className="text-slate-700">{selectedAccount?.nextRenewal || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users className="w-4 h-4 text-brand-500" />
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

      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={editingAccount ? '編輯企業帳戶' : '新增企業帳戶'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs text-slate-500">
              企業名稱
              <input
                value={accountForm.name}
                onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              產業類別
              <input
                value={accountForm.industry}
                onChange={(event) => setAccountForm({ ...accountForm, industry: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              公司規模
              <input
                value={accountForm.size}
                onChange={(event) => setAccountForm({ ...accountForm, size: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              狀態
              <select
                value={accountForm.status}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, status: event.target.value as CorporateAccount['status'] })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="at_risk">At Risk</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              續約日期
              <input
                type="date"
                value={accountForm.nextRenewal}
                onChange={(event) => setAccountForm({ ...accountForm, nextRenewal: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              預估案值 (TWD)
              <input
                type="number"
                value={accountForm.pipelineValue ?? 0}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, pipelineValue: Number(event.target.value) })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAccountModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300"
            >
              取消
            </button>
            <button
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-lg bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {isSaving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={editingContact ? '編輯聯絡人' : '新增聯絡人'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs text-slate-500">
              姓名
              <input
                value={contactForm.name}
                onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              職稱
              <input
                value={contactForm.title}
                onChange={(event) => setContactForm({ ...contactForm, title: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              角色
              <select
                value={contactForm.role}
                onChange={(event) =>
                  setContactForm({ ...contactForm, role: event.target.value as ContactPerson['role'] })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="decision_maker">Decision Maker</option>
                <option value="influencer">Influencer</option>
                <option value="user">User</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              關注點
              <input
                value={contactForm.concern}
                onChange={(event) => setContactForm({ ...contactForm, concern: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              電話
              <input
                value={contactForm.phone}
                onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              Email
              <input
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300"
            >
              取消
            </button>
            <button
              onClick={handleSaveContact}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-lg bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {isSaving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEngagementModalOpen}
        onClose={() => setIsEngagementModalOpen(false)}
        title="新增互動紀錄"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs text-slate-500">
              日期
              <input
                type="date"
                value={engagementForm.date}
                onChange={(event) => setEngagementForm({ ...engagementForm, date: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="text-xs text-slate-500">
              互動管道
              <select
                value={engagementForm.channel}
                onChange={(event) =>
                  setEngagementForm({ ...engagementForm, channel: event.target.value as EngagementLog['channel'] })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="call">Call</option>
              </select>
            </label>
          </div>
          <label className="text-xs text-slate-500">
            摘要
            <textarea
              value={engagementForm.summary}
              onChange={(event) => setEngagementForm({ ...engagementForm, summary: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[90px]"
            />
          </label>
          <label className="text-xs text-slate-500">
            客戶疑慮 (每行一條)
            <textarea
              value={objectionsText}
              onChange={(event) => setObjectionsText(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[70px]"
            />
          </label>
          <label className="text-xs text-slate-500">
            回應策略
            <textarea
              value={engagementForm.response}
              onChange={(event) => setEngagementForm({ ...engagementForm, response: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[70px]"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEngagementModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300"
            >
              取消
            </button>
            <button
              onClick={handleSaveEngagement}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-lg bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {isSaving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
