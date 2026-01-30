/**
 * TravelMaster 台灣在地化工具函式庫
 * 
 * 提供以下功能：
 * - 民國曆（ROC Calendar）轉換與格式化
 * - 新台幣（NTD）格式化
 * - 統一編號（UBN）驗證
 * - WCAG 2.1 色彩對比度檢查
 * - 台灣地址格式化
 */

// ═══════════════════════════════════════════════════════════════
// 民國曆（中華民國曆）
// ═══════════════════════════════════════════════════════════════

export const ROCCalendar = {
  /**
   * 將西元年轉換為民國年
   * @example toROCYear(new Date('2025-01-27')) // 114
   */
  toROCYear: (date: Date): number => {
    return date.getFullYear() - 1911;
  },

  /**
   * 將民國年轉換為西元年
   * @example fromROCYear(114) // 2025
   */
  fromROCYear: (rocYear: number): number => {
    return rocYear + 1911;
  },

  /**
   * 格式化日期為民國曆格式
   * @param date - 日期物件
   * @param format - 'full' 完整格式 | 'short' 簡短格式 | 'iso' ISO 格式
   * @example formatROCDate(new Date('2025-01-27'), 'full') // "民國 114 年 01 月 27 日"
   * @example formatROCDate(new Date('2025-01-27'), 'short') // "114/01/27"
   */
  formatROCDate: (
    date: Date,
    format: 'full' | 'short' | 'iso' = 'full'
  ): string => {
    const rocYear = ROCCalendar.toROCYear(date);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'short':
        return `${rocYear}/${month}/${day}`;
      case 'iso':
        return `R${rocYear}-${month}-${day}`;
      case 'full':
      default:
        return `民國 ${rocYear} 年 ${month} 月 ${day} 日`;
    }
  },

  /**
   * 解析民國曆日期字串
   * @param rocDateStr - 民國曆日期字串（支援 114/01/27 或 民國114年1月27日）
   * @returns Date 物件或 null（如果解析失敗）
   */
  parseROCDate: (rocDateStr: string): Date | null => {
    // 嘗試數字格式: 114/01/27 或 114-01-27
    const numericMatch = rocDateStr.match(/(\d+)[\/\-](\d+)[\/\-](\d+)/);
    if (numericMatch) {
      const [, rocYear, month, day] = numericMatch.map(Number);
      return new Date(rocYear + 1911, month - 1, day);
    }

    // 嘗試中文格式: 民國114年1月27日
    const chineseMatch = rocDateStr.match(/民國\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/);
    if (chineseMatch) {
      const [, rocYear, month, day] = chineseMatch.map(Number);
      return new Date(rocYear + 1911, month - 1, day);
    }

    return null;
  },

  /**
   * 取得今天的民國曆日期
   */
  today: (format: 'full' | 'short' | 'iso' = 'short'): string => {
    return ROCCalendar.formatROCDate(new Date(), format);
  },
};

// ═══════════════════════════════════════════════════════════════
// 新台幣格式化
// ═══════════════════════════════════════════════════════════════

export interface NTDFormatOptions {
  /** 是否顯示 NT$ 符號，預設 true */
  showSymbol?: boolean;
  /** 小數位數，預設 0 */
  decimals?: number;
  /** 是否使用千分位分隔符號，預設 true */
  useGrouping?: boolean;
}

export const NTDCurrency = {
  /**
   * 格式化金額為新台幣格式
   * @example format(1234567) // "NT$1,234,567"
   * @example format(1234567, { showSymbol: false }) // "1,234,567"
   */
  format: (amount: number, options: NTDFormatOptions = {}): string => {
    const { showSymbol = true, decimals = 0, useGrouping = true } = options;

    const formatted = new Intl.NumberFormat('zh-TW', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping,
    }).format(amount);

    return showSymbol ? `NT$${formatted}` : formatted;
  },

  /**
   * 解析新台幣格式字串為數字
   * @example parse("NT$1,234,567") // 1234567
   * @example parse("1,234,567") // 1234567
   */
  parse: (formatted: string): number => {
    const cleaned = formatted.replace(/[NT$,\s元]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  },

  /**
   * 格式化為簡短格式（萬/億）
   * @example formatShort(12345678) // "NT$1,235萬"
   * @example formatShort(123456789012) // "NT$1,235億"
   */
  formatShort: (amount: number, options: NTDFormatOptions = {}): string => {
    const { showSymbol = true } = options;
    const prefix = showSymbol ? 'NT$' : '';

    if (amount >= 100000000) {
      // 億
      return `${prefix}${(amount / 100000000).toLocaleString('zh-TW', { maximumFractionDigits: 0 })}億`;
    } else if (amount >= 10000) {
      // 萬
      return `${prefix}${(amount / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 0 })}萬`;
    }
    return NTDCurrency.format(amount, options);
  },
};

// ═══════════════════════════════════════════════════════════════
// 統一編號驗證
// ═══════════════════════════════════════════════════════════════

