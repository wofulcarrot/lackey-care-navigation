# Adversarial Code Review — Lackey Care Navigation App
**Date:** 2026-04-13

## CRITICAL (Must fix before launch)

### C1. Scoring logic publicly readable via REST API
**Files:** `src/collections/Questions.ts`, `UrgencyLevels.ts`, `RoutingRules.ts`
All three collections have `read: () => true`. Anyone can call `GET /api/questions` and see urgency weights, escalation flags, and score thresholds. Combined with RoutingRules, the entire scoring system is reverse-engineerable. A patient could game triage to get a specific routing.
**Fix:** Change `read` access to require authentication. Server-side `getPayload()` bypasses access control, so the frontend flow still works.

### C2. No rate limiting on triage evaluate endpoint
**File:** `src/app/api/triage/evaluate/route.ts`
No rate limiting, throttling, or abuse protection. Each call triggers multiple DB reads and a write. Trivial to DDoS.
**Fix:** Add rate limiting (~30 req/min/IP) via middleware or `@upstash/ratelimit`.

### C3. No security headers
**Files:** `src/middleware.ts`, `next.config.ts`
No CSP, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy. App is embeddable in iframes (clickjacking). Results page uses `dangerouslySetInnerHTML`.
**Fix:** Add security headers in `next.config.ts` headers config.

## HIGH (Should fix before launch)

### H1. Triage results passed via URL query params
**File:** `src/app/(frontend)/[locale]/triage/client.tsx`
Full JSON response (addresses, phone numbers, clinical routing) serialized into URL. Appears in browser history, server logs, proxy logs.
**Fix:** Use sessionStorage or server-side tokens.

### H2. Emergency screen can be bypassed
Direct navigation to `/care-type` or `/triage?careType=X` skips the 911 symptom check entirely.
**Fix:** Enforce flow order via sessionStorage flag or embed emergency check as first question.

### H3. .env with default credentials
`PAYLOAD_SECRET=lackey-dev-secret-change-in-prod` and `payload.config.ts` falls back to empty string.
**Fix:** Remove fallback, add startup validation for secret entropy.

### H4. Users collection publicly readable
`GET /api/users` leaks admin email addresses.
**Fix:** Change read access to require authentication.

### H5. Score edge case — 0/1 score handling
Score of 0 hits Elective (threshold 0) but if urgency levels are misconfigured in CMS, patients get null fallback with no resources.
**Fix:** Add default catch-all urgency level.

## MEDIUM (Fix soon after launch)

- **M1:** `dangerouslySetInnerHTML` on results page — adequate with DOMPurify but fragile when data comes via URL params
- **M2:** Seed script not idempotent — duplicates cause unpredictable routing
- **M3:** No unique constraint on (careType, urgencyLevel) in RoutingRules
- **M4:** Fire-and-forget session logging silently swallows all errors
- **M5:** No "Not Sure" routing rules (handled by redirect, but fragile)
- **M6:** Triage client returns null (blank screen) between last question and API response
- **M7:** Results `data` variable typed as `any` — runtime crash risk on malformed data
- **M8:** Analytics dashboard fetches ALL sessions client-side (won't scale)

## LOW (Nice to have)

- **L1:** No explicit CORS configuration
- **L2:** `@ts-nocheck` on all seed files
- **L3:** `as any` casts in 5+ locations
- **L4:** No single-active-set-per-care-type enforcement
- **L5:** Emergency symptom buttons lack `role="checkbox"`
- **L6:** Error boundaries don't pass clinicPhone/virtualCareUrl
- **L7:** Progress bar misleading with branching questions
- **L8:** No database migration strategy documented
- **L9:** Seed data is English-only (ES triage questions show in English)
- **L10:** No `loading.tsx` skeletons for any route
