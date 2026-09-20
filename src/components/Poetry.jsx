import { useMemo } from 'react'
import Poem from './Poem.jsx'
import Comments from './Comments.jsx'
import Interstitial from './Interstitial.jsx'
import poems from '../content/poems.js'
import meta from '../content/meta.js'
import { sign as signQuotes, poetry as poetryQuotes } from '../content/quotes.js'
import { pick } from '../lib/pick.js'
import { quoteItemId } from '../lib/records.js'

export default function Poetry({ seat, onGo }) {
  const quote = useMemo(() => pick(poetryQuotes), [])
  // One quote at the foot of the page, with its own comments and reactions.
  const closing = useMemo(() => {
    const i = Math.floor(Math.random() * signQuotes.length)
    return { index: i, text: signQuotes[i] }
  }, [])

  return (
    <section className="poetry">
      <p className="quote quote--centred">{quote}</p>

      {poems.length === 0 ? (
        <p className="faint centre small">No poems yet.</p>
      ) : (
        <div className="poems">
          {poems.map((poem) => (
            <Poem poem={poem} seat={seat} key={poem.id} />
          ))}
        </div>
      )}

      <Interstitial />

      <div className="card closing-quote">
        <p className="quote quote--centred">{closing.text}</p>
        <Comments
          itemId={quoteItemId(`sign-${closing.index}`)}
          seat={seat}
          title="Say something"
        />
      </div>

      <div className="back-link">
        <button type="button" className="btn btn--wide" onClick={() => onGo('')}>
          Back to the Sign
        </button>
      </div>

      <p className="tiny faint centre poetry__foot">{meta.subtitle}</p>
    </section>
  )
}
