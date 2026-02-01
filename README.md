# TrvicERP - 旅遊業企業資源規劃系統

> 智能化旅遊業 ERP 解決方案，整合 AI 助手、多角色權限、即時協作、支付整合等企業級功能。

[![CI/CD](https://github.com/liboyin9087-jpg/TrvicERP/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/liboyin9087-jpg/TrvicERP/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 目錄

- [功能特色](#功能特色)
- [技術架構](#技術架構)
- [快速開始](#快速開始)
- [API 文檔](#api-文檔)
- [部署指南](#部署指南)
- [PM 產品分析](#pm-產品分析)
- [開發路線圖](#開發路線圖)
- [貢獻指南](#貢獻指南)

---

## 🚀 功能特色

### 核心功能
| 功能 | 描述 | 狀態 |
|------|------|------|
| 📊 **Dashboard 儀表板** | 可自訂的 KPI 儀表板，支援拖拉排版 | ✅ 已完成 |
| 📅 **團期管理** | 完整的出團排程、人數追蹤、資源分配 | ✅ 已完成 |
| 👥 **CRM 客戶管理** | 客戶資料、互動記錄、消費分析 | ✅ 已完成 |
| 💰 **報價系統** | 多版本報價產出、毛利試算 | ✅ 已完成 |
| ✈️ **行程規劃** | 拖拉式行程編輯器、版本控制 | ✅ 已完成 |
| 📕 **護照管理** | 護照流轉追蹤、到期提醒 | ✅ 已完成 |
| 💸 **費用報銷** | 領隊報帳、多幣別支援 | ✅ 已完成 |

### AI Copilot 智能助手
| 功能 | 描述 | 狀態 |
|------|------|------|
| 🤖 **多模式專家** | 行程規劃、行銷文案、成本估算、法規諮詢 | ✅ 已完成 |
| 📚 **RAG 法規知識庫** | 旅遊定型化契約、消保法規即時查詢 | ✅ 已完成 |
| ⚡ **Function Calling** | AI 可直接操作系統功能 | ✅ 已完成 |
| 📋 **結構化輸出** | JSON Schema 驗證的報價單、行程表 | ✅ 已完成 |

### P0 生產就緒功能 (新增)
| 功能 | 描述 | 狀態 |
|------|------|------|
| 💳 **Stripe 支付整合** | 完整支付流程、Webhook 處理、退款 | ✅ 已完成 |
| 📧 **Email 通知服務** | 多模板郵件、SMTP 整合 | ✅ 已完成 |
| 💬 **LINE 訊息整合** | 推播通知、Webhook 處理、Flex Message | ✅ 已完成 |
| 🐘 **PostgreSQL 支援** | 生產級資料庫、連接池 | ✅ 已完成 |
| 🔐 **RBAC 權限系統** | 角色權限管理、Token 黑名單 | ✅ 已完成 |
| 📊 **可觀測性** | Sentry 錯誤追蹤、Prometheus 指標 | ✅ 已完成 |
| 🚦 **Rate Limiting** | API 速率限制保護 | ✅ 已完成 |
| 🏥 **健康檢查** | Kubernetes 就緒/存活探針 | ✅ 已完成 |

### 多角色支援
| 角色 | 權限範圍 |
|------|---------|
| 👑 **Admin** | 完整系統管理權限 |
| 👔 **Manager** | 團隊管理、審核權限 |
| 💼 **Sales** | 客戶、報價、訂單管理 |
| 🔧 **Operator** | 行程、團期操作 |
| 💵 **Finance** | 財務、支付管理 |
| 🏢 **Welfare** | 企業福委專用介面 |
| 🧳 **Traveler** | 行程查詢、投票、報名 |

---

## 🛠 技術架構

### 前端
```
React 18 + TypeScript
├── Zustand          # 狀態管理
├── Tailwind CSS     # UI 樣式
├── Framer Motion    # 動畫效果
├── React Grid Layout # 儀表板佈局
├── DnD Kit          # 拖拉功能
├── i18next          # 多語系支援
└── Vite             # 建置工具
```

### 後端 (FastAPI)
```
FastAPI + Python 3.11
├── SQLAlchemy 2.0   # ORM
├── PostgreSQL       # 生產資料庫
├── Alembic          # 資料庫遷移
├── Stripe SDK       # 支付整合
├── Sentry SDK       # 錯誤追蹤
├── Prometheus       # 指標收集
├── Structlog        # 結構化日誌
└── SlowAPI          # 速率限制
```

### AI 服務
```
FastAPI + LLM
├── Google Gemini    # 主要 LLM
├── SiliconFlow      # 備用 LLM
├── RAG              # 法規知識檢索
└── Function Calling # 系統操作
```

---

## ⚡ 快速開始

### 環境需求
- Node.js >= 18
- Python >= 3.10
- PostgreSQL >= 14 (生產環境)
- Redis >= 7 (可選，用於快取)

### 安裝

```bash
# 1. Clone 專案
git clone https://github.com/liboyin9087-jpg/TrvicERP.git
cd TrvicERP

# 2. 安裝前端依賴
npm install

# 3. 安裝後端依賴
cd backend
pip install -r requirements.txt
cd ..

# 4. 安裝 AI 服務依賴 (可選)
cd ai-server
pip install -r requirements.txt
cd ..
```

### 環境變數設定

```bash
# 複製環境變數範例
cp .env.example .env
cp backend/.env.example backend/.env

# 編輯 .env 檔案，設定必要的環境變數
```

#### 前端環境變數 (.env)
```env
# API 配置
VITE_API_URL=http://localhost:4000
VITE_AI_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_USE_MOCK=false

# Supabase (可選)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 後端環境變數 (backend/.env)
```env
# 資料庫 (生產環境使用 PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/trvicerp

# JWT 認證
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# 環境
ENVIRONMENT=development

# Stripe 支付
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# LINE 
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret

# Sentry 監控
SENTRY_DSN=https://xxx@sentry.io/project
```

### 啟動開發伺服器

```bash
# 終端 1: 啟動前端
npm run dev

# 終端 2: 啟動後端
cd backend
python main.py

# 終端 3: 啟動 AI 服務 (可選)
cd ai-server
python main.py
```

開啟瀏覽器訪問：
- 前端: `http://localhost:5173`
- 後端 API 文檔: `http://localhost:4000/api/docs`
- 健康檢查: `http://localhost:4000/health`
- 指標: `http://localhost:4000/metrics`

---

## 📖 API 文檔

### 核心 API 端點

| 模組 | 端點 | 說明 |
|------|------|------|
| 認證 | `/api/v1/auth/*` | 登入、登出、Token 刷新 |
| 用戶 | `/api/v1/users/*` | 用戶 CRUD |
| 訂單 | `/api/v1/orders/*` | 訂單管理 |
| 客戶 | `/api/v1/customers/*` | 客戶管理 |
| 報價 | `/api/v1/quotations/*` | 報價管理 |
| 團期 | `/api/v1/sessions/*` | 團期管理 |
| 支付 | `/api/v1/payments/*` | 支付處理、Stripe 整合 |
| 通知 | `/api/v1/notifications/*` | Email/LINE 通知 |
| LINE | `/api/v1/line/*` | LINE 訊息服務 |

### Stripe 支付 API

```bash
# 創建支付意圖
POST /api/v1/payments/stripe/create-intent
{
  "order_id": "order_123",
  "amount": 50000,  // NT$ 50,000
  "customer_email": "customer@example.com"
}

# 回應
{
  "payment_intent_id": "pi_xxx",
  "client_secret": "pi_xxx_secret_xxx",
  "status": "requires_payment_method"
}

# Stripe Webhook
POST /api/v1/payments/stripe/webhook
```

### 通知 API

```bash
# 發送通知 (Email + LINE)
POST /api/v1/notifications/send
{
  "channel": "both",
  "template": "order_confirmation",
  "recipients": ["user@email.com", "U1234567890"],
  "template_data": {
    "customer_name": "王小明",
    "order_number": "ORD-2024-001"
  }
}

# 發送出團提醒
POST /api/v1/notifications/trip-reminder
{
  "customer_email": "user@email.com",
  "customer_line_id": "U1234567890",
  "customer_name": "王小明",
  "tour_name": "東京五日遊",
  "departure_date": "2024-03-15",
  "meeting_time": "06:00",
  "meeting_location": "桃園機場第一航廈",
  "leader_name": "陳領隊"
}
```

### 健康檢查 API

```bash
# 完整健康檢查
GET /health
{
  "status": "healthy",
  "database": { "status": "healthy", "database_type": "postgresql" },
  "application": { "environment": "production", "version": "2.0.0" }
}

# Kubernetes 探針
GET /health/live   # 存活探針
GET /health/ready  # 就緒探針

# Prometheus 指標
GET /metrics
```

---

## 🚀 部署指南

### Docker 部署

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 4000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: trvicerp
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: trvicerp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://trvicerp:your_password@db:5432/trvicerp
    ports:
      - "4000:4000"
    depends_on:
      - db
  
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Vercel 部署 (前端)

1. 連結 GitHub 倉庫到 Vercel
2. 設定環境變數
3. 部署設定：
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Railway/Render 部署 (後端)

1. 連結 GitHub 倉庫
2. 設定 Root Directory: `backend`
3. 設定環境變數
4. 啟動命令: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 📊 PM 產品分析

### 市場定位

**目標客戶**:
- 🏢 中小型旅行社 (5-50 人)
- 🏛️ 企業福委會
- 🎯 專業團體旅遊業者

**核心價值主張**:
1. **效率提升**: AI 助手減少 50% 行政工作時間
2. **成本控制**: 完整毛利試算與成本追蹤
3. **客戶體驗**: LINE 即時通知、線上支付
4. **合規保障**: 內建法規知識庫

### 競爭優勢

| 功能 | TrvicERP | 傳統 ERP | SaaS 競品 |
|------|----------|----------|----------|
| AI 智能助手 | ✅ | ❌ | 部分 |
| LINE 整合 | ✅ | ❌ | 部分 |
| 線上支付 | ✅ | ❌ | ✅ |
| 法規知識庫 | ✅ | ❌ | ❌ |
| 自訂儀表板 | ✅ | 部分 | ✅ |
| 多角色權限 | ✅ | ✅ | 部分 |

### 定價策略建議

| 方案 | 價格/月 | 適用對象 | 包含功能 |
|------|---------|----------|----------|
| **Starter** | NT$ 2,999 | 小型旅行社 (1-5人) | 基礎功能、5GB 儲存、Email 支援 |
| **Professional** | NT$ 7,999 | 中型旅行社 (6-20人) | 全功能、50GB 儲存、LINE 整合、優先支援 |
| **Enterprise** | 客製報價 | 大型/連鎖旅行社 | 無限制、API 存取、SLA 保證、專屬客服 |

**附加費用**:
- AI 使用量: NT$ 0.5/次 (超過每月 1000 次)
- 簡訊通知: NT$ 1/則

### 關鍵成功指標 (KPI)

| 指標 | 目標 | 說明 |
|------|------|------|
| **Activation Rate** | > 60% | 7 天內完成首次團期建立 |
| **Trial → Paid** | > 15% | 試用轉換率 |
| **Monthly Churn** | < 5% | 月流失率 |
| **NPS** | > 40 | 淨推薦值 |
| **Uptime** | 99.9% | 系統可用性 |

### 風險與緩解

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| LLM 成本爆炸 | 高 | Token 限制、模型降級、快取 |
| 支付合規 | 高 | 與專業會計顧問合作 |
| 外部 API 故障 | 中 | 重試機制、降級方案 |
| 資安事件 | 高 | 定期滲透測試、事件響應計畫 |

---

## 🗺️ 開發路線圖

### ✅ Phase 1: MVP (已完成)
- [x] 核心業務功能 (訂單、客戶、報價、團期)
- [x] AI Copilot 基礎功能
- [x] 多角色權限系統
- [x] 基礎 Dashboard

### ✅ Phase 2: P0 生產就緒 (已完成)
- [x] PostgreSQL 資料庫支援
- [x] Stripe 支付整合
- [x] Email 通知服務
- [x] LINE 完整整合
- [x] RBAC 權限強化
- [x] 可觀測性 (Sentry + Prometheus)
- [x] CI/CD Pipeline

### 🔄 Phase 3: P1 優化 (進行中)
- [ ] AI 成本控制與治理
- [ ] 報表匯出 (Excel/PDF)
- [ ] 行程版本管理
- [ ] 多語系 UI
- [ ] Onboarding 流程

### 📅 Phase 4: P2 擴展 (規劃中)
- [ ] 航空/飯店 API 整合
- [ ] 多租戶架構
- [ ] 進階 BI 報表
- [ ] 行動 App
- [ ] 發票整合

---

## 🤝 貢獻指南

### 開發流程

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 程式碼規範

- **TypeScript**: 啟用 strict mode
- **Python**: 遵循 PEP 8
- **Git Commit**: 使用 Conventional Commits
- **測試**: 核心功能需有單元測試

### 本地開發

```bash
# 執行前端測試
npm run test

# 執行前端 lint
npm run lint

# 執行後端測試
cd backend && pytest

# 執行完整 QA
npm run qa:fix
```

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 📞 聯絡與支援

- 📧 Email: support@trvicerp.com
- 💬 LINE: @trvicerp
- 📖 文件: [docs.trvicerp.com](https://docs.trvicerp.com)
- 🐛 Issue: [GitHub Issues](https://github.com/liboyin9087-jpg/TrvicERP/issues)

---

<p align="center">
  <strong>Made with ❤️ for the Travel Industry</strong>
</p>
