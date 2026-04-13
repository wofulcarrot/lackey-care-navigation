import type { Payload } from 'payload'

export async function createQuestionSets(
  payload: Payload,
  careTypes: Record<string, number | string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) { const ct = careTypes as Record<string, any>
  // === MEDICAL QUESTIONS ===
  // Care preference question — sortOrder 0, zero urgency weight (preference only)
  const medQ0 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How would you prefer to receive care?',
      helpText: 'This helps us find the best option for you.',
      type: 'single_choice',
      sortOrder: 0,
      answers: [
        { label: 'Virtual visit (phone or video)', urgencyWeight: 0, escalateImmediately: false },
        { label: 'In-person visit', urgencyWeight: 0, escalateImmediately: false },
        { label: 'No preference', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  // Create medQ3 first so medQ1 "Severe" answer can branch to it via nextQuestion
  const medQ3 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Do you have a fever (temperature above 100.4°F)?',
      type: 'yes_no',
      sortOrder: 3,
      answers: [
        { label: 'Yes', urgencyWeight: 4, escalateImmediately: false },
        { label: 'No', urgencyWeight: 0, escalateImmediately: false },
        { label: 'I\'m not sure', urgencyWeight: 2, escalateImmediately: false },
      ],
    },
  })

  const medQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How would you describe your pain level?',
      helpText: 'Think about how the pain affects your daily activities.',
      type: 'single_choice',
      sortOrder: 1,
      answers: [
        // "Severe" branches directly to fever question, skipping duration
        { label: 'Severe — I can\'t function', urgencyWeight: 8, escalateImmediately: false, nextQuestion: medQ3.id },
        { label: 'Moderate — It\'s hard to focus', urgencyWeight: 5, escalateImmediately: false },
        { label: 'Mild — It\'s uncomfortable but manageable', urgencyWeight: 2, escalateImmediately: false },
        { label: 'No pain', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  const medQ2 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How long have you had these symptoms?',
      type: 'single_choice',
      sortOrder: 2,
      answers: [
        { label: 'Just started today', urgencyWeight: 4, escalateImmediately: false },
        { label: 'A few days', urgencyWeight: 3, escalateImmediately: false },
        { label: 'About a week', urgencyWeight: 2, escalateImmediately: false },
        { label: 'More than a week', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Medical'],
      questions: [medQ0.id, medQ1.id, medQ2.id, medQ3.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translations for Medical questions ---
  await payload.update({
    collection: 'questions',
    id: medQ0.id,
    locale: 'es',
    data: {
      text: '¿Cómo prefiere recibir atención médica?',
      helpText: 'Esto nos ayuda a encontrar la mejor opción para usted.',
      answers: [
        { label: 'Visita virtual (teléfono o video)', urgencyWeight: 0, escalateImmediately: false },
        { label: 'Visita en persona', urgencyWeight: 0, escalateImmediately: false },
        { label: 'Sin preferencia', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: medQ1.id,
    locale: 'es',
    data: {
      text: '¿Cómo describiría su nivel de dolor?',
      helpText: 'Piense en cómo el dolor afecta sus actividades diarias.',
      answers: [
        { label: 'Severo — no puedo funcionar', urgencyWeight: 8, escalateImmediately: false, nextQuestion: medQ3.id },
        { label: 'Moderado — me cuesta concentrarme', urgencyWeight: 5, escalateImmediately: false },
        { label: 'Leve — es incómodo pero manejable', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Sin dolor', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: medQ2.id,
    locale: 'es',
    data: {
      text: '¿Cuánto tiempo ha tenido estos síntomas?',
      answers: [
        { label: 'Comenzó hoy', urgencyWeight: 4, escalateImmediately: false },
        { label: 'Unos días', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Aproximadamente una semana', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Más de una semana', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: medQ3.id,
    locale: 'es',
    data: {
      text: '¿Tiene fiebre (temperatura superior a 100.4°F)?',
      answers: [
        { label: 'Sí', urgencyWeight: 4, escalateImmediately: false },
        { label: 'No', urgencyWeight: 0, escalateImmediately: false },
        { label: 'No estoy seguro/a', urgencyWeight: 2, escalateImmediately: false },
      ],
    },
  })

  // === DENTAL QUESTIONS ===
  const denQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Do you have swelling in your face, jaw, or gums?',
      type: 'yes_no',
      sortOrder: 1,
      answers: [
        { label: 'Yes, significant swelling', urgencyWeight: 7, escalateImmediately: false },
        { label: 'Slight swelling', urgencyWeight: 3, escalateImmediately: false },
        { label: 'No swelling', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  const denQ2 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How bad is your dental pain?',
      type: 'single_choice',
      sortOrder: 2,
      answers: [
        { label: 'Severe — I can\'t eat or sleep', urgencyWeight: 6, escalateImmediately: false },
        { label: 'Moderate — It hurts but I can manage', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Mild or no pain', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Dental'],
      questions: [denQ1.id, denQ2.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translations for Dental questions ---
  await payload.update({
    collection: 'questions',
    id: denQ1.id,
    locale: 'es',
    data: {
      text: '¿Tiene hinchazón en la cara, mandíbula o encías?',
      answers: [
        { label: 'Sí, hinchazón significativa', urgencyWeight: 7, escalateImmediately: false },
        { label: 'Hinchazón leve', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Sin hinchazón', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: denQ2.id,
    locale: 'es',
    data: {
      text: '¿Qué tan fuerte es su dolor dental?',
      answers: [
        { label: 'Severo — no puedo comer ni dormir', urgencyWeight: 6, escalateImmediately: false },
        { label: 'Moderado — duele pero puedo manejarlo', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Leve o sin dolor', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  // === BEHAVIORAL HEALTH QUESTIONS ===
  const bhQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Are you having thoughts of hurting yourself or others?',
      helpText: 'Your safety is our priority. Please answer honestly — we want to help.',
      type: 'yes_no',
      sortOrder: 1,
      answers: [
        { label: 'Yes', urgencyWeight: 10, escalateImmediately: true },
        { label: 'No', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  const bhQ2 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How are these feelings affecting your daily life?',
      helpText: 'Think about work, sleep, eating, and relationships.',
      type: 'single_choice',
      sortOrder: 2,
      answers: [
        { label: 'I can\'t function at all', urgencyWeight: 8, escalateImmediately: false },
        { label: 'It\'s hard to get through the day', urgencyWeight: 5, escalateImmediately: false },
        { label: 'I\'m managing but struggling', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Mild impact', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  const bhQ3 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How long have you been feeling this way?',
      type: 'single_choice',
      sortOrder: 3,
      answers: [
        { label: 'Less than a week', urgencyWeight: 4, escalateImmediately: false },
        { label: 'A few weeks', urgencyWeight: 3, escalateImmediately: false },
        { label: 'A month or more', urgencyWeight: 2, escalateImmediately: false },
        { label: 'On and off for a long time', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Behavioral Health'],
      questions: [bhQ1.id, bhQ2.id, bhQ3.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translations for Behavioral Health questions ---
  await payload.update({
    collection: 'questions',
    id: bhQ1.id,
    locale: 'es',
    data: {
      text: '¿Tiene pensamientos de hacerse daño a sí mismo/a o a otros?',
      helpText: 'Su seguridad es nuestra prioridad. Por favor responda con honestidad — queremos ayudarle.',
      answers: [
        { label: 'Sí', urgencyWeight: 10, escalateImmediately: true },
        { label: 'No', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: bhQ2.id,
    locale: 'es',
    data: {
      text: '¿Cómo están afectando estos sentimientos su vida diaria?',
      helpText: 'Piense en el trabajo, el sueño, la alimentación y las relaciones.',
      answers: [
        { label: 'No puedo funcionar en absoluto', urgencyWeight: 8, escalateImmediately: false },
        { label: 'Me cuesta pasar el día', urgencyWeight: 5, escalateImmediately: false },
        { label: 'Me las arreglo pero con dificultad', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Impacto leve', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: bhQ3.id,
    locale: 'es',
    data: {
      text: '¿Cuánto tiempo se ha sentido así?',
      answers: [
        { label: 'Menos de una semana', urgencyWeight: 4, escalateImmediately: false },
        { label: 'Unas semanas', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Un mes o más', urgencyWeight: 2, escalateImmediately: false },
        { label: 'De forma intermitente por mucho tiempo', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  // === VISION QUESTIONS ===
  const visQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Did you have a sudden change in vision or an eye injury?',
      helpText: 'Sudden changes can include flashes of light, loss of vision, or seeing spots.',
      type: 'single_choice',
      sortOrder: 1,
      answers: [
        { label: 'Yes, sudden vision loss', urgencyWeight: 10, escalateImmediately: false },
        { label: 'Yes, eye injury', urgencyWeight: 8, escalateImmediately: false },
        { label: 'No, it\'s been gradual', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  const visQ2 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Are you experiencing eye pain?',
      type: 'single_choice',
      sortOrder: 2,
      answers: [
        { label: 'Severe pain', urgencyWeight: 6, escalateImmediately: false },
        { label: 'Moderate pain', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Mild or no pain', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  const visQ3 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How long have you had this issue?',
      type: 'single_choice',
      sortOrder: 3,
      answers: [
        { label: 'Just started today', urgencyWeight: 4, escalateImmediately: false },
        { label: 'A few days', urgencyWeight: 3, escalateImmediately: false },
        { label: 'A week or more', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Vision'],
      questions: [visQ1.id, visQ2.id, visQ3.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translations for Vision questions ---
  await payload.update({
    collection: 'questions',
    id: visQ1.id,
    locale: 'es',
    data: {
      text: '¿Tuvo un cambio repentino en la visión o una lesión en el ojo?',
      helpText: 'Los cambios repentinos pueden incluir destellos de luz, pérdida de visión o ver manchas.',
      answers: [
        { label: 'Sí, pérdida repentina de visión', urgencyWeight: 10, escalateImmediately: false },
        { label: 'Sí, lesión en el ojo', urgencyWeight: 8, escalateImmediately: false },
        { label: 'No, ha sido gradual', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: visQ2.id,
    locale: 'es',
    data: {
      text: '¿Tiene dolor en los ojos?',
      answers: [
        { label: 'Dolor severo', urgencyWeight: 6, escalateImmediately: false },
        { label: 'Dolor moderado', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Leve o sin dolor', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: visQ3.id,
    locale: 'es',
    data: {
      text: '¿Cuánto tiempo ha tenido este problema?',
      answers: [
        { label: 'Comenzó hoy', urgencyWeight: 4, escalateImmediately: false },
        { label: 'Unos días', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Una semana o más', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  // === MEDICATION QUESTIONS ===
  const medRxQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Are you having a bad reaction to a medication?',
      helpText: 'Signs of a serious reaction include difficulty breathing, swelling, or a rash.',
      type: 'single_choice',
      sortOrder: 1,
      answers: [
        { label: 'Yes, difficulty breathing or swelling', urgencyWeight: 10, escalateImmediately: true },
        { label: 'Yes, other reaction', urgencyWeight: 7, escalateImmediately: false },
        { label: 'No', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  const medRxQ2 = await payload.create({
    collection: 'questions',
    data: {
      text: 'What kind of medication help do you need?',
      type: 'single_choice',
      sortOrder: 2,
      answers: [
        { label: 'Ran out of a critical medication (insulin, blood pressure, seizure)', urgencyWeight: 6, escalateImmediately: false },
        { label: 'Need a refill on a regular medication', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Can\'t afford my medication', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Want to discuss side effects', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  const medRxQ3 = await payload.create({
    collection: 'questions',
    data: {
      text: 'How urgent is your medication need?',
      type: 'single_choice',
      sortOrder: 3,
      answers: [
        { label: 'I\'m completely out now', urgencyWeight: 5, escalateImmediately: false },
        { label: 'I\'ll run out in a day or two', urgencyWeight: 3, escalateImmediately: false },
        { label: 'I have some time but need help soon', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Medication'],
      questions: [medRxQ1.id, medRxQ2.id, medRxQ3.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translations for Medication questions ---
  await payload.update({
    collection: 'questions',
    id: medRxQ1.id,
    locale: 'es',
    data: {
      text: '¿Está teniendo una mala reacción a un medicamento?',
      helpText: 'Los signos de una reacción grave incluyen dificultad para respirar, hinchazón o sarpullido.',
      answers: [
        { label: 'Sí, dificultad para respirar o hinchazón', urgencyWeight: 10, escalateImmediately: true },
        { label: 'Sí, otra reacción', urgencyWeight: 7, escalateImmediately: false },
        { label: 'No', urgencyWeight: 0, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: medRxQ2.id,
    locale: 'es',
    data: {
      text: '¿Qué tipo de ayuda con medicamentos necesita?',
      answers: [
        { label: 'Se me acabó un medicamento crítico (insulina, presión arterial, convulsiones)', urgencyWeight: 6, escalateImmediately: false },
        { label: 'Necesito un resurtido de un medicamento regular', urgencyWeight: 2, escalateImmediately: false },
        { label: 'No puedo pagar mi medicamento', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Quiero hablar sobre efectos secundarios', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: medRxQ3.id,
    locale: 'es',
    data: {
      text: '¿Qué tan urgente es su necesidad de medicamento?',
      answers: [
        { label: 'Se me acabó por completo', urgencyWeight: 5, escalateImmediately: false },
        { label: 'Se me acabará en uno o dos días', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Tengo algo de tiempo pero necesito ayuda pronto', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  // === CHRONIC CARE QUESTIONS ===
  const ccQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Are you experiencing a sudden worsening of your condition?',
      helpText: 'For example, blood sugar that won\'t come down, chest tightness, or severe shortness of breath.',
      type: 'single_choice',
      sortOrder: 1,
      answers: [
        { label: 'Yes, much worse suddenly', urgencyWeight: 8, escalateImmediately: false },
        { label: 'Somewhat worse lately', urgencyWeight: 4, escalateImmediately: false },
        { label: 'About the same', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  const ccQ2 = await payload.create({
    collection: 'questions',
    data: {
      text: 'What condition do you need help managing?',
      type: 'single_choice',
      sortOrder: 2,
      answers: [
        { label: 'Diabetes', urgencyWeight: 2, escalateImmediately: false },
        { label: 'High blood pressure', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Asthma or breathing condition', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Other ongoing condition', urgencyWeight: 2, escalateImmediately: false },
      ],
    },
  })

  const ccQ3 = await payload.create({
    collection: 'questions',
    data: {
      text: 'When did you last see a doctor for this condition?',
      type: 'single_choice',
      sortOrder: 3,
      answers: [
        { label: 'I\'ve never seen a doctor for this', urgencyWeight: 5, escalateImmediately: false },
        { label: 'More than a year ago', urgencyWeight: 4, escalateImmediately: false },
        { label: '6 months to a year', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Within the last 6 months', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Chronic Care'],
      questions: [ccQ1.id, ccQ2.id, ccQ3.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translations for Chronic Care questions ---
  await payload.update({
    collection: 'questions',
    id: ccQ1.id,
    locale: 'es',
    data: {
      text: '¿Está experimentando un empeoramiento repentino de su condición?',
      helpText: 'Por ejemplo, azúcar en la sangre que no baja, opresión en el pecho o dificultad respiratoria severa.',
      answers: [
        { label: 'Sí, mucho peor de repente', urgencyWeight: 8, escalateImmediately: false },
        { label: 'Algo peor últimamente', urgencyWeight: 4, escalateImmediately: false },
        { label: 'Más o menos igual', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: ccQ2.id,
    locale: 'es',
    data: {
      text: '¿Qué condición necesita ayuda para manejar?',
      answers: [
        { label: 'Diabetes', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Presión arterial alta', urgencyWeight: 2, escalateImmediately: false },
        { label: 'Asma o condición respiratoria', urgencyWeight: 3, escalateImmediately: false },
        { label: 'Otra condición crónica', urgencyWeight: 2, escalateImmediately: false },
      ],
    },
  })

  await payload.update({
    collection: 'questions',
    id: ccQ3.id,
    locale: 'es',
    data: {
      text: '¿Cuándo fue la última vez que vio a un médico por esta condición?',
      answers: [
        { label: 'Nunca he visto a un médico por esto', urgencyWeight: 5, escalateImmediately: false },
        { label: 'Hace más de un año', urgencyWeight: 4, escalateImmediately: false },
        { label: 'De 6 meses a un año', urgencyWeight: 2, escalateImmediately: false },
        { label: 'En los últimos 6 meses', urgencyWeight: 1, escalateImmediately: false },
      ],
    },
  })

  // === NOT SURE (META-TRIAGE) QUESTIONS ===
  const metaQ1 = await payload.create({
    collection: 'questions',
    data: {
      text: 'Which best describes what\'s going on?',
      helpText: 'Pick the option that sounds closest. We\'ll help you figure out the right care.',
      type: 'single_choice',
      sortOrder: 1,
      answers: [
        { label: 'I feel sick or have a health concern', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Medical'] },
        { label: 'I have a tooth or mouth problem', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Dental'] },
        { label: 'I have an eye or vision problem', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Vision'] },
        { label: 'I\'m feeling anxious, depressed, or need mental health support', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Behavioral Health'] },
        { label: 'I need help with my medications', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Medication'] },
        { label: 'I have an ongoing condition (diabetes, blood pressure, etc.)', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Chronic Care'] },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: ct['Not Sure'],
      questions: [metaQ1.id],
      version: 1,
      isActive: true,
    },
  })

  // --- Spanish translation for Not Sure (Meta-Triage) question ---
  await payload.update({
    collection: 'questions',
    id: metaQ1.id,
    locale: 'es',
    data: {
      text: '¿Qué describe mejor lo que le pasa?',
      helpText: 'Elija la opción más cercana. Le ayudaremos a encontrar la atención adecuada.',
      answers: [
        { label: 'Me siento enfermo/a o tengo una preocupación de salud', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Medical'] },
        { label: 'Tengo un problema dental o de la boca', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Dental'] },
        { label: 'Tengo un problema de los ojos o la visión', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Vision'] },
        { label: 'Me siento ansioso/a, deprimido/a o necesito apoyo de salud mental', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Behavioral Health'] },
        { label: 'Necesito ayuda con mis medicamentos', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Medication'] },
        { label: 'Tengo una condición crónica (diabetes, presión arterial, etc.)', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: ct['Chronic Care'] },
      ],
    },
  })
}
