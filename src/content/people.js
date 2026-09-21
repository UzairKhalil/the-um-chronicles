// ---------------------------------------------------------------------------
// people.js — who can open the gate, and the codes that open it.
// ---------------------------------------------------------------------------
// These codes ship inside the public JavaScript bundle. They keep a passer-by
// out; they will not stop anyone who opens the browser devtools. Do not reuse
// a code here that unlocks anything that matters.
//
// The codes are never written to the database and never logged.
//
// partner: true   one of the two people the Sign belongs to. Exactly two
//                 people must have this: a day enters the Chronicle when both
//                 partners sign it, and the Sign draws one half for each.
//                 The ids 'u' and 'm' are also written into the Firebase
//                 rules — changing them means republishing the rules.
// partner: false  a guest. Can read everything and leave comments, but cannot
//                 sign the Sign or react (the rules only accept 'u' and 'm').
// ---------------------------------------------------------------------------

export const people = [
  {
    id: 'u',
    code: '24680',
    name: 'Uzair',
    partner: true,
    // The admin sees #history. Only one person should have this.
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
    partner: true,
    admin: false,
    accent: '#E8C07D', // warm gold
    accentSoft: 'rgba(232, 192, 125, 0.16)',
    greeting: 'Welcome back, Maryam.',
  },
  {
    id: 'g',
    code: '10101',
    name: 'Guest',
    partner: false,
    admin: false,
    accent: '#B9A7D6', // dusk lavender
    accentSoft: 'rgba(185, 167, 214, 0.16)',
    greeting: 'Welcome.',
  },
]

/** The two people the Sign and the Chronicle belong to, in drawing order. */
export const partners = people.filter((p) => p.partner)

export const byId = (id) => people.find((p) => p.id === id) || null
export const byCode = (code) => people.find((p) => p.code === String(code).trim()) || null
/** The other partner. Null for a guest, who has no other half. */
export const otherThan = (id) =>
  byId(id)?.partner ? partners.find((p) => p.id !== id) || null : null

export default people
