import { describe, it, expect } from 'vitest'
import {
  loadSeat,
  saveSeat,
  clearSeat,
  markLeaving,
  leftTooLongAgo,
  RELOAD_GRACE_MS,
} from './session.js'

// No database here at all: session.js only touches browser storage.

const uzair = { id: 'u', name: 'Uzair' }

describe('where the seat lives', () => {
  it('is kept in sessionStorage, which the browser discards with the tab', () => {
    saveSeat(uzair)
    expect(sessionStorage.getItem('umc.seat')).toBe('u')
    expect(localStorage.getItem('umc.seat')).toBeNull()
    expect(loadSeat()?.id).toBe('u')
  })

  it('is gone once the tab is gone', () => {
    saveSeat(uzair)
    sessionStorage.clear() // what closing the tab does
    expect(loadSeat()).toBeNull()
  })

  it('forgets a seat an older build left in localStorage', () => {
    localStorage.setItem('umc.seat', 'u')
    expect(loadSeat()).toBeNull()
    expect(localStorage.getItem('umc.seat')).toBeNull()
  })

  it('is cleared on sign-out', () => {
    saveSeat(uzair)
    clearSeat()
    expect(loadSeat()).toBeNull()
  })
})

describe('reload versus leaving', () => {
  it('survives a reload', () => {
    saveSeat(uzair)
    markLeaving(1_000_000)
    expect(loadSeat(1_000_000 + 1500)?.id).toBe('u')
  })

  it('does not survive a tab restored long after the browser closed', () => {
    saveSeat(uzair)
    markLeaving(1_000_000)
    expect(loadSeat(1_000_000 + RELOAD_GRACE_MS + 1)).toBeNull()
    // and it stays gone
    expect(loadSeat(1_000_000 + RELOAD_GRACE_MS + 2)).toBeNull()
  })

  it('judges a back/forward-cache return by the same gap', () => {
    markLeaving(1_000_000)
    expect(leftTooLongAgo(1_000_000 + 2000)).toBe(false)
    markLeaving(1_000_000)
    expect(leftTooLongAgo(1_000_000 + RELOAD_GRACE_MS + 1)).toBe(true)
  })
})
