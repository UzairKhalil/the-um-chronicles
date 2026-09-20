// Hand-drawn marks. No emoji anywhere in this app — emoji render as somebody
// else's artwork and break the typography.

const PATHS = {
  heart:
    'M12 20.5s-8-5.2-8-10.7A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8 2.6c0 5.5-8 10.7-8 10.7Z',
  rose:
    'M12 21v-6M12 15c-2.4 0-4.2-1.8-4.2-4 0-2.5 1.9-4.6 4.2-6 2.3 1.4 4.2 3.5 4.2 6 0 2.2-1.8 4-4.2 4ZM12 15c0-2 .9-3.6 2.2-4.6M12 18c-1.9 0-3.4-.9-4.2-2.3',
  spark:
    'M12 3v5.2M12 15.8V21M3 12h5.2M15.8 12H21M6.3 6.3l3.1 3.1M14.6 14.6l3.1 3.1M17.7 6.3l-3.1 3.1M9.4 14.6l-3.1 3.1',
  moon: 'M20 14.4A8.4 8.4 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z',
  quill:
    'M4 20c6-1 10-4 13-9 1.6-2.7 2-5 2-5s-2.6.3-5.4 1.8C8.6 10.3 6 14 4 20ZM4 20l5-5',
  arrow: 'M15 5l-7 7 7 7',
}

export default function Glyph({ name, size = 20, className = '', strokeWidth = 1.5 }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      className={`glyph glyph--${name} ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  )
}

export const REACTIONS = [
  { key: 'heart', label: 'Heart' },
  { key: 'rose', label: 'Rose' },
  { key: 'spark', label: 'Spark' },
]
