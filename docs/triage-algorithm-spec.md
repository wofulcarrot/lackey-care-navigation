# Triage Algorithm & Scoring Specification

**Version:** 1.0 (pilot)
**Last updated:** 2026-04-15
**Code entry points:** `src/lib/triage-engine.ts` · `src/app/api/triage/evaluate/route.ts` · `src/hooks/useTriage.ts`

---

## 1. Overview

The Lackey Care Navigation app uses a **weighted cumulative scoring** model to classify a patient's urgency and route them to appropriate care resources. It is deterministic, auditable, and fully editable by non-technical staff via the Payload CMS — no machine learning, no hidden rules.

### 1.1 Design principles

| Principle | Consequence |
|-----------|-------------|
| **Deterministic** | Same inputs → same output, always. No randomness, no ML. Required for grant reporting and clinical auditing. |
| **Transparent** | Every score, threshold, and routing rule lives in the CMS as a readable row. Clinical staff can see exactly why a patient got a given recommendation. |
| **Fail-safe** | Multiple override paths prioritize patient safety over score arithmetic. An escalation flag always wins. A missing rule always routes to a human phone number. |
| **Privacy-first** | No PII is collected, stored, or needed for scoring. Session logs are anonymous. |
| **Localized** | Content (questions, answers, action text) is bilingual EN/ES. Scoring logic is locale-agnostic. |

---

## 2. Data Model

### 2.1 Core entities

```
CareType (7)            UrgencyLevel (6)           Question (~19)
   │                         │                          │
   │                         │                          ▼
   │                         │                        Answer[]  ◄── the scoring unit
   │                         │                          │
   ▼                         ▼                          │
QuestionSet ───────────► RoutingRule ◄── (careType × urgencyLevel)
   │                         │
   │                         ▼
   │                     CareResource[] (hospitals, clinics, urgent cares, etc.)
```

### 2.2 Scoring fields on an Answer

Every answer option a patient can choose has these five fields (only three affect scoring):

| Field | Purpose |
|-------|---------|
| `label` | Patient-facing text (localized EN/ES) |
| `urgencyWeight` | **Integer score added when picked.** Typical range: 0–10 |
| `escalateImmediately` | **Boolean override.** If true, skip all scoring and route to 911/ER |
| `nextQuestion` | Optional branching: jump to this question instead of following sortOrder |
| `redirectToCareType` | Meta-triage only ("Not Sure"): bounce into another care type's flow |

### 2.3 UrgencyLevel thresholds (current production values)

Evaluated highest-first; **first match wins**.

| Level | Score threshold | Time to care | Color |
|-------|----------------|--------------|-------|
| Life-Threatening | **≥ 20** | Immediate | #FEE2E2 (red) |
| Emergent | **≥ 15** | Within 1 hour | #FFEDD5 (orange) |
| Urgent | **≥ 10** | Same day | #FEF9C3 (yellow) |
| Semi-Urgent | **≥ 5** | 1–3 days | #DCFCE7 (green) |
| Routine | **≥ 2** | 1–2 weeks | #DBEAFE (blue) |
| Elective | **≥ 0** (catch-all) | As available | #EDE9FE (purple) |

A patient who picks entirely zero-weight answers falls to **Elective** (never null — guaranteed by the fallback in `classifyUrgency`).

---

## 3. Scoring Flow

### 3.1 High-level pseudocode

```
1. Patient lands → clicks "Get Care Now"
2. Emergency screen: check-boxes for life-threatening symptoms
   IF any checked → full-screen 911 alert, flow ENDS
3. Patient picks a CareType (Medical, Dental, Vision, Behavioral Health,
   Medication, Chronic Care, or "Not Sure")
4. Load the active QuestionSet for that CareType (where isActive=true)
5. FOR each question in sortOrder:
     a. Render the question + answer choices
     b. Patient picks one (or multiple, depending on type)
     c. IF any picked answer has escalateImmediately=true → route to 911, flow ENDS
     d. IF any picked answer has redirectToCareType → restart flow with that type
     e. Add urgencyWeight(s) to running total
     f. Follow nextQuestion branch if set, else proceed to next sortOrder
6. When no more questions remain → POST {careTypeId, answers[]} to /api/triage/evaluate
7. Server recomputes score authoritatively (does not trust client total)
8. Server looks up urgency level by threshold → looks up routing rule
9. Server returns { urgencyLevel, resources, virtualCareEligible, actionText, nextSteps }
10. Results page shows the urgency badge, Virtual Care interstitial (if eligible),
    then the ranked resource list (sorted by distance if patient shared location)
```

