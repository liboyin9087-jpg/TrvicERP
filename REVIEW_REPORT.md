# TrvicERP 專案審查報告 — 資深 PM 觀點

> 審查日期：2026-01-30
> 審查角度：MVP 可交付性、市場化準備度、團體旅遊 ERP 垂直用戶體驗

---

## 一、整體評價摘要

TrvicERP 是一個針對**團體旅遊產業**的垂直式 ERP 系統，涵蓋行程管理、訂單、報價、護照追蹤、CRM、AI Copilot 等模組。從功能覆蓋面來看，展示了相當完整的產業知識。但從 **MVP 可交付性** 和 **市場化準備度** 來看，存在以下結構性問題。

---

## 二、嚴重問題（Critical — 影響上線與可維護性）

### 1. 沒有任何自動化測試 — 零測試覆蓋率

整個專案沒有任何 `.test.ts`、`.spec.ts` 檔案，沒有 Jest/Vitest 設定。

**影響**：
- 無法確認任何功能是否正確運作
- 任何重構或修改都有回歸風險
- 投資方/客戶進行技術 DD (Due Diligence) 時，這是即刻淘汰的紅旗

**建議**：至少針對核心業務邏輯（訂單流程、報價計算、權限矩陣）建立 unit tests，前端元件用 React Testing Library 做基本 smoke tests。

### 2. TypeScript 嚴格模式完全關閉

`tsconfig.json` 設定 `"strict": false`，且 `noUnusedLocals`、`noUnusedParameters`、`noImplicitReturns` 全部關閉。

**影響**：
- 隱藏了大量潛在的 `null`/`undefined` 錯誤
- 在運行時才會爆出本應在編譯時攔截的 bug
- 團隊協作時缺乏型別安全護欄

**建議**：分階段開啟 strict mode，至少先啟用 `strictNullChecks` 和 `noImplicitAny`。

### 3. 前端路由架構設計缺陷 — 偽 SPA

`App.tsx` 中所有受保護頁面都打到同一個 `<Route path="/" />` 和 `<Route path="*" />`，實際頁面切換是透過 Zustand store 的 `currentView` 狀態驅動，而非使用 React Router 的真實路由。

**影響**：
- 瀏覽器上下頁 (back/forward) 不工作
- 無法分享特定頁面連結（所有頁面 URL 都是 `/`）
- SEO 完全失效（雖然 B2B SaaS 可能影響較小）
- 違反使用者對 Web 應用的基本預期

**建議**：將 `VIEW_COMPONENTS` 映射改為真正的 `<Route path="/dashboard" />` 等嵌套路由。

### 4. 前端/後端分離不完整 — Mock 依賴過重

`VITE_USE_MOCK` 預設為 `true`（只有嚴格設為 `'false'` 時才關閉）。大量元件內嵌 mock 資料，使得真實 API 整合狀態不明。

**影響**：
- 無法確認 API 整合是否真正能跑
- Demo 看起來很完整，但可能只是 UI shell
- 後端的 API endpoints 與前端的 mock 資料結構是否一致，沒有契約驗證

### 5. 重複元件 — PassportKanban 存在兩份

- `components/admin/PassportKanban.tsx` — 使用 `@dnd-kit`
- `components/staff/PassportKanban.tsx` — 使用 `@hello-pangea/dnd`

兩個同名元件使用不同的拖拽函式庫，這不是有意的設計分工，而是程式碼管理混亂的信號。

---

## 三、架構與結構問題（High — 影響擴展性）

### 6. 目錄結構不一致

專案同時存在三個平行的元件目錄：
```
/components/         ← 根目錄級（admin/, client/, staff/, shared/）
/src/components/     ← src 目錄下另一套（admin/, charts/, ui/）
/src/design-system/  ← 又一套 UI 元件
```

這導致：
- 開發者不知道新元件該放哪裡
- Import 路徑混亂（`tsconfig.json` 的 `@/components/*` 指向 `./components/*`，但 `@/*` 指向 `./src/*`）
- 同質的元件（如 `ErrorBoundary`）在 `/components/shared/` 和 `/src/components/` 各有一份

**建議**：統一移到 `src/` 下，建立清晰的 Feature-based 目錄結構。

### 7. 設計系統碎片化

存在三套 UI 系統並存：
- `src/design-system/` — 自建 Button、DataGrid、Kintone 風格元件
- `components/shared/` — GlassCard、GlassmorphismDashboard
- 直接在元件中使用 Tailwind utility classes

沒有統一的 Design Token 系統。`index.css` 定義了 CSS Variables，`tailwind.config.js` 定義了另一套顏色系統，`src/theme/colors.ts` 又是第三套。

**對「版面一致性」的影響**：
- 不同頁面可能用不同的 spacing、font size、color 系統
- Glassmorphism 風格（深色毛玻璃）和 Kintone 風格（淺色企業風）混用
- 對市場化而言，品牌一致性是基本門檻

### 8. 產品命名不一致

- `package.json` name: `travelmaster-os`
- 登入頁與側欄 logo: `TravelMaster`
- README 和 GitHub repo: `TrvicERP`
- 客戶入口: `旅遊業企業資源規劃系統`

一個產品四個名字，對品牌建立是致命傷。

---

## 四、MVP 與市場化審查

### 9. MVP 範圍過大 — 功能膨脹

