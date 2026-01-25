import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, LayoutDashboard, Calendar, Map, Users, CreditCard, FileText,
  MessageCircle, LogOut, Menu, Bell, Layers, Search, Settings,
  Calculator, Shield, Activity, Receipt, Sparkles, Building2, ChevronLeft, X, Briefcase
} from 'lucide-react';
import { cn } from './src/lib/utils';

// Zustand Store
import { useAppStore, type ViewKey, type UserRole } from './src/store/useAppStore';

// Auth
import LoginPage from './components/auth/LoginPage';

// Admin Components
import SessionManager from './components/admin/SessionManager';
import WelfareDashboard from './components/admin/WelfareDashboard';
import PaymentMonitor from './components/admin/PaymentMonitor';
import PassportKanban from './components/admin/PassportKanban';
import CostingDashboard from './components/admin/CostingDashboard';
import DraggableDashboard from './components/dashboard/DraggableDashboard';

// Staff Components
import VisualPlanner from './components/staff/VisualPlanner';
import CustomerCDP from './components/staff/CustomerCDP';
import CorporateCRM from './components/staff/CorporateCRM';
import InsuranceExport from './components/staff/InsuranceExport';
import QuotationBuilder from './components/staff/QuotationBuilder';
import OperationHub from './components/staff/OperationHub';
import LeaderExpenseApp from './components/staff/LeaderExpenseApp';
import LineChatMonitor from './components/staff/LineChatMonitor';
import MiniTourEstimator from './components/staff/MiniTourEstimator';
import ItineraryBuilder from './components/staff/ItineraryBuilder';
import ProposalEngine from './components/staff/ProposalEngine';

// Client Components
import TravelerApp from './components/client/TravelerApp';
import ItineraryView from './components/client/ItineraryView';
import VotingPage from './components/client/VotingPage';
import DigitalBriefing from './components/client/DigitalBriefing';
import TourAddons from './components/client/TourAddons';
import TravelFootprint from './components/client/TravelFootprint';

// Shared Components
import EdgeAssistant from './components/shared/EdgeAssistant';
import InteractiveMap from './components/shared/InteractiveMap';
import LegalAssistant from './components/shared/LegalAssistant';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ToastContainer from './components/shared/ToastContainer';
import ViewSwitcher from './components/shared/ViewSwitcher';
import LandingPage from './components/shared/LandingPage';
import ClientPortal from './components/portal/ClientPortal';

// Glassmorphism Demo
import GlassmorphismDemo from './pages/GlassmorphismDemo';

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
    label: '總覽',
    items: [
      { id: 'dashboard', label: '營運儀表板', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'operations', label: '營運中心', icon: <Activity className="w-5 h-5" /> },
    ],
  },
  {
    label: '旅程管理',
    items: [
      { id: 'sessions', label: '團次管理', icon: <Calendar className="w-5 h-5" /> },
      { id: 'planner', label: '行程規劃', icon: <Map className="w-5 h-5" /> },
      { id: 'builder', label: '行程配置器', icon: <Layers className="w-5 h-5" /> },
      { id: 'passport', label: '護照管理', icon: <FileText className="w-5 h-5" /> },
    ],
  },
  {
    label: '客戶關係',
    items: [
      { id: 'crm', label: '客戶管理', icon: <Users className="w-5 h-5" /> },
      { id: 'client-portal', label: '企業入口', icon: <Building2 className="w-5 h-5" /> },
      { id: 'corporate-crm', label: '企業 CRM', icon: <Briefcase className="w-5 h-5" /> },
      { id: 'payments', label: '收款管理', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'chat', label: 'LINE 客服', icon: <MessageCircle className="w-5 h-5" /> },
    ],
  },
  {
    label: '業務工具',
    items: [
      { id: 'proposal-engine', label: 'AI 提案', icon: <FileText className="w-5 h-5" /> },
      { id: 'quotation', label: '報價計算', icon: <Calculator className="w-5 h-5" /> },
      { id: 'estimator', label: '快速估價', icon: <Sparkles className="w-5 h-5" /> },
      { id: 'costing', label: '成本分析', icon: <Receipt className="w-5 h-5" /> },
      { id: 'insurance', label: '保險管理', icon: <Shield className="w-5 h-5" /> },
      { id: 'expense', label: '領隊報帳', icon: <Receipt className="w-5 h-5" /> },
    ],
  },
];

const WELFARE_NAV: NavGroup[] = [
  {
    label: '福委專區',
    items: [
      { id: 'welfare', label: '活動管理', icon: <Building2 className="w-5 h-5" /> },
      { id: 'sessions', label: '行程瀏覽', icon: <Calendar className="w-5 h-5" /> },
    ],
  },
];

