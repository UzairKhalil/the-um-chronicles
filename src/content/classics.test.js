import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import classics from './classics.js'
import {
  readSource,
  readReferences,
  hasProvenance,
  textFileContents,
} from '../test/classicsSource.js'

// Pure data tests: nothing here touches a database.

const source = readSource()
const bySourceId = new Map(source.map((e) => [e.id, e]))
const appFile = readFileSync(resolve(process.cwd(), 'src/content/classics.js'), 'utf8')

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/
const LATIN_LETTER = /[A-Za-z]/

describe('the list', () => {
  it('holds the 28 approved entries: 18 English and 10 Urdu', () => {
    expect(classics).toHaveLength(28)
    expect(classics.filter((e) => e.lang === 'en')).toHaveLength(18)
    expect(classics.filter((e) => e.lang === 'ur')).toHaveLength(10)
  })

  it('matches the approved source entry for entry, in the same order', () => {
    expect(classics.map((e) => e.id)).toEqual(source.map((e) => e.id))
  })

  it('has unique ids that are safe as database keys', () => {
    const ids = classics.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })
})

describe('required fields', () => {
  it.each(classics.map((e) => [e.id, e]))('%s has everything it needs', (_id, e) => {
    expect(['en', 'ur']).toContain(e.lang)
    expect(typeof e.original).toBe('string')
    expect(e.original.trim()).not.toBe('')
    expect(e.meaning_en.trim()).not.toBe('')
    expect(Array.isArray(e.tags)).toBe(true)
    expect(e.tags.length).toBeGreaterThan(0)

    if (e.lang === 'en') {
      expect(e.urdu_translation.trim()).not.toBe('')
      // Ours, not the original — the UI labels it on this flag.
      expect(e.translation).toBe('translated')
      expect(e.roman).toBeUndefined()
    } else {
      expect(e.roman.trim()).not.toBe('')
      expect(e.urdu_translation).toBeUndefined()
      expect(e.translation).toBeUndefined()
    }
  })
})

describe('scripts', () => {
  it('writes every Urdu original and every Urdu translation in Urdu script', () => {
    for (const e of classics) {
      const urdu = e.lang === 'ur' ? e.original : e.urdu_translation
      expect(urdu, e.id).toMatch(ARABIC_SCRIPT)
      expect(urdu, e.id).not.toMatch(LATIN_LETTER)
    }
  })

  it('keeps English originals, Roman Urdu and meanings in Latin script', () => {
    for (const e of classics) {
      if (e.lang === 'en') expect(e.original, e.id).not.toMatch(ARABIC_SCRIPT)
      if (e.roman) expect(e.roman, e.id).not.toMatch(ARABIC_SCRIPT)
      expect(e.meaning_en, e.id).not.toMatch(ARABIC_SCRIPT)
    }
  })

  it('keeps each Urdu couplet as two lines, with Roman Urdu line for line', () => {
    for (const e of classics.filter((c) => c.lang === 'ur')) {
      expect(e.original.split('\n'), e.id).toHaveLength(2)
      expect(e.roman.split('\n'), e.id).toHaveLength(2)
    }
  })
})

describe('verbatim — not a character different from the approved text', () => {
  it.each(classics.map((e) => [e.id, e]))('%s', (id, e) => {
    const s = bySourceId.get(id)
    expect(s, `${id} is missing from docs/classics-source.md`).toBeTruthy()
    expect(e.lang).toBe(s.lang)
    expect(e.original).toBe(s.original)
    expect(e.meaning_en).toBe(s.meaning_en)
    expect(e.tags).toEqual(s.tags)
    if (e.lang === 'en') expect(e.urdu_translation).toBe(s.urdu_translation)
    else expect(e.roman).toBe(s.roman)
  })
})

describe('no references, for any quote or poem', () => {
  const ALLOWED = new Set([
    'id', 'lang', 'original', 'meaning_en', 'tags',
    'urdu_translation', 'translation', 'roman',
  ])

  it('stores no author, work, year or film field', () => {
    for (const e of classics) {
      for (const key of Object.keys(e)) expect(ALLOWED.has(key), `${e.id}.${key}`).toBe(true)
    }
  })

  it('keeps the public text file free of reference fields too', () => {
    // The repository is public. Only text fields may live in it.
    for (const e of source) {
      for (const key of e.fieldKeys) {
        expect(['lang', 'tags', 'meaning_en'], `${e.id}: ${key}`).toContain(key)
      }
    }
  })

  // The names themselves are known only where the local provenance record
  // exists — on the owner's computer, not in CI.
  it.skipIf(!hasProvenance())('lets no author, work or film leak into the app or the repo', () => {
    const refs = readReferences()
    expect(refs.length).toBeGreaterThan(10)
    const repoText = textFileContents()
    for (const ref of refs) {
      expect(appFile, `app file: ${ref}`).not.toContain(ref)
      expect(repoText, `docs/classics-source.md: ${ref}`).not.toContain(ref)
    }
  })
})
