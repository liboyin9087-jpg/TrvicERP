# TrvicERP Implementation Roadmap
## Actionable Technical & UX Enhancement Plan

**Version**: 1.0  
**Date**: 2026-02-01  
**Status**: Ready for Implementation  

---

## 🎯 Phase 1: Brand Unification & Design System (Weeks 1-4)

### 1.1 Brand Identity Consolidation

#### Task 1.1.1: Standardize Naming Across Codebase
**Priority**: HIGH  
**Effort**: 2 days  

```bash
# Files to update:
- package.json (name field)
- All component headers displaying brand name
- README.md (to be created)
- documentation files
- HTML title tags
```

**Acceptance Criteria:**
- All references use "TrvicERP" consistently
- Subtitle: "AI-Powered Travel Intelligence Platform"
- English: Trvic Enterprise Resource Planning
- Chinese: 創域旅遊管理系統

#### Task 1.1.2: Design and Implement New Logo
**Priority**: HIGH  
**Effort**: 3 days  

**Requirements:**
- SVG format for scalability
- Works on dark and light backgrounds
- Incorporates travel + technology theme
- Replace current `<Plane>` icon usage

**Files to modify:**
```typescript
// App.tsx - Line 330, 344, 545
// Replace Plane icon with new Logo component
<Logo className="w-6 h-6" />

// Create new component:
// src/components/shared/Logo.tsx
```

### 1.2 Unified Color System

#### Task 1.2.1: Consolidate Color Definitions
**Priority**: HIGH  
**Effort**: 2 days  

**Current Issues:**
- Multiple color systems: `brand`, `primary`, `trip`, `travel`
- Inconsistent usage across components
- CSS variables not following naming convention

**Action Items:**
```css
/* src/theme/colors.css */
/* Remove: trip, travel color systems */
/* Consolidate to: */
:root {
  /* Brand Colors - Primary Identity */
  --brand-50: #EBF5FF;
  --brand-500: #1F6FEB;  /* Ocean Blue - Professional & Trust */
  --brand-700: #0D47A1;
  
  /* Functional Colors - Module Differentiation */
  --color-revenue: #10B981;   /* Green - Financial metrics */
  --color-cost: #F59E0B;      /* Orange - Cost tracking */
  --color-customer: #8B5CF6;  /* Purple - CRM modules */
  --color-operations: #3B82F6; /* Blue - Operations */
  
  /* Semantic Colors - Status & Feedback */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Neutral Scale - Text, Borders, Backgrounds */
  --neutral-50: #FAFAFA;
  --neutral-900: #171717;
  --neutral-950: #0A0A0A;
}
```

**Files to Update:**
- `tailwind.config.js` - Simplify color system
- `index.css` - Update CSS variables
- All components using old color names

#### Task 1.2.2: Component Color Audit & Refactor
**Priority**: MEDIUM  
**Effort**: 3 days  

```bash
# Search and replace patterns:
text-trip-brand → text-brand-500
bg-travel-sunset → bg-[color-revenue/cost/etc]
border-primary → border-brand-500

# Run:
grep -r "text-trip" src/ components/
grep -r "bg-travel" src/ components/
```

### 1.3 Design System Documentation

#### Task 1.3.1: Create Design Tokens File
**Priority**: MEDIUM  
**Effort**: 1 day  

```typescript
// src/theme/design-tokens.ts
export const designTokens = {
  colors: { /* ... */ },
  spacing: { /* ... */ },
  typography: { /* ... */ },
  shadows: { /* ... */ },
  borderRadius: { /* ... */ },
  transitions: { /* ... */ },
} as const;
```

#### Task 1.3.2: Setup Storybook (Optional but Recommended)
**Priority**: LOW  
**Effort**: 2 days  

```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
npx storybook init
```

---

## 🏗️ Phase 2: Architecture Optimization (Weeks 5-8)

### 2.1 Feature-First Restructuring

#### Task 2.1.1: Create New Directory Structure
**Priority**: MEDIUM  
**Effort**: 1 day  

