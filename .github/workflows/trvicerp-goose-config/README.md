# TrvicERP Goose 自動化工具

## 使用 Goose + 多重 API 提供者進行 UI 元件驗證與自動修正

支援 SiliconFlow (DeepSeek V3) + Google Gemini 2.5 Flash 雙重 API 備援

本工具套件提供完整的自動化解決方案，用於驗證 TrvicERP UI 元件是否符合設計系統規範，並能自動修正發現的問題。專為 8GB RAM 低記憶體環境優化，適合小型開發團隊使用。

---

## 功能特色

**多角色驗證架構**：透過軟體架構師、LLM 訓練師、UI/UX 設計師、品牌顧問四種專家視角全面審查元件品質。

**Ralph Loop 自動修正**：類似 Claude Code 的自我修正迴圈機制，持續執行直到所有問題修復完成。

**記憶體優化處理**：採用分塊處理策略，確保在 8GB RAM 系統上穩定運行。

**台灣在地化支援**：內建民國曆、新台幣格式化、統一編號驗證等工具函式。

**多重 API 備援**：支援 SiliconFlow + Google Gemini 雙重 API，自動切換避免限流問題。

---

## 快速開始

### 1. 執行安裝腳本

```bash
chmod +x setup.sh
./setup.sh
```

安裝腳本會自動完成以下任務：

- 檢查 Python 環境
- 安裝 Goose CLI 工具
- 設定多重 API 提供者連線
- 配置 Goose 參數

### 2. 設定環境變數

如果安裝腳本未自動設定，請手動設定 API Key：

```bash
# 主要 API（SiliconFlow）
export SILICONFLOW_API_KEY="sk-你的-siliconflow-key"
export OPENAI_API_KEY="sk-你的-siliconflow-key"

# 備用 API（Google Gemini）
export GOOGLE_API_KEY="你的-gemini-api-key"
```

建議將上述設定加入 `~/.bashrc` 或 `~/.zshrc`。

### 3. 執行驗證

```bash
# 批次驗證所有元件
./scripts/batch-validate.sh ./src/components

# 啟動自動修正迴圈（最多 20 次迭代）
./scripts/ralph-loop.sh 20 ./src/components

# 執行多角色審查
goose run --recipe recipes/multi-role-verify.yaml --params target_directory="./src/components"
```
待 0 秒後進行下一次迭代
---

## 目錄結構

```
trvicerp-goose-config/
├── goose-config.yaml       # Goose 主配置檔案
├── setup.sh                # 安裝腳本
├── README.md               # 本文件
│
├── scripts/
│   ├── ralph-loop.sh       # Ralph Loop 自動修正執行器
│   ├── batch-validate.sh   # 記憶體優化批次驗證器
│   └── monitor.sh          # 即時監控腳本
│
├── recipes/
│   ├── validate-and-fix.yaml    # 自我修正驗證配方
│   └── multi-role-verify.yaml   # 多角色審查配方
│
├── prompts/
│   ├── architect-review.md      # 架構師審查提示詞
│   └── designer-audit.md        # 設計師稽核提示詞
│
├── tokens/
│   └── trvic-tokens.json        # TrvicERP 設計代碼定義
│
└── utils/
    └── taiwan-locale.ts         # 台灣在地化工具函式
```

---

## 設計系統驗證規則

本工具會檢查以下 TrvicERP 設計規範：

### 色彩系統

| Token 名稱     | 色碼    | 用途                 |
| -------------- | ------- | -------------------- |
| navigator-blue | #1E3A8A | 主色調、導航、信任感 |
| forest-green   | #10B981 | 成功狀態、主要 CTA   |
| error          | #EF4444 | 錯誤狀態             |
| warning        | #F59E0B | 警告狀態             |
| info           | #3B82F6 | 資訊提示             |

**驗證規則**：不允許硬編碼顏色值，必須使用設計代碼。

### 字體規範

| 用途     | 字體                       |
| -------- | -------------------------- |
| UI 元素  | Inter (400, 500, 600, 700) |
| 繁體中文 | Noto Sans TC               |

**驗證規則**：最小字級 14px，行高至少 1.5 倍。

### 間距網格

基礎單位為 4px，允許的間距值：4, 8, 12, 16, 24, 32, 48, 64。

---

## 指令參考

### 批次驗證

