import type { Payload } from 'payload'

export async function createRoutingRules(
  payload: Payload,
  careTypes: Record<string, number | string>,
  levels: Record<string, number | string>,
  resources: Record<string, number | string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) { const ct = careTypes as Record<string, any>, lv = levels as Record<string, any>, rs = resources as Record<string, any>
  const rules = [
    // Medical + Life-Threatening/Emergent → ER
    { careType: 'Medical', urgency: 'Life-Threatening', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Call 911 or go to the nearest ER' },
    { careType: 'Medical', urgency: 'Emergent', resources: ['Sentara Norfolk General Hospital', 'Sentara Leigh Hospital'], vcEligible: false, action: 'Go to the nearest emergency room' },
    // Medical + Urgent → Urgent Care + Virtual Care
    { careType: 'Medical', urgency: 'Urgent', resources: ['Sentara Urgent Care - Wards Corner', 'AFC Urgent Care Norfolk', 'Velocity Urgent Care - Little Creek', 'Velocity Urgent Care - Chimney Hill', 'Velocity Urgent Care - Town Center', 'Patient First - Newtown Road', 'Patient First - General Booth', 'Patient First - Cedar Road', 'Lackey Virtual Care'], vcEligible: true, action: 'Visit urgent care or start a free virtual visit' },
    // Medical + Semi-Urgent → Virtual Care + Lackey Clinic + nearby urgent care
    { careType: 'Medical', urgency: 'Semi-Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic', 'AFC Urgent Care Norfolk', 'Velocity Urgent Care - Little Creek', 'Velocity Urgent Care - Chimney Hill', 'Velocity Urgent Care - Town Center', 'Patient First - Newtown Road', 'Patient First - General Booth', 'Patient First - Cedar Road'], vcEligible: true, action: 'Start a free virtual visit or schedule an appointment' },
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
    { careType: 'Behavioral Health', urgency: 'Urgent', resources: ['Norfolk Community Services Board - Crisis Line', 'Norfolk Community Services Board', 'Lackey Virtual Care'], vcEligible: true, action: 'Call the crisis line or start a free virtual visit' },
    { careType: 'Behavioral Health', urgency: 'Semi-Urgent', resources: ['Norfolk Community Services Board', 'Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit or contact Norfolk CSB' },
    { careType: 'Behavioral Health', urgency: 'Routine', resources: ['Norfolk Community Services Board', 'Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule an appointment at Lackey Clinic or Norfolk CSB' },
    { careType: 'Behavioral Health', urgency: 'Elective', resources: ['Lackey Clinic', 'Norfolk Community Services Board'], vcEligible: true, action: 'Schedule at your convenience' },

    // Vision
    { careType: 'Vision', urgency: 'Life-Threatening', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Call 911 or go to the nearest ER' },
    { careType: 'Vision', urgency: 'Emergent', resources: ['Sentara Norfolk General Hospital', 'Sentara Leigh Hospital'], vcEligible: false, action: 'Go to the nearest emergency room' },
    { careType: 'Vision', urgency: 'Urgent', resources: ['Sentara Urgent Care - Wards Corner', 'Lackey Virtual Care'], vcEligible: true, action: 'Visit urgent care or start a free virtual visit' },
    { careType: 'Vision', urgency: 'Semi-Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit or schedule an appointment' },
    { careType: 'Vision', urgency: 'Routine', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule an appointment at Lackey Clinic' },
    { careType: 'Vision', urgency: 'Elective', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule at your convenience' },

    // Medication
    { careType: 'Medication', urgency: 'Life-Threatening', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Call 911 or go to the nearest ER' },
    { careType: 'Medication', urgency: 'Emergent', resources: ['Sentara Norfolk General Hospital', 'Sentara Leigh Hospital'], vcEligible: false, action: 'Go to the nearest emergency room' },
    { careType: 'Medication', urgency: 'Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit for medication concerns' },
    { careType: 'Medication', urgency: 'Semi-Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit or schedule an appointment' },
    { careType: 'Medication', urgency: 'Routine', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule an appointment at Lackey Clinic for a refill' },
    { careType: 'Medication', urgency: 'Elective', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule at your convenience' },

    // Chronic Care
    { careType: 'Chronic Care', urgency: 'Life-Threatening', resources: ['Sentara Norfolk General Hospital'], vcEligible: false, action: 'Call 911 or go to the nearest ER' },
    { careType: 'Chronic Care', urgency: 'Emergent', resources: ['Sentara Norfolk General Hospital', 'Sentara Leigh Hospital'], vcEligible: false, action: 'Go to the nearest emergency room' },
    { careType: 'Chronic Care', urgency: 'Urgent', resources: ['Sentara Urgent Care - Wards Corner', 'Lackey Virtual Care'], vcEligible: true, action: 'Visit urgent care or start a free virtual visit' },
    { careType: 'Chronic Care', urgency: 'Semi-Urgent', resources: ['Lackey Virtual Care', 'Lackey Clinic'], vcEligible: true, action: 'Start a free virtual visit or schedule an appointment' },
    { careType: 'Chronic Care', urgency: 'Routine', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule an appointment at Lackey Clinic' },
    { careType: 'Chronic Care', urgency: 'Elective', resources: ['Lackey Clinic', 'Lackey Virtual Care'], vcEligible: true, action: 'Schedule at your convenience' },
  ]

  for (const rule of rules) {
    if (!ct[rule.careType] || !lv[rule.urgency]) {
      console.warn(`  ⚠ Skipping routing rule: missing careType="${rule.careType}" or urgency="${rule.urgency}"`)
      continue
    }
    const resolvedResources = rule.resources.map((name) => rs[name])
    const missing = rule.resources.filter((name) => !rs[name])
    if (missing.length) {
      console.warn(`  ⚠ Missing resource(s) for ${rule.careType}/${rule.urgency}: ${missing.join(', ')}`)
    }
    await payload.create({
      collection: 'routing-rules',
      data: {
        careType: ct[rule.careType],
        urgencyLevel: lv[rule.urgency],
        resources: resolvedResources.filter(Boolean),
        virtualCareEligible: rule.vcEligible,
        actionText: rule.action,
      },
    })
  }
}