const CLIENT_NAV: NavGroup[] = [
  {
    label: '旅客功能',
    items: [
      { id: 'traveler', label: '我的行程', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'itinerary', label: '行程表', icon: <Calendar className="w-5 h-5" /> },
      { id: 'voting', label: '投票', icon: <Users className="w-5 h-5" /> },
      { id: 'briefing', label: '行前說明', icon: <FileText className="w-5 h-5" /> },
      { id: 'addons', label: '加購項目', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'footprint', label: '旅遊足跡', icon: <Map className="w-5 h-5" /> },
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
  open: { width: 280, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  closed: { width: 80, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ============================================
// View Renderer Component
// ============================================

function ViewRenderer({ view }: { view: ViewKey }) {
  switch (view) {
    // Admin/Staff Views
    case 'dashboard': return <DraggableDashboard />;
    case 'sessions': return <SessionManager />;
    case 'planner': return <VisualPlanner />;
    case 'builder': return <ItineraryBuilder />;
    case 'crm': return <CustomerCDP />;
    case 'corporate-crm': return <CorporateCRM />;
    case 'payments': return <PaymentMonitor />;
    case 'passport': return <PassportKanban />;
    case 'costing': return <CostingDashboard />;
    case 'insurance': return <InsuranceExport />;
    case 'quotation': return <QuotationBuilder />;
    case 'proposal-engine': return <ProposalEngine />;
    case 'client-portal': return <ClientPortal initialAuthenticated />;
    case 'operations': return <OperationHub />;
    case 'expense': return <LeaderExpenseApp />;
    case 'chat': return <LineChatMonitor />;
    case 'estimator': return <MiniTourEstimator />;
    case 'map': return <InteractiveMap />;
    case 'welfare': return <WelfareDashboard />;
    // Client Views
    case 'traveler': return <TravelerApp />;
    case 'itinerary': return <ItineraryView />;
    case 'voting': return <VotingPage />;
    case 'briefing': return <DigitalBriefing />;
    case 'addons': return <TourAddons />;
    case 'footprint': return <TravelFootprint />;
    default: return <DraggableDashboard />;
  }
}

// ============================================
// Floating Sidebar Component
// ============================================

interface FloatingSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  navGroups: NavGroup[];
  onLogout: () => void;
  userRole: UserRole;
}

function FloatingSidebar({
  isOpen,
  onToggle,
  currentView,
  onNavigate,
  navGroups,
  onLogout,
  userRole,
}: FloatingSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      className="fixed left-4 top-4 bottom-4 z-50 floating-sidebar flex flex-col overflow-hidden"
    >
      {/* Logo Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30"
          >
            <Plane className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-bold text-lg text-white">TravelMaster</h1>
                <p className="text-[11px] text-gray-400 font-medium">Enterprise v2.0</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', !isOpen && 'rotate-180')} />
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-5">
            <AnimatePresence>
              {isOpen && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const isActive = currentView === item.id;
                return (
                  <motion.button
                    key={item.id}
                    variants={navItemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: itemIdx * 0.05 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      'nav-item-glow w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      isActive && 'active',
                      !isActive && 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-brand-400' : 'text-gray-400'
                    )}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            'font-medium text-sm whitespace-nowrap',
                            isActive ? 'text-white' : 'text-gray-300'
                          )}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/5">
        {/* User Profile */}
        <div className={cn('flex items-center gap-3 mb-3', !isOpen && 'justify-center')}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {userRole === 'staff' ? '職' : userRole === 'welfare' ? '福' : '客'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">系統管理員</p>
                <p className="text-xs text-gray-400">
                  {userRole === 'staff' ? '員工' : userRole === 'welfare' ? '福委' : '旅客'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all',
            !isOpen && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium text-sm"
              >
                登出系統
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}

// ============================================
// Glass Header Component
// ============================================

interface GlassHeaderProps {
  onMobileMenuOpen: () => void;
  currentView: ViewKey;
  showViewSwitcher?: boolean;
}

function GlassHeader({ onMobileMenuOpen, currentView, showViewSwitcher = false }: GlassHeaderProps) {
  // Get current view title
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
    <header className="h-16 glass-panel border-b-0 rounded-none flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2.5 hover:bg-black/5 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </motion.button>

        <div className="hidden lg:flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            {viewTitles[currentView] || 'Dashboard'}
          </h2>
          <span className="px-2 py-1 bg-brand-50 text-brand-600 text-xs font-medium rounded-full">
            即時同步
          </span>
        </div>

        {/* View Mode Switcher */}
        {showViewSwitcher && (
          <ViewSwitcher className="hidden md:flex" />
        )}

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-gray-200/50">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋功能或資料..."
            className="bg-transparent border-none outline-none text-sm text-gray-600 placeholder-gray-400 w-48"
          />
          <kbd className="hidden lg:inline-flex px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700">系統正常</span>
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 hover:bg-black/5 rounded-xl transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 hover:bg-black/5 rounded-xl transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>
    </header>
  );
}

// ============================================
// Mobile Menu Component
// ============================================

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  navGroups: NavGroup[];
  onLogout: () => void;
}

function MobileMenu({ isOpen, onClose, currentView, onNavigate, navGroups, onLogout }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900 z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white">TravelMaster</h1>
                  <p className="text-xs text-gray-400">Enterprise v2.0</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="mb-6">
                  <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            onClose();
                          }}
                          className={cn(
                            'nav-item-glow w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                            isActive && 'active',
                            !isActive && 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          <span className={isActive ? 'text-brand-400' : 'text-gray-400'}>
                            {item.icon}
                          </span>
                          <span className={cn('font-medium text-sm', isActive ? 'text-white' : 'text-gray-300')}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">登出系統</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Main App Content (inside Router)
// ============================================

function AppContent() {
  const location = useLocation();

  // Zustand store - all state management centralized
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

  // Handle login from LoginPage
  const handleLogin = (role: UserRole, userId?: string, userName?: string) => {
    login(role, userId, userName);
  };

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const navGroups = getNavGroups(userRole);

  // Determine current view mode from URL
  const isProposalMode = location.pathname.startsWith('/proposal');
  const isLineMode = location.pathname.startsWith('/line');
  const showViewSwitcher = userRole === 'staff';

  // Mobile client view (simplified layout)
  if (userRole === 'traveler') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Traveler Header with Logout */}
          <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">TravelMaster</h1>
                <p className="text-xs text-gray-500">員工旅遊平台</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">登出</span>
            </motion.button>
          </header>
          <ViewRenderer view={currentView} />
          <EdgeAssistant />
          <LegalAssistant />
        </div>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Proposal Mode - Clean presentation view
  if (isProposalMode) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Minimal Header for Proposal Mode */}
          <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">TravelMaster</h1>
                <p className="text-xs text-gray-500">提案預覽模式</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </header>

          {/* Proposal Content */}
          <main className="max-w-6xl mx-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">行程提案書</h2>
                <p className="text-gray-500">專業旅遊規劃 · 用心服務</p>
              </div>
              <ViewRenderer view={currentView} />
            </motion.div>
          </main>
        </div>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // LINE Mode - Chat-style presentation
  if (isLineMode) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-[#7494A5]">
          {/* LINE Style Header */}
          <header className="h-14 bg-[#00B900] flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-white" />
              <h1 className="font-bold text-white">旅遊行程對話</h1>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher className="!bg-white/20 [&_button]:!text-white" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </header>

          {/* LINE Style Content */}
          <main className="max-w-lg mx-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Welcome Message Bubble */}
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Plane className="w-5 h-5 text-[#00B900]" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-[80%] shadow-sm">
                  <p className="text-gray-800 text-sm">歡迎使用 LINE 風格預覽！</p>
                  <p className="text-gray-500 text-xs mt-1">這個模式適合分享給客戶查看行程</p>
                </div>
              </div>

              {/* Content Bubble */}
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Plane className="w-5 h-5 text-[#00B900]" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-sm">
                  <ViewRenderer view={currentView} />
                </div>
              </div>
            </motion.div>
          </main>
        </div>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  // Default Edit Mode - Desktop/Tablet layout with floating sidebar
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex">
        {/* Floating Sidebar - Desktop */}
        <div className="hidden lg:block">
          <FloatingSidebar
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
          animate={{
            marginLeft: isSidebarOpen ? 296 : 96, // 280 + 16 or 80 + 16
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col min-w-0 lg:mr-4 lg:my-4"
        >
          {/* Glass Header */}
          <div className="lg:rounded-t-2xl overflow-hidden">
            <GlassHeader
              onMobileMenuOpen={() => setMobileMenuOpen(true)}
              currentView={currentView}
              showViewSwitcher={showViewSwitcher}
            />
          </div>

          {/* Content */}
          <motion.main
            key={currentView}
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            className="flex-1 overflow-auto lg:glass-panel lg:rounded-b-2xl lg:border-t-0"
          >
            <ViewRenderer view={currentView} />
          </motion.main>
        </motion.div>

        {/* AI Assistant */}
        <EdgeAssistant />

        {/* Legal Assistant Chatbot */}
        <LegalAssistant />
      </div>
      <ToastContainer />
    </ErrorBoundary>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);

  React.useEffect(() => {
    // Ensure a clean state when accessing the standalone login route.
    logout();
  }, [logout]);

  const handleLogin = (role: UserRole, userId?: string, userName?: string) => {
    login(role, userId, userName);
    navigate('/');
  };

  return <LoginPage onLogin={handleLogin} />;
}

// ============================================
// Main App Component with Router
// ============================================

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/portal/*" element={<ClientPortal />} />
        <Route path="/glass" element={<GlassmorphismDemo />} />
        <Route path="/*" element={<AppContent />} />
        <Route path="/proposal/*" element={<AppContent />} />
        <Route path="/line/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
