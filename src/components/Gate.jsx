import { useEffect, useMemo, useRef, useState } from 'react'
import meta from '../content/meta.js'
import { gate as gateQuotes } from '../content/quotes.js'
import { byCode } from '../content/people.js'
import { pick } from '../lib/pick.js'

const LENGTH = 5

// The gate is shown before anyone is known, so nothing on this screen may
// name either of us — only the initials in the title. See quotes.js.
export default function Gate({ onEnter, status }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [opening, setOpening] = useState(false)
  const inputRef = useRef(null)
  const quote = useMemo(() => pick(gateQuotes), [])

  // Autofocus is deliberate: this is the only thing on the screen to do.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 700)
    return () => clearTimeout(t)
  }, [])

  function submit(value) {
    const person = byCode(value)
    if (person) {
      setError('')
      setOpening(true)
      // Let the last digit land before the screen leaves.
      setTimeout(() => onEnter(person), 620)
      return
    }
    setError('That is not one of our codes. Try again — take your time.')
    setShake(true)
    setTimeout(() => setShake(false), 520)
    setTimeout(() => setCode(''), 520)
  }

  function onChange(e) {
    const next = e.target.value.replace(/\D/g, '').slice(0, LENGTH)
    setCode(next)
    if (error) setError('')
    if (next.length === LENGTH) submit(next)
  }

  const digits = Array.from({ length: LENGTH }, (_, i) => code[i] || '')

  return (
    <div className={`gate${opening ? ' gate--opening' : ''}`}>
      <div className="shell gate__inner">
        <header className="gate__head">
          <h1 className="title rise rise-1">{meta.title}</h1>
          <p className="subtitle rise rise-2">{meta.subtitle}</p>
        </header>

        <p className="quote quote--centred gate__quote rise rise-3">{quote}</p>

        <form
          className={`gate__form rise rise-4${shake ? ' is-wrong' : ''}`}
          onSubmit={(e) => {
            e.preventDefault()
            if (code.length === LENGTH) submit(code)
          }}
        >
          <label className="sr-only" htmlFor="gate-code">
            Your five-digit code
          </label>
          <div
            className="code"
            onClick={() => inputRef.current?.focus()}
            aria-hidden="true"
          >
            {digits.map((d, i) => (
              <span
                key={i}
                className={`code__slot${d ? ' is-filled' : ''}${
                  i === code.length ? ' is-next' : ''
                }`}
              >
                <span className="code__dot">{d ? '•' : ''}</span>
              </span>
            ))}
          </div>
          <input
            id="gate-code"
            ref={inputRef}
            className="code__input"
            value={code}
            onChange={onChange}
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            pattern="[0-9]*"
            maxLength={LENGTH}
            aria-describedby={error ? 'gate-error' : undefined}
          />
          {error ? (
            <p className="error gate__error" id="gate-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="gate__hint tiny faint">Five digits.</p>
          )}
        </form>

        <footer className="gate__foot rise rise-5">
          {status === 'local' || status === 'error' ? (
            <p className="tiny faint gate__offline">
              Running on this device only — no database is reachable. Everything
              still works; it just will not travel to the other phone.
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  )
}
