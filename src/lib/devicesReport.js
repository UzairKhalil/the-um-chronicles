// ---------------------------------------------------------------------------
// devicesReport.js — everything known about each device, gathered in one place.
// ---------------------------------------------------------------------------
// The `/umc/devices` rows are only one source. Every sign-in, comment and
// reaction also carries the full device snapshot of the moment it was made,
// so this merges all of them:
//
//   * a device that acted before the devices table existed still appears;
//   * the details come from the MOST RECENT snapshot, not a stale row;
//   * first and last seen are the earliest and latest of everything known,
//     not just the row's own stamps;
//   * sign-ins, comments and reactions are counted per device.
//
// Honest limits, worth remembering when reading the table:
//   * a device id is a random value in that browser's storage. Clearing site
//     data, or a private window, makes a NEW device.
//   * Android Chrome reports a real model; iOS never does. For an iPhone the
//     model is inferred from the screen size and pixel density, which narrows
//     it to a group of models, never one — hence "likely".
//   * `actions` is the counter kept on the device row: every recorded action
//     ever, including ones whose sign-in record has since been trimmed away.
// ---------------------------------------------------------------------------

import { byId } from '../content/people.js'

/**
 * Screen size and density identify an iPhone down to a small group. Apple
 * does not expose the model, so this is the closest honest answer.
 */
const APPLE_SCREENS = {
  '320x568@2': 'iPhone SE (1st) / 5s',
  '375x667@2': 'iPhone 6–8 / SE (2nd, 3rd)',
  '414x736@3': 'iPhone 6+–8+',
  '375x812@3': 'iPhone X, XS, 11 Pro, 12/13 mini',
  '414x896@2': 'iPhone XR / 11',
  '414x896@3': 'iPhone XS Max / 11 Pro Max',
  '390x844@3': 'iPhone 12, 12 Pro, 13, 13 Pro, 14',
  '428x926@3': 'iPhone 12/13 Pro Max, 14 Plus',
  '393x852@3': 'iPhone 14 Pro, 15, 15 Pro, 16',
  '430x932@3': 'iPhone 14 Pro Max, 15 Plus/Pro Max, 16 Plus',
  '402x874@3': 'iPhone 16 Pro',
  '440x956@3': 'iPhone 16 Pro Max',
  '744x1133@2': 'iPad mini (6th)',
  '768x1024@2': 'iPad / iPad mini (older)',
  '810x1080@2': 'iPad (8th–10th)',
  '820x1180@2': 'iPad Air (4th, 5th)',
  '834x1194@2': 'iPad Pro 11"',
  '1024x1366@2': 'iPad Pro 12.9"',
}

/** 'iPhone 12, 12 Pro, 13, 13 Pro, 14' for an Apple device, else ''. */
export function guessAppleModel(screen, dpr) {
  if (!screen || !dpr) return ''
  const [w, h] = String(screen).split(/[×x]/).map((n) => parseInt(n, 10))
  if (!w || !h) return ''
  const density = Math.round(dpr)
  const portrait = `${Math.min(w, h)}x${Math.max(w, h)}@${density}`
  return APPLE_SCREENS[portrait] || ''
}

const isApple = (d) => /^(iOS|iPadOS|macOS)$/i.test(d?.os || '') || /iPhone|iPad/i.test(d?.model || '')

/** mobile / tablet / desktop, from what the browser admits. */
export function deviceKind(d) {
  if (!d) return ''
  if (/iPad/i.test(d.model || '') || /iPadOS/i.test(d.os || '')) return 'tablet'
  if (d.mobile === true) return 'mobile'
  if (/iPhone/i.test(d.model || '') || /^(iOS|Android)$/i.test(d.os || '')) return 'mobile'
  if (d.mobile === false) return 'desktop'
  if (typeof d.touchPoints === 'number' && d.touchPoints > 0) return 'touch'
  return 'desktop'
}

/** The name to show for a device: its model where known, else the system. */
export function bestLabel(d, likely) {
  if (!d) return 'Unknown device'
  if (d.model) return d.model
  if (likely) return likely
  return [d.os, d.browser].filter(Boolean).join(' ') || 'Unknown device'
}

/** Screen size in real pixels — what actually identifies a phone. */
export function resolution(d) {
  if (!d?.screen || !d?.dpr) return ''
  const [w, h] = String(d.screen).split(/[×x]/).map((n) => parseInt(n, 10))
  if (!w || !h) return ''
  return `${Math.round(w * d.dpr)}×${Math.round(h * d.dpr)}`
}

const at = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/**
 * @returns rows, most recently seen first.
 */
export function buildDeviceReport({ devices, signIns, comments, reactions } = {}) {
  const found = new Map()

  const touch = (id, snapshot, when, what, who) => {
    if (!id) return
    if (!found.has(id)) {
      found.set(id, {
        id,
        detail: null,
        detailAt: -1,
        firstSeen: 0,
        lastSeen: 0,
        signIns: 0,
        comments: 0,
        reactions: 0,
        actions: 0,
        people: new Set(),
        inDevicesTable: false,
      })
    }
    const row = found.get(id)
    const stamp = at(when)
    // Details always come from the most recent snapshot seen.
    if (snapshot && stamp >= row.detailAt) {
      row.detail = { ...(row.detail || {}), ...snapshot }
      row.detailAt = stamp
    }
    if (stamp) {
      row.firstSeen = row.firstSeen ? Math.min(row.firstSeen, stamp) : stamp
      row.lastSeen = Math.max(row.lastSeen, stamp)
    }
    if (what) row[what] += 1
    const name = byId(who)?.name || (who ? String(who) : '')
    if (name) row.people.add(name)
  }

  // The devices table: the counter and the row's own stamps.
  for (const [id, d] of Object.entries(devices || {})) {
    touch(id, d, at(d?.lastAt), null, d?.lastPersonId)
    const row = found.get(id)
    row.inDevicesTable = true
    row.actions = at(d?.visits)
    if (at(d?.firstAt)) {
      row.firstSeen = row.firstSeen ? Math.min(row.firstSeen, at(d.firstAt)) : at(d.firstAt)
    }
  }

  for (const entry of Object.values(signIns || {})) {
    touch(entry?.device?.id, entry?.device, entry?.at, 'signIns', entry?.personId)
  }

  for (const perItem of Object.values(comments || {})) {
    for (const c of Object.values(perItem || {})) {
      touch(c?.device?.id, c?.device, c?.at, 'comments', c?.personId)
    }
  }

  for (const perItem of Object.values(reactions || {})) {
    for (const r of Object.values(perItem || {})) {
      if (!r?.symbol) continue
      touch(r?.device?.id, r?.device, r?.at, 'reactions', r?.personId)
    }
  }

  return [...found.values()]
    .map((row) => {
      const d = row.detail || {}
      const likely = isApple(d) ? guessAppleModel(d.screen, d.dpr) : ''
      return {
        ...row,
        detail: d,
        people: [...row.people],
        kind: deviceKind(d),
        likelyModel: likely,
        label: bestLabel(d, likely),
        resolution: resolution(d),
        // The model is reported by Android; inferred, and only narrowed to a
        // group, on an iPhone or iPad.
        modelIsReported: Boolean(d.model),
      }
    })
    .sort((a, b) => b.lastSeen - a.lastSeen || a.id.localeCompare(b.id))
}

export default buildDeviceReport
