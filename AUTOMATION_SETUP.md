# 🔬 TrvicERP 自動化分析系統

此專案已配置完整的自動化分析系統，包含 GitHub Actions 和 Codespaces 支援。

## ✨ 已配置功能

### 1. 📦 已解壓縮的分析工具

從 `files.zip` 解壓縮的文件：

- **trvic_analyzer_v2.py** - 多專家代碼分析器主程式
- **trvic_config.json** - 分析器配置文件
- **run_analysis.sh** - 快速啟動腳本
- **README_v2.md** - 詳細使用文檔

### 2. 🤖 GitHub Actions 自動化

已創建 `.github/workflows/pr-analysis.yml` 工作流程：

- ✅ **每次 PR 自動執行**：當創建或更新 Pull Request 時自動觸發
- ✅ **執行 5 個專家 Agents**：
  1. 🔧 Software Engineer (陳建宏) - 程式碼品質分析
  2. 🤖 AI Solution (林雅芳) - AI 整合機會
  3. 💼 Business Development (王志明) - 商業模式
  4. 🎨 Brand Strategy (張曉琪) - 品牌策略
  5. 🖥️ UI/UX (李佳穎) - 用戶體驗
- ✅ **自動上傳報告**：分析報告作為 workflow artifacts 保存
- ✅ **PR 評論**：自動在 PR 中發布分析總結

#### 設定 API Key

要啟用自動分析，請在 GitHub 倉庫設定中添加 Secret：

1. 前往：**Settings** → **Secrets and variables** → **Actions**
2. 點擊 **New repository secret**
3. 名稱：`SILICONFLOW_API_KEY`
4. 值：您的 SiliconFlow API Key

### 3. 💻 Codespaces 配置

已創建 `.devcontainer/devcontainer.json`：

- ✅ **Node.js 20** 環境
- ✅ **Python 3.11** 支援
- ✅ **預裝擴展**：ESLint, Prettier, Tailwind CSS, Python, GitHub Copilot
- ✅ **自動安裝依賴**：開啟 Codespace 後自動執行 `npm install` 和 `pip install`
- ✅ **端口轉發**：自動設定 3000 和 5173 端口

### 4. 📋 Python 依賴

已創建 `requirements.txt`：

```txt
requests>=2.31.0
```

## 🚀 使用方式

### 方式 1：使用快速啟動腳本

```bash
# 設定 API Key
export SILICONFLOW_API_KEY="your_api_key_here"

# 執行分析（互動式）
./run_analysis.sh

# 或指定專案路徑
./run_analysis.sh /path/to/project
```

### 方式 2：直接使用 Python 腳本

```bash
# 安裝依賴
pip install -r requirements.txt

# 設定 API Key
export SILICONFLOW_API_KEY="your_api_key_here"

# 執行所有 5 個專家
python trvic_analyzer_v2.py . --rpm 10 --delay 6

# 或只執行特定專家
python trvic_analyzer_v2.py . --agents software_engineer ai_solution
```

### 方式 3：使用演示腳本

```bash
# 執行演示（包含所有 5 個 agents）
./demo_run_5_agents.sh
```

### 方式 4：透過 GitHub Actions

1. 創建 Pull Request
2. GitHub Actions 自動執行分析
3. 查看 PR 評論中的總結
4. 下載 workflow artifacts 獲取完整報告

## 📖 詳細文檔

請參閱 [README_v2.md](README_v2.md) 獲取完整的使用指南，包括：

- Agent 架構說明
- Rate Limiting 配置
- Session 管理
- 進階用法
- 常見問題

## 🔧 配置選項

### Rate Limiting

根據 API 配額調整請求頻率：

| 情境 | RPM | Delay | 命令 |
|------|-----|-------|------|
| 標準 | 10 | 6.0 | `--rpm 10 --delay 6` |
| 保守 | 6 | 10.0 | `--rpm 6 --delay 10` |
| 積極 | 15 | 4.0 | `--rpm 15 --delay 4` |

### 選擇專家

```bash
# 只執行程式碼品質分析
python trvic_analyzer_v2.py . --agents software_engineer

# 技術 + AI 分析
python trvic_analyzer_v2.py . --agents software_engineer ai_solution

# 全部專家
python trvic_analyzer_v2.py . --agents software_engineer ai_solution business_development brand_strategy ui_ux
```

## 📁 輸出文件

分析完成後會生成：

```
./
├── .trvic_sessions/           # Session 資料（可恢復）
│   └── 20260123_160000_abc123.json
│
└── analysis_reports/          # 分析報告
    └── report_20260123_160000_abc123.md
```

## 🔄 恢復中斷的分析

如果分析中斷（Ctrl+C），可以恢復：

```bash
# 列出所有 sessions
python trvic_analyzer_v2.py --list-sessions

# 恢復特定 session
python trvic_analyzer_v2.py --resume SESSION_ID

# 或直接執行，會自動詢問是否恢復
python trvic_analyzer_v2.py .
```

## 🎯 測試 GitHub Actions

要測試 GitHub Actions workflow：

1. 創建一個新分支
2. 做一些改動
3. 創建 Pull Request 到 main/master 分支
4. 查看 Actions 標籤頁看執行狀態
5. 檢查 PR 中的自動評論

## 📊 輸出報告範例

報告包含：

1. **專案概覽**：檔案統計、目錄結構
2. **執行總結**：高層次評估
3. **優先改進事項**：TOP 10 建議
4. **專家分析**：每位專家的詳細報告

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📄 授權

MIT License

---

**注意**：執行分析需要有效的 SiliconFlow API Key。請訪問 [SiliconFlow](https://siliconflow.cn/) 註冊並獲取 API Key。
