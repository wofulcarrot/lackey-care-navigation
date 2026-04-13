# Care Navigation Triage App — Design Spec

**Date:** 2026-04-12
**Project:** Lackey Clinic Referral Landing Page
**Client:** Lackey Clinic (Olivet Medical Ministries)
**Builder:** Traverse

## Overview

A patient-facing care navigation web app that guides uninsured adults (18+) in Norfolk, VA to the right level of care using a rule-based triage engine. The app uses a two-axis model (Clinical Urgency x Time to Receive Care) to classify need and route patients to appropriate local resources, with Lackey Virtual Care positioned as the default "front door" for all non-emergency needs.

### Key Decisions

| Decision | Choice |
|----------|--------|
| Scope | Full triage app (complete multi-step flow) |
| Deployment | Standalone web app (e.g., `care.lackeyhealthcare.org`) |
| Resource management | CMS — Lackey staff manage resources directly |
| Primary user | Mobile-first, low-literacy friendly, bilingual EN/ES from day one |
| Virtual Care integration | Interstitial + redirect handoff to Lackey Virtual Care |
| Eligibility intake | Link to JotForm now, architected to swap to DataCare 2.0 |
| Triage logic | Rule-based decision tree, CMS-configurable, deterministic and auditable |
| Architecture | Next.js + Payload CMS (embedded) + PostgreSQL |

---

## 1. System Architecture

Single Next.js application deployed on Vercel containing three subsystems:

### 1.1 Patient-Facing App
- React frontend with Tailwind CSS
- Triage wizard (step-by-step screens)
- EN/ES localization via next-intl
- Mobile-first responsive design

### 1.2 Triage Engine
- Next.js API routes
- Rule evaluation reads from PostgreSQL via Payload's data layer
- Deterministic: same inputs always produce same outputs
- Decision audit logging via TriageSessions collection

### 1.3 Payload CMS Admin Panel
- Served at `/admin`
- Auto-generated UI from Payload collection schemas
- Role-based access control (admin, editor)
- Built-in version history and localization

### 1.4 Database
- PostgreSQL (Vercel Postgres or Supabase)
- Payload manages schema via Drizzle ORM

### 1.5 External Handoffs
- Lackey Virtual Care: redirect in new tab
- JotForm / DataCare 2.0: configurable link in CMS
- No Epic/EHR integration (avoids HIPAA scope)
- No patient accounts or PII storage

---

## 2. Data Model

### 2.1 Core Collections

#### CareTypes
Top-level categories a patient chooses from.

| Field | Type | Description |
|-------|------|-------------|
| name | text (localized) | "Medical", "Dental", "Vision", "Behavioral Health", "Medication", "Chronic Care", "Not Sure" |
| icon | text | Visual identifier for UI |
| description | text (localized) | Patient-friendly explanation |
| sortOrder | number | Display order on selection screen |
| isMeta | boolean | If true, questions route to another CareType (powers "Not Sure" flow) |
| questionSets | relationship | → QuestionSets |

#### QuestionSets
Versioned groups of triage questions tied to a care type.

| Field | Type | Description |
|-------|------|-------------|
| careType | relationship | → CareTypes |
| questions | array | Ordered list of Questions |
| version | number | Version number for audit trail |
| isActive | boolean | Only one set per care type is live |

#### Questions
Individual triage questions with answer options and scoring.

| Field | Type | Description |
|-------|------|-------------|
| text | text (localized) | Patient-facing question |
| helpText | text (localized) | Optional "What does this mean?" clarification |
| type | select | "single_choice", "multi_choice", "yes_no" |
| sortOrder | number | Default position (used when no branching override) |
| answers[] | array | See answer fields below |

**Answer fields:**

| Field | Type | Description |
|-------|------|-------------|
| label | text (localized) | Answer text |
| urgencyWeight | number | Score contribution |
| escalateImmediately | boolean | If true, skip remaining questions → 911/ER |
| nextQuestion | relationship (optional) | → Questions. Overrides sortOrder for conditional branching. |
| redirectToCareType | relationship (optional) | → CareTypes. For "Not Sure" meta-triage: routes patient into a specific care type's question flow. |

#### UrgencyLevels
Classification buckets the triage engine maps scores into.

| Field | Type | Description |
|-------|------|-------------|
| name | text (localized) | "Life-Threatening", "Emergent", "Urgent", "Semi-Urgent", "Routine", "Elective" |
| color | text | UI color coding (red → lavender) |
| scoreThreshold | number | Minimum cumulative score to trigger this level. Levels are evaluated highest-threshold-first; the first level whose threshold the score meets or exceeds is the match. |
| timeToCare | text | "Immediate", "Same Day", "1-3 Days", "1-2 Weeks", "3-8 Weeks", "As Available" |
| description | text (localized) | Patient-friendly explanation |

