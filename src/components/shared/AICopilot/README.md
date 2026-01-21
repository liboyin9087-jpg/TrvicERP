# AI Copilot Component

這是一個整合到 TrvicERP 系統中的 AI Copilot 元件，採用 Canvas 雙欄架構，讓 AI 能夠直接操作 ERP 資料。

## 功能特色

### 🎯 Canvas 雙欄架構
- **左側**：可編輯的 ERP 資料表格（行程、成本、團員、文案）
- **右側**：AI Copilot 對話介面，能直接操作左側資料

### 🤖 AI 功能
- **📅 行程規劃**：新增/調整景點，AI 檢查路線合理性
- **💰 成本試算**：計算報價、檢查隱藏成本、建議售價
- **👥 團員管理**：管理團員資料與特殊需求
- **📝 文案生成**：AI 生成 B2B/B2C/企業提案文案
- **⚖️ 合規檢查**：檢查廣告不實、定型化契約等法規風險

### 🔄 Suggested Action 機制
AI 回應除了文字內容外，還會附帶 `suggested_action` 物件，讓使用者可以「一鍵套用」AI 的建議。

## 元件結構

```
AICopilot/
├── AICopilot.tsx          # 主要元件，雙欄佈局
├── AICopilotChat.tsx      # AI 聊天介面
├── index.ts               # 匯出檔案
└── README.md             # 本文件
```

## 使用方法

### 基本用法

```tsx
import { AICopilot } from '@/components/shared/AICopilot';

function MyPage() {
  return (
    <AICopilot 
      tourInfo={{
        '團號': 'JP20240101',
        '團名': '東京迪士尼5日遊',
        '出發日': '2024-01-15',
        '回程日': '2024-01-19',
        '人數': 30,
        '領隊': '張小華',
        '目的地': '東京'
      }}
      className="h-[800px]"
    />
  );
}
```

### 整合到 SessionManager

AI Copilot 已經整合到 SessionManager 中，作為一個新的 Tab：

```tsx
// 在 SessionManager.tsx 中
{activeTab === 'ai-copilot' && (
  <AICopilot 
    tourInfo={{
      '團號': selectedGroup?.groupNumber || 'DEMO-001',
      '團名': selectedGroup?.seriesName || '示範團體',
      // ... 其他資料
    }}
  />
)}
```

## AI Service

AI Copilot 使用 `aiCopilotService` 來處理請求：

```tsx
import { aiCopilotService } from '@/services/aiCopilotService';

const response = await aiCopilotService.processRequest(userInput, context);
```

### 支援的指令類型

1. **新增行程**：`"新增清水寺到 Day 3"`
2. **檢查路線**：`"請檢查目前的行程安排是否合理"`
3. **成本試算**：`"請根據目前的成本計算建議售價"`
4. **生成文案**：`"生成 B2B 文案"`
5. **合規檢查**：`"檢查這段文案是否有法規問題"`

## 資料模型

### AIContext
```tsx
interface AIContext {
  tourInfo: Record<string, any>;
  itinerary: Record<string, any>[];
  cost: Record<string, any>[];
  passengers: Record<string, any>[];
}
```

### AISuggestion
```tsx
interface AISuggestion {
  type: 'add_row' | 'update_row' | 'delete_row' | 'add_cost' | 'set_marketing_text';
  target: 'itinerary' | 'cost' | 'marketing';
  data: Record<string, any>;
  description?: string;
}
```

## 未來擴展

### 1. 整合真實 LLM
目前使用 Rule-Based 模擬，未來可整合：
- Google Gemini API
- OpenAI API
- 本地 LLM 模型

### 2. 進階功能
- 真實 Google Maps API 車程計算
- RAG 向量檢索法規資料庫
- 操作紀錄與 Data Flywheel
- 多人協作支援

### 3. 效能優化
- 資料庫連接
- WebSocket 即時同步
- 快取機制

## 開發注意事項

1. **UI 元件**：使用專案的 UI 元件庫（Button、Input、Card）
2. **狀態管理**：目前使用本地狀態，未來可改用 Zustand
3. **錯誤處理**：使用 useToast 顯示錯誤訊息
4. **TypeScript**：嚴格類型檢查，確保資料一致性

## 測試

訪問 `/ai-copilot-demo` 頁面可以測試 AI Copilot 的完整功能。

## 授權

本元件為 TrvicERP 系統的一部分，供內部開發與使用。
