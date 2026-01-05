# Security Considerations

## ⚠️ Critical Security Issues

### 1. Frontend API Key Exposure

**Issue**: The LLM service (`src/services/llmService.ts`) uses `import.meta.env.VITE_LLM_API_KEY` to access API keys directly in the frontend code. Since Vite bundles all environment variables prefixed with `VITE_` into the frontend bundle, these keys are **publicly accessible** via browser developer tools.

**Risk Level**: 🔴 **CRITICAL**

**Impact**: 
- API keys can be extracted by any user
- Unauthorized API usage and potential cost abuse
- Quota exhaustion and service disruption
- Security breach if keys have other permissions

**Current Mitigation**: 
- The code falls back to mock responses when no API key is provided
- This prevents the app from failing but doesn't solve the security issue

### Recommended Solutions

#### Option 1: Backend Proxy (Recommended for Production)

Create a backend API proxy that handles LLM requests:

```
Frontend → Your Backend API → LLM Service
```

**Implementation Steps**:

1. Create a backend endpoint (e.g., `/api/llm/generate`)
2. Store API keys securely on the backend (environment variables, secret manager)
3. Frontend sends requests to your backend
4. Backend validates requests, adds API key, forwards to LLM service
5. Backend returns response to frontend

**Benefits**:
- API keys never exposed to frontend
- Rate limiting and request validation
- Request logging and monitoring
- Additional security layers (authentication, CORS)

**Example Backend (Express.js)**:

```javascript
// backend/routes/llm.js
app.post('/api/llm/generate', authenticateUser, async (req, res) => {
  const { prompt } = req.body;
  
  // Validate and sanitize input
  if (!prompt || prompt.length > 1000) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }
  
  try {
    // Use backend-only API key
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'LLM service unavailable' });
  }
});
```

**Frontend Changes**:

```typescript
// src/services/llmService.ts
async function callLLM(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/llm/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('LLM API Error:', error);
    return '';
  }
}
```

#### Option 2: Ollama (Local LLM - Best for Development)

Use Ollama to run LLMs locally without any API keys:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download model
ollama pull llama3.2

# Run (automatically starts server)
ollama serve
```

**Configuration** (already supported in the codebase):

```env
VITE_LLM_PROVIDER=ollama
VITE_LLM_MODEL=llama3.2:3b
# No API key needed!
```

**Benefits**:
- No API costs
- Complete privacy (no data sent to external services)
- Works offline
- No API key management needed

**Drawbacks**:
- Requires local installation
- Uses local compute resources
- May be slower than cloud APIs

#### Option 3: Serverless Functions (Middle Ground)

Deploy serverless functions (Vercel, Netlify, Cloudflare Workers) as a lightweight backend:

```javascript
// api/llm-generate.js (Vercel Serverless Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { prompt } = req.body;
  
  // API key stored in Vercel environment variables (secure)
  const response = await fetch(process.env.LLM_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
  
  const data = await response.json();
  res.json(data);
}
```

### 2. Hardcoded Test Credentials

**Issue**: Test credentials are hardcoded in `src/App.tsx`:
- `admin` / `admin123`
- `client` / `client123`  
- `staff` / `staff123`

**Risk Level**: 🟡 **MEDIUM** (acceptable for demo, unacceptable for production)

**Recommended Solutions**:
1. Use a proper authentication service (Auth0, Firebase Auth, AWS Cognito)
2. Implement JWT-based authentication with secure backend
3. Add environment-based feature flags to disable demo accounts in production

### Implementation Priority

| Priority | Item | Effort | Security Impact |
|----------|------|--------|-----------------|
| P0 | Document the security issue | ✅ Done | Medium |
| P0 | Add fallback to mock responses when no key | ✅ Already implemented | Low |
| P1 | Implement backend proxy OR switch to Ollama | High | 🔴 Critical |
| P2 | Replace hardcoded credentials with real auth | High | Medium |
| P3 | Add rate limiting and request validation | Medium | Medium |

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Ollama Documentation](https://ollama.ai/)
