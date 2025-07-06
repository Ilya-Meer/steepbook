import { refs } from './refs'

export function addCustomField(labelName: string | null = null, initialValue = '') {
  if (!labelName) {
    labelName = prompt('Enter custom field name:')
    if (!labelName) return
  }

  const fieldName = `custom-${labelName.toLowerCase().replace(/\s+/g, '-')}`

  const wrapper = document.createElement('div')
  wrapper.className = 'custom-field'

  const label = document.createElement('label')
  label.htmlFor = fieldName

  const labelHeader = document.createElement('div')
  labelHeader.className = 'custom-field-label-header'

  const labelText = document.createElement('span')
  labelText.textContent = `${labelName}:`

  const removeBtn = document.createElement('button')
  removeBtn.type = 'button'
  removeBtn.textContent = '✕'
  removeBtn.className = 'remove-steep-btn'
  removeBtn.title = 'Remove this field'
  removeBtn.ariaLabel = 'Remove this field'

  removeBtn.addEventListener('click', () => {
    wrapper.remove()
  })

  const textarea = document.createElement('textarea')
  textarea.id = fieldName
  textarea.name = fieldName
  textarea.rows = 1
  textarea.value = initialValue

  label.appendChild(labelText)
  labelHeader.appendChild(label)
  labelHeader.appendChild(removeBtn)
  wrapper.appendChild(labelHeader)
  wrapper.appendChild(textarea)
  refs.customFieldsContainer.appendChild(wrapper)
}
