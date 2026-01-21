# TrvicERP - 旅遊企業資源規劃系統

> 現代化的旅遊業 ERP 系統，整合團次管理、客戶關係、報價系統、行程規劃等核心功能

## 📋 目錄

- [功能特色](#功能特色)
- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [開發指南](#開發指南)
- [專案結構](#專案結構)
- [環境變數](#環境變數)
- [部署](#部署)
- [貢獻指南](#貢獻指南)

## ✨ 功能特色

### 核心功能

- **團次管理**: 完整的團次生命週期管理，支援狀態轉換、資源分配
- **行程規劃**: 視覺化行程配置器，支援多版本管理
- **客戶管理 (CDP)**: 客戶資料平台，整合互動記錄、消費分析
- **報價系統**: 智能報價計算，支援版本歷史與轉換訂單
- **支付監控**: 即時收款狀態追蹤，多種支付方式支援
- **護照管理**: Kanban 看板式護照流程管理
- **成本分析**: 詳細的成本結構分析與利潤計算
- **福利管理**: 企業福委會專屬功能，支援投票與預算管理

### 角色權限

- **員工 (Staff)**: 完整的管理功能
- **福委 (Welfare)**: 活動管理與預算控制
- **旅客 (Traveler)**: 行程查看、報名、投票等功能

### 技術亮點

- 🎨 現代化 UI/UX 設計系統
- 📱 響應式設計，支援桌面與行動裝置
- 🔄 即時同步功能
- 📴 離線支援 (IndexedDB)
- 🤖 AI 助手整合
- 📄 PDF 文件生成
- 💬 LINE 客服整合

## 🛠 技術棧

### 前端框架

- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Vite** - 建置工具
- **React Router** - 路由管理

### 狀態管理

- **Zustand** - 輕量級狀態管理
- **React Hooks** - 自定義 Hooks

### UI 庫

- **Tailwind CSS** - 樣式框架
- **Framer Motion** - 動畫庫
- **Lucide React** - 圖標庫

### 其他工具

- **@react-pdf/renderer** - PDF 生成
- **Recharts** - 圖表庫
- **Fuse.js** - 模糊搜尋
- **Workbox** - PWA 支援

## 🚀 快速開始

### 前置需求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 安裝

```bash
# 複製專案
git clone <repository-url>
cd TrvicERP-Co

# 安裝依賴
npm install

# 複製環境變數檔案
cp .env.example .env

# 編輯環境變數（如需要）
# 編輯 .env 檔案
```

### 開發模式

```bash
# 啟動開發伺服器
npm run dev

# 應用程式將在 http://localhost:4000 啟動
```

### 建置

```bash
# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

## 📖 開發指南

### 專案結構

```
TrvicERP-Co/
├── components/          # React 元件
│   ├── admin/          # 管理員元件
│   ├── staff/          # 員工元件
│   ├── client/         # 客戶端元件
│   └── shared/         # 共享元件
├── src/
│   ├── core/           # 核心功能
│   │   ├── hooks/      # 核心 Hooks
│   │   ├── services/   # 核心服務
│   │   └── types/      # 類型定義
│   ├── modules/        # 功能模組
│   │   ├── customers/  # 客戶管理
│   │   ├── orders/     # 訂單管理
│   │   ├── quotations/ # 報價管理
│   │   ├── sessions/   # 團次管理
│   │   ├── tours/      # 行程管理
│   │   └── reports/    # 報表管理
│   ├── lib/            # 工具庫
│   │   ├── api.ts      # API 封裝
│   │   └── utils/      # 工具函數
│   └── store/          # 狀態管理
├── public/             # 靜態資源
└── types.ts            # 全域類型定義
```

### 開發規範

#### 命名規範

- **元件**: PascalCase (例: `SessionManager.tsx`)
- **函數/變數**: camelCase (例: `getSessions`)
- **類型/介面**: PascalCase (例: `SessionStatus`)
- **常數**: UPPER_SNAKE_CASE (例: `API_BASE_URL`)

#### 檔案組織

- 每個功能模組包含 `services/` 和 `hooks/` 目錄
- 共享元件放在 `components/shared/`
- 類型定義統一在 `src/core/types/`

#### 程式碼風格

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 使用 Prettier 格式化

### API 整合

所有 API 請求透過 `src/lib/api.ts` 統一封裝：

```typescript
import { api, API_ENDPOINTS } from '@/lib/api';

// GET 請求
const result = await api.get<Session[]>(API_ENDPOINTS.sessions.list);

// POST 請求
const result = await api.post<Session>(API_ENDPOINTS.sessions.create, data);
```

### 狀態管理

使用 Zustand 進行狀態管理：

```typescript
import { useAppStore } from '@/store/useAppStore';

function MyComponent() {
  const { currentView, setCurrentView } = useAppStore();
  // ...
}
```

## 🔧 環境變數

詳見 [.env.example](.env.example) 檔案。

主要環境變數：

- `VITE_API_URL` - 後端 API 基礎 URL
- `GEMINI_API_KEY` - Gemini AI API 金鑰（可選）

## 📦 部署

### 快速部署
```bash
# 推送到 GitHub 自動觸發 Vercel 部署
git push origin main
npm run build
```

建置產物將輸出到 `dist/` 目錄。

### 部署選項

#### Vercel

1. 連接 GitHub 倉庫
2. 設定環境變數
3. 自動部署

#### Netlify

1. 連接 GitHub 倉庫
2. 建置命令: `npm run build`
3. 發佈目錄: `dist`
4. 設定環境變數

#### 自架伺服器

```bash
# 建置
npm run build

# 使用 nginx 或其他靜態檔案伺服器
# 指向 dist/ 目錄
```

## 🧪 測試

```bash
# 執行單元測試
npm run test

# 執行測試並顯示覆蓋率
npm run test:coverage
```

## 📝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案為私有專案，版權所有。

## 📞 聯絡資訊

如有問題或建議，請聯絡專案維護者。

---

**TrvicERP** - 讓旅遊管理更簡單、更高效
