import meta from '../content/meta.js'
import { sinceLine } from '../lib/since.js'

const LABELS = {
  sign: null,
  chronicle: meta.chronicleTitle,
  poems: meta.poetryLabel,
}

export default function Masthead({ seat, status, page, onHome, onLeave }) {
  const sub = LABELS[page]
  // How long it has been, counted from meta.sinceDate on the server's clock.
  const count = sinceLine()

  return (
    <header className="masthead">
      <button
        type="button"
        className="masthead__title"
        onClick={onHome}
        aria-label={`${meta.title} — back to the sign`}
      >
        <span className="title">{meta.title}</span>
        <span className="subtitle">{meta.subtitle}</span>
      </button>

      {page === 'sign' ? (
        <>
          <p className="since">{meta.since}</p>
          {count ? <p className="since-count">{count}</p> : null}
        </>
      ) : null}
      {sub ? <p className="masthead__page eyebrow">{sub}</p> : null}

      <div className="masthead__row">
        <span className="masthead__who tiny">
          <span className="masthead__dot" aria-hidden="true" />
          {seat.name}
        </span>
        <button type="button" className="btn btn--ghost masthead__out" onClick={onLeave}>
          Sign out
        </button>
      </div>

      {status === 'local' || status === 'error' ? (
        <p className="masthead__note tiny">
          On this device only — no database reachable.
        </p>
      ) : null}
      {status === 'offline' ? (
        <p className="masthead__note tiny">Offline. Changes will sync when you reconnect.</p>
      ) : null}
    </header>
  )
}
