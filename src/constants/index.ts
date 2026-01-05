import { Language } from '../types';
// =====================================================
// TravelCanvas - 常數與配置資料
// =====================================================

import { 
  Category, 
  TripConfig, 
  BadgeType, 
  ItineraryItem, 
  GuideContact,
  TourGroup,
  CompetitorHotel,
  HotelOption,
  TranslationDict,
  DashboardStats
} from '../types';

// =====================================================
// 行程配置
// =====================================================

export const TRIP_CONFIG: TripConfig = {
  basePrice: 30000,
  currency: 'TWD',
  tripName: '大阪京都：黃金路線',
  duration: '5 天 / 4 夜',
  minGroupSize: 16,
};

// Helper 函數
const getImg = (id: number) => `https://picsum.photos/id/${id}/800/600`;

// =====================================================
// 選配類別 (Tesla-style Configurator)
// =====================================================

export const CATEGORIES: Category[] = [
  {
    id: 'accommodation',
    title: '住宿等級',
    description: '您希望在哪裡為旅程充電？',
    options: [
      {
        id: 'hotel_standard',
        title: '市中心標準商務',
        description: '乾淨、現代化的三星級商務酒店，鄰近地鐵站。',
        priceModifier: 0,
        imageUrl: getImg(122),
        badgeText: '導遊推薦',
        badgeType: BadgeType.GLORY,
        specData: {
          buildYear: 2019,
          distanceToStation: 3,
          roomSize: 18,
          tags: ['#近地鐵', '#免費早餐', '#獨立衛浴']
        },
        competitorBenchmark: {
          name: '一般團客飯店 (新大阪區)',
          buildYear: 1998,
          distanceToStation: 15,
          roomSize: 12,
          tags: ['#設施老舊', '#團客吵雜', '#無免稅店不給走'],
          hiddenCost: 4500,
          description: '25 年歷史老飯店，設備與隔音皆有年代感，離市區需轉車。'
        }
      },
      {
        id: 'hotel_luxury',
        title: '五星級河畔奢華',
        description: '寬敞套房，享有河景並包含行政酒廊使用權。',
        priceModifier: 12500,
        imageUrl: getImg(164),
        badgeText: '僅剩 3 間房',
        badgeType: BadgeType.URGENCY,
        specData: {
          buildYear: 2023,
          distanceToStation: 0,
          roomSize: 45,
          tags: ['#全新落成', '#地鐵直結', '#網紅打卡點']
        },
        competitorBenchmark: {
          name: '老牌五星飯店 (梅田外圍)',
          buildYear: 1990,
          distanceToStation: 12,
          roomSize: 28,
          tags: ['#裝潢過氣', '#插座不夠', '#Wifi慢'],
          hiddenCost: 6000,
          description: '雖然掛著五星招牌，但內裝停留在昭和時代，地毯有霉味。'
        }
      },
    ],
  },
  {
    id: 'dining',
    title: '美食體驗',
    description: '定義您的味蕾之旅。',
    options: [
      {
        id: 'dining_local',
        title: '在地隱藏美食',
        description: '精選在地人推薦的居酒屋與街頭小吃清單。',
        priceModifier: 0,
        imageUrl: getImg(431),
        badgeType: BadgeType.NONE,
        specData: {
          buildYear: 2024,
          distanceToStation: 5,
          roomSize: 0,
          tags: ['#現點現做', '#在地食材', '#無需排隊']
        },
        competitorBenchmark: {
          name: '一般團餐 (吃到飽)',
          buildYear: 1980,
          distanceToStation: 20,
          roomSize: 0,
          tags: ['#口味普通', '#人擠人', '#千篇一律'],
          hiddenCost: 1000,
          description: '為了應付大量遊客的流水線餐點，食材普通且環境吵雜。'
        }
      },
      {
        id: 'dining_michelin',
        title: '米其林星級饗宴',
        description: '安排一餐米其林星級或推薦餐廳（需提前預訂）。',
        priceModifier: 5000,
        imageUrl: getImg(292),
        badgeText: '需提前2月預訂',
        badgeType: BadgeType.URGENCY,
        specData: {
          buildYear: 2020,
          distanceToStation: 10,
          roomSize: 0,
          tags: ['#極致服務', '#當季限定', '#視覺享受']
        },
        competitorBenchmark: {
          name: '網紅打卡餐廳',
          buildYear: 2021,
          distanceToStation: 5,
          roomSize: 0,
          tags: ['#貴又難吃', '#拍照好看但難吃', '#服務冷淡'],
          hiddenCost: 2000,
          description: '只有裝潢好看，餐點品質與價格不成正比，經常需要排隊。'
        }
      }
    ],
  },
  {
    id: 'activity',
    title: '體驗活動',
    description: '選擇您想要的獨特體驗。',
    options: [
      {
        id: 'activity_basic',
        title: '經典景點巡禮',
        description: '金閣寺、清水寺、伏見稻荷等必訪景點。',
        priceModifier: 0,
        imageUrl: getImg(104),
        badgeType: BadgeType.NONE,
        specData: {
          buildYear: 2024,
          distanceToStation: 0,
          roomSize: 0,
          tags: ['#經典必訪', '#專業導覽', '#免排隊']
        }
      },
      {
        id: 'activity_premium',
        title: '和服茶道體驗',
        description: '專人協助穿著和服，體驗正統抹茶道文化。',
        priceModifier: 3500,
        imageUrl: getImg(225),
        badgeText: '人氣推薦',
        badgeType: BadgeType.GLORY,
        specData: {
          buildYear: 2024,
          distanceToStation: 0,
          roomSize: 0,
          tags: ['#專業指導', '#拍照服務', '#文化深度']
        }
      }
    ],
  }
];

