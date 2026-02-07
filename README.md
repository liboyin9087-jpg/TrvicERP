# TravelMaster — 協作型旅遊管理 SaaS

> **專案性質：獨立產品設計與 MVP 開發｜Independent Product Design & MVP**
> 
> 本專案為個人從 0→1 完成的產品概念驗證，涵蓋市場洞察、產品策略、UX 設計到技術實作。尚未進入商業營運階段。

-----

## 為什麼做這個？（Why This Product）

### 痛點發現

在台灣，企業旅遊通常由「福委」輪值籌辦。經過訪談與實際觀察，我發現這個流程存在一個結構性問題：**旅行社的系統止步於 B2B，但真正的決策摩擦發生在 B2B2E（Agency → 福委 → 員工）這段沒人管的灰色地帶。**

具體來說：

- **決策孤島** — 老闆要控預算、員工要好行程，福委夾在中間承擔所有溝通成本與背鍋風險
- **資訊單向流動** — 旅行社給 PDF 行程單 → 福委轉發 LINE 群 → 員工出發當天才抱怨，反饋迴路斷裂
- **工具斷層** — 旅行社 ERP 僅處理內部記帳與團控，無法延伸至客戶端的「參與式體驗」

### 市場機會判斷

|面向     |觀察                                       |
|-------|-----------------------------------------|
|競品缺口   |台灣旅行社 ERP（如雄獅鼎新、易飛系統）皆為封閉式內部工具，無 B2E 延伸能力|
|使用者痛點強度|福委是「被迫上任」的角色，降低其壓力有強烈需求                  |
|技術時機   |GenAI 成熟度已足以處理結構化旅遊文件與自然語言操作指令           |
|切入策略   |從「福委投票 + 員工互動」切入建立黏性，再反向延伸至旅行社作業面        |

-----

## 產品策略（Product Strategy）

### 核心定位

**從旅行社的「管理工具」轉型為 B2B2E 的「協作平台」。**

傳統路徑：旅行社 → 出團管理 → 結案
我們的路徑：旅行社 → 協作規劃 → 員工參與 → 數據回饋 → 下一團優化

### 目標使用者與場景

|角色            |核心任務          |我們解決什麼                             |
|--------------|--------------|-----------------------------------|
|🏢 福委          |蒐集意見、協調行程、回報進度|「投票 PK」取代逐一詢問、即時民意 Dashboard 取代手動統計|
|👩‍💼 旅行社業務       |報價、跟單、客戶維繫    |智慧報價試算、CRM 互動記錄、自動化文案產出            |
|🔧 旅行社 OP      |訂房訂車、團控作業、對帳  |拖拉式行程編輯、合約/請款自動生成、匯款對帳追蹤           |
|👤 員工（End User）|表達偏好、查看行程     |Tinder 式滑動投票、許願池、LINE 懶人包          |

### 功能優先級與取捨邏輯（Prioritization）

我使用 **RICE + 策略對齊** 做優先級判斷：

**P0 — The Backbone（核心業務系統）**

> 邏輯：沒有這層，旅行社不會用。這是入場門票。

- Dashboard 儀表板（Widget 拖拉排版，自訂 KPI 視圖）
- 團期排程與 CRM（出團管理、資源分配、客戶消費分析）
- 智慧報價引擎（多版本報價、自動毛利試算、成本鎖定）
- 行程規劃編輯器（拖拉式、版本控制、變更追蹤）
- 合約與請款（定型化契約 PDF 自動生成、分期請款、匯款/支票對帳）

**P1 — The Brain（AI Copilot）**

> 邏輯：用 AI 解決高頻但低價值的重複性工作，提升 OP 效率。

- RAG 法規知識庫 — 內建旅遊定型化契約與消保法，即時檢核合約條款風險
- Function Calling — AI 可直接操作系統（例：「幫我把 5/20 的日本團標記為已收訂金」）
- 自動化文案 — 根據景點標籤生成行銷文案與行程亮點

**P2 — The Heart（員工互動與福委專區）**

> 邏輯：這是差異化殺手鐧，但需要 P0 作為基礎才有意義。

- 行程 PK 擂台 — A/B 方案投票（手機左右滑動，遊戲化）
- 許願池 — 景點/餐廳願望清單（購物車式體驗，可讚/踩）
- 懶人包生成 — 一鍵產出 LINE 格式長圖
- 吐槽/留言牆 — 針對行程節點的彈幕式即時留言

**刻意不做的事（Deliberate Exclusions）：**

|排除項目         |理由                              |
|-------------|--------------------------------|
|Stripe / 線上金流|台灣團體旅遊以匯款/支票為主，強推線上支付反而增加摩擦     |
|C 端散客功能      |聚焦 B2B2E 場景，不與 KKday/Klook 正面競爭 |
|供應商即時庫存串接    |列入 Phase 2，MVP 階段先驗證協作價值再擴展供應鏈整合|

-----

## 獨家體驗設計：液態工作區（Liquid Workspace）

### 設計理念

傳統旅行社 ERP 的問題不只是「醜」，而是 **一套固定介面要服務截然不同的角色場景**。業務需要看業績、OP 需要看團控、福委需要看投票結果 — 但他們全部被塞進同一個 Dashboard。

Liquid Workspace 的核心概念：**Your Dashboard, Your Rules.**

### 設計機制

