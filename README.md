# TrvicERP 🌏

**台灣旅遊業開源 ERP 系統** — Tesla-style 旅遊配置器 + 團控管理 + 旅客導覽 App + AI 智能輔助

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-3.2.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)

**繁體中文** | [English](README.en.md)

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [功能特色](#功能特色)
3. [系統需求](#系統需求)
4. [快速開始](#快速開始)
5. [環境變數配置](#環境變數配置)
6. [部署指南](#部署指南)
7. [AI 整合說明](#ai-整合說明)
8. [安全性指南](#安全性指南)
9. [專案架構](#專案架構)
10. [API 文件](#api-文件)
11. [開發指南](#開發指南)
12. [測試](#測試)
13. [貢獻指南](#貢獻指南)
14. [授權](#授權)

---

## 專案概述

TrvicERP 是專為台灣旅遊業設計的開源企業資源規劃系統，整合了現代化的 Tesla-style 視覺配置器、完整的團控管理功能、以及支援離線使用的 PWA 旅客導覽應用程式。本系統適合企業福委會規劃員工旅遊、旅行社業者進行團控管理與 RFP 比價，以及導遊使用的行程導覽工具。

---

## 功能特色

### 🎨 Tesla-style 視覺配置器

視覺化旅遊選項配置介面，讓企業 HR 或福委會能直覺地規劃員工旅遊。系統提供動態價格即時計算、多方案比較功能，並整合 AI 自動生成提案文案，大幅縮短規劃時間。

### 📊 ERP 團控儀表板

完整的團期管理功能，包含庫存監控、價格調整、訂單追蹤等核心 ERP 功能。支援反雷供應商資料庫，協助業者避開問題供應商。RFP 比價神器讓多家報價一目了然。

### 📱 旅客導覽 App

支援 PWA 離線使用的導覽應用程式，提供今日行程時間軸、緊急聯絡資訊、以及即時天氣資訊整合。可安裝至手機主畫面，提供近似原生 App 的體驗。

### 🤖 AI 智能輔助

整合多種 LLM 提供者，支援 OpenAI、Anthropic、Ollama（本地）、GitHub Models、Hugging Face 等。AI 功能包含智能提案生成、競品分析文案、以及 RFP 自動摘要。系統採用安全的 Proxy 機制，確保 API Key 不暴露於前端。

### 🗳 投票系統

福委會專用的員工投票功能，讓員工參與旅遊方案決策。支援即時計票、截止日期設定、以及投票結果視覺化呈現。

### 🌦 天氣整合

整合 OpenWeatherMap 和 Open-Meteo API，提供目的地即時天氣和 5 日預報，協助行程規劃和旅客準備。

---

## 系統需求

開發環境需要 Node.js 18.0 或以上版本、npm 9.0 或以上版本。建議使用 VS Code 搭配 ESLint 及 Prettier 擴充套件。若要使用本地 AI 功能，建議安裝 Ollama 並確保有足夠的記憶體（至少 8GB RAM）。

生產環境建議使用 Vercel（前端部署）搭配 Supabase（資料庫與認證），兩者皆提供足夠的免費額度供中小型專案使用。

---

## 快速開始

### 步驟一：複製專案

```bash
git clone https://github.com/liboyin9087-jpg/TrvicERP.git
cd TrvicERP
npm install
```

### 步驟二：環境變數設定

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定必要的環境變數。詳細說明請參閱下方環境變數配置章節。

### 步驟三：啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器前往 `http://localhost:3000` 即可開始使用。

### 步驟四：配置認證系統

本專案整合 Supabase Auth 作為認證系統。請至 [Supabase](https://supabase.com) 建立專案，並在 `.env` 中設定相關環境變數。首次使用需執行資料庫 Migration：

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

---

## 環境變數配置

### 必要變數（生產環境）

```env
# Supabase 資料庫與認證
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM API（Vercel Proxy 模式）
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
```

### 開發環境選項

```env
# LLM 提供者選擇
VITE_LLM_PROVIDER=ollama
VITE_LLM_BASE_URL=http://localhost:11434/api
VITE_LLM_MODEL=llama3.2:3b
```

### 選用功能

```env
# 天氣 API
VITE_WEATHER_PROVIDER=open-meteo
VITE_WEATHER_API_KEY=your-openweathermap-key

# 錯誤追蹤
VITE_SENTRY_DSN=https://your-sentry-dsn
```

完整的環境變數說明請參閱 `.env.example` 檔案。

---

## 部署指南

### Vercel 部署（推薦）

1. 將專案推送至 GitHub
2. 前往 [Vercel](https://vercel.com) 並匯入專案
3. Framework Preset 選擇 **Vite**
4. 設定環境變數（Settings → Environment Variables）
5. 點擊 Deploy

生產環境需在 Vercel Dashboard 設定以下環境變數：`OPENAI_API_KEY`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。

### Supabase 設定

1. 前往 [Supabase](https://supabase.com) 建立新專案
2. 執行資料庫 Migration
3. 啟用 Row Level Security (RLS)
4. 設定認證方式（Email/Password、Magic Link、OAuth）

### Docker 部署

專案包含 Dockerfile 供自託管部署使用，請參閱 [DEPLOYMENT.md](DEPLOYMENT.md) 取得詳細說明。

---

## AI 整合說明

### 架構概述

本專案採用安全的 Proxy 架構處理 AI 請求。前端呼叫 Vercel Serverless Function（`/api/llm`），再由後端轉發至 LLM Provider。此設計確保 API Key 永遠不會暴露於前端程式碼。

### 支援的 LLM 提供者

| 提供者 | 適用場景 | 成本 | 安全性 |
|--------|----------|------|--------|
| OpenAI | 生產環境 | 付費 | ✅ 最高 |
| Anthropic | 生產環境 | 付費 | ✅ 最高 |
| Ollama | 本地開發 | 免費 | ✅ 高 |
| GitHub Models | 開發測試 | 免費 | ⚠️ 需注意 |
| Hugging Face | 開發測試 | 免費額度 | ⚠️ 需注意 |

### 推薦配置

**生產環境**：必須使用 `vercel-proxy` 模式搭配 OpenAI 或 Anthropic，API Key 僅存於伺服器端環境變數。

**開發環境**：推薦使用 Ollama 本地運行，完全免費且無 Token 暴露風險。

```bash
# 安裝 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下載推薦模型
ollama pull llama3.2:3b

# 啟動服務
ollama serve
```

---

## 安全性指南

### 認證與授權

本專案整合 Supabase Auth 提供完整的認證功能，支援 Email/Password、Magic Link、以及 OAuth（Google、GitHub、LINE）等認證方式。

### API 安全

所有 API 端點使用 Zod 進行輸入驗證，並實作 Rate Limiting 防止濫用。生產環境建議搭配 Upstash Redis 實現分散式 Rate Limiting。

### 安全檢查清單

部署前請確認以下項目：

- 已配置正式的 Supabase Auth
- 所有 API Key 僅存於伺服器端環境變數
- LLM 使用 `vercel-proxy` 模式
- Supabase RLS 已啟用並配置適當政策
- 已啟用 HTTPS

詳細安全性說明請參閱 [SECURITY.md](SECURITY.md)。

---

## 專案架構

```
TrvicERP/
├── api/                    # Vercel Serverless Functions
│   ├── llm.ts              # LLM Proxy（多 Provider 支援）
│   ├── rfp.ts              # RFP CRUD API
│   ├── voting.ts           # 投票系統 API
│   ├── warnings.ts         # 反雷資料庫 API
│   └── health.ts           # 健康檢查
├── src/
│   ├── components/         # React 組件
│   ├── contexts/           # React Context
│   ├── services/           # 服務層
│   │   ├── llmService.ts   # LLM 呼叫邏輯
│   │   ├── weatherService.ts # 天氣 API
│   │   └── supabaseService.ts
│   ├── constants/          # 常數與 Prompt 模板
│   │   └── prompts.ts      # AI Prompt 模板庫
│   ├── pages/              # 頁面組件
│   ├── types/              # TypeScript 型別定義
│   └── lib/                # 工具函式
├── supabase/
│   └── migrations/         # 資料庫 Migration
├── public/                 # 靜態資源
└── tests/                  # 測試檔案
```

### 技術棧

**前端**：React 18、TypeScript、Tailwind CSS、Vite、React Router

**後端**：Vercel Serverless Functions、Supabase（PostgreSQL）

**AI**：OpenAI API、Anthropic API、Ollama、Llama 3.2

**其他**：PWA、Zod（驗證）、Vitest（測試）

---

## API 文件

### LLM API

```
POST /api/llm
```

支援多種 Provider，透過 `provider` 參數切換。請求格式如下：

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.3,
  "max_tokens": 1000
}
```

### RFP API

```
GET    /api/rfp              # 列出所有 RFP
GET    /api/rfp?id={id}      # 取得單一 RFP
POST   /api/rfp              # 建立 RFP
PUT    /api/rfp?id={id}      # 更新 RFP
DELETE /api/rfp?id={id}      # 刪除 RFP
```

### 投票 API

```
GET  /api/voting?action=list              # 列出投票
GET  /api/voting?action=get&id={id}       # 取得投票詳情
POST /api/voting?action=create            # 建立投票
POST /api/voting?action=vote              # 投票
```

完整 API 文件請參閱 [MODULES_GUIDE.md](MODULES_GUIDE.md)。

---

## 開發指南

### 程式碼規範

本專案使用 ESLint + Prettier 維護程式碼品質：

```bash
npm run lint          # 檢查程式碼
npm run format        # 格式化程式碼
npm run format:check  # 檢查格式
```

### 建構生產版本

```bash
npm run build
npm run preview
```

### 開發工具推薦

建議安裝以下 VS Code 擴充套件：ESLint、Prettier、Tailwind CSS IntelliSense、TypeScript Importer。

---

## 測試

### 單元測試

```bash
npm test              # 執行測試
npm run test:watch    # 監聽模式
npm run test:coverage # 覆蓋率報告
```

### E2E 測試

```bash
npm run test:e2e
```

---

## 貢獻指南

歡迎提交 Issue 和 Pull Request！詳細的貢獻流程請參閱 [CONTRIBUTING.md](CONTRIBUTING.md)。

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. Commit 您的修改 (`git commit -m 'Add amazing feature'`)
4. Push 到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 授權

本專案採用 MIT License 授權，詳見 [LICENSE](LICENSE) 檔案。

---

## 📚 相關文件

- [開發環境設置](DEVELOPMENT.md)
- [系統架構說明](ARCHITECTURE.md)
- [LLM 選型建議](LLM_RECOMMENDATION.md)
- [部署指南](DEPLOYMENT.md)
- [安全性指南](SECURITY.md)
- [模組功能說明](MODULES_GUIDE.md)
- [未來優化規劃](FUTURE_ENHANCEMENTS.md)
- [貢獻指南](CONTRIBUTING.md)

---

**由 TrvicERP 開源社群維護 ❤️**
