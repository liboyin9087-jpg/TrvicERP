import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, Link, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, LayoutDashboard, Calendar, Map, Users, CreditCard, FileText,
  MessageCircle, LogOut, Menu, Bell, Search, Settings,
  Calculator, Shield, Activity, Receipt, Sparkles, Building2, ChevronLeft, X, Briefcase, Loader2
} from 'lucide-react';
import { cn } from './src/lib/utils';

// Zustand Store
import { useAppStore, type UserRole } from './src/store/useAppStore';
import { useToastStore } from './src/store/useToastStore';

// Auth (保持靜態引入，因為這是進入點)
import LoginPage from './components/auth/LoginPage';

// Admin Components - 預設首頁保持靜態引入，提升 LCP 速度
import DraggableDashboard from './components/dashboard/DraggableDashboard';
import { useDashboardStore } from './src/store/useDashboardStore';

// Lazy-loaded components (code-split into separate chunks)
const SessionManager = lazy(() => import('./components/admin/SessionManager'));
const WelfareDashboard = lazy(() => import('./components/admin/WelfareDashboard'));
const PaymentMonitor = lazy(() => import('./components/admin/PaymentMonitor'));
const PassportKanban = lazy(() => import('./components/admin/PassportKanban'));
const CostingDashboard = lazy(() => import('./components/admin/CostingDashboard'));

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

const TravelerApp = lazy(() => import('./components/client/TravelerApp'));
const ItineraryView = lazy(() => import('./components/client/ItineraryView'));
const VotingPage = lazy(() => import('./components/client/VotingPage'));
const DigitalBriefing = lazy(() => import('./components/client/DigitalBriefing'));
const TourAddons = lazy(() => import('./components/client/TourAddons'));
const TravelFootprint = lazy(() => import('./components/client/TravelFootprint'));

const TravelWidgetsShowcase = lazy(() => import('./pages/TravelWidgetsShowcase'));
const InteractiveMap = lazy(() => import('./components/shared/InteractiveMap'));
const AICopilotPanel = lazy(() => import('./components/shared/AICopilotPanel'));
const GlassmorphismDemo = lazy(() => import('./pages/GlassmorphismDemo'));

import ErrorBoundary from './components/shared/ErrorBoundary';
import ToastContainer from './components/shared/ToastContainer';
import ClientPortal from './components/portal/ClientPortal';

// ============================================
// Navigation Configuration
// ============================================
interface NavItem {
  id: string;
  path: string;
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
      { id: 'dashboard', path: '/dashboard', label: '儀表板', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'sessions', path: '/sessions', label: '行程管理', icon: <Calendar className="w-5 h-5" /> },
      { id: 'planner', path: '/planner', label: '行程規劃', icon: <Map className="w-5 h-5" /> },
      { id: 'crm', path: '/crm', label: '客戶管理', icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    label: '財務 & 營運',
    items: [
      { id: 'payments', path: '/payments', label: '付款監控', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'costing', path: '/costing', label: '成本分析', icon: <Calculator className="w-5 h-5" /> },
      { id: 'passport', path: '/passport', label: '護照管理', icon: <Shield className="w-5 h-5" /> },
      { id: 'operations', path: '/operations', label: '營運中心', icon: <Activity className="w-5 h-5" /> },
    ],
  },
  {
    label: '業務工具',
    items: [
      { id: 'quotation', path: '/quotation', label: '報價系統', icon: <FileText className="w-5 h-5" /> },
      { id: 'proposal-engine', path: '/proposal-engine', label: '提案引擎', icon: <Sparkles className="w-5 h-5" /> },
      { id: 'insurance', path: '/insurance', label: '保險匯出', icon: <Receipt className="w-5 h-5" /> },
      { id: 'expense', path: '/expense', label: '費用管理', icon: <Briefcase className="w-5 h-5" /> },
    ],
  },
];

