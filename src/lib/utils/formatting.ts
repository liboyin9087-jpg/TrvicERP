/**
 * Taiwan Localization Utilities
 * 台灣本地化工具函數
 */

/**
 * Format currency as NT$ (New Taiwan Dollar)
 * @param amount - Amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "NT$ 1,234")
 */
export function formatCurrency(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options || {};

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format currency as NT$ with comma separators (legacy format)
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "NT$ 1,234")
 */
export function formatCurrencyLegacy(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`;
}

/**
 * Convert Gregorian year to Minguo (Republic of China) year
 * @param gregorianYear - Gregorian calendar year (e.g., 2025)
 * @returns Minguo year (e.g., 114 for 2025)
 */
export function toMinguoYear(gregorianYear: number): number {
  return gregorianYear - 1911;
}

/**
 * Format date with Minguo calendar support
 * @param date - Date object or ISO string
 * @param options - Formatting options
 * @returns Formatted date string with optional Minguo year
 */
export function formatDate(
  date: Date | string,
  options?: {
    includeMinguo?: boolean;
    format?: 'short' | 'medium' | 'long' | 'full';
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const { includeMinguo = false, format = 'medium' } = options || {};

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
  };

  if (format === 'full') {
    formatOptions.weekday = 'long';
  }

  const gregorianDate = new Intl.DateTimeFormat('zh-TW', formatOptions).format(dateObj);

  if (includeMinguo) {
    const minguoYear = toMinguoYear(dateObj.getFullYear());
    return `${minguoYear}年 ${gregorianDate}`;
  }

  return gregorianDate;
}

/**
 * Format date range with Minguo calendar support
 * @param startDate - Start date
 * @param endDate - End date
 * @param options - Formatting options
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string,
  options?: {
    includeMinguo?: boolean;
    separator?: string;
  }
): string {
  const { includeMinguo = false, separator = ' ~ ' } = options || {};
  const start = formatDate(startDate, { includeMinguo });
  const end = formatDate(endDate, { includeMinguo });
  return `${start}${separator}${end}`;
}
