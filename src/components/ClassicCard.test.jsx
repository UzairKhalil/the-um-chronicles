import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeFakeDb } from '../test/fakeDb.js'
import { readReferences, hasProvenance } from '../test/classicsSource.js'

// Tests must never touch the live database.
vi.mock('../lib/db.js', () => makeFakeDb())
vi.mock('../lib/device.js', () => ({
  describeDevice: async () => ({ id: 'dev-1' }),
  deviceId: () => 'dev-1',
  deviceLabel: () => 'test',
  deviceFirstSeen: () => null,
}))

const ClassicCard = (await import('./ClassicCard.jsx')).default
const Poetry = (await import('./Poetry.jsx')).default
const classics = (await import('../content/classics.js')).default

const seat = { id: 'u', partner: true, name: 'Uzair', admin: true }
const english = classics.find((e) => e.lang === 'en' && e.original.includes('\n'))
const urdu = classics.find((e) => e.lang === 'ur')

describe('an English card', () => {
  it('shows the original line by line, and its meaning', () => {
    const { container } = render(<ClassicCard entry={english} seat={seat} />)
    const lines = [...container.querySelectorAll('.classic__english .classic__line')]
    expect(lines.map((l) => l.textContent)).toEqual(english.original.split('\n'))
    expect(screen.getByText(english.meaning_en)).toBeInTheDocument()
  })

  it('offers the Urdu, in both languages', () => {
    render(<ClassicCard entry={english} seat={seat} />)
    const toggle = screen.getByRole('button', { name: /see in urdu/i })
    expect(within(toggle).getByText('اردو میں دیکھیں')).toHaveAttribute('dir', 'rtl')
  })

  it('switches to our translation, labelled as a translation, right to left', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClassicCard entry={english} seat={seat} />)
    await user.click(screen.getByRole('button', { name: /see in urdu/i }))

    expect(screen.getByText('Urdu translation')).toBeInTheDocument()
    const ur = container.querySelector('.classic__urdu')
    expect(ur).toHaveAttribute('dir', 'rtl')
    expect(ur).toHaveAttribute('lang', 'ur')
    expect([...ur.querySelectorAll('.classic__line')].map((l) => l.textContent)).toEqual(
      english.urdu_translation.split('\n')
    )
    expect(container.querySelector('.classic__english')).toBeNull()
  })

  it('switches back to English', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClassicCard entry={english} seat={seat} />)
    await user.click(screen.getByRole('button', { name: /see in urdu/i }))
    await user.click(screen.getByRole('button', { name: /see in english/i }))
    expect(container.querySelector('.classic__english')).not.toBeNull()
    expect(screen.queryByText('Urdu translation')).toBeNull()
  })
})

describe('an Urdu card', () => {
  it('shows the couplet right to left, as two lines', () => {
    const { container } = render(<ClassicCard entry={urdu} seat={seat} />)
    const ur = container.querySelector('.classic__urdu')
    expect(ur).toHaveAttribute('dir', 'rtl')
    expect(ur).toHaveAttribute('lang', 'ur')
    expect(ur.querySelectorAll('.classic__line')).toHaveLength(2)
    // The original is the original — never labelled as a translation.
    expect(screen.queryByText('Urdu translation')).toBeNull()
  })

  it('switches to Roman Urdu and the meaning', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClassicCard entry={urdu} seat={seat} />)
    await user.click(screen.getByRole('button', { name: /see in english/i }))
    const roman = container.querySelector('.classic__roman')
    expect([...roman.querySelectorAll('.classic__line')].map((l) => l.textContent)).toEqual(
      urdu.roman.split('\n')
    )
    expect(screen.getByText(urdu.meaning_en)).toBeInTheDocument()
    expect(container.querySelector('.classic__urdu')).toBeNull()
  })
})

describe('the poetry page', () => {
  it('puts the section below the owner’s poems, under its own heading', () => {
    const { container } = render(<Poetry seat={seat} onGo={() => {}} />)
    const poems = container.querySelector('.poems')
    const section = container.querySelector('.classics')
    expect(section).not.toBeNull()
    expect(within(section).getByRole('heading', { name: 'Their Words, Our Story' })).toBeInTheDocument()
    // Document order: poems first, then the classics — never mixed together.
    expect(poems.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(poems).queryAllByRole('article').some((a) => a.classList.contains('classic'))).toBe(false)
    expect(section.querySelectorAll('.classic')).toHaveLength(classics.length)
  })

  it('renders each card from text fields only', () => {
    const { container } = render(<Poetry seat={seat} onGo={() => {}} />)
    const cards = [...container.querySelectorAll('.classic')]
    expect(cards).toHaveLength(classics.length)
    for (const card of cards) {
      // body + toggle + comments: no extra line for an author or a source
      expect(card.querySelector('.classic__source, .classic__author, cite')).toBeNull()
    }
  })

  // Names are known only where the local provenance record exists.
  it.skipIf(!hasProvenance())('shows no reference anywhere — no author, work or film', () => {
    const { container } = render(<Poetry seat={seat} onGo={() => {}} />)
    const text = container.textContent
    for (const ref of readReferences()) expect(text, ref).not.toContain(ref)
  })
})
