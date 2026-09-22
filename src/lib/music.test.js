import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  PIECES,
  LOOPS_PER_PIECE,
  mtof,
  createMusic,
  loadMusicPref,
  saveMusicPref,
  musicSupported,
  VOLUME,
} from './music.js'
import meta from '../content/meta.js'

// No database here, and no real audio: a stand-in AudioContext records what
// the player asks for, so we can check volume, fades and the arrangement.

function fakeContext() {
  // As strict as a real browser: a negative or non-finite time throws.
  const time = (t) => {
    if (!Number.isFinite(t) || t < 0) throw new RangeError(`Time must be a finite non-negative number: ${t}`)
  }
  const param = (v = 0) => {
    const p = {
      value: v,
      history: [],
      setValueAtTime: vi.fn((x, t) => { time(t); p.value = x; p.history.push(x) }),
      linearRampToValueAtTime: vi.fn((x, t) => { time(t); p.value = x; p.history.push(x) }),
      exponentialRampToValueAtTime: vi.fn((x, t) => { time(t); p.history.push(x) }),
      cancelScheduledValues: vi.fn(),
    }
    return p
  }
  const node = () => ({ connect: vi.fn((n) => n), disconnect: vi.fn() })
  const oscillators = []
  const ctx = {
    currentTime: 0,
    sampleRate: 4000,
    state: 'running',
    destination: node(),
    createGain: () => ({ ...node(), gain: param(1) }),
    createDynamicsCompressor: () => ({
      ...node(), threshold: param(), ratio: param(), knee: param(), attack: param(), release: param(),
    }),
    createConvolver: () => ({ ...node(), buffer: null }),
    createBiquadFilter: () => ({ ...node(), type: '', frequency: param(), Q: param() }),
    createOscillator: () => {
      const o = {
        ...node(), type: '', frequency: param(), detune: param(),
        start: vi.fn((t) => time(t)), stop: vi.fn((t) => time(t)),
      }
      oscillators.push(o)
      return o
    },
    createBuffer: (_ch, len) => ({ getChannelData: () => new Float32Array(len) }),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
  }
  return { ctx, oscillators }
}

beforeEach(() => {
  vi.useRealTimers()
})

describe('the pieces', () => {
  it('are original compositions of eight four-beat bars', () => {
    expect(PIECES.length).toBeGreaterThanOrEqual(3)
    for (const p of PIECES) {
      expect(p.chords, p.name).toHaveLength(8)
      expect(p.arp, p.name).toHaveLength(8)
      expect(p.bpm, p.name).toBeGreaterThanOrEqual(50)
      expect(p.bpm, p.name).toBeLessThanOrEqual(72) // slow and gentle
    }
  })

  it('keep the harmony low and warm, and the melody in a soft middle register', () => {
    for (const p of PIECES) {
      for (const chord of p.chords) {
        expect(chord).toHaveLength(4)
        for (const n of chord) {
          expect(n).toBeGreaterThanOrEqual(36)
          expect(n).toBeLessThanOrEqual(72)
        }
      }
      for (const idx of p.arp) if (idx != null) expect([0, 1, 2, 3]).toContain(idx)
      for (const [beat, n, len] of p.melody) {
        expect(beat).toBeGreaterThanOrEqual(0)
        expect(beat + len).toBeLessThanOrEqual(32)
        expect(n).toBeGreaterThanOrEqual(60)
        expect(n).toBeLessThanOrEqual(84)
      }
    }
  })

  it('tunes to concert pitch', () => {
    expect(mtof(69)).toBeCloseTo(440)
    expect(mtof(81)).toBeCloseTo(880)
  })
})

