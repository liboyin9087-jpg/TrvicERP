# 🔬 TrvicERP 多專家代碼分析器 v2.0

採用 **Claude Code 風格的 Agent 架構**，具備智能 API 排程、Session 持久化與**持續反饋迴圈**功能。

## ✨ v2.0 新功能

### 🤖 Agent 架構（類似 Claude Code）
```
Orchestrator（協調器）
    ├── SoftwareEngineerAgent（軟體工程師）
    ├── AISolutionAgent（AI 解決方案）
    ├── BDAgent（商業發展）
    ├── BrandStrategyAgent（品牌策略）
    └── UIUXAgent（UI/UX 設計）
```

### 🔄 **持續反饋迴圈（新！）**
- **類似 Claude Code** - 每位專家都能看到前面專家的分析
- **累積智慧** - 後續專家建立在先前發現之上
- **跨領域洞察** - 識別不同專業視角的關聯
- **動態上下文** - 自動注入先前分析摘要
- **可配置** - 支援開關與摘要長度調整

### ⏱️ 智能 Rate Limiter
- **Token Bucket 算法** - 精確控制 API 呼叫頻率
- **每分鐘請求限制** - 預設 10 次/分鐘
- **自動延遲** - 請求間最小 6 秒間隔
- **指數退避重試** - 失敗後智能等待

### 💾 Session 持久化
- **自動保存進度** - 每完成一個 Agent 即保存
- **中斷恢復** - Ctrl+C 後下次可繼續
- **Session 管理** - 列出、恢復、追蹤所有分析

---

## 🚀 快速開始

### 1. 安裝
```bash
pip install requests
```

### 2. 設定 API Key
```bash
export SILICONFLOW_API_KEY="your_api_key"
```

### 3. 執行分析
```bash
# 分析專案（五位專家依序執行，啟用持續反饋迴圈）
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main

# 使用自訂 Rate Limiting
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main --rpm 8 --delay 8

# 停用持續反饋迴圈（傳統獨立模式）
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main --no-feedback-loop
```

---

## 📖 完整使用說明

### 基本指令

```bash
# 分析專案（預設路徑）
python trvic_analyzer_v2.py

# 指定路徑
python trvic_analyzer_v2.py /path/to/project

# 指定 API Key
python trvic_analyzer_v2.py --api-key YOUR_KEY /path/to/project
```

### 選擇專家

```bash
# 只使用特定專家
python trvic_analyzer_v2.py --agents software_engineer ai_solution

# 可選專家：
#   software_engineer   - 軟體工程師
#   ai_solution         - AI 解決方案
#   business_development - 商業發展
#   brand_strategy      - 品牌策略
#   ui_ux               - UI/UX 設計
```

### Rate Limiting 配置

```bash
# 調整每分鐘請求數（預設 10）
python trvic_analyzer_v2.py --rpm 8

# 調整請求間隔（預設 6 秒）
python trvic_analyzer_v2.py --delay 10

# 保守設定（避免 API 限制）
python trvic_analyzer_v2.py --rpm 6 --delay 10
```

### 持續反饋迴圈配置

```bash
# 預設啟用（推薦）- 專家間相互參考分析
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main

# 停用反饋迴圈 - 每位專家獨立分析
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main --no-feedback-loop

# 調整摘要長度（預設 1000 字符）
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main --feedback-summary-length 1500
```

### Session 管理

```bash
# 列出所有 Sessions
python trvic_analyzer_v2.py --list-sessions

# 恢復指定 Session
python trvic_analyzer_v2.py --resume SESSION_ID

# 不恢復，強制重新開始
python trvic_analyzer_v2.py --no-resume /path/to/project
```

---

## 🏗️ 架構說明

### Agent 系統（支援持續反饋迴圈）

```
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                           │
│  • 管理執行流程                                              │
│  • Session 持久化                                            │
│  • 持續反饋迴圈管理（新！）                                   │
│  • 生成最終報告                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────┐      ┌─────────┐         ┌─────────┐
│ Agent 1 │ ───▶ │ Agent 2 │ ───▶ ...│ Agent 5 │
└─────────┘      └─────────┘         └─────────┘
    │ 分析           │ 分析 +            │ 分析 +
    │                │ Agent 1           │ Agent 1-4
    │ Rate          │ 上下文            │ 上下文
    │ Limiter       │ Rate              │ Rate
    │               │ Limiter           │ Limiter
    ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   SiliconFlow API                           │
│                   Qwen 2.5 72B                              │
└─────────────────────────────────────────────────────────────┘

🔄 持續反饋迴圈：每位專家的分析會自動傳遞給後續專家作為上下文
```

### Rate Limiter 工作原理

```
請求 1 ──────────────────────────────────────────▶
                    等待 6 秒
請求 2 ─────────────────────────────────────────▶
                    等待 6 秒
請求 3 ────────────────────────────────────────▶
                        .
                        .
                        .
        如果達到每分鐘上限，自動等待
```

### Session 持久化流程

```
開始分析
    │
    ├──▶ 掃描專案 ──▶ 保存 Session
    │
    ├──▶ Agent 1 執行 ──▶ 保存進度 ──▶ 累積上下文
    │
    ├──▶ Agent 2 執行（+ Agent 1 上下文）──▶ 保存進度 ──▶ 累積上下文
    │         │
    │         ▼ (Ctrl+C 中斷)
    │    Session 已保存，下次可恢復（包含上下文）
    │
    ├──▶ Agent 3 執行（+ Agent 1-2 上下文）──▶ 保存進度 ──▶ 累積上下文
    │
    ├──▶ Agent 4 執行（+ Agent 1-3 上下文）──▶ 保存進度 ──▶ 累積上下文
    │
    ├──▶ Agent 5 執行（+ Agent 1-4 上下文）──▶ 保存進度
    │
    └──▶ 生成報告 ──▶ 完成
```

