import { useMemo } from 'react'
import Poem from './Poem.jsx'
import ClassicCard from './ClassicCard.jsx'
import QuoteCard from './QuoteCard.jsx'
import Interstitial from './Interstitial.jsx'
import poems from '../content/poems.js'
import classics from '../content/classics.js'
import meta from '../content/meta.js'
import { sign as myQuotes, poetry as poetryQuotes } from '../content/quotes.js'
import { pick } from '../lib/pick.js'

// The poetry page has three separate tabs, never mixed together:
//   #poems   the owner's own poems
//   #quotes  the owner's own short lines (quotes.js → sign)
//   #words   "Their Words, Our Story" — other writers (classics.js)
// Each is its own hash, so the back button and a reload keep the tab.
export const POETRY_SECTIONS = [
  { key: 'poems', label: () => meta.poemsTabLabel },
  { key: 'quotes', label: () => meta.quotesTabLabel },
  { key: 'words', label: () => meta.classicsTabLabel },
]

export const isPoetrySection = (route) => POETRY_SECTIONS.some((s) => s.key === route)

function SectionTabs({ section, onGo }) {
  return (
    <nav className="section-tabs" role="tablist" aria-label="What to read">
      {POETRY_SECTIONS.map((s) => (
        <button
          key={s.key}
          type="button"
          role="tab"
          aria-selected={section === s.key}
          className={`section-tabs__btn${section === s.key ? ' is-on' : ''}`}
          onClick={() => onGo(s.key)}
        >
          {s.label()}
        </button>
      ))}
    </nav>
  )
}

export default function Poetry({ seat, onGo, section = 'poems' }) {
  const quote = useMemo(() => pick(poetryQuotes), [])

  return (
    <section className="poetry">
      <SectionTabs section={section} onGo={onGo} />

      {section === 'poems' ? (
        <div className="poetry__panel" role="tabpanel" aria-label={meta.poemsTabLabel}>
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
        </div>
      ) : null}

      {section === 'quotes' ? (
        <div className="poetry__panel" role="tabpanel" aria-label={meta.quotesTabLabel}>
          <div className="quote-cards">
            {myQuotes.map((text, i) => (
              <QuoteCard text={text} index={i} seat={seat} key={i} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Other writers' words: their own tab. No references are shown on any
          card — see classics.js. The heading says the words are others'. */}
      {section === 'words' ? (
        <div className="poetry__panel" role="tabpanel" aria-label={meta.classicsTabLabel}>
          <section className="classics" aria-labelledby="classics-title">
            <header className="classics__head">
              <span className="classics__rule" aria-hidden="true" />
              <h2 className="classics__title" id="classics-title">
                {meta.classicsTitle}
              </h2>
              <p className="classics__blurb">{meta.classicsBlurb}</p>
            </header>
            <div className="classics__list">
              {classics.map((entry) => (
                <ClassicCard entry={entry} seat={seat} key={entry.id} />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <Interstitial />

      <div className="back-link">
        <button type="button" className="btn btn--wide" onClick={() => onGo('')}>
          Back to the Sign
        </button>
      </div>

      <p className="tiny faint centre poetry__foot">{meta.subtitle}</p>
    </section>
  )
}