### 3.2 Scoring functions (authoritative implementation)

From `src/lib/triage-engine.ts`:

**`calculateScore(answers) → number`**
```
score = sum of all answer.urgencyWeight values
```
Simple sum. No multipliers, no non-linear terms, no caps. Predictable.

**`classifyUrgency(score, levels) → UrgencyLevel`**
```
sorted = levels.sort(desc by scoreThreshold)
return first level where score >= level.scoreThreshold
      ?? lowest-threshold level (fallback, never null)
```
Strict ≥ comparison. The highest threshold that matches wins — so a score of 17 lands on Emergent (threshold 15), not Life-Threatening (threshold 20).

**`checkEscalation(answers) → boolean`**
```
return true if ANY answer has escalateImmediately=true
```
Short-circuits scoring entirely. This is the clinical safety net.

**`checkMetaRedirect(answer) → careTypeId | null`**
```
return answer.redirectToCareType ?? null
```
Only used by the "Not Sure" care type to let a patient pick "I'm feeling anxious" and get bounced into Behavioral Health's flow.

### 3.3 Branching via `nextQuestion`

Single-choice answers can skip questions based on what the patient picks. Example from the Medical flow:

- **Q1** "How would you describe your pain level?"
- **Q2** "How long have you had these symptoms?"
- **Q3** "Do you have a fever?"

The "Severe — I can't function" answer on Q1 has `nextQuestion=Q3` — it **skips Q2** because the patient already indicated high acuity. They jump straight to fever.

```
resolveNextQuestion(answer, currentId, questions):
  if answer.nextQuestion is set → return that question ID
  else → return the next question by sortOrder
```

### 3.4 Progress bar math (patient UX)

```
progress% = (answeredCount / totalQuestionsInSet) × 100
```

We report `answeredCount` (not current index) so skipping Q2 via branch doesn't make the bar jump backwards when the patient returns to Q3.

---

## 4. Concrete Examples

### 4.1 Medical: moderate pain, few days, no fever

| Question | Answer | Weight |
|----------|--------|--------|
| Care preference | "No preference" | 0 |
| Pain level | "Moderate — it's hard to focus" | **5** |
| Symptom duration | "A few days" | **3** |
| Fever | "No" | 0 |
| **Total score** | | **8** |

**Classification:** 8 ≥ 5 (Semi-Urgent threshold) but < 10 (Urgent) → **Semi-Urgent**
**Result:** Routed to Virtual Care + Lackey Clinic, with the Virtual Care interstitial shown first (`virtualCareEligible=true`).

### 4.2 Medical: severe pain, fever (skips Q2 via branch)

| Question | Answer | Weight |
|----------|--------|--------|
| Care preference | "No preference" | 0 |
| Pain level | "Severe — I can't function" | **8** |
| ~~Duration~~ | (skipped via `nextQuestion` branch) | — |
| Fever | "Yes" | **4** |
| **Total score** | | **12** |

**Classification:** 12 ≥ 10 → **Urgent**
**Result:** Routed to urgent cares (Sentara Wards Corner, AFC, 3 Velocity, 3 Patient First) + Virtual Care as a backup option.

### 4.3 Behavioral Health: self-harm disclosure

| Question | Answer | Weight | Escalate |
|----------|--------|--------|----------|
| Self-harm thoughts | "Yes" | 10 | **TRUE** |

**Classification:** Scoring is **bypassed**. `checkEscalation` returns true. Patient sees full-screen 911 alert with click-to-call. Session is logged with `emergencyScreenTriggered=true`.

### 4.4 Medication: anaphylaxis symptoms

| Question | Answer | Weight | Escalate |
|----------|--------|--------|----------|
| Reaction | "Yes, difficulty breathing or swelling" | 10 | **TRUE** |

