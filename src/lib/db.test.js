import { describe, it, expect } from 'vitest'

// setup.js registers throwing mocks for firebase/app and firebase/database, so
// importing db.js here cannot reach the real SDK. We only exercise sanitize(),
// which is pure and never touches the network.
const { sanitize, NS } = await import('./db.js')

describe('sanitize', () => {
  it('drops undefined keys — Realtime Database rejects them outright', () => {
    const out = sanitize({ a: 1, b: undefined, c: 'x' })
    expect(out).toEqual({ a: 1, c: 'x' })
    expect('b' in out).toBe(false)
  })

  it('drops nulls from arrays, which RTDB would otherwise silently eat', () => {
    expect(sanitize([1, null, 2, undefined, 3])).toEqual([1, 2, 3])
  })

  it('cleans nested structures', () => {
    expect(
      sanitize({
        device: { cores: undefined, memoryGB: 8, network: null },
        tags: ['a', undefined, 'b'],
      })
    ).toEqual({ device: { memoryGB: 8 }, tags: ['a', 'b'] })
  })

  it('keeps falsy values that are real data', () => {
    expect(sanitize({ n: 0, s: '', b: false })).toEqual({ n: 0, s: '', b: false })
  })

  it('refuses non-finite numbers rather than writing NaN', () => {
    expect(sanitize(Number.NaN)).toBeNull()
    expect(sanitize(Infinity)).toBeNull()
  })

  it('turns Dates into timestamps', () => {
    expect(sanitize(new Date(1700000000000))).toBe(1700000000000)
  })
})

describe('namespace', () => {
  it('is the single top-level key this app owns', () => {
    // The Firebase project is shared with another app. Everything must live
    // under this one key or the two apps collide.
    expect(NS).toBe('umc')
  })
})