```bash
mkdir -p src/features/{dashboard,quotation,customer,session}
mkdir -p src/features/dashboard/{components,hooks,services,store,types}
mkdir -p src/shared/components/{atoms,molecules,organisms}
```

#### Task 2.1.2: Migrate Dashboard Module
**Priority**: MEDIUM  
**Effort**: 3 days  

**Move Files:**
```
components/dashboard/* → src/features/dashboard/components/
src/store/useDashboardStore.ts → src/features/dashboard/store/
```

**Create Feature Index:**
```typescript
// src/features/dashboard/index.ts
export { DraggableDashboard } from './components/DraggableDashboard';
export { useDashboardStore } from './store/useDashboardStore';
export type { Widget, WidgetType } from './types';
```

### 2.2 API Layer Standardization

#### Task 2.2.1: Create Unified API Client
**Priority**: HIGH  
**Effort**: 2 days  

```typescript
// src/core/api/client.ts
import { API_BASE_URL } from '@/config';

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

class APIClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<Result<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  // Convenience methods
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient(API_BASE_URL);
```

#### Task 2.2.2: Create Feature-Specific API Services
**Priority**: MEDIUM  
**Effort**: 1 day per module  

```typescript
// src/features/quotation/services/quotationAPI.ts
import { apiClient } from '@/core/api/client';
import type { Quotation, CreateQuotationDTO } from '../types';

export const quotationAPI = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<Quotation[]>('/api/quotations', params),
    
  getById: (id: string) =>
    apiClient.get<Quotation>(`/api/quotations/${id}`),
    
  create: (data: CreateQuotationDTO) =>
    apiClient.post<Quotation>('/api/quotations', data),
    
  update: (id: string, data: Partial<Quotation>) =>
    apiClient.put<Quotation>(`/api/quotations/${id}`, data),
    
  delete: (id: string) =>
    apiClient.delete(`/api/quotations/${id}`),
};
```

### 2.3 Testing Infrastructure

#### Task 2.3.1: Setup Testing Framework
**Priority**: HIGH  
**Effort**: 1 day  

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

#### Task 2.3.2: Write Tests for Core Business Logic
**Priority**: HIGH  
**Effort**: Ongoing (1 day per module)  

**Priority Order:**
1. Authentication service
2. API client
3. Quotation calculation logic
4. Cost analysis functions
5. Dashboard state management

**Example Test:**
```typescript
// src/features/quotation/services/__tests__/quotationService.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotalCost } from '../quotationService';

describe('QuotationService', () => {
  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1 },
      ];
      
      const total = calculateTotalCost(items);
      expect(total).toBe(250);
    });
    
    it('should handle empty items array', () => {
      const total = calculateTotalCost([]);
      expect(total).toBe(0);
    });
  });
});
```

### 2.4 CI/CD Pipeline

#### Task 2.4.1: Create GitHub Actions Workflow
**Priority**: HIGH  
**Effort**: 1 day  

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run build:check
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Add deployment script here
          echo "Deploying to production..."
```

---

## 💎 Phase 3: Feature Completeness (Weeks 9-16)

### 3.1 Financial Management Module

#### Task 3.1.1: Database Schema Design
**Priority**: HIGH  
**Effort**: 2 days  

```python
# backend/app/models/financial.py
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

class TransactionType(str, enum.Enum):
    RECEIVABLE = "receivable"
    PAYABLE = "payable"
    PAYMENT = "payment"
    REFUND = "refund"

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    
    id = Column(Integer, primary_key=True)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="TWD")
    exchange_rate = Column(Numeric(10, 4), default=1.0)
    reference_id = Column(Integer, nullable=True)  # Order/Session ID
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    status = Column(String(20), default="pending")
    due_date = Column(DateTime, nullable=True)
    paid_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id"))
    pdf_url = Column(String(500), nullable=True)
    status = Column(String(20), default="draft")  # draft, sent, paid, overdue
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Task 3.1.2: API Endpoints
**Priority**: HIGH  
**Effort**: 3 days  