// =====================================================
// 導遊聯絡資訊
// =====================================================

export const GUIDE_CONTACT: GuideContact = {
  name: '田中 太郎',
  phone: '+81-90-1234-5678',
  lineId: 'tanaka_guide',
  avatarUrl: 'https://i.pravatar.cc/150?u=tanaka'
};

// =====================================================
// 今日行程生成器
// =====================================================

export const generateTodaysItinerary = (): ItineraryItem[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  const setTime = (h: number, m: number) => new Date(year, month, date, h, m);

  return [
    {
      id: '1',
      startTime: setTime(8, 30),
      endTime: setTime(9, 30),
      activityName: '飯店早餐 & 集合',
      locationName: '飯店大廳',
      geo: { lat: 34.7024, lng: 135.4959 },
      type: 'MEETING',
      imageUrl: getImg(10),
      tips: '請攜帶護照與隨身行李，今日將更換飯店。',
      isImportant: true
    },
    {
      id: '2',
      startTime: setTime(10, 0),
      endTime: setTime(12, 0),
      activityName: '大阪城公園巡禮',
      locationName: '大阪城天守閣',
      geo: { lat: 34.6873, lng: 135.5262 },
      type: 'ACTIVITY',
      imageUrl: getImg(104),
      tips: '建議穿著好走的鞋子，天守閣內樓梯較多。'
    },
    {
      id: '3',
      startTime: setTime(12, 30),
      endTime: setTime(14, 0),
      activityName: '黑門市場美食探索',
      locationName: '黑門市場',
      geo: { lat: 34.6654, lng: 135.5071 },
      type: 'MEAL',
      imageUrl: getImg(292),
      tips: '推薦嘗試：海膽、和牛串燒、豆漿。自費行程。'
    },
    {
      id: '4',
      startTime: setTime(14, 30),
      endTime: setTime(17, 0),
      activityName: '心齋橋自由購物',
      locationName: '心齋橋筋商店街',
      geo: { lat: 34.6713, lng: 135.5016 },
      type: 'FREE',
      imageUrl: getImg(3),
      tips: '藥妝店比價建議：大國藥妝通常較便宜，松本清品項全。'
    },
    {
      id: '5',
      startTime: setTime(18, 0),
      endTime: setTime(20, 0),
      activityName: '道頓堀遊船晚餐',
      locationName: '道頓堀川',
      geo: { lat: 34.6687, lng: 135.5013 },
      type: 'ACTIVITY',
      imageUrl: getImg(400),
      tips: '已預約包船，請於 17:50 前至太左衛門橋下集合。'
    }
  ];
};

