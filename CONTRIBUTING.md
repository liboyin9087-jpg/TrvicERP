# 貢獻指南 Contributing Guide

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

感謝您對 TrvicERP 專案的興趣！我們歡迎所有形式的貢獻。

### 🐛 回報 Bug

如果您發現 Bug，請：

1. 檢查 [Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues) 確認是否已有人回報
2. 如果沒有，請建立新的 Issue，包含：
   - 清楚的標題描述問題
   - 重現步驟
   - 預期行為 vs 實際行為
   - 螢幕截圖（如果適用）
   - 環境資訊（瀏覽器、作業系統、Node.js 版本等）

### ✨ 建議新功能

如果您有新功能的想法：

1. 先檢查 [Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues) 是否已有類似提議
2. 建立新的 Issue，標記為 `enhancement`，說明：
   - 功能的使用場景
   - 為什麼需要這個功能
   - 可能的實作方式（選填）

### 🔧 提交 Pull Request

#### 開發流程

1. **Fork 專案**
   ```bash
   # 在 GitHub 上 fork 專案後
   git clone https://github.com/你的使用者名稱/TrvicERP.git
   cd TrvicERP
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **建立功能分支**
   ```bash
   git checkout -b feature/你的功能名稱
   # 或
   git checkout -b fix/修正的bug名稱
   ```

4. **進行開發**
   ```bash
   npm run dev  # 啟動開發伺服器
   ```

5. **程式碼規範**
   - 使用 TypeScript 類型註解
   - 遵循現有的程式碼風格
   - 執行 linter：
     ```bash
     npm run lint
     ```
   - 格式化程式碼：
     ```bash
     npm run format
     ```

6. **建構測試**
   ```bash
   npm run build  # 確保能成功建構
   ```

7. **提交變更**
   ```bash
   git add .
   git commit -m "feat: 新增某功能" 
   # 或
   git commit -m "fix: 修正某問題"
   ```
   
   提交訊息規範：
   - `feat:` 新功能
   - `fix:` 修正 Bug
   - `docs:` 文件更新
   - `style:` 程式碼格式調整（不影響功能）
   - `refactor:` 重構（不新增功能也不修正 Bug）
   - `test:` 測試相關
   - `chore:` 建構工具或輔助工具的變更

8. **推送到 GitHub**
   ```bash
   git push origin feature/你的功能名稱
   ```

9. **建立 Pull Request**
   - 前往 GitHub 上您 fork 的專案
   - 點擊 "New Pull Request"
   - 填寫清楚的標題和描述
   - 說明變更內容和原因
   - 如果修正了 Issue，請在描述中提及（例如：Closes #123）

#### Pull Request 檢查清單

- [ ] 程式碼遵循專案風格
- [ ] 已執行 `npm run lint` 並修正所有警告
- [ ] 已執行 `npm run build` 且無錯誤
- [ ] 已測試變更在本地環境運作正常
- [ ] 已更新相關文件（如有需要）
- [ ] Commit 訊息清楚描述變更內容

### 📁 專案結構

```
TrvicERP/
├── src/
│   ├── components/       # React 組件
│   ├── services/         # 服務層（API 呼叫、業務邏輯）
│   ├── constants/        # 常數定義
│   ├── types/            # TypeScript 類型定義
│   ├── styles/           # 全域樣式
│   └── App.tsx           # 主應用元件
├── public/               # 靜態資源
└── tests/                # 測試檔案（未來新增）
```

### 🧪 測試

目前專案尚未建立完整的測試框架。如果您想貢獻測試：

- **單元測試**: 可使用 Vitest + React Testing Library
- **E2E 測試**: 可使用 Playwright 或 Cypress
- 請在 PR 中說明測試的範圍和方式

### 📝 文件貢獻

文件改進也是重要的貢獻！您可以：

- 修正文件中的錯誤或不清楚的地方
- 新增範例或教學
- 翻譯文件到其他語言
- 改進註解和程式碼說明

### 🔒 安全性問題

如果您發現安全性漏洞，請**不要**公開建立 Issue。請透過私人方式聯繫專案維護者。

### 💬 討論和問題

- 使用 [Discussions](https://github.com/liboyin9087-jpg/TrvicERP/discussions) 進行一般討論
- 使用 [Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues) 回報 Bug 或建議功能

### 📋 開發建議

#### LLM 整合

- 新增 LLM 提供商時，請參考 `src/services/llmService.ts`
- 確保支援 Llama 3.2 模型
- 詳見 [LLM_RECOMMENDATION.md](LLM_RECOMMENDATION.md)

#### UI 組件

- 使用 Tailwind CSS 進行樣式設計
- 保持 Tesla-style 的視覺設計風格
- 確保響應式設計在行動裝置上運作良好

#### PWA 功能

- 修改 PWA 設定時，請更新 `public/manifest.json`
- 測試 Service Worker 功能

### 🎨 程式碼風格

- **縮排**: 2 個空格
- **引號**: 單引號 `'`
- **分號**: 需要
- **命名**:
  - 組件: PascalCase (`MyComponent`)
  - 函數: camelCase (`myFunction`)
  - 常數: UPPER_SNAKE_CASE (`MY_CONSTANT`)
  - 檔案名稱: camelCase 或 PascalCase

