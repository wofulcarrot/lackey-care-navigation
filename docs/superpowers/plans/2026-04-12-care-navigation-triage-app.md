# Care Navigation Triage App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, bilingual care navigation triage app for Lackey Clinic that guides uninsured adults in Norfolk, VA to the right level of care using a CMS-configurable rule-based decision tree.

**Architecture:** Next.js 15 app with Payload CMS 3 embedded (single deploy). Payload manages all data collections and serves the admin panel at `/admin`. Patient-facing triage wizard is a React client with server-side data fetching. Triage engine runs as Next.js API routes reading rules from PostgreSQL via Payload's data layer.

**Tech Stack:** Next.js 15, React 19, Payload CMS 3, PostgreSQL (via Drizzle ORM), Tailwind CSS 4, next-intl, Vitest, Playwright, Vercel

**Spec:** `docs/superpowers/specs/2026-04-12-referral-landing-page-design.md`

---

## File Structure

```
src/
├── app/
│   ├── (frontend)/              # Patient-facing routes (no admin layout)
│   │   ├── [locale]/
│   │   │   ├── layout.tsx       # Frontend layout: header, footer, locale provider
│   │   │   ├── page.tsx         # Landing page (Screen 1)
│   │   │   ├── emergency/
│   │   │   │   └── page.tsx     # Emergency symptom screen (Screen 2)
│   │   │   ├── care-type/
│   │   │   │   └── page.tsx     # Care type selection (Screen 3)
│   │   │   ├── triage/
│   │   │   │   └── page.tsx     # Triage question wizard (Screens 4-N)
│   │   │   ├── virtual-care/
│   │   │   │   └── page.tsx     # Virtual Care interstitial (conditional)
│   │   │   └── results/
│   │   │       └── page.tsx     # Results + resource cards (final screen)
│   │   └── layout.tsx           # Root frontend layout
│   ├── (payload)/               # Payload admin routes (auto-generated)
│   │   └── admin/
│   │       └── [[...segments]]/
│   │           └── page.tsx
│   ├── api/
│   │   ├── triage/
│   │   │   └── evaluate/
│   │   │       └── route.ts     # POST: evaluate triage answers → urgency + resources
│   │   └── [...payload]/
│   │       └── route.ts         # Payload REST API catch-all
│   ├── layout.tsx               # Root layout
│   └── (payload)/admin/
│       └── importMap.js
├── collections/
│   ├── CareTypes.ts
│   ├── QuestionSets.ts
│   ├── Questions.ts
│   ├── UrgencyLevels.ts
│   ├── CareResources.ts
│   ├── RoutingRules.ts
│   ├── EmergencySymptoms.ts
│   ├── StaticContent.ts
│   ├── TriageSessions.ts
│   └── Users.ts                 # Admin users (Payload built-in, customized with roles)
├── components/
│   ├── Header.tsx               # Language toggle + 911 link + Lackey logo
│   ├── Footer.tsx               # "Powered by Lackey Clinic" + privacy note
│   ├── EmergencyBanner.tsx      # Persistent red 911 banner
│   ├── ProgressBar.tsx          # Triage progress indicator
│   ├── QuestionCard.tsx         # Renders one question with answer options
│   ├── ResourceCard.tsx         # Resource listing with phone/map/hours
│   ├── CareTypeCard.tsx         # Icon card for care type selection
│   ├── VirtualCareInterstitial.tsx  # Virtual Care benefits + CTA
│   ├── EmergencyAlert.tsx       # Full-screen 911 alert
│   └── ErrorFallback.tsx        # "Never a dead end" fallback UI
├── lib/
│   ├── triage-engine.ts         # Core scoring + routing logic (pure functions)
│   ├── triage-engine.test.ts    # Unit tests for triage engine
│   └── device.ts                # Device detection (mobile/tablet/desktop)
├── hooks/
│   └── useTriage.ts             # Client-side triage state machine
├── i18n/
│   ├── request.ts               # next-intl server config
│   ├── routing.ts               # Locale routing config
│   └── messages/
│       ├── en.json              # English UI strings
│       └── es.json              # Spanish UI strings
├── seed/
│   ├── seed.ts                  # Main seed script
│   ├── emergency-symptoms.ts    # Norfolk emergency symptom data
│   ├── care-types.ts            # 7 care types including "Not Sure"
│   ├── urgency-levels.ts        # 6 urgency tiers with thresholds
│   ├── care-resources.ts        # Norfolk provider directory
│   ├── question-sets.ts         # Initial triage questions per care type
│   └── routing-rules.ts         # Urgency × care type → resource mappings
├── views/
│   └── AnalyticsDashboard.tsx   # Custom Payload admin view for analytics
├── payload.config.ts            # Payload CMS configuration
└── payload-types.ts             # Auto-generated types (via Payload)

tests/
├── e2e/
│   ├── emergency-flow.spec.ts
│   ├── medical-triage.spec.ts
│   ├── not-sure-flow.spec.ts
│   ├── language-toggle.spec.ts
│   └── accessibility.spec.ts
├── integration/
│   └── triage-api.test.ts
playwright.config.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/payload.config.ts`, `src/app/layout.tsx`, `src/app/(payload)/admin/[[...segments]]/page.tsx`, `src/app/api/[...payload]/route.ts`, `.env.example`
- Create: `src/collections/Users.ts`

- [ ] **Step 1: Initialize Next.js + Payload project**

```bash
cd /Users/jeffsims/Lackey
npx create-payload-app@latest care-triage --template blank --db postgres
```

Accept defaults. This scaffolds Next.js 15 + Payload 3 + Drizzle + PostgreSQL.

- [ ] **Step 2: Move scaffolded files to project root**

Move the contents of `care-triage/` into the Lackey project root (or work directly in `care-triage/` — adjust paths accordingly). The scaffolded structure already includes `src/app/`, `src/payload.config.ts`, and the Payload admin routes.

- [ ] **Step 3: Install additional dependencies**

```bash
npm install next-intl @payloadcms/richtext-lexical
npm install -D vitest @vitejs/plugin-react playwright @axe-core/playwright @playwright/test
```

- [ ] **Step 4: Configure Tailwind for mobile-first defaults**

