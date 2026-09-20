// Writes public/version.json before every build. The running page polls this
// file and reloads when the build id changes, so a phone that has kept a tab
// open for a week does not sit on last week's JavaScript for ever.
import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '..', 'public', 'version.json')

let commit = ''
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
} catch {
  commit = 'nogit'
}

const build = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${commit}`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, `${JSON.stringify({ build, at: Date.now() }, null, 2)}\n`)
console.log(`version.json → ${build}`)
