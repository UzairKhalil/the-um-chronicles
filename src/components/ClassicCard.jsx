import { useState } from 'react'
import Comments from './Comments.jsx'
import { classicItemId } from '../lib/records.js'

// One of "Their Words, Our Story": a love line by another writer.
//
// Deliberately shows NO reference — no author, work, year or film. The owner
// asked for none, for any quote or poem. The section heading is what tells a
// reader these are other writers' words.
//
// English originals can switch to OUR Urdu translation, which is always
// labelled as a translation. Urdu originals can switch to Roman Urdu and the
// plain-English meaning.
//
// Urdu text gets dir="rtl" lang="ur" on its own element only, and is set in
// Noto Nastaliq Urdu with a generous line height — see poetry.css. Never add
// letter-spacing to it.

const lines = (text) =>
  String(text || '')
    .split('\n')
    .map((line, i) => (
      <span className="classic__line" key={i}>
        {line}
      </span>
    ))

function UrduText({ text, className = '' }) {
  return (
    <p className={`classic__urdu ${className}`.trim()} dir="rtl" lang="ur">
      {lines(text)}
    </p>
  )
}

export default function ClassicCard({ entry, seat }) {
  const [alt, setAlt] = useState(false)
  const english = entry.lang === 'en'

  return (
    <article className={`classic card classic--${entry.lang}`}>
      {english ? (
        alt ? (
          <div className="classic__body">
            <p className="classic__label">Urdu translation</p>
            <UrduText text={entry.urdu_translation} />
          </div>
        ) : (
          <div className="classic__body">
            <p className="classic__english" lang="en">
              {lines(entry.original)}
            </p>
            <p className="classic__meaning">{entry.meaning_en}</p>
          </div>
        )
      ) : alt ? (
        <div className="classic__body">
          <p className="classic__roman" lang="ur-Latn">
            {lines(entry.roman)}
          </p>
          <p className="classic__meaning">{entry.meaning_en}</p>
        </div>
      ) : (
        <div className="classic__body">
          <UrduText text={entry.original} className="classic__couplet" />
        </div>
      )}

      <button
        type="button"
        className="classic__toggle"
        onClick={() => setAlt((v) => !v)}
        aria-pressed={alt}
      >
        {english ? (
          alt ? (
            'See in English'
          ) : (
            <>
              <span className="classic__toggle-ur" lang="ur" dir="rtl">
                اردو میں دیکھیں
              </span>
              <span aria-hidden="true"> / </span>
              See in Urdu
            </>
          )
        ) : alt ? (
          <>
            <span className="classic__toggle-ur" lang="ur" dir="rtl">
              اردو میں دیکھیں
            </span>
            <span aria-hidden="true"> / </span>
            See in Urdu
          </>
        ) : (
          'See in English'
        )}
      </button>

      <Comments itemId={classicItemId(entry.id)} seat={seat} />
    </article>
  )
}
