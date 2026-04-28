# Adversarial Pre-Launch Review — Lackey Clinic Digital Front Door

**Date:** 2026-04-18 (original) / 2026-04-23 (Spiritual Care pivot)
**Branch reviewed:** `feat/spiritual-care` (includes `main` + Spiritual Care feature)
**Reviewers:** 4 parallel adversarial agents (security, correctness, reliability/ops, clinical-safety/UX)
**Scope:** full repo at `C:\Users\jeffr\Lackey-Front-Door\lackey-care-navigation`

This document consolidates findings from four independent adversarial reviews run against the
current codebase in preparation for going live. Findings are grouped by severity and by the
review lens that surfaced them. Nothing here is a speculative nit — every item includes a
concrete file:line and attack / failure scenario.

---

## 2026-04-23 Update — Spiritual Care pivoted to HIPAA-safe hand-off

Several P0 / P1 findings in the original review related to PHI risk on the Spiritual Care
feature (prayer requests, chaplain callback forms storing patient messages in Neon). After a
HIPAA review conversation, the feature was redesigned to eliminate PHI collection entirely:

- **Prayer request page** is now a static page with a `mailto:` button. The patient's own
  email client sends the message directly to Lackey's (HIPAA-covered) spiritual care inbox.
  No data passes through this site's servers or database.
- **Chaplain callback page** is now a static page with a `tel:` button + posted hours. The
  call routes directly to Lackey's (HIPAA-covered) phone line. No phone number is captured.
- **Find a church** is unchanged — no PHI involved.
- Both hand-off pages show an always-visible 988 crisis card, which also addresses P0-5
  (self-harm safety interrupt).

**What this resolved:**

- ✅ **P0-5** (prayer form had no self-harm safety interrupt) — resolved by 988 crisis card.
- ✅ **P1-5** (`SpiritualCareRequests` retained PII indefinitely) — collection deleted; no
  data to retain.
- ✅ HIPAA compliance gaps specific to spiritual care (documented in the 2026-04-23 HIPAA
  conversation) — **infrastructure BAAs no longer required** for this feature because no
  PHI transits our stack.

**Remaining launch gates for this feature (org-side, not code):**

1. Confirm `spiritualcare@lackeyclinic.org` (or chosen replacement) is a real mailbox
   covered by a BAA (Google Workspace Enterprise / Microsoft 365 Enterprise with BAA).
2. Confirm the chaplain phone line is covered by a BAA (RingCentral HIPAA / Zoom Phone
   HIPAA / direct carrier with BAA). Placeholder is the main clinic line at
   `(757) 547-7484`; replace with the real chaplain line before launch.
3. Confirm chaplain team coverage actually matches the posted hours (Mon–Fri 9am–5pm).

These are all tagged with `TODO(lackey)` in the static-page source files.

---

## P0 — MUST FIX BEFORE ANY PATIENT TRAFFIC

### P0-1. Triage scoring trusts client-supplied weights (integrity)
- **File:** `src/app/api/triage/evaluate/route.ts:22-52`
- **Attack:** POST body includes `answers[].urgencyWeight` and `answers[].escalateImmediately`
  verbatim. Server never re-fetches the authoritative answer rows. An attacker can:
  - Send `urgencyWeight: -9999` → force Routine for a true emergency.
  - Flip `escalateImmediately: false` → suppress a 911/988 escalation.
  - Fabricate scores and pollute CEO-dashboard metrics.
- **Fix:** Accept `answerId`s only; look up weight + escalation flag from Payload server-side.
  Reject any payload that references answers outside the currently active question-set.

### P0-2. Red-flag (emergency) screen is bypassable by direct URL
- **File:** `src/app/(frontend)/[locale]/care-type/client.tsx:24-28` (only gate),
  `src/app/(frontend)/[locale]/triage/page.tsx` (no guard),
  `src/app/(frontend)/[locale]/spiritual-care/**` (no guard),
  `src/app/(frontend)/[locale]/results/**` (no guard)
- **Scenario:** Only the `/care-type` page checks `sessionStorage.emergencyScreenCompleted`.
  A patient bookmarking `/en/triage?careType=1` or `/en/spiritual-care/chaplain-call`
  skips the emergency screen entirely. Clearing sessionStorage defeats the client-side check.
- **Fix:** Move the check into `middleware.ts` (cookie-based, set after completing emergency
  screen) or into a shared server-side layout that wraps every patient-facing route.

