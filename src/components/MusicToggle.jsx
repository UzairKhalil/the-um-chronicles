import Glyph from './Glyph.jsx'

/**
 * The small round button in the bottom-right corner: mute or unmute the
 * background music. Shown on every screen once someone is signed in.
 */
export default function MusicToggle({ on, onToggle }) {
  const label = on ? 'Mute the music' : 'Play the music'
  return (
    <button
      type="button"
      className={`music-toggle${on ? ' is-on' : ''}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
      title={label}
    >
      <Glyph name={on ? 'music' : 'musicOff'} size={18} />
    </button>
  )
}