```python
# backend/app/api/financial.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..schemas.financial import (
    FinancialTransactionCreate,
    FinancialTransactionResponse,
    InvoiceCreate,
    InvoiceResponse
)

router = APIRouter(prefix="/api/financial", tags=["financial"])

@router.get("/transactions", response_model=List[FinancialTransactionResponse])
async def list_transactions(
    skip: int = 0,
    limit: int = 100,
    type: Optional[TransactionType] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Implementation
    pass

@router.post("/transactions", response_model=FinancialTransactionResponse)
async def create_transaction(
    transaction: FinancialTransactionCreate,
    db: Session = Depends(get_db)
):
    # Implementation
    pass

@router.post("/invoices/generate")
async def generate_invoice(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    # Generate PDF invoice using @react-pdf/renderer
    pass

@router.get("/reports/aging")
async def get_aging_report(
    db: Session = Depends(get_db)
):
    # Accounts receivable/payable aging report
    pass
```

#### Task 3.1.3: Frontend Components
**Priority**: HIGH  
**Effort**: 4 days  

**Create Components:**
```typescript
// src/features/financial/components/
- TransactionList.tsx
- TransactionForm.tsx
- InvoiceViewer.tsx
- AgingReport.tsx
- FinancialDashboard.tsx
```

### 3.2 Supplier Management System

#### Task 3.2.1: Supplier Database & API
**Priority**: HIGH  
**Effort**: 3 days  

```python
# backend/app/models/supplier.py
class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50))  # hotel, airline, transport, guide
    contact_person = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    rating = Column(Numeric(3, 2), default=0.0)
    total_orders = Column(Integer, default=0)
    payment_terms = Column(String(50))  # net30, net60, prepaid
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contracts = relationship("SupplierContract", back_populates="supplier")
    reviews = relationship("SupplierReview", back_populates="supplier")

class SupplierContract(Base):
    __tablename__ = "supplier_contracts"
    
    id = Column(Integer, primary_key=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    contract_number = Column(String(50), unique=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    terms = Column(Text)
    document_url = Column(String(500))
    status = Column(String(20), default="active")
```

#### Task 3.2.2: Supplier Portal UI
**Priority**: MEDIUM  
**Effort**: 4 days  

**Features:**
- Supplier directory with search/filter
- Rating & review system
- Contract management
- Purchase order tracking

### 3.3 Enhanced AI Capabilities

#### Task 3.3.1: Voice Input/Output Integration
**Priority**: MEDIUM  
**Effort**: 3 days  

```typescript
// src/features/ai/hooks/useVoiceInput.ts
import { useState, useCallback } from 'react';

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'zh-TW';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
    
    recognition.start();
  }, []);
  
  return { isListening, transcript, startListening };
}
```

#### Task 3.3.2: Image Understanding (Passport OCR)
**Priority**: MEDIUM  
**Effort**: 4 days  

**Integration Options:**
- Google Vision API
- Azure Computer Vision
- Tesseract.js (open source)

```typescript
// src/features/passport/services/ocrService.ts
import Tesseract from 'tesseract.js';

export async function extractPassportData(imageFile: File) {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');
  
  // Parse passport data using regex patterns
  const passportNumber = text.match(/[A-Z]{2}\d{8}/)?.[0];
  const expiryDate = text.match(/\d{2}[A-Z]{3}\d{2}/)?.[0];
  
  return {
    passportNumber,
    expiryDate,
    rawText: text,
  };
}
```

---

## 📊 Phase 4: Monitoring & Analytics (Weeks 17-20)

### 4.1 Error Tracking Setup

#### Task 4.1.1: Integrate Sentry
**Priority**: HIGH  
**Effort**: 1 day  

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 4.2 Performance Monitoring

#### Task 4.2.1: Setup Web Vitals Tracking
**Priority**: MEDIUM  
**Effort**: 0.5 day  

```typescript
// src/lib/analytics/webVitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to your analytics service
  console.log(metric);
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### 4.3 User Analytics

#### Task 4.3.1: Integrate Analytics Platform
**Priority**: MEDIUM  
**Effort**: 1 day  

**Options:**
- Mixpanel (recommended for product analytics)
- Amplitude
- PostHog (open source)

```typescript
// src/lib/analytics/tracker.ts
import mixpanel from 'mixpanel-browser';

mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN);

export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    mixpanel.track(event, properties);
  },
  
  identify: (userId: string, traits?: Record<string, any>) => {
    mixpanel.identify(userId);
    if (traits) mixpanel.people.set(traits);
  },
  
  page: (name: string) => {
    mixpanel.track('Page Viewed', { page: name });
  },
};
```

---

## 🎨 Phase 5: UI/UX Polish (Weeks 21-24)

### 5.1 Accessibility Improvements

#### Task 5.1.1: ARIA Labels Audit
**Priority**: HIGH  
**Effort**: 2 days  

**Checklist:**
- [ ] All buttons have accessible labels
- [ ] All form inputs have associated labels
- [ ] All images have alt text
- [ ] All links have descriptive text
- [ ] Keyboard navigation works for all interactive elements

#### Task 5.1.2: Color Contrast Verification
**Priority**: HIGH  
**Effort**: 1 day  

```bash
# Use axe-core for automated testing
npm install --save-dev @axe-core/react
```

```typescript
// src/main.tsx (development only)
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### 5.2 Mobile Responsiveness

#### Task 5.2.1: Mobile Layout Audit
**Priority**: MEDIUM  
**Effort**: 3 days  

**Test on:**
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- iPad Pro (1024px)

**Key Areas:**
- Navigation menu
- Dashboard widgets
- Forms
- Tables
- Modals

### 5.3 Animation & Transitions

#### Task 5.3.1: Reduce Motion Preference
**Priority**: LOW  
**Effort**: 1 day  

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📋 Success Metrics & Definition of Done

### Phase 1: Brand & Design System
- [ ] All brand naming consistent across codebase
- [ ] New logo implemented in 5+ locations
- [ ] Color system reduced to 3 main categories
- [ ] Design tokens file created
- [ ] 80%+ components using new color system

### Phase 2: Architecture
- [ ] At least 2 modules migrated to feature-first structure
- [ ] Unified API client implemented
- [ ] Test coverage > 30% (target: 70%)
- [ ] CI/CD pipeline running successfully
- [ ] Build time < 30 seconds

### Phase 3: Features
- [ ] Financial module MVP completed (CRUD + reports)
- [ ] Supplier management system operational
- [ ] Voice input working in AI copilot
- [ ] Passport OCR with 80%+ accuracy

### Phase 4: Monitoring
- [ ] Sentry tracking errors in production
- [ ] Web Vitals being collected
- [ ] User analytics tracking 10+ key events
- [ ] Performance dashboard setup

### Phase 5: Polish
- [ ] Lighthouse accessibility score > 90
- [ ] All color contrasts meet WCAG AA
- [ ] Mobile responsive on 4+ screen sizes
- [ ] Reduced motion preference respected

---

## 🚀 Quick Wins (Week 1)

If you need to show immediate progress, prioritize these high-impact, low-effort tasks:

1. **Update package.json name** (10 minutes)
2. **Create README.md** (30 minutes)
3. **Consolidate color variables** (2 hours)
4. **Add Sentry integration** (1 hour)
5. **Setup GitHub Actions CI** (2 hours)
6. **Add missing ARIA labels to main navigation** (1 hour)
7. **Create `.env.example` file** (15 minutes)
8. **Add TypeScript strict null checks** (1 hour)

**Total: 1 day for 8 immediate improvements**

---

## 📚 Resources & References

### Documentation to Create
- [ ] README.md with setup instructions
- [ ] CONTRIBUTING.md for developers
- [ ] API.md for backend endpoints
- [ ] DESIGN_SYSTEM.md for UI guidelines
- [ ] DEPLOYMENT.md for production deployment

### External Resources
- [React Best Practices 2024](https://react.dev/learn)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/best-practices)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Next Steps:**
1. Review this roadmap with the team
2. Prioritize based on business needs
3. Create Jira/Linear tickets for each task
4. Assign ownership
5. Begin Sprint 1 with Phase 1 tasks

**Questions or Clarifications:**
Open an issue or contact the product team.
