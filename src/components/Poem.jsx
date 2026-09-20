import { useState } from 'react'
import Comments from './Comments.jsx'
import { poemItemId } from '../lib/records.js'

const isUrdu = (lang) => lang === 'ur'

function pickField(field, lang) {
  if (field && typeof field === 'object' && !Array.isArray(field)) {
    return field[lang] ?? field.en ?? field.ur ?? ''
  }
  return field
}

/**
 * Urdu gets dir="rtl" lang="ur" on THE POEM ELEMENT ONLY — never on the page,
 * which would flip the whole layout. Nastaliq renders small and very tall, so
 * it is set larger than the English with a line-height around 2.4; without
 * that the descenders of one line collide with the line below. Letter-spacing
 * is never applied to Urdu: it breaks the letter joining.
 */
function Body({ lines, lang }) {
  const urdu = isUrdu(lang)
  return (
    <div
      className={`poem__body${urdu ? ' poem__body--urdu' : ''}`}
      {...(urdu ? { dir: 'rtl', lang: 'ur' } : { dir: 'ltr', lang: 'en' })}
    >
      {(lines || []).map((line, i) =>
        line === '' ? (
          <span className="poem__break" key={i} aria-hidden="true" />
        ) : (
          <p className="poem__line" key={i}>
            {line}
          </p>
        )
      )}
    </div>
  )
}

export default function Poem({ poem, seat }) {
  const both = poem.lang === 'both'
  const [lang, setLang] = useState(both ? 'en' : poem.lang)

  const title = pickField(poem.title, lang)
  const lines = both ? poem.body?.[lang] || [] : poem.body || []
  const urduTitle = isUrdu(lang)

  return (
    <article className="poem card">
      <header className="poem__head">
        <h2
          className={`poem__title${urduTitle ? ' poem__title--urdu' : ''}`}
          {...(urduTitle ? { dir: 'rtl', lang: 'ur' } : {})}
        >
          {title}
        </h2>
        <div className="poem__meta tiny faint">
          {poem.date ? <span>{poem.date}</span> : null}
          {poem.dedication ? (
            <span
              className={`poem__ded${isUrdu(lang) ? ' poem__ded--urdu' : ''}`}
              {...(isUrdu(lang) && /[؀-ۿ]/.test(poem.dedication)
                ? { dir: 'rtl', lang: 'ur' }
                : {})}
            >
              {poem.dedication}
            </span>
          ) : null}
        </div>

        {both ? (
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={`lang-toggle__btn${lang === 'en' ? ' is-on' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              English
            </button>
            <button
              type="button"
              className={`lang-toggle__btn lang-toggle__btn--urdu${
                lang === 'ur' ? ' is-on' : ''
              }`}
              onClick={() => setLang('ur')}
              aria-pressed={lang === 'ur'}
              lang="ur"
            >
              اردو
            </button>
          </div>
        ) : null}
      </header>

      <Body lines={lines} lang={lang} />

      <Comments itemId={poemItemId(poem.id)} seat={seat} />
    </article>
  )
}