describe('the player', () => {
  const withMaster = () => {
    const { ctx } = fakeContext()
    const gains = []
    const orig = ctx.createGain
    ctx.createGain = () => { const g = orig(); gains.push(g); return g }
    return { ctx, master: () => gains[0] } // the first gain node built
  }

  it('fades in to the fixed volume, never above it, and out to silence', () => {
    const { ctx, master } = withMaster()
    const player = createMusic({ context: ctx })
    player.start()
    expect(master().gain.value).toBeCloseTo(VOLUME)
    expect(Math.max(...master().gain.history)).toBeLessThanOrEqual(VOLUME + 1e-9)
    player.stop()
    expect(master().gain.value).toBe(0)
  })

  it('uses the measured middle volume', () => {
    // 1.12 measured about -24 dB in a real browser: soft, still carries.
    expect(VOLUME).toBeGreaterThanOrEqual(0.9)
    expect(VOLUME).toBeLessThanOrEqual(1.4)
  })

  it('opens each piece with harmony alone; the melody joins the second time round', () => {
    const p = PIECES[0]
    const bar = (60 / p.bpm) * 4
    const perBar = 4 + p.arp.filter((x) => x != null).length * 2
    const melodyNotesIn = (i) => p.melody.filter(([b]) => Math.floor(b / 4) === i).length * 2

    const first = fakeContext()
    createMusic({ context: first.ctx })._renderAhead(bar * 8 - 0.01)
    expect(first.oscillators).toHaveLength(perBar * 8)

    const two = fakeContext()
    createMusic({ context: two.ctx })._renderAhead(bar * 16 - 0.01)
    const secondLoop = [...Array(8).keys()].reduce((n, i) => n + perBar + melodyNotesIn(i), 0)
    expect(two.oscillators).toHaveLength(perBar * 8 + secondLoop)
  })

  it('moves on to the next piece after its turns, with a breath between', () => {
    const { ctx, oscillators } = fakeContext()
    const p0 = PIECES[0]
    const pieceLength = (60 / p0.bpm) * 4 * 8 * LOOPS_PER_PIECE
    createMusic({ context: ctx })._renderAhead(pieceLength + 3)
    const firstOfNext = mtof(PIECES[1].chords[0][0])
    expect(oscillators.some((o) => Math.abs(o.frequency.value - firstOfNext) < 0.01)).toBe(true)
  })

  it('waits for the first touch when the browser starts audio suspended', async () => {
    const { ctx } = fakeContext()
    ctx.state = 'suspended'
    let touched = false
    ctx.resume = vi.fn(async () => { if (touched) ctx.state = 'running' })
    const player = createMusic({ context: ctx })
    const tick = () => new Promise((r) => setTimeout(r, 0))

    player.start()
    await tick()
    expect(ctx.state).toBe('suspended') // no gesture yet: the browser says no

    touched = true
    window.dispatchEvent(new Event('pointerdown'))
    await tick()
    expect(ctx.state).toBe('running')

    // …and the listener has taken itself away.
    const calls = ctx.resume.mock.calls.length
    window.dispatchEvent(new Event('pointerdown'))
    await tick()
    expect(ctx.resume.mock.calls.length).toBe(calls)
    player.stop()
  })

  it('never schedules a note before time zero, however it is loosened', () => {
    // Rendering from t = 0 is where the timing looseness could go negative.
    for (let run = 0; run < 25; run += 1) {
      const { ctx } = fakeContext()
      expect(() => createMusic({ context: ctx })._renderAhead(40)).not.toThrow()
    }
  })

  it('does nothing, and does not throw, where the browser has no audio', () => {
    expect(musicSupported()).toBe(false) // jsdom
    const player = createMusic()
    expect(player.start()).toBe(false)
    expect(() => player.stop()).not.toThrow()
    expect(player.prime()).toBe(false)
  })
})

describe('each device remembers its choice', () => {
  it('starts muted, until someone turns it on', () => {
    expect(meta.music.onByDefault).toBe(false)
    expect(loadMusicPref()).toBe(false)
  })

  it('stays muted once muted, and back on once unmuted', () => {
    saveMusicPref(false)
    expect(loadMusicPref()).toBe(false)
    saveMusicPref(true)
    expect(loadMusicPref()).toBe(true)
  })
})
