# TrvicERP 系統架構文檔

## 📋 目錄
1. [系統概覽](#系統概覽)
2. [三層架構](#三層架構)
3. [核心模塊](#核心模塊)
4. [API 端點](#api-端點)
5. [數據流](#數據流)
6. [認證與授權](#認證與授權)
7. [實時通信](#實時通信)
8. [部署架構](#部署架構)
9. [安全性](#安全性)
10. [性能優化](#性能優化)

---

## 系統概覽

TrvicERP 是一個現代化的旅遊業企業資源規劃系統，採用微服務分層架構，支持實時協作、多角色管理、AI 智能助手等功能。

### 核心特性
- ✅ 三層分層架構（前端、後端、AI 服務）
- ✅ 基於角色的訪問控制（RBAC）
- ✅ 實時 WebSocket 通信
- ✅ 多格式文檔導出（PDF、Excel、CSV、ZIP）
- ✅ AI 多專家系統（行程規劃、行銷文案、成本估算、法規諮詢）
- ✅ 向量資料庫 RAG 檢索（Qdrant）
- ✅ 分布式快取（Redis）
- ✅ 完整的審計日誌

---

## 三層架構

### 1. 前端層 (React 18 + TypeScript)

**位置**: `/`

**技術棧**:
- React 18.2.0 - UI 框架
- TypeScript 5.x - 靜態類型
- Vite 5.x - 打包工具
- Tailwind CSS 3.4 - 樣式
- Framer Motion 12.25 - 動畫
- React Router 7.12 - 路由
- Zustand 5.0.9 - 狀態管理
- i18next 25.8 - 多語言支持

**架構層級**:
```
src/
├── components/        # React 組件
│   ├── admin/        # 管理員功能 (CostingDashboard, SessionManager 等)
│   ├── staff/        # 員工工具 (ItineraryBuilder, CRM, 成本計算器 等)
│   ├── client/       # 客戶端功能 (TravelerApp, VotingPage, 行程查詢 等)
│   ├── dashboard/    # 可拖動儀表板
│   ├── portal/       # 客戶門戶
│   ├── auth/         # 認證相關
│   └── shared/       # 共用組件 (AICopilot, FileScanner, Modal 等)
├── modules/          # 業務模塊
│   ├── itinerary-builder/  # 行程編輯器
│   ├── passport/           # 護照管理
│   ├── visa/               # 簽證管理
│   ├── insurance/          # 保險管理
│   ├── expense/            # 費用管理
│   ├── supplier/           # 供應商管理
│   └── ...
├── store/            # Zustand Store（狀態管理）
│   ├── useAppStore.ts          # 全局應用狀態
│   ├── useDashboardStore.ts    # 儀表板狀態
│   └── useToastStore.ts        # 通知狀態
├── services/         # 業務服務
│   ├── authService.ts          # 認證服務
│   ├── realtimeService.ts      # 實時服務
│   └── ...
├── lib/              # 工具庫
│   ├── api.ts                  # API 配置與客戶端
│   ├── exportService.ts        # 文檔導出（PDF、Excel、CSV、ZIP）
│   ├── file-scanner.ts         # 文件掃描工具
│   ├── supabase.ts             # Supabase 集成
│   └── ai/                     # AI 服務客戶端
├── config/           # 配置
│   └── env.ts        # 環境變數配置
├── types/            # TypeScript 類型定義
├── hooks/            # React Hooks
├── locales/          # 多語言文件 (i18n)
└── test/             # 測試配置
```

**關鍵組件層級**:
- **Dashboard** - 主儀表板（支持拖拉排版）
- **SessionManager** - 團次管理
- **ItineraryBuilder** - 行程編輯器
- **AICopilotPanel** - AI 助手
- **DocumentGenerator** - 文檔生成與導出

### 2. 後端 API 層 (FastAPI + Python)

**位置**: `/backend`

**技術棧**:
- FastAPI >= 0.104.0 - Web 框架
- Uvicorn >= 0.24.0 - ASGI 服務器
- SQLAlchemy 2.0 - ORM
- Alembic - 數據庫遷移
- PyJWT + Passlib - 認證
- Pydantic 2.5 - 數據驗證
- python-dotenv - 環境配置

**API 路由層級** (13 個主要模組):
```python
app/api/
├── auth.py                 # POST /auth/login, /auth/refresh, /auth/logout
├── users.py                # CRUD /users
├── orders.py               # 訂單管理
├── quotations.py           # 報價單管理
├── customers.py            # 客戶管理
├── tours.py                # 行程管理
├── sessions.py             # 團次管理
├── corporate_accounts.py    # 企業帳戶
├── budgets.py              # 預算管理
├── polls.py                # 投票系統
├── reports.py              # 報表與導出
├── line.py                 # LINE 集成
├── suppliers.py (P0)       # 供應商
├── flights.py (P0)         # 航班
├── payments.py (P0)        # 支付
├── passports.py (P0)       # 護照
├── operations.py (P0)      # 營運
├── excel.py (P1)           # 批量導入導出
├── analytics.py (P1)       # 數據分析
├── import_api.py           # 批量導入
└── weather_push.py         # 天氣推送
```

**數據庫模型**:
```python
app/models/
├── models.py          # SQLAlchemy 數據模型
│   ├── User
│   ├── TourSession
│   ├── Booking
│   ├── Order
│   ├── Quotation
│   ├── Customer
│   ├── CorporateAccount
│   ├── Budget
│   ├── Poll
│   ├── Payment
│   ├── Passport
│   └── ...
```

**WebSocket 端點**:
- `ws://localhost:4000/ws` - 實時通信
  - 支持消息類型：ping, pong, notification, subscription

### 3. AI 服務層 (FastAPI + LLM)

**位置**: `/ai-server`

**技術棧**:
- FastAPI >= 0.104.0
- Google Gemini API / SiliconFlow
- Redis >= 5.0 (可選快取)
- Qdrant >= 1.7.0 (可選向量資料庫)
- Sentence Transformers (文本嵌入)

**AI 專家系統** (5 個模式):
```python
ai-server/
├── main.py                  # 主 AI 服務
├── prompt_templates.py      # 提示詞模板
├── rules.txt               # 法規知識庫
└── eval/                   # 評估工具
```

**AI 端點**:
- `POST /api/chat` - 多模式對話
- `POST /api/structured` - 結構化輸出
- `GET /api/modes` - 取得所有專家模式
- `GET /api/image-status/{task_id}` - 圖片生成狀態
- `WebSocket /ws` - 實時 AI 流式輸出

**專家模式**:
1. **行程規劃** - 最佳化行程安排、景點推薦
2. **行銷文案** - 生成行銷文案、文案優化
3. **成本估算** - 成本預算、ROI 分析
4. **法規諮詢** - 簽證政策、法規查詢
5. **通用回答** - 一般查詢

---

## 核心模塊

### 前端模塊

#### 1. 認證 (Authentication)
- **路徑**: `components/auth/LoginPage.tsx`
- **功能**: 
  - Supabase OAuth 集成
  - JWT Token 管理
  - 密碼重置流程
- **狀態管理**: `useAuthStore`

#### 2. 儀表板 (Dashboard)
- **路徑**: `components/dashboard/DraggableDashboard.tsx`
- **功能**:
  - 拖拉排版
  - Widget 自定義
  - 實時數據更新
- **狀態管理**: `useDashboardStore`

#### 3. 文檔導出 (Export Service)
- **路徑**: `src/lib/exportService.ts`
- **功能**:
  - PDF 導出 (行程表、分房表、座位表、名單、集合資訊)
  - Excel 導出
  - CSV 導出
  - **ZIP 壓縮** (新增) - 批量打包多個文檔
- **使用方式**:
  ```typescript
  import { exportToZip, exportAllDocumentsToZip } from '@/lib/exportService';
  
  // 匯出特定文件到 ZIP
  await exportToZip(['itinerary', 'room_list'], options);
  
  // 匯出所有文件到 ZIP
  await exportAllDocumentsToZip(options);
  ```

#### 4. 文件掃描 (File Scanner)
- **路徑**: `components/shared/FileScannerDemo.tsx`
- **功能**:
  - 遞歸目錄掃描
  - 文件分類統計
  - 拖拽上傳

#### 5. AI 助手 (AI Copilot)
- **路徑**: `components/shared/AICopilotPanel.tsx`
- **功能**:
  - 多模式 AI 對話
  - 實時流式輸出
  - 快捷命令

#### 6. 行程編輯器 (Itinerary Builder)
- **路徑**: `src/modules/itinerary-builder/ItineraryBuilder.tsx`
- **功能**:
  - 日程規劃
  - 景點添加
  - 時間管理
  - AI 優化建議

### 後端模塊

#### 1. 認證模塊
- **路徑**: `backend/app/api/auth.py`
- **端點**:
  - `POST /api/v1/auth/login` - 登錄
  - `POST /api/v1/auth/refresh` - 刷新 Token
  - `POST /api/v1/auth/logout` - 登出

#### 2. 團次管理 (Sessions)
- **路徑**: `backend/app/api/sessions.py`
- **功能**:
  - 團次建立、編輯、刪除
  - 團員管理
  - 房間分配

#### 3. 護照管理 (Passports)
- **路徑**: `backend/app/api/passports.py`
- **功能**:
  - 護照資訊儲存
  - 有效期追蹤
  - 簽證狀態管理

#### 4. 支付管理 (Payments)
- **路徑**: `backend/app/api/payments.py`
- **功能**:
  - 支付記錄
  - 發票生成
  - 對賬

#### 5. 導入導出 (Import/Export)
- **路徑**: `backend/app/api/excel.py`, `import_api.py`
- **功能**:
  - 批量導入客戶數據
  - Excel 導出報表
  - CSV 轉換

#### 6. 分析模塊 (Analytics)
- **路徑**: `backend/app/api/analytics.py`
- **功能**:
  - 銷售分析
  - 客戶洞察
  - 業績追蹤

### AI 服務模塊

#### 1. 聊天引擎
- 支持多個 LLM 提供者（Gemini、SiliconFlow、Groq）
- Redis 快取查詢結果
- 流式輸出支持

#### 2. RAG 向量檢索
- Qdrant 向量資料庫
- 法規知識庫整合
- 相似度搜索

#### 3. 背景任務
- 圖片生成
- 文本分析
- 異步處理隊列

---

## API 端點

### 前端 ↔ 後端 API 映射

| 功能 | 方法 | 端點 | 狀態 |
|------|------|------|------|
| 登錄 | POST | `/api/v1/auth/login` | ✅ |
| 刷新 Token | POST | `/api/v1/auth/refresh` | ✅ |
| 取得用戶信息 | GET | `/api/v1/users/me` | ✅ |
| 列出訂單 | GET | `/api/v1/orders` | ✅ |
| 建立訂單 | POST | `/api/v1/orders` | ✅ |
| 取得團次 | GET | `/api/v1/sessions/{id}` | ✅ |
| 更新團次 | PUT | `/api/v1/sessions/{id}` | ✅ |
| 導出報表 | GET | `/api/v1/reports/{type}/export` | ✅ |
| 導入數據 | POST | `/api/v1/import` | ✅ |
| WebSocket | - | `ws://localhost:4000/ws` | ✅ |

### 前端 ↔ AI API 映射

| 功能 | 方法 | 端點 | 狀態 |
|------|------|------|------|
| 聊天 | POST | `/api/chat` | ✅ |
| 結構化輸出 | POST | `/api/structured` | ✅ |
| 取得專家模式 | GET | `/api/modes` | ✅ |
| WebSocket AI | - | `ws://localhost:4000/ws` | ✅ |

---

## 數據流

### 用戶認證流程
```
1. 前端 (LoginPage) → 後端 (POST /auth/login)
   └─ 驗證用戶名/密碼
   └─ 返回 Access Token + Refresh Token

2. 前端存儲 Token (Zustand Store)
   └─ useAuthStore.setAuth()

3. 後續請求自動附加 Authorization header
   └─ Authorization: Bearer {token}

4. Token 過期時自動刷新
   └─ POST /auth/refresh
   └─ 返回新 Token
```

### 實時消息流程
```
1. 前端連接 WebSocket
   └─ new WebSocket('ws://localhost:4000/ws')

2. 後端接受連接
   └─ manager.connect()

3. 發送消息
   前端 → 後端: { type: "notification", data: {...} }
   後端 → 前端: { type: "pong" }

4. 心跳檢測
   前端 → 後端: { type: "ping" } (每 30 秒)
   後端 → 前端: { type: "pong" }
```

### 文檔導出流程
```
1. 用戶點擊導出按鈕
   └─ exportToZip(['itinerary', 'room_list'], options)

2. 前端生成文檔內容
   ├─ 行程表 (PDF)
   ├─ 分房表 (PDF)
   ├─ 名單清冊 (CSV)
   └─ 集合資訊 (PDF)

3. jszip 庫打包所有文件
   └─ zip.generateAsync({ type: 'blob' })

4. 瀏覽器下載 ZIP
   └─ safeBrowserDownload('file.zip')
```

---

## 認證與授權

### 認證方案
- **JWT (JSON Web Token)**
  - Access Token: 15 分鐘有效期
  - Refresh Token: 7 天有效期
  - 存儲位置: localStorage

- **Supabase OAuth**
  - Google 登錄
  - GitHub 登錄
  - 自定義認證

### 授權機制 (RBAC)
```typescript
// 角色定義
type UserRole = 'admin' | 'staff' | 'client' | 'guest';

// 菜單路由
const roleRoutes: Record<UserRole, ViewKey[]> = {
  admin: ['staff', 'welfare', 'traveler'],
  staff: ['staff', 'traveler'],
  client: ['traveler'],
  guest: [],
};
```

### 路由保護
```typescript
// 保護路由
<Route element={<ProtectedRoute roles={['admin', 'staff']} />}>
  <Route path="/dashboard" element={<DraggableDashboard />} />
</Route>
```

---

## 實時通信

### WebSocket 服務
- **文件**: `src/core/services/websocketService.ts`
- **功能**:
  - 自動重連 (最多 5 次)
  - 心跳檢測 (30 秒間隔)
  - 消息訂閱系統

### WebSocket 使用示例
```typescript
import { initializeWebSocket } from '@/core/services/websocketService';

// 初始化
const manager = initializeWebSocket('ws://localhost:4000/ws');

// 訂閱消息
const unsubscribe = manager.on('notification', (msg) => {
  console.log('收到通知:', msg);
});

// 發送消息
manager.send({ type: 'notification', data: {...} });

// 一次性訂閱
manager.once('response', (msg) => {
  console.log('收到回應:', msg);
});

// 取消訂閱
unsubscribe();
```

### React Hook 集成
```typescript
import { useWebSocket } from '@/core/services/websocketService';

function MyComponent() {
  const { isConnected, send, on } = useWebSocket('ws://localhost:4000/ws');

  React.useEffect(() => {
    const unsubscribe = on('message', (msg) => {
      console.log('收到消息:', msg);
    });

    return unsubscribe;
  }, [on]);

  return (
    <div>
      {isConnected ? '已連接 ✓' : '未連接 ✗'}
    </div>
  );
}
```

---

## 部署架構

### 開發環境
```
前端 (Vite)          http://localhost:5173
後端 (Uvicorn)       http://localhost:4000
AI 服務 (Uvicorn)    http://localhost:4000 (同一進程)
```

### 生產環境
```
┌─────────────────────────────────────┐
│        Vercel (前端)                │
│  - 靜態網站部署                     │
│  - CDN 全局分發                     │
│  - HTTPS/2                          │
└────────┬────────────────────────────┘
         ↓ API 調用
┌─────────────────────────────────────┐
│        Railway/AWS (後端)           │
│  - FastAPI Docker 容器              │
│  - 自動擴展                         │
│  - PostgreSQL 數據庫                │
│  - Redis 快取                       │
└────────────────────────────────────┘
         ↓ LLM API
┌─────────────────────────────────────┐
│        Google Gemini / SiliconFlow   │
│  - LLM 推理服務                      │
└─────────────────────────────────────┘
```

### Docker 部署
```dockerfile
# 後端 Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]
```

---

## 安全性

### 防護措施
1. **CORS 配置**
   - 允許列表白名單
   - 認證標頭支持

2. **認證與授權**
   - JWT Token 加密
   - Bcrypt 密碼哈希
   - 基於角色的訪問控制 (RBAC)

3. **數據加密**
   - HTTPS/TLS 傳輸加密
   - 敏感信息 (密碼、Token) 不儲存在客戶端

4. **API 安全**
   - 速率限制 (Rate Limiting)
   - 輸入驗證 (Pydantic)
   - SQL 注入防護 (ORM)

5. **審計日誌**
   - 文件**: `backend/app/core/audit.py`
   - 記錄所有重要操作

---

## 性能優化

### 前端優化
1. **代碼分割**
   - Lazy loading 所有非首屏組件
   - Route-based splitting

2. **快取策略**
   - Service Worker PWA
   - IndexedDB 離線存儲
   - 瀏覽器快取

3. **動畫優化**
   - GPU 加速 (transform, opacity)
   - 避免 reflow/repaint

4. **打包優化**
   - Tree-shaking 移除死代碼
   - 依賴優化 (減少初始包大小)

### 後端優化
1. **數據庫**
   - 索引優化
   - 查詢優化
   - 連接池

2. **快取層**
   - Redis 查詢結果快取
   - API 響應快取

3. **非同步處理**
   - FastAPI 異步端點
   - 後台任務隊列

4. **CDN**
   - 靜態資源 CDN 分發
   - API 地理分布

---

## 故障排查

### WebSocket 連接問題
```
問題: WebSocket 無法連接
解決:
1. 檢查 WS_URL 環境變數
2. 確認後端 WebSocket 端點已運行
3. 檢查防火牆/代理設置
4. 查看瀏覽器控制台錯誤日誌
```

### 認證失敗
```
問題: 登錄後仍無法訪問受保護資源
解決:
1. 檢查 JWT_SECRET_KEY 環境變數
2. 驗證 Token 有效期
3. 確認 Authorization header 格式
4. 檢查 CORS 配置
```

### ZIP 導出失敗
```
問題: 無法生成 ZIP 檔案
解決:
1. 確認 jszip 已安裝
2. 檢查瀏覽器記憶體
3. 減少導出文件數量
4. 查看瀏覽器控制台錯誤
```

---

## 參考資源

- [FastAPI 文檔](https://fastapi.tiangolo.com/)
- [React 文檔](https://react.dev/)
- [Zustand 文檔](https://github.com/pmndrs/zustand)
- [Supabase 文檔](https://supabase.com/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/)
- [TypeScript 文檔](https://www.typescriptlang.org/docs/)

---

**最後更新**: 2026-02-03  
**版本**: 2.0.0  
**維護者**: TrvicERP Team
