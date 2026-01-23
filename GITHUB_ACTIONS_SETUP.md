# 🤖 GitHub Actions 自動化設定指南

## 📋 功能說明

GitHub Actions 已配置為在每次 Pull Request 時自動執行 TrvicERP 多專家分析。

### 🎯 自動化特性

- ✅ **自動觸發**：每次 PR 被開啟、同步或重新開啟時自動執行
- ✅ **5 個專家**：一次執行所有專家分析（維持 Session 一致性）
- ✅ **智能 Rate Limiting**：保守設定（6 RPM, 10s 延遲）避免 API 限制
- ✅ **報告上傳**：分析報告和日誌自動上傳為 Artifacts
- ✅ **PR 評論**：自動在 PR 中發布分析總結
- ✅ **錯誤處理**：即使失敗也會完成 workflow 並提供診斷信息

---

## 🔑 必須設定：API Key

### 步驟 1：獲取 API Key

1. 訪問 [SiliconFlow](https://siliconflow.com/)
2. 註冊或登入帳號
3. 前往 API 管理頁面
4. 創建或複製您的 API Key

### 步驟 2：在 GitHub 設定 Secret

1. 前往您的 GitHub 倉庫頁面
2. 點擊 **Settings**（設定）
3. 在左側選單找到 **Secrets and variables** → **Actions**
4. 點擊 **New repository secret**（新增倉庫密鑰）
5. 填寫：
   - **Name（名稱）**：`SILICONFLOW_API_KEY`
   - **Value（值）**：貼上您的 API Key
6. 點擊 **Add secret**（添加密鑰）

![GitHub Secret Setup](https://docs.github.com/assets/cb-48222/mw-1440/images/help/settings/actions-secrets-new-secret.webp)

### 步驟 3：驗證設定

創建一個測試 PR 來驗證：

```bash
# 創建新分支
git checkout -b test-automation

# 做一個小改動
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: verify GitHub Actions automation"

# 推送並創建 PR
git push origin test-automation
```

然後前往 GitHub 創建 Pull Request，您應該會看到：
1. GitHub Actions 開始執行
2. 分析完成後自動評論 PR
3. 可在 Actions 頁籤下載報告

---

## 📊 Workflow 配置詳情

### 觸發條件

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
      - develop
      - master
```

在以下情況自動執行：
- PR 被開啟（opened）
- PR 有新的 commit（synchronize）
- 已關閉的 PR 被重新開啟（reopened）

目標分支：`main`, `develop`, 或 `master`

### 執行環境

- **OS**: Ubuntu Latest
- **Python**: 3.11
- **依賴**: 從 `requirements.txt` 安裝

### 執行步驟

1. **Checkout code**：檢出倉庫代碼
2. **Setup Python**：安裝 Python 3.11
3. **Install dependencies**：安裝必要的 Python 套件
4. **Run Analysis**：執行所有 5 個專家分析（約 30-45 分鐘）
5. **Upload Reports**：上傳分析報告
6. **Upload Log**：上傳執行日誌
7. **Comment PR**：在 PR 中發布總結評論

### 執行時間

- **預期時間**：30-45 分鐘（取決於專案大小）
- **超時設定**：60 分鐘
- **Rate Limiting**：6 RPM, 10s 延遲（保守）

---

## 📥 查看分析結果

### 方式 1：在 PR 評論中

分析完成後，會自動在 PR 中添加評論，包含：
- ✅ 執行狀態
- 📊 分析總結
- 👥 5 位專家簡介
- 📝 關鍵發現摘要
- 📥 下載報告的連結

### 方式 2：下載 Artifacts

1. 前往倉庫的 **Actions** 標籤
2. 找到對應的 workflow 執行
3. 點擊進入詳情頁
4. 在 **Summary** 部分找到 **Artifacts**
5. 下載：
   - `analysis-reports`：完整的分析報告（Markdown 格式）
   - `analysis-log`：執行日誌

### 方式 3：在 Workflow 日誌中

1. 前往 **Actions** 標籤
2. 點擊對應的 workflow 執行
3. 點擊 **Run TrvicERP Analysis - All 5 Agents** 步驟
4. 查看完整的執行輸出

---

## 🔧 自訂配置

### 調整 Rate Limiting

如果您的 API 配額較高，可以加快分析速度：

編輯 `.github/workflows/pr-analysis.yml`：

```yaml
# 標準設定
--rpm 10 --delay 6

# 保守設定（當前）
--rpm 6 --delay 10

# 積極設定（需要更高配額）
--rpm 15 --delay 4
```

### 選擇特定專家

如果只想執行某些專家：

```yaml
python trvic_analyzer_v2.py . \
  --agents software_engineer ai_solution \  # 只執行這兩個
  --rpm 6 \
  --delay 10
```

### 調整觸發分支

修改 `branches` 設定：

```yaml
branches:
  - main
  - develop
  - feature/*  # 所有 feature 分支
```

---

## 🐛 故障排除

### 問題 1：Actions 沒有執行

**可能原因**：
- PR 的目標分支不是 `main`, `develop`, 或 `master`
- Actions 在倉庫設定中被禁用

**解決方案**：
1. 檢查 PR 的目標分支
2. 前往 **Settings** → **Actions** → **General**
3. 確保 Actions 已啟用

### 問題 2：分析失敗或沒有報告

**可能原因**：
- API Key 未設定或無效
- API 配額不足
- 網路問題

**解決方案**：
1. 檢查 Secret 是否正確設定
2. 查看 workflow 日誌尋找錯誤訊息
3. 驗證 API Key 在 SiliconFlow 後台是否有效

### 問題 3：分析超時

**可能原因**：
- 專案太大
- API 回應緩慢

**解決方案**：
1. 增加 `timeout-minutes` 設定
2. 調整 Rate Limiting（降低延遲）
3. 使用 `--agents` 參數只執行部分專家

### 問題 4：無法評論 PR

**可能原因**：
- `GITHUB_TOKEN` 權限不足

**解決方案**：
1. 前往 **Settings** → **Actions** → **General**
2. 找到 **Workflow permissions**
3. 選擇 **Read and write permissions**
4. 儲存設定

---

## 📚 相關文件

- **完整文檔**：`README_v2.md`
- **執行指南**：`EXECUTION_GUIDE.md`
- **設置說明**：`AUTOMATION_SETUP.md`
- **快速開始**：`RUN_NOW.md`

---

## ✅ 檢查清單

在提交 PR 之前，確保：

- [ ] `SILICONFLOW_API_KEY` 已在 GitHub Secrets 中設定
- [ ] Actions 在倉庫設定中已啟用
- [ ] Workflow 有寫入權限（可以評論 PR）
- [ ] PR 的目標分支是 `main`, `develop`, 或 `master`

完成這些設定後，每次 PR 都會自動執行完整的 5 個專家分析！🎉

---

## 💡 最佳實踐

1. **保護 main 分支**：要求 PR 審查和 Actions 成功
2. **定期檢查報告**：將分析建議納入開發流程
3. **監控 API 使用量**：避免超出配額
4. **保存重要報告**：下載並歸檔關鍵版本的分析結果
5. **團隊協作**：分享分析結果，共同改進程式碼品質

🚀 **開始使用自動化分析，提升您的開發流程！**
