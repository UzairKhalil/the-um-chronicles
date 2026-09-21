import { describe, it, expect, vi } from 'vitest'

// The live database is never reachable from a test.
vi.mock('./db.js', () => ({
  serverNow: () => Date.UTC(2026, 2, 20, 6, 0, 0), // 20 Mar 2026
  getServerOffset: () => 0,
}))

const { summarise, isComplete, byMonth } = await import('./chronicle.js')

const both = { u: { at: 1 }, m: { at: 2 } }
const onlyU = { u: { at: 1 } }

describe('what counts as an entry', () => {
  it('needs both of us', () => {
    expect(isComplete(both)).toBe(true)
    expect(isComplete(onlyU)).toBe(false)
    expect(isComplete(null)).toBe(false)
    expect(isComplete({})).toBe(false)
  })
})

describe('summarise', () => {
  it('handles an empty record', () => {
    const s = summarise(null)
    expect(s.total).toBe(0)
    expect(s.entries).toEqual([])
    expect(s.currentStreak).toBe(0)
    expect(s.longestStreak).toBe(0)
    expect(s.first).toBeNull()
  })

  it('counts only days both signed, newest first', () => {
    const s = summarise({
      '2026-03-18': both,
      '2026-03-19': onlyU,
      '2026-03-20': both,
    })
    expect(s.total).toBe(2)
    expect(s.entries.map((e) => e.day)).toEqual(['2026-03-20', '2026-03-18'])
    expect(s.partial).toEqual(['2026-03-19'])
    expect(s.first).toBe('2026-03-18')
  })

  it('counts a streak running up to today', () => {
    const s = summarise({
      '2026-03-18': both,
      '2026-03-19': both,
      '2026-03-20': both,
    })
    expect(s.currentStreak).toBe(3)
    expect(s.longestStreak).toBe(3)
  })

  it('does not let a day still in progress break the streak', () => {
    // Today (the 20th) is not complete yet; the streak counts back from
    // yesterday instead of resetting to zero.
    const s = summarise({
      '2026-03-18': both,
      '2026-03-19': both,
      '2026-03-20': onlyU,
    })
    expect(s.currentStreak).toBe(2)
  })

  it('breaks a streak on a missed day', () => {
    const s = summarise({
      '2026-03-10': both,
      '2026-03-11': both,
      '2026-03-12': both,
      // 13th–18th missed
      '2026-03-19': both,
      '2026-03-20': both,
    })
    expect(s.currentStreak).toBe(2)
    expect(s.longestStreak).toBe(3)
    expect(s.longestStreakEnd).toBe('2026-03-12')
  })

  it('ignores keys that are not day keys', () => {
    const s = summarise({ '2026-03-20': both, rubbish: both, '': both })
    expect(s.total).toBe(1)
  })
})

describe('byMonth', () => {
  it('groups entries by month, newest first', () => {
    const { entries } = summarise({
      '2026-02-27': both,
      '2026-03-01': both,
      '2026-03-20': both,
    })
    const months = byMonth(entries)
    expect(months.map((m) => m.month)).toEqual(['2026-03', '2026-02'])
    expect(months[0].items).toHaveLength(2)
  })
})

describe('with a guest in the people list', () => {
  it('still counts a day on the two partners alone', () => {
    expect(isComplete({ u: { at: 1 }, m: { at: 2 } })).toBe(true)
  })

  it('never counts a day on a guest', () => {
    expect(isComplete({ u: { at: 1 }, g: { at: 2 } })).toBe(false)
  })
})
