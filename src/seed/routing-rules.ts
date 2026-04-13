import type { Payload } from 'payload'

export async function createRoutingRules(
  payload: Payload,
  careTypes: Record<string, number | string>,
  levels: Record<string, number | string>,
  resources: Record<string, number | string>,
) {
  const rules = [
    // Medical + Life-Threatening/Emergent → ER
    { careType: 'Medical', urgency: 'Life-Threatening', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Call 911 or go to the nearest ER' },
    { careType: 'Medical', urgency: 'Emergent', resources: ['Sentara Norfolk General Hospital', 'Sentara Leigh Hospital'], vcEligible: false, action: 'Go to the nearest emergency room' },
    // Medical + Urgent → Urgent Care + Virtual Care
    { careType: 'Medical', urgency: 'Urgent', resources: ['Sentara Urgent Care - Wards Corner', 'Lackey Virtual Care'], vcEligible: true, action: 'Visit urgent care or start a free virtual visit' },
    // Medical + Semi-Urgent → Virtual Care + Lackey Clinic
    { careType: 'Medical', urgency: 'Semi-Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit or schedule an appointment' },
    // Medical + Routine/Elective → Lackey Clinic + Virtual Care
    { careType: 'Medical', urgency: 'Routine', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule an appointment at Lackey Clinic' },
    { careType: 'Medical', urgency: 'Elective', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule at your convenience' },

    // Dental routing (simplified — all to Lackey Clinic)
    { careType: 'Dental', urgency: 'Life-Threatening', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Go to the ER for severe dental emergency' },
    { careType: 'Dental', urgency: 'Emergent', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Go to the ER for dental emergency' },
    { careType: 'Dental', urgency: 'Urgent', resources: ['Lackey Clinic'], vcEligible: false, action: 'Call Lackey Clinic for an urgent dental appointment' },
    { careType: 'Dental', urgency: 'Semi-Urgent', resources: ['Lackey Clinic'], vcEligible: false, action: 'Schedule a dental appointment at Lackey Clinic' },
    { careType: 'Dental', urgency: 'Routine', resources: ['Lackey Clinic'], vcEligible: false, action: 'Schedule a dental checkup at Lackey Clinic' },
    { careType: 'Dental', urgency: 'Elective', resources: ['Lackey Clinic'], vcEligible: false, action: 'Schedule dental care at your convenience' },

    // Behavioral Health
    { careType: 'Behavioral Health', urgency: 'Life-Threatening', resources: ['Norfolk Community Services Board - Crisis Line', 'Sentara Norfolk General Hospital'], vcEligible: false, action: 'Call the crisis line at (757) 664-6000 or call 911' },
    { careType: 'Behavioral Health', urgency: 'Emergent', resources: ['Norfolk Community Services Board - Crisis Line'], vcEligible: false, action: 'Call the Norfolk CSB Crisis Line: (757) 664-6000' },
    { careType: 'Behavioral Health', urgency: 'Urgent', resources: ['Norfolk Community Services Board - Crisis Line', 'Lackey Virtual Care'], vcEligible: true, action: 'Call the crisis line or start a free virtual visit' },
    { careType: 'Behavioral Health', urgency: 'Semi-Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit' },
    { careType: 'Behavioral Health', urgency: 'Routine', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule an appointment at Lackey Clinic' },
    { careType: 'Behavioral Health', urgency: 'Elective', resources: ['Lackey Clinic'], vcEligible: true, action: 'Schedule at your convenience' },
  ]

  for (const rule of rules) {
    if (!careTypes[rule.careType] || !levels[rule.urgency]) {
      console.warn(`  ⚠ Skipping routing rule: missing careType="${rule.careType}" or urgency="${rule.urgency}"`)
      continue
    }
    const resolvedResources = rule.resources.map((name) => resources[name])
    const missing = rule.resources.filter((name) => !resources[name])
    if (missing.length) {
      console.warn(`  ⚠ Missing resource(s) for ${rule.careType}/${rule.urgency}: ${missing.join(', ')}`)
    }
    await payload.create({
      collection: 'routing-rules',
      data: {
        careType: careTypes[rule.careType],
        urgencyLevel: levels[rule.urgency],
        resources: resolvedResources.filter(Boolean),
        virtualCareEligible: rule.vcEligible,
        actionText: rule.action,
      },
    })
  }
}
