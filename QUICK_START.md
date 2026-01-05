# TrivcERP - 快速入門指南

## 5分鐘上手

### 1. 環境設定

```bash
# 1. 複製環境變數
cp .env.example .env

# 2. 填寫 Supabase 憑證
# VITE_SUPABASE_URL=你的URL
# VITE_SUPABASE_ANON_KEY=你的匿名金鑰

# 3. 安裝依賴
npm install

# 4. 啟動開發伺服器
npm run dev
```

### 2. 執行資料庫 Migration

在 Supabase Dashboard 執行 `supabase/migrations/create_core_erp_tables.sql`

### 3. 驗證安裝

開啟瀏覽器訪問 `http://localhost:5173`

## 核心功能使用範例

### 範例 1：客群推薦系統

**場景：** 為「精品情侶遊」客群推薦景點

```typescript
import { recommendItemsForSegment } from './services/customerSegmentationService';

// 取得推薦
const recommendations = await recommendItemsForSegment('LUXURY_COUPLES', 20);

// 推薦結果
recommendations.forEach(rec => {
  console.log(`${rec.item.name} - 評分: ${rec.score}`);
  console.log(`推薦原因: ${rec.matchReasons.join(', ')}`);
});
```

**預期輸出：**
```
台北君悅酒店 - 評分: 85
推薦原因: 官方推薦客群, 標籤: luxury, spa, romantic

微風南山美食 - 評分: 72
推薦原因: 標籤: fine-dining, gourmet, 難度適中
```

### 範例 2：動態定價計算

**場景：** 計算早鳥優惠價格

```typescript
import { calculateDynamicPrice, getSeason } from './services/dynamicPricingService';

// 設定情境
const context = {
  basePrice: 35000,
  bookingDate: new Date('2024-06-01'),
  travelDate: new Date('2024-08-15'),  // 45天後
  groupSize: 12,
  dayOfWeek: 0,  // 週日
  season: getSeason(new Date('2024-08-15')),  // 夏季
  isSpecialEvent: false
};

// 計算價格
const result = await calculateDynamicPrice(context);

console.log(`原價: NT$${result.originalPrice}`);
console.log(`折扣: NT$${result.totalDiscount}`);
console.log(`加價: NT$${result.totalSurcharge}`);
console.log(`最終: NT$${result.finalPrice}`);

// 套用規則
result.appliedRules.forEach(rule => {
  console.log(`- ${rule.ruleName}: ${rule.adjustment > 0 ? '+' : ''}${rule.adjustment}`);
});
```

**預期輸出：**
```
原價: NT$35,000
折扣: NT$8,050
加價: NT$7,000
最終: NT$33,950

套用規則:
- 早鳥優惠 (45天前): -5,250 (-15%)
- 團體折扣 (10人以上): -2,800 (-8%)
- 旺季加價: +7,000 (+20%)
```

### 範例 3：競品比較

**場景：** 比較台北飯店與競品

```typescript
import { compareHotels } from './services/competitorComparisonService';

// 我們的飯店資料
const ourHotel = {
  hotel_name: '台北W飯店',
  location: '信義區',
  star_rating: 5,
  year_built: 2010,
  distance_to_station_km: 0.8,
  room_size_sqm: 42,
  tags: ['luxury', 'trendy', 'nightlife'],
  price: 8500
};

// 比較競品
const comparison = await compareHotels('competitor-id', ourHotel);

console.log(`綜合評分: ${comparison.comparison.overallScore}/100`);
console.log(`建議: ${comparison.recommendation}`);

comparison.comparison.uniqueAdvantages.forEach(adv => {
  console.log(`✓ ${adv}`);
});
```

**預期輸出：**
```
綜合評分: 82/100
建議: 強烈推薦：我們的飯店在多方面優於競品

優勢:
✓ 價格優勢 NT$1,200
✓ 較新建築 (2010 vs 1998)
✓ 離車站更近 (0.8km vs 1.5km)
```

### 範例 4：建立完整行程

**場景：** 自動生成台北3日遊

```typescript
import { autoGenerateItinerary } from './services/itineraryBuilderService';

// 自動生成行程
const itinerary = await autoGenerateItinerary(
  'FAMILY_FRIENDLY',  // 親子家庭遊
  3,                  // 3天
  '台北市',          // 台北
  15000              // 預算 15,000
);

console.log(`行程代碼: ${itinerary.code}`);
console.log(`行程名稱: ${itinerary.name}`);
console.log(`基礎價格: NT$${itinerary.base_price}`);
```

**手動建立行程：**