### ❤️ 感謝

感謝所有貢獻者讓 TrvicERP 變得更好！

---

## English

Thank you for your interest in the TrvicERP project! We welcome all forms of contributions.

### 🐛 Report Bugs

If you find a bug, please:

1. Check [Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues) to see if it's already reported
2. If not, create a new Issue with:
   - Clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment info (browser, OS, Node.js version, etc.)

### ✨ Suggest Features

If you have an idea for a new feature:

1. Check [Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues) for similar suggestions
2. Create a new Issue labeled `enhancement`, explaining:
   - Use case for the feature
   - Why it's needed
   - Possible implementation (optional)

### 🔧 Submit Pull Requests

#### Development Workflow

1. **Fork the project**
   ```bash
   # After forking on GitHub
   git clone https://github.com/your-username/TrvicERP.git
   cd TrvicERP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-name
   ```

4. **Develop**
   ```bash
   npm run dev  # Start development server
   ```

5. **Code standards**
   - Use TypeScript type annotations
   - Follow existing code style
   - Run linter:
     ```bash
     npm run lint
     ```
   - Format code:
     ```bash
     npm run format
     ```

6. **Build test**
   ```bash
   npm run build  # Ensure it builds successfully
   ```

7. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add some feature" 
   # or
   git commit -m "fix: fix some bug"
   ```
   
   Commit message conventions:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation update
   - `style:` Code formatting (no functional changes)
   - `refactor:` Refactoring (no new features or bug fixes)
   - `test:` Testing related
   - `chore:` Build tools or auxiliary tool changes

8. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create Pull Request**
   - Go to your forked project on GitHub
   - Click "New Pull Request"
   - Fill in a clear title and description
   - Explain what changed and why
   - If fixing an Issue, mention it (e.g., Closes #123)

#### Pull Request Checklist

- [ ] Code follows project style
- [ ] Ran `npm run lint` and fixed all warnings
- [ ] Ran `npm run build` with no errors
- [ ] Tested changes work locally
- [ ] Updated relevant documentation (if needed)
- [ ] Commit messages clearly describe changes

### 📁 Project Structure

```
TrvicERP/
├── src/
│   ├── components/       # React components
│   ├── services/         # Service layer (API calls, business logic)
│   ├── constants/        # Constant definitions
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global styles
│   └── App.tsx           # Main application component
├── public/               # Static assets
└── tests/                # Test files (to be added)
```

### 🧪 Testing

The project currently doesn't have a complete testing framework. If you want to contribute tests:

- **Unit tests**: Consider Vitest + React Testing Library
- **E2E tests**: Consider Playwright or Cypress
- Please explain the scope and approach in your PR

### 📝 Documentation Contributions

Documentation improvements are important contributions! You can:

- Fix errors or unclear parts in documentation
- Add examples or tutorials
- Translate documentation to other languages
- Improve comments and code descriptions

### 🔒 Security Issues

If you discover a security vulnerability, please **do not** create a public Issue. Contact project maintainers privately.

### 💬 Discussions and Questions

- Use [Discussions](https://github.com/liboyin9087-jpg/TrvicERP/discussions) for general discussions
- Use [Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues) to report bugs or suggest features

### 📋 Development Tips

#### LLM Integration

- When adding LLM providers, refer to `src/services/llmService.ts`
- Ensure Llama 3.2 model support
- See [LLM_RECOMMENDATION.md](LLM_RECOMMENDATION.md) for details

#### UI Components

- Use Tailwind CSS for styling
- Maintain Tesla-style visual design
- Ensure responsive design works well on mobile

#### PWA Features

- When modifying PWA settings, update `public/manifest.json`
- Test Service Worker functionality

### 🎨 Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes `'`
- **Semicolons**: Required
- **Naming**:
  - Components: PascalCase (`MyComponent`)
  - Functions: camelCase (`myFunction`)
  - Constants: UPPER_SNAKE_CASE (`MY_CONSTANT`)
  - File names: camelCase or PascalCase

### ❤️ Thank You

Thanks to all contributors for making TrvicERP better!
