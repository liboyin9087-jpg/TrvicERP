# 🚀 Vercel 部署指南

## 快速部署到 Vercel

### 方法一：通過 Vercel Dashboard（推薦）

1. **連接 GitHub Repository**
   - 前往 [Vercel Dashboard](https://vercel.com/dashboard)
   - 點擊 "Add New Project"
   - 選擇 GitHub，授權訪問
   - 選擇 `liboyin9087-jpg/TrvicERP` repository

2. **配置專案**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **環境變數設定**（如需要）
   ```bash
   GEMINI_API_KEY=your_api_key_here
   # 在 Vercel Dashboard → Settings → Environment Variables 中設定
   ```

4. **部署**
   - 點擊 "Deploy"
   - Vercel 會自動偵測 `vercel.json` 配置
   - 每次 push 到 main/master 分支都會自動部署
   - **PR 預覽**：每個 Pull Request 都會生成預覽部署

### 方法二：通過 Vercel CLI

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **部署到 Vercel**
   ```bash
   # 第一次部署（會詢問配置）
   vercel
   
   # 生產環境部署
   vercel --prod
   ```

4. **後續部署**
   ```bash
   # 預覽部署
   vercel
   
   # 生產部署
   vercel --prod
   ```

## ✅ 當前配置狀態

### vercel.json 設定
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "git": {
    "deploymentEnabled": true  ✅ 已啟用
  },
  "github": {
    "enabled": true,           ✅ 已啟用
    "autoAlias": true,         ✅ 自動別名
    "silent": false            ✅ 顯示部署通知
  }
}
```

### 自動部署觸發條件
- ✅ Push 到 main/master 分支 → 生產部署
- ✅ 創建/更新 Pull Request → 預覽部署
- ✅ 每個 commit 都會觸發建置

## 🔧 Vercel 專案設定

### 建置設定
| 設定項目 | 值 |
|---------|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 18.x (推薦) |

### 路由配置
- **SPA 模式**：所有路由都重定向到 `/index.html`
- **支援前端路由**：React Router 完整支援
- **靜態資源**：自動從 `dist` 目錄提供服務

## 📊 部署後檢查清單

### 1. 驗證建置
```bash
npm run build
# 確保本地建置成功
```

### 2. 檢查 dist 目錄
```bash
ls -la dist/
# 應該包含：
# - index.html
# - assets/ (JS, CSS 檔案)
# - manifest.webmanifest
# - sw.js (Service Worker)
```

### 3. 本地預覽
```bash
npm run preview
# 在 http://localhost:4173 預覽建置結果
```

### 4. Vercel 部署檢查
- ✅ 建置成功（Build Logs 中無錯誤）
- ✅ 部署成功（獲得部署 URL）
- ✅ 網站可訪問
- ✅ 所有功能正常運作

## 🌐 部署 URL 結構

### 生產環境
```
https://trvic-erp.vercel.app
或
https://your-custom-domain.com
```

### 預覽環境（PR）
```
https://trvic-erp-[branch-name]-[hash].vercel.app
```

### 每個 Commit
```
https://trvic-erp-[git-hash].vercel.app
```

## 🔐 環境變數管理

### 在 Vercel Dashboard 設定

1. 前往專案 Settings
2. 選擇 Environment Variables
3. 新增變數：
   ```
   Key: GEMINI_API_KEY
   Value: your_api_key_here
   Environment: Production, Preview, Development
   ```

### 在程式碼中使用
```typescript
// Vite 環境變數
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// 或使用 process.env (已在 vite.config.ts 中定義)
const apiKey = process.env.GEMINI_API_KEY;
```

## 🚨 常見問題排解

### 問題 1：建置失敗
```bash
# 檢查 Node.js 版本
node --version  # 應該是 18.x 或更高

# 清除快取重新建置
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 問題 2：404 錯誤
確保 `vercel.json` 中有正確的路由配置：
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 問題 3：環境變數未載入
- 檢查變數名稱前綴（Vite 需要 `VITE_` 前綴）
- 重新部署以載入新的環境變數

### 問題 4：部署未觸發
檢查 Vercel 專案設定：
- Settings → Git → Branch Protection
- 確保目標分支在監控列表中

## 📈 效能優化建議

### 1. 啟用 Edge Network
Vercel 自動使用全球 CDN，無需額外配置。

### 2. 壓縮設定
已在 `vite.config.ts` 中配置：
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-ui': ['framer-motion', 'lucide-react'],
        // ...
      }
    }
  }
}
```

### 3. Cache Headers
Vercel 自動設定適當的 Cache-Control headers。

### 4. 圖片優化
考慮使用 Vercel Image Optimization：
```typescript
import Image from 'next/image'; // 需要遷移到 Next.js
```

## 🔗 有用的連結

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel 文檔](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [專案 GitHub](https://github.com/liboyin9087-jpg/TrvicERP)

## 📝 部署檢查表

部署前確認：
- [ ] `npm run build` 本地建置成功
- [ ] 所有測試通過
- [ ] 環境變數已在 Vercel 設定
- [ ] `vercel.json` 配置正確
- [ ] Git 分支已 push 到 GitHub

部署後確認：
- [ ] Vercel 建置日誌無錯誤
- [ ] 部署 URL 可訪問
- [ ] 首頁載入正常
- [ ] 所有路由功能正常
- [ ] API 連接正常（如有）
- [ ] 手機版顯示正常

## 🎉 成功！

如果所有步驟都完成，你的 TrvicERP 應用現在已成功部署到 Vercel！

**生產環境 URL**：等待 Vercel 生成  
**PR 預覽 URL**：每個 PR 都會自動生成

---

**需要幫助？**
- 查看 [Vercel 文檔](https://vercel.com/docs)
- 聯繫 Vercel 支援
- 檢查 [GitHub Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues)
