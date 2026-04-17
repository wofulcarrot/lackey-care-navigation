const fs = require('fs')
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TabStopType, TabStopPosition,
} = require('docx')

const BLUE = '1B4F72'
const LIGHT_BLUE = 'EBF2F9'
const LIGHT_GRAY = 'F5F5F4'
const GREEN = '15803D'
const border = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
const borders = { top: border, bottom: border, left: border, right: border }
const cm = { top: 100, bottom: 100, left: 140, right: 140 }

const P = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22, ...(opts.run || {}) })] })
const H1 = (text, brk) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk !== false, children: [new TextRun({ text })] })
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text })] })
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text })] })
const Bullet = (text, ref = 'b1') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22 })] })
const Num = (text, ref = 'n1') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22 })] })
const Spacer = (s = 200) => new Paragraph({ spacing: { after: s }, children: [] })

const makeTable = (cols, headers, rows) => {
  const tw = cols.reduce((a, b) => a + b, 0)
  return new Table({
    width: { size: tw, type: WidthType.DXA }, columnWidths: cols,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => new TableCell({ borders, width: { size: cols[i], type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: cm, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })] })] })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((cell, i) => new TableCell({ borders, width: { size: cols[i], type: WidthType.DXA }, shading: { fill: ri % 2 === 0 ? 'FFFFFF' : LIGHT_GRAY, type: ShadingType.CLEAR }, margins: cm, children: [new Paragraph({ children: Array.isArray(cell) ? cell : [new TextRun({ text: String(cell), size: 20 })] })] })) }))
    ],
  })
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, font: 'Calibri', color: BLUE }, paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Calibri', color: BLUE }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Calibri', color: '334155' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: 'b1', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'b2', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'b3', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'b4', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'CONFIDENTIAL \u2014 Traverse Internal', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tSOW Scope Reference', font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: 'Traverse \u2014 Lackey Care Navigation', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tPage ', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: ' of ', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    children: [
      // COVER
      new Paragraph({ spacing: { before: 2000 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Lackey Care Navigation', size: 52, bold: true, color: BLUE })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Technical Scope of Work Built', size: 32, color: '555555' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Reference document for SOW drafting', size: 24, italics: true, color: '777777' })] }),
      new Table({ width: { size: 6000, type: WidthType.DXA }, columnWidths: [6000], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 6000, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: { top: 240, bottom: 240, left: 320, right: 320 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Client: Lackey Clinic (Olivet Medical Ministries)', size: 22, bold: true, color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Builder: Traverse', size: 22, color: '555555' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'April 2026', size: 22, color: '666666' })] }),
      ] })] })] }),

      // === 1. EXECUTIVE SUMMARY ===
      H1('1. Executive Summary', false),
      P('Traverse designed, built, and deployed a mobile-first, bilingual (English/Spanish) care navigation triage application for Lackey Clinic. The application serves as a digital front door for uninsured adults in Norfolk, VA and the greater Hampton Roads region, guiding patients through a clinically-informed triage questionnaire and routing them to the appropriate level of care \u2014 from emergency services to virtual visits to primary care appointments.'),
      P('The application is live in production at lackey-care-navigation.vercel.app, hosted on Traverse-managed infrastructure (Vercel + Neon PostgreSQL). Lackey Clinic staff manage clinical content (triage questions, care resources, routing rules) through an embedded CMS admin panel without requiring code changes.'),

      // === 2. WHAT WAS BUILT ===
      H1('2. What Was Built'),

      H2('2.1 Patient-Facing Triage Application'),
      P('A responsive web application accessible at any URL (currently lackey-care-navigation.vercel.app, transferable to care.lackeyhealthcare.org via DNS). Key capabilities:'),
      Bullet('7 care type pathways: Medical, Dental, Vision, Behavioral Health, Medication, Chronic Care, and "Not Sure" (meta-triage that routes into the correct pathway)', 'b1'),
      Bullet('Weighted urgency scoring algorithm with 6 tiers (Life-Threatening through Elective), each with configurable score thresholds, time-to-care expectations, and color-coded badges', 'b1'),
      Bullet('19 triage questions across all care types, each with multiple answer options carrying configurable urgency weights', 'b1'),
      Bullet('42+ routing rules mapping (care type \u00D7 urgency level) to specific care resources with prioritized ordering', 'b1'),
      Bullet('19 Norfolk-area care resources seeded: Sentara hospitals, 8 urgent care locations (AFC, Velocity, Patient First), Lackey Clinic (primary + dental), EVMS, Norfolk CSB, Norfolk Health Department, Lackey Virtual Care', 'b1'),
      Bullet('Emergency safety screen with 9 life-threatening symptom checks \u2192 immediate 911 alert', 'b1'),
      Bullet('988 Suicide Prevention screen for behavioral health escalations (988 Lifeline, Crisis Text Line, CSB finder) \u2014 distinct from the medical 911 pathway', 'b1'),
      Bullet('Full bilingual support (English/Spanish) \u2014 all UI strings, triage questions, answer labels, care type names, emergency symptoms, urgency levels, routing action text, care resource descriptions, and Virtual Care interstitial content', 'b1'),
      Bullet('Dark mode with OS preference detection and manual toggle, persisted across sessions', 'b1'),
      Bullet('Hybrid location detection (GPS + ZIP code fallback for any US ZIP) with distance-based sorting of care resources', 'b1'),
      Bullet('Foursquare Places API integration \u2014 when triage urgency is "Urgent," real nearby urgent care facilities within 10 miles are searched and displayed, sorted by distance', 'b1'),
      Bullet('Virtual Care interstitial promoting Lackey\u2019s free Zipnosis/LUCA telehealth service for eligible patients', 'b1'),
      Bullet('"Never a dead end" error handling \u2014 every failure path shows Lackey\u2019s phone number and Virtual Care link', 'b1'),
      Bullet('Loading skeleton screens on all routes for perceived performance', 'b1'),
      Bullet('WCAG AA accessibility compliance verified via automated axe-core testing', 'b1'),

      H2('2.2 CEO Executive Dashboard'),
      P('A password-protected analytics dashboard for Lackey leadership and stakeholders:'),
      Bullet('5 headline metric tiles: Users Served, Completed Triage, Virtual Care Referrals, Emergency (911) Events, Crisis (988) Events', 'b2'),
      Bullet('Daily sessions bar chart with stacked breakdown (Virtual, In-Person, Emergency, Crisis) and hover tooltip with daily totals', 'b2'),
      Bullet('Care routing mix pie chart showing distribution across all routing outcomes', 'b2'),
      Bullet('Care type breakdown (sessions per care type)', 'b2'),
      Bullet('Hourly heatmap (7 days \u00D7 24 hours) showing when patients seek care', 'b2'),
      Bullet('Language and device breakdown (EN/ES, mobile/tablet/desktop)', 'b2'),
      Bullet('Partner referral bar chart + interactive Leaflet map with geocoded referral destinations', 'b2'),
      Bullet('Virtual care pacing metric (annualized rate vs. target)', 'b2'),
      Bullet('Date range picker with presets (7d, 30d, 90d, all time)', 'b2'),
      Bullet('CSV export of all dashboard data for grant reporting', 'b2'),
      Bullet('HTTP Basic Auth with constant-time comparison (SHA-256 in Edge Runtime)', 'b2'),

      H2('2.3 Content Management System (CMS)'),
      P('An embedded Payload CMS v3 admin panel at /admin, allowing clinical and operational staff to manage all triage content without code changes:'),
      Bullet('10 data collections organized into 4 sidebar groups: Content (Care Resources, Emergency Symptoms), Triage Logic (Care Types, Questions, Question Sets, Routing Rules, Urgency Levels), Analytics (Triage Sessions), System (Admin Users)', 'b3'),
      Bullet('Tabbed editing interfaces for Care Resources (Basics, Location, Hours, Eligibility & Cost, Status & Notices) and Site Content (Virtual Care, Clinic Contact)', 'b3'),
      Bullet('Role-based access control: Admin (full access) and Editor (can update resources and content but not triage logic)', 'b3'),
      Bullet('Bilingual content management \u2014 locale toggle in the CMS editor for side-by-side EN/ES editing', 'b3'),
      Bullet('Question versioning system \u2014 create new question set versions and toggle active sets for A/B testing clinical changes', 'b3'),
      Bullet('Unique constraint validation on routing rules (one rule per care type + urgency level combination)', 'b3'),
      Bullet('Lackey teal brand theming on the admin panel', 'b3'),

      H2('2.4 Anonymous Analytics System'),
      P('Every triage completion generates an anonymous session record with zero personally identifiable information:'),
      Bullet('Fields captured: session UUID, care type selected, urgency result, resources shown, virtual care offered, emergency/crisis triggered, flow completion status, locale, device type, question set version, timestamp', 'b4'),
      Bullet('No names, emails, phone numbers, IP addresses, GPS coordinates, or answer text are stored', 'b4'),
      Bullet('REST API endpoint for session creation is locked to server-side only (public REST disabled, server uses overrideAccess)', 'b4'),
      Bullet('Emergency symptom screen events and BH crisis escalations are logged separately for the dashboard', 'b4'),
      Bullet('Session logging is fire-and-forget \u2014 database failures never block the patient triage flow', 'b4'),
      Bullet('Observability counter tracks session-write failures, surfaced via /api/health endpoint', 'b4'),

      // === 3. TECHNICAL ARCHITECTURE ===
      H1('3. Technical Architecture'),

      H2('3.1 Technology Stack'),
      makeTable([3000, 6360], ['Layer', 'Technology'], [
        ['Framework', 'Next.js 16 (App Router, Turbopack in dev)'],
        ['CMS', 'Payload CMS v3 (embedded in the same Next.js app)'],
        ['Database', 'PostgreSQL 17 via Neon (managed, serverless)'],
        ['ORM', 'Drizzle (Payload\u2019s built-in adapter)'],
        ['Styling', 'Tailwind CSS v4 with class-based dark mode'],
        ['i18n', 'next-intl (EN/ES bilingual)'],
        ['Charts', 'Recharts (bar, area, pie charts on dashboard)'],
        ['Maps', 'Leaflet + OpenStreetMap (referral destination map)'],
        ['Testing', 'Vitest (unit) + Playwright (E2E) + axe-core (accessibility)'],
        ['Hosting', 'Vercel (serverless, auto-scaling, global CDN)'],
        ['Database hosting', 'Neon (managed PostgreSQL, free tier)'],
        ['External APIs', 'Foursquare Places (urgent care search), Zippopotam.us (ZIP geocoding), Zipnosis/LUCA (virtual care)'],
        ['Runtime', 'Node.js 22, Edge Runtime (middleware)'],
      ]),

      H2('3.2 Security Measures'),
      P('The application underwent 4 rounds of adversarial security review with all critical and high-priority findings resolved:'),
      Bullet('Content Security Policy (CSP) with script-src, connect-src, frame-ancestors, base-uri, form-action, object-src directives', 'b1'),
      Bullet('HSTS header with 2-year max-age and preload flag', 'b1'),
      Bullet('X-Frame-Options DENY (clickjacking prevention)', 'b1'),
      Bullet('Scoring API locked down \u2014 Questions, UrgencyLevels, RoutingRules, QuestionSets all require authentication to read via REST', 'b1'),
      Bullet('TriageSessions REST endpoint disabled \u2014 only server-side writes via overrideAccess', 'b1'),
      Bullet('Rate limiting on all triage API endpoints (30 req/min/IP) and CMS login (10 attempts/15min/IP)', 'b1'),
      Bullet('PAYLOAD_SECRET fail-fast \u2014 app refuses to start if secret is missing or under 16 characters', 'b1'),
      Bullet('Dashboard Basic Auth with constant-time comparison (SHA-256 + byte XOR in Edge Runtime)', 'b1'),
      Bullet('Geolocation coordinates never stored or logged \u2014 used transiently for distance calculation only', 'b1'),
      Bullet('Foursquare API key hidden server-side \u2014 browser never sees the key', 'b1'),
      Bullet('Input validation on all API endpoints with locale/device enum sanitization and coordinate bounds checking', 'b1'),
      Bullet('Production guards on seed scripts \u2014 refuse to run without explicit override', 'b1'),
      Bullet('DOMPurify removed (the rich text field it protected was also removed)', 'b1'),

      H2('3.3 Test Coverage'),
      makeTable([4000, 2000, 3360], ['Suite', 'Count', 'What\u2019s Covered'], [
        ['Vitest unit tests', '15 passing', 'Triage engine: scoring, urgency classification, branching, escalation, meta-redirect'],
        ['Playwright E2E tests', '8 passing', 'Emergency flow, medical triage, Not Sure redirect, language toggle, WCAG AA accessibility (3 pages)'],
        ['Total', '23/23 passing', 'All tests pass in CI and locally'],
      ]),

      // === 4. SEED DATA ===
      H1('4. Norfolk Provider Directory (Seed Data)'),
      P('The application ships with a pre-populated directory of 19 Hampton Roads care resources:'),
      makeTable([4200, 2400, 2760], ['Provider', 'Type', 'Cost'], [
        ['Sentara Norfolk General Hospital', 'Emergency Room', 'Insurance Required'],
        ['Sentara Leigh Hospital', 'Emergency Room', 'Insurance Required'],
        ['Sentara Urgent Care \u2014 Wards Corner', 'Urgent Care', 'Sliding Scale'],
        ['Sentara Ambulatory Care \u2014 Princess Anne', 'Urgent Care', 'Sliding Scale'],
        ['AFC Urgent Care Norfolk', 'Urgent Care', 'Sliding Scale'],
        ['Velocity Urgent Care (3 locations)', 'Urgent Care', 'Sliding Scale'],
        ['Patient First (3 locations)', 'Urgent Care', 'Sliding Scale'],
        ['Lackey Clinic', 'Primary Care', 'Free'],
        ['Lackey Clinic Dental', 'Dental', 'Free'],
        ['Lackey Virtual Care (Zipnosis)', 'Virtual', 'Free'],
        ['EVMS Health Services', 'Primary Care (FQHC)', 'Sliding Scale'],
        ['EVMS Dental Clinic', 'Dental', 'Sliding Scale'],
        ['Norfolk Health Department', 'Public Health', 'Sliding Scale'],
        ['Norfolk CSB (Crisis Line + Outpatient)', 'Behavioral Health', 'Free/Sliding'],
      ]),
      P('All resources include address, phone, hours, lat/lng coordinates (for distance sorting and dashboard map), and bilingual descriptions.'),

      // === 5. DELIVERABLES ===
      H1('5. Deliverables Produced'),
      makeTable([1200, 3600, 4560], ['ID', 'Deliverable', 'Description'], [
        ['D1.1', 'Application Source Code', 'Full Next.js 16 + Payload CMS v3 codebase (94+ source files)'],
        ['D1.2', 'Database Schema + Seed Data', '10 collections, 11 seed files, Spanish backfill script, admin creation utility'],
        ['D1.3', 'Deployment Configuration', 'Dockerfile (multi-stage), docker-compose.yml (app + PostgreSQL), .dockerignore'],
        ['D1.4', 'Environment Configuration Guide', '.env.example (7 vars) + docs/environment-setup.md (detailed reference)'],
        ['D1.5', 'Dependency Manifest + Licenses', 'package.json, package-lock.json, docs/third-party-licenses.csv (555 dependencies)'],
        ['D1.6', 'API Integration Configs', 'Foursquare, Zippopotam.us, Zipnosis/LUCA, OpenStreetMap \u2014 all documented'],
        ['D2.1', 'Automated Test Suite', '23 tests (15 unit + 8 E2E) all passing'],
        ['', 'Triage Algorithm Specification', 'docs/triage-algorithm-spec.md + .docx \u2014 full scoring spec for clinical review'],
        ['', 'Deployment Guide', 'docs/deployment-guide.docx \u2014 step-by-step for Vercel + Docker'],
        ['', 'Design Decisions Document', 'docs/design-decisions.md \u2014 rationale for every major decision'],
        ['', 'Hosting Services Addendum', 'docs/hosting-services-addendum.docx \u2014 draft hosting agreement'],
        ['', 'Adversarial Security Reviews', '4 rounds, 80+ findings identified, all critical/high resolved'],
        ['', 'Competitive Research', 'docs/competitive-research-2026-04-13.md \u2014 market analysis + roadmap'],
      ]),

      // === 6. HOSTING & INFRASTRUCTURE ===
      H1('6. Hosting & Infrastructure (Current Production)'),
      makeTable([3000, 6360], ['Component', 'Details'], [
        ['Application hosting', 'Vercel (Hobby tier, auto-scaling, global CDN, auto-deploy from GitHub)'],
        ['Database', 'Neon PostgreSQL (free tier: 0.5GB storage, 190 compute hours/month)'],
        ['Custom domain ready', 'CNAME care.lackeyhealthcare.org \u2192 cname.vercel-dns.com (pending client DNS update)'],
        ['SSL/TLS', 'Automatically provisioned and renewed by Vercel'],
        ['External APIs', 'Foursquare (free: 950 calls/day), Zippopotam.us (free, no key)'],
        ['Current monthly cost', '$0 (all services on free tiers)'],
        ['Capacity', '10,000\u201315,000 triage sessions/month on free tier'],
      ]),

      // === 7. WHAT LACKEY CAN DO WITHOUT CODE ===
      H1('7. Client Self-Service Capabilities (No Code Required)'),
      P('Through the CMS admin panel, Lackey staff can independently:'),
      Num('Add, edit, or deactivate care resources (clinics, hospitals, urgent cares, crisis lines) including hours, phone, address, cost, eligibility, and temporary notices', 'n1'),
      Num('Edit triage questions, answer labels, and urgency weights', 'n1'),
      Num('Adjust urgency level score thresholds and time-to-care expectations', 'n1'),
      Num('Modify routing rules \u2014 change which resources appear for each care type + urgency combination', 'n1'),
      Num('Create new question set versions for clinical A/B testing', 'n1'),
      Num('Update the Virtual Care URL, clinic phone number, and eligibility intake link', 'n1'),
      Num('Edit emergency symptom checklist items', 'n1'),
      Num('Toggle content between English and Spanish in the CMS editor', 'n1'),
      Num('View anonymous triage session analytics and export CSV reports', 'n1'),
      Num('Manage admin and editor user accounts', 'n1'),

      // === 8. STRATEGIC CONTEXT ===
      H1('8. Strategic Context'),

      H2('8.1 Healthcare Safety Net Collaborative (HSNC)'),
      P('The Norfolk Department of Public Health convened the HSNC to create a coordinated "single point of entry" for uninsured residents. The Lackey Care Navigation app directly implements three of the HSNC\u2019s charter deliverables:'),
      Num('Norfolk Healthcare Safety Net Resource Map \u2192 our geocoded provider directory with 19 resources + Leaflet map', 'n2'),
      Num('Online landing platform for uninsured healthcare seekers \u2192 our triage application (the "no wrong door" flow)', 'n2'),
      Num('Shared data dashboard \u2192 our CEO executive dashboard with session metrics, routing data, and CSV export', 'n2'),

      H2('8.2 Medicaid Unwinding Impact'),
      P('HR 1 changes to Medicaid eligibility are expected to cause 15,000\u201330,000 Norfolk residents to lose coverage over the next 5\u201310 years. This application is positioned as the primary digital tool those newly-uninsured residents will use to find affordable care.'),

      H2('8.3 Expansion Potential'),
      Bullet('Norfolk pilot (current) \u2192 Hampton Roads regional \u2192 Virginia statewide (VAFCC: 62 free clinics) \u2192 National (NAFC: 1,400+ free clinics)', 'b1'),
      Bullet('Multi-tenant architecture (county-filtered dashboards) is a planned Tier 3 enhancement', 'b1'),
      Bullet('Hosting model positions Traverse as the ongoing technology partner with recurring revenue', 'b1'),

      // === 9. LINES OF CODE ===
      H1('9. Build Metrics'),
      makeTable([4200, 5160], ['Metric', 'Value'], [
        ['Total source files', '94+'],
        ['Lines of code (application)', '~7,000+'],
        ['Lines of documentation', '~3,000+'],
        ['Commits on main', '30+'],
        ['Security review rounds', '4 (80+ findings, all critical/high resolved)'],
        ['Test cases', '23 (15 unit + 8 E2E), 100% passing'],
        ['Languages supported', '2 (English, Spanish)'],
        ['Care resources seeded', '19 Norfolk-area providers'],
        ['Triage questions', '19 across 7 care types'],
        ['Routing rules', '42+'],
        ['Third-party dependencies', '555 (all MIT/ISC/Apache licensed)'],
        ['Production deployment', 'Vercel + Neon PostgreSQL, live at lackey-care-navigation.vercel.app'],
      ]),
    ],
  }],
})

Packer.toBuffer(doc).then((buffer) => {
  const outPath = process.argv[2] || 'sow-scope-reference.docx'
  fs.writeFileSync(outPath, buffer)
  console.log('Created:', outPath, `(${buffer.length.toLocaleString()} bytes)`)
}).catch((err) => { console.error('Failed:', err); process.exit(1) })
