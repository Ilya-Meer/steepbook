import { type Session } from './types'

export const state: {
  sessions: Session[]
  editingIndex: number | null
  steepCount: number
} = {
  sessions: [],
  editingIndex: null,
  steepCount: 0
}

