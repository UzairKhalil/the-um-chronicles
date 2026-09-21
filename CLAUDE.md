# CLAUDE.md

Notes for anyone (or any agent) working on this repository. Factual only.

## What this is

A two-person private web app. React + Vite, plain CSS, Vitest, Firebase
Realtime Database, deployed to GitHub Pages by GitHub Actions.

Three screens plus an admin page:

| Route        | Screen                                                  |
| ------------ | ------------------------------------------------------- |
| *(none)*     | The Sign — the daily shared gesture                     |
| `#chronicle` | The record of days both people signed                   |
| `#poems`     | The poetry page, English and Urdu                       |
| `#history`   | Admin only. No link to it exists anywhere in the UI.    |

## Decisions, and the traps behind them

### Routing is hash-based, and must stay that way

`vite.config.js` sets `base: './'` so the build works at a project-page URL
(`https://user.github.io/repo/`) without the repo name compiled in. That only
holds while there is no path-based router. Adding React Router with paths
breaks every asset URL on Pages. Second pages are hashes.

### The Firebase project is shared with another app

Project `khalil-a67e5`. Another app's data and rules live in the same
database.

* **Everything is namespaced under the single top-level key `/umc`.** `db.js`
  is the only module that builds a path, and it prefixes every one. Never call
  the SDK directly from a component.
* **Rules are per-database.** Publishing a ruleset replaces the whole thing.
  `firebase.rules.json` holds the `umc` fragment *only* — it is not a
  publishable file. Read the live ruleset from the console, add the `umc` key
  into it, publish the merged result. Publishing the fragment alone deletes the
  other app's rules.

### The web config is checked in on purpose

`src/lib/firebaseConfig.js` is public by design; it identifies the project and
authorises nothing. It ends up in the bundle either way. What constrains writes
is the ruleset.

The SDK is loaded through a dynamic `import()` in `db.js`, so a build with no
config never downloads it. With no database reachable the app falls back to a
localStorage adapter behind the same interface and says so on screen, rather
than hanging or failing quietly.

### Everything editable lives in `src/content/`

`meta.js` (titles, labels, the "Since" line, the day time zone), `quotes.js`,
`poems.js`, `people.js` (the two people, their codes, their accent colours).

All of it compiles into the public JavaScript bundle. The gate keeps out a
passer-by, not anyone who opens devtools.

`quotes.js → gate` is shown before a code is entered, so those lines must not
contain either person's name. Everywhere else is fine.

### Urdu

* `dir="rtl" lang="ur"` goes on the poem element only, never on `<html>` — the
  whole layout flips otherwise.
* Noto Nastaliq Urdu renders small and very tall. It is set larger than the
  English with `line-height: 2.45`. Reduce that and descenders collide with the
  line below.
* **Never apply `letter-spacing` to Urdu.** It breaks the letter joining that
  Nastaliq is made of. `poetry.css` pins it to `normal !important` inside
  `.poem__body--urdu`.

### The admin page

`#history` renders only when the seated person has `admin: true` in
`people.js`. Anyone else who types that address gets the ordinary app — no
message, no hint. There is no button to it anywhere.

Tables scroll sideways inside `.hbox`; the page itself never scrolls sideways
(`overflow-x: hidden` on `html, body` in `global.css`). The first column of
every table is `position: sticky; left: 0`.

### What a browser will and will not report

`device.js` collects what it can. The honest ceiling:

* Android Chrome gives a real model through high-entropy Client Hints.
* An iPhone only ever says "iPhone". Safari implements no Client Hints.
* **No** browser exposes the owner-given device name.
* **No** browser exposes an IP address. Getting one means calling a
  third-party lookup service. There is none here, deliberately.
* Devices are told apart by a random id in `localStorage`. Clearing site data
  mints a new one.

Codes are never written to the database, never logged, never persisted. Only a
person `id` goes into `sessionStorage`.

### Sessions expire

The owner asked for this; an earlier build remembered the seat indefinitely.
The code screen comes back when:

* **the tab or browser closes** — the seat lives in `sessionStorage`, which
  the browser discards with the tab (`lib/session.js`);
* **the page is hidden** — minimised, phone locked, switched to another app
  or tab (`hooks/useSessionExpiry.js`);
