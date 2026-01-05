# TrvicERP - 完整系統架構文件

## 系統概述

TrvicERP 是一個完整的旅遊業ERP系統，整合了動態報價、客群推薦、競品分析、行程管理等功能。本系統採用 React + TypeScript + Supabase 架構，提供完整的資料管理與自動化功能。

## 資料庫架構

### 四大核心表

#### 1. Items（景點/活動元件表）
**用途：** 存放所有可配置的旅遊元件（景點、飯店、餐食、交通、活動）

**核心欄位：**
- `item_type`: 項目類型（attraction, hotel, meal, transport, activity, experience）
- `name`, `name_en`: 中英文名稱
- `county`, `city`: 縣市位置
- `tags`: 標籤陣列（用於搜尋與推薦）
- `customer_segments`: 適合的客群類型
- `difficulty_level`: 難度等級（easy, moderate, challenging, expert）
- `sustainability_score`: 永續指標（0-100）
- `experience_types`: 體驗類型陣列
- `best_seasons`: 最佳季節
- `requires_reservation`: 是否需要預約
- `base_price`: 基礎價格
- `duration_minutes`: 所需時間
- `capacity_min`, `capacity_max`: 人數限制
- `coordinates`: 地理座標
- `highlights`: 亮點
- `inclusions`, `exclusions`: 包含/不包含項目

**應用場景：**
- 建立旅遊產品時的原子化元件
- 客群推薦系統的資料來源
- 行程自動配置的基礎

#### 2. Copy Bank（文案庫表）
**用途：** 集中管理所有行銷文案與內容模板

**核心欄位：**
- `template_name`: 模板名稱
- `content_type`: 內容類型（headline, description, pitch, email, social）
- `language`: 語言代碼（zh, en, ja, ko）
- `audience_type`: 目標受眾（tech, sales, executive, general, family, couples）
- `tone`: 語調風格（professional, casual, luxury, adventure, friendly）
- `subject`, `body`: 主題與內容
- `variables`: 動態變數（JSON格式）
- `use_cases`: 適用場景
- `performance_score`: 績效評分

**應用場景：**
- 多語言內容管理
- 自動化行銷文案生成
- A/B測試與效果追蹤

#### 3. Itineraries（行程表）
**用途：** 完整的多日行程配置

**核心欄位：**
- `name`, `code`: 行程名稱與代碼
- `customer_segment`: 目標客群
- `duration_days`: 天數
- `base_price`: 基礎價格
- `min_group_size`, `max_group_size`: 團體人數限制
- `status`: 狀態（draft, active, archived）
- `highlights`: 行程亮點
- `included_items`, `excluded_items`: 包含/不包含項目
- `difficulty_level`: 整體難度
- `sustainability_score`: 永續評分

**應用場景：**
- 產品目錄管理
- 客製化行程規劃
- 報價與訂單管理

#### 4. Itinerary Items Junction（關聯表）
**用途：** 連結行程與項目的多對多關係，定義每日行程

**核心欄位：**
- `itinerary_id`, `item_id`: 外鍵關聯
- `day_number`: 第幾天
- `time_slot`: 時段（morning, afternoon, evening, full_day）
- `start_time`, `end_time`: 開始/結束時間
- `sequence_order`: 排序順序
- `is_optional`: 是否為選配項目
- `notes`: 特殊說明
- `price_override`: 價格覆寫

**應用場景：**
- 每日行程排程
- 時間管理與衝突檢查
- 彈性配置（必選/選配）

### 支援表

#### Customer Segments（客群分類表）
存放10種預設客群類型的定義與偏好設定

**預設客群：**
1. **LUXURY_COUPLES** - 精品情侶遊
2. **ADVENTURE_YOUTH** - 冒險青年團
3. **FAMILY_FRIENDLY** - 親子家庭遊
4. **SENIOR_LEISURE** - 銀髮樂活團
5. **BUSINESS_BLEISURE** - 商務混搭型
6. **ECO_CONSCIOUS** - 永續旅行者
7. **CULTURAL_EXPLORER** - 文化深度遊
8. **WELLNESS_SEEKER** - 身心靈療癒
9. **PHOTOGRAPHY_ENTHUSIAST** - 攝影愛好者
10. **FOODIE_TRAVELER** - 美食探索家

#### Competitor Hotels（競品飯店表）
存放競品資料，用於比較分析

#### Pricing Rules（定價規則表）
動態定價系統的規則配置

#### User Roles（使用者角色表）
RBAC權限管理系統的角色定義

## 三大自動化模組

### 1. 動態報價配置器（Dynamic Pricing Configurator）

**技術實作：**
- 服務層：`src/services/dynamicPricingService.ts`
- UI組件：`src/components/DynamicPricingConfigurator.tsx`

