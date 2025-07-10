import {
  expect,
  it,
  describe,
  vi,
  beforeEach
} from 'vitest'
import type { Session } from '../types'
import { downloadFile } from '../util'
import { exportToJSON } from './json'

vi.mock('../util', () => ({ downloadFile: vi.fn() }))
vi.mock('../notification', () => ({}))
vi.mock('../state', () => ({
  state: {
    sessions: []
  }
}))

import { state } from '../state'

describe('Export to JSON', () => {
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
            // Test filtering empty custom fields
            name: 'Empty Field',
            value: ''
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

    exportToJSON()

    expect(downloadFile).toHaveBeenCalledTimes(1)

    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    expect(callArgs).toMatchObject({
      filename: 'steepbook_sessions.json',
      type: 'json'
    })

    // Parse the JSON content to verify structure
    const jsonContent = JSON.parse(callArgs.content)

    expect(jsonContent).toHaveLength(2)

    // Verify first session data
    const firstSession = jsonContent[0]
    expect(firstSession.datetime).toBe('2024-01-01T10:00:00Z')
    expect(firstSession.brewingVessel).toBe('Gaiwan')
    expect(firstSession.teaName).toBe('7542')
    expect(firstSession.teaProducer).toBe('Dayi')
    expect(firstSession.origin).toBe('Menghai Yunnan')
    expect(firstSession.purchaseLocation).toBe('Local Tea Shop')
    expect(firstSession.dryLeaf).toBe('Dark brown; slightly sweet aroma')
    expect(firstSession.wetLeaf).toBe('Leather and tobacco')
    expect(firstSession.additionalNotes).toBe('Very refreshing')

    // Verify steeps filtering (empty strings should be filtered out)
    expect(firstSession.steeps).toEqual([
      'Wash',
      'Fruity',
      'Floral'
    ])
    expect(firstSession.steeps).not.toContain('')

    // Verify custom fields filtering (empty values should be filtered out)
    expect(firstSession.customFields).toHaveLength(2)
    expect(firstSession.customFields).toEqual([
      {
        name: 'Water Temperature',
        value: '100'
      },
      {
        name: 'Rating',
        value: '9/10'
      }
    ])
    expect(firstSession.customFields).not.toContainEqual({
      name: 'Empty Field',
      value: ''
    })

    // Verify second session data
    const secondSession = jsonContent[1]
    expect(secondSession.datetime).toBe('2024-01-02T14:30:00Z')
    expect(secondSession.brewingVessel).toBe('Yixing Zisha Zhuni Shuiping 100ml')
    expect(secondSession.teaName).toBe('N/A')
    expect(secondSession.teaProducer).toBe('XiaGuan')
    expect(secondSession.origin).toBe('Menghai - Yunnan')
    expect(secondSession.purchaseLocation).toBe('Essence of Tea')
    expect(secondSession.dryLeaf).toBe('Dark twisted leaves')
    expect(secondSession.wetLeaf).toBe('Dark brown')
    expect(secondSession.additionalNotes).toBe('Too smoky?')

    // Verify steeps for second session
    expect(secondSession.steeps).toEqual([
      'some value here',
      'another value here'
    ])

    // Verify custom fields for second session
    expect(secondSession.customFields).toHaveLength(3)
    expect(secondSession.customFields).toEqual([
      {
        name: 'Water Temperature',
        value: '100°C'
      },
      {
        name: 'Tea Pet',
        value: 'Lord GuanYu'
      },
      {
        name: 'Rating',
        value: '8/10'
      }
    ])

    // Verify JSON formatting (should be pretty-printed with 2 spaces)
    expect(callArgs.content).toContain('  ')
    expect(callArgs.content).toMatch(/\n\s+/)
  })

  it('handles empty sessions array', () => {
    vi.mocked(state).sessions = []

    exportToJSON()

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    // Should have empty array
    const jsonContent = JSON.parse(callArgs.content)
    expect(jsonContent).toEqual([])
    expect(jsonContent).toHaveLength(0)
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

    exportToJSON()

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    const jsonContent = JSON.parse(callArgs.content)
    expect(jsonContent).toHaveLength(1)

    const session = jsonContent[0]
    expect(session.steeps).toEqual([])
    expect(session.customFields).toEqual([])
  })

  it('handles sessions with only empty steeps and custom fields', () => {
    const mockSessions: Session[] = [
      {
        datetime: '2024-01-01T10:00:00Z',
        brewingVessel: 'Gaiwan',
        teaName: 'Dragon Well',
        teaProducer: 'Tea Company A',
        origin: 'China',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Green, flat leaves',
        wetLeaf: 'Bright green, expanded',
        additionalNotes: 'Very refreshing',
        steeps: [
          '',
          '',
          ''
        ], // Only empty steeps
        customFields: [
          {
            name: 'Empty Field 1',
            value: ''
          },
          {
            name: 'Empty Field 2',
            value: ''
          }
        ] // Only empty custom fields
      }
    ]

    vi.mocked(state).sessions = mockSessions

    exportToJSON()

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    const jsonContent = JSON.parse(callArgs.content)
    expect(jsonContent).toHaveLength(1)

    const session = jsonContent[0]
    // All empty steeps and custom fields should be filtered out
    expect(session.steeps).toEqual([])
    expect(session.customFields).toEqual([])
  })

  it('preserves mixed empty and non-empty values correctly', () => {
    const mockSessions: Session[] = [
      {
        datetime: '2024-01-01T10:00:00Z',
        brewingVessel: 'Gaiwan',
        teaName: 'Dragon Well',
        teaProducer: 'Tea Company A',
        origin: 'China',
        purchaseLocation: 'Local Tea Shop',
        dryLeaf: 'Green, flat leaves',
        wetLeaf: 'Bright green, expanded',
        additionalNotes: 'Very refreshing',
        steeps: [
          'Wash',
          '',
          'Floral',
          ''
        ], // Mixed empty and non-empty
        customFields: [
          {
            name: 'Water Temperature',
            value: '80°C'
          },
          {
            name: 'Empty Field',
            value: ''
          },
          {
            name: 'Rating',
            value: '9/10'
          },
          {
            name: 'Another Empty',
            value: ''
          }
        ]
      }
    ]

    vi.mocked(state).sessions = mockSessions

    exportToJSON()

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(downloadFile).mock.calls[0][0]

    const jsonContent = JSON.parse(callArgs.content)
    const session = jsonContent[0]

    // Should only keep non-empty steeps
    expect(session.steeps).toEqual([
      'Wash',
      'Floral'
    ])

    // Should only keep non-empty custom fields
    expect(session.customFields).toEqual([
      {
        name: 'Water Temperature',
        value: '80°C'
      },
      {
        name: 'Rating',
        value: '9/10'
      }
    ])
  })
})

describe('Import from JSON', () => {
  it.skip('is not implemented yet', () => {
    // Placeholder for future implementation
  })
})
