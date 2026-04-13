# Competitive Research — Low/No Insurance Care Navigation Tools
**Date:** 2026-04-13

## Quick Wins (hours, not days)

| What | Why | How |
|------|-----|-----|
| Link to NeedyMeds/GoodRx on results | #1 barrier after diagnosis is affording meds | Add resource card |
| Add "Call/Text 211" card | Covers food, housing, transport | One component |
| Link to findhelp.org/23510 | Hundreds of Norfolk social service programs | One link |
| Link to HealthCare.gov Navigator | Many "uninsured" qualify for Medicaid/ACA | One link |
| Add EVMS HOPES clinic separately | Only free clinic in Norfolk proper, Spanish-speaking | Seed data entry |

## High-Impact Investments

| What | Why | Cost/Effort |
|------|-----|-------------|
| CareMessage SMS ($250/yr) | Text follow-up reduces no-shows 5-75% | 1-2 weeks setup |
| Post-triage outcome survey | Transforms grant metrics from outputs to outcomes | 1 week dev |
| PWA offline support | Unreliable data plans need offline access | 1-2 weeks |
| Readability audit (target 5th grade) | 54% of target population reads below 6th grade | Content review |

## Key Competitors

### findhelp.org (Aunt Bertha)
Largest social services search engine. Enter ZIP, browse healthcare + housing + food + transit. Free, no registration. Lackey should link to findhelp.org/23510 on results page.

### 211 Virginia
Free 24/7 phone/text/chat/web. Covers healthcare, housing, food, financial assistance. Add "Call/Text 211" to results.

### NeedyMeds
400+ patient assistance programs, drug discount card at 65K+ pharmacies, 80% off. Free helpline. Link on results page for medication paths.

### CareMessage ($250/yr for free clinics)
SMS patient engagement for safety-net orgs. 20M+ people served. Reduces no-shows 5-75%. Most relevant tool Lackey is NOT using.

### Clearstep Health
AI triage on Schmitt-Thompson nurse protocols (gold standard). Enterprise SaaS, too expensive for Lackey, but validates the clinical protocol approach for grant narratives.

### Sesame Care
Direct-pay marketplace, telehealth from $37, transparent pricing. Good fallback for patients outside Lackey eligibility.

### Infermedica / Symptomate
AI symptom checker, 1500+ symptoms, 800+ conditions, 17 languages. Could power clinical assessment if Lackey needs more accuracy. High integration effort.

## What the Best Tools Do That Lackey Doesn't (Yet)

1. Meet patients where they are (SMS, phone, kiosks)
2. Close the loop (track referral outcomes)
3. Address the full person (social determinants)
4. Make cost transparent (actual dollar amounts)
5. Prove impact with data (downstream outcomes, not just session counts)

## Grant Metrics Funders Expect

- Reach: unique users, language, device, geography
- Triage accuracy: completion rate, urgency distribution, emergency triggers
- Conversion: did referrals lead to actual care visits (BIGGEST GAP)
- Health equity: demographic distribution, language utilization
- Cost avoidance: ER visits prevented x avg cost difference
- Clinical quality: alignment with evidence-based protocols

## Sources

- findhelp.org, 211virginia.org, needymeds.org, goodrx.com
- caremessage.org, clearstep.health, sesamecare.com
- infermedica.com, symptomate.com, uniteus.com
- solvhealth.com, pearsuite.com
- EVMS HOPES: evms.edu/education/resources/community-engaged_learning/hopes/
- HRSA UDS: data.hrsa.gov/topics/healthcenters/uds/overview
- CDC Health Literacy: cdc.gov/health-literacy/php/develop-materials/guidance-standards.html
- AHRQ Toolkit: digital.ahrq.gov/sites/default/files/docs/page/literacy_guide.html
