import { type SessionForm } from './types'

export const refs = {
  sessionList: document.getElementById('session-list'),
  form: document.getElementById('new-session-form') as SessionForm,
  resetBtn: document.getElementById('reset-session'),

  steepsDiv: document.getElementById('steeps'),
  addSteepBtn: document.getElementById('add-steep'),

  customFieldsContainer: document.getElementById('custom-fields'),
  addCustomFieldBtn: document.getElementById('add-custom-field'),

  additionalNotes: document.getElementById('additional-notes'),

  successMessageContainer: document.getElementById('success-message-container'),
  failureMessageContainer: document.getElementById('failure-message-container')
}
