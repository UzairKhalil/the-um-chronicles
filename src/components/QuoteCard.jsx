import Comments from './Comments.jsx'
import CopyButton from './CopyButton.jsx'
import { quoteItemId } from '../lib/records.js'

/**
 * One of the owner's own short lines (quotes.js → sign), on the Quotes tab.
 *
 * Comments and reactions hang off 'quote:sign-<index>' — the same key the old
 * closing-quote card used, so anything already said about a line stays with
 * it. That also means reordering or deleting lines in quotes.js moves those
 * comments to a different line: add new lines at the END of the list.
 */
export default function QuoteCard({ text, index, seat }) {
  return (
    <article className="quote-card card">
      <div className="card-tools card-tools--end">
        <CopyButton label="Copy this line" getText={() => text} />
      </div>
      <p className="quote quote--centred quote-card__text">{text}</p>
      <Comments itemId={quoteItemId(`sign-${index}`)} seat={seat} title="Say something" />
    </article>
  )
}