**Classification:** Again bypassed by escalation flag. Immediate 911 routing.

### 4.5 "Not Sure" → meta-redirect

| Question | Answer | redirectToCareType |
|----------|--------|---------------------|
| "What's going on?" | "I'm feeling anxious, depressed..." | **Behavioral Health** |

**Classification:** No score is kept. Client-side router replaces the URL with `/triage?careType=<BehavioralHealth.id>` and the patient starts fresh in that flow.

### 4.6 Elective edge case (all zero-weight answers)

| Question | Answer | Weight |
|----------|--------|--------|
| Care preference | "No preference" | 0 |
| Pain level | "No pain" | 0 |
| Duration | (never reached) | — |
| Fever | "No" | 0 |
| **Total score** | | **0** |

**Classification:** 0 ≥ 0 (Elective catch-all) → **Elective**
**Result:** Still routed to Lackey Clinic + Virtual Care (not a dead end). The lowest-threshold level is always returned thanks to the `?? sorted[sorted.length - 1]` fallback.

---

## 5. Routing Rules

### 5.1 How resources are selected

For each combination of `(CareType, UrgencyLevel)` there is **at most one** RoutingRule (enforced by a `beforeValidate` hook on the collection). The rule contains:

| Field | Meaning |
|-------|---------|
| `resources[]` | Ordered list of `CareResource` IDs to show the patient |
| `virtualCareEligible` | If true, patient sees the Virtual Care interstitial before the resource list |
| `actionText` | Primary CTA headline on the results page (localized) |
| `nextSteps` | Rich-text extended instructions (optional, localized) |

The Cartesian grid is **7 care types × 6 urgency levels = 42 cells**, though not every cell has a rule — some combinations (e.g., Dental Life-Threatening) simply route to the ER.

### 5.2 Example: Medical × Urgent routing rule

```
actionText:           "Visit urgent care or start a free virtual visit"
virtualCareEligible:  true
resources (in order):
  1. Sentara Urgent Care - Wards Corner
  2. AFC Urgent Care Norfolk
  3. Velocity Urgent Care - Little Creek
  4. Velocity Urgent Care - Chimney Hill
  5. Velocity Urgent Care - Town Center
  6. Patient First - Newtown Road
  7. Patient First - General Booth
  8. Patient First - Cedar Road
  9. Lackey Virtual Care (phone-only, sorts last when location is shared)
```

### 5.3 Distance-based re-sorting on the client

If the patient taps **"Find closest to me"**:
1. Browser geolocation → lat/lng (or ZIP fallback → Hampton Roads centroid lookup)
2. Haversine distance computed per resource
3. Resources are stable-sorted by distance ascending
4. Resources without coordinates (Virtual Care, Crisis Line) sort last

Coordinates never leave the browser — they're used only for local sorting.

---

## 6. Safety Mechanisms

The algorithm has **four** overrides that can bypass normal scoring, listed in order of precedence:

| Override | Trigger | Effect |
|----------|---------|--------|
| 1. Emergency screen | Patient checks any symptom on the pre-triage screen | Immediate full-screen 911 alert, flow ENDS |
| 2. `escalateImmediately` on any answer | E.g., "Yes" to self-harm question | Skip score, skip routing lookup, show 911 alert |
| 3. `redirectToCareType` on any answer | Meta-triage ("Not Sure") answers | Restart flow in the chosen care type |
| 4. Missing routing rule | Misconfigured CMS (rule deleted for a valid urgency+caretype) | Fall back to Lackey Clinic phone + Virtual Care URL from static-content |

### 6.1 Server-side re-scoring

The client computes a running total for UX (progress bar, etc.), but the **server ignores it**. When the client POSTs to `/api/triage/evaluate`, only `{ careTypeId, answers[] }` is sent. The server re-calls `calculateScore()` + `classifyUrgency()` authoritatively. This prevents a tampered client from forcing a favorable routing.

### 6.2 Input validation

