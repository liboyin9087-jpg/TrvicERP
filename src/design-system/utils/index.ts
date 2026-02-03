import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 * Handles conditional classes and resolves conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a consistent color index for an avatar based on user ID or name
 */
export function getAvatarColor(userId: string): {
  background: string;
  text: string;
} {
  const palette = [
    { background: "#FF6B6B", text: "#FFFFFF" }, // Coral
    { background: "#4ECDC4", text: "#FFFFFF" }, // Teal
    { background: "#FFE66D", text: "#5D4E37" }, // Sunshine
    { background: "#95E1D3", text: "#2D5A4A" }, // Mint
    { background: "#F38181", text: "#FFFFFF" }, // Rose
    { background: "#AA96DA", text: "#FFFFFF" }, // Lavender
    { background: "#FCBAD3", text: "#6B3A4D" }, // Pink
    { background: "#A8D8EA", text: "#2C5364" }, // Sky
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return "";
  const isChinese = /[\u4e00-\u9fa5]/.test(name);
  if (isChinese) {
    return name.slice(0, 2);
  }
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Country code to flag emoji
 */
export function countryCodeToFlag(isoCode: string): string {
  if (!isoCode) return "🌏";
  return isoCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "TWD",
): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date range
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  };

  return `${formatDate(start)} - ${formatDate(end).slice(5)}`; // 2026/02/15 - 02/19
}

/**
 * Format trip duration
 */
export function formatTripDuration(days: number): string {
  return `${days}天${days - 1}夜`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Calculate SVG ring parameters
 */
export function calculateRingParams(
  diameter: number,
  strokeWidth: number,
  percentage: number,
) {
  const center = diameter / 2;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return {
    center,
    radius,
    circumference,
    dashOffset,
  };
}
