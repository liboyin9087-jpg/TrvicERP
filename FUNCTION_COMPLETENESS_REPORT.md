# 功能完整性檢查報告

> 檢查日期：2025-01-XX  
> 檢查範圍：非財務權限功能

---

## 📊 總體完成度

| 角色 | 完成度 | 狀態 |
|------|--------|------|
| **旅行社角色（後台/業務/OP）** | ~40% | ⚠️ 部分完成 |
| **福委會角色** | ~90% | ✅ 基本完整 |
| **員工角色** | ~95% | ✅ 基本完整 |

---

## 1️⃣ 旅行社角色（後台/業務/OP）功能檢查

### ✅ 已實現功能

| 功能 | 狀態 | 位置/備註 |
|------|------|-----------|
| 行程規劃 - 每日Itinerary時間軸 | ✅ | `ItineraryBuilder.tsx` - 完整拖拽式行程規劃 |
| 行程規劃 - 景點、餐食、交通、住宿 | ✅ | `ItineraryBuilder.tsx` - 支援多類別景點 |
| 行程規劃 - 行程配置器 | ✅ | `ItineraryBuilder.tsx` - 視覺化建構工具 |
| 行程變更記錄 | ✅ | `OperationHub.tsx` - ChangeRequest 功能 |
| 團體狀態管理 | ✅ | `TourSession` 類型有 status 欄位 |
| Dashboard - 開放團體列表 | ⚠️ | `SessionManager.tsx` - 目前只有分析圖表，無實際列表 |
| Dashboard - 報名進度條 | ❌ | 未實現 |
| Dashboard - 待審核福委團 | ❌ | 未實現 |

### ❌ 缺失功能

| 功能 | 優先級 | 說明 |
|------|--------|------|
| **建立/管理團體 - 開團** | 🔴 高 | `SessionManager.tsx` 目前只是分析儀表板，無建立功能 |
| **設定團號** | 🔴 高 | `TourSession` 類型缺少 `group_number` 欄位 |
| **團型設定（福委團/一般團）** | 🔴 高 | `TourSession` 類型缺少 `group_type` 欄位 |
| **行程版本控制（改版記錄）** | 🟡 中 | `ItineraryBuilder` 無版本歷史功能 |
| **飯店房型/房數鎖定** | 🔴 高 | 無資源分配模組 |
| **交通座位分配** | 🔴 高 | 無座位管理功能 |
| **導遊/領隊派任** | 🔴 高 | 無人員指派功能 |
| **全團名單總覽 - 分房表自動產生** | 🔴 高 | 福委端有，但旅行社端無 |
| **全團名單總覽 - 座位表自動產生** | 🔴 高 | 福委端有預留，但未完成 |
| **特殊需求統計** | 🟡 中 | 無統計功能 |
| **出團前文件生成 - 團體行程表** | 🟡 中 | 有 PDF 生成能力，但無專門的團體行程表模板 |
| **出團前文件生成 - 分房表** | 🔴 高 | 無分房表 PDF 生成 |
| **出團前文件生成 - 座位表** | 🔴 高 | 無座位表 PDF 生成 |
| **出團前文件生成 - 名單清冊** | 🔴 高 | 無名單清冊 PDF 生成 |
| **出團前文件生成 - 集合資訊** | 🟡 中 | 無專門的集合資訊文件 |
| **Line發送功能** | 🟡 中 | 無 Line API 整合 |
| **出團中即時通報（領隊App同步）** | 🟡 中 | 無即時通訊功能 |
| **結案管理 - 產生非財務報表** | 🟡 中 | 無結案報表功能 |

---

## 2️⃣ 福委會角色功能檢查

### ✅ 已實現功能

| 功能 | 狀態 | 位置/備註 |
|------|------|-----------|
| 建立/複製團體 - 從模板建立 | ✅ | `WelfareDashboard.tsx` - GroupsTab |
| 設定補助規則 - 年資階梯 | ✅ | `WelfareDashboard.tsx` - RulesTab |
| 設定補助規則 - 定額/比例 | ✅ | `SubsidyRule` 類型支援 |
| 設定補助規則 - 上限 | ✅ | `SubsidyRule` 有 `maxAmount` |
| 設定補助規則 - 稅務旗標 | ✅ | `SubsidyRule` 有 `taxExempt` |
| 資格規則設定 - 年資門檻 | ✅ | `SubsidyRule` 有 `seniorityYears` |
| 資格規則設定 - 親友加購限制 | ✅ | `RulesTab` 有親友加購規則 |
| 報名審核 - 查看員工報名名單 | ✅ | `WelfareDashboard.tsx` - RegistrationTab |
| 報名審核 - 一鍵審核/駁回 | ✅ | `RegistrationTab` 有 `onApprove`/`onReject` |
| 名單管理 - 自動分房邏輯 | ✅ | `RosterTab` 有房間配置 |
| 名單管理 - 特殊需求審核 | ✅ | `RosterTab` 顯示特殊需求 |
| 出團前準備 - 產生個人行程表（PDF） | ✅ | `PreparationTab` 有 PDF 生成按鈕 |
| 出團前準備 - 通知發佈（Line/Email） | ✅ | `PreparationTab` 有發送按鈕 |
| 報表與分析 - 報名完成率 | ✅ | `ReportsTab` 有統計 |
| 報表與分析 - 參與人數統計 | ✅ | `ReportsTab` 有統計 |
| 報表與分析 - 年度活動使用率 | ✅ | `ReportsTab` 有統計 |
| 後台首頁 - 我的團體 | ✅ | DashboardTab |
| 後台首頁 - 報名進度 | ✅ | DashboardTab |
| 後台首頁 - 待審核名單 | ✅ | DashboardTab |

### ❌ 缺失功能

