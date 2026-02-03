# TrvicERP 部署指南

本指南說明如何將 TrvicERP 部署到生產環境。

## 架構概覽

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Database      │
│   (Vercel)      │     │   (Railway)     │     │   (Supabase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   React + Vite           FastAPI + Python      PostgreSQL + Auth
```

## 步驟一：設定 Supabase (資料庫 + 認證)

### 1.1 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com) 並登入
2. 點擊 "New Project"
3. 選擇組織並設定：
   - **Project name**: `trvicerp`
   - **Database Password**: 設定強密碼並妥善保存
   - **Region**: 選擇 `Northeast Asia (Tokyo)` 以獲得最佳延遲

### 1.2 取得連線資訊

在 Supabase Dashboard 中，前往 **Settings > Database**：

```bash
# Connection String (Transaction)
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

前往 **Settings > API**：

```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 執行資料庫遷移

在 Supabase SQL Editor 中執行初始化腳本（或使用 Alembic）：

```sql
-- 基本表格會由 FastAPI 自動建立
-- 這裡可以添加額外的 RLS 政策和索引
```

---

## 步驟二：部署後端 (Railway)

### 2.1 建立 Railway 專案

1. 前往 [railway.app](https://railway.app) 並登入
2. 點擊 "New Project" > "Deploy from GitHub repo"
3. 選擇您的 TrvicERP repository
4. **重要**：設定 Root Directory 為 `backend`

### 2.2 設定環境變數

在 Railway Dashboard 的 Variables 區塊中設定：

```bash
# 環境
ENVIRONMENT=production
DEBUG=false

# 資料庫
SUPABASE_DB_URL=postgresql://postgres.xxx:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT (使用強密碼)
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters

# CORS (填入前端網域)
CORS_ORIGINS=https://trvicerp.vercel.app,https://your-custom-domain.com

# 伺服器
SERVER_HOST=0.0.0.0
PORT=4000

# LINE (選填)
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret
LINE_NOTIFY_TOKEN=your-notify-token

# 金流 (選填)
ECPAY_MERCHANT_ID=your-merchant-id
ECPAY_HASH_KEY=your-hash-key
ECPAY_HASH_IV=your-hash-iv
ECPAY_SANDBOX=false

# 錯誤監控 (選填)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 2.3 確認部署成功

部署完成後，測試 API：

```bash
# 健康檢查
curl https://your-app.railway.app/health

# 預期回應
{"status":"healthy","database":"connected"}
```

記下您的後端 URL，例如：`https://trvicerp-api.railway.app`

---

## 步驟三：部署前端 (Vercel)

### 3.1 連結 GitHub Repository

1. 前往 [vercel.com](https://vercel.com) 並登入
2. 點擊 "Add New Project"
3. 選擇您的 TrvicERP repository
4. Framework 應自動偵測為 "Vite"

### 3.2 設定環境變數

在 Vercel Dashboard 的 **Settings > Environment Variables** 中設定：

```bash
# 後端 API (必填)
VITE_API_URL=https://trvicerp-api.railway.app

# Supabase (必填)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# WebSocket
VITE_WS_URL=wss://trvicerp-api.railway.app/ws

# Mock 模式 (生產環境設為 false)
VITE_USE_MOCK=false

# App URL
VITE_APP_URL=https://trvicerp.vercel.app

# 天氣 API (選填)
VITE_WEATHER_PROVIDER=openweathermap
VITE_WEATHER_API_KEY=your-api-key

# Sentry (選填)
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 3.3 部署

點擊 "Deploy"，等待建置完成。

---

## 步驟四：驗證部署

### 4.1 測試 API 連線

```bash
# 1. 測試後端健康狀態
curl https://trvicerp-api.railway.app/health

# 2. 測試認證
curl -X POST https://trvicerp-api.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 4.2 測試前端

1. 前往 `https://trvicerp.vercel.app`
2. 確認頁面正常載入（無白屏）
3. 嘗試登入功能
4. 確認 Dashboard 顯示資料

### 4.3 檢查常見問題

| 問題 | 原因 | 解決方案 |
|------|------|----------|
| 白屏 | CSP 阻擋 | 檢查 index.html 的 CSP 設定 |
| API 404 | CORS 設定錯誤 | 確認 CORS_ORIGINS 包含前端網域 |
| 登入失敗 | Supabase 未配置 | 確認 VITE_SUPABASE_URL 正確 |
| Dashboard 空白 | Mock 模式開啟 | 設定 VITE_USE_MOCK=false |

---

## 步驟五：設定自訂網域 (選填)

### Vercel 自訂網域

1. 在 Vercel Dashboard 中前往 **Settings > Domains**
2. 新增您的網域，例如 `app.trvic.com`
3. 依照指示設定 DNS 記錄

### Railway 自訂網域

1. 在 Railway Dashboard 中前往 **Settings > Networking > Custom Domains**
2. 新增您的網域，例如 `api.trvic.com`
3. 設定 CNAME 記錄

---

## 環境變數清單

### 前端 (Vercel)

| 變數名稱 | 必填 | 說明 |
|----------|------|------|
| `VITE_API_URL` | ✅ | 後端 API URL |
| `VITE_SUPABASE_URL` | ✅ | Supabase 專案 URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase Anonymous Key |
| `VITE_WS_URL` | ❌ | WebSocket URL |
| `VITE_USE_MOCK` | ❌ | Mock 模式 (預設 false) |
| `VITE_APP_URL` | ❌ | 前端 App URL |

### 後端 (Railway)

| 變數名稱 | 必填 | 說明 |
|----------|------|------|
| `ENVIRONMENT` | ✅ | 設為 `production` |
| `SUPABASE_DB_URL` | ✅ | PostgreSQL 連線字串 |
| `JWT_SECRET_KEY` | ✅ | JWT 簽章密鑰 (至少 32 字元) |
| `CORS_ORIGINS` | ✅ | 允許的前端網域 |
| `SUPABASE_URL` | ❌ | Supabase API URL |
| `LINE_CHANNEL_ACCESS_TOKEN` | ❌ | LINE Messaging API Token |
| `ECPAY_MERCHANT_ID` | ❌ | 綠界商家 ID |
| `SENTRY_DSN` | ❌ | Sentry 錯誤追蹤 |

---

## 故障排除

### 問題：部署後顯示白屏

1. 開啟瀏覽器開發者工具 (F12)
2. 查看 Console 是否有錯誤
3. 常見原因：
   - CSP 阻擋：檢查 `index.html` 的 `connect-src` 是否包含後端網域
   - 環境變數未設定：確認 Vercel 中有設定 `VITE_API_URL`

### 問題：API 請求失敗 (CORS)

1. 確認後端 `CORS_ORIGINS` 包含前端網域
2. 確認網域格式正確（包含 `https://`，不要有尾斜線）

### 問題：資料庫連線失敗

1. 確認 `SUPABASE_DB_URL` 格式正確
2. 測試連線：
   ```bash
   psql "postgresql://postgres.xxx:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
   ```

---

## 下一步

部署完成後，您可以：

1. **設定 LINE 通知**：在 LINE Developers Console 建立 Channel 並填入 Token
2. **啟用金流**：在綠界後台申請正式帳號並更新環境變數
3. **設定錯誤監控**：在 Sentry 建立專案並填入 DSN
4. **設定 CI/CD**：啟用 GitHub Actions 自動部署

如有問題，請查看 GitHub Issues 或聯繫技術支援。
