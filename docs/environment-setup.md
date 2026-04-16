# Environment Configuration Guide

## Overview

The Lackey Care Navigation app requires a set of environment variables to run. All variables are documented in `.env.example` at the project root. Copy it to `.env` and fill in real values before starting the app.

```bash
cp .env.example .env
# Edit .env with your values
```

## Required Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URI` | **Yes** | `postgresql://lackey:pass@db:5432/lackey_care_navigation` | PostgreSQL connection string. For Docker Compose, use the `db` service hostname. For local dev, use `127.0.0.1`. |
| `PAYLOAD_SECRET` | **Yes** | `a1b2c3d4...` (32+ chars) | Payload CMS JWT signing key. Generate with `openssl rand -base64 32`. A weak secret lets attackers forge admin sessions. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | `https://care.lackeyhealthcare.org` | Public-facing URL. Used for canonical links and OG images. |
| `DASHBOARD_USERNAME` | **Prod only** | `lackey-admin` | HTTP Basic Auth username for the `/dashboard` CEO executive view. In dev, defaults to `lackey` with a warning. In production (`NODE_ENV=production`), **the app returns 500 if this is unset.** |
| `DASHBOARD_PASSWORD` | **Prod only** | (strong random) | HTTP Basic Auth password for `/dashboard`. Generate with `openssl rand -base64 32`. In production, **the app returns 500 if unset.** |
| `FOURSQUARE_API_KEY` | No | `fsq_...` | Foursquare Places API key for nearby urgent care search. Free tier at [foursquare.com/developers](https://foursquare.com/developers/). If unset, the feature gracefully falls back to the seeded Norfolk provider list. |

## Implicit Variables

| Variable | Set By | Notes |
|----------|--------|-------|
| `NODE_ENV` | Next.js automatically | `development` during `npm run dev`, `production` during `npm run build` / `next start` / Docker. Controls: CSP strictness (dev is permissive, prod is locked down), dashboard auth fail-fast behavior, and the sample-sessions seed guard. You should **not** set this manually in `.env`. |

## Docker Compose Setup

When using `docker-compose.yml`, the app service reads from your `.env` file automatically. You also need:

| Variable | Used By | Default |
|----------|---------|---------|
| `DB_PASSWORD` | docker-compose.yml | `lackey-dev-password` |

The compose file constructs `DATABASE_URI` internally from `DB_PASSWORD`, so you don't need to set `DATABASE_URI` separately — but you **do** need `PAYLOAD_SECRET`, `DASHBOARD_USERNAME`, and `DASHBOARD_PASSWORD` in your `.env`.

### Minimal `.env` for Docker

```env
PAYLOAD_SECRET=your-strong-random-secret-here
DB_PASSWORD=your-database-password
DASHBOARD_USERNAME=lackey
DASHBOARD_PASSWORD=your-strong-dashboard-password
FOURSQUARE_API_KEY=          # optional
```

## Local Development Setup

```env
DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/lackey_care_navigation
PAYLOAD_SECRET=lackey-dev-secret-change-in-prod
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FOURSQUARE_API_KEY=          # optional
```

Dashboard auth uses dev-only fallback credentials in development (`lackey` / `dev-only-change-me`). You'll see a warning in the console on every dashboard request.

## Third-Party Services

### Foursquare Places API
- **What it does:** Searches for real urgent care facilities near a patient's location (GPS or ZIP code) when their triage urgency is "Urgent".
- **When it's used:** Only on the `/[locale]/location` screen for patients triaged as Urgent.
- **If unset:** The feature silently falls back to the seeded Norfolk provider list. No error, no degraded UX — just static rather than dynamic results.
- **Get a key:** [foursquare.com/developers](https://foursquare.com/developers/) → free tier (950 calls/day).
- **Privacy:** Patient coordinates are sent to our server-side proxy (`/api/triage/nearby-urgent-cares`), which calls Foursquare. Coordinates are never stored, logged, or persisted.

### Zippopotam.us
- **What it does:** Geocodes US ZIP codes to lat/lng for the "Find closest to me" feature.
- **No API key required.** Free, public, CORS-enabled.
- **Privacy:** Called directly from the browser (no server proxy needed). ZIP code is sent to `api.zippopotam.us` — a public geographic lookup with no PII.

### Zipnosis (LUCA) Virtual Care
- **What it does:** External link target for the Virtual Care interstitial. Patients who qualify are redirected to Lackey's Zipnosis intake.
- **Configuration:** The URL is stored in the `static-content` Payload CMS global and is editable by admins. Default: `https://luca.zipnosis.com/guest_visits/new?l=en`.
- **No API key required.** It's a browser redirect, not an API integration.

### OpenStreetMap Tiles
- **What it does:** Renders the referral destination map on the CEO executive dashboard via Leaflet.
- **No API key required.** Uses OSM's public tile servers with attribution.
- **Usage policy:** Low volume for an executive dashboard is fine. If usage scales beyond a few hundred loads/month, consider switching to MapTiler or Mapbox.

## Security Notes

- **Never commit `.env` to version control.** It's in `.gitignore`.
- **Rotate `PAYLOAD_SECRET` if compromised.** All admin sessions will be invalidated.
- **`DASHBOARD_PASSWORD` uses constant-time comparison** (SHA-256 + byte XOR in Edge Runtime). Timing attacks are mitigated.
- **Rate limiting** on `/api/triage/evaluate` (30 req/min/IP) and `/api/triage/nearby-urgent-cares` (30 req/min/IP) protects against abuse. In-memory for the pilot; upgrade to Upstash Redis for multi-instance production.
