# AI Copilot LLM 整合指南

## 概述

AI Copilot 現已整合 SiliconFlow LLM 服務，支援 Qwen2.5 32B 模型，並內建 RAG 法規檢索功能。

## 🚀 功能特色

### 1. SiliconFlow LLM 整合
- **模型**：Qwen/Qwen2.5-32B-Instruct
- **API**：SiliconFlow (https://cloud.siliconflow.cn/)
- **特色**：高品質中文理解與生成，專業旅遊領域知識

### 2. RAG 法規檢索
- **內建法規庫**：消保法、旅遊契約、保險規定等
- **智能檢索**：根據查詢自動匹配相關法規
- **合規建議**：提供具體的法規風險提示與修改建議

### 3. 智能降級機制
- **LLM 可用**：使用真實 AI 模型處理
- **LLM 不可用**：自動降級為規則模擬
- **無縫切換**：使用者無感知的備用方案

## 📋 環境設定

### 1. 取得 SiliconFlow API Key

1. 訪問 [SiliconFlow Cloud](https://cloud.siliconflow.cn/)
2. 註冊並登入帳戶
3. 在控制台取得 API Key
4. 確保帳戶有足夠的額度

### 2. 配置環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

在 `.env` 中設定：

```env
# SiliconFlow API 金鑰
VITE_SILICONFLOW_API_KEY=your_api_key_here

# 可選設定
VITE_SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
VITE_SILICONFLOW_MODEL=Qwen/Qwen2.5-32B-Instruct
VITE_LLM_TEMPERATURE=0.3
VITE_LLM_MAX_TOKENS=4000
```

### 3. 重新啟動開發伺服器

```bash
npm run dev
```

## 🎯 使用方式

### LLM 狀態指示

AI Copilot 右上角會顯示當前狀態：

- 🟢 **Qwen2.5**：已連接 SiliconFlow LLM
- 🟡 **檢查中**：正在檢查 LLM 配置
- ⚪ **模擬模式**：使用規則模擬（無 API Key 時）

### 增強的 AI 功能

#### 1. 行程規劃
```text
使用者：幫我新增清水寺到 Day 3，並檢查路線合理性
AI：✅ 可以新增清水寺到 Day 3...
```

#### 2. 成本試算
```text
使用者：請根據目前的成本計算建議售價
AI：💰 **成本分析報告**...
```

#### 3. 法規檢查（RAG）
```text
使用者：檢查這段文案是否有法規問題："保證最低價"
AI：⚠️ **合規檢查結果**
發現以下潛在問題：
• 使用「保證」、「最低價」等絕對性用語...
```

#### 4. 文案生成
```text
使用者：生成 B2B 文案
AI：✍️ **已為您生成 B2B 文案**...
```

## 🔧 技術架構

### 服務層架構

```
AI Copilot Service
├── LLM Service (SiliconFlow)
├── RAG Service (法規檢索)
└── Rule-based Service (備用)
```

### 處理流程

1. **意圖識別**：分析使用者輸入意圖
2. **服務選擇**：LLM 可用則使用 LLM，否則規則模擬
3. **RAG 檢索**：合規檢查時自動檢索相關法規
4. **回應生成**：結合上下文生成專業回應
5. **操作建議**：提供可執行的 suggested_action

### RAG 法規庫

目前包含的法規類別：

- **廣告法規**：消保法第22條
- **旅遊契約**：解約退費、應記載事項
- **證照規定**：護照效期要求
- **保險規定**：旅遊責任保險
- **定價規範**：費用標示要求

## 🚨 注意事項

### API 使用量

- SiliconFlow 採用按量計費
- 建議設定使用量警報
- 可透過 `temperature` 調整創意度

### 隱私與安全

- API Key 僅在前端使用，不會傳送到後端
- 敏感資料建議避免在對話中提及
- 可隨時透過移除 API Key 停用 LLM 功能

### 效能考量

- LLM 回應時間約 2-5 秒
- RAG 檢索為本地處理，速度較快
- 規則模擬回應時間 < 1 秒

## 🔍 故障排除

### 常見問題

#### 1. 顯示「模擬模式」
**原因**：未設定 API Key 或 API Key 無效
**解決**：檢查 `.env` 中的 `VITE_SILICONFLOW_API_KEY`

#### 2. LLM 回應錯誤
**原因**：API 額度不足或網路問題
**解決**：檢查 SiliconFlow 帳戶餘額

#### 3. 法規檢索無結果
**原因**：查詢關鍵詞與法規庫不匹配
**解決**：嘗試使用更明確的法規相關詞彙

### 除錯模式

開發時可在 Console 查看詳細日誌：

```javascript
// LLM 服務初始化日誌
console.log('✅ LLM service initialized with SiliconFlow');
console.log('⚠️ LLM service not configured, using rule-based simulation');

// RAG 服務日誌
console.log('✅ RAG service initialized');
```

## 📈 未來擴展

### 計劃功能

1. **更多法規來源**
   - 政府法規 API
   - 旅遊業公會指引
   - 國際旅遊規範

2. **進階 LLM 功能**
   - 多輪對話上下文
   - 個人化偏好學習
   - 多語言支援

3. **向量資料庫**
   - ChromaDB 整合
   - 語義搜尋優化
   - 相似度計算改進

### 貢獻指南

如需新增法規或改進功能：

1. 在 `ragService.ts` 中新增法規文檔
2. 在 `aiCopilotService.ts` 中新增處理邏輯
3. 更新相關型別定義
4. 執行測試確保功能正常

---

## 📞 技術支援

如有問題，請聯繫開發團隊或查看：

- [SiliconFlow 文檔](https://docs.siliconflow.cn/)
- [Qwen2.5 模型介紹](https://huggingface.co/Qwen/Qwen2.5-32B-Instruct)
- 專案 GitHub Issues
