import { refs } from './refs'

const {
  successMessageContainer,
  failureMessageContainer,
} = refs

export const messages = {
  SESSION_SAVE_SUCCESS: 'Session saved successfully!',
  SESSION_UPDATE_SUCCESS: 'Session updated successfully!',
  SESSION_SAVE_ERROR: 'Error saving sessions to local storage.',

  IMPORT_SESSION_CONFIRM: 'Imported sessions will overwrite current saved sessions. Continue?',
  DELETE_SESSION_CONFIRM: 'Are you sure you want to delete this session?',

  LOCAL_STORAGE_LOAD_ERROR: 'Error loading sessions from local storage.',

  SESSION_IMPORT_SUCCESS: 'Sessions imported successfully!',

  JSON_EXPORT_ERROR: 'Error exporting sessions to JSON.',
  JSON_IMPORT_ERROR: 'Error importing sessions from JSON.',
  JSON_IMPORT_ERROR_PARTIAL: 'Some invalid sessions could not be imported from JSON.',

  CSV_EXPORT_ERROR: 'Error exporting sessions to CSV.',
  CSV_IMPORT_ERROR: 'Error importing sessions from CSV.',
  CSV_IMPORT_ERROR_PARTIAL: 'Some invalid sessions could not be imported from CSV.',
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


