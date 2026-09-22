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

const tabs = () => screen.getAllByRole('tab').map((t) => t.textContent)
const selected = () => screen.getByRole('tab', { selected: true }).textContent

describe('the tabs', () => {
  it('are English then Urdu on every card, whatever its language', () => {
    for (const entry of [english, urdu]) {
      const { unmount } = render(<ClassicCard entry={entry} seat={seat} />)
      expect(tabs()).toEqual(['English', 'Urdu'])
      unmount()
    }
  })

  it('open on the original language', () => {
    const a = render(<ClassicCard entry={english} seat={seat} />)
    expect(selected()).toBe('English')
    a.unmount()
    render(<ClassicCard entry={urdu} seat={seat} />)
    expect(selected()).toBe('Urdu')
  })

  it('switch with the arrow keys too', async () => {
    const user = userEvent.setup()
    render(<ClassicCard entry={english} seat={seat} />)
    screen.getByRole('tab', { name: 'English' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(selected()).toBe('Urdu')
  })
})

describe('an English card', () => {
  it('shows the original line by line, and its meaning', () => {
    const { container } = render(<ClassicCard entry={english} seat={seat} />)
    const lines = [...container.querySelectorAll('.classic__english .classic__line')]
    expect(lines.map((l) => l.textContent)).toEqual(english.original.split('\n'))
    expect(screen.getByText(english.meaning_en)).toBeInTheDocument()
  })

  it('switches to our translation, labelled as a translation, right to left', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClassicCard entry={english} seat={seat} />)
    await user.click(screen.getByRole('tab', { name: 'Urdu' }))

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
    await user.click(screen.getByRole('tab', { name: 'Urdu' }))
    await user.click(screen.getByRole('tab', { name: 'English' }))
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
    await user.click(screen.getByRole('tab', { name: 'English' }))
    const roman = container.querySelector('.classic__roman')
    expect([...roman.querySelectorAll('.classic__line')].map((l) => l.textContent)).toEqual(
      urdu.roman.split('\n')
    )
    expect(screen.getByText(urdu.meaning_en)).toBeInTheDocument()
    expect(container.querySelector('.classic__urdu')).toBeNull()
  })
})

describe('the poetry page', () => {
  it('gives the owner’s bilingual poems the same English | Urdu tabs', async () => {
    const user = userEvent.setup()
    const { container } = render(<Poetry seat={seat} onGo={() => {}} />)
    const bilingual = [...container.querySelectorAll('.poem')].find((p) =>
      p.querySelector('[role="tablist"]')
    )
    expect(bilingual).toBeTruthy()
    const t = within(bilingual)
    expect(t.getAllByRole('tab').map((x) => x.textContent)).toEqual(['English', 'Urdu'])
    await user.click(t.getByRole('tab', { name: 'Urdu' }))
    expect(bilingual.querySelector('.poem__body--urdu')).toHaveAttribute('dir', 'rtl')
  })

  it('renders each card from text fields only', () => {
    const { container } = render(<Poetry seat={seat} onGo={() => {}} section="words" />)
    const cards = [...container.querySelectorAll('.classic')]
    expect(cards).toHaveLength(classics.length)
    for (const card of cards) {
      // body + toggle + comments: no extra line for an author or a source
      expect(card.querySelector('.classic__source, .classic__author, cite')).toBeNull()
    }
  })

  // Names are known only where the local provenance record exists.
  it.skipIf(!hasProvenance())('shows no reference anywhere — no author, work or film', () => {
    const { container } = render(<Poetry seat={seat} onGo={() => {}} section="words" />)
    const text = container.textContent
    for (const ref of readReferences()) expect(text, ref).not.toContain(ref)
  })
})
