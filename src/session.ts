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

export function setDefaultDateTime() {
  const input = form.elements.namedItem('datetime') as HTMLInputElement
  const now = new Date()
  input.value = toLocalDatetimeString(now)
}

function startEditSession(index: number) {
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

function deleteSession(index: number) {
  if (confirm('Are you sure you want to delete this session?')) {
    state.sessions.splice(index, 1)
    renderSessions()
  }
}

function renderSessions() {
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
  sessionSummaryDate.textContent = session.datetime.split('T')[0] + ' – '

  const sessionSummaryTeaBrand = document.createElement('span')
  sessionSummaryTeaBrand.className = 'session-brand'
  sessionSummaryTeaBrand.textContent = session.teaBrand + ' – '

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
  sessionSummaryHeader.appendChild(sessionSummaryTeaBrand)
  sessionSummaryHeader.appendChild(sessionSummaryTeaName)

  sessionSummary.appendChild(sessionSummaryHeader)
  sessionSummary.appendChild(toggleDetailsButton)

  sessionCard.appendChild(sessionSummary)

  // Details
  const sessionDetails = document.createElement('div')
  sessionDetails.className = 'session-details hidden'

  const sessionDateTime = document.createElement('p')
  const dateTime = new Date(session.datetime)
  const formattedDateTime = `${dateTime.getFullYear()}-${(dateTime.getMonth() + 1).toString().padStart(2, '0')}-${dateTime.getDate().toString().padStart(2, '0')} @ ${dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  sessionDateTime.innerHTML = `<strong>Date & Time:</strong> ${formattedDateTime}`

  const brewingVessel = document.createElement('p')
  brewingVessel.innerHTML = `<strong>Brewing Vessel:</strong> ${session.brewingVessel}`

  const teaName = document.createElement('p')
  teaName.innerHTML = `<strong>Tea Name:</strong> ${session.teaName}`

  const brand = document.createElement('p')
  brand.innerHTML = `<strong>Brand:</strong> ${session.teaBrand}`

  const purchaseLocation = document.createElement('p')
  purchaseLocation.innerHTML = `<strong>Purchase Location:</strong> ${session.purchaseLocation}`

  const dryLeaf = document.createElement('p')
  dryLeaf.innerHTML = `<strong>Dry Leaf:</strong> ${session.dryLeaf}`

  const wetLeaf = document.createElement('p')
  wetLeaf.innerHTML = `<strong>Wet Leaf:</strong> ${session.wetLeaf}`

  const additionalNotes = document.createElement('p')
  additionalNotes.innerHTML = `<strong>Additional Notes:</strong> ${session.additionalNotes}`

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
  sessionDetails.appendChild(brand)
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