目前涵蓋 **25+ 個模組**，對 MVP 而言這是嚴重的範圍蔓延 (scope creep)。

**MVP 建議聚焦核心 5 個模組**：

| 優先級 | 模組 | 理由 |
|--------|------|------|
| P0 | 行程產品管理 + 團次管理 | 旅行社最核心的「貨架」|
| P0 | 訂單管理 + 付款追蹤 | 營收直接相關 |
| P0 | 客戶管理 (基本 CRM) | 所有業務的基礎 |
| P1 | 報價系統 | 業務人員每日使用 |
| P1 | 護照管理 | 團體旅遊的獨特痛點 |

其餘模組（AI Copilot、碳足跡、LINE 整合、投票等）應移入 Phase 2+。

### 10. 資料模型不夠深入

`backend/app/models/models.py` 的 data model 雖然涵蓋了主要 entity，但缺少旅遊業的關鍵欄位：

- **Tour Model**：缺少供應商 (supplier) 關聯、航班資訊、簽證需求、最低成團人數
- **Session Model**：缺少房型分配 (rooming list)、餐食安排、交通安排
- **Order Model**：缺少分期付款排程、收據/發票關聯、退改費規則
- **缺少獨立的 Supplier/Vendor 表**：酒店、巴士、地接社等
- **缺少 Itinerary 的獨立 Model**：目前行程存在 Tour 的 JSON 欄位中，無法獨立版本管理

### 11. 安全性隱患

- 認證機制在前端是基於 `localStorage` 的 `isLoggedIn` 布林值，沒有 JWT token 驗證或 session 管理的前端實作
- `src/lib/crypto.ts` 存在自行實作的加密工具 — 自製 crypto 在生產環境中是高風險做法
- 後端的認證/授權 middleware 需要驗證是否完備

### 12. 離線與 PWA 功能半成品

存在 `public/sw.js`（Service Worker）和 `offlineService.ts`，但：
- PWA 插件配置是否完整需確認
- 離線同步的衝突解決機制不明確
- 對 MVP 而言，離線功能不是必要的，反而增加了測試複雜度

---

## 五、團體旅遊 ERP 垂直用戶體驗建議

### 13. 用戶角色體驗區隔不足

目前三個角色 (staff/welfare/traveler) 共用同一個 App shell，僅透過導覽列篩選。建議：

- **Staff 端**：應有操作效率導向的密集資訊介面（如 Kintone 風格）
- **Traveler 端**：應該是獨立的輕量 Web App（甚至獨立部署），重視行動端體驗
- **Welfare/企業端**：介於兩者之間，重視報表與審批流程

### 14. 缺少的旅遊業關鍵工作流

作為團體旅遊 ERP，以下工作流是產業標配但目前缺乏或不完整：

- **機位/房位控管 (Allotment)** — 旅行社最核心的庫存管理
- **供應商管理** — 地接社、酒店、航空公司的合約與帳務
- **團控表 (Tour Control Sheet)** — 單團的全面控管文件
- **結團報告** — 團結束後的損益分析
- **簽證管理** — 不只是護照，還有各國簽證申請追蹤

### 15. 行動端體驗

`App.tsx` 有 MobileMenu 元件，Tailwind 有 responsive 斷點，但：
- 各模組元件是否都有做 responsive layout 需要逐一確認
- 團體旅遊的「領隊端」(Tour Leader App) 是高頻行動使用場景，需要特別優化

---

## 六、專案品質改善路線圖建議

```
Phase 1 — 基礎修復 (Foundation Fix)
├── 統一目錄結構 → 所有程式碼移入 src/
├── 實作真正的 URL 路由
├── 開啟 TypeScript strict mode
├── 建立測試基礎設施 (Vitest + RTL)
├── 統一產品命名為一個品牌
└── 合併/刪除重複元件

Phase 2 — MVP 聚焦
├── 確認核心 5 模組的 API 整合
├── 補足資料模型欄位
├── 建立前後端 API 契約 (OpenAPI spec)
├── 實作真正的認證流程 (JWT)
└── 核心模組的 E2E 測試

Phase 3 — 市場化準備
├── 統一設計系統 (Design System consolidation)
├── 效能優化 (bundle size audit)
├── 國際化 (i18n) 基礎設施
├── 無障礙 (a11y) 基本合規
└── 安全性審計
```

---

## 七、總結評分

| 維度 | 評分 (1-10) | 說明 |
|------|:-----------:|------|
| **功能完整度** | 7/10 | 功能面涵蓋廣，但深度不足，多為 UI 展示層 |
| **程式碼品質** | 4/10 | 無測試、strict 關閉、目錄混亂、元件重複 |
| **架構設計** | 5/10 | 有模組化意圖但執行不一致，路由是假路由 |
| **MVP 準備度** | 3/10 | 範圍過大、Mock 依賴、無法確認真實 API 可用 |
| **市場化準備度** | 3/10 | 品牌不一致、無測試、安全性未驗證 |
| **UI/UX 一致性** | 5/10 | 設計系統碎片化，多種風格混用 |
| **產業適切性** | 6/10 | 了解旅遊業需求，但缺少機位控管等核心功能 |

**總評**：專案展現了對旅遊業 ERP 的充分理解和技術野心，但目前處於「Demo/Prototype 階段」而非「MVP 階段」。建議立即收斂範圍、修復基礎架構問題，先把核心模組做到真正可用，再逐步擴展。
