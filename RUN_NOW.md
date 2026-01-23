# 🚀 立即執行 5 個 Agents

系統已完全配置完成！您的 API Key 已設定在環境變數中。

## 立即執行命令

選擇以下任一方式執行完整的 5 個專家分析：

### 🎯 方式 1：互動式腳本（推薦）

```bash
./run_analysis.sh
```

這會提供互動式界面，讓您選擇：
- Rate Limiting 配置（標準/保守/自訂）
- 確認後開始執行

### ⚡ 方式 2：直接執行（快速）

```bash
python3 trvic_analyzer_v2.py . --rpm 8 --delay 8
```

使用保守的 Rate Limiting 設定，直接開始分析。

### 🎬 方式 3：演示腳本

```bash
./demo_run_5_agents.sh
```

包含完整的說明和確認步驟。

---

## ⏱️ 預期執行時間

- **保守模式** (8 RPM, 8s 延遲)：約 10-15 分鐘
- **標準模式** (10 RPM, 6s 延遲)：約 5-10 分鐘

## 📊 執行過程

您會看到以下進度顯示：

```
🤖 Agent: 陳建宏 (資深軟體工程師)
   專注領域: 程式碼品質, 架構設計, 效能優化, 安全性, 可維護性
   📊 處理區塊 1/3
   📤 API 請求 #1 (嘗試 1/5)
   📥 回應收到 (2543 字元)
✅ Agent 完成，耗時 45.2 秒
📊 整體進度: 20% (1/5 Agents)
```

## 📄 完成後查看報告

```bash
# 列出生成的報告
ls -la analysis_reports/

# 查看最新報告
cat analysis_reports/report_*.md

# 或用您喜歡的編輯器打開
code analysis_reports/report_*.md  # VS Code
vim analysis_reports/report_*.md   # Vim
```

## 🔄 如果執行中斷

按 Ctrl+C 中斷後，可以恢復：

```bash
# 再次執行，會自動詢問是否繼續
python3 trvic_analyzer_v2.py .

# 或列出所有 sessions
python3 trvic_analyzer_v2.py --list-sessions

# 恢復特定 session
python3 trvic_analyzer_v2.py --resume SESSION_ID
```

---

## 🎉 開始執行

現在就執行以下命令開始分析：

```bash
./run_analysis.sh
```

祝您分析順利！🚀
