# 快速修復指南

> 基於架構優化報告的快速修復步驟

---

## 🚀 快速修復步驟

### Step 1: 更新路徑別名配置（5 分鐘）

#### 1.1 更新 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/core/*": ["./src/core/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/core/types/*"],
      "@/store/*": ["./src/store/*"],
      "@/data/*": ["./src/data/*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

#### 1.2 更新 `vite.config.ts`

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './components'),
    '@/core': path.resolve(__dirname, './src/core'),
    '@/modules': path.resolve(__dirname, './src/modules'),
    '@/lib': path.resolve(__dirname, './src/lib'),
    '@/types': path.resolve(__dirname, './src/core/types'),
    '@/store': path.resolve(__dirname, './src/store'),
    '@/data': path.resolve(__dirname, './src/data'),
  },
}
```

---

### Step 2: 統一認證服務（10 分鐘）

#### 2.1 檢查並更新導入

```bash
# 找出所有使用舊認證服務的檔案
grep -r "from.*services/authService" --include="*.ts" --include="*.tsx" .
```

#### 2.2 更新導入路徑

**從：**
```typescript
import { login } from '../../src/services/authService';
```

**到：**
```typescript
import { AuthService } from '@/core/services/authService';
// 使用方式改為：AuthService.login()
```

#### 2.3 刪除舊檔案

```bash
rm src/services/authService.ts
# 如果 src/services/ 為空，也可以刪除目錄
rmdir src/services/ 2>/dev/null || true
```

---

### Step 3: 建立類型統一匯出（15 分鐘）

#### 3.1 建立 `src/core/types/index.ts`

```typescript
/**
 * 統一類型匯出
 */

// 認證與權限
export * from './auth';

// 訂單管理
export * from './order';

// 報價管理
export * from './quotation';

// 行程安排
export * from './itinerary';

// 從舊 types.ts 遷移的類型（逐步遷移）
export type {
  Attraction,
  ItineraryItem,
  ItineraryState,
  TourSession,
  Booking,
  // ... 其他類型
} from '../../../types';
```

#### 3.2 更新組件導入

**從：**
```typescript
import type { TourSession } from '../../types';
```

**到：**
```typescript
import type { TourSession } from '@/types';
```

---

### Step 4: 遷移工具函數（20 分鐘）

#### 4.1 建立目錄結構

```bash
mkdir -p src/lib/utils
mkdir -p src/lib/mock
```

#### 4.2 遷移檔案

```bash
# 遷移工具函數
mv lib/geoUtils.ts src/lib/utils/
mv lib/weatherUtils.ts src/lib/utils/

# 遷移 Mock 資料
mv lib/mockSupabase.ts src/lib/mock/
mv lib/shoppingData.ts src/lib/mock/

# 遷移資料（可選）
mv lib/legalKnowledge.ts src/data/  # 或保留在 lib/
```

#### 4.3 更新導入路徑

**從：**
```typescript
import { getWeatherByLocation } from '../../lib/weatherUtils';
```

**到：**
```typescript
import { getWeatherByLocation } from '@/lib/utils/weatherUtils';
```

---

### Step 5: 建立模組索引檔案（10 分鐘）

#### 5.1 為每個模組建立 `index.ts`

**`src/modules/orders/index.ts`**
```typescript
export * from './services/orderService';
export * from './hooks/useOrders';
export type * from '@/core/types/order';
```

**`src/modules/quotations/index.ts`**
```typescript
export * from './services/quotationService';
export * from './hooks/useQuotations';
export type * from '@/core/types/quotation';
```

#### 5.2 使用範例

```typescript
// 之前
import { OrderService } from '@/modules/orders/services/orderService';
import { useOrders } from '@/modules/orders/hooks/useOrders';

// 之後
import { OrderService, useOrders } from '@/modules/orders';
```

---

## 📝 檢查清單

### 配置更新
- [ ] 更新 `tsconfig.json` 路徑別名
- [ ] 更新 `vite.config.ts` 別名配置
- [ ] 測試構建是否正常

### 檔案清理
- [ ] 刪除 `src/services/authService.ts`
- [ ] 更新所有認證服務導入
- [ ] 測試登入功能

### 類型統一
- [ ] 建立 `src/core/types/index.ts`
- [ ] 更新組件類型導入
- [ ] 測試類型檢查

### 工具函數遷移
- [ ] 遷移 `lib/` 到 `src/lib/`
- [ ] 更新所有導入路徑
- [ ] 測試功能正常

### 模組索引
- [ ] 為每個模組建立 `index.ts`
- [ ] 更新模組導入
- [ ] 測試功能正常

---

## 🔍 驗證步驟

### 1. 構建測試
```bash
npm run build
```

### 2. 開發伺服器測試
```bash
npm run dev
```

### 3. 類型檢查
```bash
npx tsc --noEmit
```

### 4. 搜尋未更新的導入
```bash
# 搜尋相對路徑導入（應該逐步替換為別名）
grep -r "from.*\.\./\.\./src" --include="*.ts" --include="*.tsx" .
```

---

## ⚠️ 注意事項

1. **逐步遷移**：不要一次修改所有檔案，逐步進行並測試
2. **備份**：在開始前先提交到 Git
3. **測試**：每次修改後都要測試相關功能
4. **文檔**：更新相關文檔說明新的導入方式

---

## 🎯 預期成果

完成後應該：
- ✅ 統一的導入路徑（使用別名）
- ✅ 清晰的模組結構
- ✅ 無重複檔案
- ✅ 類型定義統一
- ✅ 工具函數組織良好

---

*快速修復指南 - 2025-01-XX*
