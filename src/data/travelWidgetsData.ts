/**
 * Travel Widgets Data Adapters
 * Provides mock data and adapters for travel-themed dashboard widgets
 */

// ============================================
// Interface Definitions
// ============================================

export interface DepartureBoardSession {
  id: string;
  code: string;           // 團號（航班號）
  destination: string;    // 目的地
  date: string;          // 出發日期
  pax: number;           // 已報名人數
  maxPax: number;        // 最大人數
  status: 'boarding' | 'scheduled' | 'delayed';
}

export interface PassportRecord {
  id: string;
  name: string;
  number: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

export interface JourneyRecord {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  pax: number;
  revenue: number;
  status: 'ongoing' | 'upcoming' | 'completed';
}

export interface DestinationData {
  id: string;
  name: string;
  emoji: string;
  count: number;
  coordinates: { x: number; y: number }; // Percentage-based
}

export interface RevenueBreakdown {
  domestic: number;
  international: number;
  corporate: number;
  individual: number;
}

// ============================================
// Mock Data Providers
// ============================================

/**
 * Get departure board sessions (upcoming tours)
 */
export const getDepartureBoardSessions = (): DepartureBoardSession[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    { id: 'ses-1', code: 'TRV001', destination: '東京', date: addDays(2), pax: 28, maxPax: 30, status: 'boarding' },
    { id: 'ses-2', code: 'TRV002', destination: '首爾', date: addDays(5), pax: 25, maxPax: 35, status: 'scheduled' },
    { id: 'ses-3', code: 'TRV003', destination: '峇里島', date: addDays(7), pax: 15, maxPax: 25, status: 'scheduled' },
    { id: 'ses-4', code: 'TRV004', destination: '曼谷', date: addDays(10), pax: 20, maxPax: 30, status: 'delayed' },
    { id: 'ses-5', code: 'TRV005', destination: '新加坡', date: addDays(12), pax: 32, maxPax: 35, status: 'scheduled' },
    { id: 'ses-6', code: 'TRV006', destination: '北海道', date: addDays(15), pax: 18, maxPax: 25, status: 'scheduled' },
  ];
};

/**
 * Get passport records with expiry tracking
 */
export const getPassportRecords = (): PassportRecord[] => {
  const calculateDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const records = [
    { id: 'pp-1', name: '王小明', number: 'AB1234567', expiryDate: '2024-12-31' },
    { id: 'pp-2', name: '李小華', number: 'CD2345678', expiryDate: '2024-06-15' },
    { id: 'pp-3', name: '張大同', number: 'EF3456789', expiryDate: '2025-03-20' },
    { id: 'pp-4', name: '陳美玲', number: 'GH4567890', expiryDate: '2025-09-10' },
    { id: 'pp-5', name: '林志明', number: 'IJ5678901', expiryDate: '2024-08-25' },
    { id: 'pp-6', name: '黃淑芬', number: 'KL6789012', expiryDate: '2026-01-15' },
  ];

  return records.map(record => ({
    ...record,
    daysUntilExpiry: calculateDaysUntilExpiry(record.expiryDate),
  }));
};

/**
 * Get passport statistics
 */
export const getPassportStats = () => {
  const passports = getPassportRecords();
  const expiringPassports = passports.filter(p => p.daysUntilExpiry < 180 && p.daysUntilExpiry >= 0);
  
  return {
    totalPassports: passports.length,
    expiringPassports: expiringPassports.length,
    passports,
  };
};

/**
 * Get journey timeline data
 */
export const getJourneyTimeline = (): JourneyRecord[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    { 
      id: 'jrn-1', 
      destination: '東京', 
      startDate: addDays(-2), 
      endDate: addDays(3), 
      days: 5, 
      pax: 28, 
      revenue: 840000, 
      status: 'ongoing' 
    },
    { 
      id: 'jrn-2', 
      destination: '首爾', 
      startDate: addDays(5), 
      endDate: addDays(9), 
      days: 4, 
      pax: 25, 
      revenue: 625000, 
      status: 'upcoming' 
    },
    { 
      id: 'jrn-3', 
      destination: '峇里島', 
      startDate: addDays(15), 
      endDate: addDays(22), 
      days: 7, 
      pax: 15, 
      revenue: 750000, 
      status: 'upcoming' 
    },
    { 
      id: 'jrn-4', 
      destination: '巴黎', 
      startDate: addDays(-18), 
      endDate: addDays(-10), 
      days: 8, 
      pax: 20, 
      revenue: 1200000, 
      status: 'completed' 
    },
    { 
      id: 'jrn-5', 
      destination: '曼谷', 
      startDate: addDays(25), 
      endDate: addDays(30), 
      days: 5, 
      pax: 30, 
      revenue: 600000, 
      status: 'upcoming' 
    },
  ];
};

/**
 * Get popular destinations with analytics
 */
export const getDestinations = (): DestinationData[] => [
  { id: 'dst-1', name: '東京', emoji: '🗼', count: 45, coordinates: { x: 75, y: 35 } },
  { id: 'dst-2', name: '首爾', emoji: '🏯', count: 38, coordinates: { x: 73, y: 33 } },
  { id: 'dst-3', name: '曼谷', emoji: '🛕', count: 32, coordinates: { x: 65, y: 50 } },
  { id: 'dst-4', name: '新加坡', emoji: '🦁', count: 28, coordinates: { x: 65, y: 58 } },
  { id: 'dst-5', name: '峇里島', emoji: '🏝️', count: 25, coordinates: { x: 68, y: 62 } },
  { id: 'dst-6', name: '巴黎', emoji: '🗼', count: 22, coordinates: { x: 45, y: 28 } },
  { id: 'dst-7', name: '倫敦', emoji: '🏛️', count: 18, coordinates: { x: 43, y: 25 } },
  { id: 'dst-8', name: '羅馬', emoji: '🏛️', count: 15, coordinates: { x: 47, y: 32 } },
  { id: 'dst-9', name: '紐約', emoji: '🗽', count: 12, coordinates: { x: 25, y: 30 } },
  { id: 'dst-10', name: '雪梨', emoji: '🏖️', count: 10, coordinates: { x: 78, y: 75 } },
];

/**
 * Get revenue data with breakdown
 */
export const getRevenueData = () => {
  const journeys = getJourneyTimeline();
  const currentRevenue = journeys
    .filter(j => j.status === 'ongoing' || j.status === 'completed')
    .reduce((sum, j) => sum + j.revenue, 0);

  const breakdown: RevenueBreakdown = {
    domestic: 2500000,
    international: 3000000,
    corporate: 1500000,
    individual: 500000,
  };

  return {
    currentRevenue,
    targetRevenue: 10000000,
    percentage: (currentRevenue / 10000000) * 100,
    breakdown,
  };
};

// ============================================
// Data Hooks (for React components)
// ============================================

/**
 * Hook to get departure board data
 * In production, this would fetch from API
 */
export const useDepartureBoardData = () => {
  // In production: const [data, setData] = useState<DepartureBoardSession[]>([]);
  // useEffect(() => { fetch('/api/sessions/upcoming').then(...) }, []);
  return getDepartureBoardSessions();
};

/**
 * Hook to get passport tracker data
 */
export const usePassportData = () => {
  return getPassportStats();
};

/**
 * Hook to get journey timeline data
 */
export const useJourneyData = () => {
  return getJourneyTimeline();
};

/**
 * Hook to get world map destinations
 */
export const useDestinationsData = () => {
  return getDestinations();
};

/**
 * Hook to get revenue compass data
 */
export const useRevenueData = () => {
  return getRevenueData();
};
