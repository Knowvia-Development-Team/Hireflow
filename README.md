# HireFlow ATS — Production Engineering Reference

> Applicant Tracking System built for scale. React 18 + TypeScript + Zustand + React Query + Express + Hugging Face.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Tech Stack & Decisions](#tech-stack--decisions)
5. [Environment Variables](#environment-variables)
6. [State Management](#state-management)
7. [API Layer](#api-layer)
8. [Security](#security)
9. [Testing](#testing)
10. [Performance](#performance)
11. [Accessibility](#accessibility)
12. [CI/CD](#cicd)
13. [Deployment](#deployment)
14. [Contributing](#contributing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React App (Vite, code-split lazy chunks)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │   │
│  │  │ Zustand    │  │ React Query│  │ Axios Client     │   │   │
│  │  │ (UI + Auth)│  │ (server    │  │ (JWT interceptor │   │   │
│  │  │            │  │  cache)    │  │  + auto-refresh) │   │   │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │ REST / JSON                        │ REST / JSON
         ▼                                    ▼
┌─────────────────────┐           ┌───────────────────────┐
│  Express API Server │           │  Hugging Face API     │
│  (Node + TypeScript)│           │  • Mistral-7B (text)  │
│  • /api/analyse/*   │           │  • MiniLM (embeddings)│
│  • Auth endpoints   │           │  • Cardiff RoBERTa    │
│  • Job / Candidate  │           │  • BART (zero-shot)   │
└─────────────────────┘           └───────────────────────┘
```

### Feature-Based Directory Design

Each feature owns its own components, hooks, services, store, and tests.
Nothing bleeds across feature boundaries — only the `shared/` layer is cross-cutting.

```
Before (monolithic):          After (feature-based):
src/
  components/                 src/
    Dashboard.tsx               features/
    Candidates.tsx                candidates/
    Jobs.tsx           →            components/  hooks/  services/  store/  __tests__/
    ...                           jobs/
  App.tsx                           components/  hooks/  services/          __tests__/
                                  auth/
                                    components/  hooks/  store/             __tests__/
                                  ai-analysis/
                                    components/  services/
                                shared/
                                  lib/     → api client, validators, sanitizer, logger
                                  stores/  → ui, toast (cross-cutting)
                                  hooks/   → useDebounce, useRBAC, useLocalStorage
                                  components/ui/ → Button, Modal, FormField, Skeleton, RBACGuard
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- A free Hugging Face token: https://huggingface.co/settings/tokens

```bash
# 1. Clone and install
git clone <repo-url> && cd hireflow
npm install
cd server && npm install && cd ..

# 2. Configure environment
cp .env.example .env
cp server/.env.example server/.env
# Edit server/.env → set HF_TOKEN=hf_xxx...

# 3. Run both servers (two terminals)
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
npm run dev

# Open http://localhost:5173
```

### First-time login
Use any email/password on the login screen and select a role.
The app uses demo data — no real database is required for development.

---

## Project Structure

```
hireflow/
├── .github/
│   └── workflows/
│       ├── ci.yml           # Lint → typecheck → test → build
│       └── deploy.yml       # Staging gate + manual prod approval
├── .husky/
│   ├── pre-commit           # typecheck + lint-staged
│   ├── pre-push             # full test suite
│   └── commit-msg           # Conventional Commits format
├── src/
│   ├── app/
│   │   ├── ErrorBoundary.tsx    # Global error boundary + Sentry hook
│   │   ├── Providers.tsx        # QueryClient + ErrorBoundary wrapper
│   │   └── router.tsx           # Lazy view loader (code splitting)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── store/authStore.ts    # Zustand: JWT (in-memory), RBAC helpers
│   │   │   └── __tests__/
│   │   ├── candidates/
│   │   │   ├── components/VirtualCandidateList.tsx  # react-virtuoso
│   │   │   ├── hooks/useCandidates.ts               # RQ + optimistic updates
│   │   │   ├── services/candidateService.ts
│   │   │   └── __tests__/
│   │   ├── jobs/
│   │   │   ├── hooks/useJobs.ts
│   │   │   ├── services/jobService.ts
│   │   │   └── __tests__/
│   │   ├── ai-analysis/
│   │   │   └── services/analysisService.ts  # Abort-cancellable HF requests
│   │   └── [connections, dashboard, schedule, settings]/
│   ├── shared/
│   │   ├── lib/
│   │   │   ├── api/client.ts      # Axios: auth interceptor, refresh, retry
│   │   │   ├── env.ts             # Zod-validated env at startup
│   │   │   ├── logger.ts          # Structured logger, Sentry hook
│   │   │   ├── queryClient.ts     # React Query: 5-min stale, smart retry
│   │   │   ├── sanitize.ts        # DOMPurify XSS protection
│   │   │   ├── sentry.ts          # Dynamic Sentry init (prod only)
│   │   │   └── validators.ts      # Zod schemas for all forms
│   │   ├── stores/
│   │   │   ├── uiStore.ts         # Zustand: theme, modal, notif, sidebar
│   │   │   └── toastStore.ts      # Zustand: toasts + imperative helper
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── usePerformance.ts  # Web Vitals: LCP, FCP, TTFB
│   │   │   └── useRBAC.ts
│   │   └── components/ui/
│   │       ├── Button.tsx         # Accessible, memoised, all variants
│   │       ├── FormField.tsx      # ARIA-connected label/input/error
│   │       ├── Modal.tsx          # Portal, focus-trapped, Esc to close
│   │       ├── RBACGuard.tsx      # Role-based conditional rendering
│   │       ├── SearchInput.tsx    # Debounced, clearable
│   │       └── Skeleton.tsx       # Loading placeholders (per-view)
│   ├── types.ts                   # Single source of truth for all types
│   ├── data.ts                    # Seed data (typed)
│   ├── utils.ts                   # Pure utility functions
│   └── styles.css                 # CSS custom properties (theming)
├── server/
│   ├── routes/
│   │   ├── extract.ts             # Mistral-7B CV parsing
│   │   ├── match.ts               # Mistral + MiniLM semantic matching
│   │   └── sentiment.ts           # Cardiff RoBERTa + BART + Mistral
│   ├── models.ts                  # HF model registry
│   ├── types.ts                   # Backend type contracts
│   ├── utils.ts                   # parseJSON, cosineSim, clamp100
│   └── server.ts                  # Express app
├── .env.example
├── .prettierrc
├── eslint.config.js               # Type-aware lint rules
├── tsconfig.json                  # Strict TypeScript
├── vitest.config.ts               # Test runner + coverage thresholds
└── vite.config.ts                 # Build + proxy config
```

---

## Tech Stack & Decisions

### Why Zustand over Redux?
Redux Toolkit adds ~25 KB to the bundle and requires boilerplate (slices, selectors, reducers).
Zustand is 1 KB, co-locates state and actions, and supports devtools + middleware identically.
We use it only for **UI state** — server data lives in React Query.

### Why React Query over SWR?
React Query's `onMutate` / rollback pattern makes optimistic updates trivial.
The query key factory pattern (`candidateKeys.list(filters)`) makes cache invalidation precise —
we never invalidate more than we need to.

### Why Axios over native fetch?
- Request/response interceptors (auth token injection, 401 → refresh flow)
- Consistent error shape via `ApiError` class
- Easy request cancellation via `AbortController` (passed as `signal`)
- Timeout support

### Why Zod for validation?
TypeScript types are erased at runtime. Zod validates the actual data at the boundary
(form submit, API response) and infers TS types from schemas — no duplication.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Express backend URL (`http://localhost:3001`) |
| `VITE_HF_ENABLED` | No | Enable AI features (`true`/`false`) |
| `VITE_SENTRY_DSN` | No | Sentry DSN (error monitoring in prod) |
| `VITE_ENV` | No | `development` / `staging` / `production` |
| `VITE_APP_VERSION` | No | Semver string for Sentry releases |

All variables are validated at startup via Zod (`src/shared/lib/env.ts`).
A missing required variable **crashes the app immediately** with a clear error message.

---

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                     State Ownership                          │
│                                                             │
│  React Query (server state)     Zustand (client state)      │
│  ┌─────────────────────────┐   ┌────────────────────────┐  │
│  │ • Candidate list         │   │ • Theme (dark/light)   │  │
│  │ • Job list               │   │ • Open modal           │  │
│  │ • Interview schedule     │   │ • Notification panel   │  │
│  │ • Email threads          │   │ • Auth user + token    │  │
│  │ • Audit log              │   │ • Toast queue          │  │
│  │                         │   │                        │  │
│  │ Caching, background      │   │ Persisted: theme only  │  │
│  │ refetch, optimistic      │   │ (never tokens)         │  │
│  │ updates, retries         │   │                        │  │
│  └─────────────────────────┘   └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Optimistic Updates Pattern
```typescript
// useMutation with rollback on error
onMutate: async ({ id, nextStage }) => {
  await queryClient.cancelQueries({ queryKey: candidateKeys.all });
  const snapshot = queryClient.getQueriesData(...);
  queryClient.setQueriesData(..., optimisticUpdate);
  return { snapshot }; // context for rollback
},
onError: (_err, _vars, ctx) => {
  ctx.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
  toast.warning('Update failed', 'Changes have been reverted.');
},
```

---

## API Layer

### Axios Interceptor Flow

```
Request
  → attach Bearer token from memory
  → send to server
  
Response 200 → return data
Response 401 → queue request → POST /auth/refresh → retry with new token
Response 4xx → throw ApiError(status, code, message)
Response 5xx → retry with exponential backoff (max 3 attempts)
Network fail → throw NetworkError
```

### Error Handling
All API errors are instances of `ApiError` or `NetworkError`.
Components catch these at the mutation level — never via bare `try/catch` in render.

---

## Security

| Threat | Mitigation |
|---|---|
| XSS via user content | `sanitize()` (DOMPurify strict allowlist) wraps every `dangerouslySetInnerHTML` |
| Form injection | Zod validates all inputs before mutations |
| Token exposure | Access token in memory only, refresh token in httpOnly cookie |
| Token theft | 401 → auto-refresh → retry, no manual token management in components |
| CSRF | `withCredentials: true` + SameSite cookies (server-side) |
| Bundle secrets | All env vars prefixed `VITE_` are public — secrets stay server-side |
| Role escalation | RBAC enforced server-side; `RBACGuard` is UI-only convenience |

---

## Testing

```bash
npm run test              # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # With V8 coverage report
npm run test:ui           # Vitest browser UI
```

### Test Coverage Thresholds (enforced in CI)
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Test File Locations
Each feature's tests live next to the code they test:
```
src/features/candidates/__tests__/useCandidates.test.ts
src/features/jobs/__tests__/useJobs.test.ts
src/features/auth/__tests__/authStore.test.ts
src/shared/lib/__tests__/sanitize.test.ts
src/shared/lib/__tests__/validators.test.ts
src/shared/lib/__tests__/logger.test.ts
src/shared/stores/__tests__/toastStore.test.ts
src/shared/hooks/__tests__/useDebounce.test.ts
src/shared/components/ui/__tests__/Button.test.tsx
src/shared/components/ui/__tests__/Modal.test.tsx
src/shared/components/ui/__tests__/RBACGuard.test.tsx
src/shared/components/ui/__tests__/Skeleton.test.tsx
```

---

## Performance

### Code Splitting
Every view and modal is a separate JS chunk via `React.lazy`.
The main chunk contains only shared infrastructure (Zustand, React Query, Axios, Zod, DOMPurify).

```
dist/assets/Login-*.js              0.54 KB gzip
dist/assets/Jobs-*.js               0.90 KB gzip
dist/assets/Candidates-*.js         1.12 KB gzip
dist/assets/Dashboard-*.js          1.92 KB gzip
dist/assets/TextAnalysisModal-*.js  5.40 KB gzip
dist/assets/index-*.js            105 KB gzip  (shared)
```

### List Virtualisation
`VirtualCandidateList` uses react-virtuoso — with 100,000 candidates,
only ~20 DOM nodes exist at any time. Scroll performance is constant.

### Memoisation
- `Button`, `VirtualCandidateList`, `CandidateRow`, `Sidebar` — `React.memo`
- All event handlers in `App.tsx` — `useCallback`
- React Query `select` transforms — computed once, not on every render

### Web Vitals Monitoring
`usePerformance` reports LCP, FCP, and TTFB via `PerformanceObserver`.
Poor metrics (LCP > 4s, TTFB > 1.8s) trigger `logger.warn` → Sentry in prod.

---

## Accessibility

WCAG 2.1 AA compliance targets:

| Requirement | Implementation |
|---|---|
| Skip navigation | `<a href="#main-content">Skip to main content</a>` in App shell |
| Focus management | Modal auto-focuses close button on open; `<main tabIndex={-1}>` |
| Keyboard navigation | All interactive elements reachable via Tab/Enter/Space/Escape |
| Screen reader announcements | `aria-live="polite"` region mirrors toast notifications |
| Dialog semantics | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on all modals |
| Form errors | `role="alert"` on error messages, `aria-describedby` connecting fields |
| Loading states | `aria-busy="true"`, `aria-label` on all skeleton/loading regions |
| Colour contrast | CSS custom properties maintain AA contrast in both light and dark themes |

---

## CI/CD

### Pipeline (GitHub Actions)

```
push/PR to main or develop
         │
         ▼
  ┌──────────────────────────────────────────────┐
  │  Parallel jobs (all must pass)               │
  │  ┌──────────┐ ┌───────────┐ ┌─────────────┐ │
  │  │  Lint    │ │TypeScript │ │   Tests     │ │
  │  │ ESLint + │ │ strict    │ │ Vitest +    │ │
  │  │ Prettier │ │ noEmit    │ │ coverage    │ │
  │  └──────────┘ └───────────┘ └─────────────┘ │
  └──────────────────────────────────────────────┘
         │ all pass
         ▼
  ┌─────────────┐
  │    Build    │  ← checks bundle size < 500 KB
  │  (prod vite)│
  └─────────────┘
         │
         ▼ (main branch only)
  ┌─────────────────┐
  │ Deploy: Staging │
  └─────────────────┘
         │
         ▼ (manual approval)
  ┌──────────────────────┐
  │ Deploy: Production   │
  └──────────────────────┘
```

### Commit Convention (enforced by Husky)
```
feat(candidates): add virtual list for 100k+ candidates
fix(auth): prevent token from being stored in localStorage
chore(ci): add bundle size gate to build job
docs(readme): add deployment section
test(sanitize): add XSS onerror vector
refactor(api): extract error normalisation to interceptor
```

---

## Deployment

### Frontend (static)
The Vite build outputs to `dist/`. Deploy to any CDN:
- **Vercel**: zero-config, automatic preview deployments
- **Cloudflare Pages**: global edge delivery, ~50ms TTFB worldwide
- **AWS S3 + CloudFront**: enterprise, fine-grained cache control

```bash
npm run build
# Deploy dist/ to your CDN
```

### Backend (Node)
```bash
cd server
npm run build    # tsc → dist/
node dist/server.js
```

For production: use PM2, Docker, or a serverless adapter (Vercel Functions, AWS Lambda).

### Scaling Considerations
- **Frontend**: stateless static files. CDN + edge caching handles any traffic level.
- **React Query**: 5-min stale time reduces API calls by ~80% for stable data.
- **Virtualisation**: 100k+ candidate lists with constant DOM size.
- **Code splitting**: ~6 chunk files cached independently by the browser.
- **Backend**: the Express server is stateless. Scale horizontally behind a load balancer.

---

## Contributing

1. Fork and create a feature branch: `git checkout -b feat/my-feature`
2. Make changes — pre-commit hooks enforce typecheck + lint + format
3. Write tests for any new logic
4. Open a PR against `develop` with a Conventional Commit title
5. CI must pass before merge

### Development Commands
```bash
npm run dev          # Start Vite dev server (frontend)
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint (type-aware rules, 0 warnings)
npm run format       # Prettier format
npm run test         # Run test suite
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run build        # Production build (typecheck + vite)

cd server
npm run dev          # Start Express with tsx watch
npm run typecheck    # Backend TypeScript check
```

---

*Built to the standard of a 1,000,000 concurrent user production system.*
