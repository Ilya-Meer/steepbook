export function toLocalDatetimeString(date: Date) {
  const pad = (n: string | number) => String(n).padStart(2, '0')

  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

export function isInput(el: HTMLElement | null): el is HTMLInputElement {
  return el instanceof HTMLInputElement
}

export function isTextArea(el: HTMLElement | null): el is HTMLTextAreaElement {
  return el instanceof HTMLTextAreaElement
}

export function downloadFile({
  content,
  filename,
  type
}: {
  content: string,
  filename: string,
  type: 'csv' | 'json'
}) {
  const mimeTypes = {
    csv: 'text/csv',
    json: 'application/json'
  }
  const blob = new Blob([content], { type: mimeTypes[type] })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url) // Release memory
}
