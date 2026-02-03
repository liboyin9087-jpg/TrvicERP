/**
 * TrvicERP Design System - Utility Functions
 */

import { avatarStack } from '../tokens/design-tokens';

/**
 * 合併 className 字串
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 根據用戶 ID 獲取一致的顏色索引
 */
export function getAvatarColorIndex(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % avatarStack.fallbackColors.length;
}

/**
 * 根據用戶 ID 獲取頭像背景色
 */
export function getAvatarColor(userId: string): { background: string; text: string } {
  const index = getAvatarColorIndex(userId);
  return avatarStack.fallbackColors[index];
}

/**
 * 從姓名提取縮寫
 * 中文: 取前兩個字
 * 英文: 取首字母
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  // 檢測是否為中文名
  const isChinese = /[\u4e00-\u9fa5]/.test(name);
  
  if (isChinese) {
    // 中文名取前兩個字
    return name.slice(0, 2);
  } else {
    // 英文名取每個單詞首字母，最多兩個
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return parts
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }
}

/**
 * 格式化數字 (加入千分位)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-TW');
}

/**
 * 格式化金額
 */
export function formatCurrency(amount: number, currency: string = 'TWD'): string {
  if (currency === 'TWD') {
    return `$${formatNumber(amount)}`;
  }
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化日期範圍
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
  };
  
  const startStr = start.toLocaleDateString('zh-TW', formatOptions);
  const endStr = end.toLocaleDateString('zh-TW', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

/**
 * 計算天數
 */
export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * 格式化天數顯示
 */
export function formatTripDuration(startDate: string, endDate: string): string {
  const days = calculateDays(startDate, endDate);
  const nights = days - 1;
  return `${days}天${nights}夜`;
}

/**
 * 格式化相對時間
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
  return then.toLocaleDateString('zh-TW');
}

/**
 * 計算倒數時間
 */
export function getCountdown(targetDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * 國家代碼轉國旗 Emoji
 */
export function countryCodeToFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * 截斷文字
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * 計算 SVG 圓環參數
 */
export function calculateRingParams(
  size: number,
  strokeWidth: number,
  value: number
): {
  center: number;
  radius: number;
  circumference: number;
  dashOffset: number;
} {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const dashOffset = circumference * (1 - normalizedValue / 100);
  
  return { center, radius, circumference, dashOffset };
}

/**
 * 防抖函數
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * 節流函數
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