#### CareResources
Provider directory — the actual places and services patients get routed to.

| Field | Type | Description |
|-------|------|-------------|
| name | text | Facility name |
| type | select | "er", "urgent_care", "primary_care", "dental", "virtual", "pharmacy", "social_services", "crisis_line" |
| address | group | street, city, state, zip |
| phone | text | Click-to-call number |
| hours | array | Structured (day/open/close) or "24/7" |
| website | text | External URL |
| description | text (localized) | What they offer |
| cost | select | "Free", "Sliding Scale", "Insurance Required" |
| eligibility | text (localized) | Who can use it |
| isActive | boolean | Permanent visibility toggle |
| temporaryNotice | text (localized, optional) | Alert banner (e.g., "Closed for holiday until Jan 2") |
| temporaryNoticeExpires | date (optional) | Auto-clears the notice after this date |

#### RoutingRules
Maps urgency + care type combinations to specific resources.

| Field | Type | Description |
|-------|------|-------------|
| careType | relationship | → CareTypes |
| urgencyLevel | relationship | → UrgencyLevels |
| resources[] | relationship | → CareResources (ordered by priority) |
| virtualCareEligible | boolean | Show Virtual Care interstitial |
| actionText | text (localized) | Primary CTA ("Call 911", "Start a Free Virtual Visit", etc.) |
| nextSteps | richtext (localized) | Instructions for results page |

### 2.2 Supporting Collections

#### EmergencySymptoms
The Step 1 safety screen checklist. Managed via CMS so clinicians can update without a deploy.

| Field | Type | Description |
|-------|------|-------------|
| symptom | text (localized) | e.g., "Chest pain or pressure" |
| sortOrder | number | Display order |
| isActive | boolean | Toggle visibility |

#### StaticContent
Hero text, footer, about content, Virtual Care interstitial copy, privacy notice. All localized EN/ES.

#### TriageSessions
Anonymous analytics. Zero PII. Powers grant reporting.

| Field | Type | Description |
|-------|------|-------------|
| sessionId | text | Random UUID (not tied to any user) |
| timestamp | date | When the session started |
| careTypeSelected | relationship | → CareTypes |
| urgencyResult | relationship (optional) | → UrgencyLevels (null if abandoned) |
| resourcesShown[] | relationship | → CareResources |
| virtualCareOffered | boolean | Whether Virtual Care interstitial was shown |
| emergencyScreenTriggered | boolean | Whether patient hit 911 path |
| completedFlow | boolean | Whether patient reached results page |
| locale | select | "en", "es" |
| device | select | "mobile", "tablet", "desktop" |
| questionSetVersion | number | Version of the QuestionSet that was active during this session. Enables correlating outcomes with specific rule versions for grant reporting. |

#### AdminUsers
Payload built-in auth with roles: `admin` (full access) and `editor` (resources + content only).

### 2.3 Triage Engine Flow

1. Patient selects a **CareType**
2. If `isMeta: true` ("Not Sure") → ask general questions → answer's `redirectToCareType` sends them into the real care type flow
3. If normal CareType → fetch active **QuestionSet**
4. Present **Questions** one at a time:
   - If answer has `nextQuestion` → jump to that question
   - Otherwise → next by `sortOrder`
   - If `escalateImmediately` → 911/ER immediately
5. Sum `urgencyWeight` scores → match to **UrgencyLevel** via `scoreThreshold`
6. Look up **RoutingRule** for (CareType + UrgencyLevel)
7. Display matched **CareResources** with action text + next steps
8. Log anonymous **TriageSession**

---

## 3. Patient-Facing Triage Flow UX

### 3.1 Screen Flow

**Screen 1 — Landing**
- Hero: "Get the right care, right now" / "Obtenga la atencion adecuada ahora"
- Language toggle (EN/ES) prominent at top
- Primary CTA: large "Get Care Now" button
- Secondary: "Start a Free Virtual Visit (24/7)" direct link to Virtual Care interstitial
- Persistent red 911 banner

**Screen 2 — Emergency Screen**
- Question: "Are you experiencing any of these right now?"
- Checklist of symptoms from EmergencySymptoms collection
- If ANY checked → full-screen 911 alert with click-to-call button
- If NONE → continue to care type selection
- Large tap targets, red accent, clear "None of these" button

