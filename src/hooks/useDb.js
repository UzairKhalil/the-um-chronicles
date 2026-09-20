import { useEffect, useState } from 'react'
import { subscribe, onStatus } from '../lib/db.js'

/** Live value at a namespaced path. Returns [value, loaded]. */
export function useDbValue(path) {
  const [state, setState] = useState({ value: null, loaded: false })

  useEffect(() => {
    if (!path) return undefined
    setState({ value: null, loaded: false })
    const off = subscribe(path, (value) => setState({ value, loaded: true }))
    return off
  }, [path])

  return [state.value, state.loaded]
}

/** Live connection status: local | connecting | online | offline | error. */
export function useDbStatus() {
  const [status, setStatus] = useState('connecting')
  useEffect(() => onStatus(setStatus), [])
  return status
}

/** An object of records -> array sorted newest first, with the key attached. */
export function toListDesc(obj, field = 'at') {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .map(([key, v]) => ({ key, ...(v && typeof v === 'object' ? v : {}) }))
    .sort((a, b) => (b[field] || 0) - (a[field] || 0))
}
