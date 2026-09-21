import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeFakeDb } from '../test/fakeDb.js'

// Tests must never touch the live database.
const fake = makeFakeDb()
vi.mock('./db.js', () => fake)
vi.mock('./device.js', () => ({
  describeDevice: async () => ({ id: 'dev-1', model: 'Pixel 8', os: 'Android' }),
  deviceId: vi.fn(() => 'dev-1'),
  deviceLabel: () => 'Pixel 8',
  deviceFirstSeen: () => null,
}))

const records = await import('./records.js')
const device = await import('./device.js')
/** Pretend the next writes come from a different phone. */
const onDevice = (id) => device.deviceId.mockImplementation(() => id)
const { today } = await import('./day.js')

const uzair = { id: 'u', partner: true, name: 'Uzair', admin: true }
const maryam = { id: 'm', partner: true, name: 'Maryam', admin: false }

beforeEach(() => {
  fake.__seed({})
  vi.clearAllMocks()
  onDevice('dev-1')
})

describe('signing', () => {
  it('writes today under the signing person', async () => {
    await records.signToday(uzair, 'a good day')
    const day = today()
    expect(fake.__tree().days[day].u.note).toBe('a good day')
    expect(fake.__tree().days[day].m).toBeUndefined()
  })

  it('goes through a transaction, never a blind set', async () => {
    await records.signToday(uzair)
    expect(fake.transact).toHaveBeenCalled()
    expect(fake.set).not.toHaveBeenCalled()
  })

  it('keeps the original time when signing twice, but takes the new note', async () => {
    await records.signToday(uzair, 'first')
    const day = today()
    const firstAt = fake.__tree().days[day].u.at
    fake.serverNow.mockReturnValueOnce(1_700_000_999_000)
    await records.signToday(uzair, 'second')
    expect(fake.__tree().days[day].u.at).toBe(firstAt)
    expect(fake.__tree().days[day].u.note).toBe('second')
  })

  it('records each of us separately on the same day', async () => {
    await records.signToday(uzair, 'me')
    await records.signToday(maryam, 'and me')
    const day = fake.__tree().days[today()]
    expect(Object.keys(day).sort()).toEqual(['m', 'u'])
  })
})

describe('comments', () => {
  it('requires both a name and text', () => {
    expect(records.validateComment({ name: '', text: '' })).toEqual({
      name: 'Please add a name.',
      text: 'Please write a comment.',
    })
    expect(records.validateComment({ name: 'Uzair', text: '' })).toEqual({
      text: 'Please write a comment.',
    })
    expect(records.validateComment({ name: '   ', text: 'hi' })).toEqual({
      name: 'Please add a name.',
    })
    expect(records.validateComment({ name: 'Uzair', text: 'hi' })).toEqual({})
  })

  it('refuses to write a comment that is missing either field', async () => {
    await expect(
      records.addComment('poem:x', { name: '', text: 'hello', personId: 'u' })
    ).rejects.toThrow()
    expect(fake.push).not.toHaveBeenCalled()
  })

  it('writes a valid comment with its device', async () => {
    await records.addComment('poem:x', { name: 'Uzair', text: 'hello', personId: 'u' })
    const stored = Object.values(fake.__tree().comments['poem:x'])[0]
    expect(stored.name).toBe('Uzair')
    expect(stored.text).toBe('hello')
    expect(stored.device.id).toBe('dev-1')
  })

  it('deletes exactly the comment asked for', async () => {
    const a = await records.addComment('poem:x', { name: 'U', text: 'one', personId: 'u' })
    await records.addComment('poem:x', { name: 'M', text: 'two', personId: 'm' })
    await records.deleteComment('poem:x', a)
    const left = Object.values(fake.__tree().comments['poem:x'])
    expect(left).toHaveLength(1)
    expect(left[0].text).toBe('two')
  })
})