**Screen 3 — Care Type Selection**
- Question: "What kind of help do you need?"
- Large icon cards, one per CareType: Medical, Dental, Vision, Behavioral Health, Medication, Chronic Care, I'm Not Sure
- Each card: icon + name + short description
- Tap loads that care type's active QuestionSet

**Screens 4–N — Triage Questions**
- One question per screen
- Progress bar at top showing estimated position
- Back button always available (re-scores on backtrack)
- Answer options: large pill buttons (single/yes-no) or checkboxes (multi)
- Expandable "What does this mean?" help text
- Branching via `nextQuestion`; `escalateImmediately` exits to 911
- Meta-triage answers with `redirectToCareType` seamlessly load the correct care type's questions

**Conditional — Virtual Care Interstitial**
- Shown when RoutingRule has `virtualCareEligible: true`
- Content: "You may be able to get free care right now"
- Bullet points: Free for adults 18+, Available 24/7, No insurance needed, 95% handled fully online, Private and secure
- Primary CTA: "Start Free Virtual Visit" → opens Lackey Virtual Care in new tab
- Secondary: "Show me other options" → continues to results

**Final Screen — Results**
- Header: urgency level name + color badge + time-to-care expectation
- Explanation: "Based on your answers, here's what we recommend"
- Resource cards ordered by RoutingRule priority: name, address, phone (click-to-call), hours, cost, temporary notice banner if set, "Get directions" link
- Next steps section: rich text from RoutingRule
- Eligibility seam: "Check if you qualify for free care" → JotForm (swappable to DataCare 2.0)
- "Start over" button at bottom

### 3.2 Persistent UI Elements (Every Screen)

- **Language toggle** — EN/ES switch in header. Switching preserves current position.
- **Emergency escape** — persistent "Call 911" link in header. Always one tap away.
- **Lackey branding** — subtle logo + "Powered by Lackey Clinic" footer.
- **Privacy note** — "We don't collect personal information."

### 3.3 Mobile-First / Low-Literacy Design Principles

- 48px minimum tap targets (WCAG touch target guidelines)
- 6th-grade reading level for all patient-facing text
- One action per screen — never two decisions at once
- WCAG AA contrast minimum, 18px base font
- Color never the only indicator (always paired with text/icon)
- Minimal scrolling — each screen fits one mobile viewport when possible

---

## 4. Admin CMS

### 4.1 Roles

**Admin** (Drew Wisniewski, Larry Trumbore, Traverse staff)
- Full CRUD on all collections including triage rules, routing, question sets, user management
- Can publish new question set versions, modify urgency thresholds, manage admin users

**Editor** (Kristyn Gatling, Amber Martens, care navigators)
- CRUD on Care Resources, Emergency Symptoms, Static Content
- Read-only on triage rules, routing rules, and analytics
- Cannot change triage logic

### 4.2 CMS Capabilities

- **Care Resources** — Add/edit/deactivate provider listings. Update address, phone, hours, cost, eligibility. Set temporary notices with auto-expiry. All fields localized. Version history on every change.
- **Emergency Symptoms** — Manage the Step 1 safety screen checklist. Add/remove/reorder. Localized.
- **Question Sets** (admin only) — Create versioned question sets per care type. Configure answer weights, branching, escalation. Set one version as active. Old versions preserved for audit.
- **Routing Rules** (admin only) — Map (CareType + UrgencyLevel) to resources. Set Virtual Care eligibility. Write action text and next-steps instructions.
- **Static Content** — Hero text, footer, about, Virtual Care interstitial copy, privacy notice. All localized EN/ES.
- **Analytics Dashboard** (read-only for editors) — Custom dashboard page within the Payload admin panel (not just default list views). Displays summary cards (session count, completion rate, Virtual Care offers, emergency triggers) and a filterable table of TriageSessions. Date range filter and CSV export for grant reports. Built as a Payload custom admin view.

### 4.3 Localization Workflow

Payload's built-in localization provides side-by-side EN/ES fields on every text field. Editors see both languages when editing. The patient-facing app reads the locale from the language toggle and pulls the correct field.

**Fallback:** If a Spanish translation is missing, the app displays English with a subtle "Translation pending" indicator.

---

## 5. Integrations & External Handoffs

### 5.1 Lackey Virtual Care (built by Traverse)
- **Type:** Redirect handoff
- **Trigger:** Patient clicks "Start Free Virtual Visit" on interstitial
- **Action:** `window.open(virtualCareUrl)` — opens Virtual Care intake in new tab
- **URL:** Configurable in CMS (StaticContent). No code change if the URL changes.
- **Locale:** Append `?lang=es` if the Virtual Care platform supports it
- **No PII passed.** Virtual Care handles its own intake.

