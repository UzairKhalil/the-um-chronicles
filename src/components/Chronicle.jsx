import { useMemo, useState } from 'react'
import meta from '../content/meta.js'
import people from '../content/people.js'
import { chronicle as chronicleQuotes } from '../content/quotes.js'
import { pick } from '../lib/pick.js'
import { useDbValue } from '../hooks/useDb.js'
import { summarise, isComplete } from '../lib/chronicle.js'
import { formatDay, formatDayLong, today, daysBetween } from '../lib/day.js'
import Interstitial from './Interstitial.jsx'

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Every month between the first entry and today, newest first. */
function monthsBetween(firstDay, lastDay) {
  if (!firstDay) return []
  const out = []
  const [fy, fm] = firstDay.split('-').map(Number)
  const [ly, lm] = lastDay.split('-').map(Number)
  let y = fy
  let m = fm
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) { m = 1; y += 1 }
  }
  return out.reverse()
}

function MonthGrid({ month, days }) {
  const [y, m] = month.split('-').map(Number)
  const total = new Date(y, m, 0).getDate()
  // Monday-first: JS getDay() is 0=Sunday.
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const t = today()

  return (
    <div className="month">
      <h3 className="month__name">
        {MONTH_NAMES[m - 1]} <span className="faint">{y}</span>
      </h3>
      <div className="month__week" aria-hidden="true">
        {WEEK.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="month__grid">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`pad-${i}`} className="month__pad" />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const key = `${month}-${String(i + 1).padStart(2, '0')}`
          const rec = days?.[key]
          const full = isComplete(rec)
          const half = !full && rec && Object.keys(rec).length > 0
          const future = key > t
          const cls = [
            'month__day',
            full && 'is-full',
            half && 'is-half',
            key === t && 'is-today',
            future && 'is-future',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <span
              key={key}
              className={cls}
              title={full ? `Both signed — ${formatDay(key)}` : formatDay(key)}
            >
              <span className="month__n">{i + 1}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function Chronicle({ onGo }) {
  const [days, loaded] = useDbValue('days')
  const [view, setView] = useState('list')
  const stats = useMemo(() => summarise(days), [days])
  const quote = useMemo(() => pick(chronicleQuotes), [])
  const months = useMemo(
    () => monthsBetween(stats.first, today()),
    [stats.first]
  )

  const since = stats.first ? daysBetween(stats.first, today()) + 1 : 0

  return (
    <section className="chronicle">
      <p className="quote quote--centred">{quote}</p>

      <div className="stats">
        <div className="stats__item">
          <span className="stats__n">{stats.total}</span>
          <span className="stats__l">days, both signed</span>
        </div>
        <div className="stats__item">
          <span className="stats__n">{stats.currentStreak}</span>
          <span className="stats__l">current streak</span>
        </div>
        <div className="stats__item">
          <span className="stats__n">{stats.longestStreak}</span>
          <span className="stats__l">longest streak</span>
        </div>
        <div className="stats__item">
          <span className="stats__n">{since}</span>
          <span className="stats__l">days since the first</span>
        </div>
      </div>

      {stats.first ? (
        <p className="chronicle__first small muted centre">
          The first was {formatDayLong(stats.first)}.
        </p>
      ) : null}

      <Interstitial />

      <div className="chronicle__head">
        <h2 className="section-title">{meta.chronicleTitle}</h2>
        <div className="toggle" role="tablist" aria-label="How to show the chronicle">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'list'}
            className={`toggle__btn${view === 'list' ? ' is-on' : ''}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'calendar'}
            className={`toggle__btn${view === 'calendar' ? ' is-on' : ''}`}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
        </div>
      </div>

      {!loaded ? <p className="faint centre small">Reading the record…</p> : null}

      {loaded && stats.total === 0 ? (
        <p className="chronicle__empty quote quote--centred">
          Nothing written down yet. The first day you both sign, it begins here.
        </p>
      ) : null}

      {view === 'list' ? (
        <ol className="entries">
          {stats.entries.map((entry, i) => (
            <li className="entry" key={entry.day}>
              <div className="entry__mark" aria-hidden="true">
                <span className="entry__dot" />
              </div>
              <div className="entry__body">
                <p className="entry__date">{formatDayLong(entry.day)}</p>
                <p className="entry__n tiny faint">
                  Entry {stats.total - i}
                </p>
                {people.map((p) => {
                  const note = entry.signatures?.[p.id]?.note
                  if (!note) return null
                  return (
                    <p className="entry__note" key={p.id}>
                      <span className="entry__who">{p.name}</span>
                      {note}
                    </p>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="months">
          {months.map((m) => (
            <MonthGrid key={m} month={m} days={days} />
          ))}
          <div className="month__key tiny faint">
            <span><i className="key-dot is-full" /> both signed</span>
            <span><i className="key-dot is-half" /> one of us</span>
            <span><i className="key-dot" /> neither</span>
          </div>
        </div>
      )}

      <div className="back-link">
        <button type="button" className="btn btn--wide" onClick={() => onGo('')}>
          Back to the Sign
        </button>
      </div>
    </section>
  )
}
