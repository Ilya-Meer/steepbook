import {
  expect,
  it,
  describe,
  vi,
  beforeEach
} from 'vitest'
import type { Session } from '../types'
import { downloadFile } from '../util'
import { exportToCSV } from './csv'

vi.mock('../util', () => ({ downloadFile: vi.fn() }))
vi.mock('../notification', () => ({}))
vi.mock('../state', () => ({
  state: {
    sessions: []
  }
}))

import { state } from '../state'

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
    const lines = csvContent.split('\n')
    const headerRow = lines[0].split(',')
    const dataRows = lines.slice(1).map(line => line.split(','))

    // Verify header includes standard fields
    expect(headerRow).toContain('datetime')
    expect(headerRow).toContain('brewingVessel')
    expect(headerRow).toContain('teaName')
    expect(headerRow).toContain('teaProducer')
    expect(headerRow).toContain('origin')
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
  it.skip('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3)
  })
})
