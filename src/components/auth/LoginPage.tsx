import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  QrCode, Eye, EyeOff, X, CheckCircle, AlertCircle, Building2, Users, Briefcase,
  Plane, Sparkles, Shield, Zap, Globe, ArrowRight, Lock, Mail, ChevronDown
} from 'lucide-react';

// --- ARCHITECTURE FIXES ---
// 1. Decouple AuthService: Define an interface for the auth service.
// This allows for dependency injection and makes the component testable.
interface IAuthService {
  login(credentials: LoginCredentials): Promise<LoginResult>;
}

// Re-export types from the core service, but the component uses the interface.
// Assuming these types are correctly defined in '@/core/services/authService'
// These types would typically be in a shared 'core/types' or 'core/auth/types' file.
export type LoginCredentials = { email: string; password: string; };
export type UserRole = 'admin' | 'manager' | 'sales' | 'operator' | 'finance' | 'welfare' | 'traveler';
export type LoginResult = { success: true; user: { id: string; name: string; role: UserRole; }; token?: string; } | { success: false; error: string; };

// 2. Define Config Props Interface
// This interface encapsulates all external configurations and dependencies for the component,
// adhering to the Kintone independence principle.
type AppUserRole = 'staff' | 'welfare' | 'traveler';

interface DemoAccount {
  email: string;
  password: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string; // Using Tailwind-friendly token-based classes
  description: string;
}

export interface LoginPageConfig {
  authService: IAuthService; // Injected AuthService instance
  demoAccounts?: Record<AppUserRole, DemoAccount>; // Injected Demo accounts (optional, defaults provided)
  onLoginSuccess: (role: AppUserRole, userId?: string, userName?: string, token?: string) => void;
  // Utility function for mapping user roles, also injected for flexibility
  mapBackendRoleToAppRole?: (role: UserRole) => AppUserRole; // Optional, default provided
  // Optional: registration/forgot password links for customization
  registrationLink?: string;
  forgotPasswordLink?: string;
  // Branding details, if they can be configured externally
  appName?: string;
  appTagline?: string;
  features?: { icon: React.ReactNode; text: string; }[];
}

// Props for the LoginPage component. It now takes a config object OR a simpler onLogin callback.
export interface LoginPageProps {
  config?: LoginPageConfig;
  onLogin?: (role: AppUserRole, userId?: string, userName?: string, token?: string) => void;
}

// --- UTILITY HOOKS & FUNCTIONS (for single responsibility principle) ---

// Custom hook for toast notifications
type ToastType = 'success' | 'error';

function useToast() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showNotification = useCallback((message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  return { showToast, toastMessage, toastType, showNotification };
}

// Custom hook for mouse position (for parallax effect)
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mousePosition;
}

// Custom hook for QR Code login simulation
function useQRLoginSimulation(onSuccess: (role: AppUserRole, userId: string, userName: string) => void, showNotification: (message: string, type: ToastType) => void) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleQRLogin = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      setShowQRModal(false);
      setIsScanning(false);
      showNotification('QR Code 登入成功！', 'success');
      setTimeout(() => {
        onSuccess('staff', 'qr_user', 'QR 登入用戶'); // Default to staff for QR login simulation
      }, 500);
    }, 3000); // Simulate scanning for 3 seconds
  }, [onSuccess, showNotification]);

  return { showQRModal, setShowQRModal, isScanning, handleQRLogin };
}

// Default mapping function (can be overridden via config)
const defaultMapUserRoleToAppRole = (role: UserRole): AppUserRole => {
  switch (role) {
    case 'admin':
    case 'manager':
    case 'sales':
    case 'operator':
    case 'finance':
      return 'staff';
    case 'welfare':
      return 'welfare';
    case 'traveler':
      return 'traveler';
    default:
      return 'staff';
  }
};

// --- DESIGN FIXES ---
// 1. Define Tailwind-friendly demo accounts (using token-based color classes)
// 5. DEMO_ACCOUNTS moved to external config (via props). This is a default if not provided.
const DEFAULT_DEMO_ACCOUNTS: Record<AppUserRole, DemoAccount> = {
  staff: {
    email: 'admin@travelmaster.com',
    password: 'admin123',
    label: '旅行社管理端',
    icon: <Briefcase className="w-5 h-5" />,
    colorClass: 'from-primary-500 to-primary-700', // Using primary brand colors (assuming primary is the main brand)
    description: '完整的營運管理功能',
  },
  welfare: {
    email: 'hr@company.com',
    password: 'hr123',
    label: '福委會/HR',
    icon: <Building2 className="w-5 h-5" />,
    colorClass: 'from-primary-500 to-secondary-500', // Primary to secondary accent (assuming secondary is a common accent)
    description: '活動與福利管理',
  },
  traveler: {
    email: 'employee@company.com',
    password: 'emp123',
    label: '員工端',
    icon: <Users className="w-5 h-5" />,
    colorClass: 'from-secondary-500 to-tertiary-500', // Secondary to tertiary accent (assuming emerald is a tertiary color)
    description: '個人行程與服務',
  },
};

