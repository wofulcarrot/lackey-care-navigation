/**
 * Backfill Spanish translations for existing triage questions.
 * Run this on a DB that was seeded before Spanish translations were added
 * to question-sets.ts. Safe to run multiple times — it only updates
 * the ES locale of existing records.
 *
 * Usage:
 *   PAYLOAD_SECRET=... DATABASE_URI=... npx tsx src/seed/backfill-spanish.ts
 */

import { getPayload } from 'payload'
import config from '@payload-config'

interface SpanishAnswer {
  englishLabel: string // Match source English answer by this label
  label: string // Spanish translation
  // Note: urgencyWeight, escalateImmediately, nextQuestion, redirectToCareType
  // are PRESERVED from the English answer — Spanish updates do NOT change these.
}

interface SpanishQuestion {
  englishText: string // used to find the question in DB
  text: string
  helpText?: string
  answers: SpanishAnswer[]
}

const translations: SpanishQuestion[] = [
  // === MEDICAL ===
  {
    englishText: 'How would you prefer to receive care?',
    text: '¿Cómo prefiere recibir atención médica?',
    helpText: 'Esto nos ayuda a encontrar la mejor opción para usted.',
    answers: [
      { englishLabel: 'Virtual visit (phone or video)', label: 'Visita virtual (teléfono o video)' },
      { englishLabel: 'In-person visit', label: 'Visita en persona' },
      { englishLabel: 'No preference', label: 'Sin preferencia' },
    ],
  },
  {
    englishText: 'How would you describe your pain level?',
    text: '¿Cómo describiría su nivel de dolor?',
    helpText: 'Piense en cómo el dolor afecta sus actividades diarias.',
    answers: [
      { englishLabel: 'Severe — I can\'t function', label: 'Severo — no puedo funcionar' },
      { englishLabel: 'Moderate — It\'s hard to focus', label: 'Moderado — me cuesta concentrarme' },
      { englishLabel: 'Mild — It\'s uncomfortable but manageable', label: 'Leve — es incómodo pero manejable' },
      { englishLabel: 'No pain', label: 'Sin dolor' },
    ],
  },
  {
    englishText: 'How long have you had these symptoms?',
    text: '¿Cuánto tiempo ha tenido estos síntomas?',
    answers: [
      { englishLabel: 'Just started today', label: 'Comenzó hoy' },
      { englishLabel: 'A few days', label: 'Unos días' },
      { englishLabel: 'About a week', label: 'Aproximadamente una semana' },
      { englishLabel: 'More than a week', label: 'Más de una semana' },
    ],
  },
  {
    englishText: 'Do you have a fever (temperature above 100.4°F)?',
    text: '¿Tiene fiebre (temperatura superior a 100.4°F)?',
    answers: [
      { englishLabel: 'Yes', label: 'Sí' },
      { englishLabel: 'No', label: 'No' },
      { englishLabel: 'I\'m not sure', label: 'No estoy seguro/a' },
    ],
  },
  // === DENTAL ===
  {
    englishText: 'Do you have swelling in your face, jaw, or gums?',
    text: '¿Tiene hinchazón en la cara, mandíbula o encías?',
    answers: [
      { englishLabel: 'Yes, significant swelling', label: 'Sí, hinchazón significativa' },
      { englishLabel: 'Slight swelling', label: 'Hinchazón leve' },
      { englishLabel: 'No swelling', label: 'Sin hinchazón' },
    ],
  },
  {
    englishText: 'How bad is your dental pain?',
    text: '¿Qué tan fuerte es su dolor dental?',
    answers: [
      { englishLabel: 'Severe — I can\'t eat or sleep', label: 'Severo — no puedo comer ni dormir' },
      { englishLabel: 'Moderate — It hurts but I can manage', label: 'Moderado — duele pero puedo manejarlo' },
      { englishLabel: 'Mild or no pain', label: 'Leve o sin dolor' },
    ],
  },
  // === BEHAVIORAL HEALTH ===
  {
    englishText: 'Are you having thoughts of hurting yourself or others?',
    text: '¿Tiene pensamientos de hacerse daño a sí mismo/a o a otros?',
    helpText: 'Su seguridad es nuestra prioridad. Por favor responda con honestidad — queremos ayudarle.',
    answers: [
      { englishLabel: 'Yes', label: 'Sí' },
      { englishLabel: 'No', label: 'No' },
    ],
  },
  {
    englishText: 'How are these feelings affecting your daily life?',
    text: '¿Cómo están afectando estos sentimientos su vida diaria?',
    helpText: 'Piense en el trabajo, el sueño, la alimentación y las relaciones.',
    answers: [
      { englishLabel: 'I can\'t function at all', label: 'No puedo funcionar en absoluto' },
      { englishLabel: 'It\'s hard to get through the day', label: 'Me cuesta pasar el día' },
      { englishLabel: 'I\'m managing but struggling', label: 'Me las arreglo pero con dificultad' },
      { englishLabel: 'Mild impact', label: 'Impacto leve' },
    ],
  },
  {
    englishText: 'How long have you been feeling this way?',
    text: '¿Cuánto tiempo se ha sentido así?',
    answers: [
      { englishLabel: 'Less than a week', label: 'Menos de una semana' },
      { englishLabel: 'A few weeks', label: 'Unas semanas' },
      { englishLabel: 'A month or more', label: 'Un mes o más' },
      { englishLabel: 'On and off for a long time', label: 'De forma intermitente por mucho tiempo' },
    ],
  },
  // === VISION ===
  {
    englishText: 'Did you have a sudden change in vision or an eye injury?',
    text: '¿Tuvo un cambio repentino en la visión o una lesión en el ojo?',
    helpText: 'Los cambios repentinos pueden incluir destellos de luz, pérdida de visión o ver manchas.',
    answers: [
      { englishLabel: 'Yes, sudden vision loss', label: 'Sí, pérdida repentina de visión' },
      { englishLabel: 'Yes, eye injury', label: 'Sí, lesión en el ojo' },
      { englishLabel: 'No, it\'s been gradual', label: 'No, ha sido gradual' },
    ],
  },
  {
    englishText: 'Are you experiencing eye pain?',
    text: '¿Tiene dolor en los ojos?',
    answers: [
      { englishLabel: 'Severe pain', label: 'Dolor severo' },
      { englishLabel: 'Moderate pain', label: 'Dolor moderado' },
      { englishLabel: 'Mild or no pain', label: 'Leve o sin dolor' },
    ],
  },
  {
    englishText: 'How long have you had this issue?',
    text: '¿Cuánto tiempo ha tenido este problema?',
    answers: [
      { englishLabel: 'Just started today', label: 'Comenzó hoy' },
      { englishLabel: 'A few days', label: 'Unos días' },
      { englishLabel: 'A week or more', label: 'Una semana o más' },
    ],
  },
  // === MEDICATION ===
  {
    englishText: 'Are you having a bad reaction to a medication?',
    text: '¿Está teniendo una mala reacción a un medicamento?',
    helpText: 'Los signos de una reacción grave incluyen dificultad para respirar, hinchazón o sarpullido.',
    answers: [
      { englishLabel: 'Yes, difficulty breathing or swelling', label: 'Sí, dificultad para respirar o hinchazón' },
      { englishLabel: 'Yes, other reaction', label: 'Sí, otra reacción' },
      { englishLabel: 'No', label: 'No' },
    ],
  },
  {
    englishText: 'What kind of medication help do you need?',
    text: '¿Qué tipo de ayuda con medicamentos necesita?',
    answers: [
      { englishLabel: 'Ran out of a critical medication (insulin, blood pressure, seizure)', label: 'Se me acabó un medicamento crítico (insulina, presión arterial, convulsiones)' },
      { englishLabel: 'Need a refill on a regular medication', label: 'Necesito un resurtido de un medicamento regular' },
      { englishLabel: 'Can\'t afford my medication', label: 'No puedo pagar mi medicamento' },
      { englishLabel: 'Want to discuss side effects', label: 'Quiero hablar sobre efectos secundarios' },
    ],
  },
  {
    englishText: 'How urgent is your medication need?',
    text: '¿Qué tan urgente es su necesidad de medicamento?',
    answers: [
      { englishLabel: 'I\'m completely out now', label: 'Se me acabó por completo' },
      { englishLabel: 'I\'ll run out in a day or two', label: 'Se me acabará en uno o dos días' },
      { englishLabel: 'I have some time but need help soon', label: 'Tengo algo de tiempo pero necesito ayuda pronto' },
    ],
  },
  // === CHRONIC CARE ===
  {
    englishText: 'Are you experiencing a sudden worsening of your condition?',
    text: '¿Está experimentando un empeoramiento repentino de su condición?',
    helpText: 'Por ejemplo, azúcar en la sangre que no baja, opresión en el pecho o dificultad respiratoria severa.',
    answers: [
      { englishLabel: 'Yes, much worse suddenly', label: 'Sí, mucho peor de repente' },
      { englishLabel: 'Somewhat worse lately', label: 'Algo peor últimamente' },
      { englishLabel: 'About the same', label: 'Más o menos igual' },
    ],
  },
  {
    englishText: 'What condition do you need help managing?',
    text: '¿Qué condición necesita ayuda para manejar?',
    answers: [
      { englishLabel: 'Diabetes', label: 'Diabetes' },
      { englishLabel: 'High blood pressure', label: 'Presión arterial alta' },
      { englishLabel: 'Asthma or breathing condition', label: 'Asma o condición respiratoria' },
      { englishLabel: 'Other ongoing condition', label: 'Otra condición crónica' },
    ],
  },
  {
    englishText: 'When did you last see a doctor for this condition?',
    text: '¿Cuándo fue la última vez que vio a un médico por esta condición?',
    answers: [
      { englishLabel: 'I\'ve never seen a doctor for this', label: 'Nunca he visto a un médico por esto' },
      { englishLabel: 'More than a year ago', label: 'Hace más de un año' },
      { englishLabel: '6 months to a year', label: 'De 6 meses a un año' },
      { englishLabel: 'Within the last 6 months', label: 'En los últimos 6 meses' },
    ],
  },
  // === NOT SURE (META) ===
  {
    englishText: 'Which best describes what\'s going on?',
    text: '¿Qué describe mejor lo que le pasa?',
    helpText: 'Elija la opción más cercana. Le ayudaremos a encontrar la atención adecuada.',
    answers: [
      { englishLabel: 'I feel sick or have a health concern', label: 'Me siento enfermo/a o tengo una preocupación de salud' },
      { englishLabel: 'I have a tooth or mouth problem', label: 'Tengo un problema dental o de la boca' },
      { englishLabel: 'I have an eye or vision problem', label: 'Tengo un problema de los ojos o la visión' },
      { englishLabel: 'I\'m feeling anxious, depressed, or need mental health support', label: 'Me siento ansioso/a, deprimido/a o necesito apoyo de salud mental' },
      { englishLabel: 'I need help with my medications', label: 'Necesito ayuda con mis medicamentos' },
      { englishLabel: 'I have an ongoing condition (diabetes, blood pressure, etc.)', label: 'Tengo una condición crónica (diabetes, presión arterial, etc.)' },
    ],
  },
]

