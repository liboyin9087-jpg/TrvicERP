# AI 驅動的現代化功能文檔

## 概述

TrvicERP 3.2.0 引入了全面的 AI 驅動功能，實現「武器化」策略，將系統轉變為商業智慧助理。本文檔詳細說明新增的 AI 功能、架構設計和使用方法。

## 核心功能

### 1. 行動端優先架構（Mobile-First Architecture）

#### 1.1 離線優先存儲 (Offline-First Storage)

使用 IndexedDB 提供類 SQLite 的本地持久化存儲。

#### 1.2 雙向同步服務 (Bi-directional Sync)

自動在本地儲存和遠端伺服器之間同步資料。

#### 1.3 增強的 Service Worker

提供智慧快取策略和完整離線支援。

### 2. RAG（檢索增強生成）

使用語義搜尋查詢公司政策、差旅規範等。

### 3. AI 智慧代理（AI Agent）

自動識別使用者意圖並執行相應操作，支援 Human-in-Loop (HIL) 驗證。

### 4. 混合模型策略（Hybrid Model Strategy）

- **Qwen 2.5 3B** (主力): 優秀的多語言支援和推理能力
- **Llama 3.2 3B/1B** (輔助): 優秀的對話能力

## 快速開始

### 啟用 Edge AI 模式

```bash
# .env 配置
VITE_EDGE_AI_ENABLED=true
VITE_EDGE_AI_MODEL=qwen2.5:3b
VITE_OLLAMA_BASE_URL=http://localhost:11434/api
```

### 初始化服務

```typescript
import { 
  localStorageService, 
  syncService, 
  ragService,
} from '@/services';

await localStorageService.init();
await ragService.initialize();
syncService.startAutoSync(60);
```

### 使用 AI 助理

```typescript
import { aiAgentService } from '@/services';

const response = await aiAgentService.processInput(
  '差旅住宿費用標準是多少？'
);
console.log(response.content);
```

## 架構設計

### 離線優先流程

```
應用程式啟動
    ↓
初始化本地存儲 (IndexedDB)
    ↓
載入政策文件 (RAG)
    ↓
啟動同步服務
    ↓
正常運作 (線上/離線皆可)
```

### 智慧降級策略

```
線上 → Edge AI → Cloud API
離線 → Edge AI → Rule-based
```

## 功能詳情

完整文檔請參考：[詳細功能說明](./AI_FEATURES_DETAILED.md)

## 資源連結

- [Qwen 2.5 模型](https://github.com/QwenLM/Qwen2.5)
- [Llama 3.2 模型](https://llama.meta.com/)
- [Ollama 安裝](https://ollama.ai/)
