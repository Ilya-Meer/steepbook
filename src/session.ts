import { refs } from './refs'
import { state } from './state'
import {
  isInput,
  isTextArea
} from './util'
import { type Session } from './types'
import { displaySuccessMessage } from './notification'
import { addSteepField } from './steep'
import { addCustomField } from './custom-field'
import { toLocalDatetimeString } from './util'

const {
  form,
  resetBtn,
  sessionList,
  customFieldsContainer,
  steepsDiv
} = refs

export function saveSession(e: SubmitEvent) {
  e.preventDefault()
  const formData = new FormData(form)
  const session: Session = {
    datetime: formData.get('datetime') as string,
    brewingVessel: formData.get('brewingVessel') as string,
    teaName: formData.get('teaName') as string,
    teaBrand: formData.get('teaBrand') as string,
    purchaseLocation: formData.get('purchaseLocation') as string,
    dryLeaf: formData.get('dryLeaf') as string,
    wetLeaf: formData.get('wetLeaf') as string,
    additionalNotes: formData.get('additionalNotes') as string,
    steeps: [],
    customFields: []
  }

  for (const [
    key,
    value
  ] of formData.entries()) {
    if (typeof value !== 'string') {
      continue
    }

    if (key.startsWith('steep-')) {
      session.steeps.push(value)
    } else if (key.startsWith('custom-')) {
      session.customFields.push({
        name: key,
        value
      })
    }
  }

  if (state.editingIndex !== null) {
    state.sessions[state.editingIndex] = session
    state.editingIndex = null
    form.querySelector('button[type="submit"]').textContent = 'Done'
    resetBtn.textContent = 'Reset'

    displaySuccessMessage('Session updated successfully!')
  } else {
    state.sessions.push(session)
    displaySuccessMessage('Session saved successfully!')
  }

  resetSessionForm()
  renderSessions()

  scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  })
}

export function startEditSession(index: number) {
  const session = state.sessions[index]
  state.editingIndex = index

  const fields = [
    [
      'datetime',
      session.datetime
    ],
    [
      'teaName',
      session.teaName
    ],
    [
      'teaBrand',
      session.teaBrand
    ],
    [
      'purchaseLocation',
      session.purchaseLocation
    ],
    [
      'dryLeaf',
      session.dryLeaf
    ],
    [
      'wetLeaf',
      session.wetLeaf
    ],
  ] as const

  for (const [
    name,
    value
  ] of fields) {
    const el = form.elements.namedItem(name)
    if (isInput(el) || isTextArea(el)) {
      el.value = value
    } else {
      console.warn(`Expected input element for '${name}', but got:`, el)
    }
  }

  // Clear steeps
  steepsDiv.innerHTML = ''
  session.steeps.forEach((text) => {
    addSteepField(text)
  })

  // Clear and add custom fields
  customFieldsContainer.innerHTML = ''
  session.customFields?.forEach(({
    name,
    value
  }) => {
    const labelName = name.replace(/^custom-/, '').replace(/-/g, ' ')
    addCustomField(labelName, value)
  })

  // Update form UI
  form.querySelector('button[type="submit"]').textContent = 'Update Session'
  resetBtn.textContent = 'Cancel'

  scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  })
}

export function resetSessionForm() {
  state.editingIndex = null
  form.querySelector('button[type="submit"]').textContent = 'Save Session'
  resetBtn.textContent = 'Reset'

  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false
      } else {
        el.value = ''
      }
    }
  })

  setDefaultDateTime()

  steepsDiv.innerHTML = ''
  addSteepField('')

  customFieldsContainer.innerHTML = ''
}

export function renderSessions() {
  sessionList.innerHTML = ''
  state.sessions.forEach((sesh, index) => {
    const div = document.createElement('div')
    div.className = 'session-item'
    div.textContent = `${sesh.datetime} – ${sesh.teaName}`

    const editBtn = document.createElement('button')
    editBtn.textContent = 'Edit'
    editBtn.className = 'edit-session-btn secondary-button'
    editBtn.addEventListener('click', () => startEditSession(index))

    div.appendChild(editBtn)
    sessionList.appendChild(div)
  })
}

export function setDefaultDateTime() {
  const input = form.elements.namedItem('datetime') as HTMLInputElement
  const now = new Date()
  input.value = toLocalDatetimeString(now)
}
