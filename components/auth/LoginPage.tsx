import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Eye, EyeOff, X, CheckCircle, AlertCircle, Building2, Users, Briefcase,
  Plane, Sparkles, Shield, Zap, Globe, ArrowRight, Lock, Mail
} from 'lucide-react';
import { AuthService } from '@/core/services/authService';
import type { LoginCredentials, UserRole } from '@/core/services/authService';

interface LoginPageProps {
  onLogin: (role: 'staff' | 'welfare' | 'traveler', userId?: string, userName?: string) => void;
}

// Map detailed roles to app-level roles
function mapUserRoleToAppRole(role: UserRole): 'staff' | 'welfare' | 'traveler' {
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
}

type ToastType = 'success' | 'error';
type DemoRole = 'staff' | 'welfare' | 'traveler';

// Demo 帳號資訊
const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string; label: string; icon: React.ReactNode; color: string; description: string }> = {
  staff: {
    email: 'admin@travelmaster.com',
    password: 'admin123',
    label: '旅行社管理端',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'from-brand-500 to-brand-700',
    description: '完整的營運管理功能',
  },
  welfare: {
    email: 'hr@company.com',
    password: 'hr123',
    label: '福委會/HR',
    icon: <Building2 className="w-5 h-5" />,
    color: 'from-brand-500 to-accent',
    description: '活動與福利管理',
  },
  traveler: {
    email: 'employee@company.com',
    password: 'emp123',
    label: '員工端',
    icon: <Users className="w-5 h-5" />,
    color: 'from-accent to-emerald-500',
    description: '個人行程與服務',
  },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<DemoRole | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Toast notification function
  const showNotification = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle QR Code login
  const handleQRLogin = () => {
    setIsScanning(true);
    // Simulate scanning for 3 seconds
    setTimeout(() => {
      setShowQRModal(false);
      setIsScanning(false);
      showNotification('QR Code 登入成功！', 'success');
      // Auto login after successful QR scan
      setTimeout(() => {
        onLogin('staff', 'qr_user', 'QR 登入用戶');
      }, 500);
    }, 3000);
  };

  // Handle demo account selection
  const handleDemoLogin = (role: DemoRole) => {
    const account = DEMO_ACCOUNTS[role];
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemoRole(role);
  };

  const handleDemoEnter = () => {
    const role = selectedDemoRole ?? 'staff';
    const account = DEMO_ACCOUNTS[role];
    showNotification('已使用 Demo 帳號登入', 'success');
    setTimeout(() => {
      onLogin(role, `demo_${role}`, account.label);
      if (window.location.pathname.startsWith('/login')) {
        window.location.assign('/');
      }
    }, 300);
  };

  // Handle form login
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification('請填寫所有欄位', 'error');
      return;
    }

    // Simple validation
    if (!email.includes('@')) {
      showNotification('請輸入有效的電子郵件', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.login({ email, password });

      if (result.success && result.user) {
        showNotification('登入成功！', 'success');
        setTimeout(() => {
          onLogin(mapUserRoleToAppRole(result.user!.role), result.user!.id, result.user!.name);
        }, 500);
      } else {
        showNotification(result.error || '登入失敗', 'error');
      }
    } catch {
      showNotification('網路連線錯誤', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-gradient-to-br from-brand-900 via-slate-900 to-brand-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.02,
            y: mousePosition.y * -0.02,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
          <motion.div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Left Side - Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-lg text-white"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl shadow-2xl mb-6">
              <Plane className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white via-brand-100 to-brand-200 bg-clip-text text-transparent"
          >
            智慧旅遊
            <br />
            <span className="text-5xl">企業管理平台</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300 mb-12 leading-relaxed"
          >
            安全、高效、智能的旅遊業垂直整合系統
            <br />
            為旅行社、福委會、員工提供一站式服務
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            {[
              { icon: <Zap className="w-5 h-5" />, text: '即時同步與協作' },
              { icon: <Shield className="w-5 h-5" />, text: '企業級安全保障' },
              { icon: <Globe className="w-5 h-5" />, text: '全球旅遊資源整合' },
              { icon: <Sparkles className="w-5 h-5" />, text: 'AI 智能輔助決策' },
            ].map((feature, idx) => (
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
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Login Card */}
          <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl mb-4 shadow-lg"
              >
                <Plane className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                歡迎回來
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                登入以繼續使用 TravelMaster
              </motion.p>
            </div>

            {/* Demo Role Quick Select */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">快速登入 Demo 帳號</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(DEMO_ACCOUNTS) as [DemoRole, typeof DEMO_ACCOUNTS.staff][]).map(([role, account]) => (
                  <motion.button
                    key={role}
                    type="button"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDemoLogin(role)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all overflow-hidden ${
                      selectedDemoRole === role
                        ? `border-transparent bg-gradient-to-br ${account.color} text-white shadow-lg`
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
                    <span className={`text-xs font-semibold ${selectedDemoRole === role ? 'text-white' : 'text-gray-700'}`}>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleFormLogin}
              className="space-y-6"
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
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
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
                    className="w-full pl-10 pr-12 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
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
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">記住我</span>
                </label>
                <a href="#" className="text-sm text-brand-500 hover:text-brand-600 font-medium hover:underline">
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
                  className="w-full bg-gradient-to-r from-brand-500 to-brand-700 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
                  className="w-full bg-white/80 border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-white hover:border-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
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
                  className="w-full bg-brand-50 border-2 border-brand-100 text-brand-700 py-3.5 rounded-xl font-semibold hover:bg-brand-100 hover:border-brand-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {selectedDemoRole
                    ? `以 ${DEMO_ACCOUNTS[selectedDemoRole].label} 進入`
                    : '直接進主畫面'}
                </motion.button>
              </div>
            </motion.form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm text-gray-600 mt-6"
            >
              還沒有帳號？{' '}
              <a href="#" className="text-brand-500 font-semibold hover:text-brand-600 hover:underline">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isScanning && setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-white/20"
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
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg"
                >
                  <QrCode className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">掃描 QR Code</h3>
                <p className="text-gray-600 mb-6">使用手機掃描以快速登入</p>

                {/* QR Code Placeholder */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-6 flex items-center justify-center border border-gray-200">
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
                      <QrCode className="w-48 h-48 text-gray-400" strokeWidth={1.5} />
                    </motion.div>
                  )}
                </div>

                {/* Scan Button */}
                {!isScanning && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleQRLogin}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    模擬掃描
                  </motion.button>
                )}

                {isScanning && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-500"
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
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed top-6 right-6 z-50"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border ${
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
