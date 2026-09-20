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

  // A shared ritual needs one shared idea of "today", or two phones in two
  // countries disagree about whether a day counted. Every day boundary in the
  // app is computed in this time zone, on the server's clock — not the
  // viewer's. Any IANA zone works: 'Asia/Karachi', 'Europe/London', 'UTC'.
  dayTimeZone: 'Asia/Karachi',

  // Small print on the gate. Required by nobody but us — say it anyway.
  privacyNote:
    'Visits, signatures and comments are recorded here, along with basic details about the device you are using. Only the two of us can see them.',

  // Heading of the record the Sign builds.
  chronicleTitle: 'The Chronicle',
  chronicleBlurb: 'Every day we both signed.',

  // The Sign itself.
  signPrompt: 'Touch to sign',
  signNoteLabel: 'Leave a line with your signature (optional)',
  signNotePlaceholder: 'a word, a thought, nothing…',
}

export default meta