**核心功能：**
- 多規則疊加計算
- 規則類型支援：
  - `seasonal`: 季節性定價
  - `group_size`: 團體人數折扣
  - `advance_booking`: 早鳥優惠
  - `day_of_week`: 週末/平日差價
  - `special_event`: 特殊活動加價

**計算邏輯：**
```typescript
1. 載入所有有效定價規則（依優先級排序）
2. 檢查每條規則的適用條件
3. 依序套用調整（百分比或固定金額）
4. 產生價格明細與規則說明
```

**預設規則：**
- 早鳥45天前：-15%
- 早鳥30天前：-10%
- 團體10人以上：-8%
- 旺季（夏季）：+20%
- 週末：+10%
- 淡季（冬季）：-12%

### 2. 競品比較表（Competitor Comparison）

**技術實作：**
- 服務層：`src/services/competitorComparisonService.ts`
- UI組件：`src/components/CompetitorComparisonTable.tsx`

**核心功能：**
- 飯店規格比較
- 價格優勢分析
- 綜合評分計算（0-100分）
- 自動生成推薦建議

**比較維度：**
- 價格差異
- 建築年份
- 離車站距離
- 房間大小
- 星級評等
- 設施標籤匹配度

**評分機制：**
```typescript
基礎分數: 50
價格優勢: +15
較新建築: +10
離車站更近: +10
更大房間: +10
更高星級: +15
最高分數: 100
```

### 3. PWA數位導遊（Progressive Web App）

**技術實作：**
- PWA配置：`public/manifest.json`, `public/sw.js`
- 口袋導遊組件：`src/components/PocketGuide.tsx`

**核心功能：**
- 離線行程查看
- 即時天氣資訊
- 導遊聯絡資訊
- 每日行程時間軸
- 重要提示標記

## 客群推薦系統

**技術實作：**
- 服務層：`src/services/customerSegmentationService.ts`
- UI組件：`src/components/CustomerSegmentSelector.tsx`

### 推薦演算法

**評分計算：**
```typescript
直接標記適合客群: +30分
標籤符合（每個）: +10分
難度符合: +15分
體驗類型符合（每個）: +8分
興趣符合（每個）: +5分
預算區間符合: +10分
```

**最低推薦門檻：** 20分
**推薦數量上限：** 可自訂（預設20項）

### 客群匹配邏輯

用戶資料對照客群特徵：
- 年齡範圍匹配：+30分
- 興趣符合（每個）：+15分
- 預算等級匹配：+25分
- 旅遊風格符合（每個）：+10分
- 體驗偏好符合（每個）：+10分

**最低匹配門檻：** 40分

## SaaS功能規格

### RBAC權限系統

**技術實作：**
- 服務層：`src/services/rbacService.ts`

**內建角色：**
1. **Super Admin** - 完整系統權限
2. **Admin** - 管理所有業務資料
3. **Product Manager** - 管理商品與定價
4. **Sales Agent** - 查看商品與建立訂單
5. **Tour Guide** - 查看行程與訂單
6. **Customer** - 查看商品與建立預訂

**權限資源：**
- Items（景點項目）
- Itineraries（行程）
- Bookings（訂單）
- Customers（客戶）
- Pricing Rules（定價規則）
- Competitor Data（競品資料）
- Copy Bank（文案庫）
- Users（用戶管理）
- Settings（系統設定）

**權限動作：**
- create（建立）
- read（讀取）
- update（更新）
- delete（刪除）
- manage（完整管理）

### API-First架構

**資料存取層：**
- Supabase Client（`src/lib/supabase.ts`）
- 自動處理認證與RLS
- 支援即時訂閱

**服務層架構：**
```
src/services/
├── customerSegmentationService.ts  # 客群推薦
├── dynamicPricingService.ts        # 動態定價
├── competitorComparisonService.ts  # 競品分析
├── itineraryBuilderService.ts      # 行程建構
├── rbacService.ts                  # 權限控制
├── databaseService.ts              # 資料庫操作
├── erpService.ts                   # ERP功能
└── llmService.ts                   # AI整合
```

### 資料安全（RLS）

**所有表格啟用Row Level Security**

**基本原則：**
- 公開資料：僅顯示 `is_active = true` 的項目
- 用戶資料：僅能存取自己的資料
- 管理功能：需要 admin 角色

**範例政策：**
```sql
-- 一般用戶可查看上架中的行程
CREATE POLICY "Anyone can view active itineraries"
  ON itineraries FOR SELECT
  USING (status = 'active' OR
         (SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- 管理員可完整管理
CREATE POLICY "Admins can manage itineraries"
  ON itineraries FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');
```

## UI/UX設計規格

### 核心UI元件

**已實作元件：**
1. **CustomerSegmentSelector** - 客群選擇器
   - 卡片式客群展示
   - 即時推薦載入
   - 評分與匹配原因顯示

