import { useState } from 'react'
import Comments from './Comments.jsx'
import LangTabs from './LangTabs.jsx'
import CopyButton from './CopyButton.jsx'
import { classicItemId } from '../lib/records.js'

// One of "Their Words, Our Story": a love line by another writer.
//
// Deliberately shows NO reference — no author, work, year or film. The owner
// asked for none, for any quote or poem. The section heading is what tells a
// reader these are other writers' words.
//
// Every card has English | Urdu tabs and opens on its original language.
//   English original:  English = the original + meaning
//                      Urdu    = OUR translation, always labelled as one
//   Urdu original:     Urdu    = the couplet
//                      English = Roman Urdu + meaning
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

function Panel({ entry, tab }) {
  if (entry.lang === 'en') {
    return tab === 'en' ? (
      <div className="classic__body">
        <p className="classic__english" lang="en">
          {lines(entry.original)}
        </p>
        <p className="classic__meaning">{entry.meaning_en}</p>
      </div>
    ) : (
      <div className="classic__body">
        <p className="classic__label">Urdu translation</p>
        <UrduText text={entry.urdu_translation} />
      </div>
    )
  }
  return tab === 'ur' ? (
    <div className="classic__body">
      <UrduText text={entry.original} className="classic__couplet" />
    </div>
  ) : (
    <div className="classic__body">
      <p className="classic__roman" lang="ur-Latn">
        {lines(entry.roman)}
      </p>
      <p className="classic__meaning">{entry.meaning_en}</p>
    </div>
  )
}

/** The text the card is showing on this tab — what the copy icon copies. */
export function shownText(entry, tab) {
  if (entry.lang === 'en') return tab === 'en' ? entry.original : entry.urdu_translation
  return tab === 'ur' ? entry.original : entry.roman
}

export default function ClassicCard({ entry, seat }) {
  // Opens on the original language.
  const [tab, setTab] = useState(entry.lang)

  return (
    <article className={`classic card classic--${entry.lang}`}>
      <LangTabs
        value={tab}
        onChange={setTab}
        tools={<CopyButton getText={() => shownText(entry, tab)} />}
      >
        <Panel entry={entry} tab={tab} />
      </LangTabs>
      <Comments itemId={classicItemId(entry.id)} seat={seat} />
    </article>
  )
}
