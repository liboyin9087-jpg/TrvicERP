# TravelMaster ERP

企業旅遊與團務營運的前端管理系統，涵蓋員工端、福委端與旅客端的多角色流程，
並提供提案模式與 LINE 風格預覽以利對外展示。

## 功能概覽
- 多角色視圖：員工（staff）、福委（welfare）、旅客（traveler）。
- 主要模組：
  - 營運儀表板、營運中心、團次管理、行程規劃/配置器
  - 客戶管理、收款管理、護照管理
  - 報價計算、快速估價、成本分析、保險管理、領隊報帳、LINE 客服
  - 旅客端：我的行程、行程表、投票、行前說明、加購項目、旅遊足跡
- 內建 AI/法律助手與互動地圖（視覺輔助與法規提示）。
- 三種瀏覽模式：
  - 一般模式：`/`
  - 提案模式：`/proposal/*`
  - LINE 風格模式：`/line/*`

## 技術棧
- React 18 + TypeScript
- Vite + React Router
- Tailwind CSS + Framer Motion
- Zustand 狀態管理
- PWA 支援（`vite-plugin-pwa`, `workbox-window`）

## 快速開始
1. 安裝套件
   - `npm install`
2. 設定環境變數
   - `cp .env.example .env.local`
3. 啟動開發環境
   - `npm run dev`
4. 建置/預覽
   - `npm run build`
   - `npm run preview`

## 環境變數
請參考 `.env.example`：
- `VITE_API_URL`：後端 API 位置
- `VITE_USE_MOCK`：是否使用 Mock 模式
- `GEMINI_API_KEY`：AI 文案生成金鑰

## 目錄結構
- `App.tsx`：路由與主畫面邏輯
- `components/`：依角色/功能拆分的 UI 模組
- `src/core/`：核心 hooks、services、types
- `src/modules/`：業務模組服務與 hooks
- `src/store/`：Zustand 狀態管理
- `src/data/`：靜態資料
- `raw_data/`：原始資料與法規文件
- `public/`：PWA 靜態資源

## 目前欠缺/待補
以下項目依 repo 目前可見內容整理：
- 後端專案與 API 規格文件（目前僅見前端與 mock 資料/設定）
- 測試與測試腳本（unit/integration/e2e）
- CI/CD 流程（如 GitHub Actions）
- Lint/Format 執行腳本與一致性規範
- 發佈/部署流程文件與環境分流策略
- 版本變更紀錄（CHANGELOG）、貢獻指南、授權條款
- 監控/錯誤追蹤與日誌策略（Sentry/Log 等）

## 完整度評估（基於目前 repo 可觀察內容的粗估）
- UI/功能頁面：70%（多數模組與視圖已具備）
- 資料/後端整合：40%（有 API 入口與 mock，但缺少介接文件）
- 工程化成熟度：30%（缺少測試、CI、發佈與文件）
- **整體完成度：50% ±10%**

> 註：以上為依現有檔案結構與腳本推估，實際進度仍需對照產品規格與後端進展。
