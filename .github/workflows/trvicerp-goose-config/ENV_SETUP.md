# 環境變數快速設置指南

## ✅ 已完成設置

你的 TrvicERP 項目已經完成環境變數配置！

### 📁 配置文件位置

- **環境變數文件**: `/workspaces/TrvicERP/.env`
- **範例文件**: `/workspaces/TrvicERP/.env.example`

### 🔑 已設置的 API 密鑰

以下 API 密鑰已在 `.env` 文件中配置：

1. **SILICONFLOW_API_KEY** - 主要 AI 審查服務（DeepSeek V3）
2. **GROQ_API_KEY** - 備用 AI 服務（Llama 3.3 70B）
3. **GEMINI_API_KEY** - Google Gemini AI（文案生成和備用修復）

### 🚀 如何使用

#### 檢查環境配置

```bash
# 運行環境設定助手
.github/workflows/trvicerp-goose-config/scripts/setup-env.sh
```

#### 使用 AI 工具

1. **多角色驗證腳本**（完整審查）
   ```bash
   .github/workflows/trvicerp-goose-config/scripts/multi-role-ralph-loop.sh
   ```

2. **智能修復腳本**（快速修復）
   ```bash
   .github/workflows/trvicerp-goose-config/scripts/smart-ralph-loop.sh
   ```

### 🔧 如何修改 API 密鑰

#### 方法一：使用文本編輯器

```bash
# 使用 nano
nano .env

# 或使用 VS Code
code .env
```

#### 方法二：直接編輯文件

在 VS Code 中打開 `/workspaces/TrvicERP/.env` 文件，修改對應的值即可。

### 📝 環境變數說明

```env
# SiliconFlow API (主要 AI 審查服務)
# 用於代碼審查、錯誤檢測和建議
SILICONFLOW_API_KEY=sk-your-key-here

# Groq API (備用 AI 服務)  
# 當 SiliconFlow 限流時自動切換
GROQ_API_KEY=gsk-your-key-here

# Gemini API (Google AI 服務)
# 用於文案生成和作為第二備用服務
GEMINI_API_KEY=your-key-here
```

### 🔒 安全注意事項

1. **.env 文件已加入 .gitignore**，不會被推送到 Git
2. **永遠不要**將 API 密鑰硬編碼在腳本中
3. **永遠不要**將 .env 文件提交到版本控制
4. 定期輪換你的 API 密鑰

### 🆘 故障排除

#### 問題：腳本報告缺少 API 密鑰

**解決方法**：
1. 確認 `.env` 文件存在於項目根目錄
2. 確認 API 密鑰值不包含 `your_` 或 `_here` 等佔位符
3. 確認環境變數名稱拼寫正確

#### 問題：腳本無法讀取 .env 文件

**解決方法**：
```bash
# 確保 .env 文件格式正確（無空格）
# 錯誤: GROQ_API_KEY = gsk-xxx
# 正確: GROQ_API_KEY=gsk-xxx

# 確保沒有多餘的引號
# 錯誤: GROQ_API_KEY="gsk-xxx"
# 正確: GROQ_API_KEY=gsk-xxx
```

#### 問題：API 請求失敗

**解決方法**：
1. 驗證 API 密鑰是否有效
2. 檢查 API 配額是否已用完
3. 確認網絡連接正常

### 📚 相關文檔

- [TrvicERP Goose 工具完整文檔](.github/workflows/trvicerp-goose-config/README.md)
- [環境變數範例文件](.env.example)

---

**最後更新**: 2026-01-28
