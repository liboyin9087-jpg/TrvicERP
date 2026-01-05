// =====================================================
// TravelCanvas - 旅行社工作台 (Agency/Admin)
// 目的：把 Bolt 的管理功能（RFP/反雷/版本/報價）集中在同一個角色視角
// =====================================================

import React, { useState } from 'react';
import { BarChart3, FileText, GitBranch, LayoutDashboard, LogOut, ShieldAlert } from '../../components/Icons';
import AdminDashboard from '../../components/AdminDashboard';
import WarningDatabasePanel from '../../components/WarningDatabasePanel';
import RFPGeneratorPanel from '../../components/RFPGeneratorPanel';
import VersionControlPanel from '../../components/VersionControlPanel';
import SmartPricingEngine from '../../components/SmartPricingEngine';
import { TRANSLATIONS } from '../../constants';

type ActivePanel = 'dashboard' | 'rfp' | 'pricing' | 'warning' | 'version';

interface AgencyDashboardProps {
  onLogout: () => void;
}

const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ onLogout }) => {
  const [active, setActive] = useState<ActivePanel>('dashboard');
  const t = TRANSLATIONS.zh;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="h-screen flex">
        {/* Sidebar */}
        <aside className="w-20 bg-slate-900 text-white flex flex-col items-center py-6 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black tracking-tight">
            TC
          </div>
          <div className="flex-1 flex flex-col gap-3 mt-6">
            <NavButton icon={<LayoutDashboard size={20} />} label="儀表板" active={active === 'dashboard'} onClick={() => setActive('dashboard')} />
            <NavButton icon={<FileText size={20} />} label="RFP 需求" active={active === 'rfp'} onClick={() => setActive('rfp')} />
            <NavButton icon={<BarChart3 size={20} />} label="智慧報價" active={active === 'pricing'} onClick={() => setActive('pricing')} />
            <NavButton icon={<ShieldAlert size={20} />} label="反雷資料" active={active === 'warning'} onClick={() => setActive('warning')} />
            <NavButton icon={<GitBranch size={20} />} label="版本控制" active={active === 'version'} onClick={() => setActive('version')} />
          </div>

          <button
            onClick={onLogout}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="登出"
          >
            <LogOut size={20} />
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-hidden">
            {active === 'dashboard' && <AdminDashboard t={t} />}
            {active === 'rfp' && <RFPGeneratorPanel userRole="agency" />}
            {active === 'pricing' && (
              <div className="h-full">
                <SmartPricingEngine
                  initialData={{
                    destination: '日本東京',
                    duration: 5,
                    baseCost: 28000,
                    sellingPrice: 42900,
                    paxCount: 30,
                    fixedCosts: 50000
                  }}
                />
              </div>
            )}
            {active === 'warning' && <WarningDatabasePanel />}
            {active === 'version' && (
              <VersionControlPanel
                entityType="itinerary"
                entityId="itin-1"
                entityName="東京輕奢5日 - 台積電福委會"
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all group ${
      active ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
    title={label}
  >
    {icon}
  </button>
);

export default AgencyDashboard;
