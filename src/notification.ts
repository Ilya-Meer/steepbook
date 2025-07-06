import { refs } from './refs'

const {
  successMessageContainer,
  failureMessageContainer,
} = refs

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


