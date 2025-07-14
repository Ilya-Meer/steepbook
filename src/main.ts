import './css/reset.css'
import './css/style.css'
import { refs } from './refs'
import { addSteepField } from './steep'
import { addCustomField } from './custom-field'
import { state } from './state'
import {
  loadFromLocalStorage,
  exportToJSON,
  exportToCSV,
  importFromJSON,
  importFromCSV,
  saveToLocalStorage
} from './transport'

import {
  saveSession,
  resetSessionForm,
  setDefaultDateTime,
  renderSessions
} from './session'
import {
  displayFailureMessage,
  displaySuccessMessage,
  messages
} from './notification'

const {
  form,
  resetBtn,

  steepsDiv,
  addSteepBtn,

  addCustomFieldBtn,

  csvExportButton,
  jsonExportButton,
  csvImportInputLabel,
  jsonImportInputLabel
} = refs

init()

function init() {
  // hydrate past session list with stored sessions
  const {
    sessions,
    error
  } = loadFromLocalStorage()

  if (typeof error === 'string') {
    displayFailureMessage(error)
  }

  state.sessions = sessions || []
  renderSessions()

  steepsDiv.innerHTML = ''
  addSteepField('') // start with one steep field
  setDefaultDateTime()

  addSteepBtn.addEventListener('click', () => addSteepField(''))
  addCustomFieldBtn.addEventListener('click', () => addCustomField(null, ''))

  form.addEventListener('submit', saveSession)

  resetBtn.addEventListener('click', resetSessionForm)

  csvExportButton.addEventListener('click', exportToCSV)
  jsonExportButton.addEventListener('click', exportToJSON)

  csvImportInputLabel.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files[0]
    if (!file) {
      return
    }
    readFile({
      file,
      type: 'csv'
    });
    (csvImportInputLabel as HTMLInputElement).value = ''
  })

  jsonImportInputLabel.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files[0]
    if (!file) {
      return
    }
    readFile({
      file,
      type: 'json'
    });
    (jsonImportInputLabel as HTMLInputElement).value = ''
  })
}

function readFile({
  file,
  type
}: {
  file: File
  type: 'csv' | 'json'
}): void {
  const shouldImport = confirm(messages.IMPORT_SESSION_CONFIRM)
  if (!shouldImport) {
    return
  }

  const importFuncs: Record<string, (contents: string) => ReturnType<typeof importFromCSV> | ReturnType<typeof importFromJSON>> = {
    csv: importFromCSV,
    json: importFromJSON
  }

  const reader = new FileReader()
  reader.onload = (e) => importFile(e, importFuncs[type])
  reader.readAsText(file)
}

export function importFile (e: ProgressEvent<FileReader>, importFunc: (contents: string) => ReturnType<typeof importFromCSV> | ReturnType<typeof importFromJSON>) {
  const contents = String(e.target.result)
  const importResult = importFunc(contents)
  if (importResult.error === messages.JSON_IMPORT_ERROR || importResult.error === messages.CSV_IMPORT_ERROR) {
    displayFailureMessage(importResult.error)
    return
  }

  if (importResult.error === messages.JSON_IMPORT_ERROR_PARTIAL || importResult.error === messages.CSV_IMPORT_ERROR_PARTIAL) {
    displayFailureMessage(importResult.error)
  }

  if (importResult.error == null) {
    displaySuccessMessage(messages.SESSION_IMPORT_SUCCESS)
  }

  state.sessions = importResult.sessions || []
  renderSessions()

  const saveError = saveToLocalStorage(importResult.sessions)
  if (saveError != null) {
    displayFailureMessage(saveError)
  }
}
