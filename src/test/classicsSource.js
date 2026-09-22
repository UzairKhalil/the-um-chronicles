// Reads docs/classics-source.md — the approved, verbatim text — so tests can
// hold src/content/classics.js to it character for character.
//
// The provenance (authors, works, years, films) is deliberately NOT in the
// repository: the owner wants no references for any quote or poem, and the
// repository is public. It lives in docs/classics-provenance.local.md, which is
// git-ignored. When that file exists (on the owner's computer) the tests also
// check that none of it has leaked into the app; in CI it is simply absent.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FENCE = '`'.repeat(3)
// Vitest runs from the project root. (import.meta.url is not a file: URL
// under the jsdom environment, so it cannot be used to find files on disk.)
const textFile = resolve(process.cwd(), 'docs/classics-source.md')
const provenanceFile = resolve(process.cwd(), 'docs/classics-provenance.local.md')

function parse(path) {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
  return text
    .split('\n### ')
    .slice(1)
    .map((section) => {
      const field = (k) => {
        const m = section.match(new RegExp('^- ' + k + ': ?(.*)$', 'm'))
        return m ? m[1].trim() : ''
      }
      const block = (name) => {
        const at = section.indexOf(FENCE + name + '\n')
        if (at < 0) return undefined
        const from = at + FENCE.length + name.length + 1
        return section.slice(from, section.indexOf('\n' + FENCE, from))
      }
      return {
        id: section.split('\n')[0].trim(),
        lang: field('lang'),
        original: block('original'),
        roman: block('roman'),
        urdu_translation: block('urdu_translation'),
        meaning_en: field('meaning_en'),
        tags: field('tags').split(',').map((t) => t.trim()).filter(Boolean),
        fieldKeys: [...section.matchAll(/^- ([A-Za-z_]+):/gm)].map((m) => m[1]),
        references: ['author', 'work', 'seenIn', 'note'].map(field).filter(Boolean),
      }
    })
}

/** The approved text, from the committed file. */
export const readSource = () => parse(textFile)

/** Reference strings from the local provenance file, or [] where it is absent. */
export function readReferences() {
  if (!existsSync(provenanceFile)) return []
  return [...new Set(parse(provenanceFile).flatMap((e) => e.references))]
}

export const hasProvenance = () => existsSync(provenanceFile)
export const textFileContents = () => readFileSync(textFile, 'utf8')
