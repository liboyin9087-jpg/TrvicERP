# 開發環境設置指南 Development Setup Guide

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

快速設置開發環境的完整指南。

### 📋 前置需求

- **Node.js**: v18.0.0 或更高版本
- **npm**: v9.0.0 或更高版本 (或使用 yarn/pnpm)
- **Git**: 用於版本控制

### 🚀 快速開始

#### 1. Clone 專案

```bash
git clone https://github.com/liboyin9087-jpg/TrvicERP.git
cd TrvicERP
```

#### 2. 安裝依賴

```bash
npm install
```

#### 3. 環境設定

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 並設定您的 LLM API 金鑰
# 如果使用 Ollama，可以跳過此步驟
```

#### 4. 啟動開發伺服器

```bash
npm run dev
```

專案將在 `http://localhost:3000` 運行。

### 🔧 開發工作流程

#### 程式碼品質檢查

```bash
# 執行 ESLint 檢查
npm run lint

# 檢查程式碼格式
npm run format:check

# 自動格式化程式碼
npm run format
```

#### 建構專案

```bash
# 生產環境建構
npm run build

# 預覽建構結果
npm run preview
```

### 🎯 開發技巧

#### 熱重載 (Hot Reload)

開發伺服器支援熱重載，修改檔案後瀏覽器會自動更新。

#### TypeScript 類型檢查

```bash
# 執行類型檢查（在建構時自動執行）
npx tsc --noEmit
```

#### 除錯

使用瀏覽器開發者工具：
1. 打開瀏覽器（Chrome/Edge/Firefox）
2. 按 F12 開啟開發者工具
3. 在 Console 分頁查看日誌
4. 在 Sources/Debugger 分頁設置中斷點

#### 測試不同角色

使用以下測試帳號登入：
- **管理員**: admin / admin123
- **客戶**: client / client123
- **員工**: staff / staff123

### 📂 專案結構導覽

```
src/
├── components/          # React 組件
│   ├── Icons.tsx       # 圖示庫
│   ├── VisualCard.tsx  # 視覺化卡片
│   └── ...
├── services/           # 服務層
│   ├── llmService.ts   # AI/LLM 服務
│   └── erpService.ts   # ERP 業務邏輯
├── constants/          # 常數與資料
├── types/              # TypeScript 類型
├── styles/             # 全域樣式
└── App.tsx             # 主應用元件
```

### 🦙 LLM 設定選項

#### 方案 A: Ollama (本地，推薦)

```bash
# 1. 安裝 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. 下載模型
ollama pull llama3.2:3b

# 3. 啟動服務（在背景運行）
ollama serve

# 4. .env 設定（預設值）
VITE_LLM_PROVIDER=ollama
VITE_LLM_MODEL=llama3.2:3b
```

#### 方案 B: GitHub Models (雲端)

```bash
# 1. 取得 GitHub Personal Access Token
# https://github.com/settings/tokens
# 需要 'repo' 權限

# 2. .env 設定
VITE_LLM_PROVIDER=github-models
VITE_LLM_API_KEY=ghp_your_token_here
VITE_LLM_MODEL=meta-llama/Llama-3.2-11B-Vision-Instruct
```

#### 方案 C: Hugging Face

```bash
# 1. 註冊並取得 Token
# https://huggingface.co/settings/tokens

# 2. .env 設定
VITE_LLM_PROVIDER=huggingface
VITE_LLM_API_KEY=hf_your_token_here
VITE_LLM_MODEL=meta-llama/Llama-3.2-3B-Instruct
```

### 🐛 常見問題排除

#### 問題: `npm install` 失敗

**解決方案:**
```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

#### 問題: 開發伺服器啟動失敗

**解決方案:**
```bash
# 檢查端口 5173 是否被佔用
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# 或更改端口
npm run dev -- --port 3000
```

#### 問題: LLM API 呼叫失敗

**檢查清單:**
1. ✅ .env 檔案是否正確設定
2. ✅ API 金鑰是否有效
3. ✅ Ollama 服務是否在運行（如使用 Ollama）
4. ✅ 網路連線是否正常
5. ✅ 查看瀏覽器 Console 的錯誤訊息

#### 問題: TypeScript 錯誤

**解決方案:**
```bash
# 重新生成類型定義
npm run build

# 重啟 VS Code 的 TypeScript 伺服器
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### 🔒 安全性提醒

- ⚠️ **切勿提交 .env 檔案**到 Git
- ⚠️ API 金鑰請妥善保管
- ⚠️ 測試帳號僅供開發使用
- ⚠️ 生產環境請使用強密碼

### 📚 進階開發

#### 使用 VS Code 擴充功能

推薦安裝：
- **ESLint** - 即時程式碼檢查
- **Prettier** - 程式碼格式化
- **Tailwind CSS IntelliSense** - Tailwind 自動完成
- **TypeScript Vue Plugin (Volar)** - 更好的 TS 支援