const careTypeTranslations: Record<string, { name: string; description?: string }> = {
  'Medical': { name: 'Atención médica', description: 'Enfermedades, lesiones, dolor, o cualquier preocupación de salud general' },
  'Dental': { name: 'Dental', description: 'Dolor dental, hinchazón, o cuidado dental' },
  'Vision': { name: 'Visión', description: 'Problemas oculares, cambios en la visión, o lesiones en los ojos' },
  'Behavioral Health': { name: 'Salud mental', description: 'Ansiedad, depresión, crisis mental, o apoyo emocional' },
  'Medication': { name: 'Medicamentos', description: 'Resurtidos, efectos secundarios, o reacciones a medicamentos' },
  'Chronic Care': { name: 'Condición crónica', description: 'Diabetes, presión arterial alta, asma, o condición continua' },
  'Not Sure': { name: 'No estoy seguro/a', description: 'Le ayudaremos a encontrar la atención adecuada' },
}

const emergencySymptomTranslations: Record<string, string> = {
  'Chest pain or pressure': 'Dolor o presión en el pecho',
  'Trouble breathing or shortness of breath': 'Dificultad para respirar o falta de aire',
  'Signs of stroke (face drooping, arm weakness, speech difficulty)': 'Signos de derrame cerebral (caída facial, debilidad en el brazo, dificultad para hablar)',
  'Severe or uncontrolled bleeding': 'Sangrado severo o incontrolable',
  'Seizure': 'Convulsión',
  'Severe pain that is getting worse': 'Dolor severo que empeora',
  'Loss of consciousness or fainting': 'Pérdida del conocimiento o desmayo',
  'Severe allergic reaction (swelling of face/throat, can\'t breathe)': 'Reacción alérgica severa (hinchazón de cara/garganta, no puede respirar)',
  'Overdose or poisoning': 'Sobredosis o envenenamiento',
}

