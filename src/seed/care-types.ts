export const careTypes = [
  { name: 'Medical', icon: '🩺', description: 'General health concerns, illness, or injury', sortOrder: 1, isMeta: false },
  { name: 'Dental', icon: '🦷', description: 'Tooth pain, dental problems, or oral health', sortOrder: 2, isMeta: false },
  { name: 'Vision', icon: '👁️', description: 'Eye problems or vision concerns', sortOrder: 3, isMeta: false },
  { name: 'Behavioral Health', icon: '🧠', description: 'Mental health, anxiety, depression, or substance use', sortOrder: 4, isMeta: false, isBehavioralHealth: true },
  { name: 'Medication', icon: '💊', description: 'Prescription refills or medication questions', sortOrder: 5, isMeta: false },
  { name: 'Chronic Care', icon: '📋', description: 'Ongoing conditions like diabetes, high blood pressure', sortOrder: 6, isMeta: false },
  { name: 'Not Sure', icon: '❓', description: 'I\'m not sure what kind of care I need', sortOrder: 99, isMeta: true },
]