- `careTypeId` regex-allowlisted (`/^[A-Za-z0-9_-]{1,64}$/`) before any DB query
- Each answer must have `typeof urgencyWeight === 'number'` — malformed answers → 400
- Rate limited to 30 req/min/IP (sliding-window, in-memory for pilot)
- Locale/device constrained to enum values (`en|es`, `mobile|tablet|desktop`)

---

## 7. Analytics Captured

Each completed triage writes one anonymous `TriageSession` row:

```
{
  sessionId                   // UUIDv4, not tied to any user identity
  careTypeSelected            // FK → CareType
  urgencyResult               // FK → UrgencyLevel
  resourcesShown[]            // FK[] → CareResource
  virtualCareOffered          // bool
  emergencyScreenTriggered    // bool
  completedFlow               // bool
  locale                      // 'en' | 'es'
  device                      // 'mobile' | 'tablet' | 'desktop'
  questionSetVersion          // int (so clinical changes can be A/B'd cleanly)
  createdAt                   // timestamp
}
```

**No patient identifiers, no answer values, no location coordinates, no free-text.** The CEO dashboard aggregates these rows into pacing, routing mix, care-type breakdown, hourly heatmap, and partner referral charts.

---

## 8. How to Change the Algorithm

Everything is CMS-editable — no code changes required:

| To change… | Edit in admin |
|-----------|---------------|
| A question or answer label | **Triage Logic → Questions** |
| An answer's urgency weight | **Triage Logic → Questions → Answers** |
| An escalation trigger | Toggle `escalateImmediately` on the answer |
| Score thresholds | **Triage Logic → Urgency Levels** |
| Which resources show for a given routing | **Triage Logic → Routing Rules** |
| A new care type entirely | **Triage Logic → Care Types** → add → create a Question Set for it |
| A new clinic address or phone | **Content → Care Resources** |
| The 911 symptom list | **Content → Emergency Symptoms** |

**Ship a clinical change safely:**
1. Create a new QuestionSet with `version=2` and `isActive=false`
2. Tweak questions/weights inside it
3. Preview via a direct URL
4. Flip `isActive=true` on v2 and `isActive=false` on v1 when ready
5. `questionSetVersion` in each session row lets you measure the impact

---

## 9. Known Limitations (as of pilot)

1. **Flat scoring model.** All weights sum linearly. Real clinical triage often uses red-flag overrides (e.g., "any chest pain + age ≥ 50 = always Urgent"). We handle the most critical ones via `escalateImmediately`, but nuanced multi-factor rules aren't expressible yet.
2. **No demographics.** The algorithm doesn't know age, pregnancy status, existing conditions, or meds. If a patient is 75 with diabetes, "moderate pain" should probably weigh more heavily — it doesn't today.
3. **Single active QuestionSet per CareType.** No A/B testing yet; `questionSetVersion` in sessions only tracks what was active at the time.
4. **No clinical-protocol alignment claim.** Weights were drafted by the build team for demo purposes and need clinical review against Schmitt-Thompson nurse protocols or similar evidence base.
5. **`timeToCare` is not yet localized** at the schema level — Spanish users see English time descriptions ("Same day" instead of "El mismo día"). Requires a proper Payload migration to fix.
6. **Progress bar** counts against total questions in the set, but branches can end a flow early — occasional jump from 75% → results page is expected.

---

## 10. Files & Line Numbers

| Function | File | Approximate lines |
|----------|------|-------------------|
| `calculateScore` | `src/lib/triage-engine.ts` | 29–31 |
| `classifyUrgency` | `src/lib/triage-engine.ts` | 33–40 |
| `resolveNextQuestion` | `src/lib/triage-engine.ts` | 42–52 |
| `checkEscalation` | `src/lib/triage-engine.ts` | 54–56 |
| Server evaluation | `src/app/api/triage/evaluate/route.ts` | 1–150 |
| Client state machine | `src/hooks/useTriage.ts` | 1–130 |
| Rate limiter | `src/lib/rate-limit.ts` | 1–30 |
| Session log failure counter | `src/lib/observability.ts` | 1–60 |
| Routing rule DB seed | `src/seed/routing-rules.ts` | 1–100 |
| Question set DB seed | `src/seed/question-sets.ts` | 1–600+ |
