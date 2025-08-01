import { refs } from './refs'
import { state } from './state'
import { staticFields } from './constants'
import {
  isInput,
  isTextArea,
  returnValueWithDefault
} from './util'
import { type Session } from './types'
import {
  displaySuccessMessage,
  messages
} from './notification'
import { addSteepField } from './steep'
import { addCustomField } from './custom-field'
import { toLocalDatetimeString } from './util'
import { saveToLocalStorage } from './transport/local-storage'

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
    teaProducer: formData.get('teaProducer') as string,
    origin: formData.get('origin') as string,
    year: formData.get('year') as string,
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

    saveToLocalStorage(state.sessions)
    displaySuccessMessage(messages.SESSION_UPDATE_SUCCESS)
  } else {
    state.sessions.push(session)
    saveToLocalStorage(state.sessions)
    displaySuccessMessage(messages.SESSION_SAVE_SUCCESS)
  }

  resetSessionForm()
  renderSessions()

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
    if (isInput(el)) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false
      } else {
        el.value = ''
      }
    }

    if (isTextArea(el)) {
      el.value = ''
    }
  })

  setDefaultDateTime()

  steepsDiv.innerHTML = ''
  addSteepField('')

  customFieldsContainer.innerHTML = ''
}

export function setDefaultDateTime() {
  const input = form.elements.namedItem('datetime') as HTMLInputElement
  const now = new Date()
  input.value = toLocalDatetimeString(now)
}

export function renderSessions() {
  sessionList.innerHTML = ''

  state.sessions.forEach((sesh, index) => {
    const sessionCard = renderSessionCard(sesh, index)

    sessionList.appendChild(sessionCard)
  })
}