const urgencyLevelTranslations: Record<string, { name: string; timeToCare?: string; description?: string }> = {
  'Life-Threatening': { name: 'Amenaza vital', timeToCare: 'Inmediato', description: 'Emergencia — llame al 911 ahora' },
  'Emergent': { name: 'Emergente', timeToCare: 'En 1 hora', description: 'Necesita atención de emergencia' },
  'Urgent': { name: 'Urgente', timeToCare: 'El mismo día', description: 'Necesita atención urgente hoy' },
  'Semi-Urgent': { name: 'Semi-urgente', timeToCare: '1-3 días', description: 'Debería ser evaluado pronto' },
  'Routine': { name: 'Rutinario', timeToCare: '1-2 semanas', description: 'Programe una cita pronto' },
  'Elective': { name: 'Electivo', timeToCare: 'Según disponibilidad', description: 'Programe cuando le convenga' },
}

const routingActionTranslations: Record<string, string> = {
  'Call 911 or go to the nearest ER': 'Llame al 911 o vaya a la sala de emergencias más cercana',
  'Go to the nearest emergency room': 'Vaya a la sala de emergencias más cercana',
  'Visit urgent care or start a free virtual visit': 'Visite atención de urgencias o inicie una visita virtual gratuita',
  'Start a free virtual visit or schedule an appointment': 'Inicie una visita virtual gratuita o programe una cita',
  'Schedule an appointment at Lackey Clinic': 'Programe una cita en Lackey Clinic',
  'Schedule at your convenience': 'Programe cuando le convenga',
  'Go to the ER for severe dental emergency': 'Vaya a la sala de emergencias por una emergencia dental severa',
  'Go to the ER for dental emergency': 'Vaya a la sala de emergencias por una emergencia dental',
  'Call Lackey Clinic for an urgent dental appointment': 'Llame a Lackey Clinic para una cita dental urgente',
  'Schedule a dental appointment at Lackey Clinic': 'Programe una cita dental en Lackey Clinic',
  'Schedule a dental checkup at Lackey Clinic': 'Programe una revisión dental en Lackey Clinic',
  'Schedule dental care at your convenience': 'Programe atención dental cuando le convenga',
  'Call the crisis line at (757) 664-6000 or call 911': 'Llame a la línea de crisis al (757) 664-6000 o al 911',
  'Call the Norfolk CSB Crisis Line: (757) 664-6000': 'Llame a la línea de crisis de Norfolk CSB: (757) 664-6000',
  'Call the crisis line or start a free virtual visit': 'Llame a la línea de crisis o inicie una visita virtual gratuita',
  'Start a free virtual visit or contact Norfolk CSB': 'Inicie una visita virtual gratuita o contacte a Norfolk CSB',
  'Schedule an appointment at Lackey Clinic or Norfolk CSB': 'Programe una cita en Lackey Clinic o Norfolk CSB',
  'Start a free virtual visit for medication concerns': 'Inicie una visita virtual gratuita para problemas de medicamentos',
  'Schedule an appointment at Lackey Clinic for a refill': 'Programe una cita en Lackey Clinic para un resurtido',
}

