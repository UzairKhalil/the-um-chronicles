import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useSessionExpiry from './useSessionExpiry.js'
import { IDLE_MS } from '../lib/session.js'

// No database here: the hook only listens to the browser.

const setVisibility = (state) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  setVisibility('visible')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('idle', () => {
  it('expires after five minutes with nothing happening', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    act(() => vi.advanceTimersByTime(IDLE_MS - 1000))
    expect(onExpire).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('treats a touch, a key or a scroll as still being here', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    for (const type of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
      act(() => vi.advanceTimersByTime(IDLE_MS - 1000))
      act(() => window.dispatchEvent(new Event(type)))
    }
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('expires on the next touch if the device slept through the timer', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    // The clock moves on but the timer never fires — what sleep does.
    vi.setSystemTime(Date.now() + IDLE_MS + 60_000)
    act(() => window.dispatchEvent(new Event('pointerdown')))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})

describe('hidden', () => {
  it('expires as soon as the page is minimised or switched away from', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    act(() => setVisibility('hidden'))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('expires straight away if the page is already hidden when the session starts', () => {
    // A background tab reloaded by the browser restores the seat unseen, and
    // no visibilitychange will ever fire for it.
    setVisibility('hidden')
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('leaves a reload alone — beforeunload fires first, minimising never does', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    act(() => window.dispatchEvent(new Event('beforeunload')))
    act(() => setVisibility('hidden'))
    expect(onExpire).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('umc.leftAt')).toBeTruthy()
  })

  it('goes back to normal if an unload is started and then abandoned', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    act(() => window.dispatchEvent(new Event('beforeunload')))
    act(() => vi.advanceTimersByTime(1500))
    act(() => setVisibility('hidden'))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})

describe('only while signed in', () => {
  it('does nothing on the code screen', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: false, onExpire }))
    act(() => vi.advanceTimersByTime(IDLE_MS * 2))
    act(() => setVisibility('hidden'))
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('expires once, not repeatedly', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionExpiry({ active: true, onExpire }))
    act(() => setVisibility('hidden'))
    act(() => vi.advanceTimersByTime(IDLE_MS * 2))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('always calls the latest callback, not the one from the first render', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ cb }) => useSessionExpiry({ active: true, onExpire: cb }), {
      initialProps: { cb: first },
    })
    rerender({ cb: second })
    act(() => setVisibility('hidden'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
