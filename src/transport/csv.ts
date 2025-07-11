import { messages } from '../notification.ts'
import { state } from '../state'
import { type Session } from '../types'
import { downloadFile } from '../util.ts'

export function exportToCSV(): typeof messages['CSV_EXPORT_ERROR'] | undefined {
  try {
    const clonedSessions = state.sessions.map((session) => ({
      ...session,
      steeps: session.steeps.filter((steep) => steep.length > 0),
      customFields: session.customFields.filter((field) => field.value !== ''),
    }))

    const maxSteeps = clonedSessions.reduce((max, session) => Math.max(max, session.steeps.length), 0)
    const allCustomFields = Array.from(new Set(clonedSessions.flatMap((session) => session.customFields.map((field) => field.name))))

    const escapeCsvField = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"` // double-up inner quotes
      }
      return value
    }

    const staticFields = [
      'datetime',
      'brewingVessel',
      'teaName',
      'teaProducer',
      'origin',
      'purchaseLocation',
      'dryLeaf',
      'wetLeaf',
      'additionalNotes',
    ] as const

    const headerRow = [
      ...staticFields,
      ...Array.from({ length: maxSteeps }, (_, i) => `steep-${i + 1}`),
      ...Array.from(new Set(allCustomFields)).map((field) => field),
    ]

    const generateCustomFieldsValuesForSession = (session: Session) => {
      return allCustomFields.map((fieldName) => {
        const existingField = session.customFields.find((field) => field.name === fieldName)
        return existingField ? escapeCsvField(existingField.value) : ''
      })
    }

    const rows = clonedSessions.map((session) => {
      return [
        ...staticFields.map((field) => escapeCsvField(session[field])),
        ...Array.from({ length: maxSteeps }, (_, i) => escapeCsvField(session.steeps[i] || '')),
        ...generateCustomFieldsValuesForSession(session)
      ]
    })

    downloadFile({
      content: [
        headerRow,
        ...rows
      ].map(row => row.join(',')).join('\n'),
      filename: 'steepbook_sessions.csv',
      type: 'csv',
    })
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return messages.CSV_EXPORT_ERROR
  }
}
