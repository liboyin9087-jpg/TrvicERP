import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, LayoutDashboard, Calendar, Map, Users, CreditCard, FileText,
  MessageCircle, LogOut, Menu, Bell, Layers, Search, Settings,
  Calculator, Shield, Activity, Receipt, Sparkles, Building2, ChevronLeft, X,
  Command
} from 'lucide-react';
import { cn } from './src/lib/utils';

// Zustand Store
import { useAppStore, type ViewKey, type UserRole } from './src/store/useAppStore';

// Auth - Keep synchronous for initial load
import LoginPage from './components/auth/LoginPage';

// Shared Components
import ErrorBoundary from './components/shared/ErrorBoundary';
import ToastContainer from './components/shared/ToastContainer';
import { ViewSwitcher } from './components/shared/ViewSwitcher';
import { Loading } from './components/shared/Loading';

// Lazy load components
const ERPInsights = lazy(() => import('./components/admin/ERPInsights'));
const SessionManager = lazy(() => import('./components/admin/SessionManager'));
const WelfareDashboard = lazy(() => import('./components/admin/WelfareDashboard'));
const PaymentMonitor = lazy(() => import('./components/admin/PaymentMonitor'));
const PassportKanban = lazy(() => import('./components/admin/PassportKanban'));
const CostingDashboard = lazy(() => import('./components/admin/CostingDashboard'));

const VisualPlanner = lazy(() => import('./components/staff/VisualPlanner'));
const CustomerCDP = lazy(() => import('./components/staff/CustomerCDP'));
const InsuranceExport = lazy(() => import('./components/staff/InsuranceExport'));
const QuotationBuilder = lazy(() => import('./components/staff/QuotationBuilder'));
const OperationHub = lazy(() => import('./components/staff/OperationHub'));
const LeaderExpenseApp = lazy(() => import('./components/staff/LeaderExpenseApp'));
const LineChatMonitor = lazy(() => import('./components/staff/LineChatMonitor'));
const MiniTourEstimator = lazy(() => import('./components/staff/MiniTourEstimator'));
const ItineraryBuilder = lazy(() => import('./components/staff/ItineraryBuilder'));

const TravelerApp = lazy(() => import('./components/client/TravelerApp'));
const ItineraryView = lazy(() => import('./components/client/ItineraryView'));
const VotingPage = lazy(() => import('./components/client/VotingPage'));
const DigitalBriefing = lazy(() => import('./components/client/DigitalBriefing'));
const TourAddons = lazy(() => import('./components/client/TourAddons'));
const TravelFootprint = lazy(() => import('./components/client/TravelFootprint'));

// 新增的旅遊管理組件
const TourDemo = lazy(() => import('./src/pages/TourDemo'));
const AICopilotDemo = lazy(() => import('./src/pages/AICopilotDemo'));

// 團體旅遊核心功能 - 暫時註解避免編譯錯誤
// const CustomerPortal = lazy(() => import('./src/modules/tours/components/CustomerPortal'));
// const CRMPipeline = lazy(() => import('./src/modules/tours/components/CRMPipeline'));
// const AdvancedReports = lazy(() => import('./src/modules/tours/components/AdvancedReports'));
// const GroupManagement = lazy(() => import('./src/modules/tours/components/GroupManagement'));
// const FinancialManagement = lazy(() => import('./src/modules/tours/components/FinancialManagement'));

const EdgeAssistant = lazy(() => import('./components/shared/EdgeAssistant'));
const InteractiveMap = lazy(() => import('./components/shared/InteractiveMap'));
const LegalAssistant = lazy(() => import('./components/shared/LegalAssistant'));

// ============================================
// Navigation Configuration
// ============================================

interface NavItem {
  id: ViewKey;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const STAFF_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: '營運儀表板', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'reports', label: '營運報表', icon: <Activity className="w-4 h-4" /> },
      { id: 'tour-management', label: '旅遊管理', icon: <Plane className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Sales',
    items: [
      { id: 'crm-pipeline', label: '銷售管道', icon: <Users className="w-4 h-4" /> },
      { id: 'quotation', label: '報價計算', icon: <Calculator className="w-4 h-4" /> },
      { id: 'crm', label: '客戶管理', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'sessions', label: '團次管理', icon: <Calendar className="w-4 h-4" /> },
      { id: 'group-management', label: '團員管理', icon: <Users className="w-4 h-4" /> },
      { id: 'planner', label: '行程規劃', icon: <Map className="w-4 h-4" /> },
      { id: 'passport', label: '護照管理', icon: <FileText className="w-4 h-4" /> },
      { id: 'ai-copilot', label: 'AI Copilot', icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'financial', label: '財務管理', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'payments', label: '收款管理', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'costing', label: '成本分析', icon: <Receipt className="w-4 h-4" /> },
      { id: 'expense', label: '領隊報帳', icon: <Receipt className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'estimator', label: '快速估價', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'insurance', label: '保險管理', icon: <Shield className="w-4 h-4" /> },
      { id: 'chat', label: 'LINE 客服', icon: <MessageCircle className="w-4 h-4" /> },
    ],
  },
];

