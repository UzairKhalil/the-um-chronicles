import meta from '../content/meta.js'

/**
 * Page through a long table: how many rows to show, and which page.
 * Shown above the table so the controls are reachable without scrolling to
 * the end of it.
 */
export default function Pager({ total, page, pageSize, onPage, onPageSize, label = 'rows' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(total, current * pageSize)
  const sizes = meta.history?.pageSizes ?? [10, 15, 20, 50]

  return (
    <div className="pager">
      <label className="pager__size">
        <span className="pager__label">Show</span>
        <select
          className="pager__select"
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          aria-label={`How many ${label} to show`}
        >
          {sizes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <span className="pager__count tiny faint">
        {total === 0 ? `No ${label}` : `${from}–${to} of ${total}`}
      </span>

      <div className="pager__moves">
        <button
          type="button"
          className="pager__btn"
          onClick={() => onPage(current - 1)}
          disabled={current <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="pager__page tiny">
          {current} / {pages}
        </span>
        <button
          type="button"
          className="pager__btn"
          onClick={() => onPage(current + 1)}
          disabled={current >= pages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  )
}