### 持續反饋迴圈原理

```
Agent 1（軟體工程師）分析程式碼
            │
            ├──▶ 發現：使用了 React + TypeScript
            ├──▶ 建議：改進類型定義
            └──▶ 摘要傳遞給 Agent 2
                    │
Agent 2（AI 解決方案）基於 Agent 1 的發現
            │
            ├──▶ 看到 React 架構
            ├──▶ 建議：整合 AI Copilot 功能
            ├──▶ 補充：可以用 TypeScript 強化 AI API 類型
            └──▶ 摘要傳遞給 Agent 3
                    │
Agent 3（商業發展）基於 Agent 1-2 的洞察
            │
            ├──▶ 了解技術棧與 AI 潛力
            ├──▶ 建議：將 AI 功能作為差異化賣點
            └──▶ 摘要傳遞給 Agent 4
                    │
            （持續累積智慧...）

🎯 效果：每位專家都能看到全局，提供更有針對性的建議！
```

---

## 👥 五位專家

| Agent | 名稱 | 專長 |
|-------|------|------|
| `software_engineer` | 陳建宏 | 程式碼品質、架構、效能、安全性 |
| `ai_solution` | 林雅芳 | AI 整合、自動化、數據管道 |
| `business_development` | 王志明 | 商業模式、市場、合作夥伴 |
| `brand_strategy` | 張曉琪 | 品牌定位、用戶洞察、差異化 |
| `ui_ux` | 李佳穎 | 用戶體驗、介面設計、可用性 |

---

## ⚙️ 配置選項

### 環境變數

```bash
# API Key（必須）
export SILICONFLOW_API_KEY="your_api_key"
```

### 命令列參數

| 參數 | 說明 | 預設值 |
|------|------|--------|
| `--api-key`, `-k` | API Key | 環境變數 |
| `--agents`, `-a` | 指定 Agents | 全部 5 位 |
| `--rpm` | 每分鐘最大請求數 | 10 |
| `--delay` | 請求間最小延遲（秒） | 6.0 |
| `--no-feedback-loop` | **停用持續反饋迴圈** | False（預設啟用） |
| `--feedback-summary-length` | 專家摘要長度（字符） | 1000 |
| `--no-resume` | 不恢復上次 Session | False |
| `--list-sessions`, `-l` | 列出所有 Sessions | - |
| `--resume`, `-r` | 恢復指定 Session | - |

### 建議的 Rate Limiting 設定

| 情境 | RPM | Delay | 說明 |
|------|-----|-------|------|
| 標準 | 10 | 6.0 | 預設設定 |
| 保守 | 6 | 10.0 | 避免 API 限制 |
| 積極 | 15 | 4.0 | API 配額充足時 |

---

## 📁 輸出檔案

### 目錄結構

```
./
├── .trvic_sessions/          # Session 資料
│   ├── 20250123_143052_abc123.json
│   └── ...
│
├── analysis_reports/         # 分析報告
│   ├── report_20250123_143052_abc123.md
│   └── ...
│
└── trvic_analyzer_v2.py      # 主程式
```

### 報告格式

```markdown
# 🔬 TrvicERP 專案分析報告

## 📊 專案概覽
- 基本統計

## 📝 執行總結
- 整體評估

## 🎯 優先改進事項
1. 建議 1
2. 建議 2
...

## 👥 專家分析報告
### 🤖 software_engineer
...
### 🤖 ai_solution
...
```

---

## 🔧 進階用法

### 作為模組使用

```python
from trvic_analyzer_v2 import Config, Orchestrator

# 自訂配置
config = Config()
config.api.api_key = "your_key"
config.api.requests_per_minute = 8
config.api.min_delay_between_requests = 8.0

# 創建協調器
orchestrator = Orchestrator(config)

# 執行分析
session = orchestrator.run(
    project_path="~/Desktop/TrvicERP-main",
    agent_ids=["software_engineer", "ai_solution"],
    resume=True
)

# 取得結果
print(session.summary)
print(session.recommendations)
```

### 自訂 Agent

```python
from trvic_analyzer_v2 import BaseAgent

class CustomAgent(BaseAgent):
    def __init__(self, client, config):
        super().__init__(
            agent_id="custom",
            name="自訂專家",
            title="領域專家",
            focus_areas=["特定領域"],
            system_prompt="你是一位...",
            client=client,
            config=config
        )
```

---

## 🐛 常見問題

### Q: API Rate Limit 錯誤？

調整 Rate Limiting 設定：
```bash
python trvic_analyzer_v2.py --rpm 6 --delay 12
```

### Q: 分析中斷了怎麼辦？

Session 會自動保存，下次執行會詢問是否繼續：
```bash
python trvic_analyzer_v2.py ~/Desktop/TrvicERP-main
# 提示：發現可恢復的 Session，是否繼續？
```

### Q: 如何查看之前的分析？

```bash
python trvic_analyzer_v2.py --list-sessions
```

### Q: 如何強制重新分析？

```bash
python trvic_analyzer_v2.py --no-resume ~/Desktop/TrvicERP-main
```

---

## 📄 授權

MIT License

---

## 🔗 參考

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Claude Code 配置集合
- [SiliconFlow](https://siliconflow.com/) - API 服務商
