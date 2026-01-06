# TrvicERP 3.2.0 升級指南

## 概述

TrvicERP 3.2.0 引入了重大的架構改進，包括離線優先存儲、RAG 檢索增強、AI 智慧代理和 Edge AI 支援。本指南將協助您從舊版本升級到 3.2.0。

## 重大變更

### 1. 新增服務

- **localStorageService**: 基於 IndexedDB 的本地存儲
- **syncService**: 雙向資料同步
- **ragService**: 政策文件檢索
- **aiAgentService**: AI 智慧代理

### 2. LLM 服務更新

- 新增 Edge AI 提供者支援
- 支援 Qwen 2.5 和 Llama 3.2 模型
- 新增混合模型策略和自動降級

### 3. Service Worker 增強

- 智慧快取策略
- 完整離線支援
- 背景同步機制

## 升級步驟

### 步驟 1: 更新依賴

```bash
# 拉取最新代碼
git pull origin main

# 安裝/更新依賴
npm install
```

### 步驟 2: 環境變數配置

更新您的 `.env` 檔案：

```bash
# 複製新的範例檔案
cp .env.example .env.new

# 比較並合併設定
diff .env .env.example

# 新增 Edge AI 配置（選用）
VITE_EDGE_AI_ENABLED=false
VITE_EDGE_AI_MODEL=qwen2.5:3b
VITE_OLLAMA_BASE_URL=http://localhost:11434/api
VITE_EDGE_AI_FALLBACK_PROVIDER=supabase-edge
```

### 步驟 3: 資料庫遷移

如果使用 Supabase，執行新的遷移：

```bash
# 建立政策文件表
supabase migration up
```

**SQL 遷移腳本**（新增到 `supabase/migrations/`）：

```sql
-- Create policies table for RAG
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_policies_category ON policies(category);
CREATE INDEX idx_policies_title ON policies USING gin(to_tsvector('chinese', title));
CREATE INDEX idx_policies_content ON policies USING gin(to_tsvector('chinese', content));

-- Enable RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Policies are viewable by authenticated users"
  ON policies FOR SELECT
  TO authenticated
  USING (true);
```

### 步驟 4: 初始化服務（前端）

在應用程式初始化時加入新服務：

```typescript
// src/App.tsx 或主入口
import { 
  localStorageService, 
  syncService, 
  ragService 
} from '@/services';

async function initializeApp() {
  try {
    // 1. 初始化本地存儲
    await localStorageService.init();
    console.log('✓ Local storage initialized');
    
    // 2. 初始化 RAG 服務
    await ragService.initialize();
    console.log('✓ RAG service initialized');
    
    // 3. 啟動自動同步（每 60 秒）
    syncService.startAutoSync(60);
    console.log('✓ Sync service started');
    
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

// 在 App 組件中呼叫
useEffect(() => {
  initializeApp();
  
  return () => {
    // 清理
    syncService.stopAutoSync();
    localStorageService.close();
  };
}, []);
```

### 步驟 5: 使用新 UI 組件（選用）

在您的頁面中加入新的 AI 和同步組件：

```typescript
import { AIChat, SyncStatusIndicator } from '@/components';

function Dashboard() {
  const [showAIChat, setShowAIChat] = useState(false);
  
  return (
    <div>
      {/* 同步狀態指示器 */}
      <SyncStatusIndicator />
      
      {/* AI 助理按鈕 */}
      <button onClick={() => setShowAIChat(true)}>
        🤖 AI 助理
      </button>
      
      {/* AI 聊天介面 */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl h-[600px]">
            <AIChat onClose={() => setShowAIChat(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Edge AI 設定（選用）

如果您想啟用離線 AI 功能：

### 1. 安裝 Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 下載安裝程式: https://ollama.ai/download
```

### 2. 下載模型

```bash
# 主力模型（推薦）
ollama pull qwen2.5:3b

# 輔助模型
ollama pull llama3.2:3b

# 超輕量模型（低配置設備）
ollama pull llama3.2:1b
```