In `tailwind.config.ts`, set base font to 18px and extend theme with the urgency color palette:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        base: ['18px', '1.5'],
      },
      colors: {
        urgency: {
          'life-threatening': '#FEE2E2',
          emergent: '#FFEDD5',
          urgent: '#FEF9C3',
          'semi-urgent': '#DCFCE7',
          routine: '#DBEAFE',
          elective: '#EDE9FE',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 5: Create `.env.example`**

```env
DATABASE_URI=postgresql://user:pass@localhost:5432/care_triage
PAYLOAD_SECRET=your-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 6: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 7: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

- [ ] **Step 8: Verify scaffold runs**

```bash
npm run dev
```

Verify: Next.js starts, Payload admin loads at `http://localhost:3000/admin`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js + Payload CMS project with Tailwind, Vitest, Playwright"
```

---

## Task 2: Payload Collections — Data Model

**Files:**
- Create: `src/collections/CareTypes.ts`, `src/collections/QuestionSets.ts`, `src/collections/Questions.ts`, `src/collections/UrgencyLevels.ts`, `src/collections/CareResources.ts`, `src/collections/RoutingRules.ts`, `src/collections/EmergencySymptoms.ts`, `src/collections/StaticContent.ts`, `src/collections/TriageSessions.ts`
- Modify: `src/payload.config.ts` (register all collections)
- Modify: `src/collections/Users.ts` (add role field)

- [ ] **Step 1: Add role field to Users collection**

Modify `src/collections/Users.ts` to add a `role` select field with options `admin` and `editor`:

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Create CareTypes collection**

Create `src/collections/CareTypes.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const CareTypes: CollectionConfig = {
  slug: 'care-types',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'icon', type: 'text', required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    { name: 'isMeta', type: 'checkbox', defaultValue: false,
      admin: { description: 'If true, this care type routes to another care type (e.g., "Not Sure")' } },
  ],
}
```

- [ ] **Step 3: Create UrgencyLevels collection**

Create `src/collections/UrgencyLevels.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const UrgencyLevels: CollectionConfig = {
  slug: 'urgency-levels',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'color', type: 'text', required: true,
      admin: { description: 'Hex color for UI badge (e.g., #FEE2E2)' } },
    { name: 'scoreThreshold', type: 'number', required: true,
      admin: { description: 'Minimum cumulative score. Evaluated highest-first; first match wins.' } },
    { name: 'timeToCare', type: 'text', required: true,
      admin: { description: 'e.g., "Immediate", "Same Day", "1-3 Days"' } },
    { name: 'description', type: 'textarea', localized: true },
  ],
}
```

- [ ] **Step 4: Create Questions collection**

Create `src/collections/Questions.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const Questions: CollectionConfig = {
  slug: 'questions',
  admin: { useAsTitle: 'text' },
  fields: [
    { name: 'text', type: 'text', required: true, localized: true },
    { name: 'helpText', type: 'textarea', localized: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Single Choice', value: 'single_choice' },
        { label: 'Multiple Choice', value: 'multi_choice' },
        { label: 'Yes / No', value: 'yes_no' },
      ],
    },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    {
      name: 'answers',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'urgencyWeight', type: 'number', required: true, defaultValue: 0 },
        { name: 'escalateImmediately', type: 'checkbox', defaultValue: false,
          admin: { description: 'If true, immediately route to 911/ER' } },
        { name: 'nextQuestion', type: 'relationship', relationTo: 'questions',
          admin: { description: 'Optional: jump to this question instead of following sortOrder' } },
        { name: 'redirectToCareType', type: 'relationship', relationTo: 'care-types',
          admin: { description: 'For "Not Sure" meta-triage: route into this care type\'s questions' } },
      ],
    },
  ],
}
```

- [ ] **Step 5: Create QuestionSets collection**

Create `src/collections/QuestionSets.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const QuestionSets: CollectionConfig = {
  slug: 'question-sets',
  admin: {
    useAsTitle: 'careType',
    description: 'Versioned groups of triage questions. Only one active set per care type.',
  },
  fields: [
    { name: 'careType', type: 'relationship', relationTo: 'care-types', required: true },
    { name: 'questions', type: 'relationship', relationTo: 'questions', hasMany: true, required: true },
    { name: 'version', type: 'number', required: true, defaultValue: 1 },
    { name: 'isActive', type: 'checkbox', defaultValue: false,
      admin: { description: 'Only one set per care type should be active' } },
  ],
}
```

- [ ] **Step 6: Create CareResources collection**

Create `src/collections/CareResources.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const CareResources: CollectionConfig = {
  slug: 'care-resources',
  admin: { useAsTitle: 'name' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Emergency Room', value: 'er' },
        { label: 'Urgent Care', value: 'urgent_care' },
        { label: 'Primary Care', value: 'primary_care' },
        { label: 'Dental', value: 'dental' },
        { label: 'Virtual Care', value: 'virtual' },
        { label: 'Pharmacy', value: 'pharmacy' },
        { label: 'Social Services', value: 'social_services' },
        { label: 'Crisis Line', value: 'crisis_line' },
      ],
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
      ],
    },
    { name: 'phone', type: 'text' },
    {
      name: 'hours',
      type: 'array',
      fields: [
        { name: 'day', type: 'text', required: true },
        { name: 'open', type: 'text', required: true },
        { name: 'close', type: 'text', required: true },
      ],
    },
    { name: 'is24_7', type: 'checkbox', defaultValue: false },
    { name: 'website', type: 'text' },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'cost',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Sliding Scale', value: 'sliding_scale' },
        { label: 'Insurance Required', value: 'insurance_required' },
      ],
    },
    { name: 'eligibility', type: 'textarea', localized: true },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
    { name: 'temporaryNotice', type: 'text', localized: true,
      admin: { description: 'Alert banner shown on the resource card (e.g., "Closed for holiday until Jan 2")' } },
    { name: 'temporaryNoticeExpires', type: 'date',
      admin: { description: 'Auto-clears the temporary notice after this date' } },
  ],
}
```

- [ ] **Step 7: Create RoutingRules collection**

Create `src/collections/RoutingRules.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const RoutingRules: CollectionConfig = {
  slug: 'routing-rules',
  admin: {
    description: 'Maps (CareType + UrgencyLevel) to resources and actions.',
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'careType', type: 'relationship', relationTo: 'care-types', required: true },
    { name: 'urgencyLevel', type: 'relationship', relationTo: 'urgency-levels', required: true },
    { name: 'resources', type: 'relationship', relationTo: 'care-resources', hasMany: true, required: true },
    { name: 'virtualCareEligible', type: 'checkbox', defaultValue: false },
    { name: 'actionText', type: 'text', required: true, localized: true,
      admin: { description: 'Primary CTA text, e.g., "Call 911", "Start a Free Virtual Visit"' } },
    { name: 'nextSteps', type: 'richText', localized: true },
  ],
}
```

- [ ] **Step 8: Create EmergencySymptoms collection**

Create `src/collections/EmergencySymptoms.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const EmergencySymptoms: CollectionConfig = {
  slug: 'emergency-symptoms',
  admin: { useAsTitle: 'symptom' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'symptom', type: 'text', required: true, localized: true },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],
}
```

- [ ] **Step 9: Create StaticContent global**

Create `src/collections/StaticContent.ts` — this is a Payload Global (singleton), not a collection:

```ts
import type { GlobalConfig } from 'payload'

export const StaticContent: GlobalConfig = {
  slug: 'static-content',
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
  },
  fields: [
    { name: 'heroTitle', type: 'text', required: true, localized: true },
    { name: 'heroSubtitle', type: 'text', localized: true },
    { name: 'virtualCareUrl', type: 'text', required: true,
      admin: { description: 'Fabric intake URL for Virtual Care handoff' } },
    { name: 'virtualCareHeading', type: 'text', localized: true },
    { name: 'virtualCareBullets', type: 'array', fields: [
      { name: 'text', type: 'text', required: true, localized: true },
    ]},
    { name: 'eligibilityIntakeUrl', type: 'text', required: true,
      admin: { description: 'JotForm URL now; swap to DataCare 2.0 later' } },
    { name: 'clinicPhone', type: 'text', required: true,
      admin: { description: 'Lackey Clinic main phone number for fallback' } },
    { name: 'privacyNote', type: 'text', localized: true },
    { name: 'footerText', type: 'text', localized: true },
  ],
}
```

- [ ] **Step 10: Create TriageSessions collection**

Create `src/collections/TriageSessions.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const TriageSessions: CollectionConfig = {
  slug: 'triage-sessions',
  admin: {
    description: 'Anonymous analytics. Zero PII.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,  // Public — the patient-facing app logs sessions
    update: () => false,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'sessionId', type: 'text', required: true },
    { name: 'careTypeSelected', type: 'relationship', relationTo: 'care-types' },
    { name: 'urgencyResult', type: 'relationship', relationTo: 'urgency-levels' },
    { name: 'resourcesShown', type: 'relationship', relationTo: 'care-resources', hasMany: true },
    { name: 'virtualCareOffered', type: 'checkbox', defaultValue: false },
    { name: 'emergencyScreenTriggered', type: 'checkbox', defaultValue: false },
    { name: 'completedFlow', type: 'checkbox', defaultValue: false },
    { name: 'locale', type: 'select', options: [
      { label: 'English', value: 'en' },
      { label: 'Spanish', value: 'es' },
    ]},
    { name: 'device', type: 'select', options: [
      { label: 'Mobile', value: 'mobile' },
      { label: 'Tablet', value: 'tablet' },
      { label: 'Desktop', value: 'desktop' },
    ]},
    { name: 'questionSetVersion', type: 'number' },
  ],
}
```

- [ ] **Step 11: Register all collections in payload.config.ts**

Modify `src/payload.config.ts` to import and register all collections and the StaticContent global:

```ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { CareTypes } from './collections/CareTypes'
import { QuestionSets } from './collections/QuestionSets'
import { Questions } from './collections/Questions'
import { UrgencyLevels } from './collections/UrgencyLevels'
import { CareResources } from './collections/CareResources'
import { RoutingRules } from './collections/RoutingRules'
import { EmergencySymptoms } from './collections/EmergencySymptoms'
import { TriageSessions } from './collections/TriageSessions'
import { StaticContent } from './collections/StaticContent'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug },
  collections: [
    Users,
    CareTypes,
    QuestionSets,
    Questions,
    UrgencyLevels,
    CareResources,
    RoutingRules,
    EmergencySymptoms,
    TriageSessions,
  ],
  globals: [StaticContent],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI || '' } }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Spanish', code: 'es' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
})
```

- [ ] **Step 12: Run dev to generate schema and verify admin**

```bash
npm run dev
```

Verify: Payload admin loads at `/admin`. All collections appear in the sidebar. Create a test admin user. Confirm localized fields show EN/ES tabs.

- [ ] **Step 13: Generate Payload types**

```bash
npx payload generate:types
```

Verify: `src/payload-types.ts` is created with types for all collections.

- [ ] **Step 14: Commit**

```bash
git add src/collections/ src/payload.config.ts src/payload-types.ts
git commit -m "feat: define all Payload collections and globals for triage data model"
```

---

## Task 3: Triage Engine — Core Logic

**Files:**
- Create: `src/lib/triage-engine.ts`
- Create: `src/lib/triage-engine.test.ts`

- [ ] **Step 1: Write failing tests for score accumulation**

Create `src/lib/triage-engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calculateScore, classifyUrgency, resolveNextQuestion } from './triage-engine'

describe('calculateScore', () => {
  it('sums urgency weights from selected answers', () => {
    const answers = [
      { answerId: 'a1', urgencyWeight: 3 },
      { answerId: 'a2', urgencyWeight: 5 },
      { answerId: 'a3', urgencyWeight: 2 },
    ]
    expect(calculateScore(answers)).toBe(10)
  })

  it('returns 0 for empty answers', () => {
    expect(calculateScore([])).toBe(0)
  })
})

