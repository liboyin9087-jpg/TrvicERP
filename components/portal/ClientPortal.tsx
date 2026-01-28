import React, { useMemo, useState, useCallback, Fragment } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  LogOut,
  ShieldAlert,
  Users,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn remains external utility

// --- Architectural & Data Separation ---

// Define core data types
interface PortalEmployee {
  id: string;
  name: string;
  department: string;
  status: 'pending' | 'approved' | 'confirmed';
  passport: 'ok' | 'missing';
  insurance: 'ok' | 'missing';
}

interface DocumentItem {
  id: string;
  title: string;
  description: string;
}

// Helper function for statistics calculation (extracted business logic)
interface ClientStats {
  total: number;
  confirmed: number;
  passportOk: number;
  insuranceOk: number;
  registrationRate: number;
  passportRate: number;
  insuranceRate: number;
}

const calculateClientStats = (employees: PortalEmployee[]): ClientStats => {
  const total = employees.length;
  const confirmed = employees.filter((e) => e.status === 'confirmed').length;
  const passportOk = employees.filter((e) => e.passport === 'ok').length;
  const insuranceOk = employees.filter((e) => e.insurance === 'ok').length;

  return {
    total,
    confirmed,
    passportOk,
    insuranceOk,
    registrationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    passportRate: total > 0 ? Math.round((passportOk / total) * 100) : 0,
    insuranceRate: total > 0 ? Math.round((insuranceOk / total) * 100) : 0,
  };
};

// --- Designer Fixes: StatCard Component ---
// Refactored StatCard to use configurable styles and Dashtail tokens
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  iconBgClass?: string; // e.g., 'bg-primary-100'
  iconColorClass?: string; // e.g., 'text-primary-600'
  className?: string; // For additional styling on the card itself
}

function StatCard({
  icon,
  label,
  value,
  helper,
  iconBgClass = 'bg-surface-200', // Default Dashtail token for secondary background
  iconColorClass = 'text-text-secondary', // Default Dashtail token for secondary text color
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-surface-100 rounded-2xl border border-surface-200 p-5 shadow-sm", className)}>
      <div className="flex items-center gap-3 text-text-secondary text-sm">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass, iconColorClass)}>
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <div className="mt-4 text-2xl font-semibold text-text-primary">{value}</div>
      {helper && <div className="text-sm text-text-tertiary mt-1">{helper}</div>}
    </div>
  );
}

// --- Main Component: ClientPortal ---

type TabKey = 'dashboard' | 'roster' | 'documents' | 'briefing';

// Define the Config Props interface (architect fix)
export interface ClientPortalConfig {
  initialAuthenticated?: boolean;
  employees: PortalEmployee[];
  documents: DocumentItem[];
  companyName: string;
  tripName: string;
  briefingDate: string; // e.g., "2025/03/10 (一)"
  briefingTime: string; // e.g., "10:00"
  briefingLocation: string; // e.g., "Microsoft Teams"
  briefingNotes: string; // e.g., "連結已寄送"
  briefingCollectionLocation: string; // e.g., "桃園機場第一航廈"
  briefingCollectionTime: string; // e.g., "集合時間 05:30"
  briefingCollectionNotes: string; // e.g., "請攜帶護照"
  loginHelpText: string;
  portalTitle: string;
  portalSubtitle: string;
  onLoginSuccess: (message: string) => void;
  onLoginError: (message: string) => void;
  onInfoMessage: (message: string) => void;
  onLogout: () => void;
  // Optional for Kintone widget, if it supports dynamic config
  // widgetId?: string;
  // widgetTitle?: string;
}

// Default config values for development/testing
const DEFAULT_CLIENT_PORTAL_CONFIG: ClientPortalConfig = {
  initialAuthenticated: false,
  employees: [
    { id: 'e1', name: '王小明', department: '研發部', status: 'confirmed', passport: 'ok', insurance: 'ok' },
    { id: 'e2', name: '李美玲', department: '行銷部', status: 'approved', passport: 'missing', insurance: 'ok' },
    { id: 'e3', name: '張大偉', department: '業務部', status: 'pending', passport: 'missing', insurance: 'missing' },
    { id: 'e4', name: '陳志豪', department: '人資部', status: 'approved', passport: 'ok', insurance: 'ok' },
    { id: 'e5', name: '林志玲', department: '行政部', status: 'confirmed', passport: 'ok', insurance: 'missing' },
  ],
  documents: [
    { id: 'doc-1', title: '保險名冊', description: '全團旅遊責任險與意外險名單' },
    { id: 'doc-2', title: '行前說明會簡報', description: '集合時間與注意事項' },
    { id: 'doc-3', title: '費用明細表', description: '補助與自費拆分' },
  ],
  companyName: '宏觀科技福委會',
  tripName: '2025 日本東京五日團',
  briefingDate: '2025/03/10 (一)',
  briefingTime: '10:00',
  briefingLocation: 'Microsoft Teams',
  briefingNotes: '連結已寄送',
  briefingCollectionLocation: '桃園機場第一航廈',
  briefingCollectionTime: '集合時間 05:30',
  briefingCollectionNotes: '請攜帶護照',
  loginHelpText: '系統會將登入連結寄送到您的信箱 (Demo 模式)',
  portalTitle: 'Client Portal',
  portalSubtitle: '企業福委專屬入口',
  onLoginSuccess: (msg) => console.log('Login Success:', msg),
  onLoginError: (msg) => console.error('Login Error:', msg),
  onInfoMessage: (msg) => console.info('Info:', msg),
  onLogout: () => console.log('Logout'),
};


