import Papa from 'papaparse'
import { messages } from '../notification.ts'
import { state } from '../state'
import { type Session } from '../types'
import { downloadFile } from '../util.ts'
import { staticFields } from '../constants'

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
      ...staticFields,
      ...Array.from({ length: maxSteeps }, (_, i) => `steep-${i + 1}`),
      ...Array.from(new Set(allCustomFields))
    ]

    const generateCustomFieldsValuesForSession = (session: Session) => {
      return allCustomFields.map((fieldName) => {
        const existingField = session.customFields.find((field) => field.name === fieldName)
        return existingField ? existingField.value : ''
      })
    }

    const rows = clonedSessions.map((session) => {
      return [
        ...staticFields.map((field) => session[field]),
        ...Array.from({ length: maxSteeps }, (_, i) => session.steeps[i] || ''),
        ...generateCustomFieldsValuesForSession(session)
      ]
    })

    const csv = Papa.unparse([
      headerRow,
      ...rows
    ])

    downloadFile({
      content: csv,
      filename: 'steepbook_sessions.csv',
      type: 'csv',
    })
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return messages.CSV_EXPORT_ERROR
  }
}

export function importFromCSV(csv: string): {
  sessions?: Session[],
  error?: typeof messages[keyof typeof messages]
} {
  try {
    if (typeof csv !== 'string') {
      console.error('Invalid CSV format: expected string but got ', typeof csv)
      return { error: messages.CSV_IMPORT_ERROR }
    }

    if (csv.trim() === '') {
      console.error('Invalid CSV format: empty input')
      return { error: messages.CSV_IMPORT_ERROR }
    }

    const parseResult = Papa.parse<string[]>(csv, { skipEmptyLines: true })

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing failed:', parseResult.errors)
      return { error: messages.CSV_IMPORT_ERROR }
    }

    const lines = parseResult.data
    if (lines.length === 1) {
      console.error('Invalid CSV format: unexpected end of input')
      return { error: messages.CSV_IMPORT_ERROR }
    }

    const hasDateTimeColumn = lines[0].includes('datetime')
    const hasNameColumn = lines[0].includes('teaName')
    const isHeaderPresent = hasDateTimeColumn && hasNameColumn
    if (!isHeaderPresent) {
      console.error('Invalid CSV format: missing header!')
      return { error: messages.CSV_IMPORT_ERROR }
    }

    const [
      columns,
      ...rows
    ] = lines

    const imported: Array<{
      session: Session | null
      success: boolean
    }> = rows.map((fields: string[]): {
      session: Session | null
      success: boolean
    } => {
      const session: Session = {
        datetime: '',
        teaName: '',
        steeps: [],
        customFields: [],
      }

      for (const [
        index,
        field
      ] of fields.entries() as ArrayIterator<[number, Session[keyof Session]]>) {
        const fieldName = columns[index]

        // import static fields
        if (!fieldName.startsWith('steep-') && !fieldName.startsWith('custom-')) {
          if (staticFields.includes(fieldName as typeof staticFields[number])) {
            session[fieldName as typeof staticFields[number]] = field as typeof staticFields[number]
          }
          // import steeps
        } else if (fieldName.startsWith('steep-') && Boolean(field) && (field as string) !== '') {
          session.steeps.push(field as string)
          // import custom fields
        } else if (fieldName.startsWith('custom-') && Boolean(field) && (field as string) !== '') {
          session.customFields.push({
            name: fieldName,
            value: field as string
          })
        }
      }

      // if any of the static fields are missing from the columns,
      // we're dealing with an older version of the CSV format,
      // so we'll just set the value of the field to empty string
      for (const staticField of staticFields) {
        if (!columns.includes(staticField)) {
          session[staticField] = ''
        }
      }

      if (!session.datetime || isNaN(new Date(session.datetime).getTime())) {
        console.error('Invalid session format: datetime field missing or invalid')
        return {
          session: null,
          success: false
        }
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
      return { error: messages.CSV_IMPORT_ERROR }
    }

    if (errorCount > 0) {
      console.warn(`${errorCount} sessions were invalid and skipped during import`)
      return {
        sessions,
        error: messages.CSV_IMPORT_ERROR_PARTIAL
      }
    }

    return { sessions }
  } catch (error) {
    console.error('Error retrieving sessions from localStorage:', error)
    return { error: messages.CSV_IMPORT_ERROR }
  }
}
