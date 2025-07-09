import { messages } from '../notification.ts'
import type { Session } from '../types'

const localStorageKey = 'steepbook_sessions'

export function saveToLocalStorage(value: Session[]): typeof messages[keyof typeof messages] | undefined {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(localStorageKey, serializedValue)
    return
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    return messages.SESSION_SAVE_ERROR
  }
}

export function loadFromLocalStorage(): {
  sessions?: Session[],
  error?: typeof messages[keyof typeof messages]
} {
  try {
    const json = localStorage.getItem(localStorageKey)
    const storedSessions: Session[] = json ? JSON.parse(json) : []
    return { sessions: storedSessions }
  } catch (error) {
    console.error('Error retrieving sessions from localStorage:', error)
    return { error: messages.LOCAL_STORAGE_LOAD_ERROR }
  }
}

