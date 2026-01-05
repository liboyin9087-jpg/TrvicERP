# 未來優化與擴展建議 Future Enhancements

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

本文件記錄了 TrvicERP 專案的未來優化方向和擴展建議。

## 🌦 天氣資訊整合

導覽 App 目前提到天氣資訊功能，建議整合以下免費 API：

### OpenWeatherMap (推薦)
```typescript
// 範例整合
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function getWeather(city: string) {
  const response = await fetch(
    `${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=zh_tw`
  );
  return response.json();
}
```

**註冊**: https://openweathermap.org/api (免費方案: 1,000 calls/day)

### 其他選項
- **WeatherAPI.com** - 免費方案: 1M calls/month
- **Tomorrow.io** - 精確預報
- **Open-Meteo** - 完全免費，無需 API key

### 實作建議
1. 在 `.env.example` 新增 `VITE_WEATHER_API_KEY`
2. 建立 `src/services/weatherService.ts`
3. 在導覽 App 中顯示當日天氣和未來 5 天預報
4. 新增天氣圖示和溫度顯示

## 🗄 後端 API 整合

目前使用 `constants/` 中的 DEMO 資料，建議未來整合真實後端：

### 選項 A: 傳統後端 (推薦用於複雜業務邏輯)

**Node.js + Express + Prisma + PostgreSQL**
```bash
# 後端專案結構
backend/
├── src/
│   ├── routes/        # API 路由
│   ├── controllers/   # 業務邏輯
│   ├── services/      # 服務層
│   └── prisma/        # 資料庫 schema
```

**技術選擇**:
- **Node.js + TypeScript** - 與前端語言一致
- **Prisma** - 現代化 ORM，類型安全
- **PostgreSQL** - 強大的關聯式資料庫
- **Express.js** - 輕量級 Web 框架

### 選項 B: BaaS (Backend as a Service) - 快速開發

#### Supabase (推薦)
```typescript
// 範例: Supabase 整合
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// 查詢團期資料
const { data: tours } = await supabase
  .from('tours')
  .select('*')
  .eq('status', 'active');
```

**優點**:
- 內建認證系統 (支援 JWT, OAuth)
- Real-time 訂閱功能
- 檔案儲存
- Row Level Security (RLS)
- 免費方案慷慨

**註冊**: https://supabase.com

#### Firebase (Google 生態系)
```typescript
// 範例: Firebase 整合
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

**優點**:
- 完整的 Google 服務整合
- Firebase Authentication
- Cloud Functions
- Firebase Hosting

### 資料持久化建議

目前需要持久化的資料：
1. **團期管理** - 日期、價格、庫存
2. **訂單追蹤** - 客戶資訊、訂單狀態
3. **使用者資料** - 角色、權限
4. **旅遊配置** - 客製化選項、AI 生成記錄

## 🔐 認證系統升級

目前使用簡單的帳密登入，建議升級：

### JWT (JSON Web Tokens)
```typescript
// 範例架構
// 登入時生成 token
const token = jwt.sign(
  { userId, role },
  import.meta.env.VITE_JWT_SECRET,
  { expiresIn: '7d' }
);

// 前端儲存在 localStorage 或 httpOnly cookie
localStorage.setItem('auth_token', token);

// API 請求時驗證
fetch('/api/tours', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### OAuth 2.0 / Social Login
使用 Supabase Auth 或 Auth0 支援：
- Google 登入
- GitHub 登入
- Facebook 登入
- 企業 SSO (Single Sign-On)

### 多因素認證 (MFA)
對於 ADMIN/BOSS 角色，建議啟用：
- SMS 驗證碼
- Authenticator App (Google Authenticator, Authy)
- Email 驗證

## 🤖 AI 功能擴充

目前 AI 主要用於文案生成，可擴展：

### 多語言支援
```typescript
// 支援語言清單
const SUPPORTED_LANGUAGES = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
};

// 根據語言生成文案
function generateProposal(config: TravelConfig, language: string) {
  const prompt = getPromptByLanguage(language);
  return llmService.generate(prompt);
}
```

### 圖片描述 (Llama Vision)
```typescript
// 使用 Llama 3.2 Vision 模型
async function analyzePhoto(imageUrl: string) {
  return await llmService.generateWithImage({
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
    prompt: '描述這張旅遊照片的景點和氛圍',
    image: imageUrl,
  });
}
```

**應用場景**:
- 自動生成景點照片說明
- 識別食物照片並推薦相似餐廳
- 分析旅遊照片並建議行程

### Prompt 工程優化

在 `llmService.ts` 加強 system prompt：

```typescript
const SYSTEM_PROMPTS = {
  proposal: `你是一位資深旅遊顧問，專精於企業獎勵旅遊規劃。
請根據以下客戶資料生成吸引人的提案：
- 使用專業但溫暖的語氣
- 強調獨特價值和情感連結
- 控制在 100 字內
- 使用繁體中文`,
  
  competitive: `你是一位精通市場行銷的文案專家。
請撰寫一句幽默但專業的競品比較文案：
- 略帶諷刺但不失禮貌
- 突出我方優勢
- 50 字內
- 繁體中文`,
};
```

### AI 快取與優化
```typescript
// 實作 AI 回應快取
const aiCache = new Map<string, string>();

async function generateWithCache(prompt: string) {
  const cacheKey = hashPrompt(prompt);
  
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey);
  }
  
  const result = await llmService.generate(prompt);
  aiCache.set(cacheKey, result);
  
  return result;
}
```

## 📱 行動端體驗優化

### PWA 測試清單

#### iOS 測試
- [ ] Safari 中「加入主畫面」功能
- [ ] App 圖示顯示正確
- [ ] 啟動畫面 (splash screen)
- [ ] 離線模式運作
- [ ] Push 通知（iOS 16.4+ 支援）

#### Android 測試
- [ ] Chrome 中「安裝應用程式」提示
- [ ] App 圖示和名稱
- [ ] 啟動畫面
- [ ] 離線模式
- [ ] Push 通知

### QR Code 部署測試

建議使用 QR code 讓測試者快速掃描部署版：

```bash
# 安裝 qrcode-terminal
npm install -g qrcode-terminal

# 生成部署 URL 的 QR code
qrcode-terminal https://your-trvicerp.vercel.app
```

或在 README 中加入：
```markdown
## 📱 快速試用

掃描 QR Code 在手機上試用：

![QR Code](screenshots/deploy-qr-code.png)

或直接訪問: https://your-trvicerp.vercel.app
```

### 原生 App 功能

如果使用 Capacitor 打包原生 App，可新增：
- **相機存取** - 拍照上傳旅遊照片
- **地理位置** - 顯示附近景點
- **推播通知** - 行程提醒、天氣警報
- **本地儲存** - 離線瀏覽行程

## 🧪 測試策略

雖然目前沒有測試框架，但建議逐步建立：

### Phase 1: 單元測試 (Vitest)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// 範例: src/components/__tests__/VisualCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VisualCard from '../VisualCard';

describe('VisualCard', () => {
  it('renders card with title', () => {
    render(<VisualCard title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Phase 2: 整合測試 (React Testing Library)
測試組件互動和狀態管理

### Phase 3: E2E 測試 (Playwright)
```bash
npm install -D @playwright/test
```

```typescript
// 範例: tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('admin can login and access dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## 🎨 狀態管理

如果應用變得更複雜，考慮引入狀態管理：

### Zustand (推薦 - 輕量級)
```typescript
import create from 'zustand';

interface TravelStore {
  config: TravelConfig;
  updateConfig: (config: Partial<TravelConfig>) => void;
}

const useTravelStore = create<TravelStore>((set) => ({
  config: {},
  updateConfig: (config) => 
    set((state) => ({ config: { ...state.config, ...config } })),
}));
```

### Context + useReducer (內建方案)
適合中小型應用，無需額外依賴

## 📊 效能優化

### 大型 LLM 處理
```typescript
// Loading 狀態
const [isGenerating, setIsGenerating] = useState(false);

async function generateProposal() {
  setIsGenerating(true);
  try {
    const result = await llmService.generate(prompt);
    // 處理結果
  } finally {
    setIsGenerating(false);
  }
}

// UI 顯示
{isGenerating && <Spinner text="AI 正在生成文案..." />}
```

### 程式碼分割
```typescript
// 使用 React.lazy 延遲載入大組件
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

### 圖片優化
- 使用 WebP 格式
- Lazy loading: `<img loading="lazy" />`
- 響應式圖片: `<picture>` + `srcset`

## 🚀 CI/CD 建議

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      # 部署到 Vercel
```

### 自動化測試
```yaml
- name: Run tests
  run: npm test
  
- name: E2E tests
  run: npx playwright test
```

## 📈 監控與分析

### 使用者行為分析
- **Google Analytics 4** - 免費
- **Plausible** - 隱私友善
- **Mixpanel** - 進階分析

### 錯誤追蹤
- **Sentry** - 免費方案 5K errors/month
- **LogRocket** - Session replay

### 效能監控
- **Vercel Analytics** - 整合在 Vercel 部署
- **Lighthouse CI** - 自動化效能測試

---

## English

This document outlines future optimization directions and expansion suggestions for the TrvicERP project.

## 🌦 Weather Information Integration

The Navigator App currently mentions weather information. Recommended free APIs:

### OpenWeatherMap (Recommended)
```typescript
// Example integration
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function getWeather(city: string) {
  const response = await fetch(
    `${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=en`
  );
  return response.json();
}
```

**Sign up**: https://openweathermap.org/api (Free plan: 1,000 calls/day)

### Other Options
- **WeatherAPI.com** - Free plan: 1M calls/month
- **Tomorrow.io** - Accurate forecasts
- **Open-Meteo** - Completely free, no API key needed

### Implementation Suggestions
1. Add `VITE_WEATHER_API_KEY` to `.env.example`
2. Create `src/services/weatherService.ts`
3. Display current weather and 5-day forecast in Navigator App
4. Add weather icons and temperature display

## 🗄 Backend API Integration

Currently using DEMO data from `constants/`, recommend future real backend integration:

### Option A: Traditional Backend (Recommended for Complex Business Logic)

**Node.js + Express + Prisma + PostgreSQL**
```bash
# Backend project structure
backend/
├── src/
│   ├── routes/        # API routes
│   ├── controllers/   # Business logic
│   ├── services/      # Service layer
│   └── prisma/        # Database schema
```

**Technology Choices**:
- **Node.js + TypeScript** - Consistent with frontend
- **Prisma** - Modern ORM, type-safe
- **PostgreSQL** - Powerful relational database
- **Express.js** - Lightweight web framework

### Option B: BaaS (Backend as a Service) - Rapid Development

#### Supabase (Recommended)
```typescript
// Example: Supabase integration
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Query tour data
const { data: tours } = await supabase
  .from('tours')
  .select('*')
  .eq('status', 'active');
```

**Benefits**:
- Built-in authentication (JWT, OAuth)
- Real-time subscriptions
- File storage
- Row Level Security (RLS)
- Generous free tier

**Sign up**: https://supabase.com

#### Firebase (Google Ecosystem)
```typescript
// Example: Firebase integration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

**Benefits**:
- Full Google services integration
- Firebase Authentication
- Cloud Functions
- Firebase Hosting

## 🔐 Authentication System Upgrade

Current simple username/password login should be upgraded:

### JWT (JSON Web Tokens)
```typescript
// Example architecture
// Generate token on login
const token = jwt.sign(
  { userId, role },
  import.meta.env.VITE_JWT_SECRET,
  { expiresIn: '7d' }
);

// Store in localStorage or httpOnly cookie
localStorage.setItem('auth_token', token);

// Verify on API requests
fetch('/api/tours', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### OAuth 2.0 / Social Login
Use Supabase Auth or Auth0 to support:
- Google login
- GitHub login
- Facebook login
- Enterprise SSO (Single Sign-On)

## 🤖 AI Feature Expansion

Currently AI is mainly for copy generation, can be expanded:

### Multi-language Support
```typescript
// Supported languages
const SUPPORTED_LANGUAGES = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
};
```

### Image Description (Llama Vision)
```typescript
// Use Llama 3.2 Vision model
async function analyzePhoto(imageUrl: string) {
  return await llmService.generateWithImage({
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
    prompt: 'Describe this travel photo',
    image: imageUrl,
  });
}
```

## 📱 Mobile Experience Optimization

### PWA Testing Checklist

#### iOS Testing
- [ ] "Add to Home Screen" in Safari
- [ ] App icon displays correctly
- [ ] Splash screen
- [ ] Offline mode works
- [ ] Push notifications (iOS 16.4+ support)

#### Android Testing
- [ ] "Install app" prompt in Chrome
- [ ] App icon and name
- [ ] Splash screen
- [ ] Offline mode
- [ ] Push notifications

### QR Code Deployment Testing

Use QR code for quick testing access:

```bash
# Install qrcode-terminal
npm install -g qrcode-terminal

# Generate QR code for deployment URL
qrcode-terminal https://your-trvicerp.vercel.app
```

## 🧪 Testing Strategy

### Phase 1: Unit Tests (Vitest)
### Phase 2: Integration Tests (React Testing Library)
### Phase 3: E2E Tests (Playwright)

## 🎨 State Management

Consider introducing state management for complex apps:
- **Zustand** (Recommended - lightweight)
- **Context + useReducer** (Built-in)

## 📊 Performance Optimization

- Loading states for LLM
- Code splitting with React.lazy
- Image optimization

## 🚀 CI/CD Recommendations

- GitHub Actions
- Automated testing
- Deployment automation

## 📈 Monitoring & Analytics

- Google Analytics 4
- Sentry for error tracking
- Vercel Analytics for performance
