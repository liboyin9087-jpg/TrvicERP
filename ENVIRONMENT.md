# Environment Variables

This document lists all environment variables used by the project.
Do not commit real secrets. Use `.env.local` or platform secrets.

## Frontend (Vite) - `.env.local`

```
VITE_API_URL=http://localhost:4000
VITE_AI_API_URL=http://localhost:4000
VITE_WS_URL=wss://your_ws_url_here
VITE_LINE_API_URL=http://localhost:4000/api/v1/line
VITE_APP_URL=http://localhost:4000
VITE_USE_MOCK=true

# AI key for frontend-only features
GEMINI_API_KEY=your_gemini_api_key_here

# Weather
VITE_WEATHER_PROVIDER=openweathermap
VITE_WEATHER_API_KEY=your_openweather_api_key_here
VITE_WEATHER_API_URL=https://api.openweathermap.org/data/2.5
```

## AI Server - `ai-server/.env`

```
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
GEMINI_DEFAULT_MAX_TOKENS=4000
GEMINI_GENERAL_MAX_TOKENS=1000
GEMINI_LEGAL_MAX_TOKENS=4000
GEMINI_MARKETING_MAX_TOKENS=10000
GOOGLE_API_KEY=your_gemini_api_key_here

SILICONFLOW_MODEL=deepseek-ai/DeepSeek-V3
SILICONFLOW_MARKETING_MODEL=Qwen/Qwen2.5-32B-Instruct
SILICONFLOW_MARKETING_TEMPERATURE=0.7
SILICONFLOW_MARKETING_MAX_TOKENS=10000
SILICONFLOW_API_KEY=your_siliconflow_key_here

# BFL / Flux image generation
BFL_BASE_URL=https://api.bfl.ml/v1
BFL_MODEL=flux-pro
BFL_API_STYLE=auto
BFL_API_KEY=your_bfl_api_key_here
```

## GitHub Actions Secrets (Vercel deploy)

```
VERCEL_TOKEN=***
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx
```

## One-click env check

```
npm run check:env
```
