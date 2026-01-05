# Supabase Edge Functions（讓 Vercel 只跑前端，後端交給 Supabase）

這個版本把原本 `/api/*`（Vercel Serverless）改成 **Supabase Edge Functions**。
好處：
- Vercel 只需要部署前端（更穩、更快）
- API Key（OpenAI/SERVICE_ROLE_KEY）都留在 Supabase，不會出現在前端 bundle

---

## 1) 安裝與登入 Supabase CLI
```bash
npm i -g supabase
supabase login
```

## 2) 連結你的 Supabase 專案
在專案根目錄：
```bash
supabase link --project-ref <your-project-ref>
```

## 3) 設定 Secrets（非常重要）
### 必要（資料庫管理 / Function 代理）
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### AI（如果你要啟用 AI 功能）
```bash
supabase secrets set OPENAI_API_KEY="sk-..."
supabase secrets set OPENAI_MODEL="gpt-4o-mini"
```

（可選）Anthropic / GitHub Models / HuggingFace / Remote Ollama
```bash
supabase secrets set ANTHROPIC_API_KEY="..."
supabase secrets set GITHUB_TOKEN="..."
supabase secrets set HF_API_KEY="..."
supabase secrets set OLLAMA_BASE_URL="http://.../api/chat"
```

### 是否允許未登入也能呼叫 AI（Demo 模式）
預設是 **不允許**（避免被公開濫用）。
若你要 Demo 無登入也能用 AI：
```bash
supabase secrets set ALLOW_ANON_LLM=true
```

---

## 4) 部署 Edge Functions
```bash
supabase functions deploy health
supabase functions deploy llm
supabase functions deploy rfp
supabase functions deploy voting
supabase functions deploy warnings
```

部署後，你可以測：
- `https://<project-ref>.functions.supabase.co/health`

---

## 5) 前端（Vercel）環境變數
Vercel 只需要前端這兩個：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

（可選）
- `VITE_LLM_PROVIDER=supabase-edge`

> 其他像 `OPENAI_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 都不要放在 Vercel。
