import { useEffect, useMemo, useState } from 'react'
import { byId } from '../content/people.js'
import meta from '../content/meta.js'
import { useDbValue } from '../hooks/useDb.js'
import { formatStamp, timeAgo } from '../lib/day.js'
import { serverNow } from '../lib/db.js'
import { deleteComment } from '../lib/records.js'
import buildDeviceReport from '../lib/devicesReport.js'
import Pager from './Pager.jsx'

// ---------------------------------------------------------------------------
// Admin history. Reached ONLY by typing #history; there is no button to it
// anywhere in the app, and App.jsx renders the ordinary app for anyone whose
// seat is not the admin.
//
// Devices come FIRST: the owner cares most about them. The sign-ins table
// grows fastest, so it shows only the last few days (meta.history.signInDays)
// and is paged.
//
// Every table scrolls sideways inside its own box, with the first column
// pinned. The page itself never scrolls sideways — see overflow-x on html,
// body in global.css.
// ---------------------------------------------------------------------------

const cell = (v) => {
  if (v === true) return 'yes'
  if (v === false) return 'no'
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

const pair = (a, b) => [a, b].filter(Boolean).join(' ') || '—'

function flattenActivity(comments, reactions) {
  const rows = []

  for (const [itemId, entries] of Object.entries(comments || {})) {
    for (const [key, c] of Object.entries(entries || {})) {
      rows.push({
        rowKey: `c:${itemId}:${key}`,
        kind: 'comment',
        itemId,
        key,
        name: c?.name || '—',
        personId: c?.personId || '',
        what: c?.text || '',
        at: c?.at || 0,
        device: c?.device || null,
      })
    }
  }

  for (const [itemId, byPerson] of Object.entries(reactions || {})) {
    for (const [key, r] of Object.entries(byPerson || {})) {
      if (!r?.symbol) continue
      rows.push({
        rowKey: `r:${itemId}:${key}`,
        kind: 'reaction',
        itemId,
        key,
        name: r?.name || key,
        personId: key,
        what: r.symbol,
        at: r?.at || 0,
        device: r?.device || null,
      })
    }
  }

  return rows.sort((a, b) => b.at - a.at)
}

function Section({ title, note, empty, head, children, tools }) {
  return (
    <section className="hsec">
      <h2 className="hsec__title">{title}</h2>
      {note ? <p className="hsec__note tiny faint">{note}</p> : null}
      {tools}
      {empty ? (
        <p className="hsec__empty small faint">Nothing recorded yet.</p>
      ) : (
        <div className="hbox scroll-x">
          <table className="htable">
            <thead>
              <tr>
                {head.map((h, i) => (
                  <th key={h} className={i === 0 ? 'is-pinned' : undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function History({ onClose }) {
  const [comments] = useDbValue('comments')
  const [reactions] = useDbValue('reactions')
  const [signIns] = useDbValue('signIns')
  const [devices] = useDbValue('devices')
  const [filter, setFilter] = useState('')

  const days = meta.history?.signInDays ?? 3
  const [pageSize, setPageSize] = useState(meta.history?.pageSize ?? 10)
  const [page, setPage] = useState(1)

  const report = useMemo(
    () => buildDeviceReport({ devices, signIns, comments, reactions }),
    [devices, signIns, comments, reactions]
  )

  const activity = useMemo(() => flattenActivity(comments, reactions), [comments, reactions])

  // Only the last few days of sign-ins: the table grows fastest of all.
  const recentSignIns = useMemo(() => {
    const since = serverNow() - days * 24 * 60 * 60 * 1000
    return Object.entries(signIns || {})
      .map(([key, v]) => ({ key, ...(v || {}) }))
      .filter((r) => (r.at || 0) >= since)
      .sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [signIns, days])

  const olderCount = Object.keys(signIns || {}).length - recentSignIns.length

  const q = filter.trim().toLowerCase()
  const match = (...values) =>
    !q || values.some((v) => String(v ?? '').toLowerCase().includes(q))

  const shownDevices = report.filter((d) =>
    match(d.label, d.id, d.likelyModel, d.detail.model, d.detail.os, d.detail.browser, d.people.join(' '), d.kind)
  )
  const shownActivity = activity.filter((r) =>
    match(r.name, r.what, r.itemId, r.device?.model, r.device?.os, r.device?.id)
  )
  const shownSignIns = recentSignIns.filter((r) =>
    match(r.name, r.device?.model, r.device?.os, r.device?.browser, r.device?.id)
  )

  // A narrower filter can leave the current page past the end.
  useEffect(() => {
    setPage(1)
  }, [q, pageSize, days])

  const pages = Math.max(1, Math.ceil(shownSignIns.length / pageSize))
  const current = Math.min(page, pages)
  const pageOfSignIns = shownSignIns.slice((current - 1) * pageSize, current * pageSize)

  return (
    <div className="history">
      <div className="shell history__shell">
        <header className="history__head">
          <p className="eyebrow">Admin</p>
          <h1 className="history__title">History</h1>
          <div className="history__tools">
            <input
              className="input history__filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, device, text…"
              aria-label="Filter the history"
            />
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
          <p className="history__counts tiny faint">
            {report.length} devices · {activity.length} comments and reactions ·{' '}
            {recentSignIns.length} sign-ins in the last {days} days
          </p>
        </header>

        <Section
          title="Devices seen"
          note={
            'Everything known about each device, gathered from its sign-ins, comments and reactions as well as the devices table. ' +
            'A device id is a random value kept in that browser’s storage: clearing site data, or a private window, counts as a new device. ' +
            'Android reports its model; an iPhone never does, so the likely model is worked out from the screen size and pixel density and can only narrow it to a group. ' +
            'Actions counts everything that device has ever done, including sign-ins since trimmed away.'
          }
          empty={shownDevices.length === 0}
          head={[
            'Device', 'Kind', 'Used by', 'Last seen', 'First seen',
            'Sign-ins', 'Comments', 'Reactions', 'Actions',
            'Reported model', 'Likely model', 'System', 'Browser',
            'Screen', 'Real pixels', 'Density', 'Window', 'Orientation',
            'Touch', 'CPU', 'RAM GB', 'Network', 'Mbps', 'RTT', 'Data saver',
            'Language', 'Languages', 'Time zone', 'Platform', 'Device id', 'User agent',
          ]}
        >
          {shownDevices.map((d) => (
            <tr key={d.id}>
              <th scope="row" className="is-pinned">
                {d.label}
              </th>
              <td>{cell(d.kind)}</td>
              <td>{d.people.length ? d.people.join(', ') : '—'}</td>
              <td title={formatStamp(d.lastSeen)}>{d.lastSeen ? timeAgo(d.lastSeen) : '—'}</td>
              <td>{formatStamp(d.firstSeen)}</td>
              <td>{d.signIns}</td>
              <td>{d.comments}</td>
              <td>{d.reactions}</td>
              <td>{d.actions || '—'}</td>
              <td>{cell(d.detail.model)}</td>
              <td>{d.likelyModel ? `${d.likelyModel} (likely)` : '—'}</td>
              <td>{pair(d.detail.os, d.detail.osVersion)}</td>
              <td>{pair(d.detail.browser, d.detail.browserVersion)}</td>
              <td>{cell(d.detail.screen)}</td>
              <td>{cell(d.resolution)}</td>
              <td>{d.detail.dpr ? `${d.detail.dpr}×` : '—'}</td>
              <td>{cell(d.detail.window)}</td>
              <td>{cell(d.detail.orientation)}</td>
              <td>{cell(d.detail.touchPoints)}</td>
              <td>{cell(d.detail.cores)}</td>
              <td>{cell(d.detail.memoryGB)}</td>
              <td>{cell(d.detail.network)}</td>
              <td>{cell(d.detail.downlinkMbps)}</td>
              <td>{cell(d.detail.rttMs)}</td>
              <td>{cell(d.detail.saveData)}</td>
              <td>{cell(d.detail.language)}</td>
              <td>{cell(d.detail.languages)}</td>
              <td>{cell(d.detail.timeZone)}</td>
              <td>{cell(d.detail.platform)}</td>
              <td className="htable__id">{d.id}</td>
              <td className="htable__ua">{cell(d.detail.ua)}</td>
            </tr>
          ))}
        </Section>

        <Section
          title={`Sign-ins · last ${days} days`}
          note={
            `Codes are never recorded.` +
            (olderCount > 0
              ? olderCount === 1
                ? ' 1 older sign-in is stored but not listed; every device’s total is in the table above.'
                : ` ${olderCount} older sign-ins are stored but not listed; every device’s total is in the table above.`
              : '')
          }
          empty={shownSignIns.length === 0}
          tools={
            <Pager
              total={shownSignIns.length}
              page={current}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={setPageSize}
              label="sign-ins"
            />
          }
          head={[
            'Name', 'When', 'Device', 'System', 'Browser', 'Screen', 'Window',
            'Touch', 'CPU', 'RAM', 'Net', 'Language', 'Time zone', 'Device id',
          ]}
        >
          {pageOfSignIns.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="is-pinned">
                {r.name || byId(r.personId)?.name || '—'}
              </th>
              <td title={timeAgo(r.at)}>{formatStamp(r.at)}</td>
              <td>{cell(r.device?.model)}</td>
              <td>{pair(r.device?.os, r.device?.osVersion)}</td>
              <td>{pair(r.device?.browser, r.device?.browserVersion)}</td>
              <td>
                {cell(r.device?.screen)}
                {r.device?.dpr ? ` @${r.device.dpr}×` : ''}
              </td>
              <td>{cell(r.device?.window)}</td>
              <td>{cell(r.device?.touchPoints)}</td>
              <td>{cell(r.device?.cores)}</td>
              <td>{cell(r.device?.memoryGB)}</td>
              <td>{cell(r.device?.network)}</td>
              <td>{cell(r.device?.language)}</td>
              <td>{cell(r.device?.timeZone)}</td>
              <td className="htable__id">{cell(r.device?.id)}</td>
            </tr>
          ))}
        </Section>

        <Section
          title="Comments and reactions"
          empty={shownActivity.length === 0}
          head={[
            'Name', 'What', 'Item', 'When', 'Device', 'System', 'Browser',
            'Screen', 'Window', 'Net', 'Device id', '',
          ]}
        >
          {shownActivity.map((r) => (
            <tr key={r.rowKey}>
              <th scope="row" className="is-pinned">
                {r.name}
              </th>
              <td className="htable__what">
                {r.kind === 'reaction' ? <span className="tag">{r.what}</span> : r.what}
              </td>
              <td>{r.itemId}</td>
              <td title={timeAgo(r.at)}>{formatStamp(r.at)}</td>
              <td>{cell(r.device?.model)}</td>
              <td>{pair(r.device?.os, r.device?.osVersion)}</td>
              <td>{pair(r.device?.browser, r.device?.browserVersion)}</td>
              <td>
                {cell(r.device?.screen)}
                {r.device?.dpr ? ` @${r.device.dpr}×` : ''}
              </td>
              <td>{cell(r.device?.window)}</td>
              <td>{cell(r.device?.network)}</td>
              <td className="htable__id">{cell(r.device?.id)}</td>
              <td>
                {r.kind === 'comment' ? (
                  <button
                    type="button"
                    className="comment__del"
                    onClick={() => deleteComment(r.itemId, r.key)}
                    aria-label={`Delete the comment by ${r.name}`}
                  >
                    ×
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </Section>

        <footer className="history__foot small faint">
          <p>
            What a browser will tell us, and what it will not: Android Chrome
            reports a model; an iPhone only ever says “iPhone”, so its likely
            model above is inferred from screen size and density. No browser
            exposes the name the owner gave a device, and none exposes an IP
            address — reading one would mean calling a third-party service, so
            there is none here.
          </p>
          <button type="button" className="btn btn--wide" onClick={onClose}>
            Back to the app
          </button>
        </footer>
      </div>
    </div>
  )
}
