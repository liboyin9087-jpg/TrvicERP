# TrvicERP - AI-Powered Travel Intelligence Platform

**創域旅遊管理系統** | Trvic Enterprise Resource Planning

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/liboyin9087-jpg/TrvicERP)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)](https://fastapi.tiangolo.com/)

> 🌍 全台唯一整合 AI 智能助理的旅遊 ERP 系統，從報價、行程規劃到成本分析，一站式解決方案

---

## 📋 目錄

- [簡介](#簡介)
- [核心功能](#核心功能)
- [技術架構](#技術架構)
- [快速開始](#快速開始)
- [開發指南](#開發指南)
- [部署](#部署)
- [文檔](#文檔)
- [貢獻](#貢獻)

---

## 🎯 簡介

TrvicERP 是一個專為旅行社、企業旅遊及福委會設計的現代化 ERP 系統。我們整合最先進的 AI 技術，提供智能化的旅遊管理解決方案。

### 核心價值

- 🤖 **AI 驅動**: 整合 Gemini / SiliconFlow AI，提供智能助理與自動化功能
- 🎨 **現代化 UI**: 採用 Glassmorphism 設計語言，提供優雅的使用者體驗
- 📊 **全功能覆蓋**: 從報價、行程規劃、客戶管理到財務分析，一站搞定
- 🚀 **高效能**: React 18 + Vite + TypeScript，快速響應與開發體驗
- 🔒 **企業級安全**: 完整的權限控制與資料加密

### 目標客戶

- 🏢 中大型旅行社 (年營業額 5000 萬以上)
- 🎯 企業福委會 / HR 部門 (500 人以上企業)
- 💼 企業差旅管理部門

---

## ✨ 核心功能

### 管理端 (Admin Dashboard)

- **📊 可拖曳儀表板**: 自訂 17 種小工具，打造專屬數據中心
- **📅 行程管理系統**: Session Manager 完整追蹤旅遊行程
- **💰 付款監控**: 即時追蹤應收應付款項
- **🛂 護照看板**: Kanban 式護照與簽證管理
- **📈 成本分析**: P&L 分析、毛利追蹤、預算控制

### 業務端 (Staff Tools)

- **🎨 視覺化規劃器**: 拖拉式行程設計工具
- **👥 客戶 CDP**: 360° 客戶數據平台
- **🏢 企業 CRM**: B2B 客戶關係管理
- **📋 報價系統**: 快速產生精美報價單
- **✨ 提案引擎**: AI 協助產生客製化提案
- **🔧 營運中心**: 保險、簽證、行程管理整合
- **💬 LINE 整合**: 即時客服與推播通知

### 客戶端 (Traveler Portal)

- **✈️ 旅客應用**: 行程查詢、文件上傳、即時通知
- **🗺️ 行程檢視**: 互動式地圖與時間軸
- **🗳️ 行程投票**: 團體決策功能
- **📖 數位手冊**: 電子化旅遊手冊
- **🛍️ 行程加購**: 可選項目與額外服務

### AI 智能功能

- **🤖 AI 副駕駛**: 24/7 智能助理，回答業務問題
- **🔍 智能搜尋**: 語意搜尋客戶、訂單、行程
- **📊 預測分析**: AI 驅動的需求預測與價格建議
- **🎯 主動建議**: 基於上下文的智能推薦

---

## 🏗️ 技術架構

### 前端技術棧

```
React 18.2          - UI 框架
TypeScript 5.2      - 型別安全
Vite 7.3            - 建置工具 (閃電般快速)
Tailwind CSS 3.4    - 樣式框架
Zustand 5.0         - 狀態管理 (輕量高效)
Framer Motion 12    - 動畫引擎
React Router 7      - 路由管理
```

### 後端技術棧

```
FastAPI (Python)    - 高效能 REST API
SQLAlchemy          - ORM (資料庫抽象層)
Supabase            - 後端即服務 (Auth + DB + Storage)
Pydantic            - 資料驗證
```

### AI & 機器學習

```
Google Gemini       - LLM (主要)
SiliconFlow         - LLM (備選)
Qdrant              - 向量資料庫
Sentence Transformers - 語意搜尋
RAG (Retrieval-Augmented Generation) - 知識庫增強
```

### 開發工具

```
ESLint              - 程式碼品質
Prettier            - 程式碼格式化
TypeScript          - 型別檢查
Git                 - 版本控制
```

---

## 🚀 快速開始

### 系統需求

- Node.js >= 18.0
- Python >= 3.10
- npm >= 9.0

### 1. 安裝依賴

```bash
# 前端依賴
npm install

# 後端依賴 (如果需要本地運行)
cd backend
pip install -r requirements.txt
```

### 2. 環境變數設置

複製 `.env.example` 並重命名為 `.env`，填入必要的環境變數：

```bash
# 前端環境變數
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false

# AI 服務 (可選)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_AI_SERVER_URL=http://localhost:8001
```

### 3. 啟動開發伺服器

```bash
# 前端開發伺服器 (Port 5173)
npm run dev

# 後端 API 伺服器 (Port 8000)
cd backend
uvicorn app.main:app --reload

# AI 服務伺服器 (Port 8001)
cd ai-server
python main.py
```

### 4. 訪問應用

- 前端: http://localhost:5173
- API 文檔: http://localhost:8000/docs
- AI 服務: http://localhost:8001

### 預設登入帳號 (開發環境)

```
管理員:
Email: admin@example.com
Password: admin123

業務人員:
Email: staff@example.com
Password: staff123

旅客:
Email: traveler@example.com
Password: traveler123
```

---

## 💻 開發指南

### 專案結構

```
TrvicERP/
├── src/                      # 前端核心程式碼
│   ├── components/          # 共用 UI 組件
│   ├── modules/             # 功能模組
│   ├── store/               # Zustand 狀態管理
│   ├── services/            # 業務邏輯服務
│   ├── lib/                 # 工具函數與套件包裝
│   ├── types/               # TypeScript 型別定義
│   └── theme/               # 設計系統 (顏色、間距等)
├── components/              # 功能頁面組件
│   ├── admin/              # 管理端組件
│   ├── staff/              # 業務端組件
│   ├── client/             # 客戶端組件
│   └── shared/             # 共用組件
├── backend/                 # 後端 API
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── models/         # 資料模型
│   │   ├── schemas/        # Pydantic 資料驗證
│   │   └── core/           # 核心功能 (Auth, Config)
├── ai-server/               # AI 服務
│   ├── main.py             # AI 路由與代理
│   ├── prompt_templates.py # AI 提示詞範本
│   └── rules.txt           # 業務規則
├── public/                  # 靜態資源
├── scripts/                 # 工具腳本
└── docs/                    # 文檔 (即將新增)
```

### 開發工作流程

1. **創建分支**: `git checkout -b feature/your-feature-name`
2. **開發功能**: 遵循現有程式碼風格
3. **測試**: `npm run test` (即將新增)
4. **Lint**: `npm run lint`
5. **提交**: `git commit -m "feat: add your feature"`
6. **推送**: `git push origin feature/your-feature-name`
7. **PR**: 創建 Pull Request 並等待審查

### 程式碼規範

- 使用 TypeScript strict 模式
- 所有組件必須有型別定義
- 使用 Tailwind CSS utilities (避免自訂 CSS)
- 組件檔案 < 300 行 (超過請拆分)
- 遵循 React Hooks 規則

### 命名規範

```typescript
// 組件名稱: PascalCase
function CustomerCard() {}

// Hook: use開頭 + camelCase
function useCustomerData() {}

// 常數: UPPER_SNAKE_CASE
const API_BASE_URL = '...';

// 函數: camelCase
function calculateTotal() {}

// 型別/介面: PascalCase
interface Customer {}
type OrderStatus = '...';
```

---

## 📦 建置與部署

### 建置生產版本

```bash
# 前端建置
npm run build

# 輸出目錄: dist/
# 建置檔案已優化、壓縮、Code Splitting
```

### 型別檢查

```bash
npm run build:check
```

### 部署到 Vercel (推薦)

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 部署到其他平台

建置後的 `dist/` 目錄可部署到任何靜態託管服務:

- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages

### 環境變數設置 (生產環境)

確保在部署平台設置以下環境變數:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL
VITE_GEMINI_API_KEY
```

---

## 📚 文檔

### 重要文檔

- **[SENIOR_PM_REVIEW.md](./SENIOR_PM_REVIEW.md)** - 資深 PM 全面性評估報告
- **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** - 技術實施路線圖
- **API.md** (即將新增) - 後端 API 文檔
- **DESIGN_SYSTEM.md** (即將新增) - UI 設計系統指南

### 線上文檔

- [API 互動式文檔](http://localhost:8000/docs) (本地開發)
- Component Storybook (計畫中)

---

## 🧪 測試

### 運行測試

```bash
# 單元測試
npm run test

# 測試覆蓋率
npm run test:coverage

# E2E 測試 (計畫中)
npm run test:e2e
```

### 測試策略

- 單元測試: Vitest + React Testing Library
- 整合測試: Vitest
- E2E 測試: Playwright (計畫中)
- 目標覆蓋率: 70%+

---

## 🤝 貢獻

我們歡迎任何形式的貢獻！

### 如何貢獻

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 報告問題

如果發現 Bug 或有功能建議，請[開啟 Issue](https://github.com/liboyin9087-jpg/TrvicERP/issues)

---

## 📄 授權

本專案為專有軟體，未經授權不得用於商業用途。

---

## 👥 團隊

- **產品負責人**: [待補充]
- **技術負責人**: [待補充]
- **UI/UX 設計**: [待補充]

---

## 🗺️ 產品路線圖

### Q1 2026 ✅
- [x] v2.0 核心功能完成
- [x] AI 副駕駛整合
- [x] 可拖曳儀表板
- [ ] 品牌重塑與統一

### Q2 2026 🚧
- [ ] 財務管理模組
- [ ] 供應商管理系統
- [ ] 語音輸入/輸出
- [ ] Marketplace 啟動

### Q3 2026 📅
- [ ] 行動端 PWA 完整化
- [ ] 白標方案
- [ ] 多租戶系統

### Q4 2026 📅
- [ ] 預測性分析
- [ ] 客戶標籤系統
- [ ] 行業標竿報告

---

## 📞 聯絡我們

- **Email**: support@trvicerp.com (示例)
- **Website**: https://trvicerp.com (示例)
- **Discord**: [加入社群](https://discord.gg/trvicerp) (示例)

---

## ⭐ 致謝

感謝以下開源專案與技術:

- React Team
- Tailwind Labs
- Vercel
- Supabase
- Google AI
- 以及所有貢獻者

---

**Made with ❤️ by TrvicERP Team**

---

## 🔗 相關連結

- [產品介紹簡報](./docs/presentation.pdf) (即將新增)
- [使用者手冊](./docs/user-manual.pdf) (即將新增)
- [開發者指南](./docs/developer-guide.pdf) (即將新增)

---

*最後更新: 2026-02-01*