2. **DynamicPricingConfigurator** - 定價配置器
   - 情境參數設定（日期、人數、特殊活動）
   - 即時價格計算
   - 規則套用明細
   - 視覺化價格分解

3. **CompetitorComparisonTable** - 競品比較表
   - 表格式競品列表
   - 一對一詳細比較
   - 優勢分析
   - 綜合評分與建議

4. **ItineraryBuilder** - 行程建構器
   - 行程列表瀏覽
   - 每日行程展開
   - 項目時間軸
   - 費用與時長統計
   - 項目類型分類統計

### 視圖切換

**多模式支援：**
- List View（列表模式）
- Card View（卡片模式）
- Compare View（比較模式）
- Detail View（詳細模式）

### 設計系統

**顏色配置：**
- Primary: Blue (#2563eb)
- Success: Green (#16a34a)
- Warning: Orange (#ea580c)
- Error: Red (#dc2626)
- Info: Purple (#9333ea)

**間距系統：** Tailwind CSS（4px基準）

**響應式斷點：**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 資料匯入指引

### Items（景點）匯入格式

**CSV/JSON 欄位：**
```json
{
  "item_type": "attraction",
  "name": "台北101觀景台",
  "name_en": "Taipei 101 Observatory",
  "county": "台北市",
  "city": "信義區",
  "tags": ["iconic", "cityview", "photography"],
  "customer_segments": ["LUXURY_COUPLES", "PHOTOGRAPHY_ENTHUSIAST"],
  "difficulty_level": "easy",
  "sustainability_score": 75,
  "experience_types": ["scenic", "urban"],
  "best_seasons": ["spring", "fall", "winter"],
  "requires_reservation": true,
  "reservation_lead_days": 1,
  "base_price": 600,
  "currency": "TWD",
  "duration_minutes": 90,
  "capacity_min": 1,
  "capacity_max": 50,
  "highlights": ["360度觀景台", "89樓高空酒吧", "多媒體互動展示"],
  "description": "台北101是台灣的地標建築..."
}
```

### 批次匯入建議

**使用 Supabase SQL Editor：**
```sql
INSERT INTO items (
  item_type, name, name_en, county, city, tags,
  customer_segments, difficulty_level, base_price
) VALUES
  ('attraction', '故宮博物院', 'National Palace Museum',
   '台北市', '士林區', ARRAY['cultural', 'museum', 'history'],
   ARRAY['CULTURAL_EXPLORER', 'SENIOR_LEISURE'], 'easy', 350),
  -- ... 更多景點
;
```

## 整合測試建議

### 功能測試流程

1. **客群推薦測試**
   - 選擇不同客群
   - 驗證推薦項目的相關性
   - 檢查評分邏輯

2. **動態定價測試**
   - 測試不同日期組合
   - 驗證規則疊加效果
   - 確認價格計算正確性

3. **競品比較測試**
   - 新增競品資料
   - 執行比較分析
   - 驗證評分與建議

4. **行程建構測試**
   - 建立新行程
   - 加入多日項目
   - 檢查費用與時長計算

### 效能優化建議

**資料庫層級：**
- 已建立所有必要索引
- RLS 政策使用子查詢優化
- 定期執行 ANALYZE

**應用層級：**
- 使用 React.memo 減少重渲染
- 實作虛擬滾動處理大量資料
- 圖片使用 lazy loading

**快取策略：**
- Supabase 自動快取查詢結果
- 考慮使用 React Query 進行客戶端快取

## 部署指引

### 環境變數

**必要變數（.env）：**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 建置指令

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 生產建置
npm run build

# 預覽生產版本
npm run preview
```

### Supabase 設定

**執行 Migration：**
```bash
# Migration 已建立在
supabase/migrations/create_core_erp_tables.sql

# 透過 Supabase Dashboard 執行
# 或使用 Supabase CLI
```

## 未來擴充方向

### 短期（1-3個月）
- [ ] 整合 Google Maps API
- [ ] 即時庫存管理
- [ ] 訂單支付整合
- [ ] Email 通知自動化

### 中期（3-6個月）
- [ ] 移動端原生 App
- [ ] 多幣別支援
- [ ] 進階報表與儀表板
- [ ] CRM 客戶關係管理

### 長期（6-12個月）
- [ ] AI 行程推薦引擎
- [ ] 多語言內容管理系統
- [ ] 合作夥伴 API
- [ ] 區塊鏈認證整合

## 技術支援

**相關文件：**
- README.md - 專案介紹
- DEVELOPMENT.md - 開發指南
- DEPLOYMENT.md - 部署指南
- SECURITY.md - 安全規範

**核心技術棧：**
- React 18.2
- TypeScript 5.3
- Vite 5.0
- Supabase 2.89
- Tailwind CSS 3.4

---

**版本：** 3.0.0
**最後更新：** 2026-01-03
**維護者：** TrvicERP Team
