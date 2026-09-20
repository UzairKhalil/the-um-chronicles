/** One item from a list, at random. Stable when memoised by the caller. */
export function pick(list, fallback = '') {
  if (!Array.isArray(list) || list.length === 0) return fallback
  return list[Math.floor(Math.random() * list.length)]
}

/** Deterministic choice — the same seed always gives the same item. */
export function pickBy(list, seed, fallback = '') {
  if (!Array.isArray(list) || list.length === 0) return fallback
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return list[h % list.length]
}

export default pick