#### Git 工作流程

```bash
# 建立功能分支
git checkout -b feature/my-feature

# 進行開發並提交
git add .
git commit -m "feat: add new feature"

# 推送到遠端
git push origin feature/my-feature

# 在 GitHub 上建立 Pull Request
```

### 📖 相關文件

- [貢獻指南](CONTRIBUTING.md) - 如何貢獻程式碼
- [LLM 選型建議](LLM_RECOMMENDATION.md) - AI 模型選擇
- [未來優化](FUTURE_ENHANCEMENTS.md) - 擴展功能建議

---

## English

Complete guide for setting up the development environment.

### 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or use yarn/pnpm)
- **Git**: For version control

### 🚀 Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/liboyin9087-jpg/TrvicERP.git
cd TrvicERP
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Setup

```bash
# Copy environment variables example
cp .env.example .env

# Edit .env and set your LLM API key
# Can skip this step if using Ollama
```

#### 4. Start Development Server

```bash
npm run dev
```

Project will run at `http://localhost:5173`.

### 🔧 Development Workflow

#### Code Quality Checks

```bash
# Run ESLint
npm run lint

# Check code formatting
npm run format:check

# Auto-format code
npm run format
```

#### Build Project

```bash
# Production build
npm run build

# Preview build
npm run preview
```

### 🎯 Development Tips

#### Hot Reload

Development server supports hot reload, browser updates automatically on file changes.

#### TypeScript Type Checking

```bash
# Run type checking (runs automatically on build)
npx tsc --noEmit
```

#### Debugging

Use browser developer tools:
1. Open browser (Chrome/Edge/Firefox)
2. Press F12 to open developer tools
3. View logs in Console tab
4. Set breakpoints in Sources/Debugger tab

#### Test Different Roles

Login with test accounts:
- **Admin**: admin / admin123
- **Client**: client / client123
- **Staff**: staff / staff123

### 📂 Project Structure Guide

```
src/
├── components/          # React components
│   ├── Icons.tsx       # Icon library
│   ├── VisualCard.tsx  # Visual cards
│   └── ...
├── services/           # Service layer
│   ├── llmService.ts   # AI/LLM service
│   └── erpService.ts   # ERP business logic
├── constants/          # Constants and data
├── types/              # TypeScript types
├── styles/             # Global styles
└── App.tsx             # Main app component
```

### 🦙 LLM Setup Options

#### Option A: Ollama (Local, Recommended)

```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Download model
ollama pull llama3.2:3b

# 3. Start service (runs in background)
ollama serve

# 4. .env configuration (default)
VITE_LLM_PROVIDER=ollama
VITE_LLM_MODEL=llama3.2:3b
```

#### Option B: GitHub Models (Cloud)

```bash
# 1. Get GitHub Personal Access Token
# https://github.com/settings/tokens
# Requires 'repo' permission

# 2. .env configuration
VITE_LLM_PROVIDER=github-models
VITE_LLM_API_KEY=ghp_your_token_here
VITE_LLM_MODEL=meta-llama/Llama-3.2-11B-Vision-Instruct
```

#### Option C: Hugging Face

```bash
# 1. Register and get Token
# https://huggingface.co/settings/tokens

# 2. .env configuration
VITE_LLM_PROVIDER=huggingface
VITE_LLM_API_KEY=hf_your_token_here
VITE_LLM_MODEL=meta-llama/Llama-3.2-3B-Instruct
```

### 🐛 Troubleshooting

#### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Development server won't start

**Solution:**
```bash
# Check if port 5173 is in use
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Or change port
npm run dev -- --port 3000
```

#### Issue: LLM API calls fail

**Checklist:**
1. ✅ Is .env file configured correctly?
2. ✅ Is API key valid?
3. ✅ Is Ollama service running (if using Ollama)?
4. ✅ Is network connection stable?
5. ✅ Check browser Console for error messages

#### Issue: TypeScript errors

**Solution:**
```bash
# Regenerate type definitions
npm run build

# Restart VS Code TypeScript server
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### 🔒 Security Reminders

- ⚠️ **Never commit .env file** to Git
- ⚠️ Keep API keys secure
- ⚠️ Test accounts for development only
- ⚠️ Use strong passwords in production

### 📚 Advanced Development

#### VS Code Extensions

Recommended:
- **ESLint** - Real-time code checking
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript Vue Plugin (Volar)** - Better TS support

#### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Develop and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create Pull Request on GitHub
```

### 📖 Related Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute code
- [LLM Selection Guide](LLM_RECOMMENDATION.md) - AI model selection
- [Future Enhancements](FUTURE_ENHANCEMENTS.md) - Feature expansion suggestions
