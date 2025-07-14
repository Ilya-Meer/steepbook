import { messages } from '../notification.ts'
import { state } from '../state'
import type { Session } from '../types'
import {
  downloadFile,
  toLocalDatetimeString
} from '../util.ts'
import { staticFields } from '../constants.ts'

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

export function importFromJSON(json: string): {
  sessions?: Session[],
  error?: typeof messages[keyof typeof messages]
} {
  try {
    const parsed = JSON.parse(json) as Session[]
    if (!Array.isArray(parsed)) {
      console.error('Invalid JSON format: expected an array of sessions')
      return { error: messages.JSON_IMPORT_ERROR }
    }

    const imported: Array<{
      session: Session | null
      success: boolean
    }> = parsed.map((sessionLike: Session): {
      session: Session | null
      success: boolean
    } => {
      if (!sessionLike.datetime || isNaN(new Date(sessionLike.datetime).getTime())) {
        console.error('Invalid session format: datetime field missing or invalid')
        return {
          session: null,
          success: false
        }
      }
      const session: Session = {
        datetime: toLocalDatetimeString(new Date(sessionLike.datetime)),
        teaName: 'IMPORT',
        steeps: [],
        customFields: [],
      }

      // import static fields
      for (const field of staticFields.slice(1)) { // Process 'datetime' separately
        session[field] = sessionLike[field] || ''
      }

      // import steeps
      if (sessionLike.steeps && Array.isArray(sessionLike.steeps)) {
        session.steeps = sessionLike.steeps.filter((steep: string) => typeof steep === 'string' && steep.trim() !== '')
      }

      // import custom fields
      if (sessionLike.customFields && Array.isArray(sessionLike.customFields)) {
        session.customFields = sessionLike.customFields.filter((field: { name: string, value: string }) => typeof field.name === 'string'
          && field.name.trim() !== ''
          && typeof field.value === 'string'
          && field.value.trim() !== ''
        )
      }

      return {
        session,
        success: true
      }
    })

    const sessions: Session[] = []
    let errorCount = 0

    for (const result of imported) {
      if (result.success && result.session) {
        sessions.push(result.session)
        continue
      }
      errorCount++
    }

    if (errorCount === imported.length) {
      console.error('All imported sessions were invalid')
      return { error: messages.JSON_IMPORT_ERROR }
    }

    if (errorCount > 0) {
      console.warn(`${errorCount} sessions were invalid and skipped during import`)
      return {
        sessions,
        error: messages.JSON_IMPORT_ERROR_PARTIAL
      }
    }

    return { sessions }
  } catch (error) {
    console.error('Error importing from JSON:', error)
    return { error: messages.JSON_IMPORT_ERROR }
  }
}
