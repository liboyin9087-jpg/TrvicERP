// =====================================================
// TravelCanvas - Mock Data Service
// 本地資料服務，無需外部資料庫連線
// =====================================================

import type { 
  TravelPackage, 
  Booking, 
  Customer, 
  Destination,
  WarningReport,
  Supplier,
  RFPRequest,
  VersionHistory
} from './types';

// =====================================================
// 模擬資料
// =====================================================

const MOCK_DESTINATIONS: Destination[] = [
  {
    id: 'dest-1',
    name: '東京都會圈',
    country: '日本',
    city: '東京',
    description: '現代與傳統的完美融合，從繁華的新宿到古老的淺草',
    image_url: 'https://picsum.photos/id/1076/800/600',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-12-01'
  },
  {
    id: 'dest-2',
    name: '大阪關西',
    country: '日本',
    city: '大阪',
    description: '美食之都，環球影城與歷史古蹟的絕佳組合',
    image_url: 'https://picsum.photos/id/1029/800/600',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-12-01'
  },
  {
    id: 'dest-3',
    name: '首爾購物天堂',
    country: '韓國',
    city: '首爾',
    description: 'K-POP文化、美妝購物與道地韓式料理',
    image_url: 'https://picsum.photos/id/1080/800/600',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-12-01'
  }
];

const MOCK_PACKAGES: TravelPackage[] = [
  {
    id: 'pkg-1',
    destination_id: 'dest-1',
    name: '東京輕奢5日',
    description: '入住新宿五星飯店，專車接送，含米其林晚餐體驗',
    duration_days: 5,
    base_price: 42900,
    currency: 'TWD',
    max_capacity: 25,
    image_url: 'https://picsum.photos/id/1076/800/600',
    features: ['五星飯店', '專車接送', '米其林晚餐', '免排隊快速通關'],
    is_active: true,
    created_at: '2024-01-15',
    updated_at: '2024-12-20',
    destination: MOCK_DESTINATIONS[0]
  },
  {
    id: 'pkg-2',
    destination_id: 'dest-2',
    name: '大阪環球5日',
    description: '環球影城VIP通道，道頓堀美食探索，京都一日遊',
    duration_days: 5,
    base_price: 38900,
    currency: 'TWD',
    max_capacity: 30,
    image_url: 'https://picsum.photos/id/1029/800/600',
    features: ['環球VIP', '美食探索', '京都和服體驗', '免稅購物'],
    is_active: true,
    created_at: '2024-02-01',
    updated_at: '2024-12-18',
    destination: MOCK_DESTINATIONS[1]
  },
  {
    id: 'pkg-3',
    destination_id: 'dest-3',
    name: '首爾購物4日',
    description: '明洞購物、江南美食、韓服體驗完整行程',
    duration_days: 4,
    base_price: 25900,
    currency: 'TWD',
    max_capacity: 20,
    image_url: 'https://picsum.photos/id/1080/800/600',
    features: ['明洞購物', '韓服體驗', '汗蒸幕', 'K-Beauty課程'],
    is_active: true,
    created_at: '2024-03-01',
    updated_at: '2024-12-15',
    destination: MOCK_DESTINATIONS[2]
  }
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    user_id: null,
    first_name: '王',
    last_name: '小明',
    email: 'wang.ming@techcorp.com.tw',
    phone: '0912-345-678',
    address: '台北市信義區松仁路100號',
    city: '台北市',
    country: '台灣',
    passport_number: null,
    date_of_birth: '1985-06-15',
    company: '台積電',
    role: '福委會主委',
    created_at: '2024-06-01',
    updated_at: '2024-12-01'
  },
  {
    id: 'cust-2',
    user_id: null,
    first_name: '李',
    last_name: '美玲',
    email: 'li.meiling@bank.com.tw',
    phone: '0923-456-789',
    address: '台北市中山區南京東路50號',
    city: '台北市',
    country: '台灣',
    passport_number: null,
    date_of_birth: '1990-03-22',
    company: '中國信託',
    role: '人資專員',
    created_at: '2024-07-15',
    updated_at: '2024-12-10'
  }
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    customer_id: 'cust-1',
    package_id: 'pkg-1',
    booking_number: 'BK20250115-0001',
    travel_date: '2025-01-15',
    return_date: '2025-01-19',
    number_of_travelers: 40,
    total_price: 1716000,
    currency: 'TWD',
    status: 'confirmed',
    payment_status: 'partial',
    notes: '台積電福委會員旅，需素食5位',
    created_by: 'admin',
    created_at: '2024-11-20',
    updated_at: '2024-12-20',
    customer: MOCK_CUSTOMERS[0],
    package: MOCK_PACKAGES[0]
  },
  {
    id: 'book-2',
    customer_id: 'cust-2',
    package_id: 'pkg-2',
    booking_number: 'BK20250120-0002',
    travel_date: '2025-01-20',
    return_date: '2025-01-24',
    number_of_travelers: 25,
    total_price: 972500,
    currency: 'TWD',
    status: 'pending',
    payment_status: 'unpaid',
    notes: '中信銀行部門旅遊',
    created_by: 'admin',
    created_at: '2024-12-01',
    updated_at: '2024-12-15',
    customer: MOCK_CUSTOMERS[1],
    package: MOCK_PACKAGES[1]
  }
];

