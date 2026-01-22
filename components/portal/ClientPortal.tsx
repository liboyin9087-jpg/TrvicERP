import React, { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  LogOut,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/store/useToastStore';

type TabKey = 'dashboard' | 'roster' | 'documents' | 'briefing';

interface PortalEmployee {
  id: string;
  name: string;
  department: string;
  status: 'pending' | 'approved' | 'confirmed';
  passport: 'ok' | 'missing';
  insurance: 'ok' | 'missing';
}

const MOCK_EMPLOYEES: PortalEmployee[] = [
  { id: 'e1', name: '王小明', department: '研發部', status: 'confirmed', passport: 'ok', insurance: 'ok' },
  { id: 'e2', name: '李美玲', department: '行銷部', status: 'approved', passport: 'missing', insurance: 'ok' },
  { id: 'e3', name: '張大偉', department: '業務部', status: 'pending', passport: 'missing', insurance: 'missing' },
  { id: 'e4', name: '陳志豪', department: '人資部', status: 'approved', passport: 'ok', insurance: 'ok' },
];

const DOCUMENTS = [
  { id: 'doc-1', title: '保險名冊', description: '全團旅遊責任險與意外險名單' },
  { id: 'doc-2', title: '行前說明會簡報', description: '集合時間與注意事項' },
  { id: 'doc-3', title: '費用明細表', description: '補助與自費拆分' },
];

function StatCard({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 text-gray-500 text-sm">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <div className="mt-4 text-2xl font-semibold text-gray-900">{value}</div>
      {helper && <div className="text-xs text-gray-400 mt-1">{helper}</div>}
    </div>
  );
}

interface ClientPortalProps {
  initialAuthenticated?: boolean;
}

export default function ClientPortal({ initialAuthenticated = false }: ClientPortalProps) {
  const toast = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const stats = useMemo(() => {
    const total = MOCK_EMPLOYEES.length || 1;
    const confirmed = MOCK_EMPLOYEES.filter((e) => e.status === 'confirmed').length;
    const passportOk = MOCK_EMPLOYEES.filter((e) => e.passport === 'ok').length;
    const insuranceOk = MOCK_EMPLOYEES.filter((e) => e.insurance === 'ok').length;
    return {
      registrationRate: Math.round((confirmed / total) * 100),
      passportRate: Math.round((passportOk / total) * 100),
      insuranceRate: Math.round((insuranceOk / total) * 100),
    };
  }, []);

  const handleLogin = () => {
    if (!email.trim() || !code.trim()) {
      toast.error('請輸入 Email 與驗證碼');
      return;
    }
    setIsAuthenticated(true);
    toast.success('已登入企業客戶入口');
  };

  const handleDownload = (name: string) => {
    toast.info(`已準備下載：${name}`);
  };

  if (!isAuthenticated) {
    return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-semibold">
              TM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Client Portal</h1>
              <p className="text-xs text-gray-500">企業福委專屬入口</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">企業 Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hr@company.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">一次性驗證碼</label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入 6 位數驗證碼"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full rounded-xl bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              登入企業入口
            </button>
            <p className="text-xs text-gray-400 text-center">
              系統會將登入連結寄送到您的信箱 (Demo 模式)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-semibold">
              TM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">宏觀科技福委會</h1>
              <p className="text-xs text-gray-500">2025 日本東京五日團</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500"
          >
            <LogOut className="w-4 h-4" />
            登出
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
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
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-slate-200 text-gray-600 hover:border-brand-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={<Users className="w-5 h-5 text-brand-600" />} label="報名完成率" value={`${stats.registrationRate}%`} helper="已確認 2 / 4" />
              <StatCard icon={<FileText className="w-5 h-5 text-emerald-600" />} label="護照繳交率" value={`${stats.passportRate}%`} helper="缺件 2 人" />
              <StatCard icon={<CheckCircle className="w-5 h-5 text-indigo-600" />} label="保險完成率" value={`${stats.insuranceRate}%`} helper="缺件 1 人" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">風險與合規提醒</h3>
                  <p className="text-sm text-gray-500">即時監控全團狀態</p>
                </div>
                <button
                  onClick={() => handleDownload('風險清單')}
                  className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
                >
                  <Download className="w-4 h-4" />
                  匯出清單
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-semibold text-gray-900">護照效期不足</p>
                    <p className="text-xs text-gray-500">2 位成員需更新護照</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-gray-900">行前說明會</p>
                    <p className="text-xs text-gray-500">預定 3/10 10:00 線上舉行</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">報名名單</h3>
                <p className="text-sm text-gray-500">缺件人員會自動標記</p>
              </div>
              <button
                onClick={() => handleDownload('報名名單')}
                className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
              >
                <Download className="w-4 h-4" />
                下載名單
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="text-left py-2">姓名</th>
                    <th className="text-left py-2">部門</th>
                    <th className="text-left py-2">狀態</th>
                    <th className="text-left py-2">護照</th>
                    <th className="text-left py-2">保險</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_EMPLOYEES.map((employee) => (
                    <tr key={employee.id} className="text-gray-700">
                      <td className="py-3 font-medium text-gray-900">{employee.name}</td>
                      <td className="py-3">{employee.department}</td>
                      <td className="py-3">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-semibold',
                          employee.status === 'confirmed' && 'bg-green-100 text-green-700',
                          employee.status === 'approved' && 'bg-brand-100 text-brand-700',
                          employee.status === 'pending' && 'bg-amber-100 text-amber-700'
                        )}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {employee.passport === 'ok' ? (
                          <span className="text-green-600">已繳</span>
                        ) : (
                          <span className="text-red-500">缺件</span>
                        )}
                      </td>
                      <td className="py-3">
                        {employee.insurance === 'ok' ? (
                          <span className="text-green-600">已保</span>
                        ) : (
                          <span className="text-red-500">缺件</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">文件下載</h3>
            <div className="grid gap-3">
              {DOCUMENTS.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.title)}
                    className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
                  >
                    <Download className="w-4 h-4" />
                    下載
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'briefing' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">行前說明</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                <p className="text-sm text-gray-500">線上說明會</p>
                <p className="text-lg font-semibold text-gray-900">2025/03/10 (一) 10:00</p>
                <p className="text-xs text-gray-500">Microsoft Teams 連結已寄送</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                <p className="text-sm text-gray-500">集合資訊</p>
                <p className="text-lg font-semibold text-gray-900">桃園機場第一航廈</p>
                <p className="text-xs text-gray-500">集合時間 05:30，請攜帶護照</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('行前說明會資料')}
              className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
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
