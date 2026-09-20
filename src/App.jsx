import { useCallback, useEffect, useState } from 'react'
import Gate from './components/Gate.jsx'
import SignScreen from './components/SignScreen.jsx'
import Chronicle from './components/Chronicle.jsx'
import Poetry from './components/Poetry.jsx'
import History from './components/History.jsx'
import Masthead from './components/Masthead.jsx'
import meta from './content/meta.js'
import { loadSeat, saveSeat, clearSeat } from './lib/session.js'
import { recordSignIn } from './lib/records.js'
import { useDbStatus } from './hooks/useDb.js'
import useHashRoute from './hooks/useHashRoute.js'
import { watchForNewBuild } from './lib/version.js'

export default function App() {
  const [seat, setSeat] = useState(loadSeat)
  const [route, go] = useHashRoute()
  const status = useDbStatus()
  const [busy, setBusy] = useState(false)

  // The signed-in person's colour drives --accent everywhere.
  useEffect(() => {
    const root = document.documentElement
    if (seat) {
      root.style.setProperty('--accent', seat.accent)
      root.style.setProperty('--accent-soft', seat.accentSoft)
    } else {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-soft')
    }
  }, [seat])

  // Phones keep tabs open for days on stale JavaScript. Poll version.json and
  // reload into a new deploy, but never while something is mid-write.
  useEffect(() => watchForNewBuild(() => !busy), [busy])

  const enter = useCallback((person) => {
    saveSeat(person)
    setSeat(person)
    // Fire and forget: a failed write must never block the door.
    recordSignIn(person).catch(() => {})
  }, [])

  const leave = useCallback(() => {
    clearSeat()
    setSeat(null)
    go('')
  }, [go])

  if (!seat) return <Gate onEnter={enter} status={status} />

  // #history is Uzair's alone, and is reachable only by typing it. Anyone else
  // who lands on that address simply gets the normal app — no button, no
  // message, no hint that there is anything else here.
  const page =
    route === 'history' && seat.admin
      ? 'history'
      : route === 'chronicle'
        ? 'chronicle'
        : route === 'poems'
          ? 'poems'
          : 'sign'

  if (page === 'history') {
    return <History seat={seat} onClose={() => go('')} />
  }

  return (
    <div className="app">
      <div className="shell">
        <Masthead
          seat={seat}
          status={status}
          page={page}
          onHome={() => go('')}
          onLeave={leave}
        />

        <main className="app__main">
          {page === 'sign' ? (
            <SignScreen seat={seat} onBusy={setBusy} onGo={go} />
          ) : null}
          {page === 'chronicle' ? <Chronicle seat={seat} onGo={go} /> : null}
          {page === 'poems' ? <Poetry seat={seat} onGo={go} /> : null}
        </main>

        <footer className="app__foot">
          <p className="tiny faint">
            {meta.title} — {meta.subtitle}
          </p>
        </footer>
      </div>
    </div>
  )
}
