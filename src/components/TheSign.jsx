import { useId } from 'react'

// The Sign: a heart split down the middle, with an infinity ribbon woven
// behind it. The left half belongs to one of us, the right half to the other.
// A half stays faint until its person has signed today; when both halves are
// lit the whole thing blooms.
//
// Drawn, not typed — no emoji anywhere. The feTurbulence displacement gives
// the strokes a slight pencil wobble so they do not read as clip-art.

const LEFT =
  'M100 44 C 94 29 80 18 62 18 C 39 18 15 36 15 66 C 15 106 60 141 100 171'
const RIGHT =
  'M100 44 C 106 29 120 18 138 18 C 161 18 185 36 185 66 C 185 106 140 141 100 171'
const RIBBON =
  'M100 96 C 78 68 36 70 30 96 C 24 122 78 124 100 96 C 122 68 176 70 170 96 C 164 122 122 124 100 96 Z'

const SPARKS = [
  [100, 12], [46, 30], [154, 30], [18, 80], [182, 80],
  [36, 132], [164, 132], [100, 182], [70, 156], [130, 156],
]

export default function TheSign({
  leftSigned = false,
  rightSigned = false,
  bloomed = false,
  pending = false,
  onSign,
  disabled = false,
  label = 'Touch to sign',
}) {
  const uid = useId().replace(/:/g, '')
  const rough = `rough-${uid}`
  const glow = `glow-${uid}`
  const gradL = `gl-${uid}`
  const gradR = `gr-${uid}`

  const classes = [
    'sign',
    bloomed && 'sign--bloomed',
    pending && 'sign--pending',
    disabled && 'sign--done',
  ]
    .filter(Boolean)
    .join(' ')

  const Wrapper = onSign && !disabled ? 'button' : 'div'
  const wrapperProps =
    onSign && !disabled
      ? { type: 'button', onClick: onSign, 'aria-label': label, className: classes }
      : { className: classes, role: 'img', 'aria-label': label }

  return (
    <Wrapper {...wrapperProps}>
      <svg
        className="sign__svg"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* A little wobble, so the lines look drawn by a hand. */}
          <filter id={rough} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id={glow} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="5.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id={gradL} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0C9C2" />
            <stop offset="100%" stopColor="#C4736E" />
          </linearGradient>
          <linearGradient id={gradR} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5DCAE" />
            <stop offset="100%" stopColor="#B58C4A" />
          </linearGradient>
        </defs>

        {/* the ribbon behind */}
        <path
          className="sign__ribbon"
          d={RIBBON}
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          filter={`url(#${rough})`}
        />

        {/* the two faint halves, always present */}
        <g filter={`url(#${rough})`}>
          <path className="sign__ghost" d={LEFT} strokeWidth="3" strokeLinecap="round" />
          <path className="sign__ghost" d={RIGHT} strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* the lit halves */}
        <g filter={`url(#${rough})`}>
          <path
            className={`sign__half sign__half--left${leftSigned ? ' is-signed' : ''}`}
            d={LEFT}
            stroke={`url(#${gradL})`}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            className={`sign__half sign__half--right${rightSigned ? ' is-signed' : ''}`}
            d={RIGHT}
            stroke={`url(#${gradR})`}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </g>

        {/* the bloom */}
        <g className="sign__bloom" filter={`url(#${glow})`}>
          <path d={LEFT} stroke={`url(#${gradL})`} strokeWidth="3.4" strokeLinecap="round" />
          <path d={RIGHT} stroke={`url(#${gradR})`} strokeWidth="3.4" strokeLinecap="round" />
        </g>

        <g className="sign__sparks">
          {SPARKS.map(([cx, cy], i) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="1.9"
              style={{ '--i': i }}
            />
          ))}
        </g>
      </svg>
    </Wrapper>
  )
}
