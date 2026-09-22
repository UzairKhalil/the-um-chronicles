import { useEffect, useRef, useState } from 'react'
import Glyph from './Glyph.jsx'

/**
 * Put text on the clipboard. The Clipboard API needs a secure context (the
 * live site is https) and, on some browsers, a user gesture; the old
 * execCommand route covers anything that refuses.
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the old way */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/**
 * A copy icon for a card. Anyone may use it — partners and guests alike. It
 * copies exactly the text the card is showing, and nothing else: no meaning
 * line, and never a reference (there are none, by the owner's choice).
 */
export default function CopyButton({ getText, label = 'Copy' }) {
  const [state, setState] = useState('idle') // idle | done | failed
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function onClick() {
    const ok = await copyText(getText())
    setState(ok ? 'done' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  return (
    <button
      type="button"
      className={`copy-btn${state === 'done' ? ' is-done' : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Glyph name={state === 'done' ? 'check' : 'copy'} size={16} />
      <span className="copy-btn__status" aria-live="polite">
        {state === 'done' ? 'Copied' : state === 'failed' ? 'Could not copy' : ''}
      </span>
    </button>
  )
}
