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
const border = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
const borders = { top: border, bottom: border, left: border, right: border }
const cm = { top: 100, bottom: 100, left: 140, right: 140 }

const P = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22, ...(opts.run || {}) })] })
const H1 = (text, brk) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk !== false, children: [new TextRun({ text })] })
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text })] })
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
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Calibri', color: BLUE }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Calibri', color: BLUE }, paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'b1', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'b2', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n3', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'CONFIDENTIAL', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tHosting Services Addendum', font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: 'Traverse / Lackey Clinic', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tPage ', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    children: [
      // TITLE
      new Paragraph({ spacing: { before: 1200, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'HOSTING SERVICES ADDENDUM', size: 40, bold: true, color: BLUE })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'to the Software Development Statement of Work', size: 26, color: '555555' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'between Traverse and Lackey Clinic (Olivet Medical Ministries)', size: 22, color: '555555' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Effective Date: _________________, 2026', size: 22, color: '333333' })] }),

      // 1. PURPOSE
      H1('1. Purpose', false),
      P('This Addendum modifies the Software Development Statement of Work (the \u201CSOW\u201D) executed between Traverse (\u201CProvider\u201D) and Lackey Clinic, operating as Olivet Medical Ministries (\u201CClient\u201D). Under this Addendum, Provider will host and operate the Lackey Care Navigation application (\u201Cthe Software\u201D) on Provider-managed infrastructure, rather than transferring deployment assets for Client self-hosting.'),
      P('The license grant in SOW Section 4 remains unchanged. Client retains a perpetual, non-exclusive license to the Software. This Addendum governs the hosting, operation, and support services Provider will deliver.'),

      // 2. SCOPE
      H1('2. Scope of Hosting Services'),
      P('Provider shall host, operate, and maintain the Software at the URL agreed upon by the Parties (the \u201CService URL\u201D), initially expected to be:'),
      P('https://care.lackeyhealthcare.org', { run: { bold: true, color: BLUE } }),
      Spacer(100),
      P('The hosting services include:'),
      makeTable([4800, 4560], ['Service', 'Description'], [
        ['Application hosting', 'Next.js application deployed on a managed platform (currently Vercel) with auto-scaling and global CDN'],
        ['Database hosting', 'PostgreSQL database on a managed service (currently Neon) with automated daily backups and point-in-time recovery'],
        ['SSL/TLS certificate', 'Automatically provisioned and renewed HTTPS certificate for the Service URL'],
        ['Deployment pipeline', 'Automated deployments from the source code repository upon Provider approval'],
        ['Environment management', 'Secure management of all API keys, secrets, and configuration values'],
        ['Uptime monitoring', 'Automated health check monitoring via the /api/health endpoint'],
        ['Security patching', 'Timely application of security updates to dependencies and infrastructure'],
        ['CMS admin access', 'Client staff access to the Payload CMS admin panel at /admin for content management'],
        ['Dashboard access', 'Client leadership access to the executive analytics dashboard at /dashboard'],
        ['Third-party integrations', 'Management of Foursquare Places API key and other third-party service credentials'],
      ]),

      // 3. MODIFICATIONS TO SOW
      H1('3. Modifications to SOW Phase 1 Deliverables'),
      P('The following SOW Phase 1 items are modified by this Addendum:'),
      makeTable([1200, 3600, 4560], ['ID', 'Original Requirement', 'Modified Requirement'], [
        ['A1.1', 'Transfer source code repository to Client\u2019s GitHub organization', 'Provider retains the repository. Client receives read access for audit purposes upon written request.'],
        ['A1.2', 'Deliver containerized deployment package', 'Docker deployment files remain in the repository for documentation and portability. Provider operates the production deployment.'],
        ['G1.1', 'Source code transferred to Client\u2019s org', 'Software accessible at the Service URL with the agreed uptime commitment.'],
        ['G1.2', 'App runs via docker compose up on Client test machine', 'App runs at the Service URL. Client IT verifies accessibility and functionality via the acceptance checklist.'],
      ]),
      Spacer(100),
      P('All other SOW Phase 1 deliverables (D1.1\u2013D1.6) and Phase 2\u20134 terms remain in full force and effect.'),

      // 4. DATA OWNERSHIP
      H1('4. Data Ownership & Portability'),
      Num('All data stored in the database (triage session analytics, care resource directory, triage content, admin user records) is owned by Client.', 'n1'),
      Num('Provider has custodial access to the data solely for the purpose of operating the hosting services described herein.', 'n1'),
      Num('Provider shall not use Client data for any purpose other than operating the Software, except as required by law.', 'n1'),
      Num('Upon termination of this Addendum, Provider shall deliver to Client within thirty (30) calendar days:', 'n1'),
      Bullet('A complete PostgreSQL database export (pg_dump format)', 'b1'),
      Bullet('The full source code repository (as delivered under SOW D1.1)', 'b1'),
      Bullet('The Docker deployment package (SOW D1.3) enabling Client self-hosting', 'b1'),
      Bullet('All environment variable names and descriptions (SOW D1.4), excluding Provider-owned API keys', 'b1'),

      // 5. SERVICE LEVELS
      H1('5. Service Level Commitments'),
      H2('5.1 Uptime'),
      P('Provider commits to 99.5% monthly uptime for the Service URL, measured from the /api/health endpoint. Scheduled maintenance windows communicated at least 48 hours in advance are excluded from the uptime calculation.'),
      H2('5.2 Incident Response'),
      makeTable([2400, 3200, 3760], ['Priority', 'Definition', 'Response Time'], [
        ['P1 \u2014 Critical', 'Application is entirely down or a safety feature (911/988 routing) is broken', '4 business hours'],
        ['P2 \u2014 High', 'A major feature is broken (triage flow, dashboard, admin panel)', '1 business day'],
        ['P3 \u2014 Medium', 'Minor functionality issue or cosmetic defect', 'Next scheduled release'],
        ['P4 \u2014 Low', 'Enhancement request or non-urgent improvement', 'Backlog (per SOW Phase 4)'],
      ]),
      H2('5.3 Backups'),
      P('Database backups are performed automatically by the managed database provider. Point-in-time recovery is available for the most recent 7 days. Provider will perform a manual backup before any major deployment.'),

      // 6. CLIENT RESPONSIBILITIES
      H1('6. Client Responsibilities'),
      Num('Provide and maintain DNS records pointing the agreed subdomain to Provider\u2019s hosting infrastructure.', 'n2'),
      Num('Designate authorized personnel for CMS admin access and dashboard access.', 'n2'),
      Num('Review and approve clinical content changes (triage questions, urgency thresholds, routing rules) through the CMS admin panel.', 'n2'),
      Num('Notify Provider of any changes to care resource information (hours, phone numbers, new providers) that require CMS updates.', 'n2'),
      Num('Designate a point of contact for incident communication and change requests.', 'n2'),

      // 7. FEES
      H1('7. Hosting Fees'),
      P('Client shall pay Provider a monthly hosting fee as follows:'),
      makeTable([3000, 3200, 3160], ['Period', 'Monthly Fee', 'Includes'], [
        ['Pilot (Months 1\u201312)', '$________ /month', 'Hosting, maintenance, P1/P2 bug fixes, up to 5,000 sessions/month'],
        ['Renewal (Year 2+)', '$________ /month', 'Same as Pilot, adjusted annually by mutual agreement'],
      ]),
      Spacer(100),
      P('Fees are due on the first business day of each calendar month. Provider shall issue invoices at least 10 business days before the due date.'),
      P('If monthly session volume exceeds the included tier, the Parties shall negotiate in good faith an adjusted fee within 30 days. Provider shall not throttle or degrade service during the negotiation period.'),

      // 8. TERM
      H1('8. Term & Termination'),
      Num('This Addendum is effective as of the date first written above and continues for an initial term of twelve (12) months.', 'n3'),
      Num('After the initial term, this Addendum automatically renews for successive twelve-month periods unless either Party provides written notice of non-renewal at least sixty (60) days before the end of the then-current term.', 'n3'),
      Num('Either Party may terminate this Addendum for cause upon thirty (30) days\u2019 written notice if the other Party materially breaches any obligation and fails to cure within the notice period.', 'n3'),
      Num('Upon termination for any reason, Provider shall deliver the data portability package described in Section 4 within thirty (30) calendar days.', 'n3'),
      Num('The license grant in SOW Section 4 survives termination of this Addendum.', 'n3'),

      // 9. SECURITY
      H1('9. Security & Compliance'),
      Bullet('The Software collects zero personally identifiable information (PII). Session analytics are anonymous by design.', 'b2'),
      Bullet('All data in transit is encrypted via TLS 1.2+. Data at rest is encrypted by the managed database provider.', 'b2'),
      Bullet('Provider shall promptly notify Client of any security incident affecting the Software or its data.', 'b2'),
      Bullet('The application has undergone three rounds of adversarial security review. All critical and high-priority findings have been resolved.', 'b2'),
      Bullet('If the Software\u2019s scope expands to include PII (e.g., SMS follow-up, EMR integration), the Parties shall execute a Business Associate Agreement (BAA) before implementation.', 'b2'),

      // 10. GENERAL
      H1('10. General Provisions'),
      P('This Addendum is incorporated into and governed by the terms of the SOW. In the event of a conflict between this Addendum and the SOW, this Addendum shall control with respect to hosting services. All other terms of the SOW remain in full force and effect.'),
      Spacer(200),

      // SIGNATURE BLOCK
      P('IN WITNESS WHEREOF, the Parties have executed this Addendum as of the date first written above.'),
      Spacer(200),
      makeTable([4680, 4680], ['TRAVERSE', 'LACKEY CLINIC (Olivet Medical Ministries)'], [
        ['', ''],
        ['Signature: _________________________', 'Signature: _________________________'],
        ['Name: _________________________', 'Name: _________________________'],
        ['Title: _________________________', 'Title: _________________________'],
        ['Date: _________________________', 'Date: _________________________'],
      ]),
    ],
  }],
})

Packer.toBuffer(doc).then((buffer) => {
  const outPath = process.argv[2] || 'hosting-addendum.docx'
  fs.writeFileSync(outPath, buffer)
  console.log('Created:', outPath, `(${buffer.length.toLocaleString()} bytes)`)
}).catch((err) => { console.error('Failed:', err); process.exit(1) })
