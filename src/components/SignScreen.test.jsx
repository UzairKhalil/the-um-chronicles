import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeFakeDb } from '../test/fakeDb.js'

// Tests must never touch the live database.
const fake = makeFakeDb()
vi.mock('../lib/db.js', () => fake)
vi.mock('../lib/device.js', () => ({
  describeDevice: async () => ({ id: 'dev-1', model: 'Pixel 8' }),
  deviceId: () => 'dev-1',
  deviceLabel: () => 'Pixel 8',
  deviceFirstSeen: () => null,
}))

const SignScreen = (await import('./SignScreen.jsx')).default
const { today } = await import('../lib/day.js')

const uzair = { id: 'u', partner: true, name: 'Uzair', admin: true, accent: '#E2A9A0', accentSoft: 'x' }
const maryam = { id: 'm', partner: true, name: 'Maryam', admin: false, accent: '#E8C07D', accentSoft: 'x' }

const show = (seat) => render(<SignScreen seat={seat} onBusy={() => {}} onGo={() => {}} />)
const sign = async (user) => user.click(screen.getByRole('button', { name: /^sign today$/i }))

beforeEach(() => {
  fake.__seed({})
  vi.clearAllMocks()
})

describe('the sign', () => {
  it('starts with neither of us having signed', () => {
    show(uzair)
    expect(screen.getByText(/neither of you has signed today/i)).toBeInTheDocument()
    expect(document.querySelector('.sign--bloomed')).toBeNull()
  })

  it('records a signature for whoever is signed in', async () => {
    const user = userEvent.setup()
    show(maryam)
    await sign(user)
    await waitFor(() => expect(fake.__tree().days[today()].m).toBeTruthy())
    expect(fake.__tree().days[today()].u).toBeUndefined()
  })

  it('waits for the other half, and says whose', async () => {
    const user = userEvent.setup()
    show(uzair)
    await sign(user)
    expect(await screen.findByText(/waiting for/i)).toHaveTextContent('Maryam')
    expect(document.querySelector('.sign--bloomed')).toBeNull()
  })

  it('tells you when the other has signed and you have not', () => {
    fake.__seed({ days: { [today()]: { m: { at: 1, note: '' } } } })
    show(uzair)
    expect(screen.getByText(/your half is still quiet/i)).toBeInTheDocument()
  })

  it('blooms once both have signed on the same day', async () => {
    fake.__seed({ days: { [today()]: { m: { at: 1, note: '' } } } })
    const user = userEvent.setup()
    show(uzair)
    await sign(user)
    await waitFor(() =>
      expect(screen.getByText(/you have both signed today/i)).toBeInTheDocument()
    )
    expect(document.querySelector('.sign--bloomed')).not.toBeNull()
  })

  it('does not bloom on two signatures from different days', () => {
    fake.__seed({
      days: { '2020-01-01': { u: { at: 1 } }, [today()]: { m: { at: 2 } } },
    })
    show(uzair)
    expect(document.querySelector('.sign--bloomed')).toBeNull()
  })

  it('offers no second signature once you have signed', async () => {
    const user = userEvent.setup()
    show(uzair)
    await sign(user)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^sign today$/i })).not.toBeInTheDocument()
    )
  })

  it('keeps the optional line with the signature and shows it', async () => {
    const user = userEvent.setup()
    show(uzair)
    await user.click(screen.getByRole('button', { name: /leave a line with it/i }))
    await user.type(screen.getByLabelText(/leave a line/i), 'A very ordinary Tuesday.')
    await sign(user)
    await waitFor(() =>
      expect(fake.__tree().days[today()].u.note).toBe('A very ordinary Tuesday.')
    )
    expect(await screen.findByText('A very ordinary Tuesday.')).toBeInTheDocument()
  })

  it('signs without a line, which is the normal case', async () => {
    const user = userEvent.setup()
    show(uzair)
    await sign(user)
    await waitFor(() => expect(fake.__tree().days[today()].u.note).toBe(''))
  })

  it('counts the days both of us signed', () => {
    const both = { u: { at: 1 }, m: { at: 2 } }
    fake.__seed({
      days: { '2026-01-01': both, '2026-01-02': both, '2026-01-03': { u: { at: 1 } } },
    })
    show(uzair)
    expect(screen.getByText(/days you both signed/i).previousSibling).toHaveTextContent('2')
  })

  it('writes the signature of the person actually seated, after a seat change', async () => {
    // The stale-identity bug: a callback that closed over the first person to
    // sign in kept writing that person's name into shared state for days.
    const user = userEvent.setup()
    const { rerender } = show(uzair)
    rerender(<SignScreen seat={maryam} onBusy={() => {}} onGo={() => {}} />)
    await sign(user)
    await waitFor(() => expect(fake.__tree().days[today()].m).toBeTruthy())
    expect(fake.__tree().days[today()].u).toBeUndefined()
  })
})

describe('a guest', () => {
  const guest = { id: 'g', partner: false, name: 'Guest', admin: false, accent: '#B9A7D6', accentSoft: 'x' }

  it('sees the Sign but cannot sign it', () => {
    show(guest)
    expect(screen.queryByRole('button', { name: /^sign today$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /leave a line/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /touch to sign/i })).not.toBeInTheDocument()
    expect(screen.getByText(/neither has signed today/i)).toBeInTheDocument()
  })

  it('is told who has signed and who is awaited', () => {
    fake.__seed({ days: { [today()]: { u: { at: 1, note: '' } } } })
    show(guest)
    expect(screen.getByText(/has signed\. waiting for maryam/i)).toHaveTextContent('Uzair')
  })

  it('watches the bloom when both have signed', () => {
    fake.__seed({ days: { [today()]: { u: { at: 1 }, m: { at: 2 } } } })
    show(guest)
    expect(screen.getByText(/they have both signed today/i)).toBeInTheDocument()
    expect(document.querySelector('.sign--bloomed')).not.toBeNull()
    expect(screen.getByText(/day they both signed/i)).toBeInTheDocument()
  })

  it('sees the lines the two of them left', () => {
    fake.__seed({ days: { [today()]: { u: { at: 1, note: 'A good day.' }, m: { at: 2 } } } })
    show(guest)
    expect(screen.getByText('A good day.')).toBeInTheDocument()
  })
})
