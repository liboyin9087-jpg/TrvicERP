import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, LayoutDashboard, Calendar, Map, Users, CreditCard, FileText,
  MessageCircle, LogOut, Menu, Bell, Layers, Search, Settings,
  Calculator, Shield, Activity, Receipt, Sparkles, Building2, ChevronLeft, X, Briefcase, Loader2
} from 'lucide-react';
import { cn } from './src/lib/utils';

// Zustand Store
import { useAppStore, type ViewKey, type UserRole } from './src/store/useAppStore';

// Auth (保持靜態引入，因為這是進入點)
import LoginPage from './components/auth/LoginPage';

// Admin Components - 預設首頁保持靜態引入，提升 LCP 速度
import DraggableDashboard from './components/dashboard/DraggableDashboard';

// 🔄 [優化重點] 其他所有組件改為懶加載 (Lazy Load)
// 這樣打包時，這些檔案會被切分成獨立的 chunk，不會全部塞進 index.js
const SessionManager = lazy(() => import('./components/admin/SessionManager'));
const WelfareDashboard = lazy(() => import('./components/admin/WelfareDashboard'));
const PaymentMonitor = lazy(() => import('./components/admin/PaymentMonitor'));
const PassportKanban = lazy(() => import('./components/admin/PassportKanban'));
const CostingDashboard = lazy(() => import('./components/admin/CostingDashboard'));

// Staff Components
const VisualPlanner = lazy(() => import('./components/staff/VisualPlanner'));
const CustomerCDP = lazy(() => import('./components/staff/CustomerCDP'));
const CorporateCRM = lazy(() => import('./components/staff/CorporateCRM'));
const InsuranceExport = lazy(() => import('./components/staff/InsuranceExport'));
const QuotationBuilder = lazy(() => import('./components/staff/QuotationBuilder'));
const OperationHub = lazy(() => import('./components/staff/OperationHub'));
const LeaderExpenseApp = lazy(() => import('./components/staff/LeaderExpenseApp'));
const LineChatMonitor = lazy(() => import('./components/staff/LineChatMonitor'));
const MiniTourEstimator = lazy(() => import('./components/staff/MiniTourEstimator'));
const ItineraryBuilder = lazy(() => import('./components/staff/ItineraryBuilder'));
const ProposalEngine = lazy(() => import('./components/staff/ProposalEngine'));

// Client Components
const TravelerApp = lazy(() => import('./components/client/TravelerApp'));
const ItineraryView = lazy(() => import('./components/client/ItineraryView'));
const VotingPage = lazy(() => import('./components/client/VotingPage'));
const DigitalBriefing = lazy(() => import('./components/client/DigitalBriefing'));
const TourAddons = lazy(() => import('./components/client/TourAddons'));
const TravelFootprint = lazy(() => import('./components/client/TravelFootprint'));

// Shared Components
const EdgeAssistant = lazy(() => import('./components/shared/EdgeAssistant'));
const InteractiveMap = lazy(() => import('./components/shared/InteractiveMap'));
const LegalAssistant = lazy(() => import('./components/shared/LegalAssistant'));
const AICopilotPanel = lazy(() => import('./components/shared/AICopilotPanel'));
// ErrorBoundary, ToastContainer, ViewSwitcher 保持靜態，因為它們是全域共用的
import ErrorBoundary from './components/shared/ErrorBoundary';
import ToastContainer from './components/shared/ToastContainer';
import ViewSwitcher from './components/shared/ViewSwitcher';
import LandingPage from './components/shared/LandingPage';
import ClientPortal from './components/portal/ClientPortal';