const WELFARE_NAV: NavGroup[] = [
  {
    label: 'Welfare',
    items: [
      { id: 'welfare', label: '活動管理', icon: <Building2 className="w-4 h-4" /> },
      { id: 'sessions', label: '行程瀏覽', icon: <Calendar className="w-4 h-4" /> },
    ],
  },
];

const CLIENT_NAV: NavGroup[] = [
  {
    label: 'Traveler',
    items: [
      { id: 'traveler', label: '我的行程', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'itinerary', label: '行程表', icon: <Calendar className="w-4 h-4" /> },
      { id: 'voting', label: '投票', icon: <Users className="w-4 h-4" /> },
      { id: 'briefing', label: '行前說明', icon: <FileText className="w-4 h-4" /> },
      { id: 'addons', label: '加購項目', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'footprint', label: '旅遊足跡', icon: <Map className="w-4 h-4" /> },
    ],
  },
];

const getNavGroups = (role: UserRole): NavGroup[] => {
  switch (role) {
    case 'staff': return STAFF_NAV;
    case 'welfare': return WELFARE_NAV;
    case 'traveler': return CLIENT_NAV;
    default: return STAFF_NAV;
  }
};

// ============================================
// Animation Variants
// ============================================

const sidebarVariants = {
  open: { width: 260, transition: { type: 'spring' as const, stiffness: 400, damping: 40 } },
  closed: { width: 72, transition: { type: 'spring' as const, stiffness: 400, damping: 40 } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ============================================
// Components
// ============================================

function ViewRenderer({ view }: { view: ViewKey }) {
  const renderView = () => {
    switch (view) {
      case 'dashboard': return <ERPInsights />;
      case 'sessions': return <SessionManager />;
      case 'planner': return <VisualPlanner />;
      case 'builder': return <ItineraryBuilder />;
      case 'crm': return <CustomerCDP />;
      case 'payments': return <PaymentMonitor />;
      case 'passport': return <PassportKanban />;
      case 'costing': return <CostingDashboard />;
      case 'insurance': return <InsuranceExport />;
      case 'quotation': return <QuotationBuilder />;
      case 'operations': return <OperationHub />;
      case 'expense': return <LeaderExpenseApp />;
      case 'chat': return <LineChatMonitor />;
      case 'estimator': return <MiniTourEstimator />;
      case 'map': return <InteractiveMap />;
      case 'welfare': return <WelfareDashboard />;
      case 'traveler': return <TravelerApp />;
      case 'itinerary': return <ItineraryView />;
      case 'voting': return <VotingPage />;
      case 'briefing': return <DigitalBriefing />;
      case 'addons': return <TourAddons />;
      case 'footprint': return <TravelFootprint />;
      case 'tour-management': return <TourDemo />;
      case 'ai-copilot': return <AICopilotDemo />;
      // 新增團體旅遊核心功能 - 暫時註解避免編譯錯誤
      // case 'crm-pipeline': return <CRMPipeline />;
      // case 'reports': return <AdvancedReports />;
      // case 'group-management': return <GroupManagement />;
      // case 'financial': return <FinancialManagement />;
      // case 'customer-portal': return <CustomerPortal />;
      default: return <ERPInsights />;
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      {renderView()}
    </Suspense>
  );
}

// ------------------------------------------------------------------
// Modern Sidebar (Linear/Stripe Style)
// ------------------------------------------------------------------
function Sidebar({
  isOpen,
  onToggle,
  currentView,
  onNavigate,
  navGroups,
  onLogout,
  userRole,
}: any) {
  return (
    <motion.aside
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800 shadow-2xl"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <span className="font-bold text-white text-base tracking-tight">TrvicERP</span>
                <span className="text-[10px] text-slate-400 font-medium">Enterprise OS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group: NavGroup, idx: number) => (
          <div key={idx}>
             <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      'group w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 outline-none',
                      isActive 
                        ? 'bg-indigo-500/10 text-indigo-400' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center transition-colors",
                      isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && isOpen && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-950">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <div className={cn("transition-transform duration-300", !isOpen && "rotate-180")}>
            <ChevronLeft className="w-4 h-4" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                收合選單
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        
        <div className="mt-2 pt-2 border-t border-slate-800/50">
           <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
             <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  登出
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

// ------------------------------------------------------------------
// Modern Header (Clean & Minimal)
// ------------------------------------------------------------------
function Header({ onMobileMenuOpen, currentView, showViewSwitcher }: any) {
  const viewTitles: Record<string, string> = {
    dashboard: '營運儀表板',
    sessions: '團次管理',
    planner: '行程規劃',
    builder: '行程配置器',
    crm: '客戶管理',
    payments: '收款管理',
    passport: '護照管理',
    costing: '成本分析',
    insurance: '保險管理',
    quotation: '報價計算',
    operations: '營運中心',
    expense: '領隊報帳',
    chat: 'LINE 客服',
    estimator: '快速估價',
    welfare: '活動管理',
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              {viewTitles[currentView] || 'Dashboard'}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-medium rounded-full">
              Live
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showViewSwitcher && <ViewSwitcher className="hidden md:flex" />}
        
        {/* Search Input */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all w-64">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
          />
          <div className="flex items-center gap-1">
             <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------
// Mobile Menu (Drawer)
// ------------------------------------------------------------------
function MobileMenu({ isOpen, onClose, currentView, onNavigate, navGroups, onLogout }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-slate-950 border-r border-slate-800 z-50 lg:hidden flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
               <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">TrvicERP</span>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
              {navGroups.map((group: NavGroup, idx: number) => (
                <div key={idx}>
                  <p className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium',
                          currentView === item.id 
                            ? 'bg-indigo-500/10 text-indigo-400' 
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">登出系統</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Main App Content
// ============================================

function AppContent() {
  const location = useLocation();
  const {
    isLoggedIn,
    userRole,
    currentView,
    isSidebarOpen,
    isMobileMenuOpen,
    login,
    logout,
    setCurrentView,
    toggleSidebar,
    setMobileMenuOpen,
  } = useAppStore();

  const handleLogin = (role: UserRole, userId?: string, userName?: string) => login(role, userId, userName);

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  const navGroups = getNavGroups(userRole);
  const isProposalMode = location.pathname.startsWith('/proposal');
  const isLineMode = location.pathname.startsWith('/line');

  // Special Modes (Traveler, Proposal, Line) - Keeping simplified layouts
  if (userRole === 'traveler') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50">
          <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-bold text-slate-800 hidden sm:block">TrvicERP</h1>
            </div>
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-500">
              登出
            </button>
          </header>
          <main className="max-w-screen-xl mx-auto">
             <ViewRenderer view={currentView} />
          </main>
           <ToastContainer />
        </div>
      </ErrorBoundary>
    );
  }

  if (isProposalMode || isLineMode) {
    // ... Keeping these modes clean for external sharing
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <ViewRenderer view={currentView} />
        </div>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // ------------------------------------------------------------------
  // Main Desktop Layout (Refactored)
  // ------------------------------------------------------------------
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50/50 flex font-sans text-slate-900">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block z-40">
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
            currentView={currentView}
            onNavigate={setCurrentView}
            navGroups={navGroups}
            onLogout={logout}
            userRole={userRole}
          />
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentView={currentView}
          onNavigate={setCurrentView}
          navGroups={navGroups}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <motion.div
          animate={{ marginLeft: isSidebarOpen ? 260 : 72 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="flex-1 flex flex-col min-w-0 hidden lg:flex"
        >
          <Header
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
            currentView={currentView}
            showViewSwitcher={userRole === 'staff'}
          />
          
          <main className="flex-1 p-6 overflow-auto">
            <motion.div
              key={currentView}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.35, ease: "easeInOut" }
                }
              }}
              className="max-w-[1600px] mx-auto"
            >
              <ViewRenderer view={currentView} />
            </motion.div>
          </main>
        </motion.div>

        {/* Mobile Layout Fallback (No Margin Animation) */}
        <div className="flex-1 flex flex-col min-w-0 lg:hidden">
          <Header
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
            currentView={currentView}
            showViewSwitcher={userRole === 'staff'}
          />
          <main className="flex-1 p-4 overflow-auto">
             <ViewRenderer view={currentView} />
          </main>
        </div>

        {/* Assistants */}
        <Suspense fallback={null}>
          <EdgeAssistant />
          <LegalAssistant />
        </Suspense>
      </div>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}