- **原子化（Widget-based）** — 系統功能被拆解為獨立卡片：團控表、業績圖、待辦事項、投票戰況等
- **角色情境自訂（Role-based Context）** — 每個角色有預設桌面配置，可自由調整
- **情境切換** — 儲存多種 Layout，例如「週一早會模式（看數據）」vs「週五作業模式（清待辦）」

### 角色預設範例

|角色      |預設 Widget 配置                |
|--------|----------------------------|
|Sales 業務|業績達成率、客戶 LINE 未讀、報價追蹤、本月成交排行|
|OP 線控   |🚨 團費入帳確認、🏨 飯店確認單、✈️ 機位狀態、待辦清單|
|福委      |🗳️ 員工投票 PK 戰況、許願牆熱門排行、行程確認進度 |

-----

## 技術架構（Architecture）

### Tech Stack 選型理由

|層級            |選擇                                     |為什麼                                         |
|--------------|---------------------------------------|--------------------------------------------|
|Frontend      |React + Next.js + Tailwind CSS         |SSR 提升首屏速度；React Grid Layout 實現 Workspace 拖拉|
|Backend       |Node.js（主服務）+ Python（AI/Data）          |Node 處理即時性高的 API；Python 生態系對 LLM/RAG 更成熟    |
|Database      |PostgreSQL + Redis                     |PG 處理結構化商務資料；Redis 處理 Session、快取與即時投票計數     |
|Infrastructure|Kubernetes + Google Cloud Run          |彈性擴展，符合 SaaS 多租戶需求                          |
|AI/LLM        |LangChain + OpenAI/Anthropic + Pinecone|LangChain 統一 LLM 調度；Pinecone 作為 RAG 向量資料庫   |

### 關鍵整合

- **LINE Messaging API** — 推播通知、Flex Message 行程卡片、投票連結（台灣 B2E 溝通的必要管道）
- **Auth0 / RBAC** — 六層角色權限控制（Admin, Manager, Sales, OP, Welfare, Traveler）
- **PDF Generation（Puppeteer/PDFKit）** — 正式報價單、合約書、請款單產出

### 架構示意

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│          Next.js + React Grid Layout             │
│         (Liquid Workspace / 投票介面)             │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│   Main Service   │  │   AI Service     │
│    (Node.js)     │  │    (Python)      │
│                  │  │                  │
│ • REST API       │  │ • LangChain      │
│ • WebSocket      │  │ • RAG Pipeline   │
│ • Auth / RBAC    │  │ • Function Call   │
│ • PDF Gen        │  │ • 文案生成        │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │   Pinecone       │
│  (Primary DB)    │  │  (Vector DB)     │
├──────────────────┤  └──────────────────┘
│     Redis        │
│  (Cache/Queue)   │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  LINE Messaging  │
│      API         │
└──────────────────┘
```

-----

## Roadmap

|Phase  |重點                           |狀態      |
|-------|-----------------------------|--------|
|Phase 1|液態工作區 + 福委投票 App + 核心業務系統    |✅ MVP 完成|
|Phase 2|供應商 API 串接（Agoda/Amadeus）即時庫存|📋 規劃中   |
|Phase 3|數據分析模組 — 團型偏好、季節趨勢、客戶 LTV    |💡 概念階段  |

-----

## 我在這個專案中做了什麼（My Role & Learnings）

這是一個獨立完成的產品設計與技術實作專案。以下是我在各階段的具體產出：

### 產品面

- 從福委角色的實際痛點出發，定義 B2B2E 產品定位
- 完成使用者角色分析（Persona）、使用者旅程（User Journey）與功能優先級排序
- 設計 Liquid Workspace 互動概念，解決「多角色共用一套介面」的 UX 問題
- 進行競品分析與市場定位，決定切入點與刻意排除項

### 技術面

- 獨立完成前後端架構設計與技術選型
- 實作 RAG Pipeline 整合旅遊法規文件，實現合約風險即時檢核
- 開發 Function Calling 機制，讓 AI 可直接操作系統資料
- 建構 RBAC 多角色權限體系與多租戶資料隔離

### 關鍵決策紀錄

1. **拿掉 Stripe** — 田野調查發現台灣團旅以匯款為主，線上金流反而是阻力
1. **先做 P0 再做 P2** — 投票功能雖然有差異化，但沒有基礎業務系統旅行社不會買單
1. **AI 定位為 Copilot 而非 Autopilot** — 旅遊業涉及合約與金流，AI 輔助決策但不取代人為判斷

-----

## 技術環境設定（Getting Started）

```bash
# Clone
git clone https://github.com/[your-username]/travelmaster.git

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && python main.py
```

### 環境變數

```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# AI
OPENAI_API_KEY=your_key
PINECONE_API_KEY=your_key

# LINE
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret

# Auth
AUTH0_DOMAIN=your_domain
AUTH0_CLIENT_ID=your_client_id
```

-----

## License

MIT

-----

> 💬 **關於這個專案**
> 
> 這不是一個已上線的商業產品，而是我對「旅遊產業數位化」這個命題的完整思考與實作練習。
> 它展現的是我如何從市場洞察出發，經過產品策略、UX 設計、技術選型到 MVP 交付的完整 PM 思維。
> 
> 如果你對這個專案有興趣，或對旅遊 SaaS 有想法，歡迎交流。
