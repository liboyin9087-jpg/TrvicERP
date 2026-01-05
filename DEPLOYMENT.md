# 部署指南 - TrivcERP

本指南說明如何將 TrivcERP 部署到生產環境並推送至移動應用。

## 目錄

1. [Web 應用部署](#web-應用部署)
2. [PWA 安裝](#pwa-安裝)
3. [原生 App 打包](#原生-app-打包)
4. [環境配置](#環境配置)

---

## Web 應用部署

### 方案 1: Vercel（推薦，最簡單）

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入 Vercel
vercel login

# 3. 部署到生產環境
vercel --prod
```

**環境變數設置**:
在 Vercel Dashboard → Settings → Environment Variables 中添加：
```
VITE_LLM_PROVIDER=ollama
VITE_LLM_API_KEY=
VITE_LLM_MODEL=llama3.2
```

### 方案 2: Netlify

```bash
# 1. 安裝 Netlify CLI
npm install -g netlify-cli

# 2. 建構專案
npm run build

# 3. 部署
netlify deploy --prod --dir=dist
```

**netlify.toml** 配置：
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 方案 3: GitHub Pages

```bash
# 1. 安裝 gh-pages
npm install --save-dev gh-pages

# 2. 在 package.json 添加腳本
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# 3. 部署
npm run deploy
```

### 方案 4: Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
    }
}
```

**部署**:
```bash
docker build -t trvicerp .
docker run -p 80:80 trvicerp
```

---

## PWA 安裝

### 使用者安裝步驟

#### iOS (Safari)
1. 使用 Safari 瀏覽器訪問應用
2. 點擊底部「分享」按鈕
3. 選擇「加入主畫面」
4. 點擊「加入」

#### Android (Chrome)
1. 使用 Chrome 瀏覽器訪問應用
2. 點擊右上角「⋮」選單
3. 選擇「安裝應用程式」或「加到主畫面」
4. 點擊「安裝」

#### 桌面瀏覽器
1. 訪問應用網址
2. 地址欄會出現「安裝」圖示
3. 點擊安裝圖示
4. 確認安裝

### PWA 功能驗證

使用 Chrome DevTools 驗證 PWA：

1. 開啟 Chrome DevTools (F12)
2. 切換到「Lighthouse」標籤
3. 選擇「Progressive Web App」
4. 點擊「Generate report」
5. 確保分數 > 90

---

## 原生 App 打包

使用 Capacitor 將 Web 應用打包為原生應用。

### 初始設置

```bash
# 1. 安裝 Capacitor
npm install @capacitor/core @capacitor/cli

# 2. 初始化 Capacitor
npx cap init
# App name: TrivcERP
# App ID: com.trvicerp.app
# Web directory: dist

# 3. 添加平台
npx cap add android
npx cap add ios
```

### Android 打包

```bash
# 1. 建構 Web 應用
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 開啟 Android Studio
npx cap open android

# 4. 在 Android Studio 中：
# - Build → Generate Signed Bundle / APK
# - 選擇 APK 或 AAB
# - 設置簽名金鑰
# - 建構 Release 版本
```

**建立簽名金鑰**:
```bash
keytool -genkey -v -keystore trvicerp.keystore -alias trvicerp -keyalg RSA -keysize 2048 -validity 10000
```

### iOS 打包

```bash
# 1. 建構 Web 應用
npm run build

# 2. 同步到 iOS
npx cap sync ios

# 3. 開啟 Xcode
npx cap open ios

# 4. 在 Xcode 中：
# - 設置 Bundle Identifier
# - 設置簽名憑證 (需要 Apple Developer 帳號)
# - Product → Archive
# - 上傳到 App Store Connect
```

### 配置 capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trvicerp.app',
  appName: 'TrivcERP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false
    }
  }
};

export default config;
```

---

## 環境配置

### 生產環境變數

創建 `.env.production`:

```bash
# LLM 配置
VITE_LLM_PROVIDER=github-models
VITE_LLM_API_KEY=your_production_api_key
VITE_LLM_MODEL=meta-llama/Llama-3.2-90B-Vision-Instruct

# 應用配置
VITE_APP_NAME=TrivcERP
VITE_APP_VERSION=3.0.0
NODE_ENV=production
```

### 安全建議

1. **API 金鑰管理**
   - 永遠不要將 API 金鑰提交到版本控制
   - 使用環境變數或密鑰管理服務
   - 在生產環境使用後端代理 API 請求

2. **HTTPS**
   - 確保在生產環境使用 HTTPS
   - 大多數託管服務自動提供 SSL

3. **CORS 配置**
   - 設置正確的 CORS 政策
   - 只允許來自信任域名的請求

### 性能優化

1. **建構優化**
```bash
# 啟用壓縮
npm run build

# 分析打包大小
npm install --save-dev vite-plugin-visualizer
```

2. **快取策略**
   - Service Worker 已配置快取
   - 靜態資源設置長期快取
   - API 響應設置合適的快取時間

3. **CDN 配置**
   - 將靜態資源部署到 CDN
   - 使用 CDN 加速全球訪問

---

## CI/CD 自動部署

### GitHub Actions 範例

創建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_LLM_PROVIDER: ${{ secrets.LLM_PROVIDER }}
          VITE_LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 監控與維護

### 錯誤追蹤

推薦使用 Sentry:

```bash
npm install @sentry/react @sentry/vite-plugin
```

### 分析工具

- **Google Analytics** - 用戶行為分析
- **Hotjar** - 用戶體驗追蹤
- **Plausible** - 隱私友好的分析工具

### 日誌管理

在生產環境添加適當的日誌記錄：

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.PROD) {
      // 發送到日誌服務
    } else {
      console.log(message, data);
    }
  },
  error: (message: string, error?: any) => {
    if (import.meta.env.PROD) {
      // 發送到錯誤追蹤服務
    } else {
      console.error(message, error);
    }
  }
};
```

---

## 故障排除

### 常見問題

**問題 1**: 建構失敗
```bash
# 清除快取並重新安裝
rm -rf node_modules package-lock.json
npm install
npm run build
```

**問題 2**: PWA 無法安裝
- 確保使用 HTTPS
- 檢查 manifest.json 配置
- 驗證 Service Worker 註冊

**問題 3**: 環境變數未載入
- 確認變數名稱以 `VITE_` 開頭
- 重啟開發伺服器
- 檢查 `.env` 文件位置

---

## 獲取幫助

- 📖 [完整文檔](README.md)
- 🦙 [Llama 設置指南](LLAMA_SETUP.md)
- 🐛 [回報問題](https://github.com/liboyin9087-jpg/TrivcERP/issues)

祝您部署順利！🚀
