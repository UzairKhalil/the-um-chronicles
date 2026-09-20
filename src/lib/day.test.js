import { describe, it, expect, vi } from 'vitest'

// Tests must never touch the live database: db.js is the only module that can
// reach Firebase, so it is mocked here before day.js imports it.
vi.mock('./db.js', () => ({
  serverNow: () => Date.UTC(2026, 2, 14, 19, 30, 0), // 14 Mar 2026, 19:30 UTC
  getServerOffset: () => 0,
}))

const { dayKey, today, daysBetween, shiftDay, formatDay, formatDayLong, formatStamp } =
  await import('./day.js')

describe('day keys', () => {
  it('uses the server clock, not the device clock', () => {
    // 19:30 UTC on 14 March is already 00:30 on 15 March in Asia/Karachi,
    // which is the shared zone in meta.js — the day must roll there.
    expect(today()).toBe('2026-03-15')
  })

  it('formats a key as YYYY-MM-DD', () => {
    expect(dayKey(Date.UTC(2021, 0, 5, 6, 0, 0))).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('counts whole days between keys', () => {
    expect(daysBetween('2026-03-01', '2026-03-02')).toBe(1)
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1) // 2026 is not a leap year
    expect(daysBetween('2026-03-10', '2026-03-01')).toBe(-9)
  })

  it('shifts across month and year boundaries', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDay('2025-12-31', 1)).toBe('2026-01-01')
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29') // 2024 is a leap year
  })
})

describe('formatting', () => {
  it('writes a readable date', () => {
    expect(formatDay('2021-03-14')).toBe('14 March 2021')
    expect(formatDayLong('2021-03-14')).toBe('Sunday, 14 March 2021')
  })

  it('never renders "Invalid Date"', () => {
    expect(formatDay('nonsense')).toBe('nonsense')
    expect(formatStamp(0)).toBe('—')
    expect(formatStamp(null)).toBe('—')
  })
})
