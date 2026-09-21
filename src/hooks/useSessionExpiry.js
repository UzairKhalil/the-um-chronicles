import { useEffect, useRef } from 'react'
import { IDLE_MS, markLeaving, leftTooLongAgo } from '../lib/session.js'

// Anything a person does that counts as "still here".
const ACTIVITY = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart']

/**
 * Ends the session, sending the person back to the code screen, when:
 *
 *   - nothing has happened for idleMs (five minutes by default);
 *   - the page stops being visible — the browser is minimised, the phone is
 *     locked, or someone switches to another app or tab.
 *
 * Closing the tab or browser is handled by the seat living in sessionStorage
 * (see lib/session.js).
 *
 * A reload also makes the page hidden for a moment. It is told apart by
 * `beforeunload`, which fires on reload and close but never on minimise: once
 * that has fired, a hidden page is left alone and session.js decides on the
 * next load, by how long the page was gone.
 *
 * Timers are throttled or frozen while a device sleeps, so each activity also
 * checks the wall-clock gap since the last one: a laptop that slept for an
 * hour with the page open does not wake up still signed in.
 */
export default function useSessionExpiry({ active, onExpire, idleMs = IDLE_MS }) {
  // Held in a ref so the listeners always call the current callback, and a
  // new callback identity never tears down and restarts the idle timer.
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    if (!active) return undefined

    let last = Date.now()
    let timer = null
    let done = false
    let unloading = false
    let unloadReset = null

    const expire = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      expireRef.current?.()
    }

    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(expire, idleMs)
    }

    const onActivity = () => {
      const now = Date.now()
      if (now - last >= idleMs) {
        expire()
        return
      }
      last = now
      arm()
    }

    const onBeforeUnload = () => {
      unloading = true
      markLeaving()
      // If the unload never happens after all, go back to normal.
      clearTimeout(unloadReset)
      unloadReset = setTimeout(() => {
        unloading = false
      }, 1000)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && !unloading) expire()
    }

    // Back/forward cache: the page comes back with its JavaScript state
    // intact, so the load-time check in session.js never runs. Do it here.
    const onPageShow = (e) => {
      if (e.persisted && leftTooLongAgo()) expire()
      unloading = false
    }

    // A session can start in a page that is already hidden — a browser
    // reloading a background tab restores the seat with no one looking.
    // No "became hidden" event will ever arrive for that, so check now.
    if (document.visibilityState === 'hidden') {
      expire()
      return undefined
    }

    arm()
    ACTIVITY.forEach((e) => addEventListener(e, onActivity, { passive: true, capture: true }))
    document.addEventListener('visibilitychange', onVisibility)
    addEventListener('beforeunload', onBeforeUnload)
    addEventListener('pageshow', onPageShow)

    return () => {
      done = true
      clearTimeout(timer)
      clearTimeout(unloadReset)
      ACTIVITY.forEach((e) => removeEventListener(e, onActivity, { capture: true }))
      document.removeEventListener('visibilitychange', onVisibility)
      removeEventListener('beforeunload', onBeforeUnload)
      removeEventListener('pageshow', onPageShow)
    }
  }, [active, idleMs])
}
