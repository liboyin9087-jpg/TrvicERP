# TrivcERP 專案診斷報告與修復指南

## 執行摘要

經過完整的程式碼審查，專案存在 **一個關鍵編譯錯誤** 導致無法部署到 Vercel。以下是完整診斷與修復方案。

---

## 一、Vercel 部署失敗的根本原因

### 問題：AuthContext API 介面不匹配

**現有 `AuthContext.tsx` 導出的介面：**
```typescript
interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  // ...其他方法
}
```

**實際使用的介面（App.tsx, LoginPage.tsx, ProtectedRoute.tsx）：**
```typescript
const { auth, login, logout, usingSupabase } = useAuth();
// auth.isAuthenticated, auth.user, auth.isLoading, auth.error
```

**錯誤訊息（編譯時會出現）：**
```
Property 'auth' does not exist on type 'AuthContextType'.
Property 'login' does not exist on type 'AuthContextType'.
Property 'logout' does not exist on type 'AuthContextType'.
Property 'usingSupabase' does not exist on type 'AuthContextType'.
```

---

## 二、專案完整度評估

| 模組 | 狀態 | 說明 |
|------|------|------|
| 資料庫 Schema | ✅ | 6 個 migration，含 RLS |
| Supabase Edge Functions | ✅ | llm, rfp, voting, warnings, health |
| 前端 UI | ✅ | 三角色 Dashboard 完整 |
| 認證系統 | ❌ | **API 不匹配，無法編譯** |
| LLM 服務 | ✅ | 6 Provider 支援 |
| 類型定義 | ⚠️ | 有重複定義 |

---

## 三、架構分析：Supabase Edge vs Vercel Proxy

### 現有架構（推薦保留）

```
┌─────────────────────────────────────────────────────────────────┐
│                        生產環境架構                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [瀏覽器]                                                       │
│       │                                                         │
│       ▼                                                         │
│   ┌────────────┐                                                │
│   │  Vercel    │  ← 只部署前端靜態檔案                            │
│   │  (CDN)     │                                                │
│   └────────────┘                                                │
│       │                                                         │
│       │ supabase.functions.invoke('llm', {...})                 │
│       ▼                                                         │
│   ┌────────────────────────────────────────┐                    │
│   │  Supabase Edge Functions               │                    │
│   │  ┌──────────┐ ┌──────────┐ ┌────────┐ │                    │
│   │  │   llm/   │ │   rfp/   │ │voting/ │ │ ← API Key 安全存放  │
│   │  └──────────┘ └──────────┘ └────────┘ │                    │
│   └────────────────────────────────────────┘                    │
│       │                                                         │
│       │ SUPABASE_SERVICE_ROLE_KEY                               │
│       ▼                                                         │
│   ┌────────────────────────────────────────┐                    │
│   │  Supabase Database + Auth              │                    │
│   └────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 優勢

1. **安全性**：API Key 永不暴露在前端
2. **穩定性**：Vercel 只負責靜態檔案
3. **成本**：免費額度充足
4. **擴展性**：Edge Functions 支援多 Provider

### 結論：無需改用 Vercel Proxy

---

## 四、修復步驟

### 步驟 1：替換 AuthContext

```bash
# 備份現有檔案
mv src/contexts/AuthContext.tsx src/contexts/AuthContext.backup.tsx

# 使用修復版本
mv src/contexts/AuthContext.fixed.tsx src/contexts/AuthContext.tsx
```

### 步驟 2：驗證編譯

```bash
npm run typecheck
npm run build
```

### 步驟 3：本地測試

```bash
npm run dev
# 測試 Demo 帳號：admin/admin123, client/client123
```

### 步驟 4：部署到 Vercel

```bash
vercel --prod
```

---

## 五、環境變數配置

### Vercel (前端)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LLM_PROVIDER=supabase-edge
```

### Supabase Secrets (後端)

```bash
supabase secrets set OPENAI_API_KEY="sk-..."
supabase secrets set OPENAI_MODEL="gpt-4o-mini"
supabase secrets set ALLOW_ANON_LLM="true"  # Demo 模式
```

---

## 六、其他待修項目（優先級較低）

### 6.1 類型定義重複

- `src/types/index.ts` 定義了 `AuthState`
- `src/contexts/AuthContext.tsx` 也定義了 `AuthState`

**建議**：統一使用 `src/types/index.ts` 的定義

### 6.2 Demo 帳號警告

LoginPage.tsx 會顯示 Demo 帳號，生產環境應隱藏：

```tsx
{!usingSupabase && import.meta.env.MODE !== 'production' && (
  <div className="demo-credentials">...</div>
)}
```

### 6.3 測試覆蓋率

目前僅有 2 個測試檔案，建議新增：
- AuthContext 測試
- 配置器價格計算測試
- RFP 生成測試

---

## 七、部署檢查清單

- [ ] 替換 AuthContext.tsx
- [ ] `npm run typecheck` 通過
- [ ] `npm run build` 成功
- [ ] Vercel 環境變數已設定
- [ ] Supabase Secrets 已設定
- [ ] Edge Functions 已部署
- [ ] 測試登入功能
- [ ] 測試 AI 生成功能

---

## 八、參考資料

- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)
- [Vercel SPA 部署](https://vercel.com/docs/frameworks/vite)
- [專案 GitHub](https://github.com/liboyin9087-jpg/TrivcERP)