describe('classifyUrgency', () => {
  const levels = [
    { id: 'life', name: 'Life-Threatening', scoreThreshold: 20 },
    { id: 'emergent', name: 'Emergent', scoreThreshold: 15 },
    { id: 'urgent', name: 'Urgent', scoreThreshold: 10 },
    { id: 'semi', name: 'Semi-Urgent', scoreThreshold: 5 },
    { id: 'routine', name: 'Routine', scoreThreshold: 0 },
  ]

  it('matches highest threshold first', () => {
    expect(classifyUrgency(22, levels)?.id).toBe('life')
  })

  it('matches exact threshold boundary', () => {
    expect(classifyUrgency(15, levels)?.id).toBe('emergent')
  })

  it('falls to lowest level for low score', () => {
    expect(classifyUrgency(2, levels)?.id).toBe('routine')
  })

  it('returns null for empty levels', () => {
    expect(classifyUrgency(10, [])).toBeNull()
  })
})

describe('resolveNextQuestion', () => {
  const questions = [
    { id: 'q1', sortOrder: 1 },
    { id: 'q2', sortOrder: 2 },
    { id: 'q3', sortOrder: 3 },
  ]

  it('follows nextQuestion override when set', () => {
    const answer = { nextQuestion: 'q3' }
    expect(resolveNextQuestion(answer, 'q1', questions)).toBe('q3')
  })

  it('falls back to next by sortOrder when no override', () => {
    const answer = { nextQuestion: null }
    expect(resolveNextQuestion(answer, 'q1', questions)).toBe('q2')
  })

  it('returns null when at last question', () => {
    const answer = { nextQuestion: null }
    expect(resolveNextQuestion(answer, 'q3', questions)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/triage-engine.test.ts
```

Expected: FAIL — module `./triage-engine` not found.

- [ ] **Step 3: Implement triage engine**

Create `src/lib/triage-engine.ts`:

```ts
interface AnswerScore {
  answerId: string
  urgencyWeight: number
}

interface UrgencyLevel {
  id: string
  name: string
  scoreThreshold: number
}

interface Answer {
  nextQuestion: string | null
}

interface Question {
  id: string
  sortOrder: number
}

export function calculateScore(answers: AnswerScore[]): number {
  return answers.reduce((sum, a) => sum + a.urgencyWeight, 0)
}

export function classifyUrgency(
  score: number,
  levels: UrgencyLevel[],
): UrgencyLevel | null {
  if (levels.length === 0) return null
  const sorted = [...levels].sort((a, b) => b.scoreThreshold - a.scoreThreshold)
  return sorted.find((level) => score >= level.scoreThreshold) ?? null
}

export function resolveNextQuestion(
  answer: Answer,
  currentQuestionId: string,
  questions: Question[],
): string | null {
  if (answer.nextQuestion) return answer.nextQuestion
  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentIndex = sorted.findIndex((q) => q.id === currentQuestionId)
  if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null
  return sorted[currentIndex + 1].id
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/triage-engine.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Add tests for escalation and meta-triage**

Append to `src/lib/triage-engine.test.ts`:

```ts
import { checkEscalation, checkMetaRedirect } from './triage-engine'

describe('checkEscalation', () => {
  it('returns true when any answer has escalateImmediately', () => {
    const answers = [
      { escalateImmediately: false },
      { escalateImmediately: true },
    ]
    expect(checkEscalation(answers)).toBe(true)
  })

  it('returns false when no answers escalate', () => {
    const answers = [
      { escalateImmediately: false },
      { escalateImmediately: false },
    ]
    expect(checkEscalation(answers)).toBe(false)
  })
})

describe('checkMetaRedirect', () => {
  it('returns the redirected care type ID when set', () => {
    const answer = { redirectToCareType: 'dental' }
    expect(checkMetaRedirect(answer)).toBe('dental')
  })

  it('returns null when no redirect', () => {
    const answer = { redirectToCareType: null }
    expect(checkMetaRedirect(answer)).toBeNull()
  })
})
```

- [ ] **Step 6: Run to verify new tests fail**

```bash
npx vitest run src/lib/triage-engine.test.ts
```

Expected: FAIL — `checkEscalation` and `checkMetaRedirect` not found.

- [ ] **Step 7: Implement escalation and meta-redirect**

Append to `src/lib/triage-engine.ts`:

```ts
interface EscalatableAnswer {
  escalateImmediately: boolean
}

interface MetaAnswer {
  redirectToCareType: string | null
}

export function checkEscalation(answers: EscalatableAnswer[]): boolean {
  return answers.some((a) => a.escalateImmediately)
}

export function checkMetaRedirect(answer: MetaAnswer): string | null {
  return answer.redirectToCareType ?? null
}
```

- [ ] **Step 8: Run all tests to verify pass**

```bash
npx vitest run src/lib/triage-engine.test.ts
```

Expected: All 11 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/triage-engine.ts src/lib/triage-engine.test.ts
git commit -m "feat: implement triage engine with scoring, classification, branching, escalation"
```

---

## Task 4: Triage API Route

**Files:**
- Create: `src/app/api/triage/evaluate/route.ts`
- Create: `tests/integration/triage-api.test.ts`

- [ ] **Step 1: Write failing integration test**

Create `tests/integration/triage-api.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calculateScore, classifyUrgency } from '@/lib/triage-engine'

// Integration test: verifies the evaluation pipeline end-to-end with mock data
describe('triage evaluation pipeline', () => {
  const urgencyLevels = [
    { id: 'life', name: 'Life-Threatening', scoreThreshold: 20 },
    { id: 'emergent', name: 'Emergent', scoreThreshold: 15 },
    { id: 'urgent', name: 'Urgent', scoreThreshold: 10 },
    { id: 'semi', name: 'Semi-Urgent', scoreThreshold: 5 },
    { id: 'routine', name: 'Routine', scoreThreshold: 0 },
  ]

  it('medical answers scoring 12 → Urgent classification', () => {
    const answers = [
      { answerId: 'a1', urgencyWeight: 5 },
      { answerId: 'a2', urgencyWeight: 4 },
      { answerId: 'a3', urgencyWeight: 3 },
    ]
    const score = calculateScore(answers)
    const level = classifyUrgency(score, urgencyLevels)
    expect(score).toBe(12)
    expect(level?.id).toBe('urgent')
  })

  it('low-scoring answers → Routine classification', () => {
    const answers = [
      { answerId: 'a1', urgencyWeight: 1 },
      { answerId: 'a2', urgencyWeight: 2 },
    ]
    const score = calculateScore(answers)
    const level = classifyUrgency(score, urgencyLevels)
    expect(score).toBe(3)
    expect(level?.id).toBe('routine')
  })
})
```

- [ ] **Step 2: Run integration tests to verify pass**

```bash
npx vitest run tests/integration/triage-api.test.ts
```

Expected: PASS (these use already-implemented functions).

- [ ] **Step 3: Implement triage API route**

Create `src/app/api/triage/evaluate/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { calculateScore, classifyUrgency, checkEscalation } from '@/lib/triage-engine'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { careTypeId, answers, locale = 'en', device = 'mobile' } = body

    if (!careTypeId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'careTypeId and answers[] are required' },
        { status: 400 },
      )
    }

    // Check for immediate escalation
    if (checkEscalation(answers)) {
      return NextResponse.json({
        escalate: true,
        urgencyLevel: null,
        resources: [],
        actionText: 'Call 911',
      })
    }

    const payload = await getPayload({ config })

    // Calculate score and classify urgency
    const score = calculateScore(answers)
    const urgencyLevelsResult = await payload.find({
      collection: 'urgency-levels',
      sort: '-scoreThreshold',
      limit: 100,
      locale,
    })
    const urgencyLevel = classifyUrgency(score, urgencyLevelsResult.docs.map((d) => ({
      id: String(d.id),
      name: typeof d.name === 'string' ? d.name : '',
      scoreThreshold: d.scoreThreshold,
    })))

    if (!urgencyLevel) {
      return NextResponse.json({
        escalate: false,
        urgencyLevel: null,
        resources: [],
        actionText: 'Contact Lackey Clinic',
        fallback: true,
      })
    }

    // Find routing rule
    const routingRules = await payload.find({
      collection: 'routing-rules',
      where: {
        and: [
          { careType: { equals: careTypeId } },
          { urgencyLevel: { equals: urgencyLevel.id } },
        ],
      },
      locale,
      depth: 2,
    })

    const rule = routingRules.docs[0]

    if (!rule) {
      // Fallback: no routing rule found
      const staticContent = await payload.findGlobal({ slug: 'static-content', locale })
      return NextResponse.json({
        escalate: false,
        urgencyLevel,
        resources: [],
        actionText: 'Contact Lackey Clinic',
        clinicPhone: staticContent.clinicPhone,
        virtualCareUrl: staticContent.virtualCareUrl,
        fallback: true,
      })
    }

    // Log anonymous session (fire-and-forget)
    const sessionId = crypto.randomUUID()
    payload.create({
      collection: 'triage-sessions',
      data: {
        sessionId,
        careTypeSelected: careTypeId,
        urgencyResult: urgencyLevel.id,
        resourcesShown: Array.isArray(rule.resources)
          ? rule.resources.map((r: any) => (typeof r === 'object' ? r.id : r))
          : [],
        virtualCareOffered: rule.virtualCareEligible ?? false,
        emergencyScreenTriggered: false,
        completedFlow: true,
        locale,
        device,
        questionSetVersion: body.questionSetVersion ?? null,
      },
    }).catch(() => {}) // Fire-and-forget: never block patient flow

    return NextResponse.json({
      escalate: false,
      urgencyLevel,
      resources: rule.resources,
      virtualCareEligible: rule.virtualCareEligible,
      actionText: rule.actionText,
      nextSteps: rule.nextSteps,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong. Please call Lackey Clinic directly.', fallback: true },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/triage/evaluate/route.ts tests/integration/triage-api.test.ts
git commit -m "feat: add triage evaluation API route with fallback handling"
```

---

## Task 5: Internationalization Setup

**Files:**
- Create: `src/i18n/request.ts`, `src/i18n/routing.ts`
- Create: `src/i18n/messages/en.json`, `src/i18n/messages/es.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Install and configure next-intl**

Create `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
})
```

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 2: Create English message file**

Create `src/i18n/messages/en.json`:

```json
{
  "landing": {
    "hero": "Get the right care, right now",
    "subtitle": "Free help finding the care you need — no insurance required",
    "getCareNow": "Get Care Now",
    "virtualCare": "Start a Free Virtual Visit (24/7)",
    "call911": "Call 911"
  },
  "emergency": {
    "title": "Are you experiencing any of these right now?",
    "noneOfThese": "None of these — continue",
    "alert": "Call 911 Now",
    "alertBody": "Based on your symptoms, please call 911 or go to your nearest emergency room immediately."
  },
  "careType": {
    "title": "What kind of help do you need?",
    "notSure": "I'm not sure — help me decide"
  },
  "triage": {
    "helpText": "What does this mean?",
    "back": "Back",
    "next": "Next"
  },
  "virtualCareInterstitial": {
    "heading": "You may be able to get free care right now",
    "startVisit": "Start Free Virtual Visit",
    "showOther": "Show me other options"
  },
  "results": {
    "heading": "Based on your answers, here's what we recommend",
    "getDirections": "Get directions",
    "call": "Call",
    "eligibility": "Check if you qualify for free care",
    "startOver": "Start over",
    "temporaryNotice": "Notice"
  },
  "common": {
    "privacy": "We don't collect personal information.",
    "poweredBy": "Powered by Lackey Clinic",
    "translationPending": "Translation pending"
  }
}
```

- [ ] **Step 3: Create Spanish message file**

Create `src/i18n/messages/es.json`:

```json
{
  "landing": {
    "hero": "Obtenga la atención adecuada ahora",
    "subtitle": "Ayuda gratuita para encontrar la atención que necesita — no se requiere seguro",
    "getCareNow": "Obtener atención ahora",
    "virtualCare": "Iniciar una visita virtual gratuita (24/7)",
    "call911": "Llamar al 911"
  },
  "emergency": {
    "title": "¿Está experimentando alguno de estos síntomas ahora?",
    "noneOfThese": "Ninguno de estos — continuar",
    "alert": "Llame al 911 ahora",
    "alertBody": "Según sus síntomas, llame al 911 o vaya a la sala de emergencias más cercana de inmediato."
  },
  "careType": {
    "title": "¿Qué tipo de ayuda necesita?",
    "notSure": "No estoy seguro — ayúdeme a decidir"
  },
  "triage": {
    "helpText": "¿Qué significa esto?",
    "back": "Atrás",
    "next": "Siguiente"
  },
  "virtualCareInterstitial": {
    "heading": "Es posible que pueda recibir atención gratuita ahora mismo",
    "startVisit": "Iniciar visita virtual gratuita",
    "showOther": "Mostrar otras opciones"
  },
  "results": {
    "heading": "Según sus respuestas, esto es lo que recomendamos",
    "getDirections": "Obtener direcciones",
    "call": "Llamar",
    "eligibility": "Verifique si califica para atención gratuita",
    "startOver": "Comenzar de nuevo",
    "temporaryNotice": "Aviso"
  },
  "common": {
    "privacy": "No recopilamos información personal.",
    "poweredBy": "Desarrollado por Lackey Clinic",
    "translationPending": "Traducción pendiente"
  }
}
```

- [ ] **Step 4: Update next.config.ts for next-intl**

Add the next-intl plugin to `next.config.ts`:

```ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// ... existing config
export default withNextIntl(nextConfig)
```

- [ ] **Step 5: Verify dev server starts with i18n**

```bash
npm run dev
```

Verify: No errors. Navigating to `/en` and `/es` works.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/ next.config.ts
git commit -m "feat: configure next-intl with EN/ES localization"
```

---

## Task 6: Shared UI Components

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/EmergencyBanner.tsx`, `src/components/ProgressBar.tsx`, `src/components/ErrorFallback.tsx`
- Create: `src/app/(frontend)/[locale]/layout.tsx`

- [ ] **Step 1: Create Header component**

Create `src/components/Header.tsx` with language toggle (EN/ES), persistent 911 link, Lackey logo:

```tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function Header() {
  const locale = useLocale()
  const t = useTranslations('landing')
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: string) {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.replace(segments.join('/'))
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="font-bold text-lg">Lackey Clinic</div>
      <div className="flex items-center gap-3">
        <a
          href="tel:911"
          className="text-red-600 font-bold text-sm px-3 py-1 border border-red-600 rounded-full"
        >
          {t('call911')}
        </a>
        <button
          onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')}
          className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          {locale === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create Footer component**

Create `src/components/Footer.tsx`:

```tsx
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('common')
  return (
    <footer className="px-4 py-6 text-center text-sm text-gray-500 border-t border-gray-200">
      <p>{t('privacy')}</p>
      <p className="mt-1">{t('poweredBy')}</p>
    </footer>
  )
}
```

- [ ] **Step 3: Create EmergencyBanner component**

Create `src/components/EmergencyBanner.tsx`:

```tsx
import { useTranslations } from 'next-intl'

export function EmergencyBanner() {
  const t = useTranslations('landing')
  return (
    <a
      href="tel:911"
      className="block w-full bg-red-600 text-white text-center py-3 font-bold text-lg"
    >
      🚨 {t('call911')}
    </a>
  )
}
```

- [ ] **Step 4: Create ProgressBar component**

Create `src/components/ProgressBar.tsx`:

```tsx
interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Create ErrorFallback component**

Create `src/components/ErrorFallback.tsx`:

```tsx
import { useTranslations } from 'next-intl'

interface ErrorFallbackProps {
  clinicPhone?: string
  virtualCareUrl?: string
}

export function ErrorFallback({ clinicPhone, virtualCareUrl }: ErrorFallbackProps) {
  const t = useTranslations('results')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-2xl font-bold mb-4">We're having trouble loading this page</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {clinicPhone && (
          <a href={`tel:${clinicPhone}`} className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]">
            {t('call')} Lackey Clinic
          </a>
        )}
        {virtualCareUrl && (
          <a href={virtualCareUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-green-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]">
            Start Free Virtual Visit
          </a>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create frontend locale layout**

Create `src/app/(frontend)/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider, useMessages } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!routing.locales.includes(locale as any)) notFound()
  const messages = useMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 7: Verify components render**

```bash
npm run dev
```

Navigate to `http://localhost:3000/en` — verify header with language toggle and 911 link renders. Switch to `/es`.

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/app/\(frontend\)/
git commit -m "feat: add shared UI components — Header, Footer, EmergencyBanner, ProgressBar, ErrorFallback"
```

---

## Task 7: Landing Page (Screen 1)

**Files:**
- Create: `src/app/(frontend)/[locale]/page.tsx`

- [ ] **Step 1: Implement landing page**

Create `src/app/(frontend)/[locale]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function LandingPage() {
  const t = useTranslations('landing')

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 leading-tight">{t('hero')}</h1>
      <p className="text-gray-600 mb-8 text-lg">{t('subtitle')}</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="emergency"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl text-xl font-bold min-h-[48px]"
        >
          {t('getCareNow')}
        </Link>

        <Link
          href="virtual-care"
          className="block w-full bg-green-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('virtualCare')}
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify landing page renders**

```bash
npm run dev
```

Navigate to `/en`. Verify: hero text, "Get Care Now" and "Start a Free Virtual Visit" buttons render. Test `/es` for Spanish.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/page.tsx
git commit -m "feat: add landing page with hero, CTAs, and bilingual support"
```

---

## Task 8: Emergency Screen (Screen 2)

**Files:**
- Create: `src/app/(frontend)/[locale]/emergency/page.tsx`
- Create: `src/components/EmergencyAlert.tsx`

- [ ] **Step 1: Create EmergencyAlert component**

Create `src/components/EmergencyAlert.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'

export function EmergencyAlert() {
  const t = useTranslations('emergency')
  return (
    <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center px-6 text-white text-center z-50">
      <div className="text-6xl mb-6">🚨</div>
      <h1 className="text-3xl font-bold mb-4">{t('alert')}</h1>
      <p className="text-xl mb-8">{t('alertBody')}</p>
      <a
        href="tel:911"
        className="block w-full max-w-sm bg-white text-red-600 text-center py-4 rounded-xl text-2xl font-bold min-h-[48px]"
      >
        {t('alert')}
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Implement emergency screen page**

Create `src/app/(frontend)/[locale]/emergency/page.tsx`:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { EmergencyScreenClient } from './client'

export default async function EmergencyPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const payload = await getPayload({ config })
  const symptoms = await payload.find({
    collection: 'emergency-symptoms',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    limit: 100,
    locale,
  })

  return <EmergencyScreenClient symptoms={symptoms.docs} />
}
```

Create `src/app/(frontend)/[locale]/emergency/client.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { EmergencyAlert } from '@/components/EmergencyAlert'

interface Symptom {
  id: string
  symptom: string
}

export function EmergencyScreenClient({ symptoms }: { symptoms: Symptom[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showAlert, setShowAlert] = useState(false)
  const t = useTranslations('emergency')
  const router = useRouter()

  function toggle(id: string) {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  function handleSubmit() {
    if (checked.size > 0) {
      setShowAlert(true)
    } else {
      router.push('care-type')
    }
  }

  if (showAlert) return <EmergencyAlert />

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-red-700">{t('title')}</h1>
      <div className="flex flex-col gap-3 mb-8">
        {symptoms.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`w-full text-left p-4 rounded-xl border-2 text-lg min-h-[48px] transition ${
              checked.has(s.id)
                ? 'border-red-600 bg-red-50 font-bold'
                : 'border-gray-200 bg-white'
            }`}
          >
            {s.symptom}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
      >
        {checked.size > 0 ? t('alert') : t('noneOfThese')}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify emergency screen**

Navigate to `/en/emergency`. Verify: symptoms render, checking one shows red highlight, submitting with checked symptom shows 911 alert, submitting with none navigates to `/en/care-type`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/emergency/ src/components/EmergencyAlert.tsx
git commit -m "feat: add emergency symptom screen with 911 alert"
```

---

## Task 9: Care Type Selection (Screen 3)

**Files:**
- Create: `src/app/(frontend)/[locale]/care-type/page.tsx`
- Create: `src/components/CareTypeCard.tsx`

- [ ] **Step 1: Create CareTypeCard component**

Create `src/components/CareTypeCard.tsx`:

```tsx
interface CareTypeCardProps {
  icon: string
  name: string
  description: string
  onClick: () => void
}

export function CareTypeCard({ icon, name, description, onClick }: CareTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white text-left min-h-[48px] hover:border-blue-400 transition"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-bold text-lg">{name}</div>
        <div className="text-gray-600 text-sm">{description}</div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Implement care type page**

Create `src/app/(frontend)/[locale]/care-type/page.tsx` — server component fetches CareTypes, renders CareTypeCard for each:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { CareTypeSelectionClient } from './client'

export default async function CareTypePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const payload = await getPayload({ config })
  const careTypes = await payload.find({
    collection: 'care-types',
    sort: 'sortOrder',
    limit: 100,
    locale,
  })

  return <CareTypeSelectionClient careTypes={careTypes.docs} />
}
```

Create `src/app/(frontend)/[locale]/care-type/client.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CareTypeCard } from '@/components/CareTypeCard'

interface CareType {
  id: string
  name: string
  icon: string
  description: string
  isMeta: boolean
}

export function CareTypeSelectionClient({ careTypes }: { careTypes: CareType[] }) {
  const router = useRouter()
  const t = useTranslations('careType')

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <div className="flex flex-col gap-3">
        {careTypes.map((ct) => (
          <CareTypeCard
            key={ct.id}
            icon={ct.icon}
            name={ct.name}
            description={ct.description}
            onClick={() => router.push(`triage?careType=${ct.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify care type selection**

Navigate to `/en/care-type`. Verify: care type cards render (will need seed data — see Task 11). Tapping a card navigates to `/en/triage?careType=<id>`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/care-type/ src/components/CareTypeCard.tsx
git commit -m "feat: add care type selection screen with icon cards"
```

---

## Task 10: Triage Question Wizard (Screens 4-N)

**Files:**
- Create: `src/app/(frontend)/[locale]/triage/page.tsx`, `src/app/(frontend)/[locale]/triage/client.tsx`
- Create: `src/hooks/useTriage.ts`
- Create: `src/components/QuestionCard.tsx`

- [ ] **Step 1: Create useTriage hook**

Create `src/hooks/useTriage.ts` — manages the client-side triage state machine (current question, accumulated answers, score, branching, back navigation):

```tsx
'use client'

import { useState, useCallback } from 'react'

interface Question {
  id: string
  text: string
  helpText?: string
  type: 'single_choice' | 'multi_choice' | 'yes_no'
  sortOrder: number
  answers: Answer[]
}

interface Answer {
  id?: string
  label: string
  urgencyWeight: number
  escalateImmediately: boolean
  nextQuestion?: string | null
  redirectToCareType?: string | null
}

interface TriageState {
  currentQuestionIndex: number
  selectedAnswers: { questionId: string; answers: Answer[] }[]
  totalScore: number
  escalated: boolean
  redirectCareType: string | null
  completed: boolean
}

export function useTriage(questions: Question[]) {
  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder)
  const [state, setState] = useState<TriageState>({
    currentQuestionIndex: 0,
    selectedAnswers: [],
    totalScore: 0,
    escalated: false,
    redirectCareType: null,
    completed: false,
  })

  const currentQuestion = sorted[state.currentQuestionIndex] ?? null

  const submitAnswer = useCallback((answers: Answer[]) => {
    // Check escalation
    if (answers.some((a) => a.escalateImmediately)) {
      setState((prev) => ({ ...prev, escalated: true }))
      return
    }

    // Check meta-redirect
    const redirect = answers.find((a) => a.redirectToCareType)
    if (redirect?.redirectToCareType) {
      setState((prev) => ({ ...prev, redirectCareType: redirect.redirectToCareType! }))
      return
    }

    const scoreAdd = answers.reduce((sum, a) => sum + a.urgencyWeight, 0)
    const currentQ = sorted[state.currentQuestionIndex]

    // Determine next question
    const branchTarget = answers.length === 1 ? answers[0].nextQuestion : null
    let nextIndex: number

    if (branchTarget) {
      nextIndex = sorted.findIndex((q) => q.id === branchTarget)
      if (nextIndex === -1) nextIndex = state.currentQuestionIndex + 1
    } else {
      nextIndex = state.currentQuestionIndex + 1
    }

    const completed = nextIndex >= sorted.length

    setState((prev) => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      selectedAnswers: [...prev.selectedAnswers, { questionId: currentQ.id, answers }],
      totalScore: prev.totalScore + scoreAdd,
      completed,
    }))
  }, [state.currentQuestionIndex, sorted])

  const goBack = useCallback(() => {
    if (state.selectedAnswers.length === 0) return
    const prev = state.selectedAnswers.slice(0, -1)
    const lastAnswer = state.selectedAnswers[state.selectedAnswers.length - 1]
    const scoreRemove = lastAnswer.answers.reduce((sum, a) => sum + a.urgencyWeight, 0)
    const prevIndex = sorted.findIndex((q) => q.id === lastAnswer.questionId)

    setState((s) => ({
      ...s,
      currentQuestionIndex: prevIndex >= 0 ? prevIndex : s.currentQuestionIndex - 1,
      selectedAnswers: prev,
      totalScore: s.totalScore - scoreRemove,
      completed: false,
    }))
  }, [state.selectedAnswers, sorted])

  return {
    currentQuestion,
    questionNumber: state.currentQuestionIndex + 1,
    totalQuestions: sorted.length,
    totalScore: state.totalScore,
    escalated: state.escalated,
    redirectCareType: state.redirectCareType,
    completed: state.completed,
    selectedAnswers: state.selectedAnswers,
    submitAnswer,
    goBack,
    canGoBack: state.selectedAnswers.length > 0,
  }
}
```

- [ ] **Step 2: Create QuestionCard component**

Create `src/components/QuestionCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Answer {
  id?: string
  label: string
  urgencyWeight: number
  escalateImmediately: boolean
  nextQuestion?: string | null
  redirectToCareType?: string | null
}

interface QuestionCardProps {
  text: string
  helpText?: string
  type: 'single_choice' | 'multi_choice' | 'yes_no'
  answers: Answer[]
  onSubmit: (selected: Answer[]) => void
}

export function QuestionCard({ text, helpText, type, answers, onSubmit }: QuestionCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showHelp, setShowHelp] = useState(false)
  const t = useTranslations('triage')

  function handleSelect(index: number) {
    if (type === 'multi_choice') {
      const next = new Set(selected)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      setSelected(next)
    } else {
      // Single choice / yes-no: submit immediately
      onSubmit([answers[index]])
    }
  }

  function handleMultiSubmit() {
    onSubmit(Array.from(selected).map((i) => answers[i]))
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold mb-2">{text}</h2>
      {helpText && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-600 text-sm mb-4 underline min-h-[48px]"
        >
          {t('helpText')}
        </button>
      )}
      {showHelp && helpText && (
        <p className="text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">{helpText}</p>
      )}
      <div className="flex flex-col gap-3">
        {answers.map((a, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`w-full text-left p-4 rounded-xl border-2 text-lg min-h-[48px] transition ${
              selected.has(i) ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200 bg-white'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {type === 'multi_choice' && selected.size > 0 && (
        <button
          onClick={handleMultiSubmit}
          className="mt-4 w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('next')}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Implement triage page**

Create `src/app/(frontend)/[locale]/triage/page.tsx` (server component fetches questions):

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { TriageClient } from './client'

export default async function TriagePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { careType?: string }
}) {
  const careTypeId = searchParams.careType
  if (!careTypeId) return <div>Missing care type</div>

  const payload = await getPayload({ config })

  // Find active question set for this care type
  const questionSets = await payload.find({
    collection: 'question-sets',
    where: {
      and: [
        { careType: { equals: careTypeId } },
        { isActive: { equals: true } },
      ],
    },
    depth: 2,
    locale,
    limit: 1,
  })

  const questionSet = questionSets.docs[0]

  if (!questionSet || !questionSet.questions?.length) {
    // No active question set — skip to results with general resources
    return <div>Redirecting to results...</div>
  }

  return (
    <TriageClient
      careTypeId={careTypeId}
      questions={questionSet.questions as any}
      questionSetVersion={questionSet.version}
    />
  )
}
```

Create `src/app/(frontend)/[locale]/triage/client.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect } from 'react'
import { useTriage } from '@/hooks/useTriage'
import { QuestionCard } from '@/components/QuestionCard'
import { ProgressBar } from '@/components/ProgressBar'
import { EmergencyAlert } from '@/components/EmergencyAlert'

interface Props {
  careTypeId: string
  questions: any[]
  questionSetVersion: number
}

export function TriageClient({ careTypeId, questions, questionSetVersion }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('triage')
  const triage = useTriage(questions)

  // Handle meta-redirect
  useEffect(() => {
    if (triage.redirectCareType) {
      router.replace(`triage?careType=${triage.redirectCareType}`)
    }
  }, [triage.redirectCareType, router])

  // Handle completion — POST to API and navigate to results
  useEffect(() => {
    if (triage.completed) {
      const answers = triage.selectedAnswers.flatMap((sa) =>
        sa.answers.map((a) => ({
          answerId: a.id ?? '',
          urgencyWeight: a.urgencyWeight,
          escalateImmediately: a.escalateImmediately,
        })),
      )
      fetch('/api/triage/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careTypeId,
          answers,
          locale,
          questionSetVersion,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          const encoded = encodeURIComponent(JSON.stringify(data))
          router.push(`results?data=${encoded}`)
        })
        .catch(() => {
          router.push('results?fallback=true')
        })
    }
  }, [triage.completed])

  // Early returns AFTER all hooks (React rules of hooks)
  if (triage.escalated) return <EmergencyAlert />
  if (!triage.currentQuestion) return null

  return (
    <div>
      <div className="px-4 pt-4">
        <ProgressBar current={triage.questionNumber} total={triage.totalQuestions} />
      </div>
      {triage.canGoBack && (
        <button
          onClick={triage.goBack}
          className="px-4 pt-3 text-blue-600 font-medium min-h-[48px]"
        >
          ← {t('back')}
        </button>
      )}
      <QuestionCard
        text={triage.currentQuestion.text}
        helpText={triage.currentQuestion.helpText}
        type={triage.currentQuestion.type}
        answers={triage.currentQuestion.answers}
        onSubmit={triage.submitAnswer}
      />
    </div>
  )
}
```

- [ ] **Step 4: Verify triage wizard flows**

Navigate to `/en/triage?careType=<id>`. Verify: questions render one at a time, progress bar advances, back button works, completion redirects to results.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTriage.ts src/components/QuestionCard.tsx src/app/\(frontend\)/\[locale\]/triage/
git commit -m "feat: add triage question wizard with branching, escalation, and progress tracking"
```

---

## Task 11: Virtual Care Interstitial & Results Screen

**Files:**
- Create: `src/components/VirtualCareInterstitial.tsx`, `src/components/ResourceCard.tsx`
- Create: `src/app/(frontend)/[locale]/virtual-care/page.tsx`
- Create: `src/app/(frontend)/[locale]/results/page.tsx`, `src/app/(frontend)/[locale]/results/client.tsx`

- [ ] **Step 1: Create VirtualCareInterstitial component**

Create `src/components/VirtualCareInterstitial.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'

interface Props {
  virtualCareUrl: string
  bullets?: string[]
  onShowOther: () => void
}

export function VirtualCareInterstitial({ virtualCareUrl, bullets, onShowOther }: Props) {
  const t = useTranslations('virtualCareInterstitial')
  return (
    <div className="px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-6">{t('heading')}</h2>
      {bullets && (
        <ul className="text-left max-w-sm mx-auto mb-8 space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-lg">
              <span className="text-green-600 font-bold">✓</span> {b}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-4 max-w-sm mx-auto">
        <a
          href={virtualCareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('startVisit')}
        </a>
        <button
          onClick={onShowOther}
          className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
        >
          {t('showOther')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ResourceCard component**

Create `src/components/ResourceCard.tsx`:

```tsx
import { useTranslations } from 'next-intl'

interface Resource {
  name: string
  type: string
  address?: { street?: string; city?: string; state?: string; zip?: string }
  phone?: string
  is24_7?: boolean
  hours?: { day: string; open: string; close: string }[]
  cost?: string
  description?: string
  temporaryNotice?: string
}

export function ResourceCard({ resource }: { resource: Resource }) {
  const t = useTranslations('results')
  const addr = resource.address
  const addressStr = addr ? `${addr.street ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''} ${addr.zip ?? ''}`.trim() : ''
  const mapsUrl = addressStr
    ? `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`
    : null

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 bg-white">
      {resource.temporaryNotice && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mb-3 text-sm font-medium text-yellow-800">
          ⚠ {resource.temporaryNotice}
        </div>
      )}
      <h3 className="font-bold text-lg mb-1">{resource.name}</h3>
      {resource.description && <p className="text-gray-600 text-sm mb-3">{resource.description}</p>}
      <div className="flex flex-col gap-2">
        {resource.phone && (
          <a href={`tel:${resource.phone}`} className="flex items-center gap-2 text-blue-600 font-bold min-h-[48px]">
            📞 {t('call')} {resource.phone}
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 min-h-[48px]">
            📍 {t('getDirections')}
          </a>
        )}
        {resource.is24_7 && <span className="text-green-700 font-medium">Open 24/7</span>}
        {resource.cost && (
          <span className="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
            {resource.cost === 'free' ? 'Free' : resource.cost === 'sliding_scale' ? 'Sliding Scale' : 'Insurance Required'}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement Virtual Care standalone page**

Create `src/app/(frontend)/[locale]/virtual-care/page.tsx` — for the secondary CTA on the landing page:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { VirtualCarePageClient } from './client'

export default async function VirtualCarePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const payload = await getPayload({ config })
  const content = await payload.findGlobal({ slug: 'static-content', locale })

  return (
    <VirtualCarePageClient
      virtualCareUrl={content.virtualCareUrl}
      bullets={content.virtualCareBullets?.map((b: any) => b.text) ?? []}
    />
  )
}
```

Create `src/app/(frontend)/[locale]/virtual-care/client.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'

export function VirtualCarePageClient({ virtualCareUrl, bullets }: { virtualCareUrl: string; bullets: string[] }) {
  const router = useRouter()
  return (
    <VirtualCareInterstitial
      virtualCareUrl={virtualCareUrl}
      bullets={bullets}
      onShowOther={() => router.push('emergency')}
    />
  )
}
```

- [ ] **Step 4: Implement Results page**

Create `src/app/(frontend)/[locale]/results/page.tsx`:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { ResultsClient } from './client'

export default async function ResultsPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const payload = await getPayload({ config })
  const content = await payload.findGlobal({ slug: 'static-content', locale })

  return (
    <ResultsClient
      clinicPhone={content.clinicPhone}
      virtualCareUrl={content.virtualCareUrl}
      virtualCareBullets={content.virtualCareBullets?.map((b: any) => b.text) ?? []}
      eligibilityUrl={content.eligibilityIntakeUrl}
    />
  )
}
```

Create `src/app/(frontend)/[locale]/results/client.tsx`:

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ResourceCard } from '@/components/ResourceCard'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'
import { ErrorFallback } from '@/components/ErrorFallback'

interface Props {
  clinicPhone: string
  virtualCareUrl: string
  virtualCareBullets: string[]
  eligibilityUrl: string
}

export function ResultsClient({ clinicPhone, virtualCareUrl, virtualCareBullets, eligibilityUrl }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('results')
  const [showResources, setShowResources] = useState(false)

  const isFallback = searchParams.get('fallback') === 'true'

  if (isFallback) {
    return <ErrorFallback clinicPhone={clinicPhone} virtualCareUrl={virtualCareUrl} />
  }

  let data: any = null
  try {
    data = JSON.parse(decodeURIComponent(searchParams.get('data') ?? '{}'))
  } catch {
    return <ErrorFallback clinicPhone={clinicPhone} virtualCareUrl={virtualCareUrl} />
  }

  // Show Virtual Care interstitial first if eligible
  if (data.virtualCareEligible && !showResources) {
    return (
      <VirtualCareInterstitial
        virtualCareUrl={virtualCareUrl}
        bullets={virtualCareBullets}
        onShowOther={() => setShowResources(true)}
      />
    )
  }

  const resources = Array.isArray(data.resources) ? data.resources : []

  return (
    <div className="px-4 py-6">
      {data.urgencyLevel && (
        <div className="mb-6">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-2"
            style={{ backgroundColor: data.urgencyLevel.color }}
          >
            {data.urgencyLevel.name}
          </span>
          {data.urgencyLevel.timeToCare && (
            <p className="text-gray-600">Expected: {data.urgencyLevel.timeToCare}</p>
          )}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">{t('heading')}</h1>

      {data.actionText && (
        <p className="text-lg font-medium mb-6">{data.actionText}</p>
      )}

      <div className="flex flex-col gap-4 mb-8">
        {resources.map((r: any, i: number) => (
          <ResourceCard key={r.id ?? i} resource={r} />
        ))}
      </div>

      {data.nextSteps && (
        <div className="prose mb-8" dangerouslySetInnerHTML={{ __html: data.nextSteps }} />
      )}

      <div className="flex flex-col gap-4">
        <a
          href={`${eligibilityUrl}?utm_source=triage&utm_medium=referral&utm_campaign=${data.careTypeName ?? ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('eligibility')}
        </a>
        <button
          onClick={() => router.push('/')}
          className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
        >
          {t('startOver')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify end-to-end flow**

With seed data (Task 12), walk through: landing → emergency → care type → triage → virtual care interstitial → results. Verify all screens render, resources show with phone/directions, eligibility link works.

- [ ] **Step 6: Commit**

```bash
git add src/components/VirtualCareInterstitial.tsx src/components/ResourceCard.tsx src/app/\(frontend\)/\[locale\]/virtual-care/ src/app/\(frontend\)/\[locale\]/results/
git commit -m "feat: add Virtual Care interstitial, resource cards, and results screen"
```

---

## Task 12: Seed Data — Norfolk Resources & Triage Rules

**Files:**
- Create: `src/seed/seed.ts`, `src/seed/emergency-symptoms.ts`, `src/seed/care-types.ts`, `src/seed/urgency-levels.ts`, `src/seed/care-resources.ts`, `src/seed/question-sets.ts`, `src/seed/routing-rules.ts`

- [ ] **Step 1: Create seed data files**

Create each seed file with the Norfolk-specific data from the spec document. Key data:

`src/seed/emergency-symptoms.ts` — 9 symptoms (chest pain, trouble breathing, stroke symptoms, severe bleeding, seizure, severe pain, loss of consciousness, allergic reaction, overdose).

`src/seed/care-types.ts` — 7 types: Medical, Dental, Vision, Behavioral Health, Medication, Chronic Care, Not Sure (isMeta: true).

`src/seed/urgency-levels.ts` — 6 levels with thresholds: Life-Threatening (20), Emergent (15), Urgent (10), Semi-Urgent (5), Routine (2), Elective (0).

`src/seed/care-resources.ts` — Norfolk providers: Sentara Norfolk General (ER, Level I Trauma), Sentara Leigh Hospital (ER), Sentara Urgent Care Wards Corner, Norfolk CSB Crisis Line, Lackey Virtual Care, Lackey Clinic (primary care).

`src/seed/question-sets.ts` — Initial question sets for Medical (pain severity, symptom progression, fever check) and Dental (swelling, pain level) care types. Include answers with urgency weights, escalation flags, and branching. Include "Not Sure" meta-triage questions with redirectToCareType answers.

`src/seed/routing-rules.ts` — Mapping for each (CareType + UrgencyLevel) pair to appropriate resources. Virtual Care eligible for Urgent through Elective levels.

- [ ] **Step 2: Create main seed script**

Create `src/seed/seed.ts`:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'

// Import seed data
import { emergencySymptoms } from './emergency-symptoms'
import { careTypes } from './care-types'
import { urgencyLevels } from './urgency-levels'
import { careResources } from './care-resources'
import { createQuestionSets } from './question-sets'
import { createRoutingRules } from './routing-rules'

async function seed() {
  const payload = await getPayload({ config })

  console.log('Seeding emergency symptoms...')
  for (const symptom of emergencySymptoms) {
    await payload.create({ collection: 'emergency-symptoms', data: symptom })
  }

  console.log('Seeding care types...')
  const createdCareTypes: Record<string, string> = {}
  for (const ct of careTypes) {
    const created = await payload.create({ collection: 'care-types', data: ct })
    createdCareTypes[ct.name] = String(created.id)
  }

  console.log('Seeding urgency levels...')
  const createdLevels: Record<string, string> = {}
  for (const level of urgencyLevels) {
    const created = await payload.create({ collection: 'urgency-levels', data: level })
    createdLevels[level.name] = String(created.id)
  }

  console.log('Seeding care resources...')
  const createdResources: Record<string, string> = {}
  for (const resource of careResources) {
    const created = await payload.create({ collection: 'care-resources', data: resource })
    createdResources[resource.name] = String(created.id)
  }

  console.log('Seeding question sets...')
  await createQuestionSets(payload, createdCareTypes)

  console.log('Seeding routing rules...')
  await createRoutingRules(payload, createdCareTypes, createdLevels, createdResources)

  console.log('Seeding static content...')
  await payload.updateGlobal({
    slug: 'static-content',
    data: {
      heroTitle: 'Get the right care, right now',
      heroSubtitle: 'Free help finding the care you need — no insurance required',
      virtualCareUrl: 'https://www.lackeyhealthcare.org/virtual-care',
      virtualCareHeading: 'You may be able to get free care right now',
      virtualCareBullets: [
        { text: 'Free for adults 18+' },
        { text: 'Available 24/7' },
        { text: 'No insurance needed' },
        { text: '95% handled fully online' },
        { text: 'Private and secure' },
      ],
      eligibilityIntakeUrl: 'https://form.jotform.com/lackey-eligibility',
      clinicPhone: '(757) 547-7484',
      privacyNote: 'We don\'t collect personal information.',
      footerText: 'Powered by Lackey Clinic',
    },
  })

  console.log('Seed complete!')
  process.exit(0)
}

seed()
```

- [ ] **Step 3: Add seed script to package.json**

```json
"scripts": {
  "seed": "tsx src/seed/seed.ts"
}
```

Also install tsx if not present:

```bash
npm install -D tsx
```

- [ ] **Step 4: Run seed**

```bash
npm run seed
```

Verify: All data appears in Payload admin at `/admin`.

- [ ] **Step 5: Commit**

```bash
git add src/seed/ package.json
git commit -m "feat: add Norfolk seed data — emergency symptoms, care types, resources, triage rules"
```

---

## Task 13: Admin Analytics Dashboard

**Files:**
- Create: `src/views/AnalyticsDashboard.tsx`
- Modify: `src/payload.config.ts` (register custom admin view)

- [ ] **Step 1: Create analytics dashboard view**

Create `src/views/AnalyticsDashboard.tsx` — a Payload custom admin view component that queries TriageSessions and displays summary cards, a filterable sessions table, and CSV export:

```tsx
'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalSessions: number
  completedRate: number
  virtualCareOffered: number
  emergencyTriggered: number
}

interface Session {
  id: string
  sessionId: string
  createdAt: string
  careTypeSelected?: { name: string }
  urgencyResult?: { name: string }
  completedFlow: boolean
  virtualCareOffered: boolean
  emergencyScreenTriggered: boolean
  locale: string
  device: string
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams()
    if (dateRange.start) params.set('where[createdAt][greater_than]', dateRange.start)
    if (dateRange.end) params.set('where[createdAt][less_than]', dateRange.end)
    params.set('depth', '1')
    params.set('limit', '25')
    params.set('page', String(page))
    params.set('sort', '-createdAt')

    fetch(`/api/triage-sessions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const docs = data.docs ?? []
        const total = data.totalDocs ?? 0
        setTotalPages(data.totalPages ?? 1)
        setSessions(docs)

        // Compute stats from all matching docs (separate query with limit=0)
        const statsParams = new URLSearchParams(params)
        statsParams.set('limit', '0')
        return fetch(`/api/triage-sessions?${statsParams.toString()}`)
      })
      .then((r) => r.json())
      .then((allData) => {
        const allDocs = allData.docs ?? []
        const total = allData.totalDocs ?? 0
        const completed = allDocs.filter((d: any) => d.completedFlow).length
        const vcOffered = allDocs.filter((d: any) => d.virtualCareOffered).length
        const emergencies = allDocs.filter((d: any) => d.emergencyScreenTriggered).length
        setStats({
          totalSessions: total,
          completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          virtualCareOffered: vcOffered,
          emergencyTriggered: emergencies,
        })
      })
  }, [dateRange, page])

  function exportCSV() {
    const headers = ['Date', 'Care Type', 'Urgency', 'Completed', 'Virtual Care Offered', 'Emergency', 'Locale', 'Device']
    const rows = sessions.map((s) => [
      new Date(s.createdAt).toLocaleDateString(),
      s.careTypeSelected?.name ?? '',
      s.urgencyResult?.name ?? '',
      s.completedFlow ? 'Yes' : 'No',
      s.virtualCareOffered ? 'Yes' : 'No',
      s.emergencyScreenTriggered ? 'Yes' : 'No',
      s.locale,
      s.device,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `triage-sessions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!stats) return <div style={{ padding: 20 }}>Loading analytics...</div>

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20, fontSize: 24 }}>Triage Analytics</h2>

      {/* Date filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input type="date" value={dateRange.start} onChange={(e) => { setPage(1); setDateRange((d) => ({ ...d, start: e.target.value })) }} />
        <span>to</span>
        <input type="date" value={dateRange.end} onChange={(e) => { setPage(1); setDateRange((d) => ({ ...d, end: e.target.value })) }} />
        <button onClick={exportCSV} style={{ marginLeft: 'auto', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.totalSessions}</div>
          <div>Total Sessions</div>
        </div>
        <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.completedRate}%</div>
          <div>Completed</div>
        </div>
        <div style={{ background: '#fefce8', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.virtualCareOffered}</div>
          <div>Virtual Care Offered</div>
        </div>
        <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.emergencyTriggered}</div>
          <div>Emergency Triggers</div>
        </div>
      </div>

      {/* Sessions table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Date</th>
            <th style={{ padding: 8 }}>Care Type</th>
            <th style={{ padding: 8 }}>Urgency</th>
            <th style={{ padding: 8 }}>Completed</th>
            <th style={{ padding: 8 }}>Virtual Care</th>
            <th style={{ padding: 8 }}>Emergency</th>
            <th style={{ padding: 8 }}>Locale</th>
            <th style={{ padding: 8 }}>Device</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: 8 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: 8 }}>{s.careTypeSelected?.name ?? '—'}</td>
              <td style={{ padding: 8 }}>{s.urgencyResult?.name ?? '—'}</td>
              <td style={{ padding: 8 }}>{s.completedFlow ? '✓' : '✗'}</td>
              <td style={{ padding: 8 }}>{s.virtualCareOffered ? '✓' : '—'}</td>
              <td style={{ padding: 8 }}>{s.emergencyScreenTriggered ? '🚨' : '—'}</td>
              <td style={{ padding: 8 }}>{s.locale?.toUpperCase()}</td>
              <td style={{ padding: 8 }}>{s.device}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '4px 12px' }}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '4px 12px' }}>Next</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register custom view in payload.config.ts**

Add the analytics dashboard as a custom admin view in the Payload config under `admin.components.views`.

- [ ] **Step 3: Verify dashboard renders in admin**

Navigate to `/admin/analytics`. Verify: summary cards render, date filter works.

- [ ] **Step 4: Commit**

```bash
git add src/views/AnalyticsDashboard.tsx src/payload.config.ts
git commit -m "feat: add custom analytics dashboard in Payload admin"
```

---

## Task 14: E2E Tests

**Files:**
- Create: `tests/e2e/emergency-flow.spec.ts`, `tests/e2e/medical-triage.spec.ts`, `tests/e2e/not-sure-flow.spec.ts`, `tests/e2e/language-toggle.spec.ts`, `tests/e2e/accessibility.spec.ts`

- [ ] **Step 1: Write emergency flow E2E test**

Create `tests/e2e/emergency-flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('emergency symptom check triggers 911 alert', async ({ page }) => {
  await page.goto('/en/emergency')
  const firstSymptom = page.locator('button').filter({ hasText: /chest pain/i }).first()
  await firstSymptom.click()
  const submitBtn = page.locator('button').last()
  await submitBtn.click()
  await expect(page.locator('text=Call 911 Now')).toBeVisible()
  await expect(page.locator('a[href="tel:911"]')).toBeVisible()
})

test('no symptoms selected continues to care type', async ({ page }) => {
  await page.goto('/en/emergency')
  await page.click('text=None of these')
  await expect(page).toHaveURL(/care-type/)
})
```

- [ ] **Step 2: Write medical triage E2E test**

Create `tests/e2e/medical-triage.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('full medical triage flow reaches results', async ({ page }) => {
  await page.goto('/en')
  await page.click('text=Get Care Now')
  // Emergency screen — select none
  await page.click('text=None of these')
  // Care type — select Medical
  await page.click('text=Medical')
  // Answer triage questions (click first answer for each)
  while (await page.locator('[class*="rounded-xl"][class*="border-2"]').first().isVisible()) {
    await page.locator('[class*="rounded-xl"][class*="border-2"]').first().click()
    // Check if we've reached results
    if (await page.locator('text=Based on your answers').isVisible()) break
    await page.waitForTimeout(300)
  }
  await expect(page.locator('text=Based on your answers')).toBeVisible()
})
```

- [ ] **Step 3: Write "Not Sure" meta-triage E2E test**

Create `tests/e2e/not-sure-flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('"Not Sure" meta-triage redirects to correct care type', async ({ page }) => {
  await page.goto('/en')
  await page.click('text=Get Care Now')
  // Emergency screen — select none
  await page.click('text=None of these')
  // Care type — select "I'm not sure"
  await page.click('text=not sure')
  // Answer meta-triage questions — select an answer that maps to Dental
  await page.locator('button').filter({ hasText: /tooth|dental|mouth/i }).first().click()
  // Verify we've been redirected into the Dental triage flow
  // The URL should now have a different careType parameter
  await expect(page).toHaveURL(/careType=/)
  // Continue answering Dental questions until results
  while (await page.locator('[class*="rounded-xl"][class*="border-2"]').first().isVisible()) {
    await page.locator('[class*="rounded-xl"][class*="border-2"]').first().click()
    if (await page.locator('text=Based on your answers').isVisible()) break
    await page.waitForTimeout(300)
  }
  await expect(page.locator('text=Based on your answers')).toBeVisible()
})
```

- [ ] **Step 4: Write language toggle E2E test**

Create `tests/e2e/language-toggle.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('language toggle switches to Spanish and preserves state', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('text=Get the right care, right now')).toBeVisible()
  await page.click('text=ES')
  await expect(page.locator('text=Obtenga la atención adecuada ahora')).toBeVisible()
  await expect(page).toHaveURL(/\/es/)
})
```

- [ ] **Step 5: Write accessibility E2E test**

Create `tests/e2e/accessibility.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('landing page passes WCAG AA', async ({ page }) => {
  await page.goto('/en')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('emergency screen passes WCAG AA', async ({ page }) => {
  await page.goto('/en/emergency')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

- [ ] **Step 6: Run E2E tests**

```bash
npx playwright install
npx playwright test
```

Expected: All tests pass. Fix any failures.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/ playwright.config.ts
git commit -m "test: add E2E tests for emergency, medical triage, not-sure meta-triage, language toggle, and accessibility"
```

---

## Task 15: Deployment Configuration

**Files:**
- Modify: `package.json` (scripts)
- Create: `vercel.json` (optional)
- Modify: `.gitignore`

- [ ] **Step 1: Add build and test scripts to package.json**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "seed": "tsx src/seed/seed.ts",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "generate:types": "payload generate:types"
}
```

- [ ] **Step 2: Update .gitignore**

Ensure `.gitignore` includes:

```
node_modules/
.env
.env.local
.next/
.superpowers/
src/payload-types.ts
```

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes without errors.

- [ ] **Step 4: Verify tests pass**

```bash
npm run test
```

Expected: All unit and integration tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore vercel.json
git commit -m "chore: add build scripts and deployment config"
```

---

## Review Checkpoint

After completing all 15 tasks, verify:

- [ ] All unit tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Seed data loads correctly (`npm run seed`)
- [ ] Admin panel accessible at `/admin` with role-based access
- [ ] Full patient flow works: landing → emergency → care type → triage → virtual care → results
- [ ] Language toggle switches EN/ES and preserves state
- [ ] 911 click-to-call works on emergency screen
- [ ] Resource cards show phone, directions, hours, temporary notices
- [ ] Eligibility link points to JotForm with UTM params
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Accessibility tests pass (axe-core)
