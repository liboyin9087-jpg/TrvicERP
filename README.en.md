# TrvicERP 🌏

Travel Industry Integration Tool - Tesla-style Travel Configurator + ERP Team Control System + Tourist Navigation App

![Login Page](https://github.com/user-attachments/assets/96721774-6154-47de-83ef-4aebfe1e8a02)

[繁體中文](README.md) | **English**

## ✨ New Feature: Open Source LLM Integration (Llama 3.2 Support)

This project has been upgraded to support multiple open source LLM models, **specially optimized for Llama 3.2**:

- 🦙 **Llama 3.2** - Optimized for this project, excellent Traditional Chinese performance (**Highly Recommended**)
- 🤗 **Hugging Face API** - Free access to open source models
- 🐙 **GitHub Models** - Free Llama access through GitHub
- 🏠 **Ollama** - Run completely free locally

> 💡 **Why Choose Llama 3.2?** This project needs to generate short Traditional Chinese travel copy (<100 words), Llama 3.2 3B achieves the best balance in speed, quality and resource consumption. See [LLM Selection Guide](LLM_RECOMMENDATION.md)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure LLM (Choose One)

#### Option A: Use Ollama Local Running (Recommended, Completely Free)

```bash
# 1. Install Ollama
# macOS/Linux: curl -fsSL https://ollama.ai/install.sh | sh
# Windows: Download installer from https://ollama.ai/download

# 2. Download Llama model
ollama pull llama3.2

# 3. Start Ollama (runs in background)
ollama serve

# 4. Set environment variables (default, no need to modify .env)
# VITE_LLM_PROVIDER=ollama
# VITE_LLM_MODEL=llama3.2
```

#### Option B: Use GitHub Models (Free and Powerful)

```bash
# 1. Go to https://github.com/marketplace/models
# 2. Select Llama model and enable
# 3. Generate GitHub Token: https://github.com/settings/tokens
#    (requires 'repo' permission)

# 4. Configure .env
cp .env.example .env

# Edit .env:
# VITE_LLM_PROVIDER=github-models
# VITE_LLM_API_KEY=ghp_your_GitHub_Token
# VITE_LLM_MODEL=meta-llama/Llama-3.2-90B-Vision-Instruct
```

#### Option C: Use Hugging Face (Free but May Be Slower)

```bash
# 1. Register at https://huggingface.co
# 2. Generate Token: https://huggingface.co/settings/tokens

# 3. Configure .env
cp .env.example .env

# Edit .env:
# VITE_LLM_PROVIDER=huggingface
# VITE_LLM_API_KEY=hf_your_Token
# VITE_LLM_MODEL=meta-llama/Llama-3.2-3B-Instruct
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build Production Version

```bash
npm run build
npm run preview
```

## 🎯 Three Main Feature Modules

### 1. **Tesla-style Configurator** (CLIENT/HR Role)
- Visual option cards
- Dynamic price calculation
- AI proposal generation (using Llama)
- Competitive analysis comparison

### 2. **ERP Team Control Dashboard** (ADMIN/BOSS Role)
- Tour period management
- Real-time inventory monitoring
- Price adjustment
- Order tracking

### 3. **Tourist Navigation App** (EMPLOYEE/Tour Guide Role)
- Today's itinerary timeline
- Weather information
- Emergency contacts
- PWA support

## 🔐 Test Accounts

> ⚠️ **Security Notice**: The following account passwords are for testing purposes only and should not be used in production environments. When deploying to production, please change default passwords and implement proper authentication mechanisms (such as JWT, OAuth 2.0, etc.).

| Role | Username | Password | Features |
|------|----------|----------|----------|
| Admin | admin | admin123 | ERP Dashboard |
| Client/HR | client | client123 | Configurator |
| Tour Guide | staff | staff123 | Navigation App |

> 💡 **Recommendation**: Production environments should integrate enterprise-level authentication services (such as Supabase Auth, Auth0, Firebase Authentication) or implement JWT token authentication systems.

## 📁 Project Structure

```
TrvicERP/
├── src/
│   ├── components/          # React components
│   │   ├── Icons.tsx        # SVG icon library
│   │   ├── VisualCard.tsx   # Option cards
│   │   ├── RollingPrice.tsx # Dynamic pricing
│   │   └── ...
│   ├── services/            # Service layer
│   │   ├── llmService.ts    # LLM/AI service (Llama)
│   │   └── erpService.ts    # ERP business logic
│   ├── constants/           # Constants & DEMO data
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Main application
│   └── index.tsx            # Entry point
├── public/                  # Static assets
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker
├── .env.example             # Environment variables example
├── package.json
└── README.md
```

## 🛠 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling system
- **Vite** - Build tool
- **Llama 3.2/4** - Open source AI models
- **PWA** - Progressive Web App

## 🦙 Supported Llama Models

### GitHub Models (Recommended)
- `meta-llama/Llama-3.2-90B-Vision-Instruct` - Large vision model (most powerful)
- `meta-llama/Llama-3.2-11B-Vision-Instruct` - Medium vision model
- `meta-llama/Meta-Llama-3.1-405B-Instruct` - Ultra-large instruction model

### Ollama (Local)
- `llama3.2` - Standard version
- `llama3.2:3b` - Lightweight version (3B parameters)
- `llama3.2:1b` - Ultra-lightweight version (1B parameters)

### Hugging Face
- `meta-llama/Llama-3.2-3B-Instruct` - Small instruction model
- `meta-llama/Llama-3.2-1B-Instruct` - Tiny instruction model

## 🌐 Deploy as App

### Deploy as PWA (Progressive Web App)

This project is configured with PWA support and can be installed on mobile devices:

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to any static hosting service:
   - **Vercel**: `vercel deploy` or [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/liboyin9087-jpg/TrvicERP)
   - **Netlify**: `netlify deploy` or [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/liboyin9087-jpg/TrvicERP)
   - **GitHub Pages**: Push to `gh-pages` branch
   - **Firebase Hosting**: `firebase deploy`

3. Users can "Add to Home Screen" in mobile browsers

### Android/iOS Native App

If you need to package as a native app:

```bash
# Using Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npm run build
npx cap copy
npx cap open android  # or ios
```

## 🤝 Contributing

We welcome Issues and Pull Requests! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔮 Future Enhancements

This project is continuously improving. Future plans include:
- 🌦 Weather API Integration (OpenWeatherMap)
- 🗄 Backend API & Data Persistence (Supabase/Firebase)
- 🔐 Enterprise Authentication (JWT, OAuth 2.0)
- 🌍 Multi-language AI Support
- 🧪 Complete Testing Framework (Vitest, Playwright)
- 📊 Performance Monitoring & Analytics

See [FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md) for detailed plans.

## 📚 Documentation

- [Development Setup](DEVELOPMENT.md) - Quick development environment setup guide
- [LLM Selection Guide](LLM_RECOMMENDATION.md) - Detailed AI model selection guide
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- [Future Enhancements](FUTURE_ENHANCEMENTS.md) - Feature expansion suggestions

## 📝 License

MIT License

---

**Built by TrvicERP Team ❤️ Powered by Llama 🦙**
