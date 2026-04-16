const fs = require('fs')
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TabStopType, TabStopPosition, ExternalHyperlink,
} = require('docx')

const BLUE = '1B4F72'
const LIGHT_BLUE = 'EBF2F9'
const LIGHT_GRAY = 'F5F5F4'
const GREEN = '15803D'
const ORANGE = 'C2410C'
const border = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
const borders = { top: border, bottom: border, left: border, right: border }
const cm = { top: 100, bottom: 100, left: 140, right: 140 }

const P = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: Array.isArray(text) ? text : [new TextRun({ text, size: 22, ...(opts.run || {}) })] })
const H1 = (text, brk) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk !== false, children: [new TextRun({ text })] })
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text })] })
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text })] })
const Bullet = (text, ref = 'b1') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, size: 22 })] })
const Num = (text, ref = 'n1') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text, size: 22 })] })
const Code = (text) => new Paragraph({
  spacing: { before: 80, after: 140 },
  shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
  indent: { left: 240, right: 240 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 12 }, top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 }, right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 6 } },
  children: text.split('\n').flatMap((line, i, arr) => { const r = new TextRun({ text: line, font: 'Consolas', size: 19, color: '334155' }); return i === arr.length - 1 ? [r] : [r, new TextRun({ break: 1 })] }),
})
const Spacer = (s = 200) => new Paragraph({ spacing: { after: s }, children: [] })
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
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Calibri', color: '334155' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: 'b1', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'b2', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'b3', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n3', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n4', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'n5', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'Lackey Care Navigation', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tDeployment Guide', font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: 'Prepared by Traverse for Lackey Clinic', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ text: '\tPage ', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '999999' })], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } } })] }) },
    children: [
      // ===== COVER =====
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Deployment Guide', font: 'Calibri', size: 56, bold: true, color: BLUE })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Lackey Care Navigation App', font: 'Calibri', size: 32, color: '555555' })] }),
      new Table({ width: { size: 6000, type: WidthType.DXA }, columnWidths: [6000], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 6000, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: { top: 240, bottom: 240, left: 320, right: 320 }, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Prepared for Pedro', size: 24, bold: true, color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Lackey Clinic IT', size: 22, color: '555555' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'April 2026', size: 22, color: '666666' })] }),
      ] })] })] }),

      // ===== OVERVIEW =====
      H1('Overview', false),
      P('This guide walks you through deploying the Lackey Care Navigation app to your website. The app is a Next.js web application with a PostgreSQL database and a Payload CMS admin panel.'),
      P('Two deployment options are documented. Option A (Vercel) is recommended for fastest setup with zero server maintenance. Option B (Docker) gives you full infrastructure control.'),
      Spacer(100),
      makeTable([1600, 3880, 3880], ['', 'Option A: Vercel', 'Option B: Docker'],
        [
          ['Setup time', '~30 minutes', '~1 hour'],
          ['Monthly cost', '$0 (free tier)', '$6\u201312/mo (VPS)'],
          ['Maintenance', 'Zero \u2014 auto-scales, auto-deploys', 'You manage the server (updates, backups)'],
          ['Custom domain', 'Built-in + free SSL', 'Nginx + Let\u2019s Encrypt (manual setup)'],
          ['Best for', 'Pilot / small team / minimal IT staff', 'Full control / grant requires self-hosted'],
        ],
      ),

      // ===== PREREQUISITES =====
      H1('Prerequisites'),
      P('Before you start, you\u2019ll need:'),
      Bullet('Access to the GitHub repository (Traverse will transfer it to your organization)', 'b1'),
      Bullet('A domain name or subdomain for the app (e.g., care.lackeyhealthcare.org)', 'b1'),
      Bullet('Access to your domain\u2019s DNS settings (to point the subdomain to the server)', 'b1'),
      Bullet('A computer with a terminal / command line', 'b1'),
      Spacer(100),
      Callout('Before you begin:', 'Traverse will provide you with the following credentials separately via a secure channel: the Foursquare API key (optional), and any seed data passwords. Never share these in email or chat.'),

      // ===== OPTION A: VERCEL =====
      H1('Option A: Vercel (Recommended)'),
      P('Vercel is the company that makes Next.js. Deploying there is the fastest and most reliable option. Their free Hobby tier handles pilot-scale traffic with no monthly cost.'),

      H2('Step 1: Create Accounts'),
      Num('Go to vercel.com and create a free account. Sign in with your GitHub account for easiest setup.', 'n1'),
      Num('Go to neon.tech and create a free account. This is your cloud PostgreSQL database. After signup, create a new project called "lackey-care-nav". Copy the connection string \u2014 it looks like: postgresql://neondb_owner:abc123@ep-cool-name.us-east-2.aws.neon.tech/neondb', 'n1'),

      H2('Step 2: Import the Repository'),
      Num('In the Vercel dashboard, click "Add New Project"', 'n2'),
      Num('Select "Import Git Repository" and choose the Lackey Care Navigation repo', 'n2'),
      Num('Vercel auto-detects it\u2019s a Next.js app \u2014 no framework configuration needed', 'n2'),
      Num('Before clicking Deploy, add your environment variables (next step)', 'n2'),

      H2('Step 3: Set Environment Variables'),
      P('In Vercel\u2019s project settings \u2192 Environment Variables, add these:'),
      makeTable([3200, 6160], ['Variable', 'Value'],
        [
          [[new TextRun({ text: 'DATABASE_URI', bold: true, font: 'Consolas', size: 20 })], 'The Neon connection string from Step 1'],
          [[new TextRun({ text: 'PAYLOAD_SECRET', bold: true, font: 'Consolas', size: 20 })], 'A strong random string. Generate with: openssl rand -base64 32'],
          [[new TextRun({ text: 'NEXT_PUBLIC_SITE_URL', bold: true, font: 'Consolas', size: 20 })], 'https://care.lackeyhealthcare.org (your production URL)'],
          [[new TextRun({ text: 'DASHBOARD_USERNAME', bold: true, font: 'Consolas', size: 20 })], 'Username for the CEO dashboard (e.g., lackey-admin)'],
          [[new TextRun({ text: 'DASHBOARD_PASSWORD', bold: true, font: 'Consolas', size: 20 })], 'A strong random password for the dashboard'],
          [[new TextRun({ text: 'FOURSQUARE_API_KEY', bold: true, font: 'Consolas', size: 20 })], '(Optional) Provided by Traverse. Enables nearby urgent care search.'],
        ],
      ),
      Spacer(100),
      Callout('Important:', 'PAYLOAD_SECRET and DASHBOARD_PASSWORD must be strong random strings. Use: openssl rand -base64 32 to generate them. Write them down securely \u2014 you\u2019ll need them if you ever redeploy.', ORANGE),

      H2('Step 4: Deploy'),
      Num('Click "Deploy" in Vercel. The first build takes 2\u20133 minutes.', 'n3'),
      Num('Once deployed, Vercel gives you a URL like lackey-care-nav.vercel.app. Verify the app loads.', 'n3'),
      Num('Every future push to the main branch auto-deploys. PRs get preview URLs for testing.', 'n3'),

      H2('Step 5: Connect Your Domain'),
      Num('In the Vercel dashboard, go to Settings \u2192 Domains', 'n4'),
      Num('Add your subdomain: care.lackeyhealthcare.org', 'n4'),
      Num('Vercel will show you a DNS record to add. Go to your domain registrar (GoDaddy, Cloudflare, etc.) and add:', 'n4'),
      Code('Type:  CNAME\nName:  care\nValue: cname.vercel-dns.com'),
      Num('Wait 5\u201330 minutes for DNS propagation. Vercel auto-provisions a free SSL certificate.', 'n4'),
      Num('Verify: open https://care.lackeyhealthcare.org in your browser', 'n4'),

      H2('Step 6: Seed the Database'),
      P('The database starts empty. You need to run these commands once from your local computer (not in Vercel \u2014 Vercel doesn\u2019t have terminal access):'),
      Code('# Install Node.js 22+ if you don\u2019t have it: https://nodejs.org\n\ngit clone <your-repo-url>\ncd lackey-care-navigation\nnpm install\n\n# Set the Neon DATABASE_URI and your PAYLOAD_SECRET\nexport DATABASE_URI="postgresql://...@neon.tech/neondb"\nexport PAYLOAD_SECRET="your-secret-here"\n\n# Seed everything\nnpx tsx src/seed/seed.ts\nnpx tsx src/seed/backfill-spanish.ts\nnpx tsx src/seed/create-admin.ts admin@lackey.org your-admin-password'),
      Spacer(100),
      Callout('Done!', 'Your app is live at care.lackeyhealthcare.org. Patients can start using it. You can manage content at /admin and view analytics at /dashboard.', GREEN),

      // ===== OPTION B: DOCKER =====
      H1('Option B: Docker (Self-Hosted)'),
      P('Use this if Lackey wants full control of the infrastructure or if your grant requires self-hosted deployment.'),

      H2('Step 1: Provision a Server'),
      Bullet('DigitalOcean Droplet ($6\u201312/mo), Linode, Vultr, or any Ubuntu 24.04 VPS with 2GB+ RAM', 'b2'),
      Bullet('Or use an existing Lackey server if you have one', 'b2'),

      H2('Step 2: Install Docker'),
      Code('ssh root@your-server-ip\napt update && apt install -y docker.io docker-compose-plugin\ndocker --version  # should show 24+'),

      H2('Step 3: Clone and Configure'),
      Code('git clone <your-repo-url>\ncd lackey-care-navigation\ncp .env.example .env'),
      P('Edit .env with your production values:'),
      Code('PAYLOAD_SECRET=<generate with: openssl rand -base64 32>\nDB_PASSWORD=<strong database password>\nDASHBOARD_USERNAME=lackey-admin\nDASHBOARD_PASSWORD=<strong dashboard password>\nFOURSQUARE_API_KEY=<optional, from Traverse>'),

      H2('Step 4: Start the Application'),
      Code('docker compose up -d\n\n# Watch the logs to make sure everything starts:\ndocker compose logs -f\n# You should see "Ready" from the app service\n\n# Verify:\ncurl http://localhost:3000/api/health\n# Should return: {"status":"ok","database":"ok",...}'),

      H2('Step 5: Seed the Database'),
      Code('docker compose exec app npm run seed\ndocker compose exec app npx tsx src/seed/backfill-spanish.ts\ndocker compose exec app npx tsx src/seed/create-admin.ts admin@lackey.org your-password'),

      H2('Step 6: Set Up HTTPS with Nginx'),
      Code('apt install -y nginx certbot python3-certbot-nginx'),
      P('Create the Nginx config:'),
      Code('# /etc/nginx/sites-available/lackey\nserver {\n    server_name care.lackeyhealthcare.org;\n    location / {\n        proxy_pass http://localhost:3000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}'),
      Code('ln -s /etc/nginx/sites-available/lackey /etc/nginx/sites-enabled/\nnginx -t && systemctl reload nginx\ncertbot --nginx -d care.lackeyhealthcare.org'),

      H2('Step 7: DNS'),
      P('Add an A record in your DNS:'),
      Code('Type:  A\nName:  care\nValue: <your-server-ip>'),
      P('Wait for propagation, then verify https://care.lackeyhealthcare.org loads.'),
      Spacer(100),
      Callout('Done!', 'Your self-hosted app is live. For updates: git pull && docker compose up -d --build', GREEN),

      // ===== POST-DEPLOYMENT =====
      H1('After Deployment'),

      H2('Accessing the Admin Panel'),
      P('Go to care.lackeyhealthcare.org/admin and log in with the admin credentials you created during seeding. From here you can:'),
      Bullet('Edit care resources (add clinics, update phone numbers, change hours)', 'b3'),
      Bullet('Modify triage questions and urgency weights', 'b3'),
      Bullet('Update the Virtual Care URL, clinic phone, and eligibility link', 'b3'),
      Bullet('Toggle content between English and Spanish', 'b3'),

      H2('Accessing the Executive Dashboard'),
      P('Go to care.lackeyhealthcare.org/dashboard. The browser will prompt for Basic Auth credentials (the DASHBOARD_USERNAME / DASHBOARD_PASSWORD you set). The dashboard shows:'),
      Bullet('Session metrics: users served, completion rate, virtual care referrals', 'b3'),
      Bullet('Emergency (911) and Crisis (988) event counts', 'b3'),
      Bullet('Daily trend bar chart, care type breakdown, routing mix', 'b3'),
      Bullet('Partner referral map and hourly heatmap', 'b3'),
      Bullet('CSV export for grant reporting', 'b3'),

      H2('Database Backups (Docker only)'),
      P('If using Docker, set up a daily backup cron job:'),
      Code('# Add to crontab (crontab -e):\n0 2 * * * docker compose exec -T db pg_dump -U lackey lackey_care_navigation | gzip > /backups/lackey-$(date +\\%Y\\%m\\%d).sql.gz'),

      H2('Updating the App'),
      P('When Traverse delivers updates:'),
      P('Vercel:', { run: { bold: true } }),
      Bullet('Merge the PR on GitHub. Vercel auto-deploys within 2 minutes.', 'b3'),
      Spacer(60),
      P('Docker:', { run: { bold: true } }),
      Code('cd lackey-care-navigation\ngit pull\ndocker compose up -d --build'),

      // ===== URLS =====
      H1('URL Reference'),
      makeTable([4000, 2800, 2560], ['URL', 'What', 'Auth'],
        [
          ['care.lackeyhealthcare.org/en', 'Patient triage app (English)', 'None (public)'],
          ['care.lackeyhealthcare.org/es', 'Patient triage app (Spanish)', 'None (public)'],
          ['care.lackeyhealthcare.org/admin', 'CMS admin panel', 'Email + password'],
          ['care.lackeyhealthcare.org/dashboard', 'CEO executive dashboard', 'Basic Auth'],
          ['care.lackeyhealthcare.org/api/health', 'Health check', 'None (public)'],
        ],
      ),

      // ===== ENVIRONMENT VARS =====
      H1('Environment Variable Reference'),
      makeTable([3000, 1200, 5160], ['Variable', 'Required', 'Description'],
        [
          ['DATABASE_URI', 'Yes', 'PostgreSQL connection string (Neon for Vercel, Docker internal for self-hosted)'],
          ['PAYLOAD_SECRET', 'Yes', 'JWT signing key for CMS auth. Must be 32+ random characters.'],
          ['NEXT_PUBLIC_SITE_URL', 'Yes', 'Public URL (https://care.lackeyhealthcare.org)'],
          ['DASHBOARD_USERNAME', 'Prod', 'Basic Auth user for /dashboard. App refuses to start if unset in production.'],
          ['DASHBOARD_PASSWORD', 'Prod', 'Basic Auth password for /dashboard. Use openssl rand -base64 32.'],
          ['FOURSQUARE_API_KEY', 'No', 'Enables nearby urgent care search. Free tier at foursquare.com/developers.'],
          ['DB_PASSWORD', 'Docker', 'PostgreSQL password (Docker Compose only).'],
        ],
      ),

      // ===== SUPPORT =====
      H1('Support'),
      P('If you run into issues during deployment:'),
      Num('Check the health endpoint: /api/health \u2014 it reports database status and any recent errors', 'n5'),
      Num('Check the logs: docker compose logs app (Docker) or Vercel dashboard \u2192 Deployments \u2192 Logs', 'n5'),
      Num('Contact Traverse at the email/phone provided in the SOW for P1/P2 defect support', 'n5'),
      Spacer(200),
      Callout('Estimated total setup time:', 'Option A (Vercel): ~30 minutes. Option B (Docker): ~1 hour. Both include database seeding and domain configuration.', GREEN),
    ],
  }],
})

Packer.toBuffer(doc).then((buffer) => {
  const outPath = process.argv[2] || 'deployment-guide.docx'
  fs.writeFileSync(outPath, buffer)
  console.log('Created:', outPath, `(${buffer.length.toLocaleString()} bytes)`)
}).catch((err) => { console.error('Failed:', err); process.exit(1) })