### 3. 啟動 Ollama 服務

```bash
# Ollama 會在後台運行
ollama serve

# 測試
curl http://localhost:11434/api/tags
```

### 4. 啟用 Edge AI

在 `.env` 中設定：

```bash
VITE_EDGE_AI_ENABLED=true
VITE_EDGE_AI_MODEL=qwen2.5:3b
VITE_OLLAMA_BASE_URL=http://localhost:11434/api
```

## 測試升級

### 基本功能測試

```bash
# 啟動開發伺服器
npm run dev

# 在瀏覽器中開啟
# http://localhost:5173
```

### 離線模式測試

1. 開啟 Chrome DevTools
2. 切換到 Network 頁籤
3. 勾選 "Offline"
4. 重新整理頁面
5. 驗證應用程式仍可運作

### AI 功能測試

```typescript
// 在 console 中測試
import { aiAgentService, ragService } from '@/services';

// 測試 RAG
const ragResponse = await ragService.query('差旅住宿費用標準是多少？');
console.log(ragResponse.answer);

// 測試 AI 代理
const response = await aiAgentService.processInput('查詢我的預算額度');
console.log(response.content);
```

## 回滾計畫

如果升級後出現問題，可以回滾到舊版本：

```bash
# 回到上一個版本
git checkout v3.1.0

# 清除新的本地資料庫
# 在瀏覽器 Console 中執行
indexedDB.deleteDatabase('TrvicERP_LocalDB');

# 清除 Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

# 重新安裝依賴
npm install

# 啟動
npm run dev
```

## 常見問題

### Q: 升級後應用程式無法啟動

**A**: 檢查以下項目：
1. 確認 `node_modules` 已更新：`rm -rf node_modules && npm install`
2. 檢查環境變數是否正確設定
3. 查看瀏覽器 Console 的錯誤訊息

### Q: 離線模式不工作

**A**: 
1. 確認 Service Worker 已註冊：檢查 Application → Service Workers
2. 清除瀏覽器快取並重新載入
3. 確認 HTTPS 或 localhost 環境（Service Worker 需求）

### Q: AI 功能無回應

**A**:
1. 檢查 LLM 提供者設定（`.env` 中的 `VITE_LLM_PROVIDER`）
2. 如使用 Edge AI，確認 Ollama 服務運行中
3. 檢查 API Key 是否正確（如使用雲端提供者）

### Q: Edge AI 模型下載失敗

**A**:
```bash
# 檢查 Ollama 狀態
ollama list

# 手動下載模型
ollama pull qwen2.5:3b --verbose

# 檢查磁碟空間（模型約 2-4GB）
df -h
```

### Q: 同步失敗或資料不一致

**A**:
```typescript
// 在 Console 中執行強制重新同步
import { syncService } from '@/services';
await syncService.forceFullSync();

// 查看同步狀態
const stats = await syncService.getSyncStats();
console.log(stats);
```

## 效能優化建議

### 1. Service Worker 快取

定期清理舊快取：

```javascript
// 在 sw.js 中設定快取版本
const CACHE_NAME = 'trvicerp-v3.2.0';
```

### 2. IndexedDB 大小監控

```typescript
// 檢查存儲使用量
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log(`使用: ${estimate.usage} / ${estimate.quota}`);
}
```

### 3. 同步頻率調整

根據使用情境調整：

```typescript
// 活躍使用：30 秒
syncService.startAutoSync(30);

// 一般使用：60 秒
syncService.startAutoSync(60);

// 省電模式：300 秒
syncService.startAutoSync(300);
```

## 取得協助

如遇到問題，請：

1. 查閱 [完整文檔](./AI_FEATURES.md)
2. 查看 [GitHub Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues)
3. 加入社群討論

## 下一步

- 探索 [AI 功能文檔](./AI_FEATURES.md)
- 查看 [API 規範](./openapi.yaml)
- 貢獻新功能或改進

---

更新日期: 2026-01-06
版本: 3.2.0
