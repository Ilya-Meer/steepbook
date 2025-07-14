/**
 * @vitest-environment jsdom
 */
import {
  vi,
  describe,
  it,
  expect,
  beforeEach
} from 'vitest'

// Mock all dependencies that init() uses
vi.mock('./refs', () => ({
  refs: {
    form: { addEventListener: vi.fn() },
    resetBtn: { addEventListener: vi.fn() },
    steepsDiv: { innerHTML: '' },
    addSteepBtn: { addEventListener: vi.fn() },
    addCustomFieldBtn: { addEventListener: vi.fn() },
    csvExportButton: { addEventListener: vi.fn() },
    jsonExportButton: { addEventListener: vi.fn() },
    csvImportInputLabel: { addEventListener: vi.fn() },
    jsonImportInputLabel: { addEventListener: vi.fn() }
  }
}))

vi.mock('./steep', () => ({
  addSteepField: vi.fn()
}))

vi.mock('./custom-field', () => ({
  addCustomField: vi.fn()
}))

vi.mock('./session', () => ({
  saveSession: vi.fn(),
  resetSessionForm: vi.fn(),
  setDefaultDateTime: vi.fn(),
  renderSessions: vi.fn()
}))

vi.mock('./transport', () => ({
  loadFromLocalStorage: vi.fn(() => ({
    sessions: [],
    error: null
  })),
  exportToJSON: vi.fn(),
  exportToCSV: vi.fn(),
  importFromJSON: vi.fn(),
  importFromCSV: vi.fn(),
  saveToLocalStorage: vi.fn()
}))

import { importFile } from './main'
import { messages } from './notification'
import { state } from './state'
import { saveToLocalStorage } from './transport'
import { renderSessions } from './session'
import {
  displayFailureMessage,
  displaySuccessMessage
} from './notification'

// Mock notification and state modules
vi.mock('./notification', () => ({
  messages: {
    JSON_IMPORT_ERROR: 'JSON_IMPORT_ERROR',
    CSV_IMPORT_ERROR: 'CSV_IMPORT_ERROR',
    JSON_IMPORT_ERROR_PARTIAL: 'JSON_IMPORT_ERROR_PARTIAL',
    CSV_IMPORT_ERROR_PARTIAL: 'CSV_IMPORT_ERROR_PARTIAL',
    SESSION_IMPORT_SUCCESS: 'SESSION_IMPORT_SUCCESS',
    SESSION_SAVE_ERROR: 'SESSION_SAVE_ERROR'
  },
  displayFailureMessage: vi.fn(),
  displaySuccessMessage: vi.fn()
}))

vi.mock('./state', () => ({
  state: {
    sessions: []
  }
}))