// =====================================================
// DEMO 團控資料
// =====================================================

export const DEMO_TOUR_GROUPS: TourGroup[] = [
  {
    id: '1',
    group_code: 'JP001-20250115',
    product_code: 'JP001',
    product_name: '東京輕奢5日',
    destination: '日本東京',
    departure_date: '2025-01-15',
    return_date: '2025-01-19',
    price_b2b: 18000,
    price_b2c: 24900,
    total_seats: 25,
    reserved_seats: 3,
    sold_seats: 20,
    available_seats: 2,
    occupancy_rate: 92,
    urgency_level: 'critical',
    status: 'open',
    status_display: '報名中',
    guide_name: '王小明',
    guide_phone: '0912345678',
  },
  {
    id: '2',
    group_code: 'JP001-20250118',
    product_code: 'JP001',
    product_name: '東京輕奢5日',
    destination: '日本東京',
    departure_date: '2025-01-18',
    return_date: '2025-01-22',
    price_b2b: 18000,
    price_b2c: 24900,
    total_seats: 25,
    reserved_seats: 2,
    sold_seats: 19,
    available_seats: 4,
    occupancy_rate: 84,
    urgency_level: 'urgent',
    status: 'open',
    status_display: '報名中',
  },
  {
    id: '3',
    group_code: 'JP002-20250120',
    product_code: 'JP002',
    product_name: '大阪環球5日',
    destination: '日本大阪',
    departure_date: '2025-01-20',
    return_date: '2025-01-24',
    price_b2b: 22000,
    price_b2c: 28900,
    total_seats: 30,
    reserved_seats: 0,
    sold_seats: 30,
    available_seats: 0,
    occupancy_rate: 100,
    urgency_level: 'full',
    status: 'full',
    status_display: '額滿候補',
  },
  {
    id: '4',
    group_code: 'KR001-20250122',
    product_code: 'KR001',
    product_name: '首爾購物4日',
    destination: '韓國首爾',
    departure_date: '2025-01-22',
    return_date: '2025-01-25',
    price_b2b: 15000,
    price_b2c: 19900,
    total_seats: 20,
    reserved_seats: 2,
    sold_seats: 8,
    available_seats: 10,
    occupancy_rate: 50,
    urgency_level: 'normal',
    status: 'open',
    status_display: '報名中',
  },
  {
    id: '5',
    group_code: 'JP001-20250125',
    product_code: 'JP001',
    product_name: '東京輕奢5日',
    destination: '日本東京',
    departure_date: '2025-01-25',
    return_date: '2025-01-29',
    price_b2b: 19000,
    price_b2c: 25900,
    total_seats: 25,
    reserved_seats: 1,
    sold_seats: 5,
    available_seats: 19,
    occupancy_rate: 24,
    urgency_level: 'normal',
    status: 'open',
    status_display: '報名中',
  },
];

// =====================================================
// DEMO 競品飯店資料
// =====================================================

