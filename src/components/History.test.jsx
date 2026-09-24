import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeFakeDb } from '../test/fakeDb.js'

// Tests must never touch the live database.
const fake = makeFakeDb()
vi.mock('../lib/db.js', () => fake)
vi.mock('../lib/device.js', () => ({
  describeDevice: async () => ({ id: 'dev-1' }),
  deviceId: () => 'dev-1',
  deviceLabel: () => 'test',
  deviceFirstSeen: () => null,
}))

const History = (await import('./History.jsx')).default
const meta = (await import('../content/meta.js')).default

const NOW = 1_700_000_000_000 // fake.serverNow()
const DAY = 24 * 60 * 60 * 1000
const phone = { id: 'dev-phone', model: 'SM-S911B', os: 'Android', browser: 'Chrome', mobile: true }

/** n sign-ins, one every six hours going back from now. */
const manySignIns = (n) => {
  const out = {}
  for (let i = 0; i < n; i += 1) {
    out[`s${i}`] = { at: NOW - i * 6 * 60 * 60 * 1000, personId: 'u', name: 'Uzair', device: phone }
  }
  return out
}

const show = () => render(<History seat={{ id: 'u', admin: true }} onClose={() => {}} />)
const sectionTitles = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

beforeEach(() => {
  fake.__seed({})
  vi.clearAllMocks()
})

describe('the order of the page', () => {
  it('puts Devices seen first — it matters most', () => {
    fake.__seed({ devices: { 'dev-phone': { ...phone, lastAt: NOW, firstAt: NOW - DAY, visits: 3 } } })
    show()
    expect(sectionTitles()[0]).toBe('Devices seen')
    expect(sectionTitles()[1]).toContain('Sign-ins')
    expect(sectionTitles()[2]).toBe('Comments and reactions')
  })
})