describe('importFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state
    vi.mocked(state).sessions = []
  })

  it('should successfully import a valid file', () => {
    const mockImportFunc = vi.fn().mockReturnValue({
      sessions: [
        {
          datetime: '2024-01-01T10:00',
          teaName: 'Test Tea',
          steeps: [
            'First steep',
            'Second steep'
          ],
          customFields: [
            {
              name: 'Temperature',
              value: '95C'
            }
          ]
        }
      ],
      error: null
    })

    // Mock FileReader event
    const mockEvent = {
      target: {
        result: '{"sessions": [{"datetime": "2024-01-01T10:00", "teaName": "Test Tea"}]}'
      }
    } as ProgressEvent<FileReader>

    // Mock saveToLocalStorage to return no error
    vi.mocked(saveToLocalStorage).mockReturnValue(undefined)

    importFile(mockEvent, mockImportFunc)

    // Verify import function was called with correct content
    expect(mockImportFunc).toHaveBeenCalledWith('{"sessions": [{"datetime": "2024-01-01T10:00", "teaName": "Test Tea"}]}')

    // Verify success message was displayed
    expect(displaySuccessMessage).toHaveBeenCalledWith(messages.SESSION_IMPORT_SUCCESS)

    // Verify state was updated
    expect(state.sessions).toEqual([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Test Tea',
        steeps: [
          'First steep',
          'Second steep'
        ],
        customFields: [
          {
            name: 'Temperature',
            value: '95C'
          }
        ]
      }
    ])

    // Verify sessions were rendered
    expect(renderSessions).toHaveBeenCalled()

    // Verify sessions were saved to localStorage
    expect(saveToLocalStorage).toHaveBeenCalledWith([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Test Tea',
        steeps: [
          'First steep',
          'Second steep'
        ],
        customFields: [
          {
            name: 'Temperature',
            value: '95C'
          }
        ]
      }
    ])
  })

  it('should handle JSON partial import errors', () => {
    // Mock import function that returns partial error
    const mockImportFunc = vi.fn().mockReturnValue({
      sessions: [
        {
          datetime: '2024-01-01T10:00',
          teaName: 'Valid Tea',
          steeps: ['First steep'],
          customFields: []
        }
      ],
      error: messages.JSON_IMPORT_ERROR_PARTIAL
    })

    const mockEvent = {
      target: {
        result: '{"sessions": [{"datetime": "2024-01-01T10:00", "teaName": "Valid Tea"}]}'
      }
    } as ProgressEvent<FileReader>

    vi.mocked(saveToLocalStorage).mockReturnValue(undefined)

    importFile(mockEvent, mockImportFunc)

    // Verify partial error message was displayed
    expect(displayFailureMessage).toHaveBeenCalledWith(messages.JSON_IMPORT_ERROR_PARTIAL)

    // Verify state was still updated with valid sessions
    expect(state.sessions).toEqual([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Valid Tea',
        steeps: ['First steep'],
        customFields: []
      }
    ])

    // Verify sessions were rendered
    expect(renderSessions).toHaveBeenCalled()

    // Verify sessions were saved to localStorage
    expect(saveToLocalStorage).toHaveBeenCalledWith([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Valid Tea',
        steeps: ['First steep'],
        customFields: []
      }
    ])
  })

  it('should handle JSON import errors', () => {
    // Mock import function that returns complete error
    const mockImportFunc = vi.fn().mockReturnValue({
      sessions: undefined,
      error: messages.JSON_IMPORT_ERROR
    })

    const mockEvent = {
      target: {
        result: 'invalid json content'
      }
    } as ProgressEvent<FileReader>

    importFile(mockEvent, mockImportFunc)

    // Verify error message was displayed
    expect(displayFailureMessage).toHaveBeenCalledWith(messages.JSON_IMPORT_ERROR)

    // Verify state was not updated (should remain empty)
    expect(state.sessions).toEqual([])

    // Verify sessions were not rendered
    expect(renderSessions).not.toHaveBeenCalled()

    // Verify sessions were not saved to localStorage
    expect(saveToLocalStorage).not.toHaveBeenCalled()
  })

  it('should handle localStorage save errors', () => {
    // Mock successful import function
    const mockImportFunc = vi.fn().mockReturnValue({
      sessions: [
        {
          datetime: '2024-01-01T10:00',
          teaName: 'Test Tea',
          steeps: [],
          customFields: []
        }
      ],
      error: null
    })

    const mockEvent = {
      target: {
        result: '{"sessions": [{"datetime": "2024-01-01T10:00", "teaName": "Test Tea"}]}'
      }
    } as ProgressEvent<FileReader>

    // Mock saveToLocalStorage to return an error
    vi.mocked(saveToLocalStorage).mockReturnValue(messages.SESSION_SAVE_ERROR)

    importFile(mockEvent, mockImportFunc)

    // Verify success message was still displayed
    expect(displaySuccessMessage).toHaveBeenCalledWith(messages.SESSION_IMPORT_SUCCESS)

    // Verify state was updated
    expect(state.sessions).toEqual([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Test Tea',
        steeps: [],
        customFields: []
      }
    ])

    // Verify sessions were rendered
    expect(renderSessions).toHaveBeenCalled()

    // Verify storage error was displayed
    expect(displayFailureMessage).toHaveBeenCalledWith(messages.SESSION_SAVE_ERROR)
  })

  it('should handle CSV import errors', () => {
    // Mock import function that returns CSV error
    const mockImportFunc = vi.fn().mockReturnValue({
      sessions: undefined,
      error: messages.CSV_IMPORT_ERROR
    })

    const mockEvent = {
      target: {
        result: 'invalid,csv,content'
      }
    } as ProgressEvent<FileReader>

    importFile(mockEvent, mockImportFunc)

    // Verify CSV error message was displayed
    expect(displayFailureMessage).toHaveBeenCalledWith(messages.CSV_IMPORT_ERROR)

    // Verify state was not updated
    expect(state.sessions).toEqual([])

    // Verify sessions were not rendered
    expect(renderSessions).not.toHaveBeenCalled()

    // Verify sessions were not saved to localStorage
    expect(saveToLocalStorage).not.toHaveBeenCalled()
  })

  it('should handle CSV partial import errors', () => {
    // Mock import function that returns CSV partial error
    const mockImportFunc = vi.fn().mockReturnValue({
      sessions: [
        {
          datetime: '2024-01-01T10:00',
          teaName: 'Valid Tea',
          steeps: [],
          customFields: []
        }
      ],
      error: messages.CSV_IMPORT_ERROR_PARTIAL
    })

    const mockEvent = {
      target: {
        result: 'valid,csv,content'
      }
    } as ProgressEvent<FileReader>

    vi.mocked(saveToLocalStorage).mockReturnValue(undefined)

    importFile(mockEvent, mockImportFunc)

    // Verify CSV partial error message was displayed
    expect(displayFailureMessage).toHaveBeenCalledWith(messages.CSV_IMPORT_ERROR_PARTIAL)

    // Verify state was still updated with valid sessions
    expect(state.sessions).toEqual([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Valid Tea',
        steeps: [],
        customFields: []
      }
    ])

    // Verify sessions were rendered
    expect(renderSessions).toHaveBeenCalled()

    // Verify sessions were saved to localStorage
    expect(saveToLocalStorage).toHaveBeenCalledWith([
      {
        datetime: '2024-01-01T10:00',
        teaName: 'Valid Tea',
        steeps: [],
        customFields: []
      }
    ])
  })
})
