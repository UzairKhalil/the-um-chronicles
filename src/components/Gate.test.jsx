import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeFakeDb } from '../test/fakeDb.js'

// Tests must never touch the live database.
vi.mock('../lib/db.js', () => makeFakeDb())

const Gate = (await import('./Gate.jsx')).default

const type = async (user, value) => {
  const input = document.querySelector('.code__input')
  await user.click(input)
  await user.type(input, value)
}

describe('the gate', () => {
  it('shows the title and subtitle', () => {
    render(<Gate onEnter={() => {}} status="online" />)
    expect(screen.getByText('The U&M Chronicles')).toBeInTheDocument()
    expect(screen.getByText('Two Souls, One Story')).toBeInTheDocument()
  })

  it('never shows either of our names before a code is entered', () => {
    const { container } = render(<Gate onEnter={() => {}} status="online" />)
    expect(container.textContent).not.toMatch(/Uzair/i)
    expect(container.textContent).not.toMatch(/Maryam/i)
  })

  it('carries no recording notice (removed at the owner’s request)', () => {
    const { container } = render(<Gate onEnter={() => {}} status="online" />)
    expect(container.textContent).not.toMatch(/recorded/i)
    expect(container.textContent).not.toMatch(/device you are using/i)
  })

  it('opens for the first code', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<Gate onEnter={onEnter} status="online" />)
    await type(user, '24680')
    await waitFor(() => expect(onEnter).toHaveBeenCalled(), { timeout: 2000 })
    expect(onEnter.mock.calls[0][0].id).toBe('u')
  })

  it('opens for the second code', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<Gate onEnter={onEnter} status="online" />)
    await type(user, '13579')
    await waitFor(() => expect(onEnter).toHaveBeenCalled(), { timeout: 2000 })
    expect(onEnter.mock.calls[0][0].id).toBe('m')
  })

  it('opens for the guest code', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<Gate onEnter={onEnter} status="online" />)
    await type(user, '10101')
    await waitFor(() => expect(onEnter).toHaveBeenCalled(), { timeout: 2000 })
    expect(onEnter.mock.calls[0][0]).toMatchObject({
      id: 'g',
      name: 'Guest',
      partner: false,
      admin: false,
    })
  })

  it('refuses a wrong code, kindly, and does not open', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<Gate onEnter={onEnter} status="online" />)
    await type(user, '11111')
    expect(await screen.findByRole('alert')).toHaveTextContent(/not one of our codes/i)
    expect(onEnter).not.toHaveBeenCalled()
  })

  it('ignores anything that is not a digit', async () => {
    const user = userEvent.setup()
    render(<Gate onEnter={() => {}} status="online" />)
    await type(user, 'ab12')
    expect(document.querySelector('.code__input').value).toBe('12')
  })

  it('says so when there is no database', () => {
    render(<Gate onEnter={() => {}} status="local" />)
    expect(screen.getByText(/no database is reachable/i)).toBeInTheDocument()
  })

  it('says nothing about the database when it is reachable', () => {
    render(<Gate onEnter={() => {}} status="online" />)
    expect(screen.queryByText(/no database is reachable/i)).not.toBeInTheDocument()
  })
})
