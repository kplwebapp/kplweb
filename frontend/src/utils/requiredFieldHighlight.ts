/**
 * Site-wide: when a form is submitted with required fields left empty, outline them in red
 * (styles in index.css), replace the browser's tooltip, and take the user to the first one.
 * Applies to every <form> that relies on the browser's checks, i.e. fields marked `required`
 * and no `noValidate`. The highlight clears per field as soon as it becomes valid.
 */
const SHOW_INVALID = 'data-show-invalid'

export function installRequiredFieldHighlight() {
  let focusedThisAttempt = false

  document.addEventListener(
    'invalid',
    (event) => {
      const field = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      const form = field.form
      if (!form) return
      event.preventDefault()
      form.setAttribute(SHOW_INVALID, '')

      // The browser fires one event per invalid field in a single task; only the first gets focus.
      if (focusedThisAttempt) return
      focusedThisAttempt = true
      setTimeout(() => { focusedThisAttempt = false })
      field.scrollIntoView({ block: 'center' })
      field.focus({ preventScroll: true })
    },
    true,
  )

  // A successful submit means everything is valid; forget the attempt so a reset form starts clean.
  document.addEventListener('submit', (event) => (event.target as HTMLFormElement).removeAttribute(SHOW_INVALID), true)
}
