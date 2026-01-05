import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Globe, Lock, User, Loader2 } from '../components/Icons';
import { TRANSLATIONS } from '../constants';
import type { Language, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { auth, login, signup, usingSupabase } = useAuth();

  const [language, setLanguage] = useState<Language>('zh');
  const t = TRANSLATIONS[language];

  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'welfare_committee' | 'travel_agency' | 'employee' | 'admin'>('employee');
  const [showPassword, setShowPassword] = useState(false);

  const toggleLanguage = () => setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'));

  const roleToHome = (role: Role | undefined) => {
    if (role === 'ADMIN' || role === 'BOSS') return '/agency';
    if (role === 'CLIENT' || role === 'HR') return '/committee';
    return '/employee';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      await signup({ email: username, password, displayName, role });
    } else {
      await login({ username, password });
    }
  };

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(roleToHome(auth.user?.role), { replace: true });
    }
  }, [auth.isAuthenticated, auth.user?.role, navigate]);

  React.useEffect(() => {
    setUsername('');
    setPassword('');
    setDisplayName('');
  }, [isSignup]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Globe size={14} className="text-blue-600" />
          {language === 'zh' ? 'English' : '繁體中文'}
        </button>
      </div>

      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-blue-500 via-transparent to-purple-500 animate-spin-slow" />
          </div>
          <div className="relative">
            <h1 className="text-3xl font-black tracking-tight">TravelCanvas</h1>
            <p className="text-slate-300 text-sm mt-2">Role-based Workbench (Agency / Committee / Employee)</p>
          </div>
        </div>

        <div className="p-8">
          {usingSupabase && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  !isSignup
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                登入
              </button>
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  isSignup
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                註冊
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">顯示名稱</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="您的姓名"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {isSignup ? 'Email' : t.username}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={isSignup ? 'email' : 'text'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    isSignup
                      ? 'email@example.com'
                      : usingSupabase
                      ? 'email@example.com'
                      : 'admin / client / hr / staff'
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.password}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">角色</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="employee">員工/導遊</option>
                  <option value="welfare_committee">福委會代表</option>
                  <option value="travel_agency">旅行社</option>
                  <option value="admin">系統管理員</option>
                </select>
              </div>
            )}

            {auth.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                {auth.error}
              </div>
            )}

            <button
              type="submit"
              disabled={auth.isLoading}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {auth.isLoading ? <Loader2 spinning size={18} /> : null}
              {auth.isLoading ? (isSignup ? '註冊中...' : t.signingIn) : (isSignup ? '註冊' : t.signIn)}
            </button>
          </form>

          {!usingSupabase && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-700">Demo 帳密</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-mono">admin / admin123</p>
                  <p className="text-slate-500">旅行社</p>
                </div>
                <div>
                  <p className="font-mono">client / client123</p>
                  <p className="text-slate-500">福委會</p>
                </div>
                <div>
                  <p className="font-mono">hr / hr123</p>
                  <p className="text-slate-500">HR</p>
                </div>
                <div>
                  <p className="font-mono">staff / staff123</p>
                  <p className="text-slate-500">員工/導遊</p>
                </div>
              </div>
              <p className="text-slate-500">投票中心使用 localStorage：同一個瀏覽器切角色可看到同步結果。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
