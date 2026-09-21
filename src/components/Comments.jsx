import { useCallback, useEffect, useState } from 'react'
import Reactions from './Reactions.jsx'
import {
  addComment,
  deleteComment,
  validateComment,
  guestHasCommented,
} from '../lib/records.js'
import { useDbValue, toListDesc } from '../hooks/useDb.js'
import { timeAgo, formatStamp } from '../lib/day.js'

export default function Comments({ itemId, seat, title = 'Comments' }) {
  const [raw] = useDbValue(`comments/${itemId}`)
  const [name, setName] = useState(seat.name)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)

  // Pre-filled with whoever is signed in, but editable. Re-prefill when the
  // seat changes — but never overwrite something already being typed.
  useEffect(() => {
    setName((prev) => (prev.trim() ? prev : seat.name))
  }, [seat])

  const list = toListDesc(raw) // newest first

  // A guest may comment once per item from each device. If the admin deletes
  // that comment, the key is empty again and the form comes back.
  const guestDone = !seat.partner && guestHasCommented(raw)

  // seat is a dependency: see the note in Reactions.jsx.
  const submit = useCallback(
    async (e) => {
      e.preventDefault()
      const found = validateComment({ name, text })
      setErrors(found)
      if (Object.keys(found).length) return

      setSending(true)
      try {
        await addComment(itemId, { name, text, personId: seat.id })
        setText('')
        setErrors({})
      } catch (err) {
        setErrors(err.errors || { text: 'That did not send. Try again in a moment.' })
      } finally {
        setSending(false)
      }
    },
    [itemId, name, text, seat]
  )

  const remove = useCallback(
    async (key) => {
      try {
        await deleteComment(itemId, key)
      } catch {
        /* nothing useful to say */
      }
    },
    [itemId]
  )

  return (
    <div className="comments">
      <div className="comments__bar">
        <Reactions itemId={itemId} seat={seat} />
        <button
          type="button"
          className="btn btn--ghost comments__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {title}
          {list.length ? <span className="comments__count">{list.length}</span> : null}
        </button>
      </div>

      {open ? (
        <div className="comments__panel">
          {guestDone ? (
            <p className="comments__done small faint">
              You have left your comment here. Thank you.
            </p>
          ) : (
          <form className="comment-form" onSubmit={submit} noValidate>
            <label className="field">
              <span className="field__label">Name</span>
              <input
                className={`input${errors.name ? ' input--error' : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
                maxLength={60}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <span className="error">{errors.name}</span> : null}
            </label>

            <label className="field">
              <span className="field__label">Comment</span>
              <textarea
                className={`textarea${errors.text ? ' textarea--error' : ''}`}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (errors.text) setErrors((p) => ({ ...p, text: undefined }))
                }}
                rows={3}
                maxLength={2000}
                placeholder="Say something."
                aria-invalid={Boolean(errors.text)}
              />
              {errors.text ? <span className="error">{errors.text}</span> : null}
            </label>

            <button type="submit" className="btn btn--primary btn--wide" disabled={sending}>
              {sending ? 'Sending…' : 'Leave it'}
            </button>
          </form>
          )}

          {list.length === 0 ? (
            <p className="comments__empty small faint">Nothing said here yet.</p>
          ) : (
            <ul className="comment-list">
              {list.map((c) => (
                <li className="comment" key={c.key}>
                  <div className="comment__head">
                    <span className="comment__name">{c.name}</span>
                    <span className="comment__when tiny faint" title={formatStamp(c.at)}>
                      {timeAgo(c.at)}
                    </span>
                    {seat.admin ? (
                      <button
                        type="button"
                        className="comment__del"
                        onClick={() => remove(c.key)}
                        aria-label={`Delete the comment by ${c.name}`}
                        title="Delete"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                  <p className="comment__text">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
