const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TabStopType, TabStopPosition,
} = require('docx')

// Lackey brand palette
const BLUE = '1B4F72'
const LIGHT_BLUE = 'EBF2F9'
const LIGHT_GRAY = 'F5F5F4'
const DARK_GRAY = '334155'
const GREEN = '15803D'
const RED = 'B91C1C'
const ORANGE = 'C2410C'

const border = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
const borders = { top: border, bottom: border, left: border, right: border }
const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 }

// Helpers
const P = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, size: 22, ...(opts.run || {}) })],
  })

const H1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: text !== 'Overview',
    children: [new TextRun({ text })],
  })

const H2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text })],
  })

const H3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text })],
  })

const Code = (text) =>
  new Paragraph({
    spacing: { before: 100, after: 160 },
    shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
    indent: { left: 240, right: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 },
      left: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 12 },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 },
    },
    children: text.split('\n').flatMap((line, i, arr) => {
      const run = new TextRun({ text: line, font: 'Consolas', size: 20, color: DARK_GRAY })
      return i === arr.length - 1 ? [run] : [run, new TextRun({ break: 1 })]
    }),
  })

const Bullet = (text, ref = 'bullets') =>
  new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22 })],
  })

const Numbered = (text) =>
  new Paragraph({
    numbering: { reference: 'numbered', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22 })],
  })

// Build a table with a header row + data rows.
// columns: array of column widths (must sum to totalWidth)
// headers: array of header text
// rows: array of arrays of cell content (strings or arrays of TextRuns)
const buildTable = (columns, headers, rows) => {
  const totalWidth = columns.reduce((a, b) => a + b, 0)
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: columns,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: columns[i], type: WidthType.DXA },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })],
          })],
        })),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: columns[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? 'FFFFFF' : LIGHT_GRAY, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({
            children: Array.isArray(cell)
              ? cell
              : [new TextRun({ text: String(cell), size: 20 })],
          })],
        })),
      })),
    ],
  })
}

const spacer = (size = 200) => new Paragraph({ spacing: { after: size }, children: [] })

const callout = (title, body, color = BLUE) =>
  new Paragraph({
    spacing: { before: 120, after: 200 },
    shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
    border: {
      left: { style: BorderStyle.SINGLE, size: 16, color, space: 12 },
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 },
    },
    indent: { left: 240, right: 240 },
    children: [
      new TextRun({ text: title + ' ', bold: true, size: 22, color }),
      new TextRun({ text: body, size: 22 }),
    ],
  })

