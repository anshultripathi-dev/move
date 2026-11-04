import { useMemo } from 'react'

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Deterministic, QR-styled matrix (visual stand-in for a real encoder). */
export function QRCode({ value, size = 120, fg = '#0b0f16', bg = '#f8fafc', className }: { value: string; size?: number; fg?: string; bg?: string; className?: string }) {
  const N = 25
  const cells = useMemo(() => {
    let s = hash(value) || 1
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
    const m: boolean[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => rnd() > 0.52))
    const finder = (ox: number, oy: number) => {
      for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
        const gx = ox + x, gy = oy + y
        if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue
        const edge = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        m[gy][gx] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (edge || core)
      }
    }
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7)
    return m
  }, [value])
  const cs = size / N
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ background: bg, borderRadius: 8, padding: 0 }} shapeRendering="crispEdges">
      <rect width={size} height={size} fill={bg} />
      {cells.map((row, y) => row.map((on, x) => on ? <rect key={`${x}-${y}`} x={x * cs} y={y * cs} width={cs + 0.4} height={cs + 0.4} fill={fg} /> : null))}
    </svg>
  )
}
