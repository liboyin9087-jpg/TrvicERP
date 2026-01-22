# TrvicERP

Modern ERP for group travel operations with an Odoo-style draggable dashboard, AI Copilot, and PWA-ready frontend.

## Highlights

- **Odoo-style dashboard**: drag/resize widgets, add/remove from library, saved per role
- **AI Copilot**: Gemini 2.5 Flash for general tasks, Qwen2.5-32B for marketing copy
- **Function calling**: AI can navigate and update dashboard widgets
- **Marketing image generation**: Flux‑Pro (Black Forest Labs) with SiliconFlow-compatible API option
- **PWA-ready**: Vite + workbox

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **State**: Zustand
- **AI Server**: FastAPI (Python) + Gemini / SiliconFlow
- **Deployment**: Vercel (manual GitHub Actions workflow)

## Repository Structure

```
/
  App.tsx
  components/
  src/
  ai-server/
  vercel.json
  ENVIRONMENT.md
```

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

### AI Server

```bash
cd ai-server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Environment Variables

All required variables are documented in **ENVIRONMENT.md**.

You can also use the one-click checker:

```bash
npm run check:env
```

## AI Copilot Behavior

- **general**: Gemini 2.5 Flash (short responses)
- **legal**: Gemini 2.5 Flash (higher output limit)
- **marketing**: Qwen2.5-32B (SiliconFlow), plus optional image generation via Flux‑Pro

### Function Calling (Supported)

- `navigate`
- `showCustomerData`
- `showQuotation`
- `showItinerary`
- `setDashboardEditMode`
- `addDashboardWidget`
- `removeDashboardWidget`
- `updateDashboardWidget`
- `generateMarketingImage` (marketing mode)

## Deployment

### Vercel

This repo uses a **manual GitHub Actions workflow** for Vercel deployment.

Workflow: `.github/workflows/vercel-deploy.yml`

Required GitHub Secrets:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Run it from GitHub → **Actions** → **Vercel Deploy (Manual)**.

## Notes & Security

- **Do not commit secrets** to git.
- Store runtime secrets in `.env` / `.env.local` or platform secrets.
- `.vercel` is intentionally ignored.

## License

Proprietary – internal use only.
