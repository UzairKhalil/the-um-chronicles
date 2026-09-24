// ---------------------------------------------------------------------------
// since.js — how long it has been, said kindly.
// ---------------------------------------------------------------------------
// Counted from meta.sinceDate to today on the SERVER's clock, in the one
// shared time zone (see day.js), so both phones always agree.
// ---------------------------------------------------------------------------

import meta from '../content/meta.js'
import { today, dayDate, daysBetween } from './day.js'

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
]

/** Small numbers read better as words; large ones as figures. */
export const spell = (n) => (n >= 0 && n <= 12 ? WORDS[n] : String(n))

const plural = (n, word) => `${spell(n)} ${word}${n === 1 ? '' : 's'}`

/** Months on, clamped: 31 January plus one month is the last day of February. */
function addMonths(date, n) {
  const year = date.getFullYear()
  const month = date.getMonth() + n
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(date.getDate(), lastDay), 12, 0, 0, 0)
}

/** Years, months and days between two day keys, plus the total in days. */
export function elapsed(fromKey, toKey = today()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fromKey || ''))) return null
  const from = dayDate(fromKey)
  const to = dayDate(toKey)
  if (Number.isNaN(from.getTime()) || to < from) return null

  // Step forward in whole months first, then count the days left over. A
  // month added to the 31st lands on the last day of a short month, so
  // 31 January to 1 March is one month and one day — never a negative.
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  if (months < 0) months = 0

  const anchor = addMonths(from, months)
  const days = Math.round((to - anchor) / 86400000)

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days,
    totalDays: daysBetween(fromKey, toKey),
  }
}

/**
 * 'Two years, six months and one day — 915 days, and still counting.'
 * Returns '' when there is no date to count from.
 */
export function sinceLine(fromKey = meta.sinceDate, toKey = today()) {
  const e = elapsed(fromKey, toKey)
  if (!e) return ''
  if (e.totalDays === 0) return 'Day one. It starts today.'

  const parts = []
  if (e.years) parts.push(plural(e.years, 'year'))
  if (e.months) parts.push(plural(e.months, 'month'))
  if (e.days) parts.push(plural(e.days, 'day'))

  const long =
    parts.length > 1
      ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
      : parts[0]

  const total = `${e.totalDays.toLocaleString('en-GB')} day${e.totalDays === 1 ? '' : 's'}`
  const line = `${long} — ${total}, and still counting.`
  return line.charAt(0).toUpperCase() + line.slice(1)
}

export default sinceLine