```bash
./scripts/batch-validate.sh [目標目錄] [分塊大小] [輸出目錄]

# 範例
./scripts/batch-validate.sh ./src/components 5 ./.validation-output
```

參數說明：

- **目標目錄**：要驗證的元件目錄，預設 `./src/components`
- **分塊大小**：每批次處理的檔案數量，預設 5（適合 8GB RAM）
- **輸出目錄**：驗證結果輸出位置，預設 `./.validation-output`

### Ralph Loop 自動修正

```bash
./scripts/ralph-loop.sh [最大迭代次數] [目標目錄]

# 範例
./scripts/ralph-loop.sh 20 ./src/components
```

參數說明：

- **最大迭代次數**：迴圈最多執行次數，預設 20
- **目標目錄**：要修正的元件目錄

### 多角色審查

```bash
goose run --recipe recipes/multi-role-verify.yaml \
    --params target_directory="./src/components"
```

---

## 8GB 記憶體環境最佳化

本工具針對低記憶體環境進行了以下優化：

**分塊處理**：將檔案分成小批次（預設 5 個檔案/批次）依序處理，避免一次載入過多內容。

**積極的上下文壓縮**：Goose 配置為在 50% 容量時開始壓縮上下文（預設為 80%）。

**記憶體監控**：腳本會自動偵測可用記憶體，低於 500MB 時暫停執行等待釋放。

**批次間冷卻**：每個批次處理完成後等待 3 秒，讓系統有時間進行垃圾回收。

如果仍然遇到記憶體不足的問題，可以：

1. 減少分塊大小至 3 個檔案
2. 增加批次間延遲時間
3. 關閉其他應用程式釋放記憶體

---

## 疑難排解

### Goose 無法連線到 SiliconFlow

**症狀**：執行時出現連線錯誤或 API 錯誤。

**解決方案**：

1. 確認 API Key 正確設定：`echo $OPENAI_API_KEY`
2. 確認網路連線正常
3. 嘗試使用國際區域端點：修改 `goose-config.yaml` 中的 `OPENAI_API_BASE` 為 `https://api.siliconflow.com/v1`

### 迴圈無限執行

**症狀**：Ralph Loop 達到最大迭代次數但問題仍未解決。

**解決方案**：

1. 檢查 `.validation-progress.log` 找出卡住的錯誤
2. 可能存在無法自動修復的問題，需要人工介入
3. 驗證規則可能過於嚴格，考慮調整配方中的規則

### 記憶體不足

**症狀**：執行中途程式被終止或系統變慢。

**解決方案**：

1. 減少分塊大小：`./scripts/batch-validate.sh ./src/components 3`
2. 修改 `goose-config.yaml` 中的 `GOOSE_CONTEXT_LIMIT` 為更低的值（如 16000）
3. 關閉瀏覽器等佔用記憶體的應用程式

---

## 整合至專案

### 加入 package.json 腳本

```json
{
  "scripts": {
    "validate": "./scripts/batch-validate.sh ./src/components",
    "validate:ai": "goose run --recipe recipes/multi-role-verify.yaml",
    "fix:loop": "./scripts/ralph-loop.sh 20 ./src/components",
    "fix:tokens": "npx design-lint ./src/components --fix"
  }
}
```

### 加入 Pre-commit Hook

使用 Husky 在每次提交前執行驗證：

```bash
npx husky add .husky/pre-commit "./scripts/batch-validate.sh ./src/components 3"
```

---

## 成本估算

基於 DeepSeek V3 透過 SiliconFlow 的定價（約 $0.27/百萬 tokens）：

| 使用情境                | 預估 tokens | 預估成本 |
| ----------------------- | ----------- | -------- |
| 單一元件驗證            | ~2,000      | ~$0.0005 |
| 完整目錄掃描（50 檔案） | ~100,000    | ~$0.027  |
| 每日驗證流程            | ~50,000     | ~$0.014  |
| Ralph Loop（10 次迭代） | ~200,000    | ~$0.054  |

以每日執行一次完整驗證計算，月度成本約 **$0.50 - $2.00**。

---

## 授權

本工具為 TrvicERP 專案內部使用，相關設計規範與代碼為專案專屬資產。

---

## 相關資源

- [Goose 官方文件](https://block.github.io/goose/)
- [SiliconFlow API 文件](https://docs.siliconflow.com/)
- [DeepSeek V3 模型資訊](https://www.deepseek.com/)
- [TrvicERP 設計指南](./設計指南)
