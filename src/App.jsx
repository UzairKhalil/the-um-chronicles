import { useCallback, useEffect, useState } from 'react'
import Gate from './components/Gate.jsx'
import SignScreen from './components/SignScreen.jsx'
import Chronicle from './components/Chronicle.jsx'
import Poetry, { isPoetrySection } from './components/Poetry.jsx'
import History from './components/History.jsx'
import Masthead from './components/Masthead.jsx'
import meta from './content/meta.js'
import { loadSeat, saveSeat, clearSeat } from './lib/session.js'
import { recordSignIn } from './lib/records.js'
import { useDbStatus } from './hooks/useDb.js'
import useHashRoute from './hooks/useHashRoute.js'
import useSessionExpiry from './hooks/useSessionExpiry.js'
import { watchForNewBuild } from './lib/version.js'
import { music, loadMusicPref, saveMusicPref } from './lib/music.js'
import MusicToggle from './components/MusicToggle.jsx'

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

  // Back to the code screen after five idle minutes, or as soon as the page
  // is hidden (minimised, locked, switched away). Tab and browser close are
  // covered by the seat living in sessionStorage — see lib/session.js.
  useSessionExpiry({ active: Boolean(seat), onExpire: leave })

  // Soft background music while someone is signed in, if this device wants
  // it. It stops on the code screen, so it also stops whenever a session
  // expires — including when the phone is locked or the app is left.
  const [musicOn, setMusicOn] = useState(loadMusicPref)
  useEffect(() => {
    if (seat && musicOn) music.start()
    else music.stop()
  }, [seat, musicOn])
  useEffect(() => () => music.stop(), [])

  // Start or stop the sound INSIDE the tap: Safari refuses audio started
  // even a moment after the gesture. The effect above then agrees with it.
  const toggleMusic = useCallback(() => {
    const next = !musicOn
    saveMusicPref(next)
    if (next) music.start()
    else music.stop()
    setMusicOn(next)
  }, [musicOn])

  if (!seat) return <Gate onEnter={enter} status={status} />

  const musicButton = <MusicToggle on={musicOn} onToggle={toggleMusic} />

  // #history is Uzair's alone, and is reachable only by typing it. Anyone else
  // who lands on that address simply gets the normal app — no button, no
  // message, no hint that there is anything else here.
  const page =
    route === 'history' && seat.admin
      ? 'history'
      : route === 'chronicle'
        ? 'chronicle'
        : isPoetrySection(route) // #poems, #quotes, #words
          ? 'poems'
          : 'sign'

  if (page === 'history') {
    return (
      <>
        <History seat={seat} onClose={() => go('')} />
        {musicButton}
      </>
    )
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
          {page === 'poems' ? <Poetry seat={seat} onGo={go} section={route} /> : null}
        </main>

        <footer className="app__foot">
          <p className="tiny faint">
            {meta.title} — {meta.subtitle}
          </p>
        </footer>
      </div>
      {musicButton}
    </div>
  )
}
