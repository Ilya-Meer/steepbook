import './css/reset.css'
import './css/style.css'
import { refs } from './refs'
import { addSteepField } from './steep'
import { addCustomField } from './custom-field'
import { state } from './state'
import {
  loadFromLocalStorage,
  exportToJSON
} from './transport'

import {
  saveSession,
  resetSessionForm,
  setDefaultDateTime,
  renderSessions
} from './session'
import { displayFailureMessage } from './notification'

const {
  form,
  resetBtn,

  steepsDiv,
  addSteepBtn,

  addCustomFieldBtn,

  jsonExportButton
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

  jsonExportButton.addEventListener('click', exportToJSON)
}