* **five minutes pass with no touch, key or scroll** — also that hook. Each
  activity also checks the wall-clock gap, because timers freeze while a
  device sleeps.

The trap: **a reload also makes the page hidden**, and so would sign people out
on every refresh and every `version.js` auto-reload into a new deploy. A
reload is told apart by `beforeunload`, which fires on reload and close but
never on minimise. The page records when it left, and `loadSeat()` keeps the
seat only if it came back within 10 seconds — which also drops the seat when
a browser restores closed tabs along with their `sessionStorage`. The
back/forward cache is handled on `pageshow`. Do not "simplify" this into
`pagehide` or a bare `visibilitychange`; both fire on reload.

## Engineering rules — do not rediscover these

1. **Tests must never touch the live database.** `src/test/setup.js` registers
   module mocks for `firebase/app` and `firebase/database` that **throw**, and
   every test file additionally mocks `../lib/db.js` with
   `src/test/fakeDb.js`. Do not weaken either. An earlier project assumed
   "the build is unconfigured so tests are safe", that stopped being true the
   moment a real config existed, and one run wrote 65 fake records into real
   data.
2. **Any callback that uses the signed-in person must list them as a
   dependency.** A `useCallback` with `[]` keeps a stale identity and writes
   the wrong person's name into shared state. See the deps on `doSign` in
   `SignScreen.jsx` and `toggle` in `Reactions.jsx`, and the regression test
   "writes the signature of the person actually seated, after a seat change".
3. **Writes that depend on current shared state use `transact`, not `set`.**
   Signing, and toggling a reaction, both read-then-write; two devices racing
   would otherwise lose one of the writes.
4. **Realtime Database rejects `undefined` anywhere in a write and silently
   drops `null` inside arrays.** Several `navigator` fields are `undefined` on
   some browsers. Everything goes through `sanitize()` in `db.js`. It is
   tested.
5. **"Today" and "recent" are judged on the server clock**, via
   `.info/serverTimeOffset`, and rendered in the one shared zone from
   `meta.dayTimeZone`. Never `new Date()` on the viewer's device: phone clocks
   run minutes out, and two people then disagree about whether a day counted.
6. **Write source files with a file-writing tool.** Piping large file contents
   through shell heredocs on Windows/Git Bash fails and silently writes
   nothing.
7. **Verify in a real browser at phone width**, not only in tests. 360×640 and
   390×780.
8. **Clean up test data.** If you write to the live database while testing,
   delete exactly what you wrote and confirm nothing else went with it.
9. **A write the rules rejected is not a write that died.** The Firebase SDK
   keeps rejected writes queued in the tab and retries them — so a signature
   refused while the rules were missing landed in real data the moment the
   rules were published, minutes later and with no browser open on that page.
   Before publishing rules, stop the dev server and close every tab running
   the app, or the first thing the new rules permit is a backlog of test
   writes. Use `?local=1` for browser testing and the live database never
   comes into it.

## Deploying

Push to `master` (this repository's default branch). The workflow tests,
builds and publishes.

* **Settings → Pages → Source must be "GitHub Actions".** On "Deploy from a
  branch", GitHub runs its own workflow alongside this one, the two race, and
  the raw repository gets published instead of the built app. Changing the
  setting does not republish; a new deploy is needed after it.
* Pages caches `index.html` for ten minutes. After a deploy, verify with a
  cache-busting request, not a browser refresh.
* CI's Node version is pinned in `deploy.yml` and must satisfy `engines` in
  `package.json`. A mismatch installs fine and fails at test time.
* Every build writes `version.json`; the running page polls it and reloads
  into a new deploy when nothing is mid-write (`lib/version.js`). Phones keep
  tabs open for days on old JavaScript otherwise.

## Discretion

The repository and the published site are public.

* Only initials appear in the static HTML, the page title, the meta
  description, the README and this file.
* `index.html` carries `robots: noindex, nofollow`, and `public/robots.txt`
  disallows everything.
* The gate no longer carries a notice that visits and comments are recorded;
  the owner removed it. The recording itself is unchanged.

## Commands

```
npm run dev     # dev server
npm test        # vitest, once
npm run build   # version.json + vite build
npm run preview # serve dist
```
