# Vercel + Supabase 部署指南

本指南說明如何正確設定 TrvicERP 在 Vercel 上部署，並連接 Supabase 認證服務。

## 🔴 常見連線問題

### 問題：登入時顯示 "Supabase client not configured"

**原因**：環境變數未正確設定

**解決方案**：
1. 確認 Vercel 專案已設定環境變數
2. 確認 `VITE_USE_MOCK` 設為 `false`
3. 確認 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 已設定

---

## 📋 部署步驟

### 步驟 1：建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 點擊 "New Project"
3. 填寫專案資訊並建立
4. 等待專案初始化完成

### 步驟 2：取得 Supabase API Keys

1. 在 Supabase Dashboard 中，進入您的專案
2. 點擊左側選單 **Settings** → **API**
3. 複製以下資訊：
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### 步驟 3：連接 Vercel 專案

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Import Project" 或連接您的 GitHub 倉庫
3. 選擇 TrvicERP 倉庫

### 步驟 4：設定 Vercel 環境變數

在 Vercel 專案中：

1. 進入 **Settings** → **Environment Variables**
2. 添加以下變數：

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Production, Preview |
| `VITE_USE_MOCK` | `false` | Production |
| `VITE_API_URL` | `https://your-backend.railway.app` | Production, Preview |

> ⚠️ **重要**：所有 `VITE_` 開頭的變數會在建置時嵌入前端程式碼

### 步驟 5：重新部署

設定環境變數後，需要重新部署才會生效：

1. 在 Vercel Dashboard 中，進入 **Deployments**
2. 點擊最新部署旁的 "..." 選單
3. 選擇 **Redeploy**

---

## 🔍 診斷連線問題

### 方法 1：瀏覽器開發者工具

1. 開啟部署的網站
2. 按 F12 開啟開發者工具
3. 切換到 **Console** 標籤
4. 檢查是否有 Supabase 相關錯誤訊息

### 方法 2：啟用連線診斷

在 Vercel 環境變數中添加：

```
VITE_DEBUG_CONNECTION=true
```

重新部署後，Console 會顯示詳細的連線狀態。

### 方法 3：手動測試 Supabase 連線

在瀏覽器 Console 中執行：

```javascript
// 檢查環境變數是否正確載入
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('USE_MOCK:', import.meta.env.VITE_USE_MOCK);
```

---

## 📝 環境變數完整列表

### 必填（生產環境）

| 變數名稱 | 說明 | 範例值 |
|----------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 公開 Key | `eyJhbGciOi...` |
| `VITE_USE_MOCK` | 是否使用 Mock 模式 | `false` |

### 選填

| 變數名稱 | 說明 | 預設值 |
|----------|------|--------|
| `VITE_API_URL` | 後端 API 位址 | `http://localhost:4000` |
| `VITE_AI_API_URL` | AI API 位址 | `http://localhost:4000` |
| `VITE_WS_URL` | WebSocket 位址 | `ws://localhost:4000` |
| `VITE_DEBUG_CONNECTION` | 啟用連線診斷 | `false` |

---

## 🛠️ Supabase 認證設定

### 建立使用者

1. 在 Supabase Dashboard 中，進入 **Authentication** → **Users**
2. 點擊 **Add user** → **Create new user**
3. 填寫 Email 和密碼
4. 在 **User Metadata** 中設定角色：

```json
{
  "name": "管理員",
  "role": "admin"
}
```

### 可用角色

- `admin` - 系統管理員（完整權限）
- `manager` - 經理
- `sales` - 業務人員
- `welfare` - 福委會
- `traveler` - 員工/旅客

---

## ❓ 常見問題

### Q: 部署成功但登入失敗？

A: 檢查以下事項：
1. `VITE_USE_MOCK` 是否設為 `false`
2. Supabase URL 和 Key 是否正確
3. Supabase 專案中是否已建立使用者

### Q: 環境變數設定後沒有生效？

A: Vite 專案需要重新建置才能載入新的環境變數。請在 Vercel 中重新部署。

### Q: 如何在本機測試 Supabase 連線？

A: 
1. 複製 `.env.example` 為 `.env.local`
2. 填入 Supabase 憑證
3. 設定 `VITE_USE_MOCK=false`
4. 重新啟動開發伺服器

---

## 📞 需要幫助？

如果仍有問題，請在 GitHub Issues 中提供以下資訊：

1. 瀏覽器 Console 的錯誤訊息
2. 網路請求的回應（F12 → Network）
3. 環境變數設定（請隱藏敏感資訊）
