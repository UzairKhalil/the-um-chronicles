// ---------------------------------------------------------------------------
// day.js — what "today" means.
// ---------------------------------------------------------------------------
// A day key is 'YYYY-MM-DD' computed from the SERVER's clock, rendered in the
// one shared time zone from meta.dayTimeZone. Never from Date.getDate() on the
// viewer's device: phone clocks run minutes out and time zones differ, and
// then two people disagree about whether a day counted.
// ---------------------------------------------------------------------------

import meta from '../content/meta.js'
import { serverNow } from './db.js'

const ZONE = meta.dayTimeZone || 'UTC'

function parts(ms, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const found = {}
  for (const p of fmt.formatToParts(new Date(ms))) found[p.type] = p.value
  return found
}

/** 'YYYY-MM-DD' for the given instant (defaults to the server's now). */
export function dayKey(ms = serverNow()) {
  try {
    const p = parts(ms, ZONE)
    return `${p.year}-${p.month}-${p.day}`
  } catch {
    // Unknown zone: fall back to UTC rather than the device's zone, so every
    // device still agrees with every other device.
    const p = parts(ms, 'UTC')
    return `${p.year}-${p.month}-${p.day}`
  }
}

/** Today, on the server's clock. */
export const today = () => dayKey()

/** Parse 'YYYY-MM-DD' into a Date at local noon — safe for display maths. */
export function dayDate(key) {
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0)
}

/** Whole days between two day keys (b - a). */
export function daysBetween(a, b) {
  return Math.round((dayDate(b) - dayDate(a)) / 86400000)
}

/** The day key n days before the given one. */
export function shiftDay(key, n) {
  const d = dayDate(key)
  d.setDate(d.getDate() + n)
  const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
  return p
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]

/** '14 March 2021' */
export function formatDay(key) {
  const d = dayDate(key)
  if (Number.isNaN(d.getTime())) return String(key)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** 'Sunday, 14 March 2021' */
export function formatDayLong(key) {
  const d = dayDate(key)
  if (Number.isNaN(d.getTime())) return String(key)
  return `${WEEKDAYS[d.getDay()]}, ${formatDay(key)}`
}

/** A timestamp for the history tables: '14 Mar 2021, 21:04'. */
export function formatStamp(ms) {
  if (!ms) return '—'
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const mon = MONTHS[d.getMonth()].slice(0, 3)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${mon} ${d.getFullYear()}, ${hh}:${mm}`
}

/** 'just now' / '4 minutes ago' / '3 days ago', judged on the server clock. */
export function timeAgo(ms) {
  if (!ms) return ''
  const diff = Math.max(0, serverNow() - ms)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}
