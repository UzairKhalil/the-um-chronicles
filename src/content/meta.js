// ---------------------------------------------------------------------------
// meta.js — titles, labels and dates. Edit freely; nothing here is structural.
// ---------------------------------------------------------------------------
// NOTE: everything in this folder is compiled into the public JavaScript
// bundle. Anyone who finds the site URL can read it without entering a code.
// The code gate hides things from a casual visitor, not from a determined one.
// ---------------------------------------------------------------------------

export const meta = {
  // Shown on the gate and at the top of the app. Initials only in public text.
  title: 'The U&M Chronicles',
  subtitle: 'Two Souls, One Story',

  // >>> FILL THIS IN <<<  Appears under the title once signed in.
  // Anything works: 'Since 14 March 2021', 'Since the winter of 2019'.
  since: 'Since 24 March 2024',

  // The button that opens the poetry page.
  poetryLabel: "Uzair's Love for Maryam",

  // Background music: original pieces played live in the browser (music.js).
  // onByDefault   whether it plays on a device that has never chosen
  // levels        how many steps the − / + buttons have
  // defaultLevel  where a device starts; the middle, as asked. Each device
  //               remembers its own level after that.
  // The loudness of each level is set in music.js (levelToGain) and was
  // measured, not guessed — see CLAUDE.md.
  music: {
    onByDefault: true,
    levels: 9,
    defaultLevel: 5,
  },

  // The three tabs on the poetry page, kept separate: your poems, your own
  // short lines, and other writers' words.
  poemsTabLabel: 'Poems',
  quotesTabLabel: 'Quotes',
  classicsTabLabel: 'Their Words',

  // The tab holding other writers' words (classics.js).
  // It is the only thing on screen saying the words are someone else's — no
  // author or source is shown on any card, by the owner's choice.
  classicsTitle: 'Their Words, Our Story',
  classicsBlurb: 'Lines others wrote long ago, that say it too.',

  // A shared ritual needs one shared idea of "today", or two phones in two
  // countries disagree about whether a day counted. Every day boundary in the
  // app is computed in this time zone, on the server's clock — not the
  // viewer's. Any IANA zone works: 'Asia/Karachi', 'Europe/London', 'UTC'.
  dayTimeZone: 'Asia/Karachi',

  // Heading of the record the Sign builds.
  chronicleTitle: 'The Chronicle',
  chronicleBlurb: 'Every day we both signed.',

  // The Sign itself.
  signPrompt: 'Touch to sign',
  signNoteLabel: 'Leave a line with your signature (optional)',
  signNotePlaceholder: 'a word, a thought, nothing…',
}

export default meta
