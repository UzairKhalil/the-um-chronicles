// ---------------------------------------------------------------------------
// records.js — every write the app makes, in one place.
// ---------------------------------------------------------------------------
// Shape under /umc (see db.js — nothing here ever escapes that namespace):
//
//   signIns/{pushId}                { personId, name, at, device }
//   days/{YYYY-MM-DD}/{personId}    { at, note }
//   comments/{itemId}/{pushId}      { personId, name, text, at, device }
//   comments/{itemId}/g_{deviceId}  the same, for a guest: one per device
//   reactions/{itemId}/{personId}   { symbol, at, device }
//   reactions/{itemId}/g_{deviceId} the same, for a guest: one per device
//   devices/{deviceId}              { firstAt, lastAt, lastPersonId, ...detail }
//
// itemId is 'poem:<poem id>', 'classic:<classic id>' or 'quote:<quote key>'.
// Realtime Database keys
// may not contain . # $ [ ] or / — a colon is fine.
// ---------------------------------------------------------------------------

import { push, set, remove, transact, serverNow, update, get } from './db.js'
import { describeDevice, deviceId } from './device.js'
import { byId } from '../content/people.js'
import { today } from './day.js'

// Sign-ins accumulate forever otherwise. The client trims the oldest after
// each write, the same way the other app in this database does.
const SIGNIN_CAP = 300

// The device snapshot costs a Client Hints round trip; take it once.
let devicePromise = null
export function deviceSnapshot() {
  if (!devicePromise) devicePromise = describeDevice().catch(() => ({ id: 'unknown' }))
  return devicePromise
}

// Signing belongs to the two partners. The database rules say the same
// ('u' or 'm' only), but a guest's write would otherwise sit queued in the
// SDK — see CLAUDE.md rule 9 — so it is refused here, before it is made.
// Guests may react and comment.
function requirePartner(person, action) {
  if (!person?.partner) throw new Error(`Only the two partners can ${action}.`)
}

// Everyone using the guest code shares one person id, 'g'. To give each guest
// their own reaction and comment, a guest is keyed by the device instead:
// 'g_<device id>'. The device id is the random value device.js keeps in that
// browser's storage — clearing site data mints a new one, and with it a new
// guest. That is the honest limit of "one per guest" without accounts.
export const guestKey = () => `g_${deviceId()}`

/** The key a person's reaction lives under: their id, or a guest's device. */
export const reactionKey = (person) => (person?.partner ? person.id : guestKey())

const isGuestId = (personId) => byId(personId)?.partner === false

export const poemItemId = (id) => `poem:${id}`
export const classicItemId = (id) => `classic:${id}`
export const quoteItemId = (key) => `quote:${key}`

/** Remember a device in the summary table, and touch its last-seen. */
async function touchDevice(device, personId) {
  if (!device?.id) return
  const now = serverNow()
  await transact(`devices/${device.id}`, (current) => ({
    ...(current || {}),
    ...device,
    firstAt: current?.firstAt || now,
    lastAt: now,
    lastPersonId: personId || current?.lastPersonId || '',
    visits: (current?.visits || 0) + 1,
  }))
}

/** Recorded every time a correct code opens the gate. Never the code itself. */
export async function recordSignIn(person) {
  const device = await deviceSnapshot()
  const at = serverNow()
  await push('signIns', { personId: person.id, name: person.name, at, device })
  await touchDevice(device, person.id)
  await trimSignIns().catch(() => {})
}

/** Drop the oldest sign-ins once there are more than SIGNIN_CAP of them. */
export async function trimSignIns() {
  const all = await get('signIns')
  const keys = Object.keys(all || {})
  if (keys.length <= SIGNIN_CAP) return 0
  const oldest = keys
    .map((key) => ({ key, at: all[key]?.at || 0 }))
    .sort((a, b) => a.at - b.at)
    .slice(0, keys.length - SIGNIN_CAP)
  await Promise.all(oldest.map(({ key }) => remove(`signIns/${key}`)))
  return oldest.length
}

/**
 * Sign today. Idempotent: signing twice in a day keeps the first signature,
 * but an updated note replaces the old one.
 * Runs as a transaction — two devices can be doing this at the same moment.
 */
export async function signToday(person, note = '') {
  requirePartner(person, 'sign')
  const day = today()
  const device = await deviceSnapshot()
  const at = serverNow()
  const res = await transact(`days/${day}/${person.id}`, (current) => ({
    at: current?.at || at,
    note: String(note || '').slice(0, 240),
    device: device.id || '',
  }))
  await touchDevice(device, person.id)
  return { day, ...res }
}

/** Remove today's signature (an undo, not a feature we advertise). */
export async function unsignToday(person) {
  await remove(`days/${today()}/${person.id}`)
}

/** A comment needs BOTH a name and text. Validation lives with the write. */
export function validateComment({ name, text }) {
  const errors = {}
  if (!String(name || '').trim()) errors.name = 'Please add a name.'
  if (!String(text || '').trim()) errors.text = 'Please write a comment.'
  return errors
}

export async function addComment(itemId, { name, text, personId }) {
  const errors = validateComment({ name, text })
  if (Object.keys(errors).length) throw Object.assign(new Error('invalid'), { errors })

  const device = await deviceSnapshot()
  const at = serverNow()
  const comment = {
    personId: personId || '',
    name: String(name).trim().slice(0, 60),
    text: String(text).trim().slice(0, 2000),
    at,
    device,
  }

  // The partners may comment as often as they like. A guest gets one comment
  // per item per device, stored under a key derived from the device, and
  // written only if that key is still empty — a transaction, so two taps
  // cannot both land. The database rules enforce the same.
  if (isGuestId(personId)) {
    const key = guestKey()
    const res = await transact(`comments/${itemId}/${key}`, (current) =>
      current ? undefined : comment
    )
    if (!res.committed) {
      throw Object.assign(new Error('already commented'), {
        errors: { text: 'You have already left your comment here.' },
      })
    }
    await touchDevice(device, personId)
    return key
  }

  const key = await push(`comments/${itemId}`, comment)
  await touchDevice(device, personId)
  return key
}

/** Has this device's guest already commented on the item? */
export function guestHasCommented(comments) {
  return Boolean(comments && comments[guestKey()])
}

export async function deleteComment(itemId, key) {
  await remove(`comments/${itemId}/${key}`)
}

/**
 * One reaction per person per item — and per device, for a guest. Tapping the
 * same symbol again clears it; tapping a different one replaces it. A
 * transaction, because the value we write depends on the value already there.
 */
export async function toggleReaction(itemId, person, symbol) {
  const device = await deviceSnapshot()
  const at = serverNow()
  const res = await transact(`reactions/${itemId}/${reactionKey(person)}`, (current) => {
    if (current && current.symbol === symbol) return null // clear it
    return { symbol, at, name: person.name, device }
  })
  await touchDevice(device, person.id)
  return res
}

/** Used only by the cleanup helper in scripts/, never by the app. */
export async function writeRaw(path, value) {
  await set(path, value)
}

export { update }
