import { messages } from '../notification.ts'
import { state } from '../state'
import type { Session } from '../types'
import { downloadFile } from '../util.ts'

export function exportToJSON(): typeof messages['JSON_EXPORT_ERROR'] | undefined {
  try {
    const clonedSessions = state.sessions.map((session) => ({
      ...session,
      steeps: session.steeps.filter((steep) => steep.length > 0),
      customFields: session.customFields.filter((field) => field.value !== ''),
    }))

    const serializedSessions = JSON.stringify(clonedSessions, null, 2)
    downloadFile({
      content: serializedSessions,
      filename: 'steepbook_sessions.json',
      type: 'json',
    })
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