const WELFARE_NAV: NavGroup[] = [
  {
    label: '福委會',
    items: [
      { id: 'welfare', path: '/welfare', label: '福委儀表板', icon: <Building2 className="w-5 h-5" /> },
      { id: 'sessions', path: '/sessions', label: '活動管理', icon: <Calendar className="w-5 h-5" /> },
      { id: 'corporate-crm', path: '/corporate-crm', label: '企業 CRM', icon: <Users className="w-5 h-5" /> },
    ],
  },
];

const CLIENT_NAV: NavGroup[] = [
  {
    label: '我的旅程',
    items: [
      { id: 'traveler', path: '/traveler', label: '旅遊應用', icon: <Plane className="w-5 h-5" /> },
      { id: 'itinerary', path: '/itinerary', label: '行程檢視', icon: <Map className="w-5 h-5" /> },
      { id: 'voting', path: '/voting', label: '行程投票', icon: <MessageCircle className="w-5 h-5" /> },
      { id: 'briefing', path: '/briefing', label: '數位手冊', icon: <FileText className="w-5 h-5" /> },
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
// Wrapper Components
// ============================================
function DraggableDashboardWrapper() {
  const userRole = useAppStore((state) => state.userRole);
  const userName = useAppStore((state) => state.userName);
  const {
    widgets,
    isEditMode,
    selectedWidgetId,
    lastSavedAt,
    availableWidgets,
    setEditMode,
    setSelectedWidgetId,
    applyLayout,
    removeWidget,
    addWidgetByType,
    saveLayout,
    discardChanges,
    resetToDefault,
  } = useDashboardStore();

  const canEdit = userRole === 'admin' || userRole === 'staff';

  return (
    <DraggableDashboard
      userRole={userRole}
      userName={userName}
      widgets={widgets}
      isEditMode={isEditMode}
      selectedWidgetId={selectedWidgetId}
      lastSavedAt={lastSavedAt ? new Date(lastSavedAt) : null}
      canEdit={canEdit}
      availableWidgets={availableWidgets}
      onSetEditMode={setEditMode}
      onSetSelectedWidgetId={setSelectedWidgetId}
      onApplyLayout={applyLayout}
      onRemoveWidget={removeWidget}
      onAddWidgetByType={addWidgetByType}
      onSaveLayout={saveLayout}
      onDiscardChanges={discardChanges}
      onResetToDefault={resetToDefault}
    />
  );
}

function ClientPortalWrapper() {
  const { addToast } = useToastStore();

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    addToast({ message, type });
  };

  return (
    <ClientPortal
      employees={[]}
      documents={[]}
      companyName="示例公司"
      tripName="示例行程"
      briefingDate="2025/03/10 (一)"
      briefingTime="10:00"
      briefingLocation="Microsoft Teams"
      briefingNotes="連結已寄送"
      briefingCollectionLocation="桃園機場第一航廈"
      briefingCollectionTime="集合時間 05:30"
      briefingCollectionNotes="請攜帶護照"
      loginHelpText="系統會將登入連結寄送到您的信箱"
      portalTitle="客戶入口"
      portalSubtitle="歡迎使用"
      onLoginSuccess={(msg) => showToast(msg, 'success')}
      onLoginError={(msg) => showToast(msg, 'error')}
      onInfoMessage={(msg) => showToast(msg, 'info')}
      onLogout={() => showToast('已登出', 'info')}
    />
  );
}

// ============================================
// Loading Fallback
// ============================================
const PageLoader = () => (
  <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    <span className="text-sm font-medium">載入模組中...</span>
  </div>
);

// ============================================
// FloatingSidebar Component — 改用 React Router <Link>
// ============================================
function FloatingSidebar() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const userRole = useAppStore((state) => state.userRole);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = getNavGroups(userRole);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
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
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    isActive(item.path)
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
                </Link>
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
  );
}