| 功能 | 優先級 | 說明 |
|------|--------|------|
| **會員資格（扣繳福利金者）** | 🟡 中 | `SubsidyRule` 無會員資格欄位 |
| **調整名單（加減員）** | 🟡 中 | 無手動調整功能 |
| **座位表預覽** | 🟡 中 | `RosterTab` 顯示「座位表功能開發中」 |
| **含補助資訊的個人行程表** | 🟡 中 | PDF 生成按鈕存在，但需確認模板是否包含補助資訊 |

---

## 3️⃣ 員工角色功能檢查

### ✅ 已實現功能

| 功能 | 狀態 | 位置/備註 |
|------|------|-----------|
| 查看開放團體 - 瀏覽行程 | ✅ | `TravelerApp.tsx` - ExploreTab |
| 查看開放團體 - 日期、內容、補助說明 | ✅ | `TripCard` 完整顯示 |
| 資格自動驗證 - 年資/資格 | ✅ | `EligibilityCard` 顯示 |
| 資格自動驗證 - 可參加與否 | ✅ | `EligibilityCard` 有 `isEligible` |
| 資格自動驗證 - 補助額試算 | ✅ | `TripCard` 有 `calculateSubsidy` |
| 線上報名 - 填寫基本資料 | ✅ | `RegistrationForm` 完整表單 |
| 線上報名 - 選擇房型/餐食偏好 | ✅ | `RegistrationForm` 有選擇器 |
| 線上報名 - 特殊需求 | ✅ | `RegistrationForm` 有輸入欄位 |
| 線上報名 - 親友加購 | ✅ | `RegistrationForm` 有同行者功能 |
| 個人專區 - 我的報名記錄 | ✅ | `MyTripsTab` 完整顯示 |
| 個人專區 - 報名狀態 | ✅ | `MyTripsTab` 顯示狀態 |
| 個人專區 - 下載個人行程表 | ✅ | `MyTripsTab` 有下載按鈕 |
| 出團前通知 - 接收集合資訊 | ✅ | `NotificationsTab` 有通知功能 |
| 出團前通知 - 變更通知 | ✅ | `NotificationsTab` 支援 |
| 意見反饋 - 滿意度調查 | ✅ | `FeedbackTab` 完整功能 |
| 登入後首頁 - 我的團體 | ✅ | `HomeTab` 顯示 |
| 登入後首頁 - 待辦事項 | ✅ | `HomeTab` 有 Todo 列表 |
| 登入後首頁 - 已報名清單 | ✅ | `HomeTab` 顯示 |

### ❌ 缺失功能

| 功能 | 優先級 | 說明 |
|------|--------|------|
| **座位偏好選擇** | 🟡 中 | `RegistrationForm` 無座位選擇 |
| **App推播** | 🟡 低 | 無推播功能（僅有站內通知） |

---

## 🎯 MVP 優先順序建議

### Phase 1: 核心功能（必做）

#### 旅行社端
1. ✅ **團體建立功能** - 在 `SessionManager` 中新增建立團體表單
2. ✅ **團號與團型設定** - 擴充 `TourSession` 類型
3. ✅ **資源分配模組** - 飯店房型/房數、交通座位、導遊派任
4. ✅ **全團名單總覽** - 整合福委端的名單管理功能
5. ✅ **文件生成** - 團體行程表、分房表、座位表、名單清冊

#### 福委端
1. ✅ **座位表功能** - 完成 `RosterTab` 中的座位表預覽
2. ✅ **含補助資訊的 PDF** - 確認個人行程表包含補助金額

#### 員工端
1. ✅ **座位偏好** - 在報名表單中新增座位選擇

### Phase 2: 進階功能（建議）

1. ✅ **行程版本控制** - 在 `ItineraryBuilder` 中新增版本歷史
2. ✅ **特殊需求統計** - 新增統計報表
3. ✅ **Line API 整合** - 實作 Line 發送功能
4. ✅ **即時通訊** - 出團中通報功能
5. ✅ **結案報表** - 非財務報表生成

---

## 📝 技術建議

### 資料結構擴充

```typescript
// types.ts 需要新增的欄位
export interface TourSession {
  // ... 現有欄位
  group_number?: string;        // 團號
  group_type?: 'welfare' | 'regular';  // 團型
  hotel_rooms?: HotelRoom[];     // 飯店房型分配
  transportation_seats?: SeatAssignment[];  // 交通座位
  tour_leader_id?: string;      // 導遊/領隊 ID
  version_history?: ItineraryVersion[];  // 版本歷史
}

export interface HotelRoom {
  room_number: string;
  room_type: string;
  locked_count: number;
  total_count: number;
}

export interface SeatAssignment {
  seat_number: string;
  passenger_id: string;
  passenger_name: string;
}
```

### 組件建議

1. **SessionManager 重構**
   - 新增「建立團體」按鈕和表單
   - 新增團體列表視圖
   - 整合報名進度顯示

2. **ResourceAllocation 新組件**
   - 飯店房型鎖定介面
   - 交通座位分配介面
   - 導遊/領隊指派介面

3. **DocumentGenerator 新組件**
   - 統一的文件生成器
   - 支援多種模板（行程表、分房表、座位表、名單清冊）

---

## ✅ 總結

### 完成度評估

- **福委會角色**: 90% ✅ - 功能基本完整，僅需完善座位表
- **員工角色**: 95% ✅ - 功能完整，僅需新增座位偏好
- **旅行社角色**: 40% ⚠️ - 核心功能缺失，需要大量開發

### 建議行動

1. **立即優先**：完成旅行社端的團體建立與管理功能
2. **短期目標**：實作資源分配與文件生成
3. **中期目標**：完善版本控制與統計報表

---

*報告生成時間：2025-01-XX*