// =====================================================
// 反雷資料庫 Mock
// =====================================================

const MOCK_WARNING_REPORTS: WarningReport[] = [
  {
    id: 'warn-1',
    supplier_id: 'sup-hotel-1',
    supplier_name: '淺草某飯店',
    supplier_type: 'hotel',
    severity: 'high',
    category: 'quality',
    title: '設施老舊，與照片嚴重不符',
    description: '房間照片使用5年前翻新時拍攝，實際設備老舊，地毯有霉味，熱水不穩定',
    evidence: ['客訴照片3張', '退款紀錄'],
    reported_by: 'agency-001',
    reported_at: '2024-11-15',
    verified: true,
    verified_by: 'admin',
    trust_score: 85,
    view_count: 127,
    is_active: true
  },
  {
    id: 'warn-2',
    supplier_id: 'sup-restaurant-1',
    supplier_name: '某團餐餐廳',
    supplier_type: 'restaurant',
    severity: 'medium',
    category: 'service',
    title: '出餐速度慢，影響行程',
    description: '40人團餐等待超過1小時，導致後續景點行程延誤',
    evidence: ['導遊回報'],
    reported_by: 'agency-002',
    reported_at: '2024-10-20',
    verified: true,
    verified_by: 'admin',
    trust_score: 72,
    view_count: 89,
    is_active: true
  },
  {
    id: 'warn-3',
    supplier_id: 'sup-bus-1',
    supplier_name: 'XX遊覽車公司',
    supplier_type: 'transport',
    severity: 'critical',
    category: 'safety',
    title: '車輛老舊，安全疑慮',
    description: '冷氣故障、安全帶損壞，司機疲勞駕駛',
    evidence: ['現場照片', '客訴信函', '公會通報'],
    reported_by: 'agency-003',
    reported_at: '2024-12-01',
    verified: true,
    verified_by: 'tourism_association',
    trust_score: 95,
    view_count: 342,
    is_active: true
  }
];

// =====================================================
// 供應商 Mock
// =====================================================

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-hotel-1',
    name: '新宿凱悅酒店',
    type: 'hotel',
    category: '五星級',
    location: '東京新宿',
    contact_name: '田中太郎',
    contact_phone: '+81-3-1234-5678',
    contact_email: 'tanaka@hyatt.com',
    payment_terms: 'NET30',
    commission_rate: 12,
    contract_start: '2024-01-01',
    contract_end: '2025-12-31',
    rating: 4.8,
    warning_count: 0,
    total_bookings: 45,
    total_revenue: 2850000,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-12-01'
  },
  {
    id: 'sup-restaurant-2',
    name: '黑門市場合作店',
    type: 'restaurant',
    category: '特色餐廳',
    location: '大阪難波',
    contact_name: '鈴木一郎',
    contact_phone: '+81-6-2345-6789',
    contact_email: 'suzuki@kuromon.jp',
    payment_terms: 'NET15',
    commission_rate: 8,
    contract_start: '2024-03-01',
    contract_end: '2025-02-28',
    rating: 4.5,
    warning_count: 1,
    total_bookings: 28,
    total_revenue: 420000,
    is_active: true,
    created_at: '2024-03-01',
    updated_at: '2024-11-15'
  }
];

// =====================================================
// RFP 請求 Mock
// =====================================================

const MOCK_RFP_REQUESTS: RFPRequest[] = [
  {
    id: 'rfp-1',
    company_name: '聯發科技',
    contact_name: '陳志明',
    contact_email: 'chen.zm@mediatek.com',
    contact_phone: '0912-111-222',
    employee_count: 50,
    budget_per_person: { min: 25000, max: 35000 },
    preferred_destinations: ['日本', '韓國'],
    preferred_dates: { start: '2025-03-15', end: '2025-03-22' },
    duration_days: 5,
    special_requirements: ['素食10人', '無障礙需求2人', '需要團體保險'],
    created_at: '2024-12-20',
    status: 'open',
    quote_count: 3,
    deadline: '2025-01-15'
  },
  {
    id: 'rfp-2',
    company_name: '國泰人壽',
    contact_name: '林美華',
    contact_email: 'lin.mh@cathaylife.com.tw',
    contact_phone: '0923-333-444',
    employee_count: 80,
    budget_per_person: { min: 30000, max: 45000 },
    preferred_destinations: ['日本'],
    preferred_dates: { start: '2025-04-01', end: '2025-04-10' },
    duration_days: 6,
    special_requirements: ['高階主管專車', '米其林餐廳', '購物時間充足'],
    created_at: '2024-12-22',
    status: 'open',
    quote_count: 5,
    deadline: '2025-02-01'
  }
];

