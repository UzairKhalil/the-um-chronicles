// ---------------------------------------------------------------------------
// db.js — the only module that talks to Firebase.
// ---------------------------------------------------------------------------
// Two adapters behind one interface:
//
//   firebase  when a config is present (see ./firebaseConfig.js)
//   local     when it is not — an in-memory tree persisted to localStorage,
//             so the app still runs, still records, and says it is local.
//
// The Firebase SDK is pulled in with a dynamic import(), so a build with no
// config never downloads it.
//
// EVERY path is namespaced under NS. Never call a path helper with a leading
// slash or an absolute path — the other app lives in the same database.
// ---------------------------------------------------------------------------

import { firebaseConfig, isConfigured } from './firebaseConfig.js'

export const NS = 'umc'

const nsPath = (path) => `${NS}/${String(path).replace(/^\/+/, '')}`

// --- status ----------------------------------------------------------------
// 'local'      no config at all; running on this device only
// 'connecting' config present, waiting for the first connection
// 'online'     connected
// 'offline'    configured but not reachable right now
// 'error'      the SDK failed to load or initialise
let status = isConfigured ? 'connecting' : 'local'
const statusListeners = new Set()

function setStatus(next) {
  if (next === status) return
  status = next
  statusListeners.forEach((fn) => fn(status))
}

export function getStatus() {
  return status
}

export function onStatus(fn) {
  statusListeners.add(fn)
  fn(status)
  return () => statusListeners.delete(fn)
}

// --- sanitising ------------------------------------------------------------
// Realtime Database rejects `undefined` anywhere in a write, and silently
// drops `null` entries inside arrays (which shifts every later index). Several
// navigator fields are undefined on some browsers, so everything we write goes
// through here first.
export function sanitize(value) {
  if (value === undefined || value === null) return null
  if (Array.isArray(value)) {
    return value
      .map(sanitize)
      .filter((v) => v !== null)
  }
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const clean = sanitize(v)
      if (clean !== null) out[k] = clean
    }
    return out
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  return value
}

// --- server clock ----------------------------------------------------------
// Device clocks run minutes out. Anything time-sensitive (what "today" is,
// whether a signature is recent) is judged on the server's clock, obtained
// from /.info/serverTimeOffset. In local mode the offset is simply 0.
let serverOffset = 0

export function serverNow() {
  return Date.now() + serverOffset
}

export function getServerOffset() {
  return serverOffset
}

// ===========================================================================
// local adapter
// ===========================================================================
const LOCAL_KEY = 'umc.local.db'

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeLocal(tree) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(tree))
  } catch {
    /* storage full or blocked — stay quiet, the app still works in memory */
  }
}

const localListeners = new Map() // path -> Set<fn>

function localGet(path) {
  const parts = path.split('/').filter(Boolean)
  let node = readLocal()
  for (const p of parts) {
    if (node == null || typeof node !== 'object') return null
    node = node[p]
  }
  return node === undefined ? null : node
}

function localSet(path, value) {
  const parts = path.split('/').filter(Boolean)
  const tree = readLocal()
  let node = tree
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i]
    if (node[p] == null || typeof node[p] !== 'object') node[p] = {}
    node = node[p]
  }
  const last = parts[parts.length - 1]
  if (value === null) delete node[last]
  else node[last] = value
  writeLocal(tree)
  notifyLocal(path)
}

function notifyLocal(changed) {
  localListeners.forEach((set, path) => {
    if (changed === path || changed.startsWith(`${path}/`) || path.startsWith(`${changed}/`)) {
      const v = localGet(path)
      set.forEach((fn) => fn(v))
    }
  })
}

let localPushCounter = 0
function localKey() {
  localPushCounter += 1
  return `L${Date.now().toString(36)}${localPushCounter.toString(36)}`
}

const localAdapter = {
  subscribe(path, cb) {
    if (!localListeners.has(path)) localListeners.set(path, new Set())
    localListeners.get(path).add(cb)
    cb(localGet(path))
    return () => {
      const set = localListeners.get(path)
      if (!set) return
      set.delete(cb)
      if (set.size === 0) localListeners.delete(path)
    }
  },
  async get(path) {
    return localGet(path)
  },
  async set(path, value) {
    localSet(path, sanitize(value))
  },
  async update(path, patch) {
    const clean = sanitize(patch) || {}
    for (const [k, v] of Object.entries(clean)) localSet(`${path}/${k}`, v)
  },
  async push(path, value) {
    const key = localKey()
    localSet(`${path}/${key}`, sanitize(value))
    return key
  },
  async remove(path) {
    localSet(path, null)
  },
  async transact(path, fn) {
    const current = localGet(path)
    const next = fn(current)
    if (next === undefined) return { committed: false, value: current }
    localSet(path, sanitize(next))
    return { committed: true, value: next }
  },
}

