// ---------------------------------------------------------------------------
// version.js — reload into a new deploy.
// ---------------------------------------------------------------------------
// A phone will keep this tab open for days, running the JavaScript it happened
// to download a week ago. Every build writes version.json; the running page
// polls it and reloads when the build id changes — but only when the caller
// says nothing is in progress, so a reload can never eat a half-written
// signature or comment.
// ---------------------------------------------------------------------------

const URL = new globalThis.URL('version.json', document.baseURI).href
const INTERVAL = 5 * 60 * 1000

let current = null

async function fetchBuild() {
  try {
    // Cache-busting query: GitHub Pages serves index.html and friends with a
    // ten-minute cache, and a plain fetch would just read that back.
    const res = await fetch(`${URL}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data?.build || null
  } catch {
    return null
  }
}

/**
 * @param {() => boolean} isSafeToReload called before reloading.
 * @returns {() => void} stop polling.
 */
export function watchForNewBuild(isSafeToReload = () => true) {
  let stopped = false

  const check = async () => {
    if (stopped) return
    const build = await fetchBuild()
    if (!build || stopped) return
    if (current === null) {
      current = build
      return
    }
    if (build !== current && isSafeToReload()) {
      location.reload()
    }
  }

  check()
  const timer = setInterval(check, INTERVAL)
  const onFocus = () => check()
  addEventListener('focus', onFocus)

  return () => {
    stopped = true
    clearInterval(timer)
    removeEventListener('focus', onFocus)
  }
}

export default watchForNewBuild
