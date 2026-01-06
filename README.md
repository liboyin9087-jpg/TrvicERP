# TrivcERP 🌏

**台灣旅遊業開源 ERP 系統**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-3.2.0-green.svg)

## 專案概述

TrivcERP 是專為台灣旅遊業設計的開源企業資源規劃系統。

## 功能特色

- 🎨 **視覺化旅遊配置器** - 直覺的行程規劃介面
- 📊 **ERP 團控儀表板** - 完整的團期管理功能
- 📱 **旅客導覽 App** - PWA 離線使用導覽應用
- 🤖 **AI 智能輔助** - 整合多種 LLM 提供者
- 🧠 **Edge AI 模式** - 支援 Qwen 2.5 & Llama 3.2 離線推理
- 📚 **RAG 檢索增強** - 智慧政策搜尋與問答系統
- 🔄 **離線優先架構** - 完整的本地存儲與雙向同步
- 🎯 **AI 智慧代理** - 意圖識別與自動化任務處理
- 🗳 **投票系統** - 員工旅遊方案決策
- 🏞 **景點資料庫** - 收錄台灣 121 個景點
- 🌦 **天氣整合** - 即時天氣和預報

## 技術棧

- **前端**: React 18 + TypeScript + Tailwind CSS
- **後端**: Supabase (資料庫 + 認證 + Edge Functions)
- **部署**: Vercel
- **AI**: OpenAI / Anthropic / Ollama / Hugging Face
- **Edge AI**: Qwen 2.5 3B / Llama 3.2 (離線推理)
- **本地存儲**: IndexedDB (離線優先架構)
- **RAG**: 向量搜尋 + 語義檢索

## 快速開始

### 1. 複製專案

```bash
git clone https://github.com/liboyin9087-jpg/TrivcERP.git
cd TrivcERP
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 環境配置

複製 `.env.example` 為 `.env` 並填入你的配置：

```bash
cp .env.example .env
```

必要的環境變數：
- `VITE_SUPABASE_URL` - Supabase 專案 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名金鑰

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`

## 景點資料庫設定

### 執行 Migration

```bash
# 在 Supabase Dashboard 執行
supabase/migrations/20260105100000_create_attractions_table.sql
```

### 匯入景點資料

```bash
# 設定環境變數後執行
node scripts/importAttractions.js
```

完成後訪問 `/attractions` 查看景點列表。

## AI 功能設定

### Edge AI 模式（離線推理）

```bash
# 安裝 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下載模型
ollama pull qwen2.5:3b
ollama pull llama3.2:3b

# 啟用 Edge AI
# 在 .env 中設定：
VITE_EDGE_AI_ENABLED=true
VITE_EDGE_AI_MODEL=qwen2.5:3b
```

詳細 AI 功能說明請參考 [AI 功能文檔](docs/AI_FEATURES.md)。

## 構建生產版本

```bash
npm run build
```

構建產物會生成在 `dist/` 目錄。

## 部署

推薦使用 Vercel 部署：

1. 連結 GitHub 儲存庫到 Vercel
2. 設定環境變數
3. 自動部署

## 專案結構

```
TrivcERP/
├── src/
│   ├── components/     # React 元件
│   ├── pages/          # 頁面元件
│   ├── services/       # API 服務
│   ├── contexts/       # React Context
│   ├── lib/            # 工具函數
│   └── types/          # TypeScript 類型
├── supabase/
│   ├── migrations/     # 資料庫 migrations
│   └── functions/      # Edge Functions
├── public/             # 靜態資源
└── scripts/            # 工具腳本
```

## 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 社群

- GitHub: [liboyin9087-jpg/TrivcERP](https://github.com/liboyin9087-jpg/TrivcERP)
- Issues: [回報問題](https://github.com/liboyin9087-jpg/TrivcERP/issues)
