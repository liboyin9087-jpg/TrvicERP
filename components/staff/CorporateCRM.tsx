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
  Grab, // 用于表示拖曳手柄的图标
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '../shared/Modal'; // 假设 Modal 是一个遵循 Dashtail UI 规范的共享组件

// 移除对全域 Store (useToast) 和 CorporateService 的直接依赖。
// import { useToast } from '@/store/useToastStore';
// import CorporateService from '@/modules/corporate/services/corporateService';

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

// 移除 Mock 数据，数据将通过 Props 传入或通过 Props 提供的服务获取。
// const MOCK_ACCOUNTS: CorporateAccount[] = [...];
// const MOCK_CONTACTS: ContactPerson[] = [...];
// const MOCK_ENGAGEMENTS: EngagementLog[] = [...];

type TabKey = 'accounts' | 'stakeholders' | 'engagement';

/**
 * @interface CorporateCRMConfig
 * @description 定义 CorporateCRM 组件的配置属性接口，确保组件 Kintone 独立性。
 */
export interface CorporateCRMConfig {
  /** 初始企业账户列表 */
  initialAccounts?: CorporateAccount[];
  /** 默认选中的企业账户 ID */
  defaultSelectedAccountId?: string;
  /** 获取特定账户联络人的异步函数 */
  onFetchContacts: (accountId: string) => Promise<ContactPerson[]>;
  /** 获取特定账户互动记录的异步函数 */
  onFetchEngagements: (accountId: string) => Promise<EngagementLog[]>;
  /** 保存（新增或更新）企业账户的异步函数 */
  onSaveAccount: (
    data: CreateCorporateAccountData | UpdateCorporateAccountData,
    id?: string
  ) => Promise<CorporateAccount>;
  /** 保存（新增或更新）联络人的异步函数 */
  onSaveContact: (
    accountId: string,
    data: CreateContactPersonData | UpdateContactPersonData,
    id?: string
  ) => Promise<ContactPerson>;
  /** 保存（新增）互动记录的异步函数 */
  onSaveEngagement: (
    accountId: string,
    data: CreateEngagementLogData
  ) => Promise<EngagementLog>;
  /** 用于显示通知消息的回调函数集合，替代 useToast */
  onToast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  // 可根据需要添加其他配置属性，例如功能开关、文本标签等。
}

// [designer] 状态样式抽象，使用 Dashtail UI 规范的语义化 Tailwind 颜色 token
// 假设已在 Tailwind 配置中定义了 primary, success, info, warning, danger, text-*, background-*, border-* 等颜色别名。
const ROLE_STYLES: Record<ContactPerson['role'], { label: string; className: string }> = {
  decision_maker: { label: 'Decision Maker', className: 'bg-success-100 text-success-700' },
  influencer: { label: 'Influencer', className: 'bg-info-100 text-info-700' },
  user: { label: 'User', className: 'bg-warning-100 text-warning-700' },
};

const ACCOUNT_STATUS_STYLES: Record<CorporateAccount['status'], { label: string; className: string; icon: React.ReactNode }> = {
  active: { label: 'Active', className: 'text-success-600', icon: <CheckCircle className="icon-sm" /> },
  prospect: { label: 'Prospect', className: 'text-info-600', icon: <Star className="icon-sm" /> },
  at_risk: { label: 'At Risk', className: 'text-danger-500', icon: <ShieldAlert className="icon-sm" /> },
};

/**
 * @description 企业客户决策链管理组件
 * 重构说明：
 * - 组件现在通过 CorporateCRMConfig 接收所有外部依赖（数据、服务回调、通知函数）。
 * - 移除了组件内部的 Mock 数据和直接的数据服务调用。
 * - 引入了 Dashtail UI 规范：
 *   - 整体包裹在 .card .widget-card 结构中。
 *   - 顶部增加 .drag-handle 区域。
 *   - 所有硬编码颜色值替换为语义化的 Tailwind 颜色 token (如 bg-primary-900, text-success-600)。
 *   - 字体和间距使用更具语义的类名或 Tailwind 的单位化 class (如 icon-sm, p-card, space-y-unit-X)。
 *   - 状态样式 ROLE_STYLES 和 ACCOUNT_STATUS_STYLES 已更新为使用颜色 token。
 */
