import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeFakeDb } from './test/fakeDb.js'

// Tests must never touch the live database.
vi.mock('./lib/db.js', () => makeFakeDb())
vi.mock('./lib/device.js', () => ({
  describeDevice: async () => ({ id: 'dev-1' }),
  deviceId: () => 'dev-1',
  deviceLabel: () => 'test',
  deviceFirstSeen: () => null,
}))
vi.mock('./lib/version.js', () => ({ watchForNewBuild: () => () => {} }))
// The real preference helpers, a recording stand-in for the player.
vi.mock('./lib/music.js', async (importOriginal) => {
  const real = await importOriginal()
  return {
    ...real,
    music: { start: vi.fn(() => true), stop: vi.fn(), prime: vi.fn(), isPlaying: vi.fn() },
    primeAudio: vi.fn(),
  }
})

const App = (await import('./App.jsx')).default
const { music } = await import('./lib/music.js')

const signIn = () => sessionStorage.setItem('umc.seat', 'u')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('background music', () => {
  it('stays silent, with no button, on the code screen', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /music/i })).toBeNull()
    expect(music.start).not.toHaveBeenCalled()
  })

  it('starts muted after signing in, with the corner button offering to play it', () => {
    signIn()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Play the music' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(music.start).not.toHaveBeenCalled()
  })

  it('plays on a tap, remembers it, and mutes on the next', async () => {
    signIn()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Play the music' }))
    expect(music.start).toHaveBeenCalled()
    expect(localStorage.getItem('umc.music')).toBe('on')
    const mute = screen.getByRole('button', { name: 'Mute the music' })
    expect(mute).toHaveAttribute('aria-pressed', 'true')

    music.stop.mockClear()
    await user.click(mute)
    expect(music.stop).toHaveBeenCalled()
    expect(localStorage.getItem('umc.music')).toBe('off')
  })

  it('plays straight away on a device that turned it on before', () => {
    localStorage.setItem('umc.music', 'on')
    signIn()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Mute the music' })).toBeInTheDocument()
    expect(music.start).toHaveBeenCalled()
  })

  it('has no volume buttons — just mute and unmute', () => {
    signIn()
    render(<App />)
    expect(screen.queryByRole('button', { name: /louder|softer/i })).toBeNull()
  })

  it('stops when the person signs out', async () => {
    localStorage.setItem('umc.music', 'on')
    signIn()
    const user = userEvent.setup()
    render(<App />)
    music.stop.mockClear()
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(music.stop).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /music/i })).toBeNull()
  })
})
