import type { Payload } from 'payload'

export async function createQuestionSets(
  payload: Payload,
  careTypes: Record<string, number | string>,
) {
  // === MEDICAL QUESTIONS ===
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
      careType: careTypes['Medical'],
      questions: [medQ1.id, medQ2.id, medQ3.id],
      version: 1,
      isActive: true,
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
      careType: careTypes['Dental'],
      questions: [denQ1.id, denQ2.id],
      version: 1,
      isActive: true,
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
        { label: 'I feel sick or have a health concern', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: careTypes['Medical'] },
        { label: 'I have a tooth or mouth problem', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: careTypes['Dental'] },
        { label: 'I have an eye or vision problem', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: careTypes['Vision'] },
        { label: 'I\'m feeling anxious, depressed, or need mental health support', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: careTypes['Behavioral Health'] },
        { label: 'I need help with my medications', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: careTypes['Medication'] },
        { label: 'I have an ongoing condition (diabetes, blood pressure, etc.)', urgencyWeight: 0, escalateImmediately: false, redirectToCareType: careTypes['Chronic Care'] },
      ],
    },
  })

  await payload.create({
    collection: 'question-sets',
    data: {
      careType: careTypes['Not Sure'],
      questions: [metaQ1.id],
      version: 1,
      isActive: true,
    },
  })
}