// ===========================================================================
// firebase adapter (lazily loaded)
// ===========================================================================
let fbPromise = null

function loadFirebase() {
  if (fbPromise) return fbPromise
  fbPromise = (async () => {
    const [{ initializeApp }, rtdb] = await Promise.all([
      import('firebase/app'),
      import('firebase/database'),
    ])
    const app = initializeApp(firebaseConfig)
    const db = rtdb.getDatabase(app)

    // Connection state, and the server clock offset.
    rtdb.onValue(rtdb.ref(db, '.info/connected'), (snap) => {
      setStatus(snap.val() === true ? 'online' : 'offline')
    })
    rtdb.onValue(rtdb.ref(db, '.info/serverTimeOffset'), (snap) => {
      const v = snap.val()
      if (typeof v === 'number' && Number.isFinite(v)) serverOffset = v
    })

    return { db, rtdb }
  })().catch((err) => {
    setStatus('error')
    // Reset so a later call can retry rather than reusing a rejected promise.
    fbPromise = null
    throw err
  })
  return fbPromise
}

const firebaseAdapter = {
  subscribe(path, cb) {
    let off = null
    let cancelled = false
    loadFirebase()
      .then(({ db, rtdb }) => {
        if (cancelled) return
        const r = rtdb.ref(db, path)
        const handler = rtdb.onValue(
          r,
          (snap) => cb(snap.val()),
          () => cb(null)
        )
        off = () => rtdb.off(r, 'value', handler)
      })
      .catch(() => cb(null))
    return () => {
      cancelled = true
      if (off) off()
    }
  },
  async get(path) {
    const { db, rtdb } = await loadFirebase()
    const snap = await rtdb.get(rtdb.ref(db, path))
    return snap.exists() ? snap.val() : null
  },
  async set(path, value) {
    const { db, rtdb } = await loadFirebase()
    await rtdb.set(rtdb.ref(db, path), sanitize(value))
  },
  async update(path, patch) {
    const { db, rtdb } = await loadFirebase()
    await rtdb.update(rtdb.ref(db, path), sanitize(patch) || {})
  },
  async push(path, value) {
    const { db, rtdb } = await loadFirebase()
    const r = await rtdb.push(rtdb.ref(db, path), sanitize(value))
    return r.key
  },
  async remove(path) {
    const { db, rtdb } = await loadFirebase()
    await rtdb.remove(rtdb.ref(db, path))
  },
  // Writes that depend on the value already there — toggling a reaction,
  // adding today's signature — must go through a transaction, never a blind
  // set, or two devices racing will lose one of the two writes.
  async transact(path, fn) {
    const { db, rtdb } = await loadFirebase()
    const res = await rtdb.runTransaction(rtdb.ref(db, path), (current) => {
      const next = fn(current)
      if (next === undefined) return undefined // abort, leave the value alone
      return sanitize(next)
    })
    return { committed: res.committed, value: res.snapshot.val() }
  },
}

const adapter = isConfigured ? firebaseAdapter : localAdapter

// ===========================================================================
// public interface — always namespaced
// ===========================================================================
export const subscribe = (path, cb) => adapter.subscribe(nsPath(path), cb)
export const get = (path) => adapter.get(nsPath(path))
export const set = (path, value) => adapter.set(nsPath(path), value)
export const update = (path, patch) => adapter.update(nsPath(path), patch)
export const push = (path, value) => adapter.push(nsPath(path), value)
export const remove = (path) => adapter.remove(nsPath(path))
export const transact = (path, fn) => adapter.transact(nsPath(path), fn)

export const usingFirebase = isConfigured

export default {
  NS,
  subscribe,
  get,
  set,
  update,
  push,
  remove,
  transact,
  serverNow,
  getStatus,
  onStatus,
  usingFirebase,
  sanitize,
}