### P0-3. Emergency-symptoms collection fails open when empty
- **File:** `src/app/(frontend)/[locale]/emergency/page.tsx:17-29`
- **Scenario:** If an admin disables every emergency symptom, or the seed fails, the client
  renders zero checkboxes and "None of these apply" becomes the only option. The safety
  gate silently becomes a no-op.
- **Fix:** If `symptoms.length === 0`, render a hard-stop page ("Call 911 if this is an
  emergency — the symptom checker is unavailable") rather than allowing progression.

### P0-4. Landing-page "Get crisis help" links to 911 screen, not 988
- **File:** `src/app/(frontend)/[locale]/page.tsx:67-71`
- **Scenario:** A patient in suicidal crisis taps the landing CTA → `/emergency`
  (bleeding/chest-pain list) → "None apply" → Care Type → Behavioral Health →
  individual triage questions → maybe `CrisisAlert`. That's 4+ taps before 988 appears.
- **Fix:** Link the crisis CTA to a dedicated `/[locale]/crisis` route that renders
  `<CrisisAlert />` immediately. Add a persistent 988 affordance in `Header.tsx` next to
  the 911 pill.

### ✅ P0-5. Prayer-request form has no self-harm safety interrupt — RESOLVED 2026-04-23
_Resolved by the Spiritual Care hand-off pivot: there is no longer a prayer-request form
that stores patient messages. The new static page has an always-visible 988 crisis card
above the fold. See the top-of-doc update for details._

- **File:** `src/app/(frontend)/[locale]/spiritual-care/prayer-request/client.tsx` (entire)
- **Scenario:** A patient in acute suicidal distress types "I don't want to live
  anymore, please pray for me," submits, and sees the reassuring "Thank you — we'll
  be praying" screen. The volunteer team is not 24/7. The user is actively soothed
  away from 988. **Single highest-risk item in the app.**
- **Fix:**
  1. Add a visible "If you're in crisis, call or text 988" banner above both prayer and
     chaplain forms (link to `/crisis`).
  2. Keyword scan on submit (kill myself, suicide, end it, overdose, hopeless, + ES:
     suicidarme, matarme, no quiero vivir). If matched → replace success screen with
     `<CrisisAlert />`.
  3. Revise success copy: "If you need to talk to someone tonight, 988 is free and
     available 24/7."

### P0-6. Malformed SMS URI — Crisis Text Line link silently fails
- **File:** `src/components/CrisisAlert.tsx:68`
- **Bug:** `sms:741741&body=ASKUS` — should be `sms:741741?body=ASKUS`. Many mobile
  browsers treat the current string as `741741&body=ASKUS` (invalid recipient) or drop
  the body, so the patient reaches no keyword handler.
- **Fix:** Change to `sms:741741?body=ASKUS`. Verify on real iOS + Android device.

### P0-7. Email delivery will silently fail forever once enabled (ESM / require bug)
- **File:** `src/lib/spiritual-care-email.ts:94-105`
- **Bug:** `require('resend')` / `require('nodemailer')` inside an ESM module
  (`package.json` declares `"type": "module"`). Next.js 16 / Turbopack route handlers
  do not polyfill `require`. The outer try/catch swallows the `ReferenceError`, so
  every prayer / chaplain submission captures to DB but never sends email once
  `RESEND_API_KEY` is set. Pedro's team never knows to respond.
- **Fix:** Replace with dynamic `await import('resend')` / `await import('nodemailer')`.
  Add these packages to `dependencies` when enabling email.

### P0-8. Database migrations are not part of the deploy pipeline
- **File:** `src/payload.config.ts:70-76`, `package.json` scripts
- **Scenario:** The `spiritual-care-requests` and `spiritual-caregivers` tables (and
  any future collection) do not exist in Neon until someone manually runs
  `tsx src/seed/push-schema.ts`. Ship this branch to Vercel without that step and the
  first patient POST returns `relation "spiritual_care_requests" does not exist` → 500.
- **Fix:** Add `payload migrate` (or the push-schema script) to a prebuild / predeploy
  step. Document as a release-runbook item at minimum. Ideally commit real migrations.

### P0-9. Payload REST catch-all is unrate-limited and enumeration-friendly
- **File:** `src/app/api/[...slug]/route.ts:10-14`, middleware matcher at
  `src/middleware.ts:194`
- **Attack:** `GET /api/care-resources?limit=10000&depth=5` is anonymous, unrate-limited,
  and accepts arbitrary `where[...]` filters. An attacker scrapes the whole resource
  catalog, probes schema, and burns Neon / Vercel quota at will.
- **Fix:** Extend middleware matcher to cover `/api/:path*` (with exceptions for app-
  owned routes) and apply `rateLimit()` + method allow-list. Medium-term: move Payload
  admin under `/cms/*` behind Basic Auth or Payload session.

---

## P1 — FIX BEFORE SCALE / MARKETING

### P1-1. In-memory rate limiter is ineffective on Vercel
- **File:** `src/lib/rate-limit.ts:10-13`
- **Problem:** `Map` in module memory — each serverless instance has its own counter.
  With N concurrent instances an attacker gets N × 30 req/min. Same issue affects the
  dashboard Basic-Auth brute-force tracker at `src/middleware.ts:145`.
- **Fix:** Move to `@upstash/ratelimit` + Redis (already noted in file comment).

### P1-2. `customRoute` on CareTypes is unvalidated + breaks analytics
- **Files:** `src/collections/CareTypes.ts:33-40`,
  `src/app/(frontend)/[locale]/care-type/client.tsx:33-40`
- **Issues:**
  - Field accepts any string. An admin typing `//evil.com` produces
    `router.push('/en//evil.com')` which some Next versions normalize to an open redirect.
    An admin typing `javascript:alert(1)` is inert today but becomes live the moment
    anyone renders `customRoute` as an `<a href>`.
  - `selectCareType` fires `track()` but does NOT call the server session-log, so every
    Spiritual Care entry produces zero `triage-sessions` rows. Dashboard under-counts.
- **Fix:**
  1. Add a `beforeValidate` hook that enforces `/^\/[a-z0-9\-\/]+$/` (leading slash,
     no protocol, no double slash).
  2. Call a lightweight session-log (or widen `/api/triage/evaluate` to accept
     `customRoute` entries) so analytics stays consistent.

### P1-3. Dashboard page runs two 50,000-row unpaginated scans every hit
- **Files:** `src/lib/dashboard-queries.ts:140, 306, 489`; consumed by
  `src/app/dashboard/page.tsx` (force-dynamic, no `maxDuration`).
- **Impact:** With 6-12 months of traffic, the dashboard will exceed Vercel's default
  dynamic-page timeout and show the CEO a stack trace. Also taxes Neon connection pool.
- **Fix:**
  1. `export const maxDuration = 60` on dashboard pages.
  2. Aggregate with SQL, not JS — move counts + group-bys into Drizzle queries.
  3. Cache with `unstable_cache` / `revalidate = 300` — dashboard doesn't need sub-
     second freshness.

### P1-4. `triage/evaluate` has no per-DB-call timeout
- **File:** `src/app/api/triage/evaluate/route.ts:47, 75, 101, 117, 131`
- **Problem:** Five sequential `payload.*` calls with no `AbortSignal`. A Neon hiccup
  eats the whole 30s `maxDuration` before the patient sees the fallback page.
- **Fix:** Wrap each call in `Promise.race([call, timeout(5_000)])` and fall through to
  the same fallback path if any call times out.

### ✅ P1-5. SpiritualCareRequests retains PII indefinitely — RESOLVED 2026-04-23
_Resolved by the Spiritual Care hand-off pivot: the collection was deleted. No PHI is
stored on this stack for the spiritual care flow. See top-of-doc update._

- **File:** `src/collections/SpiritualCareRequests.ts`
- **Problem:** No retention hook, no encryption-at-rest note, `read` access is granted
  to any authenticated user (so any editor role reads historic prayer text). Neon
  backups perpetuate the exposure.
- **Fix:**
  1. Tighten `read` to `req.user?.role === 'admin'`.
  2. Add a 90-day purge (cron or `beforeChange` age check) for rows with `contactedAt` set.
  3. Document retention in the admin description + a privacy notice in the patient form.

### P1-6. No migrations documented → every env-var gap is a silent failure
- **Files:** `src/payload.config.ts:98-103` (`process.exit(1)` in `onInit`),
  lack of `.env.example` coverage for new vars.
- **Problem:** A missing `PAYLOAD_SECRET` or `DATABASE_URL` kills the lambda at first
  request; a missing `FOURSQUARE_API_KEY` silently degrades (fine). No unified env
  doc means ops can miss a setting and not know until 500s roll in.
- **Fix:** Create or update `.env.example` with every required var; add a prebuild
  check script (`scripts/check-env.ts`) that fails the build if a P0 var is missing.

### P1-7. URGENT_LEVEL_NAMES brittle string matching
- **Files:** `src/lib/constants.ts:10-14`, used in `src/app/(frontend)/[locale]/
  triage/client.tsx:71`, `src/app/(frontend)/[locale]/location/client.tsx:47`
- **Problem:** Hard-codes `['Urgent', 'Urgente']` and matches by name. If Pedro renames
  the level to "Urgent Care" or "De urgencia," the Foursquare location screen is
  silently skipped.
- **Fix:** Match on the level's ID or introduce a `tier: 'urgent' | 'ed' | ...` enum
  field on UrgencyLevels.

### P1-8. Results page re-submits triage on reload (idempotency)
- **File:** `src/app/(frontend)/[locale]/results/client.tsx:47-78`
- **Problem:** Every time the results page hydrates, it re-POSTs to `/api/triage/
  evaluate` with cached inputs, creating fresh `triage-sessions` rows per refresh.
- **Fix:** Persist a `sessionId` in `sessionStorage` and have the server upsert on that
  key, or gate the re-submit behind a one-shot flag.

### P1-9. Foursquare `closed_bucket` not filtered — defunct churches / clinics appear
- **File:** `src/lib/foursquare.ts` — both `normalizeFsqPlace` and `normalizeFsqChurch`
  drop the `closed_bucket` field.
- **Impact:** An isolated patient drives to a closed church / urgent care and the
  help-seeking attempt ends in a dead parking lot. Foursquare publishes open-state
  signals — use them.
- **Fix:** Filter out `Closed`, `LikelyClosed`, `VeryLikelyClosed` in the normalizers.

### P1-10. `virtualCareUrl` is not localized
- **Files:** `src/collections/StaticContent.ts:22`, `src/seed/seed.ts:67`,
  `src/app/(frontend)/[locale]/location/error.tsx:19`
- **Problem:** Hardcoded `?l=en` — ES users handed off to LUCA/Zipnosis in English.
- **Fix:** Mark field `localized: true`, seed ES variant with `?l=es`, remove the
  hard-coded fallback.

### P1-11. `error.tsx` boundaries drop the clinic-phone fallback
- **Files:** `src/app/(frontend)/[locale]/{emergency,triage,care-type,results,
  virtual-care}/error.tsx`
- **Problem:** All five pass only `onRetry={reset}` to `ErrorFallback`, which renders
  the "Call Lackey Clinic" button only when `clinicPhone` is truthy. In the exact
  moment failure matters most, the patient sees a blank retry screen — no phone, no
  virtual care. `location/error.tsx` does it right (hardcoded fallback); copy that
  pattern to the other four.

### P1-12. No error monitoring
- **Problem:** No Sentry / Logtail / Datadog integration. `observability.ts` is in-
  memory per-instance — `/api/health` will read "ok" from a warm instance even while
  another instance is bleeding 500s.
- **Fix:** Wire `@sentry/nextjs` before launch. Attach sessionId as tag; never attach
  email, phone, message text, or answer text.

---

## P2 — POLISH / SHOULD FIX SOON

### P2-1. Landing ES trust card contradicts itself
- **File:** `src/i18n/messages/es.json:14-15`
- **Bug:** `trustSpanish = "In English"` and `trustSpanishBody = "Tap \"EN\" above to
  switch to English."` on the Spanish landing page. A Spanish-preferring user's first
  impression is "this app thinks I'm English." Drop that card or replace with a
  genuine Spanish-language trust signal.

### P2-2. Meta & inactive care types render on `/care-type`
- **File:** `src/app/(frontend)/[locale]/care-type/page.tsx:24-29`
- **Problem:** No `where` clause. Every care-type row (including meta) shows up as a
  selectable card. Intent was "Not Sure" as a fallback, not a top-level option.
- **Fix:** `where: { isMeta: { not_equals: true } }`.

### P2-3. `ResourceCard` / `ChurchCard` hardcode English labels
- **Files:** `src/components/ResourceCard.tsx:46-51,87,129`,
  `src/app/(frontend)/[locale]/spiritual-care/find-church/client.tsx:177,188,199`
- **Bug:** "Free / Sliding Scale / Insurance / Open 24/7 / Website / Call / Directions"
  all hard-coded. ES users see English chips mixed into Spanish copy.
- **Fix:** Add i18n keys (`results.costFree`, `results.open24_7`, `spiritualCare.
  churchCall`, …) and wire them through `useTranslations`.

### P2-4. `LocationPrompt` shows progress text as error text
- **File:** `src/components/LocationPrompt.tsx:27,38`
- **Bug:** On GPS denial, the error state is set to `t('locating')` ("Finding your
  location…"). Patient sees "Finding your location…" in a red error card.
- **Fix:** Add `location.gpsDenied` / `location.gpsUnavailable` keys; dispatch the
  right one from the Geolocation `PositionError.code`.

### P2-5. CSP still allows `unsafe-inline` for scripts + styles
- **File:** `next.config.ts:48-49`
- **Acknowledged in a comment.** The codebase has no current XSS sink (all user content
  renders as text), but the CSP offers no second line. Plan: nonce-based CSP.

### P2-6. Admin Basic Auth has no brute-force limit on `/dashboard/*`
- **File:** `src/middleware.ts:173-175`; `checkLoginRateLimit` only runs on
  `/api/users/login`.
- **Fix:** Apply the same limiter to `/dashboard`; enforce long high-entropy password;
  replace Basic Auth with Payload session in a follow-up sprint.

### P2-7. Prayer/chaplain routes: rate-limit comment vs behavior drift
- **File:** `src/lib/rate-limit.ts:7-8` vs the "tighter 5/min" claim in
  `src/app/api/spiritual-care/prayer-request/route.ts:30`.
- **Reality:** Every caller gets the same 30/min bucket (per IP, per key namespace).
  The comment is stale.
- **Fix:** Either accept an override in `rateLimit` (`{ maxRequests, windowMs }`) or
  update the comment.

### P2-8. Spiritual caregiver rotation TOCTOU
- **File:** `src/lib/spiritual-caregiver-rotation.ts:32-60`
- **Acknowledged in code.** Under a burst, two submissions may both pick the same
  caregiver. For a small volunteer team this is tolerable; document as accepted risk.
- **Future fix:** atomic `UPDATE … SET lastContactedAt = now() WHERE id = (SELECT id
  FROM spiritual-caregivers WHERE isActive ORDER BY lastContactedAt ASC LIMIT 1 FOR
  UPDATE SKIP LOCKED) RETURNING *`.

### P2-9. Accessibility gaps (grouped)
- **FormField:** no `aria-describedby` tying input to help / error text (`src/components/
  ui/FormField.tsx`). Errors should have `role="alert"`.
- **Header language toggle:** no `aria-label`, no locale-switch announcement.
- **Focus management:** route changes don't move focus to the new `<h1>`.
- **ZIP inputs:** missing `autoComplete="postal-code"` on `LocationPrompt.tsx:122` and
  `find-church/client.tsx:91`.
- **Fix:** Each is small; bundle into a "launch a11y sweep" issue.

### P2-10. Medical disclaimer is collapsed by default
- **File:** `src/components/Footer.tsx:22-37`
- **Problem:** The "This is not a replacement for emergency services" disclaimer is
  behind a `▼` disclosure. Legal and clinical want this visible by default.
- **Fix:** Render the disclaimer text inline (no toggle) on at least the landing and
  emergency screens.

### ✅ P2-11. Vercel logs may capture PII — RESOLVED 2026-04-23 (PR #10)
_Resolved via the `fix/p2-11-log-redaction` PR: the spiritual-care files in the
original finding were already deleted by the HIPAA pivot, and the broader leak
surface across the rest of the app was closed by adding a centralized
`safeLog` wrapper plus IP-hashing in the rate limiter._

- **Files:** `src/app/api/spiritual-care/{prayer-request,chaplain-request}/route.ts`
  error branches; `src/lib/spiritual-care-email.ts`
- **Problem:** `console.error((err as Error).message)` can include Payload validation
  messages that echo submitted email/phone/message text. Vercel runtime logs are not
  HIPAA-grade by default.
- **Mitigations applied:**
  1. **`src/lib/safe-log.ts`** — new wrapper around `console.{error,warn,info}` that
     runs a regex pass over each variadic arg before emission. Redacts emails,
     phone numbers, IPv4, IPv6, and digit runs ≥10. Convention documented at the
     top of the file: do NOT use raw `console.*` in `src/app/api/`, `src/lib/`,
     or `src/middleware.ts` — use `safeLog` instead. Seed scripts (dev-only) keep
     plain `console.log`.
  2. **`ipKey(scope, ip)` helper in `src/lib/rate-limit.ts`** — hashes IPs with
     SHA-256 + `PAYLOAD_SECRET` salt before they land in the in-memory rate-limit
     Map, so even if a rate-limit key were ever logged accidentally, the raw IP
     wouldn't leak. All five callers (triage evaluate / track / log-emergency /
     nearby-urgent-cares / spiritual-care nearby-churches) updated.
  3. **Every existing `console.error` / `console.warn` in runtime paths swapped
     to `safeLog`** — `foursquare.ts`, `triage-session.ts`, `middleware.ts`,
     and the API routes that previously called `console.*` directly.
  4. **Middleware dashboard-auth log** — IP is now passed as a redactable arg
     (not interpolated into the label string) so it gets scrubbed to `[ip]`.
- **Not addressed (separate work):** Vercel's *access logs* (a different log
  pipeline from runtime stdout/stderr) still capture client IPs and URL paths
  by design — those remain Vercel-controlled. Closing that surface would
  require Vercel Enterprise BAA or migrating to AWS / similar. See the broader
  HIPAA recommendation tiers documented in this branch's PR.