function renderSessionCard(session: Session, index: number) {
  const div = document.createElement('div')
  div.className = 'session-item'

  const sessionCard = document.createElement('div')
  sessionCard.className = 'session-card'

  const sessionSummary = document.createElement('div')
  sessionSummary.className = 'session-summary'

  const sessionSummaryHeader = document.createElement('div')
  sessionSummaryHeader.className = 'session-summary-header'

  const sessionSummaryDate = document.createElement('span')
  sessionSummaryDate.className = 'session-date'
  sessionSummaryDate.textContent = (session.datetime.split('T')[0]).replace(new RegExp(/-/g), '/') + ' – '

  const sessionSummaryTeaProducer = document.createElement('span')
  sessionSummaryTeaProducer.className = 'session-producer'
  sessionSummaryTeaProducer.textContent = session.teaProducer ? session.teaProducer + ' – ' : ''

  const sessionSummaryTeaName = document.createElement('span')
  sessionSummaryTeaName.className = 'session-name'
  sessionSummaryTeaName.textContent = session.teaName

  const toggleDetailsButton = document.createElement('button')
  toggleDetailsButton.textContent = 'Toggle Details'
  toggleDetailsButton.className = 'toggle-details-btn button-slim'
  toggleDetailsButton.addEventListener('click', () => {
    const detailsDiv = div.querySelector('.session-details')
    if (detailsDiv) {
      detailsDiv.classList.toggle('hidden')
    }
  })

  sessionSummaryHeader.appendChild(sessionSummaryDate)
  sessionSummaryHeader.appendChild(sessionSummaryTeaProducer)
  sessionSummaryHeader.appendChild(sessionSummaryTeaName)

  sessionSummary.appendChild(sessionSummaryHeader)
  sessionSummary.appendChild(toggleDetailsButton)

  sessionCard.appendChild(sessionSummary)

  // Details
  const sessionDetails = document.createElement('div')
  sessionDetails.className = 'session-details hidden'

  const sessionDateTime = document.createElement('p')
  const dateTime = new Date(session.datetime)
  const formattedDateTime = `${dateTime.getFullYear()}-${(dateTime.getMonth() + 1).toString().padStart(2, '0')}-${dateTime.getDate().toString().padStart(2, '0')} @ ${dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
  sessionDateTime.innerHTML = `<strong>Date & Time:</strong> ${formattedDateTime}`

  const teaName = document.createElement('p')
  teaName.innerHTML = `<strong>Tea Name:</strong> ${session.teaName}`

  const brewingVessel = document.createElement('p')
  brewingVessel.innerHTML = `<strong>Brewing Vessel:</strong> ${returnValueWithDefault(session.brewingVessel)}`

  const producer = document.createElement('p')
  producer.innerHTML = `<strong>Producer:</strong> ${returnValueWithDefault(session.teaProducer)}`

  const origin = document.createElement('p')
  origin.innerHTML = `<strong>Origin:</strong> ${returnValueWithDefault(session.origin)}`

  const year = document.createElement('p')
  year.innerHTML = `<strong>Year:</strong> ${returnValueWithDefault(session.year)}`

  const purchaseLocation = document.createElement('p')
  purchaseLocation.innerHTML = `<strong>Purchase Location:</strong> ${returnValueWithDefault(session.purchaseLocation)}`

  const dryLeaf = document.createElement('p')
  dryLeaf.innerHTML = `<strong>Dry Leaf:</strong> ${returnValueWithDefault(session.dryLeaf)}`

  const wetLeaf = document.createElement('p')
  wetLeaf.innerHTML = `<strong>Wet Leaf:</strong> ${returnValueWithDefault(session.wetLeaf)}`

  const additionalNotes = document.createElement('p')
  additionalNotes.innerHTML = `<strong>Additional Notes:</strong> ${returnValueWithDefault(session.additionalNotes)}`

  const steeps = document.createElement('div')
  steeps.className = 'steeps'

  session.steeps.forEach((steep, index) => {
    const steepElement = document.createElement('p')
    steepElement.innerHTML = `<strong>Steep ${index + 1}:</strong> ${steep}`
    steeps.appendChild(steepElement)
  })

  const customFields = document.createElement('div')
  customFields.className = 'custom-fields'

  session.customFields?.forEach((customField) => {
    const fieldName = customField.name
      .replace(/^custom-/, '')
      .replace(/-/g, ' ')
      .toLowerCase()
      .replace(/^./, char => char.toUpperCase())

    const customFieldElement = document.createElement('p')
    customFieldElement.innerHTML = `<strong>${fieldName}:</strong> ${customField.value}`
    customFields.appendChild(customFieldElement)
  })

  const sessionActions = document.createElement('div')
  sessionActions.className = 'session-actions'

  const editSessionButton = document.createElement('button')
  editSessionButton.textContent = 'Edit'
  editSessionButton.className = 'button-slim'
  editSessionButton.addEventListener('click', () => {
    startEditSession(index)
  })
  sessionActions.appendChild(editSessionButton)

  const deleteSessionButton = document.createElement('button')
  deleteSessionButton.textContent = 'Delete'
  deleteSessionButton.className = 'button-slim'
  deleteSessionButton.addEventListener('click', () => {
    deleteSession(index)
  })
  sessionActions.appendChild(deleteSessionButton)

  sessionDetails.appendChild(sessionDateTime)
  sessionDetails.appendChild(teaName)
  sessionDetails.appendChild(producer)
  sessionDetails.appendChild(origin)
  sessionDetails.appendChild(year)
  sessionDetails.appendChild(purchaseLocation)
  sessionDetails.appendChild(brewingVessel)
  sessionDetails.appendChild(dryLeaf)
  sessionDetails.appendChild(wetLeaf)
  sessionDetails.appendChild(additionalNotes)
  sessionDetails.appendChild(steeps)
  sessionDetails.appendChild(customFields)
  sessionDetails.appendChild(sessionActions)

  sessionCard.appendChild(sessionDetails)

  div.appendChild(sessionCard)

  return div
}

function startEditSession(index: number) {
  const session = state.sessions[index]
  state.editingIndex = index

  for (const field of staticFields) {
    const el = form.elements.namedItem(field)
    if (isInput(el) || isTextArea(el)) {
      el.value = session[field] || ''
    } else {
      console.warn(`Expected input element for '${field}', but got:`, el)
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

function deleteSession(index: number) {
  if (confirm(messages.DELETE_SESSION_CONFIRM)) {
    state.sessions.splice(index, 1)
    renderSessions()
  }
}
