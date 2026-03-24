# Architecture Decision Records (ADRs)

## ADR-001: Feature-Based Directory Structure

**Status**: Accepted  
**Context**: Flat `components/` folder becomes unnavigable past ~20 files.  
**Decision**: Domain-driven feature directories. Each feature owns its own components, hooks, services, store, and tests. Cross-cutting code lives in `shared/`.  
**Consequences**: Clearer ownership. Easy to delete a feature. Harder to accidentally couple features.

---

## ADR-002: React Query for Server State, Zustand for Client State

**Status**: Accepted  
**Context**: Needed caching, background refetch, and optimistic updates without Redux boilerplate.  
**Decision**: React Query owns all server-derived data. Zustand owns UI state (theme, modal open/close, auth token).  
**Consequences**: No "loading" booleans in components. Cache invalidation is explicit and surgical. Zustand bundle cost: 1 KB.

---

## ADR-003: Access Token in Memory, Refresh Token in httpOnly Cookie

**Status**: Accepted  
**Context**: Storing JWTs in localStorage exposes them to XSS.  
**Decision**: Access token stored in a JS module-level variable (cleared on page reload). Refresh token in a `SameSite=Strict; HttpOnly` cookie that JS cannot read.  
**Consequences**: XSS cannot steal tokens. Tab refresh triggers a single `/auth/refresh` round-trip. The Axios interceptor queues concurrent 401s and replays them after a single refresh.

---

## ADR-004: Zod Validation at Every Data Boundary

**Status**: Accepted  
**Context**: TypeScript types are erased at runtime. A form can submit invalid data that TypeScript thinks is valid.  
**Decision**: Zod schemas validate all form submissions and API responses. `parseOrThrow()` gates every mutation.  
**Consequences**: Runtime type safety at boundaries. Schema is the single source of truth — TS types are inferred from it.

---

## ADR-005: DOMPurify with Strict Allowlist for All HTML Rendering

**Status**: Accepted  
**Context**: Activity feed and notifications contain user-supplied names that are interpolated into HTML strings. `dangerouslySetInnerHTML` without sanitisation is an XSS vector.  
**Decision**: `sanitize()` wraps every `dangerouslySetInnerHTML` call. Allowlist: `strong`, `em`, `b`, `i`, `span`, `br` — no attributes.  
**Consequences**: Activity feed handles `<strong>name</strong>` safely. Any attempt to inject a `<script>` or `onerror` attribute is stripped silently.

---

## ADR-006: Code Splitting via React.lazy for Every View

**Status**: Accepted  
**Context**: Single 230 KB bundle meant first paint blocked on loading the entire app.  
**Decision**: Every view and modal is a `React.lazy` dynamic import. Shared infrastructure (Zustand, React Query, Axios, Zod) stays in the main chunk.  
**Consequences**: Initial load only fetches the main chunk + Dashboard. All other views load on first navigation, then cache indefinitely.

---

## ADR-007: react-virtuoso for Candidate Lists

**Status**: Accepted  
**Context**: An ATS at scale can have 100,000+ candidates. Rendering all rows causes jank and OOM.  
**Decision**: `Virtuoso` renders only visible rows (~20 at a time). `CandidateRow` is `React.memo` — only re-renders when its specific candidate changes.  
**Consequences**: Constant scroll performance regardless of list size. DOM node count is bounded.

---

## ADR-008: Structured Logger with Environment-Gated Levels

**Status**: Accepted  
**Context**: `console.log` everywhere causes noise in production and makes debugging harder.  
**Decision**: `logger.ts` gates output by level (debug only in dev, warn/error in prod). All calls include structured metadata. Production calls forward to Sentry.  
**Consequences**: Production logs are signal, not noise. `logger.perf()` flags slow operations automatically.