// Glassmorphism Demo
const GlassmorphismDemo = lazy(() => import('./pages/GlassmorphismDemo'));

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
    label: '核心管理',
    items: [
      { id: 'dashboard', label: '儀表板', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'sessions', label: '行程管理', icon: <Calendar className="w-5 h-5" /> },
      { id: 'planner', label: '行程規劃', icon: <Map className="w-5 h-5" /> },
      { id: 'crm', label: '客戶管理', icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    label: '財務 & 營運',
    items: [
      { id: 'payments', label: '付款監控', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'costing', label: '成本分析', icon: <Calculator className="w-5 h-5" /> },
      { id: 'passport', label: '護照管理', icon: <Shield className="w-5 h-5" /> },
      { id: 'operations', label: '營運中心', icon: <Activity className="w-5 h-5" /> },
    ],
  },
  {
    label: '業務工具',
    items: [
      { id: 'quotation', label: '報價系統', icon: <FileText className="w-5 h-5" /> },
      { id: 'proposal-engine', label: '提案引擎', icon: <Sparkles className="w-5 h-5" /> },
      { id: 'insurance', label: '保險匯出', icon: <Receipt className="w-5 h-5" /> },
      { id: 'expense', label: '費用管理', icon: <Briefcase className="w-5 h-5" /> },
    ],
  },
];

const WELFARE_NAV: NavGroup[] = [
  {
    label: '福委會',
    items: [
      { id: 'welfare', label: '福委儀表板', icon: <Building2 className="w-5 h-5" /> },
      { id: 'sessions', label: '活動管理', icon: <Calendar className="w-5 h-5" /> },
      { id: 'corporate-crm', label: '企業 CRM', icon: <Users className="w-5 h-5" /> },
    ],
  },
];

const CLIENT_NAV: NavGroup[] = [
  {
    label: '我的旅程',
    items: [
      { id: 'traveler', label: '旅遊應用', icon: <Plane className="w-5 h-5" /> },
      { id: 'itinerary', label: '行程檢視', icon: <Map className="w-5 h-5" /> },
      { id: 'voting', label: '行程投票', icon: <MessageCircle className="w-5 h-5" /> },
      { id: 'briefing', label: '數位手冊', icon: <FileText className="w-5 h-5" /> },
    ],
  },
];

function getNavGroups(role: UserRole): NavGroup[] {
  switch (role) {
    case 'staff':
      return STAFF_NAV;
    case 'welfare':
      return WELFARE_NAV;
    case 'traveler':
      return CLIENT_NAV;
    default:
      return STAFF_NAV;
  }
}

// ============================================
// Component Map (新增：策略模式)
// ============================================
// 這裡將 ViewKey 對應到組件，消除巨大的 Switch Case
const VIEW_COMPONENTS: Record<string, React.LazyExoticComponent<any> | React.ComponentType<any>> = {
  'dashboard': DraggableDashboard, // 靜態
  'sessions': SessionManager,
  'planner': VisualPlanner,
  'builder': ItineraryBuilder,
  'crm': CustomerCDP,
  'corporate-crm': CorporateCRM,
  'payments': PaymentMonitor,
  'passport': PassportKanban,
  'costing': CostingDashboard,
  'insurance': InsuranceExport,
  'quotation': QuotationBuilder,
  'proposal-engine': ProposalEngine,
  'client-portal': ClientPortal,
  'operations': OperationHub,
  'expense': LeaderExpenseApp,
  'chat': LineChatMonitor,
  'estimator': MiniTourEstimator,
  'map': InteractiveMap,
  'welfare': WelfareDashboard,
  'traveler': TravelerApp,
  'itinerary': ItineraryView,
  'voting': VotingPage,
  'briefing': DigitalBriefing,
  'addons': TourAddons,
  'footprint': TravelFootprint
};

// ============================================
// Loading Fallback (新增)
// ============================================
const PageLoader = () => (
  <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    <span className="text-sm font-medium">載入模組中...</span>
  </div>
);

// ============================================
// View Renderer Component (優化版)
// ============================================