export const DEMO_COMPETITORS: CompetitorHotel[] = [
  {
    id: '1',
    hotel_name: '東橫INN新宿',
    location: '新宿三丁目',
    star_rating: 3,
    year_built: 2005,
    year_renovated: 2018,
    tags: ['商務旅館', '房間小', '連鎖品牌'],
    pros: ['價格便宜', '位置方便', '有免費早餐'],
    cons: ['房間僅13平米', '隔音差', '服務制式化', '早餐簡陋'],
    typical_price_range: { min: 3500, max: 5500 },
    verified: true,
  },
  {
    id: '2',
    hotel_name: 'APA飯店',
    location: '新宿歌舞伎町',
    star_rating: 3,
    year_built: 2010,
    tags: ['連鎖商旅', '設備老舊', '團客多'],
    pros: ['24小時大浴場', '位置方便'],
    cons: ['房間極小僅11平米', '浴室超窄', '床很硬', '團客太多很吵'],
    typical_price_range: { min: 3200, max: 5000 },
    verified: true,
  },
  {
    id: '3',
    hotel_name: '淺草某飯店',
    location: '淺草',
    star_rating: 2,
    year_built: 1995,
    tags: ['老舊', '離景點近', '便宜'],
    pros: ['價格超便宜', '離淺草寺近'],
    cons: ['設備非常老舊', '無電梯', '房間有霉味', '洗手台破損'],
    typical_price_range: { min: 2500, max: 3500 },
    verified: false,
  },
];

// =====================================================
// DEMO 飯店選項
// =====================================================

export const DEMO_HOTELS: HotelOption[] = [
  {
    id: '1',
    hotel_name: '新宿凱悅酒店',
    location: '新宿站西口',
    star_rating: 5,
    distance_to_station: '步行1分鐘直結',
    room_size: 45,
    year_built: 2020,
    tags: ['#地鐵直結', '#全新落成', '#景觀房'],
    price_modifier: 8000,
    image_url: getImg(164),
  },
  {
    id: '2',
    hotel_name: '銀座三井花園',
    location: '銀座中央',
    star_rating: 4,
    distance_to_station: '步行3分鐘',
    room_size: 28,
    year_built: 2018,
    tags: ['#黃金地段', '#設計感', '#女性友善'],
    price_modifier: 4500,
    image_url: getImg(122),
  },
];

// =====================================================
// DEMO 儀表板統計
// =====================================================

export const DEMO_STATS: DashboardStats = {
  upcoming_groups: 45,
  critical_groups: 3,
  urgent_groups: 8,
  orders_this_month: 127,
  revenue_this_month: 3850000,
  departing_soon: DEMO_TOUR_GROUPS.slice(0, 3),
};

// =====================================================
// 多語系翻譯
// =====================================================

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  zh: {
    loading: '載入中...',
    error: '發生錯誤',
    success: '成功',
    cancel: '取消',
    confirm: '確認',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    back: '返回',
    next: '下一步',
    signIn: '登入系統',
    signingIn: '登入中...',
    username: '使用者名稱',
    password: '密碼',
    loginError: '帳號或密碼錯誤',
    secureLogin: '安全連線已啟用',
    hint: 'admin/admin123 或 client/client123 或 staff/staff123',
    exit: '登出',
    estimatedBudget: '預估預算',
    autoMatch: '智慧配對',
    competitorAnalysis: '競品分析',
    generatePitch: '生成提案',
    dashboard: '儀表板',
    series: '產品系列',
    orders: '訂單管理',
    newBatch: '新增團期',
    syncing: '同步中...',
    departureDate: '出發日期',
    status: '狀態',
    avail: '剩餘',
    sold: '已售',
    reserved: '保留',
    saveChanges: '儲存變更',
  },
  en: {
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    signIn: 'Sign In',
    signingIn: 'Signing In...',
    username: 'Username',
    password: 'Password',
    loginError: 'Invalid credentials',
    secureLogin: 'Secure connection enabled',
    hint: 'admin/admin123 or client/client123 or staff/staff123',
    exit: 'Sign Out',
    estimatedBudget: 'Estimated Budget',
    autoMatch: 'Smart Match',
    competitorAnalysis: 'Competitor Analysis',
    generatePitch: 'Generate Pitch',
    dashboard: 'Dashboard',
    series: 'Product Series',
    orders: 'Orders',
    newBatch: 'New Batch',
    syncing: 'Syncing...',
    departureDate: 'Departure',
    status: 'Status',
    avail: 'Available',
    sold: 'Sold',
    reserved: 'Reserved',
    saveChanges: 'Save Changes',
  },
};
