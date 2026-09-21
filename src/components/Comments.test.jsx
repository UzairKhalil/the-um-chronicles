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

const Comments = (await import('./Comments.jsx')).default

const uzair = { id: 'u', partner: true, name: 'Uzair', admin: true }
const maryam = { id: 'm', partner: true, name: 'Maryam', admin: false }

const open = async (user) => {
  await user.click(screen.getByRole('button', { name: /comments/i }))
}

beforeEach(() => {
  fake.__seed({})
  vi.clearAllMocks()
})

describe('comments', () => {
  it('pre-fills the name with whoever is signed in', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={maryam} />)
    await open(user)
    expect(screen.getByLabelText('Name')).toHaveValue('Maryam')
  })

  it('lets the name be edited', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Someone else')
    expect(name).toHaveValue('Someone else')
  })

  it('refuses to submit with no comment, and says which field', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    await user.click(screen.getByRole('button', { name: /leave it/i }))
    expect(screen.getByText('Please write a comment.')).toBeInTheDocument()
    expect(screen.queryByText('Please add a name.')).not.toBeInTheDocument()
    expect(fake.push).not.toHaveBeenCalled()
  })

  it('refuses to submit with no name, and says which field', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Comment'), 'lovely')
    await user.click(screen.getByRole('button', { name: /leave it/i }))
    expect(screen.getByText('Please add a name.')).toBeInTheDocument()
    expect(screen.queryByText('Please write a comment.')).not.toBeInTheDocument()
    expect(fake.push).not.toHaveBeenCalled()
  })

  it('refuses whitespace as a name', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, '   ')
    await user.type(screen.getByLabelText('Comment'), 'lovely')
    await user.click(screen.getByRole('button', { name: /leave it/i }))
    expect(screen.getByText('Please add a name.')).toBeInTheDocument()
    expect(fake.push).not.toHaveBeenCalled()
  })

  it('sends when both fields are there, and clears the box', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    await user.type(screen.getByLabelText('Comment'), 'This one is my favourite.')
    await user.click(screen.getByRole('button', { name: /leave it/i }))
    await waitFor(() =>
      expect(screen.getByText('This one is my favourite.')).toBeInTheDocument()
    )
    expect(screen.getByLabelText('Comment')).toHaveValue('')
  })

  it('shows the newest comment first', async () => {
    fake.__seed({
      comments: {
        'poem:x': {
          a: { name: 'Uzair', text: 'older', at: 1000 },
          b: { name: 'Maryam', text: 'newer', at: 2000 },
        },
      },
    })
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    const texts = [...document.querySelectorAll('.comment__text')].map((n) => n.textContent)
    expect(texts).toEqual(['newer', 'older'])
  })

  it('lets the admin delete a comment', async () => {
    fake.__seed({
      comments: { 'poem:x': { a: { name: 'Maryam', text: 'hello', at: 1000 } } },
    })
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await open(user)
    await user.click(screen.getByRole('button', { name: /delete the comment/i }))
    await waitFor(() => expect(screen.queryByText('hello')).not.toBeInTheDocument())
  })

  it('offers no delete button to anyone else', async () => {
    fake.__seed({
      comments: { 'poem:x': { a: { name: 'Uzair', text: 'hello', at: 1000 } } },
    })
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={maryam} />)
    await open(user)
    expect(screen.queryByRole('button', { name: /delete the comment/i })).not.toBeInTheDocument()
  })
})

describe('reactions', () => {
  it('toggles one on and off again, without accumulating', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)

    const heart = screen.getByRole('button', { name: /heart/i })
    await user.click(heart)
    await waitFor(() => expect(heart).toHaveAttribute('aria-pressed', 'true'))
    expect(fake.__tree().reactions['poem:x'].u.symbol).toBe('heart')

    await user.click(heart)
    await waitFor(() => expect(heart).toHaveAttribute('aria-pressed', 'false'))
    expect(fake.__tree().reactions['poem:x']?.u).toBeUndefined()
  })

  it('keeps one reaction per person, replacing the last', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={uzair} />)
    await user.click(screen.getByRole('button', { name: /heart/i }))
    await waitFor(() => expect(fake.__tree().reactions['poem:x'].u.symbol).toBe('heart'))
    await user.click(screen.getByRole('button', { name: /rose/i }))
    await waitFor(() => expect(fake.__tree().reactions['poem:x'].u.symbol).toBe('rose'))
    expect(Object.keys(fake.__tree().reactions['poem:x'])).toEqual(['u'])
  })

  it('counts both of us separately', async () => {
    fake.__seed({
      reactions: {
        'poem:x': {
          u: { symbol: 'heart', name: 'Uzair', at: 1 },
          m: { symbol: 'heart', name: 'Maryam', at: 2 },
        },
      },
    })
    render(<Comments itemId="poem:x" seat={uzair} />)
    expect(screen.getByRole('button', { name: /heart/i })).toHaveTextContent('2')
  })
})

describe('a guest', () => {
  const guest = { id: 'g', partner: false, name: 'Guest', admin: false }

  it('sees the reactions but cannot add one', async () => {
    fake.__seed({ reactions: { 'poem:x': { u: { symbol: 'heart', name: 'Uzair', at: 1 } } } })
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={guest} />)
    const heart = screen.getByRole('button', { name: /heart/i })
    expect(heart).toBeDisabled()
    expect(heart).toHaveTextContent('1')
    await user.click(heart)
    expect(fake.transact).not.toHaveBeenCalled()
  })

  it('can comment, with the name pre-filled as Guest', async () => {
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={guest} />)
    await open(user)
    expect(screen.getByLabelText('Name')).toHaveValue('Guest')
    await user.type(screen.getByLabelText('Comment'), 'Beautiful.')
    await user.click(screen.getByRole('button', { name: /leave it/i }))
    await waitFor(() => expect(screen.getByText('Beautiful.')).toBeInTheDocument())
  })

  it('cannot delete comments', async () => {
    fake.__seed({ comments: { 'poem:x': { a: { name: 'Uzair', text: 'hello', at: 1 } } } })
    const user = userEvent.setup()
    render(<Comments itemId="poem:x" seat={guest} />)
    await open(user)
    expect(screen.queryByRole('button', { name: /delete the comment/i })).not.toBeInTheDocument()
  })
})
