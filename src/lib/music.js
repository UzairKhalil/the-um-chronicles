// ---------------------------------------------------------------------------
// music.js — soft background music, composed here and played live.
// ---------------------------------------------------------------------------
// There are NO recordings and NO audio files. The pieces below are original
// compositions, written as notes, and played by the browser's Web Audio API:
// a soft piano-like voice over slow pads, with a little room reverb. Nothing
// to download, nothing to license — recorded songs are copyrighted, and this
// repository and site are public. See CLAUDE.md before adding any recording.
//
// Browsers only let sound start after the person has touched or typed. The
// code entry on the gate counts, so primeAudio() is called from there; after a
// reload the first touch anywhere starts it (see addUnlock).
//
// iPhones: the side silent switch mutes web audio. That is the phone, not us.
// ---------------------------------------------------------------------------

import meta from '../content/meta.js'

const PREF_KEY = 'umc.music'

/** This device's choice; defaults to meta.music.onByDefault. */
export function loadMusicPref() {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === 'on') return true
    if (v === 'off') return false
  } catch {
    /* storage blocked — use the default */
  }
  return meta.music?.onByDefault !== false
}

export function saveMusicPref(on) {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off')
  } catch {
    /* nothing to do */
  }
}

/** MIDI note number to frequency in Hz. */
export const mtof = (m) => 440 * 2 ** ((m - 69) / 12)

// ---------------------------------------------------------------------------
// The pieces. Original. Each is eight bars of four beats.
//   chords  one voicing per bar, as MIDI note numbers, played as a soft pad
//   arp     a quiet music-box figure: per eighth note, an index into the
//           chord (played an octave up), or null for a rest
//   melody  [beat 0–31, MIDI note, length in beats] — enters on the second
//           time round, so each piece opens with just its harmony
// ---------------------------------------------------------------------------
export const PIECES = [
  {
    name: 'Evening',
    bpm: 64,
    chords: [
      [53, 57, 60, 64], // Fmaj7
      [50, 57, 60, 65], // Dm7
      [46, 53, 57, 62], // B♭maj7
      [48, 53, 58, 62], // C7sus4
      [53, 57, 60, 64], // Fmaj7
      [45, 52, 55, 60], // Am7
      [46, 53, 57, 62], // B♭maj7
      [48, 55, 58, 64], // C7
    ],
    arp: [0, null, 2, null, 3, null, 2, null],
    melody: [
      [0, 69, 2], [2, 72, 1], [3, 76, 1],
      [4, 74, 3], [7, 72, 1],
      [8, 74, 2], [10, 72, 1], [11, 69, 1],
      [12, 67, 4],
      [16, 69, 2], [18, 72, 2],
      [20, 76, 3], [23, 74, 1],
      [24, 72, 2], [26, 74, 1], [27, 72, 1],
      [28, 70, 2], [30, 67, 2],
    ],
  },
  {
    name: 'Moonlight',
    bpm: 60,
    chords: [
      [50, 57, 61, 66], // Dmaj7
      [47, 54, 57, 62], // Bm7
      [43, 50, 54, 59], // Gmaj7
      [45, 52, 57, 61], // A
      [50, 57, 61, 66], // Dmaj7
      [42, 49, 52, 57], // F♯m7
      [43, 50, 54, 59], // Gmaj7
      [45, 52, 55, 61], // A7
    ],
    arp: [0, 1, 2, 3, 2, 1, 2, 3],
    melody: [
      [0, 78, 4],
      [4, 78, 2], [6, 76, 2],
      [8, 74, 4],
      [12, 73, 2], [14, 76, 2],
      [16, 78, 3], [19, 81, 1],
      [20, 76, 2], [22, 73, 2],
      [24, 71, 2], [26, 74, 2],
      [28, 73, 4],
    ],
  },
  {
    name: 'Remembering',
    bpm: 58,
    chords: [
      [45, 52, 55, 59], // Am9
      [41, 48, 52, 57], // Fmaj7
      [48, 52, 55, 59], // Cmaj7
      [43, 50, 55, 59], // G
      [45, 52, 55, 59], // Am9
      [50, 53, 57, 60], // Dm7
      [41, 48, 52, 57], // Fmaj7
      [40, 47, 52, 56], // E7
    ],
    arp: [0, null, 1, 2, null, 3, 2, null],
    melody: [
      [0, 76, 2], [2, 72, 1], [3, 71, 1],
      [4, 72, 3], [7, 69, 1],
      [8, 67, 2], [10, 71, 2],
      [12, 74, 4],
      [16, 76, 2], [18, 79, 2],
      [20, 77, 3], [23, 76, 1],
      [24, 72, 2], [26, 69, 2],
      [28, 68, 3], [31, 71, 1],
    ],
  },
]

