import { describe, it, expect } from 'vitest'
import buildDeviceReport, {
  guessAppleModel,
  deviceKind,
  resolution,
} from './devicesReport.js'

// Pure data: nothing here touches a database.

const phone = {
  id: 'dev-phone',
  model: 'SM-S911B',
  os: 'Android',
  osVersion: '14',
  browser: 'Chrome',
  screen: '360×800',
  dpr: 3,
  mobile: true,
  touchPoints: 5,
}
const laptop = {
  id: 'dev-laptop',
  model: '',
  os: 'Windows',
  browser: 'Chrome',
  screen: '1536×864',
  dpr: 1.25,
  mobile: false,
  touchPoints: 0,
}
const iphone = {
  id: 'dev-iphone',
  model: 'iPhone',
  os: 'iOS',
  osVersion: '18.2',
  browser: 'Safari',
  screen: '390×844',
  dpr: 3,
  touchPoints: 5,
}

describe('what a device is called', () => {
  it('uses the model Android reports', () => {
    const [row] = buildDeviceReport({ devices: { 'dev-phone': { ...phone, lastAt: 5 } } })
    expect(row.label).toBe('SM-S911B')
    expect(row.modelIsReported).toBe(true)
  })

  it('narrows an iPhone by its screen, and says it is only likely', () => {
    expect(guessAppleModel('390×844', 3)).toBe('iPhone 12, 12 Pro, 13, 13 Pro, 14')
    expect(guessAppleModel('393×852', 3)).toBe('iPhone 14 Pro, 15, 15 Pro, 16')
    expect(guessAppleModel('375×667', 2)).toBe('iPhone 6–8 / SE (2nd, 3rd)')
    expect(guessAppleModel('1024×1366', 2)).toContain('iPad Pro')
    expect(guessAppleModel('999×999', 3)).toBe('')
    expect(guessAppleModel('', 3)).toBe('')
  })

  it('falls back to the system and browser when there is no model', () => {
    const [row] = buildDeviceReport({ devices: { 'dev-laptop': { ...laptop, lastAt: 5 } } })
    expect(row.label).toBe('Windows Chrome')
    expect(row.modelIsReported).toBe(false)
  })

  it('tells a phone from a computer', () => {
    expect(deviceKind(phone)).toBe('mobile')
    expect(deviceKind(iphone)).toBe('mobile')
    expect(deviceKind(laptop)).toBe('desktop')
    expect(deviceKind({ os: 'iPadOS', model: 'iPad' })).toBe('tablet')
    expect(deviceKind(null)).toBe('')
  })

  it('works out the real pixels, which is what identifies a phone', () => {
    expect(resolution({ screen: '390×844', dpr: 3 })).toBe('1170×2532')
    expect(resolution({ screen: '390×844' })).toBe('')
  })
})

describe('gathering everything known about a device', () => {
  const data = {
    devices: {
      'dev-phone': { ...phone, firstAt: 1000, lastAt: 5000, visits: 40, lastPersonId: 'm' },
    },
    signIns: {
      a: { at: 2000, personId: 'm', device: { ...phone, network: '4g' } },
      b: { at: 5000, personId: 'm', device: { ...phone, network: '3g' } },
      c: { at: 9000, personId: 'u', device: { ...laptop } },
    },
    comments: {
      'poem:x': {
        k1: { at: 3000, personId: 'm', device: { ...phone } },
        k2: { at: 100, personId: 'u', device: { ...laptop } },
      },
    },
    reactions: {
      'poem:x': { m: { symbol: 'heart', at: 4000, device: { ...phone } } },
    },
  }

  it('lists a device that never reached the devices table', () => {
    const rows = buildDeviceReport(data)
    const ids = rows.map((r) => r.id)
    expect(ids).toContain('dev-laptop') // only ever seen through its activity
    expect(rows.find((r) => r.id === 'dev-laptop').inDevicesTable).toBe(false)
    expect(rows.find((r) => r.id === 'dev-phone').inDevicesTable).toBe(true)
  })

  it('counts sign-ins, comments and reactions for each device', () => {
    const rows = buildDeviceReport(data)
    const p = rows.find((r) => r.id === 'dev-phone')
    expect(p).toMatchObject({ signIns: 2, comments: 1, reactions: 1 })
    const l = rows.find((r) => r.id === 'dev-laptop')
    expect(l).toMatchObject({ signIns: 1, comments: 1, reactions: 0 })
  })

  it('keeps the whole span: earliest of everything to latest of everything', () => {
    const rows = buildDeviceReport(data)
    const l = rows.find((r) => r.id === 'dev-laptop')
    expect(l.firstSeen).toBe(100) // its oldest comment
    expect(l.lastSeen).toBe(9000) // its newest sign-in
    const p = rows.find((r) => r.id === 'dev-phone')
    expect(p.firstSeen).toBe(1000) // the devices row is older than any activity
  })

  it('takes the details from the most recent snapshot, not a stale one', () => {
    const rows = buildDeviceReport(data)
    const p = rows.find((r) => r.id === 'dev-phone')
    expect(p.detail.network).toBe('3g') // the 5000 sign-in, not the 2000 one
  })

  it('names everyone who used it', () => {
    const rows = buildDeviceReport(data)
    expect(rows.find((r) => r.id === 'dev-phone').people).toEqual(['Maryam'])
    expect(rows.find((r) => r.id === 'dev-laptop').people).toEqual(['Uzair'])
  })

  it('keeps the all-time action counter from the devices row', () => {
    const rows = buildDeviceReport(data)
    expect(rows.find((r) => r.id === 'dev-phone').actions).toBe(40)
    expect(rows.find((r) => r.id === 'dev-laptop').actions).toBe(0)
  })

  it('puts the most recently seen device first', () => {
    expect(buildDeviceReport(data).map((r) => r.id)).toEqual(['dev-laptop', 'dev-phone'])
  })

  it('copes with nothing at all', () => {
    expect(buildDeviceReport()).toEqual([])
    expect(buildDeviceReport({ devices: {}, signIns: {} })).toEqual([])
  })

  it('ignores an entry with no device attached', () => {
    const rows = buildDeviceReport({ signIns: { a: { at: 1, personId: 'u' } } })
    expect(rows).toEqual([])
  })
})