export default function CorporateCRM(props: CorporateCRMConfig) {
  const {
    initialAccounts = [],
    onFetchContacts,
    onFetchEngagements,
    onSaveAccount,
    onSaveContact,
    onSaveEngagement,
    onToast,
    defaultSelectedAccountId,
  } = props;

  // 使用从 props 传入的 toast 实例
  const toast = onToast;

  const [activeTab, setActiveTab] = useState<TabKey>('accounts');
  const [accounts, setAccounts] = useState<CorporateAccount[]>(initialAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultSelectedAccountId || (initialAccounts.length > 0 ? initialAccounts[0].id : '')
  );
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
    date: '', // 默认值在 resetEngagementForm 中设置
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

  // 根据 selectedAccountId 异步获取联络人和互动记录
  useEffect(() => {
    if (!selectedAccountId || !onFetchContacts || !onFetchEngagements) {
      setContacts([]);
      setEngagements([]);
      return;
    }

    let active = true;
    const fetchRelatedData = async () => {
      try {
        const fetchedContacts = await onFetchContacts(selectedAccountId);
        if (active) setContacts(fetchedContacts);
      } catch (error) {
        if (active) {
          toast.error(`加载联络人失败: ${error instanceof Error ? error.message : '未知错误'}`);
          setContacts([]);
        }
      }

      try {
        const fetchedEngagements = await onFetchEngagements(selectedAccountId);
        if (active) setEngagements(fetchedEngagements);
      } catch (error) {
        if (active) {
          toast.error(`加载互动记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
          setEngagements([]);
        }
      }
    };

    fetchRelatedData();

    return () => {
      active = false;
    };
  }, [selectedAccountId, onFetchContacts, onFetchEngagements, toast]);

  // 处理初始选中账户
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
      date: new Date().toISOString().split('T')[0], // 默认设置为当前日期
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
    if (!selectedAccountId) {
      toast.info('请先选择一个企业账户');
      return;
    }
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
    if (!selectedAccountId) {
      toast.info('请先选择一个企业账户');
      return;
    }
    resetEngagementForm();
    setIsEngagementModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('请输入企业名称');
      return;
    }
    setIsSaving(true);
    try {
      const payload: CreateCorporateAccountData | UpdateCorporateAccountData = {
        name: accountForm.name.trim(),
        industry: accountForm.industry.trim(),
        size: accountForm.size.trim(),
        status: accountForm.status,
        nextRenewal: accountForm.nextRenewal,
        pipelineValue: Number(accountForm.pipelineValue) || 0,
      };

      // 调用 props 传入的保存函数
      const savedAccount = await onSaveAccount(payload, editingAccount?.id);

      if (editingAccount) {
        setAccounts((prev) =>
          prev.map((item) => (item.id === editingAccount.id ? savedAccount : item))
        );
        toast.success('已更新企业账户');
      } else {
        setAccounts((prev) => [savedAccount, ...prev]);
        setSelectedAccountId(savedAccount.id);
        toast.success('已新增企业账户');
      }
      setIsAccountModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!selectedAccountId) return;
    if (!contactForm.name.trim()) {
      toast.error('请输入联络人姓名');
      return;
    }
    setIsSaving(true);
    try {
      const payload: CreateContactPersonData | UpdateContactPersonData = {
        name: contactForm.name.trim(),
        title: contactForm.title.trim(),
        role: contactForm.role,
        concern: contactForm.concern.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim(),
      };

      // 调用 props 传入的保存函数
      const savedContact = await onSaveContact(selectedAccountId, payload, editingContact?.id);

      if (editingContact) {
        setContacts((prev) =>
          prev.map((item) => (item.id === editingContact.id ? savedContact : item))
        );
        toast.success('已更新联络人');
      } else {
        setContacts((prev) => [savedContact, ...prev]);
        toast.success('已新增联络人');
      }
      setIsContactModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEngagement = async () => {
    if (!selectedAccountId) return;
    if (!engagementForm.summary.trim()) {
      toast.error('请输入互动摘要');
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
      // 调用 props 传入的保存函数
      const savedEngagement = await onSaveEngagement(selectedAccountId, payload);
      setEngagements((prev) => [savedEngagement, ...prev]);
      toast.success('已新增互动记录');
      setIsEngagementModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // [designer] 整体包裹在标准 Card 结构中，并添加 drag-handle
    <div className="card widget-card p-card space-y-unit-6"> {/* 使用语义化的 p-card 和 space-y-unit-6 */}
      {/* [designer] 拖曳手柄结构 */}
      <div className="drag-handle flex items-center gap-unit-2 text-text-secondary pb-unit-2">
        <Grab className="icon-sm" />
        <span className="text-sm">拖曳此處移動</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-unit-4">
        <div>
          <div className="flex items-center gap-unit-3 mb-unit-2">
            <div className="w-unit-10 h-unit-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"> {/* 使用 primary 颜色 token */}
              <Building2 className="icon-md text-white" /> {/* 使用语义化 icon 尺寸类 */}
            </div>
            <span className="text-sm font-semibold text-text-secondary bg-background-secondary px-unit-2 py-unit-1 rounded-full">
              B2B CRM
            </span>
          </div>
          <h2 className="text-h2 font-bold text-text-primary">企业客户决策链管理</h2> {/* 使用语义化字体大小类 */}
          <p className="text-text-secondary">掌握企业内部关键角色与互动记录</p>
        </div>
        <button
          onClick={openCreateAccount}
          className="btn btn-primary" // 假设有 btn-primary 类定义
        >
          <Plus className="icon-sm" />
          新增企业
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-unit-6">
        <div className="space-y-unit-4">
          <div className="flex gap-unit-2 border-b border-border-default pb-unit-3"> {/* 使用语义化边框和间距 */}
            {([
              { key: 'accounts', label: '企业账户' },
              { key: 'stakeholders', label: '决策链' },
              { key: 'engagement', label: '互动记录' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-unit-4 py-unit-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key ? 'bg-primary-900 text-white' : 'text-text-secondary hover:bg-background-hover'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'accounts' && (
            <div className="space-y-unit-4">
              {accounts.length === 0 ? (
                <div className="text-center text-text-secondary py-unit-6">
                  目前没有企业账户，请点击「新增企业」按钮建立。
                </div>
              ) : (
                accounts.map((account) => {
                  const status = ACCOUNT_STATUS_STYLES[account.status];
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={cn(
                        'w-full text-left rounded-card border border-border-default bg-background-primary p-card-sm shadow-sm transition-all', // 语义化圆角、内边距和颜色
                        selectedAccountId === account.id ? 'ring-2 ring-primary-500' : 'hover:border-border-hover'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{account.name}</h3>
                          <p className="text-sm text-text-secondary">{account.industry} · {account.size}</p>
                        </div>
                        <div className={cn('flex items-center gap-unit-1 text-sm font-semibold', status.className)}>
                          {status.icon}
                          {status.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-unit-3 mt-unit-4 text-sm text-text-secondary">
                        <div>
                          <p>续约日期</p>
                          <p className="text-sm font-semibold text-text-primary">{account.nextRenewal}</p>
                        </div>
                        <div>
                          <p>预估案值</p>
                          <p className="text-sm font-semibold text-text-primary">
                            NT$ {account.pipelineValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-unit-4 flex justify-end">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditAccount(account);
                          }}
                          className="btn btn-ghost-secondary btn-icon-sm" // 假设有 btn-ghost-secondary 类
                        >
                          <Edit2 className="icon-sm" />
                          编辑
                        </button>
                      </div>
                    </button>
                  );
                }))}
            </div>
          )}

          {activeTab === 'stakeholders' && (
            <div className="space-y-unit-3">
              <div className="flex justify-end">
                <button
                  onClick={openCreateContact}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="icon-sm" />
                  新增联络人
                </button>
              </div>
              {contacts.length === 0 ? (
                <div className="text-center text-text-secondary py-unit-6">
                  目前没有联络人，请点击「新增联络人」按钮建立。
                </div>
              ) : (
                contacts.map((contact) => {
                  const roleStyle = ROLE_STYLES[contact.role];
                  return (
                    <div key={contact.id} className="rounded-card border border-border-default bg-background-primary p-card-sm shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-text-secondary">{contact.title}</p>
                          <h3 className="text-lg font-semibold text-text-primary">{contact.name}</h3>
                        </div>
                        <span className={cn('px-unit-3 py-unit-1 rounded-full text-sm font-semibold', roleStyle.className)}>
                          {roleStyle.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-unit-3">关注点：{contact.concern}</p>
                      <div className="flex flex-wrap gap-unit-3 mt-unit-3 text-sm text-text-secondary">
                        <span className="flex items-center gap-unit-1"><Phone className="icon-sm" />{contact.phone}</span>
                        <span className="flex items-center gap-unit-1"><Mail className="icon-sm" />{contact.email}</span>
                      </div>
                      <div className="mt-unit-4 flex justify-end">
                        <button
                          onClick={() => openEditContact(contact)}
                          className="btn btn-ghost-secondary btn-icon-sm"
                        >
                          <Edit2 className="icon-sm" />
                          编辑
                        </button>
                      </div>
                    </div>
                  );
                }))}
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-unit-3">
              <div className="flex justify-end">
                <button
                  onClick={openCreateEngagement}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="icon-sm" />
                  新增互动
                </button>
              </div>
              {engagements.length === 0 ? (
                <div className="text-center text-text-secondary py-unit-6">
                  目前没有互动记录，请点击「新增互动」按钮建立。
                </div>
              ) : (
                engagements.map((log) => (
                  <div key={log.id} className="rounded-card border border-border-default bg-background-primary p-card-sm shadow-sm">
                    <div className="flex items-center justify-between mb-unit-2">
                      <div className="flex items-center gap-unit-2 text-sm text-text-secondary">
                        <Calendar className="icon-sm" />
                        {log.date}
                      </div>
                      <span className="text-sm text-text-tertiary">{log.channel}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">{log.summary}</h4>
                    <div className="mt-unit-3 text-sm text-text-secondary">
                      <p className="font-semibold text-text-primary">客户疑虑</p>
                      <ul className="list-disc list-inside mt-unit-1">
                        {log.objections.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-unit-3 text-sm text-text-secondary">
                      <p className="font-semibold text-text-primary">回应策略</p>
                      <p>{log.response}</p>
                    </div>
                  </div>
                )))}
            </div>
          )}
        </div>

        <div className="space-y-unit-4">
          <div className="rounded-card border border-border-default bg-background-primary p-card-sm shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">目前账户</p>
                <h3 className="text-lg font-semibold text-text-primary">{selectedAccount?.name || '未选择'}</h3>
              </div>
              <ChevronRight className="icon-sm text-text-tertiary" />
            </div>
            <div className="mt-unit-4 space-y-unit-2 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <span>产业</span>
                <span className="text-text-primary">{selectedAccount?.industry || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>规模</span>
                <span className="text-text-primary">{selectedAccount?.size || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>续约日期</span>
                <span className="text-text-primary">{selectedAccount?.nextRenewal || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border-default bg-background-primary p-card-sm shadow-sm">
            <div className="flex items-center gap-unit-2 text-sm font-semibold text-text-primary">
              <Users className="icon-sm text-primary-500" />
              决策角色摘要
            </div>
            <div className="mt-unit-4 space-y-unit-3 text-sm text-text-secondary">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <span>{contact.name}</span>
                  <span className="text-text-primary">{ROLE_STYLES[contact.role].label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-border-default bg-background-primary p-card-sm shadow-sm">
            <div className="flex items-center gap-unit-2 text-sm font-semibold text-text-primary">
              <MessageSquare className="icon-sm text-warning-500" /> {/* 使用 warning-500 token */}
              下一步建议
            </div>
            <ul className="mt-unit-3 text-sm text-text-secondary space-y-unit-2">
              <li>• 排程下一次简报会议 (Decision Maker)</li>
              <li>• 提供三版本提案与毛利差异</li>
              <li>• 强调 Portal 风险可视化能力</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={editingAccount ? '编辑企业账户' : '新增企业账户'}
        size="lg"
      >
        <div className="space-y-unit-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-4">
            <label className="input-label"> {/* 假设有 input-label 类定义 */}
              企业名称
              <input
                value={accountForm.name}
                onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                className="input-field" // 假设有 input-field 类定义
              />
            </label>
            <label className="input-label">
              产业类别
              <input
                value={accountForm.industry}
                onChange={(event) => setAccountForm({ ...accountForm, industry: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              公司规模
              <input
                value={accountForm.size}
                onChange={(event) => setAccountForm({ ...accountForm, size: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              状态
              <select
                value={accountForm.status}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, status: event.target.value as CorporateAccount['status'] })
                }
                className="input-field"
              >
                {Object.entries(ACCOUNT_STATUS_STYLES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className="input-label">
              续约日期
              <input
                type="date"
                value={accountForm.nextRenewal}
                onChange={(event) => setAccountForm({ ...accountForm, nextRenewal: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              预估案值 (TWD)
              <input
                type="number"
                value={accountForm.pipelineValue} // pipelineValue 始终为 number, 0 即可显示
                onChange={(event) =>
                  setAccountForm({ ...accountForm, pipelineValue: Number(event.target.value) })
                }
                className="input-field"
              />
            </label>
          </div>
          <div className="flex justify-end gap-unit-2">
            <button
              onClick={() => setIsAccountModalOpen(false)}
              className="btn btn-secondary" // 假设有 btn-secondary 类定义
            >
              取消
            </button>
            <button
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={editingContact ? '编辑联络人' : '新增联络人'}
        size="lg"
      >
        <div className="space-y-unit-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-4">
            <label className="input-label">
              姓名
              <input
                value={contactForm.name}
                onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              职称
              <input
                value={contactForm.title}
                onChange={(event) => setContactForm({ ...contactForm, title: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              角色
              <select
                value={contactForm.role}
                onChange={(event) =>
                  setContactForm({ ...contactForm, role: event.target.value as ContactPerson['role'] })
                }
                className="input-field"
              >
                {Object.entries(ROLE_STYLES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className="input-label">
              关注点
              <input
                value={contactForm.concern}
                onChange={(event) => setContactForm({ ...contactForm, concern: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              电话
              <input
                value={contactForm.phone}
                onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              Email
              <input
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                className="input-field"
              />
            </label>
          </div>
          <div className="flex justify-end gap-unit-2">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSaveContact}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEngagementModalOpen}
        onClose={() => setIsEngagementModalOpen(false)}
        title="新增互动记录"
        size="lg"
      >
        <div className="space-y-unit-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-4">
            <label className="input-label">
              日期
              <input
                type="date"
                value={engagementForm.date}
                onChange={(event) => setEngagementForm({ ...engagementForm, date: event.target.value })}
                className="input-field"
              />
            </label>
            <label className="input-label">
              互动管道
              <select
                value={engagementForm.channel}
                onChange={(event) =>
                  setEngagementForm({ ...engagementForm, channel: event.target.value as EngagementLog['channel'] })
                }
                className="input-field"
              >
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="call">Call</option>
              </select>
            </label>
          </div>
          <label className="input-label">
            摘要
            <textarea
              value={engagementForm.summary}
              onChange={(event) => setEngagementForm({ ...engagementForm, summary: event.target.value })}
              className="input-field min-h-[90px]"
            />
          </label>
          <label className="input-label">
            客户疑虑 (每行一条)
            <textarea
              value={objectionsText}
              onChange={(event) => setObjectionsText(event.target.value)}
              className="input-field min-h-[70px]"
            />
          </label>
          <label className="input-label">
            回应策略
            <textarea
              value={engagementForm.response}
              onChange={(event) => setEngagementForm({ ...engagementForm, response: event.target.value })}
              className="input-field min-h-[70px]"
            />
          </label>
          <div className="flex justify-end gap-unit-2">
            <button
              onClick={() => setIsEngagementModalOpen(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSaveEngagement}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// 假设的 Tailwind 配置文件扩展或全局 CSS 定义示例 (供参考，实际项目中应已存在)
/*
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'unit-1': '0.25rem', // 4px
        'unit-2': '0.5rem',  // 8px
        'unit-3': '0.75rem', // 12px
        'unit-4': '1rem',    // 16px
        'unit-6': '1.5rem',  // 24px
        'unit-10': '2.5rem', // 40px
        // ...更多单位
      },
      borderRadius: {
        'card': '1rem', // 16px
      },
      padding: {
        'card': '1.5rem',   // 24px
        'card-sm': '1.25rem', // 20px
      },
      colors: {
        // 定义品牌主色调
        primary: {
          500: '#6366F1', // indigo-500
          600: '#4F46E5', // indigo-600 (或 blue-600)
          800: '#3730A3', // indigo-800
          900: '#312E81', // indigo-900
        },
        // 定义状态颜色
        success: {
          100: '#D1FAE5', // emerald-100
          600: '#059669', // emerald-600
          700: '#047857', // emerald-700
        },
        info: {
          100: '#DBEAFE', // blue-100
          600: '#2563EB', // blue-600
          700: '#1D4ED8', // blue-700
        },
        warning: {
          100: '#FEF3C7', // amber-100
          500: '#F59E0B', // amber-500
          700: '#B45309', // amber-700
        },
        danger: {
          500: '#EF4444', // red-500
        },
        // 定义背景色
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC', // slate-50
          hover: '#F1F5F9',    // slate-100
        },
        // 定义文本颜色
        text: {
          primary: '#0F172A',   // slate-900
          secondary: '#64748B', // slate-500
          tertiary: '#94A3B8',  // slate-400
        },
        // 定义边框颜色
        border: {
          default: '#E2E8F0', // slate-200
          hover: '#CBD5E1',   // slate-300
        },
      },
      fontSize: {
        'h2': '1.5rem', // 24px
        // ...其他语义化字体大小
      },
    },
  },
};

// global.css (或 components.css)
// 定义常用语义化组件类
@layer components {
  .icon-sm { @apply w-4 h-4; }
  .icon-md { @apply w-5 h-5; }
  .input-label { @apply text-sm text-text-secondary block; }
  .input-field { @apply mt-unit-2 w-full rounded-lg border border-border-default px-unit-3 py-unit-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500; }
  
  .btn { @apply inline-flex items-center justify-center gap-unit-2 px-unit-4 py-unit-2 rounded-lg text-sm font-semibold transition-colors duration-200 ease-in-out; }
  .btn-sm { @apply px-unit-3 py-unit-2; } // 稍小的按钮
  .btn-primary { @apply bg-primary-900 text-white hover:bg-primary-800 disabled:opacity-60; }
  .btn-secondary { @apply border border-border-default text-text-secondary hover:border-border-hover bg-white; }
  .btn-ghost-secondary { @apply text-text-secondary hover:text-text-primary; }
  .btn-icon-sm { @apply p-unit-1; } // 仅图标的按钮，更小内边距

  .card { @apply rounded-card border border-border-default bg-background-primary shadow-sm; }
  .widget-card { @apply p-card; } // 作为 widget 时，默认的内边距
}
*/