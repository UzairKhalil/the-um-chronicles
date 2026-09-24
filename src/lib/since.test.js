import { describe, it, expect, vi } from 'vitest'

// The live database is never reachable from a test.
vi.mock('./db.js', () => ({
  serverNow: () => Date.UTC(2026, 8, 24, 6, 0, 0), // 24 Sep 2026
  getServerOffset: () => 0,
}))

const { elapsed, sinceLine, spell } = await import('./since.js')
const meta = (await import('../content/meta.js')).default

describe('counting the days', () => {
  it('breaks the time into years, months and days', () => {
    expect(elapsed('2024-03-24', '2026-09-24')).toMatchObject({
      years: 2,
      months: 6,
      days: 0,
    })
  })

  it('borrows from the right month, never overcounting a short one', () => {
    // 31 Jan to 1 March: a month and a day in February's own length.
    expect(elapsed('2026-01-31', '2026-03-01')).toMatchObject({ years: 0, months: 1, days: 1 })
    expect(elapsed('2024-01-31', '2024-03-01')).toMatchObject({ years: 0, months: 1, days: 1 })
  })

  it('counts a leap day', () => {
    expect(elapsed('2024-02-28', '2024-03-01').totalDays).toBe(2) // 2024 is a leap year
    expect(elapsed('2026-02-28', '2026-03-01').totalDays).toBe(1)
  })

  it('counts the total days as well', () => {
    expect(elapsed('2026-09-17', '2026-09-24').totalDays).toBe(7)
    expect(elapsed('2024-03-24', '2026-09-24').totalDays).toBe(914)
  })

  it('refuses a date that is missing, malformed, or in the future', () => {
    expect(elapsed('', '2026-09-24')).toBeNull()
    expect(elapsed('nonsense', '2026-09-24')).toBeNull()
    expect(elapsed('2027-01-01', '2026-09-24')).toBeNull()
  })
})

describe('the line under "Since …"', () => {
  it('reads as a sentence, with small numbers in words', () => {
    expect(sinceLine('2024-03-24', '2026-09-24')).toBe(
      'Two years and six months — 914 days, and still counting.'
    )
  })

  it('names every part that is there, and none that is not', () => {
    expect(sinceLine('2024-03-24', '2026-09-25')).toBe(
      'Two years, six months and one day — 915 days, and still counting.'
    )
    expect(sinceLine('2026-09-23', '2026-09-24')).toBe(
      'One day — 1 day, and still counting.'
    )
    expect(sinceLine('2026-08-24', '2026-09-24')).toBe(
      'One month — 31 days, and still counting.'
    )
  })

  it('has something kind to say on the first day', () => {
    expect(sinceLine('2026-09-24', '2026-09-24')).toBe('Day one. It starts today.')
  })

  it('groups the thousands once there are enough days', () => {
    expect(sinceLine('2020-01-01', '2026-09-24')).toContain('2,458 days')
  })

  it('says nothing at all when no date is set', () => {
    expect(sinceLine('', '2026-09-24')).toBe('')
    expect(sinceLine(null, '2026-09-24')).toBe('')
    // …and nothing rather than something wrong if the date is in the future.
    expect(sinceLine('2030-01-01', '2026-09-24')).toBe('')
  })

  it('counts from the date in meta.js by default', () => {
    expect(meta.sinceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(meta.since).toContain('24 March 2024')
    expect(sinceLine()).toContain('and still counting')
  })

  it('spells the small numbers', () => {
    expect(spell(1)).toBe('one')
    expect(spell(12)).toBe('twelve')
    expect(spell(13)).toBe('13')
  })
})