/** Times round each piece before moving to the next (the first is harmony only). */
export const LOOPS_PER_PIECE = 3

const BEATS_PER_BAR = 4
const BARS = 8

function getAudioContextClass() {
  if (typeof window === 'undefined') return null
  return window.AudioContext || window.webkitAudioContext || null
}

export const musicSupported = () => Boolean(getAudioContextClass())

/** A decaying stereo noise burst: a small, warm room. */
function makeImpulse(ctx, seconds) {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * seconds)
  const buffer = ctx.createBuffer(2, length, rate)
  for (let c = 0; c < 2; c += 1) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6
    }
  }
  return buffer
}

/**
 * The player. `context` is for tests and offline rendering; normally a real
 * AudioContext is created on first use.
 */
export function createMusic({ volume = meta.music?.volume ?? 0.4, context = null } = {}) {
  let ctx = context
  let master = null
  let bus = null
  let built = false
  let timer = null
  let playing = false
  let piece = 0
  let loop = 0
  let bar = 0
  let barTime = 0
  let unlock = null

  function build() {
    if (built) return true
    if (!ctx) {
      const AC = getAudioContextClass()
      if (!AC) return false
      try {
        ctx = new AC()
      } catch {
        return false
      }
    }
    master = ctx.createGain()
    master.gain.value = 0

    // Keep it gentle: a soft compressor, then out.
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -24
    comp.ratio.value = 3
    master.connect(comp)
    comp.connect(ctx.destination)

    const reverb = ctx.createConvolver()
    reverb.buffer = makeImpulse(ctx, 3.2)
    const wet = ctx.createGain()
    wet.gain.value = 0.4
    const dry = ctx.createGain()
    dry.gain.value = 0.7

    bus = ctx.createGain()
    bus.connect(dry)
    dry.connect(master)
    bus.connect(reverb)
    reverb.connect(wet)
    wet.connect(master)

    built = true
    return true
  }

  // --- voices --------------------------------------------------------------

  function pad(notes, t, dur) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 850
    filter.Q.value = 0.4
    const g = ctx.createGain()
    const level = 0.13
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + Math.min(1.8, dur / 2))
    g.gain.setValueAtTime(level, t + Math.max(0.1, dur - 0.3))
    g.gain.linearRampToValueAtTime(0, t + dur + 1.8)
    filter.connect(g)
    g.connect(bus)
    notes.forEach((m, i) => {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = mtof(m)
      o.detune.value = i % 2 ? 6 : -6
      const og = ctx.createGain()
      og.gain.value = 1 / notes.length
      o.connect(og)
      og.connect(filter)
      o.start(t)
      o.stop(t + dur + 2)
    })
  }

  // A soft piano-like note: a sine with a quiet octave above, a quick touch
  // and a long exponential fade.
  function note(m, when, dur, velocity) {
    // The human looseness below can nudge a note a hair before zero; audio
    // times must never be negative, or the browser throws.
    const t = Math.max(0, when)
    const end = t + Math.max(1.4, dur * 0.9 + 1.3)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.26 * velocity, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, end)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2600
    g.connect(filter)
    filter.connect(bus)

    const o1 = ctx.createOscillator()
    o1.type = 'sine'
    o1.frequency.value = mtof(m)
    o1.connect(g)

    const o2 = ctx.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = mtof(m) * 2
    const g2 = ctx.createGain()
    g2.gain.value = 0.16
    o2.connect(g2)
    g2.connect(g)

    for (const o of [o1, o2]) {
      o.start(t)
      o.stop(end + 0.05)
    }
  }

  // A little human looseness, so it never sounds like a metronome.
  const loose = () => (Math.random() - 0.5) * 0.024

  function scheduleBar(t) {
    const p = PIECES[piece]
    const beat = 60 / p.bpm
    const i = bar % BARS
    const chord = p.chords[i]

    pad(chord, t, beat * BEATS_PER_BAR)

    p.arp.forEach((idx, k) => {
      if (idx == null) return
      note(chord[idx] + 12, t + k * (beat / 2) + loose(), beat / 2, 0.22 + Math.random() * 0.05)
    })

    if (loop >= 1) {
      for (const [b, m, len] of p.melody) {
        if (Math.floor(b / BEATS_PER_BAR) !== i) continue
        const at = t + (b - i * BEATS_PER_BAR) * beat + loose()
        note(m, at, len * beat, 0.5 + Math.random() * 0.1)
      }
    }
  }

  /** Schedule every bar that starts before `until` (seconds, context time). */
  function scheduleUntil(until) {
    while (barTime < until) {
      scheduleBar(barTime)
      barTime += (60 / PIECES[piece].bpm) * BEATS_PER_BAR
      bar += 1
      if (bar % BARS === 0) {
        loop += 1
        if (loop >= LOOPS_PER_PIECE) {
          loop = 0
          bar = 0
          piece = (piece + 1) % PIECES.length
          barTime += 2.5 // a breath between pieces
        }
      }
    }
  }

  function tick() {
    if (!playing || !ctx) return
    scheduleUntil(ctx.currentTime + 0.8)
  }

  function addUnlock() {
    if (unlock || typeof window === 'undefined') return
    unlock = () => {
      if (!ctx) return
      ctx.resume().then(() => {
        if (ctx.state === 'running') removeUnlock()
      }, () => {})
    }
    for (const e of ['pointerdown', 'keydown', 'touchend']) {
      window.addEventListener(e, unlock, { capture: true, passive: true })
    }
  }

  function removeUnlock() {
    if (!unlock) return
    for (const e of ['pointerdown', 'keydown', 'touchend']) {
      window.removeEventListener(e, unlock, { capture: true })
    }
    unlock = null
  }

  return {
    /** Create and wake the audio context inside a user gesture, silently. */
    prime() {
      if (!build()) return false
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
      return true
    },

    /** Start (or keep) playing, fading in gently. Returns false if unsupported. */
    start() {
      if (!build()) return false
      playing = true
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
        addUnlock()
      }
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(volume, now + 3.5)
      if (!timer) {
        barTime = Math.max(barTime, now + 0.15)
        timer = setInterval(tick, 200)
        tick()
      }
      return true
    },

    /** Fade out and go quiet. */
    stop() {
      playing = false
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      removeUnlock()
      if (!built) return
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(0, now + 1.2)
      barTime = 0 // the next start picks up from "now"
      setTimeout(() => {
        if (!playing && ctx && ctx.state === 'running' && typeof ctx.suspend === 'function') {
          ctx.suspend().catch(() => {})
        }
      }, 1500)
    },

    isPlaying: () => playing,

    // For offline rendering and tests only.
    _renderAhead(seconds) {
      if (!build()) return false
      master.gain.setValueAtTime(volume, 0)
      barTime = 0
      scheduleUntil(seconds)
      return true
    },
  }
}

/** The one player the app uses. */
export const music = createMusic()

/** Called from a user gesture (the code entry) so sound may start later. */
export function primeAudio() {
  if (loadMusicPref()) music.prime()
}
