import { useCallback, useEffect, useState } from 'react'

// The app is served from a GitHub project-page URL with base './', which only
// works while there is no path-based router. Every second page is a hash.
const read = () =>
  (typeof location === 'undefined' ? '' : location.hash.replace(/^#/, '')).toLowerCase()

export function useHashRoute() {
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((next) => {
    const target = next ? `#${next}` : ' '
    if (next) location.hash = target
    else {
      // Clear the hash without leaving a '#' in the address bar.
      history.replaceState(null, '', location.pathname + location.search)
      setRoute('')
    }
  }, [])

  return [route, go]
}

export default useHashRoute