describe('reactions', () => {
  it('stores one reaction per person', async () => {
    await records.toggleReaction('poem:x', uzair, 'heart')
    await records.toggleReaction('poem:x', maryam, 'rose')
    expect(fake.__tree().reactions['poem:x'].u.symbol).toBe('heart')
    expect(fake.__tree().reactions['poem:x'].m.symbol).toBe('rose')
  })

  it('toggles the same symbol off again', async () => {
    await records.toggleReaction('poem:x', uzair, 'heart')
    await records.toggleReaction('poem:x', uzair, 'heart')
    expect(fake.__tree().reactions['poem:x']?.u).toBeUndefined()
  })

  it('replaces rather than accumulates when a different symbol is chosen', async () => {
    await records.toggleReaction('poem:x', uzair, 'heart')
    await records.toggleReaction('poem:x', uzair, 'spark')
    expect(fake.__tree().reactions['poem:x'].u.symbol).toBe('spark')
    expect(Object.keys(fake.__tree().reactions['poem:x'])).toEqual(['u'])
  })

  it('uses a transaction, because the write depends on what is already there', async () => {
    await records.toggleReaction('poem:x', uzair, 'heart')
    expect(fake.transact).toHaveBeenCalled()
  })
})

describe('sign-ins', () => {
  it('records the person and device, and never the code', async () => {
    await records.recordSignIn({ ...uzair, code: '24680' })
    const entry = Object.values(fake.__tree().signIns)[0]
    expect(entry.name).toBe('Uzair')
    expect(entry.device.id).toBe('dev-1')
    expect(JSON.stringify(fake.__tree())).not.toContain('24680')
  })

  it('keeps a devices summary with a first- and last-seen', async () => {
    await records.recordSignIn(uzair)
    await records.recordSignIn(maryam)
    const dev = fake.__tree().devices['dev-1']
    expect(dev.visits).toBe(2)
    expect(dev.firstAt).toBeTruthy()
    expect(dev.lastPersonId).toBe('m')
  })
})

describe('keeping the database bounded', () => {
  it('leaves a small number of sign-ins alone', async () => {
    const signIns = {}
    for (let i = 0; i < 5; i += 1) signIns[`k${i}`] = { at: i, personId: 'u' }
    fake.__seed({ signIns })
    expect(await records.trimSignIns()).toBe(0)
    expect(Object.keys(fake.__tree().signIns)).toHaveLength(5)
  })

  it('drops the oldest once past the cap, keeping the newest 300', async () => {
    const signIns = {}
    for (let i = 0; i < 310; i += 1) signIns[`k${i}`] = { at: i, personId: 'u' }
    fake.__seed({ signIns })
    expect(await records.trimSignIns()).toBe(10)
    const left = fake.__tree().signIns
    expect(Object.keys(left)).toHaveLength(300)
    expect(left.k0).toBeUndefined()
    expect(left.k9).toBeUndefined()
    expect(left.k10).toBeTruthy()
    expect(left.k309).toBeTruthy()
  })
})