// =====================================================
// 版本歷史 Mock
// =====================================================

const MOCK_VERSION_HISTORY: VersionHistory[] = [
  {
    id: 'ver-1',
    entity_type: 'itinerary',
    entity_id: 'itin-1',
    version: 1,
    changes: [],
    created_by: 'agency-001',
    created_at: '2024-12-01T10:00:00Z',
    note: '初始版本'
  },
  {
    id: 'ver-2',
    entity_type: 'itinerary',
    entity_id: 'itin-1',
    version: 2,
    changes: [
      { field: 'accommodation', old_value: '商務飯店', new_value: '五星飯店', price_impact: 8000 },
      { field: 'meal_day2', old_value: '團餐', new_value: '米其林餐廳', price_impact: 2500 }
    ],
    created_by: 'client-001',
    created_at: '2024-12-05T14:30:00Z',
    note: '客戶要求升等住宿與餐食'
  },
  {
    id: 'ver-3',
    entity_type: 'itinerary',
    entity_id: 'itin-1',
    version: 3,
    changes: [
      { field: 'activity_day3', old_value: '自由活動', new_value: '和服體驗', price_impact: 1500 },
      { field: 'transport', old_value: '大巴', new_value: '中巴+專車', price_impact: 3000 }
    ],
    created_by: 'agency-001',
    created_at: '2024-12-10T09:15:00Z',
    note: '配合人數調整交通方案'
  }
];

// =====================================================
// 資料存取 API
// =====================================================

// 模擬網路延遲
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchDestinations = async (): Promise<Destination[]> => {
  await delay(300);
  return [...MOCK_DESTINATIONS];
};

export const fetchTravelPackages = async (): Promise<TravelPackage[]> => {
  await delay(400);
  return [...MOCK_PACKAGES];
};

export const fetchPackageById = async (id: string): Promise<TravelPackage | null> => {
  await delay(200);
  return MOCK_PACKAGES.find(p => p.id === id) || null;
};

export const fetchBookings = async (): Promise<Booking[]> => {
  await delay(400);
  return [...MOCK_BOOKINGS];
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  await delay(300);
  return [...MOCK_CUSTOMERS];
};

// =====================================================
// 反雷資料庫 API
// =====================================================

export const fetchWarningReports = async (filters?: {
  supplier_type?: string;
  severity?: string;
  verified_only?: boolean;
}): Promise<WarningReport[]> => {
  await delay(300);
  let results = [...MOCK_WARNING_REPORTS];
  
  if (filters?.supplier_type) {
    results = results.filter(w => w.supplier_type === filters.supplier_type);
  }
  if (filters?.severity) {
    results = results.filter(w => w.severity === filters.severity);
  }
  if (filters?.verified_only) {
    results = results.filter(w => w.verified);
  }
  
  return results;
};

export const submitWarningReport = async (report: Omit<WarningReport, 'id' | 'reported_at' | 'verified' | 'trust_score' | 'view_count'>): Promise<WarningReport> => {
  await delay(500);
  const newReport: WarningReport = {
    ...report,
    id: `warn-${Date.now()}`,
    reported_at: new Date().toISOString(),
    verified: false,
    trust_score: 50,
    view_count: 0,
    is_active: true
  };
  MOCK_WARNING_REPORTS.push(newReport);
  return newReport;
};

export const getSupplierWarningScore = async (supplierId: string): Promise<{
  score: number;
  warning_count: number;
  last_warning: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}> => {
  await delay(200);
  const warnings = MOCK_WARNING_REPORTS.filter(w => w.supplier_id === supplierId && w.is_active);
  const warningCount = warnings.length;
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let score = 100;
  
  warnings.forEach(w => {
    if (w.severity === 'critical') score -= 30;
    else if (w.severity === 'high') score -= 20;
    else if (w.severity === 'medium') score -= 10;
    else score -= 5;
  });
  
  score = Math.max(0, score);
  
  if (score < 40) riskLevel = 'critical';
  else if (score < 60) riskLevel = 'high';
  else if (score < 80) riskLevel = 'medium';
  
  return {
    score,
    warning_count: warningCount,
    last_warning: warnings[0]?.reported_at || null,
    risk_level: riskLevel
  };
};

