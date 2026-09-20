import { useMemo } from 'react'
import { interstitial } from '../content/quotes.js'
import { pick } from '../lib/pick.js'

/** A breath between sections: a hairline and one quiet line. */
export default function Interstitial({ line }) {
  const text = useMemo(() => line || pick(interstitial), [line])
  if (!text) return null
  return <p className="quote quote--interstitial">{text}</p>
}