describe('the sign-ins table', () => {
  it('shows only the last few days, and says how many older ones are kept', () => {
    fake.__seed({
      signIns: {
        recent: { at: NOW - 2 * DAY, personId: 'u', name: 'Uzair', device: phone },
        old: { at: NOW - 9 * DAY, personId: 'm', name: 'Maryam', device: phone },
        older: { at: NOW - 40 * DAY, personId: 'm', name: 'Maryam', device: phone },
      },
    })
    show()
    const table = screen.getByRole('heading', { name: /Sign-ins/ }).closest('section')
    expect(within(table).getAllByRole('row')).toHaveLength(2) // header + one
    expect(screen.getByText(/2 older sign-ins are stored but not listed/)).toBeInTheDocument()
  })

  it('reaches back exactly the number of days in meta.js', () => {
    expect(meta.history.signInDays).toBe(3)
    fake.__seed({
      signIns: {
        just_inside: { at: NOW - 3 * DAY + 60_000, personId: 'u', name: 'Inside', device: phone },
        just_outside: { at: NOW - 3 * DAY - 60_000, personId: 'u', name: 'Outside', device: phone },
      },
    })
    show()
    expect(screen.getByRole('rowheader', { name: 'Inside' })).toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: 'Outside' })).toBeNull()
  })

  it('shows ten rows to start with, newest first', () => {
    fake.__seed({ signIns: manySignIns(11) }) // 11 × 6h fits inside three days
    show()
    const table = screen.getByRole('heading', { name: /Sign-ins/ }).closest('section')
    expect(within(table).getAllByRole('row')).toHaveLength(11) // header + ten
    expect(within(table).getByText('1–10 of 11')).toBeInTheDocument()
  })

  it('pages through the rest', async () => {
    fake.__seed({ signIns: manySignIns(11) })
    const user = userEvent.setup()
    show()
    const table = screen.getByRole('heading', { name: /Sign-ins/ }).closest('section')
    expect(within(table).getByText('1 / 2')).toBeInTheDocument()
    await user.click(within(table).getByRole('button', { name: 'Next page' }))
    expect(within(table).getByText('11–11 of 11')).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(2) // header + the last one
    await user.click(within(table).getByRole('button', { name: 'Previous page' }))
    expect(within(table).getByText('1–10 of 11')).toBeInTheDocument()
  })

  it('offers bigger pages, and uses the one chosen', async () => {
    fake.__seed({ signIns: manySignIns(11) })
    const user = userEvent.setup()
    show()
    const table = screen.getByRole('heading', { name: /Sign-ins/ }).closest('section')
    const choose = within(table).getByRole('combobox', { name: /how many sign-ins/i })
    expect([...choose.options].map((o) => o.value)).toEqual(['10', '15', '20', '50'])
    await user.selectOptions(choose, '20')
    expect(within(table).getAllByRole('row')).toHaveLength(12) // header + all eleven
    expect(within(table).getByText('1–11 of 11')).toBeInTheDocument()
  })

  it('stops the arrows at the first and last page', async () => {
    fake.__seed({ signIns: manySignIns(11) })
    const user = userEvent.setup()
    show()
    const table = screen.getByRole('heading', { name: /Sign-ins/ }).closest('section')
    expect(within(table).getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await user.click(within(table).getByRole('button', { name: 'Next page' }))
    expect(within(table).getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('goes back to the first page when the filter changes', async () => {
    fake.__seed({ signIns: manySignIns(11) })
    const user = userEvent.setup()
    show()
    const table = () => screen.getByRole('heading', { name: /Sign-ins/ }).closest('section')
    await user.click(within(table()).getByRole('button', { name: 'Next page' }))
    await user.type(screen.getByLabelText('Filter the history'), 'Uzair')
    expect(within(table()).getByText(/^1–/)).toBeInTheDocument()
  })
})

describe('the devices table', () => {
  it('gathers each device from its activity, not only the devices table', () => {
    fake.__seed({
      signIns: { a: { at: NOW, personId: 'u', name: 'Uzair', device: phone } },
      comments: { 'poem:x': { k: { at: NOW - DAY, personId: 'm', name: 'M', text: 'hi', device: phone } } },
    })
    show()
    const table = screen.getByRole('heading', { name: 'Devices seen' }).closest('section')
    const row = within(table).getByRole('rowheader', { name: 'SM-S911B' }).closest('tr')
    const cells = within(row).getAllByRole('cell').map((c) => c.textContent)
    expect(cells[0]).toBe('mobile')
    expect(cells[1]).toBe('Uzair, Maryam') // everyone who used it
    expect(cells[4]).toBe('1') // sign-ins
    expect(cells[5]).toBe('1') // comments
    expect(cells[6]).toBe('0') // reactions
  })

  it('says an iPhone model is only likely', () => {
    fake.__seed({
      devices: {
        'dev-ip': {
          id: 'dev-ip', model: 'iPhone', os: 'iOS', browser: 'Safari',
          screen: '390×844', dpr: 3, lastAt: NOW, firstAt: NOW, visits: 1,
        },
      },
    })
    show()
    expect(screen.getByText(/iPhone 12, 12 Pro, 13, 13 Pro, 14 \(likely\)/)).toBeInTheDocument()
    expect(screen.getByText('1170×2532')).toBeInTheDocument() // real pixels
  })
})

describe('the wording', () => {
  it('says "is" for one older sign-in and "are" for several', () => {
    fake.__seed({
      signIns: {
        recent: { at: NOW, personId: 'u', name: 'Uzair', device: phone },
        old: { at: NOW - 9 * DAY, personId: 'u', name: 'Uzair', device: phone },
      },
    })
    const one = show()
    expect(screen.getByText(/1 older sign-in is stored but not listed/)).toBeInTheDocument()
    one.unmount()

    fake.__seed({
      signIns: {
        recent: { at: NOW, personId: 'u', name: 'Uzair', device: phone },
        old: { at: NOW - 9 * DAY, personId: 'u', name: 'Uzair', device: phone },
        older: { at: NOW - 10 * DAY, personId: 'u', name: 'Uzair', device: phone },
      },
    })
    show()
    expect(screen.getByText(/2 older sign-ins are stored but not listed/)).toBeInTheDocument()
  })
})
