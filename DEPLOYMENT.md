# 部署配置指南

## 统一部署方案：Vercel + Supabase

本项目使用 **Vercel** 作为前端部署平台，**Supabase** 作为后端数据库和实时服务。

---

## 🚀 Vercel 部署配置

### 自动部署设置

1. **连接 GitHub 仓库**
   - 在 Vercel 控制台连接 `https://github.com/liboyin9087-jpg/TrvicERP.git`
   - 启用自动部署：每次推送到 `main` 分支自动部署

2. **环境变量配置**

   在 Vercel 项目设置中添加以下环境变量：

   ```env
   # Supabase 配置
   VITE_SUPABASE_URL=https://ktsxyjkoiwcvpddfvgns.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # 后端 API（如果使用独立后端）
   VITE_API_URL=https://your-backend-api.com

   # 外部 API 配置
   VITE_TDX_CLIENT_ID=liboyin9087-96e69e28-fb9e-4c25
   VITE_TDX_CLIENT_SECRET=4c94f8a3-5896-48b7-8a4f-bc67c6924959
   VITE_CWA_API_KEY=CWA-319AFA4F-6F57-4109-BDD6-F8DB65789EC5
   VITE_SILICONFLOW_API_KEY=sk-datneleaegsucsfbqrlsdgzppzcoxhzgeurtseabxeposdvg

   # 可选配置
   VITE_USE_MOCK=false
   VITE_WS_URL=wss://your-websocket-url.com
   ```

3. **构建配置**

   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### 自动更新机制

- **Git 自动部署**: 推送到 `main` 分支自动触发部署
- **PWA 自动更新**: Service Worker 配置为 `autoUpdate` 模式
- **缓存策略**: 静态资源使用长期缓存，Service Worker 立即更新

---

## 🗄️ Supabase 配置

### 数据库配置

1. **项目设置**
   - URL: `https://ktsxyjkoiwcvpddfvgns.supabase.co`
   - 使用 ANON_KEY 进行客户端访问（已配置 RLS）

2. **实时功能**
   - 自动重连：已配置
   - 心跳间隔：30 秒
   - 事件限制：10 events/second

3. **认证配置**
   - 会话持久化：启用
   - 自动刷新 Token：启用
   - PKCE 流程：启用（提高安全性）

### 自动更新功能

- **实时同步**: 使用 Supabase Realtime 自动同步数据变更
- **自动重连**: 连接断开时自动重连
- **状态监听**: 自动监听连接状态变化

---

## 📦 部署流程

### 1. 首次部署

```bash
# 1. 确保代码已推送到 GitHub
git push origin main

# 2. Vercel 会自动检测并部署
# 3. 在 Vercel 控制台配置环境变量
# 4. 等待部署完成
```

### 2. 更新部署

```bash
# 1. 修改代码
# 2. 提交并推送
git add .
git commit -m "feat: 更新功能"
git push origin main

# 3. Vercel 自动部署新版本
# 4. PWA 自动更新（用户下次访问时）
```

### 3. 验证部署

- 检查 Vercel 部署状态
- 验证环境变量是否正确
- 测试应用功能
- 检查 Supabase 连接

---

## 🔧 故障排除

### Vercel 部署问题

1. **构建失败**
   - 检查 `package.json` 依赖
   - 查看构建日志
   - 确认 Node.js 版本

2. **环境变量未生效**
   - 确认变量名以 `VITE_` 开头
   - 重新部署以应用新变量
   - 检查变量值是否正确

### Supabase 连接问题

1. **连接失败**
   - 检查 URL 和 ANON_KEY
   - 确认网络连接
   - 查看浏览器控制台错误

2. **实时功能不工作**
   - 检查 Supabase Realtime 是否启用
   - 确认数据库表有 Realtime 权限
   - 查看连接状态日志

---

## 📝 注意事项

1. **只使用一个部署方案**
   - ✅ Vercel（前端）+ Supabase（后端）
   - ❌ 不要同时配置多个部署平台

2. **环境变量安全**
   - 不要在代码中硬编码密钥
   - 使用 Vercel 环境变量管理
   - 区分开发/预览/生产环境

3. **自动更新**
   - Git 推送 → Vercel 自动部署
   - Service Worker → PWA 自动更新
   - Supabase Realtime → 数据自动同步

---

## 🔗 相关链接

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Repository: https://github.com/liboyin9087-jpg/TrvicERP
