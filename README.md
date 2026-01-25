# TrvicERP - 旅遊業企業資源規劃系統

智能化旅遊業 ERP 解決方案，整合 AI 助手、多角色權限、即時協作等企業級功能。

## 功能特色

### 核心功能
- **Dashboard 儀表板** - 可自訂的 KPI 儀表板，支援拖拉排版
- **團期管理** - 完整的出團排程、人數追蹤、資源分配
- **CRM 客戶管理** - 客戶資料、互動記錄、消費分析
- **報價系統** - 多版本報價產出、毛利試算
- **行程規劃** - 拖拉式行程編輯器、版本控制
- **護照管理** - 護照流轉追蹤、到期提醒
- **費用報銷** - 領隊報帳、多幣別支援

### AI Copilot 智能助手
- **多模式專家** - 行程規劃、行銷文案、成本估算、法規諮詢
- **RAG 法規知識庫** - 旅遊定型化契約、消保法規即時查詢
- **Function Calling** - AI 可直接操作系統功能
- **結構化輸出** - JSON Schema 驗證的報價單、行程表

### 多角色支援
- **Staff (員工)** - 完整後台功能
- **Welfare (福委)** - 企業福委專用介面
- **Traveler (旅客)** - 行程查詢、投票、報名

## 技術架構

### 前端
- **React 18** + TypeScript
- **Zustand** - 狀態管理
- **Tailwind CSS** - UI 樣式
- **Framer Motion** - 動畫效果
- **React Grid Layout** - 儀表板佈局
- **DnD Kit** - 拖拉功能

### 後端 (AI Server)
- **FastAPI** - Python API 框架
- **Google Gemini / SiliconFlow** - LLM 提供者
- **RAG** - 法規知識檢索

## 快速開始

### 環境需求
- Node.js >= 18
- Python >= 3.10 (AI 服務)

### 安裝

```bash
# 安裝前端依賴
npm install

# 安裝 AI 服務依賴
cd ai-server
pip install -r requirements.txt
```

### 環境變數

建立 `.env` 檔案：

```env
# 前端
VITE_AI_API_URL=http://localhost:4000
VITE_USE_MOCK=false

# AI 服務 (ai-server/.env)
GOOGLE_API_KEY=your_gemini_api_key
SILICONFLOW_API_KEY=your_siliconflow_key  # 備用
```

### 啟動

```bash
# 啟動前端開發伺服器
npm run dev

# 啟動 AI 服務 (另一終端)
cd ai-server
python main.py
```

開啟瀏覽器訪問 `http://localhost:5173`

## 專案結構

```
TrvicERP/
├── src/
│   ├── components/       # 共用元件
│   │   └── ErrorBoundary.tsx
│   ├── core/             # 核心模組
│   │   ├── hooks/        # 共用 Hooks
│   │   ├── services/     # 核心服務
│   │   └── types/        # 型別定義
│   ├── hooks/            # 功能 Hooks
│   │   ├── useGlobalSearch.ts
│   │   ├── useVirtualList.ts
│   │   └── useFunctionExecutor.ts
│   ├── lib/              # 工具函式庫
│   │   ├── ai/           # AI 服務
│   │   ├── apiError.ts   # API 錯誤處理
│   │   ├── crypto.ts     # 加密工具
│   │   └── performance.ts # 效能工具
│   ├── modules/          # 業務模組
│   │   ├── customers/
│   │   ├── itineraries/
│   │   ├── orders/
│   │   ├── quotations/
│   │   └── sessions/
│   ├── store/            # 狀態管理
│   │   ├── useAppStore.ts
│   │   └── useDashboardStore.ts
│   └── App.tsx           # 主應用
├── ai-server/            # AI 後端服務
│   ├── main.py           # FastAPI 主程式
│   ├── prompt_templates.py
│   └── rules.txt         # 法規知識庫
├── types.ts              # 共用型別
└── package.json
```

## 核心功能說明

### 全局搜尋
支援跨模組搜尋客戶、訂單、團期、旅客：

```typescript
import { useGlobalSearch } from './hooks/useGlobalSearch';

const { query, results, setQuery } = useGlobalSearch();
```

### API 錯誤處理
統一的錯誤處理與自動重試：

```typescript
import { apiRequest, ApiError } from './lib/apiError';

const data = await apiRequest('/api/data', { method: 'GET' }, {
  timeout: 30000,
  retry: { maxRetries: 3 }
});
```

### 敏感資料加密
使用 AES-GCM 加密敏感資料：

```typescript
import { encryptData, maskPhone, maskEmail } from './lib/crypto';

const encrypted = await encryptData(sensitiveData);
const maskedPhone = maskPhone('0912345678'); // 091***678
```

### 效能優化工具
提供 memoize、debounce、虛擬列表等：

```typescript
import { useVirtualList } from './hooks/useVirtualList';
import { debounce, memoize } from './lib/performance';

const { virtualItems, totalHeight } = useVirtualList(items, { itemHeight: 50 });
```

## AI Copilot API

### 聊天端點
```bash
POST /api/chat
{
  "message": "幫我規劃東京五日遊",
  "mode": "itinerary",
  "context": "預算 50000，家庭旅遊"
}
```

### 可用模式
| 模式 | 說明 |
|------|------|
| `general` | 通用助手 |
| `itinerary` | 行程規劃專家 |
| `marketing` | 行銷文案專家 |
| `costing` | 成本試算專家 |
| `legal` | 法規諮詢專家 |

## 開發指南

### 程式碼風格
- TypeScript strict mode
- ESLint 檢查
- Prettier 格式化

### 建置
```bash
npm run build
```

### 環境檢查
```bash
npm run check:env
```

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request。