// ============================================================
// DOCUMENT CONTENT
// ============================================================

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Calibri', color: BLUE },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Calibri', color: BLUE },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri', color: DARK_GRAY },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'bullets2',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'bullets3',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbered',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Lackey Care Navigation', font: 'Calibri', size: 16, color: '999999' }),
              new TextRun({ text: '\tTriage Algorithm Specification', font: 'Calibri', size: 16, color: '999999' }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Confidential — for internal Lackey clinical review', font: 'Calibri', size: 16, color: '999999' }),
              new TextRun({ text: '\tPage ', font: 'Calibri', size: 16, color: '999999' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '999999' }),
              new TextRun({ text: ' of ', font: 'Calibri', size: 16, color: '999999' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '999999' }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
          })],
        }),
      },
      children: [
        // ============ COVER PAGE ============
        new Paragraph({ spacing: { before: 2400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: 'Triage Algorithm', font: 'Calibri', size: 64, bold: true, color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: '& Scoring Specification', font: 'Calibri', size: 48, bold: true, color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: 'Lackey Care Navigation Pilot', font: 'Calibri', size: 28, color: '555555' })],
        }),
        new Table({
          width: { size: 6000, type: WidthType.DXA },
          columnWidths: [6000],
          rows: [new TableRow({
            children: [new TableCell({
              borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
              },
              width: { size: 6000, type: WidthType.DXA },
              shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
              margins: { top: 240, bottom: 240, left: 320, right: 320 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
                  children: [new TextRun({ text: 'Version 1.0 (pilot)', size: 22, bold: true, color: BLUE })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                  children: [new TextRun({ text: 'Last updated April 15, 2026', size: 22, color: '555555' })] }),
                new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Prepared for Lackey Clinic clinical review', size: 20, italics: true, color: '666666' })] }),
              ],
            })],
          })],
        }),

        // ============ SECTION 1: OVERVIEW ============
        H1('Overview'),
        P('The Lackey Care Navigation app uses a weighted cumulative scoring model to classify a patient\u2019s urgency and route them to appropriate care resources. It is deterministic, auditable, and fully editable by non-technical staff via the Payload CMS \u2014 no machine learning, no hidden rules.'),

        H2('1.1 Design Principles'),
        buildTable(
          [2400, 6960],
          ['Principle', 'Consequence'],
          [
            ['Deterministic', 'Same inputs \u2192 same output, always. No randomness, no ML. Required for grant reporting and clinical auditing.'],
            ['Transparent', 'Every score, threshold, and routing rule lives in the CMS as a readable row. Clinical staff can see exactly why a patient got a given recommendation.'],
            ['Fail-safe', 'Multiple override paths prioritize patient safety over score arithmetic. An escalation flag always wins. A missing rule always routes to a human phone number.'],
            ['Privacy-first', 'No PII is collected, stored, or needed for scoring. Session logs are anonymous.'],
            ['Localized', 'Content (questions, answers, action text) is bilingual EN/ES. Scoring logic is locale-agnostic.'],
          ],
        ),

        // ============ SECTION 2: DATA MODEL ============
        H1('Data Model'),

        H2('2.1 Core Entities'),
        Code(`CareType (7)            UrgencyLevel (6)           Question (~19)
    |                         |                          |
    |                         |                          v
    |                         |                        Answer[]  <-- the scoring unit
    |                         |                          |
    v                         v                          |
QuestionSet ------------> RoutingRule <-- (careType x urgencyLevel)
    |                         |
    |                         v
    |                     CareResource[] (hospitals, clinics, urgent cares, etc.)`),

        H2('2.2 Scoring Fields on an Answer'),
        P('Every answer option a patient can choose has five fields (only three affect scoring):'),
        buildTable(
          [2400, 6960],
          ['Field', 'Purpose'],
          [
            ['label', 'Patient-facing text (localized EN/ES)'],
            [[new TextRun({ text: 'urgencyWeight', bold: true, size: 20 })], 'Integer score added when picked. Typical range: 0\u201310'],
            [[new TextRun({ text: 'escalateImmediately', bold: true, size: 20 })], 'Boolean override. If true, skip all scoring and route to 911/ER'],
            ['nextQuestion', 'Optional branching: jump to this question instead of following sortOrder'],
            ['redirectToCareType', 'Meta-triage only (\u201CNot Sure\u201D): bounce into another care type\u2019s flow'],
          ],
        ),

        H2('2.3 UrgencyLevel Thresholds'),
        P('Evaluated highest-first; first match wins.', { run: { italics: true, color: '555555' } }),
        buildTable(
          [2400, 1800, 2200, 2960],
          ['Level', 'Threshold', 'Time to Care', 'Color'],
          [
            [[new TextRun({ text: 'Life-Threatening', bold: true, size: 20, color: RED })], '\u2265 20', 'Immediate', '#FEE2E2 (red)'],
            [[new TextRun({ text: 'Emergent', bold: true, size: 20, color: ORANGE })], '\u2265 15', 'Within 1 hour', '#FFEDD5 (orange)'],
            [[new TextRun({ text: 'Urgent', bold: true, size: 20, color: 'CA8A04' })], '\u2265 10', 'Same day', '#FEF9C3 (yellow)'],
            [[new TextRun({ text: 'Semi-Urgent', bold: true, size: 20, color: GREEN })], '\u2265 5', '1\u20133 days', '#DCFCE7 (green)'],
            [[new TextRun({ text: 'Routine', bold: true, size: 20, color: '1D4ED8' })], '\u2265 2', '1\u20132 weeks', '#DBEAFE (blue)'],
            [[new TextRun({ text: 'Elective', bold: true, size: 20, color: '7C3AED' })], '\u2265 0 (catch-all)', 'As available', '#EDE9FE (purple)'],
          ],
        ),
        spacer(160),
        callout('Guarantee:', 'A patient who picks entirely zero-weight answers falls to Elective (never null \u2014 guaranteed by the fallback in classifyUrgency).'),

        // ============ SECTION 3: SCORING FLOW ============
        H1('Scoring Flow'),

        H2('3.1 High-Level Algorithm'),
        Numbered('Patient lands \u2192 clicks \u201CGet Care Now\u201D'),
        Numbered('Emergency screen: check-boxes for life-threatening symptoms. IF any checked \u2192 full-screen 911 alert, flow ENDS'),
        Numbered('Patient picks a CareType (Medical, Dental, Vision, Behavioral Health, Medication, Chronic Care, or \u201CNot Sure\u201D)'),
        Numbered('Load the active QuestionSet for that CareType (isActive=true)'),
        Numbered('For each question in sortOrder: render, patient picks, check escalation, check redirect, add weights, follow branch'),
        Numbered('Client POSTs {careTypeId, answers[]} to /api/triage/evaluate'),
        Numbered('Server recomputes score authoritatively (does NOT trust the client total)'),
        Numbered('Server looks up urgency level by threshold \u2192 looks up routing rule'),
        Numbered('Server returns { urgencyLevel, resources, virtualCareEligible, actionText, nextSteps }'),
        Numbered('Results page shows urgency badge, Virtual Care interstitial (if eligible), ranked resource list (sorted by distance if patient shared location)'),

        H2('3.2 Scoring Functions'),
        P('From src/lib/triage-engine.ts:', { run: { font: 'Consolas', color: DARK_GRAY } }),

        H3('calculateScore(answers) \u2192 number'),
        Code('score = sum of all answer.urgencyWeight values'),
        P('Simple sum. No multipliers, no non-linear terms, no caps. Predictable.'),

        H3('classifyUrgency(score, levels) \u2192 UrgencyLevel'),
        Code(`sorted = levels.sort(desc by scoreThreshold)
return first level where score >= level.scoreThreshold
       ?? lowest-threshold level (fallback, never null)`),
        P('Strict \u2265 comparison. The highest threshold that matches wins \u2014 so a score of 17 lands on Emergent (threshold 15), not Life-Threatening (threshold 20).'),

        H3('checkEscalation(answers) \u2192 boolean'),
        Code('return true if ANY answer has escalateImmediately=true'),
        P('Short-circuits scoring entirely. This is the clinical safety net.'),

        H3('checkMetaRedirect(answer) \u2192 careTypeId | null'),
        Code('return answer.redirectToCareType ?? null'),
        P('Only used by the \u201CNot Sure\u201D care type to let a patient pick \u201CI\u2019m feeling anxious\u201D and get bounced into Behavioral Health\u2019s flow.'),

        H2('3.3 Branching via nextQuestion'),
        P('Single-choice answers can skip questions based on what the patient picks. Example from the Medical flow:'),
        Bullet('Q1 \u201CHow would you describe your pain level?\u201D'),
        Bullet('Q2 \u201CHow long have you had these symptoms?\u201D'),
        Bullet('Q3 \u201CDo you have a fever?\u201D'),
        P('The \u201CSevere \u2014 I can\u2019t function\u201D answer on Q1 has nextQuestion=Q3 \u2014 it skips Q2 because the patient already indicated high acuity. They jump straight to fever.'),

        // ============ SECTION 4: WORKED EXAMPLES ============
        H1('Worked Examples'),

        H2('4.1 Medical: Moderate Pain, Few Days, No Fever'),
        buildTable(
          [4200, 3960, 1200],
          ['Question', 'Answer', 'Weight'],
          [
            ['Care preference', 'No preference', '0'],
            ['Pain level', 'Moderate \u2014 it\u2019s hard to focus', [new TextRun({ text: '5', bold: true, size: 20 })]],
            ['Symptom duration', 'A few days', [new TextRun({ text: '3', bold: true, size: 20 })]],
            ['Fever', 'No', '0'],
            [[new TextRun({ text: 'Total score', bold: true, size: 20 })], '', [new TextRun({ text: '8', bold: true, size: 20, color: BLUE })]],
          ],
        ),
        spacer(120),
        callout('Classification:', '8 \u2265 5 (Semi-Urgent threshold) but < 10 (Urgent) \u2192 Semi-Urgent. Routed to Virtual Care + Lackey Clinic with the Virtual Care interstitial shown first.', GREEN),

        H2('4.2 Medical: Severe Pain, Fever (Skips Q2 via Branch)'),
        buildTable(
          [4200, 3960, 1200],
          ['Question', 'Answer', 'Weight'],
          [
            ['Care preference', 'No preference', '0'],
            ['Pain level', 'Severe \u2014 I can\u2019t function', [new TextRun({ text: '8', bold: true, size: 20 })]],
            ['Duration', [new TextRun({ text: '(skipped via nextQuestion branch)', italics: true, color: '666666', size: 20 })], [new TextRun({ text: '\u2014', size: 20 })]],
            ['Fever', 'Yes', [new TextRun({ text: '4', bold: true, size: 20 })]],
            [[new TextRun({ text: 'Total score', bold: true, size: 20 })], '', [new TextRun({ text: '12', bold: true, size: 20, color: BLUE })]],
          ],
        ),
        spacer(120),
        callout('Classification:', '12 \u2265 10 \u2192 Urgent. Routed to 9 urgent cares (Sentara, AFC, Velocity x3, Patient First x3) + Lackey Virtual Care as a backup.', 'CA8A04'),

        H2('4.3 Behavioral Health: Self-Harm Disclosure'),
        buildTable(
          [3800, 3600, 1000, 960],
          ['Question', 'Answer', 'Weight', 'Escalate'],
          [
            ['Self-harm thoughts', 'Yes', '10', [new TextRun({ text: 'TRUE', bold: true, color: RED, size: 20 })]],
          ],
        ),
        spacer(120),
        callout('Classification:', 'Scoring is bypassed. checkEscalation returns true. Patient sees full-screen 911 alert with click-to-call. Session is logged with emergencyScreenTriggered=true.', RED),

        H2('4.4 Medication: Anaphylaxis Symptoms'),
        buildTable(
          [4400, 3000, 1000, 960],
          ['Question', 'Answer', 'Weight', 'Escalate'],
          [
            ['Reaction', 'Yes, difficulty breathing or swelling', '10', [new TextRun({ text: 'TRUE', bold: true, color: RED, size: 20 })]],
          ],
        ),
        spacer(120),
        callout('Classification:', 'Again bypassed by the escalation flag. Immediate 911 routing.', RED),

        H2('4.5 \u201CNot Sure\u201D Meta-Redirect'),
        buildTable(
          [3400, 3800, 2160],
          ['Question', 'Answer', 'redirectToCareType'],
          [
            ['\u201CWhat\u2019s going on?\u201D', '\u201CI\u2019m feeling anxious, depressed\u2026\u201D', [new TextRun({ text: 'Behavioral Health', bold: true, size: 20, color: BLUE })]],
          ],
        ),
        spacer(120),
        callout('Classification:', 'No score is kept. Client-side router replaces the URL with /triage?careType=<BehavioralHealth.id> and the patient starts fresh in that flow.'),

        H2('4.6 Elective Edge Case (All Zero-Weight Answers)'),
        buildTable(
          [4200, 3960, 1200],
          ['Question', 'Answer', 'Weight'],
          [
            ['Care preference', 'No preference', '0'],
            ['Pain level', 'No pain', '0'],
            ['Duration', '(never reached)', '\u2014'],
            ['Fever', 'No', '0'],
            [[new TextRun({ text: 'Total score', bold: true, size: 20 })], '', [new TextRun({ text: '0', bold: true, size: 20, color: BLUE })]],
          ],
        ),
        spacer(120),
        callout('Classification:', '0 \u2265 0 (Elective catch-all) \u2192 Elective. Still routed to Lackey Clinic + Virtual Care (not a dead end). The lowest-threshold level is always returned thanks to the ?? sorted[sorted.length - 1] fallback.', '7C3AED'),

        // ============ SECTION 5: ROUTING RULES ============
        H1('Routing Rules'),

        H2('5.1 How Resources Are Selected'),
        P('For each combination of (CareType, UrgencyLevel) there is at most one RoutingRule (enforced by a beforeValidate hook on the collection). The rule contains:'),
        buildTable(
          [2800, 6560],
          ['Field', 'Meaning'],
          [
            ['resources[]', 'Ordered list of CareResource IDs to show the patient'],
            ['virtualCareEligible', 'If true, patient sees the Virtual Care interstitial before the resource list'],
            ['actionText', 'Primary call-to-action headline on the results page (localized)'],
            ['nextSteps', 'Rich-text extended instructions (optional, localized)'],
          ],
        ),
        P('The Cartesian grid is 7 care types \u00D7 6 urgency levels = 42 cells, though not every cell has a rule \u2014 some combinations (e.g., Dental Life-Threatening) route directly to the ER.'),

        H2('5.2 Example: Medical \u00D7 Urgent Routing Rule'),
        Code(`actionText:           "Visit urgent care or start a free virtual visit"
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
  9. Lackey Virtual Care (phone-only, sorts last when location is shared)`),

        H2('5.3 Distance-Based Re-sorting'),
        P('If the patient taps \u201CFind closest to me\u201D:'),
        Numbered('Browser geolocation \u2192 lat/lng (or ZIP fallback \u2192 Hampton Roads centroid lookup)'),
        Numbered('Haversine distance computed per resource'),
        Numbered('Resources are stable-sorted by distance ascending'),
        Numbered('Resources without coordinates (Virtual Care, Crisis Line) sort last'),
        callout('Privacy:', 'Coordinates never leave the browser \u2014 they\u2019re used only for local sorting.'),

        // ============ SECTION 6: SAFETY ============
        H1('Safety Mechanisms'),
        P('The algorithm has four overrides that can bypass normal scoring, listed in order of precedence:'),
        buildTable(
          [960, 2400, 3000, 3000],
          ['#', 'Override', 'Trigger', 'Effect'],
          [
            ['1', 'Emergency screen', 'Patient checks any symptom on the pre-triage screen', 'Immediate full-screen 911 alert, flow ENDS'],
            ['2', 'escalateImmediately', 'E.g., \u201CYes\u201D to self-harm question', 'Skip score, skip routing lookup, show 911 alert'],
            ['3', 'redirectToCareType', 'Meta-triage (\u201CNot Sure\u201D) answers', 'Restart flow in the chosen care type'],
            ['4', 'Missing routing rule', 'Misconfigured CMS (rule deleted for a valid urgency+caretype)', 'Fall back to Lackey Clinic phone + Virtual Care URL'],
          ],
        ),

        H2('6.1 Server-Side Re-scoring'),
        P('The client computes a running total for UX (progress bar, etc.), but the server ignores it. When the client POSTs to /api/triage/evaluate, only { careTypeId, answers[] } is sent. The server re-calls calculateScore() + classifyUrgency() authoritatively. This prevents a tampered client from forcing a favorable routing.'),

        H2('6.2 Input Validation'),
        Bullet('careTypeId regex-allowlisted (/^[A-Za-z0-9_-]{1,64}$/) before any DB query'),
        Bullet('Each answer must have typeof urgencyWeight === "number" \u2014 malformed answers return 400'),
        Bullet('Rate limited to 30 req/min/IP (sliding-window, in-memory for pilot)'),
        Bullet('Locale/device constrained to enum values (en|es, mobile|tablet|desktop)'),

        // ============ SECTION 7: ANALYTICS ============
        H1('Analytics Captured'),
        P('Each completed triage writes one anonymous TriageSession row:'),
        buildTable(
          [3200, 6160],
          ['Field', 'Purpose'],
          [
            ['sessionId', 'UUIDv4, not tied to any user identity'],
            ['careTypeSelected', 'Foreign key \u2192 CareType'],
            ['urgencyResult', 'Foreign key \u2192 UrgencyLevel'],
            ['resourcesShown[]', 'Foreign keys \u2192 CareResource'],
            ['virtualCareOffered', 'Boolean'],
            ['emergencyScreenTriggered', 'Boolean'],
            ['completedFlow', 'Boolean'],
            ['locale', '\u201Cen\u201D or \u201Ces\u201D'],
            ['device', '\u201Cmobile\u201D, \u201Ctablet\u201D, or \u201Cdesktop\u201D'],
            ['questionSetVersion', 'Integer (enables A/B of clinical changes)'],
            ['createdAt', 'Timestamp'],
          ],
        ),
        callout('Zero PII.', 'No patient identifiers, no answer values, no location coordinates, no free-text. The CEO dashboard aggregates these rows into pacing, routing mix, care-type breakdown, hourly heatmap, and partner referral charts.', GREEN),

        // ============ SECTION 8: HOW TO CHANGE ============
        H1('How to Change the Algorithm'),
        P('Everything is CMS-editable \u2014 no code changes required:'),
        buildTable(
          [4400, 4960],
          ['To change\u2026', 'Edit in admin'],
          [
            ['A question or answer label', 'Triage Logic \u2192 Questions'],
            ['An answer\u2019s urgency weight', 'Triage Logic \u2192 Questions \u2192 Answers'],
            ['An escalation trigger', 'Toggle escalateImmediately on the answer'],
            ['Score thresholds', 'Triage Logic \u2192 Urgency Levels'],
            ['Which resources show for a given routing', 'Triage Logic \u2192 Routing Rules'],
            ['A new care type entirely', 'Triage Logic \u2192 Care Types \u2192 add \u2192 create a Question Set for it'],
            ['A new clinic address or phone', 'Content \u2192 Care Resources'],
            ['The 911 symptom list', 'Content \u2192 Emergency Symptoms'],
          ],
        ),

        H2('Ship a Clinical Change Safely'),
        Numbered('Create a new QuestionSet with version=2 and isActive=false'),
        Numbered('Tweak questions/weights inside it'),
        Numbered('Preview via a direct URL'),
        Numbered('Flip isActive=true on v2 and isActive=false on v1 when ready'),
        Numbered('questionSetVersion in each session row lets you measure the impact'),

        // ============ SECTION 9: LIMITATIONS ============
        H1('Known Limitations'),
        P('The following gaps are intentional scoping choices for the pilot and should be discussed with Lackey\u2019s clinical team for next-phase planning:'),
        Numbered('Flat scoring model. All weights sum linearly. Real clinical triage often uses red-flag overrides (e.g., \u201Cany chest pain + age \u2265 50 = always Urgent\u201D). We handle the most critical ones via escalateImmediately, but nuanced multi-factor rules aren\u2019t expressible yet.'),
        Numbered('No demographics. The algorithm doesn\u2019t know age, pregnancy status, existing conditions, or meds. If a patient is 75 with diabetes, \u201Cmoderate pain\u201D should probably weigh more heavily \u2014 it doesn\u2019t today.'),
        Numbered('Single active QuestionSet per CareType. No A/B testing yet; questionSetVersion in sessions only tracks what was active at the time.'),
        Numbered('No clinical-protocol alignment claim. Weights were drafted by the build team for demo purposes and need clinical review against Schmitt-Thompson nurse protocols or similar evidence base.'),
        Numbered('timeToCare is not yet localized at the schema level \u2014 Spanish users see English time descriptions (\u201CSame day\u201D instead of \u201CEl mismo d\u00EDa\u201D). Requires a proper Payload migration to fix.'),
        Numbered('Progress bar counts against total questions in the set, but branches can end a flow early \u2014 occasional jump from 75% \u2192 results page is expected.'),

        // ============ SECTION 10: FILE REFERENCES ============
        H1('File & Code References'),
        buildTable(
          [3200, 5200, 960],
          ['Function', 'File', 'Lines'],
          [
            ['calculateScore', 'src/lib/triage-engine.ts', '29\u201331'],
            ['classifyUrgency', 'src/lib/triage-engine.ts', '33\u201340'],
            ['resolveNextQuestion', 'src/lib/triage-engine.ts', '42\u201352'],
            ['checkEscalation', 'src/lib/triage-engine.ts', '54\u201356'],
            ['Server evaluation', 'src/app/api/triage/evaluate/route.ts', '1\u2013150'],
            ['Client state machine', 'src/hooks/useTriage.ts', '1\u2013130'],
            ['Rate limiter', 'src/lib/rate-limit.ts', '1\u201330'],
            ['Session log failure counter', 'src/lib/observability.ts', '1\u201360'],
            ['Routing rule DB seed', 'src/seed/routing-rules.ts', '1\u2013100'],
            ['Question set DB seed', 'src/seed/question-sets.ts', '1\u2013600+'],
          ],
        ),
      ],
    },
  ],
})

// ============================================================
// WRITE OUTPUT
// ============================================================
Packer.toBuffer(doc).then((buffer) => {
  const outPath = process.argv[2] || 'triage-algorithm-spec.docx'
  fs.writeFileSync(outPath, buffer)
  console.log('Created:', outPath, `(${buffer.length.toLocaleString()} bytes)`)
}).catch((err) => {
  console.error('Failed to generate DOCX:', err)
  process.exit(1)
})
