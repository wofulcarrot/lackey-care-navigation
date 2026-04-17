# Design Decisions — Lackey Care Navigation

> **Audience:** Traverse cofounders  
> **Purpose:** Full context on every major design decision so you can review, challenge, and advise — especially on the client delivery/deployment strategy.  
> **Last updated:** April 17, 2026

---

## Table of Contents

1. [Why we built it this way](#1-why-we-built-it-this-way)
2. [Architecture decisions](#2-architecture-decisions)
3. [Triage algorithm design](#3-triage-algorithm-design)
4. [Security decisions (3 adversarial reviews)](#4-security-decisions)
5. [Bilingual strategy](#5-bilingual-strategy)
6. [Foursquare integration](#6-foursquare-integration)
7. [988 Crisis screen (not 911 for BH)](#7-988-crisis-screen)
8. [Dark mode](#8-dark-mode)
9. [CEO executive dashboard](#9-ceo-executive-dashboard)
10. [Admin panel (Payload CMS)](#10-admin-panel)
11. [Deployment strategy — needs cofounder input](#11-deployment-strategy)
12. [What we deferred and why](#12-what-we-deferred-and-why)
13. [Known risks](#13-known-risks)
14. [Client relationship context](#14-client-relationship-context)

---

## 1. Why we built it this way

### The problem
Lackey Clinic in Norfolk, VA serves uninsured adults. When patients call or walk in and Lackey can't see them immediately, they fall through the cracks — they don't know whether they need the ER, urgent care, virtual care, or can wait for an appointment. Lackey loses track of them. There's no digital intake or triage for uninsured patients in Hampton Roads.

### The HSNC angle
The Norfolk Health Department convened the Healthcare Safety Net Collaborative (HSNC) — a coalition of safety net providers (Sentara, EVMS, Norfolk CSB, Norfolk Health Dept, Lackey, etc.) to create a "single point of entry" for uninsured residents. Their charter literally describes three deliverables that we're building:
1. An online safety net resource map → our provider directory
2. An online landing platform that directs uninsured seekers to the right partner → our triage app
3. A shared data dashboard → our CEO dashboard

This positions Lackey (and Traverse) at the center of the HSNC initiative. The app isn't just a clinic tool — it's the regional infrastructure play.

### Why Next.js + Payload CMS
- **Next.js 16:** Server components for fast initial loads (critical for mobile-first uninsured population on spotty data). App Router for clean URL structure. Built-in i18n routing via next-intl.
- **Payload CMS v3:** Embedded in the same Next.js app (no separate CMS server). Clinical staff can edit triage questions, routing rules, care resources, and urgency thresholds without code changes. Role-based access (Admin vs Editor). Bilingual content management built-in via Payload's localization.
- **PostgreSQL:** Payload's first-class adapter. Reliable, free, well-supported. SQLite fallback for zero-config local dev.
- **Tailwind v4:** Utility-first CSS with class-based dark mode. Mobile-first by default.

**Trade-off we accepted:** Payload v3 is relatively new and has rough edges (admin SCSS import issues, schema-push interactive prompts, importMap regeneration). We hit several of these during development. Worth it for the embedded CMS — the alternative (headless CMS like Contentful/Sanity) would mean a separate service, separate auth, separate billing, and more complexity for Lackey's IT.

---

## 2. Architecture decisions

### Single deployment (no microservices)
Everything runs in one Next.js process: patient-facing pages, CMS admin panel, CEO dashboard, API endpoints, triage engine. This is intentional:
- Lackey's IT (Pedro) is one person. A microservices architecture would be unmanageable.
- Docker Compose starts two containers total: app + PostgreSQL. That's it.
- Vercel deployment is a single project import. Zero infra management.

### Anonymous session logging (zero PII)
Every triage completion logs a `TriageSession` row: care type, urgency result, resources shown, virtual care offered, locale, device, completion status. **No names, no emails, no phone numbers, no IP addresses, no answer text.** This was a deliberate design choice:
- HIPAA scope stays minimal (no PHI = no BAA required for basic hosting)
- Patient trust — the footer says "We don't collect personal information" and it's actually true
- Grant reporting still works — funders care about volume, completion rates, and routing distribution, not individual patients

**Trade-off:** We can't do individual follow-up ("Did patient X get care?"). The post-triage outcome survey (Tier 2 enhancement) would need to be opt-in and carefully scoped.

### Server-side triage scoring (client doesn't decide)
The client computes a running score for UX (progress bar), but the server re-scores authoritatively from `{careTypeId, answers[]}`. This prevents a tampered client from forcing a favorable routing — which matters because the app routes to real healthcare resources.

### sessionStorage for triage results (not URL params)
Originally results were passed via URL query parameters (the full JSON response including addresses, phone numbers, urgency level). Security review flagged this as HIGH — the data appears in browser history, server logs, and proxy logs. We moved to sessionStorage:
- Data never leaves the browser's memory
- Language toggle works (sessionStorage persists across same-tab navigations)
- "Start Over" explicitly clears all stored data
- Trade-off: deep-linking to results doesn't work (by design — you must complete triage to see results)

---

## 3. Triage algorithm design

### Weighted cumulative scoring
Simple sum of urgency weights per answer. No ML, no non-linear terms, no demographic factors. This is intentional:
- **Deterministic:** same inputs → same output, always. Required for clinical auditing and grant reporting.
- **Transparent:** every weight is visible in the CMS. A nurse can look at the routing rule and understand why patient X was sent to urgent care.
- **Editable:** clinical staff can change weights, thresholds, and routing rules without code changes.

### 6 urgency levels
Life-Threatening (≥20), Emergent (≥15), Urgent (≥10), Semi-Urgent (≥5), Routine (≥2), Elective (≥0). Evaluated highest-first; first match wins. The Elective level at threshold 0 is a guaranteed catch-all — no patient ever gets a null result.

**Why not Schmitt-Thompson?** We don't have a license, and the build team isn't qualified to implement clinical protocols. The current weights are demo/pilot values. The Medical Director is reviewing the algorithm (meeting was April 16). Clinical sign-off is a Phase 2 gate requirement.

### escalateImmediately override
Certain answers (self-harm disclosure, anaphylaxis symptoms) bypass scoring entirely and trigger an immediate safety response. This is the clinical safety net — no amount of other "mild" answers can dilute a critical escalation.

### "Not Sure" meta-triage
Patients who don't know what kind of care they need answer one question ("Which best describes what's going on?") and get redirected into the appropriate care type's flow. This implements the HSNC's "no wrong door" principle — the patient doesn't need to self-diagnose.

Full spec: [docs/triage-algorithm-spec.md](triage-algorithm-spec.md)

---

## 4. Security decisions

We ran **3 rounds of adversarial code review** (totaling 60+ findings). Every critical and high-priority issue is resolved. Key decisions:

### Scoring API locked down
Questions, UrgencyLevels, and RoutingRules collections require authenticated access to read via REST API. This prevents reverse-engineering the scoring system. Server-side `getPayload()` calls bypass access control (they're trusted), so the patient-facing flow still works.

### TriageSessions REST disabled
`access.create` requires an authenticated user. The two legitimate server-side write paths (`/api/triage/evaluate` and `/api/triage/log-emergency`) use `overrideAccess: true`. This closes the analytics-poisoning vector where an attacker could flood the session table via Payload's auto-generated REST endpoint.

### Rate limiting
In-memory sliding window, 30 req/min/IP on triage endpoints. **Known limitation:** this doesn't work across Vercel serverless instances (each cold-start gets a fresh Map). For production scale, we'd need Upstash Redis or Vercel's built-in rate limiting. Acceptable for pilot.

### Content Security Policy
Production CSP: `strict-dynamic` (no `unsafe-eval`), `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`. Dev CSP is permissive (HMR needs it). The CSP also allows Zippopotam.us (ZIP lookup), Foursquare (via server proxy, not directly), and OpenStreetMap tiles.

### Dashboard auth
HTTP Basic Auth with constant-time comparison (SHA-256 + byte XOR in Edge Runtime — Node's `crypto.timingSafeEqual` isn't available in Edge). Fails fast in production if env vars are unset. Logs IP of failed attempts.

**Decision we deferred:** The adversarial review recommended upgrading to Payload session-based auth for the dashboard. We documented this as a pilot stopgap. Basic Auth is sufficient for a CEO + 2-3 stakeholders; it's not sufficient for 50+ partners accessing a shared dashboard.

---

## 5. Bilingual strategy

### Two-layer approach
1. **UI strings** (buttons, labels, headings, disclaimers) → `src/i18n/messages/{en,es}.json` via next-intl. 73 keys, fully translated.
2. **CMS content** (questions, answers, care types, routing actions, provider descriptions, virtual care bullets) → Payload's localization system (`localized: true` fields). Applied via `backfill-spanish.ts` script.

### Why both?
- UI strings change rarely and are tightly coupled to component code → source-controlled JSON.
- CMS content changes when clinical staff updates questions or providers add hours → database-managed, editable via admin panel.

### What's NOT localized
- `timeToCare` on urgency levels ("Same day", "1-3 days") — the field isn't `localized: true` at the schema level. Changing it requires a Payload schema migration which triggers an interactive prompt. We deferred this to avoid breaking the dev server during the pilot.
- Care resource `name` fields (e.g., "Sentara Norfolk General Hospital") — proper nouns, kept in English.

### Spanish quality
All translations were generated programmatically and have NOT been reviewed by a qualified Spanish-language reviewer. This is a Phase 2 gate requirement (G2.5). The SOW states Lackey must designate a reviewer or fund an external one.

---

## 6. Foursquare integration

### Why Foursquare (not Google Places)
- **Free tier:** 950 calls/day, no billing setup. Google Places requires a credit card and charges ~$32/1K requests.
- **Good enough data quality:** Healthcare category filtering + text query + our three-tier name filter produces clean results (13 real urgent cares in Norfolk, 15 in NYC, zero false positives in testing).
- **Jeff chose it** (from the three options presented: Google, Foursquare, OSM Overpass).

### When it triggers
Only when urgency = "Urgent" (the tier, not the word). Checked by name ("Urgent" or "Urgente") not by threshold number — so admins can tune the score threshold in CMS without breaking the flow.

### How it works
1. Patient completes triage → Urgent result
2. Client navigates to `/[locale]/location` (new intermediate screen)
3. Patient shares GPS or enters ZIP
4. Client POSTs coordinates to `/api/triage/nearby-urgent-cares` (server-side proxy)
5. Server calls Foursquare Places API with healthcare categories + "urgent" query, 10mi radius
6. Three-tier filter: category-level rejection (vets) → name denylist (lawn care, chiropractors) → name/category positive match
7. Results replace the seeded urgent cares in sessionStorage
8. `virtualCareEligible` set to false (patient wants in-person care)
9. Patient lands on results page with nearby urgent cares + distances

### ZIP lookup
Hampton Roads ZIPs hit a local centroid table (instant, zero network). All other US ZIPs geocode via Zippopotam.us (free, CORS-enabled, no API key). Browser-side fetch, no server proxy needed.

### Privacy
Patient coordinates are sent to our server (to proxy Foursquare) but **never stored or logged**. Transient variables only. The `/api/health` endpoint doesn't expose them. sessionStorage stores the user's lat/lon for distance display on results but clears on "Start Over".

---

## 7. 988 Crisis screen

### Decision: BH self-harm → 988, not 911
The original escalation behavior was: any `escalateImmediately: true` answer → full-screen 911 alert. Jeff requested a dedicated suicide prevention screen for behavioral health disclosures. The 988 screen shows:
- 988 Suicide & Crisis Lifeline (call or text)
- Crisis Text Line (text HOME to 741741)
- Local CSB finder link
- Purple background (visually distinct from red 911 alert)

### Why not just 911
- Many people experiencing suicidal ideation need a counselor, not an ambulance
- 988 is specifically designed for mental health crisis
- The Norfolk CSB has 24/7 crisis services
- ERs can be traumatic for BH patients — a crisis line is the clinically preferred first response
- This aligns with HSNC's BH priority

### Dashboard tracking
The CEO dashboard now shows separate metrics: "Emergency (911)" in red and "Crisis (988)" in purple. The split is based on `emergencyScreenTriggered=true` AND `careTypeSelected=Behavioral Health`.

---

## 8. Dark mode

### Implementation
Tailwind v4 class-based dark mode (`@custom-variant dark`). Toggle in the Header (sun/moon icon). Theme persists to localStorage; defaults to OS preference via a synchronous `<script>` in `<head>` that runs before React hydration (no flash).

### Scope
Patient-facing pages only. The Payload admin and CEO dashboard have their own themes and are unaffected.

### Why we added it
Jeff requested it. It's also a real accessibility benefit — many uninsured adults access the app in low-light environments (shelters, late-night ER waiting rooms, buses). Dark mode reduces eye strain and battery drain on OLED phones.

---

## 9. CEO executive dashboard

### What it shows
5 metric tiles (Users served, Completed triage, Virtual care, Emergency 911, Crisis 988), daily bar chart trend with custom tooltip, care routing mix pie chart, care type breakdown, hourly heatmap (when people seek care), language/device breakdown, partner referral bar chart + Leaflet map, virtual care pacing against annual target, CSV export.

### Auth: Basic Auth (pilot stopgap)
Username/password in env vars. Constant-time comparison in Edge Runtime. Good enough for 3-5 stakeholders viewing a dashboard. Not good enough for 50+ HSNC partners — that needs Payload session auth (deferred).

### Sample data
967 demo sessions seeded across 60 days + 25 BH crisis events + 15 pre-triage 911 events. Session IDs prefixed with `demo-` (not `sample-` — the dashboard query filters out `sample-*` but shows `demo-*`). The sample-sessions seed script refuses to run in production (`NODE_ENV=production` guard).

---

## 10. Admin panel

### Organization
Collections grouped into 4 sidebar sections:
- **Content** — Care Resources (19 providers), Emergency Symptoms (editors can update)
- **Triage Logic** — Care Types, Questions, Question Sets, Routing Rules, Urgency Levels (admin only)
- **Analytics** — Triage Sessions (read-only, zero PII)
- **System** — Admin Users

### CareResources tabbed editor
5 tabs: Basics, Location, Hours, Eligibility & Cost, Status & Notices. Row layouts for compact address/lat-lng entry. Every field has a plain-language description.

### Lackey teal branding
Custom SCSS overrides Payload's `--color-success-*` scale with Lackey deep teal (#1B4F72). Applied as unlayered CSS custom properties (NOT inside `@layer`) to avoid breaking Payload's cascade — we learned this the hard way after two attempts that broke the admin styling.

### CSS import lesson
`import '@payloadcms/ui/scss/app.scss'` is NOT sufficient in Payload v3 — it only imports the SASS entry point, not the per-component styles that Turbopack doesn't bundle from node_modules. The fix was `import '@payloadcms/next/css'` which ships the complete pre-compiled admin stylesheet.

---

## 11. Deployment strategy — NEEDS COFOUNDER INPUT

**This is where I most need your input.** The SOW requires us to deliver a containerized deployment that Lackey's IT (Pedro — Drew left) can run. We've built both paths:

### Option A: Vercel + Neon (recommended to client)
- Zero server maintenance, auto-deploy from GitHub, free tier covers pilot
- Pedro signs up for Vercel + Neon, imports repo, sets env vars, done in 30 min
- Custom domain via CNAME + auto SSL
- Seed database from local laptop (Vercel has no terminal)

### Option B: Docker self-hosted
- `docker compose up` starts app + PostgreSQL
- Nginx reverse proxy + Let's Encrypt for HTTPS
- $6-12/mo VPS (DigitalOcean/Linode)
- Pedro manages the server (updates, backups, monitoring)

### Questions for cofounders
1. **Do we recommend Vercel and hand-hold Pedro through setup?** Or do we set it up FOR them and hand over credentials? The SOW says "transfer" not "operate."
2. **Should we offer a managed hosting add-on?** Monthly retainer for Traverse to host on our Vercel account and manage deployments. This is recurring revenue and reduces risk of Pedro breaking something.
3. **For the HSNC play:** If this becomes the regional platform, who hosts it? Lackey? The Norfolk Health Department? A shared HSNC infrastructure? This affects the SOW scope significantly.
4. **Database hosting:** Neon free tier has a 500MB storage limit. With ~1K sessions/month at ~200 bytes each, we won't hit it for years. But if HSNC partners add 10x the volume, we'd need to upgrade (~$19/mo for Neon Pro). Who pays?
5. **The Foursquare API key:** Currently using Jeff's key (`4VND...`). For client delivery, should Lackey get their own? It's free. Or do we keep it on our account and document the handoff?

### Deployment guide
We created `docs/deployment-guide.docx` for Pedro with step-by-step instructions for both options. Includes screenshots-equivalent command blocks, env var tables, DNS setup, database seeding, and post-deployment verification.

---

## 12. What we deferred and why

| Feature | Why deferred | Effort to add |
|---------|-------------|---------------|
| Schmitt-Thompson clinical protocol alignment | Need clinical license + qualified clinician | External dependency |
| Nonce-based CSP (replacing unsafe-inline) | Requires middleware integration per request; overkill for pilot | 1-2 weeks |
| Upstash Redis rate limiting | In-memory works for single-instance pilot; serverless needs distributed state | 2-3 days |
| Payload session auth for dashboard | Basic Auth sufficient for 3-5 users; upgrade needed for HSNC scale | 1 week |
| CareMessage SMS follow-up ($250/yr) | Waiting on Lackey's approval + workflow design | 1-2 weeks |
| Post-triage outcome survey | Needs opt-in design to stay PII-free | 1 week |
| `timeToCare` localization | Schema migration triggers interactive prompt; deferred to avoid dev breakage | 1 day (with planned downtime) |
| Epic/MyChart handoff | Requires Sentara partnership conversation | Months |
| Multi-tenant (county-filtered dashboard) | Pilot is Norfolk-only; HSNC expansion would trigger this | 3-4 weeks |
| Native mobile app | PWA first; native only if app-store presence is required | 1-2 months |

---

## 13. Known risks

### Technical
- **Turbopack dev-server crash:** Long-running dev sessions (48+ hrs) trigger a `Performance.measure()` negative timestamp bug that kills client hydration. Fix: restart dev server. Does NOT affect production builds.
- **In-memory rate limiter:** Doesn't persist across Vercel serverless instances. Acceptable for pilot; needs Redis for production scale.
- **Payload v3 maturity:** We hit admin CSS import issues, schema-push interactive prompts, and importMap regeneration quirks. All solved but Payload v3 is young software.

### Clinical
- **Triage weights are not clinically validated.** Demo values only. Medical Director review is in progress but sign-off is pending.
- **No demographics in scoring.** A 75-year-old diabetic with "moderate pain" scores the same as a healthy 25-year-old. Known limitation documented in the triage spec.
- **"Practice of medicine" question.** Virginia law may consider algorithmic triage routing as practicing medicine. Lackey's legal team should confirm scope before statewide expansion.

### Organizational
- **Pedro is the single point of IT contact.** If he leaves (like Drew did), Lackey has no one to manage the deployment. This strengthens the case for a managed hosting add-on.
- **Spanish translation quality.** All ES content is machine-generated and unreviewed by a qualified translator. Could contain inaccuracies in medical terminology.
- **HSNC governance.** If the app becomes the regional platform, Lackey may not be the right entity to own/operate it. Governance model is undefined.

---

## 14. Client relationship context

- **Jeff (our user) is friends with Lackey's CEO.** The relationship is warm and collaborative, not adversarial. This is an advantage for Phase 2 gates (clinical sign-off, UAT).
- **The HSNC meeting (today, April 17)** positions this as more than a clinic tool — it's the "single point of entry" for Norfolk's 15,000-30,000 uninsured residents facing Medicaid unwinding. Strong political tailwind.
- **Funding model is grants.** Lackey operates on grant funding. The dashboard CSV export and session metrics are designed to directly feed grant reports (HRSA UDS, VHCF, RWJF).
- **Medical Director is reviewing the algorithm.** Meeting happened April 16. Sign-off document is a Phase 2 gate requirement.
- **SOW Phase 2 (Testing)** is next. We have 23/23 tests passing but need: formal test results report, UAT plan, clinical sign-off document, bilingual review confirmation, and a formal defect log.

---

## Files to review

| File | What it is |
|------|-----------|
| `README.md` | Quick start + architecture overview |
| `Dockerfile` + `docker-compose.yml` | SOW D1.3 — containerized deployment |
| `docs/environment-setup.md` | SOW D1.4 — every env var documented |
| `docs/triage-algorithm-spec.md` | Full scoring algorithm specification |
| `docs/deployment-guide.docx` | Step-by-step for Pedro (Vercel + Docker) |
| `docs/third-party-licenses.csv` | SOW D1.5 — 555 dependency licenses |
| `docs/adversarial-review-2026-04-13.md` | Round 1 security findings (all resolved) |
| `docs/competitive-research-2026-04-13.md` | Market analysis + enhancement roadmap |
| `src/lib/triage-engine.ts` | Core scoring functions (60 lines) |
| `src/lib/foursquare.ts` | Foursquare client + healthcare filter |
| `src/app/api/triage/evaluate/route.ts` | Main triage API endpoint |
| `src/middleware.ts` | Dashboard Basic Auth (Edge Runtime) |
| `next.config.ts` | CSP, Permissions-Policy, headers |
