# Vercel 部署指南 (Manual Deployment Guide)

## 手動部署設定 (Manual Deployment Configuration)

此專案已設定為**手動部署模式**，不會自動從 GitHub 部署。

### 前置需求

1. 安裝 Node.js (建議版本 18.x 或更高)
2. 安裝 Vercel CLI
   ```bash
   npm install -g vercel
   ```

### 部署步驟

#### 1. 本地建置測試

在部署前，先在本地測試建置是否成功：

```bash
# 安裝依賴
npm install

# 執行建置
npm run build

# 預覽建置結果（可選）
npm run preview
```

#### 2. 登入 Vercel

```bash
vercel login
```

選擇您的登入方式（GitHub、GitLab、Bitbucket 或 Email）。

#### 3. 首次部署

在專案根目錄執行：

```bash
vercel
```

系統會詢問以下問題：
- **Set up and deploy?** 選擇 `Y`
- **Which scope?** 選擇您的帳號或團隊
- **Link to existing project?** 首次部署選 `N`，之後選 `Y`
- **Project name?** 輸入專案名稱（預設：TrvicERP）
- **Directory?** 按 Enter（使用當前目錄）
- **Build command?** 按 Enter（使用 package.json 中的設定）
- **Output directory?** 輸入 `dist`
- **Development command?** 按 Enter

#### 4. 後續部署

首次部署後，之後只需執行：

```bash
# 部署到預覽環境（測試用）
vercel

# 部署到生產環境
vercel --prod
```

### Vercel 設定說明

#### vercel.json 配置

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "git": {
    "deploymentEnabled": false
  },
  "github": {
    "enabled": false,
    "autoAlias": false
  }
}
```

**重要設定：**
- `git.deploymentEnabled: false` - 停用 Git 自動部署
- `github.enabled: false` - 停用 GitHub 整合自動部署
- 所有部署都必須透過 Vercel CLI 手動執行

### 環境變數設定

如果專案需要環境變數，可以透過以下方式設定：

#### 方法 1: 透過 Vercel Dashboard

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇專案
3. 進入 Settings > Environment Variables
4. 新增所需的環境變數

#### 方法 2: 透過 Vercel CLI

```bash
vercel env add VARIABLE_NAME
```

常見環境變數範例：
- `VITE_API_URL` - API 端點 URL
- `VITE_USE_MOCK` - 是否使用 Mock 模式（預設：true）
- `GEMINI_API_KEY` - Gemini API Key（如需 AI 功能）

### 查看部署狀態

```bash
# 列出所有部署
vercel ls

# 查看特定部署詳情
vercel inspect <deployment-url>
```

### 回滾到先前版本

如果需要回滾到先前的部署：

```bash
# 將先前的部署提升為生產環境
vercel promote <deployment-url>
```

### 刪除部署

```bash
vercel rm <deployment-url>
```

### 常見問題

#### Q: 為什麼選擇手動部署？

A: 手動部署提供更好的控制：
- 避免意外的自動部署
- 可以在本地完整測試後再部署
- 適合需要審核流程的企業環境
- 減少不必要的部署次數

#### Q: 如何切換回自動部署？

A: 修改 `vercel.json`：

```json
{
  "git": {
    "deploymentEnabled": true
  },
  "github": {
    "enabled": true,
    "autoAlias": true
  }
}
```

然後在 Vercel Dashboard 中連接 GitHub repository。

#### Q: 建置失敗怎麼辦？

A: 檢查以下項目：
1. 確認 Node.js 版本（在 package.json 中指定）
2. 確認所有依賴都已正確安裝
3. 本地執行 `npm run build` 測試
4. 查看 Vercel 部署日誌找出具體錯誤

### 參考資源

- [Vercel CLI 文件](https://vercel.com/docs/cli)
- [Vercel 部署設定](https://vercel.com/docs/concepts/projects/overview)
- [環境變數管理](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 快速參考指令

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 部署到預覽環境
vercel

# 部署到生產環境
vercel --prod

# 查看所有部署
vercel ls

# 查看專案資訊
vercel inspect

# 查看日誌
vercel logs <deployment-url>
```
