import { useId } from 'react'

const TABS = [
  { key: 'en', label: 'English' },
  { key: 'ur', label: 'Urdu' },
]

/**
 * English | Urdu tabs, used on every card that has both languages — the
 * owner's own bilingual poems and every classic — so the whole poetry page
 * switches language the same way. English is always first; the active tab
 * is highlighted.
 *
 * Renders the tabs (with any `tools`, such as the copy icon, at the end of
 * the same row), then `between` (a poem's title sits here), then one panel;
 * the caller decides what each panel holds.
 */
export default function LangTabs({
  value,
  onChange,
  children,
  tools = null,
  between = null,
  label = 'Language',
}) {
  const id = useId()
  const panelId = `${id}-panel`

  return (
    <>
      <div className="card-tools">
        <div className="lang-toggle" role="tablist" aria-label={label}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${id}-${t.key}`}
              aria-selected={value === t.key}
              aria-controls={panelId}
              tabIndex={value === t.key ? 0 : -1}
              className={`lang-toggle__btn${value === t.key ? ' is-on' : ''}`}
              onClick={() => onChange(t.key)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  onChange(value === 'en' ? 'ur' : 'en')
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tools}
      </div>
      {between}
      <div role="tabpanel" id={panelId} aria-labelledby={`${id}-${value}`}>
        {children}
      </div>
    </>
  )
}
