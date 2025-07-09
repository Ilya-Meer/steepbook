import { messages } from '../notification.ts'
import { state } from '../state'
import type { Session } from '../types'

export function exportToJSON(): typeof messages['JSON_EXPORT_ERROR'] | undefined {
  try {
    const clonedSessions = state.sessions.map((session) => ({
      ...session,
      steeps: session.steeps.filter((steep) => steep.length > 0),
      customFields: session.customFields.filter((field) => field.value !== ''),
    }))

    const serializedSessions = JSON.stringify(clonedSessions, null, 2)
    downloadJSON(serializedSessions)
  } catch (error) {
    console.error('Error exporting to JSON:', error)
    return messages.JSON_EXPORT_ERROR
  }
}

export function importFromJSON(): {
  sessions?: Session[],
  error?: typeof messages[keyof typeof messages]
} {
  try {
    console.log('TODO, NOT IMPLEMENTED')
  } catch (error) {
    console.error('Error retrieving sessions from localStorage:', error)
    return { error: messages.LOCAL_STORAGE_LOAD_ERROR }
  }
}

function downloadJSON(serializedSessions: string, filename = 'steepbook_sessions.json') {
  const blob = new Blob([serializedSessions], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url) // Release memory
}