export default function ClientPortal(props: ClientPortalConfig) {
  const {
    initialAuthenticated,
    employees,
    documents,
    companyName,
    tripName,
    briefingDate,
    briefingTime,
    briefingLocation,
    briefingNotes,
    briefingCollectionLocation,
    briefingCollectionTime,
    briefingCollectionNotes,
    loginHelpText,
    portalTitle,
    portalSubtitle,
    onLoginSuccess,
    onLoginError,
    onInfoMessage,
    onLogout,
  } = { ...DEFAULT_CLIENT_PORTAL_CONFIG, ...props }; // Merge with defaults

  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // designer fix: loading state
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Business logic: statistics calculation (extracted)
  const stats = useMemo(() => calculateClientStats(employees), [employees]);

  // Designer fix: Form Validation & Architect fix: Business logic mixed with presentation
  const handleLogin = useCallback(async () => {
    setEmailError('');
    setCodeError('');
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email 不可為空');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('請輸入有效的 Email 格式');
      hasError = true;
    }

    if (!code.trim()) {
      setCodeError('驗證碼不可為空');
      hasError = true;
    } else if (!/^\d{6}$/.test(code)) {
      setCodeError('驗證碼必須是 6 位數字');
      hasError = true;
    }

    if (hasError) {
      onLoginError('請修正輸入錯誤');
      return;
    }

    setIsLoggingIn(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoggingIn(false);

    // In a real application, you'd send credentials to a server for verification
    // For this demo, any valid-format non-empty input logs in
    setIsAuthenticated(true);
    onLoginSuccess('已成功登入企業客戶入口');
  }, [email, code, onLoginError, onLoginSuccess]);

  const handleDownload = useCallback((name: string) => {
    onInfoMessage(`已準備下載：${name}`);
    // In a real app, trigger actual download here
  }, [onInfoMessage]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setEmail('');
    setCode('');
    onLogout();
  }, [onLogout]);


  // --- Render Login Form ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-surface-100 rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6" data-drag-handle="true">
            <div className="w-12 h-12 rounded-2xl bg-primary-500 text-text-on-primary flex items-center justify-center font-semibold text-lg">
              TM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">{portalTitle}</h1>
              <p className="text-sm text-text-secondary">{portalSubtitle}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-input" className="text-sm text-text-secondary">企業 Email</label>
              <input
                id="email-input"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(''); // Clear error on change
                }}
                className={cn(
                  "mt-1 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500",
                  emailError ? 'border-danger-500' : 'border-surface-300'
                )}
                placeholder="hr@company.com"
                type="email"
              />
              {emailError && <p className="mt-1 text-sm text-danger-500">{emailError}</p>}
            </div>
            <div>
              <label htmlFor="code-input" className="text-sm text-text-secondary">一次性驗證碼</label>
              <input
                id="code-input"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setCodeError(''); // Clear error on change
                }}
                className={cn(
                  "mt-1 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500",
                  codeError ? 'border-danger-500' : 'border-surface-300'
                )}
                placeholder="輸入 6 位數驗證碼"
                type="text"
                maxLength={6}
              />
              {codeError && <p className="mt-1 text-sm text-danger-500">{codeError}</p>}
            </div>
            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-primary-500 text-text-on-primary py-3 text-sm font-semibold hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoggingIn} // Designer fix: loading state
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoggingIn ? '登入中...' : '登入企業入口'}
            </button>
            <p className="text-sm text-text-tertiary text-center">
              {loginHelpText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Authenticated Portal ---
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-100 border-b border-surface-200" data-drag-handle="true">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-500 text-text-on-primary flex items-center justify-center font-semibold text-base">
              TM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">{companyName}</h1>
              <p className="text-sm text-text-secondary">{tripName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-danger-500 focus:outline-none focus:ring-2 focus:ring-danger-200 focus:ring-offset-2 rounded-md p-1 -m-1"
          >
            <LogOut className="w-4 h-4" />
            登出
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Responsive Tabs */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'dashboard', label: '總覽' },
            { key: 'roster', label: '報名名單' },
            { key: 'documents', label: '文件下載' },
            { key: 'briefing', label: '行前說明' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                activeTab === tab.key
                  ? 'bg-primary-500 text-text-on-primary'
                  : 'bg-surface-100 border border-surface-300 text-text-secondary hover:border-primary-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="報名完成率"
                value={`${stats.registrationRate}%`}
                helper={`已確認 ${stats.confirmed} / ${stats.total}`}
                iconBgClass="bg-primary-100"
                iconColorClass="text-primary-600"
              />
              <StatCard
                icon={<FileText className="w-5 h-5" />}
                label="護照繳交率"
                value={`${stats.passportRate}%`}
                helper={`缺件 ${stats.total - stats.passportOk} 人`}
                iconBgClass="bg-success-100"
                iconColorClass="text-success-600"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5" />}
                label="保險完成率"
                value={`${stats.insuranceRate}%`}
                helper={`缺件 ${stats.total - stats.insuranceOk} 人`}
                iconBgClass="bg-primary-100"
                iconColorClass="text-primary-600"
              />
            </div>

            <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">風險與合規提醒</h3>
                  <p className="text-sm text-text-secondary">即時監控全團狀態</p>
                </div>
                <button
                  onClick={() => handleDownload('風險清單')}
                  className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-md p-1 -m-1"
                >
                  <Download className="w-4 h-4" />
                  匯出清單
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-lg bg-danger-50 p-4">
                  <ShieldAlert className="w-5 h-5 text-danger-500" />
                  <div>
                    <p className="font-semibold text-text-primary">護照效期不足</p>
                    <p className="text-sm text-text-secondary">{stats.total - stats.passportOk} 位成員需更新護照</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-warning-50 p-4">
                  <Calendar className="w-5 h-5 text-warning-500" />
                  <div>
                    <p className="font-semibold text-text-primary">行前說明會</p>
                    <p className="text-sm text-text-secondary">預定 {briefingDate} {briefingTime} {briefingLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roster Tab Content */}
        {activeTab === 'roster' && (
          <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">報名名單</h3>
                <p className="text-sm text-text-secondary">缺件人員會自動標記</p>
              </div>
              <button
                onClick={() => handleDownload('報名名單')}
                className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-md p-1 -m-1"
              >
                <Download className="w-4 h-4" />
                下載名單
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]"> {/* Added min-width for better responsiveness */}
                <thead className="text-sm text-text-tertiary uppercase border-b border-surface-200">
                  <tr>
                    <th className="text-left py-2 px-2">姓名</th>
                    <th className="text-left py-2 px-2">部門</th>
                    <th className="text-left py-2 px-2">狀態</th>
                    <th className="text-left py-2 px-2">護照</th>
                    <th className="text-left py-2 px-2">保險</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="text-text-secondary">
                      <td className="py-3 px-2 font-medium text-text-primary">{employee.name}</td>
                      <td className="py-3 px-2">{employee.department}</td>
                      <td className="py-3 px-2">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-semibold', // Use text-xs for smaller badges
                          employee.status === 'confirmed' && 'bg-success-100 text-success-700',
                          employee.status === 'approved' && 'bg-primary-100 text-primary-700',
                          employee.status === 'pending' && 'bg-warning-100 text-warning-700'
                        )}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {employee.passport === 'ok' ? (
                          <span className="text-success-600">已繳</span>
                        ) : (
                          <span className="text-danger-500">缺件</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {employee.insurance === 'ok' ? (
                          <span className="text-success-600">已保</span>
                        ) : (
                          <span className="text-danger-500">缺件</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents Tab Content */}
        {activeTab === 'documents' && (
          <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">文件下載</h3>
            <div className="grid gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between p-4 border border-surface-200 rounded-lg gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-200 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{doc.title}</p>
                      <p className="text-sm text-text-secondary">{doc.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.title)}
                    className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-md p-1 -m-1"
                  >
                    <Download className="w-4 h-4" />
                    下載
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Briefing Tab Content */}
        {activeTab === 'briefing' && (
          <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">行前說明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-surface-200 p-4 space-y-2">
                <p className="text-sm text-text-secondary">線上說明會</p>
                <p className="text-lg font-semibold text-text-primary">{briefingDate} {briefingTime}</p>
                <p className="text-sm text-text-secondary">{briefingLocation} {briefingNotes}</p>
              </div>
              <div className="rounded-lg border border-surface-200 p-4 space-y-2">
                <p className="text-sm text-text-secondary">集合資訊</p>
                <p className="text-lg font-semibold text-text-primary">{briefingCollectionLocation}</p>
                <p className="text-sm text-text-secondary">{briefingCollectionTime}，{briefingCollectionNotes}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('行前說明會資料')}
              className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-md p-1 -m-1"
            >
              <Download className="w-4 h-4" />
              下載行前資料
            </button>
          </div>
        )}
      </main>
    </div>
  );
}