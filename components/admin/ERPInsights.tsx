import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Target, ArrowDownCircle, DollarSign, Wallet,
  Sparkles, BarChart3, ArrowUpRight, Activity, Globe, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation variants
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

export default function ERPInsights() {
  const funnelData = [
    { label: '潛在客戶', count: 1250, color: 'from-slate-200 to-slate-300', icon: Globe },
    { label: '意向詢價', count: 420, color: 'from-brand-200 to-brand-300', icon: Activity },
    { label: '支付訂金', count: 156, color: 'from-brand-400 to-brand-500', icon: Wallet },
    { label: '確認成行', count: 98, color: 'from-brand-500 to-brand-600', icon: Zap },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              Dashboard
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">營收與通路分析</h2>
          <p className="text-gray-500 mt-1">即時監控全通路轉化率與營收表現</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card px-4 py-2.5 flex items-center gap-3"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"></span>
          </span>
          <span className="text-sm font-semibold text-gray-600">即時數據同步中</span>
        </motion.div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="本月預估營收"
          value="$4,285,000"
          trend="+12.5%"
          icon={<DollarSign className="w-5 h-5" />}
          color="brand"
          delay={0}
        />
        <KPICard
          title="平均轉化率"
          value="7.8%"
          trend="+1.2%"
          icon={<Target className="w-5 h-5" />}
          color="purple"
          delay={0.1}
        />
        <KPICard
          title="活躍旅客"
          value="1,856"
          trend="+245"
          icon={<Users className="w-5 h-5" />}
          color="blue"
          delay={0.2}
        />
        <KPICard
          title="通路淨利"
          value="$642,800"
          trend="+8.4%"
          icon={<Wallet className="w-5 h-5" />}
          color="orange"
          delay={0.3}
        />
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                  <ArrowDownCircle className="text-brand-500 w-4 h-4" />
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
                          stage.color
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
                          i === funnelData.length - 1 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
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
                <TrendingUp className="w-4 h-4 text-brand-400" />
                購物通路排行
              </h3>
              <span className="text-sm text-gray-400 bg-white/10 px-2 py-1 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                TOP 3
              </span>
            </div>
            <div className="space-y-5">
              <RankingItem rank={1} label="阿里山高山茶廠" value="$185,000" percent={45} />
              <RankingItem rank={2} label="奮起湖便當總部" value="$92,400" percent={25} />
              <RankingItem rank={3} label="隙頂咖啡工坊" value="$62,000" percent={18} />
            </div>

            {/* AI Suggestion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 pt-5 border-t border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-brand flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-400 uppercase font-semibold tracking-wider">AI 策略建議</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                "目前「高山茶」類別轉化率最高，建議在 Day 2 加強行程導覽，預估可提升 <span className="text-brand-400 font-bold">5%</span> 淨利。"
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Footer */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat label="今日詢價" value="24" change="+8" />
        <QuickStat label="待處理訂單" value="12" change="-3" isNegativeGood />
        <QuickStat label="本週出團" value="6" change="0" />
        <QuickStat label="客戶滿意度" value="4.8" change="+0.2" suffix="/5" />
      </motion.div>
    </motion.div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: 'brand' | 'purple' | 'blue' | 'orange';
  delay: number;
}

function KPICard({ title, value, trend, icon, color, delay }: KPICardProps) {
  const colorStyles = {
    brand: {
      bg: 'bg-brand-50',
      iconBg: 'bg-gradient-brand',
      trendBg: 'bg-brand-50 text-brand-700',
    },
    purple: {
      bg: 'bg-accent-50',
      iconBg: 'bg-gradient-ocean',
      trendBg: 'bg-accent-50 text-accent-700',
    },
    blue: {
      bg: 'bg-brand-50',
      iconBg: 'bg-gradient-ocean',
      trendBg: 'bg-brand-50 text-brand-700',
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-gradient-sunset',
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
            rank === 1 ? 'bg-yellow-500 text-white' : 'bg-white/10 text-gray-400'
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
          className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
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
            isGood ? 'text-green-600' : 'text-red-500'
          )}>
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}
