import { useCallback, useEffect, useMemo, useState } from 'react'
import TheSign from './TheSign.jsx'
import Interstitial from './Interstitial.jsx'
import meta from '../content/meta.js'
import people, { otherThan } from '../content/people.js'
import { sign as signQuotes, bloom as bloomLines, waiting as waitingLines } from '../content/quotes.js'
import { pick, pickBy } from '../lib/pick.js'
import { signToday } from '../lib/records.js'
import { useDbValue } from '../hooks/useDb.js'
import { summarise } from '../lib/chronicle.js'
import { today, formatDayLong, timeAgo } from '../lib/day.js'

const [LEFT_PERSON, RIGHT_PERSON] = people

export default function SignScreen({ seat, onBusy, onGo }) {
  const [days, daysLoaded] = useDbValue('days')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [failed, setFailed] = useState('')

  const day = today()
  const record = (days && days[day]) || null
  const stats = useMemo(() => summarise(days), [days])

  const mine = record?.[seat.id] || null
  const other = otherThan(seat.id)
  const theirs = other ? record?.[other.id] || null : null

  const leftSigned = Boolean(record?.[LEFT_PERSON.id])
  const rightSigned = Boolean(record?.[RIGHT_PERSON.id])
  const bloomed = leftSigned && rightSigned

  // Both the quote and the bloom line are chosen from the day, so they stay
  // the same all day on both phones instead of reshuffling on every render.
  const quote = useMemo(() => pickBy(signQuotes, day), [day])
  const bloomLine = useMemo(() => pickBy(bloomLines, day), [day])
  const waitLine = useMemo(() => pick(waitingLines), [])

  // Keep the note box in step with what is actually stored for me today.
  useEffect(() => {
    setNote(mine?.note || '')
  }, [mine?.note])

  // seat MUST be a dependency: a callback that closed over the first person to
  // sign in would keep writing that person's signature after a seat change.
  const doSign = useCallback(async () => {
    if (pending) return
    setPending(true)
    setFailed('')
    onBusy?.(true)
    try {
      await signToday(seat, note)
      setNoteOpen(false)
    } catch {
      setFailed('That did not save. Check your connection and try once more.')
    } finally {
      setPending(false)
      onBusy?.(false)
    }
  }, [seat, note, pending, onBusy])

  const status = (() => {
    if (!daysLoaded) return <span className="faint">…</span>
    if (bloomed) return <>You have both signed today.</>
    if (mine && other) return <>Waiting for <strong>{other.name}</strong>.</>
    if (theirs && other)
      return <><strong>{other.name}</strong> has signed. Your half is still quiet.</>
    return <>Neither of you has signed today.</>
  })()

  return (
    <section className="sign-screen">
      <div className={`sign-stage${bloomed ? ' is-bloomed' : ''}`}>
        <TheSign
          leftSigned={leftSigned}
          rightSigned={rightSigned}
          bloomed={bloomed}
          pending={pending}
          disabled={Boolean(mine) || pending}
          onSign={mine ? undefined : doSign}
          label={mine ? 'You have signed today' : meta.signPrompt}
        />
      </div>

      <p className="sign-status">{status}</p>

      {!mine ? (
        <p className="sign-prompt">{pending ? 'signing…' : meta.signPrompt}</p>
      ) : (
        <p className="sign-prompt">{formatDayLong(day)}</p>
      )}

      <div className="sign-halves">
        <div className={`sign-half${leftSigned ? ' is-signed' : ''}`}>
          {LEFT_PERSON.name}
          <small>{leftSigned ? 'signed' : 'not yet'}</small>
        </div>
        <span className="sign-halves__tie" aria-hidden="true" />
        <div className={`sign-half${rightSigned ? ' is-signed' : ''}`}>
          {RIGHT_PERSON.name}
          <small>{rightSigned ? 'signed' : 'not yet'}</small>
        </div>
      </div>

      {bloomed ? <p className="bloom-line">{bloomLine}</p> : null}

      {/* the optional line left with a signature */}
      {!mine ? (
        <div className="sign-note">
          {noteOpen ? (
            <label className="field">
              <span className="field__label">{meta.signNoteLabel}</span>
              <textarea
                className="textarea sign-note__box"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 240))}
                placeholder={meta.signNotePlaceholder}
                rows={2}
              />
            </label>
          ) : (
            <button
              type="button"
              className="btn btn--ghost sign-note__open"
              onClick={() => setNoteOpen(true)}
            >
              Leave a line with it
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary btn--wide sign-note__go"
            onClick={doSign}
            disabled={pending}
          >
            {pending ? 'Signing…' : 'Sign today'}
          </button>
        </div>
      ) : null}

      {failed ? <p className="error">{failed}</p> : null}

      {/* the lines we each left today */}
      {(mine?.note || theirs?.note) && (
        <div className="sign-note__lines">
          {people.map((p) => {
            const rec = record?.[p.id]
            if (!rec?.note) return null
            return (
              <div className="sign-line" key={p.id}>
                <span className="sign-line__who">{p.name}</span>
                <span className="sign-line__text">{rec.note}</span>
              </div>
            )
          })}
        </div>
      )}

      {!bloomed && (mine || theirs) ? (
        <p className="quote quote--centred sign-screen__wait">{waitLine}</p>
      ) : null}

      <Interstitial />

      <p className="quote quote--centred sign-screen__quote">{quote}</p>

      <div className="tally">
        <div className="tally__item">
          <span className="tally__n">{stats.total}</span>
          <span className="tally__l">
            day{stats.total === 1 ? '' : 's'} you both signed
          </span>
        </div>
        <div className="tally__item">
          <span className="tally__n">{stats.currentStreak}</span>
          <span className="tally__l">in a row, right now</span>
        </div>
      </div>

      {theirs ? (
        <p className="tiny faint centre sign-screen__when">
          {other.name} signed {timeAgo(theirs.at)}.
        </p>
      ) : null}

      <nav className="nav">
        <button type="button" className="btn btn--wide" onClick={() => onGo('chronicle')}>
          {meta.chronicleTitle}
        </button>
        <button type="button" className="btn btn--wide" onClick={() => onGo('poems')}>
          {meta.poetryLabel}
        </button>
      </nav>
    </section>
  )
}
