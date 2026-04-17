/**
 * Fix English answer labels that were incorrectly populated with Spanish text.
 *
 * Maps each question (by English text) to its correct English answer labels
 * from the original seed data, then force-writes them with locale='en'.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

// Correct English labels keyed by question text
const EN_ANSWERS: Record<string, string[]> = {
  'How would you prefer to receive care?': [
    'Virtual visit (phone or video)', 'In-person visit', 'No preference',
  ],
  'How would you describe your pain level?': [
    "Severe — I can't function", "Moderate — It's hard to focus",
    "Mild — It's uncomfortable but manageable", 'No pain',
  ],
  'How long have you had these symptoms?': [
    'Just started today', 'A few days', 'About a week', 'More than a week',
  ],
  'Do you have a fever (temperature above 100.4°F)?': [
    'Yes', 'No', "I'm not sure",
  ],
  'Do you have swelling in your face, jaw, or gums?': [
    'Yes, significant swelling', 'Slight swelling', 'No swelling',
  ],
  'How bad is your dental pain?': [
    "Severe — I can't eat or sleep", "Moderate — It hurts but I can manage",
    'Mild or no pain',
  ],
  'Are you having thoughts of hurting yourself or others?': ['Yes', 'No'],
  'How are these feelings affecting your daily life?': [
    "I can't function at all", "It's hard to get through the day",
    "I'm managing but struggling", 'Mild impact',
  ],
  'How long have you been feeling this way?': [
    'Less than a week', 'A few weeks', 'A month or more',
    'On and off for a long time',
  ],
  'Did you have a sudden change in vision or an eye injury?': [
    'Yes, sudden vision loss', 'Yes, eye injury', "No, it's been gradual",
  ],
  'Are you experiencing eye pain?': [
    'Severe pain', 'Moderate pain', 'Mild or no pain',
  ],
  'How long have you had this issue?': [
    'Just started today', 'A few days', 'A week or more',
  ],
  'Are you having a bad reaction to a medication?': [
    'Yes, difficulty breathing or swelling', 'Yes, other reaction', 'No',
  ],
  'What kind of medication help do you need?': [
    'Ran out of a critical medication (insulin, blood pressure, seizure)',
    'Need a refill on a regular medication',
    "Can't afford my medication", 'Want to discuss side effects',
  ],
  'How urgent is your medication need?': [
    "I'm completely out now", "I'll run out in a day or two",
    'I have some time but need help soon',
  ],
  'Are you experiencing a sudden worsening of your condition?': [
    'Yes, much worse suddenly', 'Somewhat worse lately', 'About the same',
  ],
  'What condition do you need help managing?': [
    'Diabetes', 'High blood pressure', 'Asthma or breathing condition',
    'Other ongoing condition',
  ],
  'When did you last see a doctor for this condition?': [
    "I've never seen a doctor for this", 'More than a year ago',
    '6 months to a year', 'Within the last 6 months',
  ],
  "Which best describes what's going on?": [
    'I feel sick or have a health concern',
    'I have a tooth or mouth problem',
    'I have an eye or vision problem',
    "I'm feeling anxious, depressed, or need mental health support",
    'I need help with my medications',
    'I have an ongoing condition (diabetes, blood pressure, etc.)',
  ],
}

async function main() {
  const payload = await getPayload({ config })

  // Get questions with all locales to read answer IDs
  const questions = await payload.find({
    collection: 'questions',
    limit: 200,
    locale: 'all' as any,
    depth: 0,
  })
  console.log('Found', questions.docs.length, 'questions')

  let fixed = 0
  for (const q of questions.docs) {
    const qText = typeof q.text === 'string' ? q.text : (q.text as any)?.es ?? (q.text as any)?.en ?? ''

    // Find the EN text for this question by matching against known texts
    // The question text itself might be in ES if EN wasn't written
    let enQuestionText = ''
    let enLabels: string[] = []

    for (const [knownText, labels] of Object.entries(EN_ANSWERS)) {
      if (qText === knownText || (q.text as any)?.en === knownText || (q.text as any)?.es === knownText) {
        enQuestionText = knownText
        enLabels = labels
        break
      }
    }

    // Also try matching by Spanish question text
    if (!enQuestionText) {
      // Map Spanish question texts to English
      const esMap: Record<string, string> = {
        '¿Cómo prefiere recibir atención médica?': 'How would you prefer to receive care?',
        '¿Cómo describiría su nivel de dolor?': 'How would you describe your pain level?',
        '¿Cuánto tiempo ha tenido estos síntomas?': 'How long have you had these symptoms?',
        '¿Tiene fiebre (temperatura superior a 100.4°F)?': 'Do you have a fever (temperature above 100.4°F)?',
        '¿Tiene hinchazón en la cara, mandíbula o encías?': 'Do you have swelling in your face, jaw, or gums?',
        '¿Qué tan fuerte es su dolor dental?': 'How bad is your dental pain?',
        '¿Tiene pensamientos de hacerse daño a sí mismo/a o a otros?': 'Are you having thoughts of hurting yourself or others?',
        '¿Cómo están afectando estos sentimientos su vida diaria?': 'How are these feelings affecting your daily life?',
        '¿Cuánto tiempo se ha sentido así?': 'How long have you been feeling this way?',
        '¿Tuvo un cambio repentino en la visión o una lesión en el ojo?': 'Did you have a sudden change in vision or an eye injury?',
        '¿Tiene dolor en los ojos?': 'Are you experiencing eye pain?',
        '¿Cuánto tiempo ha tenido este problema?': 'How long have you had this issue?',
        '¿Está teniendo una mala reacción a un medicamento?': 'Are you having a bad reaction to a medication?',
        '¿Qué tipo de ayuda con medicamentos necesita?': 'What kind of medication help do you need?',
        '¿Qué tan urgente es su necesidad de medicamento?': 'How urgent is your medication need?',
        '¿Está experimentando un empeoramiento repentino de su condición?': 'Are you experiencing a sudden worsening of your condition?',
        '¿Qué condición necesita ayuda para manejar?': 'What condition do you need help managing?',
        '¿Cuándo fue la última vez que vio a un médico por esta condición?': 'When did you last see a doctor for this condition?',
        '¿Qué describe mejor lo que le pasa?': "Which best describes what's going on?",
      }
      const mapped = esMap[qText]
      if (mapped && EN_ANSWERS[mapped]) {
        enQuestionText = mapped
        enLabels = EN_ANSWERS[mapped]
      }
    }

    if (!enQuestionText || enLabels.length === 0) {
      console.log('  SKIP (no match):', qText.substring(0, 50))
      continue
    }

    const answers = (q as any).answers ?? []
    if (answers.length !== enLabels.length) {
      console.log('  SKIP (count mismatch):', enQuestionText.substring(0, 50),
        `(db: ${answers.length}, expected: ${enLabels.length})`)
      continue
    }

    const answerData = answers.map((a: any, i: number) => ({
      id: a.id,
      label: enLabels[i],
      urgencyWeight: a.urgencyWeight,
      escalateImmediately: a.escalateImmediately ?? false,
      nextQuestion: a.nextQuestion?.en ?? a.nextQuestion ?? null,
      redirectToCareType: a.redirectToCareType?.en ?? a.redirectToCareType ?? null,
    }))

    try {
      await payload.update({
        collection: 'questions',
        id: q.id,
        locale: 'en',
        data: {
          text: enQuestionText,
          helpText: undefined,
          answers: answerData,
        },
      })
      fixed++
      console.log('  OK:', enQuestionText.substring(0, 50))
    } catch (err: any) {
      console.error('  ERR:', enQuestionText.substring(0, 50), err.message?.substring(0, 100))
    }
  }

  console.log(`\nDone. Fixed ${fixed} / ${questions.docs.length} questions.`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