```typescript
import {
  createItinerary,
  addItemToItinerary
} from './services/itineraryBuilderService';

// 1. 建立行程骨架
const itinerary = await createItinerary({
  name: '台北文化深度3日遊',
  code: 'TPE-CULTURAL-001',
  customer_segment: 'CULTURAL_EXPLORER',
  duration_days: 3,
  base_price: 12000,
  currency: 'TWD',
  min_group_size: 2,
  max_group_size: 15,
  status: 'draft',
  description: '探索台北的文化與歷史',
  highlights: ['故宮博物院', '中正紀念堂', '龍山寺'],
  included_items: ['導遊服務', '門票', '午餐'],
  excluded_items: ['個人消費', '保險'],
  difficulty_level: 'easy',
  sustainability_score: 70,
  best_seasons: ['spring', 'fall'],
  images: [],
  metadata: {}
});

// 2. 加入第一天行程
await addItemToItinerary(
  itinerary.id,
  'item-id-palace-museum',
  1,  // 第1天
  'morning',  // 上午
  0,  // 排序0
  {
    notes: '請準備相機，館內部分區域可拍照',
    startTime: '09:00',
    endTime: '12:00'
  }
);

await addItemToItinerary(
  itinerary.id,
  'item-id-local-restaurant',
  1,
  'afternoon',
  1,
  {
    notes: '品嚐地道台灣小吃',
    startTime: '12:30',
    endTime: '13:30'
  }
);

// 3. 繼續加入更多項目...
```

### 範例 5：權限控制

**場景：** 檢查用戶權限

```typescript
import { canUserAccessResource, RESOURCES, ACTIONS } from './services/rbacService';

// 檢查當前用戶是否可以建立行程
const canCreate = await canUserAccessResource(
  RESOURCES.ITINERARIES,
  ACTIONS.CREATE
);

if (canCreate) {
  // 顯示「新增行程」按鈕
  console.log('用戶有權限建立行程');
} else {
  console.log('用戶無權限');
}

// 檢查是否可以查看定價規則
const canViewPricing = await canUserAccessResource(
  RESOURCES.PRICING_RULES,
  ACTIONS.READ
);
```

## UI 元件使用範例

### 客群選擇器

```tsx
import { CustomerSegmentSelector } from './components';

function MyPage() {
  const handleSegmentSelected = (segment) => {
    console.log('選擇的客群:', segment.name);
  };

  const handleRecommendations = (recommendations) => {
    console.log('收到推薦:', recommendations.length, '項');
  };

  return (
    <CustomerSegmentSelector
      onSegmentSelected={handleSegmentSelected}
      onRecommendationsLoaded={handleRecommendations}
    />
  );
}
```

### 定價配置器

```tsx
import { DynamicPricingConfigurator } from './components';

function PricingPage() {
  const handlePriceCalculated = (result) => {
    console.log('計算結果:', result.finalPrice);
    // 更新訂單價格
  };

  return (
    <DynamicPricingConfigurator
      basePrice={35000}
      onPriceCalculated={handlePriceCalculated}
    />
  );
}
```

### 競品比較表

```tsx
import { CompetitorComparisonTable } from './components';

function ComparisonPage() {
  const ourHotel = {
    hotel_name: '台北國賓大飯店',
    location: '中山區',
    star_rating: 5,
    year_built: 1964,
    distance_to_station_km: 1.2,
    room_size_sqm: 38,
    tags: ['business', 'conference', 'central'],
    price: 6800
  };

  return (
    <CompetitorComparisonTable
      city="台北市"
      ourHotel={ourHotel}
    />
  );
}
```

### 行程建構器

```tsx
import { ItineraryBuilder } from './components';

function ItineraryPage() {
  const handleItinerarySelected = (itinerary) => {
    console.log('選擇的行程:', itinerary.itinerary.name);
    console.log('總費用:', itinerary.totalCost);
    console.log('總天數:', itinerary.dayPlans.length);
  };

  return (
    <ItineraryBuilder
      onItinerarySelected={handleItinerarySelected}
    />
  );
}
```

## 常見資料操作

### 新增景點

```typescript
import { supabase } from './lib/supabase';

const newItem = await supabase
  .from('items')
  .insert({
    item_type: 'attraction',
    name: '台北101觀景台',
    name_en: 'Taipei 101 Observatory',
    county: '台北市',
    city: '信義區',
    tags: ['iconic', 'cityview', 'photography'],
    customer_segments: ['LUXURY_COUPLES', 'PHOTOGRAPHY_ENTHUSIAST'],
    difficulty_level: 'easy',
    sustainability_score: 75,
    experience_types: ['scenic', 'urban'],
    best_seasons: ['spring', 'fall', 'winter'],
    requires_reservation: true,
    reservation_lead_days: 1,
    base_price: 600,
    currency: 'TWD',
    duration_minutes: 90,
    capacity_min: 1,
    capacity_max: 50,
    description: '台北101是台灣最高的建築...',
    highlights: ['360度觀景台', '89樓高空酒吧', '多媒體展示'],
    is_active: true
  })
  .select()
  .single();
```