async function main() {
  const payload = await getPayload({ config })
  console.log('Loading care types for redirect lookups...')
  const careTypesResult = await payload.find({ collection: 'care-types', limit: 100, locale: 'en' })
  const careTypeByName = new Map<string, number | string>()
  for (const ct of careTypesResult.docs) {
    const name = typeof ct.name === 'string' ? ct.name : ''
    if (name) careTypeByName.set(name, ct.id)
  }

  // === CARE TYPES ===
  console.log('\nBackfilling care types...')
  let careTypeCount = 0
  for (const ct of careTypesResult.docs) {
    const enName = typeof ct.name === 'string' ? ct.name : ''
    const tr = careTypeTranslations[enName]
    if (!tr) continue
    try {
      await payload.update({
        collection: 'care-types',
        id: ct.id,
        locale: 'es',
        data: { name: tr.name, description: tr.description },
      })
      careTypeCount++
      console.log(`  ✓ ${enName} → ${tr.name}`)
    } catch (err) {
      console.error(`  ✗ ${enName}:`, (err as Error).message)
    }
  }

  // === EMERGENCY SYMPTOMS ===
  console.log('\nBackfilling emergency symptoms...')
  const symptoms = await payload.find({ collection: 'emergency-symptoms', limit: 100, locale: 'en' })
  let symptomCount = 0
  for (const s of symptoms.docs) {
    const enText = typeof s.symptom === 'string' ? s.symptom : ''
    const esText = emergencySymptomTranslations[enText]
    if (!esText) continue
    try {
      await payload.update({
        collection: 'emergency-symptoms',
        id: s.id,
        locale: 'es',
        data: { symptom: esText },
      })
      symptomCount++
    } catch (err) {
      console.error(`  ✗ ${enText}:`, (err as Error).message)
    }
  }
  console.log(`  ✓ ${symptomCount} emergency symptoms translated`)

  // === URGENCY LEVELS ===
  console.log('\nBackfilling urgency levels...')
  const levels = await payload.find({ collection: 'urgency-levels', limit: 100, locale: 'en' })
  let levelCount = 0
  for (const lv of levels.docs) {
    const enName = typeof lv.name === 'string' ? lv.name : ''
    const tr = urgencyLevelTranslations[enName]
    if (!tr) continue
    try {
      // Only `name` and `description` are localized on UrgencyLevels.
      // `timeToCare` is NOT localized (writing it with locale: 'es' would
      // silently overwrite the English value, since Payload stores non-
      // localized fields once). For now, keep timeToCare English-only;
      // flip the collection to localize it later via a proper migration.
      await payload.update({
        collection: 'urgency-levels',
        id: lv.id,
        locale: 'es',
        data: { name: tr.name, description: tr.description },
      })
      levelCount++
    } catch (err) {
      console.error(`  ✗ ${enName}:`, (err as Error).message)
    }
  }
  console.log(`  ✓ ${levelCount} urgency levels translated`)

  // === ROUTING RULES (action text) ===
  console.log('\nBackfilling routing rule action text...')
  const rules = await payload.find({ collection: 'routing-rules', limit: 200, locale: 'en' })
  let ruleCount = 0
  for (const rule of rules.docs) {
    const enAction = typeof rule.actionText === 'string' ? rule.actionText : ''
    const esAction = routingActionTranslations[enAction]
    if (!esAction) continue
    try {
      await payload.update({
        collection: 'routing-rules',
        id: rule.id,
        locale: 'es',
        data: { actionText: esAction },
      })
      ruleCount++
    } catch (err) {
      console.error(`  ✗ rule ${rule.id}:`, (err as Error).message)
    }
  }
  console.log(`  ✓ ${ruleCount} routing rule actions translated`)

  // === STATIC CONTENT (global) ===
  // The virtualCareBullets and disclaimers arrays need IDs preserved so
  // Payload treats them as updates (not recreates) in each locale. Fetch
  // the English array first, then write the Spanish payload mapped 1:1
  // by array index with the same IDs.
  console.log('\nBackfilling static content (global) Spanish...')
  try {
    const enGlobal = await payload.findGlobal({ slug: 'static-content', locale: 'en' }) as Record<string, unknown>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enBullets: any[] = Array.isArray(enGlobal.virtualCareBullets) ? enGlobal.virtualCareBullets as any[] : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enDisclaimers: any[] = Array.isArray(enGlobal.disclaimers) ? enGlobal.disclaimers as any[] : []

    const esBulletTexts = [
      'Gratis para adultos mayores de 18 años',
      'Disponible 24/7',
      'No se necesita seguro médico',
      '95% resuelto completamente en línea',
      'Privado y seguro',
    ]

    const esDisclaimerTexts = [
      'Esto no reemplaza los servicios de emergencia. Si está experimentando una emergencia médica, llame al 911.',
      'Esta herramienta no determina la elegibilidad o inscripción al seguro.',
      'La disponibilidad de citas no está garantizada y depende de la capacidad del proveedor.',
      'Este servicio no está destinado para crisis de enfermedad mental grave. Llame a la línea de crisis al (757) 664-6000.',
      'No se recetarán sustancias controladas a través de las visitas de atención virtual.',
    ]

    await payload.updateGlobal({
      slug: 'static-content',
      locale: 'es',
      data: {
        heroTitle: 'Obtenga la atención adecuada ahora mismo',
        heroSubtitle: 'Ayuda gratuita para encontrar la atención que necesita — sin seguro médico requerido',
        virtualCareHeading: 'Es posible que pueda recibir atención gratuita ahora mismo',
        virtualCareBullets: enBullets.map((b, i) => ({
          id: b.id,
          text: esBulletTexts[i] ?? b.text,
        })),
        disclaimers: enDisclaimers.map((d, i) => ({
          id: d.id,
          text: esDisclaimerTexts[i] ?? d.text,
        })),
        privacyNote: 'No recopilamos información personal.',
        footerText: 'Desarrollado por Lackey Clinic',
      },
    })
    console.log('  ✓ Static content Spanish localized (hero, bullets, disclaimers, footer)')
  } catch (err) {
    console.error('  ✗ Static content update failed:', (err as Error).message)
  }

  console.log('Loading existing questions...')
  const questionsResult = await payload.find({ collection: 'questions', limit: 200, locale: 'en' })
  const questionByText = new Map<string, { id: number | string }>()
  for (const q of questionsResult.docs) {
    const text = typeof q.text === 'string' ? q.text : ''
    if (text) questionByText.set(text, { id: q.id })
  }

  let updated = 0
  let skipped = 0
  for (const t of translations) {
    const existing = questionByText.get(t.englishText)
    if (!existing) {
      console.warn(`  ⚠ Skipping — question not found: "${t.englishText}"`)
      skipped++
      continue
    }

    // Load the full English question (with its answers) from the result set.
    const enQ = questionsResult.docs.find((q) => q.id === existing.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enAnswers: any[] = Array.isArray(enQ?.answers) ? (enQ!.answers as any[]) : []

    // Safety check 1: detect duplicate englishLabel within this translation.
    const seenLabels = new Set<string>()
    let duplicate: string | null = null
    for (const ans of t.answers) {
      if (seenLabels.has(ans.englishLabel)) {
        duplicate = ans.englishLabel
        break
      }
      seenLabels.add(ans.englishLabel)
    }
    if (duplicate) {
      console.warn(`  ⚠ Skipping "${t.englishText}" — duplicate englishLabel in translation: "${duplicate}"`)
      skipped++
      continue
    }

    // Safety check 2: every Spanish answer must find a matching English answer by label.
    // Match by label text, NOT by array index — the whole point of this refactor.
    const unmatchedSpanish: string[] = []
    const matches: { spanish: SpanishAnswer; english: Record<string, unknown>; index: number }[] = []
    for (const ans of t.answers) {
      const idx = enAnswers.findIndex(
        (en) => typeof en?.label === 'string' && en.label === ans.englishLabel,
      )
      if (idx < 0) {
        unmatchedSpanish.push(ans.englishLabel)
        continue
      }
      matches.push({ spanish: ans, english: enAnswers[idx] as Record<string, unknown>, index: idx })
    }
    if (unmatchedSpanish.length > 0) {
      console.warn(
        `  ⚠ Skipping "${t.englishText}" — Spanish answers with no English match: ${unmatchedSpanish
          .map((l) => `"${l}"`)
          .join(', ')}`,
      )
      skipped++
      continue
    }

    // Warn (but don't skip) if there are English answers not covered by any Spanish translation.
    // Partial translation isn't a data-corruption risk — the missing answers will just stay in English.
    const matchedEnLabels = new Set(matches.map((m) => m.english.label as string))
    const unmatchedEnglish = enAnswers
      .map((en) => (typeof en?.label === 'string' ? en.label : null))
      .filter((l): l is string => !!l && !matchedEnLabels.has(l))
    if (unmatchedEnglish.length > 0) {
      console.warn(
        `  ⚠ Partial translation for "${t.englishText}" — English answers with no Spanish match: ${unmatchedEnglish
          .map((l) => `"${l}"`)
          .join(', ')}`,
      )
    }

    // Build the Spanish answers array preserving the English order.
    // For each English answer: if a Spanish translation matched it, use the Spanish label;
    // otherwise keep the English label as-is. Always preserve urgencyWeight, escalateImmediately,
    // nextQuestion, and redirectToCareType from the English record — Spanish updates never change
    // routing or scoring.
    const matchByEnIndex = new Map(matches.map((m) => [m.index, m.spanish]))
    const spanishAnswers = enAnswers.map((en, i) => {
      const match = matchByEnIndex.get(i)
      return {
        id: en?.id ?? undefined,
        label: match ? match.label : (en?.label as string),
        urgencyWeight: en?.urgencyWeight ?? 0,
        escalateImmediately: en?.escalateImmediately ?? false,
        // Preserve nextQuestion and redirectToCareType relationship IDs from English record
        nextQuestion: en?.nextQuestion ?? null,
        redirectToCareType: en?.redirectToCareType ?? null,
      }
    })

    try {
      await payload.update({
        collection: 'questions',
        id: existing.id,
        locale: 'es',
        data: {
          text: t.text,
          helpText: t.helpText,
          answers: spanishAnswers,
        },
      })
      updated++
      console.log(`  ✓ ${t.englishText}`)
    } catch (err) {
      console.error(`  ✗ Failed to update "${t.englishText}":`, (err as Error).message)
      skipped++
    }
  }

  console.log(`\nDone. Updated ${updated} questions, skipped ${skipped}.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
