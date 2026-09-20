// ---------------------------------------------------------------------------
// session.js — who is sitting here.
// ---------------------------------------------------------------------------
// There is deliberately NO idle timeout. This app belongs to two people and
// should never lock either of them out. The seat is remembered until someone
// signs out by hand.
//
// Only the person's id is stored. The codes are never persisted, never logged
// and never written to the database.
// ---------------------------------------------------------------------------

import { byId } from '../content/people.js'

const SEAT_KEY = 'umc.seat'

export function loadSeat() {
  try {
    const id = localStorage.getItem(SEAT_KEY)
    return id ? byId(id) : null
  } catch {
    return null
  }
}

export function saveSeat(person) {
  try {
    if (person?.id) localStorage.setItem(SEAT_KEY, person.id)
  } catch {
    /* storage blocked — the seat lasts for this tab only */
  }
}

export function clearSeat() {
  try {
    localStorage.removeItem(SEAT_KEY)
  } catch {
    /* nothing to do */
  }
}