// ============================================
// GlassHeader Component
// ============================================
function GlassHeader() {
  const userName = useAppStore((state) => state.userName);
  const userRole = useAppStore((state) => state.userRole);
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>

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

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
          </button>
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
// MobileMenu Component — 改用 React Router <Link>
// ============================================
function MobileMenu() {
  const isMobileMenuOpen = useAppStore((state) => state.isMobileMenuOpen);
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen);
  const userRole = useAppStore((state) => state.userRole);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = getNavGroups(userRole);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-gray-900/98 via-gray-900/98 to-black/98 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto"
          >
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

            <nav className="p-3 space-y-6">
              {navGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-400 border border-brand-500/30'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

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
// Protected Layout — 使用 React Router <Outlet>
// ============================================
function ProtectedLayout() {
  const [isAICopilotOpen, setIsAICopilotOpen] = React.useState(false);
  const userRole = useAppStore((state) => state.userRole);
  const userId = useAppStore((state) => state.userId);

  return (
    <div className="flex h-screen overflow-hidden" data-role={userRole}>
      <FloatingSidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <GlassHeader />
        <main className="flex-1 p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileMenu />
      <Suspense fallback={null}>
        <AICopilotPanel
          isOpen={isAICopilotOpen}
          onToggle={() => setIsAICopilotOpen(!isAICopilotOpen)}
          userRole={userRole}
          userId={userId}
        />
      </Suspense>
    </div>
  );
}

// ============================================
// Auth Guard Components
// ============================================
function AuthRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  return !isLoggedIn ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function ProtectedRoute() {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  return isLoggedIn ? <ProtectedLayout /> : <Navigate to="/login" replace />;
}

// ============================================
// Main App — 真正的 URL 路由
// ============================================
function App() {
  const login = useAppStore((state) => state.login);
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const handleLogin = (role: 'staff' | 'welfare' | 'traveler', userId?: string, userName?: string) => {
    login(role, userId, userName);
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <AuthRoute>
              <LoginPage onLogin={handleLogin} />
            </AuthRoute>
          } />
          <Route path="/demo" element={<Suspense fallback={<PageLoader />}><GlassmorphismDemo /></Suspense>} />
          <Route path="/travel-showcase" element={<Suspense fallback={<PageLoader />}><TravelWidgetsShowcase /></Suspense>} />
          <Route path="/portal" element={<Suspense fallback={<PageLoader />}><ClientPortalWrapper /></Suspense>} />

          {/* Protected Routes — 嵌套路由，使用 <Outlet> 渲染子路由 */}
          <Route element={<ProtectedRoute />}>
            {/* 首頁重導到 /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DraggableDashboardWrapper />} />

            {/* 核心管理 */}
            <Route path="sessions" element={<SessionManager />} />
            <Route path="planner" element={<VisualPlanner />} />
            <Route path="crm" element={<CustomerCDP />} />
            <Route path="builder" element={<ItineraryBuilder />} />

            {/* 財務 & 營運 */}
            <Route path="payments" element={<PaymentMonitor />} />
            <Route path="costing" element={<CostingDashboard />} />
            <Route path="passport" element={<PassportKanban />} />
            <Route path="operations" element={<OperationHub />} />

            {/* 業務工具 */}
            <Route path="quotation" element={<QuotationBuilder />} />
            <Route path="proposal-engine" element={<ProposalEngine />} />
            <Route path="insurance" element={<InsuranceExport />} />
            <Route path="expense" element={<LeaderExpenseApp />} />
            <Route path="chat" element={<LineChatMonitor />} />
            <Route path="estimator" element={<MiniTourEstimator />} />
            <Route path="map" element={<InteractiveMap />} />

            {/* 福委會 */}
            <Route path="welfare" element={<WelfareDashboard />} />
            <Route path="corporate-crm" element={<CorporateCRM />} />
            <Route path="client-portal" element={<ClientPortalWrapper />} />

            {/* 旅客端 */}
            <Route path="traveler" element={<TravelerApp />} />
            <Route path="itinerary" element={<ItineraryView />} />
            <Route path="voting" element={<VotingPage />} />
            <Route path="briefing" element={<DigitalBriefing />} />
            <Route path="addons" element={<TourAddons />} />
            <Route path="footprint" element={<TravelFootprint />} />
          </Route>

          {/* Catch-all: 未登入→登入頁，已登入→儀表板 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
