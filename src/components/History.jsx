import { useMemo, useState } from 'react'
import { useDbValue } from '../hooks/useDb.js'
import { deviceLabel } from '../lib/device.js'
import { formatStamp, timeAgo } from '../lib/day.js'
import { deleteComment } from '../lib/records.js'

// ---------------------------------------------------------------------------
// Admin history. Reached ONLY by typing #history; there is no button to it
// anywhere in the app, and App.jsx renders the ordinary app for anyone whose
// seat is not the admin.
//
// Every table scrolls sideways inside its own box, with the name column
// pinned. The page itself never scrolls sideways — see overflow-x on html,
// body in global.css.
// ---------------------------------------------------------------------------

const DEVICE_COLUMNS = [
  ['model', 'Model'],
  ['os', 'System'],
  ['osVersion', 'Version'],
  ['browser', 'Browser'],
  ['browserVersion', 'Br. ver'],
  ['screen', 'Screen'],
  ['dpr', 'Density'],
  ['window', 'Window'],
  ['orientation', 'Orientation'],
  ['touchPoints', 'Touch'],
  ['cores', 'CPU'],
  ['memoryGB', 'RAM GB'],
  ['network', 'Network'],
  ['downlinkMbps', 'Mbps'],
  ['rttMs', 'RTT'],
  ['saveData', 'Data saver'],
  ['language', 'Language'],
  ['timeZone', 'Time zone'],
  ['platform', 'Platform'],
  ['id', 'Device id'],
  ['ua', 'User agent'],
]

const cell = (v) => {
  if (v === true) return 'yes'
  if (v === false) return 'no'
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

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
    for (const [personId, r] of Object.entries(byPerson || {})) {
      if (!r?.symbol) continue
      rows.push({
        rowKey: `r:${itemId}:${personId}`,
        kind: 'reaction',
        itemId,
        key: personId,
        name: r?.name || personId,
        personId,
        what: r.symbol,
        at: r?.at || 0,
        device: r?.device || null,
      })
    }
  }

  return rows.sort((a, b) => b.at - a.at)
}

function Table({ caption, head, children, empty, note }) {
  return (
    <section className="hsec">
      <h2 className="hsec__title">{caption}</h2>
      {note ? <p className="hsec__note tiny faint">{note}</p> : null}
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

  const activity = useMemo(
    () => flattenActivity(comments, reactions),
    [comments, reactions]
  )

  const signInRows = useMemo(
    () =>
      Object.entries(signIns || {})
        .map(([key, v]) => ({ key, ...(v || {}) }))
        .sort((a, b) => (b.at || 0) - (a.at || 0)),
    [signIns]
  )

  const deviceRows = useMemo(
    () =>
      Object.entries(devices || {})
        .map(([key, v]) => ({ key, ...(v || {}) }))
        .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)),
    [devices]
  )

  const q = filter.trim().toLowerCase()
  const match = (s) => !q || String(s || '').toLowerCase().includes(q)

  const shownActivity = activity.filter(
    (r) => match(r.name) || match(r.what) || match(r.itemId) || match(deviceLabel(r.device))
  )
  const shownSignIns = signInRows.filter(
    (r) => match(r.name) || match(deviceLabel(r.device))
  )

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
              placeholder="Filter by name, text, device…"
              aria-label="Filter the history"
            />
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
          <p className="history__counts tiny faint">
            {activity.length} comments and reactions · {signInRows.length} sign-ins ·{' '}
            {deviceRows.length} devices
          </p>
        </header>

        <Table
          caption="Comments and reactions"
          head={['Name', 'What', 'Item', 'When', 'Device', 'System', 'Browser', 'Screen', 'Window', 'Net', 'Device id', '']}
          empty={shownActivity.length === 0}
        >
          {shownActivity.map((r) => (
            <tr key={r.rowKey}>
              <th scope="row" className="is-pinned">
                {r.name}
              </th>
              <td className="htable__what">
                {r.kind === 'reaction' ? (
                  <span className="tag">{r.what}</span>
                ) : (
                  r.what
                )}
              </td>
              <td>{r.itemId}</td>
              <td title={timeAgo(r.at)}>{formatStamp(r.at)}</td>
              <td>{cell(r.device?.model)}</td>
              <td>{[r.device?.os, r.device?.osVersion].filter(Boolean).join(' ') || '—'}</td>
              <td>
                {[r.device?.browser, r.device?.browserVersion].filter(Boolean).join(' ') || '—'}
              </td>
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
        </Table>

        <Table
          caption="Sign-ins"
          head={['Name', 'When', 'Device', 'System', 'Browser', 'Screen', 'Window', 'Touch', 'CPU', 'RAM', 'Net', 'Language', 'Time zone', 'Device id']}
          empty={shownSignIns.length === 0}
          note="Codes are never recorded."
        >
          {shownSignIns.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="is-pinned">
                {r.name || '—'}
              </th>
              <td title={timeAgo(r.at)}>{formatStamp(r.at)}</td>
              <td>{cell(r.device?.model)}</td>
              <td>{[r.device?.os, r.device?.osVersion].filter(Boolean).join(' ') || '—'}</td>
              <td>
                {[r.device?.browser, r.device?.browserVersion].filter(Boolean).join(' ') || '—'}
              </td>
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
        </Table>

        <Table
          caption="Devices seen"
          head={['Last used by', 'First seen', 'Last seen', 'Visits', ...DEVICE_COLUMNS.map(([, l]) => l)]}
          empty={deviceRows.length === 0}
          note="A device id is a random value kept in that browser's storage. Clearing site data mints a new one."
        >
          {deviceRows.map((d) => (
            <tr key={d.key}>
              <th scope="row" className="is-pinned">
                {d.lastPersonId || '—'}
              </th>
              <td>{formatStamp(d.firstAt)}</td>
              <td title={timeAgo(d.lastAt)}>{formatStamp(d.lastAt)}</td>
              <td>{cell(d.visits)}</td>
              {DEVICE_COLUMNS.map(([k]) => (
                <td key={k} className={k === 'ua' ? 'htable__ua' : undefined}>
                  {cell(d[k])}
                </td>
              ))}
            </tr>
          ))}
        </Table>

        <footer className="history__foot small faint">
          <p>
            What a browser will tell us, and what it will not: Android Chrome
            reports a model; an iPhone only ever says “iPhone”. No browser
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
