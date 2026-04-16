# Lackey Care Navigation

A mobile-first, bilingual (EN/ES) care navigation triage app for uninsured adults in Norfolk, VA. Built for [Lackey Clinic](https://www.lackeyhealthcare.org) as a digital front door — patients answer a few questions and get routed to the right level of care: ER, urgent care, virtual visit, or primary care.

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/wofulcarrot/lackey-care-navigation.git
cd lackey-care-navigation

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set PAYLOAD_SECRET, DASHBOARD_USERNAME, DASHBOARD_PASSWORD

# 3. Start the app + database
docker compose up -d

# 4. Seed the database (first run only)
docker compose exec app npm run seed

# 5. Create an admin user
docker compose exec app npx tsx src/seed/create-admin.ts admin@lackey.local your-password

# 6. Open the app
open http://localhost:3000
```

## Quick Start (Local Development)

```bash
# Prerequisites: Node.js 22+, PostgreSQL 17+

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URI to your local PostgreSQL (e.g., postgresql://postgres:postgres@127.0.0.1:5432/lackey_care_navigation)

# 3. Create the database
createdb lackey_care_navigation

# 4. Seed the database
npm run seed

# 5. (Optional) Add Spanish translations to seed data
PAYLOAD_SECRET=... DATABASE_URI=... npx tsx src/seed/backfill-spanish.ts

# 6. Create an admin user
PAYLOAD_SECRET=... DATABASE_URI=... npx tsx src/seed/create-admin.ts admin@lackey.local your-password

# 7. Start the dev server
npm run dev
# Open http://localhost:3000
```

## URLs

| URL | What | Auth |
|-----|------|------|
| `/en` or `/es` | Patient triage app | None (public) |
| `/admin` | Payload CMS admin panel | Email + password |
| `/dashboard` | CEO executive dashboard | HTTP Basic Auth |
| `/api/health` | Health check endpoint | None (public) |
| `/api/triage/evaluate` | Triage scoring API | Rate-limited (30/min/IP) |

## Architecture

```
Next.js 16 (App Router)
├── Patient-facing pages (EN/ES bilingual, dark mode)
│   ├── Landing → Emergency screen → Care type → Triage questions → Results
│   ├── /location screen (Urgent only — GPS/ZIP → Foursquare nearby search)
│   └── Crisis alert (BH → 988 Lifeline, not 911)
├── Payload CMS v3 (embedded admin panel)
│   ├── 10 collections (CareTypes, Questions, RoutingRules, CareResources, etc.)
│   └── Role-based access (Admin / Editor)
├── CEO Executive Dashboard
│   ├── Session metrics, routing mix, daily trends, hourly heatmap
│   ├── Partner referral map (Leaflet + OpenStreetMap)
│   └── CSV export
└── PostgreSQL (via Drizzle ORM)
```

## Key Features

- **Weighted triage scoring** — deterministic, auditable, CMS-editable. See [docs/triage-algorithm-spec.md](docs/triage-algorithm-spec.md).
- **7 care types** — Medical, Dental, Vision, Behavioral Health, Medication, Chronic Care, "Not Sure" (meta-triage)
- **6 urgency levels** — Life-Threatening → Elective, with color-coded badges and time-to-care expectations
- **19 Norfolk-area providers** seeded — hospitals, urgent cares, Lackey Clinic, EVMS, Norfolk CSB, Norfolk Health Dept
- **Foursquare integration** — for Urgent-tier results, searches real nearby urgent cares within 10 mi of patient location
- **988 Suicide Prevention screen** — behavioral health escalation routes to 988 Lifeline + Crisis Text Line + CSB finder, not 911
- **Bilingual EN/ES** — UI strings + CMS content + triage questions + answer labels all translated
- **Dark mode** — toggle in header, persists to localStorage, respects OS preference
- **Anonymous analytics** — zero PII, session logging with grant-reporting metrics
- **3 adversarial security reviews** — all critical/high/medium findings resolved

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run seed` | Seed database with Norfolk provider data |
| `npx tsx src/seed/create-admin.ts [email] [password]` | Create/reset admin user |
| `npx tsx src/seed/backfill-spanish.ts` | Apply Spanish translations to CMS content |
| `npx tsx src/seed/sample-sessions.ts` | Generate demo analytics data (dev only) |

## Documentation

| Document | Description |
|----------|-------------|
| [docs/triage-algorithm-spec.md](docs/triage-algorithm-spec.md) | Full triage scoring specification |
| [docs/environment-setup.md](docs/environment-setup.md) | Environment variable reference |
| [docs/adversarial-review-2026-04-13.md](docs/adversarial-review-2026-04-13.md) | Security review findings |
| [docs/competitive-research-2026-04-13.md](docs/competitive-research-2026-04-13.md) | Competitive landscape analysis |
| [docs/third-party-licenses.csv](docs/third-party-licenses.csv) | Open-source dependency license inventory |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| CMS | Payload CMS v3 (embedded) |
| Database | PostgreSQL 17 (via Drizzle ORM) |
| Styling | Tailwind CSS v4 |
| i18n | next-intl (EN/ES) |
| Charts | Recharts |
| Maps | Leaflet + OpenStreetMap |
| Testing | Vitest (unit) + Playwright (E2E) |
| Runtime | Node.js 22 |

## Environment Variables

See [docs/environment-setup.md](docs/environment-setup.md) for the full reference. Quick summary:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URI` | Yes | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Yes | JWT signing key (32+ random chars) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL |
| `DASHBOARD_USERNAME` | Prod | Basic Auth for `/dashboard` |
| `DASHBOARD_PASSWORD` | Prod | Basic Auth for `/dashboard` |
| `FOURSQUARE_API_KEY` | No | Nearby urgent care search (free tier) |

## License

Proprietary — licensed to Lackey Clinic under the terms of the Traverse / Lackey SOW.
