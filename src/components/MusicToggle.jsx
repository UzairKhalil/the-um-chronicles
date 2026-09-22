import Glyph from './Glyph.jsx'

/**
 * The music control in the bottom-right corner, on every screen once someone
 * is signed in:  [ − ]  [ ♪ ]  [ + ]  with the level marked underneath.
 *
 *   ♪  mutes or unmutes
 *   −  softer    (stops at the quietest level)
 *   +  louder    (stops at the loudest; also brings the music back if muted)
 */
export default function MusicToggle({ on, level, levels, onToggle, onSofter, onLouder }) {
  const label = on ? 'Mute the music' : 'Play the music'
  return (
    <div
      className={`music-control${on ? ' is-on' : ''}`}
      role="group"
      aria-label={`Music, volume ${level} of ${levels}`}
    >
      <div className="music-control__row">
        <button
          type="button"
          className="music-control__step"
          onClick={onSofter}
          disabled={level <= 1}
          aria-label="Softer"
          title="Softer"
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          className="music-toggle"
          onClick={onToggle}
          aria-pressed={on}
          aria-label={label}
          title={label}
        >
          <Glyph name={on ? 'music' : 'musicOff'} size={18} />
        </button>
        <button
          type="button"
          className="music-control__step"
          onClick={onLouder}
          disabled={level >= levels}
          aria-label="Louder"
          title="Louder"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <div className="music-control__level" aria-hidden="true">
        {Array.from({ length: levels }, (_, i) => (
          <span key={i} className={`music-control__tick${i < level ? ' is-lit' : ''}`} />
        ))}
      </div>
    </div>
  )
}