function ViewRenderer({ view }: { view: ViewKey }) {
  // 從 Map 中查找組件，找不到則預設顯示 Dashboard
  const Component = VIEW_COMPONENTS[view] || DraggableDashboard;

  return (
    // Suspense 是 React 懶加載必備的，當組件還在下載時顯示 fallback
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// ============================================
// FloatingSidebar Component
// ============================================
function FloatingSidebar() {
  // Note: Using individual selectors instead of combined object selector
  // to avoid unnecessary re-renders caused by object reference changes
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const userRole = useAppStore((state) => state.userRole);
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();

  const navGroups = getNavGroups(userRole);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 280 : 80,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        }}
        className="hidden lg:flex flex-col bg-gradient-to-b from-gray-900/95 via-gray-900/98 to-black/95 backdrop-blur-xl border-r border-white/10 h-screen sticky top-0"
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">TravelMaster</div>
                  <div className="text-xs text-gray-400">{userRole === 'staff' ? '管理端' : userRole === 'welfare' ? '福委會' : '員工端'}</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto"
              >
                <Plane className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <AnimatePresence mode="wait">
                {isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {group.label}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      currentView === item.id
                        ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-400 border border-brand-500/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {item.icon}
                    <AnimatePresence mode="wait">
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-white/10">
          <motion.button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
            {isSidebarOpen && <span className="text-sm font-medium">收起側欄</span>}
          </motion.button>
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-white/10">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">登出</span>}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}

// ============================================
// GlassHeader Component
// ============================================
function GlassHeader() {
  // Note: Using individual selectors to prevent unnecessary re-renders
  const userName = useAppStore((state) => state.userName);
  const userRole = useAppStore((state) => state.userRole);
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-semibold">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">{userName || '用戶'}</div>
              <div className="text-xs text-gray-400">{userRole === 'staff' ? '管理員' : userRole === 'welfare' ? '福委會' : '員工'}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================
// MobileMenu Component
// ============================================
function MobileMenu() {
  // Note: Using individual selectors to avoid re-render issues from object creation
  const isMobileMenuOpen = useAppStore((state) => state.isMobileMenuOpen);
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen);
  const userRole = useAppStore((state) => state.userRole);
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();

  const navGroups = getNavGroups(userRole);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Menu */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-gray-900/98 via-gray-900/98 to-black/98 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">TravelMaster</div>
                  <div className="text-xs text-gray-400">{userRole === 'staff' ? '管理端' : userRole === 'welfare' ? '福委會' : '員工端'}</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-6">
              {navGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                          currentView === item.id
                            ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-400 border border-brand-500/30'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-white/10 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">登出</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// AppContent Component
// ============================================
function AppContent() {
  const currentView = useAppStore((state) => state.currentView);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <GlassHeader />
      <main className="flex-1 p-6">
        <ViewRenderer view={currentView} />
      </main>
    </div>
  );
}

// ============================================
// Main App Component
// ============================================

// Protected Layout
function ProtectedLayout() {
  const [isAICopilotOpen, setIsAICopilotOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <FloatingSidebar />
      <AppContent />
      <MobileMenu />
      {/* AI Copilot Panel */}
      <Suspense fallback={null}>
        <AICopilotPanel
          isOpen={isAICopilotOpen}
          onToggle={() => setIsAICopilotOpen(!isAICopilotOpen)}
        />
      </Suspense>
    </div>
  );
}

// Auth Routes
function AuthRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  return !isLoggedIn ? <>{children}</> : <Navigate to="/" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const login = useAppStore((state) => state.login);

  const handleLogin = (role: 'staff' | 'welfare' | 'traveler', userId?: string, userName?: string) => {
    login(role, userId, userName);
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastContainer />
        <Routes>
          {/* Login Page */}
          <Route path="/login" element={
            <AuthRoute>
              <LoginPage onLogin={handleLogin} />
            </AuthRoute>
          } />

          {/* Demo Page - Public */}
          <Route path="/demo" element={
            <Suspense fallback={<PageLoader />}>
              <GlassmorphismDemo />
            </Suspense>
          } />

          {/* Client Portal - Public */}
          <Route path="/portal" element={
            <Suspense fallback={<PageLoader />}>
              <ClientPortal />
            </Suspense>
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
