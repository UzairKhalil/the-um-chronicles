// ---------------------------------------------------------------------------
// session.js — who is sitting here, and for how long.
// ---------------------------------------------------------------------------
// The session ends, and the code screen comes back, when:
//
//   - the tab or the browser is closed. The seat lives in sessionStorage,
//     which the browser discards with the tab.
//   - the page is hidden: minimised, phone locked, switched to another app
//     or tab. Enforced by hooks/useSessionExpiry.js.
//   - nothing has happened for IDLE_MS. Also useSessionExpiry.js.
//
// A reload is NOT the end of a session — version.js reloads the page into
// new deploys, and a refresh should not ask for the code. A reload fires
// `beforeunload`, which minimising never does, so the page records when it
// left (markLeaving) and loadSeat() keeps the seat only if it came back
// within RELOAD_GRACE_MS. That also catches a browser that restores closed
// tabs together with their sessionStorage: the gap is far longer than a
// reload, so the seat is dropped.
//
// Only the person's id is stored. The codes are never persisted, never logged
// and never written to the database.
// ---------------------------------------------------------------------------

import { byId } from '../content/people.js'

const SEAT_KEY = 'umc.seat'
const LEFT_KEY = 'umc.leftAt'

/** Sign out after this long with no touch, click, key or scroll. */
export const IDLE_MS = 5 * 60 * 1000

/** A page that comes back within this long of unloading was reloaded. */
export const RELOAD_GRACE_MS = 10 * 1000

const store = () => {
  try {
    return globalThis.sessionStorage || null
  } catch {
    return null
  }
}

// Earlier builds remembered the seat in localStorage indefinitely. Drop any
// such leftover so an old device does not stay signed in for ever.
function forgetLegacySeat() {
  try {
    localStorage.removeItem(SEAT_KEY)
  } catch {
    /* storage blocked — nothing to forget */
  }
}

export function loadSeat(now = Date.now()) {
  forgetLegacySeat()
  const s = store()
  if (!s) return null
  try {
    const leftAt = Number(s.getItem(LEFT_KEY))
    s.removeItem(LEFT_KEY)
    if (leftAt && now - leftAt > RELOAD_GRACE_MS) {
      s.removeItem(SEAT_KEY)
      return null
    }
    const id = s.getItem(SEAT_KEY)
    return id ? byId(id) : null
  } catch {
    return null
  }
}

export function saveSeat(person) {
  try {
    if (person?.id) store()?.setItem(SEAT_KEY, person.id)
    store()?.removeItem(LEFT_KEY)
  } catch {
    /* storage blocked — the seat lasts for this page only */
  }
}

export function clearSeat() {
  try {
    store()?.removeItem(SEAT_KEY)
    store()?.removeItem(LEFT_KEY)
  } catch {
    /* nothing to do */
  }
  forgetLegacySeat()
}

/** Called on beforeunload: the page is going away, possibly just reloading. */
export function markLeaving(now = Date.now()) {
  try {
    store()?.setItem(LEFT_KEY, String(now))
  } catch {
    /* nothing to do */
  }
}

/** Called when a page restored from the back/forward cache shows again. */
export function leftTooLongAgo(now = Date.now()) {
  try {
    const leftAt = Number(store()?.getItem(LEFT_KEY))
    store()?.removeItem(LEFT_KEY)
    return Boolean(leftAt) && now - leftAt > RELOAD_GRACE_MS
  } catch {
    return false
  }
}
