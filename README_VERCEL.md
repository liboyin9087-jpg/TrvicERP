# 在 Vercel 部署（Vite / SPA）

## 1) 用 Vercel 網站（最快）
1. 把專案推到 GitHub
2. Vercel → Add New → Project → 匯入 Repo
3. 會自動偵測為 Vite：Build=`npm run build`、Output=`dist`
4. 若要啟用 AI/LLM：把 `.env.example` 需要的 Key 加到 Vercel 的 Environment Variables（不要 commit `.env`）
5. Deploy

## 2) SPA 重新整理不 404（已處理）
本專案已加 `vercel.json` rewrite：所有路徑回到 `/index.html`。
