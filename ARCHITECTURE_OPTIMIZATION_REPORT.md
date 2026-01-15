# 專案架構優化報告

> 分析日期：2025-01-XX  
> 分析範圍：整體檔案架構、組織結構、導入路徑

---

## 📋 目錄

1. [當前架構問題分析](#當前架構問題分析)
2. [重複檔案與衝突](#重複檔案與衝突)
3. [檔案組織不一致](#檔案組織不一致)
4. [導入路徑問題](#導入路徑問題)
5. [缺失的模組](#缺失的模組)
6. [優化建議與實施計劃](#優化建議與實施計劃)

---

## 1. 當前架構問題分析

### 🔴 嚴重問題

#### 1.1 重複的認證服務
**問題：**
- `src/services/authService.ts` - 舊版（函數式）
- `src/core/services/authService.ts` - 新版（類別式，功能更完整）

**影響：**
- 可能造成導入混亂
- 維護困難
- 功能不一致

**建議：**
- ✅ 刪除 `src/services/authService.ts`
- ✅ 統一使用 `src/core/services/authService.ts`
- ✅ 更新所有導入路徑

---

#### 1.2 類型定義分散
**問題：**
- `types.ts` - 根目錄，包含舊的類型定義（365 行）
- `src/core/types/` - 新的模組化類型定義

**重複定義：**
- `TourSession` - 兩個地方都有定義
- `Booking` - 兩個地方都有定義
- `Attraction` - 兩個地方都有定義

**影響：**
- 類型不一致
- 維護困難
- 可能造成類型錯誤

**建議：**
- ✅ 將 `types.ts` 中的類型遷移到 `src/core/types/`
- ✅ 按模組分類（如 `src/core/types/session.ts`）
- ✅ 建立統一的類型匯出檔案

---

#### 1.3 工具函數位置混亂
**問題：**
- `lib/` - 根目錄的工具函數
  - `geoUtils.ts`
  - `legalKnowledge.ts`
  - `mockSupabase.ts`
  - `shoppingData.ts`
  - `weatherUtils.ts`
- `src/lib/` - src 目錄下的工具函數
  - `api.ts`
  - `utils.ts`
  - `ai/RAGEngine.ts`

**影響：**
- 導入路徑不一致
- 不清楚應該從哪裡導入

**建議：**
- ✅ 統一遷移到 `src/lib/`
- ✅ 按功能分類：
  - `src/lib/api/` - API 相關
  - `src/lib/utils/` - 工具函數
  - `src/lib/ai/` - AI 相關
  - `src/lib/mock/` - Mock 資料

---

### 🟡 中級問題

#### 1.4 組件組織方式不一致
**當前結構：**
```
components/
├── admin/     # 按角色分類
├── staff/     # 按角色分類
├── client/    # 按角色分類
└── shared/    # 共用組件
```

**新結構（部分）：**
```
src/modules/
├── orders/    # 按功能分類
├── quotations/# 按功能分類
└── reports/   # 按功能分類
```

**問題：**
- 兩種組織方式並存
- 不清楚應該在哪裡新增組件
- 組件與模組沒有對應關係

**建議：**
- 🟡 逐步遷移到模組化結構
- 🟡 在模組內建立 `components/` 目錄
- 🟡 保留 `components/shared/` 作為共用組件

---

#### 1.5 缺失的模組結構
**已建立的模組：**
- ✅ `src/modules/orders/` - 訂單管理
- ✅ `src/modules/quotations/` - 報價管理
- ✅ `src/modules/reports/` - 報表

**缺失的模組：**
- ❌ `src/modules/sessions/` - 團次管理
- ❌ `src/modules/customers/` - 客戶管理
- ❌ `src/modules/tours/` - 行程管理
- ❌ `src/modules/itineraries/` - 行程安排
- ❌ `src/modules/passports/` - 護照管理
- ❌ `src/modules/payments/` - 付款管理

**建議：**
- 🟡 逐步建立缺失的模組
- 🟡 每個模組包含：`components/`, `services/`, `hooks/`, `types.ts`

---

### 🟢 輕微問題

#### 1.6 根目錄檔案過多
**問題：**
- `App.tsx` - 應該在 `src/`
- `index.tsx` - 應該在 `src/`
- `types.ts` - 應該在 `src/core/types/`
- `navigation.ts` - 應該在 `src/core/` 或 `src/lib/`

**建議：**
- 🟢 遷移到適當的目錄
- 🟢 保持根目錄整潔

---

## 2. 重複檔案與衝突

### 2.1 認證服務重複

| 檔案 | 位置 | 狀態 | 建議 |
|------|------|------|------|
| `authService.ts` | `src/services/` | ❌ 舊版 | 刪除 |
| `authService.ts` | `src/core/services/` | ✅ 新版 | 保留 |

**行動：**
```bash
# 1. 檢查所有導入
grep -r "from.*services/authService" --include="*.ts" --include="*.tsx"

# 2. 更新導入路徑
# 從: import { login } from '../../src/services/authService'
# 到: import { AuthService } from '@/core/services/authService'

# 3. 刪除舊檔案
rm src/services/authService.ts
```

---

### 2.2 報價 Hook 重複

| 檔案 | 位置 | 狀態 | 建議 |
|------|------|------|------|
| `useQuotation.ts` | `hooks/` | ❌ 舊版（簡單計算） | 保留或重命名 |
| `useQuotations.ts` | `src/modules/quotations/hooks/` | ✅ 新版（完整功能） | 保留 |

**行動：**
- 🟡 檢查 `useQuotation.ts` 是否仍在使用
- 🟡 如果使用，考慮重命名為 `useQuotationCalculator.ts`
- 🟡 或遷移到 `src/modules/quotations/hooks/`

---

### 2.3 類型定義重複

**重複的類型：**

| 類型 | 位置 1 | 位置 2 | 建議 |
|------|--------|--------|------|
| `TourSession` | `types.ts` | `src/core/types/` (未定義) | 遷移到 `src/core/types/session.ts` |
| `Booking` | `types.ts` | `src/core/types/order.ts` (部分) | 統一在 `src/core/types/order.ts` |
| `Attraction` | `types.ts` | `src/core/types/itinerary.ts` (部分) | 統一在 `src/core/types/itinerary.ts` |

**行動：**
- 🔴 建立類型遷移計劃
- 🔴 逐步遷移並更新導入

---

## 3. 檔案組織不一致

### 3.1 工具函數位置

**當前狀態：**
```
lib/                    # 根目錄
├── geoUtils.ts
├── legalKnowledge.ts
├── mockSupabase.ts
├── shoppingData.ts
└── weatherUtils.ts

src/lib/                # src 目錄
├── api.ts
├── utils.ts
└── ai/
    └── RAGEngine.ts
```

**建議結構：**
```
src/lib/
├── api/
│   └── index.ts        # 從 api.ts 遷移
├── utils/
│   ├── index.ts        # 從 utils.ts 遷移
│   ├── geoUtils.ts     # 從 lib/ 遷移
│   └── weatherUtils.ts # 從 lib/ 遷移
├── ai/
│   └── RAGEngine.ts    # 已存在
├── mock/
│   ├── mockSupabase.ts # 從 lib/ 遷移
│   └── shoppingData.ts # 從 lib/ 遷移
└── data/
    └── legalKnowledge.ts # 從 lib/ 遷移（或移到 src/data/）
```

---

### 3.2 組件組織

**當前結構：**
```
components/
├── admin/      # 9 個組件
├── staff/      # 9 個組件
├── client/     # 6 個組件
└── shared/     # 13 個組件
```

**建議結構（逐步遷移）：**
```
src/modules/
├── orders/
│   └── components/
│       └── OrderList.tsx      # 從 admin/ 或 staff/ 遷移
├── quotations/
│   └── components/
│       └── QuotationBuilder.tsx # 從 staff/ 遷移
├── sessions/
│   └── components/
│       └── SessionManager.tsx   # 從 admin/ 遷移
└── ...

components/              # 保留共用組件
└── shared/              # 共用組件
```

---

## 4. 導入路徑問題

### 4.1 路徑別名配置

**當前 tsconfig.json：**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

**問題：**
- 別名指向根目錄，但實際結構更複雜
- 組件中使用相對路徑 `../../src/lib/utils`
- 不一致的導入方式

**建議配置：**
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./components/*"],
    "@/core/*": ["./src/core/*"],
    "@/modules/*": ["./src/modules/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/types/*": ["./src/core/types/*"]
  }
}
```

**vite.config.ts 也需要更新：**
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './components'),
    '@/core': path.resolve(__dirname, './src/core'),
    '@/modules': path.resolve(__dirname, './src/modules'),
    '@/lib': path.resolve(__dirname, './src/lib'),
  },
}
```

---

### 4.2 導入路徑範例

**當前（不一致）：**
```typescript
// 組件中
import { cn } from '../../src/lib/utils';
import { useToast } from '../../src/store/useToastStore';
import type { TourSession } from '../../types';
```

**建議（統一）：**
```typescript
// 組件中
import { cn } from '@/lib/utils';
import { useToast } from '@/store/useToastStore';
import type { TourSession } from '@/types/session';
```

---

## 5. 缺失的模組

### 5.1 需要建立的模組

#### Sessions 模組
```
src/modules/sessions/
├── components/
│   ├── SessionList.tsx
│   ├── SessionDetail.tsx
│   └── SessionForm.tsx
├── services/
│   └── sessionService.ts
├── hooks/
│   ├── useSessions.ts
│   └── useSession.ts
├── types.ts
└── index.ts
```

#### Customers 模組
```
src/modules/customers/
├── components/
│   ├── CustomerList.tsx
│   ├── CustomerDetail.tsx
│   └── CustomerForm.tsx
├── services/
│   └── customerService.ts
├── hooks/
│   ├── useCustomers.ts
│   └── useCustomer.ts
├── types.ts
└── index.ts
```

#### Tours 模組
```
src/modules/tours/
├── components/
│   ├── TourList.tsx
│   └── TourDetail.tsx
├── services/
│   └── tourService.ts
├── hooks/
│   └── useTours.ts
├── types.ts
└── index.ts
```

#### Itineraries 模組
```
src/modules/itineraries/
├── components/
│   ├── ItineraryBuilder.tsx  # 從 staff/ 遷移
│   └── ItineraryView.tsx     # 從 client/ 遷移
├── services/
│   └── itineraryService.ts
├── hooks/
│   └── useItineraries.ts
├── types.ts                  # 從 src/core/types/itinerary.ts 遷移
└── index.ts
```

---

## 6. 優化建議與實施計劃

### Phase 1: 清理重複檔案（優先級：🔴 高）

#### 步驟 1.1: 統一認證服務
- [ ] 檢查所有 `src/services/authService` 的導入
- [ ] 更新為 `@/core/services/authService`
- [ ] 刪除 `src/services/authService.ts`
- [ ] 刪除 `src/services/` 目錄（如果為空）

#### 步驟 1.2: 統一類型定義
- [ ] 建立類型遷移計劃
- [ ] 將 `types.ts` 中的類型分類到 `src/core/types/`
- [ ] 更新所有導入路徑
- [ ] 刪除根目錄的 `types.ts`

#### 步驟 1.3: 統一工具函數
- [ ] 遷移 `lib/` 到 `src/lib/`
- [ ] 按功能分類組織
- [ ] 更新所有導入路徑
- [ ] 刪除根目錄的 `lib/` 目錄

---

### Phase 2: 優化路徑配置（優先級：🟡 中）

#### 步驟 2.1: 更新 tsconfig.json
- [ ] 配置完整的路徑別名
- [ ] 測試路徑解析

#### 步驟 2.2: 更新 vite.config.ts
- [ ] 配置對應的別名
- [ ] 確保構建正常

#### 步驟 2.3: 更新導入路徑
- [ ] 批量替換相對路徑為別名
- [ ] 測試所有組件導入

---

### Phase 3: 建立缺失模組（優先級：🟡 中）

#### 步驟 3.1: Sessions 模組
- [ ] 建立目錄結構
- [ ] 建立服務層
- [ ] 建立 Hooks
- [ ] 遷移相關組件

#### 步驟 3.2: Customers 模組
- [ ] 建立目錄結構
- [ ] 建立服務層
- [ ] 建立 Hooks
- [ ] 遷移相關組件

#### 步驟 3.3: 其他模組
- [ ] 按優先級逐步建立

---

### Phase 4: 組件重組（優先級：🟢 低）

#### 步驟 4.1: 分析組件歸屬
- [ ] 列出所有組件
- [ ] 確定每個組件應該歸屬的模組

#### 步驟 4.2: 逐步遷移
- [ ] 一次遷移一個模組的組件
- [ ] 更新導入路徑
- [ ] 測試功能

---

## 7. 建議的最終結構

```
TrvicERP-Co/
├── src/
│   ├── core/                    # 核心功能
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── modules/                 # 功能模組
│   │   ├── orders/
│   │   ├── quotations/
│   │   ├── sessions/
│   │   ├── customers/
│   │   ├── tours/
│   │   ├── itineraries/
│   │   └── reports/
│   ├── lib/                     # 工具函數
│   │   ├── api/
│   │   ├── utils/
│   │   ├── ai/
│   │   └── mock/
│   ├── data/                    # 靜態資料
│   ├── store/                   # 狀態管理
│   ├── App.tsx
│   └── index.tsx
├── components/                  # 共用組件（暫時保留）
│   └── shared/
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 8. 實施優先順序

### 🔴 立即執行（Week 1）
1. 統一認證服務
2. 更新路徑別名配置
3. 統一類型定義（部分）

### 🟡 短期執行（Week 2-3）
4. 統一工具函數位置
5. 建立 Sessions 模組
6. 建立 Customers 模組

### 🟢 中期執行（Week 4+）
7. 組件重組
8. 建立其他缺失模組
9. 清理未使用檔案

---

## 9. 風險評估

### 高風險
- **類型定義遷移**：可能影響大量檔案
  - 緩解：逐步遷移，保持向後相容

### 中風險
- **路徑別名更新**：可能導致構建失敗
  - 緩解：充分測試，逐步更新

### 低風險
- **組件重組**：主要是組織優化
  - 緩解：不影響功能，可逐步進行

---

## 10. 檢查清單

### 清理重複檔案
- [ ] 刪除 `src/services/authService.ts`
- [ ] 檢查並處理 `hooks/useQuotation.ts`
- [ ] 遷移 `types.ts` 到 `src/core/types/`

### 統一工具函數
- [ ] 遷移 `lib/` 到 `src/lib/`
- [ ] 更新所有導入路徑

### 更新路徑配置
- [ ] 更新 `tsconfig.json`
- [ ] 更新 `vite.config.ts`
- [ ] 測試路徑解析

### 建立缺失模組
- [ ] Sessions 模組
- [ ] Customers 模組
- [ ] Tours 模組
- [ ] Itineraries 模組

---

*報告生成時間：2025-01-XX*  
*建議審查後開始實施*