### P2-12. `dompurify` declared but unused
- **File:** `package.json:29`
- **Harmless** but wire it into the CMS-rich-text render path or remove the dep.

---

## What the existing "security gaps" memo called out, verified

From `reference_security_gaps.md`:

- "Public scoring API" — ✅ **CLOSED.** Every scoring / triage collection now requires
  `Boolean(req.user)` on read. `/api/triage/evaluate` is the only public interface
  and it's input-validated (but still trusts client-supplied weights — see P0-1).
- "No rate limit" — ⚠ **PARTIALLY CLOSED.** Every app-owned API route calls
  `rateLimit()`, but the limiter is in-memory / per-instance (P1-1) and the Payload
  catch-all is uncovered (P0-9).
- "No security headers" — ✅ **CLOSED.** `next.config.ts:65-83` ships HSTS, CSP, XFO,
  Referrer-Policy, Permissions-Policy. Remaining gap: CSP `unsafe-inline` (P2-5).

---

## Top-12 launch-blocker punch list (rank-ordered)

1. **P0-1** — Server-authoritative triage scoring
2. **P0-2** — Middleware-level emergency-screen gate
3. **P0-3** — Hard fallback when emergency-symptoms is empty
4. **P0-4** — Landing "crisis help" routes to 988, not 911
5. **P0-5** — Self-harm interrupt on prayer / chaplain forms
6. **P0-6** — Fix malformed SMS URI on CrisisAlert
7. **P0-7** — Replace `require()` in spiritual-care-email with `await import()`
8. **P0-8** — Add DB migration step to deploy pipeline
9. **P0-9** — Gate Payload REST catch-all in middleware
10. **P1-1** — Real rate limiter (Upstash / Redis)
11. **P1-2** — Validate `customRoute` + log Spiritual Care sessions
12. **P1-11** — Restore clinic-phone fallback in every error.tsx

Each item has a fully-scoped fix in the body above. Items 1-9 are launch-blockers —
they must land before the first patient marketing push. Items 10-12 should follow
within the first week post-launch; after that the P2 polish list can become weekly
maintenance.

---

## Files with the most concentrated risk

- `src/app/api/triage/evaluate/route.ts` (P0-1, P1-4, P1-8)
- `src/lib/spiritual-care-email.ts` (P0-7)
- `src/lib/rate-limit.ts` (P1-1)
- `src/lib/dashboard-queries.ts` (P1-3)
- `src/app/(frontend)/[locale]/spiritual-care/prayer-request/client.tsx` (P0-5)
- `src/components/CrisisAlert.tsx` (P0-6)
- `src/app/(frontend)/[locale]/page.tsx` (P0-4)
- `src/middleware.ts` (P0-2, P0-9, P1-1, P2-6)
- `src/payload.config.ts` (P0-8)

Anyone reviewing the codebase for launch readiness should start with these nine files.
