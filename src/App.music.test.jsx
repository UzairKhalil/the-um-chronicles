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
    music: {
      start: vi.fn(() => true),
      stop: vi.fn(),
      prime: vi.fn(),
      isPlaying: vi.fn(),
      setLevel: vi.fn(),
    },
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

  it('plays once someone is signed in, with the corner button showing it is on', () => {
    signIn()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Mute the music' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(music.start).toHaveBeenCalled()
  })

  it('mutes on a tap, remembers it, and unmutes on the next', async () => {
    signIn()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Mute the music' }))
    expect(music.stop).toHaveBeenCalled()
    expect(localStorage.getItem('umc.music')).toBe('off')
    const again = screen.getByRole('button', { name: 'Play the music' })
    expect(again).toHaveAttribute('aria-pressed', 'false')

    music.start.mockClear()
    await user.click(again)
    expect(music.start).toHaveBeenCalled()
    expect(localStorage.getItem('umc.music')).toBe('on')
  })

  it('stays quiet on a device that chose silence', () => {
    localStorage.setItem('umc.music', 'off')
    signIn()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Play the music' })).toBeInTheDocument()
    expect(music.start).not.toHaveBeenCalled()
  })

  it('starts in the middle of the volume range', () => {
    signIn()
    render(<App />)
    expect(screen.getByRole('group', { name: 'Music, volume 5 of 9' })).toBeInTheDocument()
  })

  it('goes louder and softer a step at a time, and remembers it', async () => {
    signIn()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Louder' }))
    await user.click(screen.getByRole('button', { name: 'Louder' }))
    expect(music.setLevel).toHaveBeenLastCalledWith(7)
    expect(localStorage.getItem('umc.music.level')).toBe('7')
    expect(screen.getByRole('group', { name: 'Music, volume 7 of 9' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Softer' }))
    expect(music.setLevel).toHaveBeenLastCalledWith(6)
  })

  it('stops at the ends: Softer at the quietest, Louder at the loudest', () => {
    localStorage.setItem('umc.music.level', '1')
    signIn()
    const { unmount } = render(<App />)
    expect(screen.getByRole('button', { name: 'Softer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Louder' })).toBeEnabled()
    unmount()

    localStorage.setItem('umc.music.level', '9')
    render(<App />)
    expect(screen.getByRole('button', { name: 'Louder' })).toBeDisabled()
  })

  it('brings the music back when Louder is pressed while muted', async () => {
    localStorage.setItem('umc.music', 'off')
    signIn()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Louder' }))
    expect(music.start).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Mute the music' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('stops when the person signs out', async () => {
    signIn()
    const user = userEvent.setup()
    render(<App />)
    music.stop.mockClear()
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(music.stop).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /music/i })).toBeNull()
  })
})