### 查詢客群推薦標籤

```typescript
// 查詢所有客群的推薦標籤
const { data: segments } = await supabase
  .from('customer_segments')
  .select('segment_code, name, matching_tags')
  .eq('is_active', true);

segments.forEach(segment => {
  console.log(`${segment.name}:`);
  console.log(`標籤: ${segment.matching_tags.join(', ')}`);
});
```

### 新增定價規則

```typescript
import { createPricingRule } from './services/dynamicPricingService';

// 建立春節特別加價
const rule = await createPricingRule({
  rule_name: '春節特別加價',
  rule_type: 'special_event',
  conditions: {
    event_name: 'lunar_new_year'
  },
  adjustment_type: 'percentage',
  adjustment_value: 30,  // +30%
  priority: 100,
  is_active: true,
  valid_from: '2025-01-25',
  valid_to: '2025-02-05'
});
```

### 新增競品資料

```typescript
import { createCompetitorHotel } from './services/competitorComparisonService';

const competitor = await createCompetitorHotel({
  hotel_name: '台北萬豪酒店',
  location: '中山區',
  city: '台北市',
  star_rating: 5,
  year_built: 1989,
  year_renovated: 2018,
  distance_to_station_km: 1.5,
  room_size_sqm: 35,
  tags: ['business', 'luxury', 'meeting-rooms'],
  pros: ['地點便利', '會議設施完善', '早餐豐盛'],
  cons: ['房間稍小', '停車位不足'],
  typical_price_min: 7500,
  typical_price_max: 12000,
  hidden_costs: ['停車費 NT$400/天', '早餐 NT$600/人'],
  verified: true
});
```

## 整合測試腳本

### 完整流程測試

```typescript
// 1. 選擇客群
const segment = await fetchCustomerSegmentByCode('LUXURY_COUPLES');

// 2. 取得推薦
const recommendations = await recommendItemsForSegment(segment.segment_code, 10);

// 3. 建立行程
const itinerary = await createItinerary({
  name: `${segment.name} 專屬行程`,
  code: generateItineraryCode('TPE', segment.segment_code),
  customer_segment: segment.segment_code,
  duration_days: 3,
  base_price: 25000,
  // ... 其他欄位
});

// 4. 加入推薦項目
for (let i = 0; i < recommendations.slice(0, 5).length; i++) {
  await addItemToItinerary(
    itinerary.id,
    recommendations[i].item.id,
    1,  // 第1天
    'morning',
    i
  );
}

// 5. 計算動態價格
const pricing = await calculateItineraryPrice(itinerary.id, {
  bookingDate: new Date(),
  travelDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  groupSize: 2
});

console.log('行程建立完成！');
console.log(`最終價格: NT$${pricing.finalPrice}`);
```

## 疑難排解

### 問題 1：無法連接 Supabase

**檢查：**
1. `.env` 檔案是否存在且正確
2. VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 是否填寫
3. Supabase 專案是否已啟動

### 問題 2：權限錯誤

**檢查：**
1. RLS 政策是否已建立（執行 migration）
2. 用戶是否已登入
3. 用戶角色是否正確設定

### 問題 3：推薦結果為空

**檢查：**
1. Items 表格是否有資料
2. customer_segments 欄位是否正確設定
3. 客群代碼是否匹配

## 效能最佳化建議

### 1. 批次載入

```typescript
// 不好：逐筆查詢
for (const id of itemIds) {
  const item = await fetchItemById(id);  // N 次查詢
}

// 好：一次查詢
const items = await supabase
  .from('items')
  .select('*')
  .in('id', itemIds);  // 1 次查詢
```

### 2. 選擇性欄位

```typescript
// 不好：查詢所有欄位
const items = await supabase
  .from('items')
  .select('*');

// 好：只查詢需要的欄位
const items = await supabase
  .from('items')
  .select('id, name, base_price, city');
```

### 3. 使用索引

```typescript
// 查詢時利用已建立的索引
const items = await supabase
  .from('items')
  .select('*')
  .eq('city', '台北市')  // 使用 idx_items_city 索引
  .contains('tags', ['luxury']);  // 使用 idx_items_tags 索引
```

## 下一步

1. 閱讀 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解完整系統架構
2. 查看 [DEVELOPMENT.md](./DEVELOPMENT.md) 學習開發規範
3. 參考各服務層的 JSDoc 註解
4. 加入範例資料開始測試

## 需要協助？

- 技術問題：查看 `src/services/` 中的註解
- 資料庫問題：檢查 `supabase/migrations/` 中的 SQL
- UI 問題：參考 `src/components/` 中的範例用法

---

**快速入門指南版本：** 1.0.0
**最後更新：** 2026-01-03
