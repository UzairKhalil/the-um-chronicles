import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeFakeDb } from '../test/fakeDb.js'

// Tests must never touch the live database.
vi.mock('../lib/db.js', () => makeFakeDb())
vi.mock('../lib/device.js', () => ({
  describeDevice: async () => ({ id: 'dev-1' }),
  deviceId: () => 'dev-1',
  deviceLabel: () => 'test',
  deviceFirstSeen: () => null,
}))

const Poetry = (await import('./Poetry.jsx')).default
const { isPoetrySection } = await import('./Poetry.jsx')
const poems = (await import('../content/poems.js')).default
const classics = (await import('../content/classics.js')).default
const { sign: myQuotes } = await import('../content/quotes.js')

const seat = { id: 'u', partner: true, name: 'Uzair', admin: true }
const guest = { id: 'g', partner: false, name: 'Guest', admin: false }
const show = (section, who = seat) => render(<Poetry seat={who} onGo={() => {}} section={section} />)

describe('three separate tabs', () => {
  it('are Poems, Quotes and Their Words, in that order', () => {
    show('poems')
    const tabs = within(screen.getByRole('tablist', { name: 'What to read' })).getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Poems', 'Quotes', 'Their Words'])
  })

  it('each have their own address', () => {
    expect(['poems', 'quotes', 'words'].every(isPoetrySection)).toBe(true)
    expect(isPoetrySection('history')).toBe(false)
    expect(isPoetrySection('')).toBe(false)
  })

  it('go to the tab’s own address when chosen', async () => {
    const user = userEvent.setup()
    const onGo = vi.fn()
    render(<Poetry seat={seat} onGo={onGo} section="poems" />)
    await user.click(screen.getByRole('tab', { name: 'Their Words' }))
    expect(onGo).toHaveBeenCalledWith('words')
    await user.click(screen.getByRole('tab', { name: 'Quotes' }))
    expect(onGo).toHaveBeenCalledWith('quotes')
  })

  it('show only the owner’s poems on Poems', () => {
    const { container } = show('poems')
    expect(screen.getByRole('tab', { name: 'Poems' })).toHaveAttribute('aria-selected', 'true')
    expect(container.querySelectorAll('.poem')).toHaveLength(poems.length)
    expect(container.querySelector('.classic, .quote-card')).toBeNull()
  })

  it('show only the owner’s own lines on Quotes', () => {
    const { container } = show('quotes')
    const cards = [...container.querySelectorAll('.quote-card')]
    expect(cards.map((c) => c.querySelector('.quote-card__text').textContent)).toEqual(myQuotes)
    expect(container.querySelector('.poem, .classic')).toBeNull()
  })

  it('show only other writers on Their Words, under their heading', () => {
    const { container } = show('words')
    expect(screen.getByRole('heading', { name: 'Their Words, Our Story' })).toBeInTheDocument()
    expect(container.querySelectorAll('.classic')).toHaveLength(classics.length)
    expect(container.querySelector('.poem, .quote-card')).toBeNull()
  })

  it('no longer repeats a random quote at the foot of the poems', () => {
    const { container } = show('poems')
    expect(container.querySelector('.closing-quote')).toBeNull()
  })
})

describe('copying', () => {
  const copied = () => navigator.clipboard.readText()

  it('copies a quote exactly, and says so', async () => {
    const user = userEvent.setup()
    show('quotes')
    const first = screen.getAllByRole('button', { name: 'Copy this line' })[0]
    await user.click(first)
    expect(await copied()).toBe(myQuotes[0])
    await waitFor(() => expect(first).toHaveTextContent('Copied'))
  })

  it('copies a poem as shown: title, blank line, then its lines', async () => {
    const user = userEvent.setup()
    show('poems')
    const english = poems.find((p) => p.lang === 'en')
    const card = screen.getByRole('heading', { name: english.title }).closest('article')
    await user.click(within(card).getByRole('button', { name: 'Copy this poem' }))
    expect(await copied()).toBe([english.title, '', ...english.body].join('\n'))
  })

  it('copies whichever language tab is open on a classic', async () => {
    const user = userEvent.setup()
    const { container } = show('words')
    const entry = classics.find((e) => e.lang === 'en')
    const card = container.querySelector('.classic')

    await user.click(within(card).getByRole('button', { name: 'Copy' }))
    expect(await copied()).toBe(entry.original)

    await user.click(within(card).getByRole('tab', { name: 'Urdu' }))
    await user.click(within(card).getByRole('button', { name: 'Copy' }))
    expect(await copied()).toBe(entry.urdu_translation)
  })

  it('copies only the text — never the meaning line, never a reference', async () => {
    const user = userEvent.setup()
    const { container } = show('words')
    const entry = classics.find((e) => e.lang === 'ur')
    const card = [...container.querySelectorAll('.classic')][classics.indexOf(entry)]
    await user.click(within(card).getByRole('button', { name: 'Copy' }))
    const text = await copied()
    expect(text).toBe(entry.original)
    expect(text).not.toContain(entry.meaning_en)
  })

  it('works for a guest too', async () => {
    const user = userEvent.setup()
    show('quotes', guest)
    await user.click(screen.getAllByRole('button', { name: 'Copy this line' })[1])
    expect(await copied()).toBe(myQuotes[1])
  })
})