### 5.2 Eligibility Intake → JotForm (now) → DataCare 2.0 (later)
- **Type:** Configurable link ("The Seam")
- **Trigger:** Patient clicks "Check if you qualify for free care" on results page
- **Current target:** Lackey's existing JotForm eligibility intake URL
- **Future target:** DataCare 2.0 eligibility module
- **Implementation:** URL stored in CMS. Swapping JotForm → DataCare 2.0 is a single field edit, zero code changes.
- **Tracking:** Append `?utm_source=triage&utm_medium=referral&utm_campaign={careType}` for intake attribution.

### 5.3 Maps & Directions
- **Type:** Native map links
- **Action:** Opens device's native maps app using universal URL scheme with resource address
- **No API key needed.** Linking out, not embedding.
- **Fallback:** Google Maps web URL for desktop.

### 5.4 Click-to-Call
- **Type:** `tel:` links
- **911:** Prominent red button on emergency screen
- **Crisis line:** Norfolk CSB (757) 664-7690
- **Resources:** Every resource card phone number is a `tel:` link
- **Mobile:** Single tap initiates call.

### 5.5 Analytics
- **Internal:** TriageSessions collection. Anonymous. Powers admin dashboard and CSV export for grants.
- **Optional external:** Plausible or Umami (cookie-free, self-hostable) for page views and referral sources. Not Google Analytics — avoids cookie banners and tracking concerns for a vulnerable population.
- **No cookies, no tracking pixels, no third-party scripts.**

### 5.6 Deliberate Exclusions
- **No Epic/EHR integration** — navigation tool, not a clinical system. Avoids HIPAA scope.
- **No patient accounts** — anonymous by design. No PII storage, no breach surface.
- **No payment processing** — routes to free/sliding-scale resources.

---

## 6. Testing, Error Handling & Deployment

### 6.1 Testing Strategy

**Unit Tests (Vitest) — Triage Engine**
- Score accumulation across question sequences
- Urgency level threshold matching (boundary conditions)
- `escalateImmediately` exits flow instantly
- Conditional branching follows `nextQuestion` correctly
- Meta-triage redirects to correct CareType
- Missing routing rule → graceful fallback

**Integration Tests (Vitest) — API Routes**
- POST triage evaluation with known answers → expected urgency + resources
- Locale parameter returns correct language content
- TriageSession logged correctly
- Invalid/incomplete input returns meaningful error

**E2E Tests (Playwright) — Critical Patient Flows**
- Emergency screen → check symptom → 911 alert with click-to-call
- Medical → questions → Virtual Care interstitial → results
- "Not Sure" → meta-triage → redirected into Dental → results
- Language toggle mid-flow preserves position and switches content
- Back button through triage re-scores correctly
- Results page resource cards with working tel: and map links

**Accessibility Tests (axe-core)**
- Color contrast ratios meet 4.5:1 minimum
- All interactive elements reachable via keyboard
- Screen reader announces questions, options, and results correctly
- Tap targets meet 48px minimum on mobile

### 6.2 Error Handling

The core principle: **never a dead end.** A patient in distress must always reach a next step.

- **Missing routing rule** — Show generic "Contact Lackey Clinic" fallback with phone number and Virtual Care link. Log the gap to admin dashboard.
- **Empty question set** — Skip triage questions, route directly to care type's general resources. Log the gap.
- **All resources inactive** — Show Virtual Care interstitial as primary option with "Call Lackey Clinic" backup. Never an empty results page.
- **Network/API failure** — Friendly error with "Call Lackey Clinic at (phone)" + "Start a free virtual visit" link. These two exits always work because they're phone and URL links with no API dependency.
- **Session logging failure** — Fire-and-forget. A failed TriageSession log never blocks the patient flow.

### 6.3 Deployment

- **Hosting:** Vercel (Next.js native). Automatic HTTPS, CDN edge caching, serverless API routes.
- **Database:** Vercel Postgres or Supabase (managed PostgreSQL).
- **Domain:** Custom subdomain, e.g., `care.lackeyhealthcare.org`. DNS pointed to Vercel.
- **Preview deploys:** Every PR gets a unique preview URL for stakeholder review.
- **CI/CD:** GitHub → Vercel auto-deploy on merge to `main`. Vitest + Playwright run in CI. Failed tests block deploy.
- **Monitoring:** Vercel built-in analytics for uptime/performance. Sentry (free tier) for runtime exceptions.
