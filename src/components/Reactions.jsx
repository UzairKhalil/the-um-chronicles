import { useCallback, useState } from 'react'
import Glyph, { REACTIONS } from './Glyph.jsx'
import { toggleReaction, reactionKey } from '../lib/records.js'
import { useDbValue } from '../hooks/useDb.js'

/** 'Guest, Guest, Uzair' -> 'Guest ×2, Uzair' */
function namesLabel(names) {
  const counts = new Map()
  for (const n of names) counts.set(n, (counts.get(n) || 0) + 1)
  return [...counts].map(([n, c]) => (c > 1 ? `${n} ×${c}` : n)).join(', ')
}

/**
 * One reaction per person per item — per device, for a guest — toggling on
 * and off, not a counter that can be spammed. The write is a transaction,
 * because what we store depends on what is already there.
 */
export default function Reactions({ itemId, seat }) {
  const [state] = useDbValue(`reactions/${itemId}`)
  const [busy, setBusy] = useState('')

  // seat is a dependency on purpose. A callback frozen with [] would keep
  // writing the first person who signed in, long after the seat changed.
  const toggle = useCallback(
    async (key) => {
      if (busy) return
      setBusy(key)
      try {
        await toggleReaction(itemId, seat, key)
      } catch {
        /* a dropped reaction is not worth an error message */
      } finally {
        setBusy('')
      }
    },
    [itemId, seat, busy]
  )

  const mine = state?.[reactionKey(seat)]?.symbol || ''
  const counts = {}
  const whoBy = {}
  for (const [pid, r] of Object.entries(state || {})) {
    if (!r?.symbol) continue
    counts[r.symbol] = (counts[r.symbol] || 0) + 1
    whoBy[r.symbol] = [...(whoBy[r.symbol] || []), r.name || pid]
  }

  return (
    <div className="reactions" role="group" aria-label="Reactions">
      {REACTIONS.map(({ key, label }) => {
        const n = counts[key] || 0
        const on = mine === key
        return (
          <button
            key={key}
            type="button"
            className={`reaction${on ? ' is-on' : ''}${busy === key ? ' is-busy' : ''}`}
            onClick={() => toggle(key)}
            aria-pressed={on}
            title={n ? `${label} — ${namesLabel(whoBy[key])}` : label}
          >
            <Glyph name={key} size={17} />
            <span className="reaction__n">{n || ''}</span>
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
