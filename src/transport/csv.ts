import { messages } from '../notification.ts'
import { state } from '../state'
import { type Session } from '../types'

export function exportToCSV(): typeof messages['CSV_EXPORT_ERROR'] | undefined {
  try {
    const clonedSessions = state.sessions.map((session) => ({
      ...session,
      steeps: session.steeps.filter((steep) => steep.length > 0),
      customFields: session.customFields.filter((field) => field.value !== ''),
    }))

    const maxSteeps = clonedSessions.reduce((max, session) => Math.max(max, session.steeps.length), 0)
    const allCustomFields = Array.from(new Set(clonedSessions.flatMap((session) => session.customFields.map((field) => field.name))))

    const headerRow = [
      'datetime',
      'brewingVessel',
      'teaName',
      'teaProducer',
      'origin',
      'purchaseLocation',
      'dryLeaf',
      'wetLeaf',
      'additionalNotes',
      ...Array.from({ length: maxSteeps }, (_, i) => `steep-${i + 1}`),
      ...Array.from(new Set(allCustomFields)).map((field) => field),
    ]

    const generateCustomFieldsValuesForSession = (session: Session) => {
      return allCustomFields.map((fieldName) => {
        const existingField = session.customFields.find((field) => field.name === fieldName)
        return existingField ? existingField.value : ''
      })
    }

    const rows = clonedSessions.map((session) => {
      return [
        session.datetime,
        session.brewingVessel,
        session.teaName,
        session.teaProducer,
        session.origin,
        session.purchaseLocation,
        session.dryLeaf,
        session.wetLeaf,
        session.additionalNotes,
        ...session.steeps,
        ...generateCustomFieldsValuesForSession(session)
      ]
    })

    downloadCSV([
      headerRow,
      ...rows
    ].map(row => row.join(',')).join('\n'))
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return messages.CSV_EXPORT_ERROR
  }
}

function downloadCSV(serializedSessions: string, filename = 'steepbook_sessions.csv') {
  const blob = new Blob([serializedSessions], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url) // Release memory
}
