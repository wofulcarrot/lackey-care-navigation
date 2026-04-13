export const urgencyLevels = [
  { name: 'Life-Threatening', color: '#FEE2E2', scoreThreshold: 20, timeToCare: 'Immediate', description: 'Call 911 or go to the ER now' },
  { name: 'Emergent', color: '#FFEDD5', scoreThreshold: 15, timeToCare: 'Within 1 Hour', description: 'Go to the nearest emergency room' },
  { name: 'Urgent', color: '#FEF9C3', scoreThreshold: 10, timeToCare: 'Same Day', description: 'Visit urgent care today' },
  { name: 'Semi-Urgent', color: '#DCFCE7', scoreThreshold: 5, timeToCare: '1-3 Days', description: 'Schedule an appointment soon' },
  { name: 'Routine', color: '#DBEAFE', scoreThreshold: 2, timeToCare: '1-2 Weeks', description: 'Schedule a regular appointment' },
  { name: 'Elective', color: '#EDE9FE', scoreThreshold: 0, timeToCare: 'As Available', description: 'Schedule at your convenience' },
]