describe('a guest', () => {
  const guest = { id: 'g', partner: false, name: 'Guest', admin: false }

  it('cannot sign, and nothing is written', async () => {
    await expect(records.signToday(guest)).rejects.toThrow(/partners/)
    expect(fake.transact).not.toHaveBeenCalled()
    expect(fake.__tree().days).toBeUndefined()
  })

  it('reacts under its own device, alongside the partners', async () => {
    await records.toggleReaction('poem:x', guest, 'heart')
    await records.toggleReaction('poem:x', uzair, 'rose')
    expect(fake.__tree().reactions['poem:x']['g_dev-1'].symbol).toBe('heart')
    expect(fake.__tree().reactions['poem:x'].u.symbol).toBe('rose')
    expect(fake.__tree().reactions['poem:x'].g).toBeUndefined()
  })

  it('gives every guest device its own reaction', async () => {
    await records.toggleReaction('poem:x', guest, 'heart')
    onDevice('dev-2')
    await records.toggleReaction('poem:x', guest, 'spark')
    const r = fake.__tree().reactions['poem:x']
    expect(r['g_dev-1'].symbol).toBe('heart')
    expect(r['g_dev-2'].symbol).toBe('spark')
  })

  it('keeps one reaction per guest device, toggling and replacing', async () => {
    await records.toggleReaction('poem:x', guest, 'heart')
    await records.toggleReaction('poem:x', guest, 'rose')
    expect(Object.keys(fake.__tree().reactions['poem:x'])).toEqual(['g_dev-1'])
    expect(fake.__tree().reactions['poem:x']['g_dev-1'].symbol).toBe('rose')
    await records.toggleReaction('poem:x', guest, 'rose')
    expect(fake.__tree().reactions['poem:x']?.['g_dev-1']).toBeUndefined()
  })

  it('can leave one comment per item, under its own device', async () => {
    await records.addComment('poem:x', { name: 'Guest', text: 'Beautiful.', personId: 'g' })
    const stored = fake.__tree().comments['poem:x']['g_dev-1']
    expect(stored.personId).toBe('g')
    expect(stored.text).toBe('Beautiful.')
  })

  it('cannot leave a second comment on the same item from the same device', async () => {
    await records.addComment('poem:x', { name: 'Guest', text: 'First.', personId: 'g' })
    await expect(
      records.addComment('poem:x', { name: 'Guest', text: 'Second.', personId: 'g' })
    ).rejects.toMatchObject({ errors: { text: expect.stringMatching(/already/) } })
    expect(Object.keys(fake.__tree().comments['poem:x'])).toEqual(['g_dev-1'])
    expect(fake.__tree().comments['poem:x']['g_dev-1'].text).toBe('First.')
  })

  it('can comment on a different item', async () => {
    await records.addComment('poem:x', { name: 'Guest', text: 'One.', personId: 'g' })
    await records.addComment('poem:y', { name: 'Guest', text: 'Two.', personId: 'g' })
    expect(fake.__tree().comments['poem:y']['g_dev-1'].text).toBe('Two.')
  })

  it('lets a second guest device comment on the same item', async () => {
    await records.addComment('poem:x', { name: 'Ali', text: 'One.', personId: 'g' })
    onDevice('dev-2')
    await records.addComment('poem:x', { name: 'Sara', text: 'Two.', personId: 'g' })
    expect(Object.keys(fake.__tree().comments['poem:x']).sort()).toEqual(['g_dev-1', 'g_dev-2'])
  })

  it('may comment again once the admin has deleted the first', async () => {
    const key = await records.addComment('poem:x', { name: 'Guest', text: 'One.', personId: 'g' })
    await records.deleteComment('poem:x', key)
    await records.addComment('poem:x', { name: 'Guest', text: 'Again.', personId: 'g' })
    expect(fake.__tree().comments['poem:x']['g_dev-1'].text).toBe('Again.')
  })

  it('knows whether this device has commented', async () => {
    expect(records.guestHasCommented({})).toBe(false)
    await records.addComment('poem:x', { name: 'Guest', text: 'One.', personId: 'g' })
    expect(records.guestHasCommented(fake.__tree().comments['poem:x'])).toBe(true)
    onDevice('dev-2')
    expect(records.guestHasCommented(fake.__tree().comments['poem:x'])).toBe(false)
  })

  it('leaves the partners free to comment as often as they like', async () => {
    await records.addComment('poem:x', { name: 'Uzair', text: 'One.', personId: 'u' })
    await records.addComment('poem:x', { name: 'Uzair', text: 'Two.', personId: 'u' })
    await records.addComment('poem:x', { name: 'Uzair', text: 'Three.', personId: 'u' })
    expect(Object.keys(fake.__tree().comments['poem:x'])).toHaveLength(3)
  })

  it('has its sign-in recorded like anyone else', async () => {
    await records.recordSignIn(guest)
    expect(Object.values(fake.__tree().signIns)[0].name).toBe('Guest')
  })
})
