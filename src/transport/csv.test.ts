import Papa from 'papaparse'
import {
  expect,
  it,
  describe,
  vi,
  beforeEach
} from 'vitest'
import type { Session } from '../types'
import { downloadFile } from '../util'
import {
  exportToCSV, importFromCSV
} from './csv'

vi.mock('../util', () => ({ downloadFile: vi.fn() }))
vi.mock('../notification', () => ({
  messages: {
    CSV_IMPORT_ERROR: 'CSV_IMPORT_ERROR',
    CSV_IMPORT_ERROR_PARTIAL: 'CSV_IMPORT_ERROR_PARTIAL',
    CSV_EXPORT_ERROR: 'CSV_EXPORT_ERROR',
  }
}))
vi.mock('../state', () => ({
  state: {
    sessions: []
  }
}))

import { state } from '../state'
import { messages } from '../notification'

describe('Export to CSV', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls downloadFile with correctly formatted parameters', () => {
    // Mock state with test data containing steeps and custom fields
    const mockSessions: Session[] = [
      {
        datetime: '2024-01-01T10:00:00Z',
        brewingVessel: 'Gaiwan',
        teaName: '7542',
        teaProducer: 'Dayi',
        origin: 'Menghai Yunnan',
        year: '2005',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Dark brown; slightly sweet aroma',
        wetLeaf: 'Leather and tobacco',
        additionalNotes: 'Very refreshing',
        steeps: [
          'Wash',
          'Fruity',
          'Floral',
          '' // Include empty steep to test filtering
        ],
        customFields: [
          {
            name: 'Water Temperature',
            value: '100'
          },
          {
            name: 'Rating',
            value: '9/10'
          },
          {
            name: 'Empty Field',
            value: '' // Test filtering empty custom fields
          }
        ]
      },
      {
        datetime: '2024-01-02T14:30:00Z',
        brewingVessel: 'Yixing Zisha Zhuni Shuiping 100ml',
        teaName: 'N/A',
        teaProducer: 'XiaGuan',
        origin: 'Menghai - Yunnan',
        year: '2005',
        purchaseLocation: 'Essence of Tea',
        dryLeaf: 'Dark twisted leaves',
        wetLeaf: 'Dark brown',
        additionalNotes: 'Too smoky?',
        // Different number of steeps
        steeps: [
          'some value here',
          'another value here'
        ],
        customFields: [
          {
            name: 'Water Temperature',
            value: '100°C'
          },
          {
            // Different custom field
            name: 'Tea Pet',
            value: 'Lord GuanYu'
          },
          {
            name: 'Rating',
            value: '8/10'
          }
        ]
      }
    ]

    vi.mocked(state).sessions = mockSessions

    exportToCSV()

    expect(downloadFile).toHaveBeenCalledTimes(1)

    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    expect(callArgs).toMatchObject({
      filename: 'steepbook_sessions.csv',
      type: 'csv'
    })

    // Parse the CSV content to verify structure
    const csvContent = callArgs.content

    const parseResult = Papa.parse<string[]>(csvContent, { skipEmptyLines: true })

    const [
      headerRow,
      ...dataRows
    ] = parseResult.data

    // Verify header includes standard fields
    expect(headerRow).toContain('datetime')
    expect(headerRow).toContain('brewingVessel')
    expect(headerRow).toContain('teaName')
    expect(headerRow).toContain('teaProducer')
    expect(headerRow).toContain('origin')
    expect(headerRow).toContain('year')
    expect(headerRow).toContain('purchaseLocation')
    expect(headerRow).toContain('dryLeaf')
    expect(headerRow).toContain('wetLeaf')
    expect(headerRow).toContain('additionalNotes')

    // Verify steeps columns (max 3 steeps from first session, empty ones filtered)
    expect(headerRow).toContain('steep-1')
    expect(headerRow).toContain('steep-2')
    expect(headerRow).toContain('steep-3')
    expect(headerRow).not.toContain('steep-4') // Empty steep should be filtered

    // Verify custom fields columns (all unique custom fields)
    expect(headerRow).toContain('Water Temperature')
    expect(headerRow).toContain('Rating')
    expect(headerRow).toContain('Tea Pet')
    expect(headerRow).not.toContain('Empty Field') // Empty custom fields should be filtered

    // Verify first session data
    const firstRow = dataRows[0]
    expect(firstRow[0]).toBe('2024-01-01T10:00:00Z') // datetime
    expect(firstRow[1]).toBe('Gaiwan') // brewingVessel
    expect(firstRow[2]).toBe('7542') // teaName

    // Find steep columns and verify values
    const steep1Index = headerRow.indexOf('steep-1')
    const steep2Index = headerRow.indexOf('steep-2')
    const steep3Index = headerRow.indexOf('steep-3')

    expect(firstRow[steep1Index]).toBe('Wash')
    expect(firstRow[steep2Index]).toBe('Fruity')
    expect(firstRow[steep3Index]).toBe('Floral')

    // Verify custom fields for first session
    const waterTempIndex = headerRow.indexOf('Water Temperature')
    const ratingIndex = headerRow.indexOf('Rating')
    const teaPetIndex = headerRow.indexOf('Tea Pet')

    expect(firstRow[waterTempIndex]).toBe('100')
    expect(firstRow[ratingIndex]).toBe('9/10')
    expect(firstRow[teaPetIndex]).toBe('') // Not present in first session

    // Verify second session data
    const secondRow = dataRows[1]

    expect(secondRow[0]).toBe('2024-01-02T14:30:00Z') // datetime
    expect(secondRow[1]).toBe('Yixing Zisha Zhuni Shuiping 100ml') // brewingVessel
    expect(secondRow[2]).toBe('N/A') // teaName

    // Verify steeps for second session
    expect(secondRow[steep1Index]).toBe('some value here')
    expect(secondRow[steep2Index]).toBe('another value here')
    expect(secondRow[steep3Index]).toBe('') // No third steep

    // Verify custom fields for second session
    expect(secondRow[waterTempIndex]).toBe('100°C')
    expect(secondRow[ratingIndex]).toBe('8/10')
    expect(secondRow[teaPetIndex]).toBe('Lord GuanYu')
  })

  it('handles empty sessions array', () => {
    vi.mocked(state).sessions = []

    exportToCSV()

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    // Should still have header row
    const lines = callArgs.content.split('\n')
    expect(lines.length).toBe(1) // Only header, no data rows

    const headerRow = lines[0].split(',')
    expect(headerRow).toContain('datetime')
    expect(headerRow).toContain('brewingVessel')

    // Should not have any steep or custom field columns
    expect(headerRow.filter(h => h.startsWith('steep-'))).toHaveLength(0)
  })

  it('handles sessions with no steeps or custom fields', () => {
    const mockSessions: Session[] = [
      {
        datetime: '2024-01-01T10:00:00Z',
        brewingVessel: 'Gaiwan',
        teaName: 'Dragon Well',
        teaProducer: 'Tea Company A',
        origin: 'China',
        year: '2005',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Green, flat leaves, grassy aroma',
        wetLeaf: 'Even grassier',
        additionalNotes: 'I like it',
        steeps: [], // No steeps
        customFields: [] // No custom fields
      }
    ]

    vi.mocked(state).sessions = mockSessions

    exportToCSV()

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    const lines = callArgs.content.split('\n')
    const headerRow = lines[0].split(',')

    // Should not have any steep or custom field columns
    expect(headerRow.filter(h => h.startsWith('steep-'))).toHaveLength(0)
    expect(headerRow.filter(h => h.startsWith('custom-'))).toHaveLength(0)
  })
})

