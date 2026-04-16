const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  ExternalHyperlink, TabStopType, TabStopPosition
} = require("docx");

const BLUE = "1B4F72";
const LIGHT_BLUE = "D6EAF8";
const LIGHT_GRAY = "F2F3F4";
const GREEN = "196F3D";
const ORANGE = "B9770E";
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "333333" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "questions",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullets2",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullets3",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullets4",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "CONFIDENTIAL", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ text: "\tLackey Clinic \u2014 Clinical Discovery Call", font: "Arial", size: 16, color: "999999" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } }
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Prepared by Lackey Front Door Team", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ text: "\tPage ", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } }
          })]
        })
      },
      children: [
        // === TITLE PAGE ===
        new Paragraph({ spacing: { before: 2400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Clinical Discovery Call", font: "Arial", size: 56, bold: true, color: BLUE })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Question Guide & Agenda", font: "Arial", size: 36, color: "555555" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Lackey Clinic Care Navigation App", font: "Arial", size: 28, color: "777777" })]
        }),
        new Table({
          width: { size: 5000, type: WidthType.DXA },
          columnWidths: [5000],
          rows: [
            new TableRow({
              children: [new TableCell({
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                width: { size: 5000, type: WidthType.DXA },
                shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
                margins: { top: 200, bottom: 200, left: 300, right: 300 },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Wednesday, April 15, 2026", size: 24, bold: true, color: BLUE })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Meeting with CEO", size: 22, color: "555555" })] }),
                ]
              })]
            })
          ]
        }),

        // === PAGE BREAK - AGENDA ===
        new Paragraph({ children: [new PageBreak()] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Meeting Agenda")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Target duration: 25 minutes. Three sections, prioritized so the most critical information comes first.", size: 22, color: "555555", italics: true })]
        }),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 2800, 5160],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders, width: { size: 1400, type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Time", bold: true, color: "FFFFFF", size: 20 })] })] }),
                new TableCell({ borders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Section", bold: true, color: "FFFFFF", size: 20 })] })] }),
                new TableCell({ borders, width: { size: 5160, type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Goal", bold: true, color: "FFFFFF", size: 20 })] })] }),
              ]
            }),
            ...[
              ["10 min", "Must-Have Answers", "Core clinical workflows, in-house capabilities, safety protocols, eligibility criteria"],
              ["10 min", "Should-Get Answers", "Virtual care scope, grant metrics, patient acquisition, DataCare timeline"],
              ["5 min", "Nice-to-Get Answers", "SMS follow-up interest, external resource links, clinical sign-off process"],
            ].map((row, i) => new TableRow({
              children: row.map((cell, j) => new TableCell({
                borders,
                width: { size: [1400, 2800, 5160][j], type: WidthType.DXA },
                shading: { fill: i % 2 === 0 ? LIGHT_GRAY : "FFFFFF", type: ShadingType.CLEAR },
                margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })]
              }))
            }))
          ]
        }),

        // === SECTION 1: MUST-HAVE ===
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Section 1: Must-Have Answers (10 min)")] }),
        new Paragraph({
          spacing: { after: 200 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: GREEN, space: 8 } },
          indent: { left: 200 },
          children: [new TextRun({ text: "These questions address critical gaps in the app. Without answers, we cannot launch safely.", size: 22, color: GREEN, italics: true })]
        }),

        // Q1
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q1: "Walk me through what happens today when someone calls or walks in who you can\'t see right away."')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why we need this:", bold: true, size: 20 }), new TextRun({ text: " This tells us the real workflow we\u2019re digitizing. Reveals handoffs, wait times, and where people fall through the cracks.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Listen for: ", bold: true, size: 20 }), new TextRun({ text: "phone tree steps, triage nurse involvement, paper vs. digital intake, referral partners mentioned by name", size: 20 })] }),

        // Q2
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q2: "Which of these care types does Lackey handle in-house: behavioral health, vision, medication management, chronic care?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why we need this:", bold: true, size: 20 }), new TextRun({ text: " We have triage questions for all 7 care types but need to know which route to Lackey vs. external partners.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Follow-up: ", bold: true, size: 20 }), new TextRun({ text: "For each external referral, who exactly? Get names, phone numbers, hours.", size: 20 })] }),

        // Q3
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q3: "For behavioral health \u2014 if someone discloses suicidal ideation, what\u2019s the protocol? Crisis line first, or 911?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why we need this:", bold: true, size: 20 }), new TextRun({ text: " The app currently escalates to 911 for any \u201Cyes\u201D on self-harm. Need to confirm if Norfolk CSB Crisis Line (757-622-7017) should be the first step instead.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Current app behavior: ", bold: true, size: 20 }), new TextRun({ text: "escalateImmediately = true triggers full-screen 911 alert", size: 20 })] }),

        // Q4
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q4: "What are the exact eligibility criteria? Income threshold, residency, age, insurance status \u2014 what disqualifies someone?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why we need this:", bold: true, size: 20 }), new TextRun({ text: " Determines whether the app should pre-screen eligibility before showing Lackey as a resource, or always show it and let intake sort it out.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Current state: ", bold: true, size: 20 }), new TextRun({ text: "App links to JotForm for eligibility intake. DataCare 2.0 integration planned but not built.", size: 20 })] }),

        // Q5
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q5: "Are the 15 Norfolk resources we\u2019ve seeded correct and current? Anyone missing?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why we need this:", bold: true, size: 20 }), new TextRun({ text: " Validates our care resource directory. Specifically ask about EVMS HOPES clinic (Thursday evenings, free, Spanish-speaking) as a separate listing.", size: 20 })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Current resources in app:", bold: true, size: 20 })] }),
        ...[
          "Sentara Norfolk General (Level I Trauma), Sentara Leigh Hospital",
          "Sentara Urgent Care (Wards Corner, Princess Anne)",
          "Lackey Clinic (Primary, Dental, Virtual Care)",
          "EVMS Health Services, Norfolk Health Department",
          "Norfolk CSB (Crisis Line + Outpatient Behavioral Health)",
        ].map(item => new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: item, size: 20 })] })),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // === SECTION 2: SHOULD-GET ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Section 2: Should-Get Answers (10 min)")] }),
        new Paragraph({
          spacing: { after: 200 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: ORANGE, space: 8 } },
          indent: { left: 200 },
          children: [new TextRun({ text: "These answers shape the product roadmap and grant reporting strategy.", size: 22, color: ORANGE, italics: true })]
        }),

        // Q6
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q6: "What does Virtual Care through Zipnosis actually cover, and what are the exclusions?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why:", bold: true, size: 20 }), new TextRun({ text: " The app routes most non-emergency, non-dental paths to Virtual Care. We need to know what bounces back so we can set patient expectations.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets3", level: 0 }, children: [new TextRun({ text: "Current URL: ", bold: true, size: 20 }), new TextRun({ text: "luca.zipnosis.com/guest_visits/new?l=en", size: 20 })] }),

        // Q7
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q7: "What metrics does your grant require? We track sessions, completion rates, urgency distribution, virtual care offers, and emergency triggers. What else?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why:", bold: true, size: 20 }), new TextRun({ text: " If funders need downstream outcome data (did the patient actually get care?), we need to build a follow-up mechanism. This is the #1 gap competitive tools address.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets3", level: 0 }, children: [new TextRun({ text: "Possible addition: ", bold: true, size: 20 }), new TextRun({ text: "Optional post-triage survey: \u201CDid you get the care you needed?\u201D (3 buttons, anonymous)", size: 20 })] }),

        // Q8
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q8: "How should patients find this app? QR codes in clinic? Community health workers? Google?"')] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Why:", bold: true, size: 20 }), new TextRun({ text: " Affects whether we need UTM tracking, print materials, offline/PWA support, or SEO optimization.", size: 20 })] }),
        new Paragraph({ spacing: { after: 200 }, numbering: { reference: "bullets3", level: 0 }, children: [new TextRun({ text: "If CHWs share the link: ", bold: true, size: 20 }), new TextRun({ text: "consider adding a staff-facing mode with additional clinical context", size: 20 })] }),

        // Q9
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q9: "What\u2019s the timeline for DataCare 2.0 replacing JotForm for eligibility intake?"')] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Why:", bold: true, size: 20 }), new TextRun({ text: " Determines whether we build that integration now or later. Architecture is ready for the swap.", size: 20 })] }),

        // === SECTION 3: NICE-TO-GET ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Section 3: Nice-to-Get Answers (5 min)")] }),

        // Q10
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q10: "Would you use CareMessage ($250/year) for SMS follow-up with patients after triage?"')] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Context:", bold: true, size: 20 }), new TextRun({ text: " Text messaging reduces no-shows 5\u201375% and is the most effective outreach for this population. CareMessage is $250/year for free clinics.", size: 20 })] }),

        // Q11
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q11: "Should we link to outside resources like 211 Virginia, NeedyMeds, findhelp.org, or HealthCare.gov navigators?"')] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Context:", bold: true, size: 20 }), new TextRun({ text: " Low-effort, high-value additions that address social determinants (food, housing, transport, medication costs) beyond what Lackey offers directly.", size: 20 })] }),

        // Q12
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Q12: "Who on your clinical team should review and approve the triage questions and urgency scoring before launch?"')] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Context:", bold: true, size: 20 }), new TextRun({ text: " Someone with clinical authority needs to sign off on the 42 routing rules and urgency thresholds. This is also important for grant credibility.", size: 20 })] }),

        // === NOTES PAGE ===
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Notes")] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Use this space to capture answers during the call.", size: 22, color: "999999", italics: true })] }),
        ...[...Array(20)].map(() => new Paragraph({
          spacing: { after: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD", space: 8 } },
          children: [new TextRun({ text: " ", size: 22 })]
        })),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = process.argv[2] || "clinical-discovery-call-questions.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Created: " + outPath);
});
