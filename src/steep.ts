import { refs } from './refs'
import { state } from './state'

export function addSteepField(initialValue = '') {
  const steeps = document.querySelectorAll('.steep-field')
  state.steepCount = steeps.length + 1

  const id = `steep-${state.steepCount}-content`

  const wrapper = document.createElement('div')
  wrapper.className = 'steep-field'

  const label = document.createElement('label')
  label.htmlFor = id

  const labelHeader = document.createElement('div')
  labelHeader.className = 'steep-label-header'

  const labelText = document.createElement('span')
  labelText.textContent = `Steep ${state.steepCount}:`

  const textarea = document.createElement('textarea')

  textarea.id = id
  textarea.name = `steep-${state.steepCount}`
  textarea.value = initialValue

  const removeBtn = document.createElement('button')
  removeBtn.type = 'button'
  removeBtn.textContent = '✕'
  removeBtn.className = 'remove-steep-btn button-slim'
  removeBtn.title = 'Remove this steep'
  removeBtn.ariaLabel = 'Remove this steep'

  removeBtn.addEventListener('click', () => {
    wrapper.remove()
    renumberSteeps()
  })

  label.appendChild(labelText)
  labelHeader.appendChild(label)
  labelHeader.appendChild(removeBtn)
  wrapper.appendChild(labelHeader)
  wrapper.appendChild(textarea)
  refs.steepsDiv.appendChild(wrapper)
}

function renumberSteeps() {
  const wrappers = refs.steepsDiv.querySelectorAll('.steep-field')
  wrappers.forEach((wrapper, index) => {
    const label = wrapper.querySelector('label')
    const textarea = wrapper.querySelector('textarea')

    const number = index + 1
    label.querySelector('span').textContent = `Steep ${number}:` // Update label text
    textarea.name = `steep-${number}` // Update name attribute
  })
}

