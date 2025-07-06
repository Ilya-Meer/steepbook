import './css/reset.css'
import './css/style.css'
import { refs } from './refs'
import { addSteepField } from './steep'
import { addCustomField } from './custom-field'
import {
  saveSession,
  resetSessionForm,
  setDefaultDateTime
} from './session'

const {
  form,
  resetBtn,

  steepsDiv,
  addSteepBtn,

  addCustomFieldBtn
} = refs

init()

function init() {
  steepsDiv.innerHTML = ''
  addSteepField('') // start with one steep field
  setDefaultDateTime()

  addSteepBtn.addEventListener('click', () => addSteepField(''))
  addCustomFieldBtn.addEventListener('click', () => addCustomField(null, ''))

  form.addEventListener('submit', saveSession)

  resetBtn.addEventListener('click', resetSessionForm)
}
