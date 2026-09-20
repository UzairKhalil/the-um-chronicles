// ---------------------------------------------------------------------------
// device.js — everything the browser is willing to say about the device.
// ---------------------------------------------------------------------------
// The honest ceiling, so nobody expects more from the history page than it can
// give:
//
//   * Android Chrome will report a model ("SM-S911B", "Pixel 8") through the
//     high-entropy User-Agent Client Hints. Ask for it and it usually answers.
//   * An iPhone only ever says "iPhone". iOS reports no model, no generation,
//     no storage. Safari does not implement UA-CH at all.
//   * NO browser exposes the name the owner gave the device ("Maryam's
//     iPhone"). That lives in the OS and is not web-readable.
//   * NO browser exposes an IP address. Getting one requires calling a
//     third-party lookup service, which would hand our traffic to a stranger.
//     We do not do that.
//
// To tell two devices apart we mint a random id once and keep it in
// localStorage. Clearing site data mints a new one; that is the trade.
// ---------------------------------------------------------------------------

const ID_KEY = 'umc.device.id'
const NICK_KEY = 'umc.device.firstSeen'

function randomId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().slice(0, 12)
  } catch {
    /* fall through */
  }
  return `d${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

/** A stable random id for this browser profile on this device. */
export function deviceId() {
  try {
    let id = localStorage.getItem(ID_KEY)
    if (!id) {
      id = randomId()
      localStorage.setItem(ID_KEY, id)
      localStorage.setItem(NICK_KEY, String(Date.now()))
    }
    return id
  } catch {
    // Private mode with storage blocked: a per-session id is the best we can do.
    if (!globalThis.__umcEphemeralId) globalThis.__umcEphemeralId = randomId()
    return globalThis.__umcEphemeralId
  }
}

export function deviceFirstSeen() {
  try {
    const v = Number(localStorage.getItem(NICK_KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

// --- parsing the user agent string -----------------------------------------
// Only used as a fallback where Client Hints are unavailable (Safari, Firefox).

function parseBrowser(ua) {
  const tests = [
    [/Edg[eA-Z]*\/([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/SamsungBrowser\/([\d.]+)/, 'Samsung Internet'],
    [/FxiOS\/([\d.]+)/, 'Firefox'],
    [/CriOS\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ]
  for (const [re, name] of tests) {
    const m = ua.match(re)
    if (m) return { browser: name, browserVersion: m[1].split('.')[0] }
  }
  return { browser: 'Unknown', browserVersion: '' }
}

function parseSystem(ua) {
  let m
  if ((m = ua.match(/Android\s([\d.]+)/))) return { os: 'Android', osVersion: m[1] }
  if ((m = ua.match(/(iPhone|iPad|iPod).*OS\s([\d_]+)/)))
    return { os: m[1] === 'iPhone' ? 'iOS' : 'iPadOS', osVersion: m[2].replace(/_/g, '.') }
  if ((m = ua.match(/Windows NT ([\d.]+)/))) {
    const map = { '10.0': '10 or 11', '6.3': '8.1', '6.2': '8', '6.1': '7' }
    return { os: 'Windows', osVersion: map[m[1]] || m[1] }
  }
  if ((m = ua.match(/Mac OS X ([\d_]+)/)))
    return { os: 'macOS', osVersion: m[1].replace(/_/g, '.') }
  if (/CrOS/.test(ua)) return { os: 'ChromeOS', osVersion: '' }
  if (/Linux/.test(ua)) return { os: 'Linux', osVersion: '' }
  return { os: 'Unknown', osVersion: '' }
}

function parseModel(ua) {
  // Android puts the model in the build token: "(Linux; Android 14; SM-S911B)"
  const m = ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/|[;)])/)
  if (m) {
    const model = m[1].trim()
    if (model && !/^wv$/i.test(model)) return model
  }
  if (/iPhone/.test(ua)) return 'iPhone' // the ceiling on iOS
  if (/iPad/.test(ua)) return 'iPad'
  return ''
}

// --- the snapshot ----------------------------------------------------------

/**
 * Collect everything available. Async because high-entropy Client Hints are a
 * promise. Never throws; missing fields come back as '' or null, never
 * undefined — Realtime Database rejects undefined anywhere in a write.
 */
export async function describeDevice() {
  const nav = typeof navigator === 'undefined' ? {} : navigator
  const ua = nav.userAgent || ''
  const scr = typeof screen === 'undefined' ? {} : screen

  const base = {
    id: deviceId(),
    ...parseBrowser(ua),
    ...parseSystem(ua),
    model: parseModel(ua),
    platform: nav.platform || '',
    mobile: null,
    ua,
    language: nav.language || '',
    languages: Array.isArray(nav.languages) ? nav.languages.slice(0, 4).join(', ') : '',
    timeZone: '',
    screen: scr.width && scr.height ? `${scr.width}×${scr.height}` : '',
    dpr:
      typeof devicePixelRatio === 'number' ? Math.round(devicePixelRatio * 100) / 100 : null,
    colorDepth: typeof scr.colorDepth === 'number' ? scr.colorDepth : null,
    window:
      typeof innerWidth === 'number' ? `${innerWidth}×${innerHeight}` : '',
    orientation: scr.orientation?.type || '',
    touchPoints: typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints : null,
    cores: typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null,
    memoryGB: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    network: '',
    downlinkMbps: null,
    rttMs: null,
    saveData: null,
    reducedMotion: null,
    standalone: null,
  }

  try {
    base.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    /* leave blank */
  }

  const conn = nav.connection || nav.mozConnection || nav.webkitConnection
  if (conn) {
    base.network = conn.effectiveType || conn.type || ''
    if (typeof conn.downlink === 'number') base.downlinkMbps = conn.downlink
    if (typeof conn.rtt === 'number') base.rttMs = conn.rtt
    if (typeof conn.saveData === 'boolean') base.saveData = conn.saveData
  }

  try {
    base.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    base.standalone = matchMedia('(display-mode: standalone)').matches
  } catch {
    /* jsdom and old browsers */
  }

  // High-entropy Client Hints: Chromium only, and the single best source of a
  // real Android model. Safari and Firefox do not implement this at all.
  try {
    const uaData = nav.userAgentData
    if (uaData) {
      base.mobile = Boolean(uaData.mobile)
      if (uaData.platform) base.os = uaData.platform || base.os
      const hints = await uaData.getHighEntropyValues([
        'model',
        'platformVersion',
        'fullVersionList',
        'architecture',
        'bitness',
      ])
      if (hints.model) base.model = hints.model
      if (hints.platformVersion) base.osVersion = hints.platformVersion
      const full = hints.fullVersionList?.find(
        (b) => !/Not.?A.?Brand/i.test(b.brand) && !/Chromium/i.test(b.brand)
      )
      if (full) {
        base.browser = full.brand
        base.browserVersion = full.version
      }
      if (hints.architecture) {
        base.platform = [hints.architecture, hints.bitness].filter(Boolean).join('-')
      }
    }
  } catch {
    /* hints refused — the parsed UA above is the fallback */
  }

  return base
}

/** A one-line label for a device, for table cells and the devices summary. */
export function deviceLabel(d) {
  if (!d) return 'Unknown device'
  const model = d.model && d.model !== d.os ? d.model : ''
  const sys = [d.os, d.osVersion].filter(Boolean).join(' ')
  const br = [d.browser, d.browserVersion].filter(Boolean).join(' ')
  return [model, sys, br].filter(Boolean).join(' · ') || 'Unknown device'
}
