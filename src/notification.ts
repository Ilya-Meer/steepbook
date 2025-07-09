import { refs } from './refs'

const {
  successMessageContainer,
  failureMessageContainer,
} = refs

export const messages = {
  SESSION_SAVE_SUCCESS: 'Session saved successfully!',
  SESSION_UPDATE_SUCCESS: 'Session updated successfully!',
  SESSION_SAVE_ERROR: 'Error saving session',

  DELETE_SESSION_CONFIRM: 'Are you sure you want to delete this session?',

  LOCAL_STORAGE_LOAD_ERROR: 'Error loading sessions from local storage.',

  JSON_EXPORT_SUCCESS: 'Sessions exported successfully!',
  JSON_IMPORT_SUCCESS: 'Sessions imported successfully!',

  JSON_EXPORT_ERROR: 'Error exporting sessions to JSON.',
  JSON_IMPORT_ERROR: 'Error importing sessions from JSON.',
} as const

export function displaySuccessMessage(message: string) {
  successMessageContainer.textContent = message
  successMessageContainer.classList.remove('hidden')
  setTimeout(() => {
    clearSuccessMessage()
  }, 1500)
}

export function displayFailureMessage(message: string) {
  failureMessageContainer.textContent = message
  failureMessageContainer.classList.remove('hidden')
  setTimeout(() => {
    clearFailureMessage()
  }, 1500)
}

export function clearSuccessMessage() {
  successMessageContainer.textContent = ''
  successMessageContainer.classList.add('hidden')
}

export function clearFailureMessage() {
  failureMessageContainer.textContent = ''
  failureMessageContainer.classList.add('hidden')
}