// 4. Animation variants for better separation of concerns
// Defines animation properties cleanly outside of JSX.
const pageEntryVariants: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, x: 50, transition: { duration: 0.8, ease: 'easeOut' } }
};

const leftPanelEntryVariants: Variants = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const logoVariants: Variants = {
  initial: { scale: 0 },
  animate: { scale: 1, transition: { delay: 0.2, type: 'spring', stiffness: 200 } }
};

const textEntryVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.3 } }
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }
};

const toastVariants: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } }
};

// Main Component
export default function LoginPage({ config, onLogin }: LoginPageProps) {
  // If onLogin is provided directly, create a minimal config
  const effectiveConfig = config || {
    authService: {
      login: async () => ({ success: false, error: 'Auth service not configured' })
    },
    onLoginSuccess: onLogin || (() => {}),
  };
  
  // Destructure config with defaults for optional properties
  const {
    authService,
    onLoginSuccess,
    demoAccounts = DEFAULT_DEMO_ACCOUNTS,
    mapBackendRoleToAppRole = defaultMapUserRoleToAppRole,
    registrationLink = '#',
    forgotPasswordLink = '#',
    appName = '智慧旅遊',
    appTagline = '企業管理平台',
    features = [
      { icon: <Zap className="w-5 h-5" />, text: '即時同步與協作' },
      { icon: <Shield className="w-5 h-5" />, text: '企業級安全保障' },
      { icon: <Globe className="w-5 h-5" />, text: '全球旅遊資源整合' },
      { icon: <Sparkles className="w-5 h-5" />, text: 'AI 智能輔助決策' },
    ]
  } = effectiveConfig;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<AppUserRole | null>(null);

  // Use custom hooks for modularity and single responsibility
  const { showToast, toastMessage, toastType, showNotification } = useToast();
  const mousePosition = useMousePosition();
  const { showQRModal, setShowQRModal, isScanning, handleQRLogin } = useQRLoginSimulation(onLoginSuccess, showNotification);

  // Handle demo account selection
  const handleDemoLogin = useCallback((role: AppUserRole) => {
    const account = demoAccounts[role];
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemoRole(role);
  }, [demoAccounts]);

  const handleDemoEnter = useCallback(() => {
    const role = selectedDemoRole ?? 'staff'; // Default to staff if nothing selected
    const account = demoAccounts[role];
    showNotification(`已使用 ${account.label} Demo 帳號登入`, 'success');
    setTimeout(() => {
      onLoginSuccess(role, `demo_${role}`, account.label);
    }, 300);
  }, [selectedDemoRole, demoAccounts, showNotification, onLoginSuccess]);

  // Handle form login
  const handleFormLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification('請填寫所有欄位', 'error');
      return;
    }

    if (!email.includes('@')) {
      showNotification('請輸入有效的電子郵件', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Use the injected authService for authentication
      const result = await authService.login({ email, password });

      if (result.success && result.user) {
        showNotification('登入成功！', 'success');
        setTimeout(() => {
          // 4. Service layer error boundary: Uses the injected mapBackendRoleToAppRole
          onLoginSuccess(mapBackendRoleToAppRole(result.user!.role), result.user!.id, result.user!.name, result.token);
        }, 500);
      } else if (!result.success) {
        // Handle explicit error messages from the service
        // TypeScript discriminated union: if not success, result has error property
        const errorMessage = result.success === false ? result.error : '登入失敗，請檢查您的帳號密碼';
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      // Catch unexpected errors (e.g., network issues before service response, or unhandled exceptions in authService)
      console.error("Login unexpected error:", error);
      showNotification('網路連線錯誤或伺服器無回應，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, authService, showNotification, onLoginSuccess, mapBackendRoleToAppRole]);

  // Derived state for button text
  const demoButtonText = useMemo(() => {
    return selectedDemoRole
      ? `以 ${demoAccounts[selectedDemoRole].label} 進入`
      : '直接進主畫面 (管理端)'; // Default to staff if none selected, or show a general text
  }, [selectedDemoRole, demoAccounts]);


  return (
    // 6. Add responsive design classes (e.g., md:, lg:) to overall layout padding
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-slate-900 to-primary-800 p-4 sm:p-6 md:p-8 lg:p-0">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs - Using primary colors */}
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-700/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.02,
            y: mousePosition.y * -0.02,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
          <motion.div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Left Side - Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-8 xl:p-12">
        <motion.div
          variants={leftPanelEntryVariants}
          initial="initial"
          animate="animate"
          className="max-w-lg text-white"
        >
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            initial="initial"
            animate="animate"
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-2xl mb-6">
              <Plane className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Title - 3. Font and spacing via Tailwind classes and responsive sizes */}
          <motion.h1
            variants={textEntryVariants}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white via-primary-100 to-primary-200 bg-clip-text text-transparent"
          >
            {appName}
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl">{appTagline}</span>
          </motion.h1>

          <motion.p
            variants={textEntryVariants}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed"
          >
            安全、高效、智能的旅遊業垂直整合系統
            <br />
            為旅行社、福委會、員工提供一站式服務
          </motion.p>

          {/* Features */}
          <motion.div
            variants={textEntryVariants}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  {feature.icon}
                </div>
                <span className="text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          variants={pageEntryVariants}
          initial="initial"
          animate="animate"
          className="w-full max-w-md"
        >
          {/* 2. Drag-handle structure & Standard Card Structure */}
          {/* The glass-panel now serves as the 'Card' structure. Added a dedicated drag-handle area. */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative">
            {/* The drag-handle for the widget, typically a small bar or the header area */}
            <div className="drag-handle absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
              <ChevronDown className="w-6 h-6 rotate-180" /> {/* Example drag indicator */}
            </div>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 mt-4"> {/* Added mt-4 to account for drag-handle space */}
              <motion.div
                variants={logoVariants}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg"
              >
                <Plane className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2
                variants={textEntryVariants}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
              >
                歡迎回來
              </motion.h2>
              <motion.p
                variants={textEntryVariants}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-sm sm:text-base"
              >
                登入以繼續使用 TravelMaster
              </motion.p>
            </div>

            {/* Demo Role Quick Select */}
            <motion.div
              variants={textEntryVariants}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3 text-center">快速登入 Demo 帳號</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(Object.entries(demoAccounts) as [AppUserRole, DemoAccount][]).map(([role, account]) => (
                  <motion.button
                    key={role}
                    type="button"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDemoLogin(role)}
                    // Using injected colorClass (Tailwind token-based)
                    className={`relative flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all overflow-hidden ${
                      selectedDemoRole === role
                        ? `border-transparent bg-gradient-to-br ${account.colorClass} text-white shadow-lg`
                        : 'border-gray-200 bg-white/50 hover:border-gray-300 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    {selectedDemoRole === role && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                    <div className={`${selectedDemoRole === role ? 'text-white' : 'text-gray-600'}`}>
                      {account.icon}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold ${selectedDemoRole === role ? 'text-white' : 'text-gray-700'}`}>
                      {account.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">或使用帳號密碼</span>
              </div>
            </div>

            {/* Login Form */}
            <motion.form
              variants={textEntryVariants}
              transition={{ delay: 0.6 }}
              onSubmit={handleFormLogin}
              className="space-y-4 sm:space-y-6"
            >
              {/* Email Input */}
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/80 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-white/80 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">記住我</span>
                </label>
                <a href={forgotPasswordLink} className="text-primary-500 hover:text-primary-600 font-medium hover:underline">
                  忘記密碼？
                </a>
              </div>

              {/* Login Buttons */}
              <div className="space-y-3 pt-2">
                {/* Standard Login Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-white py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      登入中...
                    </>
                  ) : (
                    <>
                      登入
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* QR Code Login Button */}
                <motion.button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full bg-white/80 border-2 border-gray-200 text-gray-700 py-3.5 rounded-lg font-semibold hover:bg-white hover:border-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <QrCode className="w-5 h-5" />
                  使用 QR Code 登入
                </motion.button>

                {/* Demo Login Button */}
                <motion.button
                  type="button"
                  onClick={handleDemoEnter}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full bg-primary-50 border-2 border-primary-100 text-primary-700 py-3.5 rounded-lg font-semibold hover:bg-primary-100 hover:border-primary-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {demoButtonText}
                </motion.button>
              </div>
            </motion.form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-xs sm:text-sm text-gray-600 mt-6"
            >
              還沒有帳號？{' '}
              <a href={registrationLink} className="text-primary-500 font-semibold hover:text-primary-600 hover:underline">
                立即註冊
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed inset-0 bg-primary-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isScanning && setShowQRModal(false)}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-white/20"
            >
              {/* Close Button */}
              {!isScanning && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowQRModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}

              {/* Modal Content */}
              <div className="text-center">
                <motion.div
                  variants={logoVariants}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg"
                >
                  <QrCode className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">掃描 QR Code</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">使用手機掃描以快速登入</p>

                {/* QR Code Placeholder */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 mb-6 flex items-center justify-center border border-gray-200 min-h-[200px]">
                  {isScanning ? (
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-700 font-semibold">掃描中...</p>
                    </div>
                  ) : (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <QrCode className="w-40 h-40 sm:w-48 sm:h-48 text-gray-400" strokeWidth={1.5} />
                    </motion.div>
                  )}
                </div>

                {/* Scan Button */}
                {!isScanning && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleQRLogin}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    模擬掃描
                  </motion.button>
                )}

                {isScanning && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-500 mt-4"
                  >
                    正在驗證您的身份，請稍候...
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-6 right-6 z-50"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl backdrop-blur-sm border ${
                toastType === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400/30'
                  : 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-400/30'
              }`}
            >
              {toastType === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <p className="font-semibold">{toastMessage}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}