// =====================================================
// 供應商 API
// =====================================================

export const fetchSuppliers = async (type?: string): Promise<Supplier[]> => {
  await delay(300);
  if (type) {
    return MOCK_SUPPLIERS.filter(s => s.type === type);
  }
  return [...MOCK_SUPPLIERS];
};

export const getSupplierPayables = async (_supplierId: string): Promise<{
  pending: number;
  due_soon: number;
  overdue: number;
  total: number;
}> => {
  await delay(200);
  // 模擬應付帳款
  return {
    pending: 125000,
    due_soon: 85000,
    overdue: 0,
    total: 210000
  };
};

// =====================================================
// RFP API
// =====================================================

export const fetchRFPRequests = async (status?: string): Promise<RFPRequest[]> => {
  await delay(300);
  if (status) {
    return MOCK_RFP_REQUESTS.filter(r => r.status === status);
  }
  return [...MOCK_RFP_REQUESTS];
};

export const createRFPRequest = async (request: Omit<RFPRequest, 'id' | 'created_at' | 'status' | 'quote_count'>): Promise<RFPRequest> => {
  await delay(500);
  const newRequest: RFPRequest = {
    ...request,
    id: `rfp-${Date.now()}`,
    created_at: new Date().toISOString(),
    status: 'open',
    quote_count: 0
  };
  MOCK_RFP_REQUESTS.push(newRequest);
  return newRequest;
};

// =====================================================
// 版本控制 API
// =====================================================

export const fetchVersionHistory = async (entityType: string, entityId: string): Promise<VersionHistory[]> => {
  await delay(300);
  return MOCK_VERSION_HISTORY.filter(v => v.entity_type === entityType && v.entity_id === entityId);
};

export const compareVersions = async (v1Id: string, v2Id: string): Promise<{
  changes: Array<{ field: string; old_value: any; new_value: any; price_impact: number }>;
  total_price_impact: number;
  changed_by: string;
  changed_at: string;
}> => {
  await delay(200);
  const v1 = MOCK_VERSION_HISTORY.find(v => v.id === v1Id);
  const v2 = MOCK_VERSION_HISTORY.find(v => v.id === v2Id);
  
  if (!v1 || !v2) {
    return { changes: [], total_price_impact: 0, changed_by: '', changed_at: '' };
  }
  
  const totalImpact = v2.changes.reduce((sum, c) => sum + (c.price_impact || 0), 0);
  
  return {
    changes: v2.changes,
    total_price_impact: totalImpact,
    changed_by: v2.created_by,
    changed_at: v2.created_at
  };
};

// =====================================================
// 智慧報價 API
// =====================================================

export const getHistoricalPricing = async (params: {
  destination: string;
  duration: number;
  month: number;
}): Promise<{
  avg_price: number;
  min_price: number;
  max_price: number;
  trend: 'up' | 'down' | 'stable';
  sample_count: number;
}> => {
  await delay(300);
  // 模擬歷史價格分析
  const basePrice = params.destination.includes('東京') ? 42000 : 35000;
  const seasonMultiplier = [3, 4, 5, 10, 11, 12].includes(params.month) ? 1.2 : 1.0;
  
  return {
    avg_price: Math.round(basePrice * seasonMultiplier),
    min_price: Math.round(basePrice * 0.85 * seasonMultiplier),
    max_price: Math.round(basePrice * 1.25 * seasonMultiplier),
    trend: params.month >= 10 ? 'up' : 'stable',
    sample_count: 47
  };
};

export const calculateProfitMargin = async (params: {
  base_cost: number;
  selling_price: number;
  pax_count: number;
  fixed_costs: number;
}): Promise<{
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  margin_percent: number;
  break_even_pax: number;
}> => {
  await delay(200);
  const totalRevenue = params.selling_price * params.pax_count;
  const totalCost = (params.base_cost * params.pax_count) + params.fixed_costs;
  const grossProfit = totalRevenue - totalCost;
  const marginPercent = (grossProfit / totalRevenue) * 100;
  const breakEvenPax = Math.ceil(params.fixed_costs / (params.selling_price - params.base_cost));
  
  return {
    total_revenue: totalRevenue,
    total_cost: totalCost,
    gross_profit: grossProfit,
    margin_percent: Math.round(marginPercent * 10) / 10,
    break_even_pax: breakEvenPax
  };
};

// =====================================================
// 類型匯出
// =====================================================

export type { 
  TravelPackage, 
  Booking, 
  Customer, 
  Destination,
  WarningReport,
  Supplier,
  RFPRequest,
  VersionHistory
};
