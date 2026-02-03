import React, { useState, useEffect, useId } from 'react';
import { FileEdit, UserPlus, Plane, Navigation, CheckCircle, XCircle, Calendar, Users, DollarSign, Star, TrendingUp, Bookmark, BookmarkCheck, ChevronRight, Sparkles } from 'lucide-react';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    coral: { 500: '#FF6B6B', 400: '#FF8787', 300: '#FFA8A8' },
    teal: { 500: '#4ECDC4', 400: '#6ED7D0', 300: '#81E6D9' },
    sunshine: { 500: '#FFE66D', 400: '#FBBF24' },
  },
  status: {
    planning: { bg: '#F3F4F6', text: '#4B5563', label: '規劃中' },
    open: { bg: '#FEF3C7', text: '#92400E', label: '報名中' },
    upcoming: { bg: '#CFFAFE', text: '#0E7490', label: '即將出發' },
    inProgress: { bg: '#FEE2E2', text: '#991B1B', label: '進行中' },
    completed: { bg: '#D1FAE5', text: '#065F46', label: '已完成' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280', label: '已取消' },
  },
  statusOnDark: {
    planning: { bg: 'rgba(255,255,255,0.15)', text: '#FFFFFF' },
    open: { bg: 'rgba(251,191,36,0.25)', text: '#FCD34D' },
    upcoming: { bg: 'rgba(34,211,238,0.25)', text: '#22D3EE' },
    inProgress: { bg: 'rgba(248,113,113,0.25)', text: '#F87171' },
    completed: { bg: 'rgba(52,211,153,0.25)', text: '#34D399' },
    cancelled: { bg: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.7)' },
  },
  avatarColors: [
    { bg: '#FF6B6B', text: '#FFF' },
    { bg: '#4ECDC4', text: '#FFF' },
    { bg: '#FFE66D', text: '#5D4E37' },
    { bg: '#95E1D3', text: '#2D5A4A' },
    { bg: '#F38181', text: '#FFF' },
    { bg: '#AA96DA', text: '#FFF' },
    { bg: '#FCBAD3', text: '#6B3A4D' },
    { bg: '#A8D8EA', text: '#2C5364' },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getInitials = (name) => {
  if (!name) return '?';
  const isChinese = /[\u4e00-\u9fa5]/.test(name);
  if (isChinese) return name.slice(0, 2);
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
};

const getAvatarColor = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  return tokens.avatarColors[Math.abs(hash) % tokens.avatarColors.length];
};

const formatCurrency = (n) => `$${n.toLocaleString()}`;

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusIcon = ({ status, size = 14 }) => {
  const icons = {
    planning: FileEdit,
    open: UserPlus,
    upcoming: Plane,
    inProgress: Navigation,
    completed: CheckCircle,
    cancelled: XCircle,
  };
  const Icon = icons[status];
  return <Icon size={size} />;
};

const StatusBadge = ({ status, size = 'medium', onDark = false, showIcon = true }) => {
  const config = onDark ? tokens.statusOnDark[status] : tokens.status[status];
  const sizeStyles = {
    small: 'h-5 px-2 text-[11px] gap-1',
    medium: 'h-[26px] px-2.5 text-xs gap-1.5',
    large: 'h-8 px-3 text-sm gap-2',
  };
  const iconSizes = { small: 12, medium: 14, large: 16 };
  
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md transition-all ${sizeStyles[size]}`}
      style={{ 
        backgroundColor: config.bg, 
        color: config.text,
        backdropFilter: onDark ? 'blur(8px)' : undefined,
      }}
    >
      {showIcon && <StatusIcon status={status} size={iconSizes[size]} />}
      <span>{tokens.status[status].label}</span>
    </span>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

const Avatar = ({ user, size = 40, showRing = false, ringColor = 'white' }) => {
  const [imgError, setImgError] = useState(false);
  const colors = getAvatarColor(user.id);
  const hasImg = user.avatar && !imgError;
  
  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold transition-transform hover:scale-110 hover:z-20`}
      style={{ 
        width: size, 
        height: size,
        boxShadow: showRing ? `0 0 0 2px ${ringColor}` : undefined,
      }}
      title={user.name}
    >
      {hasImg ? (
        <img 
          src={user.avatar} 
          alt={user.name} 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ 
            backgroundColor: colors.bg, 
            color: colors.text,
            fontSize: size * 0.35,
          }}
        >
          {getInitials(user.name)}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// AVATAR STACK COMPONENT
// ============================================================================

const AvatarStack = ({ users, size = 32, max = 4, overlap = -10, onDark = false }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  
  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div key={user.id} style={{ marginLeft: i > 0 ? overlap : 0, zIndex: max - i }}>
          <Avatar user={user} size={size} showRing ringColor={onDark ? '#1F2937' : 'white'} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="rounded-full flex items-center justify-center font-semibold text-xs"
          style={{
            width: size * 0.85,
            height: size * 0.85,
            marginLeft: overlap,
            backgroundColor: onDark ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
            color: onDark ? '#FFF' : '#4B5563',
            boxShadow: `0 0 0 2px ${onDark ? '#1F2937' : 'white'}`,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PROGRESS RING COMPONENT
// ============================================================================

const ProgressRing = ({ 
  value, 
  max = 100, 
  size = 56, 
  strokeWidth = 5, 
  color = '#4ECDC4',
  trackColor = '#E5E7EB',
  displayMode = 'percentage',
  customValue,
  onDark = false,
  animate = true,
}) => {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value);
  const normalizedValue = Math.min(Math.max((value / max) * 100, 0), 100);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (animate ? animatedValue : normalizedValue) / 100);

  useEffect(() => {
    if (!animate) return;
    const duration = 1000;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(normalizedValue * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [normalizedValue, animate]);

  const displayText = displayMode === 'percentage' 
    ? `${Math.round(animate ? animatedValue : normalizedValue)}%`
    : displayMode === 'fraction'
    ? `${Math.round(value)}/${max}`
    : customValue;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={onDark ? 'rgba(255,255,255,0.15)' : trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="font-bold"
          style={{ 
            fontSize: size * 0.25,
            color: onDark ? '#FFF' : '#1F2937',
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// TRIP CARD COMPONENT
// ============================================================================

const TripCard = ({ trip, role = 'employee', onBookmark }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  const roleLabels = {
    travelAgency: { primary: '編輯團期', icon: TrendingUp },
    welfareCommittee: { primary: '管理報名', icon: Users },
    employee: { primary: '立即報名', icon: Sparkles },
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    onBookmark?.(!bookmarked);
  };

  return (
    <article
      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        width: 320,
        height: 400,
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0,0,0,0.2)' 
          : '0 8px 24px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-8px)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
        style={{ 
          backgroundImage: `url(${trip.image})`,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <StatusBadge status={trip.status} size="medium" onDark />
        <button 
          onClick={handleBookmark}
          className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          {bookmarked ? (
            <BookmarkCheck size={18} className="text-white" />
          ) : (
            <Bookmark size={18} className="text-white/70" />
          )}
        </button>
      </div>

      {/* Popular Tag (Employee view) */}
      {role === 'employee' && trip.isPopular && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#FF6B6B', color: 'white' }}>
            🏆 最熱門
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-xl font-bold mb-1">{trip.title}</h3>
        <p className="text-white/80 text-sm mb-2">
          {trip.startDate} - {trip.endDate}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{trip.flag}</span>
          <span className="text-white/70 text-sm">{trip.destination}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between mb-4">
          <AvatarStack users={trip.participants} size={28} max={4} onDark />
          <span className="text-white/70 text-sm">
            {trip.totalParticipants} 人
            {trip.maxParticipants && ` / ${trip.maxParticipants}`}
          </span>
        </div>

        {/* Role-specific Info */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <div className="flex items-center gap-3 text-white/70 text-sm">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {trip.duration}
            </span>
            
            {role === 'travelAgency' && (
              <span className="flex items-center gap-1">
                <DollarSign size={14} />
                {formatCurrency(trip.pricePerPerson)}/人
              </span>
            )}
            
            {role === 'welfareCommittee' && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {trip.voteCount} 人選擇
              </span>
            )}
            
            {role === 'employee' && trip.rating && (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                {trip.rating}
              </span>
            )}
          </div>

          {/* Progress or Profit */}
          {role === 'travelAgency' && trip.profitMargin && (
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
              <TrendingUp size={14} />
              {trip.profitMargin}%
            </div>
          )}
          
          {(role === 'welfareCommittee' || role === 'employee') && (
            <ProgressRing
              value={trip.progress || 0}
              size={36}
              strokeWidth={3}
              onDark
            />
          )}
        </div>

        {/* Action Button (Employee view) */}
        {role === 'employee' && (
          <button
            className="w-full mt-4 py-2.5 rounded-lg font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: '#FF6B6B' }}
          >
            {roleLabels[role].primary}
          </button>
        )}
      </div>
    </article>
  );
};

// ============================================================================
// DEMO DATA
// ============================================================================

const demoUsers = [
  { id: '1', name: '王小明', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: '李大華', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: '張美玲', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: '陳志明' },
  { id: '5', name: '林小芳', avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: '6', name: 'Amy Chen', avatar: 'https://i.pravatar.cc/150?u=6' },
  { id: '7', name: 'Bob Wang' },
  { id: '8', name: '黃志豪', avatar: 'https://i.pravatar.cc/150?u=8' },
];

const demoTrips = [
  {
    id: '1',
    title: '北海道雪祭五日遊',
    destination: '日本 北海道',
    flag: '🇯🇵',
    startDate: '02/15',
    endDate: '02/19',
    duration: '5天4夜',
    status: 'inProgress',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=800&fit=crop',
    participants: demoUsers.slice(0, 5),
    totalParticipants: 32,
    maxParticipants: 40,
    pricePerPerson: 45000,
    progress: 80,
    profitMargin: 15,
    voteCount: 48,
    rating: 4.8,
    isPopular: true,
  },
  {
    id: '2',
    title: '沖繩陽光四日遊',
    destination: '日本 沖繩',
    flag: '🇯🇵',
    startDate: '03/10',
    endDate: '03/13',
    duration: '4天3夜',
    status: 'open',
    image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=800&fit=crop',
    participants: demoUsers.slice(2, 6),
    totalParticipants: 18,
    maxParticipants: 30,
    pricePerPerson: 35000,
    progress: 60,
    profitMargin: 12,
    voteCount: 32,
    rating: 4.6,
  },
  {
    id: '3',
    title: '首爾美食探索團',
    destination: '韓國 首爾',
    flag: '🇰🇷',
    startDate: '03/01',
    endDate: '03/04',
    duration: '4天3夜',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=800&fit=crop',
    participants: demoUsers.slice(0, 4),
    totalParticipants: 25,
    maxParticipants: 25,
    pricePerPerson: 28000,
    progress: 100,
    profitMargin: 18,
    voteCount: 55,
    rating: 4.5,
  },
];

// ============================================================================
// MAIN DEMO APP
// ============================================================================

export default function TrvicERPDesignSystem() {
  const [activeRole, setActiveRole] = useState('employee');
  const [activeSection, setActiveSection] = useState('all');

  const roles = [
    { id: 'travelAgency', label: '旅行社', color: '#FF6B6B' },
    { id: 'welfareCommittee', label: '福委會', color: '#4ECDC4' },
    { id: 'employee', label: '員工', color: '#FFE66D' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFBFC', fontFamily: '"Noto Sans TC", system-ui, sans-serif' }}>
      {/* Header */}
      <header 
        className="relative overflow-hidden py-16 px-8"
        style={{ 
          background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #FFE66D 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">TrvicERP Design System</h1>
              <p className="text-white/80">溫暖旅遊感的團體旅遊 ERP 設計系統</p>
            </div>
          </div>
          <p className="text-white/70 max-w-xl">
            專為台灣企業團體旅遊市場打造，服務旅行社、福委會、員工三種角色的垂直式 SaaS 設計語言
          </p>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translateY(50%)' }} />
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Role Selector */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">角色視角切換</h2>
          <div className="flex gap-3">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeRole === role.id
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: activeRole === role.id ? role.color : undefined,
                  color: activeRole === role.id ? (role.id === 'employee' ? '#5D4E37' : 'white') : undefined,
                }}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Badge Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF6B6B20' }}>
              <span className="text-lg">🏷️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Status Badge</h2>
              <p className="text-gray-500 text-sm">狀態徽章 · 六種狀態 · 三種尺寸</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            {/* All Statuses */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">六種狀態</h3>
              <div className="flex flex-wrap gap-3">
                {['planning', 'open', 'upcoming', 'inProgress', 'completed', 'cancelled'].map(status => (
                  <StatusBadge key={status} status={status} />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">三種尺寸</h3>
              <div className="flex items-center gap-4">
                <StatusBadge status="upcoming" size="small" />
                <StatusBadge status="upcoming" size="medium" />
                <StatusBadge status="upcoming" size="large" />
              </div>
            </div>

            {/* On Dark */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">深色背景模式</h3>
              <div className="bg-gray-800 rounded-xl p-6 flex flex-wrap gap-3">
                {['planning', 'open', 'upcoming', 'inProgress', 'completed'].map(status => (
                  <StatusBadge key={status} status={status} onDark />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Avatar Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#4ECDC420' }}>
              <span className="text-lg">👥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Avatar & Avatar Stack</h2>
              <p className="text-gray-500 text-sm">頭像與頭像堆疊 · 圖片與縮寫 Fallback</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            {/* Single Avatars */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">單一頭像（含縮寫 Fallback）</h3>
              <div className="flex items-end gap-4">
                {[24, 32, 40, 48, 64].map((size, i) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <Avatar user={demoUsers[i]} size={size} />
                    <span className="text-xs text-gray-400">{size}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar Stack */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">頭像堆疊</h3>
              <div className="flex items-center gap-8">
                <div className="flex flex-col gap-2">
                  <AvatarStack users={demoUsers} size={32} max={4} />
                  <span className="text-xs text-gray-400">Normal (32px)</span>
                </div>
                <div className="flex flex-col gap-2">
                  <AvatarStack users={demoUsers} size={40} max={5} />
                  <span className="text-xs text-gray-400">Medium (40px)</span>
                </div>
                <div className="flex flex-col gap-2">
                  <AvatarStack users={demoUsers} size={24} max={6} overlap={-8} />
                  <span className="text-xs text-gray-400">Small Tight (24px)</span>
                </div>
              </div>
            </div>

            {/* On Dark */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">深色背景</h3>
              <div className="bg-gray-800 rounded-xl p-6">
                <AvatarStack users={demoUsers} size={36} max={5} onDark />
              </div>
            </div>
          </div>
        </section>

        {/* Progress Ring Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFE66D40' }}>
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Progress Ring</h2>
              <p className="text-gray-500 text-sm">環形進度 · 多種尺寸與顯示模式</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            {/* Sizes */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">五種尺寸</h3>
              <div className="flex items-end gap-6">
                {[
                  { size: 32, stroke: 3, value: 25 },
                  { size: 40, stroke: 4, value: 45 },
                  { size: 56, stroke: 5, value: 65 },
                  { size: 80, stroke: 6, value: 75 },
                  { size: 120, stroke: 8, value: 90 },
                ].map(({ size, stroke, value }) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <ProgressRing value={value} size={size} strokeWidth={stroke} />
                    <span className="text-xs text-gray-400">{size}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">色彩主題</h3>
              <div className="flex items-center gap-6">
                {[
                  { color: '#4ECDC4', track: '#E5E7EB', label: 'Default', value: 65 },
                  { color: '#10B981', track: '#D1FAE5', label: 'Success', value: 100 },
                  { color: '#F59E0B', track: '#FEF3C7', label: 'Warning', value: 75 },
                  { color: '#EF4444', track: '#FEE2E2', label: 'Danger', value: 45 },
                  { color: '#FF6B6B', track: '#FFE4E6', label: 'Branded', value: 80 },
                ].map(({ color, track, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <ProgressRing value={value} size={56} color={color} trackColor={track} />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Display Modes */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">顯示模式</h3>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <ProgressRing value={75} size={56} displayMode="percentage" />
                  <span className="text-xs text-gray-400">Percentage</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ProgressRing value={24} max={30} size={56} displayMode="fraction" />
                  <span className="text-xs text-gray-400">Fraction</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ProgressRing value={85} size={56} displayMode="custom" customValue="$45K" color="#FF6B6B" />
                  <span className="text-xs text-gray-400">Custom</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trip Card Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF6B6B20' }}>
              <span className="text-lg">🗺️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Trip Card</h2>
              <p className="text-gray-500 text-sm">旅程卡片 · 整合所有元件 · 三種角色視角</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-500">當前視角：</span>
              <span 
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ 
                  backgroundColor: roles.find(r => r.id === activeRole)?.color,
                  color: activeRole === 'employee' ? '#5D4E37' : 'white',
                }}
              >
                {roles.find(r => r.id === activeRole)?.label}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center">
              {demoTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} role={activeRole} />
              ))}
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#4ECDC420' }}>
              <span className="text-lg">🎨</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Color Palette</h2>
              <p className="text-gray-500 text-sm">溫暖旅遊感的品牌色彩系統</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="grid grid-cols-3 gap-6">
              {[
                { name: 'Coral 珊瑚紅', colors: ['#FFF5F5', '#FFC9C9', '#FF8787', '#FF6B6B', '#C92A2A'], desc: '熱情、溫暖、行動' },
                { name: 'Teal 青綠色', colors: ['#E6FFFA', '#81E6D9', '#4FD1C5', '#4ECDC4', '#234E52'], desc: '清新、信任、專業' },
                { name: 'Sunshine 陽光黃', colors: ['#FFFBEB', '#FDE68A', '#FCD34D', '#FFE66D', '#78350F'], desc: '活力、期待、快樂' },
              ].map(palette => (
                <div key={palette.name}>
                  <h3 className="font-semibold text-gray-700 mb-2">{palette.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">{palette.desc}</p>
                  <div className="space-y-1">
                    {palette.colors.map((color, i) => (
                      <div
                        key={color}
                        className="h-8 rounded flex items-center px-3 text-xs font-mono"
                        style={{ 
                          backgroundColor: color,
                          color: i >= 3 ? '#FFF' : '#333',
                        }}
                      >
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Plane size={16} />
            </div>
            <span className="font-bold">TrvicERP Design System</span>
          </div>
          <p className="text-gray-400 text-sm">
            專為台灣團體旅遊產業打造的 Vertical SaaS 設計系統
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Components: StatusBadge · Avatar · AvatarStack · ProgressRing · TripCard
          </p>
        </div>
      </footer>
    </div>
  );
}