describe('Import from CSV', () => {
  it('imports well-formatted sessions from CSV', () => {
    // Create mock sessions data
    const mockSessions: Session[] = [
      {
        datetime: '2024-01-01T10:00',
        brewingVessel: 'Gaiwan',
        teaName: '7542',
        teaProducer: 'Dayi',
        origin: 'Menghai Yunnan',
        year: '2005',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Dark brown, slightly sweet aroma',
        wetLeaf: 'Leather and tobacco',
        additionalNotes: 'Very refreshing',
        steeps: [
          'Wash',
          'Fruity',
          'Floral',
        ],
        customFields: [
          {
            name: 'custom-water-temperature',
            value: '100'
          },
          {
            name: 'custom-rating',
            value: '9/10'
          }
        ]
      },
      {
        datetime: '2024-01-02T14:30',
        brewingVessel: 'Yixing Zisha Zhuni Shuiping 100ml',
        teaName: 'N/A',
        teaProducer: 'XiaGuan',
        origin: 'Menghai - Yunnan',
        year: '2005',
        purchaseLocation: 'Essence of Tea',
        dryLeaf: 'Dark twisted leaves',
        wetLeaf: 'Dark brown',
        additionalNotes: 'Too smoky?',
        steeps: [
          'some value here',
          'another value here'
        ],
        customFields: [
          {
            name: 'custom-water-temperature',
            value: '100°C'
          },
          {
            name: 'custom-rating',
            value: '8/10'
          },
          {
            name: 'custom-tea-pet',
            value: 'Lord GuanYu'
          }
        ]
      }
    ]

    // Create CSV string that matches the expected format
    const csvHeader = 'datetime,brewingVessel,teaName,teaProducer,origin,year,purchaseLocation,dryLeaf,wetLeaf,additionalNotes,steep-1,steep-2,steep-3,custom-water-temperature,custom-rating,custom-tea-pet'
    const csvRow1 = '2024-01-01T10:00,Gaiwan,7542,Dayi,Menghai Yunnan,2005,Local Tea Shop,"Dark brown, slightly sweet aroma",Leather and tobacco,Very refreshing,Wash,Fruity,Floral,100,9/10,'
    const csvRow2 = '2024-01-02T14:30,Yixing Zisha Zhuni Shuiping 100ml,N/A,XiaGuan,Menghai - Yunnan,2005,Essence of Tea,Dark twisted leaves,Dark brown,Too smoky?,some value here,another value here,,100°C,8/10,Lord GuanYu'
    const mockCSV = `${csvHeader}\n${csvRow1}\n${csvRow2}`

    const result = importFromCSV(mockCSV)

    // Expected result should filter out empty steeps and custom fields
    const expectedSessions = mockSessions.map(session => ({
      ...session,
      steeps: session.steeps.filter(steep => steep.length > 0),
      customFields: session.customFields.filter(field => field.value.length > 0)
    }))

    expect(result.sessions).toEqual(expectedSessions)
    expect(result.error).toBeUndefined()
  })

  it('does not import sessions with invalid datetime', () => {
    const header = 'datetime,brewingVessel,teaName,teaProducer,origin,year,purchaseLocation,dryLeaf,wetLeaf,additionalNotes'
    const data = 'not-a-date,Gaiwan,Test Tea,Test Producer,Test Origin,2005,Test Location,Test dry leaf notes,Test wet leaf notes,Test notes'
    const csvContent = `${header}\n${data}`

    const result = importFromCSV(csvContent)

    expect(result.sessions).toBeUndefined()
    expect(result.error).toBe(messages.CSV_IMPORT_ERROR)
  })

  it('keeps sessions with valid datetime', () => {
    const validSessionCSV = '2024-01-01T10:00,Gaiwan,Test Tea,Test Producer,Test Origin,2005,Test Location,Test dry leaf notes,Test wet leaf notes,Test notes'
    const invalidSessionCSV = 'not-a-date,Gaiwan,Test Tea,Test Producer,Test Origin,2005,Test Location,,,'

    const csvContent = `datetime,brewingVessel,teaName,teaProducer,origin,year,purchaseLocation,dryLeaf,wetLeaf,additionalNotes\n${validSessionCSV}\n${invalidSessionCSV}`

    const result = importFromCSV(csvContent)

    const expectedValidSession: Session = {
      datetime: '2024-01-01T10:00',
      brewingVessel: 'Gaiwan',
      teaName: 'Test Tea',
      teaProducer: 'Test Producer',
      origin: 'Test Origin',
      year: '2005',
      purchaseLocation: 'Test Location',
      dryLeaf: 'Test dry leaf notes',
      wetLeaf: 'Test wet leaf notes',
      additionalNotes: 'Test notes',
      steeps: [],
      customFields: []
    }

    expect(result.sessions).toEqual([expectedValidSession])
    expect(result.error).toEqual(messages.CSV_IMPORT_ERROR_PARTIAL)
  })

  it('handles empty CSV content', () => {
    const result = importFromCSV('')

    expect(result.sessions).toBeUndefined()
    expect(result.error).toBe(messages.CSV_IMPORT_ERROR)
  })

  it('handles CSV with missing required headers', () => {
    const csvContent = 'brewingVessel,teaProducer,origin\nGaiwan,Test Producer,Test Origin'

    const result = importFromCSV(csvContent)

    expect(result.sessions).toBeUndefined()
    expect(result.error).toBe(messages.CSV_IMPORT_ERROR)
  })

  it('handles CSV with only header row', () => {
    const csvContent = 'datetime,brewingVessel,teaName,teaProducer,origin,year,purchaseLocation,dryLeaf,wetLeaf,additionalNotes'

    const result = importFromCSV(csvContent)

    expect(result.sessions).toBeUndefined()
    expect(result.error).toBe(messages.CSV_IMPORT_ERROR)
  })

  it('initializes missing fields to empty string if static fields are missing', () => {
    const headerWithMissingYearField = 'datetime,brewingVessel,teaName,teaProducer,origin,purchaseLocation,dryLeaf,wetLeaf,additionalNotes'
    const data1 = '2024-01-01T10:00,Gaiwan,Dragon Well,Tea Company A,China,Local Tea Shop,Green flat leaves,Bright green expanded,Very refreshing'

    const result = importFromCSV(`${headerWithMissingYearField}\n${data1}`)

    expect(result.sessions).toEqual([
      {
        datetime: '2024-01-01T10:00',
        brewingVessel: 'Gaiwan',
        teaName: 'Dragon Well',
        year: '', // missing year field initialized to empty string
        teaProducer: 'Tea Company A',
        origin: 'China',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Green flat leaves',
        wetLeaf: 'Bright green expanded',
        additionalNotes: 'Very refreshing',
        steeps: [],
        customFields: []
      }
    ])
  })

  it('filters out empty steeps and custom fields during import', () => {
    const header = 'datetime,brewingVessel,teaName,teaProducer,origin,year,purchaseLocation,dryLeaf,wetLeaf,additionalNotes,steep-1,steep-2,steep-3,custom-water-temperature,custom-rating,custom-empty-field'
    const data1 = '2024-01-01T10:00,Gaiwan,Dragon Well,Tea Company A,China,2005,Local Tea Shop,Green flat leaves,Bright green expanded,Very refreshing,Wash,Fruity,Floral,80°C,9/10,'
    const data2 = '2024-01-02T14:30,Yixing Zisha Zhuni Shuiping 100ml,N/A,XiaGuan,Menghai - Yunnan,2005,Essence of Tea,Dark twisted leaves,Dark brown,Too smoky?,some value here,another value here,,100°C,8/10'
    const csvContent = `${header}\n${data1}\n${data2}`

    const result = importFromCSV(csvContent)

    const expectedSessions: Session[] = [
      {
        datetime: '2024-01-01T10:00',
        brewingVessel: 'Gaiwan',
        teaName: 'Dragon Well',
        teaProducer: 'Tea Company A',
        origin: 'China',
        year: '2005',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Green flat leaves',
        wetLeaf: 'Bright green expanded',
        additionalNotes: 'Very refreshing',
        steeps: [
          'Wash',
          'Fruity',
          'Floral'
        ],
        customFields: [
          {
            name: 'custom-water-temperature',
            value: '80°C'
          },
          {
            name: 'custom-rating',
            value: '9/10'
          }
        ]
      },
      {
        datetime: '2024-01-02T14:30',
        brewingVessel: 'Yixing Zisha Zhuni Shuiping 100ml',
        teaName: 'N/A',
        teaProducer: 'XiaGuan',
        origin: 'Menghai - Yunnan',
        year: '2005',
        purchaseLocation: 'Essence of Tea',
        dryLeaf: 'Dark twisted leaves',
        wetLeaf: 'Dark brown',
        additionalNotes: 'Too smoky?',
        steeps: [
          'some value here',
          'another value here'
          // empty steep-3 filtered out
        ],
        customFields: [
          {
            name: 'custom-water-temperature',
            value: '100°C'
          },
          {
            name: 'custom-rating',
            value: '8/10'
          }
        ]
      }
    ]

    expect(result.sessions).toEqual(expectedSessions)
    expect(result.error).toBeUndefined()
  })
})