export const UBNValidator = {
  /**
   * 驗證台灣統一編號
   * 統一編號為 8 位數字，包含檢查碼驗證
   * 
   * @param ubn - 統一編號字串
   * @returns 是否有效
   * @example validate('04595257') // true (財政部)
   * @example validate('12345678') // false
   */
  validate: (ubn: string): boolean => {
    // 基本格式檢查：必須是 8 位數字
    if (!/^\d{8}$/.test(ubn)) {
      return false;
    }

    // 統一編號驗證演算法
    // 乘數係數
    const coefficients = [1, 2, 1, 2, 1, 2, 4, 1];
    const digits = ubn.split('').map(Number);

    let sum = 0;
    for (let i = 0; i < 8; i++) {
      const product = digits[i] * coefficients[i];
      // 如果乘積大於等於 10，則將十位數和個位數相加
      sum += Math.floor(product / 10) + (product % 10);
    }

    // 總和能被 10 整除則有效
    if (sum % 10 === 0) {
      return true;
    }

    // 特殊情況：第 7 位數字是 7 時，總和 + 1 能被 10 整除也算有效
    if (digits[6] === 7 && (sum + 1) % 10 === 0) {
      return true;
    }

    return false;
  },

  /**
   * 格式化統一編號（加入分隔符號）
   * @example format('04595257') // "0459-5257"
   */
  format: (ubn: string): string => {
    if (!UBNValidator.validate(ubn)) {
      return ubn;
    }
    return ubn.replace(/(\d{4})(\d{4})/, '$1-$2');
  },

  /**
   * 清理統一編號（移除所有非數字字元）
   * @example clean('0459-5257') // "04595257"
   */
  clean: (ubn: string): string => {
    return ubn.replace(/\D/g, '');
  },
};

// ═══════════════════════════════════════════════════════════════
// WCAG 2.1 色彩對比度檢查
// ═══════════════════════════════════════════════════════════════

export const WCAGContrast = {
  /**
   * 計算色彩的相對亮度
   * @param hex - 十六進位色碼（例如 #1E3A8A）
   */
  getLuminance: (hex: string): number => {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)!
      .map((c) => {
        const val = parseInt(c, 16) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  },

  /**
   * 計算兩個顏色的對比度
   * @returns 對比度比率（1 到 21 之間）
   * @example getContrastRatio('#1E3A8A', '#FFFFFF') // 約 11.76
   */
  getContrastRatio: (hex1: string, hex2: string): number => {
    const l1 = WCAGContrast.getLuminance(hex1);
    const l2 = WCAGContrast.getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * 檢查是否符合 WCAG AA 標準
   * - 正常文字: 4.5:1
   * - 大型文字 (18pt+ 或 14pt+ 粗體): 3:1
   */
  meetsAA: (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = WCAGContrast.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * 檢查是否符合 WCAG AAA 標準
   * - 正常文字: 7:1
   * - 大型文字: 4.5:1
   */
  meetsAAA: (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = WCAGContrast.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  },

  /**
   * 取得對比度等級
   * @returns 'AAA' | 'AA' | 'FAIL'
   */
  getLevel: (foreground: string, background: string, isLargeText = false): 'AAA' | 'AA' | 'FAIL' => {
    if (WCAGContrast.meetsAAA(foreground, background, isLargeText)) return 'AAA';
    if (WCAGContrast.meetsAA(foreground, background, isLargeText)) return 'AA';
    return 'FAIL';
  },
};

// ═══════════════════════════════════════════════════════════════
// 台灣地址格式化
// ═══════════════════════════════════════════════════════════════

export interface TaiwanAddress {
  postalCode?: string;
  city: string;
  district: string;
  road: string;
  lane?: string;
  alley?: string;
  number: string;
  floor?: string;
  room?: string;
}

export const TaiwanAddressFormatter = {
  /**
   * 格式化台灣地址
   * @example format({ city: '台北市', district: '中正區', road: '中山路', number: '1號', floor: '10樓' })
   * // "台北市中正區中山路1號10樓"
   */
  format: (address: TaiwanAddress): string => {
    const parts: string[] = [];

    if (address.postalCode) parts.push(address.postalCode);
    parts.push(address.city);
    parts.push(address.district);
    parts.push(address.road);
    if (address.lane) parts.push(`${address.lane}巷`);
    if (address.alley) parts.push(`${address.alley}弄`);
    parts.push(address.number);
    if (address.floor) parts.push(address.floor);
    if (address.room) parts.push(address.room);

    return parts.join('');
  },

  /**
   * 解析台灣地址字串
   * 注意：此函式僅能處理標準格式的地址
   */
  parse: (addressStr: string): Partial<TaiwanAddress> | null => {
    const result: Partial<TaiwanAddress> = {};

    // 郵遞區號
    const postalMatch = addressStr.match(/^(\d{3,5})/);
    if (postalMatch) {
      result.postalCode = postalMatch[1];
    }

    // 縣市
    const cityMatch = addressStr.match(/(台北市|新北市|桃園市|台中市|台南市|高雄市|基隆市|新竹市|嘉義市|[^\s]{2,3}縣)/);
    if (cityMatch) {
      result.city = cityMatch[1];
    }

    // 區/鄉/鎮/市
    const districtMatch = addressStr.match(/([^\s]{2,4}[區鄉鎮市])/);
    if (districtMatch) {
      result.district = districtMatch[1];
    }

    return Object.keys(result).length > 0 ? result : null;
  },
};

// ═══════════════════════════════════════════════════════════════
// TravelMaster 設計代碼參考
// ═══════════════════════════════════════════════════════════════

export const TRVIC_DESIGN_TOKENS = {
  colors: {
    // 品牌色彩
    brand: {
      navigatorBlue: '#1E3A8A',
      forestGreen: '#10B981',
    },
    // 語義色彩
    semantic: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    // 中性色
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: {
      ui: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      chinese: "'Noto Sans TC', '微軟正黑體', sans-serif",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },
} as const;

export default {
  ROCCalendar,
  NTDCurrency,
  UBNValidator,
  WCAGContrast,
  TaiwanAddressFormatter,
  TRVIC_DESIGN_TOKENS,
};
