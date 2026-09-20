import { vi } from 'vitest'

/**
 * An in-memory stand-in for ../lib/db.js, so no test can reach Firebase.
 * Every test file that renders a component mocks ../lib/db.js with this.
 */
export function makeFakeDb(initial = {}) {
  let tree = structuredClone(initial)
  const listeners = new Map()

  const getAt = (path) => {
    let node = tree
    for (const p of path.split('/').filter(Boolean)) {
      if (node == null || typeof node !== 'object') return null
      node = node[p]
    }
    return node === undefined ? null : node
  }

  const setAt = (path, value) => {
    const parts = path.split('/').filter(Boolean)
    let node = tree
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i]
      if (node[p] == null || typeof node[p] !== 'object') node[p] = {}
      node = node[p]
    }
    const last = parts[parts.length - 1]
    if (value === null) delete node[last]
    else node[last] = value
    notify(path)
  }

  const notify = (changed) => {
    listeners.forEach((set, path) => {
      if (
        changed === path ||
        changed.startsWith(`${path}/`) ||
        path.startsWith(`${changed}/`)
      ) {
        set.forEach((fn) => fn(getAt(path)))
      }
    })
  }

  let n = 0

  const api = {
    // what the app imports
    subscribe: vi.fn((path, cb) => {
      if (!listeners.has(path)) listeners.set(path, new Set())
      listeners.get(path).add(cb)
      cb(getAt(path))
      return () => listeners.get(path)?.delete(cb)
    }),
    get: vi.fn(async (path) => getAt(path)),
    set: vi.fn(async (path, value) => setAt(path, value)),
    update: vi.fn(async (path, patch) => {
      for (const [k, v] of Object.entries(patch || {})) setAt(`${path}/${k}`, v)
    }),
    push: vi.fn(async (path, value) => {
      n += 1
      const key = `k${n}`
      setAt(`${path}/${key}`, value)
      return key
    }),
    remove: vi.fn(async (path) => setAt(path, null)),
    transact: vi.fn(async (path, fn) => {
      const next = fn(getAt(path))
      if (next === undefined) return { committed: false, value: getAt(path) }
      setAt(path, next)
      return { committed: true, value: next }
    }),
    serverNow: vi.fn(() => 1_700_000_000_000),
    getServerOffset: () => 0,
    getStatus: () => 'online',
    onStatus: (fn) => {
      fn('online')
      return () => {}
    },
    usingFirebase: false,
    sanitize: (v) => v,
    NS: 'umc',

    // test helpers
    __tree: () => tree,
    __seed: (next) => {
      tree = structuredClone(next)
      listeners.forEach((set, path) => set.forEach((fn) => fn(getAt(path))))
    },
  }

  api.default = api
  return api
}
