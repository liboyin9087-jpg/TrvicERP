import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
// ErrorBoundary, ToastContainer, ViewSwitcher 保持靜態，因為它們是全域共用的
import ErrorBoundary from './components/shared/ErrorBoundary';
import ToastContainer from './components/shared/ToastContainer';
import ViewSwitcher from './components/shared/ViewSwitcher';
import LandingPage from './components/shared/LandingPage';
import ClientPortal from './components/portal/ClientPortal';

// Glassmorphism Demo
const GlassmorphismDemo = lazy(() => import('./pages/GlassmorphismDemo'));

// ============================================
// Navigation Configuration (保持不變)
// ============================================
// ... (這裡原本的 NAV 陣列設定程式碼不用動) ...
// 為了節省篇幅，請保留您原本的 STAFF_NAV, WELFARE_NAV, CLIENT_NAV, getNavGroups 代碼
interface NavItem {
  id: ViewKey;
  label: string;
  icon: React.ReactNode;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}
// 請在此處貼回您的 Navigation Configuration 代碼...

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
// 下方是您原本的 UI 組件
// (FloatingSidebar, GlassHeader, MobileMenu, AppContent, App)
// 請直接保留原本的代碼即可，它們會自動使用上面新的 ViewRenderer
// ============================================
