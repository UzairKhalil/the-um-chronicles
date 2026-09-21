import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// ---------------------------------------------------------------------------
// TESTS MUST NEVER TOUCH THE LIVE DATABASE.
// ---------------------------------------------------------------------------
// A previous project learned this the hard way: its tests assumed the build
// was unconfigured, that stopped being true the moment a real config existed,
// and a single run wrote 65 fake records into real data.
//
// So this is a belt-and-braces guard. Every test file mocks ../lib/db.js for
// itself; on top of that, these two module mocks are registered globally, and
// they THROW rather than return a stub. If any code path ever reaches the real
// Firebase SDK from a test, the test fails loudly instead of writing.
// ---------------------------------------------------------------------------

const forbid = (name) => () => {
  throw new Error(
    `A test reached the real Firebase SDK (${name}). Mock ../lib/db.js in that test file.`
  )
}

vi.mock('firebase/app', () => ({
  initializeApp: forbid('firebase/app initializeApp'),
  getApps: () => [],
}))

vi.mock('firebase/database', () => ({
  getDatabase: forbid('firebase/database getDatabase'),
  ref: forbid('ref'),
  onValue: forbid('onValue'),
  set: forbid('set'),
  update: forbid('update'),
  push: forbid('push'),
  remove: forbid('remove'),
  get: forbid('get'),
  off: forbid('off'),
  runTransaction: forbid('runTransaction'),
}))

// jsdom has no matchMedia; several components ask about reduced motion.
if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
