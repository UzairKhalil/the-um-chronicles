// ---------------------------------------------------------------------------
// people.js — the two of us, and the codes that open the gate.
// ---------------------------------------------------------------------------
// These codes ship inside the public JavaScript bundle. They keep a passer-by
// out; they will not stop anyone who opens the browser devtools. Do not reuse
// a code here that unlocks anything that matters.
//
// The codes are never written to the database and never logged.
// ---------------------------------------------------------------------------

export const people = [
  {
    id: 'u',
    code: '24680',
    name: 'Uzair',
    // The admin sees #history. Only one of us should have this.
    admin: true,
    // Accent used across the app once this person is signed in.
    accent: '#E2A9A0', // dusk rose
    accentSoft: 'rgba(226, 169, 160, 0.16)',
    greeting: 'Welcome back, Uzair.',
  },
  {
    id: 'm',
    code: '13579',
    name: 'Maryam',
    admin: false,
    accent: '#E8C07D', // warm gold
    accentSoft: 'rgba(232, 192, 125, 0.16)',
    greeting: 'Welcome back, Maryam.',
  },
]

export const byId = (id) => people.find((p) => p.id === id) || null
export const byCode = (code) => people.find((p) => p.code === String(code).trim()) || null
export const otherThan = (id) => people.find((p) => p.id !== id) || null

export default people
