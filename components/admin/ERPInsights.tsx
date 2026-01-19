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
  // 模擬數據 (未來可替換為 React Query data)
  const funnelData = [
    { label: '潛在客戶', count: 1250, color: 'bg-slate-300', icon: Globe },
    { label: '意向詢價', count: 420, color: 'bg-indigo-300', icon: Activity },
    { label: '支付訂金', count: 156, color: 'bg-indigo-500', icon: Wallet },
    { label: '確認成行', count: 98, color: 'bg-indigo-600', icon: Zap },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              Live Dashboard
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">營收與通路分析</h2>
          <p className="text-slate-500 mt-1 text-sm">即時監控全通路轉化率與營收表現</p>
        </div>
        
        {/* Status Indicator Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">數據同步中</span>
            <span className="text-[10px] text-slate-400">最後更新: 剛剛</span>
          </div>
        </motion.div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="本月預估營收"
          value="$4,285,000"
          trend="+12.5%"
          icon={<DollarSign className="w-5 h-5" />}
          color="indigo"
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
          color="emerald"
          delay={0.3}
        />
      </motion.div>

      {/* Main Content Split: Funnel (Left) + Ranking (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Funnel Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <ArrowDownCircle className="text-indigo-500 w-5 h-5" />
                  銷售轉化漏斗
                </h3>
                <p className="text-xs text-slate-400 mt-1">追蹤從潛在客戶到成交的每個階段</p>
              </div>
              <button className="text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors">
                本週數據
              </button>
            </div>

            <div className="space-y-6">
              {funnelData.map((stage, i) => {
                const Icon = stage.icon;
                const percentage = (stage.count / funnelData[0].count) * 100;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    className="group relative"
                  >
                    <div className="flex items-center gap-4 z-10 relative">
                      {/* Label Section */}
                      <div className="w-24 flex-shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-slate-500">{stage.label}</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                          {stage.count.toLocaleString()}
                        </div>
                      </div>

                      {/* Bar Section */}
                      <div className="flex-1 h-10 relative bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: i * 0.15 + 0.3, duration: 0.8, ease: 'easeOut' }}
                          className={cn(
                            'h-full rounded-r-lg shadow-[2px_0_10px_rgba(0,0,0,0.05)] relative overflow-hidden',
                            stage.color
                          )}
                        >
                          {/* Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                        </motion.div>
                        
                        <div className="absolute inset-0 flex items-center px-3">
                          <Icon className={cn("w-4 h-4 z-20", percentage > 10 ? "text-white/80" : "text-slate-400")} />
                          <span className={cn(
                            "ml-2 text-xs font-bold z-20 font-mono",
                            percentage > 10 ? "text-white" : "text-slate-600"
                          )}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Conversion Rate Badge */}
                      <div className="w-16 flex-shrink-0 text-right">
                        {i > 0 && (
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            i === funnelData.length - 1 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          )}>
                            {Math.round((stage.count / funnelData[i-1].count) * 100)}% 轉化
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Connecting Line (Visual Decor) */}
                    {i < funnelData.length - 1 && (
                      <div className="absolute left-[6.5rem] top-8 bottom-[-1rem] w-px bg-slate-200 border-l border-dashed border-slate-300 z-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right: Ranking & AI Panel (Dark Theme) */}
        <motion.div variants={itemVariants}>
          <div className="bg-slate-900 text-white p-6 rounded-2xl h-full shadow-xl shadow-slate-900/10 flex flex-col relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                熱銷通路排行
              </h3>
              <span className="text-[10px] font-bold text-indigo-200 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30">
                TOP 3
              </span>
            </div>
            
            <div className="space-y-6 relative z-10 flex-1">
              <RankingItem rank={1} label="阿里山高山茶廠" value="$185,000" percent={85} />
              <RankingItem rank={2} label="奮起湖便當總部" value="$92,400" percent={45} />
              <RankingItem rank={3} label="隙頂咖啡工坊" value="$62,000" percent={28} />
            </div>

            {/* AI Suggestion Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-8 pt-6 border-t border-white/10 relative z-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">AI 策略建議</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
                 <p className="text-sm text-slate-300 leading-relaxed">
                  "目前<span className="text-white font-bold">「高山茶」</span>類別轉化率最高。建議在行程 Day 2 增加茶廠導覽時段，預估可提升 <span className="text-emerald-400 font-bold">+5%</span> 通路淨利。"
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat label="今日詢價" value="24" change="+8" />
        <QuickStat label="待處理訂單" value="12" change="-3" isNegativeGood />
        <QuickStat label="本週出團" value="6" change="0" />
        <QuickStat label="客戶滿意度" value="4.8" change="+0.2" suffix="/5" />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Sub Components
// ============================================

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: 'indigo' | 'purple' | 'blue' | 'emerald';
  delay: number;
}

function KPICard({ title, value, trend, icon, color, delay }: KPICardProps) {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-600',
      trendText: 'text-indigo-600',
      trendBg: 'bg-indigo-50',
    },
    purple: {
      iconBg: 'bg-purple-600',
      trendText: 'text-purple-600',
      trendBg: 'bg-purple-50',
    },
    blue: {
      iconBg: 'bg-blue-600',
      trendText: 'text-blue-600',
      trendBg: 'bg-blue-50',
    },
    emerald: {
      iconBg: 'bg-emerald-600',
      trendText: 'text-emerald-600',
      trendBg: 'bg-emerald-50',
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
      className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-default group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3',
          styles.iconBg
        )}>
          {icon}
        </div>
        <div className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full', styles.trendBg, styles.trendText)}>
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{value}</h4>
      </div>
    </motion.div>
  );
}

function RankingItem({ rank, label, value, percent }: { rank: number; label: string; value: string; percent: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.15 }}
    >
      <div className="flex items-center justify-between text-sm mb-2.5">
        <div className="flex items-center gap-3">
          <span className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono',
            rank === 1 ? 'bg-yellow-400 text-yellow-900' : 
            rank === 2 ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'
          )}>
            {rank}
          </span>
          <span className="text-slate-200 font-medium">{label}</span>
        </div>
        <span className="font-bold font-mono text-white">{value}</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: rank * 0.15 + 0.5, duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]",
            rank === 1 ? "bg-gradient-to-r from-yellow-400 to-orange-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
          )}
        />
      </div>
    </motion.div>
  );
}

function QuickStat({ label, value, change, suffix, isNegativeGood }: any) {
  const isPositive = change.startsWith('+');
  const isNeutral = change === '0';
  const isGood = isNegativeGood ? !isPositive : isPositive;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm"
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-900 font-mono">{value}</span>
        {suffix && <span className="text-xs text-slate-400 font-medium">{suffix}</span>}
        {!isNeutral && (
          <span className={cn(
            'text-xs font-bold',
            isGood ? 'text-emerald-600' : 'text-rose-500'
          )}>
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}