import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, Phone, Mail, Calendar, TrendingUp,
  Tag, ChevronRight, Crown, Award, Medal, Shield, Plus, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility is available for conditional class joining

// --- i18n placeholder function ---
// In a real application, this would be imported from an i18n library (e.g., react-i18next).
// For the purpose of this refactor, we'll use a simple placeholder.
const t = (key: string, options?: Record<string, any>): string => {
  const translations: Record<string, string> = {
    'common.addCustomer': '新增客戶',
    'common.customerManagement': '客戶管理',
    'common.customerPlatformAndAnalytics': '客戶資料平台與分析',
    'common.totalCustomers': '總客戶數',
    'common.platinumMembers': '白金會員',
    'common.goldMembers': '金卡會員',
    'common.totalSpend': '總消費額',
    'common.searchCustomerPlaceholder': '搜尋客戶姓名、Email 或電話...',
    'common.all': '全部',
    'vipLevel.bronze': '銅卡會員',
    'vipLevel.silver': '銀卡會員',
    'vipLevel.gold': '金卡會員',
    'vipLevel.platinum': '白金會員',
    'table.customer': '客戶',
    'table.contact': '聯絡方式',
    'table.level': '等級',
    'table.spendRecord': '消費紀錄',
    'table.tags': '標籤',
    'customer.trips': '次出遊',
    'customer.lastTrip': '上次出遊',
    'customer.noMatchingCustomers': '沒有符合條件的客戶',
  };
  return translations[key] || key; // Fallback to key if translation not found
};


// --- Data Structures ---
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpend: number;
  tripCount: number;
  lastTrip?: string;
  tags: string[];
  joinDate: string;
}

// VIP 等級配置，使用語意化顏色變數，並支援國際化
const VIP_CONFIG: Record<Customer['vipLevel'], { bg: string; text: string; gradient: string; icon: React.ElementType; labelKey: string }> = {
  bronze: { bg: 'bg-info-50', text: 'text-info-700', gradient: 'from-info-400 to-info-500', icon: Medal, labelKey: 'vipLevel.bronze' },
  silver: { bg: 'bg-secondary-50', text: 'text-secondary-700', gradient: 'from-secondary-400 to-secondary-500', icon: Shield, labelKey: 'vipLevel.silver' },
  gold: { bg: 'bg-warning-50', text: 'text-warning-700', gradient: 'from-warning-400 to-warning-500', icon: Award, labelKey: 'vipLevel.gold' },
  platinum: { bg: 'bg-brand-50', text: 'text-brand-700', gradient: 'from-brand-500 to-brand-700', icon: Crown, labelKey: 'vipLevel.platinum' },
};


// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// --- Props for CustomerCDP Component ---
// 定義元件的配置介面，確保資料透過 props 傳入
interface CustomerCDPConfig {
  customers: Customer[]; // 接收客戶資料
  // 可以添加其他配置項，例如國際化資源、特定功能開關等
}

// 定義 CustomerCDP 元件的 props 介面
interface CustomerCDPProps {
  config: CustomerCDPConfig;
}

// --- CustomerCDP Component ---
export default function CustomerCDP({ config }: CustomerCDPProps) {
  const [search, setSearch] = useState('');
  const [selectedVip, setSelectedVip] = useState<Customer['vipLevel'] | null>(null);

  // 從 props 獲取客戶資料
  const { customers } = config;

  // 根據搜尋和篩選條件處理客戶資料
  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .filter(c => !selectedVip || c.vipLevel === selectedVip);

  // 計算統計數據
  const stats = {
    total: customers.length,
    platinum: customers.filter(c => c.vipLevel === 'platinum').length,
    gold: customers.filter(c => c.vipLevel === 'gold').length,
    totalSpend: customers.reduce((sum, c) => sum + c.totalSpend, 0),
  };

  return (
    // 外層包裹標準 Card 結構，並設定拖曳區
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* 拖曳區 (Drag Handle) */}
      <div className="drag-handle flex items-center justify-between pb-4 border-b border-muted-200 -mt-2 -mx-2">
        <GripVertical className="w-5 h-5 text-muted-foreground/60 cursor-grab" />
        <span className="text-xs font-semibold text-muted-foreground">{t('common.customerManagement')} Widget</span>
        <div className="w-5 h-5"></div> {/* 佔位符以保持對稱 */}
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold bg-muted-100 text-muted-700 px-2 py-1 rounded-full focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
              CDP
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">{t('common.customerManagement')}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('common.customerPlatformAndAnalytics')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-pill btn-pill-primary gap-2 text-sm focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
        >
          <Plus className="w-4 h-4" />
          {t('common.addCustomer')}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label={t('common.totalCustomers')} value={stats.total} />
        <StatCard icon={Crown} label={t('common.platinumMembers')} value={stats.platinum} color="brand" />
        <StatCard icon={Award} label={t('common.goldMembers')} value={stats.gold} color="warning" />
        <StatCard icon={TrendingUp} label={t('common.totalSpend')} value={`NT$ ${(stats.totalSpend / 10000).toFixed(0)}萬`} color="success" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.searchCustomerPlaceholder')}
            className="input-modern w-full pl-12 pr-4 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted-100 rounded-lg focus-within:ring-2 focus-within:ring-brand-300">
          <button
            onClick={() => setSelectedVip(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-300 active:bg-brand-800',
              !selectedVip ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-200 hover:text-foreground'
            )}
          >
            {t('common.all')}
          </button>
          {Object.entries(VIP_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedVip(selectedVip === key ? null : key as Customer['vipLevel'])}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-300 active:bg-brand-800',
                selectedVip === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-200 hover:text-foreground'
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              {t(config.labelKey)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Customer Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('table.customer')}</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('table.contact')}</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('table.level')}</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('table.spendRecord')}</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('table.tags')}</th>
                <th className="text-right px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {filteredCustomers.map((customer, index) => {
                const vipConfig = VIP_CONFIG[customer.vipLevel];
                const VipIcon = vipConfig.icon;

                return (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted-50/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    tabIndex={0}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg',
                          vipConfig.gradient
                        )}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{customer.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {customer.tripCount} {t('customer.trips')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                          {customer.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
                          {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold',
                        vipConfig.bg, vipConfig.text
                      )}>
                        <VipIcon className="w-3.5 h-3.5" />
                        {t(vipConfig.labelKey)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          NT$ {customer.totalSpend.toLocaleString()}
                        </p>
                        {customer.lastTrip && (
                          <p className="text-sm text-muted-foreground/60 mt-1">
                            {t('customer.lastTrip')} {customer.lastTrip}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {customer.tags.length > 0 ? (
                          customer.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted-100 rounded-lg text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-300"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground/60">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <motion.button
                        whileHover={{ scale: 1.1, x: 2 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-muted-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      >
                        <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted-100 flex items-center justify-center mx-auto mb-4 focus:ring-2 focus:ring-brand-300">
              <Search className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm">{t('customer.noMatchingCustomers')}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- StatCard Component (Helper) ---
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: 'brand' | 'warning' | 'success' | 'info'; // 使用語意化顏色變數
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  // 將語意化顏色名稱映射到 Tailwind CSS 類別
  const colorStyles = {
    brand: 'from-brand-500 to-brand-700',
    warning: 'from-warning-500 to-warning-700',
    success: 'from-success-500 to-success-700',
    info: 'from-info-500 to-info-700',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-4 text-sm cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          color ? `bg-gradient-to-br ${colorStyles[color]}` : 'bg-muted-100'
        )}>
          <Icon className={cn('w-5 h-5', color ? 'text-white' : 'text-muted-foreground')} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}