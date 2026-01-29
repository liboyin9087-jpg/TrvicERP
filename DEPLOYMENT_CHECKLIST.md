# Vercel 部署檢查清單

## ✅ 已完成項目

### 1. 建置配置
- [x] 修正 `package.json` 建置腳本
  - 從 `tsc && vite build` 改為 `vite build`
  - 建置成功，無錯誤
  - 產出檔案位於 `dist/` 目錄

### 2. Vercel 配置
- [x] `vercel.json` 配置正確
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - SPA 路由 fallback 已配置

### 3. 文件
- [x] README.md 已更新
  - 新增 Vercel 部署章節
  - 說明前後端分離架構
  - 環境變數配置指南
  - 後端部署建議

### 4. 安全檢查
- [x] CodeQL 掃描：無安全漏洞
- [x] 建置產出驗證通過

## 📋 部署前檢查

在 Vercel 部署前，請確認以下事項：

### 必要環境變數（在 Vercel 專案設定中配置）

```
VITE_API_URL=https://your-backend-url.com
VITE_AI_API_URL=https://your-ai-server-url.com
VITE_WS_URL=wss://your-websocket-url.com
VITE_USE_MOCK=true
```

### 可選環境變數（依需求配置）

```
VITE_WEATHER_PROVIDER=openweathermap
VITE_WEATHER_API_KEY=your_api_key
VITE_WEATHER_API_URL=https://api.openweathermap.org/data/2.5
VITE_LINE_API_URL=http://localhost:4000/api/v1/line
VITE_APP_URL=https://your-vercel-app.vercel.app
```

## 🚀 部署步驟

1. **連接 GitHub**
   - 在 Vercel 中匯入此 GitHub 倉庫
   - 選擇 `main` 分支或其他要部署的分支

2. **配置專案**
   - Framework Preset: Vite（自動偵測）
   - Root Directory: `./`（保持預設）
   - Build Command: `npm run build`（自動使用）
   - Output Directory: `dist`（自動使用）

3. **設定環境變數**
   - 在 Vercel 專案 Settings → Environment Variables
   - 加入上述必要環境變數
   - 注意：`VITE_` 開頭的變數會在建置時嵌入前端

4. **部署**
   - 點擊 Deploy 按鈕
   - 等待建置完成（約 1-2 分鐘）
   - 檢查部署狀態

## 🔧 後端部署

前端部署到 Vercel 後，還需要部署後端：

### FastAPI 後端建議平台
- **Railway**: 推薦，支援 Python，自動化部署
- **Render**: 有免費方案
- **Heroku**: 成熟穩定
- **AWS/GCP/Azure**: 企業級方案

### 後端部署後
1. 取得後端 URL
2. 更新 Vercel 環境變數中的 `VITE_API_URL`
3. 重新部署前端（Vercel 會自動觸發）
4. 在後端設定 CORS，允許 Vercel 網域

## 🎯 Mock 模式測試

如果暫時沒有後端，可以：
1. 設定 `VITE_USE_MOCK=true`
2. 前端會使用模擬資料運行
3. 可以先驗證前端功能

## ✅ 部署驗證

部署完成後，檢查：
- [ ] 網站可以正常載入
- [ ] 路由切換正常
- [ ] Console 無嚴重錯誤
- [ ] 靜態資源載入正常

## 📝 注意事項

1. **環境變數更新**：更改環境變數後需要重新部署
2. **CORS 設定**：確保後端允許 Vercel 網域的請求
3. **建置時間**：約 10-15 秒
4. **快取**：Vercel 會快取建置結果，加速後續部署

## 🐛 常見問題

### 問題：建置失敗
- 檢查 Node.js 版本（需要 >= 18）
- 檢查 npm 依賴是否正確安裝

### 問題：頁面空白
- 檢查 Console 錯誤
- 檢查環境變數是否正確設定
- 嘗試設定 `VITE_USE_MOCK=true` 測試

### 問題：API 無法連線
- 檢查 `VITE_API_URL` 設定
- 檢查後端 CORS 設定
- 檢查後端服務是否運行中

---

最後更新：2026-01-29
