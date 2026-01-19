import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Eye, EyeOff, X, CheckCircle, AlertCircle, Building2, Users, Briefcase } from 'lucide-react';
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
const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string; label: string; icon: React.ReactNode }> = {
  staff: {
    email: 'admin@travelmaster.com',
    password: 'admin123',
    label: '旅行社管理端',
    icon: <Briefcase className="w-5 h-5" />,
  },
  welfare: {
    email: 'hr@company.com',
    password: 'hr123',
    label: '福委會/HR',
    icon: <Building2 className="w-5 h-5" />,
  },
  traveler: {
    email: 'employee@company.com',
    password: 'emp123',
    label: '員工端',
    icon: <Users className="w-5 h-5" />,
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
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden">
        {/* Background Image with Grayscale */}
        <div
          className="absolute inset-0 bg-cover bg-center grayscale"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200)',
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-primary-900/70 to-primary-950/90" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              智慧旅遊<br />企業管理平台
            </h1>
            <p className="text-gray-300 text-lg">
              安全、高效、智能的旅遊業垂直整合系統，為旅行社、福委會、員工提供一站式服務。
            </p>
            <div className="mt-8 flex gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm">旅行社管理</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Building2 className="w-5 h-5" />
                <span className="text-sm">福委會專區</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span className="text-sm">員工服務</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">歡迎回來</h2>
            <p className="text-gray-600">登入以繼續使用 TrvicERP</p>
          </div>

          {/* Demo Role Quick Select */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3 text-center">快速登入 Demo 帳號</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(DEMO_ACCOUNTS) as [DemoRole, typeof DEMO_ACCOUNTS.staff][]).map(([role, account]) => (
                <motion.button
                  key={role}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDemoLogin(role)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selectedDemoRole === role
                      ? 'border-primary-900 bg-primary-900 text-white'
                      : 'border-neutral-200 hover:border-primary-500 text-neutral-600 hover:text-primary-900'
                  }`}
                >
                  {account.icon}
                  <span className="text-xs font-medium">{account.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">或使用帳號密碼</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleFormLogin} className="space-y-8">
            {/* Email Input with Floating Label */}
            <div className="relative">
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full px-0 py-3 border-0 border-b-2 border-neutral-300 text-neutral-900 placeholder-transparent focus:border-primary-900 focus:outline-none focus:ring-0 transition-colors"
              />
              <label
                htmlFor="email"
                className="absolute left-0 -top-4 text-neutral-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary-900 peer-focus:text-sm"
              >
                電子郵件
              </label>
            </div>

            {/* Password Input with Floating Label and Toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-0 py-3 pr-10 border-0 border-b-2 border-neutral-300 text-neutral-900 placeholder-transparent focus:border-primary-900 focus:outline-none focus:ring-0 transition-colors"
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-4 text-neutral-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary-900 peer-focus:text-sm"
              >
                密碼
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary-900 border-neutral-300 rounded focus:ring-primary-900" />
                <span className="ml-2 text-sm text-gray-600">記住我</span>
              </label>
              <a href="#" className="text-sm text-primary-900 hover:underline">
                忘記密碼？
              </a>
            </div>

            {/* Login Buttons */}
            <div className="space-y-3">
              {/* Standard Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-900 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  '登入'
                )}
              </button>

              {/* QR Code Login Button */}
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                disabled={isLoading}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" />
                使用 QR Code 登入
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-neutral-600 mt-8">
            還沒有帳號？{' '}
            <a href="#" className="text-primary-900 font-semibold hover:underline">
              註冊
            </a>
          </p>
        </motion.div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !isScanning && setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Close Button */}
              {!isScanning && (
                <button
                  onClick={() => setShowQRModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              {/* Modal Content */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">掃描 QR Code</h3>
                <p className="text-gray-600 mb-6">使用手機掃描以快速登入</p>

                {/* QR Code Placeholder */}
                <div className="bg-gray-100 rounded-xl p-8 mb-6 flex items-center justify-center">
                  {isScanning ? (
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-600 font-semibold">掃描中...</p>
                    </div>
                  ) : (
                    <QrCode className="w-48 h-48 text-gray-900" strokeWidth={1} />
                  )}
                </div>

                {/* Scan Button */}
                {!isScanning && (
                  <button
                    onClick={handleQRLogin}
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  >
                    模擬掃描
                  </button>
                )}

                {isScanning && (
                  <p className="text-sm text-gray-500">正在驗證您的身份，請稍候...</p>
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
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl ${
                toastType === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {toastType === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <p className="font-semibold">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
