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
const Num = (text, ref = 'n1') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22 })] })
const Bullet = (text, ref = 'b1') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22 })] })
const Spacer = (s = 200) => new Paragraph({ spacing: { after: s }, children: [] })
const Code = (text) => new Paragraph({
  spacing: { before: 80, after: 140 },
  shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
  indent: { left: 240, right: 240 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 12 }, top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 }, right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 } },
  children: text.split('\n').flatMap((line, i, arr) => { const r = new TextRun({ text: line, font: 'Consolas', size: 19, color: '334155' }); return i === arr.length - 1 ? [r] : [r, new TextRun({ break: 1 })] }),
})
const Callout = (title, body, color = BLUE) => new Paragraph({
  spacing: { before: 100, after: 180 }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 16, color, space: 12 }, top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 }, right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 } },
  indent: { left: 240, right: 240 },
  children: [new TextRun({ text: title + ' ', bold: true, size: 22, color }), new TextRun({ text: body, size: 22 })],
})

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
    ],
  },
  numbering: { config: [
    { reference: 'b1', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'Lackey Clinic', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tCare Navigation \u2014 Website Integration Guide', font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: 'Prepared by Traverse', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tPage ', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    children: [
      // COVER
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Website Integration Guide', size: 52, bold: true, color: BLUE })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Connecting care.lackeyhealthcare.org', size: 28, color: '555555' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'For Pedro \u2014 Lackey Clinic IT', size: 24, italics: true, color: '777777' })] }),
      new Table({ width: { size: 5000, type: WidthType.DXA }, columnWidths: [5000], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 5000, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 300, right: 300 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Estimated time: 15 minutes', size: 24, bold: true, color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No coding required \u2014 DNS and CMS changes only', size: 22, color: '555555' })] }),
      ] })] })] }),

      // OVERVIEW
      H1('What You\u2019re Setting Up', false),
      P('The Lackey Care Navigation app is already built and running. It\u2019s hosted by Traverse and currently accessible at:'),
      P('https://lackey-care-navigation.vercel.app', { run: { bold: true, color: BLUE } }),
      Spacer(100),
      P('You\u2019re going to do two things:'),
      Num([new TextRun({ text: 'Connect a subdomain ', size: 22 }), new TextRun({ text: 'care.lackeyhealthcare.org', bold: true, size: 22 }), new TextRun({ text: ' so patients see a Lackey-branded URL', size: 22 })], 'n1'),
      Num([new TextRun({ text: 'Add a redirect ', size: 22 }), new TextRun({ text: 'from lackeyhealthcare.org/care', bold: true, size: 22 }), new TextRun({ text: ' so people who type or click that path land on the app', size: 22 })], 'n1'),
      Spacer(100),
      P('After this, patients can reach the Care Navigation app three ways:'),
      Bullet('Typing care.lackeyhealthcare.org directly', 'b1'),
      Bullet('Clicking a "Get Care Now" button on your main website', 'b1'),
      Bullet('Going to lackeyhealthcare.org/care (redirects automatically)', 'b1'),
      Spacer(100),
      Callout('Nothing changes on your main website\u2019s hosting.', 'The Care Navigation app runs on its own separate infrastructure managed by Traverse. You\u2019re just pointing a subdomain and adding a redirect. Your main site stays exactly as it is.'),

      // STEP 1
      H1('Step 1: Add the DNS Record (Subdomain)'),
      P('This connects care.lackeyhealthcare.org to the Care Navigation app.'),
      Spacer(80),
      H2('1a. Log into your DNS provider'),
      P('This is wherever Lackey\u2019s domain (lackeyhealthcare.org) is managed. Common providers:'),
      Bullet('GoDaddy \u2192 DNS Management', 'b1'),
      Bullet('Cloudflare \u2192 DNS \u2192 Records', 'b1'),
      Bullet('Google Domains \u2192 DNS', 'b1'),
      Bullet('Namecheap \u2192 Advanced DNS', 'b1'),
      P('If you\u2019re not sure which provider Lackey uses, check with whoever originally set up the website. The login credentials should be in Lackey\u2019s IT documentation.'),

      H2('1b. Add a CNAME record'),
      P('Create a new DNS record with these exact values:'),
      makeTable([2400, 6960], ['Field', 'Value'], [
        [[new TextRun({ text: 'Type', bold: true, size: 20 })], 'CNAME'],
        [[new TextRun({ text: 'Name / Host', bold: true, size: 20 })], 'care'],
        [[new TextRun({ text: 'Value / Points to', bold: true, size: 20 })], 'cname.vercel-dns.com'],
        [[new TextRun({ text: 'TTL', bold: true, size: 20 })], 'Auto (or 3600)'],
      ]),
      Spacer(100),
      Callout('Important:', 'The Name field is just "care" \u2014 not "care.lackeyhealthcare.org". Your DNS provider adds the domain automatically.'),
      Spacer(100),
      P('Here\u2019s what it looks like in common DNS providers:'),
      Spacer(80),
      P('GoDaddy:', { run: { bold: true } }),
      Code('Type:  CNAME\nName:  care\nValue: cname.vercel-dns.com\nTTL:   Default'),
      Spacer(80),
      P('Cloudflare:', { run: { bold: true } }),
      Code('Type:   CNAME\nName:   care\nTarget: cname.vercel-dns.com\nProxy:  DNS only (gray cloud)'),
      Spacer(100),
      Callout('Cloudflare note:', 'If you use Cloudflare, make sure the proxy toggle is set to "DNS only" (gray cloud icon, NOT orange). The orange proxy would interfere with Vercel\u2019s SSL certificate.'),

      H2('1c. Wait for DNS propagation'),
      P('DNS changes take 5\u201330 minutes to propagate worldwide. You can check if it\u2019s working by visiting:'),
      P('https://care.lackeyhealthcare.org', { run: { bold: true, color: BLUE } }),
      P('If you see the Care Navigation landing page ("Get the right care, right now"), it\u2019s working. If you see a browser error, wait a few more minutes and try again.'),
      Spacer(100),
      Callout('SSL is automatic.', 'Vercel will automatically issue a free SSL certificate for care.lackeyhealthcare.org. You don\u2019t need to buy or configure anything. HTTPS just works.'),

      H2('1d. Notify Traverse'),
      P('Once the DNS record is added, let Traverse know (email or Slack). We need to:'),
      Num('Add care.lackeyhealthcare.org as a domain in our Vercel dashboard (takes 30 seconds)', 'n2'),
      Num('Update the app\u2019s internal site URL to match the new domain', 'n2'),
      P('We\u2019ll confirm when it\u2019s live.'),

      // STEP 2
      H1('Step 2: Add a Redirect on Your Main Website'),
      P('This lets patients type lackeyhealthcare.org/care and land on the Care Navigation app.'),
      Spacer(80),
      H2('Where to set this up'),
      P('This depends on what platform Lackey\u2019s main website uses:'),
      Spacer(80),

      P('WordPress:', { run: { bold: true } }),
      Bullet('Install the "Redirection" plugin (free), or use your theme\u2019s redirect settings', 'b1'),
      Bullet('Source URL: /care', 'b1'),
      Bullet('Target URL: https://care.lackeyhealthcare.org/en', 'b1'),
      Bullet('Type: 301 (permanent redirect)', 'b1'),
      Bullet('Optional: also add /cuidado \u2192 https://care.lackeyhealthcare.org/es for Spanish', 'b1'),
      Spacer(80),

      P('Squarespace:', { run: { bold: true } }),
      Bullet('Settings \u2192 Advanced \u2192 URL Mappings', 'b1'),
      Bullet('Add: /care -> https://care.lackeyhealthcare.org/en 301', 'b1'),
      Spacer(80),

      P('Wix:', { run: { bold: true } }),
      Bullet('Settings \u2192 Custom Code \u2192 Redirect Manager', 'b1'),
      Bullet('Old URL: /care \u2192 New URL: https://care.lackeyhealthcare.org/en', 'b1'),
      Spacer(80),

      P('Static site / custom server:', { run: { bold: true } }),
      Code('# Apache (.htaccess)\nRedirect 301 /care https://care.lackeyhealthcare.org/en\nRedirect 301 /cuidado https://care.lackeyhealthcare.org/es\n\n# Nginx\nrewrite ^/care$ https://care.lackeyhealthcare.org/en permanent;\nrewrite ^/cuidado$ https://care.lackeyhealthcare.org/es permanent;'),

      // STEP 3
      H1('Step 3: Add a "Get Care Now" Button (Optional)'),
      P('Add a prominent link or button on your main website\u2019s homepage or navigation that sends patients to the Care Navigation app:'),
      Code('<a href="https://care.lackeyhealthcare.org"\n   style="background: #1B4F72; color: white; padding: 16px 32px;\n          border-radius: 12px; font-size: 18px; font-weight: bold;\n          text-decoration: none; display: inline-block;">\n  Get Care Now\n</a>'),
      Spacer(100),
      P('Or simply add a text link in your navigation menu:'),
      Bullet('Menu item label: "Get Care Now" or "Find Care"', 'b1'),
      Bullet('URL: https://care.lackeyhealthcare.org', 'b1'),
      Spacer(100),
      P('For Spanish-language pages on your main site, link to:'),
      P('https://care.lackeyhealthcare.org/es', { run: { bold: true, color: BLUE } }),

      // VERIFICATION
      H1('Step 4: Verify Everything Works'),
      P('After completing Steps 1\u20133, check each of these:'),
      makeTable([5000, 4360], ['Test', 'Expected Result'], [
        ['Visit https://care.lackeyhealthcare.org', 'You see "Get the right care, right now" landing page'],
        ['Visit https://care.lackeyhealthcare.org/es', 'Same page but in Spanish ("Obtenga la atenci\u00F3n adecuada ahora mismo")'],
        ['Visit lackeyhealthcare.org/care', 'Redirects to care.lackeyhealthcare.org/en'],
        ['Click "Get Care Now" on your main site', 'Opens the Care Navigation app'],
        ['Check the padlock icon in your browser', 'Shows valid SSL certificate (HTTPS)'],
        ['Try on a phone', 'Mobile-friendly layout with large tap targets'],
        ['Toggle dark mode (moon icon in header)', 'Page switches to dark theme'],
        ['Toggle ES (language button in header)', 'All content switches to Spanish'],
      ]),

      // SUMMARY
      H1('Summary'),
      P('That\u2019s it. Here\u2019s what you did:'),
      makeTable([600, 4000, 4760], ['#', 'What', 'Time'], [
        ['1', 'Added a CNAME DNS record pointing care.lackeyhealthcare.org to Vercel', '5 minutes'],
        ['2', 'Added a redirect from lackeyhealthcare.org/care to the app', '5 minutes'],
        ['3', 'Added a "Get Care Now" button on the main site', '5 minutes'],
      ]),
      Spacer(100),
      Callout('You\u2019re done!', 'Patients can now find the Care Navigation app from your main website. Traverse manages all the hosting, updates, and infrastructure. If anything needs to change, contact Traverse \u2014 you don\u2019t need to touch the DNS or app again.', GREEN),

      // CONTACTS
      Spacer(200),
      H2('Questions?'),
      P('If you run into any issues during setup, contact Traverse at the email/phone provided in the SOW. Common issues:'),
      Bullet('DNS not propagating \u2192 wait 30 minutes, then clear your browser cache and try again', 'b1'),
      Bullet('"SSL certificate error" \u2192 notify Traverse so we can add the domain in Vercel (Step 1d)', 'b1'),
      Bullet('"Page not found" on the redirect \u2192 double-check the target URL includes /en at the end', 'b1'),
    ],
  }],
})

Packer.toBuffer(doc).then((buffer) => {
  const outPath = process.argv[2] || 'pedro-website-integration-guide.docx'
  fs.writeFileSync(outPath, buffer)
  console.log('Created:', outPath, `(${buffer.length.toLocaleString()} bytes)`)
}).catch((err) => { console.error('Failed:', err); process.exit(1) })
