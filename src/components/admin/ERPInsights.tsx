import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Target, ArrowDownCircle, DollarSign, Wallet,
  Sparkles, BarChart3, ArrowUpRight, Activity, Globe, Zap, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is correctly configured for Tailwind

// --- Animation Variants (Extracted from component) ---
// In a real-world scenario, these would be imported from a design system's animation config file.
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const cardHover = {
  hover: { y: -4, transition: { duration: 0.2 } }
};

// --- Kintone Widget Data Configuration Interface ---
// This interface defines the expected structure for data passed into the ERPInsights component,
// making it configurable as an independent widget.
export interface ERPInsightsConfig {
  kpiCards: {
    title: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'info' | 'warning'; // Using Dashtail/Tailwind standard names
    delay: number;
  }[];
  funnelData: {
    label: string;
    count: number;
    color: string; // Tailwind gradient classes, e.g., 'from-gray-200 to-gray-300'
    icon: React.ElementType; // Use React.ElementType for component type
  }[];
  rankingItems: {
    rank: number;
    label: string;
    value: string;
    percent: number;
  }[];
  aiSuggestion: string;
  quickStats: {
    label: string;
    value: string;
    change: string;
    suffix?: string;
    isNegativeGood?: boolean;
  }[];
}

// --- ERPInsights Component Props ---
interface ERPInsightsProps {
  config: ERPInsightsConfig;
}

export default function ERPInsights({ config }: ERPInsightsProps) {
  const { kpiCards, funnelData, rankingItems, aiSuggestion, quickStats } = config;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Added relative and a standard card-like structure to support drag-handle
      className="relative p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-white shadow-lg rounded-2xl border border-gray-100"
    >
      {/* Drag Handle */}
      <div className="drag-handle absolute top-4 right-4 cursor-grab text-gray-400 hover:text-gray-600 transition-colors">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              Dashboard
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">營收與通路分析</h2>
          <p className="text-gray-500 mt-1">即時監控全通路轉化率與營收表現</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card px-4 py-2.5 flex items-center gap-2" // Changed gap-3 to gap-2
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"></span>
          </span>
          <span className="text-sm font-semibold text-gray-600">即時數據同步中</span>
        </motion.div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <KPICard key={index} {...card} />
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                  <ArrowDownCircle className="text-primary-500 w-4 h-4" />
                </div>
                銷售轉化漏斗
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                本週數據
              </span>
            </div>
            <div className="space-y-4">
              {funnelData.map((stage, i) => {
                const Icon = stage.icon;
                const percentage = (stage.count / funnelData[0].count) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-28 text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">{stage.label}</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 font-mono">{stage.count.toLocaleString()}</div>
                    </div>
                    <div className="flex-1 h-12 relative overflow-hidden rounded-lg bg-gray-100/50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: i * 0.15 + 0.3, duration: 0.8, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-lg bg-gradient-to-r shadow-sm',
                          stage.color // Color classes are expected from config now
                        )}
                      />
                      <div className="absolute inset-0 flex items-center px-4">
                        <span className="text-sm font-bold text-white drop-shadow-md">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      {i > 0 && (
                        <span className={cn(
                          'text-sm font-bold px-2 py-1 rounded-full',
                          // Dynamic color based on last stage or general
                          i === funnelData.length - 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {Math.round((stage.count / funnelData[i-1].count) * 100)}%
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Ranking Card */}
        <motion.div variants={itemVariants}>
          <div className="glass-panel-dark text-white p-6 rounded-2xl h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" /> {/* Changed brand-400 to primary-400 */}
                購物通路排行
              </h3>
              <span className="text-sm text-gray-400 bg-white/10 px-2 py-1 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                TOP 3
              </span>
            </div>
            <div className="space-y-4"> {/* Changed space-y-5 to space-y-4 */}
              {rankingItems.map((item) => (
                <RankingItem key={item.rank} {...item} />
              ))}
            </div>

            {/* AI Suggestion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 pt-5 border-t border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-400 uppercase font-semibold tracking-wider">AI 策略建議</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {aiSuggestion}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Footer */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <QuickStat key={index} {...stat} />
        ))}
      </motion.div>
    </motion.div>
  );
}

// --- Sub-components (Kept local, but could be separate files) ---

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'info' | 'warning'; // Using Dashtail/Tailwind standard names
  delay: number;
}

function KPICard({ title, value, trend, icon, color, delay }: KPICardProps) {
  // Map internal color names to Dashtail-compliant Tailwind classes
  const colorStyles = {
    primary: {
      bg: 'bg-primary-50',
      iconBg: 'bg-gradient-to-r from-primary-400 to-primary-600',
      trendBg: 'bg-primary-50 text-primary-700',
    },
    secondary: { // Mapped from 'purple'
      bg: 'bg-secondary-50',
      iconBg: 'bg-gradient-to-r from-secondary-400 to-secondary-600',
      trendBg: 'bg-secondary-50 text-secondary-700',
    },
    info: { // Mapped from 'blue'
      bg: 'bg-blue-50', // Assuming a distinct blue for 'info' if not part of primary/secondary
      iconBg: 'bg-gradient-to-r from-blue-400 to-blue-600',
      trendBg: 'bg-blue-50 text-blue-700',
    },
    warning: { // Mapped from 'orange'
      bg: 'bg-orange-50', // Assuming a distinct orange for 'warning'
      iconBg: 'bg-gradient-to-r from-orange-400 to-orange-600',
      trendBg: 'bg-orange-50 text-orange-700',
    },
  };

  const styles = colorStyles[color];

  return (
    <motion.div
      variants={cardHover}
      whileHover="hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5 group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg',
            styles.iconBg
          )}
        >
          {icon}
        </motion.div>
        <div className={cn('flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full', styles.trendBg)}>
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      <h4 className="text-2xl font-bold mt-1 text-gray-900 font-mono tracking-tight">{value}</h4>
    </motion.div>
  );
}

interface RankingItemProps {
  rank: number;
  label: string;
  value: string;
  percent: number;
}

function RankingItem({ rank, label, value, percent }: RankingItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.15 }}
    >
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center text-sm font-bold',
            rank === 1 ? 'bg-warning-500 text-white' : 'bg-white/10 text-gray-400' // Changed yellow-500 to warning-500
          )}>
            {rank}
          </span>
          <span className="text-gray-300">{label}</span>
        </div>
        <span className="font-bold font-mono text-white">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: rank * 0.15 + 0.5, duration: 0.6 }}
          className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800" // Changed brand-400/500 to primary-400/500
        />
      </div>
    </motion.div>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
  change: string;
  suffix?: string;
  isNegativeGood?: boolean;
}

function QuickStat({ label, value, change, suffix, isNegativeGood }: QuickStatProps) {
  const isPositive = change.startsWith('+');
  const isNeutral = change === '0';
  const isGood = isNegativeGood ? !isPositive : isPositive;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-4"
    >
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-gray-900 font-mono">{value}</span>
        {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
        {!isNeutral && (
          <span className={cn(
            'text-sm font-bold',
            isGood ? 'text-success-600' : 'text-danger-500' // Changed green-600 to success-600, red-500 to danger-500
          )}>
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}