// ---------------------------------------------------------------------------
// chronicle.js — turning the raw /days tree into the record.
// ---------------------------------------------------------------------------
// A day counts only when BOTH of us signed it. Half-days are kept in the data
// (they are true, and the Sign shows them) but they are not entries.
// ---------------------------------------------------------------------------

import people from '../content/people.js'
import { today as serverToday, shiftDay, daysBetween } from './day.js'

const ids = () => people.map((p) => p.id)

/** Did everyone sign this day's record? */
export function isComplete(dayRecord) {
  if (!dayRecord || typeof dayRecord !== 'object') return false
  return ids().every((id) => Boolean(dayRecord[id]))
}

/**
 * @param {object|null} days the whole /days tree
 * @returns {{
 *   entries: Array<{day: string, signatures: object}>,  // both signed, newest first
 *   partial: string[],                                  // days only one signed
 *   total: number, first: string|null, last: string|null,
 *   currentStreak: number, longestStreak: number,
 *   longestStreakEnd: string|null
 * }}
 */
export function summarise(days) {
  const keys = Object.keys(days || {})
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort()

  const complete = []
  const partial = []
  for (const k of keys) {
    if (isComplete(days[k])) complete.push(k)
    else if (days[k] && Object.keys(days[k]).length) partial.push(k)
  }

  // longest run of consecutive complete days
  let longest = 0
  let longestEnd = null
  let run = 0
  for (let i = 0; i < complete.length; i += 1) {
    run = i > 0 && daysBetween(complete[i - 1], complete[i]) === 1 ? run + 1 : 1
    if (run > longest) {
      longest = run
      longestEnd = complete[i]
    }
  }

  // the streak we are standing in: counts back from today, or from yesterday
  // if today is not complete yet (a day in progress must not break a streak)
  const t = serverToday()
  const set = new Set(complete)
  let cursor = set.has(t) ? t : shiftDay(t, -1)
  let current = 0
  while (set.has(cursor)) {
    current += 1
    cursor = shiftDay(cursor, -1)
  }

  return {
    entries: complete
      .slice()
      .reverse()
      .map((day) => ({ day, signatures: days[day] })),
    partial,
    total: complete.length,
    first: complete[0] || null,
    last: complete[complete.length - 1] || null,
    currentStreak: current,
    longestStreak: longest,
    longestStreakEnd: longestEnd,
  }
}

/** Group entries by 'YYYY-MM' for the calendar view, newest month first. */
export function byMonth(entries) {
  const months = new Map()
  for (const e of entries) {
    const key = e.day.slice(0, 7)
    if (!months.has(key)) months.set(key, [])
    months.get(key).push(e)
  }
  return Array.from(months, ([month, items]) => ({ month, items }))
}

export default summarise
